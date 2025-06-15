import { useState, useEffect } from 'react'
import { TokenUsage, TimeRange } from './types'
import { loadUsages, saveUsages, filterUsagesByDateRange, calculateStats } from './utils'
import { loadProjectAliases, getProjectDisplayName } from './utils/projectAliases'
import Dashboard from './components/Dashboard'
import DataImportExport from './components/DataImportExport'
import ProjectAliasEditor from './components/ProjectAliasEditor'

function App() {
  const [usages, setUsages] = useState<TokenUsage[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [projectAliases, setProjectAliases] = useState<{[key: string]: string}>({})
  const [showAliasEditor, setShowAliasEditor] = useState(false)

  // データの読み込み
  useEffect(() => {
    const loadData = async () => {
      // プロジェクトエイリアスを読み込み
      try {
        const aliases = await loadProjectAliases()
        setProjectAliases(aliases)
      } catch (error) {
        console.warn('Failed to load project aliases:', error)
      }

      // ローカルストレージからデータを読み込み
      const loadedUsages = loadUsages()
      setUsages(loadedUsages)
      
      // サーバーから最新データを取得
      try {
        const response = await fetch('http://localhost:3001/api/messages')
        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.length > 0) {
            console.log(`Loaded ${data.data.length} messages from server`)
            
            // サーバーデータをTokenUsage形式に変換
            const serverUsages = data.data.map((item: any, index: number) => ({
              id: `server-${item.session_id}-${index}`,
              timestamp: item.timestamp,
              projectId: item.session_id,
              model: item.model,
              inputTokens: item.input_tokens,
              outputTokens: item.output_tokens,
              totalTokens: item.input_tokens + item.output_tokens,
              endpoint: '/v1/messages',
              metadata: {
                ide: 'claude-code',
                sessionId: item.session_id,
                projectPath: item.cwd,
                cwd: item.cwd,
                cacheCreated: item.cache_creation_tokens,
                cacheRead: item.cache_read_tokens
              }
            }))
            
            // 重複を避けてマージ
            const existingIds = new Set(loadedUsages.map(u => u.id))
            const newUsages = serverUsages.filter((u: any) => !existingIds.has(u.id))
            
            if (newUsages.length > 0) {
              const mergedUsages = [...loadedUsages, ...newUsages]
              setUsages(mergedUsages)
              saveUsages(mergedUsages)
              console.log(`Added ${newUsages.length} new messages from server`)
            }
          }
        }
      } catch (error) {
        console.log('Server not available, using local data only:', (error as Error).message)
      }
    }
    
    loadData()
  }, [])

  // プロジェクト一覧を動的に生成（エイリアス対応・合算集計）
  const projects = (() => {
    const projectMap = new Map<string, {
      originalIds: string[],
      name: string,
      firstUsage?: TokenUsage
    }>()
    
    // UUIDごとにプロジェクトを処理
    const uniqueIds = Array.from(new Set(usages.map(u => u.projectId)))
    
    uniqueIds.forEach(id => {
      const relatedUsage = usages.find(u => u.projectId === id)
      const projectPath = relatedUsage?.metadata?.cwd || relatedUsage?.metadata?.projectPath || ''
      const displayName = getProjectDisplayName(id, projectAliases, projectPath)
      
      if (projectMap.has(displayName)) {
        // 同じ表示名が既に存在する場合は、UUIDを追加
        const existing = projectMap.get(displayName)!
        existing.originalIds.push(id)
      } else {
        // 新しい表示名の場合は、新規作成
        projectMap.set(displayName, {
          originalIds: [id],
          name: displayName,
          firstUsage: relatedUsage
        })
      }
    })
    
    // プロジェクト配列を生成
    return Array.from(projectMap.entries()).map(([displayName, projectInfo]) => ({
      id: projectInfo.originalIds.join(','), // 複数UUIDはカンマ区切りで結合
      name: displayName,
      originalIds: projectInfo.originalIds, // 元のUUID一覧を保持
      monthlyLimit: 0,
      alertThreshold: 0,
      createdAt: new Date().toISOString()
    }))
  })()

  // フィルタリングされた使用量データ（合算集計対応）
  const filteredUsages = filterUsagesByDateRange(
    selectedProject === 'all'
      ? usages
      : (() => {
          // 選択されたプロジェクトの元のUUID一覧を取得
          const selectedProjectInfo = projects.find(p => p.id === selectedProject)
          if (selectedProjectInfo?.originalIds) {
            return usages.filter(u => selectedProjectInfo.originalIds!.includes(u.projectId))
          } else {
            // 従来の単一UUID形式の場合
            return usages.filter(u => u.projectId === selectedProject)
          }
        })(),
    timeRange
  )

  // 統計情報の計算
  const stats = calculateStats(filteredUsages)


  // サーバーデータの再スキャン
  const rescanServerData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rescan', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`${result.count}件のメッセージを処理しました`)
        
        // データを再読み込み
        const dataResponse = await fetch('http://localhost:3001/api/messages')
        if (dataResponse.ok) {
          const data = await dataResponse.json()
          if (data.data) {
            const serverUsages = data.data.map((item: any, index: number) => ({
              id: `server-${item.session_id}-${index}`,
              timestamp: item.timestamp,
              projectId: item.session_id,
              model: item.model,
              inputTokens: item.input_tokens,
              outputTokens: item.output_tokens,
              totalTokens: item.input_tokens + item.output_tokens,
              endpoint: '/v1/messages',
              metadata: {
                ide: 'claude-code',
                sessionId: item.session_id,
                projectPath: item.cwd,
                cwd: item.cwd,
                cacheCreated: item.cache_creation_tokens,
                cacheRead: item.cache_read_tokens
              }
            }))
            
            setUsages(serverUsages)
            saveUsages(serverUsages)
          }
        }
      } else {
        const error = await response.json()
        alert('再スキャンに失敗しました: ' + error.error)
      }
    } catch (error) {
      alert('サーバーに接続できません: ' + (error as Error).message)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Claude Code Token Visualizer</h1>
        <p style={{ color: '#666', margin: '10px 0' }}>
          Claude Code プロジェクトのトークン使用量を可視化
        </p>
      </div>

      <DataImportExport />

      <Dashboard
        projects={projects}
        usages={filteredUsages}
        stats={stats}
        selectedProject={selectedProject}
        timeRange={timeRange}
        onProjectChange={setSelectedProject}
        onTimeRangeChange={setTimeRange}
        onRescan={rescanServerData}
        onOpenAliasEditor={() => setShowAliasEditor(true)}
      />

      {showAliasEditor && (
        <ProjectAliasEditor
          usages={usages}
          onClose={() => setShowAliasEditor(false)}
          onAliasesUpdated={(newAliases) => {
            setProjectAliases(newAliases)
            setShowAliasEditor(false)
          }}
        />
      )}
    </div>
  )
}

export default App
