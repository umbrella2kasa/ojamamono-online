import { GameState, Player, Card, PathCard, ActionCard, GridCell, PathShape, Direction, SpecialCard } from '@ojamamono/shared';
import { GridManager } from './GridManager';

export type BotAction = {
    type: 'PLAY_CARD';
    cardIndex: number;
    pos?: { x: number, y: number, isReversed: boolean };
    targetPlayerId?: string;
} | {
    type: 'DISCARD';
    cardIndex: number;
};

export class BotLogic {
    public static debugMode = false;

    private static log(message: string) {
        if (this.debugMode) console.log(`[BotLogic] ${message}`);
    }

    static decideAction(gameState: GameState, playerIndex: number, gridManager: GridManager): BotAction {
        const player = gameState.players[playerIndex];
        const hand = player.hand;
        const difficulty = player.difficulty || gameState.options?.botDifficulty || 'NORMAL';

        let bestAction: BotAction | null = null;
        let bestScore = -Infinity;

        const enemies = gameState.players.filter(p => p.id !== player.id && p.role !== player.role);

        for (let index = 0; index < hand.length; index++) {
            const card = hand[index];
            if (card.type === 'PATH') {
                if (player.brokenTools.pickaxe || player.brokenTools.lantern || player.brokenTools.cart) {
                    continue;
                }

                const pathCard = card as PathCard;

                for (let y = 0; y < gridManager.height; y++) {
                    for (let x = 0; x < gridManager.width; x++) {
                        if (gridManager.checkPlacement(x, y, pathCard, false)) {
                            const score = this.evaluatePlacement(gameState, player, x, y, pathCard, false, gridManager, difficulty);
                            if (score > bestScore) {
                                bestScore = score;
                                bestAction = { type: 'PLAY_CARD', cardIndex: index, pos: { x, y, isReversed: false } };
                            }
                        }
                        if (gridManager.checkPlacement(x, y, pathCard, true)) {
                            const score = this.evaluatePlacement(gameState, player, x, y, pathCard, true, gridManager, difficulty);
                            if (score > bestScore) {
                                bestScore = score;
                                bestAction = { type: 'PLAY_CARD', cardIndex: index, pos: { x, y, isReversed: true } };
                            }
                        }
                    }
                }
            } else if (card.type === 'ACTION') {
                const actionCard = card as ActionCard;
                if (actionCard.actionType === 'ROCKFALL') {
                    // ROCKFALLのターゲット選定
                    let bestRockfallScore = 0;
                    let bestRockfallPos: { x: number, y: number } | null = null;

                    for (let i = 0; i < gridManager.grid.length; i++) {
                        const cell = gridManager.grid[i];
                        if (!cell || cell.card.isStart || cell.card.isGoal) continue;

                        const x = i % gridManager.width;
                        const y = Math.floor(i / gridManager.width);

                        let rockScore = 0;
                        if (player.role === 'GOLD_DIGGER' || player.role === 'SELFISH_DWARF' || player.role === 'GEOLOGIST') {
                            if (cell.card.shape.deadEnd) {
                                rockScore = 150;
                                rockScore += x * 10;
                            }
                        } else {
                            if (!cell.card.shape.deadEnd && cell.card.shape.center) {
                                rockScore = 100;
                                rockScore += x * 20;
                            }
                        }

                        if (rockScore > bestRockfallScore) {
                            bestRockfallScore = rockScore;
                            bestRockfallPos = { x, y };
                        }
                    }

                    const baseScore = this.evaluateAction(gameState, player, actionCard, difficulty, gridManager);
                    if (bestRockfallPos && (baseScore + bestRockfallScore) > bestScore) {
                        bestScore = baseScore + bestRockfallScore;
                        bestAction = { type: 'PLAY_CARD', cardIndex: index, pos: { x: bestRockfallPos.x, y: bestRockfallPos.y, isReversed: false } };
                    }
                } else {
                    const score = this.evaluateAction(gameState, player, actionCard, difficulty, gridManager);
                    const targetId = this.findTarget(gameState, player, actionCard.actionType, difficulty);

                    if (targetId) {
                        if (score > bestScore) {
                            if (actionCard.actionType === 'MAP') {
                                const goals: { x: number, y: number }[] = [];
                                for (let i = 0; i < gridManager.grid.length; i++) {
                                    const cell = gridManager.grid[i];
                                    if (cell && cell.card.isGoal && !cell.card.isRevealed) {
                                        goals.push({ x: i % gridManager.width, y: Math.floor(i / gridManager.width) });
                                    }
                                }
                                if (goals.length > 0) {
                                    const targetPos = goals[Math.floor(Math.random() * goals.length)];
                                    bestScore = score;
                                    bestAction = { type: 'PLAY_CARD', cardIndex: index, targetPlayerId: targetId, pos: { ...targetPos, isReversed: false } };
                                }
                            } else {
                                bestScore = score;
                                bestAction = { type: 'PLAY_CARD', cardIndex: index, targetPlayerId: targetId };
                            }
                        }
                    }
                }
            } else if (card.type === 'SPECIAL') {
                const specialCard = card as SpecialCard;
                const { score, targetId, pos: specialPos } = this.evaluateSpecialCardFull(gameState, player, specialCard, difficulty, gridManager, index);

                if (score > bestScore) {
                    this.log(`Evaluating Special ${specialCard.specialAction}: score=${score}`);
                    bestScore = score;
                    bestAction = { type: 'PLAY_CARD', cardIndex: index, targetPlayerId: targetId, pos: specialPos };
                }
            }
        }

        if (bestAction && bestAction.type === 'PLAY_CARD') {
            const card = hand[bestAction.cardIndex];
            if (card && card.type === 'SPECIAL') {
                this.log(`Bot ${player.name} (${player.role}) uses SPECIAL: ${(card as SpecialCard).specialAction}`);
            }
            return bestAction;
        }

        if (bestAction) return bestAction;

        return this.chooseDiscard(player, difficulty);
    }

    private static evaluatePlacement(
        gameState: GameState,
        player: Player,
        x: number,
        y: number,
        card: PathCard,
        isReversed: boolean,
        gridManager: GridManager,
        difficulty: 'EASY' | 'NORMAL' | 'HARD'
    ): number {
        if (difficulty === 'EASY') return Math.random() * 100;
        if (difficulty === 'NORMAL') return this.evaluateNormal(player, x, y, card);
        return this.evaluateHard(gameState, player, x, y, card, isReversed, gridManager);
    }

    private static evaluateNormal(player: Player, x: number, y: number, card: PathCard): number {
        let score = 0;
        if (player.role === 'GOLD_DIGGER' || player.role === 'SELFISH_DWARF') {
            score += x * 10;
            if (card.shape.deadEnd) score -= 50;
            if (x >= 8 && (y === 2 || y === 4 || y === 6)) score += 100;
        } else if (player.role === 'SABOTEUR') {
            score -= x * 10;
            if (card.shape.deadEnd) score += 50;
            if (x >= 8 && (y === 2 || y === 4 || y === 6)) score += 50;
        } else if (player.role === 'GEOLOGIST') {
            if (card.hasCrystal) score += 50;
            score += x * 5;
        }
        return score + Math.random() * 5;
    }

    private static evaluateHard(
        gameState: GameState,
        player: Player,
        x: number,
        y: number,
        card: PathCard,
        isReversed: boolean,
        gridManager: GridManager
    ): number {
        const currentResult = this.calculateBoardScore(gridManager, null);
        const currentScore = currentResult.minTotalCost;

        const virtualCard = { x, y, card, isReversed };
        const newResult = this.calculateBoardScore(gridManager, virtualCard);
        const newScore = newResult.minTotalCost;

        let score = 0;
        const scoreDiff = currentScore - newScore;

        if (player.role === 'GOLD_DIGGER') {
            // 超絶強化: ゴールへの執着心を大幅アップ
            if (Number.isFinite(scoreDiff)) {
                if (scoreDiff > 0) score += scoreDiff * 100; // 前進は大歓迎 (50 -> 100)
                else if (scoreDiff < 0) score -= 80; // 後退は許さない (30 -> 80)
            } else {
                if (!Number.isFinite(currentScore) && !Number.isFinite(newScore)) {
                    const heuristicDiff = currentResult.minHeuristic - newResult.minHeuristic;
                    if (heuristicDiff > 0) {
                        score += heuristicDiff * 50 + 50; // 近づくだけでも価値あり (30 -> 50)
                    } else if (heuristicDiff < 0) {
                        score -= 30; // 遠ざかるのはダメ
                    } else if (newResult.visited.size > currentResult.visited.size) {
                        score += 30; // 盤面を広げるだけでもプラス (15 -> 30)
                    }
                } else if (!Number.isFinite(currentScore) && Number.isFinite(newScore)) {
                    score += 2000; // 到達可能になるのは革命的 (1000 -> 2000)
                } else {
                    score -= 5000; // 自分で道を切断するのは最悪 (1000 -> 5000)
                }
            }

            // 完成直前なら最優先 (勝利確定)
            if (newResult.minTotalCost === 0) score += 20000; // (10000 -> 20000)

            if (Number.isFinite(newScore) || newResult.minHeuristic < currentResult.minHeuristic) {
                if (newResult.visited.has(`${x},${y}`) && scoreDiff >= 0) {
                    score += x * 10; // 前進する配置は高評価 (3 -> 10)
                }
            }
            // 行き止まりは論外。ただし、どうしても出さないといけない時はあるかもしれないが、基本は避ける
            if (card.shape.deadEnd) score -= 1000;
        } else if (player.role === 'SELFISH_DWARF') {
            if (newResult.minTotalCost === 0) {
                // ゴールに接続する場合、隣接するゴールの正体を確認する
                const neighbors = [
                    gridManager.get(x + 1, y),
                    gridManager.get(x - 1, y),
                    gridManager.get(x, y + 1),
                    gridManager.get(x, y - 1)
                ];

                let goalScore = 0;
                let foundGoal = false;

                for (const n of neighbors) {
                    if (n && n.card.isGoal) {
                        foundGoal = true;
                        if (n.card.isRevealed) {
                            if (n.card.goalType === 'GOLD') {
                                goalScore = 20000; // 金なら全力で取りに行く
                                break;
                            } else {
                                goalScore = -5000; // 石なら行かない (1000 -> 5000: 強い拒否)
                            }
                        } else {
                            // 未公開のゴールにはリスクがあるため、自分からは開けない
                            // -500だと他にやることがない時に行く可能性があるため、-5000にして「それなら捨てる」を選ばせる
                            goalScore = -5000;
                        }
                    }
                }

                if (foundGoal) {
                    score += goalScore;
                } else {
                    // ゴールに隣接していないが minTotalCost === 0 になるケース (既に道が繋がっていて、間のパーツを埋めた場合など)
                    // この場合は「誰かがゴールへ行けるようになった」ことを意味する
                    // 自分がゴールに届くなら良いが、そうでなければアシストになる
                    // ここではシンプルに「自分がゴールする」配置を優先するため、直接隣接でなければスコアは控えめにする
                    score += 1000;
                }

            } else if (scoreDiff > 0) {
                score += scoreDiff * 30;
            } else {
                score += x * 2;
            }
            if (card.shape.deadEnd) score -= 200;
        } else if (player.role === 'SABOTEUR') {
            if (Number.isFinite(scoreDiff)) {
                // 金鉱掘りをゴールから遠ざけたい
                if (scoreDiff < 0) score += Math.abs(scoreDiff) * 60;
                else if (scoreDiff > 0) score -= scoreDiff * 40;
            } else if (Number.isFinite(currentScore) && !Number.isFinite(newScore)) {
                score += 2000; // 切断成功
            }
            if (card.shape.deadEnd) {
                score += 200;
                if (x >= 8) score += 300; // ゴール付近の封鎖は特に価値が高い
            }
            if (x >= 9) score += 100;
        } else if (player.role === 'GEOLOGIST') {
            // 金鉱掘り協力型へシフト: クリスタルも欲しいが、ゲームが終わらないと意味がない
            if (card.hasCrystal) score += 1000;

            if (Number.isFinite(scoreDiff)) {
                // 遠回りはあえて推奨せず、効率的な道も歓迎 (地質学者といえどゴールしないと始まらない)
                if (scoreDiff > 0) score += scoreDiff * 5; // 前進はプラス (以前はマイナス)
                else if (scoreDiff < 0) score -= Math.abs(scoreDiff) * 5; // 後退はマイナス (以前はプラス)
            } else if (Number.isFinite(currentScore) && !Number.isFinite(newScore)) {
                score -= 500; // 切断は断固拒否
            } else if (!Number.isFinite(currentScore) && Number.isFinite(newScore)) {
                score += 500; // 接続は歓迎
            }

            // 行き止まりは嫌う (クリスタルが出せなくなるリスク回避)
            if (card.shape.deadEnd) score -= 500;

            // 盤面を広げる（未探索領域への配置）は高評価
            if (newResult.visited.size > currentResult.visited.size) {
                score += 50;
            }

            score += x * 3;
        }

        return score + Math.random() * 5;
    }

    private static calculateBoardScore(gridManager: GridManager, virtualCard: { x: number, y: number, card: PathCard, isReversed: boolean } | null): { minTotalCost: number, visited: Set<string>, minHeuristic: number } {
        const queue: { x: number, y: number, dist: number }[] = [];
        const visited = new Set<string>();

        queue.push({ x: 2, y: 4, dist: 0 });
        visited.add(`2,4`);

        let minTotalCost = Infinity;
        let minHeuristic = Infinity;

        while (queue.length > 0) {
            const current = queue.shift()!;

            const goalYs = [2, 4, 6].filter(gy => {
                const index = gy * gridManager.width + 10;
                const cell = gridManager.grid[index];
                if (cell && cell.card.isRevealed && cell.card.goalType === 'STONE') return false;
                return true;
            });
            if (goalYs.length === 0) goalYs.push(2, 4, 6);

            const distToGoalX = 10 - current.x;
            const distToGoalY = Math.min(...goalYs.map(gy => Math.abs(gy - current.y)));
            const heuristic = distToGoalX + distToGoalY;

            const totalCost = current.dist + heuristic;
            if (totalCost < minTotalCost) minTotalCost = totalCost;
            if (heuristic < minHeuristic) minHeuristic = heuristic;

            if (current.x === 10) {
                const index = current.y * gridManager.width + 10;
                const cell = gridManager.grid[index];
                if (!cell || !cell.card.isRevealed || cell.card.goalType === 'GOLD') {
                    return { minTotalCost: current.dist, visited, minHeuristic: 0 };
                }
            }

            const directions: Direction[] = ['top', 'bottom', 'left', 'right'];
            let currentPathCell = gridManager.get(current.x, current.y);
            let currentShape = gridManager.getRotatedShape(
                currentPathCell?.card.shape || { top: false, bottom: false, left: false, right: false, center: false, deadEnd: false },
                currentPathCell?.isReversed || false
            );

            if (virtualCard && current.x === virtualCard.x && current.y === virtualCard.y) {
                currentShape = gridManager.getRotatedShape(virtualCard.card.shape, virtualCard.isReversed);
            }

            if (!currentShape.center || currentShape.deadEnd) continue;

            for (const dir of directions) {
                if (!(currentShape as any)[dir]) continue;

                let nx = current.x;
                let ny = current.y;
                if (dir === 'top') ny--;
                else if (dir === 'bottom') ny++;
                else if (dir === 'left') nx--;
                else if (dir === 'right') nx++;

                if (nx < 0 || nx >= gridManager.width || ny < 0 || ny >= gridManager.height) continue;
                if (visited.has(`${nx},${ny}`)) continue;

                let neighborPathCell = gridManager.get(nx, ny);
                let neighborShape: PathShape | null = null;
                let neighborReversed = false;

                if (virtualCard && nx === virtualCard.x && ny === virtualCard.y) {
                    neighborShape = virtualCard.card.shape;
                    neighborReversed = virtualCard.isReversed;
                } else if (neighborPathCell) {
                    neighborShape = neighborPathCell.card.shape;
                    neighborReversed = neighborPathCell.isReversed;
                }

                if (!neighborShape) continue;

                const effectiveShape = gridManager.getRotatedShape(neighborShape, neighborReversed);
                const oppositeDir = dir === 'top' ? 'bottom' : dir === 'bottom' ? 'top' : dir === 'left' ? 'right' : 'left';

                if (!(effectiveShape as any)[oppositeDir]) continue;
                // 注意: ゴールカードやスタートカードはデッドエンドを持っていないが、
                // 隣接チェックにはcenterが必要な場合がある。
                if (!effectiveShape.center || effectiveShape.deadEnd) continue;

                visited.add(`${nx},${ny}`);
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }

        return { minTotalCost, visited, minHeuristic };
    }

    private static evaluateAction(gameState: GameState, player: Player, card: ActionCard, difficulty: string, gridManager: GridManager): number {
        let score = 0;
        const isSabo = player.role === 'SABOTEUR';

        if (card.actionType.startsWith('BREAK')) {
            score = isSabo ? 80 : 20;
        } else if (card.actionType.startsWith('FIX')) {
            score = 100; // 修理は常に価値が高い
        } else if (card.actionType === 'MAP') {
            const goldFound = gridManager.grid.some((c: any) => c && c.card.isGoal && c.card.isRevealed && c.card.goalType === 'GOLD');
            score = goldFound ? 0 : 150; // 未発見なら非常に高価値
        } else if (card.actionType === 'ROCKFALL') {
            score = 50;
            if (player.role === 'GOLD_DIGGER' && difficulty === 'HARD') {
                // 金鉱掘りは邪魔な石をどかすことを再優先
                // 行き止まり除去はゲームを動かす鍵
                score += 300; // (100 -> 300)
            }
        }

        if (difficulty === 'HARD' && card.actionType.startsWith('FIX')) {
            const targetType = card.actionType.replace('FIX_', '').toLowerCase();
            if ((targetType.includes('pickaxe') && player.brokenTools.pickaxe) ||
                (targetType.includes('lantern') && player.brokenTools.lantern) ||
                (targetType.includes('cart') && player.brokenTools.cart)) {
                score += 500; // 自分の修理は超最優先 (400 -> 500)
            } else if (player.role === 'GOLD_DIGGER') {
                // 超絶強化: 仲間を助けることは自分を助けること同義
                score += 450; // 他人の修理もほぼ最優先 (200 -> 450)
            }
        }

        return score;
    }

    private static findTarget(gameState: GameState, me: Player, actionType: string, difficulty: string): string | undefined {
        const enemies = gameState.players.filter(p => p.id !== me.id && p.role !== me.role);
        const friends = gameState.players.filter(p => p.id !== me.id && p.role === me.role);

        if (difficulty === 'EASY') {
            const allOthers = [...enemies, ...friends];
            return allOthers[Math.floor(Math.random() * allOthers.length)]?.id;
        }

        if (actionType.startsWith('BREAK')) {
            // 壊れていない敵を狙う
            const targets = enemies.filter(p => !this.isBroken(p));
            if (targets.length === 0) return undefined;

            // 簡易的に先頭を狙うが、実際は進捗などでソートすべき
            return targets[0].id;
        }
        if (actionType.startsWith('FIX')) {
            const targets = [...friends, me];
            const targetType = actionType.replace('FIX_', '');
            const needyTarget = targets.find(p => {
                if (targetType.includes('PICKAXE') && p.brokenTools.pickaxe) return true;
                if (targetType.includes('LANTERN') && p.brokenTools.lantern) return true;
                if (targetType.includes('CART') && p.brokenTools.cart) return true;
                return false;
            });
            return needyTarget?.id;
        }
        if (actionType === 'MAP') return me.id;
        return undefined;
    }

    private static isBroken(p: Player): boolean {
        return p.brokenTools.pickaxe || p.brokenTools.lantern || p.brokenTools.cart;
    }

    private static chooseDiscard(player: Player, difficulty: string): BotAction {
        if (difficulty === 'EASY' || player.hand.length === 0) {
            return { type: 'DISCARD', cardIndex: 0 };
        }

        const cardValues = player.hand.map((card, index) => {
            let value = 50;
            if (card.type === 'PATH') {
                const p = card as PathCard;
                if (player.role === 'GOLD_DIGGER' || player.role === 'SELFISH_DWARF' || player.role === 'GEOLOGIST') {
                    if (p.shape.deadEnd) value = 5;
                    else if (p.shape.center && p.shape.top && p.shape.bottom && p.shape.left && p.shape.right) value = 95;
                    else if (p.shape.center) value = 75;
                    else value = 35;
                } else {
                    if (p.shape.deadEnd) value = 95;
                    else if (p.shape.center) value = 15;
                }
            } else if (card.type === 'ACTION') {
                const a = card as ActionCard;
                if (player.role === 'SABOTEUR') {
                    if (a.actionType.startsWith('BREAK')) value = 110;
                    else if (a.actionType.startsWith('FIX')) value = 50;
                    else if (a.actionType === 'MAP') value = 10;
                    else if (a.actionType === 'ROCKFALL') value = 100;
                } else {
                    if (a.actionType.startsWith('BREAK')) value = 40;
                    else if (a.actionType.startsWith('FIX')) value = 120;
                    else if (a.actionType === 'MAP') value = 90;
                    else if (a.actionType === 'ROCKFALL') value = 85;
                }
            } else if (card.type === 'SPECIAL') {
                value = 150;
            }
            return { index, value: value + Math.random() * 10 };
        });

        cardValues.sort((a, b) => a.value - b.value);
        return { type: 'DISCARD', cardIndex: cardValues[0].index };
    }

    private static evaluateSpecialCardFull(gameState: GameState, player: Player, card: SpecialCard, difficulty: string, gridManager: GridManager, cardIndex: number): { score: number, targetId?: string, pos?: { x: number, y: number, isReversed: boolean } } {
        if (difficulty === 'EASY') return { score: Math.random() * 50 };

        let score = 0;
        let targetId: string | undefined;
        let pos: { x: number, y: number, isReversed: boolean } | undefined;

        const enemies = gameState.players.filter(p => p.id !== player.id && p.role !== player.role);

        switch (card.specialAction) {
            case 'DYNAMITE': {
                let bestTarget: { x: number, y: number } | null = null;
                let maxTScore = 0;
                for (let i = 0; i < gridManager.grid.length; i++) {
                    const cell = gridManager.grid[i];
                    if (!cell || cell.card.isStart || cell.card.isGoal) continue;
                    const x = i % gridManager.width;
                    const y = Math.floor(i / gridManager.width);
                    let tScore = 0;
                    if (player.role === 'SABOTEUR' || player.role === 'GEOLOGIST') {
                        if (!cell.card.shape.deadEnd && cell.card.shape.center) tScore = 150 + x * 10;
                    } else {
                        if (cell.card.shape.deadEnd) tScore = 200 + x * 10;
                    }
                    if (tScore > maxTScore) {
                        maxTScore = tScore;
                        bestTarget = { x, y };
                    }
                }
                if (bestTarget) {
                    score = maxTScore > 100 ? 180 : 20;
                    pos = { ...bestTarget, isReversed: false };
                }
                break;
            }
            case 'DOUBLE_ACTION':
                // 手札が多く、かつ今すぐやりたいことが複数ある
                score = player.hand.length >= 4 ? 220 : 40;
                break;
            case 'SCAVENGER': {
                const top = (gameState as any).discardPileTop;
                if (top) {
                    if (player.role === 'GOLD_DIGGER' || player.role === 'SELFISH_DWARF') {
                        if (top.type === 'PATH' && top.shape && !top.shape.deadEnd && top.shape.center) score = 190;
                        else if (top.type === 'ACTION' && top.actionType.startsWith('FIX')) score = 200;
                    } else {
                        if (top.type === 'PATH' && top.shape?.deadEnd) score = 190;
                        else if (top.type === 'ACTION' && top.actionType.startsWith('BREAK')) score = 200;
                    }
                }
                break;
            }
            case 'TRADER': {
                // 手札が悪い、または相手が絶好調
                const badCards = player.hand.filter(c => c.type === 'PATH' && (c as PathCard).shape.deadEnd).length;
                const broken = this.isBroken(player) ? 1 : 0;
                if (badCards >= 2 || broken) {
                    score = 250;
                    // 最も手札が多い敵を狙う
                    const sortedEnemies = [...enemies].sort((a, b) => b.hand.length - a.hand.length);
                    targetId = sortedEnemies[0]?.id;
                }
                break;
            }
            case 'ORACLE':
                score = 150;
                // まだ確信が持てない相手
                targetId = enemies[0]?.id;
                break;
            case 'THIEF':
                score = 130;
                // スコア持ってるやつから奪う
                const richEnemy = [...enemies].sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0));
                targetId = richEnemy[0]?.id;
                break;
        }
        return { score, targetId, pos };
    }

    // 石炭報酬時の追加アクション決定
    static decideStoneAction(gameState: GameState, playerIndex: number): { actionType: 'FIX' | 'BREAK', toolType: 'PICKAXE' | 'LANTERN' | 'CART', targetId: string } {
        const player = gameState.players[playerIndex];
        const enemies = gameState.players.filter(p => p.id !== player.id && p.role !== player.role);
        const friends = gameState.players.filter(p => p.id !== player.id && p.role === player.role);

        // 優先順位:
        // 1. 自分の道具が壊れていれば直す
        if (player.brokenTools.pickaxe) return { actionType: 'FIX', toolType: 'PICKAXE', targetId: player.id };
        if (player.brokenTools.lantern) return { actionType: 'FIX', toolType: 'LANTERN', targetId: player.id };
        if (player.brokenTools.cart) return { actionType: 'FIX', toolType: 'CART', targetId: player.id };

        // 2. 仲間の道具が壊れていれば直す (お邪魔者は仲間を助ける、金鉱堀も同様)
        // ただし自己中は仲間を助けない（自分の利益にならないため）
        if (player.role !== 'SELFISH_DWARF') {
            for (const friend of friends) {
                if (friend.brokenTools.pickaxe) return { actionType: 'FIX', toolType: 'PICKAXE', targetId: friend.id };
                if (friend.brokenTools.lantern) return { actionType: 'FIX', toolType: 'LANTERN', targetId: friend.id };
                if (friend.brokenTools.cart) return { actionType: 'FIX', toolType: 'CART', targetId: friend.id };
            }
        }

        // 3. 敵の道具を壊す
        // 壊れていない敵を探す
        const validEnemies = enemies.filter(e => !e.brokenTools.pickaxe && !e.brokenTools.lantern && !e.brokenTools.cart);
        if (validEnemies.length > 0) {
            // ランダムに選ぶ（あるいはスコアが高い敵）
            const target = validEnemies[Math.floor(Math.random() * validEnemies.length)];
            const tools: ('PICKAXE' | 'LANTERN' | 'CART')[] = ['PICKAXE', 'LANTERN', 'CART'];
            const tool = tools[Math.floor(Math.random() * tools.length)];
            return { actionType: 'BREAK', toolType: tool, targetId: target.id };
        }

        // 4. やることなければ適当に（ここまで来ることは稀だが、敵が全員壊れ済みなら何もしないか、あるいは無駄打ち）
        // 自分を指定してFIX（何もしないに等しい）
        return { actionType: 'FIX', toolType: 'PICKAXE', targetId: player.id };
    }
}
