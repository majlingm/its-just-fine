import { Spell } from './Spell.js';

/**
 * PersistentSpell - Base class for spells that create persistent entities
 * (Ring of Fire, Ring of Ice, etc.)
 */
export class PersistentSpell extends Spell {
  constructor(config = {}) {
    super(config);

    // The persistent entity this spell maintains
    this.activeEntity = null;

    // Entity class to instantiate
    this.entityClass = config.entityClass || null;

    // No cooldown for persistent spells
    this.cooldown = 0;
  }

  /**
   * Cast the persistent spell
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  cast(engine, player, stats) {
    // Only create entity if it doesn't exist or is inactive
    if (!this.activeEntity || !this.activeEntity.active) {
      this.createEntity(engine, player, stats);
    }

    // Check for special actions (like burst for Ring of Fire)
    if (this.activeEntity && this.activeEntity.active) {
      this.performSpecialAction(engine, player, stats);
    }
  }

  /**
   * Create the persistent entity
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  createEntity(engine, player, stats) {
    if (!this.entityClass) {
      console.error('PersistentSpell: No entityClass defined');
      return;
    }

    const baseDamage = this.damage * stats.damage;
    this.activeEntity = new this.entityClass(engine, player, baseDamage, this);
    engine.addEntity(this.activeEntity);
  }

  /**
   * Perform special action (override in subclass if needed)
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  performSpecialAction(engine, player, stats) {
    // Override in subclass for special actions
  }

  /**
   * Deactivate the persistent spell
   */
  deactivate() {
    if (this.activeEntity && this.activeEntity.active) {
      this.activeEntity.destroy();
      this.activeEntity = null;
    }
  }
}