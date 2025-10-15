import { Component } from '../core/ecs/Component.js';

/**
 * Audio Component
 * Manages audio playback for an entity
 *
 * Features:
 * - Multiple sound effect slots
 * - Volume control
 * - 3D spatial audio
 * - Sound categories (sfx, music, ambient)
 */
export class Audio extends Component {
  constructor() {
    super();

    // Audio sources
    this.sounds = new Map(); // soundId -> { audio: HTMLAudioElement, config }

    // Volume settings
    this.masterVolume = 1.0; // Overall volume multiplier
    this.sfxVolume = 1.0;    // Sound effects volume
    this.musicVolume = 1.0;  // Music volume

    // Spatial audio
    this.is3D = false;       // Enable 3D spatial audio
    this.maxDistance = 50;   // Max hearing distance
    this.rolloffFactor = 1;  // How quickly sound fades with distance

    // Playback state
    this.isPlaying = false;
  }

  /**
   * Initialize audio component
   * @param {Object} config - Configuration
   */
  init(config = {}) {
    this.masterVolume = config.masterVolume !== undefined ? config.masterVolume : 1.0;
    this.sfxVolume = config.sfxVolume !== undefined ? config.sfxVolume : 1.0;
    this.musicVolume = config.musicVolume !== undefined ? config.musicVolume : 1.0;
    this.is3D = config.is3D || false;
    this.maxDistance = config.maxDistance || 50;
    this.rolloffFactor = config.rolloffFactor || 1;
  }

  /**
   * Add a sound to this entity
   * @param {string} soundId - Unique sound identifier
   * @param {Object} config - Sound configuration
   */
  addSound(soundId, config) {
    this.sounds.set(soundId, {
      src: config.src || null,
      volume: config.volume !== undefined ? config.volume : 1.0,
      loop: config.loop || false,
      category: config.category || 'sfx', // 'sfx', 'music', 'ambient'
      audio: null, // Will be created by AudioSystem
      isLoaded: false
    });
  }

  /**
   * Remove a sound
   * @param {string} soundId
   */
  removeSound(soundId) {
    const sound = this.sounds.get(soundId);
    if (sound && sound.audio) {
      sound.audio.pause();
      sound.audio = null;
    }
    this.sounds.delete(soundId);
  }

  /**
   * Get a sound config
   * @param {string} soundId
   * @returns {Object|null}
   */
  getSound(soundId) {
    return this.sounds.get(soundId) || null;
  }

  /**
   * Check if a sound exists
   * @param {string} soundId
   * @returns {boolean}
   */
  hasSound(soundId) {
    return this.sounds.has(soundId);
  }

  /**
   * Get effective volume for a sound
   * @param {string} soundId
   * @returns {number}
   */
  getEffectiveVolume(soundId) {
    const sound = this.sounds.get(soundId);
    if (!sound) return 0;

    let categoryVolume = 1.0;
    switch (sound.category) {
      case 'sfx':
        categoryVolume = this.sfxVolume;
        break;
      case 'music':
        categoryVolume = this.musicVolume;
        break;
    }

    return this.masterVolume * categoryVolume * sound.volume;
  }

  /**
   * Cleanup
   */
  cleanup() {
    for (const [soundId, sound] of this.sounds) {
      if (sound.audio) {
        sound.audio.pause();
        sound.audio = null;
      }
    }
    this.sounds.clear();
  }
}
