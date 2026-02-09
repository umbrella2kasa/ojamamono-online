import React from 'react';
import { Card } from '@ojamamono/shared';
import { CardView } from './Card';

interface CardDetailModalProps {
    card: Card;
    onUseCard: () => void;
    onCancel: () => void;
    canPlay: boolean;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
    card,
    onUseCard,
    onCancel,
    canPlay
}) => {
    const getCardDescription = () => {
        if (card.type === 'PATH') return '道を配置します';
        if (card.type === 'ACTION') {
            const actionType = (card as any).actionType;
            if (actionType === 'ROCKFALL') return '障害物を置きます';
            if (actionType?.startsWith('FIX')) return '道具を修理します';
            if (actionType?.startsWith('BREAK')) return '道具を壊します';
            if (actionType === 'MAP') return 'ゴールを確認します';
        }
        return '';
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onCancel}
        >
            <div
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Card Display */}
                <div className="flex justify-center mb-6">
                    <div className="w-48 h-64">
                        <CardView card={card} />
                    </div>
                </div>

                {/* Card Info */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                        {card.type === 'PATH' ? '道カード' : 'アクションカード'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {getCardDescription()}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {canPlay && (
                        <button
                            onClick={onUseCard}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            このカードを使う
                        </button>
                    )}
                    <button
                        onClick={onCancel}
                        className={`${canPlay ? 'flex-1' : 'w-full'} bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95`}
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};
