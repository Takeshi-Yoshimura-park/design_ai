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
    ],
  },
};

export default nextConfig;
