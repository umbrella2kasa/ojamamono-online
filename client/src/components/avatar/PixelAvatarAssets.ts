import { PixelArtData } from './PixelAvatarRenderer';

// Colors
const W = '#FFFFFF';
const B = '#000000';
const TR = null;
const GY = '#888888';
const DY = '#CCAA00'; // Dark yellow / Brownish hair
const Y = '#FFE000'; // Yellow
const R = '#FF4444';
const P = '#FF88EE';
const GR = '#44FF44';
const BR1 = '#8B4513'; // Saddle Brown
const BR2 = '#5D2E0B'; // Dark Brown
const S1 = '#FFDAB9'; // Peach Puff (Skin 1)
const S2 = '#F5AC88'; // Skin 2
const S3 = '#8D5524'; // Skin 3
const S4 = '#C68642'; // Skin 4
const S5 = '#E0AC69'; // Skin 5

const S = 12;

/**
 * Strict Reference Human Factory (Unified 12x12 - Max Volume)
 * Scaled up within the 12x12 space to look larger and more distinct.
 */
function createStrictHuman(
    skin: string,
    hair: string,
    hairStyle: 'bowl' | 'flat' | 'ponies' | 'bob' | 'short' | 'twins' | 'cap',
    mood: 'plain' | 'happy' | 'o' = 'plain'
): PixelArtData {
    const SIZE = 12;
    const g: (string | null)[] = new Array(SIZE * SIZE).fill(TR);

    // Center position
    const cX = 6;
    const cY = 6;

    // Helper to draw pixels relative to center
    const dot = (dx: number, dy: number, color: string | null) => {
        const x = cX + dx;
        const y = cY + dy;
        if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) g[y * SIZE + x] = color;
    };

    // 1. Draw Face (Increased Volume: ~9x7 pixels)
    for (let dy = -2; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) dot(dx, dy, skin);
    }
    // Round chin
    dot(-4, 4, TR); dot(4, 4, TR);
    dot(-3, 4, skin); dot(3, 4, skin); // rounder

    // 2. Draw Hair (Expanded for larger head)
    if (hairStyle === 'bowl') {
        for (let dx = -4; dx <= 4; dx++) dot(dx, -3, hair);
        for (let dx = -5; dx <= 5; dx++) { dot(dx, -2, hair); dot(dx, -1, hair); dot(dx, 0, hair); }
        dot(-5, 1, hair); dot(5, 1, hair);
    } else if (hairStyle === 'flat') {
        for (let dx = -4; dx <= 4; dx++) { dot(dx, -3, hair); dot(dx, -2, hair); }
    } else if (hairStyle === 'ponies') {
        for (let dx = -4; dx <= 4; dx++) dot(dx, -3, hair);
        for (let dx = -5; dx <= 5; dx++) dot(dx, -2, hair);
        dot(-5, -1, hair); dot(-5, 0, hair); dot(-6, 0, hair); dot(-6, 1, hair);
        dot(5, -1, hair); dot(5, 0, hair); dot(6, 0, hair); dot(6, 1, hair);
    } else if (hairStyle === 'bob') {
        for (let dx = -4; dx <= 4; dx++) dot(dx, -3, hair);
        for (let dy = -2; dy <= 4; dy++) { dot(-5, dy, hair); dot(5, dy, hair); }
    } else if (hairStyle === 'short') {
        for (let dx = -3; dx <= 3; dx++) dot(dx, -3, hair);
        dot(0, -4, hair);
    } else if (hairStyle === 'twins') {
        for (let dx = -4; dx <= 4; dx++) dot(dx, -3, hair);
        dot(-5, -2, hair); dot(-6, -2, hair); dot(-6, -1, hair);
        dot(5, -2, hair); dot(6, -2, hair); dot(6, -1, hair);
    } else if (hairStyle === 'cap') {
        for (let dx = -4; dx <= 4; dx++) dot(dx, -3, hair);
        for (let dx = -5; dx <= 2; dx++) dot(dx, -2, hair);
    }

    // 3. Draw Outline (Silhouette based)
    const tempGrid = [...g];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (tempGrid[y * SIZE + x] === null) {
                const n = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dx, dy] of n) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && tempGrid[ny * SIZE + nx] !== null && tempGrid[ny * SIZE + nx] !== B) {
                        g[y * SIZE + x] = B;
                        break;
                    }
                }
            }
        }
    }

    // 4. Draw Features (Low placement, scaled up)
    // Eyes
    dot(-2, 2, B);
    dot(2, 2, B);

    // Mouth
    const mDY = 3;
    if (mood === 'happy') {
        dot(-1, mDY, B); dot(0, mDY, B); dot(1, mDY, B);
    } else if (mood === 'o') {
        dot(0, mDY, B); dot(0, mDY + 1, B);
    } else {
        dot(0, mDY, B);
    }

    return { size: SIZE, grid: g };
}

// Animals (Hand-tuned grids as requested before)
const ANIMAL_CAT: PixelArtData = {
    size: S, grid: [
        GY, TR, TR, TR, TR, TR, TR, TR, TR, TR, GY, TR, TR, GY, TR, TR, TR, TR, TR, TR, TR, GY, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, GY, GY, W, W, GY, GY, GY, GY, W, W, GY, TR, GY, GY, B, W, GY, GY, GY, GY, B, W, GY, TR, GY, GY, GY, GY, GY, B, B, GY, GY, GY, GY, TR, GY, GY, GY, GY, B, W, W, B, GY, GY, GY, TR, GY, GY, GY, GY, GY, B, B, GY, GY, GY, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR
    ]
};

// ... (Defining more animals)
const ANIMAL_DOG: PixelArtData = {
    size: S, grid: [
        TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, BR1, BR1, TR, TR, TR, TR, TR, TR, BR1, BR1, TR, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, TR, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, TR, BR1, W, B, BR1, BR1, BR1, BR1, BR1, W, B, BR1, TR, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, BR1, TR, BR1, BR1, BR1, B, B, B, B, B, BR1, BR1, BR1, TR, BR1, BR1, B, W, W, W, W, W, B, BR1, BR1, TR, TR, BR1, BR1, B, B, B, B, B, BR1, BR1, TR, TR, TR, TR, BR1, BR1, BR1, BR1, BR1, BR1, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR
    ]
};

const ANIMAL_OWL: PixelArtData = {
    size: S, grid: [
        TR, TR, BR2, TR, TR, TR, TR, TR, TR, BR2, TR, TR, TR, BR2, BR2, TR, TR, TR, TR, TR, TR, BR2, BR2, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, BR2, W, W, BR2, BR2, BR2, BR2, BR2, W, W, BR2, TR, BR2, W, B, BR2, BR2, BR2, BR2, BR2, W, B, BR2, TR, BR2, W, W, BR2, BR2, BR2, BR2, BR2, W, W, BR2, TR, BR2, BR2, BR2, TR, Y, Y, Y, Y, TR, BR2, BR2, TR, BR2, BR2, TR, TR, Y, W, W, Y, TR, TR, BR2, TR, BR2, BR2, TR, TR, Y, Y, Y, Y, TR, TR, BR2, TR, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR
    ]
};

// ... Many more will be added in segments to avoid huge tool calls
export const PIXEL_AVATARS: Record<string, PixelArtData> = {
    // 35 Humans: Exact Reference Copy Style
    'h1': createStrictHuman(S1, B, 'bowl', 'plain'),
    'h2': createStrictHuman(S2, BR1, 'flat', 'happy'),
    'h3': createStrictHuman(S3, DY, 'bowl', 'o'),
    'h4': createStrictHuman(S4, B, 'ponies', 'plain'),
    'h5': createStrictHuman(S5, BR2, 'bob', 'happy'),
    'h6': createStrictHuman(S1, GY, 'short', 'plain'),
    'h7': createStrictHuman(S2, R, 'twins', 'happy'),
    'h8': createStrictHuman(S3, B, 'bowl', 'o'),
    'h9': createStrictHuman(S4, BR1, 'flat', 'plain'),
    'h10': createStrictHuman(S5, DY, 'cap', 'happy'),
    'h11': createStrictHuman(S1, B, 'ponies', 'plain'),
    'h12': createStrictHuman(S2, GY, 'bob', 'o'),
    'h13': createStrictHuman(S3, R, 'short', 'plain'),
    'h14': createStrictHuman(S4, B, 'twins', 'happy'),
    'h15': createStrictHuman(S5, BR1, 'bowl', 'o'),
    'h16': createStrictHuman(S1, DY, 'cap', 'plain'),
    'h17': createStrictHuman(S2, B, 'flat', 'happy'),
    'h18': createStrictHuman(S3, GY, 'ponies', 'plain'),
    'h19': createStrictHuman(S4, R, 'bob', 'o'),
    'h20': createStrictHuman(S5, B, 'short', 'plain'),
    'h21': createStrictHuman(S1, BR1, 'twins', 'happy'),
    'h22': createStrictHuman(S2, DY, 'bowl', 'o'),
    'h23': createStrictHuman(S3, B, 'cap', 'plain'),
    'h24': createStrictHuman(S4, GY, 'flat', 'happy'),
    'h25': createStrictHuman(S5, R, 'ponies', 'plain'),
    'h26': createStrictHuman(S1, B, 'bob', 'o'),
    'h27': createStrictHuman(S2, BR1, 'short', 'plain'),
    'h28': createStrictHuman(S3, DY, 'twins', 'happy'),
    'h29': createStrictHuman(S4, B, 'bowl', 'o'),
    'h30': createStrictHuman(S5, GY, 'cap', 'plain'),
    'h31': createStrictHuman(S1, R, 'flat', 'happy'),
    'h32': createStrictHuman(S2, B, 'ponies', 'o'),
    'h33': createStrictHuman(S3, BR1, 'bob', 'plain'),
    'h34': createStrictHuman(S4, DY, 'short', 'happy'),
    'h35': createStrictHuman(S5, B, 'twins', 'plain'),

    // Animals: Correct 12x12 definitions
    'cat': ANIMAL_CAT,
    'dog': ANIMAL_DOG,
    'owl': ANIMAL_OWL,
    'panda': { size: S, grid: [B, B, TR, TR, TR, TR, TR, TR, TR, B, B, TR, B, B, B, TR, TR, TR, TR, TR, B, B, B, TR, B, W, W, W, W, W, W, W, W, W, B, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, B, B, W, W, W, B, B, W, W, TR, W, B, B, B, B, W, B, B, B, B, W, TR, W, B, B, W, B, W, B, W, B, B, W, TR, W, W, B, B, W, B, W, B, B, W, W, TR, W, W, W, W, W, B, W, W, W, W, W, TR, W, W, W, W, B, B, B, W, W, W, W, TR, TR, W, W, W, W, W, W, W, W, W, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'mole': { size: S, grid: [TR, TR, TR, TR, B, B, B, B, TR, TR, TR, TR, TR, TR, B, B, S2, S2, S2, S2, B, B, TR, TR, TR, B, S2, S2, S2, S2, S2, S2, S2, S2, B, TR, TR, B, S2, B, S2, S2, S2, S2, B, S2, B, TR, TR, B, S2, B, S2, S2, S2, S2, B, S2, B, TR, TR, B, S2, S2, S2, R, R, S2, S2, S2, B, TR, TR, B, S2, S2, R, W, W, R, S2, S2, B, TR, TR, B, S2, S2, S2, R, R, S2, S2, S2, B, TR, TR, B, S2, S1, S1, S1, S1, S1, S1, S2, B, TR, TR, B, S2, S2, S2, S2, S2, S2, S2, S2, B, TR, TR, TR, B, B, B, B, B, B, B, B, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'pig': { size: S, grid: [P, P, TR, TR, TR, TR, TR, TR, TR, P, P, TR, P, P, P, TR, TR, TR, TR, TR, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, B, B, P, P, P, B, B, P, P, TR, P, P, B, B, P, P, P, B, B, P, P, TR, P, P, P, P, R, P, R, P, P, P, P, TR, P, P, P, R, W, R, W, R, P, P, P, TR, P, P, P, R, R, R, R, R, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, TR, TR, P, P, P, P, P, P, P, P, P, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'chick': { size: S, grid: [TR, TR, TR, Y, Y, Y, Y, Y, Y, TR, TR, TR, TR, TR, Y, Y, Y, Y, Y, Y, Y, Y, TR, TR, TR, Y, Y, Y, Y, Y, Y, Y, Y, Y, Y, TR, TR, Y, B, Y, Y, Y, Y, Y, Y, B, Y, TR, TR, Y, Y, Y, Y, R, R, Y, Y, Y, Y, TR, TR, Y, Y, Y, R, W, W, R, Y, Y, Y, TR, TR, Y, Y, Y, Y, R, R, Y, Y, Y, Y, TR, TR, Y, Y, Y, Y, Y, Y, Y, Y, Y, Y, TR, TR, TR, Y, Y, Y, Y, Y, Y, Y, Y, TR, TR, TR, TR, TR, R, R, TR, TR, R, R, TR, TR, TR, TR, TR, TR, R, R, TR, TR, R, R, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'penguin': { size: S, grid: [TR, TR, B, B, B, B, B, B, B, B, TR, TR, TR, B, B, B, B, B, B, B, B, B, B, TR, B, B, W, W, B, B, B, B, W, W, B, B, B, B, W, B, W, B, B, W, B, W, B, B, B, B, B, W, W, R, R, W, W, B, B, B, B, B, B, B, R, Y, Y, R, B, B, B, B, B, B, B, B, B, R, R, B, B, B, B, B, B, B, B, W, W, W, W, W, W, B, B, B, B, B, W, W, W, W, W, W, W, W, B, B, TR, B, W, W, W, W, W, W, W, W, B, TR, TR, TR, B, B, B, B, B, B, B, B, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'fox': { size: S, grid: [DY, TR, TR, TR, TR, TR, TR, TR, TR, DY, TR, TR, DY, DY, TR, TR, TR, TR, TR, TR, DY, DY, TR, TR, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, TR, DY, DY, W, W, DY, DY, DY, W, W, DY, DY, TR, DY, DY, B, W, DY, DY, DY, B, W, DY, DY, TR, DY, DY, W, W, DY, DY, DY, W, W, DY, DY, TR, DY, DY, DY, DY, DY, B, DY, DY, DY, DY, DY, TR, DY, DY, DY, DY, B, W, B, DY, DY, DY, DY, TR, DY, DY, DY, DY, DY, B, DY, DY, DY, DY, DY, TR, TR, DY, DY, DY, DY, DY, DY, DY, DY, DY, TR, TR, TR, W, W, TR, TR, TR, TR, TR, W, W, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'bear': { size: S, grid: [BR2, BR2, TR, TR, TR, TR, TR, TR, TR, BR2, BR2, TR, BR2, BR2, BR2, TR, TR, TR, TR, TR, BR2, BR2, BR2, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, BR2, W, B, BR2, BR2, BR2, BR2, BR2, W, B, BR2, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, BR2, BR2, BR2, BR2, B, B, B, BR2, BR2, BR2, BR2, TR, BR2, BR2, BR2, B, W, W, B, BR2, BR2, BR2, BR2, TR, BR2, BR2, BR2, BR2, B, B, B, BR2, BR2, BR2, BR2, TR, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'rabbit': { size: S, grid: [W, W, TR, TR, TR, TR, TR, TR, TR, W, W, TR, W, W, TR, TR, TR, TR, TR, TR, TR, W, W, TR, W, W, TR, TR, TR, TR, TR, TR, TR, W, W, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, B, P, W, W, W, P, B, W, W, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, W, W, P, P, P, W, W, W, W, TR, W, W, W, P, W, P, W, P, W, W, W, TR, TR, W, W, W, P, P, P, W, W, W, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'lion': { size: S, grid: [DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, Y, Y, Y, Y, Y, Y, Y, Y, DY, DY, DY, Y, Y, Y, Y, Y, Y, Y, Y, Y, Y, DY, DY, Y, B, Y, Y, Y, Y, Y, Y, B, Y, DY, DY, Y, Y, Y, Y, Y, Y, Y, Y, Y, Y, DY, DY, Y, Y, Y, Y, B, B, Y, Y, Y, Y, DY, DY, Y, Y, Y, B, W, W, B, Y, Y, Y, DY, DY, Y, Y, Y, Y, B, B, Y, Y, Y, Y, DY, DY, Y, Y, Y, Y, Y, Y, Y, Y, Y, Y, DY, DY, DY, Y, Y, Y, Y, Y, Y, Y, Y, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, DY, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'frog': { size: S, grid: [TR, GR, GR, TR, TR, TR, TR, TR, TR, GR, GR, TR, GR, W, B, GR, TR, TR, TR, TR, GR, W, B, GR, GR, W, W, GR, GR, TR, TR, GR, GR, W, W, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, TR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, TR, GR, GR, B, GR, GR, GR, GR, GR, B, GR, GR, TR, GR, GR, GR, B, B, B, B, B, GR, GR, GR, TR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, TR, TR, GR, GR, GR, GR, GR, GR, GR, GR, GR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'koala': { size: S, grid: [GY, GY, GY, TR, TR, TR, TR, TR, GY, GY, GY, TR, GY, W, GY, TR, TR, TR, TR, TR, GY, W, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, GY, GY, B, GY, GY, GY, GY, GY, B, GY, GY, TR, GY, GY, GY, GY, B, B, B, GY, GY, GY, GY, TR, GY, GY, GY, B, B, B, B, B, GY, GY, GY, TR, GY, GY, GY, GY, B, B, B, GY, GY, GY, GY, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, TR, GY, GY, GY, GY, GY, GY, GY, GY, GY, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR, TR] },
    'monkey': { size: S, grid: [BR2, BR2, TR, TR, TR, TR, TR, TR, TR, BR2, BR2, TR, BR2, BR2, TR, TR, TR, TR, TR, TR, TR, BR2, BR2, TR, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, BR2, TR, BR2, S5, S5, S5, S5, S5, S5, S5, S5, S5, BR2, TR, BR2, S5, B, S5, S5, S5, S5, S5, B, S5, BR2, TR, BR2, S5, S5, S5, S5, S5, S5, S5, S5, S5, BR2, TR, BR2, S5, S5, S5, B, B, B, S5, S5, S5, BR2, TR, BR2, S5, S5, B, W, W, W, B, S5, S5, BR2, TR, BR2, S5, S5, S5, B, B, B, S5, S5, S5, BR2, TR, TR, BR2, S5, S5, S5, S5, S5, S5, S5, BR2, TR, TR, TR, TR, BR2, BR2, BR2, BR2, BR2, BR2, TR, TR, TR, TR] },
    'goat': { size: S, grid: [GY, TR, TR, TR, TR, TR, TR, TR, TR, TR, GY, TR, GY, GY, TR, TR, TR, TR, TR, TR, TR, GY, GY, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, B, W, W, W, W, W, W, W, B, W, TR, W, W, W, W, W, W, W, W, W, W, W, TR, W, W, GY, GY, GY, GY, GY, GY, GY, W, W, TR, W, W, GY, GY, B, B, B, GY, GY, W, W, TR, W, W, GY, GY, GY, GY, GY, GY, GY, W, W, TR, TR, W, W, W, W, W, W, W, W, W, TR, TR, TR, TR, TR, W, W, W, TR, TR, TR, TR, TR, TR, TR, TR, TR, B, B, B, TR, TR, TR, TR, TR, TR] }
};
