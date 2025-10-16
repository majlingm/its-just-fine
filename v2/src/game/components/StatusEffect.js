import { Component } from '../../core/ecs/Component.js';

/**
 * StatusEffect Component
 * Tracks active status effects (buffs/debuffs) on an entity
 *
 * Status effects can:
 * - Modify stats (speed, damage, defense)
 * - Apply damage over time (burn, poison)
 * - Apply crowd control (freeze, stun, slow)
 * - Stack or replace based on type
 */
export class StatusEffect extends Component {
  constructor() {
    super();

    // Active effects list
    this.effects = []; // Array of effect objects
  }

  /**
   * Add a status effect
   * @param {Object} effect - Effect configuration
   * @returns {Object} The added effect
   */
  addEffect(effect) {
    const newEffect = {
      type: effect.type || 'unknown', // freeze, burn, poison, slow, stun, etc.
      duration: effect.duration || 3, // How long it lasts (seconds)
      timeRemaining: effect.duration || 3,
      strength: effect.strength || 1, // Effect strength (damage per tick, slow %)
      tickRate: effect.tickRate || 1, // For DoT effects (seconds between ticks)
      timeSinceLastTick: 0,
      stackable: effect.stackable !== undefined ? effect.stackable : false,
      maxStacks: effect.maxStacks || 1,
      stacks: 1,
      source: effect.source || null, // Entity that applied this effect

      // Visual properties
      color: effect.color || 0xffffff,
      particleEffect: effect.particleEffect || null,

      // Custom data
      data: effect.data || {}
    };

    // Check if effect already exists
    const existingEffect = this.effects.find(e => e.type === newEffect.type);

    if (existingEffect) {
      if (existingEffect.stackable && existingEffect.stacks < existingEffect.maxStacks) {
        // Stack the effect
        existingEffect.stacks++;
        existingEffect.timeRemaining = Math.max(existingEffect.timeRemaining, newEffect.duration);
        return existingEffect;
      } else {
        // Refresh duration
        existingEffect.timeRemaining = newEffect.duration;
        existingEffect.strength = Math.max(existingEffect.strength, newEffect.strength);
        return existingEffect;
      }
    }

    // Add new effect
    this.effects.push(newEffect);
    return newEffect;
  }

  /**
   * Remove a status effect by type
   * @param {string} type - Effect type to remove
   * @returns {boolean} True if removed
   */
  removeEffect(type) {
    const index = this.effects.findIndex(e => e.type === type);
    if (index !== -1) {
      this.effects.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove all effects
   */
  clearEffects() {
    this.effects = [];
  }

  /**
   * Check if entity has a specific effect
   * @param {string} type - Effect type
   * @returns {boolean}
   */
  hasEffect(type) {
    return this.effects.some(e => e.type === type);
  }

  /**
   * Get a specific effect
   * @param {string} type - Effect type
   * @returns {Object|null}
   */
  getEffect(type) {
    return this.effects.find(e => e.type === type) || null;
  }

  /**
   * Get all effects of a category
   * @param {string} category - 'dot', 'cc', 'buff', 'debuff'
   * @returns {Array<Object>}
   */
  getEffectsByCategory(category) {
    const categories = {
      dot: ['burn', 'poison', 'bleed'],
      cc: ['freeze', 'stun', 'slow', 'root'],
      buff: ['haste', 'shield', 'strength'],
      debuff: ['weak', 'vulnerable', 'blind']
    };

    const types = categories[category] || [];
    return this.effects.filter(e => types.includes(e.type));
  }

  /**
   * Update effect timers
   * @param {number} dt - Delta time
   * @returns {Array<Object>} Expired effects
   */
  update(dt) {
    const expiredEffects = [];

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];

      // Update timer
      effect.timeRemaining -= dt;

      // Update tick timer for DoT effects
      if (effect.tickRate > 0) {
        effect.timeSinceLastTick += dt;
      }

      // Remove expired effects
      if (effect.timeRemaining <= 0) {
        expiredEffects.push(effect);
        this.effects.splice(i, 1);
      }
    }

    return expiredEffects;
  }

  /**
   * Get total stat modifier from all effects
   * @param {string} stat - Stat name (speed, damage, defense, etc.)
   * @returns {number} Multiplier (1.0 = no change, 1.5 = +50%, 0.5 = -50%)
   */
  getStatModifier(stat) {
    let modifier = 1.0;

    for (const effect of this.effects) {
      switch (effect.type) {
        case 'slow':
          if (stat === 'speed') {
            modifier *= (1 - effect.strength); // e.g., 0.5 strength = 50% slow
          }
          break;

        case 'freeze':
        case 'stun':
          if (stat === 'speed') {
            modifier = 0; // Complete stop
          }
          break;

        case 'haste':
          if (stat === 'speed') {
            modifier *= (1 + effect.strength); // e.g., 0.5 strength = 50% speed boost
          }
          break;

        case 'weak':
          if (stat === 'damage') {
            modifier *= (1 - effect.strength);
          }
          break;

        case 'strength':
          if (stat === 'damage') {
            modifier *= (1 + effect.strength);
          }
          break;

        case 'vulnerable':
          if (stat === 'defense') {
            modifier *= (1 - effect.strength);
          }
          break;

        case 'shield':
          if (stat === 'defense') {
            modifier *= (1 + effect.strength);
          }
          break;
      }
    }

    return modifier;
  }

  /**
   * Check if entity can act (not stunned/frozen)
   * @returns {boolean}
   */
  canAct() {
    return !this.hasEffect('stun') && !this.hasEffect('freeze');
  }

  /**
   * Check if entity can move
   * @returns {boolean}
   */
  canMove() {
    return !this.hasEffect('stun') && !this.hasEffect('freeze') && !this.hasEffect('root');
  }
}
