import type { MuralRecord } from './mural';
import type { User } from './user';

/** 项目状态 */
export type ProjectStatus = 'pending' | 'in_progress' | 'completed';

/** 阶段状态 */
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';

/** 任务状态 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/** 修复方案状态 */
export type PlanStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

/** 审批结果 */
export type ReviewResult = 'approved' | 'rejected';

/** 任务附件 */
export interface TaskAttachment {
  id: string;
  taskId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

/** 修复任务 */
export interface RestTask {
  id: string;
  phaseId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignees?: User[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

/** 项目阶段 */
export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  order: number;
  status: PhaseStatus;
  tasks?: RestTask[];
  createdAt: string;
  updatedAt: string;
}

/** 材料消耗 */
export interface MaterialRecord {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  createdAt: string;
}

/** 修复项目 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  murals?: MuralRecord[];
  phases?: ProjectPhase[];
  materials?: MaterialRecord[];
  createdAt: string;
  updatedAt: string;
}

/** 方案状态变更 */
export interface PlanStatusChange {
  id: string;
  planId: string;
  fromStatus: PlanStatus;
  toStatus: PlanStatus;
  changedAt: string;
}

/** 方案审批 */
export interface PlanReview {
  id: string;
  planId: string;
  reviewerId: string;
  result: ReviewResult;
  comment?: string;
  createdAt: string;
}

/** 修复方案 */
export interface RestorationPlan {
  id: string;
  annotationId: string;
  method: string;
  materials: string;
  expectedResult?: string;
  status: PlanStatus;
  reviews?: PlanReview[];
  statusChanges?: PlanStatusChange[];
  createdAt: string;
  updatedAt: string;
}
