# Google Custom Search API 401エラー トラブルシューティング

## 🔍 エラー内容

```
401 (Unauthorized)
"Google Custom Search APIの認証に失敗しました。APIキーを確認してください"
```

## ✅ 確認すべき項目

### 1. 環境変数の設定確認

**`.env.local` ファイルの場所と内容を確認:**

```bash
cd ~/design_ai/app
cat .env.local
```

**必要な環境変数:**
```bash
GOOGLE_CUSTOM_SEARCH_API_KEY=あなたのAPIキー
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=52178dc6b9b454256
```

**注意:**
- `.env.local` は `app` ディレクトリ内に配置する必要があります
- 環境変数名は正確に（大文字小文字も含めて）一致している必要があります
- 値の前後に余分なスペースや引用符がないか確認してください

### 2. 開発サーバーの再起動

環境変数を変更した場合は、**必ず開発サーバーを再起動**してください:

```bash
# 開発サーバーを停止（Ctrl+C）
# その後、再起動
cd ~/design_ai/app
npm run dev
```

### 3. Google Cloud Consoleでの確認

#### 3.1 Custom Search JSON APIが有効化されているか

1. https://console.cloud.google.com/ にアクセス
2. プロジェクト `park-ai-test` を選択
3. 「APIとサービス」→「ライブラリ」を選択
4. 「Custom Search JSON API」を検索
5. **「有効」になっているか確認**
   - 無効の場合は「有効にする」をクリック

#### 3.2 APIキーの確認

1. 「APIとサービス」→「認証情報」を選択
2. 作成したAPIキーをクリック
3. **「APIキー」の値が正しいか確認**
   - コピーして `.env.local` の値と一致しているか確認

#### 3.3 APIキーの制限設定

**問題の可能性がある設定:**

- **「アプリケーションの制限」** が設定されている場合:
  - 「HTTP リファラー（ウェブサイト）」に制限していると、サーバーサイドからのリクエストがブロックされる可能性があります
  - **一時的に「制限なし」に変更してテスト**してみてください

- **「APIの制限」** が設定されている場合:
  - 「Custom Search JSON API」が許可されているか確認
  - または「制限なし」に設定

**推奨設定（検証フェーズ）:**
- 「アプリケーションの制限」: **制限なし**（一時的）
- 「APIの制限」: **Custom Search JSON API** のみ許可

### 4. Programmable Search Engineの確認

1. https://programmablesearchengine.google.com/ にアクセス
2. 作成した検索エンジンを選択
3. **「検索エンジンID」が `52178dc6b9b454256` であることを確認**
4. **「設定」タブで以下を確認:**
   - 「画像検索」が有効になっているか
   - 「検索対象」が正しく設定されているか

### 5. サーバー側のログ確認

開発サーバーのターミナル出力を確認してください:

```bash
# 開発サーバーを起動しているターミナルで以下が表示されるはず:
API Key (先頭10文字): AIzaSyxxxx...
CSE ID: 52178dc6b9b454256
Google画像検索開始: query="pinterest ..."
```

**エラーログの例:**
```
Google Custom Search API error: { code: 403, message: "..." }
Status: 403
```

このログから、より詳細なエラー原因が分かります。

## 🔧 よくある原因と解決方法

### 原因1: 環境変数が読み込まれていない

**解決方法:**
1. `.env.local` ファイルが `app` ディレクトリ内にあるか確認
2. 開発サーバーを再起動
3. 環境変数名が正確か確認（大文字小文字も含めて）

### 原因2: APIキーが無効

**解決方法:**
1. Google Cloud Consoleで新しいAPIキーを作成
2. `.env.local` を更新
3. 開発サーバーを再起動

### 原因3: Custom Search JSON APIが有効化されていない

**解決方法:**
1. Google Cloud Consoleで「Custom Search JSON API」を有効化
2. 数分待ってから再度試す

### 原因4: APIキーの制限設定が問題

**解決方法:**
1. 一時的に「アプリケーションの制限」を「制限なし」に変更
2. 動作確認後、必要に応じて制限を再設定

## 📝 デバッグ手順

1. **環境変数の確認**
   ```bash
   cd ~/design_ai/app
   cat .env.local
   ```

2. **開発サーバーの再起動**
   ```bash
   npm run dev
   ```

3. **ブラウザで検索を実行**
   - 画像をアップロード
   - 検索軸を選択

4. **ターミナルのログを確認**
   - エラーメッセージの詳細を確認
   - 特に `Google Custom Search API error:` の後の内容

5. **Google Cloud Consoleで確認**
   - APIが有効化されているか
   - APIキーが正しいか
   - 制限設定が適切か

## 🆘 それでも解決しない場合

以下の情報を共有してください:

1. **ターミナルのエラーログ**（特に `Google Custom Search API error:` の後の内容）
2. **`.env.local` の設定**（APIキーは一部のみ、例: `AIzaSy...`）
3. **Google Cloud Consoleでの確認結果**
   - Custom Search JSON APIが有効か
   - APIキーの制限設定

