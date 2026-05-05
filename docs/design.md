# TODOアプリ設計書

## 目的

業務PCで追加のランタイムや外部パッケージを導入せず、ブラウザで `index.html` を開くだけで使える表形式のTODO管理アプリを提供する。画像のUIを参考に、左ナビ、集計、検索、期限フィルター、追加・編集・削除を備える。

## 実行環境

- ブラウザ: Edge / Chrome などのモダンブラウザ
- 外部依存: なし

## 構成

```text
.
├── index.html
├── public/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── app.js
│       ├── model.js
│       ├── storage.js
│       └── view.js
└── docs/
    ├── design.md
    └── migration.md
```

## アーキテクチャ

- `index.html`: フォルダ直下から `public/index.html` へ移動する入口。
- `public/js/model.js`: TODOの初期データ、優先順位、日付判定、ドメインモデルを管理する。
- `public/js/storage.js`: TODOとラベルの `localStorage` 保存・読込・初期化を担当する。
- `public/js/view.js`: DOM参照、描画、フォーム読取、JSON出力を担当する。
- `public/js/app.js`: イベントハンドリングと状態更新を担当する。

## データモデル

### TODO

```js
{
  id: "UUID",
  title: "TODO内容",
  priority: "high | medium | low",
  dueDate: "YYYY-MM-DD | 空文字",
  label: "仕事 | プロジェクト | 個人 | 空文字",
  note: "備考",
  completed: false,
  archived: false,
  createdAt: "ISO datetime",
  updatedAt: "ISO datetime"
}
```

### ラベル

```js
{
  name: "仕事",
  color: "#6f9cf8"
}
```

## 主な機能

- TODOの追加、編集、削除、完了切替、アーカイブ
- 期限の指定、期限なしの登録
- 検索、優先順位フィルター、期限フィルター
- 表示件数、検索、フィルター、ラベル選択、期限ソートの保持
- 今日、今週、完了済み、アーカイブのナビゲーション
- 優先順位とラベルの件数集計
- ラベルの追加
- ラベルの削除
- ラベル指定なしの登録
- JSONエクスポート
- JSONインポート
- CSVエクスポート
- サンプルデータ復元
- ブラウザの `localStorage` による永続化

## 保守方針

- 外部依存を持たず、ブラウザ標準APIのみを使用する。
- 状態変更は `app.js` の `commitTasks` に集約し、保存と再描画の流れを明確にする。
- 日付判定やデータ生成は `model.js` に集約し、UIから業務ロジックを分離する。
- DOM構築は `view.js` に寄せ、HTMLテンプレートを使って表行の構造を保守しやすくする。

## 将来拡張案

- CSVインポート
- ラベルの編集
- ページングの前後移動
- 共有フォルダ保存や簡易JSONファイル保存
- タスク履歴ログ
