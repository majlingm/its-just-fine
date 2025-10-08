/**
 * ProceduralSounds - Generates sound effects using Web Audio API oscillators and noise
 */
export class ProceduralSounds {
  constructor(audioContext, masterVolume = 0.3) {
    this.context = audioContext;
    this.masterVolume = masterVolume;
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
  }

  /**
   * Creates a noise buffer for explosion/whoosh effects
   */
  createNoiseBuffer(duration, decayRate = 0.1) {
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * decayRate));
    }

    return buffer;
  }

  /**
   * Weapon shoot sound - quick zap
   */
  shoot() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.05);
  }

  /**
   * Explosion sound - noise with lowpass filter
   */
  explosion() {
    const buffer = this.createNoiseBuffer(0.5, 0.1);

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

    source.start(this.context.currentTime);
  }

  /**
   * Enemy hit sound - low thud
   */
  hit() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  }

  /**
   * Level up sound - ascending tones
   */
  levelUp() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.setValueAtTime(500, this.context.currentTime + 0.1);
    osc.frequency.setValueAtTime(600, this.context.currentTime + 0.2);
    osc.frequency.setValueAtTime(800, this.context.currentTime + 0.3);

    gain.gain.setValueAtTime(this.masterVolume * 0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.4);
  }

  /**
   * XP pickup sound - quick chirp
   */
  pickup() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.setValueAtTime(900, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  }

  /**
   * Player death sound - descending tone
   */
  death() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.8);

    gain.gain.setValueAtTime(this.masterVolume * 0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.8);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.8);
  }

  /**
   * Lightning/electric sound - crackling noise with high zap
   */
  lightning() {
    // Create noise for the crackling effect
    const buffer = this.createNoiseBuffer(0.15, 0.02);

    const noiseSource = this.context.createBufferSource();
    const noiseGain = this.context.createGain();
    const noiseFilter = this.context.createBiquadFilter();

    noiseSource.buffer = buffer;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.context.destination);

    // High-pass filter for electric crackling
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(3000, this.context.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(8000, this.context.currentTime + 0.05);

    noiseGain.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

    // Add high-frequency zap
    const zapOsc = this.context.createOscillator();
    const zapGain = this.context.createGain();

    zapOsc.type = 'sawtooth';
    zapOsc.connect(zapGain);
    zapGain.connect(this.context.destination);

    zapOsc.frequency.setValueAtTime(5000, this.context.currentTime);
    zapOsc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.08);

    zapGain.gain.setValueAtTime(this.masterVolume * 0.15, this.context.currentTime);
    zapGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);

    noiseSource.start(this.context.currentTime);
    zapOsc.start(this.context.currentTime);
    zapOsc.stop(this.context.currentTime + 0.08);
  }

  /**
   * Dash/whoosh sound - swooshing air
   */
  dash() {
    const bufferSize = this.context.sampleRate * 0.2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate swoosh noise with envelope
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.sin((i / bufferSize) * Math.PI); // Fade in and out
      data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    // Band-pass filter for air whoosh
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.15);
    filter.Q.value = 1;

    gain.gain.setValueAtTime(this.masterVolume * 0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

    source.start(this.context.currentTime);
  }
}
