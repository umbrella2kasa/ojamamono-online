import { Player, GameState, Role, Card, PathCard, ActionCard, SpecialCard, GameOptions, BotDifficulty } from '@ojamamono/shared';
import { Server } from 'socket.io';
import { DeckFactory } from './DeckFactory';
import { GridManager } from './GridManager';
import { ActionManager } from './ActionManager';
import { BotLogic } from './BotLogic';
import { statsManager } from './StatsManager';

type ActionResult = { success: boolean, message?: string, mapResult?: 'GOLD' | 'STONE', privateMessage?: string, skipConsume?: boolean };
type RoomEventCallback = (event: string, data: any) => void;

export class Room {
    id: string;
    players: Player[] = [];
    gameState: GameState | null = null;
    hostId: string | null = null;
    gridManager: GridManager;
    private deck: Card[] = [];
    private specialDeck: Card[] = [];
    private discardPile: Card[] = [];
    private onEvent: RoomEventCallback | null = null;
    private options: GameOptions = {
        maxRounds: 3,
        enableScore: true,
        botDifficulty: 'NORMAL',
        roleConfig: {
            fixed: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 0, geologists: 0 },
            random: { goldDiggers: 0, saboteurs: 0, selfishDwarves: 0, geologists: 0 }
        },
        specialCardConfig: { dynamite: 1, oracle: 3, thief: 2, trader: 2, scavenger: 1, doubleAction: 1 }
    };
    public autoBotEnabled: boolean = false; // Botの自動実行制御用 (デフォルトOFF)

    get gameOptions(): GameOptions {
        return this.options;
    }

    constructor(id: string) {
        this.id = id;
        this.gridManager = new GridManager();
    }

    setEventCallback(callback: RoomEventCallback) {
        this.onEvent = callback;
    }

    private sendSystemMessage(text: string) {
        if (this.onEvent) {
            this.onEvent('chatMessage', {
                id: `sys-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'SYSTEM',
                text,
                timestamp: Date.now(),
                system: true
            });
        }
    }

    updateOptions(newOptions: GameOptions) {
        this.options = { ...this.options, ...newOptions };
        // Lobbyにいるプレイヤーに通知が必要だが、現状GameStartedまではGameStateが存在しないため、
        // optionsUpdatedイベントで通知する
        if (this.onEvent) {
            this.onEvent('optionsUpdated', this.options);
        }
    }

    // Bot追加
    addBot(difficulty: BotDifficulty = 'NORMAL') {
        if (this.gameState && this.gameState.status === 'PLAYING') return; // ゲーム中は追加不可

        // Date.now() だけでなく、ナノ秒レベルの精度（process.hrtimeなど）やカウンタを組み合わせるのが理想だが
        // ここでは簡単なランダム文字列とタイムスタンプの組み合わせを強化
        const randomStr = Math.random().toString(36).substring(2, 7);
        const botId = `bot-${Date.now()}-${randomStr}`;

        // 10パターンの名前プール
        const botNamesPool = [
            '炭鉱ロボ1号', '穴掘りくん', 'サボり魔', 'ドリル吉', 'ダイナマイト王',
            'モグラ先輩', 'ツルハシ次郎', 'ランプの精', 'トロッコ暴走族', '金塊ハンター'
        ];

        // 使用済みの名前（ベース部分）をカウント
        const usedNames = new Map<string, number>();
        this.players.forEach(p => {
            // 数字部分を除去してベース名を特定する簡易ロジック
            // 例: "穴掘りくん 2" -> "穴掘りくん"
            for (const baseName of botNamesPool) {
                if (p.name.startsWith(baseName)) {
                    const count = usedNames.get(baseName) || 0;
                    usedNames.set(baseName, count + 1);
                }
            }
        });

        // 最も使われていない名前候補を探す（ランダム性も持たせる）
        // 最小使用回数を探す
        let minCount = Infinity;
        botNamesPool.forEach(name => {
            const count = usedNames.get(name) || 0;
            if (count < minCount) minCount = count;
        });

        // 最小使用回数の名前リストを作成
        const candidates = botNamesPool.filter(name => (usedNames.get(name) || 0) === minCount);

        // 候補からランダムに選択
        const baseName = candidates[Math.floor(Math.random() * candidates.length)];
        const currentCount = usedNames.get(baseName) || 0;

        // 名前決定：2回目以降は数字をつける
        let botName = baseName;
        if (currentCount > 0) {
            botName = `${baseName} ${currentCount + 1}`;
        }

        const difficultyLabel = difficulty === 'HARD' ? ' (強)' : difficulty === 'EASY' ? ' (弱)' : '';
        botName = `${botName}${difficultyLabel}`; // 名前で強さがわかるようにする

        const bot = this.addPlayer(botId, botName, '🤖', `bot-socket-${botId}`);
        bot.difficulty = difficulty;
        this.autoBotEnabled = true; // Enable bot logic
    }

    addPlayer(id: string, name: string, avatar: string, socketId: string, avatarConfig?: any): Player {
        const colors = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'
        ];
        const color = colors[this.players.length % colors.length];

        const newPlayer: Player = {
            id,
            socketId,
            name,
            avatar,
            avatarConfig,
            color,
            role: 'GOLD_DIGGER',
            hand: [],
            brokenTools: {
                pickaxe: false,
                lantern: false,
                cart: false
            },
            brokenToolDetails: {
                pickaxe: null,
                lantern: null,
                cart: null
            },
            score: 0,
            difficulty: avatarConfig?.difficulty || undefined,
            stats: statsManager.getStats(name) || {
                name,
                roundWins: 0,
                roundPlayed: 0,
                gameWins: 0,
                gamePlayed: 0,
                totalGold: 0,
                lastSeen: Date.now()
            }
        };

        if (this.players.length === 0) {
            this.hostId = id;
        }

        this.players.push(newPlayer);
        return newPlayer;
    }

    updatePlayerSocket(playerId: string, newSocketId: string) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.socketId = newSocketId;
        }
    }

    removePlayer(id: string) {
        // ゲーム進行中の場合、gameStateも更新する必要がある
        if (this.gameState && this.gameState.status === 'PLAYING') {
            const index = this.players.findIndex(p => p.id === id);
            if (index !== -1) {
                // ターン管理の調整
                if (this.gameState.currentPlayerIndex > index) {
                    this.gameState.currentPlayerIndex--;
                } else if (this.gameState.currentPlayerIndex === index) {
                    // 自分のターンで抜けた場合、次の人（同じインデックス）に権利が移る
                    // ただし、最後の人が抜けた場合は0に戻る
                    if (this.gameState.currentPlayerIndex >= this.players.length - 1) {
                        this.gameState.currentPlayerIndex = 0;
                    }
                }
            }
        }

        this.players = this.players.filter(p => p.id !== id);

        // GameStateの参照も更新
        if (this.gameState) {
            this.gameState.players = this.players;
        }

        if (this.hostId === id && this.players.length > 0) {
            this.hostId = this.players[0].id;
        }
    }

    startGame() {
        if (this.players.length < 1) return;

        // init scores if not exists
        if (!this.gameState || !this.gameState.scores) {
            const initialScores: { [id: string]: number } = {};
            this.players.forEach(p => {
                initialScores[p.id] = 0;
            });
            this.gameState = { ...this.gameState, scores: initialScores } as GameState;
        }

        this.startRound(1);
    }

    startRound(round: number) {
        if (this.players.length < 1) return;

        // 1. 役割の割り振りと初期化
        this.assignRoles();

        // 2. 山札の生成
        this.deck = DeckFactory.createDeck(this.players.length);
        this.specialDeck = DeckFactory.createSpecialDeck(this.options.specialCardConfig);
        this.discardPile = [];
        console.log(`[Room] Deck created with ${this.deck.length} cards (expected: 71)`);

        // 3. 手札の配布
        let handSize = 6;
        const playerCount = this.players.length;
        if (playerCount >= 6 && playerCount <= 7) handSize = 5;
        if (playerCount >= 8) handSize = 4;

        this.players.forEach(player => {
            player.hand = [];
            for (let i = 0; i < handSize; i++) {
                if (this.deck.length > 0) {
                    const card = this.deck.pop();
                    if (card) player.hand.push(card);
                }
            }
            player.brokenTools = { pickaxe: false, lantern: false, cart: false };
            console.log(`[Room] Player ${player.name} dealt ${player.hand.length} cards:`,
                player.hand.map(c => c.type === 'PATH' ? `PATH(${c.id})` : `ACTION(${c.id.substring(0, 8)})`).join(', ')
            );
        });

        // 4. グリッドの初期化
        this.gridManager.initGrid();

        // 5. ゲーム状態更新
        const scores = this.gameState?.scores || {};
        // 初回などでscoresが空なら0で初期化
        this.players.forEach(p => {
            if (scores[p.id] === undefined) scores[p.id] = 0;
        });

        const startPlayerIndex = Math.floor(Math.random() * this.players.length);
        const treasureLocs = this.spawnTreasures();

        this.gameState = {
            players: this.players,
            grid: this.gridManager.grid,
            gridWidth: this.gridManager.width,
            gridHeight: this.gridManager.height,
            deckCount: this.deck.length,
            currentPlayerIndex: startPlayerIndex,
            winner: null,
            status: 'PLAYING',
            currentRound: round,
            maxRounds: this.options.maxRounds,
            scores: scores,
            options: this.options,
            treasureLocs,
            readyPlayers: this.players.filter(p => p.id.startsWith('bot-')).map(p => p.id) // Bots are always ready
        };

        if (this.onEvent) {
            this.onEvent('gameStarted', this.gameState);
        }

        this.checkBotTurn();
    }

    private assignRoles() {
        const playerCount = this.players.length;
        const config = this.options.roleConfig;

        // Check if config is effectively empty (all zeros) which implies "Default/Auto"
        const isConfigEmpty = !config || (
            config.fixed &&
            config.random &&
            Object.values(config.fixed).every(v => v === 0) &&
            Object.values(config.random).every(v => v === 0)
        );

        let roles: Role[] = [];

        if (config && config.fixed && !isConfigEmpty) {
            // New Advanced Configuration
            const fixed = config.fixed;
            const random = config.random;

            // 1. Fixed Slots (Guaranteed)
            for (let i = 0; i < fixed.goldDiggers; i++) roles.push('GOLD_DIGGER');
            for (let i = 0; i < fixed.saboteurs; i++) roles.push('SABOTEUR');
            for (let i = 0; i < fixed.selfishDwarves; i++) roles.push('SELFISH_DWARF');
            for (let i = 0; i < fixed.geologists; i++) roles.push('GEOLOGIST');

            // 2. Random Pool (Candidates for remaining slots)
            const randomPool: Role[] = [];
            if (random) {
                for (let i = 0; i < random.goldDiggers; i++) randomPool.push('GOLD_DIGGER');
                for (let i = 0; i < random.saboteurs; i++) randomPool.push('SABOTEUR');
                for (let i = 0; i < random.selfishDwarves; i++) randomPool.push('SELFISH_DWARF');
                for (let i = 0; i < random.geologists; i++) randomPool.push('GEOLOGIST');
            }

            // 3. Fill Remaining Slots
            const needed = Math.max(0, playerCount - roles.length);
            if (needed > 0) {
                // Shuffle Random Pool
                for (let i = randomPool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [randomPool[i], randomPool[j]] = [randomPool[j], randomPool[i]];
                }

                // Pick needed roles
                if (randomPool.length >= needed) {
                    roles.push(...randomPool.slice(0, needed));
                } else {
                    // Pool insufficient
                    roles.push(...randomPool);
                    const moreNeeded = playerCount - roles.length;
                    for (let i = 0; i < moreNeeded; i++) {
                        roles.push('GOLD_DIGGER');
                    }
                    console.warn('[Room] Random pool insufficient, filled with GOLD_DIGGER');
                }
            } else if (roles.length > playerCount) {
                // Determine if we should truncate or keep deck larger (Saboteur 2 style)
                // Current system assigns specific roles to properties `player.role`.
                // So we MUST strictly match playerCount for assignment 1-to-1.
                // However, real Saboteur rules involve dealing from a deck.
                // User requirement: "Fixed... Remaining... Random". Implies exact fit.

                // If Fixed > Players, we take a random subset of Fixed? Or error?
                // Let's truncate randomly for safety, but warn.
                console.warn('[Room] Fixed roles exceed player count. Truncating.');
                // We keep roles array as is, shuffling will handle who gets what, 
                // but effectively some "Fixed" roles become "Maybe".
                // But the code below only assigns `index < roles.length`. 
                // If roles.length > index, we are fine, we just discard extras.
            }

        } else {
            // ... (Simple default fallback if config is missing - unexpected)
            const roleDistribution: { [key: number]: { goldDiggers: number, saboteurs: number } } = {
                3: { goldDiggers: 3, saboteurs: 1 },
                4: { goldDiggers: 4, saboteurs: 1 },
                5: { goldDiggers: 4, saboteurs: 2 },
                6: { goldDiggers: 5, saboteurs: 2 },
                7: { goldDiggers: 5, saboteurs: 3 },
                8: { goldDiggers: 6, saboteurs: 3 },
                9: { goldDiggers: 7, saboteurs: 3 },
                10: { goldDiggers: 7, saboteurs: 4 }
            };

            const distribution = roleDistribution[playerCount] || { goldDiggers: Math.max(1, playerCount - 1), saboteurs: 1 };
            for (let i = 0; i < distribution.saboteurs; i++) roles.push('SABOTEUR');
            for (let i = 0; i < distribution.goldDiggers; i++) roles.push('GOLD_DIGGER');
        }

        // Shuffle deck
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        // Assign to players
        this.players.forEach((player, index) => {
            player.role = roles[index] || 'GOLD_DIGGER'; // Fallback logic
        });

        console.log(`[Room] Assigned roles from pool of ${roles.length} for ${playerCount} players.`);
    }

    // カードプレイ処理
    handlePlayCard(playerId: string, cardIndex: number, pos: { x: number, y: number, isReversed: boolean }, targetPlayerId?: string): ActionResult {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return { success: false, message: 'ゲームは進行中ではありません' };

        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return { success: false, message: 'プレイヤーが見つかりません' };

        // ターンチェック
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { success: false, message: 'あなたのターンではありません' };

        // カード所持チェック
        if (cardIndex < 0 || cardIndex >= player.hand.length) return { success: false, message: '無効なカードです' };
        const card = player.hand[cardIndex];

        let result: ActionResult = { success: false };

        // 配置ロジック
        if (card.type === 'PATH') {
            // 道具破壊チェック
            if (player.brokenTools.pickaxe || player.brokenTools.lantern || player.brokenTools.cart) {
                return { success: false, message: '道具が壊れているため通路カードを置けません' };
            }

            if (this.gridManager.placeCard(pos.x, pos.y, card as PathCard, pos.isReversed)) {
                result = { success: true };

                // ゴール到達判定
                const reachedGoals = this.gridManager.findReachableGoals();
                for (const goalPos of reachedGoals) {
                    const goalType = this.gridManager.revealGoal(goalPos.x, goalPos.y);
                    if (goalType === 'GOLD') {
                        // Check who placed it
                        if (player.role === 'SELFISH_DWARF') {
                            this.finishRound('SELFISH_DWARF');
                        } else {
                            this.finishRound('GOLD_DIGGER');
                        }
                        result.message = '金塊を発見しました！';
                    }
                }
            } else {
                const validation = this.gridManager.validatePlacement(pos.x, pos.y, card as PathCard, pos.isReversed);
                return { success: false, message: `配置できません: ${validation.reason || '不明なエラー'}` };
            }
        } else if (card.type === 'ACTION') {
            const actionResult = ActionManager.handleAction(
                this.gameState,
                this.gameState.currentPlayerIndex,
                card as ActionCard,
                targetPlayerId,
                pos,
                this.gridManager
            );

            if (actionResult.success) {
                // アクション成功時のメッセージ通知
                let actionMsg = '';
                const targetPlayer = targetPlayerId ? this.gameState.players.find(p => p.id === targetPlayerId) : null;
                const targetName = targetPlayer ? targetPlayer.name : '誰か';
                const actorName = player.name;

                const getToolName = (type: string) => {
                    if (type.includes('PICKAXE')) return 'つるはし';
                    if (type.includes('LANTERN')) return 'ランプ';
                    if (type.includes('CART')) return 'トロッコ';
                    return '道具';
                };

                if (actionMsg) {
                    this.sendSystemMessage(actionMsg);
                }

                result = { success: true, mapResult: actionResult.mapResult as 'GOLD' | 'STONE' };
            } else {
                return { success: false, message: actionResult.message };
            }
        } else if (card.type === 'SPECIAL') {
            const specialCard = card as SpecialCard;
            result = this.handleSpecialCard(player, specialCard, pos, targetPlayerId, cardIndex);
        } else {
            return { success: false, message: 'Unknown card type' };
        }

        // 成功時の共通処理
        if (result.success) {
            if (!result.skipConsume) {
                const usedCard = this.consumeCardAndDraw(player, cardIndex);
                if (usedCard && card.type !== 'PATH') {
                    this.discardPile.push(usedCard);
                    if (this.gameState) {
                        this.gameState.discardPileTop = usedCard;
                    }
                }
            }

            // Path配置時のみ宝箱チェック
            if (card.type === 'PATH' && pos) {
                const obtainedCard = this.checkTreasure(pos.x, pos.y, player);
                if (obtainedCard) {
                    const nameMap: { [key: string]: string } = {
                        'DYNAMITE': 'ダイナマイト',
                        'ORACLE': '真実の鏡',
                        'THIEF': '泥棒',
                        'TRADER': '交換屋',
                        'SCAVENGER': 'スカベンジャー',
                        'DOUBLE_ACTION': 'ダブルアクション'
                    };
                    const cardName = nameMap[obtainedCard.specialAction] || obtainedCard.specialAction;
                    result.privateMessage = (result.privateMessage ? result.privateMessage + '\n' : '') +
                        `宝箱からスペシャルカード【${cardName}】を獲得しました！手札を確認してください。`;
                }
            }

            // 石炭報酬チェック (PATH配置かつSTONE到達時のみ)
            if (card.type === 'PATH' && result.mapResult === 'STONE') {
                // スコア+1
                if (!this.gameState.scores[playerId]) this.gameState.scores[playerId] = 0;
                this.gameState.scores[playerId] += 1;

                // システムメッセージ
                this.sendSystemMessage(`💎 ${player.name} が石炭を発見！ボーナス(+1点)を獲得し、追加アクションを選択します。`);

                // ステート変更
                this.gameState.status = 'WAITING_FOR_STONE_ACTION';

                // クライアントに通知 (全員にステート更新、対象者にはアクション要求)
                if (this.onEvent) {
                    this.onEvent('gameStateUpdated', this.gameState);
                    this.onEvent('stoneActionRequired', { playerId: playerId });
                }

                // ターンを進めずにリターン (アクション待ち)
                return result;
            }

            this.advanceTurn();
        }

        return result;
    }

    discardCard(playerId: string, cardIndex: number): boolean {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return false;

        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return false;

        // ターンチェック
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return false;

        if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

        // 捨てる
        const discardedCard = this.consumeCardAndDraw(player, cardIndex);
        if (discardedCard) {
            this.discardPile.push(discardedCard);
            if (this.gameState) {
                this.gameState.discardPileTop = discardedCard;
            }
        }
        this.advanceTurn();

        return true;
    }

    private consumeCardAndDraw(player: Player, cardIndex: number): Card | undefined {
        const removedCards = player.hand.splice(cardIndex, 1);
        const removedCard = removedCards.length > 0 ? removedCards[0] : undefined;

        if (this.deck.length > 0) {
            const newCard = this.deck.pop();
            if (newCard) {
                player.hand.push(newCard);
            }
            if (this.gameState) {
                this.gameState.deckCount = this.deck.length;
            }
        }
        return removedCard;
    }

    public advanceTurn() {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return;

        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;

        const allHandsEmpty = this.gameState.players.every(p => p.hand.length === 0);
        if (this.deck.length === 0 && allHandsEmpty) {
            this.finishRound('SABOTEUR');
        } else {
            this.checkBotTurn();
        }
    }

    private finishRound(winner: 'GOLD_DIGGER' | 'SABOTEUR' | 'SELFISH_DWARF' | 'GEOLOGIST_ONLY') {
        if (!this.gameState) return;

        // 報酬計算
        const rewards: { [id: string]: number } = {};
        const goldDiggers = this.gameState.players.filter(p => p.role === 'GOLD_DIGGER');
        const saboteurs = this.gameState.players.filter(p => p.role === 'SABOTEUR');
        const selfishDwarves = this.gameState.players.filter(p => p.role === 'SELFISH_DWARF');
        const geologists = this.gameState.players.filter(p => p.role === 'GEOLOGIST');

        // Initialize to 0
        this.gameState.players.forEach(p => rewards[p.id] = 0);

        let goldDiggerCount = goldDiggers.length;

        if (winner === 'SELFISH_DWARF') {
            // Selfish Dwarf Wins Alone: 5 points
            const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
            if (currentPlayer && currentPlayer.role === 'SELFISH_DWARF') {
                rewards[currentPlayer.id] = 5;
            } else {
                selfishDwarves.forEach(p => rewards[p.id] = 5);
            }
        } else if (winner === 'GOLD_DIGGER') {
            // 金鉱掘り勝利: 全員+3点
            goldDiggers.forEach(p => rewards[p.id] = 3);
        } else {
            // お邪魔者勝利
            let points = 3;
            if (saboteurs.length === 1) points = 4;
            saboteurs.forEach(p => rewards[p.id] = points);
        }

        // --- Geologist Scoring ---
        // Count crystals on the board
        let crystalCount = 0;
        this.gridManager.grid.forEach(cell => {
            if (cell && cell.card.hasCrystal) {
                crystalCount++;
            }
        });

        if (geologists.length > 0 && crystalCount > 0) {
            const totalGeoPoints = Math.floor(crystalCount * 0.5);
            const pointsPerGeologist = Math.floor(totalGeoPoints / geologists.length);
            if (pointsPerGeologist > 0) {
                geologists.forEach(p => rewards[p.id] = pointsPerGeologist);
            }
        }

        // スコア更新
        Object.entries(rewards).forEach(([id, point]) => {
            if (this.gameState!.scores[id] !== undefined) {
                this.gameState!.scores[id] += point;
            } else {
                this.gameState!.scores[id] = point;
            }
        });

        // --- 統計情報の記録 (Stats Recording) ---
        this.players.forEach(p => {
            if (p.id.startsWith('bot-')) return;

            // ラウンド単体の勝ち負け
            const isRoundWin = (rewards[p.id] || 0) > 0;
            // 獲得ゴールド
            const goldEarned = rewards[p.id] || 0;

            statsManager.recordRoundResult(p.name, isRoundWin, goldEarned);
        });

        this.gameState.status = 'ROUND_END';
        this.gameState.winner = winner as any;
        this.gameState.roundResult = {
            winner: winner as any,
            rewards,
            goldDiggerCount
        };

        const isFinal = this.gameState.currentRound >= this.gameState.maxRounds;
        if (isFinal) {
            this.gameState.status = 'GAME_END';

            // ゲーム全体の勝敗記録
            const maxScore = Math.max(...Object.values(this.gameState.scores));
            if (maxScore > 0) {
                this.players.forEach(p => {
                    if (p.id.startsWith('bot-')) return;
                    const isGameWin = this.gameState!.scores[p.id] === maxScore;
                    statsManager.recordGameResult(p.name, isGameWin);
                });
            }
        }

        if (this.onEvent) {
            if (isFinal) {
                this.onEvent('gameEnded', { winner: winner as any, scores: this.gameState.scores, isFinal: true });
            } else {
                this.onEvent('roundEnded', { winner: winner as any, rewards, nextRound: this.gameState.currentRound + 1 });
            }
        }
    }

    nextRound() {
        if (!this.gameState) return;
        if (this.gameState.currentRound < this.gameState.maxRounds) {
            this.startRound(this.gameState.currentRound + 1);
        }
    }

    /* Deprecated but kept for compatibility logic inside startRound */
    private finishGame(winner: 'GOLD_DIGGER' | 'SABOTEUR') {
        this.finishRound(winner);
    }

    toggleSuspicion(voterId: string, targetId: string) {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return;

        if (!this.gameState.suspicions) {
            this.gameState.suspicions = {};
        }

        if (!this.gameState.suspicions[targetId]) {
            this.gameState.suspicions[targetId] = [];
        }

        const voters = this.gameState.suspicions[targetId];
        const existingIndex = voters.indexOf(voterId);

        if (existingIndex !== -1) {
            voters.splice(existingIndex, 1);
        } else {
            voters.push(voterId);
        }

        if (this.onEvent) {
            this.onEvent('gameStateUpdated', this.gameState);
        }
    }

    // 役割確認
    confirmRole(playerId: string) {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return;

        if (!this.gameState.readyPlayers) {
            this.gameState.readyPlayers = [];
        }

        if (!this.gameState.readyPlayers.includes(playerId)) {
            this.gameState.readyPlayers.push(playerId);
        }

        // 全員チェック
        const allReady = this.players.every(p =>
            this.gameState!.readyPlayers!.includes(p.id) || p.id.startsWith('bot-') // Botは自動OKとみなす
        );

        // まだ全員揃ってない場合でも、readyPlayersの更新通知は必要
        if (this.onEvent) {
            this.onEvent('gameStateUpdated', this.gameState);
        }

        // 全員揃ったらここで何か特別なイベントを出すか、あるいはクライアント側で
        // 「全員readyになった」ことを検知してオーバーレイを消すか。
        // シンプルにするため、GameStateのreadyPlayersを見てクライアントが判断する形にする。
    }

    // Existing checkBotTurn or other methods...
    private checkBotTurn() {
        if (!this.autoBotEnabled) return;
        if (!this.gameState || this.gameState.status !== 'PLAYING') return;

        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];

        // Bot判定 (IDが 'bot-' で始まる)
        if (currentPlayer.id.startsWith('bot-')) {
            setTimeout(() => {
                this.processBotTurn(currentPlayer);
            }, 1000); // 1秒待ってから行動
        }
    }

    public processBotTurn(bot: Player) {
        if (!this.gameState || this.gameState.status !== 'PLAYING') return;

        try {
            // console.log(`Bot ${bot.name} thinking...`);

            if (bot.hand.length === 0) {
                // console.log(`Bot ${bot.name} has no cards, skipping turn.`);
                this.advanceTurn();
                return;
            }

            const action = BotLogic.decideAction(this.gameState, this.gameState.currentPlayerIndex, this.gridManager);

            if (action.type === 'PLAY_CARD') {
                const result = this.handlePlayCard(
                    bot.id,
                    action.cardIndex,
                    action.pos || { x: 0, y: 0, isReversed: false },
                    action.targetPlayerId
                );

                if (result.success) {
                    if (this.onEvent) {
                        this.onEvent('gameStateUpdated', this.gameState);
                    }
                } else {
                    // console.warn(`Bot ${bot.name} action failed: ${result.message}, discarding.`);
                    const skipSuccess = this.discardCard(bot.id, 0);
                    if (!skipSuccess) {
                        // どうしても失敗する場合（手札がないなど）は強制的にターンを回す
                        this.advanceTurn();
                    }
                    if (this.onEvent) this.onEvent('gameStateUpdated', this.gameState);
                }
            } else {
                // Discard
                const skipSuccess = this.discardCard(bot.id, action.cardIndex);
                if (!skipSuccess) {
                    this.advanceTurn();
                }
                if (this.onEvent) {
                    this.onEvent('gameStateUpdated', this.gameState);
                }
            }
        } catch (error) {
            console.error('CRITICAL: Bot process turn error:', error);
            // エラーが発生してもターンを止めてはいけない
            this.advanceTurn();
            if (this.onEvent && this.gameState) {
                this.onEvent('gameStateUpdated', this.gameState);
            }
        }
    }




    private spawnTreasures() {
        const treasures: { x: number, y: number }[] = [];
        let attempts = 0;

        // Start: (2, 4)
        // Goal: (10, 2), (10, 4), (10, 6)
        // Avoid straight line (y=4) and near start (x<=3)
        // Safe X: 4 to 9
        // Safe Y: Anything except 4
        const safeXMin = 4;
        const safeXMax = 9;

        // 宝箱は1個か2個 (ランダム)
        const treasureCount = Math.random() < 0.6 ? 1 : 2;

        while (treasures.length < treasureCount && attempts < 100) {
            const x = Math.floor(Math.random() * (safeXMax - safeXMin + 1)) + safeXMin;
            const y = Math.floor(Math.random() * this.gridManager.height);

            // Avoid straight line between start and middle goal
            if (y === 4) {
                attempts++;
                continue;
            }

            // 既に何かが埋まっている場所は避ける
            if (treasures.some(t => t.x === x && t.y === y)) {
                attempts++;
                continue;
            }

            // 既存の宝箱から距離を離す (マンハッタン距離 >= 3)
            if (treasures.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) < 3)) {
                attempts++;
                continue;
            }

            treasures.push({ x, y });
            attempts++;
        }
        console.log(`[Room] Spawned ${treasures.length} treasures at:`, treasures);
        return treasures;
    }

    private checkTreasure(x: number, y: number, player: Player): SpecialCard | null {
        if (!this.gameState || !this.gameState.treasureLocs) return null;

        const index = this.gameState.treasureLocs.findIndex(t => t.x === x && t.y === y);
        if (index !== -1) {
            this.gameState.treasureLocs.splice(index, 1);
            console.log(`[Room] Treasure found at (${x}, ${y}) by ${player.name}`);
            return this.drawSpecialCard(player);
        }
        return null;
    }

    private drawSpecialCard(player: Player): SpecialCard | null {
        // スペシャルカードの所持上限チェック (1枚)
        const hasSpecial = player.hand.some(c => c.type === 'SPECIAL');
        if (hasSpecial) {
            this.sendSystemMessage(`${player.name} は既にスペシャルカードを持っているため、宝箱を空けられませんでした`);
            return null;
        }

        if (this.specialDeck.length === 0) {
            this.sendSystemMessage('スペシャルデッキは空です');
            console.warn('[Room] Special deck is empty!');
            return null;
        }
        const card = this.specialDeck.pop();
        if (card) {
            player.hand.push(card);
            console.log(`[Room] Dealt special card ${(card as SpecialCard).specialAction} to ${player.name}`);
            this.sendSystemMessage(`🎁 ${player.name} が宝箱からスペシャルカードを獲得しました！`);
            if (this.onEvent) {
                this.onEvent('gameStateUpdated', this.gameState);
            }
            return card as SpecialCard;
        }
        return null;
    }

    private handleSpecialCard(player: Player, card: SpecialCard, pos: { x: number, y: number, isReversed: boolean } | undefined, targetPlayerId: string | undefined, cardIndex: number): ActionResult {
        if (!this.gameState) return { success: false, message: 'Game state missing' };

        switch (card.specialAction) {
            case 'DYNAMITE': {
                if (!pos) return { success: false, message: 'Position required' };
                // 3x3を破壊 (Start/Goalは不可)
                let destroyedCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tx = pos.x + dx;
                        const ty = pos.y + dy;
                        const cell = this.gridManager.get(tx, ty);

                        // Start/Goalは破壊不可
                        // 空セルは対象外
                        if (cell && !cell.card.isStart && !cell.card.isGoal) {
                            this.gridManager.removeCard(tx, ty);
                            destroyedCount++;
                        }
                    }
                }

                if (destroyedCount > 0) {
                    return { success: true, message: `💣 ${player.name} がダイナマイトを使用し、${destroyedCount}枚の通路を破壊しました！` };
                } else {
                    return { success: true, message: `💣 ${player.name} がダイナマイトを使用しましたが、何も起きませんでした...` };
                }
            }
            case 'ORACLE': {
                if (!targetPlayerId) return { success: false, message: 'Target required' };
                const target = this.gameState.players.find(p => p.id === targetPlayerId);
                if (!target) return { success: false, message: 'Target not found' };

                if (target.id === player.id) return { success: false, message: '自分自身には使えません' };

                const roleName = target.role === 'GOLD_DIGGER' ? '金鉱掘り' :
                    target.role === 'SABOTEUR' ? 'お邪魔もの' :
                        target.role === 'GEOLOGIST' ? '地質学者' :
                            target.role === 'SELFISH_DWARF' ? 'わがままドワーフ' : target.role;

                return {
                    success: true,
                    message: `🔮 ${player.name} が ${target.name} に真実の鏡を使用しました！`,
                    privateMessage: `🔍 ${target.name} の正体は【${roleName}】です。`
                };
            }
            case 'THIEF': {
                if (!targetPlayerId) return { success: false, message: 'Target required' };
                const target = this.gameState.players.find(p => p.id === targetPlayerId);
                if (!target) return { success: false, message: 'Target not found' };
                if (target.id === player.id) return { success: false, message: '自分自身には使えません' };

                // 相手のスコアを奪う (1点)
                if (target.score > 0) {
                    target.score -= 1;
                    player.score += 1;
                    return { success: true, message: `🕵️ ${player.name} が ${target.name} から金塊を1つ盗みました！` };
                } else {
                    return { success: true, message: `🕵️ ${player.name} は ${target.name} から盗もうとしましたが、何も持っていませんでした... (空振り)` };
                }
            }
            case 'TRADER': {
                if (!targetPlayerId) return { success: false, message: 'Target required' };
                const target = this.gameState.players.find(p => p.id === targetPlayerId);
                if (!target) return { success: false, message: 'Target not found' };
                if (target.id === player.id) return { success: false, message: '自分自身には使えません' };

                // 1. Traderカード自体を捨て札にする (手札から削除)
                const removedCards = player.hand.splice(cardIndex, 1);
                if (removedCards.length > 0) {
                    this.discardPile.push(removedCards[0]);
                }

                // 2. 山札から1枚引く
                if (this.deck.length > 0) {
                    const newCard = this.deck.pop();
                    if (newCard) player.hand.push(newCard);
                }

                // 3. 手札交換
                const tempHand = [...player.hand];
                player.hand = [...target.hand];
                target.hand = tempHand;

                // 4. consumeCardAndDrawをスキップ
                return { success: true, message: `🔄 ${player.name} が ${target.name} と手札を交換しました！`, skipConsume: true };
            }
            case 'DOUBLE_ACTION': {
                const numPlayers = this.gameState.players.length;
                this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex - 1 + numPlayers) % numPlayers;
                return { success: true, message: `⚡ ${player.name} は連続行動します！` };
            }
            case 'SCAVENGER': {
                // 仮実装: 捨て札の一番上を拾う
                if (this.discardPile.length === 0) {
                    return { success: false, message: '捨て札がありません' };
                }
                const scavengedCard = this.discardPile.pop();
                if (scavengedCard) {
                    player.hand.push(scavengedCard);

                    const removedScavenger = player.hand.splice(cardIndex, 1);
                    if (removedScavenger.length > 0) this.discardPile.push(removedScavenger[0]);

                    return { success: true, message: `♻️ ${player.name} が捨て札からカードを回収しました！`, skipConsume: true };
                } else {
                    return { success: false, message: 'Failed to scavenge' };
                }
            }
            default:
                return { success: false, message: 'Unknown special action' };
        }
    }

    handleStoneAction(playerId: string, targetId: string, actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART'): boolean {
        // ... (existing logic)
        return false;
    }

    skipStoneAction(playerId: string): boolean {
        if (!this.gameState || this.gameState.status !== 'WAITING_FOR_STONE_ACTION') return false;

        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return false;

        this.gameState.status = 'PLAYING';
        this.sendSystemMessage(`💎 ${currentPlayer.name} はボーナスアクションを行いませんでした。`);

        if (this.onEvent) {
            this.onEvent('gameStateUpdated', this.gameState);
        }

        this.advanceTurn();
        // Botの手番チェックを追加
        this.checkBotTurn();
        return true;
    }
}
