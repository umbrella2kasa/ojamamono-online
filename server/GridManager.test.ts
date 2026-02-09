import { GridManager } from './src/game/GridManager';
import { PathCard } from '@ojamamono/shared';

describe('GridManager', () => {
    let grid: GridManager;

    beforeEach(() => {
        grid = new GridManager();
    });

    test('should initialize with Start card at (2,4) and Goals at x=9', () => {
        const start = grid.get(2, 4);
        expect(start).not.toBeNull();
        expect(start?.card.isStart).toBe(true);

        const goals = [2, 4, 6].map(y => grid.get(9, y));
        goals.forEach(g => {
            expect(g).not.toBeNull();
            expect(g?.card.isGoal).toBe(true);
        });
    });

    test('should allow valid placement next to start', () => {
        // Start is at (2,4). It is a CROSS (all true).
        // Place a horizontal path at (3,4) connecting to it.
        const card: PathCard = {
            id: 'test_card',
            type: 'PATH',
            shape: { top: false, bottom: false, left: true, right: true, center: true },
        };

        // (3,4) is right of (2,4). 'left' of new card connects to 'right' of start.
        const result = grid.validatePlacement(3, 4, card, false);
        expect(result.valid).toBe(true);

        grid.placeCard(3, 4, card, false);
        expect(grid.get(3, 4)).not.toBeNull();
    });

    test('should reject placement with mismatch', () => {
        // Place a vertical-only path at (3,4) next to Start(2,4)
        // Start(2,4) right is TRUE.
        // New card(3,4) left is FALSE. -> Mismatch.
        const card: PathCard = {
            id: 'test_card_fail',
            type: 'PATH',
            shape: { top: true, bottom: true, left: false, right: false, center: true },
        };

        const result = grid.validatePlacement(3, 4, card, false);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Mismatch');
    });
});
