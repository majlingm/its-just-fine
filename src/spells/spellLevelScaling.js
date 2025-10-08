// Spell level scaling system
// Based on SPELL_LEVEL_DESIGN.md

/**
 * Level progression data for each spell type
 * Each array contains values for levels 1-7
 */
export const SPELL_LEVEL_PROGRESSIONS = {
  THUNDER_STRIKE: {
    damage: [200, 250, 300, 375, 475, 600, 800],
    explosionRadius: [5, 5.5, 6, 7, 8, 9.5, 11],
    cooldownMin: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
    cooldownMax: [1.5, 1.3, 1.1, 0.9, 0.7, 0.5, 0.4],
    lightningWidth: [1.2, 1.3, 1.4, 1.6, 1.8, 2.1, 2.5],
    branchCountMin: [2, 3, 4, 5, 6, 7, 8],
    branchCountMax: [5, 6, 7, 8, 10, 12, 15],
    shockwaveRings: [3, 3, 4, 4, 5, 5, 6]
  },

  CHAIN_LIGHTNING: {
    damage: [8, 9, 10, 12, 14, 16, 18], // Significantly reduced
    chainCount: [3, 3, 4, 4, 5, 5, 6],
    chainRange: [4, 4.5, 5, 5.5, 6, 6.5, 7], // Much shorter range
    cooldown: [0.15, 0.14, 0.13, 0.12, 0.11, 0.10, 0.09],
    maxRange: [8, 9, 10, 11, 12, 13, 14], // Much shorter initial range
    lightningWidth: [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2]
  },

  FIREBALL: {
    damage: [16, 20, 26, 34, 45, 60, 80],
    speed: [20, 22, 24, 27, 30, 34, 40],
    pierce: [2, 3, 4, 5, 6, 8, 10],
    projectileCount: [1, 1, 2, 2, 3, 3, 4],
    spreadAngle: [0, 0, 15, 15, 20, 20, 25], // In degrees
    cooldown: [0.25, 0.23, 0.20, 0.17, 0.14, 0.11, 0.08],
    sizeScale: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 2.0],
    lifetime: [0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.8],
    maxRange: [20, 22, 24, 26, 28, 30, 35]
  },

  PYRO_EXPLOSION: {
    damage: [30, 40, 55, 75, 100, 135, 180],
    radius: [3.5, 4.0, 4.5, 5.2, 6.0, 7.0, 8.5],
    cooldown: [1.5, 1.3, 1.1, 0.9, 0.7, 0.5, 0.3],
    particleCount: [20, 25, 30, 40, 50, 65, 85],
    shockwaveRings: [3, 3, 4, 4, 5, 5, 6]
  },

  RING_OF_FIRE: {
    damage: [15, 20, 27, 37, 50, 68, 92],
    particleCount: [64, 72, 80, 90, 100, 112, 128],
    ringRadius: [2.2, 2.3, 2.4, 2.5, 2.7, 2.9, 3.2],
    regenerationRate: [0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04],
    burstRegenRate: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
    rotationSpeed: [1.5, 1.6, 1.7, 1.9, 2.1, 2.4, 2.8],
    burstDamageMultiplier: [6, 6.5, 7, 8, 9, 11, 14],
    burstCooldown: [1.5, 1.4, 1.2, 1.0, 0.8, 0.6, 0.4],
    particleSizeMin: [0.55, 0.6, 0.65, 0.7, 0.75, 0.85, 1.0],
    particleSizeMax: [0.9, 0.95, 1.0, 1.1, 1.2, 1.35, 1.5]
  },

  ICE_LANCE: {
    damage: [20, 26, 34, 45, 60, 80, 110],
    speed: [25, 27, 30, 33, 37, 42, 48],
    pierce: [3, 4, 5, 6, 7, 9, 12],
    cooldownMin: [0.3, 0.28, 0.25, 0.22, 0.18, 0.14, 0.1],
    cooldownMax: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
    freezeDuration: [10, 11, 12, 14, 16, 19, 23],
    freezeSlow: [0.80, 0.82, 0.84, 0.86, 0.88, 0.91, 0.94], // As decimal (0.80 = 80% slow)
    sizeScale: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 2.0],
    trailParticleRate: [0.04, 0.04, 0.035, 0.03, 0.025, 0.02, 0.015],
    lifetime: [0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.8],
    maxRange: [20, 22, 24, 26, 28, 30, 35]
  },

  RING_OF_ICE: {
    damage: [10, 14, 19, 26, 36, 49, 67],
    particleCount: [64, 72, 80, 90, 100, 112, 128],
    ringRadius: [2.2, 2.3, 2.4, 2.5, 2.7, 2.9, 3.2],
    regenerationRate: [0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04],
    burstRegenRate: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
    rotationSpeed: [1.2, 1.3, 1.4, 1.6, 1.8, 2.1, 2.5],
    burstDamageMultiplier: [5, 5.5, 6, 7, 8, 10, 13],
    burstCooldown: [1.5, 1.4, 1.2, 1.0, 0.8, 0.6, 0.4],
    freezeDuration: [10, 11, 12, 14, 16, 19, 23],
    freezeSlow: [0.80, 0.82, 0.84, 0.86, 0.88, 0.91, 0.94],
    particleSizeMin: [0.55, 0.6, 0.65, 0.7, 0.75, 0.85, 1.0],
    particleSizeMax: [0.9, 0.95, 1.0, 1.1, 1.2, 1.35, 1.5]
  },

  MAGIC_BULLET: {
    damage: [8, 11, 15, 21, 29, 40, 55],
    speed: [30, 33, 36, 40, 45, 51, 60],
    pierce: [1, 2, 3, 4, 5, 7, 10],
    cooldown: [0.08, 0.07, 0.06, 0.05, 0.045, 0.04, 0.035], // Reduced from 0.04/0.03/0.02 at high levels for performance
    projectileCount: [1, 1, 2, 2, 3, 3, 4],
    lifetime: [0.6, 0.7, 0.8, 1.0, 1.2, 1.5, 1.8],
    sizeScale: [0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.85]
  }
};

/**
 * Get the scaled value for a specific spell attribute at a given level
 * @param {string} spellKey - The spell type key (e.g., 'THUNDER_STRIKE')
 * @param {string} attribute - The attribute name (e.g., 'damage')
 * @param {number} level - The spell level (1-7)
 * @returns {number} The scaled value
 */
export function getSpellLevelValue(spellKey, attribute, level) {
  const progression = SPELL_LEVEL_PROGRESSIONS[spellKey];
  if (!progression || !progression[attribute]) {
    console.warn(`No progression data for ${spellKey}.${attribute}`);
    return null;
  }

  // Clamp level to 1-7
  const clampedLevel = Math.max(1, Math.min(7, level));
  return progression[attribute][clampedLevel - 1];
}

/**
 * Get all scaled stats for a spell at a given level
 * @param {string} spellKey - The spell type key
 * @param {number} level - The spell level (1-7)
 * @returns {object} Object containing all scaled stats
 */
export function getSpellLevelStats(spellKey, level) {
  const progression = SPELL_LEVEL_PROGRESSIONS[spellKey];
  if (!progression) {
    console.warn(`No progression data for ${spellKey}`);
    return {};
  }

  const clampedLevel = Math.max(1, Math.min(7, level));
  const stats = {};

  // Get all attribute values for this level
  for (const [attribute, values] of Object.entries(progression)) {
    stats[attribute] = values[clampedLevel - 1];
  }

  return stats;
}

/**
 * Apply level scaling to a spell instance
 * Modifies the spell object with level-scaled values
 * @param {object} spell - The spell instance
 * @param {string} spellKey - The spell type key
 * @param {number} level - The spell level (1-7)
 */
export function applySpellLevelScaling(spell, spellKey, level) {
  const levelStats = getSpellLevelStats(spellKey, level);

  // Apply each stat from the progression
  for (const [attribute, value] of Object.entries(levelStats)) {
    // Handle special cases for attribute mapping
    switch (attribute) {
      case 'spreadAngle':
        // Convert degrees to radians
        spell.spread = value * (Math.PI / 180);
        break;

      case 'cooldownMin':
        spell.baseCooldownMin = value;
        break;

      case 'cooldownMax':
        spell.baseCooldownMax = value;
        break;

      case 'explosionRadius':
        spell.radius = value;
        break;

      default:
        // Direct mapping for most attributes
        spell[attribute] = value;
        break;
    }
  }

  // Store the current level
  spell.level = level;
}

/**
 * Calculate upgrade cost for a spell level
 * Cost increases exponentially: 1x, 2x, 3x, 5x, 8x, 13x
 * @param {number} currentLevel - Current spell level (1-7)
 * @param {number} baseCost - Base upgrade cost
 * @returns {number} The upgrade cost
 */
export function getUpgradeCost(currentLevel, baseCost = 100) {
  const multipliers = [1, 2, 3, 5, 8, 13];
  const level = Math.max(1, Math.min(6, currentLevel));
  return baseCost * multipliers[level - 1];
}
