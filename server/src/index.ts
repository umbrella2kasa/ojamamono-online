import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ClientToServerEvents, ServerToClientEvents } from '@ojamamono/shared';
import { Room } from './game/Room';
import { SpectatorSimulation } from './game/SpectatorSimulation';
import { RoomManager } from './game/RoomManager';
import { statsManager } from './game/StatsManager';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map<string, Room>();
const socketToUserId = new Map<string, string>();

// const roomManager = new RoomManager(io); // Removed invalid usage

// Initialize Spectator Simulation
const spectatorSim = new SpectatorSimulation(io);
// spectatorSim.startLoop(500); // 0.5 second per turn for faster verification

io.on('connection', (socket) => {
    console.log(`[${new Date().toLocaleTimeString()}] User connected: ${socket.id}`);

    // Clean up on disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        console.log(`User disconnected: ${socket.id}`);
        // roomManager.handleDisconnect(socket.id); // Removed invalid usage
        const userId = socketToUserId.get(socket.id);
        if (userId) {
            socketToUserId.delete(socket.id);
            // Handle room cleanup if needed
        }
    });

    // --- Spectator Mode ---
    socket.on('joinSpectator' as any, () => {
        console.log(`Socket ${socket.id} joining spectator mode`);
        spectatorSim.addSpectator(socket);
    });

    // --- Statistics ---
    socket.on('fetchStats' as any, (name: string) => {
        const stats = statsManager.getStats(name);
        (socket as any).emit('statsReceived', stats);
    });

    socket.on('fetchAllStats' as any, () => {
        const allStats = statsManager.getAllStats();
        (socket as any).emit('allStatsReceived', allStats);
    });

    // --- Room Management ---
    // 部屋作成
    // 部屋作成
    socket.on('createRoom', (playerName, avatar, userId, avatarConfig) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const finalUserId = userId || Math.random().toString(36).substring(2);

        const room = new Room(roomId);
        // Event callback for Room internal events
        room.setEventCallback((event, data) => {
            io.to(roomId).emit(event as any, data);
        });

        rooms.set(roomId, room);

        const player = room.addPlayer(finalUserId, playerName, avatar, socket.id, avatarConfig);
        socketToUserId.set(socket.id, finalUserId);

        socket.join(roomId);
        socket.emit('roomUpdated', { roomId: roomId, players: room.players, gameOptions: room.gameOptions });

        console.log(`Room created: ${roomId} by ${playerName} (UUID: ${finalUserId})`);

        // システムメッセージ
        const msg = {
            id: Math.random().toString(36).substring(2),
            senderId: 'SYSTEM',
            senderName: 'SYSTEM',
            text: `ルーム ${roomId} が作成されました`,
            timestamp: Date.now(),
            system: true
        };
        io.to(roomId).emit('chatMessage', msg);
    });

    // 部屋参加
    socket.on('joinRoom', (roomId, playerName, avatar, userId, avatarConfig) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '部屋が見つかりません');
            return;
        }

        if (room.gameState && room.gameState.status === 'PLAYING') {
            socket.emit('error', 'ゲーム進行中です');
            return;
        }

        const finalUserId = userId || Math.random().toString(36).substring(2);

        // 既に同じUUIDのプレイヤーがいるか確認（二重参加防止）
        if (room.players.some(p => p.id === finalUserId)) {
            socket.emit('error', '既に参加しています');
            return;
        }

        const player = room.addPlayer(finalUserId, playerName, avatar, socket.id, avatarConfig);
        socketToUserId.set(socket.id, finalUserId);
        socket.join(roomId);

        io.to(roomId).emit('roomUpdated', { roomId: roomId, players: room.players, gameOptions: room.gameOptions });
        console.log(`User ${playerName} joined room ${roomId} (UUID: ${finalUserId})`);

        // システムメッセージ
        const msg = {
            id: Math.random().toString(36).substring(2),
            senderId: 'SYSTEM',
            senderName: 'SYSTEM',
            text: `${playerName} が参加しました`,
            timestamp: Date.now(),
            system: true
        };
        io.to(roomId).emit('chatMessage', msg);
    });

    // 再接続
    socket.on('rejoinRoom', (roomId, userId) => {
        const room = rooms.get(roomId);
        if (!room) {
            // 部屋がもうない場合
            socket.emit('error', '部屋が見つかりません（終了した可能性があります）');
            return;
        }

        const player = room.players.find(p => p.id === userId);
        if (!player) {
            socket.emit('error', 'プレイヤー情報が見つかりません');
            return;
        }

        // Socket更新
        room.updatePlayerSocket(userId, socket.id);
        socketToUserId.set(socket.id, userId);
        socket.join(roomId);

        console.log(`User ${player.name} reconnected to room ${roomId} (UUID: ${userId})`);

        // 状態送信
        if (room.gameState) {
            socket.emit('rejoinSuccess', room.gameState);
            socket.emit('playerRoleInfo', player.role); // 役割も再送
        } else {
            // ロビー状態
            socket.emit('roomUpdated', { roomId: roomId, players: room.players, gameOptions: room.gameOptions });
        }
    });

    // Bot追加
    socket.on('addBot', () => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        // socket.roomsからroomIdを探すロジックは維持してもいいが、
        // rooms mapから探すほうが確実かも？まあ現状で動くなら維持。
        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (room && room.hostId === userId) {
            room.addBot();
            io.to(roomId).emit('roomUpdated', { roomId: roomId, players: room.players, gameOptions: room.gameOptions });
            console.log(`Bot added to room ${roomId}`);
        }
    });

    // オプション更新
    socket.on('updateOptions', (options) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        if (room.hostId !== userId) {
            socket.emit('error', 'ホストのみ設定を変更できます');
            return;
        }

        room.updateOptions(options);
    });

    // ゲーム開始
    socket.on('startGame', () => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);

        if (!room) return;
        if (room.hostId !== userId) {
            socket.emit('error', 'ホストのみゲームを開始できます');
            return;
        }

        room.startGame();
        io.to(room.id).emit('gameStarted', room.gameState!);

        // 各プレイヤーに役割通知
        room.players.forEach(p => {
            // socketIdを使って個別に通知
            // BotはsocketIdを持たない（bot-...）のでスキップ
            if (!p.id.startsWith('bot-')) {
                io.to(p.socketId).emit('playerRoleInfo', p.role);
            }
        });

        console.log(`Game started in room ${room.id}`);
    });

    // 次のラウンドへ
    socket.on('nextRound', () => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        if (room.hostId !== userId) {
            socket.emit('error', 'ホストのみ次のラウンドを開始できます');
            return;
        }

        room.nextRound();

        // 役割再通知 (ラウンドごとに変わるため)
        room.players.forEach(p => {
            if (!p.id.startsWith('bot-')) {
                io.to(p.socketId).emit('playerRoleInfo', p.role);
            }
        });

        console.log(`Next round started in room ${room.id}`);
    });

    // カードプレイ
    socket.on('playCard', (cardIndex, pos, targetPlayerId) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        const position = pos ? { ...pos, isReversed: (pos as any).isReversed || false } : { x: 0, y: 0, isReversed: false };

        // カード情報を取得（プレイ後は消える可能性があるため先に取得するか、handlePlayCardの戻り値に含めるのが理想だが、ここでは簡易的に取得）
        const player = room.players.find(p => p.id === userId);
        const playedCard = player?.hand[cardIndex]; // Note: handlePlayCard will remove this from hand usually

        const result = room.handlePlayCard(userId, cardIndex, position, targetPlayerId);

        if (result.success) {
            // 全員に更新通知
            io.to(room.id).emit('gameStarted', room.gameState!);

            // アクションの詳細を全員に通知（演出用）
            if (playedCard) {
                io.to(room.id).emit('actionPerformed' as any, {
                    playerId: userId,
                    cardType: playedCard.type,
                    // @ts-ignore
                    actionType: playedCard.actionType,
                    position: position,
                    targetPlayerId: targetPlayerId
                });
            }

            // アクション結果を本人に通知
            // アクション結果を本人に通知
            socket.emit('actionResult', {
                success: true,
                mapResult: result.mapResult,
                privateMessage: result.privateMessage,
                message: result.message
            } as any); // Type definition update needed in shared if strict

            // 勝敗判定
            if (room.gameState!.status === 'GAME_END' && room.gameState!.winner) {
                io.to(room.id).emit('gameEnded', { winner: room.gameState!.winner, scores: room.gameState!.scores, isFinal: true });
            } else if (room.gameState!.status === 'ROUND_END') {
                // ラウンド終了は handlePlayCard 内で状態変更されるが、通知はここか？
                // Room.tsを見る限り、ラウンド終了判定ロジックで直接callbackなどは呼んでいないため、
                // ここで checkRoundEnd を呼ぶか、Room.ts側で自動判定しているか確認が必要。
                // 現状の実装では handlePlayCard -> nextTurn -> checkGameEnd/RoundEnd と動いているはず。
            }
        } else {
            socket.emit('error', result.message || 'カードを置けません');
        }
    });

    // カード破棄（パス）
    socket.on('discardCard', (cardIndex) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        if (room.discardCard(userId, cardIndex)) {
            io.to(room.id).emit('gameStarted', room.gameState!);

            if (room.gameState!.status === 'GAME_END' && room.gameState!.winner) {
                io.to(room.id).emit('gameEnded', { winner: room.gameState!.winner, scores: room.gameState!.scores, isFinal: true });
            }
        } else {
            socket.emit('error', 'カードを捨てられません');
        }
    });

    // エモート送信
    socket.on('sendEmote', (emoteId) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;

        // 全員に転送 (Sender IDは UUID)
        io.to(roomId).emit('emoteReceived', { playerId: userId, emoteId });
    });

    // チャット送信
    socket.on('chatMessage', (text) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === userId);
        if (!player) return;

        const msg = {
            id: Math.random().toString(36).substring(2),
            senderId: player.id,
            senderName: player.name,
            text: text,
            timestamp: Date.now(),
            system: false
        };
        io.to(roomId).emit('chatMessage', msg);
    });

    // 疑惑投票
    socket.on('voteSuspicion', (targetId) => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (room && room.gameState?.status === 'PLAYING') {
            room.toggleSuspicion(userId, targetId);
        }
    });

    // 役割確認完了
    socket.on('roleConfirmed', () => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (room) {
            room.confirmRole(userId);
        }
    });

    // 石炭報酬（ボーナスアクション）
    (socket as any).on('stoneAction', (targetId: string, actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART') => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (room && room.handleStoneAction(userId, targetId, actionType, toolType)) {
            io.to(room.id).emit('gameStarted', room.gameState!);
        }
    });

    (socket as any).on('skipStoneAction', () => {
        const userId = socketToUserId.get(socket.id);
        if (!userId) return;

        const socketRooms = Array.from(socket.rooms);
        const roomId = socketRooms.find(r => r !== socket.id);
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (room && room.skipStoneAction(userId)) {
            io.to(room.id).emit('gameStarted', room.gameState!);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const userId = socketToUserId.get(socket.id);
        socketToUserId.delete(socket.id); // マッピング解除

        // 再接続のために、即座には部屋から削除しない
        // 一定時間経過後に掃除するロジックが必要だが、今回は簡易実装のため
        // 「何もしない」(=ゾンビ化するが、再接続くれば復活)
        /*
        rooms.forEach((room, roomId) => {
            const player = room.players.find(p => p.id === userId); // IDで検索
             // 切断処理をどうするか？
             // 完全に抜けさせるUIが必要かもしれない
        });
        */
    });
});


const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
