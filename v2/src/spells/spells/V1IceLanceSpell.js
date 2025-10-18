import { V1ProjectileSpell as ProjectileSpell } from '../V1ProjectileSpell.js';
import { IceLance } from '../../entities/V1IceLance.js';
import spellData from '../V1spellData.json';

/**
 * Ice Lance - Sharp icicle projectiles that pierce enemies
 */
export class V1IceLanceSpell extends ProjectileSpell {
  constructor(level = 1) {
    const data = spellData.ICE_LANCE;

    super({
      spellKey: 'ICE_LANCE',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Projectile class
      projectileClass: IceLance
    });

    // Ice Lance specific properties
    this.baseCooldownMin = data.base.cooldownMin;
    this.baseCooldownMax = data.base.cooldownMax;
    this.hasRandomCooldown = true;

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
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