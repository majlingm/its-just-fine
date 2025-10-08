import { SoundCache } from '../audio/SoundCache.js';
import { ProceduralSounds } from '../audio/ProceduralSounds.js';
import { SoundScheduler } from '../audio/SoundScheduler.js';
import { getAssetPath } from '../utils/assetPath.js';

export class SoundSystem {
  constructor() {
    this.context = null;
    this.soundCache = null;
    this.proceduralSounds = null;
    this.scheduler = null;
    this.enabled = true;
    this.masterVolume = 0.3;
    this.musicVolume = 0.2;
    this.currentMusic = null;
    this.musicGain = null;
    this.musicMuted = false;
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.soundCache = new SoundCache(this.context);
      this.proceduralSounds = new ProceduralSounds(this.context, this.masterVolume);
      this.scheduler = new SoundScheduler();

      // Configure rate limiting for common sounds
      this.scheduler.setMinInterval('shoot', 0.05); // Max 20 shoots per second
      this.scheduler.setMinInterval('hit', 0.03); // Max ~33 hits per second
      this.scheduler.setMinInterval('pickup', 0.05); // Max 20 pickups per second

      // Create music gain node
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.context.destination);

      // Add keyboard listener for mute toggle (M key)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
          this.toggleMusicMute();
        }
      });

      // Preload thunder sounds
      this.soundCache.preload([
        getAssetPath('/assets/music/sfx/Basic Spell Impacts/Lightning Spell Impacts/Lightning Spell Impact 1.wav')
      ]);
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume;
    }
    console.log('Music', this.musicMuted ? 'muted' : 'unmuted');
  }

  async playMusic(url) {
    if (!this.enabled || !this.context) return;

    // Stop current music if playing
    this.stopMusic();

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(this.musicGain);
      source.start(0);

      this.currentMusic = source;
    } catch (error) {
      console.error('Failed to load music:', error);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  /**
   * Play a sound with optional scheduling and rate limiting
   * @param {string} soundType - Type of sound to play
   * @param {number} delay - Optional delay in seconds
   */
  playSound(soundType, delay = 0) {
    if (!this.enabled || !this.context || !this.proceduralSounds) return;

    const currentTime = this.context.currentTime;

    // Check rate limiting
    if (!this.scheduler.canPlay(soundType, currentTime) && delay === 0) {
      return; // Skip if rate limited
    }

    const playFunction = () => {
      if (this.proceduralSounds[soundType]) {
        this.proceduralSounds[soundType]();
        this.scheduler.markPlayed(soundType, this.context.currentTime);
      }
    };

    if (delay > 0) {
      this.scheduler.schedule(playFunction, delay, soundType);
    } else {
      playFunction();
    }
  }

  // Convenience methods that delegate to playSound
  playShoot(delay = 0) {
    this.playSound('shoot', delay);
  }

  playExplosion(delay = 0) {
    this.playSound('explosion', delay);
  }

  playHit(delay = 0) {
    this.playSound('hit', delay);
  }

  playLevelUp(delay = 0) {
    this.playSound('levelUp', delay);
  }

  playPickup(delay = 0) {
    this.playSound('pickup', delay);
  }

  playDeath(delay = 0) {
    this.playSound('death', delay);
  }

  playLightning(delay = 0) {
    this.playSound('lightning', delay);
  }

  playDash(delay = 0) {
    this.playSound('dash', delay);
  }

  async playThunder() {
    if (!this.enabled || !this.context || !this.soundCache) return;

    try {
      const url = getAssetPath('/assets/music/sfx/Basic Spell Impacts/Lightning Spell Impacts/Lightning Spell Impact 1.wav');
      const audioBuffer = await this.soundCache.load(url);

      // Play the cached sound
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();

      source.buffer = audioBuffer;
      source.connect(gain);
      gain.connect(this.context.destination);

      source.playbackRate.value = 1.0;

      const currentTime = this.context.currentTime;
      const duration = audioBuffer.duration;
      const startOffset = duration * 0.1;
      const endOffset = duration * 0.6;
      const playDuration = endOffset - startOffset;

      // Set volume with fade out
      gain.gain.setValueAtTime(this.masterVolume * 0.6, currentTime);
      const fadeStartTime = playDuration * 0.8;
      gain.gain.setValueAtTime(this.masterVolume * 0.6, currentTime + fadeStartTime);
      gain.gain.linearRampToValueAtTime(0.01, currentTime + playDuration);

      source.start(currentTime, startOffset, playDuration);
    } catch (error) {
      console.error('Failed to play thunder sound:', error);
    }
  }
}
