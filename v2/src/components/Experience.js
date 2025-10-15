import { Component } from '../core/ecs/Component.js';

/**
 * Experience Component
 * Tracks XP and level progression for an entity
 *
 * Features:
 * - Level progression
 * - XP accumulation
 * - Level-up rewards
 * - Stat bonuses per level
 */
export class Experience extends Component {
  constructor() {
    super();

    // Level and XP
    this.level = 1;
    this.currentXP = 0;
    this.xpToNextLevel = 100;

    // XP curve settings
    this.baseXPRequirement = 100;  // XP needed for level 2
    this.xpCurveMultiplier = 1.5;  // XP requirement growth per level

    // Stats per level
    this.healthPerLevel = 10;      // Health gained per level
    this.damagePerLevel = 2;       // Damage increase per level
    this.speedPerLevel = 0.1;      // Speed increase per level

    // Lifetime stats
    this.totalXPGained = 0;
    this.totalLevelsGained = 0;
  }

  /**
   * Initialize experience component
   * @param {Object} config - Configuration
   */
  init(config = {}) {
    this.level = config.level || 1;
    this.currentXP = config.currentXP || 0;
    this.baseXPRequirement = config.baseXPRequirement || 100;
    this.xpCurveMultiplier = config.xpCurveMultiplier || 1.5;
    this.healthPerLevel = config.healthPerLevel || 10;
    this.damagePerLevel = config.damagePerLevel || 2;
    this.speedPerLevel = config.speedPerLevel || 0.1;

    // Calculate XP to next level
    this.calculateXPToNextLevel();
  }

  /**
   * Add experience points
   * @param {number} amount - XP amount
   * @returns {boolean} True if leveled up
   */
  addXP(amount) {
    this.currentXP += amount;
    this.totalXPGained += amount;

    // Check for level up
    if (this.currentXP >= this.xpToNextLevel) {
      return this.levelUp();
    }

    return false;
  }

  /**
   * Level up the entity
   * @returns {boolean} True if leveled up
   */
  levelUp() {
    // Carry over excess XP
    const excessXP = this.currentXP - this.xpToNextLevel;

    this.level++;
    this.totalLevelsGained++;
    this.currentXP = excessXP;

    // Calculate new XP requirement
    this.calculateXPToNextLevel();

    return true;
  }

  /**
   * Calculate XP required for next level
   */
  calculateXPToNextLevel() {
    // Exponential curve: baseXP * multiplier^(level-1)
    this.xpToNextLevel = Math.floor(
      this.baseXPRequirement * Math.pow(this.xpCurveMultiplier, this.level - 1)
    );
  }

  /**
   * Get XP progress as percentage
   * @returns {number} 0-1
   */
  getXPProgress() {
    return this.currentXP / this.xpToNextLevel;
  }

  /**
   * Get total health bonus from levels
   * @returns {number}
   */
  getHealthBonus() {
    return (this.level - 1) * this.healthPerLevel;
  }

  /**
   * Get total damage bonus from levels
   * @returns {number}
   */
  getDamageBonus() {
    return (this.level - 1) * this.damagePerLevel;
  }

  /**
   * Get total speed bonus from levels
   * @returns {number}
   */
  getSpeedBonus() {
    return (this.level - 1) * this.speedPerLevel;
  }

  /**
   * Get total stat multiplier from levels
   * @param {string} stat - Stat name (health, damage, speed)
   * @returns {number} Multiplier (1.0 = no bonus)
   */
  getStatMultiplier(stat) {
    switch (stat) {
      case 'health':
        return 1.0 + (this.level - 1) * 0.1; // 10% per level
      case 'damage':
        return 1.0 + (this.level - 1) * 0.08; // 8% per level
      case 'speed':
        return 1.0 + (this.level - 1) * 0.05; // 5% per level
      default:
        return 1.0;
    }
  }
}
