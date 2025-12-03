# APIキーエラーのトラブルシューティング

## 🔍 問題の確認

「APIキーが設定されていません」というエラーが発生している場合、以下の点を確認してください。

## ✅ 確認手順

### 1. Secret ManagerにAPIキーが保存されているか確認

```bash
gcloud secrets versions list gemini-api-key --project park-ai-test
```

### 2. Cloud Runの環境変数設定を確認

```bash
gcloud run services describe design-ai \
  --region asia-northeast1 \
  --project park-ai-test \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### 3. サービスアカウントの権限を確認

```bash
gcloud secrets get-iam-policy gemini-api-key --project park-ai-test
```

### 4. ログを確認

```bash
gcloud run services logs read design-ai \
  --region asia-northeast1 \
  --project park-ai-test \
  --limit 50
```

## 🔧 解決方法

### 方法1: Secret Managerのバージョンを明示的に指定

```bash
gcloud run services update design-ai \
  --region asia-northeast1 \
  --project park-ai-test \
  --update-secrets GEMINI_API_KEY=gemini-api-key:1
```

### 方法2: Secret Managerに新しいAPIキーを保存

```bash
# 新しいAPIキーをSecret Managerに保存
echo -n "YOUR_NEW_API_KEY" | gcloud secrets versions add gemini-api-key \
  --project park-ai-test \
  --data-file=-

# Cloud Runを更新
gcloud run services update design-ai \
  --region asia-northeast1 \
  --project park-ai-test \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### 方法3: サービスアカウントに権限を付与

```bash
PROJECT_NUMBER=$(gcloud projects describe park-ai-test --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding gemini-api-key \
  --project park-ai-test \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 📝 注意事項

- Secret Managerのバージョンは `latest` または `1` を指定できます
- 環境変数の変更後、新しいリビジョンが作成されます
- 変更が反映されるまで数秒かかる場合があります

