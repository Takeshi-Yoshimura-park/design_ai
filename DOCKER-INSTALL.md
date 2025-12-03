# Dockerインストール手順（macOS）

## 方法1: Docker Desktopをインストール（推奨）

### ステップ1: Docker Desktopをダウンロード

1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) にアクセス
2. 「Download for Mac」をクリック
3. Apple Silicon（M1/M2/M3）の場合は「Mac with Apple Silicon」を選択
4. Intel Macの場合は「Mac with Intel chip」を選択

### ステップ2: インストール

1. ダウンロードした `.dmg` ファイルを開く
2. DockerアイコンをApplicationsフォルダにドラッグ
3. ApplicationsフォルダからDockerを起動
4. 初回起動時に権限の許可を求められるので、許可する

### ステップ3: 動作確認

```bash
docker --version
docker ps
```

## 方法2: Homebrewでインストール

```bash
# Homebrewでインストール
brew install --cask docker

# Docker Desktopを起動
open -a Docker
```

## インストール後の確認

```bash
# Dockerが動作しているか確認
docker ps

# Docker Composeが使えるか確認
docker compose version
```

## トラブルシューティング

### Dockerが起動しない場合

1. Docker Desktopアプリを起動
2. メニューバーのDockerアイコンを確認
3. 「Docker Desktop is running」と表示されていればOK

### 権限エラーが発生する場合

1. Docker Desktopの設定を開く
2. 「Resources」→「File Sharing」で必要なディレクトリを追加

## インストール後のデプロイ

Dockerがインストールされたら、元のデプロイスクリプトを使用できます：

```bash
./scripts/deploy.sh
```

