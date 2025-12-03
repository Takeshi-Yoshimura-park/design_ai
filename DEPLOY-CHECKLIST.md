# デプロイ前チェックリスト

## ✅ デプロイ前の確認事項

### 1. 環境変数の確認
- [ ] `.env.local` にGemini APIキーが設定されている（ローカル開発用）
- [ ] Secret ManagerにGemini APIキーが保存されている（本番環境用）
- [ ] GCPプロジェクトIDが正しく設定されている

### 2. GCP環境の確認
- [ ] GCPプロジェクトが作成されている
- [ ] 必要なAPIが有効化されている
  - [ ] Cloud Run Admin API
  - [ ] Cloud Build API
  - [ ] Secret Manager API
  - [ ] Artifact Registry API
- [ ] Artifact Registryリポジトリが作成されている
- [ ] Secret ManagerにAPIキーが保存されている

### 3. ローカルでの動作確認
- [ ] 開発サーバーで正常に動作する
- [ ] 画像アップロードが動作する
- [ ] 画像分析が動作する
- [ ] Pinterest検索が動作する（またはエラーハンドリングが適切）

### 4. ビルドの確認
- [ ] `npm run build` が成功する
- [ ] ビルドエラーがない
- [ ] TypeScriptの型エラーがない

### 5. Dockerイメージの確認
- [ ] Dockerがインストールされている
- [ ] Dockerイメージがビルドできる
- [ ] ローカルでDockerイメージが動作する（オプション）

## 🚀 デプロイ手順

### ステップ1: 環境変数の確認

```bash
# Secret ManagerにAPIキーが保存されているか確認
gcloud secrets describe gemini-api-key --project=YOUR_PROJECT_ID
```

### ステップ2: デプロイスクリプトの実行

```bash
# プロジェクトルートから実行
./scripts/deploy.sh
```

### ステップ3: デプロイ後の確認

1. サービスURLにアクセス
2. 画像をアップロードして動作確認
3. エラーログを確認（必要に応じて）

## 📝 デプロイ後の確認事項

- [ ] サービスが正常に起動している
- [ ] 画像アップロードが動作する
- [ ] 画像分析が動作する
- [ ] Pinterest検索が動作する（または適切なエラーメッセージが表示される）
- [ ] ログにエラーがない

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. **ログを確認**
   ```bash
   gcloud run services logs read design-ai --region asia-northeast1 --limit 100
   ```

2. **環境変数を確認**
   ```bash
   gcloud run services describe design-ai --region asia-northeast1 --format="value(spec.template.spec.containers[0].env)"
   ```

3. **Secret Managerの権限を確認**
   ```bash
   gcloud secrets get-iam-policy gemini-api-key
   ```

### サービスが起動しない場合

1. **メモリ不足の可能性**
   - Cloud Runのメモリを増やす（512Mi → 1Gi）

2. **タイムアウトの可能性**
   - タイムアウト時間を増やす

3. **環境変数の問題**
   - Secret Managerから正しく読み込まれているか確認

## 📊 デプロイ後のモニタリング

### ログの確認

```bash
# リアルタイムでログを確認
gcloud run services logs tail design-ai --region asia-northeast1
```

### メトリクスの確認

```bash
# サービスの状態を確認
gcloud run services describe design-ai --region asia-northeast1
```

## 💰 コスト確認

デプロイ後、GCPの課金ダッシュボードでコストを確認してください。

- Cloud Runの使用量
- Gemini APIの使用量
- その他のサービス

予算アラートが設定されていることを確認してください。

