import { useState, useEffect } from 'react'
import { Save, X, Plus, Trash2 } from 'lucide-react'
import { loadProjectAliases, saveProjectAliases, getShortSessionId, guessProjectNameFromPath } from '../utils/projectAliases'

interface ProjectAliasEditorProps {
  usages: any[]
  onClose: () => void
  onAliasesUpdated: (aliases: {[key: string]: string}) => void
}

const ProjectAliasEditor: React.FC<ProjectAliasEditorProps> = ({ usages, onClose, onAliasesUpdated }) => {
  const [aliases, setAliases] = useState<{[key: string]: string}>({})
  const [newAlias, setNewAlias] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [saving, setSaving] = useState(false)

  // 利用可能なセッションIDを取得
  const availableSessionIds = Array.from(new Set(usages.map(u => u.projectId)))

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedAliases = await loadProjectAliases()
        setAliases(loadedAliases)
      } catch (error) {
        console.error('Failed to load aliases:', error)
      }
    }
    loadData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await saveProjectAliases(aliases)
      if (success) {
        onAliasesUpdated(aliases)
        alert('エイリアスを保存しました')
      } else {
        alert('保存に失敗しました')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('保存中にエラーが発生しました')
    }
    setSaving(false)
  }

  const handleAddAlias = () => {
    if (selectedSessionId && newAlias.trim()) {
      setAliases(prev => ({
        ...prev,
        [selectedSessionId]: newAlias.trim()
      }))
      setNewAlias('')
      setSelectedSessionId('')
    }
  }

  const handleUpdateAlias = (sessionId: string, value: string) => {
    setAliases(prev => ({
      ...prev,
      [sessionId]: value
    }))
  }

  const handleDeleteAlias = (sessionId: string) => {
    setAliases(prev => {
      const newAliases = { ...prev }
      delete newAliases[sessionId]
      return newAliases
    })
  }

  const getProjectInfo = (sessionId: string) => {
    const relatedUsage = usages.find(u => u.projectId === sessionId)
    const projectPath = relatedUsage?.metadata?.cwd || relatedUsage?.metadata?.projectPath || ''
    const guessedName = guessProjectNameFromPath(projectPath)
    
    return {
      shortId: getShortSessionId(sessionId),
      projectPath,
      guessedName
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>プロジェクトエイリアス設定</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              複数のセッションに同じ名前を設定すると合算して表示されます
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#666" />
          </button>
        </div>

        {/* 新しいエイリアスを追加 */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>新しいエイリアスを追加</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
            >
              <option value="">プロジェクトを選択</option>
              {availableSessionIds
                .filter(id => !aliases[id])
                .map(sessionId => {
                  const info = getProjectInfo(sessionId)
                  return (
                    <option key={sessionId} value={sessionId}>
                      {info.shortId} - {info.guessedName || info.projectPath}
                    </option>
                  )
                })}
            </select>
            <input
              type="text"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              placeholder="表示名を入力"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
            />
            <button
              onClick={handleAddAlias}
              disabled={!selectedSessionId || !newAlias.trim()}
              className="button"
              style={{ background: '#007bff', padding: '8px 12px' }}
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        </div>

        {/* 既存のエイリアス一覧 */}
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
            設定済みエイリアス ({Object.keys(aliases).length}件)
          </h3>
          
          {Object.keys(aliases).length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              まだエイリアスが設定されていません
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(aliases).map(([sessionId, alias]) => {
                const info = getProjectInfo(sessionId)
                return (
                  <div key={sessionId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1, fontSize: '12px', color: '#666' }}>
                      <div><strong>ID:</strong> {info.shortId}</div>
                      <div><strong>Path:</strong> {info.projectPath}</div>
                    </div>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => handleUpdateAlias(sessionId, e.target.value)}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minWidth: '200px'
                      }}
                    />
                    <button
                      onClick={() => handleDeleteAlias(sessionId)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="button" style={{ background: '#6c757d' }}>
            キャンセル
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="button" 
            style={{ background: '#28a745' }}
          >
            <Save size={16} style={{ marginRight: '4px' }} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectAliasEditor