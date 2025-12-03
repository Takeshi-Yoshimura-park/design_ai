#!/bin/bash

# Cloud Runへのデプロイスクリプト
# 使用方法: ./scripts/deploy.sh

set -e

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# プロジェクトIDの取得
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ プロジェクトIDが設定されていません${NC}"
    echo "gcloud config set project YOUR_PROJECT_ID を実行してください"
    exit 1
fi

echo -e "${GREEN}✓ プロジェクトID: $PROJECT_ID${NC}"

# リージョンの設定
REGION="asia-northeast1"
SERVICE_NAME="design-ai"
IMAGE_NAME="design-ai-app"
REPO_NAME="design-ai-repo"

# イメージのフルパス
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo ""
echo -e "${YELLOW}📦 Dockerイメージをビルドしています...${NC}"

# Dockerイメージをビルド（amd64プラットフォーム用）
cd app
docker build --platform linux/amd64 -t ${IMAGE_URI} .

echo -e "${GREEN}✓ イメージのビルドが完了しました${NC}"

echo ""
echo -e "${YELLOW}📤 Dockerイメージをプッシュしています...${NC}"

# イメージをプッシュ
docker push ${IMAGE_URI}

echo -e "${GREEN}✓ イメージのプッシュが完了しました${NC}"

echo ""
echo -e "${YELLOW}🚀 Cloud Runにデプロイしています...${NC}"

# Secret Managerから環境変数を取得する設定
SECRET_NAME="gemini-api-key"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Cloud Runにデプロイ
gcloud run deploy ${SERVICE_NAME} \
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

echo ""
echo -e "${GREEN}🎉 デプロイが完了しました！${NC}"

# サービスのURLを取得
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format="value(status.url)")

echo ""
echo "サービスURL: ${SERVICE_URL}"
echo ""
echo "ブラウザでアクセスして確認してください:"
echo "  ${SERVICE_URL}"

