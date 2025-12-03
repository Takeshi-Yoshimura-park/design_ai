import * as cheerio from 'cheerio';
import axios from 'axios';

/**
 * Pinterest検索結果から画像URLを取得
 */
export async function searchPinterestImages(
  query: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  try {
    const searchUrl = `https://www.pinterest.jp/search/pins/?q=${encodeURIComponent(query)}`;
    
    // Pinterest検索ページにアクセス
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const images: PinterestImage[] = [];

    // Pinterestの画像を抽出
    // 注意: PinterestのHTML構造は変更される可能性があります
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt') || '';
      
      if (src && src.includes('pinimg.com') && images.length < limit) {
        // サムネイルURLを高解像度URLに変換
        const highResUrl = src.replace(/236x/, '564x').replace(/474x/, '564x');
        
        images.push({
          url: highResUrl,
          thumbnailUrl: src,
          alt: alt,
          pinterestUrl: '', // 元のピンのURLは別途取得が必要
        });
      }
    });

    // 重複を除去
    const uniqueImages = Array.from(
      new Map(images.map(img => [img.url, img])).values()
    );

    return uniqueImages.slice(0, limit);
  } catch (error) {
    console.error('Pinterest search error:', error);
    throw new Error('Failed to search Pinterest images');
  }
}

/**
 * 検索クエリを生成
 */
export function generateSearchQuery(
  analysisResult: any,
  axis: 'color' | 'texture' | 'tone' | 'layout'
): string {
  switch (axis) {
    case 'color':
      if (analysisResult.colors && analysisResult.colors.length > 0) {
        const colorNames = analysisResult.colors
          .map((c: any) => c.name || c.hex)
          .slice(0, 3)
          .join(' ');
        return `${colorNames} インテリア デザイン`;
      }
      return 'インテリア デザイン';

    case 'texture':
      const texture = analysisResult.texture || analysisResult.style || '';
      return `${texture} インテリア デザイン`;

    case 'tone':
      const tone = analysisResult.tone || '';
      const keywords = analysisResult.moodKeywords || [];
      const toneQuery = tone || keywords.join(' ');
      return `${toneQuery} インテリア デザイン`;

    case 'layout':
      const layout = analysisResult.layout || '';
      return `${layout} レイアウト インテリア デザイン`;

    default:
      return 'インテリア デザイン';
  }
}

/**
 * Pinterest画像の型定義
 */
export interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

