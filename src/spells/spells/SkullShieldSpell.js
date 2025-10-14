import { PersistentSpell } from '../PersistentSpell.js';
import { SkullShield } from '../../entities/SkullShield.js';
import spellData from '../spellData.json';

/**
 * Skull Shield - Orbiting skulls that damage and knock back enemies
 */
export class SkullShieldSpell extends PersistentSpell {
  constructor(level = 1) {
    const data = spellData.SKULL_SHIELD;

    super({
      spellKey: 'SKULL_SHIELD',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Entity class
      entityClass: SkullShield
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);
  }
}
