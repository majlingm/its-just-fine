import { ProjectileSpell } from '../ProjectileSpell.js';
import { ShadowProjectile } from '../../entities/ShadowProjectile.js';
import spellData from '../spellData.json';

/**
 * Shadow Bolt - Dark projectiles with white edges, slower than fireball
 */
export class ShadowBoltSpell extends ProjectileSpell {
  constructor(level = 1) {
    const data = spellData.SHADOW_BOLT;

    super({
      spellKey: 'SHADOW_BOLT',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Projectile class
      projectileClass: ShadowProjectile
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
  }
}
