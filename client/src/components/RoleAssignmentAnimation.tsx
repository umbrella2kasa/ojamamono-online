import React, { useEffect, useState } from 'react';
import { Role } from '@ojamamono/shared';
import { RoleCardView } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
// import { soundManager } from '../utils/SoundManager';

export const RoleAssignmentAnimation: React.FC<{ role: Role, onComplete: () => void }> = ({ role, onComplete }) => {
    const [step, setStep] = useState<'INIT' | 'WAITING' | 'REVEALED'>('INIT');
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        // Step 1: Initial Suspense
        const t1 = setTimeout(() => {
            setStep('WAITING');
            // soundManager.playDrumRoll();
        }, 800);

        return () => { clearTimeout(t1); };
    }, []);

    const handleCardClick = () => {
        if (step === 'WAITING' && !isFlipped) {
            setIsFlipped(true);

            // Play sound immediately when animation starts for better feel
            // Or slightly delayed to match the "reveal" moment (when card is flat)
            // User requested "perfect satisfaction", usually this means sound hits when visual IMPACT happens.
            // Let's delay sound slightly to hit exactly when the card face becomes visible (90deg)
            setTimeout(() => {
                // soundManager.playRoleReveal(role === 'GOLD_DIGGER');
                setStep('REVEALED');
            }, 150); // 150ms matches roughly 90deg rotation of a quick flip
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden"
            >
                {/* Spotlight Effect Background */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_black_80%)] opacity-80" />

                {/* Text Phase */}
                <div className="z-10 flex flex-col items-center">
                    <motion.div
                        animate={{ opacity: step === 'INIT' ? 1 : 0.5, scale: step === 'INIT' ? 1 : 0.8 }}
                        className="text-white text-3xl font-bold mb-12 tracking-[0.2em] text-shadow-glow"
                    >
                        あなたの役割は...
                    </motion.div>

                    {/* Card Container with Perspective */}
                    <div className="relative w-64 h-96 [perspective:1000px] cursor-pointer" onClick={handleCardClick}>
                        <motion.div
                            initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                            animate={{
                                rotateY: isFlipped ? 0 : 180,
                                scale: step === 'INIT' ? 0.5 : 1,
                                opacity: 1,
                                y: step === 'WAITING' ? [0, -20, 0] : 0
                            }}
                            transition={{
                                rotateY: { duration: 0.6, ease: "backOut" }, // Snappy flip
                                scale: { duration: 0.5 },
                                opacity: { duration: 0.5 },
                                y: { repeat: step === 'WAITING' ? Infinity : 0, duration: 2, ease: "easeInOut" }
                            }}
                            className="w-full h-full relative [transform-style:preserve-3d]"
                        >
                            {/* Front (Revealed Role) */}
                            {/* Make absolutely sure this is invisible until flipped */}
                            <div
                                className="absolute inset-0 [backface-visibility:hidden]"
                                style={{ opacity: isFlipped ? 1 : 0 }} // Hard toggle opacity to prevent "seeing through"
                            >
                                <RoleCardView role={role} reveal={true} />
                                {/* Shine Effect on Reveal */}
                                {step === 'REVEALED' && (
                                    <motion.div
                                        initial={{ opacity: 0.8, x: -100 }}
                                        animate={{ opacity: 0, x: 300 }}
                                        transition={{ duration: 0.8 }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"
                                    />
                                )}
                            </div>

                            {/* Back (Card Back) */}
                            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl shadow-2xl overflow-hidden border-4 border-white/10 bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                                <span className="text-6xl filter drop-shadow-lg">?</span>
                                <div className="absolute bottom-4 text-white/50 text-sm animate-pulse">Click to Reveal</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Reveal Content */}
                    <AnimatePresence>
                        {step === 'REVEALED' && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }} // Faster response
                                className="mt-12 flex flex-col items-center gap-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.8 }} animate={{ scale: 1.2 }}
                                    transition={{ type: "spring", repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                                    className={`text-4xl font-black tracking-widest ${role === 'GOLD_DIGGER' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]'}`}
                                >
                                    {role === 'GOLD_DIGGER' ? '金鉱掘り' : 'お邪魔者'}
                                </motion.div>

                                <button
                                    onClick={onComplete}
                                    className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] transform transition hover:scale-105 active:scale-95 text-xl"
                                >
                                    ゲーム開始！
                                </button>
                                <p className="text-gray-400 text-sm">
                                    全員の確認を待っています...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
