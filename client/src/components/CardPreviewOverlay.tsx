import React from 'react';
import { Card } from '@ojamamono/shared';
import { motion } from 'framer-motion';
import { CardView } from './Card';

interface CardPreviewOverlayProps {
    card: Card | null;
    onClose: () => void;
}

export const CardPreviewOverlay: React.FC<CardPreviewOverlayProps> = ({ card, onClose }) => {
    if (!card) return null;

    let title = '';
    let description = '';
    let typeLabel = '';
    let colorScheme = 'from-blue-600 to-indigo-600';

    if (card.type === 'SPECIAL') {
        typeLabel = 'SPECIAL ABILITY';
        colorScheme = 'from-purple-600 to-pink-600';
        switch ((card as any).specialAction) {
            case 'DYNAMITE':
                title = 'ダイナマイト';
                description = '周囲3x3の範囲の道をすべて破壊する豪快な爆薬。行き止まりを切り開くのに最適です。';
                break;
            case 'ORACLE':
                title = '千里眼';
                description = '指定したプレイヤーの正体を暴く神秘的な力。味方か敵か、真実を見極めましょう。';
                break;
            case 'THIEF':
                title = '盗賊の極意';
                description = '他人の手札からランダムに1枚を奪い取る狡猾な技。戦況を覆す鍵となります。';
                break;
            case 'TRADER':
                title = '闇の取引人';
                description = '自分と誰かのすべての手札を交換する禁断のトレード。不利な状況を一変させます。';
                break;
            case 'SCAVENGER':
                title = 'スカベンジャー';
                description = '捨て札の山から好きなカードを1枚回収する再利用術。必要な道を再び手に入れましょう。';
                break;
            case 'DOUBLE_ACTION':
                title = '疾風怒濤';
                description = 'このターン中にカードを2回使用できる驚異的な連続行動。一気にゴールへ迫れます。';
                break;
            default:
                title = '秘められた力';
                description = '特別な効果を持つ強力なカードです。';
        }
    } else if (card.type === 'ACTION') {
        typeLabel = 'ACTION CARD';
        colorScheme = 'from-amber-500 to-orange-600';
        const action = (card as any).actionType;
        if (action.startsWith('BREAK')) {
            title = '道具の破壊';
            description = '他人の道具を壊して道を置けなくします。サボタージュの基本です。';
        } else if (action.startsWith('FIX')) {
            title = '道具の修理';
            description = '壊れた道具を直し、再び道を置けるようにします。仲間との協力が不可欠です。';
        } else if (action === 'MAP') {
            title = '宝の地図';
            description = '3つのゴールのうち1つを選んで内容を確認できます。本物の金塊を探し出しましょう。';
        } else if (action === 'ROCKFALL') {
            title = '落石';
            description = '盤面にある通路を1つ選んで破壊します。道を塞いだり、間違った道を消すのに。';
        }
    } else if (card.type === 'PATH') {
        typeLabel = 'PATH CARD';
        colorScheme = 'from-stone-500 to-stone-700';
        title = '通路';
        description = '金塊へ向かって道を繋げます。行き止まりに注意して配置しましょう。';
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 touch-none"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50, rotateY: -10 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="max-w-xs w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Label */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`mb-6 px-4 py-1 rounded-full bg-gradient-to-r ${colorScheme} text-white text-[10px] font-black tracking-[0.3em] shadow-lg shadow-purple-500/20`}
                >
                    {typeLabel}
                </motion.div>

                {/* The Large Card */}
                <div className="relative group perspective-1000 mb-10">
                    <motion.div
                        animate={{
                            rotateY: [0, 5, -5, 0],
                            rotateX: [0, -5, 5, 0]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-48 h-64 sm:w-56 sm:h-80 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                    >
                        <CardView card={card} className="w-full h-full shadow-2xl" />
                    </motion.div>

                    {/* Glowing effect background */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${colorScheme} opacity-20 blur-3xl -z-10 animate-pulse`} />
                </div>

                {/* Text Content */}
                <div className="text-center space-y-4 px-2">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-md"
                    >
                        {title}
                    </motion.h2>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`h-1 w-20 mx-auto bg-gradient-to-r ${colorScheme} rounded-full`}
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-200 text-lg leading-relaxed font-medium"
                    >
                        {description}
                    </motion.p>
                </div>

                {/* Close Hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12 text-slate-500 text-[10px] font-bold tracking-widest uppercase border border-slate-800 px-6 py-2 rounded-full backdrop-blur-sm"
                >
                    tap anywhere to close
                </motion.div>
            </motion.div>
        </motion.div>
    );
};
