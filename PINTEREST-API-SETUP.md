# Pinterest APIセットアップガイド

## 📋 概要

このガイドでは、Pinterest APIを使用するためのセットアップ手順を説明します。

---

## 🔑 1. Pinterest開発者アカウントの作成

1. **Pinterestビジネスアカウントを作成**
   - https://business.pinterest.com/ にアクセス
   - ビジネスアカウントを作成（既にアカウントがある場合はログイン）

2. **開発者ポータルにアクセス**
   - https://developers.pinterest.com/ にアクセス
   - ビジネスアカウントでログイン

---

## 📱 2. アプリケーションの登録

1. **新しいアプリを作成**
   - 開発者ポータルで「Create app」をクリック
   - アプリ名、説明などを入力
   - 例:
     - **App name**: `Design AI Image Board Tool`
     - **Description**: `Internal tool for designers to create image boards`

2. **リダイレクトURIを設定**
   - アプリ設定で「Redirect URIs」を追加
   - 例: `http://localhost:3000/auth/pinterest/callback`
   - 本番環境の場合は、実際のドメインを追加

3. **クライアントIDとクライアントシークレットを取得**
   - アプリ設定画面で以下を確認:
     - **Client ID**
     - **Client Secret**

---

## 🔐 3. アクセストークンの取得

### 方法1: 手動で取得（推奨）

1. **認証URLを生成**
   ```
   https://www.pinterest.com/oauth/?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=boards:read,pins:read
   ```
   
   - `{CLIENT_ID}`: アプリのクライアントID
   - `{REDIRECT_URI}`: 設定したリダイレクトURI（URLエンコード済み）
   - `scope`: 必要な権限（`boards:read`, `pins:read`）

2. **ブラウザで認証URLにアクセス**
   - Pinterestにログイン
   - アプリのアクセス許可を承認

3. **認証コードを取得**
   - リダイレクトURIに認証コードが含まれる
   - 例: `http://localhost:3000/auth/pinterest/callback?code={AUTH_CODE}`
   - `{AUTH_CODE}` の部分をコピー

4. **アクセストークンを取得**
   ```bash
   curl -X POST https://api.pinterest.com/v5/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "client_id={CLIENT_ID}" \
     -d "client_secret={CLIENT_SECRET}" \
     -d "code={AUTH_CODE}"
   ```

5. **レスポンスからアクセストークンを取得**
   ```json
   {
     "access_token": "pina_xxxxxxxxxxxxx",
     "token_type": "bearer",
     "expires_in": 2592000,
     "refresh_token": "pina_yyyyyyyyyyyyy",
     "scope": "boards:read,pins:read"
   }
   ```

---

## 🔒 4. Secret Managerへの保存

### ローカル開発環境（.env.local）

`.env.local` ファイルに以下を追加:

```bash
PINTEREST_ACCESS_TOKEN=pina_xxxxxxxxxxxxx
PINTEREST_CLIENT_ID=your_client_id
PINTEREST_CLIENT_SECRET=your_client_secret
```

### GCP Secret Manager（本番環境）

```bash
# アクセストークンを保存
echo -n "pina_xxxxxxxxxxxxx" | gcloud secrets create pinterest-access-token \
  --data-file=- \
  --project=park-ai-test

# クライアントIDを保存（オプション）
echo -n "your_client_id" | gcloud secrets create pinterest-client-id \
  --data-file=- \
  --project=park-ai-test

# クライアントシークレットを保存（オプション）
echo -n "your_client_secret" | gcloud secrets create pinterest-client-secret \
  --data-file=- \
  --project=park-ai-test
```

### Cloud Runの環境変数設定

Cloud Runのデプロイ時に、Secret Managerから環境変数を読み込むように設定:

```bash
gcloud run services update design-ai \
  --update-secrets=PINTEREST_ACCESS_TOKEN=pinterest-access-token:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

---

## ✅ 5. 動作確認

### ローカル環境でのテスト

1. `.env.local` にアクセストークンを設定
2. 開発サーバーを起動:
   ```bash
   cd app
   npm run dev
   ```
3. ブラウザで `http://localhost:3000` にアクセス
4. 画像をアップロードして、Pinterest検索を実行
5. 画像が正しく表示されることを確認

### APIエンドポイントの直接テスト

```bash
curl -X POST http://localhost:3000/api/search/pinterest \
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

---

## ⚠️ 注意事項

### アクセストークンの有効期限

- アクセストークンには有効期限があります（通常30日間）
- 有効期限が切れた場合は、リフレッシュトークンを使用して更新する必要があります
- リフレッシュトークンもSecret Managerに保存することを推奨します

### APIのレート制限

- Pinterest APIにはレート制限があります
- 1日5回程度の使用であれば問題ありませんが、大量のリクエストを送信する場合は注意が必要です
- レート制限に達した場合は、エラーメッセージが返されます

### 利用規約の遵守

- Pinterest APIの利用規約を確認し、遵守してください
- 特に、取得したデータの使用目的や保存方法について注意が必要です

---

## 🔄 トラブルシューティング

### エラー: "Pinterest APIの認証に失敗しました"

- アクセストークンが正しく設定されているか確認
- アクセストークンの有効期限が切れていないか確認
- Secret Managerの権限設定を確認

### エラー: "APIのレート制限に達しました"

- しばらく待ってから再度お試しください
- 1日の使用回数を確認してください

### エラー: "Pinterest APIのエンドポイントが見つかりませんでした"

- APIのバージョン（v5）が正しいか確認
- エンドポイントURLが正しいか確認

---

## 📚 参考資料

- [Pinterest API Documentation](https://developers.pinterest.com/docs/api/v5/)
- [Pinterest API Getting Started](https://developers.pinterest.com/docs/getting-started/)
- [Pinterest OAuth Guide](https://developers.pinterest.com/docs/api/v5/#tag/OAuth)

