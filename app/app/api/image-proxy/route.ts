import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * 画像プロキシAPI
 * Pinterestの画像をサーバーサイドで取得してCORS問題を回避
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

    // URLの検証（Pinterestの画像のみ許可）
    if (!imageUrl.includes('pinimg.com')) {
      return NextResponse.json(
        { error: '許可されていない画像URLです' },
        { status: 400 }
      );
    }

    // 画像を取得
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.pinterest.jp/',
      },
      timeout: 10000,
    });

    // 画像のContent-Typeを取得
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // 画像データを返す
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    return NextResponse.json(
      { error: '画像の取得に失敗しました' },
      { status: 500 }
    );
  }
}

