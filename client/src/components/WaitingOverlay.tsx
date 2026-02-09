import React from 'react';

export const WaitingOverlay: React.FC<{ count: number, total: number }> = ({ count, total }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-white text-2xl font-bold animate-pulse mb-4">
                他のプレイヤーを待っています...
            </div>
            <div className="text-4xl font-mono text-yellow-500 font-bold">
                {count} / {total}
            </div>
            <div className="mt-8 flex gap-2">
                {[...Array(total)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < count ? 'bg-green-500' : 'bg-gray-700'}`} />
                ))}
            </div>
        </div>
    );
};
