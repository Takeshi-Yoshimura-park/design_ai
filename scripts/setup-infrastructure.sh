#!/bin/bash

# インフラセットアップスクリプト
# 使用方法: ./scripts/setup-infrastructure.sh

set -e

echo "🚀 インフラセットアップを開始します..."

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# プロジェクトIDの確認
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ プロジェクトIDが設定されていません${NC}"
    echo "gcloud init を実行してプロジェクトを設定してください"
    exit 1
fi

echo -e "${GREEN}✓ プロジェクトID: $PROJECT_ID${NC}"

# プロジェクト番号の取得
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo -e "${GREEN}✓ プロジェクト番号: $PROJECT_NUMBER${NC}"

# 1. 必要なAPIの有効化
echo ""
echo -e "${YELLOW}📦 必要なAPIを有効化しています...${NC}"

APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "secretmanager.googleapis.com"
    "artifactregistry.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo "  - $API を有効化中..."
    gcloud services enable $API --project=$PROJECT_ID 2>/dev/null || echo "    (既に有効化済み)"
done

echo -e "${GREEN}✓ APIの有効化が完了しました${NC}"

# 2. Artifact Registryリポジトリの作成
echo ""
echo -e "${YELLOW}📦 Artifact Registryリポジトリを作成しています...${NC}"

REGION="asia-northeast1"
REPO_NAME="design-ai-repo"

# リポジトリが存在するか確認
if gcloud artifacts repositories describe $REPO_NAME \
    --location=$REGION \
    --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}✓ リポジトリは既に存在します${NC}"
else
    gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for design-ai" \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ リポジトリを作成しました${NC}"
fi

# Docker認証の設定
echo "  - Docker認証を設定中..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
echo -e "${GREEN}✓ Docker認証を設定しました${NC}"

# 3. Secret Managerの設定
echo ""
echo -e "${YELLOW}🔐 Secret Managerの設定...${NC}"

SECRET_NAME="gemini-api-key"

# シークレットが存在するか確認
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠ シークレット '$SECRET_NAME' は既に存在します${NC}"
    read -p "既存のシークレットを更新しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "新しいAPIキーを入力してください:"
        read -s API_KEY
        echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME \
            --project=$PROJECT_ID \
            --data-file=-
        echo -e "${GREEN}✓ シークレットを更新しました${NC}"
    fi
else
    echo "Gemini APIキーを入力してください:"
    read -s API_KEY
    echo -n "$API_KEY" | gcloud secrets create $SECRET_NAME \
        --project=$PROJECT_ID \
        --data-file=-
    echo -e "${GREEN}✓ シークレットを作成しました${NC}"
fi

# 4. サービスアカウントへの権限付与
echo ""
echo -e "${YELLOW}🔑 サービスアカウントに権限を付与しています...${NC}"

SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo -e "${GREEN}✓ 権限を付与しました${NC}"

# 5. Cloud Runのリージョン設定
echo ""
echo -e "${YELLOW}🌍 Cloud Runのリージョンを設定しています...${NC}"

gcloud config set run/region $REGION
echo -e "${GREEN}✓ リージョンを $REGION に設定しました${NC}"

# 6. 設定の確認
echo ""
echo -e "${YELLOW}✅ 設定を確認しています...${NC}"

echo ""
echo "=== 現在の設定 ==="
echo "プロジェクトID: $PROJECT_ID"
echo "プロジェクト番号: $PROJECT_NUMBER"
echo "リージョン: $REGION"
echo "サービスアカウント: $SERVICE_ACCOUNT"
echo ""

# 完了メッセージ
echo -e "${GREEN}🎉 インフラセットアップが完了しました！${NC}"
echo ""
echo "次のステップ:"
echo "1. Next.jsプロジェクトを作成"
echo "2. Dockerfileを作成"
echo "3. Cloud Runにデプロイ"
echo ""
echo "詳細は infrastructure-setup.md を参照してください"

