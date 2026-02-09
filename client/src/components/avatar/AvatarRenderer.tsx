import React from 'react';
import { AvatarConfig } from '@ojamamono/shared';
import { AvatarParts, defaultAvatarConfig } from './AvatarAssets';

interface AvatarRendererProps {
    config?: AvatarConfig;
    size?: number;
    className?: string;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
    config = defaultAvatarConfig,
    size = 100,
    className = ''
}) => {

    // Safety check just in case config is partial or missing keys
    const safeConfig = { ...defaultAvatarConfig, ...config };

    // Retrieve parts
    const facePath = AvatarParts.faceShape[safeConfig.faceShape as keyof typeof AvatarParts.faceShape] || AvatarParts.faceShape.round;
    const eyesPath = AvatarParts.eyes[safeConfig.eyes as keyof typeof AvatarParts.eyes] || AvatarParts.eyes.normal;
    const mouthPath = AvatarParts.mouth[safeConfig.mouth as keyof typeof AvatarParts.mouth] || AvatarParts.mouth.smile;
    const hairPath = AvatarParts.hair[safeConfig.hair as keyof typeof AvatarParts.hair] || AvatarParts.hair.none;
    const accessoryPath = AvatarParts.accessory[safeConfig.accessory as keyof typeof AvatarParts.accessory] || AvatarParts.accessory.none;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={`overflow-visible ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Defs for gradients/filters if needed */}
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#00000033" />
                </filter>
            </defs>

            {/* Hair (Back) - if long hair, maybe render behind? specific logic needed if complex */}

            {/* Face Shape */}
            <path
                d={facePath}
                fill={safeConfig.skinColor}
                stroke="#3e2723"
                strokeWidth="2"
                filter="url(#shadow)"
            />

            {/* Eyes */}
            <path
                d={eyesPath}
                fill="none"
                stroke="#3e2723"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* Mouth */}
            <path
                d={mouthPath}
                fill={(safeConfig.mouth === 'open' || safeConfig.mouth === 'tongue') ? '#D84315' : 'none'}
                stroke="#3e2723"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* Hair (Front) */}
            {hairPath && (
                <path
                    d={hairPath}
                    fill={safeConfig.hairColor}
                    stroke="#212121"
                    strokeWidth="1"
                    filter="url(#shadow)"
                />
            )}

            {/* Accessory */}
            {accessoryPath && (
                <path
                    d={accessoryPath}
                    fill={
                        (safeConfig.accessory === 'glasses' || safeConfig.accessory === 'sunglasses') ? '#3e2723' :
                            (safeConfig.accessory === 'eyePatch' ? '#212121' : safeConfig.hairColor)
                    }
                    fillOpacity={
                        safeConfig.accessory === 'sunglasses' ? 0.8 :
                            (safeConfig.accessory === 'glasses' ? 0 : 1)
                    }
                    stroke="#3e2723"
                    strokeWidth="2"
                />
            )}
        </svg>
    );
};
