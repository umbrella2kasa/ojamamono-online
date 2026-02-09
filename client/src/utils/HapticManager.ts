export class HapticManager {
    private static instance: HapticManager;
    private enabled: boolean = true;

    private constructor() { }

    public static getInstance(): HapticManager {
        if (!HapticManager.instance) {
            HapticManager.instance = new HapticManager();
        }
        return HapticManager.instance;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    public vibrate(pattern: number | number[]) {
        if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) {
            return;
        }
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore if vibration is blocked or not supported
            console.warn('Vibration failed', e);
        }
    }

    // Predefined patterns
    public light() { this.vibrate(10); } // Short click feel
    public medium() { this.vibrate(25); } // Standard feedback
    public heavy() { this.vibrate([30, 10, 30]); } // Noticeable bump (e.g. error)
    public success() { this.vibrate([10, 50, 20]); } // Positive feedback
    public error() { this.vibrate([50, 30, 50, 30, 50]); } // Warning buzz
}

export const hapticManager = HapticManager.getInstance();
