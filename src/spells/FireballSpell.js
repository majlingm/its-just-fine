import { ProjectileSpell } from './ProjectileSpell.js';
import { FlameProjectile } from '../entities/FlameProjectile.js';

/**
 * Fireball - Blazing fire projectiles with trail
 */
export class FireballSpell extends ProjectileSpell {
  constructor(level = 1) {
    super({
      name: 'Fireball',
      description: 'Blazing fire projectiles with trail',
      category: 'fire',
      level: level,

      // Damage
      damage: 16,
      damageSpread: 10,

      // Crit
      critChance: 0.12,
      critMultiplier: 1.8,
      critDamageSpread: 8,

      // Cooldown
      cooldown: 0.25,

      // Projectile properties
      speed: 20,
      pierce: 2,
      projectileCount: 1,
      spread: 0,
      lifetime: 0.8,

      // Targeting
      targeting: 'nearest',
      maxRange: 20,

      // Projectile class
      projectileClass: FlameProjectile
    });

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    if (level < 1 || level > 7) return;

    // Example scaling - you can customize per spell
    const damageScaling = [16, 18, 20, 23, 26, 30, 35];
    const pierceScaling = [2, 2, 3, 3, 4, 4, 5];

    this.damage = damageScaling[level - 1];
    this.pierce = pierceScaling[level - 1];
  }
}
