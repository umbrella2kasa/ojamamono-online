import { ActionCard, ActionType, GameState, Player, Role, PathCard } from '@ojamamono/shared';
import { GridManager } from './GridManager';

export class ActionManager {
    static handleAction(
        gameState: GameState,
        playerIndex: number,
        card: ActionCard,
        targetPlayerId?: string,
        position?: { x: number, y: number },
        gridManager?: GridManager
    ): { success: boolean, message?: string, mapResult?: string } {
        const player = gameState.players[playerIndex];

        switch (card.actionType) {
            case 'BREAK_PICKAXE':
            case 'BREAK_LANTERN':
            case 'BREAK_CART':
                return this.handleBreak(gameState, player, card.actionType, targetPlayerId);

            case 'FIX_PICKAXE':
            case 'FIX_LANTERN':
            case 'FIX_CART':
            case 'FIX_PICKAXE_LANTERN':
            case 'FIX_PICKAXE_CART':
            case 'FIX_LANTERN_CART':
                return this.handleFix(gameState, player, card.actionType, targetPlayerId);

            case 'MAP':
                return this.handleMap(gameState, position, gridManager);

            case 'ROCKFALL':
                return this.handleRockfall(gameState, position, gridManager);

            default:
                return { success: false, message: 'Unknown action type' };
        }
    }

    private static handleBreak(gameState: GameState, source: Player, type: ActionType, targetId?: string): { success: boolean, message?: string } {
        if (!targetId) return { success: false, message: '対象プレイヤーが必要です' };

        const target = gameState.players.find(p => p.id === targetId);
        if (!target) return { success: false, message: '対象プレイヤーが見つかりません' };

        // 既にお邪魔者であることがバレている場合などは特に制限ないが、
        // 既に壊れている道具をさらに壊すことはできない（ルールによるが、アプリ的には無意味なので禁止でよい）

        let toolKey: 'pickaxe' | 'lantern' | 'cart';
        if (type === 'BREAK_PICKAXE') toolKey = 'pickaxe';
        else if (type === 'BREAK_LANTERN') toolKey = 'lantern';
        else toolKey = 'cart';

        if (target.brokenTools[toolKey]) {
            return { success: false, message: 'その道具は既に壊れています' };
        }

        target.brokenTools[toolKey] = true;
        target.brokenToolDetails[toolKey] = source.name;
        return { success: true };
    }

    private static handleFix(gameState: GameState, source: Player, type: ActionType, targetId?: string): { success: boolean, message?: string } {
        if (!targetId) return { success: false, message: '対象プレイヤーが必要です' };

        const target = gameState.players.find(p => p.id === targetId);
        if (!target) return { success: false, message: '対象プレイヤーが見つかりません' };

        // 直せるかチェック
        // 直せるかチェック
        const isFixAll = type === 'FIX_ALL';
        const canFixPickaxe = (isFixAll || type === 'FIX_PICKAXE' || type === 'FIX_PICKAXE_LANTERN' || type === 'FIX_PICKAXE_CART') && target.brokenTools.pickaxe;
        const canFixLantern = (isFixAll || type === 'FIX_LANTERN' || type === 'FIX_PICKAXE_LANTERN' || type === 'FIX_LANTERN_CART') && target.brokenTools.lantern;
        const canFixCart = (isFixAll || type === 'FIX_CART' || type === 'FIX_PICKAXE_CART' || type === 'FIX_LANTERN_CART') && target.brokenTools.cart;

        if (!canFixPickaxe && !canFixLantern && !canFixCart) {
            return { success: false, message: 'このカードで直せる道具はありません' };
        }

        // 複合カードは2つ同時に修理、単体カードは1つだけ修理
        const fixedTools: string[] = [];

        if (isFixAll) {
            if (canFixPickaxe) {
                target.brokenTools.pickaxe = false;
                target.brokenToolDetails.pickaxe = null;
                fixedTools.push('つるはし');
            }
            if (canFixLantern) {
                target.brokenTools.lantern = false;
                target.brokenToolDetails.lantern = null;
                fixedTools.push('ランプ');
            }
            if (canFixCart) {
                target.brokenTools.cart = false;
                target.brokenToolDetails.cart = null;
                fixedTools.push('トロッコ');
            }
        } else if (type === 'FIX_PICKAXE_LANTERN') {
            // つるはし+ランプを同時修理
            if (canFixPickaxe) {
                target.brokenTools.pickaxe = false;
                target.brokenToolDetails.pickaxe = null;
                fixedTools.push('つるはし');
            }
            if (canFixLantern) {
                target.brokenTools.lantern = false;
                target.brokenToolDetails.lantern = null;
                fixedTools.push('ランプ');
            }
        } else if (type === 'FIX_PICKAXE_CART') {
            // つるはし+トロッコを同時修理
            if (canFixPickaxe) {
                target.brokenTools.pickaxe = false;
                target.brokenToolDetails.pickaxe = null;
                fixedTools.push('つるはし');
            }
            if (canFixCart) {
                target.brokenTools.cart = false;
                target.brokenToolDetails.cart = null;
                fixedTools.push('トロッコ');
            }
        } else if (type === 'FIX_LANTERN_CART') {
            // ランプ+トロッコを同時修理
            if (canFixLantern) {
                target.brokenTools.lantern = false;
                target.brokenToolDetails.lantern = null;
                fixedTools.push('ランプ');
            }
            if (canFixCart) {
                target.brokenTools.cart = false;
                target.brokenToolDetails.cart = null;
                fixedTools.push('トロッコ');
            }
        } else {
            // 単体修理カード
            if (canFixPickaxe) {
                target.brokenTools.pickaxe = false;
                target.brokenToolDetails.pickaxe = null;
                fixedTools.push('つるはし');
            } else if (canFixLantern) {
                target.brokenTools.lantern = false;
                target.brokenToolDetails.lantern = null;
                fixedTools.push('ランプ');
            } else if (canFixCart) {
                target.brokenTools.cart = false;
                target.brokenToolDetails.cart = null;
                fixedTools.push('トロッコ');
            }
        }

        if (fixedTools.length > 0) {
            const toolsText = fixedTools.join('と');
            return { success: true, message: `${target.name}の${toolsText}を修理しました！` };
        }

        return { success: true };
    }

    private static handleMap(gameState: GameState, position?: { x: number, y: number }, gridManager?: GridManager): { success: boolean, message?: string, mapResult?: string } {
        if (!position || !gridManager) return { success: false, message: '座標が必要です' };

        const cell = gridManager.get(position.x, position.y);
        if (!cell || !cell.card.isGoal) {
            return { success: false, message: 'ゴールカードではありません' };
        }

        const goalType = gridManager.peekGoal(position.x, position.y);
        if (!goalType) {
            return { success: false, message: 'ゴールタイプが見つかりません' };
        }

        return { success: true, mapResult: goalType };
    }

    private static handleRockfall(gameState: GameState, position?: { x: number, y: number }, gridManager?: GridManager): { success: boolean, message?: string } {
        if (!position || !gridManager) return { success: false, message: '座標が必要です' };

        const cell = gridManager.get(position.x, position.y);

        // 何もないところ、Start、Goalは破壊できない
        if (!cell) return { success: false, message: '破壊するカードがありません' };
        if (cell.card.isStart || cell.card.isGoal) return { success: false, message: 'スタートまたはゴールは破壊できません' };

        // 破壊実行
        gridManager.removeCard(position.x, position.y);

        return { success: true };
    }
}
