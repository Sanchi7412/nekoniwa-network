# Nekoniwa-Network

## 概要

Nekoniwa-Network のポートフォリオ兼ホームページ。  
自己紹介・提供サービスの紹介に加え、Zabbix API を利用したサーバー稼働状況のリアルタイム監視ダッシュボードを備えています。

## 主な機能

- 🐱 **自己紹介** — プロフィールアイコン・経歴の表示（クリックで効果音＆絵文字バーストアニメーション）
- 🖥️ **サーバーステータス** — Zabbix API 経由で Proxmox / ネットワーク機器の稼働状況・トラフィックをリアルタイム表示
- 🎮 **Minecraft サーバー情報** — nekoniwa Minecraft サーバーの紹介ページ
- 🔊 **サウンド切り替え** — ヘッダーからサウンドの ON/OFF を制御

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # トップページ
│   ├── about/              # About ページ
│   ├── mc/nekoniwa/        # Minecraft サーバー紹介
│   └── api/zabbix/         # Zabbix API ルート
├── components/
│   ├── ui/                 # 汎用 UI コンポーネント
│   ├── self-introduction.tsx
│   ├── server-status.tsx
│   ├── service-introduction.tsx
│   └── emoji-burst.tsx
├── contexts/
│   └── sound-context.tsx   # サウンド ON/OFF コンテキスト
├── lib/
│   ├── utils.ts            # ユーティリティ
│   ├── zabbix.ts           # Zabbix API クライアント
│   └── zabbix-config.ts    # 非表示インターフェース等の設定
└── styles/
    └── globals.css         # グローバルスタイル
```

## 技術スタック

### フロントエンド

| パッケージ        | バージョン |
| ----------------- | ---------- |
| Next.js           | `16.1.6`   |
| React / React DOM | `^19.2.4`  |
| TypeScript        | `^5.9.3`   |

### スタイリング

| パッケージ             | バージョン |
| ---------------------- | ---------- |
| Tailwind CSS           | `^4.1.18`  |
| tailwind-merge         | `^3.4.0`   |
| tw-animate-css         | `^1.4.0`   |
| Motion (Framer Motion) | `^12.34.0` |

### データ取得・状態管理

| パッケージ           | バージョン |
| -------------------- | ---------- |
| TanStack React Query | `^5.90.20` |
| Zustand              | `^5.0.11`  |

### フォーム・バリデーション

| パッケージ          | バージョン |
| ------------------- | ---------- |
| React Hook Form     | `^7.71.1`  |
| @hookform/resolvers | `^5.2.2`   |
| Zod                 | `^3.25.76` |

### テスト

| パッケージ             | バージョン |
| ---------------------- | ---------- |
| Vitest                 | `^3.2.4`   |
| @testing-library/react | `^16.3.2`  |

### コード品質

| パッケージ  | バージョン |
| ----------- | ---------- |
| ESLint      | `^9.39.2`  |
| Prettier    | `^3.8.1`   |
| Husky       | `^9.1.7`   |
| lint-staged | `^15.5.2`  |

### その他ユーティリティ

- **clsx** `^2.1.1`
- **lucide-react** `^0.503.0`
- **class-variance-authority** `^0.7.1`
- **Recharts** `^3.7.0`

## セットアップ

### 前提条件

- **Node.js** 18 以上
- **PNPM** `10.9.0`

### インストール

```bash
pnpm install
```

### 環境変数

`.env.example` を `.env.local` にコピーして値を設定してください。

```bash
cp .env.example .env.local
```

```env
# Zabbix Config
ZABBIX_URL=http://example.com/zabbix/api_jsonrpc.php
ZABBIX_USER=guest
ZABBIX_TOKEN=your_token_here
```

### 開発サーバー起動

```bash
pnpm dev
```

`http://localhost:3000` でアクセスできます。

### ビルド

```bash
pnpm build
pnpm start
```

### Lint / Format

```bash
pnpm lint
```

コミット時に Husky + lint-staged による自動チェックが走ります。
