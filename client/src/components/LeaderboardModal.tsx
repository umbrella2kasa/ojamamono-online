import React from 'react';
import { PlayerStats } from '@ojamamono/shared';
import { motion } from 'framer-motion';
import { getBadgeInfo } from '../utils/BadgeUtils';

interface LeaderboardModalProps {
    stats: PlayerStats[];
    onClose: () => void;
}

type SortKey = 'G_PLAYED' | 'G_WINRATE' | 'R_PLAYED' | 'R_WINRATE' | 'GOLD_TOTAL' | 'GOLD_EFF';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ stats, onClose }) => {
    const [sortKey, setSortKey] = React.useState<SortKey>('G_WINRATE');

    // Sorting logic
    const sortedStats = [...stats].sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortKey) {
            case 'G_PLAYED':
                valA = a.gamePlayed;
                valB = b.gamePlayed;
                break;
            case 'G_WINRATE':
                valA = a.gameWins / (a.gamePlayed || 1);
                valB = b.gameWins / (b.gamePlayed || 1);
                break;
            case 'R_PLAYED':
                valA = a.roundPlayed;
                valB = b.roundPlayed;
                break;
            case 'R_WINRATE':
                valA = a.roundWins / (a.roundPlayed || 1);
                valB = b.roundWins / (b.roundPlayed || 1);
                break;
            case 'GOLD_TOTAL':
                valA = a.totalGold;
                valB = b.totalGold;
                break;
            case 'GOLD_EFF':
                valA = a.totalGold / (a.roundPlayed || 1);
                valB = b.totalGold / (b.roundPlayed || 1);
                break;
        }

        if (valB !== valA) return valB - valA;
        return b.totalGold - a.totalGold; // Fallback
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <span className="text-yellow-400 text-3xl">🏆</span>
                        Hall of Fame
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Sort Controls */}
                <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest whitespace-nowrap mr-2">Sort by:</span>
                    <SortButton active={sortKey === 'G_WINRATE'} onClick={() => setSortKey('G_WINRATE')} label="🏆 ゲーム勝率" />
                    <SortButton active={sortKey === 'R_WINRATE'} onClick={() => setSortKey('R_WINRATE')} label="🚩 ラウンド勝率" />
                    <SortButton active={sortKey === 'GOLD_TOTAL'} onClick={() => setSortKey('GOLD_TOTAL')} label="💰 総金塊" />
                    <SortButton active={sortKey === 'GOLD_EFF'} onClick={() => setSortKey('GOLD_EFF')} label="📈 金塊効率(R)" />
                    <SortButton active={sortKey === 'G_PLAYED'} onClick={() => setSortKey('G_PLAYED')} label="🎮 総ゲーム数" />
                    <SortButton active={sortKey === 'R_PLAYED'} onClick={() => setSortKey('R_PLAYED')} label="🕒 総ラウンド数" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-3">
                        {sortedStats.map((s, i) => {
                            const badge = getBadgeInfo(s);
                            const gWinRate = Math.round((s.gameWins / (s.gamePlayed || 1)) * 100);
                            const rWinRate = Math.round((s.roundWins / (s.roundPlayed || 1)) * 100);
                            const goldEff = Math.round((s.totalGold / (s.roundPlayed || 1)) * 10) / 10;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={s.name}
                                    className={`flex items-center gap-4 p-3 rounded-xl border border-slate-800 transition-colors ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-800/40 hover:bg-slate-800/60'}`}
                                >
                                    <div className={`text-xl font-black w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </div>

                                    <div className="flex-1 flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${badge.bgColor} ${badge.borderClass} bg-cover shadow-lg relative overflow-hidden`}>
                                            <span className="relative z-10">{badge.icon}</span>
                                            {sortKey === 'G_WINRATE' && gWinRate >= 56 && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold">{s.name}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${badge.color}`}>{badge.name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 ml-auto">
                                        <StatBox label="G.Win%" value={`${gWinRate}%`} active={sortKey === 'G_WINRATE'} color="text-blue-400" />
                                        <StatBox label="R.Win%" value={`${rWinRate}%`} active={sortKey === 'R_WINRATE'} color="text-emerald-400" />
                                        <StatBox label="Gold" value={s.totalGold} active={sortKey === 'GOLD_TOTAL'} color="text-amber-500" />
                                        <StatBox label="Gold/R" value={goldEff} active={sortKey === 'GOLD_EFF'} color="text-orange-400" />
                                        <StatBox label="G.Played" value={s.gamePlayed} active={sortKey === 'G_PLAYED'} color="text-slate-300" />
                                        <StatBox label="R.Played" value={s.roundPlayed} active={sortKey === 'R_PLAYED'} color="text-slate-400" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-between items-center px-8">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        Competitive Data Analysis
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        ※ 勝利を追求し、効率よく奪い、歴史に名を刻め。
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const SortButton: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${active
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
            }`}
    >
        {label}
    </button>
);

const StatBox: React.FC<{ label: string, value: string | number, active: boolean, color: string }> = ({ label, value, active, color }) => (
    <div className={`flex flex-col items-center transition-all ${active ? 'scale-110' : 'opacity-60 scale-90'}`}>
        <span className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">{label}</span>
        <span className={`text-base font-black ${active ? color : 'text-slate-300'}`}>{value}</span>
    </div>
);
