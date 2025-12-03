# Google Custom Search APIセットアップガイド

## 📋 概要

このガイドでは、Google Custom Search JSON APIを使用して画像検索機能をセットアップする手順を説明します。

---

## 🔑 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの確認

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/ にアクセス
   - 既存のプロジェクト（`park-ai-test`）を選択

### 1.2 Custom Search JSON APIの有効化

1. **APIライブラリを開く**
   - 左メニューから「APIとサービス」→「ライブラリ」を選択

2. **Custom Search JSON APIを検索**
   - 検索バーに「Custom Search JSON API」と入力
   - 「Custom Search JSON API」を選択

3. **APIを有効化**
   - 「有効にする」ボタンをクリック

---

## 🔍 2. Programmable Search Engineの作成

### 2.1 検索エンジンの作成

1. **Programmable Search Engineにアクセス**
   - https://programmablesearchengine.google.com/ にアクセス
   - Googleアカウントでログイン

2. **新しい検索エンジンを追加**
   - 「検索エンジンを追加」をクリック

3. **基本設定を入力**
   - **検索エンジン名**: `Design AI Image Search`
   - **検索対象**: 
     - **推奨**: 「全ウェブを検索」を選択
     - （オプション）「特定のサイト」を選択し、`pinterest.com` を指定
   - **言語**: 日本語
   - **画像検索**: ✅ 有効にする

4. **作成を完了**
   - 「作成」ボタンをクリック

### 2.2 検索エンジンID（CSE ID）の取得

1. **検索エンジンの設定画面を開く**
   - 作成した検索エンジンを選択
   - 「設定」タブを選択

2. **検索エンジンIDをコピー**
   - 「検索エンジンID」の値をコピー
   - 例: `012345678901234567890:abcdefghijk`

---

## 🔐 3. APIキーの作成

### 3.1 Google Cloud ConsoleでAPIキーを作成

1. **認証情報ページを開く**
   - Google Cloud Consoleで「APIとサービス」→「認証情報」を選択

2. **APIキーを作成**
   - 「認証情報を作成」→「APIキー」を選択
   - APIキーが生成される

3. **APIキーの制限を設定（推奨）**
   - 作成したAPIキーをクリック
   - 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
   - 「ウェブサイトの制限」に以下を追加:
     - `http://localhost:3000/*`（ローカル開発用）
     - `https://your-domain.com/*`（本番環境用）
   - 「APIの制限」で「Custom Search JSON API」のみを許可

4. **保存**
   - 「保存」ボタンをクリック

---

## 🔧 4. 環境変数の設定

### 4.1 ローカル開発環境（.env.local）

`app/.env.local` ファイルを作成または編集:

```bash
# Google Custom Search API
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_cse_id_here

# 既存の環境変数（Gemini APIなど）
GEMINI_API_KEY=your_gemini_api_key_here
```

**注意**: `.env.local` ファイルはGitにコミットしないでください（`.gitignore` に含まれています）。

### 4.2 GCP Secret Manager（本番環境）

#### APIキーを保存

```bash
echo -n "your_api_key_here" | gcloud secrets create google-custom-search-api-key \
  --data-file=- \
  --project=park-ai-test
```

#### CSE IDを保存

```bash
echo -n "your_cse_id_here" | gcloud secrets create google-custom-search-engine-id \
  --data-file=- \
  --project=park-ai-test
```

### 4.3 Cloud Runの環境変数設定

Cloud Runサービスに環境変数を設定:

```bash
gcloud run services update design-ai \
  --update-secrets=GOOGLE_CUSTOM_SEARCH_API_KEY=google-custom-search-api-key:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=google-custom-search-engine-id:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

既存のSecret Managerシークレットと組み合わせる場合:

```bash
gcloud run services update design-ai \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,GOOGLE_CUSTOM_SEARCH_API_KEY=google-custom-search-api-key:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=google-custom-search-engine-id:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

---

## ✅ 5. 動作確認

### 5.1 ローカル環境でのテスト

1. **環境変数を設定**
   - `app/.env.local` にAPIキーとCSE IDを設定

2. **開発サーバーを起動**
   ```bash
   cd app
   npm run dev
   ```

3. **ブラウザで確認**
   - `http://localhost:3000` にアクセス
   - 画像をアップロードして、検索軸を選択
   - 画像が正しく表示されることを確認

### 5.2 APIエンドポイントの直接テスト

```bash
curl -X POST http://localhost:3000/api/search/google-images \
  -H "Content-Type: application/json" \
  -d '{
    "analysisResult": {
      "colors": [{"name": "白", "hex": "#FFFFFF"}],
      "texture": "モダン",
      "tone": "明るい",
      "layout": "シンプル"
    },
    "axis": "color"
  }'
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "query": "pinterest 白 インテリア デザイン",
  "images": [
    {
      "url": "https://www.pinterest.com/pin/...",
      "thumbnailUrl": "https://i.pinimg.com/236x/...",
      "alt": "画像のタイトル",
      "pinterestUrl": "https://www.pinterest.com/pin/..."
    }
  ]
}
```

---

## ⚠️ 注意事項

### APIキーのセキュリティ

- **APIキーを公開リポジトリにコミットしない**
- **APIキーの制限を設定する**（HTTP リファラー、APIの制限）
- **Secret Managerを使用して本番環境で管理する**

### レート制限

- **無料枠**: 1日100クエリまで無料
- **超過分**: $5 / 1,000クエリ
- **想定使用量**: 1日5回程度 → 完全に無料枠内

### 検索結果の品質

- **`pinterest` キーワードを使用**: Pinterestの画像が優先的に表示されます
- **`site:pinterest.com` を使用**: Pinterestの画像のみが表示されますが、結果数が少なくなる可能性があります
- 最初は `pinterest` キーワードのみを使用し、必要に応じて調整してください

### 利用規約の遵守

- Google Custom Search APIの利用規約を確認し、遵守してください
- 取得した画像の使用目的や保存方法について注意が必要です
- 必要に応じて、「Powered by Google」などの表記をUIに追加してください

---

## 🐛 トラブルシューティング

### エラー: "Google Custom Search APIの設定が完了していません"

- `.env.local` または Secret Managerに環境変数が設定されているか確認
- 環境変数名が正しいか確認:
  - `GOOGLE_CUSTOM_SEARCH_API_KEY`
  - `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

### エラー: "Google Custom Search APIの認証に失敗しました"

- APIキーが正しいか確認
- Custom Search JSON APIが有効化されているか確認
- APIキーの制限設定を確認（HTTP リファラー、APIの制限）

### エラー: "APIのレート制限に達しました"

- 1日の使用回数を確認（無料枠: 100クエリ/日）
- しばらく待ってから再度お試しください

### 検索結果が表示されない

- 検索クエリを確認（`pinterest` キーワードが含まれているか）
- CSE IDが正しいか確認
- 検索エンジンの設定を確認（画像検索が有効になっているか）

---

## 📚 参考資料

- [Google Custom Search JSON API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)
- [Custom Search JSON API Pricing](https://developers.google.com/custom-search/v1/overview#pricing)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

