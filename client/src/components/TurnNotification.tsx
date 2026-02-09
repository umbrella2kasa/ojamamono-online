import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TurnNotification: React.FC<{ playerName: string, isMe: boolean }> = ({ playerName, isMe }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            >
                <div className={`px-12 py-8 rounded-2xl shadow-2xl border-4 transform transition-all ${isMe
                    ? 'bg-yellow-100 border-yellow-500'
                    : 'bg-gray-800 border-gray-600'
                    }`}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl animate-bounce">
                            {isMe ? '👉' : '⏳'}
                        </div>
                        <div className={`text-4xl font-extrabold tracking-wider ${isMe ? 'text-yellow-800' : 'text-white'}`}>
                            {isMe ? 'あなたのターン' : `${playerName} のターン`}
                        </div>
                        <div className={`text-sm font-bold ${isMe ? 'text-yellow-600' : 'text-gray-400'}`}>
                            READY?
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
