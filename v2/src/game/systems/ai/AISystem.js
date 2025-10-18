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

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';
import { OptimizationConfig } from '../../../core/config/optimization.js';

export class AISystem extends ComponentSystem {
  constructor(frustumCuller = null) {
    // Require Transform, Movement, and AI components
    super(['Transform', 'Movement', 'AI']);

    // Cache player entity for performance
    this.playerEntity = null;

    // Frustum culler for visibility checks
    this.frustumCuller = frustumCuller;

    // Distance-based update timers (per entity)
    this.updateTimers = new Map(); // entityId -> timer

    // Statistics
    this.stats = {
      totalEntities: 0,
      frustumCulled: 0,
      throttled: 0,
      updated: 0
    };
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
      // console.log(`AISystem: Found player entity ${this.playerEntity.id}`);
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

    // Reset frame stats
    this.stats.totalEntities = entities.length;
    this.stats.frustumCulled = 0;
    this.stats.throttled = 0;
    this.stats.updated = 0;

    // Process each AI entity
    for (const entity of entities) {
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');
      const ai = entity.getComponent('AI');

      // Skip if AI is disabled
      if (!ai.enabled) {
        continue;
      }

      // Frustum culling check (only if applyToAI is enabled)
      if (OptimizationConfig.frustumCulling.enabled &&
          OptimizationConfig.frustumCulling.applyToAI &&
          this.frustumCuller) {
        const boundingRadius = entity.boundingRadius || 1;
        const extraRadius = OptimizationConfig.frustumCulling.updateRadius || 0;

        if (!this.frustumCuller.isInFrustum(transform, boundingRadius, extraRadius)) {
          // Entity is outside frustum, skip AI update
          this.stats.frustumCulled++;
          continue;
        }
      }

      // Distance-based update throttling
      if (OptimizationConfig.distanceUpdates.enabled && OptimizationConfig.distanceUpdates.applyToAI) {
        // Calculate distance to player
        const dx = playerTransform.x - transform.x;
        const dz = playerTransform.z - transform.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Determine update interval based on distance
        let updateInterval = 0; // 0 = every frame
        if (distance >= OptimizationConfig.distanceUpdates.farDistance) {
          updateInterval = 1.0 / OptimizationConfig.distanceUpdates.farFPS;
        } else if (distance >= OptimizationConfig.distanceUpdates.mediumDistance) {
          updateInterval = 1.0 / OptimizationConfig.distanceUpdates.mediumFPS;
        } else if (distance >= OptimizationConfig.distanceUpdates.closeDistance) {
          updateInterval = 1.0 / OptimizationConfig.distanceUpdates.closeFPS;
        }
        // else: close enough for full-rate updates (updateInterval = 0)

        // Check if enough time has passed
        if (updateInterval > 0) {
          const timer = this.updateTimers.get(entity.id) || 0;
          const newTimer = timer + dt;

          if (newTimer < updateInterval) {
            // Not time to update yet
            this.updateTimers.set(entity.id, newTimer);
            this.stats.throttled++;
            continue;
          }

          // Time to update, reset timer
          this.updateTimers.set(entity.id, 0);
        }
      }

      // Entity passed all checks, update AI
      this.stats.updated++;
      this.processAIBehavior(entity, transform, movement, ai, playerTransform, dt);
    }
  }

  /**
   * Process AI behavior for an entity
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processAIBehavior(entity, transform, movement, ai, playerTransform, dt) {

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

        case 'swarm':
          this.processSwarm(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'teleport':
          this.processTeleport(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'ranged':
          this.processRanged(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'charge':
          this.processCharge(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'evade':
          this.processEvade(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'tank':
          this.processTank(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'pack_hunter':
          this.processPackHunter(entity, transform, movement, ai, playerTransform, dt);
          break;

        case 'chain_attack':
          this.processChainAttack(entity, transform, movement, ai, playerTransform, dt);
          break;

        default:
          console.warn(`Unknown AI behavior: ${ai.behavior} - using chase_player as fallback`);
          this.processChasePlayer(entity, transform, movement, ai, playerTransform);
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
   * Swarm behavior - Fast, aggressive, groups up with allies
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processSwarm(entity, transform, movement, ai, playerTransform, dt) {
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
    let dirX = dx / distance;
    let dirZ = dz / distance;

    // Swarm behavior: Move faster and more directly than chase_player
    // Use 1.5x speed multiplier for aggressive swarming
    movement.velocityX = dirX * movement.speed * 1.5;
    movement.velocityZ = dirZ * movement.speed * 1.5;

    // Update rotation to face player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Teleport behavior - Periodically teleport near player
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processTeleport(entity, transform, movement, ai, playerTransform, dt) {
    // Initialize teleport state if needed
    if (!ai.teleportState) {
      ai.teleportState = {
        cooldownTimer: 0,
        teleporting: false
      };
    }

    const state = ai.teleportState;
    const teleportCooldown = ai.teleportCooldown || 5.0;
    const teleportRange = ai.teleportRange || 10;

    // Update cooldown timer
    state.cooldownTimer += dt;

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

    // Check if ready to teleport
    if (state.cooldownTimer >= teleportCooldown && distance > 3) {
      // Teleport near player (within teleportRange)
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * (teleportRange - 3);

      transform.x = playerTransform.x + Math.cos(angle) * dist;
      transform.z = playerTransform.z + Math.sin(angle) * dist;

      // Reset cooldown
      state.cooldownTimer = 0;

      // TODO: Trigger teleport particle effect
      // console.log(`Entity ${entity.id} teleported to player`);
    } else {
      // Chase player when not teleporting
      const dirX = dx / distance;
      const dirZ = dz / distance;

      movement.velocityX = dirX * movement.speed;
      movement.velocityZ = dirZ * movement.speed;

      transform.rotationY = Math.atan2(dirX, dirZ);
    }
  }

  /**
   * Ranged behavior - Keep distance from player and attack from range
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processRanged(entity, transform, movement, ai, playerTransform, dt) {
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

    const attackRange = ai.attackRange || 10;
    const optimalRange = attackRange * 0.8; // Stay at 80% of max attack range
    const minRange = attackRange * 0.5; // Don't get closer than 50% of attack range

    let dirX = dx / distance;
    let dirZ = dz / distance;

    // Face player
    transform.rotationY = Math.atan2(dirX, dirZ);

    // Movement logic based on distance
    if (distance < minRange) {
      // Too close, back away
      movement.velocityX = -dirX * movement.speed;
      movement.velocityZ = -dirZ * movement.speed;
    } else if (distance > optimalRange) {
      // Too far, move closer (but slowly)
      movement.velocityX = dirX * movement.speed * 0.5;
      movement.velocityZ = dirZ * movement.speed * 0.5;
    } else {
      // In optimal range, strafe
      const strafeDir = Math.random() > 0.5 ? 1 : -1;
      movement.velocityX = -dirZ * movement.speed * 0.6 * strafeDir;
      movement.velocityZ = dirX * movement.speed * 0.6 * strafeDir;
    }

    // TODO: Weapon system will handle actual ranged attacks
  }

  /**
   * Charge behavior - Periodic high-speed charges at player
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processCharge(entity, transform, movement, ai, playerTransform, dt) {
    // Initialize charge state if needed
    if (!ai.chargeState) {
      ai.chargeState = {
        cooldownTimer: 0,
        chargeDuration: 0,
        chargeDirection: { x: 0, z: 0 },
        isCharging: false
      };
    }

    const state = ai.chargeState;
    const chargeCooldown = ai.chargeCooldown || 5.0;
    const chargeSpeed = ai.chargeSpeed || 12;
    const chargeDurationMax = 1.0; // 1 second charge

    // Calculate distance to player
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if player is in aggro range
    if (distance > ai.aggroRange) {
      // Player out of range, stop moving
      movement.velocityX = 0;
      movement.velocityZ = 0;
      state.isCharging = false;
      return;
    }

    if (state.isCharging) {
      // Continue charging
      state.chargeDuration += dt;

      if (state.chargeDuration >= chargeDurationMax) {
        // End charge
        state.isCharging = false;
        state.cooldownTimer = 0;
        state.chargeDuration = 0;
      } else {
        // Maintain charge velocity
        movement.velocityX = state.chargeDirection.x * chargeSpeed;
        movement.velocityZ = state.chargeDirection.z * chargeSpeed;
      }
    } else {
      // Update cooldown
      state.cooldownTimer += dt;

      // Check if ready to charge
      if (state.cooldownTimer >= chargeCooldown && distance > 3 && distance < ai.aggroRange * 0.7) {
        // Start charge
        state.isCharging = true;
        state.chargeDuration = 0;

        // Set charge direction toward player
        state.chargeDirection.x = dx / distance;
        state.chargeDirection.z = dz / distance;

        // Face charge direction
        transform.rotationY = Math.atan2(state.chargeDirection.x, state.chargeDirection.z);

        // console.log(`Entity ${entity.id} charging at player`);
      } else {
        // Normal chase behavior when not charging
        const dirX = dx / distance;
        const dirZ = dz / distance;

        movement.velocityX = dirX * movement.speed;
        movement.velocityZ = dirZ * movement.speed;

        transform.rotationY = Math.atan2(dirX, dirZ);
      }
    }
  }

  /**
   * Evade behavior - Dodge attacks with chance-based evasion
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processEvade(entity, transform, movement, ai, playerTransform, dt) {
    // Initialize evade state if needed
    if (!ai.evadeState) {
      ai.evadeState = {
        evadeTimer: 0,
        evadeDuration: 0,
        evadeDirection: { x: 0, z: 0 },
        isEvading: false
      };
    }

    const state = ai.evadeState;
    const evadeDurationMax = 0.3; // 0.3 second dodge

    // Calculate distance to player
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if player is in aggro range
    if (distance > ai.aggroRange) {
      // Player out of range, stop moving
      movement.velocityX = 0;
      movement.velocityZ = 0;
      state.isEvading = false;
      return;
    }

    if (state.isEvading) {
      // Continue evading
      state.evadeDuration += dt;

      if (state.evadeDuration >= evadeDurationMax) {
        // End evade
        state.isEvading = false;
        state.evadeDuration = 0;
        state.evadeTimer = 0;
      } else {
        // Maintain evade velocity (fast dodge)
        movement.velocityX = state.evadeDirection.x * movement.speed * 2;
        movement.velocityZ = state.evadeDirection.z * movement.speed * 2;
      }
    } else {
      // Update evade timer
      state.evadeTimer += dt;

      // Random chance to evade (check every 0.5 seconds when close to player)
      const evadeChance = ai.evadeChance || 0.3;
      if (state.evadeTimer >= 0.5 && distance < 8 && Math.random() < evadeChance) {
        // Start evade
        state.isEvading = true;
        state.evadeDuration = 0;

        // Pick random perpendicular direction
        const dirX = dx / distance;
        const dirZ = dz / distance;
        const perpendicular = Math.random() > 0.5 ? 1 : -1;

        state.evadeDirection.x = -dirZ * perpendicular;
        state.evadeDirection.z = dirX * perpendicular;

        // console.log(`Entity ${entity.id} evading`);
      } else {
        // Normal chase behavior when not evading
        const dirX = dx / distance;
        const dirZ = dz / distance;

        movement.velocityX = dirX * movement.speed;
        movement.velocityZ = dirZ * movement.speed;

        transform.rotationY = Math.atan2(dirX, dirZ);
      }
    }
  }

  /**
   * Tank behavior - Slow but steady, damage reduction handled in damage system
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processTank(entity, transform, movement, ai, playerTransform, dt) {
    // Tank behavior is mostly handled by high HP and armor in damage system
    // Movement is just slower chase behavior

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

    // Move slower (70% speed for tanky movement)
    movement.velocityX = dirX * movement.speed * 0.7;
    movement.velocityZ = dirZ * movement.speed * 0.7;

    // Update rotation to face player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Pack hunter behavior - Gets bonus when near allies, tries to group up
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processPackHunter(entity, transform, movement, ai, playerTransform, dt) {
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

    // Base direction toward player
    let dirX = dx / distance;
    let dirZ = dz / distance;

    // TODO: Check for nearby allies and adjust direction slightly to group up
    // For now, just chase player with slight speed boost when conceptually near allies
    // (Full pack detection would require access to all entities)

    // Set velocity toward player
    movement.velocityX = dirX * movement.speed * 1.2; // Slightly faster
    movement.velocityZ = dirZ * movement.speed * 1.2;

    // Update rotation to face player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Chain attack behavior - Attacks chain to nearby enemies
   * @param {Entity} entity - AI entity
   * @param {Transform} transform - Entity transform
   * @param {Movement} movement - Entity movement
   * @param {AI} ai - Entity AI component
   * @param {Transform} playerTransform - Player transform
   * @param {number} dt - Delta time
   */
  processChainAttack(entity, transform, movement, ai, playerTransform, dt) {
    // Chain attack logic is mostly handled in combat system
    // Movement is standard chase behavior

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

    // Standard chase movement
    movement.velocityX = dirX * movement.speed;
    movement.velocityZ = dirZ * movement.speed;

    // Update rotation to face player
    transform.rotationY = Math.atan2(dirX, dirZ);
  }

  /**
   * Reset player cache (call when player entity changes)
   */
  resetPlayerCache() {
    this.playerEntity = null;
  }

  /**
   * Get AI system statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const cullRate = this.stats.totalEntities > 0 ?
      (this.stats.frustumCulled / this.stats.totalEntities * 100).toFixed(1) : 0;
    const throttleRate = this.stats.totalEntities > 0 ?
      (this.stats.throttled / this.stats.totalEntities * 100).toFixed(1) : 0;
    const updateRate = this.stats.totalEntities > 0 ?
      (this.stats.updated / this.stats.totalEntities * 100).toFixed(1) : 0;

    return {
      totalEntities: this.stats.totalEntities,
      frustumCulled: this.stats.frustumCulled,
      throttled: this.stats.throttled,
      updated: this.stats.updated,
      cullRate: `${cullRate}%`,
      throttleRate: `${throttleRate}%`,
      updateRate: `${updateRate}%`
    };
  }
}
