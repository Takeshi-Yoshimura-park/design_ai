# 技術スタック提案書

## 推奨技術スタック（GCP前提）

### フロントエンド

#### Next.js 14+ (App Router)
- **理由**: 
  - サーバーサイドとクライアントサイドの両方を統合
  - API Routesでバックエンド機能も実装可能
  - 優れたパフォーマンスとSEO対応
  - TypeScriptの完全サポート
- **バージョン**: 14.2以上推奨

#### UIライブラリ・フレームワーク

**Tailwind CSS**
- **理由**: 迅速なスタイリング、カスタマイズ性が高い
- **用途**: 全体的なスタイリング

**@dnd-kit/core**
- **理由**: モダンなドラッグ&ドロップライブラリ、TypeScript対応
- **用途**: 画像のドラッグ&ドロップ機能
- **代替案**: react-beautiful-dnd（ただしメンテナンスが停滞気味）

**shadcn/ui**（オプション）
- **理由**: 高品質なUIコンポーネント、カスタマイズ可能
- **用途**: ボタン、モーダル、カラーパレット表示など

#### その他のライブラリ

**Sharp**
- **理由**: 高性能な画像処理ライブラリ
- **用途**: 画像のリサイズ、最適化

**Cheerio**
- **理由**: サーバーサイドでのHTMLパース
- **用途**: Pinterest検索結果からの画像URL抽出

**axios** または **fetch**
- **理由**: HTTPリクエスト
- **用途**: API呼び出し

---

### バックエンド

#### Next.js API Routes
- **理由**: 
  - フロントエンドと同一プロジェクトで管理
  - サーバーレス関数として動作
  - Cloud Runで簡単にデプロイ可能

#### 主要なAPIエンドポイント

1. **`/api/analyze`** (POST)
   - 画像をGemini APIに送信
   - 分析結果を返却

2. **`/api/search/pinterest`** (POST)
   - 検索クエリを受け取り
   - Pinterestから画像を取得
   - 画像URLのリストを返却

3. **`/api/image/proxy`** (GET) - オプション
   - CORS問題を回避するための画像プロキシ

---

### インフラ（GCP）

#### Cloud Run
- **理由**: 
  - サーバーレスで自動スケーリング
  - コンテナベースで柔軟性が高い
  - 従量課金でコスト効率が良い
  - Next.jsとの相性が良い
- **設定**: 
  - 最小インスタンス: 0（コスト削減）
  - 最大インスタンス: 10（初期段階）
  - メモリ: 512MB〜1GB
  - CPU: 1 vCPU

#### Cloud Storage（オプション）
- **用途**: 
  - 一時的な画像保存（必要に応じて）
  - アップロードされた画像の一時保管
- **注意**: 要件では保存不要とのことなので、基本的には使用しない

#### Secret Manager
- **用途**: 
  - Gemini APIキーの安全な管理
  - 環境変数の管理
- **理由**: セキュリティベストプラクティス

#### Cloud Build（CI/CD）
- **用途**: 
  - 自動デプロイ
  - Dockerイメージのビルド
- **理由**: GCPエコシステムとの統合

---

### 外部API・サービス

#### Google Gemini API
- **モデル**: `gemini-pro-vision` または `gemini-1.5-pro`
- **用途**: 画像分析（カラー、質感、トーン、レイアウト）
- **認証**: APIキー（Secret Managerで管理）

#### Pinterest
- **用途**: 類似画像の検索
- **方法**: 検索URL生成 → HTMLパース → 画像URL抽出
- **注意**: 利用規約の確認が必要

---

## 開発環境

### 必須ツール
- **Node.js**: 18.x以上（LTS推奨）
- **npm** または **yarn** または **pnpm**
- **Docker**: Cloud Runへのデプロイ用
- **Git**: バージョン管理

### 推奨ツール
- **VS Code**: エディタ
- **Google Cloud SDK**: GCP操作
- **Docker Desktop**: ローカルでのコンテナテスト

---

## プロジェクト構成（想定）

```
design_ai/
├── app/                    # Next.js App Router
│   ├── page.tsx           # メインページ
│   ├── api/
│   │   ├── analyze/       # 画像分析API
│   │   └── search/        # Pinterest検索API
│   └── layout.tsx
├── components/            # Reactコンポーネント
│   ├── ImageUploader.tsx
│   ├── ImageAnalyzer.tsx
│   ├── ColorPalette.tsx
│   ├── SearchAxisSelector.tsx
│   └── ImageGrid.tsx
├── lib/                   # ユーティリティ
│   ├── gemini.ts         # Gemini APIクライアント
│   ├── pinterest.ts      # Pinterest検索ロジック
│   └── prompts.ts        # プロンプト定義
├── types/                 # TypeScript型定義
├── public/                # 静的ファイル
├── Dockerfile            # Cloud Run用
├── .dockerignore
├── .env.local            # ローカル環境変数
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## パッケージ依存関係（想定）

### 必須パッケージ
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@google/generative-ai": "^0.2.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "cheerio": "^1.0.0",
    "sharp": "^0.33.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## デプロイフロー

1. **コードをGitにプッシュ**
2. **Cloud Buildが自動的にトリガー**
3. **Dockerイメージをビルド**
4. **Cloud Runにデプロイ**
5. **環境変数（Secret Managerから）を注入**

---

## コスト見積もり（概算）

### Cloud Run
- **無料枠**: 月200万リクエスト、36万GB秒
- **超過時**: 
  - CPU: $0.00002400/vCPU秒
  - メモリ: $0.00000250/GiB秒
  - リクエスト: $0.40/100万リクエスト

### Gemini API
- **無料枠**: 60リクエスト/分
- **有料プラン**: 使用量に応じて

### 想定コスト（小規模運用）
- **月間**: 数百円〜数千円程度（無料枠内で収まる可能性が高い）

---

## セキュリティ考慮事項

1. **APIキーの管理**
   - Secret Managerを使用
   - 環境変数に直接記載しない

2. **画像アップロード**
   - ファイルサイズ制限（例: 10MB）
   - ファイル形式の検証
   - マルウェアスキャン（必要に応じて）

3. **CORS設定**
   - 適切なオリジン設定
   - 不要なアクセスをブロック

4. **レート制限**
   - API呼び出しのレート制限
   - 悪意のあるリクエストの防止

---

## パフォーマンス最適化

1. **画像最適化**
   - Sharpによるリサイズ
   - WebP形式への変換
   - 遅延読み込み（lazy loading）

2. **キャッシング**
   - 分析結果の一時的なキャッシュ
   - 画像のCDNキャッシュ（必要に応じて）

3. **非同期処理**
   - 画像分析と検索を非同期で処理
   - ローディング状態の適切な表示

---

## 次のアクション

1. ✅ 技術スタック確定
2. **プロジェクト初期化**: `npx create-next-app@latest`
3. **必要なパッケージのインストール**
4. **GCPプロジェクトの作成**
5. **Cloud Runのセットアップ**
6. **Secret Managerの設定**
7. **開発開始**

