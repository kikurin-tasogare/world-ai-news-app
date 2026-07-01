# プライバシーポリシー（ふたりリスト）

## 基本方針

このアプリは **個人の思い出・予定** を扱うため、データを勝手に外部に送らない設計にしています。

## 何がどこに保存されるか

| データ | 保存場所 | GitHub に載る？ |
|--------|----------|----------------|
| アプリのソースコード | GitHub リポジトリ | ✅（名前は含まない） |
| メモ（タイトル・内容） | 端末の localStorage | ❌ |
| カスタム表示名 | 端末の localStorage | ❌ |
| エクスポート JSON | ユーザーが保存した場所のみ | ユーザーの操作次第 |
| Supabase 同期データ | ユーザーが設定した Supabase | ユーザーの Supabase アカウント |

## GitHub リポジトリについて

- コード内のデフォルト表示は **「自分」「相手」「ふたり」** のみ
- 本名・ニックネームをコードに書く必要はありません
- **Private リポジトリ** を推奨します
- Cursor Cloud Agent は Private リポジトリでも利用可能（GitHub Integrations で許可）

## エクスポート JSON

エクスポートファイルには以下が含まれる場合があります：

- メモ内容
- 設定した表示名（memberLabels）
- ワークスペース ID・招待コード

**Line 等で送る前に内容を確認してください。** ファイルは暗号化されません。

## Supabase（任意）

クラウド同期を使う場合：

- 自分で Supabase プロジェクトを作成
- Anon Key はアプリの「共有」タブに入力（端末内保存）
- サンプル SQL の RLS は開発用の緩い設定です。**本番利用時は RLS を強化してください**

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
  created_by text default 'member_a',
  updated_by text default 'member_a',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);
```

## 第三者サービス

- **GitHub Pages**: 静的ファイル配信のみ（アプリ本体）。メモデータは送信されない
- **Supabase**: ユーザーが明示的に設定した場合のみ通信

## お問い合わせ

このアプリは個人利用向けです。データの削除は端末の Safari 設定 → ウェブサイトデータから行えます。
