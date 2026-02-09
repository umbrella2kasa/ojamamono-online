import { PlayerStats } from '@ojamamono/shared';

export interface BadgeInfo {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    borderClass: string;
}

export const getBadgeInfo = (stats: PlayerStats | undefined): BadgeInfo => {
    if (!stats || stats.gamePlayed < 3) {
        return {
            name: 'Recruit',
            icon: '🌑',
            color: 'text-gray-400',
            bgColor: 'bg-white/10',
            borderClass: 'rank-border-recruit'
        };
    }

    const winRate = (stats.gameWins / stats.gamePlayed) * 100;

    if (winRate >= 56) {
        return {
            name: 'Legend',
            icon: '✨',
            color: 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 font-black',
            bgColor: 'bg-black/20',
            borderClass: 'animate-rainbow-border'
        };
    }
    if (winRate >= 46) {
        return {
            name: 'Master',
            icon: '💎',
            color: 'text-sky-400',
            bgColor: 'bg-sky-900/30',
            borderClass: 'rank-border-master'
        };
    }
    if (winRate >= 36) {
        return {
            name: 'Elite',
            icon: '🥇',
            color: 'text-amber-400',
            bgColor: 'bg-amber-900/30',
            borderClass: 'rank-border-elite'
        };
    }
    if (winRate >= 26) {
        return {
            name: 'Veteran',
            icon: '🥈',
            color: 'text-slate-300',
            bgColor: 'bg-slate-700/30',
            borderClass: 'rank-border-veteran'
        };
    }
    if (winRate >= 16) {
        return {
            name: 'Explorer',
            icon: '🥉',
            color: 'text-orange-500',
            bgColor: 'bg-orange-800/20',
            borderClass: 'rank-border-explorer'
        };
    }

    return {
        name: 'Recruit',
        icon: '🌑',
        color: 'text-gray-400',
        bgColor: 'bg-white/10',
        borderClass: 'rank-border-recruit'
    };
};
