# 💕 ふたりリスト

佑哉さんと祐希ちゃんの「行きたいところ」「やりたいこと」をメモする PWA。

- **今**：佑哉さん一人で使える（端末内に保存）
- **将来**：祐希ちゃんと共有（JSON 送受信 or クラウド同期）

## 機能

| 機能 | 説明 |
|------|------|
| 行きたい / やりたい | 2種類のメモを追加 |
| ステータス | 💭 いつか → 📅 候補 → ✅ 達成 |
| ピン留め | 「次はここ！」を上に固定 |
| 誰のメモ？ | 佑哉 / 祐希 / ふたり のバッジ |
| 共有（ファイル） | JSON エクスポート・インポート（Line / AirDrop 可） |
| 共有（クラウド） | Supabase でリアルタイム同期（任意） |

## ローカルで試す

```bash
cd futari-list
python3 -m http.server 8080
```

ブラウザで http://localhost:8080 を開く。

## iPhone に追加

Safari → 共有 → **ホーム画面に追加**

## 祐希ちゃんと共有する方法

### 方法A：ファイル共有（すぐ使える）

1. 佑哉さん：共有タブ → **エクスポート**
2. JSON を Line / AirDrop で送る
3. 祐希ちゃん：同じアプリを開く → **インポート**（マージ ON）
4. 祐希ちゃんは共有タブで名前を「祐希」に変更

### 方法B：クラウド同期（リアルタイム）

1. [Supabase](https://supabase.com) で無料プロジェクト作成
2. SQL Editor で以下を実行
3. 佑哉さん・祐希ちゃん両方のアプリ「共有」タブに URL / Anon Key を入力
4. 佑哉さんの **招待コード** を祐希ちゃんに送る → 祐希ちゃんは「参加」

#### Supabase セットアップ SQL

```sql
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  name text default 'ふたりリスト',
  created_at timestamptz default now()
);

create table if not exists wish_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  type text not null check (type in ('place', 'activity')),
  title text not null,
  memo text default '',
  tags jsonb default '[]',
  status text default 'someday' check (status in ('someday', 'planned', 'done')),
  created_by text default 'yuya',
  updated_by text default 'yuya',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

alter table workspaces enable row level security;
alter table wish_items enable row level security;

create policy "anon workspaces all" on workspaces for all using (true) with check (true);
create policy "anon wish_items all" on wish_items for all using (true) with check (true);

create unique index if not exists wish_items_pkey on wish_items(id);
```

> 招待コードでワークスペースを分ける想定。本番では RLS を強化してください。

## ファイル構成

```
futari-list/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── service-worker.js
├── icons/
└── README.md
```

## ライセンス

MIT
