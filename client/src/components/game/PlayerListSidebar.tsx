import React from 'react';
import { Player } from '@ojamamono/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarToken } from '../common/AvatarToken';
import { soundManager } from '../../utils/SoundManager';

interface PlayerListSidebarProps {
    players: Player[];
    currentPlayerIndex: number;
    scores: { [playerId: string]: number };
    suspicions?: Record<string, string[]>; // targetId -> voterIds[]
    myUserId: string;
    onVoteSuspicion: (targetId: string) => void;
    activeEmotes: { [key: string]: string };
}

const ToolState: React.FC<{ icon: string, broken?: boolean, detail: string | null }> = ({ icon, broken, detail }) => (
    <div className={`relative flex items-center justify-center rounded transition-colors ${broken ? 'bg-red-100 border border-red-300' : 'bg-slate-100 border border-slate-200'} ${window.innerWidth < 768 ? 'w-8 h-8' : 'w-6 h-6'}`} title={detail || ''}>
        <span className={`${broken ? 'opacity-50 grayscale' : ''} ${window.innerWidth < 768 ? 'text-base' : 'text-sm'}`}>{icon}</span>
        {broken && (
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-red-500 font-bold text-lg leading-none transform rotate-45">+</span>
            </div>
        )}
        {!broken && (
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white flex items-center justify-center bg-green-500 shadow-sm">
                <span className="text-[6px] text-white">✓</span>
            </div>
        )}
    </div>
);

export const PlayerListSidebar: React.FC<PlayerListSidebarProps> = ({
    players,
    currentPlayerIndex,
    scores,
    suspicions,
    myUserId,
    onVoteSuspicion,
    activeEmotes
}) => {
    return (
        <div className="flex flex-col gap-3 py-4 pr-1 h-full overflow-y-auto no-scrollbar">
            {players.map(p => {
                const isCurrent = players[currentPlayerIndex].id === p.id;
                return (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`relative w-full rounded-lg transition-all duration-300 group touch-manipulation
                            ${isCurrent ? 'bg-slate-50 shadow-md border-l-4 border-blue-500 p-3' : 'bg-white/80 border border-slate-200 opacity-90 p-2.5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <AvatarToken
                                    avatar={p.avatar}
                                    rankStats={p.stats}
                                    size={window.innerWidth < 768 ? "lg" : "md"}
                                    pulse={isCurrent}
                                    className={isCurrent ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''}
                                />
                                {isCurrent && (
                                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-50 animate-ping z-20" />
                                )}
                                <AnimatePresence>
                                    {activeEmotes[p.id] && (
                                        <motion.div
                                            initial={{ scale: 0, x: 10 }}
                                            animate={{ scale: 1, x: 0 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-6 left-full ml-2 z-50 pointer-events-none whitespace-nowrap"
                                        >
                                            <div className="bg-white text-xl p-1.5 rounded-xl rounded-bl-none shadow-xl border border-slate-200">
                                                {activeEmotes[p.id]}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`text-sm font-bold truncate ${isCurrent ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {p.name}
                                    </span>
                                    {scores[p.id] ? (
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            ★{scores[p.id]}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                    <ToolState icon="⛏️" broken={p.brokenTools?.pickaxe} detail={p.brokenToolDetails?.pickaxe} />
                                    <ToolState icon="🔦" broken={p.brokenTools?.lantern} detail={p.brokenToolDetails?.lantern} />
                                    <ToolState icon="🛒" broken={p.brokenTools?.cart} detail={p.brokenToolDetails?.cart} />

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            soundManager.playClick();
                                            onVoteSuspicion(p.id);
                                        }}
                                        className={`ml-auto p-1.5 rounded hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-lg touch-feedback ${suspicions?.[p.id]?.includes(myUserId) ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                                        title="疑う"
                                    >
                                        👁️
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Suspicions Dots */}
                        {suspicions?.[p.id]?.length ? (
                            <div className="absolute -top-1 -right-1 flex gap-0.5">
                                {suspicions[p.id].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 bg-red-600 rounded-full border border-white shadow-sm" />
                                ))}
                            </div>
                        ) : null}
                    </motion.div>
                );
            })}
        </div>
    );
};
