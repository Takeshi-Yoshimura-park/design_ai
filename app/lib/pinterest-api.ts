import axios from 'axios';

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

/**
 * Pinterest画像の型定義
 */
export interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

/**
 * Pinterest APIのレスポンス型定義
 */
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
  description?: string;
}

interface PinterestSearchResponse {
  items: PinterestPin[];
  bookmark?: string;
}

/**
 * Pinterest APIでピンを検索
 * @param query 検索クエリ
 * @param accessToken Pinterest APIのアクセストークン
 * @param limit 取得する画像数（デフォルト: 5）
 * @returns Pinterest画像の配列
 */
export async function searchPinterestPins(
  query: string,
  accessToken: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  try {
    console.log(`Pinterest API検索開始: query="${query}", limit=${limit}`);

    const response = await axios.get<PinterestSearchResponse>(
      `${PINTEREST_API_BASE}/search/pins`,
      {
        params: {
          query: query,
          limit: limit,
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`Pinterest APIレスポンス: ${response.data.items?.length || 0}件のピンを取得`);

    if (!response.data.items || response.data.items.length === 0) {
      console.warn('Pinterest APIから画像が取得できませんでした');
      return [];
    }

    const images: PinterestImage[] = response.data.items.map((pin) => {
      // 高解像度画像を優先的に使用
      // 564x > originals > 236x の順で優先
      const imageUrl = 
        pin.media.images['564x']?.url ||
        pin.media.images['originals']?.url ||
        pin.media.images['236x']?.url ||
        '';

      // サムネイルURL（236xを優先）
      const thumbnailUrl = 
        pin.media.images['236x']?.url ||
        pin.media.images['564x']?.url ||
        imageUrl;

      return {
        url: imageUrl,
        thumbnailUrl: thumbnailUrl,
        alt: pin.title || pin.description || query,
        pinterestUrl: pin.link,
      };
    });

    console.log(`Pinterest API検索完了: ${images.length}枚の画像を取得`);
    
    // 取得した画像URLをログ出力（デバッグ用）
    images.forEach((img, idx) => {
      console.log(`  画像${idx + 1}: ${img.url.substring(0, 100)}...`);
      console.log(`  Pinterest URL: ${img.pinterestUrl}`);
    });

    return images;
  } catch (error: any) {
    console.error('Pinterest API error:', error.response?.data || error.message);
    
    // エラーの詳細をログ出力
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }

    // エラーメッセージを適切に処理
    if (error.response?.status === 401) {
      throw new Error('Pinterest APIの認証に失敗しました。アクセストークンを確認してください');
    } else if (error.response?.status === 429) {
      throw new Error('APIのレート制限に達しました。しばらく待ってから再度お試しください');
    } else if (error.response?.status === 404) {
      throw new Error('Pinterest APIのエンドポイントが見つかりませんでした');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Pinterest APIへのリクエストがタイムアウトしました');
    }

    throw new Error(`Pinterest検索に失敗しました: ${error.message}`);
  }
}

