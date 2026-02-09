import { Room } from '../game/Room';
import { BotLogic } from '../game/BotLogic';
import { Player, GameState } from '@ojamamono/shared';

// 統計データ構造
interface GameStats {
    totalGames: number;
    playerCountDistribution: { [key: number]: number };
    goldDiggerWins: number;
    saboteurWins: number;
    averageTurns: number;
    errors: number;
    timeoutGames: number;
}

interface GameResult {
    winner: 'GOLD_DIGGER' | 'SABOTEUR' | null;
    turns: number;
    error?: string;
}

// ログ抑制用
const ORIGINAL_CONSOLE_LOG = console.log;
function suppressLogs() {
    console.log = () => { };
}
function restoreLogs() {
    console.log = ORIGINAL_CONSOLE_LOG;
}

async function runSimulation() {
    console.log('--- Starting 1000-Game Simulation ---');

    const stats: GameStats = {
        totalGames: 0,
        playerCountDistribution: {},
        goldDiggerWins: 0,
        saboteurWins: 0,
        averageTurns: 0,
        errors: 0,
        timeoutGames: 0
    };

    // テスト構成: 4人重視
    const configs = [
        { count: 4, games: 700 }, // 最重要
        { count: 3, games: 100 },
        { count: 5, games: 100 },
        { count: 7, games: 50 },
        { count: 10, games: 50 },
    ];

    let totalProcessed = 0;
    const startTime = Date.now();

    for (const config of configs) {
        console.log(`Running ${config.games} games with ${config.count} players...`);

        for (let i = 0; i < config.games; i++) {
            // 進捗ログ (ログ抑制一時解除)
            if (totalProcessed > 0 && totalProcessed % 100 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const fps = totalProcessed / elapsed;
                console.log(`Processed ${totalProcessed} games. Speed: ${fps.toFixed(1)} games/sec`);
            }

            // ゲーム実行 (ログ抑制)
            suppressLogs();
            const result = await playOneGame(config.count);
            restoreLogs();

            // 統計更新
            stats.totalGames++;
            stats.playerCountDistribution[config.count] = (stats.playerCountDistribution[config.count] || 0) + 1;

            if (result.error) {
                stats.errors++;
            } else if (result.winner === 'GOLD_DIGGER') {
                stats.goldDiggerWins++;
            } else if (result.winner === 'SABOTEUR') {
                stats.saboteurWins++;
            } else {
                stats.timeoutGames++;
            }

            // 平均ターンの更新
            stats.averageTurns = (stats.averageTurns * (stats.totalGames - 1) + result.turns) / stats.totalGames;

            totalProcessed++;
        }
    }

    console.log('\n--- Simulation Complete ---');
    console.log(JSON.stringify(stats, null, 2));

    // 結果のMarkdown出力
    console.log('\n### Simulation Report');
    console.log(`- **Total Games**: ${stats.totalGames}`);
    console.log(`- **Gold Digger Wins**: ${stats.goldDiggerWins} (${((stats.goldDiggerWins / stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`- **Saboteur Wins**: ${stats.saboteurWins} (${((stats.saboteurWins / stats.totalGames) * 100).toFixed(1)}%)`);
    console.log(`- **Average Turns**: ${stats.averageTurns.toFixed(1)}`);
    console.log(`- **Errors**: ${stats.errors}`);
}

async function playOneGame(playerCount: number): Promise<GameResult> {
    return new Promise(resolve => {
        const room = new Room(`sim-${Math.random()}`);
        room.autoBotEnabled = false;
        // Bot難易度をHARDに設定 (検証用)
        (room as any).options.botDifficulty = 'HARD';

        // イベントコールバック (Socketモック)
        room.setEventCallback((event, data) => { });

        // Bot追加
        for (let i = 0; i < playerCount; i++) {
            room.addPlayer(`bot-${i}`, `Bot ${i}`, '🤖', `socket-bot-${i}`);
        }

        room.startGame();

        let turns = 0;
        const MAX_TURNS = 1000;

        while (room.gameState && room.gameState.status === 'PLAYING' && turns < MAX_TURNS) {
            const playerIndex = room.gameState.currentPlayerIndex;
            const player = room.gameState.players[playerIndex];

            try {
                // Bot思考
                const action = BotLogic.decideAction(room.gameState, playerIndex, room.gridManager);

                if (action.type === 'PLAY_CARD') {
                    // posがundefinedの可能性があるのでチェック
                    const pos = action.pos || { x: 0, y: 0, isReversed: false };
                    room.handlePlayCard(player.id, action.cardIndex, pos, action.targetPlayerId);
                } else {
                    // discardCardに変更
                    room.discardCard(player.id, action.cardIndex);
                }
            } catch (e) {
                resolve({ winner: null, turns, error: String(e) });
                return;
            }

            turns++;
        }

        if (room.gameState?.winner) {
            resolve({
                // 型不一致を避けるため any キャストも検討するが、値比較ならOKなはず
                // エラーメッセージによると 'GOLD_DIGGER_WON' という文字列リテラルと比較していたため overlap なしになった
                // 'GOLD_DIGGER' との比較なら role定義に含まれるのでOK
                winner: room.gameState.winner === 'GOLD_DIGGER' ? 'GOLD_DIGGER' : 'SABOTEUR',
                turns
            });
        } else {
            // 引き分けまたは終了 -> Saboteur勝利
            resolve({ winner: 'SABOTEUR', turns });
        }
    });
}

runSimulation().catch(console.error);
