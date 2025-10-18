import { V1InstantSpell as InstantSpell } from '../V1InstantSpell.js';
import { LightningExplosion } from '../../entities/V1LightningExplosion.js';
import { LightningEffect } from '../../effects/V1LightningEffect.js';
import spellData from '../V1spellData.json';

/**
 * Thunder Strike - Sky lightning strikes ground with devastating explosion
 */
export class V1ThunderStrikeSpell extends InstantSpell {
  constructor(level = 1) {
    const data = spellData.THUNDER_STRIKE;

    super({
      spellKey: 'THUNDER_STRIKE',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base
    });

    // Thunder Strike specific properties
    this.hasRandomCooldown = true;
    this.baseCooldownMin = data.base.cooldownMin;
    this.baseCooldownMax = data.base.cooldownMax;
    this.lastGlobalStrike = 0;

    // Lightning effect configuration
    this.lightningEffect = new LightningEffect({
      color: 0xffff00,
      glowColor: 0xffffaa,
      width: data.base.lightningWidth,
      taper: true,
      gradientColor: 0xffffff,
      lifetime: 0.3,
      branches: data.base.branchCountMin,
      branchWidth: 0.4
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
  }

  /**
   * Execute the thunder strike
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} target - Target entity
   * @param {object} stats - Player stats
   */
  execute(engine, player, target, stats) {
    // Prevent simultaneous thunder strikes
    const currentTime = engine.time;
    if (currentTime - this.lastGlobalStrike < 0.3) return;
    this.lastGlobalStrike = currentTime;

    // Set random cooldown for next strike
    this.cooldown = this.baseCooldownMin + Math.random() * (this.baseCooldownMax - this.baseCooldownMin);

    // Spawn lightning effect with random offset
    const offsetX = (Math.random() - 0.5) * 3;
    const offsetZ = (Math.random() - 0.5) * 3;

    // Update effect config with level-scaled branch count
    const branchRange = this.branchCountMax - this.branchCountMin;
    this.lightningEffect.config.branches = this.branchCountMin + Math.floor(Math.random() * branchRange);
    this.lightningEffect.config.width = this.lightningWidth;

    const lightning = this.lightningEffect.spawn(engine, {
      startX: target.x + offsetX,
      startY: 35,
      startZ: target.z + offsetZ,
      endX: target.x,
      endY: 0,
      endZ: target.z,
      damage: 0 // Explosion handles damage
    });

    // Calculate damage with crit
    const baseDamage = this.damage * stats.damage;
    const { damage: finalDamage, isCrit } = this.calculateDamage(baseDamage);

    // Create ground explosion at impact
    const explosion = new LightningExplosion(
      engine,
      target.x,
      target.z,
      this.radius,
      finalDamage,
      isCrit
    );
    engine.addEntity(explosion);
  }
}