import * as fs from 'fs';
import * as path from 'path';
import { PlayerStats } from '@ojamamono/shared';

const STATS_FILE = path.join(__dirname, '../../player_stats.json');

export class StatsManager {
    private stats: Record<string, PlayerStats> = {};

    constructor() {
        this.loadStats();
    }

    private loadStats() {
        try {
            if (fs.existsSync(STATS_FILE)) {
                const data = fs.readFileSync(STATS_FILE, 'utf-8');
                this.stats = JSON.parse(data);
                console.log(`[StatsManager] Loaded stats for ${Object.keys(this.stats).length} players.`);
            } else {
                this.stats = {};
                this.saveStats();
            }
        } catch (error) {
            console.error('[StatsManager] Failed to load stats:', error);
            this.stats = {};
        }
    }

    private saveStats() {
        try {
            fs.writeFileSync(STATS_FILE, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('[StatsManager] Failed to save stats:', error);
        }
    }

    public getStats(name: string): PlayerStats | null {
        return this.stats[name] || null;
    }

    private getOrCreateStats(name: string): PlayerStats {
        if (!this.stats[name]) {
            this.stats[name] = {
                name,
                roundWins: 0,
                roundPlayed: 0,
                gameWins: 0,
                gamePlayed: 0,
                totalGold: 0,
                lastSeen: Date.now()
            };
        }
        return this.stats[name];
    }

    public recordRoundResult(name: string, isWin: boolean, goldEarned: number = 0) {
        if (name.startsWith('bot-') || name.includes('🤖')) return; // Ignore bots

        const s = this.getOrCreateStats(name);
        s.roundPlayed++;
        if (isWin) s.roundWins++;
        s.totalGold += goldEarned;
        s.lastSeen = Date.now();
        this.saveStats();
    }

    public recordGameResult(name: string, isWin: boolean) {
        if (name.startsWith('bot-') || name.includes('🤖')) return; // Ignore bots

        const s = this.getOrCreateStats(name);
        s.gamePlayed++;
        if (isWin) s.gameWins++;
        s.lastSeen = Date.now();
        this.saveStats();
    }

    public getAllStats(): PlayerStats[] {
        return Object.values(this.stats);
    }
}

export const statsManager = new StatsManager();
