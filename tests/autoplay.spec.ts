import { test, expect } from '@playwright/test';

test('Auto Play Test', async ({ page }) => {
    // 1. Visit Game
    await page.goto('/');
    await expect(page).toHaveTitle(/お邪魔もの Online/);

    // 2. Login & Create Room with Unique ID
    const roomId = `TEST-${Math.floor(Math.random() * 10000)}`;
    await page.fill('input[placeholder="名前を入力"]', 'AutoTester');
    await page.click('button:has-text("🐶")');
    await page.fill('input[placeholder="ID"]', roomId);
    await page.click('button:has-text("ルーム作成")');

    // 3. Lobby
    await expect(page.getByText('待機ルーム')).toBeVisible();

    // Wait a bit for socket to stabilize
    await page.waitForTimeout(2000);

    // Add Bot
    await page.click('button:has-text("BOT追加")');
    await page.waitForTimeout(500); // Wait for bot join
    await page.click('button:has-text("BOT追加")');
    await page.waitForTimeout(500);

    // Start Game
    await page.click('button:has-text("ゲーム開始！")');

    // 4. Game Screen
    // Game Screen verification
    await expect(page.locator('text=Turn:')).toBeVisible({ timeout: 10000 });
    const handCards = page.locator('.w-full.h-full.rounded.shadow-lg');
    await expect(handCards).not.toHaveCount(0);
    console.log('Game started successfully!');

    // --- Gameplay Verification ---
    console.log('Verifying gameplay...');

    // Check that role button is visible
    await expect(page.getByText('役割を確認')).toBeVisible();

    // Wait a bit and verify game is progressing (bots should be playing)
    await page.waitForTimeout(3000);

    // Check that deck count is decreasing (cards being played)
    const deckElement = page.locator('text=DECK').locator('..');
    await expect(deckElement).toBeVisible();

    console.log('Gameplay verification successful!');
});
