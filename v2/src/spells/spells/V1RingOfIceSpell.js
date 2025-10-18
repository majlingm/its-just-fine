import { V1PersistentSpell as PersistentSpell } from '../V1PersistentSpell.js';
import { RingOfIce } from '../../entities/V1RingOfIce.js';
import spellData from '../V1spellData.json';

/**
 * Ring of Ice - Protective ring of ice shards that orbit the player and freeze enemies
 */
export class V1RingOfIceSpell extends PersistentSpell {
  constructor(level = 1) {
    const data = spellData.RING_OF_ICE;

    super({
      spellKey: 'RING_OF_ICE',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Entity class
      entityClass: RingOfIce
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
  }
}