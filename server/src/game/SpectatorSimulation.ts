
import { Room } from '../game/Room';
import { Player, Role, GameState, GameOptions } from '@ojamamono/shared';
import { BotLogic } from '../game/BotLogic';
import { Server, Socket } from 'socket.io';

// Spectator Simulation Runner
export class SpectatorSimulation {
    private room: Room;
    private io: Server;
    private roomId: string = 'spectate_room';
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(io: Server) {
        this.io = io;
        this.room = new Room(this.roomId);
        // Set event callback to send to Socket.IO room
        this.room.setEventCallback((event, data) => {
            if (event === 'gameStarted' || event === 'gameStateUpdated') {
                this.io.to(this.roomId).emit(event, data);
            }
            // For now, simpler broadcast in simulator
            this.io.to(this.roomId).emit(event as any, data);
        });

        this.setupGame();
    }

    private setupGame() {
        console.log("Setting up Spectator Game...");
        // Add 5 Bots
        for (let i = 0; i < 5; i++) {
            this.room.addBot('HARD');
        }

        // Start Game
        this.room.startGame();
        this.isRunning = true;
    }

    public startLoop(intervalMs: number = 800) {
        if (this.intervalId) clearInterval(this.intervalId);

        console.log(`Starting Spectator Loop (${intervalMs}ms)...`);

        this.intervalId = setInterval(() => {
            if (!this.isRunning) {
                this.stopLoop();
                return;
            }

            const state = this.room.gameState;
            if (!state || state.status !== 'PLAYING') {
                console.log("Game finished or not playing. Restarting...");
                this.resetAndRestart();
                return;
            }

            const currentPlayer = state.players[state.currentPlayerIndex];

            try {
                // Determine if it's a bot (it should be)
                if (currentPlayer.socketId.startsWith('bot-')) {
                    (this.room as any).processBotTurn(currentPlayer);
                } else {
                    console.warn("Human player in spectator game? Skipping.");
                    this.room.advanceTurn();
                }
            } catch (e) {
                console.error("Error in simulation step:", e);
                this.isRunning = false;
            }

        }, intervalMs);
    }

    private resetAndRestart() {
        // Wait a bit then restart
        this.stopLoop();
        setTimeout(() => {
            this.room = new Room(this.roomId);
            this.room.setEventCallback((event, data) => {
                this.io.to(this.roomId).emit(event as any, data);
            });
            this.setupGame();
            this.startLoop();
        }, 3000);
    }

    public stopLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Allow a real client to "join" as a spectator
    public addSpectator(socket: Socket) {
        socket.join(this.roomId);
        // Send current state
        if (this.room.gameState) {
            socket.emit('gameStarted', this.room.gameState);
        }
    }
}
