# デプロイ手順書

## 📋 概要

Cloud Runへのデプロイ手順をまとめます。

---

## 🚀 デプロイ方法

### 方法1: 自動デプロイスクリプト（推奨）

```bash
# プロジェクトルートから実行
./scripts/deploy.sh
```

このスクリプトが以下を自動で実行します：
1. Dockerイメージのビルド
2. Artifact Registryへのプッシュ
3. Cloud Runへのデプロイ
4. 環境変数の設定（Secret Managerから）

### 方法2: 手動デプロイ

#### ステップ1: Dockerイメージのビルド

```bash
cd app

# プロジェクトIDとリージョンを設定
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1"
export IMAGE_NAME="design-ai-app"
export REPO_NAME="design-ai-repo"

# イメージのフルパス
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

# Dockerイメージをビルド
docker build -t ${IMAGE_URI} .
```

#### ステップ2: イメージをプッシュ

```bash
# Docker認証を設定（初回のみ）
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# イメージをプッシュ
docker push ${IMAGE_URI}
```

#### ステップ3: Cloud Runにデプロイ

```bash
# Secret Managerから環境変数を設定
SECRET_NAME="gemini-api-key"

# Cloud Runにデプロイ
gcloud run deploy design-ai \
  --image ${IMAGE_URI} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets GEMINI_API_KEY=${SECRET_NAME}:latest \
  --set-env-vars NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID} \
  --project ${PROJECT_ID}
```

---

## 🔧 環境変数の設定

### Secret Managerから環境変数を設定

Cloud Runでは、Secret Managerから環境変数を読み込むことができます：

```bash
gcloud run services update design-ai \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

### 通常の環境変数を設定

```bash
gcloud run services update design-ai \
  --update-env-vars NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID} \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

---

## 📊 デプロイの確認

### サービスの状態を確認

```bash
gcloud run services describe design-ai \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

### サービスのURLを取得

```bash
gcloud run services describe design-ai \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format="value(status.url)"
```

### ログを確認

```bash
gcloud run services logs read design-ai \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --limit 50
```

---

## 🔄 更新デプロイ

コードを更新した後、再度デプロイスクリプトを実行：

```bash
./scripts/deploy.sh
```

または、手動で：

```bash
# イメージを再ビルド・プッシュ
cd app
docker build -t ${IMAGE_URI} .
docker push ${IMAGE_URI}

# Cloud Runを更新
gcloud run deploy design-ai \
  --image ${IMAGE_URI} \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

---

## 🐛 トラブルシューティング

### デプロイが失敗する

1. **ログを確認**
   ```bash
   gcloud run services logs read design-ai --region ${REGION} --limit 100
   ```

2. **イメージが正しくビルドされているか確認**
   ```bash
   docker images | grep design-ai
   ```

3. **権限を確認**
   ```bash
   gcloud projects get-iam-policy ${PROJECT_ID}
   ```

### 環境変数が読み込まれない

1. **Secret Managerの権限を確認**
   ```bash
   gcloud secrets get-iam-policy gemini-api-key
   ```

2. **サービスアカウントに権限が付与されているか確認**
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
   gcloud projects get-iam-policy ${PROJECT_ID} \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
   ```

### アプリケーションが起動しない

1. **ローカルで動作確認**
   ```bash
   cd app
   npm run build
   npm start
   ```

2. **Dockerイメージをローカルでテスト**
   ```bash
   docker run -p 3000:3000 ${IMAGE_URI}
   ```

---

## 📝 デプロイ設定のカスタマイズ

### メモリとCPUの調整

```bash
gcloud run services update design-ai \
  --memory 1Gi \
  --cpu 2 \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

### 最小インスタンス数の設定

```bash
gcloud run services update design-ai \
  --min-instances 1 \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

### タイムアウトの設定

```bash
gcloud run services update design-ai \
  --timeout 300 \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

---

## 🔐 セキュリティ設定

### 認証を有効にする

```bash
gcloud run services update design-ai \
  --no-allow-unauthenticated \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

### VPC接続（必要に応じて）

```bash
gcloud run services update design-ai \
  --vpc-connector YOUR_VPC_CONNECTOR \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

---

## 📚 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Next.js デプロイガイド](https://nextjs.org/docs/deployment)
- [Docker ドキュメント](https://docs.docker.com/)

