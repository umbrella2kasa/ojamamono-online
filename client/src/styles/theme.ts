export const theme = {
    colors: {
        // プライマリカラー（鉱山・洞窟のイメージ）
        primary: {
            50: '#fef3e7',
            100: '#fde0c3',
            200: '#fbcc9b',
            300: '#f9b873',
            400: '#f7a855',
            500: '#f59838',
            600: '#f38932',
            700: '#f1772b',
            800: '#ef6524',
            900: '#ec4517',
        },
        // セカンダリカラー（金・宝石のイメージ）
        secondary: {
            50: '#fff9e6',
            100: '#fff0c0',
            200: '#ffe696',
            300: '#ffdc6c',
            400: '#ffd44d',
            500: '#ffcc2e',
            600: '#ffc729',
            700: '#ffc023',
            800: '#ffb91d',
            900: '#ffad12',
        },
        // ダークモード対応
        dark: {
            bg: '#0a0e1a',
            surface: '#151b2e',
            card: '#1e2740',
            border: '#2d3a5c',
            text: '#e2e8f0',
        },
        // お邪魔ものカラー（危険・障害のイメージ）
        danger: {
            50: '#fee',
            100: '#fecaca',
            500: '#ef4444',
            700: '#dc2626',
            900: '#991b1b',
        },
        // 成功・道カラー
        success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#22c55e',
            700: '#15803d',
            900: '#14532d',
        },
        // 情報・アクションカラー
        info: {
            50: '#eff6ff',
            500: '#3b82f6',
            700: '#1d4ed8',
        },
        // 警告カラー
        warning: {
            50: '#fffbeb',
            500: '#f59e0b',
            700: '#b45309',
        },
    },
    gradients: {
        primary: 'linear-gradient(135deg, #f59838 0%, #ec4517 100%)',
        gold: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
        cave: 'linear-gradient(180deg, #0a0e1a 0%, #1e2740 100%)',
        card: 'linear-gradient(145deg, #1e2740 0%, #2d3a5c 100%)',
        cardHover: 'linear-gradient(145deg, #2d3a5c 0%, #3d4a7c 100%)',
        danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        success: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    },
    shadows: {
        card: '0 10px 30px rgba(0, 0, 0, 0.3), 0 1px 8px rgba(0, 0, 0, 0.2)',
        cardHover: '0 20px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(245, 152, 56, 0.3)',
        glow: '0 0 20px rgba(255, 204, 46, 0.5)',
        glowDanger: '0 0 20px rgba(239, 68, 68, 0.5)',
        glowSuccess: '0 0 20px rgba(34, 197, 94, 0.5)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    animations: {
        duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms',
            verySlow: '800ms',
        },
        easing: {
            smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
        },
    },
    typography: {
        fontFamily: {
            sans: '"Inter", "Noto Sans JP", system-ui, sans-serif',
            display: '"Poppins", "Noto Sans JP", sans-serif',
            mono: '"Fira Code", monospace',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
    },
};

export type Theme = typeof theme;
