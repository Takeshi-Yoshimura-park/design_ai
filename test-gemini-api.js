// Gemini APIの直接テストスクリプト
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

async function testGeminiAPI() {
  console.log('=== Gemini API テスト ===\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEYが設定されていません');
    console.log('app/.env.localファイルにGEMINI_API_KEYを設定してください');
    process.exit(1);
  }

  console.log('✓ APIキーが設定されています');
  console.log(`  キー: ${apiKey.substring(0, 10)}...\n`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    console.log('Gemini APIに接続中...');
    
    // テキストのみのテスト
    const result = await model.generateContent('こんにちは。これはテストです。');
    const response = await result.response;
    const text = response.text();

    console.log('✓ Gemini APIは正常に動作しています\n');
    console.log('レスポンス:', text.substring(0, 100) + '...\n');
    
    console.log('✅ テスト成功！');
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    
    if (error.message.includes('API_KEY')) {
      console.error('\nAPIキーが無効です。正しいAPIキーを設定してください。');
    } else if (error.message.includes('quota')) {
      console.error('\nAPIの利用制限に達しています。');
    } else {
      console.error('\n詳細:', error);
    }
    
    process.exit(1);
  }
}

testGeminiAPI();

