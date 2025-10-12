import { ProjectileSpell } from '../ProjectileSpell.js';
import { MagicBullet } from '../../entities/MagicBullet.js';

/**
 * Magic Bullet - Fast rainbow bullets that spray in random directions
 */
export class MagicBulletSpell extends ProjectileSpell {
  constructor(level = 1) {
    super({
      name: 'Magic Bullet',
      description: 'Fast rainbow bullets that spray in random directions',
      category: 'magic',
      level: level,

      // Damage
      damage: 8,
      damageSpread: 15,

      // Crit
      critChance: 0.1,
      critMultiplier: 2.0,
      critDamageSpread: 10,

      // Cooldown
      cooldown: 0.08,

      // Projectile properties
      speed: 30,
      pierce: 1,
      projectileCount: 1,
      spread: Math.PI * 2, // Full 360 degrees
      lifetime: 0.6,

      // Targeting
      targeting: 'none', // Random directions
      maxRange: 20,

      // Projectile class
      projectileClass: MagicBullet
    });

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [8, 10, 12, 14, 17, 20, 24];
    const pierceScaling = [1, 1, 2, 2, 3, 3, 4];

    this.damage = damageScaling[level - 1] || this.damage;
    this.pierce = pierceScaling[level - 1] || this.pierce;
  }

  /**
   * Override calculateDirection for random spray
   */
  calculateDirection(player, target, index = 0, total = 1) {
    // Always random direction for Magic Bullet
    const angle = Math.random() * Math.PI * 2;
    return {
      dirX: Math.sin(angle),
      dirZ: Math.cos(angle),
      dirY: 0
    };
  }
}