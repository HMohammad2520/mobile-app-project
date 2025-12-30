// Advanced Audio Synthesizer for Jet Sounds
class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Engine Nodes
  private engineSource: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private turbineOsc: OscillatorNode | null = null;
  private turbineGain: GainNode | null = null;

  constructor() {
    // Defer initialization
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4; // Master volume
    this.masterGain.connect(this.ctx.destination);
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        // White noise generation
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  startEngine() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.engineSource) return; // Already running

    const t = this.ctx.currentTime;

    // --- 1. The Rumble (Air Rush) ---
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    this.engineSource = this.ctx.createBufferSource();
    this.engineSource.buffer = noiseBuffer;
    this.engineSource.loop = true;

    // Lowpass filter for deep roar
    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.value = 400; 
    roarFilter.Q.value = 0.5;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, t);
    this.engineGain.gain.linearRampToValueAtTime(0.6, t + 2.0); // Slow spool up

    this.engineSource.connect(roarFilter);
    roarFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain!);
    this.engineSource.start();

    // --- 2. The Turbine Whine (High Pitch) ---
    this.turbineOsc = this.ctx.createOscillator();
    this.turbineOsc.type = 'triangle'; // Smoother than saw
    this.turbineOsc.frequency.setValueAtTime(1000, t);
    this.turbineOsc.frequency.exponentialRampToValueAtTime(3000, t + 2.0); // Spool up pitch

    this.turbineGain = this.ctx.createGain();
    this.turbineGain.gain.setValueAtTime(0, t);
    this.turbineGain.gain.linearRampToValueAtTime(0.08, t + 2.0); // Subtle whine

    this.turbineOsc.connect(this.turbineGain);
    this.turbineGain.connect(this.masterGain!);
    this.turbineOsc.start();
  }

  stopEngine() {
    const t = this.ctx?.currentTime || 0;
    
    // Spool down effect
    if (this.engineGain) {
      this.engineGain.gain.linearRampToValueAtTime(0, t + 1.0);
    }
    if (this.turbineGain) {
      this.turbineGain.gain.linearRampToValueAtTime(0, t + 1.0);
    }
    if (this.turbineOsc) {
       this.turbineOsc.frequency.exponentialRampToValueAtTime(500, t + 1.0);
       this.turbineOsc.stop(t + 1.0);
    }
    if (this.engineSource) {
       this.engineSource.stop(t + 1.0);
    }

    // Cleanup references after stop
    setTimeout(() => {
        this.engineSource = null;
        this.engineGain = null;
        this.turbineOsc = null;
        this.turbineGain = null;
    }, 1000);
  }

  playShoot() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Laser-like chirp
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playExplosion() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    source.start();
    source.stop(this.ctx.currentTime + 0.6);
  }

  playRefuel() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

export const audioController = new AudioController();