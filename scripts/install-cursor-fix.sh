#!/bin/zsh
# Mac 用 cursor-fix インストーラー
# 使い方: zsh install-cursor-fix.sh

set -e

BIN_DIR="$HOME/bin"
INSTALL_PATH="$BIN_DIR/cursor-fix"
ZSHRC="$HOME/.zshrc"

echo "=== cursor-fix インストール ==="

mkdir -p "$BIN_DIR"

cat > "$INSTALL_PATH" << 'SCRIPT'
#!/bin/zsh
set -e

DB="$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"

if [[ ! -f "$DB" ]]; then
  echo "Cursor の DB が見つかりません: $DB" >&2
  exit 1
fi

echo "Cursor を終了しています..."
osascript -e 'quit app "Cursor"' 2>/dev/null || true
sleep 2

BACKUP="$HOME/state.vscdb.backup"
cp "$DB" "$BACKUP"
echo "バックアップ: $BACKUP"

BEFORE=$(sqlite3 "$DB" "SELECT COALESCE(SUM(length(value)), 0) FROM ItemTable WHERE key LIKE 'composer.composerHeaders%';")
sqlite3 "$DB" "DELETE FROM ItemTable WHERE key LIKE 'composer.composerHeaders%';"
AFTER=$(sqlite3 "$DB" "SELECT COALESCE(SUM(length(value)), 0) FROM ItemTable WHERE key LIKE 'composer.composerHeaders%';")

echo "composer.composerHeaders: ${BEFORE} bytes -> ${AFTER} bytes"
echo "Cursor を起動しています..."
open -a Cursor
echo "完了。AIパネルが開くか確認してください。"
SCRIPT

chmod +x "$INSTALL_PATH"
echo "インストール: $INSTALL_PATH"

if [[ ! -f "$ZSHRC" ]]; then
  touch "$ZSHRC"
fi

cp "$ZSHRC" "${ZSHRC}.backup.$(date +%Y%m%d-%H%M%S)"

# 壊れた alias / function を削除
sed -i '' '/cursor-fix/d' "$ZSHRC" 2>/dev/null || sed -i '/cursor-fix/d' "$ZSHRC"
sed -i '' '/Cursor AIパネル不具合/d' "$ZSHRC" 2>/dev/null || sed -i '/Cursor AIパネル不具合/d' "$ZSHRC"

# PATH 追加（重複防止）
if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$ZSHRC"; then
  {
    echo ''
    echo '# cursor-fix コマンド用'
    echo 'export PATH="$HOME/bin:$PATH"'
  } >> "$ZSHRC"
  echo "PATH を ~/.zshrc に追加しました"
fi

unalias cursor-fix 2>/dev/null || true
export PATH="$HOME/bin:$PATH"

echo ''
echo "=== インストール完了 ==="
echo "使い方: cursor-fix"
echo ''
echo "確認:"
echo "  which cursor-fix  -> $INSTALL_PATH"
echo "  grep LIKE ~/bin/cursor-fix"
