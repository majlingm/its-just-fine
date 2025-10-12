import { PersistentSpell } from '../PersistentSpell.js';
import { RingOfFire } from '../../entities/RingOfFire.js';

/**
 * Ring of Fire - Protective ring of many small flames that orbit the player
 */
export class RingOfFireSpell extends PersistentSpell {
  constructor(level = 1) {
    super({
      name: 'Ring of Fire',
      description: 'Protective ring of many small flames that orbit the player',
      category: 'fire',
      level: level,

      // Damage (total DPS spread across many particles)
      damage: 15,
      damageSpread: 5,

      // Crit (low for continuous damage)
      critChance: 0.08,
      critMultiplier: 1.5,
      critDamageSpread: 5,

      // Targeting
      targeting: 'self',

      // Entity class
      entityClass: RingOfFire
    });

    // Ring of Fire specific properties
    this.particleCount = 64;
    this.ringRadius = 2.2;
    this.rotationSpeed = 1.5;
    this.regenerationRate = 0.1;
    this.burstCooldown = 1.5;
    this.burstDamageMultiplier = 6;
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
    const damageScaling = [15, 18, 21, 25, 30, 36, 42];
    const particleScaling = [64, 72, 80, 88, 96, 104, 112];
    const burstMultiplierScaling = [6, 6.5, 7, 7.5, 8, 8.5, 9];

    this.damage = damageScaling[level - 1] || this.damage;
    this.particleCount = particleScaling[level - 1] || this.particleCount;
    this.burstDamageMultiplier = burstMultiplierScaling[level - 1] || this.burstDamageMultiplier;
  }

  /**
   * Perform special action - trigger burst if possible
   */
  performSpecialAction(engine, player, stats) {
    // Check if player wants to trigger burst (could be bound to a key)
    // For now, this could be triggered automatically or by a special condition
    if (this.activeEntity && this.activeEntity.isRingFull()) {
      // You could check for a key press or other condition here
      // this.activeEntity.triggerBurst();
    }
  }
}