/** 知识库文档分类 */
export type DocCategory = 'standard_process' | 'material_manual' | 'case_study' | 'regulation';

/** 知识库文档 */
export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: DocCategory;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

/** 操作日志 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: import('./user').User;
}
