
import { GridCell, PathCard, Direction, PathShape } from '@ojamamono/shared';

// Helper functions (mirrored from server/GridManager)
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

export const GridValidator = {
    isValidPlacement(
        grid: (GridCell | null)[],
        width: number,
        height: number,
        x: number,
        y: number,
        card: PathCard,
        isReversed: boolean,
        connectedCells: Set<number> // Check for connection to Start
    ): boolean {
        // 1. Index check
        if (x < 0 || x >= width || y < 0 || y >= height) return false;

        // 2. Occupied check
        if (grid[x + y * width] !== null) return false;

        const myShape = getRotatedShape(card.shape, isReversed);
        const neighbors = [
            { dx: 0, dy: -1, dir: 'top' },
            { dx: 0, dy: 1, dir: 'bottom' },
            { dx: -1, dy: 0, dir: 'left' },
            { dx: 1, dy: 0, dir: 'right' }
        ];

        let hasValidConnection = false;

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;

            // Boundary check for neighbor
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const nIdx = nx + ny * width;
            const neighborCell = grid[nIdx];

            if (neighborCell) {
                const neighborShape = getRotatedShape(neighborCell.card.shape, neighborCell.isReversed);

                const myConnection = getConnection(myShape, n.dir as Direction);
                const neighborOppositeDir = getOppositeDirection(n.dir as Direction);
                const neighborConnection = getConnection(neighborShape, neighborOppositeDir);

                // Unrevealed Goal exception
                // Goals, even unrevealed, can be connected TO.
                // But they cannot be the SOURCE of a connection chain unless they are revealed and connected.
                // However, `isValidPlacement` is about "Can I place HERE?".
                // If I place here, and I connect to a neighbor, that connection must be valid.

                // Special case: Placing NEXT to an unrevealed goal.
                // The connection check (my connection vs neighbor connection) usually requires match.
                // But unrevealed goals often don't have defined connections (or act as "all sides open" or "no sides open" depending on rules).
                // In Saboteur, you can "dock" to a goal if you have a path to it.
                // So if neighbor is Unrevealed Goal:
                // We MUST check if WE connect to IT.
                // But does IT connect to US? Unrevealed cards usually accept any connection?
                // Actually in this codebase, unrevealed goals might have specific shapes (like straight/cross) but hidden.
                // Server logic usually handles "reaching" goal.
                // For placement validity:
                // You must connect a path to the goal.

                const isUnrevealedGoal = (neighborCell.card as any).isGoal && !(neighborCell.card as any).isRevealed;

                if (isUnrevealedGoal) {
                    // Start connectivity logic:
                    // If we are connecting TO a goal, we rely on OTHER neighbors for Start Connectivity.
                    // An unrevealed Goal is NOT in `connectedCells` usually (unless we just reached it, but then it would be revealed).
                    // So we don't count connection to Unrevealed Goal as "Connected to Start".

                    // But we still need to check strict connection compatibility?
                    // "If the card is played... the path must fit... with all adjacent cards."
                    // Exception: Goal cards. You just need to point a path TO it.
                    // If myConnection is true, it's a valid "attempt" to connect.
                    // If myConnection is false, and goal thinks it has opening... wait.
                    // Simplification: Ignore connection match for unrevealed goal, BUT don't count it as valid start source.
                    continue;
                }

                // Normal Strict Connection Check
                if (myConnection !== neighborConnection) {
                    return false; // Mismatch with existing neighbor
                }

                // If connection exists (both true), check if neighbor is connected to start
                if (myConnection && neighborConnection) {
                    if (connectedCells.has(nIdx)) {
                        hasValidConnection = true;
                    }
                }
            }
        }

        // Must connect to at least one neighbor that is connected to Start
        return hasValidConnection;
    }
};
