import React from 'react';
import { Card, PathCard, ActionCard, SpecialCard } from '@ojamamono/shared';
import { ICONS, BanSymbol, FixSymbol } from './SaboteurAssets';

interface VisualCardProps {
    card: Card;
    width?: number;
    height?: number;
    className?: string;
    isRevealed?: boolean;
}

export const VisualCard = React.memo<VisualCardProps>(({
    card,
    width = 100,
    height = 140,
    className = "",
    isRevealed = true
}) => {
    // 背景色（カードのエッジ）
    const backgroundColor = "#e2e8f0"; // 標準的なカードの白い枠

    return (
        <div className={`relative ${className} rounded-md overflow-hidden shadow-sm`} style={{ width, height, background: backgroundColor }}>
            {/* カードの中身（少し内側に描画して枠を作る） */}
            <div className="absolute inset-1 rounded-sm overflow-hidden bg-slate-800">
                {renderCardContent(card, isRevealed)}
            </div>

            {/* 角の丸み用オーバーレイ（スキャン画像っぽくするなら不要だが、デジタル実装として綺麗にする） */}
            <div className="absolute inset-0 rounded-md ring-1 ring-black/10 pointer-events-none" />
        </div>
    );
});

// function renderCardContent(card: Card, isRevealed: boolean, _w: number, _h: number) {
function renderCardContent(card: Card, isRevealed: boolean) {
    // 1. 道カード (Tunnel)
    if (card.type === 'PATH' || ('isStart' in card && card.isStart) || ('isGoal' in card && card.isGoal)) {
        return renderTunnel(card, isRevealed);
    }

    // 2. アクションカード (Action)
    if (card.type === 'ACTION') {
        return renderAction(card as ActionCard);
    }

    // 3. スペシャルカード (Special)
    if (card.type === 'SPECIAL') {
        return renderSpecial(card as SpecialCard);
    }

    return null;
}

// トンネル（道）の描画
function renderTunnel(card: Card, isRevealed: boolean) {
    // 背景：暗い岩壁 (Dark Rock)
    const rockColor = "#2d241e"; // 非常に暗い茶色
    const dirtColor = "#a1887f"; // 土色

    // ゴールカードの判定と隠蔽処理
    if ('isGoal' in card && (card as any).isGoal) {
        if (!isRevealed) {
            // 裏向きのゴールカード：共通の裏面デザイン
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 border-4 border-slate-600 rounded-sm">
                    {/* お邪魔ものロゴっぽいデザイン、または単純な？マーク */}
                    <div className="text-amber-500 font-serif text-3xl font-bold opacity-80">?</div>
                    <div className="text-slate-500 text-[10px] mt-1">GOAL</div>
                </div>
            );
        }
    }

    // 道の形状データ
    // 道がある方向へ太い線（面）を伸ばす
    let shape = { center: false, top: false, bottom: false, left: false, right: false };
    if ('shape' in card) {
        shape = (card as PathCard).shape;
    } else if ('isStart' in card && (card as any).isStart) {
        shape = { center: true, top: true, bottom: true, left: true, right: true }; // スタートは全方向（仮）
    } else if ('isGoal' in card && (card as any).isGoal) {
        shape = { center: true, top: true, bottom: true, left: true, right: true }; // ゴールも全方向（仮）
    }

    // SVGでトンネルを描画
    // 中央 (50, 70) を起点に、各方向へ太さ40px程度の道を伸ばす
    const pW = 36; // Path Width
    const cX = 50;
    const cY = 70;

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
            {/* 岩壁（背景）- 行き止まりは少し赤みを帯びた暗色に（真っ黒すぎないように調整） */}
            <rect width="100%" height="100%" fill={(shape as any).deadEnd ? "#2d1a1a" : rockColor} />

            {/* トンネル（土） - 行き止まりでも完全には消さない */}
            <g fill={dirtColor} opacity={(shape as any).deadEnd ? 0.6 : 1}>
                {shape.center && <rect x={cX - pW / 2} y={cY - pW / 2} width={pW} height={pW} />}
                {shape.top && <rect x={cX - pW / 2} y={0} width={pW} height={cY} />}
                {shape.bottom && <rect x={cX - pW / 2} y={cY} width={pW} height={140 - cY} />}
                {shape.left && <rect x={0} y={cY - pW / 2} width={cX} height={pW} />}
                {shape.right && <rect x={cX} y={cY - pW / 2} width={100 - cX} height={pW} />}
            </g>

            {/* deadEnd barricade - Simplified clean X, no emoji redundancy */}
            {(shape as any).deadEnd && (
                <g>
                    {/* Dark overlay for the tunnel area */}
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" />
                    {/* Clean industrial red X with dark border (centered around cX, cY) */}
                    <g transform={`translate(${cX - 35}, ${cY - 35})`}>
                        <line x1="10" y1="10" x2="60" y2="60" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" />
                        <line x1="60" y1="10" x2="10" y2="60" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" />
                        <line x1="10" y1="10" x2="60" y2="60" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                        <line x1="60" y1="10" x2="10" y2="60" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                    </g>
                    {/* Subtle danger dash border */}
                    <rect x="4" y="4" width="92" height="132" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
                </g>
            )}

            {/* スタート/ゴールのアイコン */}
            {'isStart' in card && (card as any).isStart && (
                <text x="50" y="80" textAnchor="middle" fontSize="40" fill="#fff">🪜</text>
            )}
            {'isGoal' in card && (card as any).isGoal && isRevealed && (
                (card as any).goalType === 'GOLD'
                    ? <text x="50" y="80" textAnchor="middle" fontSize="40">👑</text>
                    : <text x="50" y="80" textAnchor="middle" fontSize="40">🪨</text>
            )}

            {/* Crystal Indicator - Overlay on the path */}
            {'hasCrystal' in card && (card as any).hasCrystal && (
                <g transform="translate(70, 20)">
                    <text x="0" y="0" fontSize="30" filter="drop-shadow(0 0 5px rgba(255,255,255,0.8))">💎</text>
                </g>
            )}
        </svg>
    );
}

// アクションカードの描画
function renderAction(card: ActionCard) {
    const bgColor = "#fef3c7"; // クリーム色 (Parchment)

    // アイコン選択
    let Icon = ICONS.PICKAXE;
    let symbol = null;

    if (card.actionType === 'MAP') {
        Icon = ICONS.MAP;
    } else if (card.actionType === 'ROCKFALL') {
        Icon = ICONS.ROCKFALL;
    } else if (card.actionType.includes('BREAK')) {
        symbol = <BanSymbol />;
        if (card.actionType.includes('LANTERN')) Icon = ICONS.LANTERN;
        else if (card.actionType.includes('CART')) Icon = ICONS.CART;
        else Icon = ICONS.PICKAXE;
    } else if (card.actionType.includes('FIX')) {
        symbol = <FixSymbol />;
        if (card.actionType === 'FIX_ALL') {
            // 全修復カード: 3つのアイコンを縮小して表示
            return (
                <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: bgColor }}>
                    <div className="grid grid-cols-2 gap-1 p-2">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 overflow-visible">{ICONS.PICKAXE}</svg>
                        <svg viewBox="0 0 100 100" className="w-10 h-10 overflow-visible">{ICONS.LANTERN}</svg>
                        <svg viewBox="0 0 100 100" className="w-10 h-10 overflow-visible col-span-2 justify-self-center">{ICONS.CART}</svg>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150">
                        <FixSymbol />
                    </div>
                </div>
            );
        }
        // 修理対象によってアイコンを変える（複数対応は簡易的に1つ表示）
        if (card.actionType.includes('LANTERN')) Icon = ICONS.LANTERN;
        else if (card.actionType.includes('CART')) Icon = ICONS.CART;
        else Icon = ICONS.PICKAXE;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: bgColor }}>
            <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 overflow-visible">
                {Icon}
                {symbol && (
                    <g transform="translate(0, 0)">
                        {symbol}
                    </g>
                )}
            </svg>
            {/* カード名（デバッグ用、あるいは製品版でもあってもよい） */}
            {/* <div className="absolute bottom-1 text-[10px] font-bold text-slate-700 uppercase tracking-tighter">
                {card.actionType.replace('BREAK_', '').replace('REPAIR_', '')}
            </div> */}
        </div>
    );
}

// スペシャルカードの描画
function renderSpecial(card: SpecialCard) {
    // スペシャルカードは少し神秘的な色合いに (Light Sky Blue/Purple)
    const bgColor = "#e0e7ff"; // Indigo-50

    let icon = "❓";
    let label = "SPECIAL";

    switch (card.specialAction) {
        case 'DYNAMITE': icon = "💣"; label = "Dynamite"; break;
        case 'ORACLE': icon = "🔮"; label = "Oracle"; break;
        case 'THIEF': icon = "🕵️"; label = "Thief"; break;
        case 'TRADER': icon = "🔄"; label = "Trader"; break;
        case 'SCAVENGER': icon = "♻️"; label = "Scavenger"; break;
        case 'DOUBLE_ACTION': icon = "⚡"; label = "Double"; break;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: bgColor }}>
            {/* 大きなアイコン */}
            <div className="text-5xl filter drop-shadow-sm select-none" role="img" aria-label={label}>{icon}</div>

            {/* ラベル */}
            <div className="absolute bottom-3 text-[10px] font-bold text-indigo-900 uppercase tracking-tight opacity-80 border-t border-indigo-200 pt-1 w-3/4 text-center">
                {label}
            </div>

            {/* スペシャルマーク */}
            <div className="absolute top-1 right-1 text-indigo-400 opacity-50 text-[10px]">✨</div>
        </div>
    );
}
