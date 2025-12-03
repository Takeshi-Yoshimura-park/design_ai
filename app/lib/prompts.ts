/**
 * プロンプト定義
 * 実験しながら最適化していく
 */

/**
 * 画像分析プロンプト
 */
export const ANALYSIS_PROMPT = `以下の画像を分析して、以下の項目について日本語で回答してください。

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

/**
 * 検索クエリ生成プロンプト（各軸ごと）
 */
export const SEARCH_QUERY_PROMPTS = {
  color: (colors: any[]) => {
    const colorNames = colors
      .slice(0, 3)
      .map(c => c.name || c.hex)
      .join(' ');
    return `${colorNames} インテリア デザイン`;
  },
  
  texture: (texture: string, style: string) => {
    return `${texture || style} インテリア デザイン`;
  },
  
  tone: (tone: string, keywords: string[]) => {
    const query = tone || keywords.join(' ');
    return `${query} インテリア デザイン`;
  },
  
  layout: (layout: string) => {
    return `${layout} レイアウト インテリア デザイン`;
  },
};

