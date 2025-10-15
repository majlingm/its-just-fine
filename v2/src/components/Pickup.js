import { Component } from '../core/ecs/Component.js';

/**
 * Pickup Component
 * Marks an entity as a collectible pickup
 *
 * Pickup types:
 * - health: Restores health
 * - xp: Grants experience points
 * - powerup: Temporary buff (speed, damage, shield, etc.)
 * - coin: Currency/score
 */
export class Pickup extends Component {
  constructor() {
    super();

    // Pickup configuration
    this.pickupType = 'xp';        // Type of pickup
    this.value = 10;               // Amount (health, xp, coins, etc.)
    this.autoCollect = true;       // Auto-collect on proximity
    this.collectRadius = 2.0;      // Radius for auto-collection
    this.magnetRange = 5.0;        // Range for magnetic attraction
    this.magnetSpeed = 8.0;        // Speed when attracted to player

    // Powerup-specific
    this.powerupDuration = 10;     // Duration for temporary powerups
    this.powerupEffect = null;     // Effect to apply (status effect config)

    // Visual effects
    this.bobHeight = 0.3;          // Vertical bobbing height
    this.bobSpeed = 2.0;           // Bobbing speed
    this.rotateSpeed = 2.0;        // Rotation speed (radians/sec)
    this.glowIntensity = 0.5;      // Emissive glow intensity

    // State
    this.lifetime = 30;            // Despawn after this many seconds
    this.age = 0;                  // Current age
    this.isBeingCollected = false; // Currently moving toward player
    this.hasBeenCollected = false; // Already collected (waiting for removal)

    // Spawn animation
    this.spawnDuration = 0.3;      // Spawn-in animation duration
    this.spawnAge = 0;             // Time since spawned
  }

  /**
   * Initialize pickup
   * @param {Object} config - Pickup configuration
   */
  init(config = {}) {
    this.pickupType = config.pickupType || 'xp';
    this.value = config.value !== undefined ? config.value : 10;
    this.autoCollect = config.autoCollect !== undefined ? config.autoCollect : true;
    this.collectRadius = config.collectRadius || 2.0;
    this.magnetRange = config.magnetRange || 5.0;
    this.magnetSpeed = config.magnetSpeed || 8.0;
    this.lifetime = config.lifetime || 30;
    this.bobHeight = config.bobHeight !== undefined ? config.bobHeight : 0.3;
    this.bobSpeed = config.bobSpeed || 2.0;
    this.rotateSpeed = config.rotateSpeed || 2.0;
    this.glowIntensity = config.glowIntensity || 0.5;

    // Powerup-specific
    this.powerupDuration = config.powerupDuration || 10;
    this.powerupEffect = config.powerupEffect || null;
  }

  /**
   * Update pickup age
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.age += dt;
    this.spawnAge += dt;
  }

  /**
   * Check if pickup has expired
   * @returns {boolean}
   */
  isExpired() {
    return this.age >= this.lifetime;
  }

  /**
   * Check if spawn animation is complete
   * @returns {boolean}
   */
  isSpawnComplete() {
    return this.spawnAge >= this.spawnDuration;
  }

  /**
   * Get spawn animation progress (0-1)
   * @returns {number}
   */
  getSpawnProgress() {
    return Math.min(1, this.spawnAge / this.spawnDuration);
  }
}
