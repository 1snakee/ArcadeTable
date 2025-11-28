export class SoundManager {
    private audioContext: AudioContext | null = null;
    private isMuted: boolean = false;
    private debugMode: boolean = false;
    private masterVolume: number = 0.3;

    constructor(debug: boolean = false) {
        this.debugMode = debug;
        this.loadMuteState();
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private log(message: string) {
        if (this.debugMode) {
            console.log(`[SoundManager] ${message}`);
        }
    }

    private loadMuteState() {
        const stored = localStorage.getItem('casino-sounds-muted');
        this.isMuted = stored === 'true';
    }

    private saveMuteState() {
        localStorage.setItem('casino-sounds-muted', this.isMuted.toString());
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        this.saveMuteState();
        this.log(`Muted: ${this.isMuted}`);
        return this.isMuted;
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
        this.saveMuteState();
    }

    isSoundMuted(): boolean {
        return this.isMuted;
    }

    setVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 1.0) {
        if (this.isMuted) return;

        try {
            const ctx = this.initAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            const now = ctx.currentTime;
            const adjustedVolume = this.masterVolume * volume;

            // ADSR envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + 0.01); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay to near-zero

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }

    private playFrequencySweep(startFreq: number, endFreq: number, duration: number, volume: number = 1.0) {
        if (this.isMuted) return;

        try {
            const ctx = this.initAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';

            const now = ctx.currentTime;
            const adjustedVolume = this.masterVolume * volume;

            // Frequency sweep
            oscillator.frequency.setValueAtTime(startFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

            // Volume envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }

    private playChord(frequencies: number[], duration: number, volume: number = 1.0) {
        if (this.isMuted) return;

        try {
            const ctx = this.initAudioContext();
            const adjustedVolume = this.masterVolume * volume / frequencies.length;

            frequencies.forEach(freq => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.value = freq;

                const now = ctx.currentTime;

                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

                oscillator.start(now);
                oscillator.stop(now + duration);
            });
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }

    private playNoise(duration: number, filterFreq: number = 1000, volume: number = 1.0) {
        if (this.isMuted) return;

        try {
            const ctx = this.initAudioContext();
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = ctx.createBufferSource();
            const filter = ctx.createBiquadFilter();
            const gainNode = ctx.createGain();

            source.buffer = buffer;
            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            filter.type = 'bandpass';
            filter.frequency.value = filterFreq;
            filter.Q.value = 1;

            const now = ctx.currentTime;
            const adjustedVolume = this.masterVolume * volume;

            gainNode.gain.setValueAtTime(adjustedVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            source.start(now);
            source.stop(now + duration);
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }

    // CARD SOUNDS
    playCardSound() {
        this.log('Card dealt');
        this.playTone(440, 0.12, 'sine', 0.4);
    }

    playCardSoundLoud() {
        this.log('Card dealt (third card)');
        this.playTone(440, 0.12, 'sine', 0.6);
    }

    // CHIP SOUNDS
    playChipSound() {
        this.log('Chip placed');
        this.playNoise(0.08, 1000, 0.3);
    }

    playChipRemoveSound() {
        this.log('Chip removed');
        this.playNoise(0.08, 800, 0.2);
    }

    // UI SOUNDS
    playButtonClick() {
        this.log('Button clicked');
        this.playNoise(0.03, 2000, 0.2);
    }

    playConfirmSound() {
        this.log('Confirmed');
        this.playTone(660, 0.1, 'sine', 0.3);
    }

    playDenySound() {
        this.log('Denied');
        this.playTone(330, 0.1, 'sine', 0.3);
    }

    // GAME RESULT SOUNDS
    playWinSound() {
        this.log('Win!');
        this.playFrequencySweep(440, 880, 0.3, 0.4);
    }

    playLoseSound() {
        this.log('Lose');
        this.playFrequencySweep(440, 220, 0.3, 0.3);
    }

    playPushSound() {
        this.log('Push');
        this.playTone(440, 0.15, 'sine', 0.3);
    }

    playBustSound() {
        this.log('Bust!');
        this.playFrequencySweep(600, 150, 0.15, 0.5);
    }

    playBlackjackSound() {
        this.log('Blackjack!');
        // C major chord: C-E-G
        this.playChord([523.25, 659.25, 783.99], 0.4, 0.5);
    }

    playNaturalSound() {
        this.log('Natural 8/9');
        // Bright dyad
        this.playChord([659.25, 987.77], 0.3, 0.4);
    }

    // INSURANCE SOUNDS
    playInsurancePrompt() {
        this.log('Insurance offered');
        this.playTone(523.25, 0.2, 'sine', 0.3);
    }

    // SPECIAL SOUNDS
    playRevealSound() {
        this.log('Reveal phase');
        this.playTone(392, 0.25, 'sine', 0.25);
    }

    playPayoutSound() {
        this.log('Payout');
        this.playChord([523.25, 659.25], 0.25, 0.3);
    }

    // ROULETTE SOUNDS
    playSpinStart() {
        this.log('Spin Start');
        this.playFrequencySweep(200, 800, 0.5, 0.3);
    }

    playSpinLoop() {
        // Optional: continuous whoosh
    }

    playSpinStop() {
        this.log('Spin Stop');
        this.playTone(800, 0.1, 'sine', 0.3);
    }
}

// Global singleton instance
export const soundManager = new SoundManager(false); // Set to true for debug mode
