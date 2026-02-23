'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export default function AdminPage() {
    return (
        <Authenticator>
            {({ signOut }) => (
                <AdminContent signOut={signOut} />
            )}
        </Authenticator>
    );
}

function AdminContent({ signOut }: { signOut: any }) {
    const [subjects, setSubjects] = useState<Schema['Subject']['type'][]>([]);
    const [logs, setLogs] = useState<Schema['ActivityLog']['type'][]>([]);

    useEffect(() => {
        // 被験者データのリアルタイム取得
        const sub = client.models.Subject.observeQuery().subscribe({
            next: ({ items }: { items: Schema['Subject']['type'][] }) => setSubjects([...items]),
            error: (err: any) => console.error("Subject取得エラー:", err)
        });

        // 活動ログのリアルタイム取得
        const logSub = client.models.ActivityLog.observeQuery().subscribe({
            next: ({ items }: { items: Schema['ActivityLog']['type'][] }) => {
                const sortedLogs = [...items].sort((a, b) =>
                    new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                );
                setLogs(sortedLogs);
            },
            error: (err: any) => console.error("Log取得エラー:", err)
        });

        return () => {
            sub.unsubscribe();
            logSub.unsubscribe();
        };
    }, []);

    const addSubject = async () => {
        const name = window.prompt("被験者名を入力してください");
        const email = window.prompt("被験者のログインEmailを入力してください（これがIDになります）");
        if (!name || !email) return;

        try {
            await client.models.Subject.create({
                subjectId: email, // EmailをIDとして紐付け
                name: name,
                targetIntensity: 45,
                currentVo2max: 0,
                menuType: 'A',
                durationMinutes: 30
            });
        } catch (err) {
            console.error("追加エラー:", err);
            alert("登録に失敗しました。権限設定を確認してください。");
        }
    };

    const updateIntensity = async (id: string, value: number) => {
        await client.models.Subject.update({ id, targetIntensity: value });
    };

    const deleteSubject = async (id: string) => {
        if (!window.confirm("本当に削除しますか？")) return;
        await client.models.Subject.delete({ id });
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800">
            {/* サイドバー */}
            <aside className="w-64 bg-slate-900 text-white p-6 shadow-xl flex flex-col">
                <div className="flex-1">
                    <h2 className="text-xl font-bold mb-8 text-emerald-400">MoveCare Admin</h2>
                    <nav className="space-y-4">
                        <div className="font-bold cursor-pointer bg-white/10 p-2 rounded">被験者管理</div>
                        <div className="text-slate-400 hover:text-white cursor-pointer p-2">プロジェクト設定</div>
                    </nav>
                </div>
                <button
                    onClick={signOut}
                    className="mt-auto py-2 px-4 border border-slate-700 rounded text-slate-400 hover:text-white hover:border-white transition-all text-sm"
                >
                    管理者ログアウト
                </button>
            </aside>

            {/* メインコンテンツ */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">運動処方シミュレーター</h1>
                        <p className="text-sm text-slate-500">被験者の強度設定とリアルタイムモニタリング</p>
                    </div>
                    <button
                        onClick={addSubject}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                        + 新規被験者登録
                    </button>
                </div>

                {/* 被験者リスト */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500">被験者 / ID</th>
                                <th className="px-6 py-4 font-bold text-slate-500">VO2max</th>
                                <th className="px-6 py-4 font-bold text-slate-500">強度 (%)</th>
                                <th className="px-6 py-4 font-bold text-emerald-600">目標METs</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {subjects.length === 0 && (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">被験者が登録されていません</td></tr>
                            )}
                            {subjects.map(s => {
                                const prescription = calculatePrescription(s.currentVo2max || 0, s.targetIntensity || 45);
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{s.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{s.subjectId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    defaultValue={s.currentVo2max || 0}
                                                    onBlur={async (e) => {
                                                        await client.models.Subject.update({ id: s.id, currentVo2max: parseFloat(e.target.value) });
                                                    }}
                                                    className="w-20 border border-slate-200 rounded-lg p-2 text-center font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                                <span className="text-xs text-slate-400">ml/kg</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    defaultValue={s.targetIntensity || 45}
                                                    onBlur={async (e) => {
                                                        await updateIntensity(s.id, parseFloat(e.target.value));
                                                    }}
                                                    className="w-16 border border-slate-200 rounded-lg p-2 text-center font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                                <span className="text-xs text-slate-400">%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-mono font-bold text-sm border border-emerald-100">
                                                {prescription ? `${prescription.targetMets} METs` : '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteSubject(s.id)}
                                                className="text-rose-400 hover:text-rose-600 text-sm font-bold p-2 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 活動ログ */}
                <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    最新の活動ログ
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500">日時</th>
                                <th className="px-6 py-4 font-bold text-slate-500">被験者ID</th>
                                <th className="px-6 py-4 font-bold text-slate-500">内容</th>
                                <th className="px-6 py-4 font-bold text-slate-500">時間</th>
                                <th className="px-6 py-4 font-bold text-slate-500">強度</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="text-sm">
                                    <td className="px-6 py-4 text-slate-500">
                                        {log.timestamp ? new Date(log.timestamp).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{log.subjectId}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{log.type}</td>
                                    <td className="px-6 py-4">{log.duration} <span className="text-xs text-slate-400">min</span></td>
                                    <td className="px-6 py-4 font-mono font-bold">{log.intensity?.toFixed(1)} <span className="text-xs font-normal text-slate-400">METs</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

// ロジック関数
const vo2ToMETs = (vo2: number) => vo2 / 3.5;
const calculatePrescription = (vo2max: number, percent: number = 45) => {
    if (!vo2max || vo2max === 0) return null;
    const targetMets = vo2ToMETs(vo2max * (percent / 100));
    return {
        targetMets: targetMets.toFixed(2)
    };
};