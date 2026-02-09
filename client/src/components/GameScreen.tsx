import React, { useState, useRef } from 'react';
import { GameState, Role, ChatMessage } from '@ojamamono/shared';
import { CardView, RoleCardView } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionModal } from './ActionModal';
import { RoleAssignmentAnimation } from './RoleAssignmentAnimation';
import { toast } from 'react-hot-toast';
import { GameBoard } from './GameBoard';
// import { SVGFilters } from './effects/SVGFilters'; // Removed for performance
import { soundManager } from '../utils/SoundManager';
import { PlayerListSidebar } from './game/PlayerListSidebar';
import { GridValidator } from '../utils/GridValidator';
import { hapticManager } from '../utils/HapticManager';
import { usePinchZoom } from '../hooks/usePinchZoom';
import { QuickChatWheel } from './game/QuickChatWheel';
import { CardPreviewOverlay } from './CardPreviewOverlay';
import { Card as CardType } from '@ojamamono/shared';
import { StoneActionModal } from './game/StoneActionModal';

interface GameScreenProps {
    gameState: GameState;
    myUserId: string;
    myRole: Role | null;
    showRole: boolean;
    onToggleRole: () => void;

    // Actions - generalized to minimize props
    onPlayCard: (index: number, options?: { x: number, y: number, isReversed: boolean }, targetId?: string) => void;
    onDiscardCard: (index: number) => void;
    onSendEmote: (emote: string) => void; // For Emote Button
    onSendChat: (message: string) => void;
    onVoteSuspicion: (targetId: string) => void;

    // Data managed by App
    chatMessages: ChatMessage[];
    activeEmotes: { [key: string]: string };

    // Turn Notification State
    showTurnChange: boolean;
    turnChangePlayer: string;
    isMyTurnNotification: boolean;
    mapPeekState: { x: number, y: number, result: 'GOLD' | 'STONE' } | null;
    mapIndicators: Array<{ x: number, y: number, id: string }>;
    onRoleConfirmed?: () => void;
    onStoneAction: (targetId: string, actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART') => void;
    onSkipStoneAction: () => void;

    // App Control Props
    isBgmEnabled: boolean;
    onToggleBgm: () => void;
    onQuit: () => void;
}


const EMOTIONS_LIST = [
    { emote: '👍', label: 'Good' },
    { emote: '👎', label: 'Bad' },
    { emote: '😂', label: 'Laugh' },
    { emote: '🤔', label: 'Think' },
    { emote: '⛏️', label: 'Mine' },
    { emote: '🔦', label: 'Light' },
    { emote: '🛒', label: 'Cart' },
    { emote: '💎', label: 'Gold' },
    { emote: '💣', label: 'Boom' },
    { emote: '💩', label: 'Oops' }
];

export const GameScreen: React.FC<GameScreenProps> = ({
    gameState,
    myUserId,
    myRole,
    showRole,
    onToggleRole,
    onPlayCard,
    onDiscardCard,
    onSendEmote,
    onSendChat,
    onVoteSuspicion,
    chatMessages,
    activeEmotes,
    showTurnChange,
    turnChangePlayer,
    isMyTurnNotification,
    mapPeekState,
    mapIndicators,
    onRoleConfirmed,
    onStoneAction,
    onSkipStoneAction,
    isBgmEnabled,
    onToggleBgm,
    onQuit
}) => {
    // Local UI State
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [selectedCardReversed, setSelectedCardReversed] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'NORMAL' | 'SELECT_PLAYER' | 'SELECT_GOAL' | 'SELECT_ROCKFALL' | 'DISCARD'>('NORMAL');
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [showEmotePicker, setShowEmotePicker] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [showRoleAnimation, setShowRoleAnimation] = useState(false);
    const [showHand, setShowHand] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // New UX State
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [quickChatPos, setQuickChatPos] = useState<{ x: number, y: number } | null>(null);
    const [previewCard, setPreviewCard] = useState<CardType | null>(null);
    const longPressTimer = useRef<any>(null);
    const gameBoardRef = useRef<HTMLDivElement>(null);

    // Pinch Zoom
    usePinchZoom(gameBoardRef, zoomLevel, (newZoom) => {
        setZoomLevel(newZoom);
    }, { minZoom: 0.25, maxZoom: 2.0 });


    const handleQuickChatOpen = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        // Prevent opening if clicking on a button or card
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.trigger-card-hover')) {
            return;
        }

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        setQuickChatPos({ x: clientX, y: clientY });
        hapticManager.light();
    };

    // Placeholder handlers for mouse drag (if needed for panning when zoomed in)
    const handleMouseDown = () => { };
    const handleMouseMove = () => { };
    const handleMouseUp = () => { };

    // Initial mobile zoom & resize listener
    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);

        // モバイルデバイスの初期ズーム設定
        if (window.innerWidth < 768) {
            setZoomLevel(0.8); // 少し引いた状態で開始
        }


        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const [reviewingGoal, setReviewingGoal] = useState<{ x: number, y: number, result: 'GOLD' | 'STONE' } | null>(null);

    // Update knownGoals when mapPeekState is received or from local storage/props?
    // Since mapPeekState comes from server event 'mapResult', we should trust it.



    // Refs
    const roleAnimationPlayedRound = useRef<number>(-1);

    // Trigger Role Animation when round changes or role is first assigned
    React.useEffect(() => {
        if (myRole && roleAnimationPlayedRound.current !== gameState.currentRound) {
            console.log('Triggering Role Animation for round:', gameState.currentRound);
            setShowRoleAnimation(true);
            soundManager.playRoleReveal(myRole === 'GOLD_DIGGER');
            roleAnimationPlayedRound.current = gameState.currentRound;
        }
    }, [gameState.currentRound, myRole]); // Dependencies are correct, but Strict Mode may double-fire in dev.

    React.useEffect(() => {
        if (chatMessages.length > 0) {
            const lastMsg = chatMessages[chatMessages.length - 1];
            if (lastMsg.system) {
                toast(lastMsg.text, {
                    id: lastMsg.id,
                    icon: '📢',
                    duration: 4000,
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            }
            if (!showChat) {
                setUnreadMessages(prev => prev + 1);
            }
        }
    }, [chatMessages, showChat]);

    React.useEffect(() => {
        if (showChat) {
            setUnreadMessages(0);
        }
    }, [showChat]);

    const resetSelection = () => {
        setSelectedCardIndex(null);
        setSelectedCardReversed(false);
        setInteractionMode('NORMAL');
        setShowPlayerModal(false);
        hapticManager.light(); // Haptic feedback
    };

    const handleSelectCard = (index: number) => {
        // 長押し中は選択をキャンセル（意図しないクリック防止）
        if (previewCard) return;

        if (interactionMode === 'DISCARD') {
            // ... (既存ロジック)
            if (confirm("このカードを捨ててパスしますか？")) {
                onDiscardCard(index);
                resetSelection();
            }
            return;
        }

        const hand = gameState.players.find(p => p.id === myUserId)?.hand;
        if (!hand) return;
        const card = hand[index];

        if (selectedCardIndex === index) {
            resetSelection();
        } else {
            setSelectedCardIndex(index);
            setSelectedCardReversed(false);
            soundManager.playClick();
            hapticManager.light(); // Haptic feedback

            // アクションカードとマップカードは、ボタンを押すまで何もしない
            if (card.type === 'ACTION') {
                setInteractionMode('NORMAL');
                toast('緑ボタンで使用、赤ボタンで捨てる', { icon: '💡' });
            } else if (card.type === 'SPECIAL') {
                // @ts-ignore
                const action = card.specialAction;
                if (['ORACLE', 'THIEF', 'TRADER'].includes(action)) {
                    setInteractionMode('SELECT_PLAYER');
                    setShowPlayerModal(true);
                    toast('対象プレイヤーを選択してください', { id: `select-player-special`, icon: '👤' });
                } else if (action === 'DYNAMITE') {
                    setInteractionMode('SELECT_ROCKFALL');
                    toast('爆破する中心地点を選択してください (3x3)', { id: `select-dynamite`, icon: '🧨' });
                } else {
                    // SCAVENGER, DOUBLE_ACTION: Button on card handles it
                    setInteractionMode('NORMAL');
                    toast('カード上のボタンを押して使用してください', { icon: '⚡' });
                }
            } else {
                setInteractionMode('NORMAL');
            }
        }
    };



    const handleSendChatCurrent = () => {
        if (chatInput.trim()) {
            onSendChat(chatInput);
            setChatInput('');
        }
    };

    // --- Long Press Logic ---
    const handleCardPointerDown = (card: CardType) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            setPreviewCard(card);
            hapticManager.success();
            soundManager.playClick();
        }, 500); // 500ms long press
    };

    const handleCardPointerUp = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        setPreviewCard(null); // Stop pressing to return (close preview)
    };

    const myPlayer = gameState.players.find(p => p.id === myUserId);

    const onPlayActionCard = (index: number, targetId?: string, targetCellIndex?: number) => {
        if (targetCellIndex !== undefined) {
            const width = gameState.gridWidth;
            const x = targetCellIndex % width;
            const y = Math.floor(targetCellIndex / width);
            onPlayCard(index, { x, y, isReversed: false });
        } else {
            onPlayCard(index, undefined, targetId);
        }
    };



    const handlePlaceCard = (cellIndex: number) => {
        if (selectedCardIndex === null) return;
        const card = myPlayer?.hand[selectedCardIndex];
        if (!card) return;

        if (card.type === 'PATH') {
            const x = cellIndex % gameState.gridWidth;
            const y = Math.floor(cellIndex / gameState.gridWidth);
            const isValid = GridValidator.isValidPlacement(
                gameState.grid,
                gameState.gridWidth,
                gameState.gridHeight,
                x,
                y,
                card,
                selectedCardReversed,
                connectedCells
            );

            if (isValid) {
                onPlayCard(selectedCardIndex, {
                    x: cellIndex % gameState.gridWidth,
                    y: Math.floor(cellIndex / gameState.gridWidth),
                    isReversed: selectedCardReversed
                });
                setSelectedCardIndex(null);
                setSelectedCardReversed(false);
                setInteractionMode('NORMAL');
                soundManager.playCardPlace();
                hapticManager.success(); // Haptic feedback
            } else {
                toast.error('そこには置けません！');
                soundManager.playError();
                hapticManager.error(); // Haptic error
            }
        } else if (card.type === 'ACTION' || card.type === 'SPECIAL') {
            if (interactionMode === 'SELECT_ROCKFALL') {
                // Handles both ROCKFALL action and DYNAMITE special
                const width = gameState.gridWidth;
                const x = cellIndex % width;
                const y = Math.floor(cellIndex / width);

                // For Dynamite/Rockfall send pos
                onPlayCard(selectedCardIndex, { x, y, isReversed: false });

                setSelectedCardIndex(null);
                setInteractionMode('NORMAL');
                toast.dismiss('select-rockfall-hint');
                toast.dismiss('select-dynamite');
                soundManager.playBreak();
                hapticManager.success();
            } else if (interactionMode === 'SELECT_GOAL') {
                handlePlayActionCardOnGoal(cellIndex);
            }
        }
    };

    const handlePlayActionCardOnPlayer = (targetPlayerId: string) => {
        if (selectedCardIndex === null) return;
        const card = myPlayer?.hand[selectedCardIndex];
        if (card && (card.type === 'ACTION' || card.type === 'SPECIAL') && interactionMode === 'SELECT_PLAYER') {
            onPlayActionCard(selectedCardIndex, targetPlayerId);
            setSelectedCardIndex(null);
            setInteractionMode('NORMAL');
            toast.dismiss('select-player-hint');
            hapticManager.success(); // Haptic feedback
        }
    };

    const handlePlayActionCardOnGoal = (targetCellIndex: number) => {
        if (selectedCardIndex === null) return;
        const card = myPlayer?.hand[selectedCardIndex];
        if (card && card.type === 'ACTION' && interactionMode === 'SELECT_GOAL') {
            onPlayActionCard(selectedCardIndex, undefined, targetCellIndex);
            setSelectedCardIndex(null);
            setInteractionMode('NORMAL');
            toast.dismiss('select-goal-hint');
            hapticManager.success(); // Haptic feedback
        }
    };

    const connectedCells = React.useMemo(() => {
        const connected = new Set<number>();
        if (gameState.grid) {
            const startIdx = gameState.grid.findIndex(c => c?.card.isStart);
            if (startIdx !== -1) {
                const queue = [startIdx];
                connected.add(startIdx);
                while (queue.length > 0) {
                    const currIdx = queue.shift()!;
                    const cell = gameState.grid[currIdx]!;
                    const getOpenings = (card: any) => {
                        if (card.isStart) return { top: true, bottom: true, left: true, right: true };
                        if (card.type === 'PATH') return card.shape;
                        return { top: false, bottom: false, left: false, right: false };
                    };
                    let openings = getOpenings(cell.card);
                    if (cell.isReversed) {
                        openings = { top: openings.bottom, bottom: openings.top, left: openings.right, right: openings.left };
                    }
                    const cx = currIdx % gameState.gridWidth;
                    const cy = Math.floor(currIdx / gameState.gridWidth);
                    const neighbors = [
                        { idx: currIdx - gameState.gridWidth, x: cx, y: cy - 1, dir: 'top', opp: 'bottom' },
                        { idx: currIdx + gameState.gridWidth, x: cx, y: cy + 1, dir: 'bottom', opp: 'top' },
                        { idx: currIdx - 1, x: cx - 1, y: cy, dir: 'left', opp: 'right' },
                        { idx: currIdx + 1, x: cx + 1, y: cy, dir: 'right', opp: 'left' }
                    ] as const;
                    for (const n of neighbors) {
                        if (n.x < 0 || n.x >= gameState.gridWidth || n.y < 0 || n.y >= gameState.gridHeight) continue;
                        if (!openings[n.dir as keyof typeof openings]) continue;
                        const nCell = gameState.grid[n.idx];
                        if (nCell && !connected.has(n.idx)) {
                            let nOpenings = getOpenings(nCell.card);
                            if (nCell.isReversed) {
                                nOpenings = { top: nOpenings.bottom, bottom: nOpenings.top, left: nOpenings.right, right: nOpenings.left };
                            }
                            if (nOpenings[n.opp as keyof typeof nOpenings]) {
                                connected.add(n.idx);
                                queue.push(n.idx);
                            }
                        }
                    }
                }
            }
        }
        return connected;
    }, [gameState.grid, gameState.gridWidth, gameState.gridHeight]);

    const placeableCells = React.useMemo(() => {
        if (!gameState.grid) return [];
        return gameState.grid.map((cell, index) => {
            if (selectedCardIndex === null || interactionMode !== 'NORMAL') return false;
            const hand = gameState.players.find(p => p.id === myUserId)?.hand;
            if (!hand || !hand[selectedCardIndex] || hand[selectedCardIndex].type !== 'PATH') return false;

            // すでにカードがある場所には置けない
            if (cell) return false; // Already occupied

            const x = index % gameState.gridWidth;
            const y = Math.floor(index / gameState.gridWidth);

            // If a PATH card is selected, use strict validation
            if (selectedCardIndex !== null) {
                const card = gameState.players.find(p => p.id === myUserId)?.hand[selectedCardIndex];
                if (card && card.type === 'PATH') {
                    return GridValidator.isValidPlacement(
                        gameState.grid,
                        gameState.gridWidth,
                        gameState.gridHeight,
                        x,
                        y,
                        card,
                        selectedCardReversed,
                        connectedCells
                    );
                }
            }
            return false;
        });
    }, [gameState.grid, gameState.gridWidth, gameState.gridHeight, selectedCardIndex, interactionMode, myUserId, gameState.players, selectedCardReversed, connectedCells]);

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans select-none relative">
            {/* <SVGFilters /> Removed for performance */}
            {/* Mobile Sidebar Toggle Button */}
            <button
                onClick={() => { soundManager.playClick(); setShowSidebar(!showSidebar); }}
                className="md:hidden absolute top-4 left-4 z-50 bg-slate-800/90 text-white rounded-lg border border-slate-600 shadow-lg touch-feedback min-w-[44px] min-h-[44px] p-3 flex items-center justify-center text-xl"
            >
                {showSidebar ? '✕' : '👥'}
            </button>
            {showRoleAnimation && myRole && (
                <RoleAssignmentAnimation
                    role={myRole}
                    onComplete={() => {
                        setShowRoleAnimation(false);
                        onRoleConfirmed?.();
                    }}
                />
            )}
            {showPlayerModal && (
                <ActionModal
                    players={gameState.players}
                    onSelect={handlePlayActionCardOnPlayer}
                    onCancel={resetSelection}
                    title="対象プレイヤーを選択"
                />
            )}

            {gameState.status === 'WAITING_FOR_STONE_ACTION' && (
                <StoneActionModal
                    players={gameState.players}
                    myUserId={myUserId}
                    onSelect={(targetId, type, tool) => {
                        onStoneAction(targetId, type, tool);
                    }}
                    onSkip={() => onSkipStoneAction()}
                />
            )}

            <AnimatePresence>
                {showTurnChange && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={`fixed inset-x-0 z-40 flex justify-center pointer-events-none ${isMyTurnNotification ? 'top-32' : 'top-20'}`}
                    >
                        {isMyTurnNotification ? (
                            <div className="bg-gradient-to-br from-amber-500/90 to-yellow-600/90 text-white font-bold px-8 py-4 rounded-xl shadow-2xl border-2 border-yellow-200/50 backdrop-blur-md flex flex-col items-center gap-1 min-w-[300px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl animate-bounce">👇</span>
                                    <span className="text-2xl drop-shadow-md">Your Turn!</span>
                                </div>
                                <span className="text-xs text-yellow-100 uppercase tracking-[0.3em]">あなたの作業時間です</span>
                            </div>
                        ) : (
                            <div className="bg-[#1a1614]/90 text-yellow-500 font-bold px-6 py-3 rounded-full shadow-xl border border-yellow-800/30 backdrop-blur-sm flex items-center gap-3">
                                <span className="text-lg">⛏️</span>
                                <span className="text-sm tracking-widest uppercase">{turnChangePlayer}'s Turn</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex overflow-hidden relative w-full h-full">
                <AnimatePresence mode='wait'>
                    {(showSidebar || window.innerWidth >= 768) && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className={`
                                fixed inset-y-0 left-0 z-40 w-64 bg-slate-800/95 backdrop-blur-md border-r border-slate-700 flex flex-col shadow-2xl
                                md:relative md:translate-x-0 md:opacity-100 md:shadow-none md:z-auto
                                ${!showSidebar ? 'hidden md:flex' : 'flex'}
                            `}
                        >
                            <div
                                className="md:hidden absolute inset-0 -z-10 bg-black/50 backdrop-blur-sm -right-[100vw]"
                                onClick={() => setShowSidebar(false)}
                            />

                            <div className="p-4 border-b border-slate-700 bg-slate-700/50 pt-16 md:pt-4">
                                <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <span>👥</span> Players <span className="bg-slate-600 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">{gameState.players.length}</span>
                                </h2>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <PlayerListSidebar
                                    players={gameState.players}
                                    currentPlayerIndex={gameState.currentPlayerIndex}
                                    scores={gameState.scores || {}}
                                    suspicions={gameState.suspicions}
                                    myUserId={myUserId}
                                    onVoteSuspicion={onVoteSuspicion}
                                    activeEmotes={activeEmotes}
                                />
                            </div>

                            <div className="p-4 border-t border-slate-700 bg-slate-700/50 space-y-2">
                                <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Round</span>
                                    <span className="font-cinzel font-bold text-lg">{gameState.currentRound}/{gameState.maxRounds}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Deck</span>
                                    <span className="font-cinzel font-bold text-lg">{gameState.deckCount}</span>
                                </div>

                                {/* System Controls */}
                                <div className="flex gap-2 pt-2 mt-2 border-t border-slate-600/50">
                                    <button
                                        onClick={onToggleBgm}
                                        className={`flex-1 p-2 rounded transition-all border text-xs font-bold flex items-center justify-center gap-2 ${isBgmEnabled ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                    >
                                        <span>{isBgmEnabled ? '🔊' : '🔇'}</span>
                                        <span>BGM</span>
                                    </button>
                                    <button
                                        onClick={onQuit}
                                        className="flex-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs p-2 rounded border border-red-900/50 transition font-bold"
                                    >
                                        退出
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Chat Overlay */}
                {quickChatPos && (
                    <div className="fixed inset-0 z-[100] pointer-events-auto">
                        <QuickChatWheel
                            onSelect={(msg) => {
                                onSendChat(msg);
                                setQuickChatPos(null);
                                hapticManager.success();
                            }}
                            onClose={() => setQuickChatPos(null)}
                            position={quickChatPos}
                        />
                    </div>
                )}

                {/* Game Area (Pinch Zoom Target) */}
                <div
                    ref={gameBoardRef}
                    className="relative flex-1 w-full h-full overflow-hidden cursor-move touch-pan-x touch-pan-y" // allow pan, disable native pinch
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Top Left: Role Reveal Button */}
                    <div className="absolute top-4 left-16 md:left-4 z-40 flex gap-2 pointer-events-auto">
                        <button
                            onClick={() => {
                                soundManager.playClick();
                                onToggleRole();
                            }}
                            className="bg-slate-700/80 hover:bg-slate-600/80 text-yellow-500 font-bold py-2 px-4 rounded-full shadow-md border border-slate-600 flex items-center gap-2 active:scale-95 transition-all backdrop-blur-sm touch-feedback min-w-[44px] min-h-[44px]"
                        >
                            <span className="text-2xl">{showRole ? '🙈' : '👀'}</span>
                            <span className="font-cinzel text-xs tracking-wider hidden sm:inline">{showRole ? 'HIDE' : 'ROLE'}</span>
                        </button>
                        <AnimatePresence>
                            {showRole && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: -20, rotateY: -90 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -20, rotateY: 90 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="absolute top-12 left-0 z-50 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                                >
                                    {myRole && <RoleCardView role={myRole} reveal={true} />}
                                    <div className="mt-2 text-center text-[10px] text-yellow-500/60 font-bold tracking-widest uppercase">Secret Document</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Top Right: Chat & Emote */}
                    <div className="absolute top-4 right-4 z-40 flex gap-2 pointer-events-auto">
                        {/* Chat Bubble (Bottom Right or Top Right) */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            onContextMenu={handleQuickChatOpen} // Long press (PC right click)
                            onTouchStart={(e) => {
                                // Simple long press detection
                                const timer = setTimeout(() => handleQuickChatOpen(e), 500);
                                e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                            }}
                            className="relative z-50 bg-slate-800/90 backdrop-blur-sm rounded-full border border-slate-600 shadow-xl hover:bg-slate-700 transition-colors active:scale-95 touch-manipulation touch-feedback min-w-[48px] min-h-[48px] p-3 text-2xl flex items-center justify-center"
                        >
                            💬
                            {unreadMessages > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { soundManager.playClick(); setShowEmotePicker(!showEmotePicker); }}
                            className="bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-full shadow-md border border-slate-600 flex items-center justify-center active:scale-95 transition-all backdrop-blur-sm touch-feedback min-w-[48px] min-h-[48px] w-12 h-12 text-2xl"
                        >
                            😀
                        </button>
                    </div>

                    {/* Chat Overlay */}
                    <AnimatePresence>
                        {showChat && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute top-16 right-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-80 max-h-[50vh] flex flex-col z-50 overflow-hidden"
                            >
                                <div className="p-3 bg-slate-700 border-b border-slate-600 flex justify-between items-center">
                                    <span className="font-bold text-white text-sm">Chat</span>
                                    <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-200">✕</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`text-xs ${msg.system ? 'text-center text-slate-400 italic py-1 border-y border-slate-700' : ''}`}>
                                            {msg.system ? (
                                                msg.text
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-[10px] uppercase opacity-70" style={{ color: gameState.players.find(p => p.id === msg.senderId)?.color || '#facc15' }}>{msg.senderName}</span>
                                                    <span className="bg-slate-700 p-2 rounded-lg rounded-tl-none text-white">{msg.text}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-slate-600 bg-slate-700">
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendChatCurrent();
                                    }} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white"
                                            placeholder="..."
                                        />
                                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-500">Send</button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Emote Picker Overlay */}
                    <AnimatePresence>
                        {showEmotePicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-16 right-4 grid grid-cols-5 gap-2 bg-slate-800/90 backdrop-blur p-4 rounded-xl shadow-2xl border border-slate-600 z-50"
                            >
                                {EMOTIONS_LIST.map(({ emote, label }) => (
                                    <button
                                        key={emote}
                                        onClick={() => {
                                            onSendEmote(emote);
                                            soundManager.playClick();
                                            setShowEmotePicker(false);
                                        }}
                                        className="text-2xl hover:scale-125 transition-transform p-2 bg-slate-700 rounded-lg hover:bg-blue-900"
                                        title={label}
                                    >
                                        {emote}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <GameBoard
                        gameState={gameState}
                        onCellClick={handlePlaceCard}
                        placeableCells={placeableCells || []}
                        interactionMode={interactionMode}
                        mapIndicators={mapIndicators}
                        connectedCells={connectedCells}
                        zoom={zoomLevel}
                        isMobile={isMobile}
                    />


                    {/* Hand Cards (Bottom) */}
                    <motion.div
                        animate={{ y: showHand ? 0 : (isMobile ? 120 : 110) }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed left-0 right-0 z-30 pointer-events-auto flex items-end justify-center ${isMobile ? 'bottom-0' : 'bottom-4 md:bottom-8'}`}
                        style={{
                            paddingBottom: isMobile ? 'max(0.5rem, env(safe-area-inset-bottom))' : undefined
                        }}
                    >
                        <div className={`relative ${isMobile ? 'w-full px-2' : 'w-full max-w-3xl px-1'}`}>
                            {/* Toggle Button (Inside Slide Area) */}
                            <button
                                onClick={() => { soundManager.playClick(); setShowHand(!showHand); hapticManager.light(); }}
                                className={`absolute left-1/2 -translate-x-1/2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-t-xl shadow-[0_-4px_10px_rgba(0,0,0,0.3)] border-t border-x border-slate-600 tracking-widest uppercase z-40 flex items-center gap-2 transition-all cursor-pointer active:scale-95 touch-feedback ${isMobile ? '-top-12 text-xs px-4 py-2.5 h-12 min-w-[140px]' : '-top-10 text-sm px-6 py-2 h-10'}`}
                            >
                                <span>{showHand ? '▼ CLOSE' : '▲ CARDS'}</span>
                            </button>

                            {/* Main Hand Container */}
                            <div className={`bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-600 shadow-2xl flex flex-col gap-2 relative hover:bg-slate-800/95 transition-colors duration-300 touch-manipulation ${isMobile ? 'px-2 pb-2 pt-2' : 'px-2 pb-3 pt-3'}`}>
                                {/* スペシャルカードエリア */}
                                {showHand && gameState.players.find(p => p.id === myUserId)?.hand.some(card => card.type === 'SPECIAL') && (
                                    <div className="relative">
                                        <div className="absolute -top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1">
                                            <span>✨</span>
                                            <span>SPECIAL</span>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-1.5 pb-4 border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] overflow-x-auto custom-scrollbar smooth-scroll flex gap-1 items-end justify-start md:justify-center" style={{ minHeight: isMobile ? '90px' : '80px' }}>
                                            {/* 所持上限1枚を示すスロットベース */}
                                            {gameState.players.find(p => p.id === myUserId)?.hand.filter(c => c.type === 'SPECIAL').length === 0 && (
                                                <div className="w-12 h-16 flex-shrink-0 border-2 border-dashed border-purple-500/30 rounded-lg flex flex-col items-center justify-center bg-purple-500/5 relative">
                                                    <span className="text-xl opacity-20">🔲</span>
                                                    <span className="text-[8px] font-bold text-purple-400/40 absolute bottom-1">MAX 1</span>
                                                </div>
                                            )}
                                            {gameState.players.find(p => p.id === myUserId)?.hand
                                                .map((card, index) => ({ card, index }))
                                                .filter(({ card }) => card.type === 'SPECIAL')
                                                .map(({ card, index }) => (
                                                    <motion.div
                                                        layout
                                                        key={card.id}
                                                        initial={{ y: 50, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`relative flex-shrink-0 mx-0.5 transition-all duration-300 touch-manipulation ${selectedCardIndex === index ? 'z-30 -translate-y-4 scale-110' : 'hover:-translate-y-2'}`}
                                                        style={{ zIndex: selectedCardIndex === index ? 30 : index }}
                                                        onClick={() => handleSelectCard(index)}
                                                        onPointerDown={() => handleCardPointerDown(card)}
                                                        onPointerUp={handleCardPointerUp}
                                                        onPointerLeave={handleCardPointerUp}
                                                        onPointerCancel={handleCardPointerUp}
                                                    >
                                                        <div className={`
                                                            trigger-card-hover relative
                                                            ${selectedCardIndex === index ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.7)]' : 'shadow-lg hover:shadow-xl'}
                                                            rounded-lg overflow-visible
                                                        `}>
                                                            <div className={`transition-transform duration-300 rounded-lg overflow-hidden ${selectedCardIndex === index && selectedCardReversed ? 'rotate-180' : ''}`}>
                                                                <CardView
                                                                    card={card}
                                                                    className={isMobile ? "w-12 h-16" : "w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-32"}
                                                                />
                                                            </div>
                                                            {selectedCardIndex === index && (
                                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                                                                    <motion.button
                                                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                        className="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 border-2 border-white"
                                                                        onClick={(e) => { e.stopPropagation(); onDiscardCard(index); resetSelection(); }}
                                                                        title="捨てる"
                                                                    >
                                                                        🗑️
                                                                    </motion.button>
                                                                    {['SCAVENGER', 'DOUBLE_ACTION'].includes((card as any).specialAction) && (
                                                                        <motion.button
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="bg-purple-600 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-500 border-2 border-white animate-pulse"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm('このカードを使用しますか？')) {
                                                                                    onPlayCard(index);
                                                                                    resetSelection();
                                                                                }
                                                                            }}
                                                                            title="使用する"
                                                                        >
                                                                            ⚡
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* 通常カードエリア */}
                                <div className="flex items-end gap-1 pb-14 overflow-x-auto custom-scrollbar smooth-scroll justify-start md:justify-center" style={{ minHeight: isMobile ? '100px' : '80px' }}>

                                    {gameState.players.find(p => p.id === myUserId)?.hand
                                        .filter(card => card.type !== 'SPECIAL')
                                        .map((card, filteredIndex) => {
                                            // 元のインデックスを取得
                                            const originalIndex = gameState.players.find(p => p.id === myUserId)!.hand.findIndex(c => c.id === card.id);
                                            return (
                                                <motion.div
                                                    layout
                                                    key={card.id}
                                                    initial={{ y: 50, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: filteredIndex * 0.05 }}
                                                    className={`relative flex-shrink-0 mx-0.5 transition-all duration-300 touch-manipulation ${selectedCardIndex === originalIndex ? 'z-30 -translate-y-4 scale-110' : 'hover:-translate-y-2'}`}
                                                    style={{ zIndex: selectedCardIndex === originalIndex ? 30 : filteredIndex }}
                                                    onClick={() => handleSelectCard(originalIndex)}
                                                    onPointerDown={() => handleCardPointerDown(card)}
                                                    onPointerUp={handleCardPointerUp}
                                                    onPointerLeave={handleCardPointerUp}
                                                    onPointerCancel={handleCardPointerUp}
                                                >
                                                    <div className={`
                                                        trigger-card-hover relative
                                                        ${selectedCardIndex === originalIndex ? 'ring-4 ring-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]' : 'shadow-lg hover:shadow-xl'}
                                                        rounded-lg overflow-visible
                                                    `}>
                                                        <div className={`transition-transform duration-300 rounded-lg overflow-hidden ${selectedCardIndex === originalIndex && selectedCardReversed ? 'rotate-180' : ''}`}>
                                                            <CardView
                                                                card={card}
                                                                className={isMobile ? "w-12 h-16" : "w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28"}
                                                            />
                                                        </div>
                                                        {selectedCardIndex === originalIndex && (
                                                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                                                                {/* 道カード: 捨てる + 回転 */}
                                                                {card.type === 'PATH' && (
                                                                    <>
                                                                        <motion.button
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 border-2 border-white"
                                                                            onClick={(e) => { e.stopPropagation(); onDiscardCard(originalIndex); resetSelection(); }}
                                                                            title="捨てる"
                                                                        >
                                                                            🗑️
                                                                        </motion.button>
                                                                        <motion.button
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500 border-2 border-white"
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedCardReversed(!selectedCardReversed); }}
                                                                            title="回転"
                                                                        >
                                                                            ↻
                                                                        </motion.button>
                                                                    </>
                                                                )}
                                                                {/* アクションカード: 捨てる + 使用する */}
                                                                {card.type === 'ACTION' && (
                                                                    <>
                                                                        <motion.button
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 border-2 border-white"
                                                                            onClick={(e) => { e.stopPropagation(); onDiscardCard(originalIndex); resetSelection(); }}
                                                                            title="捨てる"
                                                                        >
                                                                            🗑️
                                                                        </motion.button>
                                                                        <motion.button
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="bg-green-600 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-green-500 border-2 border-white"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                // アクションカードのタイプに応じて処理
                                                                                // @ts-ignore
                                                                                const type = card.actionType;
                                                                                if (type.startsWith('BREAK') || type.startsWith('FIX')) {
                                                                                    setInteractionMode('SELECT_PLAYER');
                                                                                    setShowPlayerModal(true);
                                                                                } else if (type === 'MAP') {
                                                                                    setInteractionMode('SELECT_GOAL');
                                                                                    toast('確認したいゴールカードをタッチしてください', {
                                                                                        id: 'select-goal-hint',
                                                                                        icon: '🗺️'
                                                                                    });
                                                                                } else if (type === 'ROCKFALL') {
                                                                                    setInteractionMode('SELECT_ROCKFALL');
                                                                                    toast('破壊する場所をタッチしてください', {
                                                                                        id: 'select-rockfall-hint',
                                                                                        icon: '💣'
                                                                                    });
                                                                                }
                                                                            }}
                                                                            title="使用する"
                                                                        >
                                                                            ✓
                                                                        </motion.button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}


                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {(mapPeekState || reviewingGoal) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="fixed z-50 cursor-pointer"
                                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                                onClick={() => setReviewingGoal(null)}
                            >
                                <div className="relative p-6 bg-slate-800/95 rounded-xl border-2 border-amber-500 shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
                                    <h3 className="text-amber-400 font-bold text-2xl animate-pulse tracking-widest uppercase drop-shadow-md">
                                        {reviewingGoal ? "MEMORY RECALL" : "SECRET REPORT"}
                                    </h3>
                                    <div className="w-40 h-56 relative overflow-hidden rounded-lg shadow-inner border-4 border-slate-600 bg-slate-900 group">
                                        <div className={`w-full h-full flex items-center justify-center text-6xl transition-transform duration-500 group-hover:scale-110
                                                    ${(mapPeekState?.result || reviewingGoal?.result) === 'GOLD'
                                                ? 'bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-600'
                                                : 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700'}`}>
                                            {(mapPeekState?.result || reviewingGoal?.result) === 'GOLD' ? '💰' : '🪨'}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    </div>
                                    <div className="text-slate-300 text-sm font-medium text-center">
                                        {reviewingGoal
                                            ? "以前確認した場所です"
                                            : "この情報はあなただけに開示されています"}
                                    </div>
                                    {reviewingGoal && (
                                        <div className="text-xs text-slate-500 mt-2">
                                            (Click anywhere to close)
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>



                    <AnimatePresence>
                        {previewCard && (
                            <CardPreviewOverlay
                                card={previewCard}
                                onClose={() => setPreviewCard(null)}
                            />
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div >
    );
};
