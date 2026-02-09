import { GridCell, PathCard, PathShape, Direction } from '@ojamamono/shared';

// 型安全なヘルパー関数

function getConnection(shape: PathShape, direction: Direction): boolean {
    return shape[direction];
}

function setConnection(shape: PathShape, direction: Direction, value: boolean): void {
    shape[direction] = value;
}

function getOppositeDirection(direction: Direction): Direction {
    const opposites: Record<Direction, Direction> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left'
    };
    return opposites[direction];
}

export class GridManager {
    width: number = 13; // 12 -> 13 (Right +1)
    height: number = 9; // 7 -> 9 (Top +1, Bottom +1)
    grid: (GridCell | null)[] = [];
    private goalTypes: Map<string, 'GOLD' | 'STONE'> = new Map();

    constructor() {
        this.initGrid();
    }

    initGrid() {
        this.grid = new Array(this.width * this.height).fill(null);
        this.goalTypes.clear();

        // Start (2, 4) - Original (1,3) + (1,1) offset
        this.placeCardForce(2, 4, {
            id: 'start',
            type: 'PATH',
            shape: { top: true, bottom: true, left: true, right: true, center: true }, // 十字路
            isStart: true
        }, false);

        // Goal Config
        // 3つのゴールのうち1つがGOLD, 2つがSTONE
        const goals: ('GOLD' | 'STONE')[] = ['GOLD', 'STONE', 'STONE'];
        // シャッフル
        for (let i = goals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [goals[i], goals[j]] = [goals[j], goals[i]];
        }

        // Goal (10, 2), (10, 4), (10, 6) - Adjusted for 7 card gap
        const goalPositions = [{ x: 10, y: 2 }, { x: 10, y: 4 }, { x: 10, y: 6 }];
        goalPositions.forEach((pos, index) => {
            const type = goals[index];
            const key = `${pos.x},${pos.y}`;
            this.goalTypes.set(key, type);

            this.placeCardForce(pos.x, pos.y, {
                id: `goal-${pos.y}`,
                type: 'PATH',
                shape: { top: true, bottom: true, left: true, right: true, center: true }, // 仮の形状（公開時に確定）
                isGoal: true,
                goalType: type
            }, false);
        });

        // デバッグ: グリッド初期化確認
        console.log('[GridManager] Grid initialized:', {
            width: this.width,
            height: this.height,
            totalCells: this.grid.length,
            startCard: this.get(2, 4),
            goalIndices: goalPositions.map(p => p.x + p.y * this.width),
            nonNullCells: this.grid.filter(c => c !== null).length
        });
    }

    peekGoal(x: number, y: number): 'GOLD' | 'STONE' | null {
        return this.goalTypes.get(`${x},${y}`) || null;
    }

    removeCard(x: number, y: number) {
        if (!this.isValidIdx(x, y)) return;
        this.grid[x + y * this.width] = null;
    }

    // 強制的に配置（初期化用）
    private placeCardForce(x: number, y: number, card: PathCard, isReversed: boolean) {
        if (!this.isValidIdx(x, y)) return;
        this.grid[x + y * this.width] = { card, isReversed };
    }

    // インデックス判定
    private isValidIdx(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    get(x: number, y: number): GridCell | null {
        if (!this.isValidIdx(x, y)) return null;
        return this.grid[x + y * this.width];
    }

    /**
     * 配置可能か判定する
     */
    checkPlacement(x: number, y: number, card: PathCard, isReversed: boolean): boolean {
        return this.validatePlacement(x, y, card, isReversed).valid;
    }

    validatePlacement(x: number, y: number, card: PathCard, isReversed: boolean): { valid: boolean, reason?: string } {
        // 1. グリッド範囲チェック
        if (!this.isValidIdx(x, y)) return { valid: false, reason: `無効な位置です (${x},${y})` };

        // 2. 既にカードがあるかチェック
        if (this.get(x, y) !== null) return { valid: false, reason: '既にカードが置かれています' };

        const myShape = this.getRotatedShape(card.shape, isReversed);
        const neighbors = [
            { dx: 0, dy: -1, dir: 'top' },
            { dx: 0, dy: 1, dir: 'bottom' },
            { dx: -1, dy: 0, dir: 'left' },
            { dx: 1, dy: 0, dir: 'right' }
        ];

        let hasNeighbor = false;

        // 3. 隣接カードとの整合性チェック
        // すべての隣接セルに対して、接続が整合・不整合をチェックする
        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const neighborCell = this.get(nx, ny);

            if (neighborCell) {
                hasNeighbor = true;
                const neighborShape = this.getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);

                const myConnection = getConnection(myShape, n.dir as Direction);
                const neighborOppositeDir = getOppositeDirection(n.dir as Direction);
                const neighborConnection = getConnection(neighborShape, neighborOppositeDir);

                // 片方が道で片方が壁ならNG
                // ただし、未公開ゴールの場合は、ゴールの形状が確定していないため常につながる（またはつながらない）ことを許容する
                // （=こちらの接続がどうであれ、相手が未公開ゴールならOKとする）
                if (neighborCell.card.isGoal && !neighborCell.card.isRevealed) {
                    // Skip check
                } else if (myConnection !== neighborConnection) {
                    return { valid: false, reason: `道が繋がりません` };
                }
            }
        }

        // 周囲に何もなく孤立している場合はNG
        if (!hasNeighbor) return { valid: false, reason: '隣接するカードがありません' };

        // 5. スタートからの到達可能性チェック
        // 「スタートから到達可能な隣接セル」かつ「そのセルと自分がお互いに接続している」箇所が少なくとも1つ必要
        const hasReachableNeighbor = neighbors.some(n => {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const neighborCell = this.get(nx, ny);
            if (!neighborCell) return false;

            const myConnection = getConnection(myShape, n.dir as Direction);

            const neighborShape = this.getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);
            const neighborOppositeDir = getOppositeDirection(n.dir as Direction);
            const neighborConnection = getConnection(neighborShape, neighborOppositeDir);

            // 両方がつながっている場合のみ、そこを経由できる
            if (myConnection && neighborConnection) {
                // 隣接セルが通行不可（行き止まり等でcenterがfalse）の場合、そこから道を伸ばすことはできない
                // ただしスタート地点は例外
                if (!neighborShape.center && !neighborCell.card.isStart) {
                    return false;
                }

                // その隣接セル自体がスタートから到達可能か？
                return this.isReachableFromStart(nx, ny);
            }

            return false;
        });

        if (!hasReachableNeighbor) return { valid: false, reason: 'スタートからの道が繋がっていません' };

        return { valid: true };
    }


    /**
     * 指定座標がスタートから到達可能かBFSでチェック
     */
    private isReachableFromStart(targetX: number, targetY: number): boolean {
        const startX = 2;
        const startY = 4;

        if (targetX === startX && targetY === startY) return true;

        const queue: { x: number, y: number }[] = [{ x: startX, y: startY }];
        const visited = new Set<string>();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift()!;

            // ゴール到達確認
            if (current.x === targetX && current.y === targetY) {
                return true;
            }

            const currentCell = this.get(current.x, current.y);
            // 万が一セルがない（ありえないが）場合はスキップ
            if (!currentCell) continue;

            const currentShape = this.getRotatedShape(currentCell.card.shape, currentCell.isReversed);

            // 【修正】中心が通行不可（行き止まり）かつ、スタート・ゴールでない場合は通過できない
            // 行き止まりカードは connect できるが通り抜けられない
            if (!currentShape.center && !currentCell.card.isStart && !currentCell.card.isGoal) {
                continue;
            }

            const directions: { dx: number, dy: number, dir: Direction }[] = [
                { dx: 0, dy: -1, dir: 'top' },
                { dx: 0, dy: 1, dir: 'bottom' },
                { dx: -1, dy: 0, dir: 'left' },
                { dx: 1, dy: 0, dir: 'right' }
            ];

            for (const n of directions) {
                // 現在地からその方向に道が出ているか
                if (!getConnection(currentShape, n.dir)) continue;

                const nx = current.x + n.dx;
                const ny = current.y + n.dy;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;
                if (!this.isValidIdx(nx, ny)) continue;

                const neighborCell = this.get(nx, ny);
                if (!neighborCell) continue;

                // 未公開ゴールは壁扱い（通過不可）
                if (neighborCell.card.isGoal && !neighborCell.card.isRevealed) {
                    // ただし、もし target がこの未公開ゴールそのものである場合は到達可能とする必要があるか？
                    // いや、未公開ゴールに「道をつなげる」ことはできるが、
                    // 未公開ゴールを「通過して」その先に行くことはできない。
                    // 今回の BFS は「targetX, targetY に到達できるか」なので、
                    // targetX, targetY が未公開ゴールの場合、そこにたどり着いた時点で True で良い。

                    if (nx === targetX && ny === targetY) {
                        // 相手側からの接続確認
                        const neighborShape = this.getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);
                        const oppDir = getOppositeDirection(n.dir);
                        if (getConnection(neighborShape, oppDir)) {
                            return true;
                        }
                    }
                    continue;
                }

                // 隣接セル側からも接続があるか確認
                const neighborShape = this.getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);
                const oppDir = getOppositeDirection(n.dir);

                if (getConnection(neighborShape, oppDir)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        return false;
    }

    placeCard(x: number, y: number, card: PathCard, isReversed: boolean): boolean {
        if (!this.checkPlacement(x, y, card, isReversed)) return false;
        this.grid[x + y * this.width] = { card, isReversed };
        return true;
    }

    // スタートから到達可能な未公開ゴールを探す
    findReachableGoals(): { x: number, y: number }[] {
        const startX = 2; // Updated
        const startY = 4; // Updated
        const queue: { x: number, y: number }[] = [{ x: startX, y: startY }];
        const visited = new Set<string>();
        visited.add(`${startX},${startY}`);

        const reachedGoals: { x: number, y: number }[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentCell = this.get(current.x, current.y);
            if (!currentCell) continue;

            const currentShape = this.getRotatedShape(currentCell.card.shape, currentCell.isReversed);

            // 通行止め（行き止まり）カードはそこから先に進めないため、隣接セルの探索を行わない
            if (!currentShape.center && !currentCell.card.isStart && !currentCell.card.isGoal) {
                continue;
            }

            const neighbors = [
                { dx: 0, dy: -1, dir: 'top' },
                { dx: 0, dy: 1, dir: 'bottom' },
                { dx: -1, dy: 0, dir: 'left' },
                { dx: 1, dy: 0, dir: 'right' }
            ];

            for (const n of neighbors) {
                const nx = current.x + n.dx;
                const ny = current.y + n.dy;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;
                if (!this.isValidIdx(nx, ny)) continue;

                const neighborCell = this.get(nx, ny);
                if (!neighborCell) continue;

                // 接続チェック
                // ゴール判定時は、相手が未公開ゴールでも「形上つながっているか」を見る
                // 未公開ゴールの shape は初期状態(十字)なので、隣接して通路があれば繋がっているとみなせる。
                // (公開時に形が変わるが、それは公開処理で行う)

                const neighborShape = this.getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);

                // 自分側の接続
                const myConn = getConnection(currentShape, n.dir as Direction);

                // 相手側の接続 (逆方向)
                let neighborOppositeDir = '';
                if (n.dir === 'top') neighborOppositeDir = 'bottom';
                if (n.dir === 'bottom') neighborOppositeDir = 'top';
                if (n.dir === 'left') neighborOppositeDir = 'right';
                if (n.dir === 'right') neighborOppositeDir = 'left';

                const neighborConn = getConnection(neighborShape, getOppositeDirection(n.dir as Direction));

                // 通路がつながっている場合のみ移動可能 (両方がtrue)
                if (myConn && neighborConn) {
                    visited.add(key);

                    if (neighborCell.card.isGoal) {
                        // 未公開のゴールならリストに追加
                        // 既に公開済みなら通路として通過可能
                        if (!neighborCell.card.isRevealed) {
                            reachedGoals.push({ x: nx, y: ny });
                        } else {
                            queue.push({ x: nx, y: ny });
                        }
                    } else {
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
        return reachedGoals;
    }

    revealGoal(x: number, y: number): 'GOLD' | 'STONE' | null {
        const cell = this.get(x, y);
        if (!cell || !cell.card.isGoal) return null;

        // 形状を動的に決定（シュレディンガーのゴール）
        const newShape = this.determineGoalShape(x, y);
        cell.card.shape = newShape;

        cell.card.isRevealed = true;
        // ゴールの中身をカード情報に反映（クライアントに通知するため）
        return cell.card.goalType || 'STONE';
    }

    // 周囲の接続状況に合わせてゴールの形状を決定する
    private determineGoalShape(x: number, y: number): PathShape {
        const shape: PathShape = { top: false, bottom: false, left: false, right: false, center: true, deadEnd: false };

        const neighbors = [
            { dx: 0, dy: -1, dir: 'top' },
            { dx: 0, dy: 1, dir: 'bottom' },
            { dx: -1, dy: 0, dir: 'left' },
            { dx: 1, dy: 0, dir: 'right' }
        ];

        neighbors.forEach(n => {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const cell = this.get(nx, ny);

            if (cell) {
                // 隣接セルの、自分に向いている方向の接続を確認
                const neighborShape = this.getRotatedShape(cell.card.shape, cell.isReversed);
                let oppositeDir = '';
                if (n.dir === 'top') oppositeDir = 'bottom';
                if (n.dir === 'bottom') oppositeDir = 'top';
                if (n.dir === 'left') oppositeDir = 'right';
                if (n.dir === 'right') oppositeDir = 'left';

                const hasConn = (neighborShape as any)[oppositeDir];

                // 隣接セルが通路を伸ばしているなら、こちらも繋げる（MUST）
                if (hasConn) {
                    (shape as any)[n.dir] = true;
                }
                // 隣接セルが壁なら、こちらも壁にする（MUST NOT）
                // -> false のまま

                // 隣接セルが未公開ゴール等の場合（ありえないが）はどうするか？
                // 未公開ゴールは壁扱いなので false になる。
            } else {
                // 何もない場所、または盤面外
                // ランダムに接続をつける（MAY）
                // 50% の確率で通路にする？
                if (Math.random() > 0.5) {
                    setConnection(shape, n.dir as Direction, true);
                }
            }
        });

        // 最低限の整合性チェック
        // 全く通路がない（孤立）状態は避ける（必ずどこかとは繋がっているはずだが）
        // 行き止まりにはしない（center=trueなので）

        return shape;
    }

    // ヘルパート: カード形状を回転させる
    public getRotatedShape(shape: PathShape, isReversed: boolean): PathShape {
        // Defensive copy to prevent side effects
        if (!isReversed) {
            return { ...shape };
        }
        // 180度回転
        return {
            top: shape.bottom,
            bottom: shape.top,
            left: shape.right,
            right: shape.left,
            center: shape.center, // 中心は変わらない
            deadEnd: shape.deadEnd
        };
    }
}
