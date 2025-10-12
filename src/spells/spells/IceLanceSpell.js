import { ProjectileSpell } from '../ProjectileSpell.js';
import { IceLance } from '../../entities/IceLance.js';

/**
 * Ice Lance - Sharp icicle projectiles that pierce enemies
 */
export class IceLanceSpell extends ProjectileSpell {
  constructor(level = 1) {
    super({
      name: 'Ice Lance',
      description: 'Sharp icicle projectiles that pierce enemies',
      category: 'ice',
      level: level,

      // Damage
      damage: 20,
      damageSpread: 12,

      // Crit
      critChance: 0.18,
      critMultiplier: 2.2,
      critDamageSpread: 10,

      // Cooldown (will be randomized)
      cooldown: 0.4,

      // Projectile properties
      speed: 25,
      pierce: 3,
      projectileCount: 1,
      spread: 0,
      lifetime: 0.8,

      // Targeting
      targeting: 'nearest',
      maxRange: 20,

      // Projectile class
      projectileClass: IceLance
    });

    // Ice Lance specific properties
    this.baseCooldownMin = 0.3;
    this.baseCooldownMax = 0.8;
    this.hasRandomCooldown = true;
    this.freezeDuration = 10.0;

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [20, 23, 27, 31, 36, 42, 50];
    const pierceScaling = [3, 3, 4, 4, 5, 5, 6];
    const freezeScaling = [10, 11, 12, 13, 14, 15, 16];

    this.damage = damageScaling[level - 1] || this.damage;
    this.pierce = pierceScaling[level - 1] || this.pierce;
    this.freezeDuration = freezeScaling[level - 1] || this.freezeDuration;
  }

  /**
   * Override cast to handle random cooldown
   */
  cast(engine, player, stats) {
    super.cast(engine, player, stats);

    // Set random cooldown after casting
    if (this.hasRandomCooldown) {
      this.cooldown = this.baseCooldownMin + Math.random() * (this.baseCooldownMax - this.baseCooldownMin);
    }
  }
}