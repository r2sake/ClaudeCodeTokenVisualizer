# Claude Code Token Visualizer

**Claude Code で使用したトークン数を見える化するWebアプリケーション**

Claude Code は AI プログラミングアシスタントですが、どれくらいトークンを使っているか把握するのは難しいもの。このツールを使えば、プロジェクトごとのトークン使用量を美しいグラフで確認できます。

## 🎯 このツールでできること

- **自動データ収集**: Claude Code の使用履歴を自動で読み込み
- **視覚的な分析**: グラフでトークン使用量の推移を確認
- **プロジェクト比較**: 複数プロジェクトの使用量を比較
- **詳細統計**: 入力・出力・キャッシュトークンの内訳表示
- **データエクスポート**: CSV・JSON形式でデータを書き出し

![実際にローカル環境のデータを表示した例](/reference/image.png)
![時系列グラフ表示](/reference/image-1.png)
![プロジェクト毎の比較](/reference/image-2.png)
![プロジェクト毎の比較](/reference/image-3.png)
## 📋 必要な環境

### 前提条件
- **Node.js** (バージョン 16 以上)
- **Claude Code** が実際に使用されていること
- **macOS・Linux・Windows** に対応

### 事前確認
Claude Code を使用していると、以下の場所にデータファイルが作成されます：

```
~/.claude/projects/[プロジェクトパス]/[セッションID].jsonl
```

このフォルダにファイルがあることを確認してください。

## 🚀 インストールと起動

### ステップ 1: プロジェクトをダウンロード

```bash
# GitHubからクローン
git clone https://github.com/r2sake/ClaudeCodeTokenVisualizer.git
cd claude-code-token-visualizer
```

### ステップ 2: 依存関係をインストール

```bash
# フロントエンド（メイン画面）の依存関係をインストール
npm install

# バックエンド（データ処理）の依存関係をインストール
npm run server:install
```

> **💡 ヒント**: `npm install` でエラーが出る場合は、Node.js のバージョンが古い可能性があります。[Node.js公式サイト](https://nodejs.org/) から最新版をインストールしてください。

### ステップ 3: アプリケーションを起動

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

これで以下が同時に起動します：
- **フロントエンド**: http://localhost:5173 （メイン画面）
- **バックエンド**: http://localhost:3001 （データ処理サーバー）

### ステップ 4: ブラウザで確認

1. ブラウザで http://localhost:5173 を開く
2. データが自動的に読み込まれ、グラフが表示される
3. 「Claude Projects 再スキャン」ボタンで最新データを取得

## 📊 使い方ガイド

### 基本的な見方

#### メイン統計カード
- **総トークン数**: これまでに使用したトークンの合計
- **平均トークン/リクエスト**: 1回のやり取りあたりの平均使用量
- **入力トークン**: あなたがClaude に送った文字数相当
- **出力トークン**: Claude が返答した文字数相当
- **キャッシュ**: 効率化のため保存されたデータ

#### 時系列グラフ
- 横軸: 時間（日・週・月・年で切り替え可能）
- 縦軸: トークン使用量
- 青色: 入力トークン
- 緑色: 出力トークン

### プロジェクト管理

#### プロジェクト名の設定
Claude Code では各プロジェクトがUUID（英数字の文字列）で管理されますが、これでは分かりにくいため、分かりやすい名前を設定できます。

1. 「プロジェクト名設定」ボタンをクリック
2. プロジェクトを選択して、分かりやすい名前を入力
3. 「保存」をクリック

#### プロジェクトの合算
複数のセッション（作業期間）を1つのプロジェクトとして集計したい場合：

1. 同じプロジェクト名を複数のUUIDに設定
2. 自動的に合算して表示される

**例**: 
- UUID `abc-123` → 「Webサイト制作」
- UUID `def-456` → 「Webサイト制作」  
→ 2つのセッションが「Webサイト制作」として合算表示

### データのエクスポート

#### JSON エクスポート
プログラマー向けの詳細データ形式

#### CSV エクスポート  
Excel や Google スプレッドシートで開ける表形式

## 🔧 詳細設定

### 個別起動（上級者向け）
```bash
# バックエンドのみ起動
npm run server:dev

# フロントエンドのみ起動  
npm run dev:frontend
```

### プロダクション環境での利用
```bash
# ビルド
npm run build

# プレビュー
npm run preview
```

## 🏗️ 技術仕様

### アーキテクチャ
```
フロントエンド (React + TypeScript) 
    ↓ HTTP API
バックエンド (Node.js + Express)
    ↓ 
SQLiteデータベース
    ↑
JSONL ファイル読み込み (~/.claude/projects)
```

### 使用技術
- **フロントエンド**: React 18, TypeScript, Vite, Recharts
- **バックエンド**: Node.js, Express, SQLite3
- **UI**: Lucide React (アイコン), CSS3
- **データ処理**: date-fns (日付), glob (ファイル検索)

## 🎨 カスタマイズ

### スタイルの変更
`src/index.css` を編集することで、色やフォントをカスタマイズできます。

### データの拡張
`server/index.js` を編集することで、追加の統計情報を計算できます。

## 📁 ファイル構成

```
claude-code-token-visualizer/
├── src/                    # フロントエンドのソースコード
│   ├── components/         # UIコンポーネント
│   ├── utils/             # 共通関数
│   └── types/             # TypeScript型定義
├── server/                # バックエンドのソースコード
│   └── index.js          # サーバーメイン処理
├── project-aliases.json  # プロジェクト名設定
└── claude_projects.db     # SQLiteデータベース
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. データが表示されない
**原因**: Claude Code のデータファイルが見つからない
**解決法**: 
- Claude Code を実際に使用しているか確認
- `~/.claude/projects/` フォルダが存在するか確認
- 「再スキャン」ボタンを押してみる

#### 2. `npm install` でエラーが出る
**原因**: Node.js のバージョンが古い
**解決法**: 
- Node.js 16 以上をインストール
- `node --version` でバージョンを確認

#### 3. ポートが使用中のエラー
**原因**: 3001番または5173番ポートが他のアプリで使用中
**解決法**: 
- 他のアプリを終了する
- または `package.json` でポート番号を変更

#### 4. SQLite エラー
**原因**: データベースファイルが破損
**解決法**: 
- `claude_projects.db` ファイルを削除
- アプリを再起動（自動的に再作成される）

#### 5. プロジェクト名が表示されない
**原因**: エイリアス設定が正しくない
**解決法**: 
- `project-aliases.json` の形式を確認
- 「プロジェクト名設定」から再設定

## 🔒 プライバシーについて

### データの取り扱い
- **ローカル処理**: すべてのデータはあなたのコンピューター内で処理
- **外部送信なし**: インターネット経由でデータを送信することはありません
- **個人情報**: プロジェクトパスなどの個人情報は表示のみで保存されません

### ファイルの除外
リポジトリには以下のファイルは含まれません：
- `project-aliases.json` (個人の設定)
- `claude_projects.db` (個人のデータ)
- `claude_projects.db-journal` (SQLite作業ファイル)

## 🤝 コントリビューション

### バグ報告・機能要望
[GitHub Issues](https://github.com/r2sake/ClaudeCodeTokenVisualizer/issues) からお気軽にご報告ください。


## 📄 ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。詳細は `LICENSE` ファイルをご覧ください。

## 🙏 謝辞

- [Claude Code](https://claude.ai/code) - Anthropic社のAIプログラミングアシスタント
- [React](https://react.dev/) - UIライブラリ
- [Recharts](https://recharts.org/) - グラフライブラリ
- [Express](https://expressjs.com/) - Node.js Webフレームワーク

---

**💬 質問やフィードバックがありましたら、お気軽に Issue を作成してください！**