import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * 画像プロキシAPI
 * Google画像検索で取得した画像をサーバーサイドで取得してCORS問題を回避
 * GET /api/image-proxy?url={画像URL}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが必要です' },
        { status: 400 }
      );
    }

    console.log('画像プロキシリクエスト:', imageUrl.substring(0, 100) + '...');

    // 画像を取得
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    // 画像のContent-Typeを取得
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const contentLength = response.headers['content-length'];

    console.log('画像取得成功:', {
      contentType,
      contentLength,
      status: response.status,
    });

    // 画像データを返す
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('=== 画像プロキシエラー詳細 ===');
    console.error('Image URL:', request.nextUrl.searchParams.get('url'));
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('Request made but no response received');
    }
    
    console.error('================================');
    
    return NextResponse.json(
      { 
        error: '画像の取得に失敗しました',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

