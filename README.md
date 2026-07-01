# 💕 ふたりリスト

二人の「行きたいところ」「やりたいこと」をメモする PWA。**プライバシー優先**で設計しています。

## プライバシー設計

| 項目 | 方針 |
|------|------|
| 本名 | **GitHub のコードに含めない** |
| 表示名 | 端末内のみ設定（任意）。アプリの「共有」タブから変更 |
| メモデータ | 端末内（localStorage）。自動で外部送信しない |
| エクスポート | ユーザーが明示的に実行したときのみ |
| クラウド同期 | 任意。自分で Supabase を用意した場合のみ |
| リポジトリ | **Private 推奨**（Cursor も Private で利用可） |

詳細は [PRIVACY.md](./PRIVACY.md)

## Cursor と Private リポジトリ

**Public にする必要はありません。**

1. https://cursor.com/dashboard → Integrations → GitHub
2. **Selected repositories** に `futari-list-app-` を追加
3. iOS / Cloud Agent から開発可能

## 機能

| 機能 | 説明 |
|------|------|
| 行きたい / やりたい | 2種類のメモを追加 |
| ステータス | 💭 いつか → 📅 候補 → ✅ 達成 |
| ピン留め | 「次はここ！」を上に固定 |
| 投稿者 | 自分 / 相手 / ふたり（表示名は端末内でカスタム可） |
| 共有（ファイル） | JSON エクスポート・インポート |
| 共有（クラウド） | Supabase（任意） |

## ローカルで試す

```bash
python3 -m http.server 8080
```

## パートナーと共有

### 方法A：JSON ファイル（すぐ使える）

1. **エクスポート** → Line / AirDrop で送信
2. 相手が **インポート**（マージ ON）
3. 各自「共有」タブで表示名を設定（端末内のみ）

### 方法B：Supabase（リアルタイム・任意）

[PRIVACY.md](./PRIVACY.md) の SQL を参照。

## GitHub Pages

`main` push で自動デプロイ。Settings → Pages → **GitHub Actions**。

> Public にすると Pages URL は誰でも開けます。**Private リポジトリ + ローカル / PWA 利用**が最も安全です。

## ライセンス

MIT
