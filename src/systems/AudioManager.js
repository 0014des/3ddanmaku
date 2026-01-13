export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Increased from 0.3
        this.masterGain.connect(this.ctx.destination);
    }

    playShoot() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playBomb() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        // White noise buffer approximation
        const duration = 1.0;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    startBgm() {
        if (this.bgmOsc) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Simple Arpeggio loop
        const notes = [220, 261.63, 329.63, 440, 261.63, 329.63, 440, 523.25]; // A minor arpeggio
        let idx = 0;

        this.bgmOsc = this.ctx.createOscillator();
        this.bgmGain = this.ctx.createGain();

        this.bgmOsc.type = 'triangle';
        this.bgmOsc.connect(this.bgmGain);
        this.bgmGain.connect(this.masterGain);
        this.bgmGain.gain.value = 0.1;

        this.bgmOsc.start();

        this.bgmInterval = setInterval(() => {
            if (this.ctx.state === 'running') {
                const freq = notes[idx];
                this.bgmOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                idx = (idx + 1) % notes.length;
            }
        }, 200); // 300 BPM 8th notes
    }

    stopBgm() {
        if (this.bgmOsc) {
            this.bgmOsc.stop();
            this.bgmOsc.disconnect();
            clearInterval(this.bgmInterval);
            this.bgmOsc = null;
        }
    }
}
