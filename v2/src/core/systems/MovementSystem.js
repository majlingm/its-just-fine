/**
 * MovementSystem - Processes entity movement and physics
 *
 * This system handles velocity, acceleration, drag, and position updates
 * for all entities with Transform and Movement components.
 *
 * Responsibilities:
 * - Apply velocity to position
 * - Apply acceleration to velocity
 * - Apply drag/friction
 * - Clamp velocity to maxSpeed
 * - Handle movement flags (canMove, isGrounded)
 *
 * Migration from v1:
 * - Replaces manual position/velocity updates in entity update() methods
 * - Centralizes all movement physics in one system
 */

import { ComponentSystem } from '../ecs/ComponentSystem.js';
import { OptimizationConfig } from '../config/optimization.js';

export class MovementSystem extends ComponentSystem {
  constructor(frustumCuller = null) {
    // Require Transform and Movement components
    super(['Transform', 'Movement']);

    this.frustumCuller = frustumCuller;
  }

  /**
   * Process entities with Transform and Movement components
   * @param {number} dt - Delta time in seconds
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    for (const entity of entities) {
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');

      // Check if entity has required components
      if (!transform || !movement) {
        continue;
      }

      // Frustum culling check (only if applyToMovement is enabled)
      if (OptimizationConfig.frustumCulling.enabled &&
          OptimizationConfig.frustumCulling.applyToMovement &&
          this.frustumCuller) {
        // Check if entity should always update
        const alwaysUpdate = entity.alwaysUpdate ||
          (OptimizationConfig.frustumCulling.alwaysUpdatePlayer && entity.hasTag('player')) ||
          (OptimizationConfig.frustumCulling.alwaysUpdatePickups && entity.hasTag('pickup'));

        if (!alwaysUpdate) {
          // Check if entity is in view frustum
          const boundingRadius = entity.boundingRadius || 1;
          const extraRadius = OptimizationConfig.frustumCulling.updateRadius || 0;

          if (!this.frustumCuller.isInFrustum(transform, boundingRadius, extraRadius)) {
            // Entity is outside frustum, skip update
            continue;
          }
        }
      }

      // Check status effects for movement restrictions
      const statusEffect = entity.getComponent('StatusEffect');

      // Check if entity can move (not stunned/frozen/rooted)
      if (statusEffect && !statusEffect.canMove()) {
        // Stop all movement
        movement.velocityX = 0;
        movement.velocityZ = 0;
        continue;
      }

      // Skip if movement is disabled
      if (!movement.enabled || !movement.canMove) {
        continue;
      }

      // Apply drag/friction
      if (movement.drag > 0 && movement.drag < 1) {
        movement.velocityX *= movement.drag;
        movement.velocityY *= movement.drag;
        movement.velocityZ *= movement.drag;

        // Stop tiny velocities to prevent floating point drift
        if (Math.abs(movement.velocityX) < 0.001) movement.velocityX = 0;
        if (Math.abs(movement.velocityY) < 0.001) movement.velocityY = 0;
        if (Math.abs(movement.velocityZ) < 0.001) movement.velocityZ = 0;
      }

      // Cap speed to maxSpeed
      movement.capSpeed();

      // Apply status effect speed modifiers (slow, haste)
      let speedModifier = 1.0;
      if (statusEffect) {
        speedModifier = statusEffect.getStatModifier('speed');
      }

      // Apply velocity to position (with speed modifier)
      transform.x += movement.velocityX * speedModifier * dt;
      transform.y += movement.velocityY * dt; // Y axis not affected by speed modifiers
      transform.z += movement.velocityZ * speedModifier * dt;

      // Apply gravity if not grounded (optional - can be enabled per entity)
      if (!movement.isGrounded && movement.gravityScale !== undefined && movement.gravityScale > 0) {
        const gravity = -9.8 * movement.gravityScale;
        movement.velocityY += gravity * dt;
      }

      // Keep entities on ground plane if grounded
      if (movement.isGrounded && transform.y < 0) {
        transform.y = 0;
        movement.velocityY = 0;
      }
    }
  }
}
