class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        // ユーザー操作があるまでAudioContextは作らない（ブラウザポリシー）
    }

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.ctx;
    }

    private createOscillator(type: OscillatorType, freq: number, duration: number, startTime: number, gainValue: number = 0.1) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(gainValue, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // 初期化（ユーザーインタラクション時に呼ぶ）
    init() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }

    // --- 効果音定義 ---

    // カードを出す音 (カポッ)
    playCardPlace() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        // 短い低音
        this.createOscillator('triangle', 300, 0.1, t, 0.2);
        this.createOscillator('sine', 150, 0.1, t, 0.3);
    }

    // カード配布/シャッフル音 (シュッ)
    playCardShuffle() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        // ホワイトノイズ的な音を作りたいが、簡易的に高周波の短い音で代用
        this.createOscillator('sawtooth', 800, 0.05, t, 0.05);
        this.createOscillator('sine', 1200, 0.05, t + 0.02, 0.03);
    }

    // 金塊発見/勝利音 (キラキラジャリーン！)
    playGoldFound() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // アルペジオ
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major
        notes.forEach((freq, i) => {
            this.createOscillator('sine', freq, 0.5, t + i * 0.1, 0.2);
            this.createOscillator('triangle', freq * 2, 0.5, t + i * 0.1, 0.1); // 倍音
        });

        // 最後にジャリーン
        setTimeout(() => {
            this.createOscillator('square', 523.25, 0.8, ctx.currentTime, 0.1);
            this.createOscillator('sawtooth', 261.63, 0.8, ctx.currentTime, 0.1);
        }, 600);
    }

    // 破壊音 (ガシャーン)
    playBreak() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // 衝撃音（低音）
        this.createOscillator('square', 80, 0.4, t, 0.3);
        // 金属的な響き
        this.createOscillator('sawtooth', 400, 0.2, t, 0.2);
        this.createOscillator('sawtooth', 600, 0.15, t + 0.05, 0.1);
        // ノイズ（崩れ）
        // ノイズバッファを作るのが理想だが、ここでは不協和音で代用
        for (let i = 0; i < 5; i++) {
            this.createOscillator('sawtooth', 100 + Math.random() * 500, 0.3, t, 0.05);
        }
    }

    // 修理音 (カンカン！)
    playFix() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // ハンマー音（高めの金属音）
        const hammer = (time: number) => {
            this.createOscillator('square', 800, 0.1, time, 0.15);
            this.createOscillator('sine', 1600, 0.15, time, 0.1); // 倍音
        };

        hammer(t);
        setTimeout(() => hammer(ctx.currentTime), 250);
    }

    // 全修復音 (魔法のようなキラキラ修復音)
    playFixAll() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // 上昇音（魔法）
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);

        // キラキラ
        const notes = [1200, 1500, 1800, 2000, 2400];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator('triangle', freq, 0.2, ctx.currentTime, 0.05);
            }, i * 100);
        });

        // 最後に解決音
        setTimeout(() => {
            this.createOscillator('sine', 1000, 0.5, ctx.currentTime, 0.2);
        }, 600);
    }

    // マップ使用音 (ペラッ)
    playMap() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        // 紙っぽい短いノイズ（高周波のノコギリ波で代用）
        this.createOscillator('sawtooth', 800, 0.1, t, 0.05);
        this.createOscillator('sawtooth', 1200, 0.1, t + 0.02, 0.03);
    }

    // 落石音 (ズドーン)
    playRockfall() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // 重低音の衝撃
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.5); // ピッチダウン
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);

        // 崩れる音
        this.createOscillator('sawtooth', 60, 0.6, t, 0.2);
        this.createOscillator('square', 40, 0.4, t + 0.1, 0.2);
    }

    // UIクリック音 (ポッ)
    playClick() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        this.createOscillator('sine', 600, 0.05, t, 0.05);
    }

    // エラー音 (ブブー)
    playError() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        this.createOscillator('sawtooth', 150, 0.25, t, 0.15);
        this.createOscillator('square', 100, 0.25, t + 0.05, 0.15);
    }

    // 正解音 (ピンポン！)
    playCorrect() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        this.createOscillator('sine', 523.25, 0.1, t, 0.15); // C5
        this.createOscillator('sine', 659.25, 0.2, t + 0.1, 0.15); // E5
    }

    // 不正解音 (ブッ)
    playWrong() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        this.createOscillator('sawtooth', 150, 0.3, t, 0.2);
    }

    // --- BGM ---
    private bgmOscillators: (OscillatorNode | GainNode)[] = [];
    private isBgmPlaying = false;

    toggleBGM() {
        if (this.isBgmPlaying) {
            this.stopBGM();
        } else {
            this.playBGM();
        }
    }

    playBGM() {
        if (this.isMuted || this.isBgmPlaying) return;

        const ctx = this.getContext();
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.03; // Quiet ambient
        masterGain.connect(ctx.destination);

        // --- Low Drone 1 ---
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 55; // A1

        const gain1 = ctx.createGain();
        gain1.gain.value = 0.5;

        // Volume Modulation (LFO)
        const lfo1 = ctx.createOscillator();
        lfo1.frequency.value = 0.2; // Slow breathe
        const lfoGain1 = ctx.createGain();
        lfoGain1.gain.value = 0.2;
        lfo1.connect(lfoGain1);
        lfoGain1.connect(gain1.gain);
        lfo1.start();

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start();

        // --- Low Drone 2 (Detuned) ---
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 82.41; // E2

        const gain2 = ctx.createGain();
        gain2.gain.value = 0.3;

        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start();

        // --- Higher Shimmer (Wind/Air) ---
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = 220;

        const gain3 = ctx.createGain();
        gain3.gain.value = 0.05;

        // Subtle shimmer LFO
        const lfo3 = ctx.createOscillator();
        lfo3.frequency.value = 3.0;
        const lfoGain3 = ctx.createGain();
        lfoGain3.gain.value = 0.02;
        lfo3.connect(lfoGain3);
        lfoGain3.connect(gain3.gain);
        lfo3.start();

        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start();

        this.bgmOscillators = [osc1, osc2, osc3, lfo1, lfo3, masterGain];
        this.isBgmPlaying = true;
    }

    stopBGM() {
        if (!this.isBgmPlaying) return;

        this.bgmOscillators.forEach(node => {
            try {
                if (node instanceof OscillatorNode) node.stop();
                node.disconnect();
            } catch (e) { }
        });
        this.bgmOscillators = [];
        this.isBgmPlaying = false;
    }
    // ドラムロール（サスペンス）
    playDrumRoll() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // Low rumble
        this.createOscillator('sawtooth', 50, 2.0, t, 0.05);
        this.createOscillator('sine', 40, 2.0, t, 0.1);

        // Rapid ticking
        for (let i = 0; i < 20; i++) {
            this.createOscillator('square', 100 + Math.random() * 50, 0.05, t + i * 0.1, 0.02);
        }
    }

    // 役割発表（ジャジャーン！）
    playRoleReveal(_isGoldDigger: boolean) {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // Neutral Mystery Sound (Suspenseful but ambiguous)
        // low drone
        this.createOscillator('triangle', 150, 2.0, t, 0.2);
        // shimmer
        this.createOscillator('sine', 440, 0.5, t, 0.1);
        this.createOscillator('sine', 880, 0.5, t + 0.1, 0.05);
        this.createOscillator('sine', 660, 0.8, t + 0.2, 0.05);
    }
}

export const soundManager = new SoundManager();
