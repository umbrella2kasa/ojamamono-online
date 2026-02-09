
// Types
type Direction = 'top' | 'bottom' | 'left' | 'right';
interface PathShape {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    center: boolean;
    deadEnd?: boolean;
}
interface PathCard {
    id: string;
    type: 'PATH';
    shape: PathShape;
    isStart?: boolean;
    isGoal?: boolean;
    isRevealed?: boolean;
}
interface GridCell {
    card: PathCard;
    isReversed: boolean;
}

// Helpers
function getConnection(shape: PathShape, direction: Direction): boolean {
    return shape[direction];
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
function getRotatedShape(shape: PathShape, isReversed: boolean): PathShape {
    if (!isReversed) {
        return { ...shape };
    }
    return {
        top: shape.bottom,
        bottom: shape.top,
        left: shape.right,
        right: shape.left,
        center: shape.center,
        deadEnd: shape.deadEnd
    };
}

// Logic under test
function validatePlacement(
    grid: (GridCell | null)[],
    width: number,
    height: number,
    x: number,
    y: number,
    card: PathCard,
    isReversed: boolean
): { valid: boolean, reason?: string } {
    const get = (gx: number, gy: number) => {
        if (gx < 0 || gx >= width || gy < 0 || gy >= height) return null;
        return grid[gx + gy * width];
    };

    if (get(x, y) !== null) return { valid: false, reason: 'Occupied' };

    const myShape = getRotatedShape(card.shape, isReversed);
    const neighbors = [
        { dx: 0, dy: -1, dir: 'top' },
        { dx: 0, dy: 1, dir: 'bottom' },
        { dx: -1, dy: 0, dir: 'left' },
        { dx: 1, dy: 0, dir: 'right' }
    ];

    let hasNeighbor = false;

    // Neighbor Check
    for (const n of neighbors) {
        const nx = x + n.dx;
        const ny = y + n.dy;
        const neighborCell = get(nx, ny);

        if (neighborCell) {
            hasNeighbor = true;
            const neighborShape = getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);

            const myConnection = getConnection(myShape, n.dir as Direction);
            const neighborOppositeDir = getOppositeDirection(n.dir as Direction);
            const neighborConnection = getConnection(neighborShape, neighborOppositeDir);

            if (neighborCell.card.isGoal && !neighborCell.card.isRevealed) {
                // Skip
            } else if (myConnection !== neighborConnection) {
                console.log(`Mismatch detected at ${n.dir}: My ${myConnection} vs Neighbor ${neighborConnection}`);
                return { valid: false, reason: `Connection Mismatch: My ${n.dir}(${myConnection}) vs Neighbor ${neighborOppositeDir}(${neighborConnection})` };
            }
        }
    }

    if (!hasNeighbor) return { valid: false, reason: 'Isolated' };

    // Reachability check (Simplified for this test - assume reachable)
    return { valid: true };
}

// Test Setup
const width = 5;
const height = 5;
const grid = new Array(width * height).fill(null);
const place = (x: number, y: number, card: PathCard) => {
    grid[x + y * width] = { card, isReversed: false };
};

const x = 2;
const y = 2;

// 1. Top Neighbor (2,1): Cross (acting as T-junction bottom)
const topCard: PathCard = {
    id: 'top', type: 'PATH',
    shape: { top: true, bottom: true, left: true, right: true, center: true }
};
place(x, y - 1, topCard);

// 2. Left Neighbor (1,2): Cross
const leftCard: PathCard = {
    id: 'left', type: 'PATH',
    shape: { top: true, bottom: true, left: true, right: true, center: true }
};
place(x - 1, y, leftCard);

// 3. Target: Vertical Dead End (Left Closed)
const invalidCard: PathCard = {
    id: 'invalid', type: 'PATH',
    shape: { top: true, bottom: true, left: false, right: false, center: false, deadEnd: true }
};

console.log("Testing placement...");
const result = validatePlacement(grid, width, height, x, y, invalidCard, false);
console.log("Result:", result);

if (result.valid) {
    console.error("FAIL: Allowed invalid placement");
    process.exit(1);
} else {
    console.log("PASS: Rejected invalid placement");
}
