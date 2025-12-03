# API動作確認ガイド

## 📋 確認項目

### 1. 開発サーバーの起動確認

```bash
cd ~/design_ai/app
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして、フロントエンドが表示されることを確認してください。

### 2. Gemini APIの動作確認

```bash
cd ~/design_ai/app
node test-gemini-api.js
```

このスクリプトでGemini APIが正常に動作するか確認できます。

### 3. 画像分析APIのテスト

#### 方法1: ブラウザからテスト（推奨）

1. `http://localhost:3000` を開く
2. 画像をドラッグ&ドロップまたはクリックして選択
3. 分析結果が表示されることを確認

#### 方法2: curlコマンドでテスト

```bash
# テスト画像ファイルを用意（例: test-image.jpg）
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@test-image.jpg" \
  -H "Content-Type: multipart/form-data"
```

### 4. Pinterest検索APIのテスト

画像分析が完了した後、ブラウザ上で検索軸を選択してテストしてください。

## 🔍 トラブルシューティング

### Gemini APIキーが設定されていない

`.env.local` ファイルを確認：

```bash
cd ~/design_ai/app
cat .env.local
```

以下の形式で設定されているか確認：

```env
GEMINI_API_KEY=AIzaSy...
```

### APIエラーが発生する

1. **APIキーが無効**
   - [Google AI Studio](https://makersuite.google.com/app/apikey) で新しいAPIキーを取得
   - `.env.local` を更新
   - 開発サーバーを再起動

2. **利用制限に達している**
   - Gemini APIの利用制限を確認
   - 無料枠の場合は60リクエスト/分の制限があります

3. **ネットワークエラー**
   - インターネット接続を確認
   - ファイアウォールの設定を確認

### 開発サーバーが起動しない

```bash
# ポート3000が使用中の場合
lsof -ti:3000 | xargs kill -9

# 再度起動
npm run dev
```

## 📊 ログの確認

### 開発サーバーのログ

ターミナルで開発サーバーを起動した場合、ログが表示されます。

### ブラウザのコンソール

ブラウザの開発者ツール（F12）でコンソールを開き、エラーメッセージを確認してください。

## ✅ 正常動作の確認ポイント

- [ ] 開発サーバーが起動する
- [ ] フロントエンドが表示される
- [ ] 画像をアップロードできる
- [ ] 画像分析が実行される（ローディング表示）
- [ ] 分析結果が表示される（カラーパレット、質感、トーン等）
- [ ] 検索軸を選択できる
- [ ] Pinterest検索が実行される
- [ ] 検索結果が表示される

## 🚀 次のステップ

すべての確認が完了したら：

1. 実際の画像で動作確認
2. UIの改善
3. ドラッグ&ドロップ機能の実装
4. Cloud Runへのデプロイ

