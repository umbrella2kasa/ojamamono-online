
import { Room } from './Room';
import { GameOptions } from '@ojamamono/shared';
import { BotLogic } from './BotLogic'; // Import BotLogic

async function runSimulations(iterations: number) {
    console.log(`Starting ${iterations} simulation runs...`);
    const stats = {
        total: 0,
        GOLD_DIGGER: 0,
        SABOTEUR: 0,
        SELFISH_DWARF: 0,
        GEOLOGIST: 0,
        STUCK: 0,
        // Gold tracking (cumulative over all games)
        gold_total: {
            GOLD_DIGGER: 0,
            SABOTEUR: 0,
            SELFISH_DWARF: 0,
            GEOLOGIST: 0
        },
        role_counts: {
            GOLD_DIGGER: 0,
            SABOTEUR: 0,
            SELFISH_DWARF: 0,
            GEOLOGIST: 0
        }
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    for (let i = 0; i < iterations; i++) {
        // シミュレーション中は大量のログを抑制
        console.log = () => { };
        console.warn = () => { };
        console.error = () => { };

        const room = new Room(`sim-${i}`);

        const options: GameOptions = {
            maxRounds: 5,
            enableScore: true,
            botDifficulty: 'HARD',
            roleConfig: {
                goldDiggers: 3,
                saboteurs: 1,
                selfishDwarves: 1,
                geologists: 1,
                randomPool: []
            }
        };

        room.updateOptions(options);

        // @ts-ignore
        room.autoBotEnabled = false; // 同期実行のためfalse

        // 6人のBotを追加
        for (let j = 0; j < 6; j++) {
            room.addBot('HARD');
        }

        room.startGame();

        // ゲームが終了するまで BotTurn を回す
        let turns = 0;
        const maxTurns = 1500; // 3ラウンド分なので少し増やす

        // @ts-ignore: TS doesn't know about WAITING_FOR_STONE_ACTION in shared type yet?
        while (room.gameState && room.gameState.status !== 'GAME_END' && turns < maxTurns) {
            // @ts-ignore
            if (room.gameState.status === 'WAITING_FOR_STONE_ACTION') {
                const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];

                // BotLogicで決定
                const decision = BotLogic.decideStoneAction(room.gameState, room.gameState.currentPlayerIndex);
                // @ts-ignore: Room method added but not in type definition?
                room.handleStoneAction(currentPlayer.id, decision.targetId, decision.actionType, decision.toolType);

            } else if (room.gameState.status === 'PLAYING') {
                const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
                room.processBotTurn(currentPlayer);
            } else if (room.gameState.status === 'ROUND_END') {
                // 次のラウンドへ
                room.nextRound();
            }
            turns++;
        }

        if (room.gameState && room.gameState.status !== 'PLAYING') {
            const winner = room.gameState.winner;
            if (winner === 'GOLD_DIGGER') stats.GOLD_DIGGER++;
            else if (winner === 'SABOTEUR') stats.SABOTEUR++;
            else if (winner === 'SELFISH_DWARF') stats.SELFISH_DWARF++;
            // @ts-ignore
            else if (winner === 'GEOLOGIST_ONLY' || winner === 'GEOLOGIST') stats.GEOLOGIST++;
            else {
                originalLog(`Unknown winner in Game ${i}: ${winner}`);
            }

            // Track individual gold
            room.gameState.players.forEach(p => {
                stats.gold_total[p.role as keyof typeof stats.gold_total] += room.gameState!.scores[p.id] || 0;
                stats.role_counts[p.role as keyof typeof stats.role_counts]++;
            });
        } else {
            stats.STUCK++;
            // デバッグログ (抑制中なので originalLog を使う)
            const handsInfo = room.gameState?.players.map(p => `${p.name}(${p.role}): ${p.hand.length} cards`).join(', ');
            originalLog(`Game ${i} STUCK at ${turns} turns. Deck: ${room.gameState?.deckCount}, Winners: ${room.gameState?.winner}, Hands: ${handsInfo}`);
        }

        stats.total++;

        if ((i + 1) % 100 === 0) {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.log(`Progress: ${i + 1}/${iterations}...`);
        }
    }

    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.log("\n=== Simulation Results ===");
    console.log(`Total Games: ${stats.total}`);
    console.log(`Gold Digger Wins: ${stats.GOLD_DIGGER} (${(stats.GOLD_DIGGER / stats.total * 100).toFixed(2)}%)`);
    console.log(`Saboteur Wins: ${stats.SABOTEUR} (${(stats.SABOTEUR / stats.total * 100).toFixed(2)}%)`);
    console.log(`Selfish Dwarf Wins: ${stats.SELFISH_DWARF} (${(stats.SELFISH_DWARF / stats.total * 100).toFixed(2)}%)`);
    console.log(`Geologist Wins: ${stats.GEOLOGIST} (${(stats.GEOLOGIST / stats.total * 100).toFixed(2)}%)`);
    console.log(`Stuck Games: ${stats.STUCK} (${(stats.STUCK / stats.total * 100).toFixed(2)}%)`);

    console.log("\n=== Average Gold per Round (End of 3 Rounds) ===");
    (Object.keys(stats.gold_total) as Array<keyof typeof stats.gold_total>).forEach(role => {
        const avg = stats.role_counts[role] > 0 ? (stats.gold_total[role] / stats.role_counts[role]).toFixed(2) : "0.00";
        console.log(`${role.padEnd(15)}: ${avg} gold`);
    });
    console.log("==========================\n");
}

// 実行 (コマンドライン引数があればそれを使用)
const iterations = parseInt(process.argv[2]) || 100;
runSimulations(iterations).catch(console.error);
