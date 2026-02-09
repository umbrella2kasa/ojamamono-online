// 役割
export type Role = 'GOLD_DIGGER' | 'SABOTEUR' | 'SELFISH_DWARF' | 'GEOLOGIST';

export interface PlayerStats {
    name: string;
    roundWins: number;
    roundPlayed: number;
    gameWins: number;
    gamePlayed: number;
    totalGold: number;
    lastSeen: number;
}

// アクションカードの種類
export type ActionType =
    | 'BREAK_PICKAXE' // つるはし破壊
    | 'BREAK_LANTERN' // ランプ破壊
    | 'BREAK_CART'    // トロッコ破壊
    | 'FIX_PICKAXE'   // つるはし修復
    | 'FIX_LANTERN'   // ランプ修復
    | 'FIX_CART'      // トロッコ修復
    | 'FIX_PICKAXE_LANTERN' // つるはしorランプ修復
    | 'FIX_PICKAXE_CART'    // つるはしorトロッコ修復
    | 'FIX_LANTERN_CART'    // ランプorトロッコ修復
    | 'FIX_ALL'             // 全修復 (つるはし/ランプ/トロッコ全て)
    | 'MAP'           // マップ
    | 'ROCKFALL';     // 落石

// スペシャルカードの種類
export type SpecialActionType =
    | 'DYNAMITE'      // ダイナマイト: 3x3爆破
    | 'ORACLE'        // 真実の鏡: 役職透視
    | 'THIEF'         // 泥棒: スコア強奪
    | 'TRADER'        // 交換屋: 手札入れ替え
    | 'SCAVENGER'     // スカベンジャー: 捨て札回収
    | 'DOUBLE_ACTION'; // ダブルアクション: 連続行動

// 通路の形状 (上下左右の接続可否 + 中央が繋がっているか)
export interface PathShape {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    center: boolean; // confirmed connection
    deadEnd?: boolean; // 行き止まりカードかどうか
}

export type Direction = 'top' | 'bottom' | 'left' | 'right';
export type Grid = (GridCell | null)[];

// カードの種別
export type CardType = 'PATH' | 'ACTION' | 'SPECIAL';

export interface BaseCard {
    id: string;
    type: CardType;
}

export interface PathCard extends BaseCard {
    type: 'PATH';
    shape: PathShape;
    isStart?: boolean;
    isGoal?: boolean;
    goalType?: 'GOLD' | 'STONE'; // ゴールの場合、めくるまでわからないが内部的には持っておく
    isRevealed?: boolean; // ゴールが公開されたかどうか
    hasCrystal?: boolean; // クリスタルがあるか (地質学者用)
}

export interface ActionCard extends BaseCard {
    type: 'ACTION';
    actionType: ActionType;
}

export interface SpecialCard extends BaseCard {
    type: 'SPECIAL';
    specialAction: SpecialActionType;
}

export type Card = PathCard | ActionCard | SpecialCard;

// Avatar Configuration
export interface AvatarConfig {
    skinColor: string;
    hairColor: string;
    faceShape: string;
    eyes: string;
    mouth: string;
    hair: string;
    accessory: string;
}

// プレイヤーの状態
export interface Player {
    id: string; // Persistent UUID
    socketId: string; // Ephemeral Socket ID (for communication)
    name: string;
    avatar: string; // 絵文字 (Fallback)
    avatarConfig?: AvatarConfig; // New Avatar System
    color: string; // プレイヤー識別カラー
    role: Role; // 本人には見えるが他プレイヤーには秘密
    hand: Card[];
    brokenTools: {
        pickaxe: boolean;
        lantern: boolean;
        cart: boolean;
    };
    brokenToolDetails: {
        pickaxe: string | null; // Breaker ID or Name
        lantern: string | null;
        cart: string | null;
    };
    score: number;
    difficulty?: BotDifficulty; // Bot Only
    stats?: PlayerStats; // Persistent statistics
}

export interface ChatMessage {
    id: string;
    senderId: string; // 'SYSTEM' for system messages
    senderName: string;
    text: string;
    timestamp: number;
    system?: boolean;
}

// 盤面のセル情報
export interface GridCell {
    card: PathCard;


    isReversed: boolean; // 上下逆さまかどうか
}

// Phase 13: Game Options// Botの難易度
export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

// ゲーム設定
export interface GameOptions {
    maxRounds: number;
    enableScore: boolean;
    botDifficulty: BotDifficulty; // デフォルト: 'NORMAL'
    roleConfig: {
        // 確定枠 (Fixed Slots) - 必ずこの数だけ入る
        fixed: {
            goldDiggers: number;
            saboteurs: number;
            selfishDwarves: number;
            geologists: number;
        };
        // ランダム枠 (Random Pool) - 余った枠を埋めるために使われる候補
        random: {
            goldDiggers: number;
            saboteurs: number;
            selfishDwarves: number;
            geologists: number;
        };
    };
    specialCardConfig: {
        dynamite: number;
        oracle: number;
        thief: number;
        trader: number;
        scavenger: number;
        doubleAction: number;
    }
}

// ゲームの状態
export interface GameState {
    players: Player[];
    grid: (GridCell | null)[]; // 1次元配列として扱い、インデックス計算は x + y * width で行う
    gridWidth: number; // 9
    gridHeight: number; // 5 (あるいは拡張性を考慮して広めにとる)

    deckCount: number;
    currentPlayerIndex: number;
    winner: Role | null;
    status: | 'LOBBY'
    | 'PLAYING'
    | 'WAITING_FOR_STONE_ACTION' // 石炭報酬のアクション選択待ち
    | 'ROUND_END'
    | 'GAME_END';

    // Phase 12: Round & Score
    currentRound: number; // 1-3
    maxRounds: number; // 3
    scores: { [playerId: string]: number };
    roundResult?: {
        winner: Role | 'DRAW';
        rewards: { [playerId: string]: number };
        goldDiggerCount: number; // 報酬分配計算用
    };
    options: GameOptions;
    suspicions?: Record<string, string[]>; // targetId -> voterIds[]
    readyPlayers?: string[]; // IDs of players who confirmed their role
    treasureLocs?: { x: number, y: number }[]; // 宝箱の位置
    discardPileTop?: Card; // 捨て札のトップ (スカベンジャー用)
}

// Socketイベントの定義
export interface ServerToClientEvents {
    roomUpdated: (data: { roomId: string, players: Player[], gameOptions: GameOptions }) => void;
    gameStarted: (initialState: GameState) => void;
    gameStateUpdated: (gameState: GameState) => void; // 差分更新用だが一旦全体送信
    playerRoleInfo: (role: Role) => void;
    actionResult: (data: { success: boolean, message?: string, mapResult?: 'GOLD' | 'STONE', privateMessage?: string }) => void; // 個人宛のアクション結果
    gameEnded: (result: { winner: Role | 'DRAW', scores?: { [id: string]: number }, isFinal?: boolean }) => void;
    roundEnded: (result: { winner: Role | 'DRAW', rewards: { [id: string]: number }, nextRound: number }) => void;
    emoteReceived: (data: { playerId: string, emoteId: string }) => void;
    chatMessage: (message: ChatMessage) => void;
    error: (message: string) => void;
    optionsUpdated: (options: GameOptions) => void;
    rejoinSuccess: (gameState: GameState) => void; // 再接続成功
    statsReceived: (stats: PlayerStats | null) => void; // 統計情報の送信
    allStatsReceived: (stats: PlayerStats[]) => void; // 全プレイヤーの統計情報の送信
}

export interface ClientToServerEvents {
    joinRoom: (roomId: string, playerName: string, avatar: string, userId?: string, avatarConfig?: AvatarConfig) => void; // Update joinRoom
    createRoom: (playerName: string, avatar: string, userId?: string, avatarConfig?: AvatarConfig) => void; // Update createRoom
    startGame: () => void;
    nextRound: () => void;
    playCard: (cardIndex: number, position?: { x: number, y: number, isReversed: boolean }, targetPlayerId?: string) => void;
    discardCard: (cardIndex: number) => void;
    addBot: (difficulty: BotDifficulty) => void;
    sendEmote: (emoteId: string) => void;
    chatMessage: (text: string) => void;
    updateOptions: (options: GameOptions) => void;
    voteSuspicion: (targetId: string) => void;
    roleConfirmed: () => void;
    rejoinRoom: (roomId: string, userId: string) => void; // 再接続リクエスト
    stoneAction: (targetId: string, actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART') => void;
    skipStoneAction: () => void;
    fetchStats: (name: string) => void; // 統計情報の取得
    fetchAllStats: () => void; // 全プレイヤーの統計情報を取得
}
