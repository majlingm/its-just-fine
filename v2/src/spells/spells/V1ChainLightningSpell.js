import { V1InstantSpell as InstantSpell } from '../V1InstantSpell.js';
import { ColoredLightning } from '../../entities/V1ColoredLightning.js';
import spellData from '../V1spellData.json';

/**
 * Chain Lightning - Continuous lightning that chains between enemies
 */
export class V1ChainLightningSpell extends InstantSpell {
  constructor(level = 1) {
    const data = spellData.CHAIN_LIGHTNING;

    super({
      spellKey: 'CHAIN_LIGHTNING',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Mark as continuous
      isContinuous: true
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
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