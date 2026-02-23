'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { calculatePrescription } from '@/utils';

const client = generateClient<Schema>();

// 活動の選択肢（app.js の内容をベースに定義）
const ACTIVITIES = [
    { label: '散歩', met: 3.0 },
    { label: '家事', met: 2.5 },
    { label: 'ストレッチ', met: 2.0 },
    { label: '自転車', met: 4.0 },
    { label: 'ジョギング', met: 7.0 },
];

export default function PacingPage() {
    const [subject, setSubject] = useState<Schema['Subject']['type'] | null>(null);

    // モーダルと入力用の状態管理
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
    const [duration, setDuration] = useState(15);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // 本来はログイン機能で作りますが、まずは最初の1人を表示してみます
        const sub = client.models.Subject.observeQuery().subscribe({
            next: ({ items }) => {
                if (items.length > 0) setSubject(items[0]);
            },
        });
        return () => sub.unsubscribe();
    }, []);

    // 活動ログをAWSに保存する関数
    const saveActivity = async () => {
        if (!subject) return;
        setIsSaving(true);

        try {
            await client.models.ActivityLog.create({
                subjectId: subject.subjectId,
                type: selectedActivity.label,
                duration: duration,
                intensity: selectedActivity.met,
                timestamp: new Date().toISOString(),
            });

            setIsModalOpen(false);
            alert('活動を記録しました！');
        } catch (error) {
            console.error("保存失敗:", error);
            alert('保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    if (!subject) return <div className="p-8 text-center">読み込み中...</div>;

    const prescription = calculatePrescription(subject.currentVo2max || 0, subject.targetIntensity || 45);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* ヘッダー: index.html のデザインを移植 */}
            <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {subject.name?.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700">{subject.name} 様</span>
                </div>
                <div className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                    ID: {subject.subjectId}
                </div>
            </header>

            <main className="p-4 space-y-6">
                {/* 目標カード: 今日の設定強度を表示 */}
                <section className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100">
                    <h2 className="text-emerald-100 text-sm font-medium mb-1">現在の目標強度</h2>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-5xl font-black">{subject.targetIntensity}</span>
                        <span className="text-xl font-bold">%</span>
                    </div>

                    <div className="bg-white/20 rounded-2xl p-4 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-emerald-100">目標 METs</div>
                            <div className="text-2xl font-bold">{prescription?.targetMets} <span className="text-sm">METs</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-emerald-100">VO2max</div>
                            <div className="text-lg font-bold">{subject.currentVo2max}</div>
                        </div>
                    </div>
                </section>

                {/* 次のアクション：index.html のボタン群 */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
                    >
                        <span className="text-2xl">📝</span>
                        <span className="font-bold text-slate-700 text-sm">活動を記録</span>
                    </button>
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                        <span className="text-2xl">📊</span>
                        <span className="font-bold text-slate-700 text-sm">履歴を見る</span>
                    </button>
                </div>
            </main>

            {/* 活動記録用モーダル (index.html のデザイン踏襲) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
                    <div className="bg-white w-full rounded-t-[32px] p-8 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <h3 className="text-xl font-black mb-6 text-slate-800">何を行いましたか？</h3>

                        <div className="space-y-4 mb-8">
                            {/* 活動選択 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-2">アクティビティ</label>
                                <select
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                    value={selectedActivity.label}
                                    onChange={(e) => setSelectedActivity(ACTIVITIES.find(a => a.label === e.target.value)!)}
                                >
                                    {ACTIVITIES.map(a => <option key={a.label} value={a.label}>{a.label} ({a.met} METs)</option>)}
                                </select>
                            </div>

                            {/* 時間設定 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-2">実施時間 (分)</label>
                                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl">
                                    <button
                                        onClick={() => setDuration(d => Math.max(5, d - 5))}
                                        className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-slate-600 active:bg-slate-100 transition-colors">-</button>
                                    <span className="text-2xl font-black text-slate-700">{duration} <span className="text-sm font-bold text-slate-400">min</span></span>
                                    <button
                                        onClick={() => setDuration(d => d + 5)}
                                        className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-slate-600 active:bg-slate-100 transition-colors">+</button>
                                </div>
                            </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={saveActivity}
                                disabled={isSaving}
                                className={`py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? '保存中...' : '記録を保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 下部ナビゲーション */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 flex justify-around items-center">
                <button className="text-emerald-500 flex flex-col items-center gap-1">
                    <span className="text-xl">🏠</span>
                    <span className="text-[10px] font-bold">ホーム</span>
                </button>
                <button className="text-slate-400 flex flex-col items-center gap-1">
                    <span className="text-xl">📅</span>
                    <span className="text-[10px] font-bold">プラン</span>
                </button>
                <button className="text-slate-400 flex flex-col items-center gap-1">
                    <span className="text-xl">⚙️</span>
                    <span className="text-[10px] font-bold">設定</span>
                </button>
            </nav>
        </div>
    );
}