interface ProjectAliases {
  [sessionId: string]: string;
}

interface AliasConfig {
  _comment?: string;
  _example?: ProjectAliases;
  aliases: ProjectAliases;
}

let cachedAliases: ProjectAliases | null = null;

/**
 * プロジェクトエイリアス設定を読み込み
 */
export async function loadProjectAliases(): Promise<ProjectAliases> {
  if (cachedAliases) {
    return cachedAliases;
  }

  try {
    const response = await fetch('/project-aliases.json');
    if (response.ok) {
      const config: AliasConfig = await response.json();
      cachedAliases = config.aliases || {};
      return cachedAliases;
    }
  } catch (error) {
    console.warn('Failed to load project aliases:', error);
  }

  cachedAliases = {};
  return cachedAliases;
}

/**
 * プロジェクトエイリアス設定を保存
 */
export async function saveProjectAliases(aliases: ProjectAliases): Promise<boolean> {
  try {
    // サーバーに保存リクエストを送信
    const response = await fetch('http://localhost:3001/api/aliases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aliases }),
    });

    if (response.ok) {
      cachedAliases = aliases;
      return true;
    }
  } catch (error) {
    console.error('Failed to save project aliases:', error);
  }
  return false;
}

/**
 * セッションIDから表示名を取得
 */
export function getProjectDisplayName(sessionId: string, aliases: ProjectAliases, fallbackPath?: string): string {
  // エイリアスが設定されている場合は優先
  if (aliases[sessionId]) {
    return aliases[sessionId];
  }

  // フォールバック: プロジェクトパスから推測
  if (fallbackPath) {
    const pathParts = fallbackPath.split('/').filter(part => part);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1];
    }
  }

  // 最後の手段: UUIDの短縮形
  return sessionId.substring(0, 8);
}

/**
 * セッションIDの短縮形を生成
 */
export function getShortSessionId(sessionId: string): string {
  return sessionId.substring(0, 8);
}

/**
 * プロジェクトパスから推測される名前を取得
 */
export function guessProjectNameFromPath(projectPath: string): string {
  if (!projectPath) return '';
  
  const cleanPath = projectPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const parts = cleanPath.split('/');
  
  // 最後のディレクトリ名を取得
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  
  return '';
}

/**
 * キャッシュをクリア
 */
export function clearAliasCache(): void {
  cachedAliases = null;
}