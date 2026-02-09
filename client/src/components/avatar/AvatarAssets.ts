import { AvatarConfig } from '@ojamamono/shared';

export const AvatarColors = {
    skin: [
        '#F9DCBF', // Light
        '#E6C19C', // Medium Light
        '#D0A785', // Medium
        '#A67C52', // Dark
        '#795548', // Darker
        '#FFD1DC', // Pinkish (Fantasy)
        '#C2E0E0', // Blueish (Ice Dwarf)
        '#C0D9AF', // Greenish (Forest Dwarf)
    ],
    hair: [
        '#2C2C2C', // Black
        '#4E342E', // Dark Brown
        '#795548', // Brown
        '#A1887F', // Light Brown
        '#D7CCC8', // White/Grey
        '#FFD54F', // Blonde
        '#FF8A65', // Red
        '#90CAF9', // Blue
    ]
};

export const AvatarParts = {
    faceShape: {
        'round': 'M 10,50 Q 10,10 50,10 Q 90,10 90,50 Q 90,90 50,90 Q 10,90 10,50 Z',
        'square': 'M 15,15 L 85,15 L 85,85 L 15,85 Z',
        'oval': 'M 20,10 L 80,10 C 95,10 95,90 80,90 L 20,90 C 5,90 5,10 20,10 Z'
    },
    eyes: {
        'normal': 'M 25,45 Q 35,35 45,45 M 55,45 Q 65,35 75,45', // Arcs
        'dots': 'M 30,45 A 2,2 0 1,1 30.1,45 M 70,45 A 2,2 0 1,1 70.1,45', // Dots
        'happy': 'M 25,45 Q 35,35 45,45 M 55,45 Q 65,35 75,45', // Reuse Arcs (Placeholder)
        'sleepy': 'M 25,45 L 45,45 M 55,45 L 75,45', // Lines
        'angry': 'M 25,40 L 45,50 M 55,50 L 75,40', // Slanted
        'wink': 'M 30,45 A 2,2 0 1,1 30.1,45 M 55,45 L 75,45', // Dot + Line
        'surprised': 'M 25,45 A 5,8 0 1,1 25.1,45 M 65,45 A 5,8 0 1,1 65.1,45', // Open Ovals
        'hearts': 'M 25,45 L 30,50 L 35,45 M 25,45 Q 27,40 30,45 Q 33,40 35,45 M 65,45 L 70,50 L 75,45 M 65,45 Q 67,40 70,45 Q 73,40 75,45' // Simple Heart shape approximation
    },
    mouth: {
        'smile': 'M 30,65 Q 50,80 70,65',
        'frown': 'M 30,75 Q 50,60 70,75',
        'neutral': 'M 35,70 L 65,70',
        'open': 'M 35,70 Q 50,85 65,70 Z',
        'smirk': 'M 30,70 Q 50,75 70,65',
        'tongue': 'M 35,70 L 65,70 M 45,70 Q 50,85 55,70 Z' // Straight line with tongue loop (closed)
    },
    hair: {
        'none': '',
        'short': 'M 10,50 C 10,20 20,5 50,5 C 80,5 90,20 90,50 L 90,40 C 90,10 10,10 10,40 Z',
        'long': 'M 10,50 C 10,10 90,10 90,50 L 95,90 L 80,90 L 80,50 C 80,20 20,20 20,50 L 20,90 L 5,90 Z',
        'spiky': 'M 10,50 L 20,10 L 30,40 L 50,5 L 70,40 L 80,10 L 90,50 Z',
        'mohawk': 'M 40,50 L 45,5 L 55,5 L 60,50 Z',
    },
    accessory: {
        'none': '',
        'glasses': 'M 20,45 A 12,12 0 1,1 44,45 M 56,45 A 12,12 0 1,1 80,45 M 44,45 L 56,45',
        'sunglasses': 'M 20,40 L 44,40 L 40,55 L 24,55 Z M 56,40 L 80,40 L 76,55 L 60,55 Z M 44,42 L 56,42',
        'beard': 'M 20,60 Q 50,110 80,60 L 70,60 Q 50,90 30,60 Z',
        'mustache': 'M 30,65 Q 50,60 70,65 Q 75,70 65,70 Q 50,65 35,70 Q 25,70 30,65 Z',
        'eyePatch': 'M 20,35 L 80,55 M 25,40 A 10,10 0 1,1 45,40 L 25,40 Z' // Strap + Patch
    }
};

export const defaultAvatarConfig: AvatarConfig = {
    skinColor: AvatarColors.skin[0],
    hairColor: AvatarColors.hair[0],
    faceShape: 'round',
    eyes: 'normal',
    mouth: 'smile',
    hair: 'short',
    accessory: 'none'
};

export const PRESET_AVATARS: AvatarConfig[] = [
    { ...defaultAvatarConfig },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[1], hair: 'spiky', hairColor: AvatarColors.hair[1] },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[2], faceShape: 'square', hair: 'none', accessory: 'beard' },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[3], eyes: 'dot', mouth: 'neutral', hair: 'mohawk' },
    { ...defaultAvatarConfig, eyes: 'angry', accessory: 'eyePatch', hairColor: AvatarColors.hair[2] },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[4], hair: 'long', hairColor: AvatarColors.hair[3] },
    { ...defaultAvatarConfig, eyes: 'surprised', mouth: 'open', accessory: 'glasses' },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[5], hair: 'short', accessory: 'mustache' },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[6], eyes: 'sleepy', mouth: 'smirk' },
    { ...defaultAvatarConfig, faceShape: 'oval', eyes: 'happy', hair: 'spiky' },
    { ...defaultAvatarConfig, skinColor: AvatarColors.skin[7], hair: 'none', accessory: 'beard', hairColor: AvatarColors.hair[4] },
    { ...defaultAvatarConfig, eyes: 'wink', mouth: 'tongue', accessory: 'sunglasses' },
];
