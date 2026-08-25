#!/bin/zsh
# Cursor AIパネル不具合の予防掃除
# composer.composerHeaders の肥大化でパネルが開けなくなる既知バグへの対処

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
