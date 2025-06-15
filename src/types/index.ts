export interface TokenUsage {
  id: string
  timestamp: string
  projectId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost?: number // MAXプランではオプショナル
  endpoint?: string
  metadata?: Record<string, any>
}

export interface Project {
  id: string
  name: string
  monthlyLimit: number
  alertThreshold: number
  createdAt: string
  originalIds?: string[] // 合算集計用の元UUID一覧
}

export interface UsageStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheCreatedTokens: number
  cacheReadTokens: number
  requestCount: number
  totalCost?: number // MAXプランではオプショナル
}

export type TimeRange = 'day' | 'week' | 'month' | 'year'

export interface ChartData {
  date: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost?: number // MAXプランではオプショナル
}
