import { spellRegistry } from '../spells/SpellRegistry.js';
import { SPELL_TYPES } from '../spells/spellTypes.js';

/**
 * SpellCaster system - manages spell instances and casting
 * Provides compatibility between old SPELL_TYPES and new spell class system
 */
export class SpellCaster {
  constructor() {
    // Map spell type objects to spell keys
    this.spellTypeToKey = new Map();
    this.keyToSpellType = new Map();

    // Initialize mappings
    this.initializeMappings();

    // Cache of spell instances by key and level
    this.spellCache = new Map();
  }

  /**
   * Initialize mappings between SPELL_TYPES and spell registry keys
   */
  initializeMappings() {
    // Map each SPELL_TYPE to its registry key
    const mappings = {
      'FIREBALL': SPELL_TYPES.FIREBALL,
      'THUNDER_STRIKE': SPELL_TYPES.THUNDER_STRIKE,
      'CHAIN_LIGHTNING': SPELL_TYPES.CHAIN_LIGHTNING,
      'ICE_LANCE': SPELL_TYPES.ICE_LANCE,
      'RING_OF_FIRE': SPELL_TYPES.RING_OF_FIRE,
      'RING_OF_ICE': SPELL_TYPES.RING_OF_ICE,
      'PYRO_EXPLOSION': SPELL_TYPES.PYRO_EXPLOSION,
      'MAGIC_BULLET': SPELL_TYPES.MAGIC_BULLET
    };

    Object.entries(mappings).forEach(([key, spellType]) => {
      this.spellTypeToKey.set(spellType, key);
      this.keyToSpellType.set(key, spellType);
    });
  }

  /**
   * Get or create a spell instance for a weapon
   * @param {Object} weaponInstance - Weapon instance with type and level
   * @returns {Object} Spell instance or original spell type for compatibility
   */
  getSpell(weaponInstance) {
    const spellType = weaponInstance.type;
    const level = weaponInstance.level || 1;

    // Get the spell key from the spell type
    const spellKey = this.spellTypeToKey.get(spellType);

    if (!spellKey) {
      // Fallback to original spell type if not in registry
      return spellType;
    }

    // Create cache key
    const cacheKey = `${spellKey}_${level}`;

    // Check cache
    if (this.spellCache.has(cacheKey)) {
      return this.spellCache.get(cacheKey);
    }

    // Create new spell instance
    const spell = spellRegistry.createSpell(spellKey, level);

    if (!spell) {
      // Fallback to original spell type if creation fails
      return spellType;
    }

    // Add compatibility properties from original spell type
    this.addCompatibilityProperties(spell, spellType);

    // Cache the spell instance
    this.spellCache.set(cacheKey, spell);

    return spell;
  }

  /**
   * Add compatibility properties to make new spell classes work with existing code
   * @param {Object} spell - New spell instance
   * @param {Object} spellType - Original SPELL_TYPE object
   */
  addCompatibilityProperties(spell, spellType) {
    // Copy properties that the existing system expects
    spell.cooldown = spell.cooldown || spellType.cooldown;
    spell.targeting = spell.targeting || spellType.targeting;
    spell.maxRange = spell.maxRange || spellType.maxRange;
    spell.projectileCount = spell.projectileCount || spellType.projectileCount;
    spell.spread = spell.spread || spellType.spread;
    spell.pierce = spell.pierce || spellType.pierce;
    spell.lifetime = spell.lifetime || spellType.lifetime;
    spell.speed = spell.speed || spellType.speed;

    // Copy execution flags
    spell.isInstant = spell.isInstant || spellType.isInstant;
    spell.isPersistent = spell.isPersistent || spellType.isPersistent;
    spell.isPattern = spell.isPattern || spellType.isPattern;
    spell.hasRandomCooldown = spellType.hasRandomCooldown;
    spell.baseCooldownMin = spellType.baseCooldownMin;
    spell.baseCooldownMax = spellType.baseCooldownMax;

    // Copy special properties for specific spells
    if (spellType.chainCount !== undefined) {
      spell.chainCount = spell.chainCount || spellType.chainCount;
      spell.chainRange = spell.chainRange || spellType.chainRange;
    }

    // Keep reference to original createProjectile if it exists
    if (spellType.createProjectile && !spell.createProjectile) {
      spell.createProjectile = spellType.createProjectile;
    }

    // For new projectile spells, create a createProjectile wrapper
    if (!spell.createProjectile && spell.projectileClass) {
      spell.createProjectile = (engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) => {
        return new spell.projectileClass(engine, x, y, z, dirX, dirZ, spell, stats, dirY);
      };
    }

    // Keep reference to active entities (for persistent spells)
    if (spellType.activeRing !== undefined) {
      spell.activeRing = spellType.activeRing;
    }

    // Add execute wrapper for compatibility with old system
    if (!spellType.execute && spell.cast) {
      // New spell class - create execute wrapper
      spell.execute = (engine, player, target, spellRef, stats) => {
        // For persistent spells
        if (spell.entityClass) {
          spell.cast(engine, player, stats);
          // Keep track of active entity in old format
          if (spell.activeEntity) {
            spell.activeRing = spell.activeEntity;
          }
        }
        // For instant spells with specific execute method
        else if (spell.execute && spell.execute !== arguments.callee) {
          spell.execute(engine, player, target, stats);
        }
        // For projectile spells or others with cast method
        else {
          spell.cast(engine, player, stats);
        }
      };
    }
  }

  /**
   * Execute a spell - wrapper that handles both old and new spell systems
   * @param {Object} spell - Spell instance or spell type
   * @param {Object} engine - Game engine
   * @param {Object} player - Player entity
   * @param {Object} target - Target entity (optional)
   * @param {Object} stats - Player stats
   */
  executeSpell(spell, engine, player, target, stats) {
    // Check if it's a new spell class with execute method
    if (spell.execute && typeof spell.execute === 'function') {
      return spell.execute(engine, player, target, stats);
    }

    // Fallback to old spell type execute
    if (spell.execute) {
      // Old system passes spell as 4th parameter
      return spell.execute(engine, player, target, spell, stats);
    }
  }

  /**
   * Cast a projectile spell
   * @param {Object} spell - Spell instance or spell type
   * @param {Object} engine - Game engine
   * @param {Object} player - Player entity
   * @param {Object} target - Target entity
   * @param {Object} stats - Player stats
   */
  castProjectileSpell(spell, engine, player, target, stats) {
    if (spell.castProjectile && typeof spell.castProjectile === 'function') {
      // New spell class method
      return spell.castProjectile(engine, player, target, stats);
    }

    // Fallback to old createProjectile
    if (spell.createProjectile) {
      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const mag = Math.sqrt(dx * dx + dz * dz);
      const dirX = dx / mag;
      const dirZ = dz / mag;

      const proj = spell.createProjectile(
        engine,
        player.x,
        1,
        player.z,
        dirX,
        dirZ,
        spell,
        stats
      );
      engine.addEntity(proj);
    }
  }

  /**
   * Apply weapon upgrade to a spell
   * @param {Object} weaponInstance - Weapon instance being upgraded
   */
  upgradeSpell(weaponInstance) {
    // Clear cache for this spell so a new instance is created next time
    const spellType = weaponInstance.type;
    const spellKey = this.spellTypeToKey.get(spellType);

    if (spellKey) {
      // Clear all cached versions of this spell
      for (const [key] of this.spellCache) {
        if (key.startsWith(spellKey)) {
          this.spellCache.delete(key);
        }
      }
    }
  }

  /**
   * Clear the spell cache
   */
  clearCache() {
    this.spellCache.clear();
  }
}

// Create singleton instance
export const spellCaster = new SpellCaster();