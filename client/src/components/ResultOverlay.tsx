import React, { useState } from 'react';
import { GameState, Role } from '@ojamamono/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleEffect } from './effects/ParticleEffect';
import { soundManager } from '../utils/SoundManager';

interface RoundResult {
    winner: Role | 'DRAW';
    rewards: { [id: string]: number };
    nextRound?: number;
}

interface FinalResult {
    winner: Role | 'DRAW' | null;
    scores: { [id: string]: number };
}

interface ResultOverlayProps {
    gameState: GameState | null;
    roundResult: RoundResult | null;
    finalResult: FinalResult | null;
    myUserId: string;
    onNextRound: () => void;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
    gameState,
    roundResult,
    finalResult,
    myUserId,
    onNextRound
}) => {
    const [isResultMinimized, setIsResultMinimized] = useState(false);

    React.useEffect(() => {
        if (finalResult?.winner || roundResult?.winner) {
            soundManager.playGoldFound();
        }
    }, [finalResult, roundResult]);

    if (!roundResult && !finalResult) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed inset-0 z-[100] flex items-center justify-center ${isResultMinimized ? 'pointer-events-none' : 'bg-black/80 backdrop-blur-md'}`}
            >
                {/* Winner Thematic Background (Full Screen) */}
                {!isResultMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        className={`absolute inset-0 pointer-events-none z-0 ${(finalResult?.winner === 'GOLD_DIGGER' || roundResult?.winner === 'GOLD_DIGGER')
                            ? 'bg-gradient-to-br from-yellow-900 via-amber-900 to-black'
                            : (finalResult?.winner === 'SABOTEUR' || roundResult?.winner === 'SABOTEUR')
                                ? 'bg-gradient-to-br from-red-900 via-purple-900 to-black'
                                : 'bg-gradient-to-br from-gray-800 to-black'
                            }`}
                    >
                        {(finalResult?.winner || roundResult?.winner) && <ParticleEffect type="victory" />}
                    </motion.div>
                )}

                {isResultMinimized ? (
                    <button
                        onClick={() => setIsResultMinimized(false)}
                        className="absolute top-24 right-4 pointer-events-auto bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold py-2 px-6 rounded-full shadow-lg border-2 border-yellow-400 animate-pulse flex items-center gap-2 z-[110]"
                    >
                        <span>📊</span> 結果を見る
                    </button>
                ) : (
                    <div className="w-full h-full md:max-w-5xl md:max-h-[85vh] overflow-y-auto bg-gray-900/80 border border-white/10 md:rounded-2xl shadow-2xl p-4 md:p-8 relative z-10 custom-scrollbar">
                        {/* Content from Result Screen */}
                        {finalResult ? (
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                    className="mb-8"
                                >
                                    <h1 className="text-4xl md:text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 filter drop-shadow-[0_4px_10px_rgba(251,191,36,0.5)] text-center">
                                        VICTORY!
                                    </h1>
                                    <div className="text-xl md:text-3xl text-center text-white font-bold tracking-widest uppercase">
                                        {finalResult.winner === 'GOLD_DIGGER' ? <span className="text-yellow-400">💎 金鉱掘り TEAM</span> : <span className="text-red-500">😈 お邪魔者 TEAM</span>}
                                    </div>
                                </motion.div>

                                <div className="bg-black/40 p-6 rounded-2xl shadow-inner w-full max-w-lg mx-auto mb-8 border border-white/10">
                                    <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-center text-gray-300">FINAL SCOREBOARD</h2>
                                    <div className="space-y-3">
                                        {gameState?.players
                                            .slice()
                                            .sort((a, b) => (finalResult.scores[b.id] || 0) - (finalResult.scores[a.id] || 0))
                                            .map((p, i) => (
                                                <motion.div
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    key={p.id}
                                                    className={`flex justify-between items-center p-3 rounded-lg ${i === 0 ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-gray-800/50'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-2xl font-black w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-700'}`}>
                                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">{p.avatar}</span>
                                                                <span className="font-bold text-gray-100">{p.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-mono">Role: {p.role === 'GOLD_DIGGER' ? 'Miner' : 'Saboteur'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-3xl font-black text-white font-mono">
                                                        {finalResult.scores[p.id] || 0}
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-10 py-4 rounded-full font-bold shadow-lg transform transition active:scale-95 text-lg">
                                        トップに戻る
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center w-full">
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="mb-8 text-center"
                                >
                                    <h2 className="text-lg text-gray-400 uppercase tracking-widest mb-1">Round Result</h2>
                                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                                        ROUND {gameState?.currentRound} FINISHED
                                    </h1>
                                    <div className="text-3xl md:text-4xl font-black">
                                        WINNER: {roundResult?.winner === 'GOLD_DIGGER' ? <span className="text-yellow-400 drop-shadow-lg">💎 金鉱掘り</span> : roundResult?.winner === 'SABOTEUR' ? <span className="text-red-500 drop-shadow-lg">😈 お邪魔者</span> : 'DRAW'}
                                    </div>
                                </motion.div>

                                {/* RewardsGrid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-8">
                                    {/* Rewards */}
                                    <div className="bg-black/30 p-6 rounded-2xl shadow-lg border border-white/5">
                                        <h3 className="text-md font-bold mb-4 border-b border-white/10 pb-2 text-emerald-400 flex items-center gap-2">
                                            <span>💰</span> 獲得報酬
                                        </h3>
                                        {gameState?.players.map((p, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                key={p.id}
                                                className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{p.avatar}</span>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-300 font-medium">{p.name}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${p.role === 'SABOTEUR' ? 'bg-red-900/50 text-red-200 border-red-700' :
                                                                p.role === 'SELFISH_DWARF' ? 'bg-green-900/50 text-green-200 border-green-700' :
                                                                    p.role === 'GEOLOGIST' ? 'bg-cyan-900/50 text-cyan-200 border-cyan-700' :
                                                                        'bg-yellow-900/50 text-yellow-200 border-yellow-700'}`}>
                                                                {p.role === 'SABOTEUR' ? '😈邪魔' :
                                                                    p.role === 'SELFISH_DWARF' ? '👺自己' :
                                                                        p.role === 'GEOLOGIST' ? '💎地質' :
                                                                            '👷金掘'}
                                                            </span>
                                                        </div>
                                                        {p.stats && (
                                                            <div className="flex items-center gap-2 mt-0.5 opacity-60 text-[9px] font-bold">
                                                                <span className="text-amber-400">Total: 💰{p.stats.totalGold}</span>
                                                                <span className="text-blue-400">R: {Math.round((p.stats.roundWins / (p.stats.roundPlayed || 1)) * 100)}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`font-mono font-bold text-lg ${roundResult?.rewards[p.id] ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                    +{roundResult?.rewards[p.id] || 0}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Total Score */}
                                    <div className="bg-black/30 p-6 rounded-2xl shadow-lg border border-white/5">
                                        <h3 className="text-md font-bold mb-4 border-b border-white/10 pb-2 text-amber-400 flex items-center gap-2">
                                            <span>🏆</span> 総合ランキング
                                        </h3>
                                        {gameState?.players
                                            .slice()
                                            .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0))
                                            .map((p, i) => (
                                                <motion.div
                                                    key={p.id}
                                                    className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-black w-6 text-center ${i === 0 ? 'text-yellow-500' : 'text-gray-600'}`}>{i + 1}</span>
                                                        <span className="text-xl">{p.avatar}</span>
                                                        <span className="text-gray-300 font-medium">{p.name}</span>
                                                    </div>
                                                    <div className="font-mono font-bold text-lg text-white">
                                                        {gameState.scores[p.id] || 0} pts
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 w-full">
                                    <button onClick={() => setIsResultMinimized(true)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-xl font-bold shadow-lg border border-gray-600 flex items-center gap-2 transition-transform hover:scale-105">
                                        <span>🗺️</span> マップ確認
                                    </button>
                                    {gameState?.players[0].id === myUserId && (
                                        <button
                                            onClick={onNextRound}
                                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-green-900/30 animate-pulse flex items-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <span>▶️</span> 次のラウンドへ
                                        </button>
                                    )}
                                    {gameState?.players[0].id !== myUserId && (
                                        <div className="text-gray-400 animate-pulse bg-black/40 px-6 py-3 rounded-full text-sm border border-white/10">ホストが次のラウンドを開始するのを待っています...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

