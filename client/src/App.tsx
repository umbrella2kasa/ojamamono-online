import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, Player, GameState, Role, ChatMessage, GameOptions } from '@ojamamono/shared';
import { soundManager } from './utils/SoundManager';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

import { toast, Toaster } from 'react-hot-toast';

// import { RoleAssignmentAnimation } from './components/RoleAssignmentAnimation'; // Moved to GameScreen
// import { TurnNotification } from './components/TurnNotification'; // Removed

import { ResultOverlay } from './components/ResultOverlay';
import { GameScreen } from './components/GameScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { PIXEL_AVATARS } from './components/avatar/PixelAvatarAssets';

import { AvatarToken } from './components/common/AvatarToken';
import { LeaderboardModal } from './components/LeaderboardModal';
import { getBadgeInfo } from './utils/BadgeUtils';
// Use environment variable for server URL in production.
// If missing on Render, automatically guess the -server URL from the current -game hostname.
const getInitialServerUrl = () => {
    const envUrl = (import.meta as any).env.VITE_SERVER_URL;
    if (envUrl) return envUrl;

    const host = window.location.hostname;
    if (host.includes('onrender.com')) {
        // ojamamono-game.onrender.com -> ojamamono-server.onrender.com
        return `https://${host.replace('-game', '-server')}`;
    }
    return `http://${host}:3001`;
};

const SERVER_URL = getInitialServerUrl();
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL);

type Screen = 'LOGIN' | 'LOBBY' | 'GAME' | 'RESULT';

const AVATARS = [
    // --- 😃 Simple Faces & Icons ---
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
    '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🥱', '😴', '😌',
    '🤓', '😎', '🥸', '🥳', '🤡', '🤠', '👻', '👺', '👹', '👿',
    '😈', '💀', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻',
    '😼', '😽', '🙀', '😿', '😾', '🧑‍🚀', '🧑‍🚒', '🧑‍🏫', '🧑‍🎨', '🧑‍🎤',
    '🧐', '🤨', '😟', '😤', '🤯', '😭', '🥵', '🥶', '🤮'
];

function App() {
    const [screen, setScreen] = useState<Screen>('LOGIN');
    const [playerName, setPlayerName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [selectedPixelAvatar, setSelectedPixelAvatar] = useState<string | undefined>(Object.keys(PIXEL_AVATARS)[0]);
    const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('ojamamono_auth') === 'true');
    const [authInput, setAuthInput] = useState('');
    const [authError, setAuthError] = useState(false);

    // This should be changed or set via env in production
    const SECRET_KEY = (import.meta as any).env.VITE_APP_PASSWORD || 'たからもの';

    const handleAuth = () => {
        if (authInput === SECRET_KEY) {
            localStorage.setItem('ojamamono_auth', 'true');
            setIsAuthorized(true);
            setAuthError(false);
            soundManager.playCorrect();
        } else {
            setAuthError(true);
            soundManager.playWrong();
            setTimeout(() => setAuthError(false), 2000);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-800 border-2 border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
                >
                    <div className="text-4xl mb-4">🔐</div>
                    <h1 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Secret Access</h1>
                    <p className="text-slate-400 text-xs mb-6">合言葉を知っている人だけが遊べます</p>

                    <input
                        type="text"
                        style={{ WebkitTextSecurity: 'disc' } as any} // 伏せ字にしつつ日本語入力を許可
                        className={`w-full bg-slate-900 border ${authError ? 'border-red-500 animate-shake' : 'border-slate-600'} rounded-lg p-3 text-white text-center text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="あいことばをいれてね"
                        value={authInput}
                        onChange={(e) => setAuthInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />

                    <button
                        onClick={handleAuth}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-lg"
                    >
                        決定
                    </button>
                </motion.div>
            </div>
        );
    }
    const [roomId, setRoomId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [myRole, setMyRole] = useState<Role | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [myUserId, setMyUserId] = useState(() => {
        const saved = localStorage.getItem('ojamamono_user_id');
        if (saved) return saved;
        const newId = Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ojamamono_user_id', newId);
        return newId;
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [roundResult, setRoundResult] = useState<{ winner: Role | 'DRAW', rewards: { [id: string]: number }, nextRound?: number } | null>(null);
    const [finalResult, setFinalResult] = useState<{ winner: Role | 'DRAW' | null, scores: { [id: string]: number } } | null>(null);
    const [gameOptions, setGameOptions] = useState<GameOptions>({
        maxRounds: 3,
        enableScore: true,
        botDifficulty: 'NORMAL',
        roleConfig: {
            fixed: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 0, geologists: 0 },
            random: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 0, geologists: 0 }
        },
        specialCardConfig: {
            dynamite: 2,
            oracle: 3,
            thief: 1,
            trader: 1,
            scavenger: 1,
            doubleAction: 2
        }
    });



    // State for turn change notification
    const [showTurnChange, setShowTurnChange] = useState(false);
    const [turnChangePlayer, setTurnChangePlayer] = useState<string>('');
    const [isMyTurnNotification, setIsMyTurnNotification] = useState(false);

    const [activeEmotes, setActiveEmotes] = useState<{ [key: string]: string }>({});
    const [showRole, setShowRole] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [connectError, setConnectError] = useState<string | null>(null);

    const [allStats, setAllStats] = useState<any[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [myStats, setMyStats] = useState<any | null>(null);

    const roleAnimationPlayed = useRef(false);

    // No-op for now as GameScreen manages selection
    const resetSelection = () => { };

    // 1. Initialization & Rejoin Request (Runs only once)
    useEffect(() => {
        let storedUserId = localStorage.getItem('ojamamono_user_id');
        if (!storedUserId) {
            storedUserId = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('ojamamono_user_id', storedUserId);
        }
        setMyUserId(storedUserId);

        const storedRoomId = localStorage.getItem('ojamamono_roomid');
        if (storedRoomId) {
            setRoomId(storedRoomId);
            // Wait slightly to ensure listeners from the other effect are ready
            setTimeout(() => {
                if (socket.connected) {
                    (socket as any).emit('rejoinRoom', storedRoomId, storedUserId);
                } else {
                    socket.once('connect', () => {
                        (socket as any).emit('rejoinRoom', storedRoomId, storedUserId!);
                    });
                }
            }, 100);
        }
    }, []);

    // 2. Socket Event Listeners (Re-binds when state changes to correct closures)
    useEffect(() => {

        const onRejoinSuccess = (state: GameState) => {
            setGameState(state);
            if (state.status === 'PLAYING') {
                setScreen('GAME');
                // On rejoin, we don't play animation again
                roleAnimationPlayed.current = true;
            } else {
                setScreen('LOBBY');
                roleAnimationPlayed.current = false;
            }
            toast.success('ゲームに復帰しました！', { id: 'rejoin-success' });
        };

        const onRoomUpdated = (data: { roomId: string, players: Player[], gameOptions: GameOptions }) => {
            console.log('Room updated:', data);
            toast('ルーム情報を受信しました', { icon: '📡' });
            setPlayers(data.players);
            setRoomId(data.roomId);
            if (data.gameOptions) {
                setGameOptions(data.gameOptions);
            }
            localStorage.setItem('ojamamono_roomid', data.roomId);
            setScreen(prev => (prev === 'GAME' && data.players.some(p => p.id === myUserId)) ? 'GAME' : 'LOBBY'); // Simplified condition
            setErrorMsg('');
        };

        const onGameStarted = (initialState: GameState) => {
            setGameState(initialState);
            setGameOptions(initialState.options);
            setScreen('GAME');

            // Clear results if any
            setRoundResult(null);
            setFinalResult(null);
            // setIsResultMinimized(false); // Removed as it is now local to ResultOverlay

            // Only play animation flag set here, GameScreen handles the actual trigger based on round
            roleAnimationPlayed.current = true;
            soundManager.init();
            soundManager.playCardShuffle();

        };

        const onGameStateUpdated = (updatedState: GameState) => {
            setGameState((prevState: GameState | null) => {
                // If new round started, clear results
                if (updatedState.status === 'PLAYING' && prevState?.status !== 'PLAYING') {
                    setRoundResult(null);
                    setFinalResult(null);
                }

                if (prevState && prevState.currentPlayerIndex !== updatedState.currentPlayerIndex) {
                    const newPlayer = updatedState.players[updatedState.currentPlayerIndex];
                    setTurnChangePlayer(newPlayer.name);
                    const isMyTurn = newPlayer.id === myUserId;
                    setIsMyTurnNotification(isMyTurn);
                    setShowTurnChange(true);

                    if (isMyTurn) {
                        soundManager.playCardPlace(); // Or a specific alert sound if available
                    } else {
                        soundManager.playCardPlace();
                    }

                    setTimeout(() => setShowTurnChange(false), 2000);
                }
                return updatedState;
            });
        };

        const onPlayerRoleInfo = (role: Role) => {
            setMyRole(role);
            setMyRole(role);
            // setShowRole(true); // Handled in GameScreen or RoleAssignmentAnimation
            // setTimeout(() => setShowRole(false), 5000);
        };

        const onError = (msg: string) => {
            setErrorMsg(msg);
            soundManager.playBreak();
            resetSelection();
            toast.error(msg, { id: `error-${msg.substring(0, 10)}` });
            if (msg.includes('見つかりません')) {
                localStorage.removeItem('ojamamono_roomid');
            }
        };

        const onActionResult = (data: { success: boolean, message?: string, mapResult?: 'GOLD' | 'STONE', privateMessage?: string }) => {
            if (data.privateMessage) {
                toast(() => (
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-indigo-500/30 pb-1 mb-1">
                            <span>🔮</span>
                            <span>Private Vision</span>
                        </div>
                        <div className="text-white text-sm">
                            {data.privateMessage}
                        </div>
                    </div>
                ), {
                    id: 'private-msg',
                    duration: 8000,
                    style: {
                        background: '#1e1b4b', // deeply indigo
                        border: '1px solid #6366f1',
                        color: '#fff',
                    }
                });
                soundManager.playRoleReveal(true); // Reuse reveal sound
            }

            if (data.mapResult) {
                // Toastも出すが、演出用のステートも更新
                if (lastMapTargetRef.current) {
                    setMapPeekState({
                        x: lastMapTargetRef.current.x,
                        y: lastMapTargetRef.current.y,
                        result: data.mapResult
                    });
                    // 5秒後に演出を消す
                    setTimeout(() => setMapPeekState(null), 5000);
                }

                toast(() => (
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">{data.mapResult === 'GOLD' ? '💰' : '🪨'}</span>
                        <div>
                            <div className="font-bold">調査結果</div>
                            <div>ここは {data.mapResult === 'GOLD' ? '金塊' : '石ころ'} でした！</div>
                        </div>
                    </div>
                ), { id: 'map-result', duration: 5000 });
                soundManager.playGoldFound();
                soundManager.playMap();
            } else if (data.success) {
                // メッセージ内容からアクションを推測して音を鳴らす
                const msg = data.message || '';
                if (msg.includes('全修理') || (msg.includes('修理') && msg.includes('と'))) {
                    // 全修理または複数修理
                    soundManager.playFixAll();
                    // 全修復エフェクト (緑のパーティクル)
                    confetti({
                        particleCount: 50,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#4ade80', '#22c55e', '#16a34a', '#ffff00'], // Green & Yellow
                        zIndex: 2000
                    });
                } else if (msg.includes('修理')) {
                    soundManager.playFix();
                } else if (msg.includes('壊') || msg.includes('破壊')) {
                    // 落石か道具破壊か判別
                    // 落石は通常 position 指定があるが、ここでは簡易的にメッセージで
                    if (msg.includes('破壊するカード')) { // 落石エラーメッセージ等
                        soundManager.playError();
                    } else if (msg.includes('破壊しました')) { // 落石成功など
                        soundManager.playRockfall();
                    } else {
                        soundManager.playBreak();
                    }
                } else {
                    soundManager.playCardPlace();
                }

                toast.success(data.message || 'アクション成功！', { id: 'action-success' });
            }
        };

        const onEmoteReceived = ({ playerId, emoteId }: { playerId: string, emoteId: string }) => {
            setActiveEmotes(prev => ({ ...prev, [playerId]: emoteId }));
            setTimeout(() => {
                setActiveEmotes(prev => {
                    const next = { ...prev };
                    if (next[playerId] === emoteId) {
                        delete next[playerId];
                    }
                    return next;
                });
            }, 3000);
        };

        const onChatMessage = (message: ChatMessage) => {
            setChatMessages(prev => [...prev, message]);
            // toast is handled by GameScreen.tsx useEffect to avoid duplicates and use IDs
        };

        const onOptionsUpdated = (options: GameOptions) => {
            setGameOptions(options);
            toast('ゲーム設定が更新されました', { icon: '⚙️' });
        };

        const onRoundEnded = (result: { winner: Role | 'DRAW', rewards: { [id: string]: number }, nextRound?: number }) => {
            // Sound Effect immediately
            if (result.winner === 'GOLD_DIGGER') {
                soundManager.playGoldFound();
            } else {
                soundManager.playBreak();
            }

            // Toast notification
            toast(result.winner === 'GOLD_DIGGER' ? '金塊発見！ラウンド終了！' : 'ラウンド終了！', {
                id: 'round-end-toast',
                icon: '🏁',
                duration: 3000
            });

            // Delay showing the result screen to allow users to see the board
            setTimeout(() => {
                setRoundResult(result);
            }, 3000);
        };

        const onGameEnded = (result: { winner: Role | 'DRAW' | null, scores?: { [id: string]: number }, isFinal?: boolean }) => {
            // Sound & Confetti on the MAP screen first
            if (result.winner === 'GOLD_DIGGER') {
                soundManager.playGoldFound();
                toast('金塊発見！ゲーム終了！', { id: 'game-end-toast', icon: '💎', duration: 4000 });

                const duration = 3 * 1000;
                const end = Date.now() + duration;
                (function frame() {
                    confetti({
                        particleCount: 5,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#FFD700', '#FFA500']
                    });
                    confetti({
                        particleCount: 5,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#FFD700', '#FFA500']
                    });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            } else {
                soundManager.playBreak();
                toast('お邪魔者の勝利... ゲーム終了', { id: 'game-end-toast', icon: '😈', duration: 4000 });
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#5D4037', '#d32f2f', '#000000']
                });
            }

            // Delay transition to Result Screen Overlay
            setTimeout(() => {
                setFinalResult({
                    winner: result.winner as any,
                    scores: result.scores || {}
                });
            }, 3500);
        };

        const onStatsReceived = (stats: any) => {
            setMyStats(stats);
        };

        const onAllStatsReceived = (stats: any[]) => {
            setAllStats(stats);
            setShowLeaderboard(true);
        };

        (socket as any).on('rejoinSuccess', onRejoinSuccess);
        socket.on('roomUpdated', onRoomUpdated);
        socket.on('gameStarted', onGameStarted);
        socket.on('gameStateUpdated', onGameStateUpdated);
        socket.on('playerRoleInfo', onPlayerRoleInfo);
        socket.on('error', onError);
        socket.on('actionResult', onActionResult);
        socket.on('emoteReceived', onEmoteReceived);
        socket.on('chatMessage', onChatMessage);
        socket.on('optionsUpdated', onOptionsUpdated);
        socket.on('roundEnded', onRoundEnded);
        socket.on('gameEnded', onGameEnded);
        (socket as any).on('statsReceived', onStatsReceived);
        (socket as any).on('allStatsReceived', onAllStatsReceived);

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err);
            setConnectError(err.message);
        });
        socket.on('connect', () => {
            setConnectError(null);
        });

        return () => {
            (socket as any).off('rejoinSuccess', onRejoinSuccess);
            socket.off('roomUpdated', onRoomUpdated);
            socket.off('gameStarted', onGameStarted);
            socket.off('gameStateUpdated', onGameStateUpdated);
            socket.off('playerRoleInfo', onPlayerRoleInfo);
            socket.off('error', onError);
            socket.off('actionResult', onActionResult);
            socket.off('emoteReceived', onEmoteReceived);
            socket.off('chatMessage', onChatMessage);
            socket.off('optionsUpdated', onOptionsUpdated);
            socket.off('roundEnded', onRoundEnded);
            socket.off('gameEnded', onGameEnded);
            (socket as any).off('statsReceived', onStatsReceived);
            (socket as any).off('allStatsReceived', onAllStatsReceived);
        };
    }, [myUserId]);

    const handleCreateRoom = () => {
        if (!playerName) return toast.error('名前を入力してください');
        soundManager.init();
        toast('ルームを作成しています...', { icon: '⏳' });
        (socket as any).emit('createRoom', playerName, selectedPixelAvatar || selectedAvatar, myUserId, undefined);
    };

    const handleJoinRoom = () => {
        if (!playerName || !roomId) return toast.error('名前とルームIDを入力してください');
        soundManager.init();
        toast('ルームに参加しています...', { icon: '⏳' });
        (socket as any).emit('joinRoom', roomId, playerName, selectedPixelAvatar || selectedAvatar, myUserId, undefined);
    };

    const handleStartGame = () => {
        socket.emit('startGame');
    };

    const handleNextRound = () => {
        socket.emit('nextRound');
        setRoundResult(null);
    };

    // Map Peek State (Private Visual Effect)
    const [mapPeekState, setMapPeekState] = useState<{ x: number, y: number, result: 'GOLD' | 'STONE' } | null>(null);
    const lastMapTargetRef = useRef<{ x: number, y: number } | null>(null);

    // Public Map Indicators (Everyone sees these)
    const [mapIndicators, setMapIndicators] = useState<Array<{ x: number, y: number, id: string }>>([]);

    useEffect(() => {
        if (!socket) return;

        const onActionPerformed = (data: { playerId: string, cardType: string, actionType?: string, position?: { x: number, y: number } }) => {
            if (data.cardType === 'ACTION' && data.actionType === 'MAP' && data.position) {
                // Check if map indicator already exists nearby to avoid spam? No, just add.
                const id = Date.now().toString();
                setMapIndicators(prev => [...prev, { x: data.position!.x, y: data.position!.y, id }]);

                // Remove after 10 seconds
                setTimeout(() => {
                    setMapIndicators(prev => prev.filter(i => i.id !== id));
                }, 10000);
            }
        };

        socket.on('actionPerformed' as any, onActionPerformed);
        return () => {
            socket.off('actionPerformed' as any, onActionPerformed);
        };
    }, []);

    const handleAction = (index: number, options?: { x: number, y: number, isReversed: boolean }, targetId?: string) => {
        // マップカード使用時、ターゲット座標を記録しておく（結果受信時の演出用）
        if (gameState && options) {
            const me = gameState.players.find(p => p.id === myUserId);
            const card = me?.hand[index];
            if (card && card.type === 'ACTION' && (card as any).actionType === 'MAP') {
                lastMapTargetRef.current = { x: options.x, y: options.y };
            }
        }
        socket.emit('playCard', index, options, targetId);
    };

    const handleDiscard = (index: number) => {
        socket.emit('discardCard', index);
    };

    const handleSendEmote = (emote: string) => {
        socket.emit('sendEmote', emote);
    };

    const handleSendChat = (message: string) => {
        socket.emit('chatMessage', message);
    };

    const [isBgmEnabled, setIsBgmEnabled] = useState(false);

    const toggleBgm = () => {
        const newValue = !isBgmEnabled;
        setIsBgmEnabled(newValue);
        soundManager.toggleBGM();
        soundManager.playClick();
    };


    const handleQuit = () => {
        soundManager.playClick();
        if (confirm('ルームから退出してタイトルに戻りますか？')) {
            localStorage.removeItem('ojamamono_roomid');
            window.location.reload();
        }
    };

    const isGameMode = screen === 'GAME';

    return (
        <div className={`min-h-screen bg-cavern text-white font-sans ${isGameMode ? '' : 'p-4'} select-none touch-manipulation`}>
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <pattern id="dirtPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect width="40" height="40" fill="#3E2723" />
                        <path d="M0 0h40v40H0z" fill="#5D4037" fillOpacity="0.4" />
                        <circle cx="5" cy="5" r="2" fill="#291815" fillOpacity="0.5" />
                        <circle cx="25" cy="25" r="3" fill="#291815" fillOpacity="0.5" />
                        <circle cx="15" cy="35" r="1.5" fill="#8D6E63" fillOpacity="0.3" />
                    </pattern>
                </defs>
            </svg>
            {/* Only show Toasts when not in critical animation */}
            <Toaster position="top-center" />


            {/* RoleAssignmentAnimation is now handled inside GameScreen.tsx */}


            {/* TurnNotification removed to use the less intrusive banner defined later */}

            {/* TurnNotification removed to use the less intrusive banner defined later */}

            <div className={isGameMode ? 'w-full h-full' : 'max-w-6xl mx-auto'}>
                {!isGameMode && (
                    <header className="mb-8 border-b border-indigo-200/40 p-6 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50 shadow-sm">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-slate-800 font-outfit tracking-tighter">
                                お邪魔もの <span className="text-blue-600 font-light opacity-80">Online</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleBgm}
                                className={`p-2 rounded-full transition-all border ${isBgmEnabled ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                title="BGM Toggle"
                            >
                                <span className="text-sm">{isBgmEnabled ? '🔊' : '🔇'}</span>
                            </button>

                            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-gray-700/50">
                                <div className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                    {socket.connected ? 'Connected' : 'Offline'}
                                </span>
                            </div>



                            {screen !== 'LOGIN' && (
                                <button
                                    onClick={() => {
                                        soundManager.playClick();
                                        if (confirm('ルームから退出してタイトルに戻りますか？')) {
                                            localStorage.removeItem('ojamamono_roomid');
                                            window.location.reload();
                                        }
                                    }}
                                    className="bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-900/50 transition font-medium"
                                >
                                    退出
                                </button>
                            )}
                        </div>
                    </header>
                )}

                <main>
                    {errorMsg && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 animate-pulse">
                            {errorMsg}
                        </div>
                    )}

                    {screen === 'LOGIN' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto bg-slate-50/90 shadow-xl border border-indigo-100 rounded-lg p-10 mt-20 relative"
                        >
                            {/* Subtle pattern */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }} />



                            <h2 className="text-lg font-bold text-indigo-900 mb-5 text-center tracking-widest uppercase">
                                ROOM LOGIN
                            </h2>
                            <div className="text-[8px] text-gray-300 text-center mb-5 font-mono opacity-50">
                                Connection: {SERVER_URL}
                                {connectError && <div className="text-red-400 mt-1">Error: {connectError}</div>}
                            </div>

                            <div className="mb-6 relative z-10">
                                <label className="flex justify-between items-end mb-2 relative">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Miner Name</span>
                                    <span className="text-gray-500 text-[10px] font-medium">プレイヤー名</span>

                                    {/* Smaller Speech Bubble */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: 1, duration: 0.5 }}
                                        className="absolute -top-8 right-0 bg-blue-600/90 text-white text-[9px] px-2 py-1 rounded-full font-bold shadow-md whitespace-nowrap border border-white/20"
                                    >
                                        おなじなまえで せんせきをきろく！
                                        <div className="absolute -bottom-1 right-3 w-1.5 h-1.5 bg-blue-600 rotate-45" />
                                    </motion.div>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-100 border border-slate-200 rounded p-4 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-lg transition-all"
                                    value={playerName}
                                    placeholder="なまえをいれてね（全角ひらがなのみ）"
                                    onChange={e => {
                                        const val = e.target.value;
                                        setPlayerName(val);

                                        // 警告だけ出す（入力自体は妨げない）
                                        const hasNonHiragana = /[^\u3041-\u3096\u309B\u309C\u309D\u309E\u30FC\s]/.test(val);
                                        if (hasNonHiragana && val.length > 0) {
                                            setErrorMsg('なまえは「ひらがな」がおすすめだよ！');
                                            setTimeout(() => setErrorMsg(''), 3000);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (playerName.trim()) {
                                            const savedStats = localStorage.getItem(`stats_${playerName.trim()}`);
                                            if (savedStats) {
                                                setMyStats(JSON.parse(savedStats));
                                            } else {
                                                (socket as any).emit('fetchStats', playerName.trim());
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <div className="mb-8 relative z-10">
                                <label className="flex justify-between items-end mb-2">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Identity / Avatar</span>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500 text-[10px] font-medium">アバター選択</span>
                                    </div>
                                </label>

                                <div className="flex justify-center mb-4">
                                    <div className="relative group">
                                        <AvatarToken
                                            avatar={selectedAvatar}
                                            pixelAvatarId={selectedPixelAvatar}
                                            rankStats={myStats || undefined}
                                            size="xl"
                                            onClick={() => { }}
                                            className="cursor-pointer hover:ring-4 hover:ring-offset-2 hover:ring-indigo-400 Transition-all duration-300 transform group-hover:scale-105"
                                        />
                                        {myStats && (
                                            <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-xl flex items-center gap-1 z-20">
                                                <span className="text-xl">{getBadgeInfo(myStats).icon}</span>
                                                <div className="flex flex-col">
                                                    <span className={`text-[8px] font-black uppercase leading-none ${getBadgeInfo(myStats).color}`}>{getBadgeInfo(myStats).name}</span>
                                                    <span className="text-[7px] text-blue-400 font-bold leading-none">{Math.round((myStats.gameWins / (myStats.gamePlayed || 1)) * 100)}% Win</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-white whitespace-nowrap">
                                            Avatar Preview
                                        </div>
                                    </div>
                                </div>
                                {/* Collapsible Pixel Art Avatar Selection */}
                                <div className="mb-6 relative z-10">
                                    <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 open:shadow-md" open>
                                        <summary className="list-none flex items-center justify-between p-3 cursor-pointer bg-slate-100/50 hover:bg-slate-100 transition-colors select-none text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            <span>Pixel Art Avatars</span>
                                            <span className="transform group-open:rotate-180 transition-transform duration-300">▼</span>
                                        </summary>
                                        <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar bg-white">
                                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                                {Object.keys(PIXEL_AVATARS).map((id) => (
                                                    <div key={id} className="flex justify-center">
                                                        <AvatarToken
                                                            avatar=""
                                                            pixelAvatarId={id}
                                                            size="md"
                                                            selected={selectedPixelAvatar === id}
                                                            onClick={() => {
                                                                setSelectedPixelAvatar(id);
                                                                soundManager.playCardPlace();
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                {/* Collapsible Emoji Selection (Legacy/Backup) */}
                                <div className="mb-6 relative z-10">
                                    <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 open:shadow-md">
                                        <summary className="list-none flex items-center justify-between p-3 cursor-pointer bg-slate-100/50 hover:bg-slate-100 transition-colors select-none text-xs font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                                            <span>Emojis</span>
                                            <span className="transform group-open:rotate-180 transition-transform duration-300">▼</span>
                                        </summary>
                                        <div className="p-4 max-h-40 overflow-y-auto custom-scrollbar bg-white">
                                            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
                                                {AVATARS.slice(0, 40).map((avatar, i) => (
                                                    <div key={i} className="flex justify-center aspect-square">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAvatar(avatar);
                                                                setSelectedPixelAvatar(undefined);
                                                                soundManager.playCardPlace();
                                                            }}
                                                            className={`w-full h-full text-xl flex items-center justify-center rounded hover:bg-indigo-50 transition-all active:scale-95 ${selectedAvatar === avatar && !selectedPixelAvatar ? 'bg-indigo-100 ring-1 ring-indigo-500' : ''}`}
                                                        >
                                                            {avatar}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <button
                                    onClick={handleCreateRoom}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-md shadow-lg active:scale-[0.98] transition-all flex flex-col items-center justify-center tracking-widest"
                                >
                                    <span className="text-md uppercase">Create Room</span>
                                    <span className="text-[10px] opacity-80 font-normal">新しいルームを作成</span>
                                </button>

                                <div className="flex items-center gap-4 py-2 opacity-50">
                                    <div className="h-px bg-slate-300 flex-1" />
                                    <span className="text-xs text-slate-400">OR</span>
                                    <div className="h-px bg-slate-300 flex-1" />
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="w-24 bg-slate-100 border border-slate-200 rounded p-3 text-slate-800 outline-none text-center font-mono tracking-widest focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400"
                                        value={roomId}
                                        onChange={e => setRoomId(e.target.value)}
                                        placeholder="ID"
                                    />
                                    <button
                                        onClick={handleJoinRoom}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg active:scale-[0.98] transition-all border border-indigo-500 hover:border-indigo-400 flex flex-col items-center justify-center tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!playerName.trim() || !roomId.trim()}
                                    >
                                        <span className="leading-tight">JOIN ROOM</span>
                                        <span className="text-[9px] opacity-80 font-normal">既存のルームに参加</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => (socket as any).emit('fetchAllStats')}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold py-3 px-6 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 mt-4 text-sm"
                                >
                                    <span>🏆</span> 全員の結果を見る（ランキング）
                                </button>
                            </div>
                            <AnimatePresence>
                                {showLeaderboard && (
                                    <LeaderboardModal
                                        stats={allStats}
                                        onClose={() => setShowLeaderboard(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                    }



                    <div className="w-full h-full relative">

                        {screen === 'LOBBY' && roomId && (
                            <LobbyScreen
                                roomId={roomId}
                                players={players}
                                myUserId={myUserId}
                                onStartGame={handleStartGame}
                                onAddBot={(difficulty) => (socket as any).emit('addBot', difficulty)}
                                onUpdateOptions={(options) => (socket as any).emit('updateOptions', options)}
                                onWatchSpectate={() => {
                                    (socket as any).emit('joinSpectator');
                                    setScreen('GAME');
                                    toast('観戦モードを開始します', { icon: '📺' });
                                }}
                                gameOptions={gameOptions}
                                activeEmotes={activeEmotes}
                            />
                        )}

                        {screen === 'GAME' && gameState && (
                            <>
                                <GameScreen
                                    gameState={gameState}
                                    myUserId={myUserId}
                                    myRole={myRole}
                                    showRole={showRole}
                                    onToggleRole={() => setShowRole(!showRole)}
                                    // @ts-ignore
                                    onPlayCard={handleAction}
                                    // @ts-ignore
                                    onDiscardCard={handleDiscard}
                                    // @ts-ignore
                                    onSendEmote={handleSendEmote}
                                    // @ts-ignore
                                    onSendChat={handleSendChat}
                                    onVoteSuspicion={(targetId) => { (socket as any).emit('voteSuspicion', targetId); }}
                                    chatMessages={chatMessages}
                                    activeEmotes={activeEmotes}
                                    showTurnChange={showTurnChange}
                                    turnChangePlayer={turnChangePlayer}
                                    isMyTurnNotification={isMyTurnNotification}
                                    // @ts-ignore
                                    mapPeekState={mapPeekState}
                                    // @ts-ignore
                                    mapIndicators={mapIndicators}

                                    onRoleConfirmed={() => socket.emit('roleConfirmed' as any)}
                                    onStoneAction={(targetId, type, tool) => {
                                        socket.emit('stoneAction' as any, targetId, type, tool);
                                    }}
                                    onSkipStoneAction={() => {
                                        socket.emit('skipStoneAction' as any);
                                    }}
                                    // @ts-ignore
                                    isBgmEnabled={false}
                                    // @ts-ignore
                                    onToggleBgm={() => { }}
                                    // @ts-ignore
                                    onQuit={handleQuit}
                                />
                                <ResultOverlay
                                    gameState={gameState}
                                    roundResult={roundResult}
                                    finalResult={finalResult}
                                    myUserId={myUserId}
                                    onNextRound={handleNextRound}
                                />
                            </>
                        )}
                    </div>
                </main >
            </div >
        </div >
    );
}

export default App;
