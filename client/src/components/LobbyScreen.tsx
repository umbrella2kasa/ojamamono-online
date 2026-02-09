import React, { useState } from 'react';
import { Player, GameOptions, BotDifficulty } from '@ojamamono/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { TutorialModal } from './TutorialModal';
import { AvatarToken } from './common/AvatarToken';
import { getBadgeInfo } from '../utils/BadgeUtils';

interface LobbyScreenProps {
    roomId: string;
    players: Player[];
    myUserId: string;
    // Props for Actions
    onStartGame: () => void;
    onAddBot: (difficulty: BotDifficulty) => void;
    onUpdateOptions: (options: GameOptions) => void;
    onWatchSpectate: () => void;

    // Data
    gameOptions: GameOptions;

    // Active Emotes (for displaying on players? - Lobby specific?)
    // In App.tsx, emote display was inside Lobby loop. So we need `activeEmotes`.
    activeEmotes: { [playerId: string]: string };
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
    roomId,
    players,
    myUserId,
    onStartGame,
    onAddBot,
    onUpdateOptions,
    onWatchSpectate,
    gameOptions,
    activeEmotes
}) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const [localBotDiff, setLocalBotDiff] = useState<BotDifficulty>('NORMAL');

    const isHost = players.length > 0 && players[0].id === myUserId;

    return (
        <div className="bg-slate-50/90 border border-slate-200 p-10 rounded-lg shadow-xl max-w-lg mx-auto mt-20 relative">

            <button
                onClick={() => setShowTutorial(true)}
                className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-yellow-400 w-8 h-8 rounded-full flex items-center justify-center border border-gray-600 transition-colors z-10"
            >
                ?
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-10 text-center tracking-widest uppercase">
                Waiting Lobby
            </h2>
            <div className="text-center mb-8 bg-slate-100 p-4 rounded-xl border border-dashed border-slate-300 relative z-10">
                <p className="text-slate-500 mb-2 text-xs uppercase tracking-widest">Room Selection</p>
                <div className="text-6xl font-mono font-bold text-blue-600 tracking-widest mb-4">
                    {roomId}
                </div>
                <p className="text-xs text-slate-500 font-medium">友達にこのIDをシェアしてください</p>
            </div>

            <AnimatePresence>
                {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
            </AnimatePresence>
            <div className="mb-8 bg-slate-50 rounded-xl p-5 border border-slate-200 z-10 relative">
                <h3 className="text-slate-500 mb-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span>👥</span> Players <span className="opacity-50">{players.length}</span>
                </h3>
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {players.map((p) => (
                        <li key={p.id} className="bg-white p-3 rounded-lg flex items-center gap-3 border border-slate-200 relative shadow-sm hover:bg-slate-50 transition-colors">
                            <AvatarToken avatar={p.avatar} rankStats={p.stats} size="sm" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={p.id === myUserId ? "text-blue-600 font-bold" : "text-slate-700 font-medium"}>
                                        {p.name}
                                    </span>
                                    {p.stats && (
                                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-black border border-slate-200 ml-1">
                                            <span className="text-xs">{getBadgeInfo(p.stats).icon}</span>
                                            <span className={`uppercase tracking-tighter ${getBadgeInfo(p.stats).color}`}>{getBadgeInfo(p.stats).name}</span>
                                        </div>
                                    )}
                                    {p.id === myUserId && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                                </div>
                                {p.stats && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-200">
                                            <span>💰</span> {p.stats.totalGold}
                                        </div>
                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-200" title="Round Win Rate">
                                            <span>🚩</span> {Math.round((p.stats.roundWins / (p.stats.roundPlayed || 1)) * 100)}%
                                        </div>
                                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-200" title="Game Win Rate">
                                            <span>🏆</span> {Math.round((p.stats.gameWins / (p.stats.gamePlayed || 1)) * 100)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                            {p.id === players[0].id && <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded ml-auto shadow-sm">HOST</span>}

                            {/* Emote Display */}
                            <AnimatePresence>
                                {activeEmotes[p.id] && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="absolute -top-6 right-10 bg-white text-black px-2 py-1 rounded-lg rounded-br-none shadow-xl text-xl z-20 border-2 border-gray-200"
                                    >
                                        {activeEmotes[p.id]}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </li>
                    ))}
                </ul>
            </div>
            {/* The provided code snippet for `handleJoin` is a JavaScript function and cannot be placed directly within JSX like this.
                It appears to be intended for a different component (e.g., a JoinScreen) where a user would input a name and join.
                Placing it here would result in a syntax error.
                If `soundManager.init()` needs to be called on a specific event within LobbyScreen, please provide the correct JSX element or lifecycle hook.
                For now, I'm placing it as a comment to maintain syntactical correctness.
            */}
            {/*
            const handleJoin = (e: React.FormEvent) => {
                e.preventDefault();
                if (playerName.trim()) {
                    soundManager.init();
                    // soundManager.playBGM(); // Optional: Start BGM here
                    onJoin(playerName);
                }
            };
            */}
            <div className="flex flex-col gap-3 relative z-10">
                {isHost && (
                    <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 mb-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-300 text-sm font-bold">🤖 Bot設定</span>
                            <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
                                {(['EASY', 'NORMAL', 'HARD'] as const).map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => setLocalBotDiff(diff)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${localBotDiff === diff
                                            ? (diff === 'HARD' ? 'bg-red-600 text-white shadow-red-900/50' : diff === 'NORMAL' ? 'bg-yellow-600 text-white shadow-yellow-900/50' : 'bg-green-600 text-white shadow-green-900/50') + ' shadow-lg'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                                            }`}
                                    >
                                        {diff === 'EASY' ? '弱い' : diff === 'NORMAL' ? '普通' : '強い'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => onAddBot(localBotDiff)}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-2.5 px-4 rounded-lg shadow-sm border border-gray-600 flex justify-center items-center gap-2 text-sm transition-all active:scale-[0.98]"
                        >
                            <span>➕</span> Botを追加
                        </button>
                    </div>
                )}
                <button
                    onClick={onStartGame}
                    disabled={players.length < 1}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-md font-bold py-4 px-8 rounded-md shadow-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    START GAME
                </button>
                <button
                    onClick={onWatchSpectate}
                    className="w-full bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 font-bold py-3 px-8 rounded-xl border border-indigo-500/30 transition-all text-sm flex items-center justify-center gap-2"
                >
                    <span>📺</span> 観戦モード (Auto Test)
                </button>
            </div>

            {/* Game Options */}
            <div className="mt-6 bg-slate-900/80 rounded-xl p-6 border border-slate-700 shadow-lg z-10 relative">
                <h3 className="text-blue-400 mb-4 text-sm font-black uppercase tracking-wider flex items-center justify-between border-b border-slate-700 pb-2">
                    <span>🛠️ Game Settings</span>
                    {!isHost && <span className="text-[10px] text-gray-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">Host Only</span>}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-bold text-base">ラウンド数</span>
                        <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-slate-700">
                            {[1, 3, 5, 7, 10].map(rounds => (
                                <button
                                    key={rounds}
                                    disabled={!isHost}
                                    onClick={() => onUpdateOptions({ ...gameOptions, maxRounds: rounds })}
                                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${gameOptions.maxRounds === rounds
                                        ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400'
                                        : 'text-gray-500 hover:text-gray-300'
                                        } ${!isHost && 'cursor-default opacity-80'}`}
                                >
                                    {rounds}R
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* ... other options ... */}
                    <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-bold text-base">スコア計算</span>
                        <button
                            disabled={!isHost}
                            onClick={() => onUpdateOptions({ ...gameOptions, enableScore: !gameOptions.enableScore })}
                            className={`w-12 h-6 rounded-full transition-colors relative border border-slate-600 ${gameOptions.enableScore ? 'bg-emerald-600' : 'bg-slate-800'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${gameOptions.enableScore ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-bold text-base">Botレベル(全体)</span>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-slate-700">
                            {['EASY', 'NORMAL', 'HARD'].map(level => (
                                <button
                                    key={level}
                                    disabled={!isHost}
                                    onClick={() => onUpdateOptions({ ...gameOptions, botDifficulty: level as any })}
                                    className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${gameOptions.botDifficulty === level
                                        ? 'bg-red-600 text-white shadow-lg ring-1 ring-red-400'
                                        : 'text-gray-500 hover:text-gray-300'
                                        } ${!isHost && 'cursor-default opacity-80'}`}
                                >
                                    {level.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Role Settings */}
            <div className="mt-4 bg-slate-900/80 rounded-xl p-6 border border-slate-700 shadow-lg z-10 relative">
                <h3 className="text-blue-400 mb-4 text-sm font-black uppercase tracking-wider flex items-center justify-between border-b border-slate-700 pb-2">
                    <span>🎭 Role Configuration</span>
                    {!isHost && <span className="text-[10px] text-gray-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">Host Only</span>}
                </h3>

                {isHost ? (
                    <div className="space-y-6">
                        {/* Presets */}
                        <div className="flex gap-2 mb-2 justify-end">
                            <button
                                onClick={() => {
                                    // Standard: Mostly Fixed to ensure balance
                                    const count = players.length;
                                    let s = 1;
                                    if (count >= 5) s = 2;
                                    if (count >= 7) s = 3;
                                    if (count >= 10) s = 4;
                                    const g = Math.max(1, count - s);

                                    onUpdateOptions({
                                        ...gameOptions,
                                        roleConfig: {
                                            fixed: { goldDiggers: g, saboteurs: s, selfishDwarves: 0, geologists: 0 },
                                            random: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 0, geologists: 0 }
                                        }
                                    });
                                }}
                                className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded border border-slate-600 transition-colors font-bold"
                            >
                                Standard (Fixed)
                            </button>
                            <button
                                onClick={() => {
                                    // User Example: Fixed Core + Random Extras
                                    const count = players.length;
                                    let s = 1;
                                    if (count >= 5) s = 2;
                                    const g = Math.max(0, count - s - 1); // Leave 1 slot open

                                    onUpdateOptions({
                                        ...gameOptions,
                                        roleConfig: {
                                            fixed: { goldDiggers: g, saboteurs: s, selfishDwarves: 0, geologists: 0 },
                                            random: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 1, geologists: 1 } // 1 of each in pool
                                        }
                                    });
                                }}
                                className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded border border-emerald-600 transition-colors font-bold"
                            >
                                +Random Slot
                            </button>
                        </div>

                        {/* Fixed Roles Section */}
                        <div className="bg-black/20 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-gray-400 font-bold mb-2 flex justify-between">
                                <span>🔒 確定枠 (Fixed Roles)</span>
                                <span>
                                    Sum: <span className="text-white">
                                        {(gameOptions.roleConfig?.fixed?.goldDiggers || 0) + (gameOptions.roleConfig?.fixed?.saboteurs || 0) + (gameOptions.roleConfig?.fixed?.selfishDwarves || 0) + (gameOptions.roleConfig?.fixed?.geologists || 0)}
                                    </span>
                                    {' / '}
                                    <span className="text-slate-500">Players: {players.length}</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {(['goldDiggers', 'saboteurs', 'selfishDwarves', 'geologists'] as const).map(role => (
                                    <div key={'fixed-' + role} className="bg-slate-800/50 p-2 rounded border border-slate-700 flex flex-col items-center">
                                        <span className="text-lg mb-1">
                                            {role === 'goldDiggers' ? '👷' : role === 'saboteurs' ? '😈' : role === 'selfishDwarves' ? '👺' : '💎'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold mb-1 uppercase">{role.replace('Dwarves', '').replace('Diggers', '')}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={gameOptions.roleConfig?.fixed?.[role] ?? 0}
                                            onChange={(e) => onUpdateOptions({
                                                ...gameOptions,
                                                roleConfig: {
                                                    ...gameOptions.roleConfig!,
                                                    fixed: {
                                                        ...gameOptions.roleConfig!.fixed,
                                                        [role]: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded text-center text-white font-mono text-sm py-1 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Random Pool Section */}
                        <div className="bg-indigo-900/10 p-3 rounded-lg border border-indigo-500/20 dashed-border">
                            <div className="text-xs text-indigo-300 font-bold mb-2 flex justify-between">
                                <span>🎲 ランダムプール (Candidates)</span>
                                <span>
                                    Remaining Slots: <span className="text-white font-bold bg-indigo-600 px-1.5 rounded">
                                        {Math.max(0, players.length - ((gameOptions.roleConfig?.fixed?.goldDiggers || 0) + (gameOptions.roleConfig?.fixed?.saboteurs || 0) + (gameOptions.roleConfig?.fixed?.selfishDwarves || 0) + (gameOptions.roleConfig?.fixed?.geologists || 0)))}
                                    </span>
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {(['goldDiggers', 'saboteurs', 'selfishDwarves', 'geologists'] as const).map(role => (
                                    <div key={'random-' + role} className="bg-indigo-950/40 p-2 rounded border border-indigo-500/30 flex flex-col items-center relative">
                                        <span className="text-lg mb-1 opacity-80">
                                            {role === 'goldDiggers' ? '👷' : role === 'saboteurs' ? '😈' : role === 'selfishDwarves' ? '👺' : '💎'}
                                        </span>
                                        <span className="text-[9px] text-indigo-300 font-bold mb-1 uppercase">Pool</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={gameOptions.roleConfig?.random?.[role] ?? 0}
                                            onChange={(e) => onUpdateOptions({
                                                ...gameOptions,
                                                roleConfig: {
                                                    ...gameOptions.roleConfig!,
                                                    random: {
                                                        ...gameOptions.roleConfig!.random,
                                                        [role]: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            })}
                                            className="w-full bg-indigo-950 border border-indigo-500/50 rounded text-center text-white font-mono text-sm py-1 focus:border-indigo-400 outline-none"
                                        />
                                        <div className="absolute -top-1 -right-1 text-[8px] text-indigo-400">?</div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                * 余った枠はここからランダムに選ばれます。足りない場合は金鉱掘りが割り当てられます。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-black/20 p-2 rounded text-center">
                            <div className="text-xs text-gray-400 mb-1">Fixed Roles</div>
                            <div className="flex justify-center gap-3">
                                <span className="text-sm">👷 {gameOptions.roleConfig?.fixed?.goldDiggers}</span>
                                <span className="text-sm">😈 {gameOptions.roleConfig?.fixed?.saboteurs}</span>
                                <span className="text-sm">👺 {gameOptions.roleConfig?.fixed?.selfishDwarves}</span>
                                <span className="text-sm">💎 {gameOptions.roleConfig?.fixed?.geologists}</span>
                            </div>
                        </div>
                        <div className="bg-indigo-900/20 p-2 rounded text-center border border-indigo-500/10">
                            <div className="text-xs text-indigo-300 mb-1">Random Pool</div>
                            <div className="flex justify-center gap-3 opacity-80">
                                <span className="text-xs">👷 {gameOptions.roleConfig?.random?.goldDiggers || 0}</span>
                                <span className="text-xs">😈 {gameOptions.roleConfig?.random?.saboteurs || 0}</span>
                                <span className="text-xs">👺 {gameOptions.roleConfig?.random?.selfishDwarves || 0}</span>
                                <span className="text-xs">💎 {gameOptions.roleConfig?.random?.geologists || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Special Card Configuration */}
            <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/5 z-10 relative">
                <h3 className="text-gray-400 mb-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Special Cards</span>
                    {!isHost && <span className="text-[10px] text-gray-600 bg-black/30 px-2 py-0.5 rounded">Host Only</span>}
                </h3>

                {isHost ? (
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => onUpdateOptions({
                                    ...gameOptions,
                                    specialCardConfig: { dynamite: 1, oracle: 3, thief: 2, trader: 2, scavenger: 1, doubleAction: 1 }
                                })}
                                className="text-[10px] bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded border border-indigo-600 transition-colors"
                            >
                                Reset to Default
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { key: 'dynamite', icon: '🧨', label: 'DYN' },
                                { key: 'oracle', icon: '🔮', label: 'ORA' },
                                { key: 'thief', icon: '💰', label: 'THF' },
                                { key: 'trader', icon: '🔄', label: 'TRD' },
                                { key: 'scavenger', icon: '♻️', label: 'SCA' },
                                { key: 'doubleAction', icon: '⚡', label: 'DBL' },
                            ].map(({ key, icon, label }) => (
                                <div key={key} className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 flex flex-col items-center">
                                    <span className="text-xl mb-1">{icon}</span>
                                    <span className="text-[10px] text-slate-400 font-bold mb-1">{label}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={(gameOptions.specialCardConfig as any)?.[key] ?? 0}
                                        onChange={(e) => onUpdateOptions({
                                            ...gameOptions,
                                            specialCardConfig: {
                                                ...{ dynamite: 0, oracle: 0, thief: 0, trader: 0, scavenger: 0, doubleAction: 0 },
                                                ...gameOptions.specialCardConfig,
                                                [key]: parseInt(e.target.value) || 0
                                            }
                                        })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded text-center text-white font-mono text-sm py-1 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-4 py-2">
                        {/* Read-only view for guests */}
                        {[
                            { key: 'dynamite', icon: '🧨' },
                            { key: 'oracle', icon: '🔮' },
                            { key: 'thief', icon: '💰' },
                            { key: 'trader', icon: '🔄' },
                            { key: 'scavenger', icon: '♻️' },
                            { key: 'doubleAction', icon: '⚡' },
                        ].map(({ key, icon }) => (
                            <div key={key} className="flex flex-col items-center">
                                <span className="text-lg">{icon}</span>
                                <span className="text-xs font-bold text-white">{(gameOptions.specialCardConfig as any)?.[key] ?? 0}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
