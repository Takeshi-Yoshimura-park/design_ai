# イメージボード作成ツール

デザイナーの業務効率化のため、画像から類似画像を効率的に検索・配置できるイメージボード作成ツールです。

## 📋 プロジェクト概要

このプロジェクトは、デザイナーがイメージボードを作成する際の業務効率化を目的としたWebアプリケーションです。

### 主な機能

- 🖼️ 画像アップロード（ドラッグ&ドロップ）
- 🤖 AIによる画像分析（Gemini API）
  - カラー抽出とパレット表示
  - 質感・スタイル分析
  - トーン＆ムード分析
  - レイアウト特性分析
- 🔍 Pinterestからの類似画像検索
- 📐 フリーボード形式での画像配置

## 🚀 クイックスタート

### 1. インフラのセットアップ

```bash
# 自動セットアップスクリプトを実行
./scripts/setup-infrastructure.sh
```

詳細は [QUICKSTART.md](QUICKSTART.md) を参照してください。

### 2. アプリケーションのセットアップ

```bash
cd app
npm install
cp .env.example .env.local
# .env.local を編集してGemini APIキーを設定
npm run dev
```

### 3. デプロイ

```bash
./scripts/deploy.sh
```

## 📁 プロジェクト構造

```
design_ai/
├── app/                      # Next.jsアプリケーション
│   ├── app/                 # Next.js App Router
│   ├── lib/                 # ユーティリティ
│   ├── components/          # Reactコンポーネント
│   └── Dockerfile           # Docker設定
├── scripts/                 # セットアップ・デプロイスクリプト
│   ├── setup-infrastructure.sh
│   └── deploy.sh
├── requirements.md          # 要件定義書
├── tech-stack.md           # 技術スタック
├── ux-review.md            # UXレビュー
├── cost-estimation.md      # コスト見積もり
├── infrastructure-setup.md # インフラセットアップ手順
├── DEPLOYMENT.md           # デプロイ手順
└── QUICKSTART.md           # クイックスタートガイド
```

## 📚 ドキュメント

- [要件定義書](requirements.md) - 機能要件、技術要件、UI/UX要件
- [技術スタック](tech-stack.md) - 使用技術の詳細
- [UXレビュー](ux-review.md) - UX改善提案
- [コスト見積もり](cost-estimation.md) - 運用コストの見積もり
- [インフラセットアップ](infrastructure-setup.md) - GCP環境のセットアップ手順
- [デプロイ手順](DEPLOYMENT.md) - Cloud Runへのデプロイ方法
- [クイックスタート](QUICKSTART.md) - 最短でセットアップする方法

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14+ (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS
- **ドラッグ&ドロップ**: @dnd-kit/core
- **AI**: Google Gemini API
- **画像検索**: Pinterest（スクレイピング）
- **インフラ**: Google Cloud Platform
  - Cloud Run（ホスティング）
  - Secret Manager（APIキー管理）
  - Artifact Registry（Dockerイメージ）

## 💰 コスト

検証フェーズでの想定コスト: **¥35-770/月**

詳細は [cost-estimation.md](cost-estimation.md) を参照してください。

## 🔧 開発

### ローカル開発

```bash
cd app
npm install
npm run dev
```

### ビルド

```bash
cd app
npm run build
npm start
```

## 📝 ライセンス

Private

## 🤝 コントリビューション

社内プロジェクトのため、コントリビューションは制限されています。

## 📞 サポート

質問や問題がある場合は、プロジェクト管理者に連絡してください。

