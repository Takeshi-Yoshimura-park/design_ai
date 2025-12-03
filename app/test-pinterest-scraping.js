const axios = require('axios');
const cheerio = require('cheerio');

async function testPinterestScraping() {
  try {
    const query = 'インテリア デザイン';
    const searchUrl = `https://www.pinterest.jp/search/pins/?q=${encodeURIComponent(query)}`;
    
    console.log(`検索URL: ${searchUrl}`);
    
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
    
    // HTMLの構造を確認
    console.log('\n=== HTML構造の確認 ===');
    
    // すべてのimgタグを確認
    const allImages = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) {
        allImages.push({
          index: i,
          src: src.substring(0, 100),
          alt: $(el).attr('alt') || '',
        });
      }
    });
    
    console.log(`\n全imgタグ数: ${allImages.length}`);
    console.log('最初の10個のimgタグ:');
    allImages.slice(0, 10).forEach(img => {
      console.log(`  [${img.index}] ${img.src}... (alt: ${img.alt})`);
    });
    
    // pinimg.comを含む画像を探す
    const pinimgImages = allImages.filter(img => img.src.includes('pinimg.com'));
    console.log(`\npinimg.comを含む画像数: ${pinimgImages.length}`);
    pinimgImages.slice(0, 5).forEach(img => {
      console.log(`  ${img.src}...`);
    });
    
    // data-test-id="pin"を探す
    const pinElements = $('[data-test-id="pin"]');
    console.log(`\ndata-test-id="pin"の要素数: ${pinElements.length}`);
    
    // scriptタグ内のJSONデータを探す
    const scriptTags = $('script[type="application/json"]');
    console.log(`\napplication/jsonのscriptタグ数: ${scriptTags.length}`);
    
    // すべてのscriptタグから画像URLを抽出
    const imageUrls = new Set();
    
    scriptTags.each((i, script) => {
      const scriptContent = $(script).html();
      if (!scriptContent) return;
      
      try {
        const jsonData = JSON.parse(scriptContent);
        
        // 再帰的に画像URLを探す
        const findImageUrls = (obj, depth = 0) => {
          if (depth > 10) return;
          
          if (typeof obj === 'string') {
            if (obj.includes('pinimg.com') && obj.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
              imageUrls.add(obj);
            }
          } else if (Array.isArray(obj)) {
            obj.forEach(item => findImageUrls(item, depth + 1));
          } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(value => findImageUrls(value, depth + 1));
          }
        };
        
        findImageUrls(jsonData);
      } catch (e) {
        // パースエラーは無視
      }
    });
    
    console.log(`\n見つかった画像URL数: ${imageUrls.size}`);
    if (imageUrls.size > 0) {
      console.log('\n最初の5つの画像URL:');
      Array.from(imageUrls).slice(0, 5).forEach(url => {
        console.log(`  ${url.substring(0, 150)}...`);
      });
    }
    
    // その他のdata属性を探す
    const dataAttributes = [];
    $('[data-test-id]').each((i, el) => {
      const testId = $(el).attr('data-test-id');
      if (testId) {
        dataAttributes.push(testId);
      }
    });
    const uniqueDataAttributes = [...new Set(dataAttributes)];
    console.log(`\n見つかったdata-test-id属性: ${uniqueDataAttributes.join(', ')}`);
    
  } catch (error) {
    console.error('エラー:', error.message);
    console.error(error.stack);
  }
}

testPinterestScraping();

