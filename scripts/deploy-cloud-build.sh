#!/bin/bash

# Cloud Buildを使用したデプロイスクリプト
# 使用方法: ./scripts/deploy-cloud-build.sh

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

# Cloud Build APIが有効化されているか確認
echo ""
echo -e "${YELLOW}🔍 Cloud Build APIの確認...${NC}"
if ! gcloud services list --enabled --filter="name:cloudbuild.googleapis.com" --format="value(name)" | grep -q cloudbuild; then
    echo -e "${YELLOW}⚠ Cloud Build APIを有効化しています...${NC}"
    gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
fi

echo ""
echo -e "${YELLOW}🚀 Cloud Buildでデプロイを開始します...${NC}"
echo ""

# Cloud Buildを実行
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID

echo ""
echo -e "${GREEN}🎉 デプロイが完了しました！${NC}"

# サービスのURLを取得
REGION="asia-northeast1"
SERVICE_NAME="design-ai"

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo ""
    echo "サービスURL: ${SERVICE_URL}"
    echo ""
    echo "ブラウザでアクセスして確認してください:"
    echo "  ${SERVICE_URL}"
else
    echo ""
    echo "サービスのURLを取得できませんでした。"
    echo "以下のコマンドで確認してください:"
    echo "  gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)'"
fi

