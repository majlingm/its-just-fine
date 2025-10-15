/**
 * AISystem - Processes AI behaviors for entities
 *
 * This system handles AI logic for entities with AI components.
 * It implements behaviors like chasing the player, patrolling, fleeing, etc.
 *
 * Responsibilities:
 * - Find player entity for targeting
 * - Calculate movement direction based on AI behavior type
 * - Update entity velocity and rotation to follow AI logic
 * - Check aggro range for chase behaviors
 *
 * Migration from v1:
 * - Replaces Enemy.updateAI() methods
 * - Uses ECS components instead of class methods
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class AISystem extends ComponentSystem {
  constructor() {
    // Require Transform, Movement, and AI components
    super(['Transform', 'Movement', 'AI']);

    // Cache player entity for performance
    this.playerEntity = null;
  }

  /**
   * Override update to get ALL entities (not just filtered ones)
   * We need access to all entities to find the player
   * @param {number} dt - Delta time
   * @param {Array<Entity>} allEntities - All entities in the game
   */
  update(dt, allEntities) {
    // Find player entity first (from all entities)
    if (!this.playerEntity) {
      this.playerEntity = allEntities.find(e => e.hasTag('player'));
      if (!this.playerEntity) {
        console.warn('AISystem: No player entity found');
        return;
      }
      console.log(`AISystem: Found player entity ${this.playerEntity.id}`);
    }

    // Now filter to only AI entities and process them
    const aiEntities = this.getMatchingEntities(allEntities);
    this.process(dt, aiEntities);
  }

  /**
   * Process entities with AI components
   * @param {number} dt - Delta time in seconds
   * @param {Array<Entity>} entities - AI entities to process
   */
  process(dt, entities) {
    const playerTransform = this.playerEntity.getComponent('Transform');
    if (!playerTransform) {
      console.warn('AISystem: Player has no Transform component');
      return;
    }

    // Process each AI entity
    for (const entity of entities) {
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');
      const ai = entity.getComponent('AI');

      // Skip if AI is disabled
      if (!ai.enabled) {
        continue;
      }

      // Process behavior based on AI type
      switch (ai.behavior) {
        case 'chase_player':
          this.processChasePlayer(entity, transform, movement, ai, playerTransform);
          break;

        case 'patrol':
          this.processPatrol(entity, transform, movement, ai, dt);
          break;

        case 'flee_player':
          this.processFleePlayer(entity, transform, movement, ai, playerTransform);
          break;

        case 'stationary':
          // Stationary enemies don't move
          movement.velocityX = 0;
          movement.velocityZ = 0;
          break;

        // TODO: Implement advanced behaviors
        case 'swarm':
        case 'teleport':
        case 'ranged':
        case 'charge':
        case 'evade':
        case 'tank':
        case 'pack_hunter':
        case 'chain_attack':
          // Fallback to chase_player for unimplemented behaviors
          this.processChasePlayer(entity, transform, movement, ai, playerTransform);
          break;

        default:
          console.warn(`Unknown AI behavior: ${ai.behavior} - using chase_player as fallback`);
          this.processChasePlayer(entity, transform, movement, ai, playerTransform);
      }
    }
  }

  /**
   * Chase player behavior
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   */
  processChasePlayer(entity, transform, movement, ai, playerTransform) {
    // Calculate distance to player
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if player is in aggro range
    if (distance > ai.aggroRange) {
      // Player out of range, stop moving
      movement.velocityX = 0;
      movement.velocityZ = 0;
      return;
    }

    // Normalize direction to player
    const dirX = dx / distance;
    const dirZ = dz / distance;

    // Set velocity toward player (use movement.speed)
    movement.velocityX = dirX * movement.speed;
    movement.velocityZ = dirZ * movement.speed;

    // Update rotation to face player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Flee from player behavior
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   */
  processFleePlayer(entity, transform, movement, ai, playerTransform) {
    // Calculate distance to player
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if player is in aggro range
    if (distance > ai.aggroRange) {
      // Player out of range, stop moving
      movement.velocityX = 0;
      movement.velocityZ = 0;
      return;
    }

    // Normalize direction away from player
    const dirX = -dx / distance;
    const dirZ = -dz / distance;

    // Set velocity away from player (use movement.speed)
    movement.velocityX = dirX * movement.speed;
    movement.velocityZ = dirZ * movement.speed;

    // Update rotation to face away from player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Patrol behavior
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {number} dt - Delta time
   */
  processPatrol(entity, transform, movement, ai, dt) {
    // Initialize patrol state if needed
    if (!ai.patrolState) {
      ai.patrolState = {
        currentPoint: 0,
        waitTimer: 0
      };
    }

    // If no patrol points defined, use random walk
    if (!ai.patrolPoints || ai.patrolPoints.length === 0) {
      this.processRandomWalk(entity, transform, movement, ai, dt);
      return;
    }

    const state = ai.patrolState;
    const targetPoint = ai.patrolPoints[state.currentPoint];

    // Calculate distance to target point
    const dx = targetPoint.x - transform.x;
    const dz = targetPoint.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if reached patrol point
    if (distance < 1.0) {
      // Stop at patrol point
      movement.velocityX = 0;
      movement.velocityZ = 0;

      // Wait at patrol point
      state.waitTimer += dt;
      if (state.waitTimer >= (ai.patrolWaitTime || 2.0)) {
        // Move to next patrol point
        state.currentPoint = (state.currentPoint + 1) % ai.patrolPoints.length;
        state.waitTimer = 0;
      }
      return;
    }

    // Move toward patrol point
    const dirX = dx / distance;
    const dirZ = dz / distance;

    movement.velocityX = dirX * movement.speed;
    movement.velocityZ = dirZ * movement.speed;

    // Update rotation
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Random walk behavior (used when no patrol points defined)
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {number} dt - Delta time
   */
  processRandomWalk(entity, transform, movement, ai, dt) {
    // Initialize random walk state
    if (!ai.randomWalkState) {
      ai.randomWalkState = {
        directionX: Math.random() * 2 - 1,
        directionZ: Math.random() * 2 - 1,
        changeTimer: 0,
        changeInterval: 2.0 + Math.random() * 3.0 // 2-5 seconds
      };

      // Normalize direction
      const mag = Math.sqrt(
        ai.randomWalkState.directionX * ai.randomWalkState.directionX +
        ai.randomWalkState.directionZ * ai.randomWalkState.directionZ
      );
      ai.randomWalkState.directionX /= mag;
      ai.randomWalkState.directionZ /= mag;
    }

    const state = ai.randomWalkState;

    // Update change timer
    state.changeTimer += dt;

    // Change direction periodically
    if (state.changeTimer >= state.changeInterval) {
      state.directionX = Math.random() * 2 - 1;
      state.directionZ = Math.random() * 2 - 1;

      // Normalize
      const mag = Math.sqrt(
        state.directionX * state.directionX +
        state.directionZ * state.directionZ
      );
      state.directionX /= mag;
      state.directionZ /= mag;

      state.changeTimer = 0;
      state.changeInterval = 2.0 + Math.random() * 3.0;
    }

    // Apply movement
    movement.velocityX = state.directionX * movement.speed * 0.5; // Half speed for wandering
    movement.velocityZ = state.directionZ * movement.speed * 0.5;

    // Update rotation
    transform.rotationY = Math.atan2(state.directionX, state.directionZ);
  }

  /**
   * Reset player cache (call when player entity changes)
   */
  resetPlayerCache() {
    this.playerEntity = null;
  }
}
