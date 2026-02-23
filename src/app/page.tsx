'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { Schema } from '@/amplify/data/resource';
import { calculatePrescription } from '@/utils';

const client = generateClient<Schema>();

export default function PacingPage() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <PacingContent
          signOut={signOut}
          userEmail={user?.signInDetails?.loginId || user?.username}
        />
      )}
    </Authenticator>
  );
}

function PacingContent({ signOut, userEmail }: { signOut: any, userEmail?: string }) {
  const [subject, setSubject] = useState<Schema['Subject']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;

    // リアルタイム同期の開始
    // @ts-ignore - Amplifyの型定義の不整合を回避
    const sub = client.models.Subject.observeQuery().subscribe({
      next: ({ items }: { items: Schema['Subject']['type'][] }) => {
        // メモリ内でログインユーザーのデータのみに絞り込む
        const myData = items.filter(s => s.subjectId === userEmail);
        setSubject(myData.length > 0 ? myData[0] : null);
        setLoading(false);
      },
      // 本番環境で重要なエラーハンドリング（権限エラーをキャッチ）
      error: (err: any) => {
        console.error("データ取得権限エラー:", err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [userEmail]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">読み込み中...</div>;
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-600 mb-2 font-bold">被験者データが見つかりません</p>
          <p className="text-sm text-slate-400 mb-6">研究者に以下のIDを登録するよう依頼してください：<br />
            <span className="font-mono font-bold text-slate-700">{userEmail}</span>
          </p>
          <button
            onClick={signOut}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold active:scale-95 transition-all"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  // 計算ロジックの実行（オブジェクトを安全に扱う）
  const prescription = calculatePrescription(subject.currentVo2max || 0, subject.targetIntensity || 45);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* アバター部分 */}
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {subject.name ? subject.name.charAt(0) : '1'}
          </div>
          <span className="font-bold text-slate-700">{subject.name} 様</span>
        </div>

        <div className="flex items-center gap-3">
          {/* ID表示を少し小さくし、その隣にログアウトボタンを配置 */}
          <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded font-mono">
            ID: {userEmail}
          </span>

          <button
            onClick={signOut}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100 transition-colors active:scale-95"
          >
            サインアウト
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 animate-in fade-in duration-500">
        {/* メインカード */}
        <section className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-100">
          <h2 className="text-emerald-100 text-xs font-bold tracking-widest uppercase mb-2">Target Intensity</h2>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-6xl font-black">{subject.targetIntensity ?? 0}</span>
            <span className="text-xl font-bold opacity-80">% VO2max</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <div className="text-[10px] text-emerald-100 font-bold uppercase mb-1">目標 METs</div>
              <div className="text-2xl font-black">
                {prescription ? prescription.targetMets : "---"}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <div className="text-[10px] text-emerald-100 font-bold uppercase mb-1">指示モード</div>
              <div className="text-2xl font-black">{subject.menuType || "通常"}</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-emerald-50 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">📋</span> 指示: {subject.durationMinutes ?? 0} 分間の運動を実施
            </p>
          </div>
        </section>

        {/* サブステータス */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
            <span className="block text-2xl mb-2">⏱️</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Duration</span>
            <span className="block text-xl font-black text-slate-700">{subject.durationMinutes ?? 0} <span className="text-xs">min</span></span>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
            <span className="block text-2xl mb-2">🏃</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Status</span>
            <span className="block text-xl font-black text-emerald-600">{subject.lastStatus || 'Ready'}</span>
          </div>
        </div>
      </main>
    </div>
  );
}