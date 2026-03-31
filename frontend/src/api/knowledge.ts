import { get, post, put, del } from './request';
import type { KnowledgeDoc } from '@/types';
import type { PaginatedResponse } from '@/types';

/** 获取文档列表 */
export const getKnowledgeDocs = (params?: { category?: string; page?: number; pageSize?: number }) =>
  get<PaginatedResponse<KnowledgeDoc>>('/knowledge', params as Record<string, unknown>);

/** 搜索文档 */
export const searchKnowledge = (q: string) => get<KnowledgeDoc[]>('/knowledge/search', { q });

/** 获取文档详情 */
export const getKnowledgeDoc = (id: string) => get<KnowledgeDoc>(`/knowledge/${id}`);

/** 创建文档（管理员） */
export const createKnowledgeDoc = (data: { title: string; content: string; category: string }) =>
  post<KnowledgeDoc>('/knowledge', data);

/** 更新文档（管理员） */
export const updateKnowledgeDoc = (id: string, data: { title: string; content: string; category: string }) =>
  put<KnowledgeDoc>(`/knowledge/${id}`, data);

/** 删除文档（管理员） */
export const deleteKnowledgeDoc = (id: string) => del<null>(`/knowledge/${id}`);

/** 知识库问答 */
export interface QAResult {
  answer: string;
  sources: { id: string; title: string; category: string }[];
  mode: 'llm' | 'fallback';
  note?: string;
}

export const askKnowledge = (question: string) =>
  post<QAResult>('/knowledge/qa', { question });

export interface QAStreamHandlers {
  onStart?: (payload: { message?: string }) => void;
  onToken?: (delta: string) => void;
  onDone?: (result: QAResult) => void;
  onError?: (message: string) => void;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** 知识库问答（SSE 流式） */
export async function askKnowledgeStream(
  question: string,
  handlers: QAStreamHandlers = {},
  options: { signal?: AbortSignal } = {},
): Promise<QAResult> {
  const { signal } = options;
  const fallbackToNormal = async () => {
    const result = await askKnowledge(question);
    handlers.onDone?.(result);
    return result;
  };

  const token = localStorage.getItem('token');
  let resp: Response;
  try {
    resp = await fetch('/api/knowledge/qa/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) {
      throw err;
    }
    // 网络抖动或 stream 连接失败时，自动降级到普通问答
    return fallbackToNormal();
  }

  if (!resp.ok) {
    let message = '';
    try {
      const err = await resp.json() as { message?: string };
      if (err.message) message = err.message;
    } catch {
      // ignore json parse error
    }

    // 认证/参数类错误直接抛出
    if (resp.status === 400 || resp.status === 401 || resp.status === 403) {
      throw new Error(message || '问答请求失败');
    }

    // 其余错误尝试降级到普通问答（兼容旧后端未实现 stream 的场景）
    try {
      return await fallbackToNormal();
    } catch {
      throw new Error(message || '问答服务暂时不可用');
    }
  }

  if (!resp.body) {
    return fallbackToNormal();
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalResult: QAResult | null = null;
  let streamError: string | null = null;
  let hasToken = false;

  const parseEventBlock = (block: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const rawLine of block.split('\n')) {
      const line = rawLine.trimEnd();
      if (!line || line.startsWith(':')) continue;

      const sep = line.indexOf(':');
      const field = sep === -1 ? line : line.slice(0, sep);
      let value = sep === -1 ? '' : line.slice(sep + 1);
      if (value.startsWith(' ')) value = value.slice(1);

      if (field === 'event') {
        event = value.trim();
      } else if (field === 'data') {
        dataLines.push(value);
      }
    }
    const data = dataLines.join('\n');
    if (!data) return;

    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    if (event === 'start') {
      handlers.onStart?.((payload as { message?: string }));
      return;
    }
    if (event === 'token') {
      const delta = (payload as { delta?: string }).delta ?? '';
      if (delta) hasToken = true;
      handlers.onToken?.(delta);
      return;
    }
    if (event === 'error') {
      streamError = (payload as { message?: string }).message ?? '问答流中断';
      handlers.onError?.(streamError);
      return;
    }
    if (event === 'done') {
      finalResult = payload as QAResult;
      handlers.onDone?.(finalResult);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      let sepIndex = buffer.indexOf('\n\n');
      while (sepIndex !== -1) {
        const block = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        parseEventBlock(block);
        sepIndex = buffer.indexOf('\n\n');
      }
    }
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) {
      throw err;
    }
    if (!hasToken) {
      return fallbackToNormal();
    }
    throw new Error('问答流中断');
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }

  buffer += decoder.decode().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (buffer.trim()) parseEventBlock(buffer);

  if (streamError) {
    if (!hasToken) {
      return fallbackToNormal();
    }
    throw new Error(streamError);
  }
  if (!finalResult) {
    return fallbackToNormal();
  }
  return finalResult;
}
