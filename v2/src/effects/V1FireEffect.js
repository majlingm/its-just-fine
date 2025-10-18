import { FireExplosion } from '../entities/V1FireExplosion.js';

/**
 * Fire effect - creates explosions and flames
 * Configuration options:
 * - radius: Explosion radius (default: 3)
 * - particleCount: Number of fire particles (default: 20)
 * - lifetime: How long particles last (default: 1.0)
 * - color: Fire color (default: 0xff4400)
 */
export class FireEffect {
  constructor(config = {}) {
    this.config = {
      radius: 3,
      particleCount: 20,
      lifetime: 1.0,
      color: 0xff4400,
      ...config
    };
  }

  /**
   * Spawn a fire explosion
   * @param {Object} engine - Game engine
   * @param {Object} params - { x, y, z, damage, isCrit }
   * @returns {FireExplosion} The created fire entity
   */
  spawn(engine, params) {
    const { x, y, z, damage = 0, isCrit = false } = params;

    const explosion = new FireExplosion(
      engine,
      x,
      z, // FireExplosion constructor takes z as second param
      this.config.radius,
      damage,
      this.config.particleCount,
      isCrit
    );
    explosion.lifetime = this.config.lifetime;
    engine.addEntity(explosion);

    return explosion;
  }
}
