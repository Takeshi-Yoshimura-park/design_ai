'use client';

interface SearchAxisSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (axis: 'color' | 'texture' | 'tone' | 'layout') => void;
  searchedAxes?: Set<'color' | 'texture' | 'tone' | 'layout'>;
}

const searchAxes = [
  { 
    id: 'color' as const, 
    label: 'カラー軸', 
    icon: '🎨',
    description: '画像の主要な色に基づいて類似画像を検索します'
  },
  { 
    id: 'texture' as const, 
    label: '質感・スタイル軸', 
    icon: '🎭',
    description: '画像の質感やスタイルに基づいて類似画像を検索します'
  },
  { 
    id: 'tone' as const, 
    label: 'トーン＆ムード軸', 
    icon: '💫',
    description: '画像のトーンやムードに基づいて類似画像を検索します'
  },
  { 
    id: 'layout' as const, 
    label: 'レイアウト特性軸', 
    icon: '📐',
    description: '画像のレイアウト特性に基づいて類似画像を検索します'
  },
];

export default function SearchAxisSelector({
  isOpen,
  onClose,
  onSelect,
  searchedAxes = new Set(),
}: SearchAxisSelectorProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">検索軸を選択</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {searchAxes.map((axis) => {
            const isSearched = searchedAxes.has(axis.id);
            return (
              <button
                key={axis.id}
                onClick={() => {
                  onSelect(axis.id);
                  onClose();
                }}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSearched
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{axis.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`block font-medium ${isSearched ? 'text-blue-800' : 'text-gray-700'}`}>
                      {axis.label}
                    </span>
                    {isSearched && (
                      <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
                        検索済み
                      </span>
                    )}
                  </div>
                  {axis.description && (
                    <span className={`mt-1 block text-sm ${isSearched ? 'text-blue-600' : 'text-gray-500'}`}>
                      {axis.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

