import { useCallback, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine } from '@tsparticles/engine';

interface ParticleEffectProps {
    type: 'cardPlay' | 'victory' | 'danger' | 'repair';
    position?: { x: number; y: number };
    duration?: number;
    onComplete?: () => void;
}

export function ParticleEffect({ type, position = { x: 50, y: 50 }, duration = 1000, onComplete }: ParticleEffectProps) {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    useEffect(() => {
        if (duration && onComplete) {
            const timer = setTimeout(onComplete, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onComplete]);

    const particlesLoaded = useCallback(async (_container?: Container) => {
        // Particles loaded
    }, []);

    if (!init) return null;

    const options = getParticleOptions(type, position);

    return (
        <Particles
            id={`particles-${type}-${Date.now()}`}
            particlesLoaded={particlesLoaded}
            options={options}
            className="absolute inset-0 pointer-events-none"
        />
    );
}

function getParticleOptions(type: string, position: { x: number; y: number }) {
    const baseOptions = {
        fullScreen: false,
        background: {
            color: {
                value: 'transparent',
            },
        },
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: { enable: false },
                onHover: { enable: false },
            },
        },
    };

    switch (type) {
        case 'cardPlay':
            return {
                ...baseOptions,
                particles: {
                    number: { value: 30 },
                    color: { value: ['#ffd700', '#ffed4e', '#f59838', '#ffcc2e'] },
                    shape: { type: ['star', 'circle'] },
                    opacity: {
                        value: 1,
                        animation: {
                            enable: true,
                            speed: 2,
                            minimumValue: 0,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 2, max: 6 },
                    },
                    move: {
                        enable: true,
                        speed: { min: 2, max: 5 },
                        direction: 'top' as const,
                        outModes: { default: 'destroy' as const },
                        random: true,
                    },
                },
                emitters: {
                    position: { x: position.x, y: position.y },
                    rate: { delay: 0.05, quantity: 3 },
                    life: { duration: 0.8, count: 1 },
                },
            };

        case 'victory':
            return {
                ...baseOptions,
                particles: {
                    number: { value: 100 },
                    color: { value: ['#ffd700', '#ffed4e', '#f59838', '#22c55e'] },
                    shape: { type: ['star', 'circle', 'square'] },
                    opacity: {
                        value: 1,
                        animation: {
                            enable: true,
                            speed: 1,
                            minimumValue: 0,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 3, max: 8 },
                    },
                    move: {
                        enable: true,
                        speed: { min: 1, max: 4 },
                        direction: 'bottom' as const,
                        outModes: { default: 'destroy' as const },
                        gravity: {
                            enable: true,
                            acceleration: 2,
                        },
                    },
                    rotate: {
                        value: { min: 0, max: 360 },
                        direction: 'random',
                        animation: {
                            enable: true,
                            speed: 10,
                        },
                    },
                },
                emitters: [
                    {
                        position: { x: 25, y: 0 },
                        rate: { delay: 0.1, quantity: 5 },
                        life: { duration: 2, count: 1 },
                    },
                    {
                        position: { x: 50, y: 0 },
                        rate: { delay: 0.1, quantity: 5 },
                        life: { duration: 2, count: 1 },
                    },
                    {
                        position: { x: 75, y: 0 },
                        rate: { delay: 0.1, quantity: 5 },
                        life: { duration: 2, count: 1 },
                    },
                ],
            };

        case 'danger':
            return {
                ...baseOptions,
                particles: {
                    number: { value: 50 },
                    color: { value: ['#ef4444', '#dc2626', '#991b1b'] },
                    shape: { type: ['triangle', 'square'] },
                    opacity: {
                        value: 0.8,
                        animation: {
                            enable: true,
                            speed: 3,
                            minimumValue: 0,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 3, max: 7 },
                    },
                    move: {
                        enable: true,
                        speed: { min: 3, max: 6 },
                        direction: 'none' as const,
                        outModes: { default: 'destroy' as const },
                        random: true,
                    },
                },
                emitters: {
                    position: { x: position.x, y: position.y },
                    rate: { delay: 0.05, quantity: 5 },
                    life: { duration: 0.6, count: 1 },
                },
            };

        case 'repair':
            return {
                ...baseOptions,
                particles: {
                    number: { value: 20 },
                    color: { value: ['#3b82f6', '#60a5fa', '#93c5fd'] },
                    shape: { type: ['circle', 'square'] },
                    opacity: {
                        value: 1,
                        animation: {
                            enable: true,
                            speed: 2,
                            minimumValue: 0,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 2, max: 5 },
                    },
                    move: {
                        enable: true,
                        speed: { min: 2, max: 4 },
                        direction: 'top' as const,
                        outModes: { default: 'destroy' as const },
                    },
                },
                emitters: {
                    position: { x: position.x, y: position.y },
                    rate: { delay: 0.1, quantity: 2 },
                    life: { duration: 1, count: 1 },
                },
            };

        default:
            return baseOptions;
    }
}
