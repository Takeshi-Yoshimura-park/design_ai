# クイックスタートガイド

## 🚀 最短でセットアップする方法

### 前提条件

- Googleアカウントを持っている
- ターミナル（コマンドライン）が使える
- macOS / Linux / Windows (WSL)

---

## ステップ1: Google Cloud SDKのインストール

### macOS
```bash
brew install google-cloud-sdk
```

### その他のOS
[公式インストールガイド](https://cloud.google.com/sdk/docs/install)を参照

---

## ステップ2: GCPプロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト選択ドロップダウン → 「新しいプロジェクト」
3. プロジェクト名を入力（例: `design-ai`）
4. 「作成」をクリック

---

## ステップ3: gcloud CLIの初期化

```bash
gcloud init
```

プロンプトに従って：
1. ログイン（ブラウザが開きます）
2. 作成したプロジェクトを選択
3. リージョンを選択（推奨: `asia-northeast1`）

---

## ステップ4: 自動セットアップスクリプトの実行

```bash
# スクリプトを実行
./scripts/setup-infrastructure.sh
```

このスクリプトが以下を自動で実行します：
- ✅ 必要なAPIの有効化
- ✅ Artifact Registryリポジトリの作成
- ✅ Secret Managerの設定（Gemini APIキーの保存）
- ✅ サービスアカウントへの権限付与
- ✅ Cloud Runのリージョン設定

**注意**: Gemini APIキーを入力する必要があります。
[Google AI Studio](https://makersuite.google.com/app/apikey) で取得してください。

---

## ステップ5: 手動セットアップ（スクリプトを使わない場合）

詳細な手順は `infrastructure-setup.md` を参照してください。

---

## セットアップの確認

```bash
# プロジェクトIDを確認
gcloud config get-value project

# リージョンを確認
gcloud config get-value run/region

# シークレットを確認
gcloud secrets list
```

---

## 次のステップ

インフラのセットアップが完了したら：

1. **Next.jsプロジェクトの作成**
   ```bash
   npx create-next-app@latest design-ai-app
   ```

2. **プロジェクトの設定**
   - 必要なパッケージのインストール
   - 環境変数の設定

3. **開発開始**

---

## トラブルシューティング

### gcloudコマンドが見つからない
- Google Cloud SDKが正しくインストールされているか確認
- パスが通っているか確認: `which gcloud`

### プロジェクトが見つからない
- `gcloud init` を再実行
- Cloud Consoleでプロジェクトが作成されているか確認

### 権限エラー
- 適切なIAM権限が付与されているか確認
- プロジェクトのオーナーまたは編集者権限が必要です

---

## 参考資料

- 詳細な手順: `infrastructure-setup.md`
- コスト見積もり: `cost-estimation.md`
- 要件定義: `requirements.md`

