import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TokenUsage, Project } from '../types'
import { formatNumber } from '../utils'

interface ProjectChartProps {
  projects: Project[]
  usages: TokenUsage[]
}

const ProjectChart: React.FC<ProjectChartProps> = ({ projects, usages }) => {
  // プロジェクト別データを準備
  const chartData = projects.map(project => {
    // 該当プロジェクトの使用量データを取得
    const projectUsages = project.originalIds 
      ? usages.filter(u => project.originalIds!.includes(u.projectId))
      : usages.filter(u => u.projectId === project.id.split(',')[0])

    if (projectUsages.length === 0) return null

    // 統計計算
    const stats = projectUsages.reduce(
      (acc, usage) => ({
        totalTokens: acc.totalTokens + usage.totalTokens,
        inputTokens: acc.inputTokens + usage.inputTokens,
        outputTokens: acc.outputTokens + usage.outputTokens,
        cacheCreated: acc.cacheCreated + (usage.metadata?.cacheCreated || 0),
        cacheRead: acc.cacheRead + (usage.metadata?.cacheRead || 0),
        requestCount: acc.requestCount + 1,
      }),
      {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreated: 0,
        cacheRead: 0,
        requestCount: 0,
      }
    )

    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      fullName: project.name,
      inputTokens: stats.inputTokens,
      outputTokens: stats.outputTokens,
      totalTokens: stats.totalTokens,
      cacheCreated: stats.cacheCreated,
      cacheRead: stats.cacheRead,
      requestCount: stats.requestCount
    }
  }).filter(Boolean).sort((a, b) => (b?.totalTokens || 0) - (a?.totalTokens || 0))

  if (chartData.length === 0) {
    return null
  }

  // 円グラフ用の色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  // 円グラフ用データ
  const pieData = chartData.map((item, index) => ({
    name: item?.fullName || '',
    value: item?.totalTokens || 0,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>プロジェクト別チャート</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 棒グラフ */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>トークン使用量比較</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis tickFormatter={formatNumber} fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatNumber(value), name]}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d?.name === label)
                  return item?.fullName || label
                }}
              />
              <Bar dataKey="inputTokens" stackId="a" fill="#8884d8" name="入力トークン" />
              <Bar dataKey="outputTokens" stackId="a" fill="#82ca9d" name="出力トークン" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 円グラフ */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>総トークン分布</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  percent > 5 ? `${percent.toFixed(1)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'トークン']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {pieData.map((entry, index) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: entry.color, 
                borderRadius: '2px' 
              }} 
            />
            <span style={{ fontSize: '12px', color: '#666' }}>
              {entry.name} ({formatNumber(entry.value)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectChart