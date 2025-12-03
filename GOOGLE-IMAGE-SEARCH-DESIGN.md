# Google Custom Search API実装設計

## 📋 概要

Pinterest APIの代わりに、Google Custom Search JSON API（画像検索）を使用して、Pinterestを含む画像検索結果を取得し、ツール内で表示する設計です。

---

## 🎯 設計の目的

1. **Pinterest APIのセットアップ時間を短縮**: OAuth認証フローが不要で、APIキーとCSE IDのみで利用可能
2. **Pinterest中心の検索体験**: `site:pinterest.com` をクエリに含めることで、Pinterestの画像を優先的に取得
3. **既存UIの再利用**: 現在の `DraggableImageGrid` コンポーネントをそのまま使用可能
4. **法的リスクの軽減**: Google公式APIを使用し、利用規約に準拠

---

## 🏗️ アーキテクチャ

### データフロー

```
1. ユーザーが画像をアップロード
   ↓
2. Gemini APIで画像分析（既存）
   ↓
3. 分析結果から検索クエリを生成（既存のgenerateSearchQueryを拡張）
   ↓
4. Google Custom Search JSON APIで画像検索
   - クエリ: "pinterest {色/トーン/レイアウト} インテリア デザイン"
   - または: "site:pinterest.com {色/トーン/レイアウト} インテリア デザイン"
   ↓
5. APIレスポンスを既存のPinterestImage型に変換
   ↓
6. DraggableImageGridで表示（既存コンポーネントをそのまま使用）
```

---

## 🔧 技術仕様

### 1. Google Custom Search JSON API

#### エンドポイント
```
GET https://www.googleapis.com/customsearch/v1
```

#### パラメータ
- `key`: APIキー（Google Cloud Consoleで取得）
- `cx`: Custom Search Engine ID（Programmable Search Engineで作成）
- `q`: 検索クエリ
- `searchType`: `image`（画像検索を指定）
- `num`: 取得する画像数（1-10、デフォルト: 10）
- `safe`: セーフサーチ設定（`active` 推奨）

#### レスポンス構造
```json
{
  "items": [
    {
      "title": "画像のタイトル",
      "link": "https://www.pinterest.com/pin/...",
      "displayLink": "www.pinterest.com",
      "snippet": "画像の説明",
      "image": {
        "contextLink": "https://www.pinterest.com/pin/...",
        "height": 564,
        "width": 564,
        "byteSize": 12345,
        "thumbnailLink": "https://i.pinimg.com/236x/...",
        "thumbnailHeight": 236,
        "thumbnailWidth": 236
      }
    }
  ]
}
```

---

### 2. 実装ファイル構成

#### 新規作成
- `app/lib/google-image-search.ts`: Google Custom Search APIクライアント
- `app/app/api/search/google-images/route.ts`: Next.js API Route

#### 更新
- `app/lib/pinterest-queries.ts`: クエリ生成ロジックを拡張（`pinterest` キーワードを追加）
- `app/components/SearchAxisSelector.tsx`: 検索軸選択時にGoogle画像検索を呼び出すように変更
- `app/app/page.tsx`: 検索APIのエンドポイントを変更

---

### 3. 型定義

```typescript
// app/lib/google-image-search.ts

export interface GoogleImageSearchResult {
  title: string;
  link: string; // 元のページURL（Pinterestのピンページなど）
  displayLink: string; // ドメイン名（例: "www.pinterest.com"）
  snippet: string;
  image: {
    contextLink: string; // 画像が含まれるページURL
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string; // サムネイル画像URL
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

export interface GoogleImageSearchResponse {
  items?: GoogleImageSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

// 既存のPinterestImage型と互換性を保つ
export interface PinterestImage {
  url: string; // 高解像度画像URL
  thumbnailUrl: string; // サムネイル画像URL
  alt: string; // 画像の説明
  pinterestUrl: string; // 元のページURL（Pinterestのピンページなど）
}
```

---

### 4. クエリ生成ロジックの拡張

```typescript
// app/lib/pinterest-queries.ts を拡張

export function generateSearchQuery(
  analysisResult: any,
  axis: 'color' | 'texture' | 'tone' | 'layout',
  includePinterest: boolean = true // Pinterestを優先するか
): string {
  let baseQuery = '';
  
  switch (axis) {
    case 'color':
      if (analysisResult.colors && analysisResult.colors.length > 0) {
        const colorNames = analysisResult.colors
          .map((c: any) => c.name || c.hex)
          .slice(0, 3)
          .join(' ');
        baseQuery = `${colorNames} インテリア デザイン`;
      } else {
        baseQuery = 'インテリア デザイン';
      }
      break;

    case 'texture':
      const texture = analysisResult.texture || analysisResult.style || '';
      baseQuery = `${texture} インテリア デザイン`;
      break;

    case 'tone':
      const tone = analysisResult.tone || '';
      const keywords = analysisResult.moodKeywords || [];
      const toneQuery = tone || keywords.join(' ');
      baseQuery = `${toneQuery} インテリア デザイン`;
      break;

    case 'layout':
      const layout = analysisResult.layout || '';
      baseQuery = `${layout} レイアウト インテリア デザイン`;
      break;

    default:
      baseQuery = 'インテリア デザイン';
  }

  // Pinterestを優先する場合、クエリに追加
  if (includePinterest) {
    // オプション1: "pinterest" キーワードを追加
    return `pinterest ${baseQuery}`;
    
    // オプション2: site:pinterest.com を使用（より厳密にPinterestのみ）
    // return `site:pinterest.com ${baseQuery}`;
  }

  return baseQuery;
}
```

---

### 5. API Route実装

```typescript
// app/app/api/search/google-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleImages } from '@/lib/google-image-search';
import { generateSearchQuery } from '@/lib/pinterest-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisResult, axis } = body;

    if (!analysisResult || !axis) {
      return NextResponse.json(
        { error: '分析結果と検索軸が必要です' },
        { status: 400 }
      );
    }

    // 検索軸のバリデーション
    const validAxes = ['color', 'texture', 'tone', 'layout'];
    if (!validAxes.includes(axis)) {
      return NextResponse.json(
        { error: '無効な検索軸です' },
        { status: 400 }
      );
    }

    // APIキーとCSE IDの取得
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !cseId) {
      return NextResponse.json(
        { error: 'Google Custom Search APIの設定が完了していません' },
        { status: 500 }
      );
    }

    // 検索クエリを生成
    const query = generateSearchQuery(analysisResult, axis, true);

    // Google画像検索を実行
    const images = await searchGoogleImages(query, apiKey, cseId, 5);

    console.log(`Google画像検索結果: ${images.length}枚の画像を取得`);

    return NextResponse.json({
      success: true,
      query: query,
      images: images,
    });
  } catch (error: any) {
    console.error('Google image search error:', error);
    
    let errorMessage = '検索に失敗しました。別の検索軸をお試しください';
    let statusCode = 500;
    
    if (error.message?.includes('APIキー')) {
      errorMessage = 'Google Custom Search APIの認証に失敗しました。APIキーを確認してください';
      statusCode = 401;
    } else if (error.message?.includes('レート制限')) {
      errorMessage = 'APIのレート制限に達しました。しばらく待ってから再度お試しください';
      statusCode = 429;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
```

---

## 🔑 セットアップ要件

### 1. Google Cloud Console

1. **プロジェクトの作成または選択**
   - https://console.cloud.google.com/ にアクセス
   - 既存のプロジェクト（`park-ai-test`）を使用

2. **Custom Search JSON APIの有効化**
   - 「APIとサービス」→「ライブラリ」
   - 「Custom Search JSON API」を検索して有効化

3. **APIキーの作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」
   - APIキーをコピー（後で環境変数に設定）

### 2. Programmable Search Engine

1. **検索エンジンの作成**
   - https://programmablesearchengine.google.com/ にアクセス
   - 「検索エンジンを追加」をクリック

2. **設定**
   - **検索エンジン名**: `Design AI Image Search`
   - **検索対象**: 
     - オプション1: 「全ウェブを検索」（推奨）
     - オプション2: 「特定のサイト」→ `pinterest.com` を指定
   - **言語**: 日本語
   - **画像検索**: 有効にする

3. **検索エンジンID（CSE ID）を取得**
   - 作成後、検索エンジンの設定画面で「検索エンジンID」をコピー

### 3. 環境変数の設定

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

#### Cloud Runの環境変数設定

```bash
gcloud run services update design-ai \
  --update-secrets=GOOGLE_CUSTOM_SEARCH_API_KEY=google-custom-search-api-key:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=google-custom-search-engine-id:latest \
  --project=park-ai-test \
  --region=asia-northeast1
```

---

## 💰 コスト見積もり

### Google Custom Search JSON API

- **無料枠**: 1日100クエリまで無料
- **超過分**: $5 / 1,000クエリ
- **想定使用量**: 1日5回 × 30日 = 150クエリ/月
- **想定コスト**: **¥0**（無料枠内）

### 結論

- **検証フェーズ**: **¥0/月**
- **本番運用時（参考）**: 1日100回まで無料枠内のため、通常の使用ではコストは発生しません

---

## ⚠️ 注意事項

### 1. 利用規約の遵守

- Google Custom Search APIの利用規約を確認し、遵守してください
- 取得した画像の使用目的や保存方法について注意が必要です
- 必要に応じて、「Powered by Google」などの表記をUIに追加

### 2. 画像のライセンス

- Google画像検索で取得した画像は、元のサイト（Pinterestなど）のライセンスに従います
- 画像を長期保存・再配布しないよう注意
- クリックした際は、元のページ（Pinterestのピンページなど）に遷移させる

### 3. 検索結果の品質

- `site:pinterest.com` を使用すると、Pinterestの画像のみが表示されますが、結果数が少なくなる可能性があります
- 最初は `pinterest` キーワードのみを使用し、必要に応じて `site:pinterest.com` に切り替えることを推奨

---

## 🚀 実装のステップ

1. **Google Custom Search APIのセットアップ**
   - APIキーとCSE IDの取得
   - 環境変数の設定

2. **Google画像検索クライアントの実装**
   - `app/lib/google-image-search.ts` の作成

3. **API Routeの実装**
   - `app/app/api/search/google-images/route.ts` の作成

4. **クエリ生成ロジックの拡張**
   - `app/lib/pinterest-queries.ts` の更新

5. **フロントエンドの統合**
   - `app/app/page.tsx` の更新（検索APIエンドポイントを変更）

6. **テストとデプロイ**
   - ローカル環境でのテスト
   - 本番環境へのデプロイ

---

## 📚 参考資料

- [Google Custom Search JSON API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)
- [Custom Search JSON API Pricing](https://developers.google.com/custom-search/v1/overview#pricing)

