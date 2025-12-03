'use client';

interface SearchAxisSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (axis: 'color' | 'texture' | 'tone' | 'layout') => void;
}

const searchAxes = [
  { id: 'color' as const, label: 'カラー軸', icon: '🎨' },
  { id: 'texture' as const, label: '質感・スタイル軸', icon: '🎭' },
  { id: 'tone' as const, label: 'トーン＆ムード軸', icon: '💫' },
  { id: 'layout' as const, label: 'レイアウト特性軸', icon: '📐' },
];

export default function SearchAxisSelector({
  isOpen,
  onClose,
  onSelect,
}: SearchAxisSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">検索軸を選択</h2>
        <div className="space-y-2">
          {searchAxes.map((axis) => (
            <button
              key={axis.id}
              onClick={() => {
                onSelect(axis.id);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="text-2xl">{axis.icon}</span>
              <span className="font-medium text-gray-700">{axis.label}</span>
            </button>
          ))}
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

