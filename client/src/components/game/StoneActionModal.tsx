import { useState } from 'react';
import { Player } from '@ojamamono/shared';
import { motion } from 'framer-motion';

type StoneActionModalProps = {
    players: Player[];
    myUserId: string;
    onSelect: (targetId: string, actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART') => void;
    onSkip: () => void;
};

export function StoneActionModal({ players, myUserId, onSelect, onSkip }: StoneActionModalProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1a1614] border-2 border-amber-500 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-b from-amber-600 to-amber-900 p-6 text-center border-b border-amber-500/30">
                    <div className="text-4xl mb-2">💎</div>
                    <h3 className="text-2xl font-black text-white tracking-widest uppercase">
                        BONUS ACTION
                    </h3>
                    <p className="text-amber-200 text-xs mt-2 font-bold opacity-80">
                        石炭を発見しました！お好きなプレイヤーの道具を1つ<br />
                        修復または破壊することができます。
                    </p>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {!selectedPlayerId ? (
                        <>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center">対象プレイヤーを選択してください</p>
                            <div className="grid grid-cols-1 gap-2">
                                {players.map(player => (
                                    <button
                                        key={player.id}
                                        onClick={() => setSelectedPlayerId(player.id)}
                                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all text-left"
                                    >
                                        <span className="text-2xl">{player.avatar || '👷'}</span>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-200">{player.name} {player.id === myUserId && '(自分)'}</div>
                                            <div className="text-[10px] text-gray-500">
                                                {Object.values(player.brokenTools).filter(v => v).length}個の道具が使用不能
                                            </div>
                                        </div>
                                        <div className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">▶</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6 py-2">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setSelectedPlayerId(null)}
                                    className="text-gray-500 hover:text-white"
                                >
                                    ◀
                                </button>
                                <div className="text-2xl">{selectedPlayer?.avatar || '👷'}</div>
                                <div className="font-bold text-xl">{selectedPlayer?.name}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <ToolAction
                                    icon="⛏️"
                                    isBroken={selectedPlayer!.brokenTools.pickaxe}
                                    onAction={(type) => onSelect(selectedPlayer!.id, type, 'PICKAXE')}
                                />
                                <ToolAction
                                    icon="🔦"
                                    isBroken={selectedPlayer!.brokenTools.lantern}
                                    onAction={(type) => onSelect(selectedPlayer!.id, type, 'LANTERN')}
                                />
                                <ToolAction
                                    icon="🛒"
                                    isBroken={selectedPlayer!.brokenTools.cart}
                                    onAction={(type) => onSelect(selectedPlayer!.id, type, 'CART')}
                                />
                            </div>
                        </div>
                    )}

                    {/* Skip Button */}
                    <div className="pt-2 border-t border-white/5">
                        <button
                            onClick={onSkip}
                            className="w-full py-3 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 text-xs font-bold transition-all uppercase tracking-widest"
                        >
                            🚫 何もしない (パス)
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-black/20 text-center">
                    {!selectedPlayerId && (
                        <p className="text-[10px] text-gray-600 uppercase tracking-tighter">
                            手番プレイヤーのみがこのアクションを実行できます
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function ToolAction({ icon, isBroken, onAction }: {
    icon: string,
    isBroken: boolean,
    onAction: (type: 'FIX' | 'BREAK') => void
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="aspect-square flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden">
                <span className="text-3xl">{icon}</span>
                {isBroken && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                )}
            </div>

            {isBroken ? (
                <button
                    onClick={() => onAction('FIX')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 rounded-lg shadow-lg active:scale-95 transition-all"
                >
                    修復する
                </button>
            ) : (
                <button
                    onClick={() => onAction('BREAK')}
                    className="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg shadow-lg active:scale-95 transition-all"
                >
                    破壊する
                </button>
            )}
        </div>
    );
}
