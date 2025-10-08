import { Entity } from '../entities/Entity.js';

/**
 * Base class for all visual/gameplay effects
 * Effects are reusable, configurable visual and gameplay elements
 */
export class BaseEffect extends Entity {
  constructor(engine, config = {}) {
    super();
    this.engine = engine;
    this.config = config;
  }

  /**
   * Spawn the effect at a location
   * @param {Object} params - Parameters for spawning (position, target, damage, etc.)
   */
  spawn(params) {
    throw new Error('BaseEffect.spawn() must be implemented by subclass');
  }

  /**
   * Update effect logic
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
    }
  }

  /**
   * Clean up effect resources
   */
  destroy() {
    this.active = false;
    this.shouldRemove = true;
  }
}
