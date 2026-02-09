import React from 'react';

/**
 * PixelArtData defines the color grid for a 16x16 or 8x8 character.
 * It uses a simple array of strings (hex colors or CSS colors).
 * 'transparent' or null can be used for no color.
 */
export interface PixelArtData {
    grid: (string | null)[];
    size: number; // e.g., 16 for 16x16
}

interface PixelAvatarRendererProps {
    data: PixelArtData;
    size: number; // Display size in pixels
    className?: string;
}

export const PixelAvatarRenderer: React.FC<PixelAvatarRendererProps> = ({
    data,
    size,
    className = ''
}) => {
    const cellSize = 100 / data.size;

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={`shape-rendering-crisp-edges ${className}`}
            style={{ imageRendering: 'pixelated' }}
        >
            {data.grid.map((color, index) => {
                if (!color || color === 'transparent') return null;

                const x = (index % data.size) * cellSize;
                const y = Math.floor(index / data.size) * cellSize;

                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        fill={color}
                    />
                );
            })}
        </svg>
    );
};
