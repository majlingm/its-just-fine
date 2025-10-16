import { Component } from '../../core/ecs/Component.js';

/**
 * Projectile Component
 * Marks an entity as a projectile with lifetime and behavior
 *
 * Used for bullets, magic projectiles, rockets, etc.
 */
export class Projectile extends Component {
  constructor() {
    super();

    // Projectile properties
    this.damage = 10;
    this.speed = 30;
    this.lifetime = 3; // Seconds before despawn
    this.age = 0; // Current age in seconds

    // Owner tracking
    this.ownerId = null; // Entity ID of who fired this
    this.ownerTag = null; // Tag of owner (player, enemy)

    // Behavior flags
    this.piercing = false; // Can hit multiple targets
    this.homing = false; // Seeks nearest enemy
    this.explosive = false; // Deals area damage on impact
    this.explosionRadius = 0;

    // Hit tracking (for piercing projectiles)
    this.hitEntities = new Set(); // Entity IDs already hit
    this.maxPierces = -1; // -1 = infinite
    this.pierceCount = 0;

    // Homing behavior
    this.homingStrength = 5; // How aggressively it turns
    this.targetId = null; // Current target entity ID
    this.targetTag = 'enemy'; // What to target

    // State
    this.hasHit = false; // Hit something and should be removed
    this.expired = false; // Lifetime exceeded
  }

  /**
   * Check if projectile has expired
   * @returns {boolean}
   */
  isExpired() {
    return this.age >= this.lifetime || this.expired;
  }

  /**
   * Check if projectile can hit entity
   * @param {number} entityId - Entity ID to check
   * @returns {boolean}
   */
  canHit(entityId) {
    // Can't hit owner
    if (entityId === this.ownerId) return false;

    // Can't hit same entity twice (unless piercing)
    if (!this.piercing && this.hitEntities.has(entityId)) return false;

    // Check pierce limit
    if (this.piercing && this.maxPierces > 0 && this.pierceCount >= this.maxPierces) {
      return false;
    }

    return true;
  }

  /**
   * Mark entity as hit
   * @param {number} entityId - Entity ID that was hit
   */
  registerHit(entityId) {
    this.hitEntities.add(entityId);
    this.pierceCount++;

    // Mark for removal if not piercing
    if (!this.piercing) {
      this.hasHit = true;
    }
  }

  /**
   * Update projectile age
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.age += dt;

    if (this.isExpired()) {
      this.expired = true;
    }
  }
}
