#!/bin/zsh
# 新リポジトリ futari-list-app- へ初回 push するスクリプト（Mac で実行）
#
# 使い方:
#   1. GitHub で futari-list-app- リポジトリを作成済みであること
#   2. このスクリプトがある world-ai-news-app を clone 済みであること
#   3. zsh scripts/push-to-futari-list-repo.sh

set -e

REPO_URL="${1:-https://github.com/kikurin-tasogare/futari-list-app-.git}"
WORKDIR="${2:-$HOME/Desktop/futari-list-app-push}"

echo "=== ふたりリスト → 新リポジトリへ移行 ==="
echo "リポジトリ: $REPO_URL"
echo "作業フォルダ: $WORKDIR"
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/futari-list"

if [[ ! -d "$SOURCE" ]]; then
  echo "futari-list フォルダが見つかりません: $SOURCE" >&2
  echo "world-ai-news-app の cursor/futari-list-app-1128 ブランチを checkout してください" >&2
  exit 1
fi

rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

echo "ファイルをコピー..."
cp -R "$SOURCE/." "$WORKDIR/"

cd "$WORKDIR"

if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "リモートの README を取り込み..."
git pull origin main --allow-unrelated-histories --no-edit 2>/dev/null || git pull origin main --rebase --autostash 2>/dev/null || true

git add .
git commit -m "Add ふたりリスト PWA" || echo "（変更なし）"

echo ""
echo "push します..."
git push -u origin main

echo ""
echo "=== 完了 ==="
echo "次: GitHub → Settings → Pages → Source: GitHub Actions"
echo "公開 URL: https://kikurin-tasogare.github.io/futari-list-app-/"
