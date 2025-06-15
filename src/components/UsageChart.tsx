import React from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartData } from '../types'
import { formatNumber } from '../utils'

interface UsageChartProps {
  data: ChartData[]
}

const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  const [chartType, setChartType] = React.useState<'area' | 'line' | 'bar'>('area')

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e5ea'
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ fontSize: '0.75rem', color: entry.color, margin: '4px 0' }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
            <XAxis dataKey="date" stroke="#86868b" fontSize={12} />
            <YAxis stroke="#86868b" fontSize={12} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Area 
              type="monotone" 
              dataKey="inputTokens" 
              stackId="1"
              stroke="#007aff" 
              fill="#007aff" 
              fillOpacity={0.6}
              name="入力トークン"
            />
            <Area 
              type="monotone" 
              dataKey="outputTokens" 
              stackId="1"
              stroke="#34c759" 
              fill="#34c759" 
              fillOpacity={0.6}
              name="出力トークン"
            />
          </AreaChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
            <XAxis dataKey="date" stroke="#86868b" fontSize={12} />
            <YAxis stroke="#86868b" fontSize={12} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Line 
              type="monotone" 
              dataKey="totalTokens" 
              stroke="#007aff" 
              strokeWidth={2}
              dot={{ fill: '#007aff', r: 4 }}
              name="総トークン"
            />
            <Line 
              type="monotone" 
              dataKey="inputTokens" 
              stroke="#5856d6" 
              strokeWidth={2}
              dot={{ fill: '#5856d6', r: 4 }}
              name="入力トークン"
            />
            <Line 
              type="monotone" 
              dataKey="outputTokens" 
              stroke="#34c759" 
              strokeWidth={2}
              dot={{ fill: '#34c759', r: 4 }}
              name="出力トークン"
            />
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
            <XAxis dataKey="date" stroke="#86868b" fontSize={12} />
            <YAxis stroke="#86868b" fontSize={12} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Bar dataKey="inputTokens" fill="#007aff" name="入力トークン" />
            <Bar dataKey="outputTokens" fill="#34c759" name="出力トークン" />
          </BarChart>
        )
    }
  }

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>使用量推移</h2>
        <div className="tabs">
          <button 
            className={`tab ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            エリア
          </button>
          <button 
            className={`tab ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            ライン
          </button>
          <button 
            className={`tab ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            バー
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default UsageChart
