import { Spell } from './Spell.js';

/**
 * InstantSpell - Base class for spells that execute immediately
 * (Thunder Strike, Chain Lightning, etc.)
 */
export class InstantSpell extends Spell {
  constructor(config = {}) {
    super(config);

    // Whether this is a continuous spell (fires repeatedly while active)
    this.isContinuous = config.isContinuous || false;

    // Mark as instant spell for compatibility
    this.isInstant = true;
  }

  /**
   * Cast the instant spell
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  cast(engine, player, stats) {
    if (!this.isReady() && !this.isContinuous) return;

    const target = this.findTarget(engine, player);
    if (!target && this.targeting !== 'self') return;

    // Execute the spell effect
    this.execute(engine, player, target, stats);

    // Only trigger cooldown if not continuous
    if (!this.isContinuous) {
      this.triggerCooldown();
    }
  }

  /**
   * Execute the spell effect
   * This should be overridden by subclasses
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} target - Target entity
   * @param {object} stats - Player stats
   */
  execute(engine, player, target, stats) {
    throw new Error('execute() must be implemented by subclass');
  }
}