/* ============================================
   Flash Fighter - Audio Manager (Web Audio API)
   ============================================ */
FF.Audio = class {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicGain = null;
        this.sfxGain = null;
        this.bgmPlaying = false;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.ctx.destination);
        } catch (e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    _noise(duration, volume, filterFreq, filterQ) {
        if (!this.enabled || !this.ctx) return;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buf = this.ctx.createBuffer(1, len, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * volume;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = filterFreq || 800;
        filt.Q.value = filterQ || 1;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(volume, this.ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        src.connect(filt);
        filt.connect(env);
        env.connect(this.sfxGain);
        src.start();
    }

    _tone(freq, duration, type, volume) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(volume || 0.3, this.ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    play(name) {
        if (!this.enabled) return;
        this.resume();
        switch (name) {
            case 'punch':
                this._noise(0.08, 0.6, 1200, 2);
                this._tone(200, 0.05, 'square', 0.2);
                break;
            case 'heavyPunch':
                this._noise(0.12, 0.8, 600, 1.5);
                this._tone(120, 0.08, 'square', 0.3);
                this._tone(80, 0.1, 'sine', 0.2);
                break;
            case 'kick':
                this._noise(0.1, 0.7, 900, 1.8);
                this._tone(150, 0.06, 'triangle', 0.25);
                break;
            case 'heavyKick':
                this._noise(0.15, 0.9, 500, 1.2);
                this._tone(100, 0.1, 'square', 0.35);
                break;
            case 'hit':
                this._noise(0.06, 0.5, 2000, 3);
                this._tone(300, 0.04, 'square', 0.15);
                break;
            case 'block':
                this._tone(800, 0.05, 'square', 0.2);
                this._noise(0.04, 0.3, 3000, 5);
                break;
            case 'special':
                this._noise(0.3, 1.0, 400, 0.8);
                this._tone(60, 0.2, 'sawtooth', 0.4);
                this._tone(120, 0.15, 'square', 0.3);
                setTimeout(() => this._tone(200, 0.2, 'sine', 0.3), 100);
                break;
            case 'gun':
                this._noise(0.06, 0.75, 2600, 4);
                this._tone(180, 0.04, 'square', 0.22);
                break;
            case 'shotgun':
                this._noise(0.16, 0.95, 900, 1.4);
                this._tone(95, 0.08, 'square', 0.28);
                break;
            case 'rocket':
                this._noise(0.22, 1.0, 420, 0.8);
                this._tone(70, 0.16, 'sawtooth', 0.36);
                setTimeout(() => this._noise(0.16, 0.8, 1200, 1.2), 90);
                break;
            case 'death':
                this._tone(200, 0.3, 'sawtooth', 0.3);
                setTimeout(() => this._tone(150, 0.3, 'sawtooth', 0.2), 100);
                setTimeout(() => this._tone(100, 0.5, 'sawtooth', 0.15), 200);
                break;
            case 'pickup':
                this._tone(400, 0.1, 'sine', 0.2);
                setTimeout(() => this._tone(600, 0.1, 'sine', 0.2), 50);
                setTimeout(() => this._tone(800, 0.15, 'sine', 0.2), 100);
                break;
            case 'combo':
                this._tone(500, 0.08, 'sine', 0.2);
                this._tone(700, 0.06, 'sine', 0.15);
                break;
            case 'levelComplete':
                [400, 500, 600, 800].forEach((f, i) => {
                    setTimeout(() => this._tone(f, 0.3, 'sine', 0.25), i * 150);
                });
                break;
            case 'gameOver':
                [300, 250, 200, 150].forEach((f, i) => {
                    setTimeout(() => this._tone(f, 0.4, 'sawtooth', 0.2), i * 200);
                });
                break;
        }
    }

    startBGM() {
        if (!this.enabled || !this.ctx || this.bgmPlaying) return;
        this.bgmPlaying = true;
        this._playBGMLoop();
    }

    _playBGMLoop() {
        if (!this.bgmPlaying) return;
        const now = this.ctx.currentTime;
        const bpm = 130;
        const beat = 60 / bpm;
        // Drum pattern
        for (let i = 0; i < 8; i++) {
            const t = now + i * beat;
            // Kick on 1, 3, 5, 7
            if (i % 2 === 0) {
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.4, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                osc.connect(g); g.connect(this.musicGain);
                osc.start(t); osc.stop(t + 0.15);
            }
            // Snare on 2, 6
            if (i === 2 || i === 6) {
                const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * 0.3;
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.3, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                src.connect(g); g.connect(this.musicGain);
                src.start(t);
            }
            // Hi-hat on every beat
            const buf2 = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
            const d2 = buf2.getChannelData(0);
            for (let j = 0; j < d2.length; j++) d2[j] = (Math.random() * 2 - 1) * 0.15;
            const s2 = this.ctx.createBufferSource();
            s2.buffer = buf2;
            const hpf = this.ctx.createBiquadFilter();
            hpf.type = 'highpass'; hpf.frequency.value = 8000;
            const g2 = this.ctx.createGain();
            g2.gain.setValueAtTime(0.15, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
            s2.connect(hpf); hpf.connect(g2); g2.connect(this.musicGain);
            s2.start(t);
        }
        // Bass line
        const bassNotes = [55, 55, 65, 55, 73, 65, 55, 55];
        bassNotes.forEach((freq, i) => {
            const t = now + i * beat;
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const filt = this.ctx.createBiquadFilter();
            filt.type = 'lowpass'; filt.frequency.value = 300;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.15, t);
            g.gain.setValueAtTime(0.15, t + beat * 0.8);
            g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.95);
            osc.connect(filt); filt.connect(g); g.connect(this.musicGain);
            osc.start(t); osc.stop(t + beat);
        });
        const loopDur = 8 * beat * 1000;
        this._bgmTimer = setTimeout(() => this._playBGMLoop(), loopDur - 50);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this._bgmTimer) clearTimeout(this._bgmTimer);
    }
};
