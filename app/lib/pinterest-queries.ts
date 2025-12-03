/**
 * 検索クエリを生成
 * AI分析結果に基づいてGoogle画像検索用のクエリを生成
 * Pinterestを優先するため、"pinterest" キーワードを追加
 */
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
      const texture = analysisResult.texture || analysisResult.style || '';
      baseQuery = `${texture} インテリア デザイン`;
      break;

    case 'tone':
      const tone = analysisResult.tone || '';
      const keywords = analysisResult.moodKeywords || [];
      const toneQuery = tone || keywords.join(' ');
      baseQuery = `${toneQuery} インテリア デザイン`;
      break;

    case 'layout':
      const layout = analysisResult.layout || '';
      baseQuery = `${layout} レイアウト インテリア デザイン`;
      break;

    default:
      baseQuery = 'インテリア デザイン';
  }

  // Pinterestを優先する場合、クエリに追加
  if (includePinterest) {
    // オプション1: "pinterest" キーワードを追加（推奨）
    // これにより、Pinterestの画像が優先的に表示される
    return `pinterest ${baseQuery}`;
    
    // オプション2: site:pinterest.com を使用（より厳密にPinterestのみ）
    // 結果数が少なくなる可能性があるため、まずはオプション1を試す
    // return `site:pinterest.com ${baseQuery}`;
  }

  return baseQuery;
}

