import { useState } from 'react';
import { ParticleEffect } from './components/effects/ParticleEffect';
import { theme } from './styles/theme';

export function VisualDemo() {
    const [showParticles, setShowParticles] = useState(false);
    const [particleType, setParticleType] = useState<'cardPlay' | 'victory' | 'danger' | 'repair'>('cardPlay');

    const triggerParticles = (type: typeof particleType) => {
        setParticleType(type);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2000);
    };

    return (
        <div className="min-h-screen" style={{ background: theme.gradients.cave }}>
            {/* ヘッダー */}
            <div className="p-6 text-center">
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: theme.typography.fontFamily.display }}>
                    お邪魔もの Online - ビジュアルデモ
                </h1>
                <p className="text-gray-300">3Dボード＆エフェクトプレビュー</p>
            </div>

            {/* 3Dボードエリア */}
            <div className="max-w-6xl mx-auto px-4">
                <div
                    className="rounded-2xl overflow-hidden shadow-2xl mb-8 flex items-center justify-center"
                    style={{
                        height: '600px',
                        boxShadow: theme.shadows.card,
                        background: 'linear-gradient(135deg, #1e2740 0%, #2d3a5c 100%)'
                    }}
                >
                    <div className="text-center">
                        <p className="text-white text-3xl mb-4">🎮 3Dボード</p>
                        <p className="text-gray-400">ゲーム画面で確認してください</p>
                        <p className="text-gray-500 text-sm mt-2">（デモページは一時的に無効化）</p>
                    </div>
                </div>

                {/* エフェクトコントロール */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">パーティクルエフェクト</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => triggerParticles('cardPlay')}
                            className="px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                            style={{
                                background: theme.gradients.gold,
                                boxShadow: theme.shadows.card
                            }}
                        >
                            ✨ カードプレイ
                        </button>
                        <button
                            onClick={() => triggerParticles('victory')}
                            className="px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                            style={{
                                background: theme.gradients.success,
                                boxShadow: theme.shadows.card
                            }}
                        >
                            🎉 勝利
                        </button>
                        <button
                            onClick={() => triggerParticles('danger')}
                            className="px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                            style={{
                                background: theme.gradients.danger,
                                boxShadow: theme.shadows.card
                            }}
                        >
                            💥 お邪魔もの
                        </button>
                        <button
                            onClick={() => triggerParticles('repair')}
                            className="px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                boxShadow: theme.shadows.card
                            }}
                        >
                            🔧 修理
                        </button>
                    </div>
                </div>

                {/* カラーパレット表示 */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">カラーパレット</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <div className="text-sm text-gray-400 mb-2">プライマリ</div>
                            <div className="flex gap-2">
                                {[500, 700, 900].map(shade => (
                                    <div
                                        key={shade}
                                        className="w-12 h-12 rounded-lg shadow-lg"
                                        style={{ backgroundColor: theme.colors.primary[shade as keyof typeof theme.colors.primary] }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-2">セカンダリ</div>
                            <div className="flex gap-2">
                                {[500, 700, 900].map(shade => (
                                    <div
                                        key={shade}
                                        className="w-12 h-12 rounded-lg shadow-lg"
                                        style={{ backgroundColor: theme.colors.secondary[shade as keyof typeof theme.colors.secondary] }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-2">危険</div>
                            <div className="flex gap-2">
                                {[500, 700, 900].map(shade => (
                                    <div
                                        key={shade}
                                        className="w-12 h-12 rounded-lg shadow-lg"
                                        style={{ backgroundColor: theme.colors.danger[shade as keyof typeof theme.colors.danger] }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-2">成功</div>
                            <div className="flex gap-2">
                                {[500, 700, 900].map(shade => (
                                    <div
                                        key={shade}
                                        className="w-12 h-12 rounded-lg shadow-lg"
                                        style={{ backgroundColor: theme.colors.success[shade as keyof typeof theme.colors.success] }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-2">情報</div>
                            <div className="flex gap-2">
                                {[500, 700].map(shade => (
                                    <div
                                        key={shade}
                                        className="w-12 h-12 rounded-lg shadow-lg"
                                        style={{ backgroundColor: theme.colors.info[shade as keyof typeof theme.colors.info] }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* パーティクルエフェクト */}
            {showParticles && (
                <ParticleEffect
                    type={particleType}
                    position={{ x: 50, y: 50 }}
                    duration={2000}
                />
            )}
        </div>
    );
}
