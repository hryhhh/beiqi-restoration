/** 统一分页请求参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 统一分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 统一 API 响应 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 统一错误响应 */
export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, string>;
}
