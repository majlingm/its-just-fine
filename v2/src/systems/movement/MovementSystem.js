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

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class MovementSystem extends ComponentSystem {
  constructor() {
    // Require Transform and Movement components
    super(['Transform', 'Movement']);
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

      // Apply velocity to position
      transform.x += movement.velocityX * dt;
      transform.y += movement.velocityY * dt;
      transform.z += movement.velocityZ * dt;

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
