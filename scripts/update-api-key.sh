#!/bin/bash

# Secret ManagerのAPIキーを更新するスクリプト
# 使用方法: ./scripts/update-api-key.sh

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
    exit 1
fi

echo -e "${GREEN}✓ プロジェクトID: $PROJECT_ID${NC}"
echo ""
echo -e "${YELLOW}Gemini APIキーを入力してください:${NC}"
read -s API_KEY

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ APIキーが入力されていません${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Secret ManagerにAPIキーを保存しています...${NC}"

# Secret ManagerにAPIキーを保存
echo -n "$API_KEY" | gcloud secrets versions add gemini-api-key \
  --project=$PROJECT_ID \
  --data-file=-

echo -e "${GREEN}✓ APIキーを保存しました${NC}"

echo ""
echo -e "${YELLOW}Cloud Runサービスを更新しています...${NC}"

# Cloud Runを更新
gcloud run services update design-ai \
  --region asia-northeast1 \
  --project $PROJECT_ID \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest

echo ""
echo -e "${GREEN}🎉 更新が完了しました！${NC}"
echo ""
echo "数秒待ってから、再度アプリケーションを試してください。"

