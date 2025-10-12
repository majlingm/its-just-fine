import { PersistentSpell } from '../PersistentSpell.js';
import { RingOfIce } from '../../entities/RingOfIce.js';

/**
 * Ring of Ice - Protective ring of ice shards that orbit the player and freeze enemies
 */
export class RingOfIceSpell extends PersistentSpell {
  constructor(level = 1) {
    super({
      name: 'Ring of Ice',
      description: 'Protective ring of ice shards that orbit the player and freeze enemies',
      category: 'ice',
      level: level,

      // Damage (lower than Ring of Fire)
      damage: 10,
      damageSpread: 5,

      // Crit (low for continuous damage)
      critChance: 0.08,
      critMultiplier: 1.5,
      critDamageSpread: 5,

      // Targeting
      targeting: 'self',

      // Entity class
      entityClass: RingOfIce
    });

    // Ring of Ice specific properties
    this.particleCount = 64;
    this.ringRadius = 2.2;
    this.rotationSpeed = 1.2;
    this.regenerationRate = 0.1;
    this.burstCooldown = 1.5;
    this.burstDamageMultiplier = 5;
    this.freezeDuration = 10.0;
    this.particleSizeMin = 0.55;
    this.particleSizeMax = 0.9;

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [10, 12, 14, 17, 20, 24, 28];
    const particleScaling = [64, 72, 80, 88, 96, 104, 112];
    const freezeScaling = [10, 11, 12, 13, 14, 15, 16];

    this.damage = damageScaling[level - 1] || this.damage;
    this.particleCount = particleScaling[level - 1] || this.particleCount;
    this.freezeDuration = freezeScaling[level - 1] || this.freezeDuration;
  }
}