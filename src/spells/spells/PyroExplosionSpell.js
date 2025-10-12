import { InstantSpell } from '../InstantSpell.js';
import { FireEffect } from '../../effects/FireEffect.js';
import spellData from '../spellData.json';

/**
 * Pyro Explosion - Explosive fire area damage
 */
export class PyroExplosionSpell extends InstantSpell {
  constructor(level = 1) {
    const data = spellData.PYRO_EXPLOSION;

    super({
      spellKey: 'PYRO_EXPLOSION',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base
    });

    // Fire effect for visual
    this.fireEffect = new FireEffect({
      radius: this.radius,
      particleCount: this.particleCount,
      lifetime: 1.0,
      color: 0xff4400
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);

    // Update fire effect with scaled values
    this.fireEffect.config.radius = this.radius;
    this.fireEffect.config.particleCount = this.particleCount;
  }

  /**
   * Execute the pyro explosion
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} target - Target entity
   * @param {object} stats - Player stats
   */
  execute(engine, player, target, stats) {
    const baseDamage = this.damage * stats.damage;
    const { damage: finalDamage, isCrit } = this.calculateDamage(baseDamage);

    this.fireEffect.spawn(engine, {
      x: target.x,
      y: 0, // Ground explosion
      z: target.z,
      damage: finalDamage,
      isCrit: isCrit
    });
  }
}