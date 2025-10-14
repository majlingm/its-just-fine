// Import all spell classes
import { FireballSpell } from './FireballSpell.js';
import { ThunderStrikeSpell } from './spells/ThunderStrikeSpell.js';
import { ChainLightningSpell } from './spells/ChainLightningSpell.js';
import { IceLanceSpell } from './spells/IceLanceSpell.js';
import { RingOfFireSpell } from './spells/RingOfFireSpell.js';
import { PyroExplosionSpell } from './spells/PyroExplosionSpell.js';
import { RingOfIceSpell } from './spells/RingOfIceSpell.js';
import { MagicBulletSpell } from './spells/MagicBulletSpell.js';
import { DashShockwaveSpell } from './spells/DashShockwaveSpell.js';

/**
 * SpellRegistry - Manages all available spell types
 */
export class SpellRegistry {
  constructor() {
    this.spellClasses = new Map();
    this.registerDefaultSpells();
  }

  /**
   * Register all default spell types
   */
  registerDefaultSpells() {
    // Fire spells
    this.register('FIREBALL', FireballSpell);
    this.register('PYRO_EXPLOSION', PyroExplosionSpell);
    this.register('RING_OF_FIRE', RingOfFireSpell);

    // Lightning spells
    this.register('THUNDER_STRIKE', ThunderStrikeSpell);
    this.register('CHAIN_LIGHTNING', ChainLightningSpell);

    // Ice spells
    this.register('ICE_LANCE', IceLanceSpell);
    this.register('RING_OF_ICE', RingOfIceSpell);

    // Magic spells
    this.register('MAGIC_BULLET', MagicBulletSpell);
    this.register('DASH_SHOCKWAVE', DashShockwaveSpell);
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
export const spellRegistry = new SpellRegistry();