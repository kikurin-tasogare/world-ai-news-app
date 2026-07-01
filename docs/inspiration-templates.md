# 外出先ひらめきテンプレ — 佑哉さん用

コピペして iPhone メモ / Cursor iOS に使う。

---

## ① iPhone メモ（30秒キャッチ）

タイトル例：`💡 アプリひらめき 2026-__-__`

```
【ひらめき】
日時：
場所：（カフェ / 移動中 など）

■ アプリ名案：

■ 誰が使う：
（自分 / 祐希ちゃんと / 読者 / クライント）

■ 1行説明：


■ Must（これだけは絶対）：
-

■ Nice（余裕あれば）：
-

■ 参考アプリ・サイト：


■ 公開：
□ Private  □ Public  □ 未定

■ メモ・直感：


---
ステータス：□ 種だけ  □ v0.1依頼済  □ 家で続き
GitHub repo：
```

---

## ② Cursor iOS — 新規 v0.1 依頼文

リポジトリを選んでから、そのまま送る。

```
新規 PWA アプリ v0.1 を作って、このリポジトリの main に push して。

【アプリ名】（例：ふたりリスト）
【1行説明】
【Must 機能】
- 
- 

【デザイン】
- 温かいダーク UI
- iPhone PWA（ホーム画面追加対応）
- モバイルファースト

【プライバシー】
- リポジトリは Private 前提
- 本名・個人名はコードに入れない
- データは端末内（localStorage）が基本
- 共有は JSON export / 任意 Supabase

【技術】
- HTML / CSS / vanilla JS
- service-worker + manifest.json
- GitHub Pages 用 deploy workflow も入れて

【参考】
（メモの内容をここに貼る）

v0.1 は Must だけで OK。完成度より「思いつきを形にする」優先。
```

---

## ③ Cursor iOS — 超短縮版（電車の中）

```
この Private repo に PWA v0.1 を作って push。
機能：（1行）
Must：（箇条書き2つまで）
本名はコードに入れない。localStorage。iPhone PWA。
```

---

## ④ Cursor iOS — 既存アプリに機能追加

```
（リポジトリ名）に以下を追加して PR 作成：

【追加したい機能】


【制約】
- 既存デザインに合わせる
- 本名はコードに入れない
- 変更は最小限
```

---

## ⑤ 帰宅後 Mac — 取り込み

```bash
cd ~/Documents
git clone https://github.com/kikurin-tasogare/リポジトリ名.git
cd リポジトリ名
open -a Cursor .
```

2回目以降：

```bash
cd ~/Documents/リポジトリ名
git pull
```

---

## ⑥ ひらめき → 完成の流れ（確認用）

```
外出先 30秒   → iPhone メモ
外出先 10分   → GitHub 新規 repo → Cursor iOS v0.1 依頼
帰宅        → git clone → Cursor デスクトップで仕上げ
```

**完璧を求めない。捕まえた時点で半分成功。**
