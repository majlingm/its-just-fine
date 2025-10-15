/**
 * StatusEffectSystem - Manages status effects on entities
 *
 * Responsibilities:
 * - Update effect timers
 * - Apply damage over time (burn, poison)
 * - Apply movement modifiers (slow, freeze)
 * - Apply visual effects
 * - Remove expired effects
 *
 * Works with:
 * - StatusEffect component (active effects)
 * - Movement component (speed modifiers)
 * - Health component (DoT damage)
 * - Renderable component (visual feedback)
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class StatusEffectSystem extends ComponentSystem {
  constructor() {
    // Require StatusEffect component
    super(['StatusEffect']);
  }

  /**
   * Process entities with status effects
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with StatusEffect component
   */
  process(dt, entities) {
    for (const entity of entities) {
      const statusEffect = entity.getComponent('StatusEffect');
      const movement = entity.getComponent('Movement');
      const health = entity.getComponent('Health');
      const renderable = entity.getComponent('Renderable');

      // Update effect timers and get expired effects
      const expiredEffects = statusEffect.update(dt);

      // Emit events for expired effects
      for (const effect of expiredEffects) {
        this.onEffectExpired(entity, effect);
      }

      // Process active effects
      for (const effect of statusEffect.effects) {
        // Apply effect based on type
        switch (effect.type) {
          case 'burn':
          case 'poison':
          case 'bleed':
            this.applyDamageOverTime(entity, effect, health, dt);
            break;

          case 'freeze':
          case 'stun':
            this.applyStun(entity, effect, movement);
            break;

          case 'slow':
            this.applySlow(entity, effect, movement);
            break;

          case 'haste':
            this.applyHaste(entity, effect, movement);
            break;
        }

        // Apply visual effects
        if (renderable) {
          this.applyVisualEffect(entity, effect, renderable);
        }
      }
    }
  }

  /**
   * Apply damage over time effect
   * @param {Entity} entity - Entity with effect
   * @param {Object} effect - Effect configuration
   * @param {Health} health - Health component
   * @param {number} dt - Delta time
   */
  applyDamageOverTime(entity, effect, health, dt) {
    if (!health || !health.enabled) return;

    // Check if it's time to tick
    if (effect.timeSinceLastTick >= effect.tickRate) {
      // Apply damage
      const damage = effect.strength * effect.stacks;
      health.current = Math.max(0, health.current - damage);

      // Reset tick timer
      effect.timeSinceLastTick = 0;

      // Emit damage event
      this.emitDotDamage(entity, effect, damage);
    }
  }

  /**
   * Apply stun/freeze effect
   * @param {Entity} entity - Entity with effect
   * @param {Object} effect - Effect configuration
   * @param {Movement} movement - Movement component
   */
  applyStun(entity, effect, movement) {
    if (!movement) return;

    // Stop all movement
    movement.velocityX = 0;
    movement.velocityZ = 0;
  }

  /**
   * Apply slow effect
   * @param {Entity} entity - Entity with effect
   * @param {Object} effect - Effect configuration
   * @param {Movement} movement - Movement component
   */
  applySlow(entity, effect, movement) {
    if (!movement) return;

    // Slow is applied as a modifier in MovementSystem
    // This system just tracks it
  }

  /**
   * Apply haste effect
   * @param {Entity} entity - Entity with effect
   * @param {Object} effect - Effect configuration
   * @param {Movement} movement - Movement component
   */
  applyHaste(entity, effect, movement) {
    if (!movement) return;

    // Haste is applied as a modifier in MovementSystem
    // This system just tracks it
  }

  /**
   * Apply visual feedback for effect
   * @param {Entity} entity - Entity with effect
   * @param {Object} effect - Effect configuration
   * @param {Renderable} renderable - Renderable component
   */
  applyVisualEffect(entity, effect, renderable) {
    if (!renderable || !renderable.enabled) return;

    // Get the dominant effect for visuals (highest priority)
    const statusEffect = entity.getComponent('StatusEffect');
    const dominantEffect = this.getDominantEffect(statusEffect.effects);

    if (!dominantEffect) return;

    // Apply color tint based on effect
    const tintColors = {
      burn: 0xff4400,
      poison: 0x00ff44,
      freeze: 0x00ccff,
      slow: 0x4488ff,
      stun: 0xffff00,
      bleed: 0xff0000,
      haste: 0xffaa00,
      shield: 0x00ffff
    };

    const tintColor = tintColors[dominantEffect.type];
    if (tintColor) {
      // Mix original color with tint (subtle effect)
      const originalColor = renderable.color;
      const mixFactor = 0.3; // 30% tint

      const r1 = (originalColor >> 16) & 0xff;
      const g1 = (originalColor >> 8) & 0xff;
      const b1 = originalColor & 0xff;

      const r2 = (tintColor >> 16) & 0xff;
      const g2 = (tintColor >> 8) & 0xff;
      const b2 = tintColor & 0xff;

      const r = Math.floor(r1 * (1 - mixFactor) + r2 * mixFactor);
      const g = Math.floor(g1 * (1 - mixFactor) + g2 * mixFactor);
      const b = Math.floor(b1 * (1 - mixFactor) + b2 * mixFactor);

      const tintedColor = (r << 16) | (g << 8) | b;

      // Update renderable (will be synced by RenderSystem)
      if (renderable.material) {
        renderable.material.color.setHex(tintedColor);
        renderable.material.emissive.setHex(Math.floor(tintedColor * 0.5));
      }
    }
  }

  /**
   * Get the dominant effect for visual display
   * @param {Array<Object>} effects - Active effects
   * @returns {Object|null}
   */
  getDominantEffect(effects) {
    if (effects.length === 0) return null;

    // Priority order: cc > dot > buff > debuff
    const priorities = {
      freeze: 5,
      stun: 5,
      burn: 4,
      poison: 4,
      bleed: 4,
      slow: 3,
      haste: 2,
      shield: 2,
      weak: 1,
      vulnerable: 1
    };

    return effects.reduce((dominant, effect) => {
      const effectPriority = priorities[effect.type] || 0;
      const dominantPriority = priorities[dominant?.type] || 0;

      return effectPriority > dominantPriority ? effect : dominant;
    }, null);
  }

  /**
   * Emit DoT damage event
   * @param {Entity} entity - Entity taking damage
   * @param {Object} effect - Effect that dealt damage
   * @param {number} damage - Damage amount
   */
  emitDotDamage(entity, effect, damage) {
    const event = new CustomEvent('dot-damage', {
      detail: {
        entity: entity,
        effect: effect,
        damage: damage
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit effect expired event
   * @param {Entity} entity - Entity
   * @param {Object} effect - Expired effect
   */
  onEffectExpired(entity, effect) {
    const event = new CustomEvent('effect-expired', {
      detail: {
        entity: entity,
        effect: effect
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Apply a status effect to an entity
   * @param {Entity} entity - Target entity
   * @param {Object} effectConfig - Effect configuration
   */
  static applyEffect(entity, effectConfig) {
    let statusEffect = entity.getComponent('StatusEffect');

    // Add StatusEffect component if it doesn't exist
    if (!statusEffect) {
      const { StatusEffect } = require('../../components/StatusEffect.js');
      statusEffect = new StatusEffect();
      statusEffect.init({});
      entity.addComponent(statusEffect);
    }

    // Add the effect
    statusEffect.addEffect(effectConfig);

    // Emit event
    const event = new CustomEvent('effect-applied', {
      detail: {
        entity: entity,
        effect: effectConfig
      }
    });
    window.dispatchEvent(event);
  }
}
