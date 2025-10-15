import { Component } from '../core/ecs/Component.js';

/**
 * Health Component
 * Represents entity health/hit points
 */
export class Health extends Component {
  constructor() {
    super();

    this.current = 100;
    this.max = 100;
    this.shield = 0; // Optional shield/armor
    this.invulnerable = false;
    this.regenRate = 0; // HP per second regen
    this.isDead = false; // Track if entity has been processed as dead
  }

  /**
   * Check if entity is alive
   * @returns {boolean}
   */
  isAlive() {
    return this.current > 0;
  }

  /**
   * Check if entity is dead (health-based check)
   * Note: this.isDead property tracks if death has been processed by systems
   * @returns {boolean}
   */
  isDeadByHealth() {
    return this.current <= 0;
  }

  /**
   * Check if at full health
   * @returns {boolean}
   */
  isFullHealth() {
    return this.current >= this.max;
  }

  /**
   * Get health percentage (0-1)
   * @returns {number}
   */
  getHealthPercent() {
    return this.max > 0 ? this.current / this.max : 0;
  }

  /**
   * Heal entity
   * @param {number} amount
   */
  heal(amount) {
    this.current = Math.min(this.current + amount, this.max);
  }

  /**
   * Damage entity (returns actual damage dealt after shield)
   * @param {number} amount
   * @returns {number} Actual damage dealt
   */
  damage(amount) {
    if (this.invulnerable) return 0;

    let actualDamage = amount;

    // Apply to shield first
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      actualDamage -= shieldDamage;
    }

    // Apply remaining damage to health
    if (actualDamage > 0) {
      this.current = Math.max(0, this.current - actualDamage);
    }

    return amount; // Return total damage attempted
  }
}
