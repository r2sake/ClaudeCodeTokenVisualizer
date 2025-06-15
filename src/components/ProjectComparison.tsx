import React from 'react'
import { TokenUsage, Project, UsageStats } from '../types'
import { formatNumber } from '../utils'
import { BarChart, Activity, TrendingUp, TrendingDown, Database, Zap } from 'lucide-react'

interface ProjectStats extends UsageStats {
  project: Project
}

interface ProjectComparisonProps {
  projects: Project[]
  usages: TokenUsage[]
}

const ProjectComparison: React.FC<ProjectComparisonProps> = ({ projects, usages }) => {
  // プロジェクト別統計を計算
  const projectStats: ProjectStats[] = projects.map(project => {
    // 該当プロジェクトの使用量データを取得
    const projectUsages = project.originalIds 
      ? usages.filter(u => project.originalIds!.includes(u.projectId))
      : usages.filter(u => u.projectId === project.id.split(',')[0])

    // 統計計算
    const stats = projectUsages.reduce(
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

    return {
      ...stats,
      project
    }
  }).filter(stat => stat.requestCount > 0) // データがあるプロジェクトのみ
    .sort((a, b) => b.totalTokens - a.totalTokens) // トークン数で降順ソート

  if (projectStats.length === 0) {
    return (
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>プロジェクト比較</h3>
        <p style={{ color: '#666', fontStyle: 'italic' }}>表示するデータがありません</p>
      </div>
    )
  }

  // 最大値を取得（パーセンテージ計算用）
  const maxTotalTokens = Math.max(...projectStats.map(s => s.totalTokens))

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart size={20} />
        プロジェクト比較 ({projectStats.length}プロジェクト)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {projectStats.map((stat, index) => (
          <div 
            key={stat.project.id}
            style={{
              padding: '16px',
              backgroundColor: index === 0 ? '#f0f8ff' : '#f8f9fa',
              borderRadius: '8px',
              border: index === 0 ? '2px solid #007bff' : '1px solid #e9ecef'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '16px' }}>
                  {index === 0 && '🏆 '}
                  {stat.project.name}
                </h4>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {formatNumber(stat.requestCount)} リクエスト
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {formatNumber(stat.totalTokens)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  総トークン
                </div>
              </div>
            </div>

            {/* プログレスバー */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                background: '#e5e5ea', 
                height: '6px', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(stat.totalTokens / maxTotalTokens * 100)}%`, 
                  height: '100%', 
                  background: index === 0 ? '#007bff' : '#6c757d',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* 詳細統計 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="#28a745" />
                <span style={{ color: '#666' }}>入力:</span>
                <span style={{ fontWeight: 'bold' }}>{formatNumber(stat.inputTokens)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingDown size={14} color="#dc3545" />
                <span style={{ color: '#666' }}>出力:</span>
                <span style={{ fontWeight: 'bold' }}>{formatNumber(stat.outputTokens)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="#6f42c1" />
                <span style={{ color: '#666' }}>キャッシュ作成:</span>
                <span style={{ fontWeight: 'bold' }}>{formatNumber(stat.cacheCreatedTokens)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#fd7e14" />
                <span style={{ color: '#666' }}>キャッシュ読取:</span>
                <span style={{ fontWeight: 'bold' }}>{formatNumber(stat.cacheReadTokens)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#20c997" />
                <span style={{ color: '#666' }}>平均/リクエスト:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatNumber(Math.round(stat.totalTokens / stat.requestCount))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* サマリー情報 */}
      {projectStats.length > 1 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#495057'
        }}>
          <strong>概要:</strong> 
          最もアクティブなプロジェクトは「{projectStats[0].project.name}」で、
          全体の{((projectStats[0].totalTokens / projectStats.reduce((sum, s) => sum + s.totalTokens, 0)) * 100).toFixed(1)}%のトークンを使用
        </div>
      )}
    </div>
  )
}

export default ProjectComparison