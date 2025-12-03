// 利用可能なGeminiモデルを確認するスクリプト
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEYが設定されていません');
    process.exit(1);
  }

  console.log('=== Gemini API モデル確認 ===\n');
  console.log(`APIキー: ${apiKey.substring(0, 10)}...\n`);

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 試すモデル名のリスト
  const modelsToTest = [
    'gemini-pro',
    'gemini-pro-vision',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
  ];

  console.log('各モデルの動作確認中...\n');

  for (const modelName of modelsToTest) {
    try {
      console.log(`テスト中: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // 簡単なテキスト生成でテスト
      const result = await model.generateContent('こんにちは');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} - 利用可能`);
      console.log(`   レスポンス: ${text.substring(0, 50)}...\n`);
      
      // 最初に動作したモデルを推奨
      console.log(`\n推奨モデル: ${modelName}\n`);
      return modelName;
    } catch (error) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log(`❌ ${modelName} - 見つかりません\n`);
      } else if (error.message?.includes('403') || error.message?.includes('permission')) {
        console.log(`⚠️  ${modelName} - 権限がありません\n`);
      } else {
        console.log(`❌ ${modelName} - エラー: ${error.message}\n`);
      }
    }
  }

  console.log('❌ 利用可能なモデルが見つかりませんでした');
  console.log('APIキーが正しいか、または利用可能なモデルがない可能性があります');
}

checkModels().catch(console.error);

