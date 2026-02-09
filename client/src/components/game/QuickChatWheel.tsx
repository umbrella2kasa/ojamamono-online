import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickChatWheelProps {
    onSelect: (message: string) => void;
    onClose: () => void;
    position: { x: number; y: number } | null; // Center position (e.g. touch/mouse event)
}

const MESSAGES = [
    { text: "👍 Nice!", icon: "👍", color: "bg-green-500" },
    { text: "⛏️ Dig!", icon: "⛏️", color: "bg-blue-500" },
    { text: "❌ Block!", icon: "❌", color: "bg-red-500" },
    { text: "😨 Help!", icon: "😨", color: "bg-yellow-500" },
    { text: "🙏 Thanks", icon: "🙏", color: "bg-purple-500" },
    { text: "👀 Sus...", icon: "👀", color: "bg-slate-600" },
];

export const QuickChatWheel: React.FC<QuickChatWheelProps> = ({ onSelect, onClose, position }) => {
    if (!position) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm touch-none"
                onClick={onClose}
            >
                <div
                    className="absolute"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {MESSAGES.map((msg, index) => {
                        const angle = (index / MESSAGES.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                        const radius = 100; // Distance from center
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;

                        return (
                            <motion.button
                                key={msg.text}
                                initial={{ scale: 0, x: 0, y: 0 }}
                                animate={{ scale: 1, x, y }}
                                exit={{ scale: 0, x: 0, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 }}
                                className={`absolute w-16 h-16 rounded-full ${msg.color} text-white shadow-lg border-2 border-white flex flex-col items-center justify-center gap-1 active:scale-90 touch-manipulation`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(msg.text);
                                    onClose();
                                }}
                            >
                                <span className="text-xl">{msg.icon}</span>
                                <span className="text-[10px] font-bold leading-none">{msg.text.split(' ')[1]}</span>
                            </motion.button>
                        );
                    })}

                    {/* Center Close/Cancel Button */}
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute w-12 h-12 bg-white text-slate-800 rounded-full shadow-xl flex items-center justify-center font-bold border-2 border-slate-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        ✖
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
