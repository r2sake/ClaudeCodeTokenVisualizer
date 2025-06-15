import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  trend?: string
  percentage?: number
  alert?: boolean
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  subValue,
  trend,
  percentage,
  alert,
}) => {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ color: '#007aff' }}>{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {subValue && (
        <div style={{ fontSize: '0.875rem', color: '#86868b', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
      {trend && (
        <div style={{ marginTop: '8px' }}>
          {alert ? (
            <span className="warning">
              <AlertTriangle size={14} />
              {trend}
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem', color: '#86868b' }}>{trend}</span>
          )}
        </div>
      )}
      {percentage !== undefined && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            background: '#e5e5ea', 
            height: '4px', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${percentage}%`, 
              height: '100%', 
              background: '#007aff',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#86868b', 
            marginTop: '4px' 
          }}>
            {percentage.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsCard
