import { TokenUsage, UsageStats, TimeRange, ChartData } from '../types'
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'

export const getDateRange = (timeRange: TimeRange) => {
  const now = new Date()
  let start: Date
  let end: Date

  switch (timeRange) {
    case 'day':
      start = startOfDay(now)
      end = endOfDay(now)
      break
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
      break
    case 'month':
      start = startOfMonth(now)
      end = endOfMonth(now)
      break
    case 'year':
      start = startOfYear(now)
      end = endOfYear(now)
      break
  }

  return { start, end }
}

export const calculateStats = (usages: TokenUsage[]): UsageStats => {
  return usages.reduce(
    (acc, usage) => ({
      totalTokens: acc.totalTokens + usage.totalTokens,
      inputTokens: acc.inputTokens + usage.inputTokens,
      outputTokens: acc.outputTokens + usage.outputTokens,
      cacheCreatedTokens: acc.cacheCreatedTokens + (usage.metadata?.cacheCreated || 0),
      cacheReadTokens: acc.cacheReadTokens + (usage.metadata?.cacheRead || 0),
      requestCount: acc.requestCount + 1,
    }),
    {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheCreatedTokens: 0,
      cacheReadTokens: 0,
      requestCount: 0,
    }
  )
}

export const filterUsagesByDateRange = (usages: TokenUsage[], timeRange: TimeRange): TokenUsage[] => {
  const { start, end } = getDateRange(timeRange)
  return usages.filter(usage => {
    const date = new Date(usage.timestamp)
    return date >= start && date <= end
  })
}

export const prepareChartData = (usages: TokenUsage[], timeRange: TimeRange): ChartData[] => {
  if (usages.length === 0) return []

  const { start, end } = getDateRange(timeRange)
  let intervals: Date[]
  let dateFormat: string

  switch (timeRange) {
    case 'day':
      intervals = eachDayOfInterval({ start, end })
      dateFormat = 'HH:mm'
      break
    case 'week':
      intervals = eachDayOfInterval({ start, end })
      dateFormat = 'MM/dd'
      break
    case 'month':
      intervals = eachDayOfInterval({ start, end })
      dateFormat = 'MM/dd'
      break
    case 'year':
      intervals = eachMonthOfInterval({ start, end })
      dateFormat = 'yyyy/MM'
      break
  }

  const groupedData = new Map<string, TokenUsage[]>()

  // グループ化
  usages.forEach(usage => {
    const date = new Date(usage.timestamp)
    const key = format(date, dateFormat)
    if (!groupedData.has(key)) {
      groupedData.set(key, [])
    }
    groupedData.get(key)!.push(usage)
  })

  // チャートデータの作成
  return intervals.map(interval => {
    const key = format(interval, dateFormat)
    const dayUsages = groupedData.get(key) || []
    const stats = calculateStats(dayUsages)

    return {
      date: key,
      inputTokens: stats.inputTokens,
      outputTokens: stats.outputTokens,
      totalTokens: stats.totalTokens,
    }
  })
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ja-JP').format(num)
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ローカルストレージのキー
const STORAGE_KEY = 'claude-code-token-visualizer-usages'

// データの保存と読み込み
export const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : defaultValue
}

export const loadUsages = (): TokenUsage[] => {
  return loadFromStorage(STORAGE_KEY, [])
}

export const saveUsages = (usages: TokenUsage[]): void => {
  saveToStorage(STORAGE_KEY, usages)
}
