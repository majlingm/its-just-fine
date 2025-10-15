/**
 * DamageSystem - Handles damage application and death
 *
 * This system detects damage-causing collisions (player hitting enemies,
 * enemies hitting player) and applies damage to Health components.
 *
 * Responsibilities:
 * - Detect collision-based damage (melee attacks)
 * - Apply damage to Health components
 * - Handle entity death (mark for removal)
 * - Handle invincibility frames (prevent damage spam)
 * - Emit damage/death events
 *
 * Design:
 * - Uses collision layers to determine who can damage who
 * - Player layer vs Enemy layer = damage
 * - Supports invincibility duration after taking damage
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class DamageSystem extends ComponentSystem {
  constructor() {
    // Process entities with Health and Collider components
    super(['Health', 'Collider']);

    // Damage configuration
    this.playerDamage = 50; // Damage player deals to enemies (increased for testing)
    this.enemyDamage = 10; // Damage enemies deal to player

    // Invincibility settings
    this.invincibilityDuration = 0.5; // Seconds of invincibility after taking damage

    // Track invincibility timers
    this.invincibilityTimers = new Map(); // entityId -> remaining time
  }

  /**
   * Process entities with Health and Collider components
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - All entities
   */
  process(dt, entities) {
    // Update invincibility timers
    for (const [entityId, timeRemaining] of this.invincibilityTimers) {
      const newTime = timeRemaining - dt;
      if (newTime <= 0) {
        this.invincibilityTimers.delete(entityId);
      } else {
        this.invincibilityTimers.set(entityId, newTime);
      }
    }

    // Process damage from collisions
    for (const entity of entities) {
      const health = entity.getComponent('Health');
      const collider = entity.getComponent('Collider');

      // Skip if no health, disabled, or dead
      if (!health.enabled || health.current <= 0) continue;
      if (!collider.enabled) continue;

      // Skip if invincible
      if (this.invincibilityTimers.has(entity.id)) continue;

      // Check collisions for damage
      if (collider.isColliding && collider.collidingWith.length > 0) {
        // Check if this is a projectile hitting something
        if (entity.hasTag('projectile')) {
          this.processProjectileDamage(entity, entities);
        } else {
          // Regular collision damage (melee)
          this.processDamageCollisions(entity, entities);
        }
      }
    }

    // Handle death
    for (const entity of entities) {
      const health = entity.getComponent('Health');
      if (health && health.enabled && health.current <= 0 && !health.isDead) {
        this.handleDeath(entity);
      }
    }
  }

  /**
   * Process projectile damage
   * @param {Entity} projectile - Projectile entity
   * @param {Array<Entity>} allEntities - All entities
   */
  processProjectileDamage(projectile, allEntities) {
    const collider = projectile.getComponent('Collider');
    const projectileComp = projectile.getComponent('Projectile');

    if (!projectileComp) return;

    // Check each colliding entity
    for (const otherId of collider.collidingWith) {
      const target = allEntities.find(e => e.id === otherId);
      if (!target) continue;

      // Skip if can't hit this entity
      if (!projectileComp.canHit(target.id)) continue;

      // Skip if target doesn't have health
      const targetHealth = target.getComponent('Health');
      if (!targetHealth || !targetHealth.enabled || targetHealth.current <= 0) continue;

      // Check if target has the right tag (player projectiles hit enemies, vice versa)
      if (projectileComp.ownerTag === 'player' && !target.hasTag('enemy')) continue;
      if (projectileComp.ownerTag === 'enemy' && !target.hasTag('player')) continue;

      // Apply damage
      this.applyDamage(target, targetHealth, projectileComp.damage, projectile);

      // Register hit on projectile
      projectileComp.registerHit(target.id);

      // If explosive, apply area damage
      if (projectileComp.explosive) {
        this.applyExplosiveDamage(projectile, allEntities, projectileComp.damage, projectileComp.explosionRadius);
      }

      // Mark projectile as hit (will be removed by ProjectileSystem)
      if (!projectileComp.piercing) {
        projectileComp.hasHit = true;
      }
    }
  }

  /**
   * Apply explosive area damage
   * @param {Entity} projectile - Projectile that exploded
   * @param {Array<Entity>} allEntities - All entities
   * @param {number} damage - Damage amount
   * @param {number} radius - Explosion radius
   */
  applyExplosiveDamage(projectile, allEntities, damage, radius) {
    const projectileComp = projectile.getComponent('Projectile');
    const transform = projectile.getComponent('Transform');
    if (!transform) return;

    // Find all entities in radius
    for (const entity of allEntities) {
      if (!entity.active) continue;
      if (entity.id === projectile.id) continue;
      if (entity.id === projectileComp.ownerId) continue;

      // Check if entity has health and right tag
      const health = entity.getComponent('Health');
      if (!health || !health.enabled || health.current <= 0) continue;

      // Check tag
      if (projectileComp.ownerTag === 'player' && !entity.hasTag('enemy')) continue;
      if (projectileComp.ownerTag === 'enemy' && !entity.hasTag('player')) continue;

      // Check distance
      const entityTransform = entity.getComponent('Transform');
      if (!entityTransform) continue;

      const dx = entityTransform.x - transform.x;
      const dz = entityTransform.z - transform.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= radius) {
        // Apply reduced damage based on distance
        const falloff = 1 - (distance / radius);
        const explosiveDamage = Math.floor(damage * falloff);
        this.applyDamage(entity, health, explosiveDamage, projectile);
      }
    }
  }

  /**
   * Process damage from collisions
   * @param {Entity} entity - Entity to check
   * @param {Array<Entity>} allEntities - All entities
   */
  processDamageCollisions(entity, allEntities) {
    const collider = entity.getComponent('Collider');
    const health = entity.getComponent('Health');

    const isPlayer = entity.hasTag('player');
    const isEnemy = entity.hasTag('enemy');

    // Determine what this entity can damage
    let canDamage = [];
    if (isPlayer) {
      canDamage = ['enemy'];
    } else if (isEnemy) {
      canDamage = ['player'];
    }

    if (canDamage.length === 0) return;

    // Check each colliding entity
    for (const otherId of collider.collidingWith) {
      const other = allEntities.find(e => e.id === otherId);
      if (!other) continue;

      // Check if we can damage this entity
      let shouldDamage = false;
      for (const tag of canDamage) {
        if (other.hasTag(tag)) {
          shouldDamage = true;
          break;
        }
      }

      if (!shouldDamage) continue;

      // Skip if target is invincible
      if (this.invincibilityTimers.has(other.id)) continue;

      const otherHealth = other.getComponent('Health');
      if (!otherHealth || !otherHealth.enabled || otherHealth.current <= 0) continue;

      // Apply damage
      const damage = isPlayer ? this.playerDamage : this.enemyDamage;
      this.applyDamage(other, otherHealth, damage, entity);
    }
  }

  /**
   * Apply damage to an entity
   * @param {Entity} target - Target entity
   * @param {Health} health - Target's health component
   * @param {number} damage - Damage amount
   * @param {Entity} source - Source of damage (attacker)
   */
  applyDamage(target, health, damage, source) {
    const previousHealth = health.current;
    health.current = Math.max(0, health.current - damage);

    // Add invincibility
    this.invincibilityTimers.set(target.id, this.invincibilityDuration);

    // Emit damage event
    this.emitDamageEvent(target, source, damage);

    // Visual feedback (optional)
    this.applyDamageVisualFeedback(target);
  }

  /**
   * Handle entity death
   * @param {Entity} entity - Entity that died
   */
  handleDeath(entity) {
    const health = entity.getComponent('Health');
    health.isDead = true;

    // Emit death event
    this.emitDeathEvent(entity);

    // Mark entity for removal
    entity.destroy();
  }

  /**
   * Apply visual feedback for damage
   * @param {Entity} entity - Entity that took damage
   */
  applyDamageVisualFeedback(entity) {
    const renderable = entity.getComponent('Renderable');
    if (!renderable) return;

    // Flash red briefly
    const originalColor = renderable.color;
    renderable.color = 0xff0000; // Red

    // Reset color after a short delay
    setTimeout(() => {
      if (renderable.enabled) {
        renderable.color = originalColor;
      }
    }, 100);
  }

  /**
   * Emit damage event
   * @param {Entity} target - Target entity
   * @param {Entity} source - Source entity
   * @param {number} damage - Damage amount
   */
  emitDamageEvent(target, source, damage) {
    const event = new CustomEvent('entity-damaged', {
      detail: {
        target: target,
        source: source,
        damage: damage
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit death event
   * @param {Entity} entity - Entity that died
   */
  emitDeathEvent(entity) {
    const event = new CustomEvent('entity-died', {
      detail: {
        entity: entity
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if entity is invincible
   * @param {Entity} entity
   * @returns {boolean}
   */
  isInvincible(entity) {
    return this.invincibilityTimers.has(entity.id);
  }

  /**
   * Set custom damage values
   * @param {number} playerDamage
   * @param {number} enemyDamage
   */
  setDamageValues(playerDamage, enemyDamage) {
    this.playerDamage = playerDamage;
    this.enemyDamage = enemyDamage;
  }

  /**
   * Set invincibility duration
   * @param {number} duration - Duration in seconds
   */
  setInvincibilityDuration(duration) {
    this.invincibilityDuration = duration;
  }
}
