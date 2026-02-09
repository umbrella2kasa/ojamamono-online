import { motion } from 'framer-motion';

type TutorialModalProps = {
    onClose: () => void;
};

export function TutorialModal({ onClose }: TutorialModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 border-2 border-yellow-600/50 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl"
                >
                    ✕
                </button>

                <div className="p-6 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                        <span>📜</span> ルール説明
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-200">
                    {/* 基本説明 */}
                    <section>
                        <h3 className="text-lg font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-1">⛰️ 基本説明</h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            お邪魔ものOnlineへようこそ！このゲームは、金山を掘り進めるドワーフ（金鉱掘り）と、それを阻止する裏切り者（お邪魔もの）に分かれて競う正体隠匿系カードゲームです。3つのゴールのどこかにある「金塊」を目指して通路を繋げましょう。
                        </p>
                    </section>

                    {/* 役職と報酬 */}
                    <section>
                        <h3 className="text-lg font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-1 flex justify-between">
                            <span>👥 役職と勝利条件 (報酬: 金塊)</span>
                            <span className="text-[10px] text-gray-400 uppercase self-end mb-1">Roles & Rewards</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="bg-gray-700/30 p-2 rounded border border-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-blue-400 font-bold">👷 金鉱掘り</span>
                                    <span className="bg-blue-900/50 text-[10px] px-1 rounded text-blue-200">金塊 +3</span>
                                </div>
                                <p className="text-[11px] text-gray-400">協力して金塊に到達するのが目的。到達時にチーム全員が獲得。</p>
                            </div>
                            <div className="bg-gray-700/30 p-2 rounded border border-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-red-400 font-bold">😈 お邪魔もの</span>
                                    <span className="bg-red-900/50 text-[10px] px-1 rounded text-red-200">金塊 +4 or 3</span>
                                </div>
                                <p className="text-[11px] text-gray-400">妨害が目的。山札切れ時に獲得（単独なら4枚、複数なら各3枚）。</p>
                            </div>
                            <div className="bg-gray-700/30 p-2 rounded border border-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-yellow-500 font-bold">👺 自己中ドワーフ</span>
                                    <span className="bg-yellow-900/50 text-[10px] px-1 rounded text-yellow-200">金塊 +5</span>
                                </div>
                                <p className="text-[11px] text-gray-400">自分一人の手で金塊に到達した場合のみ独占勝利。</p>
                            </div>
                            <div className="bg-gray-700/30 p-2 rounded border border-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-cyan-400 font-bold">💎 地質学者</span>
                                    <span className="bg-cyan-900/50 text-[10px] px-1 rounded text-cyan-200">Crystal / 2</span>
                                </div>
                                <p className="text-[11px] text-gray-400">全クリスタル数 ÷ 地質学者の数 × 0.5 の金塊を獲得（端数切捨）。</p>
                            </div>
                        </div>
                    </section>

                    {/* 山札構成 */}
                    <section>
                        <h3 className="text-lg font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-1 flex justify-between">
                            <span>🎴 山札構成 (全84枚)</span>
                            <span className="text-[10px] text-gray-400 uppercase self-end mb-1">Deck Breakdown</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-300">通路カード (58枚)</p>
                                <ul className="text-[10px] text-gray-400 space-y-0.5 list-disc pl-4">
                                    <li>通常通路: 49枚</li>
                                    <li>行き止まり: 9枚</li>
                                    <li><span className="text-cyan-400 font-bold">クリスタル含有</span>: ランダム12枚</li>
                                </ul>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-300">アクションカード (26枚)</p>
                                <ul className="text-[10px] text-gray-400 space-y-0.5 list-disc pl-4">
                                    <li>道具破壊/修理: 各9枚</li>
                                    <li><span className="text-emerald-400">全修復</span>: 1枚</li>
                                    <li>マップ: 4枚 / 落石: 4枚</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 宝箱とスペシャルカード */}
                    <section>
                        <h3 className="text-lg font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-1 flex justify-between">
                            <span>⭐ 宝箱とスペシャルカード</span>
                            <span className="text-[10px] text-gray-400 uppercase self-end mb-1">Treasure & Special</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
                            盤面に隠された<strong className="text-white">宝箱マスに通路を置いたプレイヤー</strong>が、スペシャルカードをランダムに獲得します（1人1枚まで。使い切りで自動補充なし）。
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {[
                                { name: '🧨 DYNAMITE', desc: '指定中心から3x3の全通路を破壊' },
                                { name: '🔮 ORACLE', desc: '指定プレイヤーの正体を自分だけ確認' },
                                { name: '💰 THIEF', desc: '指定相手から金塊を1つ奪う(所持時のみ)' },
                                { name: '🔄 TRADER', desc: '指定相手と手札をすべて交換' },
                                { name: '♻️ SCAVENGER', desc: '捨て札の一番上を拾って手札に加える' },
                                { name: '⚡ DOUBLE', desc: '即座に自分の手番を連続で行う' },
                            ].map(sc => (
                                <div key={sc.name} className="bg-indigo-900/20 p-2 rounded border border-indigo-700/30">
                                    <div className="text-[10px] font-black text-indigo-300 mb-1">{sc.name}</div>
                                    <div className="text-[9px] text-gray-400 leading-tight">{sc.desc}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 石炭報酬 */}
                    <section>
                        <h3 className="text-lg font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-1 flex justify-between">
                            <span>💎 特別ルール：石炭報酬</span>
                            <span className="text-[10px] text-gray-400 uppercase self-end mb-1">Coal Bonus Action</span>
                        </h3>
                        <div className="bg-amber-900/10 p-2 rounded border border-amber-600/30 leading-relaxed">
                            <p className="text-[11px] text-gray-300">
                                「石炭（ハズレ）」を開放すると<strong className="text-white">金塊+1</strong>を獲得し、ボーナスアクションとして誰かの道具を<strong className="text-amber-400">「修復」「破壊」</strong>、または<strong className="text-amber-400">「何もしない」</strong>から選べます。
                            </p>
                        </div>
                    </section>
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-xl flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-8 rounded shadow-lg transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
