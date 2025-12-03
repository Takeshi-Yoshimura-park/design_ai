import axios from 'axios';

const GOOGLE_CUSTOM_SEARCH_API_BASE = 'https://www.googleapis.com/customsearch/v1';

/**
 * Pinterest画像の型定義（既存の型と互換性を保つ）
 */
export interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

/**
 * Google Custom Search APIのレスポンス型定義
 */
interface GoogleImageSearchResult {
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

interface GoogleImageSearchResponse {
  items?: GoogleImageSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Google Custom Search JSON APIで画像を検索
 * @param query 検索クエリ
 * @param apiKey Google Custom Search APIキー
 * @param cseId Custom Search Engine ID
 * @param limit 取得する画像数（1-10、デフォルト: 5）
 * @returns Pinterest画像の配列（既存の型と互換性を保つ）
 */
export async function searchGoogleImages(
  query: string,
  apiKey: string,
  cseId: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  try {
    console.log(`Google画像検索開始: query="${query}", limit=${limit}`);

    // limitを1-10の範囲に制限
    const num = Math.min(Math.max(limit, 1), 10);

    const response = await axios.get<GoogleImageSearchResponse>(
      GOOGLE_CUSTOM_SEARCH_API_BASE,
      {
        params: {
          key: apiKey,
          cx: cseId,
          q: query,
          searchType: 'image',
          num: num,
          safe: 'active', // セーフサーチを有効化
        },
        timeout: 10000,
      }
    );

    // エラーレスポンスのチェック
    if (response.data.error) {
      const error = response.data.error;
      console.error('Google Custom Search API error:', error);
      
      if (error.code === 400) {
        throw new Error('無効なリクエストです。APIキーとCSE IDを確認してください');
      } else if (error.code === 403) {
        throw new Error('APIキーが無効か、APIが有効化されていません');
      } else if (error.code === 429) {
        throw new Error('APIのレート制限に達しました。しばらく待ってから再度お試しください');
      }
      
      throw new Error(`Google画像検索に失敗しました: ${error.message}`);
    }

    if (!response.data.items || response.data.items.length === 0) {
      console.warn('Google画像検索: 結果が見つかりませんでした');
      return [];
    }

    console.log(`Google画像検索レスポンス: ${response.data.items.length}件の画像を取得`);

    // Google APIのレスポンスを既存のPinterestImage型に変換
    const images: PinterestImage[] = response.data.items.map((item, index) => {
      // デバッグ: レスポンス構造を確認
      console.log(`--- 画像${index + 1}のデータ ---`);
      console.log('item.image:', JSON.stringify(item.image, null, 2));
      console.log('item.link:', item.link);
      console.log('item.title:', item.title);
      
      // Google Custom Search APIの画像検索レスポンス構造:
      // item.image.thumbnailLink: サムネイル画像のURL（表示用）
      // item.image.contextLink: 画像が含まれるページのURL
      // item.link: 検索結果のリンクURL
      
      // サムネイル画像URL（表示用に必須）
      const thumbnailUrl = item.image?.thumbnailLink;
      
      if (!thumbnailUrl) {
        console.warn(`画像${index + 1}: thumbnailLinkが見つかりません`);
        console.warn('item.image:', item.image);
      }
      
      // 元のページURL（クリック時の遷移先）
      const pageUrl = item.image?.contextLink || item.link;

      return {
        url: pageUrl, // 元のページURL（クリック時に遷移先として使用）
        thumbnailUrl: thumbnailUrl || '', // サムネイル画像URL（表示用）- 必須
        alt: item.title || item.snippet || query,
        pinterestUrl: item.link, // 元のページURL（Pinterestのピンページなど）
      };
    });

    console.log(`Google画像検索完了: ${images.length}枚の画像を取得`);
    
    // 取得した画像URLをログ出力（デバッグ用）
    images.forEach((img, idx) => {
      console.log(`  画像${idx + 1}:`);
      console.log(`    サムネイルURL: ${img.thumbnailUrl ? img.thumbnailUrl.substring(0, 100) + '...' : '(なし)'}`);
      console.log(`    ページURL: ${img.pinterestUrl}`);
    });

    return images;
  } catch (error: any) {
    // エラーの詳細をログ出力（デバッグ用）
    console.error('=== Google画像検索エラー詳細 ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // Google APIのエラーレスポンスを確認
      if (error.response.data?.error) {
        const apiError = error.response.data.error;
        console.error('--- Google API Error Details ---');
        console.error('Error Code:', apiError.code);
        console.error('Error Message:', apiError.message);
        console.error('Error Status:', apiError.status);
        if (apiError.errors) {
          console.error('Error Details:', JSON.stringify(apiError.errors, null, 2));
        }
        console.error('================================');
        
        // より詳細なエラーメッセージを返す
        if (apiError.code === 400) {
          throw new Error(`無効なリクエストです: ${apiError.message || 'APIキーとCSE IDを確認してください'}`);
        } else if (apiError.code === 403) {
          throw new Error(`APIキーが無効か、APIが有効化されていません: ${apiError.message || ''}`);
        } else if (apiError.code === 429) {
          throw new Error('APIのレート制限に達しました。しばらく待ってから再度お試しください');
        } else {
          throw new Error(`Google Custom Search APIエラー (${apiError.code}): ${apiError.message || '認証に失敗しました'}`);
        }
      }
    } else {
      console.error('No response object in error');
      console.error('Full error:', error);
    }

    // HTTPステータスコードベースのエラーハンドリング
    if (error.response?.status === 400) {
      throw new Error('無効なリクエストです。APIキーとCSE IDを確認してください');
    } else if (error.response?.status === 401) {
      throw new Error('Google Custom Search APIの認証に失敗しました。APIキーが無効か、APIが有効化されていません');
    } else if (error.response?.status === 403) {
      throw new Error('APIキーが無効か、APIが有効化されていません。Google Cloud ConsoleでCustom Search JSON APIが有効になっているか確認してください');
    } else if (error.response?.status === 429) {
      throw new Error('APIのレート制限に達しました。しばらく待ってから再度お試しください');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Google画像検索へのリクエストがタイムアウトしました');
    }

    throw new Error(`Google画像検索に失敗しました: ${error.message}`);
  }
}

