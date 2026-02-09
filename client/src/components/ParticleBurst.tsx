import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ParticleBurstProps {
    count?: number;
    color?: string[];
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
    count = 8,
    color = ['#a16207', '#78350f', '#fbbf24'] // Dirt/Gold mix
}) => {
    const [particles] = useState(() => Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 100, // random spread
        y: (Math.random() - 0.5) * 100,
        scale: Math.random() * 0.5 + 0.5,
        color: color[Math.floor(Math.random() * color.length)],
        delay: Math.random() * 0.1
    })));

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
                    animate={{
                        x: p.x,
                        y: p.y,
                        opacity: 0,
                        scale: 0
                    }}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: p.delay
                    }}
                    className="absolute w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                />
            ))}
        </div>
    );
};
