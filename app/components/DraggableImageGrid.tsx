'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PinterestImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  pinterestUrl: string;
}

interface DraggableImageProps {
  image: PinterestImage;
  index: number;
  onRemove?: () => void;
}

function DraggableImage({ image, index, onRemove }: DraggableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // 画像プロキシAPIを使用してCORS問題を回避
  // Googleのサムネイル画像はCORSでブロックされる可能性があるため、プロキシ経由で取得
  const imageSrc = image.thumbnailUrl 
    ? `/api/image-proxy?url=${encodeURIComponent(image.thumbnailUrl)}`
    : image.url 
    ? `/api/image-proxy?url=${encodeURIComponent(image.url)}`
    : '';
  
  // デバッグ: 画像URLを確認
  if (typeof window !== 'undefined' && !imageError) {
    console.log('画像URL:', {
      thumbnailUrl: image.thumbnailUrl,
      url: image.url,
      imageSrc: imageSrc,
    });
  }

  // 画像URLが無効な場合のフォールバック
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('画像の読み込みに失敗しました:', {
      thumbnailUrl: image.thumbnailUrl,
      url: image.url,
      imageSrc: imageSrc,
      error: e,
    });
    
    if (!imageError) {
      setImageError(true);
      // サムネイルが失敗した場合、別のURLを試す
      if (image.thumbnailUrl && image.url && image.thumbnailUrl !== image.url) {
        // 既に別のURLを試しているので、エラー状態を維持
      }
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative cursor-move overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // ドラッグ中でない場合のみクリック処理を実行
          if (e.detail === 0) return; // ドラッグイベントの場合は無視
          
          // PinterestのURLを優先的に使用
          const targetUrl = image.pinterestUrl || image.url;
          
          console.log('画像クリック:', {
            pinterestUrl: image.pinterestUrl,
            url: image.url,
            targetUrl: targetUrl,
          });
          
          if (targetUrl && targetUrl.startsWith('http')) {
            // PinterestのURLかどうかを確認
            if (targetUrl.includes('pinterest.com') || targetUrl.includes('pinterest.jp')) {
              // PinterestのURLの場合は新しいタブで開く
              window.open(targetUrl, '_blank', 'noopener,noreferrer');
            } else {
              // Pinterest以外のURLの場合も新しいタブで開く（念のため）
              window.open(targetUrl, '_blank', 'noopener,noreferrer');
            }
          } else if (image.url) {
            // URLが無効な場合は拡大表示
            setSelectedImage(image.url);
          }
        }}
      >
        {/* デバッグ: 画像情報を表示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 left-0 z-50 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {imageSrc ? 'URL: OK' : 'URL: NG'}
          </div>
        )}
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          {imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt={image.alt || `画像 ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover z-10 cursor-pointer"
                style={{ 
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                onError={handleImageError}
                onLoad={() => {
                  console.log('✅ 画像読み込み成功:', imageSrc.substring(0, 100));
                }}
                onLoadStart={() => {
                  console.log('🔄 画像読み込み開始:', imageSrc.substring(0, 100));
                }}
                onClick={(e) => {
                  e.stopPropagation(); // 親要素のクリックイベントを防ぐ
                  
                  // PinterestのURLを優先的に使用
                  const targetUrl = image.pinterestUrl || image.url;
                  
                  console.log('画像クリック:', {
                    pinterestUrl: image.pinterestUrl,
                    url: image.url,
                    targetUrl: targetUrl,
                  });
                  
                  if (targetUrl && targetUrl.startsWith('http')) {
                    // PinterestのURLかどうかを確認
                    if (targetUrl.includes('pinterest.com') || targetUrl.includes('pinterest.jp')) {
                      // PinterestのURLの場合は新しいタブで開く
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      // Pinterest以外のURLの場合も新しいタブで開く（念のため）
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    }
                  } else if (image.url) {
                    // URLが無効な場合は拡大表示
                    setSelectedImage(image.url);
                  }
                }}
                loading="lazy"
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 text-sm z-20">
                  画像の読み込みに失敗しました
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
              <span>画像URLがありません</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-10 pointer-events-none z-5" />
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-2 rounded-full bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-50"
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
        )}
      </div>

      {/* 画像拡大表示モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={selectedImage}
              alt="拡大表示"
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
    </>
  );
}

interface DraggableImageGridProps {
  images: PinterestImage[];
  title: string;
  onRemove?: () => void;
  onImagesReorder?: (newImages: PinterestImage[]) => void;
}

export default function DraggableImageGrid({
  images,
  title,
  onRemove,
  onImagesReorder,
}: DraggableImageGridProps) {
  const [items, setItems] = useState(images);

  // imagesが変更されたらitemsを更新
  useEffect(() => {
    setItems(images);
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(
          (_, i) => `image-${i}` === active.id
        );
        const newIndex = items.findIndex((_, i) => `image-${i}` === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // 親コンポーネントに通知
        if (onImagesReorder) {
          onImagesReorder(newItems);
        }

        return newItems;
      });
    }
  };

  if (items.length === 0) return null;

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((_, index) => `image-${index}`)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
            {items.map((image, index) => (
              <DraggableImage
                key={`${image.url}-${index}`}
                image={image}
                index={index}
                onRemove={
                  onRemove
                    ? () => {
                        const newItems = items.filter((_, i) => i !== index);
                        setItems(newItems);
                        if (onImagesReorder) {
                          onImagesReorder(newItems);
                        }
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

