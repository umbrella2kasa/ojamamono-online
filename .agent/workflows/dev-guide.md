---
description: お邪魔ものプロジェクトの開発ガイド
---

# 開発ガイド - お邪魔ものオンライン

このプロジェクトは、ボードゲーム「お邪魔もの」をオンラインで遊べるようにするためのものです。
技術スタック: TypeScript, React, Vite, Node.js (Express), Socket.io

## リポジトリ構成

- `/client`: React (Vite) + Tailwind CSS によるフロントエンド
- `/server`: Node.js (Express) + Socket.io によるゲームサーバー
- `/shared`: フロントエンドとバックエンドで共有する型定義や定数、ロジック
- `/tests`: Playwright による E2E テスト

## 主要コマンド

ルートディレクトリで実行してください：

- `npm run dev`: サーバーとクライアントを同時に起動します
- `npm run build`: 全てのコンポーネントをビルドします

## 開発のルール

1. **共有ロジック**: ゲームのルールや定数は必ず `shared/src` に実装してください。
2. **型定義**: WebSocket でやり取りするイベントやデータ構造は `shared/src/types` に定義してください。
3. **シミュレーション**: 大規模なロジック修正の際は、`server` 内でシミュレーションを実行して検証してください。
