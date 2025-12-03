'use client';

interface Color {
  name?: string;
  hex?: string;
  rgb?: string;
}

interface AnalysisResult {
  colors?: Color[];
  texture?: string;
  style?: string;
  tone?: string;
  moodKeywords?: string[];
  layout?: string;
  raw?: string;
}

interface AnalysisResultProps {
  result: AnalysisResult;
  onSearchAxisSelect: () => void;
}

export default function AnalysisResult({ result, onSearchAxisSelect }: AnalysisResultProps) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">分析結果</h2>

      {/* カラー */}
      {result.colors && result.colors.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <h3 className="font-medium text-gray-700">カラー</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {result.colors.map((color, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div
                  className="h-16 w-16 rounded-full border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.hex || '#cccccc' }}
                  title={color.name || color.hex}
                />
                {color.hex && (
                  <span className="text-xs text-gray-600">{color.hex}</span>
                )}
                {color.name && (
                  <span className="text-xs text-gray-500">{color.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 質感・スタイル */}
      {(result.texture || result.style) && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <h3 className="font-medium text-gray-700">質感・スタイル</h3>
          </div>
          <p className="text-gray-600">
            {result.texture || result.style}
          </p>
        </div>
      )}

      {/* トーン＆ムード */}
      {(result.tone || result.moodKeywords) && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">💫</span>
            <h3 className="font-medium text-gray-700">トーン＆ムード</h3>
          </div>
          {result.tone && <p className="mb-2 text-gray-600">{result.tone}</p>}
          {result.moodKeywords && result.moodKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.moodKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* レイアウト特性 */}
      {result.layout && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📐</span>
            <h3 className="font-medium text-gray-700">レイアウト特性</h3>
          </div>
          <p className="text-gray-600">{result.layout}</p>
        </div>
      )}

      {/* 検索軸選択ボタン */}
      <button
        onClick={onSearchAxisSelect}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        <span className="text-xl">+</span>
        <span>検索軸を選択</span>
      </button>
    </div>
  );
}

