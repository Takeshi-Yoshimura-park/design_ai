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

    // デバッグ用: 取得した画像URLをログ出力
    console.log(`取得した画像数: ${images.length}`);
    images.forEach((img, idx) => {
      console.log(`画像${idx + 1}: ${img.thumbnailUrl || img.url}`);
    });

    return NextResponse.json({
      success: true,
      query: query,
      images: images,
    });
  } catch (error: any) {
    console.error('Pinterest search error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // エラーメッセージを適切に処理
    let errorMessage = '検索に失敗しました。別の検索軸をお試しください';
    let errorDetails = error.message || 'Unknown error';
    
    if (error.message?.includes('timeout')) {
      errorMessage = '検索がタイムアウトしました。しばらく待ってから再度お試しください';
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      errorMessage = 'Pinterestへのアクセスが拒否されました。しばらく待ってから再度お試しください';
    }

    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDevelopment && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

