import { PersistentSpell } from '../PersistentSpell.js';
import { RingOfFire } from '../../entities/RingOfFire.js';
import spellData from '../spellData.json';

/**
 * Ring of Fire - Protective ring of many small flames that orbit the player
 */
export class RingOfFireSpell extends PersistentSpell {
  constructor(level = 1) {
    const data = spellData.RING_OF_FIRE;

    super({
      spellKey: 'RING_OF_FIRE',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Entity class
      entityClass: RingOfFire
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
  }

  /**
   * Perform special action - trigger burst if possible
   */
  performSpecialAction(engine, player, stats) {
    // Check if player wants to trigger burst (could be bound to a key)
    // For now, this could be triggered automatically or by a special condition
    if (this.activeEntity && this.activeEntity.isRingFull()) {
      // You could check for a key press or other condition here
      // this.activeEntity.triggerBurst();
    }
  }
}