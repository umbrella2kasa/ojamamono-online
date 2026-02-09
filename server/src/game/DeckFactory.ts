import { PathCard, ActionCard, SpecialCard, GameState, Role, Card, Player, PathShape, ActionType, SpecialActionType } from '@ojamamono/shared';

export const DeckFactory = {
    createDeck(playerCount: number = 4): Card[] {
        let deck: Card[] = [];

        // --- 通路カード (44枚: スタート1 + ゴール3 + 通常40) ---

        // 十字路 (Cross ╋) - 8枚 (調整: 10 -> 8)
        for (let i = 0; i < 8; i++) {
            deck.push(createPathCard({ top: true, bottom: true, left: true, right: true, center: true }));
        }

        // T字路 上なし (T-junction ┳) - 8枚 (調整: 10 -> 8)
        for (let i = 0; i < 8; i++) {
            deck.push(createPathCard({ top: false, bottom: true, left: true, right: true, center: true }));
        }

        // 横直線 (Horizontal straight ━) - 5枚 (調整: 6 -> 5)
        for (let i = 0; i < 5; i++) {
            deck.push(createPathCard({ top: false, bottom: false, left: true, right: true, center: true }));
        }

        // 縦T字路 左なし (Vertical T-junction ┣) - 8枚 (調整: 10 -> 8)
        for (let i = 0; i < 8; i++) {
            deck.push(createPathCard({ top: true, bottom: true, left: false, right: true, center: true }));
        }

        // カーブ 7型 (Curve ┓) - 8枚 (調整: 10 -> 8)
        for (let i = 0; i < 8; i++) {
            deck.push(createPathCard({ top: true, bottom: false, left: true, right: false, center: true }));
        }

        // カーブ r型 (Curve ┏) - 6枚 (調整: 8 -> 6)
        for (let i = 0; i < 6; i++) {
            deck.push(createPathCard({ top: true, bottom: false, left: false, right: true, center: true }));
        }

        // 縦直線 (Vertical straight ┃) - 6枚 (調整: 8 -> 6)
        for (let i = 0; i < 6; i++) {
            deck.push(createPathCard({ top: true, bottom: true, left: false, right: false, center: true }));
        }

        // 行き止まり (Dead ends) - 9枚 (各1枚)

        // 十字 (Cross)
        deck.push(createPathCard({ top: true, bottom: true, left: true, right: true, center: false, deadEnd: true }));
        // 縦 (Vertical)
        deck.push(createPathCard({ top: true, bottom: true, left: false, right: false, center: false, deadEnd: true }));
        // 横 (Horizontal)
        deck.push(createPathCard({ top: false, bottom: false, left: true, right: true, center: false, deadEnd: true }));

        // カーブ (Curves) - 4種
        deck.push(createPathCard({ top: true, bottom: false, left: true, right: false, center: false, deadEnd: true })); // TL
        deck.push(createPathCard({ top: true, bottom: false, left: false, right: true, center: false, deadEnd: true })); // TR
        deck.push(createPathCard({ top: false, bottom: true, left: true, right: false, center: false, deadEnd: true })); // BL
        deck.push(createPathCard({ top: false, bottom: true, left: false, right: true, center: false, deadEnd: true })); // BR

        // T字 (T-junctions) - 2種 (上下のバリエーションを採用)
        deck.push(createPathCard({ top: false, bottom: true, left: true, right: true, center: false, deadEnd: true })); // T-Down (┻)
        deck.push(createPathCard({ top: true, bottom: false, left: true, right: true, center: false, deadEnd: true })); // T-Up (┳)

        // 通常通路カード合計: 5+5+3+5+5+4+4+9 = 40枚
        // クリスタルを追加 (約12枚)
        // ランダムに選ばれたカードにクリスタルを付与する
        let crystalCount = 12;
        // シャッフルしてから先頭12枚にクリスタルをつける
        // ただしdeckにはstart/goalは含まれていない(start/goalは別枠でGridManager管理)
        // ここで作るのは手札用のみなので安全
        deck = shuffle(deck); // 一旦シャッフル
        for (let i = 0; i < crystalCount && i < deck.length; i++) {
            if (deck[i].type === 'PATH') {
                (deck[i] as PathCard).hasCrystal = true;
            }
        }
        // 再度シャッフル (戻り値でシャッフルされるのでOKだが念のため)


        // --- アクションカード ---
        // 破壊 (3種 x 3枚 = 9)
        for (let i = 0; i < 3; i++) deck.push(createActionCard('BREAK_PICKAXE'));
        for (let i = 0; i < 3; i++) deck.push(createActionCard('BREAK_LANTERN'));
        for (let i = 0; i < 3; i++) deck.push(createActionCard('BREAK_CART'));

        // 修復 (3種単体 x 2枚 + 複合3種 x 1枚 = 9) (標準)
        for (let i = 0; i < 2; i++) deck.push(createActionCard('FIX_PICKAXE'));
        for (let i = 0; i < 2; i++) deck.push(createActionCard('FIX_LANTERN'));
        for (let i = 0; i < 2; i++) deck.push(createActionCard('FIX_CART'));
        deck.push(createActionCard('FIX_PICKAXE_LANTERN'));
        deck.push(createActionCard('FIX_PICKAXE_CART'));
        deck.push(createActionCard('FIX_LANTERN_CART'));

        // マップ (4枚) (調整: 2 -> 4)
        for (let i = 0; i < 4; i++) deck.push(createActionCard('MAP'));

        // 全修復 (1枚) (追加)
        deck.push(createActionCard('FIX_ALL'));

        // 落石 (4枚) (調整: 3 -> 4)
        for (let i = 0; i < 4; i++) deck.push(createActionCard('ROCKFALL'));

        return shuffle(deck);
    },
    createSpecialDeck(config?: { dynamite: number; oracle: number; thief: number; trader: number; scavenger: number; doubleAction: number }): Card[] {
        const deck: Card[] = [];
        // Default Config (Recommended)
        const c = config || { dynamite: 1, oracle: 3, thief: 2, trader: 2, scavenger: 1, doubleAction: 1 };

        for (let i = 0; i < c.dynamite; i++) deck.push(createSpecialCard('DYNAMITE'));
        for (let i = 0; i < c.oracle; i++) deck.push(createSpecialCard('ORACLE'));
        for (let i = 0; i < c.thief; i++) deck.push(createSpecialCard('THIEF'));
        for (let i = 0; i < c.trader; i++) deck.push(createSpecialCard('TRADER'));
        for (let i = 0; i < c.scavenger; i++) deck.push(createSpecialCard('SCAVENGER'));
        for (let i = 0; i < c.doubleAction; i++) deck.push(createSpecialCard('DOUBLE_ACTION'));

        return shuffle(deck);
    }
};

function createPathCard(shape: PathShape): PathCard {
    return {
        id: generateId(),
        type: 'PATH',
        shape
    };
}

function createActionCard(actionType: ActionType): ActionCard {
    return {
        id: generateId(),
        type: 'ACTION',
        actionType
    };
}

function createSpecialCard(specialAction: SpecialActionType): SpecialCard {
    return {
        id: generateId(),
        type: 'SPECIAL',
        specialAction
    };
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
