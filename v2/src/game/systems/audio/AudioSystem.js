/**
 * AudioSystem - Manages audio playback and spatial audio
 *
 * Responsibilities:
 * - Load and cache audio files
 * - Play sound effects
 * - Manage 3D spatial audio
 * - Handle volume controls
 * - Play one-shot sounds via events
 *
 * Features:
 * - Event-driven sound playback (no Audio component required)
 * - Global sound library
 * - Spatial audio based on player position
 * - Volume categories (sfx, music, ambient)
 */

export class AudioSystem {
  constructor() {
    // Sound library (cached audio files)
    this.sounds = new Map(); // soundId -> HTMLAudioElement (template)

    // Currently playing sounds
    this.activeSounds = []; // Array of playing audio instances

    // Volume settings
    this.masterVolume = 0.5; // Start at 50% to avoid loud sounds
    this.sfxVolume = 1.0;
    this.musicVolume = 0.7;
    this.ambientVolume = 0.8;

    // Player reference for spatial audio
    this.player = null;

    // Mute state
    this.isMuted = false;

    // Sound library paths
    this.soundLibrary = {
      // Weapon sounds
      'weapon_fire': { src: null, category: 'sfx', volume: 0.3 },
      'weapon_reload': { src: null, category: 'sfx', volume: 0.4 },

      // Impact sounds
      'hit_enemy': { src: null, category: 'sfx', volume: 0.3 },
      'hit_player': { src: null, category: 'sfx', volume: 0.5 },

      // Enemy sounds
      'enemy_spawn': { src: null, category: 'sfx', volume: 0.2 },
      'enemy_die': { src: null, category: 'sfx', volume: 0.3 },

      // Explosion sounds
      'explosion': { src: null, category: 'sfx', volume: 0.6 },

      // UI sounds
      'pickup': { src: null, category: 'sfx', volume: 0.4 },
      'level_up': { src: null, category: 'sfx', volume: 0.5 },
      'wave_complete': { src: null, category: 'sfx', volume: 0.5 },

      // Ambient/music
      'ambient_wind': { src: null, category: 'ambient', volume: 0.3 },
      'battle_music': { src: null, category: 'music', volume: 0.6 }
    };
  }

  /**
   * Initialize the audio system
   */
  init() {
    // Setup event listeners for game events
    this.setupEventListeners();

    console.log('✅ Audio System initialized');
  }

  /**
   * Setup event listeners for automatic sound playback
   */
  setupEventListeners() {
    // Weapon fired (DISABLED - sounds off for now)
    // window.addEventListener('weapon-fired', (event) => {
    //   const entity = event.detail.entity;
    //   this.playSound('weapon_fire', {
    //     position: this.getEntityPosition(entity),
    //     spatial: true
    //   });
    // });

    // Entity damaged (DISABLED)
    // window.addEventListener('entity-damaged', (event) => {
    //   const target = event.detail.target;
    //   const soundId = target.hasTag('player') ? 'hit_player' : 'hit_enemy';
    //   this.playSound(soundId, {
    //     position: this.getEntityPosition(target),
    //     spatial: true
    //   });
    // });

    // Entity died (DISABLED)
    // window.addEventListener('entity-died', (event) => {
    //   const entity = event.detail.entity;
    //   if (entity.hasTag('enemy')) {
    //     this.playSound('enemy_die', {
    //       position: this.getEntityPosition(entity),
    //       spatial: true
    //     });
    //   }
    // });

    // Enemy spawned (DISABLED)
    // window.addEventListener('enemy-spawned', (event) => {
    //   const entity = event.detail.entity;
    //   this.playSound('enemy_spawn', {
    //     position: this.getEntityPosition(entity),
    //     spatial: true,
    //     volume: 0.2
    //   });
    // });
  }

  /**
   * Update audio system
   * @param {number} dt - Delta time
   * @param {Object} gameState - Game state (includes player reference)
   */
  update(dt, gameState) {
    // Update player reference for spatial audio
    if (gameState.player) {
      this.player = gameState.player;
    }

    // Update spatial audio for active sounds
    this.updateSpatialAudio();

    // Clean up finished sounds
    this.cleanupFinishedSounds();
  }

  /**
   * Play a sound effect
   * @param {string} soundId - Sound identifier
   * @param {Object} options - Playback options
   * @returns {HTMLAudioElement|null} The audio element if played
   */
  playSound(soundId, options = {}) {
    // Check if muted
    if (this.isMuted) return null;

    const soundConfig = this.soundLibrary[soundId];
    if (!soundConfig) {
      // Sound not in library - not an error, just skip
      return null;
    }

    // For now, we'll use procedural sounds via Web Audio API
    // Since we don't have actual audio files yet
    // TODO: Load real audio files when available

    // Create a short beep/click sound using Web Audio API
    const audioContext = this.getAudioContext();
    if (!audioContext) return null;

    // Generate simple sound based on sound type
    this.generateProceduralSound(soundId, options, audioContext);

    return null;
  }

  /**
   * Generate a procedural sound (temporary until we have real audio files)
   * @param {string} soundId - Sound identifier
   * @param {Object} options - Options
   * @param {AudioContext} audioContext - Web Audio context
   */
  generateProceduralSound(soundId, options, audioContext) {
    const now = audioContext.currentTime;

    // Create oscillator for tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound based on type
    let frequency = 440;
    let duration = 0.1;
    let type = 'sine';
    let volume = 0.1;

    const soundConfig = this.soundLibrary[soundId];
    const baseVolume = soundConfig ? soundConfig.volume : 0.3;
    const categoryVolume = this.getCategoryVolume(soundConfig?.category || 'sfx');
    volume = this.masterVolume * categoryVolume * baseVolume * (options.volume || 1.0);

    // Apply spatial audio volume if enabled
    if (options.spatial && options.position && this.player) {
      const spatialVolume = this.calculateSpatialVolume(options.position);
      volume *= spatialVolume;
    }

    switch (soundId) {
      case 'weapon_fire':
        frequency = 150;
        duration = 0.05;
        type = 'square';
        break;
      case 'hit_enemy':
        frequency = 300;
        duration = 0.08;
        type = 'sawtooth';
        break;
      case 'hit_player':
        frequency = 200;
        duration = 0.15;
        type = 'triangle';
        break;
      case 'enemy_die':
        frequency = 100;
        duration = 0.2;
        type = 'sawtooth';
        break;
      case 'enemy_spawn':
        frequency = 400;
        duration = 0.1;
        type = 'sine';
        break;
      case 'explosion':
        frequency = 60;
        duration = 0.3;
        type = 'sawtooth';
        break;
      case 'pickup':
        frequency = 600;
        duration = 0.1;
        type = 'sine';
        break;
      case 'level_up':
        frequency = 800;
        duration = 0.3;
        type = 'sine';
        break;
    }

    // Set oscillator properties
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Envelope (fade out)
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Play sound
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Get or create Web Audio context
   * @returns {AudioContext|null}
   */
  getAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  /**
   * Calculate volume based on distance from player
   * @param {Object} position - Sound position {x, y, z}
   * @returns {number} Volume multiplier (0-1)
   */
  calculateSpatialVolume(position) {
    if (!this.player) return 1.0;

    const playerTransform = this.player.getComponent('Transform');
    if (!playerTransform) return 1.0;

    // Calculate distance
    const dx = position.x - playerTransform.x;
    const dz = position.z - playerTransform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Maximum hearing distance
    const maxDistance = 50;

    if (distance >= maxDistance) return 0;

    // Linear falloff
    const volume = 1.0 - (distance / maxDistance);
    return Math.max(0, volume);
  }

  /**
   * Get entity position for spatial audio
   * @param {Entity} entity
   * @returns {Object} Position {x, y, z}
   */
  getEntityPosition(entity) {
    const transform = entity.getComponent('Transform');
    if (transform) {
      return { x: transform.x, y: transform.y, z: transform.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Get volume for a category
   * @param {string} category
   * @returns {number}
   */
  getCategoryVolume(category) {
    switch (category) {
      case 'sfx':
        return this.sfxVolume;
      case 'music':
        return this.musicVolume;
      case 'ambient':
        return this.ambientVolume;
      default:
        return 1.0;
    }
  }

  /**
   * Update spatial audio for active sounds
   */
  updateSpatialAudio() {
    // TODO: Update volume of active 3D sounds based on player position
    // For now, sounds are one-shot so this isn't needed
  }

  /**
   * Clean up finished sounds
   */
  cleanupFinishedSounds() {
    this.activeSounds = this.activeSounds.filter(audio => !audio.ended);
  }

  /**
   * Set master volume
   * @param {number} volume - 0 to 1
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set SFX volume
   * @param {number} volume - 0 to 1
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set music volume
   * @param {number} volume - 0 to 1
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      // Stop all active sounds
      for (const audio of this.activeSounds) {
        audio.pause();
      }
      this.activeSounds = [];
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Stop all sounds
    for (const audio of this.activeSounds) {
      audio.pause();
    }
    this.activeSounds = [];

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
