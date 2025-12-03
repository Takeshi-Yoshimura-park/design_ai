# Pinterest API移行完了

## ✅ 実装完了内容

### 1. 新しいファイル

- **`app/lib/pinterest-api.ts`**: Pinterest APIクライアントの実装
- **`app/lib/pinterest-queries.ts`**: 検索クエリ生成ロジック（分離）
- **`PINTEREST-API-DESIGN.md`**: 実装設計書
- **`PINTEREST-API-SETUP.md`**: セットアップガイド

### 2. 更新されたファイル

- **`app/app/api/search/pinterest/route.ts`**: Pinterest APIを使用するように変更
- **`app/components/DraggableImageGrid.tsx`**: 画像プロキシAPIを削除し、直接URLを使用
- **`app/package.json`**: 不要な依存関係を削除
  - `puppeteer-core`
  - `@sparticuz/chromium`
  - `cheerio`
- **`app/Dockerfile`**: Chromium関連の依存関係を削除

### 3. 削除されたファイル

- **`app/lib/pinterest.ts`**: スクレイピング版（削除）
- **`app/app/api/image-proxy/route.ts`**: 画像プロキシAPI（削除）

---

## 🔄 主な変更点

### スクレイピング → Pinterest API

**変更前:**
- PuppeteerでPinterest検索ページを開く
- HTMLから画像URLを抽出
- 画像プロキシAPIでCORS問題を回避

**変更後:**
- Pinterest APIの `/v5/search/pins` エンドポイントを使用
- 公式APIから画像URLとピンURLを取得
- 直接画像URLを使用（CORS問題なし）

### メリット

1. **法的リスクの軽減**: 公式APIを使用するため、利用規約に準拠
2. **技術的な安定性**: HTML構造の変更に影響されない
3. **実装の簡素化**: Puppeteerが不要、エラーハンドリングがシンプル
4. **コスト削減**: Cloud Runのリソース使用量が削減（メモリ512Miに削減可能）

---

## 📋 次のステップ

### 1. Pinterest APIのセットアップ

詳細は `PINTEREST-API-SETUP.md` を参照してください。

**必要な作業:**
1. Pinterestビジネスアカウントの作成
2. アプリケーションの登録
3. アクセストークンの取得
4. Secret Managerへの保存

### 2. 環境変数の設定

#### ローカル開発環境（.env.local）

```bash
PINTEREST_ACCESS_TOKEN=pina_xxxxxxxxxxxxx
```

#### GCP Secret Manager（本番環境）

```bash
echo -n "pina_xxxxxxxxxxxxx" | gcloud secrets create pinterest-access-token \
  --data-file=- \
  --project=park-ai-test
```

### 3. Cloud Runの環境変数設定

```bash
gcloud run services update design-ai \
  --update-secrets=PINTEREST_ACCESS_TOKEN=pinterest-access-token:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

### 4. 動作確認

1. ローカル環境でテスト
2. デプロイして本番環境でテスト

---

## ⚠️ 注意事項

### アクセストークンの有効期限

- アクセストークンには有効期限があります（通常30日間）
- 有効期限が切れた場合は、リフレッシュトークンを使用して更新する必要があります

### APIのレート制限

- Pinterest APIにはレート制限があります
- 1日5回程度の使用であれば問題ありません

### 利用規約の遵守

- Pinterest APIの利用規約を確認し、遵守してください

---

## 🐛 トラブルシューティング

### エラー: "Pinterest APIのアクセストークンが設定されていません"

- `.env.local` または Secret Managerにアクセストークンが設定されているか確認
- 環境変数名が `PINTEREST_ACCESS_TOKEN` であることを確認

### エラー: "Pinterest APIの認証に失敗しました"

- アクセストークンが正しいか確認
- アクセストークンの有効期限が切れていないか確認

### エラー: "APIのレート制限に達しました"

- しばらく待ってから再度お試しください
- 1日の使用回数を確認してください

---

## 📚 参考資料

- `PINTEREST-API-DESIGN.md`: 実装設計の詳細
- `PINTEREST-API-SETUP.md`: セットアップガイド
- [Pinterest API Documentation](https://developers.pinterest.com/docs/api/v5/)

