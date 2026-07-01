# 新リポジトリへ push する（Mac で1回だけ）

GitHub に `futari-list-app-` を作成済みの場合：

```bash
git clone -b futari-list-standalone https://github.com/kikurin-tasogare/world-ai-news-app.git futari-list-app
cd futari-list-app
git remote set-url origin https://github.com/kikurin-tasogare/futari-list-app-.git
git push -u origin futari-list-standalone:main
```

その後 GitHub → Settings → Pages → Source: **GitHub Actions**

公開 URL: https://kikurin-tasogare.github.io/futari-list-app-/

world-ai-news-app の [PR #3](https://github.com/kikurin-tasogare/world-ai-news-app/pull/3) は **Close** してください（マージ不要）。
