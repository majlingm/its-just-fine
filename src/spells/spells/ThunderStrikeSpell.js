import { InstantSpell } from '../InstantSpell.js';
import { LightningExplosion } from '../../entities/LightningExplosion.js';
import { LightningEffect } from '../../effects/LightningEffect.js';

/**
 * Thunder Strike - Sky lightning strikes ground with devastating explosion
 */
export class ThunderStrikeSpell extends InstantSpell {
  constructor(level = 1) {
    super({
      name: 'Thunder Strike',
      description: 'Sky lightning strikes ground with devastating explosion',
      category: 'lightning',
      level: level,

      // Damage
      damage: 200,
      damageSpread: 15,

      // Crit
      critChance: 0.1,
      critMultiplier: 2.0,
      critDamageSpread: 10,

      // Cooldown (will be randomized)
      cooldown: 0.8,

      // Targeting
      targeting: 'random',
      maxRange: 15
    });

    // Thunder Strike specific properties
    this.baseCooldownMin = 0.8;
    this.baseCooldownMax = 1.5;
    this.radius = 5;
    this.lastGlobalStrike = 0;

    // Lightning effect configuration
    this.lightningEffect = new LightningEffect({
      color: 0xffff00,
      glowColor: 0xffffaa,
      width: 1.2,
      taper: true,
      gradientColor: 0xffffff,
      lifetime: 0.3,
      branches: 4,
      branchWidth: 0.4
    });

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [200, 250, 300, 360, 430, 510, 600];
    const radiusScaling = [5, 5.5, 6, 6.5, 7, 7.5, 8];

    this.damage = damageScaling[level - 1] || this.damage;
    this.radius = radiusScaling[level - 1] || this.radius;
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

    // Update effect config
    this.lightningEffect.config.branches = 2 + Math.floor(Math.random() * 4);

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