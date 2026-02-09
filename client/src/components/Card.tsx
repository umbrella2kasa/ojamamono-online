import React from 'react';
import { Role, Card, PathShape } from '@ojamamono/shared';
import { motion } from 'framer-motion';

// -- SVGによるクリアで滑らかなパス描画 --
const PathShapeView = React.memo<{ shape: PathShape, isStart?: boolean, isGoal?: boolean, isRevealed?: boolean, hasCrystal?: boolean, goalType?: 'GOLD' | 'STONE' }>(({ shape, isStart, isGoal, isRevealed, hasCrystal, goalType }) => {

    // 背景色（壁）
    // const bgColor = "#3E2723"; // Dark Brown
    // 通路の色
    const pathColor = "#D7CCC8"; // Light Grayish Brown

    // SVG定数
    const PATH_WIDTH = 34; // 道幅 (100分率)
    // const CENTER = 50;
    const OFFSET = (100 - PATH_WIDTH) / 2; // 33

    // スタートカード
    if (isStart) {
        // Paths will be rendered below (it's a Cross shape)
        // We just define a special overlay or let it render and add the icon on top
        // Let's use the 'overlay' variable approach or just render it at the end
    }

    // ゴールカード（裏）
    if (isGoal && !isRevealed) {
        return (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center border-2 border-gray-600 relative overflow-hidden">
                <div className="text-4xl opacity-50 select-none">🔒</div>
                <div className="absolute bottom-1 w-full text-center text-[10px] text-gray-400 font-bold tracking-wider">GOAL</div>
            </div>
        );
    }

    // ゴールカード（表）- パスの上にアイコンを重ねる
    let overlay = null;
    if (isGoal && isRevealed) {
        overlay = (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className={`flex flex-col items-center justify-center p-1 rounded-lg backdrop-blur-[1px] ${goalType === 'GOLD' ? 'bg-yellow-100/60' : 'bg-gray-300/60'}`}>
                    {goalType === 'GOLD' ? (
                        <>
                            <div className="text-3xl drop-shadow-md select-none">💰</div>
                            <div className="text-[10px] font-bold text-yellow-900 leading-none">GOLD</div>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl drop-shadow-md select-none grayscale opacity-80">🪨</div>
                            <div className="text-[10px] font-bold text-gray-900 leading-none">STONE</div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Start Card Overlay
    if (isStart) {
        overlay = (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className="text-4xl select-none animate-pulse drop-shadow-md">🪜</div>
                <div className="absolute bottom-1 w-full text-center text-[10px] text-white/90 font-bold tracking-wider bg-black/30 py-0.5">START</div>
            </div>
        );
    }

    // Crystal Indicator
    let crystalIcon = null;
    if (hasCrystal) {
        crystalIcon = (
            <div className="absolute top-0 right-0 z-20 pointer-events-none p-1">
                <div className="text-lg drop-shadow-md select-none filter brightness-125 contrast-125 animate-pulse">💎</div>
            </div>
        );
    }

    // Path生成
    const paths = [];

    // Center Hub (隙間埋め)
    if (shape.center || (shape.top && shape.bottom) || (shape.left && shape.right)) {
        paths.push(<rect key="center" x={OFFSET} y={OFFSET} width={PATH_WIDTH} height={PATH_WIDTH} fill={pathColor} />);
    }

    // 各方向への接続
    if (shape.top) paths.push(<rect key="top" x={OFFSET} y="0" width={PATH_WIDTH} height="50" fill={pathColor} />);
    if (shape.bottom) paths.push(<rect key="bottom" x={OFFSET} y="50" width={PATH_WIDTH} height="50" fill={pathColor} />);
    if (shape.left) paths.push(<rect key="left" x="0" y={OFFSET} width="50" height={PATH_WIDTH} fill={pathColor} />);
    if (shape.right) paths.push(<rect key="right" x="50" y={OFFSET} width="50" height={PATH_WIDTH} fill={pathColor} />);

    return (
        <div className="w-full h-full relative bg-[#3E2723] border border-[#5D4037] box-border">
            <svg viewBox="0 0 100 100" className="w-full h-full block" preserveAspectRatio="none">
                {paths}

                {/* Blocked Path / Dead End Indicator - Simplified clean X */}
                {shape.deadEnd && (
                    <g>
                        {/* Clean industrial red X with dark border */}
                        <line x1="25" y1="25" x2="75" y2="75" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
                        <line x1="75" y1="25" x2="25" y2="75" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
                        <line x1="25" y1="25" x2="75" y2="75" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                        <line x1="75" y1="25" x2="25" y2="75" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                    </g>
                )}
            </svg>
            {overlay}
            {crystalIcon}
        </div>
    );
});

// -- カード全体のビュー --
export const CardView = React.memo<{ card: Card | 'BACK', className?: string, onClick?: () => void }>(({ card, className, onClick }) => {
    // 共通スタイル
    const baseStyle = `rounded-md shadow-md border border-slate-700 overflow-hidden select-none relative box-border ${className || ''}`;

    // カード裏面
    if (card === 'BACK') {
        return (
            <motion.div
                whileHover={{ scale: 1.05, rotateZ: 1 }}
                whileTap={{ scale: 0.95 }}
                className={`${baseStyle} bg-blue-900 border-blue-700 flex items-center justify-center cursor-pointer shadow-lg`}
                onClick={onClick}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <div className="text-white/20 font-bold text-center leading-tight select-none text-sm tracking-widest">
                    SABO<br />TEUR
                </div>
            </motion.div>
        );
    }

    // 通路カード
    if (card.type === 'PATH') {
        return (
            <motion.div
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.95 }}
                className={`${baseStyle} cursor-pointer border-stone-800 shadow-lg`}
                onClick={onClick}
            >
                <PathShapeView
                    shape={(card as any).shape}
                    isStart={(card as any).isStart}
                    isGoal={(card as any).isGoal}
                    isRevealed={(card as any).isRevealed}
                    hasCrystal={(card as any).hasCrystal}
                    goalType={card.goalType}
                />
            </motion.div>
        );
    }

    // アクションカード
    if (card.type === 'ACTION') {
        const actionType = (card as any).actionType;
        let icons: string[] = []; // アイコンの配列
        let subIcon = "";
        let colorClass = "bg-amber-100 border-amber-300";
        let label = "アクション";

        switch (actionType) {
            case 'BREAK_PICKAXE': icons = ["⛏️"]; subIcon = "❌"; label = "破壊"; colorClass = "bg-red-100 border-red-300"; break;
            case 'BREAK_LANTERN': icons = ["🔦"]; subIcon = "❌"; label = "破壊"; colorClass = "bg-red-100 border-red-300"; break;
            case 'BREAK_CART': icons = ["🛒"]; subIcon = "❌"; label = "破壊"; colorClass = "bg-red-100 border-red-300"; break;

            case 'FIX_PICKAXE': icons = ["⛏️"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;
            case 'FIX_LANTERN': icons = ["🔦"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;
            case 'FIX_CART': icons = ["🛒"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;
            case 'FIX_ALL': icons = ["⛏️", "🔦", "🛒"]; subIcon = "💚"; label = "全修理"; colorClass = "bg-green-100 border-green-300"; break;

            case 'FIX_PICKAXE_LANTERN': icons = ["⛏️", "🔦"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;
            case 'FIX_PICKAXE_CART': icons = ["⛏️", "🛒"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;
            case 'FIX_LANTERN_CART': icons = ["🔦", "🛒"]; subIcon = "💚"; label = "修理"; colorClass = "bg-green-100 border-green-300"; break;

            case 'MAP': icons = ["🗺️"]; label = "地図"; colorClass = "bg-blue-100 border-blue-300"; break;
            case 'ROCKFALL': icons = ["💣"]; label = "落石"; colorClass = "bg-gray-200 border-gray-400"; break;
        }

        return (
            <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`${baseStyle} ${colorClass} flex flex-col items-center justify-center p-1 cursor-pointer shadow-lg`}
                onClick={onClick}
            >
                {/* Main Icon Container - Always Centered */}
                <div className="relative flex items-center justify-center gap-1 mb-1">
                    {icons.map((icon, i) => (
                        <div key={i} className="text-3xl select-none drop-shadow-sm">{icon}</div>
                    ))}

                    {/* Status Mark - Strictly positioned absolute to the icon group */}
                    {subIcon && (
                        <div className="absolute -bottom-2 -right-3 text-lg drop-shadow-md select-none bg-white/50 rounded-full px-0.5">
                            {subIcon}
                        </div>
                    )}
                </div>

                {/* Label - Fixed at bottom area */}
                <div className="text-[10px] font-bold text-gray-700 mt-1 whitespace-nowrap overflow-hidden px-1 rounded bg-white/30">
                    {label}
                </div>
            </motion.div>
        );
    }

    // スペシャルカード - キラカード演出
    if (card.type === 'SPECIAL') {
        let icon = '';
        let label = '';
        let colorClass = '';

        switch ((card as any).specialAction) {
            case 'DYNAMITE': icon = "💣"; label = "DYNAMITE"; colorClass = "bg-red-100 border-red-400"; break;
            case 'ORACLE': icon = "🔮"; label = "ORACLE"; colorClass = "bg-purple-100 border-purple-400"; break;
            case 'THIEF': icon = "💰"; label = "THIEF"; colorClass = "bg-yellow-100 border-yellow-400"; break;
            case 'TRADER': icon = "🔄"; label = "TRADER"; colorClass = "bg-green-100 border-green-400"; break;
            case 'SCAVENGER': icon = "♻️"; label = "SCAVENGER"; colorClass = "bg-blue-100 border-blue-400"; break;
            case 'DOUBLE_ACTION': icon = "⚡"; label = "DOUBLE"; colorClass = "bg-orange-100 border-orange-400"; break;
            default: icon = "✨"; label = "SPECIAL"; colorClass = "bg-pink-100 border-pink-400";
        }

        return (
            <motion.div
                whileHover={{ scale: 1.08, y: -4, rotateZ: 2 }}
                whileTap={{ scale: 0.95 }}
                className={`${baseStyle} relative overflow-hidden cursor-pointer group touch-none`}
                onClick={onClick}
                style={{ perspective: '1000px' }}
            >
                {/* ホログラフィックグラデーション背景 */}
                <div className="absolute inset-0 holographic-gradient opacity-90" />

                {/* 虹色の光沢オーバーレイ */}
                <div className="absolute inset-0 rainbow-shine opacity-60" />

                {/* 輝きパーティクル */}
                <div className="absolute inset-0 sparkle-effect pointer-events-none" />

                {/* カード周囲の発光 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg opacity-50 blur-md group-hover:opacity-75 transition-opacity duration-300" style={{ zIndex: -1 }} />

                {/* コンテンツ */}
                <div className={`relative z-10 ${colorClass} flex flex-col items-center justify-center p-1 h-full rounded-md bg-opacity-80 backdrop-blur-sm`}>
                    <div className="text-3xl select-none drop-shadow-md mb-1 filter brightness-110 group-hover:scale-110 transition-transform duration-300">{icon}</div>
                    <div className={`text-[10px] font-bold ${(card as any).specialAction === 'THIEF' ? 'text-gray-200' : 'text-gray-700'} mt-1 whitespace-nowrap px-1 rounded leading-none ${(card as any).specialAction === 'THIEF' ? 'bg-black/30' : 'bg-white/30'}`}>
                        {label}
                    </div>

                    {/* 特別感を示すバッジ */}
                    <div className="absolute top-1 right-1 text-xs">✨</div>
                </div>
            </motion.div>
        );
    }

    return null;
});

// -- 役割確認用のカードビュー --
export const RoleCardView: React.FC<{ role: Role, reveal: boolean }> = ({ role, reveal }) => {
    if (!reveal) return <CardView card="BACK" className="w-48 h-72 shadow-xl" />;

    const isSaboteur = role === 'SABOTEUR';
    const isSelfish = role === 'SELFISH_DWARF';

    let bgColor = 'bg-yellow-50 border-yellow-500';
    let icon = '👷';
    let title = '金鉱掘り';
    let textColor = 'text-yellow-700';
    let description = '協力して、金塊への道をつなげろ！';

    if (isSaboteur) {
        bgColor = 'bg-red-50 border-red-600';
        icon = '😈';
        title = 'お邪魔者';
        textColor = 'text-red-700';
        description = '邪魔をして、金塊に到達させるな！';
    } else if (isSelfish) {
        bgColor = 'bg-green-50 border-green-600';
        icon = '👺';
        title = '自己中ドワーフ';
        textColor = 'text-green-700';
        title = '自己中ドワーフ';
        textColor = 'text-green-700';
        description = '自分だけで金塊につなげろ！\n他人がつなげたら敗北。';
    } else if (role === 'GEOLOGIST') {
        bgColor = 'bg-cyan-50 border-cyan-600';
        icon = '💎';
        title = '地質学者';
        textColor = 'text-cyan-700';
        description = 'クリスタルがある道を集めろ！\n金塊が見つかるかは関係ない。';
    }

    return (
        <div className={`w-48 h-72 rounded-xl shadow-2xl border-4 flex flex-col items-center justify-center p-4 text-center ${bgColor}`}>
            <div className="text-6xl mb-4 select-none">
                {icon}
            </div>
            <h3 className={`text-2xl font-extrabold mb-2 ${textColor}`}>
                {title}
            </h3>
            <p className="text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                {description}
            </p>
        </div>
    );
}
