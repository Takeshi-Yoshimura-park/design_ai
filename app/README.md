# イメージボード作成ツール

デザイナーの業務効率化のため、画像から類似画像を効率的に検索・配置できるイメージボード作成ツールです。

## 🚀 機能

- 画像アップロード（ドラッグ&ドロップ）
- AIによる画像分析（Gemini API）
  - カラー抽出
  - 質感・スタイル分析
  - トーン＆ムード分析
  - レイアウト特性分析
- Pinterestからの類似画像検索
- フリーボード形式での画像配置

## 📋 前提条件

- Node.js 18.x以上
- npm または yarn
- Google Cloud SDK（デプロイ時）
- Gemini APIキー

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

`.env.local` を編集して、Gemini APIキーを設定：

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📦 ビルド

```bash
npm run build
npm start
```

## 🚢 デプロイ

詳細は [../DEPLOYMENT.md](../DEPLOYMENT.md) を参照してください。

```bash
# プロジェクトルートから実行
./scripts/deploy.sh
```

## 📁 プロジェクト構造

```
app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # 画像分析API
│   │   └── search/        # Pinterest検索API
│   ├── page.tsx           # メインページ
│   └── layout.tsx         # レイアウト
├── lib/                   # ユーティリティ
│   ├── gemini.ts         # Gemini APIクライアント
│   ├── pinterest.ts      # Pinterest検索ロジック
│   └── prompts.ts        # プロンプト定義
├── components/            # Reactコンポーネント（今後追加）
├── Dockerfile            # Docker設定
└── package.json          # 依存関係
```

## 🔧 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: Google Gemini API
- **ドラッグ&ドロップ**: @dnd-kit/core
- **インフラ**: Google Cloud Run

## 📚 ドキュメント

- [要件定義書](../requirements.md)
- [技術スタック](../tech-stack.md)
- [UXレビュー](../ux-review.md)
- [コスト見積もり](../cost-estimation.md)
- [インフラセットアップ](../infrastructure-setup.md)
- [デプロイ手順](../DEPLOYMENT.md)

## 📝 ライセンス

Private
