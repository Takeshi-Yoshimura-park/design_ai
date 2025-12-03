# 画像キャッシュ設計案（一次キャッシュ方式）

## 📋 設計概要

Pinterestから取得した画像URLを使って、GCP側（Cloud Storage）に画像を一時保存（一次キャッシュ）し、フロントエンドに表示する設計。

### 設計のポイント

1. **Pinterestから画像URLをスクレイピング**（既に実装済み）
2. **画像をCloud Storageに一時保存**（TTL付きで自動削除）
3. **フロントエンドはCloud Storageの画像を表示**（CORS問題を回避）
4. **詳細はPinterest側で見る**（画像をクリックしたらPinterestのページに飛ぶ）

---

## 🎯 メリット

### 1. 法的リスクの軽減
- **画像の再配布を最小限に**: 一時的なキャッシュとして保存するだけ
- **Pinterestへのリンクを提供**: 詳細はPinterest側で見るため、著作権リスクを軽減
- **利用規約違反のリスク軽減**: 直接的な再配布ではなく、一時的なキャッシュとして扱う

### 2. 技術的なメリット
- **CORS問題の解決**: 自分のオリジンから画像を配信するため、CORS問題が発生しない
- **パフォーマンス向上**: Cloud Storageからの配信は高速
- **Pinterestへの負荷軽減**: 同じ画像を複数回取得する必要がない

### 3. コスト面
- **Cloud Storageの無料枠**: 月5GBまで無料
- **転送コスト**: Cloud Storageからの転送は無料枠内（月1GBまで）

---

## 🏗️ アーキテクチャ

### フロー

```
1. ユーザーが画像をアップロード
   ↓
2. Gemini APIで画像分析
   ↓
3. Pinterest検索（Puppeteer）
   ↓
4. 画像URLを取得（例: https://i.pinimg.com/236x/...jpg）
   ↓
5. /api/image-cache に画像URLを送信
   ↓
6. Cloud Storageに画像が存在するかチェック
   - 存在する場合: Cloud StorageのURLを返す
   - 存在しない場合: Pinterestから画像をダウンロード → Cloud Storageに保存 → URLを返す
   ↓
7. フロントエンドはCloud StorageのURLを表示
   ↓
8. ユーザーが画像をクリック → Pinterestのページに飛ぶ
```

---

## 💾 実装詳細

### 1. Cloud Storageの設定

#### バケットの作成
- **バケット名**: `design-ai-image-cache`
- **リージョン**: `asia-northeast1`（Cloud Runと同じ）
- **ストレージクラス**: `STANDARD`（アクセス頻度が高いため）
- **ライフサイクルポリシー**: 7日後に自動削除

#### ライフサイクルポリシー
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 7  // 7日後に自動削除
        }
      }
    ]
  }
}
```

### 2. APIエンドポイントの設計

#### `/api/image-cache` (POST)
- **入力**: 画像URLの配列
- **処理**:
  1. 各画像URLに対して、Cloud Storageに存在するかチェック
  2. 存在しない場合、Pinterestから画像をダウンロード
  3. Cloud Storageに保存（ファイル名はURLのハッシュ値）
  4. Cloud Storageの公開URLを返す
- **出力**: Cloud StorageのURLの配列

#### ファイル名の生成
- **方法**: 画像URLのハッシュ値（SHA-256）を使用
- **例**: `https://i.pinimg.com/236x/abc123.jpg` → `a1b2c3d4e5f6...jpg`
- **メリット**: 同じ画像URLは同じファイル名になり、重複保存を防げる

### 3. フロントエンドの変更

#### 画像表示
- **変更前**: `/api/image-proxy?url=...`
- **変更後**: Cloud Storageの公開URL（例: `https://storage.googleapis.com/design-ai-image-cache/...`）

#### クリック時の動作
- **変更前**: 画像を拡大表示
- **変更後**: Pinterestのページに飛ぶ（`image.pinterestUrl`を使用）

---

## 💰 コスト見積もり

### Cloud Storageのコスト

#### 無料枠
- **ストレージ**: 月5GBまで無料
- **読み取り操作**: 月5,000回まで無料
- **書き込み操作**: 月5,000回まで無料

#### 想定使用量（検証フェーズ）
- **画像数**: 4,500-9,000枚/月
- **画像サイズ**: 平均0.3-0.5MB/枚
- **ストレージ使用量**: 1.35-4.5GB/月
- **読み取り操作**: 4,500-9,000回/月（画像表示時）
- **書き込み操作**: 4,500-9,000回/月（初回保存時）

#### コスト計算
- **ストレージ**: ¥0（無料枠内）
- **読み取り操作**: ¥0（無料枠内）
- **書き込み操作**: ¥0（無料枠内）

**想定コスト**: **¥0（無料枠内）**

#### 本番運用時
- **ストレージ使用量**: 13.5-45GB/月
- **想定コスト**: ¥0-1,350/月（5GB超過分 × $0.02/GB）

---

## ⚖️ 法的リスクの評価

### リスク軽減のポイント

1. **一時的なキャッシュ**: 7日後に自動削除するため、永続的な保存ではない
2. **Pinterestへのリンク提供**: 詳細はPinterest側で見るため、著作権リスクを軽減
3. **内部利用**: 社内ツールとして使用するため、商用利用のリスクが低い

### 残存リスク

1. **利用規約の確認**: Pinterestの利用規約で一時的なキャッシュが許可されているか確認が必要
2. **著作権**: 画像の著作権は各ユーザーが所有しているため、キャッシュすること自体が問題になる可能性

### 推奨事項

1. **利用規約の確認**: Pinterestの利用規約を確認
2. **免責事項**: 利用規約に免責事項を追加
3. **TTLの短縮**: 必要に応じてTTLを短縮（例: 1日）

---

## 🔧 実装の詳細

### 1. Cloud Storageへの画像保存

```typescript
// app/lib/image-cache.ts
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import axios from 'axios';

const storage = new Storage();
const bucket = storage.bucket('design-ai-image-cache');

export async function cacheImage(imageUrl: string): Promise<string> {
  // ファイル名を生成（URLのハッシュ値）
  const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
  const extension = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] || 'jpg';
  const fileName = `${hash}.${extension}`;
  
  // Cloud Storageに存在するかチェック
  const file = bucket.file(fileName);
  const [exists] = await file.exists();
  
  if (exists) {
    // 既に存在する場合、公開URLを返す
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  }
  
  // 存在しない場合、Pinterestから画像をダウンロード
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0...',
      'Referer': 'https://www.pinterest.jp/',
    },
  });
  
  // Cloud Storageに保存
  await file.save(Buffer.from(response.data), {
    metadata: {
      contentType: response.headers['content-type'] || 'image/jpeg',
      cacheControl: 'public, max-age=604800', // 7日間キャッシュ
    },
    public: true, // 公開アクセスを許可
  });
  
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
```

### 2. APIエンドポイント

```typescript
// app/app/api/image-cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cacheImage } from '@/lib/image-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrls } = body;
    
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: '画像URLの配列が必要です' },
        { status: 400 }
      );
    }
    
    // 各画像URLをキャッシュ
    const cachedUrls = await Promise.all(
      imageUrls.map(url => cacheImage(url))
    );
    
    return NextResponse.json({
      success: true,
      urls: cachedUrls,
    });
  } catch (error: any) {
    console.error('Image cache error:', error);
    return NextResponse.json(
      { error: '画像のキャッシュに失敗しました' },
      { status: 500 }
    );
  }
}
```

### 3. Pinterest検索APIの変更

```typescript
// app/app/api/search/pinterest/route.ts
// 検索結果を返す際に、画像URLをキャッシュAPIに送信
const images = await searchPinterestImages(query, 5);

// 画像URLをキャッシュ
const imageUrls = images.map(img => img.url);
const cacheResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/image-cache`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrls }),
});
const { urls: cachedUrls } = await cacheResponse.json();

// キャッシュされたURLを画像オブジェクトに設定
const cachedImages = images.map((img, idx) => ({
  ...img,
  cachedUrl: cachedUrls[idx], // Cloud StorageのURL
}));

return NextResponse.json({
  success: true,
  query: query,
  images: cachedImages,
});
```

---

## 📊 比較：プロキシAPI vs キャッシュ方式

| 項目 | プロキシAPI | キャッシュ方式 |
|------|------------|--------------|
| **CORS問題** | 解決 | 解決 |
| **法的リスク** | 高い（再配布） | 中（一時キャッシュ） |
| **コスト** | ¥0-420/月（検証）<br>¥1,620-5,400/月（本番） | ¥0/月（検証）<br>¥0-1,350/月（本番） |
| **パフォーマンス** | やや遅い（毎回取得） | 高速（キャッシュから） |
| **実装の複雑さ** | 低 | 中 |
| **メンテナンス** | 低 | 中（ライフサイクル管理） |

---

## 🎯 結論

### メリット
- ✅ **法的リスクの軽減**: 一時的なキャッシュとして扱う
- ✅ **コスト削減**: Cloud Storageの無料枠を活用
- ✅ **パフォーマンス向上**: キャッシュからの高速配信
- ✅ **CORS問題の解決**: 自分のオリジンから配信

### デメリット
- ⚠️ **実装の複雑さ**: Cloud Storageの設定とライフサイクル管理が必要
- ⚠️ **ストレージコスト**: 本番運用時は追加コストが発生する可能性
- ⚠️ **残存リスク**: 利用規約の確認は依然として必要

### 推奨事項
1. **この設計で実装を進める**: プロキシAPIよりリスクが低く、コストも抑えられる
2. **利用規約の確認**: Pinterestの利用規約を確認
3. **TTLの調整**: 必要に応じてTTLを短縮（例: 1-3日）

