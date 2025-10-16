import { Component } from '../ecs/Component.js';

/**
 * Particle Component
 * Represents a visual effect particle with lifetime and physics
 *
 * Used for:
 * - Muzzle flashes
 * - Impact effects
 * - Death explosions
 * - Trail effects
 * - Environmental particles
 */
export class Particle extends Component {
  constructor() {
    super();

    // Lifetime
    this.lifetime = 1.0; // How long the particle lasts (seconds)
    this.age = 0; // Current age (seconds)
    this.fadeStart = 0.5; // When to start fading (0-1, where 1 is lifetime)

    // Visual properties
    this.startColor = 0xffffff; // Initial color
    this.endColor = 0x000000; // Final color (for color lerp)
    this.startOpacity = 1.0; // Initial opacity
    this.endOpacity = 0.0; // Final opacity
    this.startScale = 1.0; // Initial scale multiplier
    this.endScale = 0.5; // Final scale multiplier

    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
    this.gravity = -9.8; // Gravity effect on Y axis
    this.drag = 0.95; // Air resistance (0-1, where 1 is no drag)

    // Behavior flags
    this.billboard = true; // Always face camera
    this.removeOnExpire = true; // Auto-remove when lifetime expires
  }

  /**
   * Update particle age and check expiration
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.age += dt;
  }

  /**
   * Check if particle has expired
   * @returns {boolean}
   */
  isExpired() {
    return this.age >= this.lifetime;
  }

  /**
   * Get current opacity based on age
   * @returns {number} Current opacity (0-1)
   */
  getCurrentOpacity() {
    const fadeStartTime = this.lifetime * this.fadeStart;

    if (this.age < fadeStartTime) {
      return this.startOpacity;
    }

    // Lerp from startOpacity to endOpacity
    const fadeProgress = (this.age - fadeStartTime) / (this.lifetime - fadeStartTime);
    return this.startOpacity + (this.endOpacity - this.startOpacity) * fadeProgress;
  }

  /**
   * Get current scale based on age
   * @returns {number} Current scale multiplier
   */
  getCurrentScale() {
    const progress = this.age / this.lifetime;
    return this.startScale + (this.endScale - this.startScale) * progress;
  }

  /**
   * Get current color based on age (linear interpolation)
   * @returns {number} Current color (hex)
   */
  getCurrentColor() {
    if (this.startColor === this.endColor) {
      return this.startColor;
    }

    const progress = this.age / this.lifetime;

    // Extract RGB components
    const startR = (this.startColor >> 16) & 0xff;
    const startG = (this.startColor >> 8) & 0xff;
    const startB = this.startColor & 0xff;

    const endR = (this.endColor >> 16) & 0xff;
    const endG = (this.endColor >> 8) & 0xff;
    const endB = this.endColor & 0xff;

    // Lerp each component
    const r = Math.floor(startR + (endR - startR) * progress);
    const g = Math.floor(startG + (endG - startG) * progress);
    const b = Math.floor(startB + (endB - startB) * progress);

    // Combine back into hex
    return (r << 16) | (g << 8) | b;
  }
}
