import { InstantSpell } from '../InstantSpell.js';
import { ColoredLightning } from '../../entities/ColoredLightning.js';

/**
 * Chain Lightning - Continuous lightning that chains between enemies
 */
export class ChainLightningSpell extends InstantSpell {
  constructor(level = 1) {
    super({
      name: 'Chain Lightning',
      description: 'Continuous lightning that chains between enemies',
      category: 'lightning',
      level: level,

      // Damage
      damage: 12,
      damageSpread: 10,

      // Crit
      critChance: 0.15,
      critMultiplier: 1.5,
      critDamageSpread: 5,

      // Cooldown
      cooldown: 0.15,

      // Targeting
      targeting: 'random',
      maxRange: 15,

      // Mark as continuous
      isContinuous: true
    });

    // Chain Lightning specific properties
    this.chainCount = 3;
    this.chainRange = 8;
    this.lightningWidth = 1.2;

    // Apply level scaling
    this.applyLevelScaling(level);
  }

  /**
   * Apply level scaling to spell stats
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    const damageScaling = [12, 14, 16, 19, 22, 26, 30];
    const chainScaling = [3, 3, 4, 4, 5, 5, 6];

    this.damage = damageScaling[level - 1] || this.damage;
    this.chainCount = chainScaling[level - 1] || this.chainCount;
  }

  /**
   * Execute the chain lightning
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} target - Target entity
   * @param {object} stats - Player stats
   */
  execute(engine, player, target, stats) {
    const baseDamage = this.damage * stats.damage;
    let currentTarget = target;
    const hitEnemies = new Set();
    let prevX = player.x;
    let prevZ = player.z;

    for (let i = 0; i < this.chainCount; i++) {
      if (!currentTarget || hitEnemies.has(currentTarget)) break;

      // Calculate damage with crit for each chain
      const { damage, isCrit } = this.calculateDamage(baseDamage);

      // Create dark purple lightning bolt
      const lightning = new ColoredLightning(
        engine,
        prevX,
        1.0, // Character/enemy center height
        prevZ,
        currentTarget.x,
        1.0, // Enemy center height
        currentTarget.z,
        damage,
        0x2200aa, // Dark purple
        0x8844ff, // Purple glow
        this.lightningWidth
      );
      engine.addEntity(lightning);

      // Damage enemy
      const died = currentTarget.takeDamage(damage, isCrit);
      if (died && engine.game) {
        engine.game.killCount++;
        engine.sound.playHit();
        engine.game.dropXP(currentTarget.x, currentTarget.z, currentTarget.isElite);
      }

      hitEnemies.add(currentTarget);

      // Find next chain target
      let nextTarget = null;
      let minDist = this.chainRange;

      engine.entities.forEach(e => {
        if (e.health === undefined || !e.active || hitEnemies.has(e)) return;
        if (e === engine.game?.player) return; // Don't chain to player
        const dx = e.x - currentTarget.x;
        const dz = e.z - currentTarget.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) {
          minDist = dist;
          nextTarget = e;
        }
      });

      prevX = currentTarget.x;
      prevZ = currentTarget.z;
      currentTarget = nextTarget;
    }
  }
}