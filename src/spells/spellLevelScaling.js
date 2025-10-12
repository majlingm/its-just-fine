// Spell level scaling system
// Based on SPELL_LEVEL_DESIGN.md

import spellData from './spellData.json';

/**
 * Convert spell data from JSON format to progression format
 * @returns {object} SPELL_LEVEL_PROGRESSIONS object
 */
function loadSpellProgressions() {
  const progressions = {};

  for (const [spellKey, data] of Object.entries(spellData)) {
    progressions[spellKey] = data.scaling;
  }

  return progressions;
}

/**
 * Level progression data for each spell type
 * Each array contains values for levels 1-7
 * Loaded from spellData.json
 */
export const SPELL_LEVEL_PROGRESSIONS = loadSpellProgressions();

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
  console.log(`[SCALING DEBUG] Applying scaling for ${spellKey} level ${level}`);
  const levelStats = getSpellLevelStats(spellKey, level);
  console.log(`[SCALING DEBUG] Level stats:`, levelStats);

  // Apply each stat from the progression
  for (const [attribute, value] of Object.entries(levelStats)) {
    // Handle special cases for attribute mapping
    switch (attribute) {
      case 'spreadAngle':
        // Convert degrees to radians
        spell.spread = value * (Math.PI / 180);
        console.log(`[SCALING DEBUG] Set spread to ${spell.spread} (from ${value} degrees)`);
        break;

      case 'cooldownMin':
        spell.baseCooldownMin = value;
        console.log(`[SCALING DEBUG] Set baseCooldownMin to ${value}`);
        break;

      case 'cooldownMax':
        spell.baseCooldownMax = value;
        console.log(`[SCALING DEBUG] Set baseCooldownMax to ${value}`);
        break;

      default:
        // Direct mapping for most attributes
        const oldValue = spell[attribute];
        spell[attribute] = value;
        console.log(`[SCALING DEBUG] Set ${attribute}: ${oldValue} -> ${value}`);
        break;
    }
  }

  // Store the current level
  spell.level = level;
  console.log(`[SCALING DEBUG] Final spell state:`, {
    level: spell.level,
    damage: spell.damage,
    speed: spell.speed,
    cooldown: spell.cooldown,
    projectileCount: spell.projectileCount,
    pierce: spell.pierce,
    lifetime: spell.lifetime,
    sizeScale: spell.sizeScale
  });
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
