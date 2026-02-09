import { motion } from 'framer-motion';
import type { GameState } from '@ojamamono/shared';
import { VisualCard } from './VisualCard';


interface GameBoardProps {
    gameState: GameState;
    onCellClick: (index: number) => void;
    placeableCells: boolean[]; // 配置可能セルのハイライト用
    interactionMode: 'NORMAL' | 'SELECT_PLAYER' | 'SELECT_GOAL' | 'SELECT_ROCKFALL' | 'DISCARD';
    mapIndicators?: Array<{ x: number, y: number, id: string }>;
    connectedCells?: Set<number>;
    zoom?: number;
    isMobile?: boolean;
}

export function GameBoard({ gameState, onCellClick, placeableCells, interactionMode, mapIndicators = [], connectedCells = new Set(), zoom = 1, isMobile = false }: GameBoardProps) {
    // アイソメトリックグリッドのスタイル
    // Slay the Spireのマップのような斜め視点

    // カードサイズ定義 (モバイル優先で大きく)
    const BASE_WIDTH = isMobile ? 80 : 70;
    const BASE_HEIGHT = isMobile ? 120 : 105;
    const CARD_WIDTH = BASE_WIDTH * zoom;
    const CARD_HEIGHT = BASE_HEIGHT * zoom;

    return (
        <div className="relative w-full h-full min-h-[400px] overflow-auto bg-slate-300 flex items-center justify-center shadow-inner rounded-md border border-slate-400 custom-scrollbar">
            {/* グリッドコンテナ */}
            <div
                className="grid gap-1 p-8 m-auto transition-all duration-300 ease-out"
                style={{
                    gridTemplateColumns: `repeat(${gameState.gridWidth}, ${CARD_WIDTH}px)`,
                    gridAutoRows: `${CARD_HEIGHT}px`,
                    transform: 'rotateX(0deg)', // 完全な2Dへ
                    transformOrigin: 'center center',
                    gap: `${2 * zoom}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
            >
                {gameState.grid.map((cell, i) => {
                    const x = i % gameState.gridWidth;
                    const y = Math.floor(i / gameState.gridWidth);
                    const isPlaceable = placeableCells ? placeableCells[i] : false;

                    // ハイライトロジック
                    let highlightClass = "";
                    // let isInteractive = false; // カーソル表示用（コメントアウト）

                    if (interactionMode === 'SELECT_GOAL') {
                        const isGoalPos = x === 9 && (y === 2 || y === 4 || y === 6);
                        if (isGoalPos) {
                            highlightClass = "ring-4 ring-[#fbbf24] bg-[#fbbf24]/20 animate-pulse scale-105";
                            // isInteractive = true;
                        }
                    } else if (interactionMode === 'SELECT_ROCKFALL') {
                        if (cell && !cell.card.isStart && !cell.card.isGoal) {
                            highlightClass = "ring-4 ring-[#ef4444] bg-[#ef4444]/20 animate-pulse";
                            // isInteractive = true;
                        }
                    } else if (isPlaceable && !cell) {
                        highlightClass = "border-4 border-dashed border-emerald-400/70 bg-emerald-400/20 animate-pulse hover:bg-emerald-400/40 transition-all cursor-pointer ring-4 ring-emerald-300/30 shadow-[0_0_15px_rgba(52,211,153,0.5)]";
                        // isInteractive = true;
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => onCellClick(i)}
                            className={`
                                relative w-full h-full 
                                transition-all duration-300
                                ${cell ? 'z-20' : 'z-0'}
                                hover:brightness-110 cursor-pointer
                                ${highlightClass}
                            `}
                        >
                            {/* グリッドの床（空のセル用） */}
                            {!cell && (
                                <div className="absolute inset-0 border border-slate-400/60 bg-slate-200/30 rounded-md" />
                            )}

                            {/* カードがある場合 */}
                            {cell && (
                                <motion.div
                                    initial={{ opacity: 0, z: 50, scale: 0.5 }}
                                    animate={{
                                        opacity: 1,
                                        z: 0,
                                        scale: 1,
                                        rotate: cell.isReversed ? 180 : 0,
                                        y: cell.isReversed ? 0 : -2 // 少し浮かせる
                                    }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-full h-full cursor-pointer transition-transform origin-center"
                                    onClick={() => onCellClick(i)}
                                    style={{
                                        // カードのデザイン
                                    }}
                                >
                                    <div className="relative w-full h-full rounded-md overflow-hidden shadow-sm">
                                        <VisualCard
                                            card={cell.card}
                                            width={CARD_WIDTH}
                                            height={CARD_HEIGHT}
                                            isRevealed={cell.card.isRevealed ?? ('isGoal' in cell.card ? false : true)} // isGoalのデフォルト処理
                                            className="w-full h-full"
                                        />

                                        {/* 接続切れの道を暗くする (Start/Goal以外かつ、接続Setに入っていない場合) - 白背景向けに調整 */}
                                        {connectedCells.size > 0 && cell.card.type === 'PATH' &&
                                            !('isStart' in cell.card) &&
                                            !('isGoal' in cell.card) &&
                                            !connectedCells.has(i) && (
                                                <div className="absolute inset-0 bg-slate-600/60 z-10 pointer-events-none transition-colors duration-500 backdrop-grayscale" />
                                            )}

                                        {/* 落石ターゲットのハイライト */}
                                        {placeableCells[i] && interactionMode === 'SELECT_ROCKFALL' && (
                                            <div className="absolute inset-0 border-4 border-red-500 rounded-md animate-pulse bg-red-500/20 z-20 pointer-events-none" />
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* 配置エフェクト */}


                            {/* マップ調査済みインジケーター（虫眼鏡） */}
                            {mapIndicators.some(ind => ind.x === x && ind.y === y) && (
                                <div className="absolute -top-3 -right-3 z-50 animate-bounce drop-shadow-md">
                                    <div className="text-2xl filter drop-shadow-sm">🔍</div>
                                </div>
                            )}

                            {/* 宝箱 (Treasure Chest) */}
                            {gameState.treasureLocs?.some(t => t.x === x && t.y === y) && !cell && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-pulse">
                                    <div className="text-4xl filter drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px gold)' }}>🎁</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>


        </div>
    );
}
// End of GameBoard component


