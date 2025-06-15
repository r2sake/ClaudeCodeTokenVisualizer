import React from 'react'
import { Download } from 'lucide-react'
import { loadUsages } from '../utils'

const DataImportExport: React.FC = () => {

  const exportData = () => {
    const usages = loadUsages()
    const dataStr = JSON.stringify(usages, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `claude-usage-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }


  const exportCSV = () => {
    const usages = loadUsages()
    
    // CSVヘッダー
    const headers = ['日時', 'プロジェクトID', 'モデル', '入力トークン', '出力トークン', '総トークン', 'コスト(USD)', 'エンドポイント']
    
    // CSVデータ
    const rows = usages.map(usage => [
      new Date(usage.timestamp).toLocaleString('ja-JP'),
      usage.projectId,
      usage.model,
      usage.inputTokens,
      usage.outputTokens,
      usage.totalTokens,
      usage.cost ? usage.cost.toFixed(4) : '0.0000',
      usage.endpoint || ''
    ])
    
    // BOM付きUTF-8でCSVを作成
    const BOM = '\uFEFF'
    const csvContent = BOM + [headers, ...rows].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `claude-usage-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <button 
        className="button" 
        onClick={exportData}
        style={{ background: '#34c759' }}
      >
        <Download size={16} style={{ display: 'inline-block', marginRight: '4px' }} />
        JSON エクスポート
      </button>
      
      <button 
        className="button" 
        onClick={exportCSV}
        style={{ background: '#5856d6' }}
      >
        <Download size={16} style={{ display: 'inline-block', marginRight: '4px' }} />
        CSV エクスポート
      </button>
    </div>
  )
}

export default DataImportExport
