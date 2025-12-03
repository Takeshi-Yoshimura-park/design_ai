import { NextRequest, NextResponse } from 'next/server';
import { searchPinterestImages, generateSearchQuery } from '@/lib/pinterest';

/**
 * Pinterest検索API
 * POST /api/search/pinterest
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisResult, axis } = body;

    if (!analysisResult || !axis) {
      return NextResponse.json(
        { error: '分析結果と検索軸が必要です' },
        { status: 400 }
      );
    }

    // 検索軸のバリデーション
    const validAxes = ['color', 'texture', 'tone', 'layout'];
    if (!validAxes.includes(axis)) {
      return NextResponse.json(
        { error: '無効な検索軸です' },
        { status: 400 }
      );
    }

    // 検索クエリを生成
    const query = generateSearchQuery(analysisResult, axis);

    // Pinterestから画像を検索
    const images = await searchPinterestImages(query, 5);

    return NextResponse.json({
      success: true,
      query: query,
      images: images,
    });
  } catch (error: any) {
    console.error('Pinterest search error:', error);
    
    return NextResponse.json(
      { error: '検索に失敗しました。別の検索軸をお試しください' },
      { status: 500 }
    );
  }
}

