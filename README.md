# 🌍 World AI News

世界のAIニュースを、非エンジニアにもわかりやすくまとめるWebアプリ。

## 特徴

- **カテゴリフィルター** — 日常・ビジネス・セキュリティ・創作・社会・エンジニア向けで絞り込み
- **レベルバッジ** — 🌸非エンジニアOK / ⚡どっちでも / 🔧上級者
- **ダークモードUI** — 温かみのある配色、モバイルファースト
- **v2 毎日更新** — News API から最大25件を自動取得（GitHub Actions）
- **タブで即更新** — カテゴリ・レベルをタップすると最新JSONを取得
- **元記事リンク** — ニュース元をタップして原文へ

## 公開URL

**https://kikurin-tasogare.github.io/world-ai-news-app/**

Wi-Fi・4G・5G どれでも使えます。

## v2 セットアップ（初回1回）

毎日自動更新を有効にするには、GitHub に News API キーを登録します。

### 1. News API キーを取得

1. https://newsapi.org/register で無料アカウント作成
2. API Key をコピー

### 2. GitHub Secrets に登録

1. リポジトリの [Settings → Secrets and variables → Actions](https://github.com/kikurin-tasogare/world-ai-news-app/settings/secrets/actions)
2. **New repository secret**
3. Name: `NEWS_API_KEY`
4. Value: 取得した API キー
5. **Add secret**

### 3. 手動で初回更新

1. [Actions → Update AI News (Daily)](https://github.com/kikurin-tasogare/world-ai-news-app/actions/workflows/update-news.yml)
2. **Run workflow** をクリック

成功すると `data/sample-news.json` が最新ニュース（最大25件）に更新され、GitHub Pages に反映されます。

### 自動更新スケジュール

- **毎朝 7:00（日本時間）** に自動実行
- タブをタップすると、その場で最新データを再取得

## ファイル構成

```
world-ai-news-app/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── sample-news.json   # 自動更新されるニュースJSON
├── scripts/
│   └── update-news.js     # News API → JSON 変換
├── .github/workflows/
│   ├── update-news.yml    # 毎日自動更新
│   └── deploy-pages.yml
├── .env.example
└── README.md
```

## ローカル開発

```bash
cp .env.example .env
# .env に NEWS_API_KEY=... を設定

node scripts/update-news.js
python3 -m http.server 8080
```

## 環境変数

| 変数 | 用途 |
|------|------|
| `NEWS_API_KEY` | News API キー（GitHub Secrets または `.env`） |

> **注意:** APIキーをコードに直接書かないでください。`.env` は `.gitignore` 済みです。

## カテゴリ

| カテゴリ | 内容例 |
|---------|--------|
| 日常で使えるAI | ChatGPT、Gemini の新機能 |
| AIで稼ぐ・ビジネス | フリーランス向けツール |
| セキュリティ | AI詐欺、パスワード管理 |
| 創作・クリエイティブ | 画像生成、執筆支援 |
| 社会・倫理 | AI規制、仕事への影響 |
| エンジニア向け | 新モデル、技術論文 |

## iPhone に追加

Safari → 共有 → **ホーム画面に追加**

## ライセンス

MIT
