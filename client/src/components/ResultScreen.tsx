import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Role } from '@ojamamono/shared';
import confetti from 'canvas-confetti';
// import { soundManager } from '../utils/SoundManager';

interface ResultScreenProps {
    result: {
        winner: Role | 'DRAW' | null;
        scores: { [id: string]: number };
        isFinal?: boolean;
    };
    players: any[];
    onNext: () => void;
    isHost: boolean;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ result, players, onNext, isHost }) => {

    useEffect(() => {
        let animationFrameId: number;

        const triggerGoldConfetti = () => {
            const duration = 3000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FDB931']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FFD700', '#FDB931']
                });
                if (Date.now() < end) {
                    animationFrameId = requestAnimationFrame(frame);
                }
            }());
        };

        const triggerSaboteurConfetti = () => {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#5D4037', '#795548', '#3E2723'],
                disableForReducedMotion: true
            });
        };

        if (result.winner === 'GOLD_DIGGER') {
            triggerGoldConfetti();
        } else if (result.winner === 'SABOTEUR') {
            triggerSaboteurConfetti();
        } else if (result.winner === 'SELFISH_DWARF') {
            // Green confetti for Selfish Dwarf
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#10B981', '#059669', '#34D399'], // Green shades
                disableForReducedMotion: true
            });
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            confetti.reset();
        };
    }, [result.winner]);

    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => (result.scores[b.id] || 0) - (result.scores[a.id] || 0));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg overflow-y-auto"
        >
            <div className="w-full max-w-4xl p-8 flex flex-col items-center">

                {/* Winner Announcement */}
                <motion.div
                    initial={{ scale: 0.5, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="mb-12 text-center"
                >
                    <div className="text-2xl text-gray-400 mb-2 tracking-widest uppercase">Winner</div>
                    <div className={`text-6xl md:text-8xl font-black tracking-tighter drop-shadow-2xl ${result.winner === 'GOLD_DIGGER' ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600' :
                            result.winner === 'SABOTEUR' ? 'text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900' :
                                result.winner === 'SELFISH_DWARF' ? 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-800' :
                                    'text-gray-200'
                        }`}>
                        {result.winner === 'GOLD_DIGGER' ? 'GOLD DIGGERS' :
                            result.winner === 'SABOTEUR' ? 'SABOTEURS' :
                                result.winner === 'SELFISH_DWARF' ? 'SELFISH DWARF WIN' : 'DRAW'}
                    </div>
                </motion.div>

                {/* Score Ranking */}
                <div className="w-full grid gap-4 mb-12">
                    {sortedPlayers.map((p, index) => (
                        <motion.div
                            key={p.id}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-transparent border-yellow-500/50' :
                                'bg-gray-800/50 border-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`text-2xl font-bold w-8 text-center ${index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-300' :
                                        index === 2 ? 'text-amber-700' : 'text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="text-4xl">{p.avatar}</div>
                                <div className="text-xl font-bold text-white">{p.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Score</span>
                                <span className="text-3xl font-mono font-bold text-yellow-400">
                                    {result.scores[p.id] || 0}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Next Button */}
                {isHost && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNext}
                        className="bg-white text-black font-bold text-xl py-4 px-12 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        {result.isFinal ? 'ロビーに戻る' : '次のラウンドへ'}
                    </motion.button>
                )}
                {!isHost && (
                    <div className="text-gray-500 animate-pulse">
                        ホストの操作を待っています...
                    </div>
                )}
            </div>
        </motion.div>
    );
};
