# インフラセットアップ手順書

## 📋 概要

GCP環境のセットアップ手順をまとめます。この手順に従って、イメージボード作成ツールのインフラを構築します。

---

## 🎯 セットアップの流れ

1. GCPプロジェクトの作成
2. 必要なAPIの有効化
3. 認証情報の設定（gcloud CLI）
4. Secret Managerの設定（Gemini APIキー管理）
5. Cloud Runの準備
6. Cloud Buildの設定
7. ローカル開発環境のセットアップ

---

## 1. GCPプロジェクトの作成

### 1.1 Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン

### 1.2 新規プロジェクトの作成

1. 画面上部のプロジェクト選択ドロップダウンをクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト情報を入力：
   - **プロジェクト名**: `design-ai`（任意の名前）
   - **組織**: （該当する場合）
   - **場所**: （該当する場合）
4. 「作成」をクリック
5. プロジェクトが作成されるまで待機（数秒〜1分）

### 1.3 プロジェクトIDの確認

- プロジェクト選択ドロップダウンで、作成したプロジェクトを選択
- プロジェクトIDをメモ（例: `design-ai-123456`）

---

## 2. 必要なAPIの有効化

### 2.1 APIとサービス > ライブラリにアクセス

1. 左メニューから「APIとサービス」>「ライブラリ」を選択

### 2.2 以下のAPIを有効化

以下のAPIを検索して有効化します：

#### 必須API
- ✅ **Cloud Run Admin API**
  - 検索: "Cloud Run"
  - 「有効にする」をクリック

- ✅ **Cloud Build API**
  - 検索: "Cloud Build"
  - 「有効にする」をクリック

- ✅ **Secret Manager API**
  - 検索: "Secret Manager"
  - 「有効にする」をクリック

- ✅ **Artifact Registry API**
  - 検索: "Artifact Registry"
  - 「有効にする」をクリック

#### オプションAPI（必要に応じて）
- **Cloud Logging API**（ログ確認用）
- **Cloud Monitoring API**（監視用）

### 2.3 課金アカウントのリンク

1. 左メニューから「課金」を選択
2. 課金アカウントをリンク（新規の場合は作成）
3. 無料トライアル（$300クレジット）を開始（推奨）

---

## 3. 認証情報の設定（gcloud CLI）

### 3.1 Google Cloud SDKのインストール

#### macOS
```bash
# Homebrewを使用
brew install google-cloud-sdk
```

#### その他のOS
- [公式インストールガイド](https://cloud.google.com/sdk/docs/install)を参照

### 3.2 gcloud CLIの初期化

```bash
# gcloud CLIを初期化
gcloud init

# プロンプトに従って設定：
# 1. ログイン（ブラウザが開きます）
# 2. プロジェクトを選択（作成したプロジェクトを選択）
# 3. デフォルトのリージョン/ゾーンを設定（例: asia-northeast1）
```

### 3.3 認証情報の確認

```bash
# 現在のプロジェクトを確認
gcloud config get-value project

# 認証情報を確認
gcloud auth list
```

### 3.4 アプリケーションのデフォルト認証情報を設定

```bash
# アプリケーションのデフォルト認証情報を設定
gcloud auth application-default login
```

---

## 4. Secret Managerの設定（Gemini APIキー管理）

### 4.1 Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. プロジェクトを選択（作成したGCPプロジェクト）
4. APIキーをコピー（後で使用します）

### 4.2 Secret ManagerにAPIキーを保存

```bash
# プロジェクトIDを環境変数に設定（実際のプロジェクトIDに置き換え）
export PROJECT_ID="design-ai-123456"

# Secret ManagerにAPIキーを保存
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --project=$PROJECT_ID \
  --data-file=-

# または、既存のシークレットを更新する場合
# echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
#   --project=$PROJECT_ID \
#   --data-file=-
```

**注意**: `YOUR_GEMINI_API_KEY` を実際のAPIキーに置き換えてください。

### 4.3 シークレットへのアクセス権限を設定

```bash
# Cloud Runサービスアカウントにアクセス権限を付与
gcloud secrets add-iam-policy-binding gemini-api-key \
  --project=$PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**注意**: `PROJECT_NUMBER` はプロジェクト番号に置き換えてください。
プロジェクト番号は以下で確認できます：

```bash
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
```

---

## 5. Cloud Runの準備

### 5.1 リージョンの設定

```bash
# デフォルトリージョンを設定（東京リージョン）
gcloud config set run/region asia-northeast1

# または、他のリージョンを選択
# gcloud config set run/region us-central1
```

### 5.2 サービスアカウントの確認

```bash
# デフォルトのサービスアカウントを確認
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
# 出力された番号を使用: PROJECT_NUMBER-compute@developer.gserviceaccount.com
```

---

## 6. Artifact Registryの設定（Dockerイメージ保存用）

### 6.1 リポジトリの作成

```bash
# Artifact Registryリポジトリを作成
gcloud artifacts repositories create design-ai-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Docker repository for design-ai"
```

### 6.2 Docker認証の設定

```bash
# Docker認証を設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

---

## 7. 環境変数の設定

### 7.1 ローカル開発用の環境変数ファイル

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_PROJECT_ID=design-ai-123456
```

**注意**: `.env.local` は `.gitignore` に追加してください。

### 7.2 Cloud Run用の環境変数

Cloud Runにデプロイする際は、Secret Managerから環境変数を読み込む設定を行います（後述のデプロイ手順で設定）。

---

## 8. 必要な権限の確認

### 8.1 現在のユーザーに必要な権限

以下のIAMロールが必要です：

- **Cloud Run Admin** (`roles/run.admin`)
- **Cloud Build Editor** (`roles/cloudbuild.builds.editor`)
- **Secret Manager Admin** (`roles/secretmanager.admin`)
- **Artifact Registry Writer** (`roles/artifactregistry.writer`)

### 8.2 権限の付与（必要に応じて）

```bash
# 現在のユーザーに権限を付与（管理者が実行）
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/secretmanager.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/artifactregistry.writer"
```

---

## 9. セットアップの確認

### 9.1 設定の確認

```bash
# 現在の設定を確認
gcloud config list

# プロジェクトIDを確認
gcloud config get-value project

# リージョンを確認
gcloud config get-value run/region
```

### 9.2 Secret Managerの確認

```bash
# シークレットの一覧を確認
gcloud secrets list

# シークレットの詳細を確認（値は表示されません）
gcloud secrets describe gemini-api-key
```

### 9.3 Artifact Registryの確認

```bash
# リポジトリの一覧を確認
gcloud artifacts repositories list
```

---

## 10. 予算アラートの設定（推奨）

### 10.1 予算の作成

1. [Cloud Console > 課金 > 予算とアラート](https://console.cloud.google.com/billing/budgets) にアクセス
2. 「予算を作成」をクリック
3. 設定：
   - **予算名**: `design-ai-monthly-budget`
   - **予算額**: ¥10,000（月額）
   - **アラート**: 50%, 90%, 100%で通知
4. 「作成」をクリック

### 10.2 アラート通知の設定

- メールアドレスを指定して通知を受け取る

---

## 11. 次のステップ

インフラのセットアップが完了したら、以下に進みます：

1. ✅ **Next.jsプロジェクトの作成**
2. ✅ **Dockerfileの作成**
3. ✅ **Cloud Runへのデプロイ設定**
4. ✅ **CI/CDパイプラインの構築**

---

## 📝 チェックリスト

セットアップが完了したか確認してください：

- [ ] GCPプロジェクトが作成された
- [ ] 必要なAPIが有効化された
- [ ] gcloud CLIがインストール・初期化された
- [ ] Gemini APIキーが取得された
- [ ] Secret ManagerにAPIキーが保存された
- [ ] Cloud Runのリージョンが設定された
- [ ] Artifact Registryリポジトリが作成された
- [ ] 予算アラートが設定された（推奨）

---

## 🔧 トラブルシューティング

### よくある問題

#### 1. APIが有効化されない
- プロジェクトが正しく選択されているか確認
- 課金アカウントがリンクされているか確認

#### 2. gcloudコマンドが実行できない
- `gcloud init` を再実行
- 認証情報を確認: `gcloud auth list`

#### 3. Secret Managerへのアクセスが拒否される
- IAM権限を確認
- サービスアカウントに適切な権限が付与されているか確認

#### 4. プロジェクト番号がわからない
```bash
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
```

---

## 📚 参考リンク

- [Google Cloud Console](https://console.cloud.google.com/)
- [gcloud CLI ドキュメント](https://cloud.google.com/sdk/docs)
- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Gemini API ドキュメント](https://ai.google.dev/docs)

---

## 💡 補足情報

### リージョンの選択

推奨リージョン：
- **asia-northeast1** (東京): 日本からのアクセスが速い
- **asia-northeast2** (大阪): 東京の代替
- **us-central1** (アイオワ): グローバルなアクセス

### セキュリティのベストプラクティス

1. **APIキーの管理**
   - Secret Managerを使用（実装済み）
   - 環境変数に直接記載しない

2. **IAM権限**
   - 最小権限の原則に従う
   - 必要最小限の権限のみ付与

3. **ネットワークセキュリティ**
   - Cloud RunはデフォルトでHTTPS
   - 必要に応じてVPC接続を検討

