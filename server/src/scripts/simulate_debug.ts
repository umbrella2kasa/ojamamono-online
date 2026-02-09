import { Room } from '../game/Room';
import { BotLogic } from '../game/BotLogic';

async function runDebugSimulation() {
    console.log('--- Starting Debug Simulation ---');

    console.log('Initializing Room...');
    const room = new Room('debug-room');
    room.autoBotEnabled = false;

    // プレイヤー追加 (id, name, avatar, socketId)
    for (let i = 0; i < 4; i++) {
        room.addPlayer(`bot-${i}`, `Bot ${i}`, '🤖', `socket-bot-${i}`);
    }

    // Bot難易度 HARD & Debug Mode ON
    (room as any).options.botDifficulty = 'HARD';
    BotLogic.debugMode = true;

    console.log('Starting Game...');
    room.startGame();

    // 手動でターンを進める (最大100ターン)
    let turns = 0;
    while ((room as any).gameState?.status === 'PLAYING' && turns < 100) {
        turns++;
        const gameState = (room as any).gameState as any; // Private access
        const currentPlayerIndex = gameState.currentPlayerIndex;
        const currentPlayer = gameState.players[currentPlayerIndex];

        console.log(`\n--- Turn ${turns}: ${currentPlayer.name} (${currentPlayer.role}) ---`);

        // BotLogic実行
        const action = BotLogic.decideAction(
            gameState,
            currentPlayerIndex,
            (room as any).gridManager
        );

        console.log(`Decision: ${action.type} ${action.type === 'PLAY_CARD' ? `@ (${action.pos?.x},${action.pos?.y})` : ''}`);

        // 実行
        if (action.type === 'PLAY_CARD') {
            room.handlePlayCard(currentPlayer.id, action.cardIndex, action.pos || { x: 0, y: 0, isReversed: false }, action.targetPlayerId);
        } else {
            room.discardCard(currentPlayer.id, action.cardIndex);
        }

        // 次のターンへ
        // checkWinConditionなどはhandlePlayCard内で呼ばれているが、
        // currentPlayerIndexの更新ロジックはRoom内にあるはず
        // 自動で進まないので、手動で次のプレイヤーへ回す必要があるか？
        // Room.tsを見る限り、handlePlayCard内で nextTurn() が呼ばれている。
    }

    console.log(`\n--- Game Over ---`);
    console.log(`Status: ${(room as any).gameState?.status}`);
    console.log(`Turns: ${turns}`);

    if ((room as any).gameState?.status === 'FINISHED') {
        console.log('Winners:', (room as any).gameState?.winners);
    } else {
        console.log('Result: Timeout or Stalled');
    }
}

runDebugSimulation().catch(console.error);
