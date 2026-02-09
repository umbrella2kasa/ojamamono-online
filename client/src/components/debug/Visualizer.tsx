import React, { useState } from 'react';

// interface LogEntry {
//     type: string;
//     payload: any;
//     timestamp: number;
// }

export const Visualizer: React.FC = () => {
    const [logText, setLogText] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [step, setStep] = useState(0);

    const parseLog = () => {
        try {
            // Simple parser: assumes log lines are JSON or have a specific format
            // For now, let's look for grid states or card placements in the text
            const lines = logText.split('\n');
            const states: any[] = [];

            lines.forEach(line => {
                if (line.includes('Grid layout updated')) {
                    // Example regex to extract data if it's logged as JSON
                    const match = line.match(/\{.*\}/);
                    if (match) {
                        states.push(JSON.parse(match[0]));
                    }
                }
            });

            if (states.length > 0) {
                setHistory(states);
                setStep(0);
            } else {
                alert('有効なログデータが見つかりませんでした。「Grid layout updated」を含むJSON形式のログが必要です。');
            }
        } catch (e) {
            console.error(e);
            alert('ログの解析に失敗しました。');
        }
    };

    const currentBoard = history[step] || null;

    return (
        <div className="p-4 bg-gray-900 min-h-screen text-white">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">🔍 シミュレーション・ビジュアライザー</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-base font-bold mb-2 text-white">📋 ログを貼り付けてください</label>
                    <textarea
                        className="w-full h-48 bg-gray-800 border-2 border-gray-600 rounded p-3 text-white text-sm font-mono focus:border-yellow-500 focus:outline-none"
                        value={logText}
                        onChange={(e) => setLogText(e.target.value)}
                        placeholder='{"grid": ...} を含むログをペースト'
                    />
                    <button
                        onClick={parseLog}
                        className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition-all active:scale-95"
                    >
                        ログを解析
                    </button>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600">
                    <h3 className="text-xl font-bold mb-4 text-white">⏯️ コントロール</h3>
                    <div className="flex items-center gap-4 justify-center">
                        <button
                            disabled={step === 0}
                            onClick={() => setStep(s => s - 1)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            ◀ 前へ
                        </button>
                        <span className="text-2xl font-bold text-yellow-400 min-w-[100px] text-center">{step + 1} / {history.length || 1}</span>
                        <button
                            disabled={step >= history.length - 1}
                            onClick={() => setStep(s => s + 1)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            次へ ▶
                        </button>
                    </div>
                </div>
            </div>

            {currentBoard && (
                <div className="overflow-auto border-2 border-gray-600 p-6 bg-black rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-white">🗺️ 盤面</h3>
                    <div
                        className="grid gap-1 mx-auto"
                        style={{
                            gridTemplateColumns: `repeat(${currentBoard.width || 15}, 40px)`,
                            width: 'max-content'
                        }}
                    >
                        {Array.from({ length: (currentBoard.height || 10) * (currentBoard.width || 15) }).map((_, i) => {
                            const x = i % (currentBoard.width || 15);
                            const y = Math.floor(i / (currentBoard.width || 15));
                            const card = currentBoard.cards?.find((c: any) => c.x === x && c.y === y);

                            return (
                                <div
                                    key={`${x}-${y}`}
                                    className={`w-10 h-14 border-2 flex items-center justify-center text-xs font-bold rounded transition-colors ${card ? 'bg-amber-700 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 opacity-20 text-gray-600'
                                        }`}
                                    title={`(${x}, ${y})`}
                                >
                                    {card ? (card.type || 'C') : ''}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
