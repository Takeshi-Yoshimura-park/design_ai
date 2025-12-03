'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import AnalysisResult from '@/components/AnalysisResult';
import SearchAxisSelector from '@/components/SearchAxisSelector';
import DraggableImageGrid from '@/components/DraggableImageGrid';
import Image from 'next/image';

interface AnalysisResultData {
  colors?: Array<{ name?: string; hex?: string; rgb?: string }>;
  texture?: string;
  style?: string;
  tone?: string;
  moodKeywords?: string[];
  layout?: string;
  raw?: string;
}

interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

interface SearchResult {
  axis: string;
  query: string;
  images: PinterestImage[];
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchAxisSelectorOpen, setIsSearchAxisSelectorOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleImageUpload = async (file: File) => {
    setError(null);
    setUploadedImage(file);
    setAnalysisResult(null);
    setSearchResults([]);

    // 画像プレビューを作成
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 画像分析を開始
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析に失敗しました');
      }

      const data = await response.json();
      setAnalysisResult(data.result);
    } catch (err: any) {
      setError(err.message || '分析に失敗しました。もう一度お試しください');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearchAxisSelect = async (axis: 'color' | 'texture' | 'tone' | 'layout') => {
    if (!analysisResult) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/search/google-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResult,
          axis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '検索に失敗しました');
      }

      const data = await response.json();

      // 検索結果が0件の場合のエラーメッセージを表示
      if (!data.success || data.images.length === 0) {
        setError(data.error || '画像が見つかりませんでした。別の検索軸をお試しください。');
        return;
      }

      // 検索結果を追加
      setSearchResults((prev) => [
        ...prev,
        {
          axis: getAxisLabel(axis),
          query: data.query,
          images: data.images,
        },
      ]);
    } catch (err: any) {
      setError(err.message || '検索に失敗しました。別の検索軸をお試しください');
    } finally {
      setIsSearching(false);
    }
  };

  const getAxisLabel = (axis: string): string => {
    const labels: Record<string, string> = {
      color: 'カラー軸',
      texture: '質感・スタイル軸',
      tone: 'トーン＆ムード軸',
      layout: 'レイアウト特性軸',
    };
    return labels[axis] || axis;
  };

  const handleRemoveSearchResult = (index: number) => {
    setSearchResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImagesReorder = (index: number, newImages: PinterestImage[]) => {
    setSearchResults((prev) => {
      const newResults = [...prev];
      newResults[index] = {
        ...newResults[index],
        images: newImages,
      };
      return newResults;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:mb-8 sm:text-3xl">
          イメージボード作成ツール
        </h1>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 画像アップロード */}
        {!uploadedImage && (
          <div className="mb-8">
            <ImageUploader onImageUpload={handleImageUpload} disabled={isAnalyzing} />
          </div>
        )}

        {/* アップロード済み画像と分析結果 */}
        {uploadedImage && imagePreview && (
          <div className="mb-8">
            <div className="mb-6 flex flex-col items-center gap-4 sm:gap-6">
              {/* 元画像 */}
              <div className="relative w-full max-w-md">
                <Image
                  src={imagePreview}
                  alt="アップロードした画像"
                  width={400}
                  height={400}
                  className="w-full max-h-[300px] sm:max-h-[400px] rounded-lg border border-gray-200 object-contain shadow-md"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                      <p>画像を分析中...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 分析結果 */}
              {analysisResult && (
                <AnalysisResult
                  result={analysisResult}
                  onSearchAxisSelect={() => setIsSearchAxisSelectorOpen(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <div className="space-y-8">
            {searchResults.map((result, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-6">
                <DraggableImageGrid
                  images={result.images}
                  title={result.axis}
                  onRemove={() => handleRemoveSearchResult(index)}
                  onImagesReorder={(newImages) => handleImagesReorder(index, newImages)}
                />
              </div>
            ))}
          </div>
        )}

        {/* 検索中の表示 */}
        {isSearching && (
          <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4 text-center text-blue-800">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p>類似画像を検索中...</p>
          </div>
        )}

        {/* 検索軸選択モーダル */}
        <SearchAxisSelector
          isOpen={isSearchAxisSelectorOpen}
          onClose={() => setIsSearchAxisSelectorOpen(false)}
          onSelect={handleSearchAxisSelect}
        />
      </div>
    </div>
  );
}
