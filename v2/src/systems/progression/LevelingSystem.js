/**
 * LevelingSystem - Manages XP and level progression
 *
 * Responsibilities:
 * - Award XP for killing enemies
 * - Handle level ups
 * - Apply stat bonuses on level up
 * - Emit level-up events
 *
 * Features:
 * - Event-driven XP rewards
 * - Automatic stat scaling
 * - Level-up notifications
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class LevelingSystem extends ComponentSystem {
  constructor() {
    // Process entities with Experience component
    super(['Experience']);

    // XP rewards by enemy type
    this.xpRewards = {
      'shadow_lurker': 10,
      'flame_imp': 15,
      'crystal_guardian': 25,
      'void_walker': 30,
      'frost_shard': 20,
      'corrupted_knight': 100,  // Boss
      'stone_golem': 100,        // Boss
      'arcane_wisp': 100         // Boss
    };

    // Base XP reward
    this.baseXPReward = 10;
  }

  /**
   * Initialize system
   */
  init() {
    // Listen for enemy death events to award XP
    window.addEventListener('entity-died', (event) => {
      this.onEntityDied(event.detail.entity);
    });

    console.log('✅ Leveling System initialized');
  }

  /**
   * Process entities with Experience component
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with Experience component
   */
  process(dt, entities) {
    // Store entities for use in event handlers
    this.entitiesWithExperience = entities;

    // Listen for XP reward events
    if (!this.xpRewardListener) {
      this.xpRewardListener = (event) => {
        const { amount, source } = event.detail;

        // Award XP to all entities with Experience component
        for (const entity of this.entitiesWithExperience) {
          const experience = entity.getComponent('Experience');
          if (!experience || !experience.enabled) continue;

          // Award XP
          const didLevelUp = experience.addXP(amount);

          // Emit XP gain event
          this.emitXPGainEvent(entity, amount, source);

          // Handle level up
          if (didLevelUp) {
            this.onLevelUp(entity);
          }
        }
      };

      window.addEventListener('xp-reward', this.xpRewardListener);
    }
  }

  /**
   * Handle entity death event
   * @param {Entity} entity - Entity that died
   */
  onEntityDied(entity) {
    // Only award XP for enemy deaths
    if (!entity.hasTag('enemy')) return;

    // Get enemy type for XP reward
    const enemyType = entity.entityType || 'unknown';
    const xpReward = this.xpRewards[enemyType] || this.baseXPReward;

    // Award XP to all entities with Experience component
    // (typically just the player, but could be a party system)
    this.awardXPToAll(xpReward, entity);
  }

  /**
   * Award XP to all entities with Experience component
   * @param {number} amount - XP amount
   * @param {Entity} source - Source entity (what was killed)
   */
  awardXPToAll(amount, source) {
    // Award XP to entities with Experience component
    // We need to access the entities through the last update call
    // For now, we'll emit an event that can be caught by UISystem
    // and the player will be awarded XP directly through events

    // Emit XP reward event
    const event = new CustomEvent('xp-reward', {
      detail: {
        amount: amount,
        source: source
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle level up
   * @param {Entity} entity - Entity that leveled up
   */
  onLevelUp(entity) {
    const experience = entity.getComponent('Experience');
    const health = entity.getComponent('Health');
    const movement = entity.getComponent('Movement');
    const weapon = entity.getComponent('Weapon');

    // Apply stat bonuses
    if (health) {
      // Increase max health
      const healthBonus = experience.healthPerLevel;
      health.max += healthBonus;
      health.current = health.max; // Fully heal on level up
    }

    if (movement) {
      // Increase speed
      const speedBonus = experience.speedPerLevel;
      movement.speed += speedBonus;
      movement.maxSpeed += speedBonus;
    }

    if (weapon) {
      // Increase damage
      const damageBonus = experience.damagePerLevel;
      weapon.damage += damageBonus;
    }

    // Emit level up event
    this.emitLevelUpEvent(entity);

    console.log(`🎉 ${entity.displayName || 'Entity'} leveled up to level ${experience.level}!`);
    console.log(`  Health: ${health?.max}, Speed: ${movement?.speed.toFixed(1)}, Damage: ${weapon?.damage}`);
  }

  /**
   * Emit XP gain event
   * @param {Entity} entity - Entity that gained XP
   * @param {number} amount - XP amount
   * @param {Entity} source - Source of XP
   */
  emitXPGainEvent(entity, amount, source) {
    const event = new CustomEvent('xp-gained', {
      detail: {
        entity: entity,
        amount: amount,
        source: source
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit level up event
   * @param {Entity} entity - Entity that leveled up
   */
  emitLevelUpEvent(entity) {
    const event = new CustomEvent('level-up', {
      detail: {
        entity: entity,
        level: entity.getComponent('Experience')?.level
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get XP reward for enemy type
   * @param {string} enemyType - Enemy type
   * @returns {number} XP reward
   */
  getXPReward(enemyType) {
    return this.xpRewards[enemyType] || this.baseXPReward;
  }

  /**
   * Set XP reward for enemy type
   * @param {string} enemyType - Enemy type
   * @param {number} xp - XP reward
   */
  setXPReward(enemyType, xp) {
    this.xpRewards[enemyType] = xp;
  }
}
