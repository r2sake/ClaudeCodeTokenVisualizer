import React from 'react'
import { TokenUsage, Project, TimeRange, UsageStats } from '../types'
import { prepareChartData, formatNumber } from '../utils'
import StatsCard from './StatsCard'
import UsageChart from './UsageChart'
import ProjectComparison from './ProjectComparison'
import ProjectChart from './ProjectChart'
import { TrendingUp, TrendingDown, Activity, BarChart, Database, Zap, RefreshCw, Settings } from 'lucide-react'

interface DashboardProps {
  projects: Project[]
  usages: TokenUsage[]
  stats: UsageStats
  selectedProject: string
  timeRange: TimeRange
  onProjectChange: (projectId: string) => void
  onTimeRangeChange: (range: TimeRange) => void
  onRescan?: () => void
  onOpenAliasEditor?: () => void
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  usages,
  stats,
  selectedProject,
  timeRange,
  onProjectChange,
  onTimeRangeChange,
  onRescan,
  onOpenAliasEditor,
}) => {
  const chartData = prepareChartData(usages, timeRange)

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: '4px', display: 'block' }}>
                プロジェクト
              </label>
              <select
                className="input"
                style={{ width: '200px' }}
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
              >
                <option value="all">すべてのプロジェクト</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', color: '#86868b', marginBottom: '4px', display: 'block' }}>
                期間
              </label>
              <select
                className="input"
                style={{ width: '150px' }}
                value={timeRange}
                onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
              >
                <option value="day">今日</option>
                <option value="week">今週</option>
                <option value="month">今月</option>
                <option value="year">今年</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onOpenAliasEditor && (
              <button 
                className="button" 
                onClick={onOpenAliasEditor}
                style={{ background: '#6c757d', padding: '8px 12px', fontSize: '14px' }}
                title="プロジェクト名を設定"
              >
                <Settings size={16} style={{ marginRight: '4px' }} />
                プロジェクト名設定
              </button>
            )}
            {onRescan && (
              <button 
                className="button" 
                onClick={onRescan}
                style={{ background: '#007bff', padding: '8px 12px', fontSize: '14px' }}
                title="最新データを取得"
              >
                <RefreshCw size={16} style={{ marginRight: '4px' }} />
                再スキャン
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard
          icon={<BarChart size={20} />}
          label="総トークン数"
          value={formatNumber(stats.totalTokens)}
          subValue={`${formatNumber(stats.requestCount)} リクエスト`}
        />
        <StatsCard
          icon={<Activity size={20} />}
          label="平均トークン/リクエスト"
          value={formatNumber(stats.requestCount > 0 ? Math.round(stats.totalTokens / stats.requestCount) : 0)}
        />
        <StatsCard
          icon={<TrendingUp size={20} />}
          label="入力トークン"
          value={formatNumber(stats.inputTokens)}
          percentage={(stats.inputTokens / stats.totalTokens * 100) || 0}
        />
        <StatsCard
          icon={<TrendingDown size={20} />}
          label="出力トークン"
          value={formatNumber(stats.outputTokens)}
          percentage={(stats.outputTokens / stats.totalTokens * 100) || 0}
        />
        <StatsCard
          icon={<Database size={20} />}
          label="キャッシュ作成"
          value={formatNumber(stats.cacheCreatedTokens)}
          subValue="新規キャッシュ"
        />
        <StatsCard
          icon={<Zap size={20} />}
          label="キャッシュ読取"
          value={formatNumber(stats.cacheReadTokens)}
          subValue="既存キャッシュ"
        />
      </div>

      <UsageChart data={chartData} />

      {selectedProject === 'all' && projects.length > 1 && (
        <>
          <ProjectComparison projects={projects} usages={usages} />
          <ProjectChart projects={projects} usages={usages} />
        </>
      )}
    </>
  )
}

export default Dashboard
