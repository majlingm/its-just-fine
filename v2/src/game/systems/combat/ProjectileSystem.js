/**
 * ProjectileSystem - Manages projectile lifecycle and behavior
 *
 * Responsibilities:
 * - Update projectile age and check for expiration
 * - Handle homing behavior (seeking targets)
 * - Remove expired or hit projectiles
 * - Apply projectile-specific movement behaviors
 *
 * Works with:
 * - Projectile component (lifetime, behavior)
 * - Movement component (velocity)
 * - Transform component (position)
 * - Collider component (hit detection - handled by CollisionSystem/DamageSystem)
 */

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';

export class ProjectileSystem extends ComponentSystem {
  constructor() {
    // Require Projectile, Movement, and Transform components
    super(['Projectile', 'Movement', 'Transform']);
  }

  /**
   * Process projectiles
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with Projectile + Movement + Transform
   */
  process(dt, entities) {
    // Get all entities for target finding
    const allEntities = this.getAllEntities();

    for (const entity of entities) {
      const projectile = entity.getComponent('Projectile');
      const movement = entity.getComponent('Movement');
      const transform = entity.getComponent('Transform');

      // Update projectile age
      projectile.update(dt);

      // Remove if expired or hit
      if (projectile.isExpired() || projectile.hasHit) {
        entity.destroy();
        continue;
      }

      // Handle homing behavior
      if (projectile.homing) {
        this.updateHoming(projectile, movement, transform, allEntities);
      }
    }
  }

  /**
   * Update homing projectile to seek target
   * @param {Projectile} projectile - Projectile component
   * @param {Movement} movement - Movement component
   * @param {Transform} transform - Transform component
   * @param {Array<Entity>} allEntities - All entities in the game
   */
  updateHoming(projectile, movement, transform, allEntities) {
    // Find target
    let target = null;

    // Try to keep current target if it exists
    if (projectile.targetId) {
      target = allEntities.find(e => e.id === projectile.targetId && e.active);
      // Clear target if no longer valid
      if (!target || !target.hasTag(projectile.targetTag)) {
        projectile.targetId = null;
        target = null;
      }
    }

    // Find new target if needed
    if (!target) {
      target = this.findNearestTarget(transform, allEntities, projectile.targetTag);
      if (target) {
        projectile.targetId = target.id;
      }
    }

    // Apply homing if we have a target
    if (target) {
      const targetTransform = target.getComponent('Transform');
      if (targetTransform) {
        // Calculate direction to target
        const dx = targetTransform.x - transform.x;
        const dz = targetTransform.z - transform.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0) {
          // Desired direction (normalized)
          const desiredDirX = dx / distance;
          const desiredDirZ = dz / distance;

          // Current direction (normalized)
          const currentSpeed = Math.sqrt(movement.velocityX ** 2 + movement.velocityZ ** 2);
          if (currentSpeed > 0) {
            const currentDirX = movement.velocityX / currentSpeed;
            const currentDirZ = movement.velocityZ / currentSpeed;

            // Lerp towards desired direction (homing strength)
            const lerpFactor = Math.min(1, projectile.homingStrength * 0.1);
            const newDirX = currentDirX + (desiredDirX - currentDirX) * lerpFactor;
            const newDirZ = currentDirZ + (desiredDirZ - currentDirZ) * lerpFactor;

            // Normalize and apply speed
            const newLength = Math.sqrt(newDirX ** 2 + newDirZ ** 2);
            if (newLength > 0) {
              movement.velocityX = (newDirX / newLength) * projectile.speed;
              movement.velocityZ = (newDirZ / newLength) * projectile.speed;
            }
          }
        }
      }
    }
  }

  /**
   * Find nearest entity with specified tag
   * @param {Transform} fromTransform - Position to search from
   * @param {Array<Entity>} entities - All entities
   * @param {string} targetTag - Tag to search for
   * @returns {Entity|null} Nearest entity or null
   */
  findNearestTarget(fromTransform, entities, targetTag) {
    let nearestEntity = null;
    let nearestDistance = Infinity;

    for (const entity of entities) {
      if (!entity.active || !entity.hasTag(targetTag)) continue;

      const transform = entity.getComponent('Transform');
      if (!transform) continue;

      const dx = transform.x - fromTransform.x;
      const dz = transform.z - fromTransform.z;
      const distance = dx * dx + dz * dz; // Use squared distance for performance

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEntity = entity;
      }
    }

    return nearestEntity;
  }

  /**
   * Get all entities from the engine
   * Override this in the game to provide access to all entities
   * @returns {Array<Entity>}
   */
  getAllEntities() {
    // This will be set by the game when initializing the system
    return this.allEntities || [];
  }

  /**
   * Set all entities (called by game)
   * @param {Array<Entity>} entities
   */
  setAllEntities(entities) {
    this.allEntities = entities;
  }
}
