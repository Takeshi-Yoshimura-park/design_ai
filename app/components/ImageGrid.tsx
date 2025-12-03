'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

interface ImageGridProps {
  images: PinterestImage[];
  title: string;
  onRemove?: () => void;
}

export default function ImageGrid({ images, title, onRemove }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            削除
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            onClick={() => {
              if (image.pinterestUrl) {
                window.open(image.pinterestUrl, '_blank');
              } else {
                setSelectedImage(image.url);
              }
            }}
          >
            <div className="aspect-square relative">
              <Image
                src={image.thumbnailUrl || image.url}
                alt={image.alt || `画像 ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-10" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 個別削除機能は後で実装
              }}
              className="absolute right-2 top-2 rounded-full bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              aria-label="画像を削除"
            >
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 画像拡大表示モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={selectedImage}
              alt="拡大表示"
              width={800}
              height={800}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-800 shadow-lg"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

