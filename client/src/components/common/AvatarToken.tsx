import React from 'react';
import { motion } from 'framer-motion';
import { AvatarConfig, PlayerStats } from '@ojamamono/shared';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { PixelAvatarRenderer } from '../avatar/PixelAvatarRenderer';
import { PIXEL_AVATARS } from '../avatar/PixelAvatarAssets';
import { getBadgeInfo } from '../../utils/BadgeUtils';

interface AvatarTokenProps {
    avatar: string; // Emoji
    pixelAvatarId?: string; // New Pixel Art ID
    avatarConfig?: AvatarConfig; // Legacy SVG config
    rankStats?: PlayerStats; // To determine border effects
    size?: 'sm' | 'md' | 'lg' | 'xl';
    selected?: boolean;
    onClick?: () => void;
    pulse?: boolean;
    className?: string; // Additional classes
}

export const AvatarToken: React.FC<AvatarTokenProps> = ({
    avatar,
    pixelAvatarId,
    avatarConfig,
    rankStats,
    size = 'md',
    selected = false,
    onClick,
    pulse = false,
    className = ''
}) => {

    const badge = getBadgeInfo(rankStats);

    // Size mapping
    const sizeClasses = {
        sm: 'w-8 h-8 text-lg border-2',
        md: 'w-12 h-12 text-2xl border-4',
        lg: 'w-16 h-16 text-4xl border-4',
        xl: 'w-24 h-24 text-6xl border-8'
    };

    // Pixel sizes for SVG renderer match 
    const svgSizes = {
        sm: 32,
        md: 48,
        lg: 64,
        xl: 96
    };

    const isClickable = !!onClick;

    return (
        <motion.div
            whileHover={isClickable ? { scale: 1.1, y: -2 } : {}}
            whileTap={isClickable ? { scale: 0.95 } : {}}
            animate={pulse ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '0 0 15px rgba(59, 130, 246, 0.5)',
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                ]
            } : {}}
            transition={{ duration: 2, repeat: pulse ? Infinity : 0, repeatType: "reverse" }}
            onClick={onClick}
            className={`
                relative rounded-full flex items-center justify-center font-emoji select-none
                shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_-4px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)]
                bg-gradient-to-br from-slate-100 to-slate-300
                ${sizeClasses[size]}
                ${badge.borderClass}
                ${selected
                    ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-50 border-blue-200 z-10'
                    : rankStats ? '' : 'border-slate-200'}
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                ${className}
            `}
        >
            {/* Inner Ring for "Coin" look */}
            <div className="absolute inset-1 rounded-full border border-slate-400/30 shadow-inner pointer-events-none" />

            {/* Avatar Content */}
            <span className="drop-shadow-sm filter relative z-10 transform -translate-y-[1px] flex items-center justify-center">
                {pixelAvatarId && PIXEL_AVATARS[pixelAvatarId] ? (
                    <PixelAvatarRenderer data={PIXEL_AVATARS[pixelAvatarId]} size={svgSizes[size] * 0.8} />
                ) : avatarConfig ? (
                    <AvatarRenderer config={avatarConfig} size={svgSizes[size] * 0.8} />
                ) : (
                    avatar
                )}
            </span>
        </motion.div>
    );
};
