import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleImages } from '@/lib/google-image-search';
import { generateSearchQuery } from '@/lib/pinterest-queries';

/**
 * Google画像検索API
 * POST /api/search/google-images
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

    // APIキーとCSE IDの取得
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !cseId) {
      console.error('Google Custom Search APIの設定が不足しています');
      console.error('GOOGLE_CUSTOM_SEARCH_API_KEY:', apiKey ? `設定済み (${apiKey.substring(0, 10)}...)` : '未設定');
      console.error('GOOGLE_CUSTOM_SEARCH_ENGINE_ID:', cseId ? `設定済み (${cseId})` : '未設定');
      
      return NextResponse.json(
        { error: 'Google Custom Search APIの設定が完了していません。APIキーとCSE IDを確認してください' },
        { status: 500 }
      );
    }

    // デバッグ用: APIキーとCSE IDの先頭部分をログ出力（セキュリティのため一部のみ）
    console.log('API Key (先頭10文字):', apiKey.substring(0, 10) + '...');
    console.log('CSE ID:', cseId);

    // 検索クエリを生成（Pinterestを優先）
    const query = generateSearchQuery(analysisResult, axis, true);

    // Google画像検索を実行
    const images = await searchGoogleImages(query, apiKey, cseId, 5);

    console.log(`Google画像検索結果: ${images.length}枚の画像を取得`);

    return NextResponse.json({
      success: true,
      query: query,
      images: images,
    });
  } catch (error: any) {
    console.error('Google image search error:', error);
    console.error('Error stack:', error.stack);
    
    // エラーメッセージを適切に処理
    let errorMessage = '検索に失敗しました。別の検索軸をお試しください';
    let statusCode = 500;
    
    if (error.message?.includes('認証に失敗') || error.message?.includes('APIキー')) {
      errorMessage = 'Google Custom Search APIの認証に失敗しました。APIキーを確認してください';
      statusCode = 401;
    } else if (error.message?.includes('レート制限')) {
      errorMessage = 'APIのレート制限に達しました。しばらく待ってから再度お試しください';
      statusCode = 429;
    } else if (error.message?.includes('タイムアウト')) {
      errorMessage = '検索がタイムアウトしました。しばらく待ってから再度お試しください';
      statusCode = 504;
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDevelopment && { details: error.message })
      },
      { status: statusCode }
    );
  }
}

