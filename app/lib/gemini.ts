import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini APIクライアントの初期化
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * 画像を分析する
 */
export async function analyzeImage(imageBase64: string, mimeType: string) {
  try {
    const genAI = getGeminiClient();
    
    // 利用可能なモデルを試す（新しいモデルから順に）
    const models = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-1.5-flash',
      'gemini-pro',
    ];
    let lastError: Error | null = null;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = getAnalysisPrompt();

        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log(`Success with model: ${modelName}`);
        return parseAnalysisResult(text);
      } catch (error: any) {
        console.error(`Model ${modelName} failed:`, error.message);
        lastError = error;
        // 404エラーの場合は次のモデルを試す
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          continue;
        }
        // その他のエラーは即座にスロー
        throw error;
      }
    }
    
    // すべてのモデルが失敗した場合
    throw lastError || new Error('All models failed');
  } catch (error: any) {
    console.error('analyzeImage error:', error);
    throw error;
  }
}

/**
 * 分析プロンプトを取得
 */
function getAnalysisPrompt(): string {
  return `以下の画像を分析して、以下の項目について日本語で回答してください。

1. **カラー**
   - 主要なカラーを5-7色抽出してください
   - 各色のHEXコードを記載してください
   - 色の名前も記載してください（例: ナチュラルベージュ、ウォームグレー）

2. **質感・スタイル**
   - テクスチャや素材感を言語化してください
   - デザインスタイルを分類してください（例: ミニマル、ナチュラル、モダン）

3. **トーン＆ムード**
   - 全体的な雰囲気や感情的なトーンを言語化してください
   - キーワードを3-5個挙げてください

4. **レイアウト特性**（必要に応じて）
   - 構図や配置パターンを分析してください

回答は以下のJSON形式で返してください：
{
  "colors": [
    {"name": "色の名前", "hex": "#HEXコード", "rgb": "rgb(r, g, b)"}
  ],
  "texture": "質感・スタイルの説明",
  "style": "デザインスタイル",
  "tone": "トーン＆ムードの説明",
  "moodKeywords": ["キーワード1", "キーワード2", ...],
  "layout": "レイアウト特性の説明（該当する場合）"
}`;
}

/**
 * 分析結果をパース
 */
function parseAnalysisResult(text: string) {
  try {
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // JSONが見つからない場合は、テキストから情報を抽出
    return {
      raw: text,
      colors: extractColors(text),
      texture: extractSection(text, '質感'),
      style: extractSection(text, 'スタイル'),
      tone: extractSection(text, 'トーン'),
      moodKeywords: extractKeywords(text),
      layout: extractSection(text, 'レイアウト'),
    };
  } catch (error) {
    console.error('Failed to parse analysis result:', error);
    return {
      raw: text,
      error: 'Failed to parse result',
    };
  }
}

/**
 * 色情報を抽出
 */
function extractColors(text: string) {
  const colorRegex = /#([0-9A-Fa-f]{6})/g;
  const matches = text.match(colorRegex) || [];
  return matches.map(hex => ({ hex }));
}

/**
 * セクションを抽出
 */
function extractSection(text: string, keyword: string): string {
  const regex = new RegExp(`${keyword}[：:]([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * キーワードを抽出
 */
function extractKeywords(text: string): string[] {
  const keywordRegex = /["「]([^"」]+)["」]/g;
  const matches = text.match(keywordRegex) || [];
  return matches.map(m => m.replace(/["「」]/g, ''));
}

