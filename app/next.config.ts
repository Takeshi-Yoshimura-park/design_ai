import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run用のstandalone出力を有効化
  output: 'standalone',
  
  // 画像最適化の設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
    ],
    // CORS問題を回避するため、外部画像の最適化を無効化
    unoptimized: false,
    // 画像読み込みのタイムアウトを延長
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
