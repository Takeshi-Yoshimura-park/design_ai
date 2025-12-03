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

type ErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'IMAGE_TOO_LARGE'
  | 'INVALID_FORMAT'
  | 'ANALYSIS_FAILED'
  | 'SEARCH_FAILED'
  | 'SEARCH_NO_RESULTS'
  | 'UNKNOWN';

interface ErrorState {
  message: string;
  type: ErrorType;
  retryAction?: () => void;
}

const errorMessages: Record<ErrorType, string> = {
  NETWORK_ERROR: 'インターネット接続を確認してください',
  API_ERROR: 'サービスに接続できませんでした。しばらく待ってから再度お試しください',
  IMAGE_TOO_LARGE: '画像サイズが大きすぎます。10MB以下の画像を選択してください',
  INVALID_FORMAT: '対応していない画像形式です。JPG、PNG、GIF、WebP形式の画像を選択してください',
  ANALYSIS_FAILED: '画像の分析に失敗しました。別の画像をお試しください',
  SEARCH_FAILED: '類似画像の検索に失敗しました。しばらく待ってから再度お試しください',
  SEARCH_NO_RESULTS: '画像が見つかりませんでした。別の検索軸をお試しください',
  UNKNOWN: 'エラーが発生しました。もう一度お試しください',
};

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isSearchAxisSelectorOpen, setIsSearchAxisSelectorOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastSearchAxis, setLastSearchAxis] = useState<'color' | 'texture' | 'tone' | 'layout' | null>(null);
  const [searchedAxes, setSearchedAxes] = useState<Set<'color' | 'texture' | 'tone' | 'layout'>>(new Set());

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
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || '分析に失敗しました';
        
        let errorType: ErrorType = 'ANALYSIS_FAILED';
        if (errorMessage.includes('サイズ') || errorMessage.includes('大き')) {
          errorType = 'IMAGE_TOO_LARGE';
        } else if (errorMessage.includes('形式') || errorMessage.includes('フォーマット')) {
          errorType = 'INVALID_FORMAT';
        } else if (!navigator.onLine || errorMessage.includes('ネットワーク') || errorMessage.includes('接続')) {
          errorType = 'NETWORK_ERROR';
        }

        setError({
          message: errorMessages[errorType],
          type: errorType,
          retryAction: () => analyzeImage(file),
        });
        return;
      }

      const data = await response.json();
      setAnalysisResult(data.result);
      setError(null);
    } catch (err: any) {
      const errorType: ErrorType = !navigator.onLine ? 'NETWORK_ERROR' : 'ANALYSIS_FAILED';
      setError({
        message: errorMessages[errorType],
        type: errorType,
        retryAction: () => analyzeImage(file),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearchAxisSelect = async (axis: 'color' | 'texture' | 'tone' | 'layout') => {
    if (!analysisResult) return;

    setLastSearchAxis(axis);
    await searchImages(axis);
  };

  const searchImages = async (axis: 'color' | 'texture' | 'tone' | 'layout') => {
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || '検索に失敗しました';
        
        let errorType: ErrorType = 'SEARCH_FAILED';
        if (!navigator.onLine || errorMessage.includes('ネットワーク') || errorMessage.includes('接続')) {
          errorType = 'NETWORK_ERROR';
        }

        setError({
          message: errorMessages[errorType],
          type: errorType,
          retryAction: () => searchImages(axis),
        });
        return;
      }

      const data = await response.json();

      // 検索結果が0件の場合のエラーメッセージを表示
      if (!data.success || data.images.length === 0) {
        setError({
          message: errorMessages.SEARCH_NO_RESULTS,
          type: 'SEARCH_NO_RESULTS',
          retryAction: () => searchImages(axis),
        });
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
      setSearchedAxes((prev) => new Set([...prev, axis]));
      setError(null);
    } catch (err: any) {
      const errorType: ErrorType = !navigator.onLine ? 'NETWORK_ERROR' : 'SEARCH_FAILED';
      setError({
        message: errorMessages[errorType],
        type: errorType,
        retryAction: () => searchImages(axis),
      });
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
    setSearchResults((prev) => {
      const removed = prev[index];
      const newResults = prev.filter((_, i) => i !== index);
      
      // 削除された検索結果の軸をsearchedAxesからも削除
      if (removed) {
        const axisId = Object.entries({
          'カラー軸': 'color',
          '質感・スタイル軸': 'texture',
          'トーン＆ムード軸': 'tone',
          'レイアウト特性軸': 'layout',
        }).find(([label]) => label === removed.axis)?.[1] as 'color' | 'texture' | 'tone' | 'layout' | undefined;
        
        if (axisId) {
          setSearchedAxes((prevAxes) => {
            const newAxes = new Set(prevAxes);
            newAxes.delete(axisId);
            return newAxes;
          });
        }
      }
      
      return newResults;
    });
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium">{error.message}</p>
                {error.retryAction && (
                  <button
                    onClick={() => {
                      setError(null);
                      error.retryAction?.();
                    }}
                    className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    再試行
                  </button>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
                aria-label="エラーメッセージを閉じる"
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

        {/* 検索中の表示 - 分析結果の下に表示 */}
        {isSearching && analysisResult && (
          <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4 text-center text-blue-800">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p>類似画像を検索中...</p>
            {lastSearchAxis && (
              <p className="mt-1 text-sm text-blue-600">
                {getAxisLabel(lastSearchAxis)}で検索中
              </p>
            )}
          </div>
        )}

        {/* 検索軸選択モーダル */}
        <SearchAxisSelector
          isOpen={isSearchAxisSelectorOpen}
          onClose={() => setIsSearchAxisSelectorOpen(false)}
          onSelect={handleSearchAxisSelect}
          searchedAxes={searchedAxes}
        />
      </div>
    </div>
  );
}
