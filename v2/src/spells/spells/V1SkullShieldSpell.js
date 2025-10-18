import { V1PersistentSpell as PersistentSpell } from '../V1PersistentSpell.js';
import { SkullShield } from '../../entities/V1SkullShield.js';
import spellData from '../V1spellData.json';

/**
 * Skull Shield - Orbiting skulls that damage and knock back enemies
 */
export class V1SkullShieldSpell extends PersistentSpell {
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
