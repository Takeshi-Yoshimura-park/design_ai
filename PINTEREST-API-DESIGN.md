# Pinterest API実装設計

## 📋 要件

- **接続方式**: 管理者アカウント1つで固定運用（社内ツール向け）
- **取得情報**: 画像サムネイル + PinterestのURL
- **利用頻度**: 1日あたり多くても5回程度

---

## 🔑 Pinterest APIの基本情報

### APIバージョン
- **v5**（最新版）

### 認証方式
- **OAuth 2.0**
- **アクセストークン**を使用

### 主要エンドポイント
- **ピン検索**: `GET /v5/search/pins`
- **アクセストークン取得**: OAuth 2.0フロー

---

## 🏗️ 実装設計

### 1. Pinterest APIのセットアップ

#### 必要な情報
1. **Pinterest開発者アカウント**
2. **アプリ登録**
   - アプリ名、リダイレクトURIなどを設定
   - クライアントID、クライアントシークレットを取得
3. **アクセストークンの取得**
   - OAuth 2.0フローでアクセストークンを取得
   - リフレッシュトークンも取得（トークンの有効期限が切れた場合に使用）

#### アクセストークンの管理
- **Secret Manager**に保存
  - `PINTEREST_ACCESS_TOKEN`: アクセストークン
  - `PINTEREST_REFRESH_TOKEN`: リフレッシュトークン（オプション）
  - `PINTEREST_CLIENT_ID`: クライアントID
  - `PINTEREST_CLIENT_SECRET`: クライアントシークレット

---

### 2. APIエンドポイントの設計

#### `/api/search/pinterest` (POST) - 変更

**変更前（スクレイピング）:**
- PuppeteerでPinterest検索ページを開く
- HTMLから画像URLを抽出

**変更後（Pinterest API）:**
- Pinterest APIの `/v5/search/pins` エンドポイントを呼び出す
- レスポンスから画像URLとピンURLを取得

**リクエスト例:**
```typescript
GET https://api.pinterest.com/v5/search/pins?query={検索クエリ}&limit=5
Headers:
  Authorization: Bearer {アクセストークン}
```

**レスポンス例:**
```json
{
  "items": [
    {
      "id": "pin_id",
      "media": {
        "images": {
          "236x": {
            "url": "https://i.pinimg.com/236x/...jpg",
            "width": 236,
            "height": 236
          },
          "564x": {
            "url": "https://i.pinimg.com/564x/...jpg",
            "width": 564,
            "height": 564
          }
        }
      },
      "link": "https://www.pinterest.jp/pin/{pin_id}/",
      "title": "画像のタイトル"
    }
  ]
}
```

---

### 3. 実装の詳細

#### 3.1 ライブラリの追加

```bash
npm install axios
# または既存のaxiosを使用
```

#### 3.2 Pinterest APIクライアントの実装

```typescript
// app/lib/pinterest-api.ts
import axios from 'axios';

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

interface PinterestPin {
  id: string;
  media: {
    images: {
      '236x'?: { url: string; width: number; height: number };
      '564x'?: { url: string; width: number; height: number };
      'originals'?: { url: string; width: number; height: number };
    };
  };
  link: string;
  title?: string;
}

interface PinterestSearchResponse {
  items: PinterestPin[];
}

/**
 * Pinterest APIでピンを検索
 */
export async function searchPinterestPins(
  query: string,
  accessToken: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  try {
    const response = await axios.get<PinterestSearchResponse>(
      `${PINTEREST_API_BASE}/search/pins`,
      {
        params: {
          query: query,
          limit: limit,
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 10000,
      }
    );

    const images: PinterestImage[] = response.data.items.map((pin) => {
      // 高解像度画像を優先的に使用
      const imageUrl = 
        pin.media.images['564x']?.url ||
        pin.media.images['originals']?.url ||
        pin.media.images['236x']?.url ||
        '';

      return {
        url: imageUrl,
        thumbnailUrl: pin.media.images['236x']?.url || imageUrl,
        alt: pin.title || query,
        pinterestUrl: pin.link,
      };
    });

    return images;
  } catch (error: any) {
    console.error('Pinterest API error:', error.response?.data || error.message);
    throw new Error(`Pinterest検索に失敗しました: ${error.message}`);
  }
}
```

#### 3.3 API Routeの変更

```typescript
// app/app/api/search/pinterest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchPinterestPins } from '@/lib/pinterest-api';
import { generateSearchQuery } from '@/lib/pinterest';

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

    // アクセストークンの取得
    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Pinterest APIのアクセストークンが設定されていません' },
        { status: 500 }
      );
    }

    // 検索クエリを生成
    const query = generateSearchQuery(analysisResult, axis);

    // Pinterest APIで検索
    const images = await searchPinterestPins(query, accessToken, 5);

    console.log(`Pinterest API検索結果: ${images.length}枚の画像を取得`);

    return NextResponse.json({
      success: true,
      query: query,
      images: images,
    });
  } catch (error: any) {
    console.error('Pinterest search error:', error);
    
    let errorMessage = '検索に失敗しました。別の検索軸をお試しください';
    
    if (error.response?.status === 401) {
      errorMessage = 'Pinterest APIの認証に失敗しました。アクセストークンを確認してください';
    } else if (error.response?.status === 429) {
      errorMessage = 'APIのレート制限に達しました。しばらく待ってから再度お試しください';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}
```

---

### 4. アクセストークンの取得手順

#### 4.1 Pinterest開発者アカウントの作成

1. https://developers.pinterest.com/ にアクセス
2. アカウントを作成（または既存のPinterestアカウントでログイン）
3. アプリを作成
   - アプリ名、説明などを入力
   - リダイレクトURIを設定（例: `http://localhost:3000/auth/pinterest/callback`）

#### 4.2 OAuth 2.0フローでアクセストークンを取得

**手動で取得する方法:**

1. **認証URLを生成**
   ```
   https://www.pinterest.com/oauth/?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=boards:read,pins:read
   ```

2. **ブラウザで認証URLにアクセス**
   - Pinterestにログイン
   - アプリのアクセス許可を承認

3. **認証コードを取得**
   - リダイレクトURIに認証コードが含まれる
   - 例: `http://localhost:3000/auth/pinterest/callback?code={AUTH_CODE}`

4. **アクセストークンを取得**
   ```bash
   curl -X POST https://api.pinterest.com/v5/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "client_id={CLIENT_ID}" \
     -d "client_secret={CLIENT_SECRET}" \
     -d "code={AUTH_CODE}"
   ```

5. **アクセストークンをSecret Managerに保存**
   ```bash
   echo -n "{ACCESS_TOKEN}" | gcloud secrets create pinterest-access-token \
     --data-file=- \
     --project=park-ai-test
   ```

---

### 5. 依存関係の削除

#### 削除するパッケージ
- `puppeteer-core`
- `@sparticuz/chromium`
- `cheerio`（Pinterest検索では不要）

#### 削除するファイル
- `app/lib/pinterest.ts`（スクレイピング版）
- `app/test-pinterest-scraping.js`

#### 削除するDockerfileの設定
- Chromium関連の依存関係

---

### 6. コスト見積もり

#### Pinterest API
- **無料枠**: 通常、開発者アカウントには無料枠が提供される
- **利用頻度**: 1日5回 × 30日 = 150回/月
- **想定コスト**: **¥0**（無料枠内）

#### Cloud Run
- **CPU/メモリ使用量**: Puppeteerが不要になるため、大幅に削減
- **メモリ**: 1Gi → 512Miに削減可能
- **想定コスト**: **¥0**（無料枠内）

---

### 7. メリット

1. **法的リスクの軽減**
   - 公式APIを使用するため、利用規約に準拠
   - 著作権リスクも低減

2. **技術的な安定性**
   - HTML構造の変更に影響されない
   - CORS問題が発生しない（APIから返されるURLを使用）

3. **実装の簡素化**
   - Puppeteerが不要
   - エラーハンドリングがシンプル

4. **コスト削減**
   - Cloud Runのリソース使用量が削減
   - メモリを512Miに削減可能

---

### 8. 実装のステップ

1. **Pinterest開発者アカウントの作成**
2. **アプリの登録とアクセストークンの取得**
3. **Secret Managerにアクセストークンを保存**
4. **Pinterest APIクライアントの実装**
5. **API Routeの変更**
6. **不要な依存関係の削除**
7. **Dockerfileの最適化**
8. **テストとデプロイ**

---

## 📝 注意事項

1. **アクセストークンの有効期限**
   - アクセストークンには有効期限がある場合がある
   - リフレッシュトークンを使用して更新する必要がある可能性

2. **APIのレート制限**
   - Pinterest APIにはレート制限がある
   - 1日5回程度の使用であれば問題ないはず

3. **利用規約の確認**
   - Pinterest APIの利用規約を確認
   - 商用利用の可否を確認

