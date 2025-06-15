const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { glob } = require('glob');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// SQLiteデータベースファイルのパス
const DB_PATH = path.join(__dirname, '..', 'claude_projects.db');

// プロジェクトエイリアス設定ファイルのパス
const ALIASES_PATH = path.join(__dirname, '..', 'project-aliases.json');

// データベースの初期化
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.serialize(() => {
      // テーブル作成
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          project_path TEXT,
          first_message TEXT,
          last_message TEXT,
          total_messages INTEGER DEFAULT 0,
          total_input_tokens INTEGER DEFAULT 0,
          total_output_tokens INTEGER DEFAULT 0,
          total_cache_created_tokens INTEGER DEFAULT 0,
          total_cache_read_tokens INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          timestamp TEXT,
          model TEXT,
          input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0,
          cache_creation_tokens INTEGER DEFAULT 0,
          cache_read_tokens INTEGER DEFAULT 0,
          request_id TEXT,
          message_id TEXT,
          role TEXT,
          cwd TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS models (
          model_name TEXT PRIMARY KEY,
          total_messages INTEGER DEFAULT 0,
          total_input_tokens INTEGER DEFAULT 0,
          total_output_tokens INTEGER DEFAULT 0,
          total_cache_created_tokens INTEGER DEFAULT 0,
          total_cache_read_tokens INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // インデックス作成
      db.run('CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');
      db.run('CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model)');
    });
    
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Claude Projectsディレクトリからデータを読み込み
async function scanClaudeProjects() {
  const claudeProjectsPath = path.join(require('os').homedir(), '.claude', 'projects');
  
  if (!fs.existsSync(claudeProjectsPath)) {
    console.log('Claude projects directory not found:', claudeProjectsPath);
    return [];
  }
  
  try {
    const jsonlFiles = await glob('**/*.jsonl', { cwd: claudeProjectsPath });
    console.log(`Found ${jsonlFiles.length} JSONL files`);
    
    const allData = [];
    
    for (const file of jsonlFiles) {
      const filePath = path.join(claudeProjectsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // プロジェクトパスをファイルパスから抽出
      const projectPath = path.dirname(file);
      const sessionId = path.basename(file, '.jsonl');
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.message && entry.message.usage) {
            allData.push({
              sessionId,
              projectPath,
              timestamp: entry.timestamp,
              message: entry.message,
              requestId: entry.requestId,
              cwd: entry.cwd,
              uuid: entry.uuid
            });
          }
        } catch (error) {
          console.warn('Error parsing line:', error.message);
        }
      }
    }
    
    console.log(`Parsed ${allData.length} messages from ${jsonlFiles.length} files`);
    return allData;
  } catch (error) {
    console.error('Error scanning Claude projects:', error);
    return [];
  }
}

// データベースにデータを挿入
function insertDataToDatabase(data) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.serialize(() => {
      // 既存データをクリア
      db.run('DELETE FROM messages');
      db.run('DELETE FROM sessions');
      db.run('DELETE FROM models');
      
      const insertMessage = db.prepare(`
        INSERT INTO messages (
          session_id, timestamp, model, input_tokens, output_tokens,
          cache_creation_tokens, cache_read_tokens, request_id, message_id, role, cwd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // メッセージを挿入
      data.forEach(item => {
        const usage = item.message.usage;
        insertMessage.run([
          item.sessionId,
          item.timestamp,
          item.message.model || 'unknown',
          usage.input_tokens || 0,
          usage.output_tokens || 0,
          usage.cache_creation_input_tokens || 0,
          usage.cache_read_input_tokens || 0,
          item.requestId || '',
          item.message.id || '',
          item.message.role || '',
          item.cwd || ''
        ]);
      });
      
      insertMessage.finalize();
      
      // セッション統計を更新
      db.run(`
        INSERT OR REPLACE INTO sessions (
          session_id, project_path, first_message, last_message, total_messages,
          total_input_tokens, total_output_tokens, 
          total_cache_created_tokens, total_cache_read_tokens, updated_at
        )
        SELECT 
          session_id,
          MAX(cwd) as project_path,
          MIN(timestamp) as first_message,
          MAX(timestamp) as last_message,
          COUNT(*) as total_messages,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(cache_creation_tokens) as total_cache_created_tokens,
          SUM(cache_read_tokens) as total_cache_read_tokens,
          datetime('now') as updated_at
        FROM messages
        GROUP BY session_id
      `);
      
      // モデル統計を更新
      db.run(`
        INSERT OR REPLACE INTO models (
          model_name, total_messages, total_input_tokens, 
          total_output_tokens, total_cache_created_tokens, total_cache_read_tokens, updated_at
        )
        SELECT 
          model,
          COUNT(*) as total_messages,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(cache_creation_tokens) as total_cache_created_tokens,
          SUM(cache_read_tokens) as total_cache_read_tokens,
          datetime('now') as updated_at
        FROM messages
        GROUP BY model
      `);
    });
    
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// API エンドポイント: データを取得
app.get('/api/messages', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const query = `
    SELECT 
      timestamp,
      model,
      input_tokens,
      output_tokens,
      cache_creation_tokens,
      cache_read_tokens,
      session_id,
      cwd
    FROM messages
    ORDER BY timestamp
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ data: rows });
    }
    db.close();
  });
});

// API エンドポイント: 統計情報を取得
app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const queries = {
    totals: `
      SELECT 
        SUM(total_input_tokens) as total_input,
        SUM(total_output_tokens) as total_output,
        SUM(total_cache_created_tokens) as total_cache_created,
        SUM(total_cache_read_tokens) as total_cache_read,
        COUNT(*) as total_sessions
      FROM sessions
    `,
    sessions: `
      SELECT 
        session_id,
        project_path,
        total_messages,
        total_input_tokens + total_output_tokens + 
        total_cache_created_tokens + total_cache_read_tokens as total_tokens,
        first_message,
        last_message
      FROM sessions
      ORDER BY total_tokens DESC
      LIMIT 20
    `,
    models: `
      SELECT * FROM models ORDER BY total_input_tokens + total_output_tokens DESC
    `
  };
  
  const results = {};
  let completed = 0;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
        db.close();
      }
    });
  });
});

// API エンドポイント: データを再スキャン
app.post('/api/rescan', async (req, res) => {
  try {
    console.log('Starting rescan...');
    const data = await scanClaudeProjects();
    await insertDataToDatabase(data);
    console.log('Rescan completed');
    res.json({ 
      success: true, 
      message: `Processed ${data.length} messages`,
      count: data.length 
    });
  } catch (error) {
    console.error('Rescan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API エンドポイント: プロジェクトエイリアスを取得
app.get('/api/aliases', (req, res) => {
  try {
    if (fs.existsSync(ALIASES_PATH)) {
      const data = fs.readFileSync(ALIASES_PATH, 'utf8');
      const config = JSON.parse(data);
      res.json({ aliases: config.aliases || {} });
    } else {
      res.json({ aliases: {} });
    }
  } catch (error) {
    console.error('Error reading aliases:', error);
    res.status(500).json({ error: error.message });
  }
});

// API エンドポイント: プロジェクトエイリアスを保存
app.post('/api/aliases', (req, res) => {
  try {
    const { aliases } = req.body;
    
    let config = {
      "_comment": "プロジェクトID（UUID）に人間が読みやすい名前を設定",
      "_example": {
        "01e028c5-a812-4f58-a398-e4ca23f00e7c": "SoulMaster Game Development",
        "d5b037ec-35ca-4fab-a1be-7b0694a18e89": "React Dashboard Project",
        "c078d04c-ca14-4dc1-b4d1-a7270637ed92": "Claude Token Visualizer"
      },
      "aliases": {}
    };
    
    // 既存の設定ファイルがあれば読み込み
    if (fs.existsSync(ALIASES_PATH)) {
      try {
        const existingData = fs.readFileSync(ALIASES_PATH, 'utf8');
        config = JSON.parse(existingData);
      } catch (parseError) {
        console.warn('Error parsing existing aliases file, using default config');
      }
    }
    
    // エイリアスを更新
    config.aliases = aliases;
    
    // ファイルに保存
    fs.writeFileSync(ALIASES_PATH, JSON.stringify(config, null, 2));
    
    res.json({ success: true, message: 'Aliases saved successfully' });
  } catch (error) {
    console.error('Error saving aliases:', error);
    res.status(500).json({ error: error.message });
  }
});

// サーバー起動時の初期化
async function startServer() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('Scanning Claude projects...');
    const data = await scanClaudeProjects();
    
    if (data.length > 0) {
      console.log('Inserting data into database...');
      await insertDataToDatabase(data);
      console.log(`Database initialized with ${data.length} messages`);
    } else {
      console.log('No data found to process');
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database: ${DB_PATH}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();