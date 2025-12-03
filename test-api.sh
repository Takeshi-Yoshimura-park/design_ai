#!/bin/bash

# APIテストスクリプト

echo "=== API動作確認テスト ==="
echo ""

# 1. サーバーが起動しているか確認
echo "1. サーバーの状態確認..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ サーバーは起動しています"
else
    echo "✗ サーバーが起動していません"
    echo "  npm run dev を実行してください"
    exit 1
fi

echo ""

# 2. 環境変数の確認
echo "2. 環境変数の確認..."
cd app
if [ -f .env.local ]; then
    if grep -q "GEMINI_API_KEY=AIza" .env.local; then
        echo "✓ Gemini APIキーが設定されています"
    else
        echo "⚠ Gemini APIキーが設定されていない可能性があります"
    fi
else
    echo "✗ .env.localファイルが見つかりません"
fi

echo ""

# 3. APIエンドポイントの存在確認
echo "3. APIエンドポイントの確認..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/analyze | grep -q "405\|400"; then
    echo "✓ /api/analyze エンドポイントは存在します（POSTメソッドが必要）"
else
    echo "⚠ /api/analyze エンドポイントの確認に失敗しました"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/search/pinterest | grep -q "405\|400"; then
    echo "✓ /api/search/pinterest エンドポイントは存在します（POSTメソッドが必要）"
else
    echo "⚠ /api/search/pinterest エンドポイントの確認に失敗しました"
fi

echo ""
echo "=== テスト完了 ==="
echo ""
echo "次のステップ:"
echo "1. ブラウザで http://localhost:3000 を開く"
echo "2. 画像をアップロードしてAPIをテスト"
echo ""

