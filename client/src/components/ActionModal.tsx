import { Player } from '@ojamamono/shared';
import { motion } from 'framer-motion';

type ActionModalProps = {
    players: Player[];
    onSelect: (playerId: string) => void;
    onCancel: () => void;
    title: string;
};

export function ActionModal({ players, onSelect, onCancel, title }: ActionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#2d241e] border-2 border-yellow-600/50 rounded-xl p-0 w-full max-w-sm shadow-2xl overflow-hidden relative"
            >
                {/* Header */}
                <div className="bg-gradient-to-b from-yellow-900 to-[#2d241e] p-4 border-b border-yellow-600/30">
                    <h3 className="text-xl font-bold text-yellow-500 text-center flex items-center justify-center gap-2">
                        <span>🎯</span> {title}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 bg-[url('/assets/pattern_rock.png')]">
                    {players.map(player => (
                        <button
                            key={player.id}
                            onClick={() => onSelect(player.id)}
                            className="group w-full relative overflow-hidden bg-black/40 hover:bg-black/60 p-3 rounded-lg flex items-center gap-3 transition-all border border-white/5 hover:border-yellow-500/50 active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-2xl shadow-inner border border-white/10 shrink-0">
                                {player.avatar || player.name[0]}
                            </div>

                            <div className="flex-1 text-left min-w-0">
                                <div className="font-bold text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                                    {player.name}
                                </div>
                                <div className="text-xs text-gray-400 flex flex-wrap gap-1 mt-1">
                                    {Object.entries(player.brokenTools).some(([_, v]) => v) ? (
                                        <>
                                            {player.brokenTools.pickaxe && (
                                                <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-800/50">
                                                    🚫⛏️
                                                </span>
                                            )}
                                            {player.brokenTools.lantern && (
                                                <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-800/50">
                                                    🚫🔦
                                                </span>
                                            )}
                                            {player.brokenTools.cart && (
                                                <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-800/50">
                                                    🚫🛒
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-emerald-500/70 text-[10px]">✅ 正常</span>
                                    )}
                                </div>
                            </div>

                            {/* Chevron */}
                            <div className="text-gray-600 group-hover:text-yellow-500 transition-colors">
                                ▶
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#1f1a16] border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="w-full py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm border border-transparent hover:border-gray-600"
                    >
                        キャンセル
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
