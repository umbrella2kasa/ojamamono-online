// import React from 'react';

// 道具アイコンのパス定義
export const ICONS = {
    // つるはし (Pickaxe)
    PICKAXE: (
        <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="0">
            {/* 柄 */}
            <path d="M70,80 L35,45" stroke="#8d6e63" strokeWidth="8" />
            {/* 金属の頭 */}
            <path d="M20,30 Q35,45 50,20 L45,15 Q30,40 15,25 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            {/* 簡易版：T字型のつるはし */}
            <path d="M25,50 L45,30 M55,20 L25,50 L20,90" stroke="none" fill="none" />
            <path d="M20,20 C30,10 60,10 70,20 L65,25 C55,15 35,15 25,25 Z" fill="#64748b" /> {/* Head */}
            <rect x="42" y="20" width="8" height="60" transform="rotate(-45 46 50)" fill="#a16207" /> {/* Handle */}
        </g>
    ),
    // ランプ (Lantern)
    LANTERN: (
        <g>
            {/* 本体 */}
            <rect x="35" y="30" width="30" height="40" rx="4" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
            <path d="M35,30 L50,15 L65,30" fill="#78350f" />
            <rect x="40" y="35" width="20" height="30" fill="#fef3c7" opacity="0.8" /> {/* ガラス */}
            {/* ハンドル */}
            <path d="M50,15 C40,5 60,5 50,15" stroke="#475569" strokeWidth="3" fill="none" />
        </g>
    ),
    // トロッコ (Cart)
    CART: (
        <g>
            {/* 車輪 */}
            <circle cx="35" cy="75" r="8" fill="#475569" />
            <circle cx="65" cy="75" r="8" fill="#475569" />
            {/* 本体 */}
            <path d="M25,45 L75,45 L70,70 L30,70 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            {/* 中身（石） */}
            <circle cx="40" cy="40" r="5" fill="#64748b" />
            <circle cx="50" cy="35" r="6" fill="#64748b" />
            <circle cx="60" cy="40" r="5" fill="#64748b" />
        </g>
    ),
    // マップ (Map)
    MAP: (
        <g>
            <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="#feebc8" stroke="#d97706" strokeWidth="2" />
            <path d="M30,30 L70,70 M70,30 L30,70" stroke="#d97706" strokeWidth="2" strokeDasharray="4 4" />
        </g>
    ),
    // 落石 (Rockfall)
    ROCKFALL: (
        <g>
            <circle cx="30" cy="30" r="10" fill="#475569" />
            <circle cx="60" cy="40" r="15" fill="#64748b" />
            <circle cx="40" cy="70" r="12" fill="#475569" />
            {/* 動き線 */}
            <path d="M30,15 L30,5 M60,20 L60,10" stroke="#000" strokeWidth="2" />
        </g>
    )
};

// 禁止マーク (Red Circle with Diagonal)
export const BanSymbol = () => (
    <g opacity="0.9">
        <circle cx="50" cy="50" r="35" stroke="#ef4444" strokeWidth="8" fill="none" />
        <line x1="25" y1="25" x2="75" y2="75" stroke="#ef4444" strokeWidth="8" />
    </g>
);

// 修理マーク (Tools or Green Circle)
export const FixSymbol = () => (
    <g>
        <circle cx="50" cy="50" r="35" stroke="#22c55e" strokeWidth="6" strokeDasharray="5 5" fill="none" />
        {/* <path d="M30,50 L45,65 L70,35" stroke="#22c55e" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" /> */}
    </g>
);
