import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';

/**
 * 画像分析API
 * POST /api/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルが提供されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大10MB）' },
        { status: 400 }
      );
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していないファイル形式です' },
        { status: 400 }
      );
    }

    // 画像をBase64に変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Gemini APIで画像を分析
    const analysisResult = await analyzeImage(base64, file.type);

    return NextResponse.json({
      success: true,
      result: analysisResult,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    // エラーメッセージを適切に処理
    let errorMessage = '分析に失敗しました。もう一度お試しください';
    if (error.message?.includes('API_KEY')) {
      errorMessage = 'APIキーが設定されていません';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'APIの利用制限に達しました';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

