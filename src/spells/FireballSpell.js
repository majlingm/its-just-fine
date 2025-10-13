import { ProjectileSpell } from './ProjectileSpell.js';
import { FlameProjectile } from '../entities/FlameProjectile.js';
import spellData from './spellData.json';

/**
 * Fireball - Blazing fire projectiles with trail
 */
export class FireballSpell extends ProjectileSpell {
  constructor(level = 1) {
    // console.log(`[FIREBALL DEBUG] Creating FireballSpell with level ${level}`);
    const data = spellData.FIREBALL;

    super({
      spellKey: 'FIREBALL',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Projectile class
      projectileClass: FlameProjectile
    });

    // console.log(`[FIREBALL DEBUG] Before scaling - speed: ${this.speed}, cooldown: ${this.cooldown}, projectileCount: ${this.projectileCount}`);

    // Apply level scaling using base class method
    this.applyLevelScaling(level);

    // console.log(`[FIREBALL DEBUG] After scaling - speed: ${this.speed}, cooldown: ${this.cooldown}, projectileCount: ${this.projectileCount}`);
  }
}
