// ListModels APIで利用可能なモデルを確認
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEYが設定されていません');
    process.exit(1);
  }

  console.log('=== 利用可能なGeminiモデル一覧 ===\n');
  console.log(`APIキー: ${apiKey.substring(0, 10)}...\n`);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ エラー:', data.error?.message || response.statusText);
      console.error('詳細:', JSON.stringify(data, null, 2));
      return;
    }

    if (data.models && data.models.length > 0) {
      console.log(`✅ ${data.models.length}個のモデルが見つかりました:\n`);
      
      // generateContentをサポートするモデルをフィルタ
      const supportedModels = data.models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      );

      console.log('generateContentをサポートするモデル:');
      supportedModels.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.name}`);
        console.log(`   表示名: ${model.displayName || 'N/A'}`);
        console.log(`   説明: ${model.description || 'N/A'}`);
        console.log(`   サポートメソッド: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        
        // モデル名から実際に使う名前を抽出
        const modelName = model.name.replace('models/', '');
        console.log(`   → 使用する名前: ${modelName}`);
      });

      if (supportedModels.length > 0) {
        const firstModel = supportedModels[0].name.replace('models/', '');
        console.log(`\n✅ 推奨モデル: ${firstModel}\n`);
        return firstModel;
      }
    } else {
      console.log('❌ モデルが見つかりませんでした');
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('スタック:', error.stack);
  }
}

listAvailableModels().catch(console.error);

