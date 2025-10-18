import { V1ProjectileSpell as ProjectileSpell } from '../V1ProjectileSpell.js';
import { MagicBullet } from '../../entities/V1MagicBullet.js';
import spellData from '../V1spellData.json';

/**
 * Magic Bullet - Fast rainbow bullets that spray in random directions
 */
export class V1MagicBulletSpell extends ProjectileSpell {
  constructor(level = 1) {
    const data = spellData.MAGIC_BULLET;

    super({
      spellKey: 'MAGIC_BULLET',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Additional config
      spread: Math.PI * 2, // Full 360 degrees
      projectileClass: MagicBullet
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
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