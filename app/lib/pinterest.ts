import * as cheerio from 'cheerio';
import axios from 'axios';
import puppeteer from 'puppeteer-core';

/**
 * Pinterest検索結果から画像URLを取得
 */
export async function searchPinterestImages(
  query: string,
  limit: number = 5
): Promise<PinterestImage[]> {
  let browser: any = null;
  try {
    const searchUrl = `https://www.pinterest.jp/search/pins/?q=${encodeURIComponent(query)}`;
    
    console.log(`Pinterest検索URL: ${searchUrl}`);
    
    // Puppeteerでブラウザを起動（Cloud Run対応）
    // Alpine LinuxのChromiumを使用（Dockerfileでインストール済み）
    const chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                         process.env.CHROMIUM_PATH || 
                         '/usr/bin/chromium-browser';
    let html = '';
    
    console.log(`Chromium path: ${chromiumPath}`);
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-crash-upload',
          '--no-default-browser-check',
          '--no-pings',
          '--no-zygote',
          '--use-gl=swiftshader',
          '--window-size=1920,1080',
        ],
        executablePath: chromiumPath,
        timeout: 60000,
      });
      
      console.log('Puppeteer起動成功');
      
      const page = await browser.newPage();
      
      try {
        // User-Agentを設定
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // ページにアクセスしてJavaScriptを実行
        // waitUntil: 'networkidle2' はネットワーク接続が2つ以下になるまで待つ
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // 追加の待機時間（JavaScriptで動的に読み込まれるコンテンツ用）
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 画像要素が表示されるまで待つ（最大10秒）
        try {
          await page.waitForSelector('img[src*="pinimg.com"]', { timeout: 10000 });
        } catch (e) {
          console.log('画像要素の待機がタイムアウトしましたが、続行します');
        }
        
        // HTMLを取得
        html = await page.content();
        console.log(`取得したHTMLの長さ: ${html.length}文字`);
        
        // 画像要素の数を確認
        const imgCount = await page.$$eval('img[src*="pinimg.com"]', (imgs: any[]) => imgs.length);
        console.log(`pinimg.comを含む画像要素数: ${imgCount}`);
      } finally {
        await page.close();
      }
    } catch (puppeteerError: any) {
      console.error('Puppeteer起動失敗:', puppeteerError.message);
      console.error('Chromium path:', chromiumPath);
      throw new Error(`Puppeteerの起動に失敗しました: ${puppeteerError.message}`);
    } finally {
      if (browser) {
        await browser.close();
        browser = null;
      }
    }

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
      const allImgs = $('img');
      console.log(`HTML内の全imgタグ数: ${allImgs.length}`);
      
      allImgs.each((_, element) => {
        if (images.length >= limit) return false;
        
        let src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src') || $(element).attr('data-original');
        const alt = $(element).attr('alt') || '';
        
        if (!src) return;
        
        // 相対URLを絶対URLに変換
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = 'https://www.pinterest.jp' + src;
        }
        
        if (src.includes('pinimg.com') && !seenUrls.has(src)) {
          // URLの検証（有効な画像URLかチェック）
          // pinimg.comを含む場合は拡張子チェックを緩和
          if (!src.match(/pinimg\.com/)) {
            return;
          }
          
          seenUrls.add(src);
          
          // サムネイルURLを高解像度URLに変換
          let highResUrl = src;
          if (src.includes('236x')) {
            highResUrl = src.replace(/236x/, '564x');
          } else if (src.includes('474x')) {
            highResUrl = src.replace(/474x/, '564x');
          } else if (src.includes('originals')) {
            highResUrl = src;
          } else if (src.includes('564x')) {
            // 既に564xの場合はそのまま
            highResUrl = src;
          }
          
          console.log(`高解像度URL変換: ${src.substring(0, 100)}... -> ${highResUrl.substring(0, 100)}...`);
          
          console.log(`画像URL取得（imgタグ）: ${src.substring(0, 150)}...`);
          
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
    
    // 取得した画像URLをログ出力
    if (uniqueImages.length > 0) {
      console.log('取得した画像URL:');
      uniqueImages.slice(0, 5).forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.url.substring(0, 150)}...`);
      });
    }

    if (uniqueImages.length === 0) {
      console.warn('Pinterestから画像を取得できませんでした。HTML構造が変更された可能性があります。');
      console.warn(`HTMLの最初の1000文字: ${html.substring(0, 1000)}`);
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

