import * as cheerio from 'cheerio';
import axios from 'axios';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Pinterest検索結果から画像URLを取得
 */
export async function searchPinterestImages(
  query: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  let browser;
  try {
    const searchUrl = `https://www.pinterest.jp/search/pins/?q=${encodeURIComponent(query)}`;
    
    console.log(`Pinterest検索URL: ${searchUrl}`);
    
    // Puppeteerでブラウザを起動（Cloud Run対応）
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      if (isProduction) {
        // 本番環境（Cloud Run）: @sparticuz/chromiumを使用
        browser = await puppeteer.launch({
          args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      } else {
        // 開発環境: システムのChromiumを使用（フォールバックあり）
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: executablePath,
        });
      }
    } catch (puppeteerError: any) {
      console.warn('Puppeteer起動失敗、Cheerioでフォールバック:', puppeteerError.message);
      // Puppeteerが使えない場合は、従来の方法で試す
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Referer': 'https://www.pinterest.jp/',
        },
        timeout: 15000,
      });
      const $ = cheerio.load(response.data);
      // 以下、既存のCheerioロジックを使用（後で実装）
      throw new Error('PinterestはJavaScriptで動的にコンテンツを読み込むため、Puppeteerが必要です。開発環境ではPuppeteerをインストールしてください。');
    }
    
    const page = await browser.newPage();
    
    // User-Agentを設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // ページにアクセスしてJavaScriptを実行
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 画像が読み込まれるまで少し待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 画像要素が表示されるまで待つ（最大10秒）
    try {
      await page.waitForSelector('img[src*="pinimg.com"]', { timeout: 10000 });
    } catch (e) {
      console.log('画像要素の待機がタイムアウトしましたが、続行します');
    }
    
    // HTMLを取得
    const html = await page.content();
    
    // ブラウザを閉じる
    await browser.close();
    browser = null;

    const $ = cheerio.load(html);
    const images: PinterestImage[] = [];
    const seenUrls = new Set<string>();

    // 方法1: scriptタグ内のJSONデータから画像URLを抽出（PinterestはJavaScriptで動的読み込み）
    const scriptTags = $('script[type="application/json"]').toArray();
    for (const script of scriptTags) {
      try {
        const scriptContent = $(script).html();
        if (!scriptContent) continue;
        
        const jsonData = JSON.parse(scriptContent);
        
        // PinterestのJSONデータ構造を再帰的に探索して画像URLを抽出
        const extractImageUrls = (obj: any, depth: number = 0): void => {
          if (depth > 10 || images.length >= limit) return; // 深さ制限と取得数制限
          
          if (typeof obj === 'string') {
            // pinimg.comを含むURLを探す
            if (obj.includes('pinimg.com') && obj.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
              let imageUrl = obj;
              
              // 相対URLを絶対URLに変換
              if (imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl;
              } else if (imageUrl.startsWith('/')) {
                imageUrl = 'https://www.pinterest.jp' + imageUrl;
              }
              
              if (!seenUrls.has(imageUrl) && imageUrl.startsWith('http')) {
                seenUrls.add(imageUrl);
                
                // サムネイルURLを高解像度URLに変換
                let highResUrl = imageUrl;
                if (imageUrl.includes('236x') || imageUrl.includes('474x')) {
                  highResUrl = imageUrl.replace(/236x/, '564x').replace(/474x/, '564x');
                } else if (imageUrl.includes('originals')) {
                  highResUrl = imageUrl;
                }
                
                images.push({
                  url: highResUrl,
                  thumbnailUrl: imageUrl,
                  alt: query,
                  pinterestUrl: '',
                });
                
                console.log(`画像URL取得（JSON）: ${imageUrl.substring(0, 100)}...`);
              }
            }
          } else if (Array.isArray(obj)) {
            obj.forEach(item => extractImageUrls(item, depth + 1));
          } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(value => extractImageUrls(value, depth + 1));
          }
        };
        
        extractImageUrls(jsonData);
        
        if (images.length >= limit) break;
      } catch (e) {
        // JSONパースエラーは無視
        console.log('JSONパースエラー:', e);
      }
    }

    // 方法2: imgタグから直接抽出（フォールバック）
    if (images.length < limit) {
      $('img').each((_, element) => {
        if (images.length >= limit) return false;
        
        let src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src');
        const alt = $(element).attr('alt') || '';
        
        // 相対URLを絶対URLに変換
        if (src && src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src && src.startsWith('/')) {
          src = 'https://www.pinterest.jp' + src;
        }
        
        if (src && src.includes('pinimg.com') && !seenUrls.has(src)) {
          // URLの検証（有効な画像URLかチェック）
          if (!src.match(/\.(jpg|jpeg|png|webp|gif)/i) && !src.includes('pinimg.com')) {
            return;
          }
          
          seenUrls.add(src);
          
          // サムネイルURLを高解像度URLに変換
          let highResUrl = src;
          if (src.includes('236x') || src.includes('474x')) {
            highResUrl = src.replace(/236x/, '564x').replace(/474x/, '564x');
          } else if (src.includes('originals')) {
            highResUrl = src;
          }
          
          console.log(`画像URL取得（imgタグ）: ${src.substring(0, 100)}...`);
          
          images.push({
            url: highResUrl,
            thumbnailUrl: src,
            alt: alt || query,
            pinterestUrl: '',
          });
        }
      });
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
    
    // ブラウザが開いている場合は閉じる
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // 無視
      }
    }
    
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

