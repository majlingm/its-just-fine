// Import all spell classes
import { V1FireballSpell } from './V1FireballSpell.js';
import { V1ThunderStrikeSpell } from './spells/V1ThunderStrikeSpell.js';
import { V1ChainLightningSpell } from './spells/V1ChainLightningSpell.js';
import { V1IceLanceSpell } from './spells/V1IceLanceSpell.js';
import { V1RingOfFireSpell } from './spells/V1RingOfFireSpell.js';
import { V1PyroExplosionSpell } from './spells/V1PyroExplosionSpell.js';
import { V1RingOfIceSpell } from './spells/V1RingOfIceSpell.js';
import { V1MagicBulletSpell } from './spells/V1MagicBulletSpell.js';
import { V1DashShockwaveSpell } from './spells/V1DashShockwaveSpell.js';
import { V1ShadowBoltSpell } from './spells/V1ShadowBoltSpell.js';
import { V1SkullShieldSpell } from './spells/V1SkullShieldSpell.js';

/**
 * SpellRegistry - Manages all available spell types
 */
export class V1SpellRegistry {
  constructor() {
    this.spellClasses = new Map();
    this.registerDefaultSpells();
  }

  /**
   * Register all default spell types
   */
  registerDefaultSpells() {
    // Fire spells
    this.register('FIREBALL', V1FireballSpell);
    this.register('PYRO_EXPLOSION', V1PyroExplosionSpell);
    this.register('RING_OF_FIRE', V1RingOfFireSpell);

    // Lightning spells
    this.register('THUNDER_STRIKE', V1ThunderStrikeSpell);
    this.register('CHAIN_LIGHTNING', V1ChainLightningSpell);

    // Ice spells
    this.register('ICE_LANCE', V1IceLanceSpell);
    this.register('RING_OF_ICE', V1RingOfIceSpell);

    // Magic spells
    this.register('MAGIC_BULLET', V1MagicBulletSpell);
    this.register('DASH_SHOCKWAVE', V1DashShockwaveSpell);

    // Shadow/Dark spells
    this.register('SHADOW_BOLT', V1ShadowBoltSpell);
    this.register('SKULL_SHIELD', V1SkullShieldSpell);
  }

  /**
   * Register a spell class
   * @param {string} key - Unique identifier for the spell
   * @param {class} SpellClass - The spell class
   */
  register(key, SpellClass) {
    this.spellClasses.set(key, SpellClass);
  }

  /**
   * Create a spell instance
   * @param {string} key - Spell identifier
   * @param {number} level - Spell level (1-7)
   * @returns {Spell} Spell instance or null
   */
  createSpell(key, level = 1) {
    const SpellClass = this.spellClasses.get(key);
    if (!SpellClass) {
      console.error(`Unknown spell type: ${key}`);
      return null;
    }
    return new SpellClass(level);
  }

  /**
   * Get all available spell keys
   * @returns {Array<string>}
   */
  getAvailableSpells() {
    return Array.from(this.spellClasses.keys());
  }

  /**
   * Check if a spell exists
   * @param {string} key - Spell identifier
   * @returns {boolean}
   */
  hasSpell(key) {
    return this.spellClasses.has(key);
  }
}

// Create singleton instance
export const spellRegistry = new V1SpellRegistry();