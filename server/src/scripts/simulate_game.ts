
import { Room } from '../game/Room';
import { Player, Role, GameState } from '@ojamamono/shared';
import { BotLogic } from '../game/BotLogic';

// Configuration
const NUM_GAMES = 100;
const NUM_PLAYERS = 5;
const BOT_DIFFICULTY: any = 'HARD';

// Stats
let stats = {
    goldDiggerWins: 0,
    saboteurWins: 0,
    draws: 0, // Rare, but possible if deck runs out without goal
    totalRounds: 0
};

async function runSimulation() {
    console.log(`Starting simulation: ${NUM_GAMES} rounds with ${NUM_PLAYERS} bots (${BOT_DIFFICULTY})...`);
    BotLogic.debugMode = false;

    for (let i = 0; i < NUM_GAMES; i++) {
        await runSingleGame(i + 1);
    }

    console.log('--- Simulation Results ---');
    console.log(`Total Rounds: ${stats.totalRounds}`);
    console.log(`Gold Digger Wins: ${stats.goldDiggerWins} (${(stats.goldDiggerWins / stats.totalRounds * 100).toFixed(1)}%)`);
    console.log(`Saboteur Wins:    ${stats.saboteurWins} (${(stats.saboteurWins / stats.totalRounds * 100).toFixed(1)}%)`);
    console.log(`Draws:            ${stats.draws} (${(stats.draws / stats.totalRounds * 100).toFixed(1)}%)`);
}

function runSingleGame(gameId: number): Promise<void> {
    return new Promise((resolve) => {
        const room = new Room(`sim-${gameId}`);
        room.autoBotEnabled = false; // We manually step

        // Disable logs
        const originalConsoleLog = console.log;
        // console.log = () => {}; 
        // Keep logs for now, maybe filter?

        // Add Bots
        for (let p = 0; p < NUM_PLAYERS; p++) {
            room.addBot(BOT_DIFFICULTY);
        }

        let roundActive = false;
        let roundWinner: Role | 'DRAW' | null = null;
        let turnCount = 0;

        room.setEventCallback((event, data) => {
            if (event === 'gameStarted') {
                roundActive = true;
            }
            if (event === 'roundEnded' || event === 'gameEnded') {
                roundActive = false;
                roundWinner = data.winner;
            }
            if (event === 'actionResult') {
                // Ignore
            }
        });

        // Start Game
        room.startGame();

        // Game Loop
        const maxTurns = 500; // Safety break

        while (roundActive && turnCount < maxTurns) {
            if (!room.gameState) break;

            const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];

            // Execute Turn
            try {
                (room as any).processBotTurn(currentPlayer);
            } catch (e) {
                console.error('Error in bot turn:', e);
                roundActive = false;
            }

            turnCount++;
        }

        // Record Result
        if (roundWinner === 'GOLD_DIGGER') stats.goldDiggerWins++;
        else if (roundWinner === 'SABOTEUR') stats.saboteurWins++;
        else stats.draws++;

        stats.totalRounds++;

        // Restore console (if mocked)
        // console.log = originalConsoleLog;

        resolve();
    });
}

runSimulation().catch(console.error);
