import React, { useState } from 'react';
import { AvatarConfig } from '@ojamamono/shared';
import { AvatarRenderer } from './AvatarRenderer';
import { AvatarParts, AvatarColors, defaultAvatarConfig } from './AvatarAssets';


interface AvatarEditorProps {
    initialConfig?: AvatarConfig;
    onChange: (config: AvatarConfig) => void;
    onClose: () => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ initialConfig = defaultAvatarConfig, onChange, onClose }) => {
    const [config, setConfig] = useState<AvatarConfig>(initialConfig);
    const [activeTab, setActiveTab] = useState<'Face' | 'Eyes' | 'Mouth' | 'Hair' | 'Acc'>('Face');

    const handleChange = (key: keyof AvatarConfig, value: string) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const handleRandomize = () => {
        const randomKey = (obj: object) => {
            const keys = Object.keys(obj);
            return keys[Math.floor(Math.random() * keys.length)];
        };
        const randomColor = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        const newConfig: AvatarConfig = {
            skinColor: randomColor(AvatarColors.skin),
            hairColor: randomColor(AvatarColors.hair),
            faceShape: randomKey(AvatarParts.faceShape),
            eyes: randomKey(AvatarParts.eyes),
            mouth: randomKey(AvatarParts.mouth),
            hair: randomKey(AvatarParts.hair),
            accessory: randomKey(AvatarParts.accessory)
        };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const TabButton = ({ name }: { name: typeof activeTab }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-3 py-1 text-sm font-bold rounded-t-lg transition-colors ${activeTab === name
                ? 'bg-slate-700 text-white border-t border-x border-slate-600'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
        >
            {name}
        </button>
    );

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-full max-w-md">
            <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 bg-sky-100 rounded-full border-4 border-white shadow-inner flex items-center justify-center mb-4 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/80 to-transparent z-0 pointer-events-none" />
                    <AvatarRenderer config={config} size={100} className="z-10" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRandomize}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold shadow"
                    >
                        🎲 Randomize
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-600 mb-4 gap-1">
                <TabButton name="Face" />
                <TabButton name="Eyes" />
                <TabButton name="Mouth" />
                <TabButton name="Hair" />
                <TabButton name="Acc" />
            </div>

            {/* Controls */}
            <div className="h-48 overflow-y-auto custom-scrollbar p-2">
                <div className="space-y-4">

                    {activeTab === 'Face' && (
                        <>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Face Shape</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(AvatarParts.faceShape).map(key => (
                                        <button
                                            key={key}
                                            onClick={() => handleChange('faceShape', key)}
                                            className={`p-2 rounded border text-xs capitalize ${config.faceShape === key ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Skin Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {AvatarColors.skin.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('skinColor', color)}
                                            className={`w-6 h-6 rounded-full border-2 ${config.skinColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Eyes' && (
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(AvatarParts.eyes).map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleChange('eyes', key)}
                                    className={`p-2 rounded border text-xs capitalize ${config.eyes === key ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Mouth' && (
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(AvatarParts.mouth).map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleChange('mouth', key)}
                                    className={`p-2 rounded border text-xs capitalize ${config.mouth === key ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Hair' && (
                        <>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Style</label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {Object.keys(AvatarParts.hair).map(key => (
                                        <button
                                            key={key}
                                            onClick={() => handleChange('hair', key)}
                                            className={`p-2 rounded border text-xs capitalize ${config.hair === key ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {AvatarColors.hair.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('hairColor', color)}
                                            className={`w-6 h-6 rounded-full border-2 ${config.hairColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Acc' && (
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(AvatarParts.accessory).map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleChange('accessory', key)}
                                    className={`p-2 rounded border text-xs capitalize ${config.accessory === key ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-gray-300'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow"
                >
                    Done
                </button>
            </div>
        </div>
    );
};
