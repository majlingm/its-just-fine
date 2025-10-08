import { ColoredLightning } from '../entities/ColoredLightning.js';

/**
 * Spread effect - creates multiple bolts in a spread pattern
 * Configuration options:
 * - color: Bolt color (default: 0xffffff)
 * - glowColor: Glow color (default: 0xccddff)
 * - width: Bolt thickness (default: 1.5)
 * - boltCount: Number of bolts (default: 6)
 * - spreadAngle: Angle between bolts (default: 0.25)
 * - rangeMin: Minimum range (default: 8)
 * - rangeMax: Maximum range (default: 12)
 * - lifetime: How long bolts last (default: 0.2)
 */
export class SpreadEffect {
  constructor(config = {}) {
    this.config = {
      color: 0xffffff,
      glowColor: 0xccddff,
      width: 1.5,
      boltCount: 6,
      spreadAngle: 0.25,
      rangeMin: 8,
      rangeMax: 12,
      lifetime: 0.2,
      ...config
    };
  }

  /**
   * Spawn spread bolts
   * @param {Object} engine - Game engine
   * @param {Object} params - { x, y, z, targetAngle, damage }
   * @returns {Array<ColoredLightning>} The created lightning entities
   */
  spawn(engine, params) {
    const { x, y, z, targetAngle, damage = 0 } = params;
    const bolts = [];

    for (let i = 0; i < this.config.boltCount; i++) {
      const spreadOffset = (i - (this.config.boltCount - 1) / 2) * this.config.spreadAngle;
      const angle = targetAngle + spreadOffset;
      const range = this.config.rangeMin + Math.random() * (this.config.rangeMax - this.config.rangeMin);

      const endX = x + Math.cos(angle) * range;
      const endZ = z + Math.sin(angle) * range;

      const lightning = new ColoredLightning(
        engine,
        x, y, z,
        endX, y, endZ,
        damage,
        this.config.color,
        this.config.glowColor,
        this.config.width
      );
      lightning.lifetime = this.config.lifetime;
      engine.addEntity(lightning);
      bolts.push(lightning);
    }

    return bolts;
  }
}
