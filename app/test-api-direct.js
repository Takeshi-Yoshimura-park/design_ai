// Gemini APIを直接REST APIでテスト
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testDirectAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEYが設定されていません');
    process.exit(1);
  }

  console.log('=== Gemini API 直接テスト ===\n');
  console.log(`APIキー: ${apiKey.substring(0, 10)}...\n`);

  // REST APIエンドポイントを試す
  const models = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ];

  for (const model of models) {
    try {
      console.log(`テスト中: ${model}...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'こんにちは'
            }]
          }]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${model} - 利用可能\n`);
        console.log(`レスポンス: ${JSON.stringify(data, null, 2).substring(0, 200)}...\n`);
        return model;
      } else {
        console.log(`❌ ${model} - エラー: ${data.error?.message || response.statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ ${model} - エラー: ${error.message}\n`);
    }
  }

  console.log('❌ 利用可能なモデルが見つかりませんでした');
  console.log('\nAPIキーを確認してください:');
  console.log('1. [Google AI Studio](https://makersuite.google.com/app/apikey) で新しいAPIキーを取得');
  console.log('2. .env.localファイルを更新');
  console.log('3. 開発サーバーを再起動');
}

testDirectAPI().catch(console.error);

