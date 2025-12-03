/**
 * 検索クエリを生成
 * AI分析結果に基づいてGoogle画像検索用のクエリを生成
 * Pinterestの画像のみを取得するため、"site:pinterest.com" を使用
 */

/**
 * 長い文章から重要なキーワードを抽出（最大3単語）
 */
function extractKeywords(text: string, maxWords: number = 3): string {
  if (!text) return '';
  
  // 文章を単語に分割（日本語と英語に対応）
  // 日本語の場合は、助詞や助動詞を除去して、名詞や形容詞のみを抽出
  const words = text
    .replace(/[。、，．！？]/g, ' ') // 句読点をスペースに変換
    .replace(/[にはがをのとでにてからまでより]/g, ' ') // 助詞を除去
    .replace(/[ですますである]/g, ' ') // 助動詞を除去
    .split(/\s+/)
    .filter(word => word.length > 0 && word.length <= 10) // 長すぎる単語を除外
    .slice(0, maxWords);
  
  return words.join(' ');
}

/**
 * スタイル名を抽出（モダン、ナチュラル、ミニマルなど）
 */
function extractStyleKeywords(text: string): string {
  if (!text) return '';
  
  // よく使われるスタイルキーワード
  const styleKeywords = [
    'モダン', 'ナチュラル', 'ミニマル', 'シンプル', 'クラシック',
    '北欧', 'スカンジナビア', 'インダストリアル', 'ボヘミアン',
    'ビンテージ', 'レトロ', 'コンテンポラリー', 'ラグジュアリー'
  ];
  
  // テキストからスタイルキーワードを抽出
  for (const keyword of styleKeywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  
  // キーワードが見つからない場合は空文字列を返す（extractKeywords は呼ばない）
  return '';
}

export function generateSearchQuery(
  analysisResult: any,
  axis: 'color' | 'texture' | 'tone' | 'layout',
  includePinterest: boolean = true // Pinterestを優先するか
): string {
  let baseQuery = '';
  
  switch (axis) {
    case 'color':
      if (analysisResult.colors && analysisResult.colors.length > 0) {
        const colorNames = analysisResult.colors
          .map((c: any) => c.name || c.hex)
          .slice(0, 3)
          .join(' ');
        baseQuery = `${colorNames} インテリア デザイン`;
      } else {
        baseQuery = 'インテリア デザイン';
      }
      break;

    case 'texture':
      // texture または style からキーワードを抽出
      const texture = analysisResult.texture || analysisResult.style || '';
      if (texture) {
        // スタイルキーワードを優先的に抽出
        const styleKeyword = extractStyleKeywords(texture);
        // スタイルキーワードが短い場合のみ使用（長い場合は extractKeywords の結果を使用）
        if (styleKeyword && styleKeyword.length < 20 && styleKeyword !== texture) {
          baseQuery = `${styleKeyword} インテリア デザイン`;
        } else {
          // スタイルキーワードが見つからない、または長い場合は、最初の2単語のみを使用
          const shortKeywords = extractKeywords(texture, 2);
          baseQuery = shortKeywords ? `${shortKeywords} インテリア デザイン` : 'インテリア デザイン';
        }
      } else {
        baseQuery = 'インテリア デザイン';
      }
      break;

    case 'tone':
      // moodKeywords を優先的に使用
      const keywords = analysisResult.moodKeywords || [];
      if (keywords.length > 0) {
        // キーワードを最大3つまで使用
        const toneKeywords = keywords.slice(0, 3).join(' ');
        baseQuery = `${toneKeywords} インテリア デザイン`;
      } else {
        // tone が長い文章の場合は、最初の2-3単語のみを使用
        const tone = analysisResult.tone || '';
        const toneKeywords = extractKeywords(tone, 2);
        baseQuery = toneKeywords ? `${toneKeywords} インテリア デザイン` : 'インテリア デザイン';
      }
      break;

    case 'layout':
      const layout = analysisResult.layout || '';
      if (layout) {
        // レイアウト関連のキーワードを抽出（最大2単語）
        const layoutKeywords = extractKeywords(layout, 2);
        baseQuery = layoutKeywords ? `${layoutKeywords} レイアウト インテリア デザイン` : 'レイアウト インテリア デザイン';
      } else {
        baseQuery = 'レイアウト インテリア デザイン';
      }
      break;

    default:
      baseQuery = 'インテリア デザイン';
  }

  // Pinterestを優先する場合、クエリに追加
  if (includePinterest) {
    // site:pinterest.com を使用してPinterestの画像のみを取得
    return `site:pinterest.com ${baseQuery}`;
  }

  return baseQuery;
}

