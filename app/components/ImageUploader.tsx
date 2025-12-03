'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageUpload, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        onImageUpload(acceptedFiles[0]);
      }
    },
    [onImageUpload, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
        ${
          isDragActive || isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
      onMouseEnter={() => setIsDragging(true)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'ここに画像をドロップ' : '画像をドラッグ&ドロップ'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            またはクリックしてファイルを選択
          </p>
          <p className="mt-1 text-xs text-gray-400">
            JPG, PNG, GIF, WebP（最大10MB）
          </p>
        </div>
      </div>
    </div>
  );
}

