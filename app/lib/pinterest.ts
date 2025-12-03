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
    
    console.log(`Pinterest検索URL: ${searchUrl}`);
    
    // Pinterest検索ページにアクセス
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.pinterest.jp/',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const images: PinterestImage[] = [];
    const seenUrls = new Set<string>();

    // 方法1: imgタグから直接抽出
    $('img').each((_, element) => {
      if (images.length >= limit) return false;
      
      const src = $(element).attr('src') || $(element).attr('data-src');
      const alt = $(element).attr('alt') || '';
      
      if (src && src.includes('pinimg.com') && !seenUrls.has(src)) {
        seenUrls.add(src);
        
        // サムネイルURLを高解像度URLに変換
        let highResUrl = src;
        if (src.includes('236x') || src.includes('474x')) {
          highResUrl = src.replace(/236x/, '564x').replace(/474x/, '564x');
        }
        
        images.push({
          url: highResUrl,
          thumbnailUrl: src,
          alt: alt || query,
          pinterestUrl: '', // 元のピンのURLは別途取得が必要
        });
      }
    });

    // 方法2: data属性から抽出（Pinterestの動的コンテンツ用）
    if (images.length < limit) {
      $('[data-test-id="pin"]').each((_, element) => {
        if (images.length >= limit) return false;
        
        const img = $(element).find('img').first();
        const src = img.attr('src') || img.attr('data-src');
        const alt = img.attr('alt') || '';
        const pinLink = $(element).find('a').first().attr('href');
        
        if (src && src.includes('pinimg.com') && !seenUrls.has(src)) {
          seenUrls.add(src);
          
          let highResUrl = src;
          if (src.includes('236x') || src.includes('474x')) {
            highResUrl = src.replace(/236x/, '564x').replace(/474x/, '564x');
          }
          
          images.push({
            url: highResUrl,
            thumbnailUrl: src,
            alt: alt || query,
            pinterestUrl: pinLink ? `https://www.pinterest.jp${pinLink}` : '',
          });
        }
      });
    }

    // 方法3: JSON-LDやスクリプトタグから抽出を試みる
    if (images.length < limit) {
      const scriptTags = $('script[type="application/json"]').toArray();
      for (const script of scriptTags) {
        try {
          const jsonData = JSON.parse($(script).html() || '{}');
          // PinterestのJSONデータ構造に応じて画像を抽出
          // この部分はPinterestの実際のデータ構造に合わせて調整が必要
        } catch (e) {
          // JSONパースエラーは無視
        }
      }
    }

    // 重複を除去
    const uniqueImages = Array.from(
      new Map(images.map(img => [img.url, img])).values()
    );

    console.log(`Pinterest検索結果: ${uniqueImages.length}枚の画像を取得`);

    if (uniqueImages.length === 0) {
      console.warn('Pinterestから画像を取得できませんでした。HTML構造が変更された可能性があります。');
      // フォールバック: 検索URLを返す
      return [{
        url: searchUrl,
        thumbnailUrl: searchUrl,
        alt: `Pinterest検索: ${query}`,
        pinterestUrl: searchUrl,
      }];
    }

    return uniqueImages.slice(0, limit);
  } catch (error: any) {
    console.error('Pinterest search error:', error);
    console.error('Error details:', error.message);
    
    // エラーの詳細を返す
    throw new Error(`Pinterest検索に失敗しました: ${error.message}`);
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

