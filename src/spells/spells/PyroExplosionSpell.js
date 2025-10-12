import { InstantSpell } from '../InstantSpell.js';
import { FireEffect } from '../../effects/FireEffect.js';

/**
 * Pyro Explosion - Explosive fire area damage
 */
export class PyroExplosionSpell extends InstantSpell {
  constructor(level = 1) {
    super({
      name: 'Pyro Explosion',
      description: 'Explosive fire area damage',
      category: 'fire',
      level: level,

      // Damage
      damage: 30,
      damageSpread: 20,

      // Crit (high for big hits)
      critChance: 0.2,
      critMultiplier: 2.5,
      critDamageSpread: 15,

      // Cooldown
      cooldown: 1.5,

      // Targeting
      targeting: 'nearest',
      maxRange: 20
    });

    // Pyro Explosion specific properties
    this.radius = 3.5;
    this.particleCount = 20;

    // Fire effect for visual
    this.fireEffect = new FireEffect({
      radius: this.radius,
      particleCount: this.particleCount,
      lifetime: 1.0,
      color: 0xff4400
    });

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [30, 38, 46, 56, 68, 82, 100];
    const radiusScaling = [3.5, 3.8, 4.1, 4.4, 4.7, 5.0, 5.5];
    const particleScaling = [20, 22, 24, 26, 28, 30, 35];

    this.damage = damageScaling[level - 1] || this.damage;
    this.radius = radiusScaling[level - 1] || this.radius;
    this.particleCount = particleScaling[level - 1] || this.particleCount;

    // Update fire effect config
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