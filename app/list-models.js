// 利用可能なGeminiモデルをリストアップ
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEYが設定されていません');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('利用可能なモデルを取得中...\n');
    
    // 利用可能なモデルをリストアップ
    const models = await genAI.listModels();
    
    console.log('利用可能なモデル:');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      if (model.supportedGenerationMethods) {
        console.log(`   サポートメソッド: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    process.exit(1);
  }
}

listModels();

