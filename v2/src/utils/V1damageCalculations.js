/**
 * Damage calculation utilities
 * Extracted from spellTypes.js to avoid circular dependencies
 */

/**
 * Calculate damage with variance
 * @param {number} baseDamage - Base damage value
 * @param {number} spread - Damage variance as percentage (0-100)
 * @returns {number} Final damage
 */
export function calculateDamageWithSpread(baseDamage, spread = 0) {
  if (spread === 0) return baseDamage;
  const variance = baseDamage * (spread / 100);
  const minDamage = baseDamage - variance;
  const maxDamage = baseDamage + variance;
  return minDamage + Math.random() * (maxDamage - minDamage);
}

/**
 * Calculate damage with critical hit chance
 * @param {number} baseDamage - Base damage value
 * @param {object} spell - Spell object with crit properties
 * @returns {object} { damage: number, isCrit: boolean }
 */
export function calculateDamageWithCrit(baseDamage, spell) {
  const critChance = spell?.critChance || 0;
  const critMultiplier = spell?.critMultiplier || 1;
  const critDamageSpread = spell?.critDamageSpread || 0;
  const damageSpread = spell?.damageSpread || 0;

  const isCrit = Math.random() < critChance;
  let finalDamage;

  if (isCrit) {
    const critBaseDamage = baseDamage * critMultiplier;
    finalDamage = calculateDamageWithSpread(critBaseDamage, critDamageSpread);
  } else {
    finalDamage = calculateDamageWithSpread(baseDamage, damageSpread);
  }

  return { damage: Math.max(1, Math.round(finalDamage)), isCrit };
}