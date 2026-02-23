'use client'; // 先頭に追加

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json'; // Sandboxが書き出した設定ファイル
import "./globals.css";

// ここでAWSの設定を読み込みます
Amplify.configure(outputs);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}