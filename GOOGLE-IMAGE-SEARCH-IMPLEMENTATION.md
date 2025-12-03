# Google Custom Search API実装完了

## ✅ 実装完了内容

### 1. 新しいファイル

- **`app/lib/google-image-search.ts`**: Google Custom Search APIクライアントの実装
- **`app/app/api/search/google-images/route.ts`**: Next.js API Route
- **`GOOGLE-IMAGE-SEARCH-DESIGN.md`**: 実装設計書
- **`GOOGLE-IMAGE-SEARCH-SETUP.md`**: セットアップガイド

### 2. 更新されたファイル

- **`app/lib/pinterest-queries.ts`**: クエリ生成ロジックを拡張（`pinterest` キーワードを追加）
- **`app/app/page.tsx`**: 検索APIエンドポイントを `/api/search/google-images` に変更
- **`app/components/DraggableImageGrid.tsx`**: コメントを更新（Google画像検索用であることを明記）

---

## 🔄 主な変更点

### Pinterest API → Google Custom Search API

**変更前:**
- Pinterest APIを使用（OAuth認証が必要）
- `/api/search/pinterest` エンドポイント

**変更後:**
- Google Custom Search JSON APIを使用（APIキーのみで利用可能）
- `/api/search/google-images` エンドポイント
- クエリに `pinterest` キーワードを自動追加して、Pinterestの画像を優先的に取得

### メリット

1. **セットアップの簡素化**: OAuth認証フローが不要、APIキーとCSE IDのみで利用可能
2. **Pinterest中心の検索体験**: `pinterest` キーワードを追加することで、Pinterestの画像が優先的に表示される
3. **既存UIの再利用**: `DraggableImageGrid` コンポーネントをそのまま使用可能
4. **法的リスクの軽減**: Google公式APIを使用し、利用規約に準拠
5. **コスト効率**: 1日100クエリまで無料（想定使用量: 1日5回程度）

---

## 📋 次のステップ

### 1. Google Custom Search APIのセットアップ

詳細は `GOOGLE-IMAGE-SEARCH-SETUP.md` を参照してください。

**必要な作業:**
1. Google Cloud ConsoleでCustom Search JSON APIを有効化
2. Programmable Search Engineを作成（画像検索を有効化）
3. APIキーを作成
4. 環境変数の設定

### 2. 環境変数の設定

#### ローカル開発環境（.env.local）

```bash
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_cse_id_here
```

#### GCP Secret Manager（本番環境）

```bash
# APIキーを保存
echo -n "your_api_key_here" | gcloud secrets create google-custom-search-api-key \
  --data-file=- \
  --project=park-ai-test

# CSE IDを保存
echo -n "your_cse_id_here" | gcloud secrets create google-custom-search-engine-id \
  --data-file=- \
  --project=park-ai-test
```

### 3. Cloud Runの環境変数設定

```bash
gcloud run services update design-ai \
  --update-secrets=GOOGLE_CUSTOM_SEARCH_API_KEY=google-custom-search-api-key:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=google-custom-search-engine-id:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

### 4. 動作確認

1. ローカル環境でテスト
2. デプロイして本番環境でテスト

---

## 🔍 検索クエリの生成ロジック

### クエリ生成の例

- **カラー軸**: `pinterest 白 ベージュ グレー インテリア デザイン`
- **質感軸**: `pinterest モダン インテリア デザイン`
- **トーン軸**: `pinterest 明るい ナチュラル インテリア デザイン`
- **レイアウト軸**: `pinterest シンプル レイアウト インテリア デザイン`

### Pinterestを優先する仕組み

- すべてのクエリに `pinterest` キーワードを自動追加
- これにより、Google画像検索でPinterestの画像が優先的に表示される
- 必要に応じて、`site:pinterest.com` を使用してPinterestのみに絞ることも可能

---

## ⚠️ 注意事項

### APIキーのセキュリティ

- APIキーを公開リポジトリにコミットしない
- APIキーの制限を設定する（HTTP リファラー、APIの制限）
- Secret Managerを使用して本番環境で管理する

### レート制限

- 無料枠: 1日100クエリまで無料
- 想定使用量: 1日5回程度 → 完全に無料枠内

### 利用規約の遵守

- Google Custom Search APIの利用規約を確認し、遵守してください
- 取得した画像の使用目的や保存方法について注意が必要です
- 必要に応じて、「Powered by Google」などの表記をUIに追加してください

---

## 🐛 トラブルシューティング

### エラー: "Google Custom Search APIの設定が完了していません"

- `.env.local` または Secret Managerに環境変数が設定されているか確認
- 環境変数名が正しいか確認

### エラー: "Google Custom Search APIの認証に失敗しました"

- APIキーが正しいか確認
- Custom Search JSON APIが有効化されているか確認
- APIキーの制限設定を確認

### 検索結果が表示されない

- 検索クエリを確認（`pinterest` キーワードが含まれているか）
- CSE IDが正しいか確認
- 検索エンジンの設定を確認（画像検索が有効になっているか）

---

## 📚 参考資料

- `GOOGLE-IMAGE-SEARCH-DESIGN.md`: 実装設計の詳細
- `GOOGLE-IMAGE-SEARCH-SETUP.md`: セットアップガイド
- [Google Custom Search JSON API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)

