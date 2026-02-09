import { Room } from '../game/Room';
import { BotLogic } from '../game/BotLogic';

async function verifyLogic() {
    console.log('--- Verifying Bot Logic (CLI) ---');

    // Enable debug mode to see detailed decision logs
    BotLogic.debugMode = true;

    const gamesToRun = 5;
    let rockfallCount = 0;

    // Capture console.log to count Rockfalls
    const originalLog = console.log;
    console.log = (message?: any, ...optionalParams: any[]) => {
        originalLog(message, ...optionalParams);
        if (typeof message === 'string' && message.includes('ROCKFALL')) {
            rockfallCount++;
        }
    };

    for (let i = 0; i < gamesToRun; i++) {
        console.log(`\nStarting Game ${i + 1}...`);
        await playOneGame();
    }

    console.log = originalLog;
    console.log(`\n--- Verification Complete ---`);
    console.log(`Total Games: ${gamesToRun}`);
    console.log(`Total Rockfall Actions: ${rockfallCount}`);

    if (rockfallCount > 0) {
        console.log('SUCCESS: Bots are using Rockfall cards!');
    } else {
        console.log('WARNING: No Rockfall cards observed. This might be due to chance or logic issues.');
    }
}

async function playOneGame() {
    return new Promise<void>(resolve => {
        const room = new Room(`verify-${Math.random()}`);
        room.autoBotEnabled = false;
        // Bot難易度をHARDに設定
        (room as any).options.botDifficulty = 'HARD';
        room.setEventCallback(() => { });

        // 4人のBotを追加
        for (let i = 0; i < 4; i++) {
            room.addPlayer(`bot-${i}`, `Bot ${i}`, '🤖', `socket-bot-${i}`);
        }

        room.startGame();

        let turns = 0;
        const MAX_TURNS = 200; // Limit to prevent infinite loops

        while (room.gameState && room.gameState.status === 'PLAYING' && turns < MAX_TURNS) {
            const playerIndex = room.gameState.currentPlayerIndex;

            try {
                const action = BotLogic.decideAction(room.gameState, playerIndex, room.gridManager);

                if (action.type === 'PLAY_CARD') {
                    const pos = action.pos || { x: 0, y: 0, isReversed: false };
                    room.handlePlayCard(room.gameState.players[playerIndex].id, action.cardIndex, pos, action.targetPlayerId);
                } else {
                    room.discardCard(room.gameState.players[playerIndex].id, action.cardIndex);
                }
            } catch (e) {
                console.error('Error during turn:', e);
                break;
            }
            turns++;
        }
        console.log(`Game finished in ${turns} turns. Winner: ${room.gameState?.winner}`);
        resolve();
    });
}

verifyLogic().catch(console.error);
