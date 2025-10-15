/**
 * CollisionSystem - Detects and resolves collisions between entities
 *
 * This system processes entities with Transform and Collider components.
 * It implements efficient collision detection using spatial partitioning
 * and supports multiple collision shapes (sphere, box, capsule).
 *
 * Responsibilities:
 * - Broad-phase collision detection (spatial partitioning)
 * - Narrow-phase collision detection (shape-specific tests)
 * - Collision resolution (separate overlapping entities)
 * - Trigger collision detection (no resolution)
 * - Collision callbacks (onCollisionEnter/Stay/Exit)
 *
 * Architecture:
 * - Uses collision layers for filtering
 * - Spatial grid for broad-phase optimization
 * - Supports static colliders (don't move, optimization)
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';
import { SpatialGrid } from '../../core/spatial/SpatialGrid.js';
import { OptimizationConfig } from '../../config/optimization.js';

export class CollisionSystem extends ComponentSystem {
  constructor() {
    // Require Transform and Collider components
    super(['Transform', 'Collider']);

    // Spatial grid for broad-phase optimization
    this.gridCellSize = OptimizationConfig.spatialPartitioning.cellSize || 10;
    this.spatialGrid = new Map(); // Map of grid cell -> entities in that cell (fallback)
    this.optimizedGrid = new SpatialGrid(this.gridCellSize); // Optimized spatial grid

    // Collision tracking (for enter/exit events)
    this.previousCollisions = new Map(); // entityId -> Set of colliding entity IDs

    // Statistics
    this.stats = {
      totalChecks: 0,
      narrowPhaseChecks: 0,
      collisions: 0
    };
  }

  /**
   * Process entities with Transform and Collider components
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    // Reset statistics
    this.stats.totalChecks = entities.length;
    this.stats.narrowPhaseChecks = 0;
    this.stats.collisions = 0;

    // Use optimized spatial grid if enabled
    const useOptimized = OptimizationConfig.spatialPartitioning.enabled;

    if (useOptimized) {
      // Clear optimized grid
      this.optimizedGrid.clear();

      // Build optimized spatial grid (broad-phase)
      for (const entity of entities) {
        const transform = entity.getComponent('Transform');
        const collider = entity.getComponent('Collider');

        if (!collider.enabled) continue;

        // Insert into optimized grid using center position
        this.optimizedGrid.insert(entity, transform.x, transform.z);
      }
    } else {
      // Clear fallback spatial grid
      this.spatialGrid.clear();

      // Build fallback spatial grid (broad-phase)
      for (const entity of entities) {
        const transform = entity.getComponent('Transform');
        const collider = entity.getComponent('Collider');

        if (!collider.enabled) continue;

        const bounds = collider.getBounds(transform);
        const cells = this.getCellsForBounds(bounds);

        for (const cellKey of cells) {
          if (!this.spatialGrid.has(cellKey)) {
            this.spatialGrid.set(cellKey, []);
          }
          this.spatialGrid.get(cellKey).push(entity);
        }
      }
    }

    // Clear collision state
    for (const entity of entities) {
      const collider = entity.getComponent('Collider');
      if (collider.enabled) {
        collider.isColliding = false;
        collider.collidingWith = [];
      }
    }

    // Detect collisions (narrow-phase)
    const checkedPairs = new Set(); // Avoid duplicate checks

    for (const entity of entities) {
      const collider = entity.getComponent('Collider');
      if (!collider.enabled) continue;

      const transform = entity.getComponent('Transform');

      // Get potential collision candidates from spatial grid
      let candidates;
      if (useOptimized) {
        // Use optimized grid query
        const queryRadius = collider.radius || 2; // Use collider radius or default
        const candidateList = this.optimizedGrid.query(transform.x, transform.z, queryRadius * 2);
        candidates = new Set(candidateList.filter(other => other.id !== entity.id));
      } else {
        // Use fallback grid
        const bounds = collider.getBounds(transform);
        const cells = this.getCellsForBounds(bounds);
        candidates = new Set();
        for (const cellKey of cells) {
          const cellEntities = this.spatialGrid.get(cellKey) || [];
          for (const other of cellEntities) {
            if (other.id !== entity.id) {
              candidates.add(other);
            }
          }
        }
      }

      // Test collisions with candidates
      for (const other of candidates) {
        // Create unique pair key (sorted IDs to avoid duplicates)
        const pairKey = entity.id < other.id
          ? `${entity.id}-${other.id}`
          : `${other.id}-${entity.id}`;

        // Skip if already checked
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const otherCollider = other.getComponent('Collider');
        if (!otherCollider.enabled) continue;

        // Check collision layer filtering
        if (!collider.canCollideWith(otherCollider) &&
            !otherCollider.canCollideWith(collider)) {
          continue;
        }

        const otherTransform = other.getComponent('Transform');

        // Perform collision test
        // Increment narrow-phase check counter
        this.stats.narrowPhaseChecks++;

        const collision = this.testCollision(
          entity, transform, collider,
          other, otherTransform, otherCollider
        );

        if (collision.isColliding) {
          this.stats.collisions++;
          // Mark as colliding
          collider.isColliding = true;
          collider.collidingWith.push(other.id);

          otherCollider.isColliding = true;
          otherCollider.collidingWith.push(entity.id);

          // Resolve collision (if both are solid and not triggers)
          if (!collider.isTrigger && !otherCollider.isTrigger &&
              collider.isSolid && otherCollider.isSolid) {
            this.resolveCollision(
              entity, transform, collider,
              other, otherTransform, otherCollider,
              collision
            );
          }

          // Handle collision events
          this.handleCollisionEvents(entity, other, collider, otherCollider);
        } else {
          // Check if collision ended
          this.handleCollisionExit(entity, other, collider, otherCollider);
        }
      }
    }

    // Update previous collisions for next frame
    const currentCollisions = new Map();
    for (const entity of entities) {
      const collider = entity.getComponent('Collider');
      if (collider.enabled && collider.collidingWith.length > 0) {
        currentCollisions.set(entity.id, new Set(collider.collidingWith));
      }
    }
    this.previousCollisions = currentCollisions;
  }

  /**
   * Get spatial grid cells that overlap with bounds
   * @param {object} bounds - Bounding box
   * @returns {Array<string>} - Array of cell keys
   */
  getCellsForBounds(bounds) {
    const cells = [];
    const cellSize = this.gridCellSize;

    const minCellX = Math.floor(bounds.minX / cellSize);
    const maxCellX = Math.floor(bounds.maxX / cellSize);
    const minCellZ = Math.floor(bounds.minZ / cellSize);
    const maxCellZ = Math.floor(bounds.maxZ / cellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let z = minCellZ; z <= maxCellZ; z++) {
        cells.push(`${x},${z}`);
      }
    }

    return cells;
  }

  /**
   * Test collision between two entities
   * @param {Entity} entityA
   * @param {Transform} transformA
   * @param {Collider} colliderA
   * @param {Entity} entityB
   * @param {Transform} transformB
   * @param {Collider} colliderB
   * @returns {object} - {isColliding, normal, penetration}
   */
  testCollision(entityA, transformA, colliderA, entityB, transformB, colliderB) {
    const posA = colliderA.getWorldPosition(transformA);
    const posB = colliderB.getWorldPosition(transformB);

    // Sphere-Sphere collision (fastest, use when possible)
    if (colliderA.shape === 'sphere' && colliderB.shape === 'sphere') {
      return this.testSphereSphere(posA, colliderA.radius, posB, colliderB.radius);
    }

    // Sphere-Box collision
    if (colliderA.shape === 'sphere' && colliderB.shape === 'box') {
      return this.testSphereBox(posA, colliderA.radius, posB, colliderB.halfExtents);
    }
    if (colliderA.shape === 'box' && colliderB.shape === 'sphere') {
      const result = this.testSphereBox(posB, colliderB.radius, posA, colliderA.halfExtents);
      // Flip normal direction
      if (result.isColliding) {
        result.normal.x *= -1;
        result.normal.y *= -1;
        result.normal.z *= -1;
      }
      return result;
    }

    // Box-Box collision
    if (colliderA.shape === 'box' && colliderB.shape === 'box') {
      return this.testBoxBox(posA, colliderA.halfExtents, posB, colliderB.halfExtents);
    }

    // Capsule collisions (approximate as sphere for now)
    if (colliderA.shape === 'capsule' || colliderB.shape === 'capsule') {
      const radiusA = colliderA.shape === 'capsule' ? colliderA.radius : colliderA.radius;
      const radiusB = colliderB.shape === 'capsule' ? colliderB.radius : colliderB.radius;
      return this.testSphereSphere(posA, radiusA, posB, radiusB);
    }

    // Fallback: treat as spheres
    return this.testSphereSphere(posA, 0.5, posB, 0.5);
  }

  /**
   * Test sphere-sphere collision
   */
  testSphereSphere(posA, radiusA, posB, radiusB) {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const dz = posB.z - posA.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    const radiusSum = radiusA + radiusB;
    const radiusSumSq = radiusSum * radiusSum;

    if (distSq < radiusSumSq) {
      const dist = Math.sqrt(distSq);
      const penetration = radiusSum - dist;

      // Collision normal (from A to B)
      let normalX = dx;
      let normalY = dy;
      let normalZ = dz;

      if (dist > 0.0001) {
        normalX /= dist;
        normalY /= dist;
        normalZ /= dist;
      } else {
        // Objects at same position, use arbitrary normal
        normalX = 1;
        normalY = 0;
        normalZ = 0;
      }

      return {
        isColliding: true,
        normal: { x: normalX, y: normalY, z: normalZ },
        penetration: penetration
      };
    }

    return { isColliding: false };
  }

  /**
   * Test sphere-box collision
   */
  testSphereBox(spherePos, sphereRadius, boxPos, boxHalfExtents) {
    // Find closest point on box to sphere
    const closestX = Math.max(
      boxPos.x - boxHalfExtents.x,
      Math.min(spherePos.x, boxPos.x + boxHalfExtents.x)
    );
    const closestY = Math.max(
      boxPos.y - boxHalfExtents.y,
      Math.min(spherePos.y, boxPos.y + boxHalfExtents.y)
    );
    const closestZ = Math.max(
      boxPos.z - boxHalfExtents.z,
      Math.min(spherePos.z, boxPos.z + boxHalfExtents.z)
    );

    // Check distance to closest point
    const dx = spherePos.x - closestX;
    const dy = spherePos.y - closestY;
    const dz = spherePos.z - closestZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < sphereRadius * sphereRadius) {
      const dist = Math.sqrt(distSq);
      const penetration = sphereRadius - dist;

      let normalX = dx;
      let normalY = dy;
      let normalZ = dz;

      if (dist > 0.0001) {
        normalX /= dist;
        normalY /= dist;
        normalZ /= dist;
      } else {
        normalX = 1;
        normalY = 0;
        normalZ = 0;
      }

      return {
        isColliding: true,
        normal: { x: normalX, y: normalY, z: normalZ },
        penetration: penetration
      };
    }

    return { isColliding: false };
  }

  /**
   * Test box-box collision (AABB)
   */
  testBoxBox(posA, halfExtentsA, posB, halfExtentsB) {
    const overlapX =
      (posA.x + halfExtentsA.x) > (posB.x - halfExtentsB.x) &&
      (posA.x - halfExtentsA.x) < (posB.x + halfExtentsB.x);

    const overlapY =
      (posA.y + halfExtentsA.y) > (posB.y - halfExtentsB.y) &&
      (posA.y - halfExtentsA.y) < (posB.y + halfExtentsB.y);

    const overlapZ =
      (posA.z + halfExtentsA.z) > (posB.z - halfExtentsB.z) &&
      (posA.z - halfExtentsA.z) < (posB.z + halfExtentsB.z);

    if (overlapX && overlapY && overlapZ) {
      // Calculate penetration depths on each axis
      const penetrationX = Math.min(
        (posA.x + halfExtentsA.x) - (posB.x - halfExtentsB.x),
        (posB.x + halfExtentsB.x) - (posA.x - halfExtentsA.x)
      );
      const penetrationY = Math.min(
        (posA.y + halfExtentsA.y) - (posB.y - halfExtentsB.y),
        (posB.y + halfExtentsB.y) - (posA.y - halfExtentsA.y)
      );
      const penetrationZ = Math.min(
        (posA.z + halfExtentsA.z) - (posB.z - halfExtentsB.z),
        (posB.z + halfExtentsB.z) - (posA.z - halfExtentsA.z)
      );

      // Use axis with smallest penetration
      let normal = { x: 0, y: 0, z: 0 };
      let penetration = 0;

      if (penetrationX < penetrationY && penetrationX < penetrationZ) {
        penetration = penetrationX;
        normal.x = (posB.x > posA.x) ? 1 : -1;
      } else if (penetrationY < penetrationZ) {
        penetration = penetrationY;
        normal.y = (posB.y > posA.y) ? 1 : -1;
      } else {
        penetration = penetrationZ;
        normal.z = (posB.z > posA.z) ? 1 : -1;
      }

      return {
        isColliding: true,
        normal: normal,
        penetration: penetration
      };
    }

    return { isColliding: false };
  }

  /**
   * Resolve collision by separating entities with bounce
   */
  resolveCollision(entityA, transformA, colliderA, entityB, transformB, colliderB, collision) {
    // Don't resolve if either is static
    if (colliderA.isStatic && colliderB.isStatic) return;

    const { normal, penetration } = collision;

    // Determine axis mask based on collision resolution mode
    // Use the most restrictive mode between the two colliders
    const axisMask = this.getCollisionAxisMask(colliderA, colliderB);

    const separationX = axisMask.x ? (normal.x * penetration) : 0;
    const separationY = axisMask.y ? (normal.y * penetration) : 0;
    const separationZ = axisMask.z ? (normal.z * penetration) : 0;

    // Apply separation based on mass
    const massA = colliderA.mass || 1.0;
    const massB = colliderB.mass || 1.0;
    const totalMass = massA + massB;

    if (colliderA.isStatic) {
      // Only move B
      transformB.x += separationX;
      transformB.y += separationY;
      transformB.z += separationZ;
    } else if (colliderB.isStatic) {
      // Only move A
      transformA.x -= separationX;
      transformA.y -= separationY;
      transformA.z -= separationZ;
    } else {
      // Split based on mass (lighter entity moves more)
      const ratioA = massB / totalMass;
      const ratioB = massA / totalMass;

      transformA.x -= separationX * ratioA;
      transformA.y -= separationY * ratioA;
      transformA.z -= separationZ * ratioA;

      transformB.x += separationX * ratioB;
      transformB.y += separationY * ratioB;
      transformB.z += separationZ * ratioB;
    }

    // 2. Apply bounce (velocity reflection)
    const movementA = entityA.getComponent('Movement');
    const movementB = entityB.getComponent('Movement');

    if (movementA && movementB && !colliderA.isStatic && !colliderB.isStatic) {
      // Calculate relative velocity
      const relVelX = movementB.velocityX - movementA.velocityX;
      const relVelY = movementB.velocityY - movementA.velocityY;
      const relVelZ = movementB.velocityZ - movementA.velocityZ;

      // Velocity along collision normal
      const velAlongNormal = relVelX * normal.x + relVelY * normal.y + relVelZ * normal.z;

      // Don't resolve if objects are separating
      if (velAlongNormal > 0) return;

      // Calculate bounce (use minimum bounciness)
      const bounciness = Math.min(colliderA.bounciness, colliderB.bounciness);
      const impulse = -(1 + bounciness) * velAlongNormal / totalMass;

      // Apply impulse based on axis mask
      const impulseX = axisMask.x ? (impulse * normal.x) : 0;
      const impulseY = axisMask.y ? (impulse * normal.y) : 0;
      const impulseZ = axisMask.z ? (impulse * normal.z) : 0;

      movementA.velocityX -= impulseX * massB;
      movementA.velocityY -= impulseY * massB;
      movementA.velocityZ -= impulseZ * massB;

      movementB.velocityX += impulseX * massA;
      movementB.velocityY += impulseY * massA;
      movementB.velocityZ += impulseZ * massA;
    }
  }

  /**
   * Get collision axis mask for two colliders
   * Uses the most restrictive mode between the two colliders
   * @param {Collider} colliderA
   * @param {Collider} colliderB
   * @returns {object} - {x: boolean, y: boolean, z: boolean}
   */
  getCollisionAxisMask(colliderA, colliderB) {
    // Determine which mode to use (use the most restrictive)
    const modeA = colliderA.collisionResolutionMode || 'horizontal';
    const modeB = colliderB.collisionResolutionMode || 'horizontal';

    // If either is custom, use custom and combine masks
    if (modeA === 'custom' || modeB === 'custom') {
      const maskA = modeA === 'custom' ? colliderA.axisMask : this.getModeAxisMask(modeA);
      const maskB = modeB === 'custom' ? colliderB.axisMask : this.getModeAxisMask(modeB);

      // Use AND logic - only resolve on axes where both allow it
      return {
        x: maskA.x && maskB.x,
        y: maskA.y && maskB.y,
        z: maskA.z && maskB.z
      };
    }

    // If both are same mode, use that
    if (modeA === modeB) {
      return this.getModeAxisMask(modeA);
    }

    // Different modes - use the more restrictive (horizontal over full3d)
    if (modeA === 'horizontal' || modeB === 'horizontal') {
      return this.getModeAxisMask('horizontal');
    }

    // Default to full3d
    return this.getModeAxisMask('full3d');
  }

  /**
   * Get axis mask for a collision resolution mode
   * @param {string} mode
   * @returns {object} - {x: boolean, y: boolean, z: boolean}
   */
  getModeAxisMask(mode) {
    switch (mode) {
      case 'horizontal':
        return { x: true, y: false, z: true };
      case 'full3d':
        return { x: true, y: true, z: true };
      default:
        return { x: true, y: false, z: true }; // Default to horizontal
    }
  }

  /**
   * Handle collision enter/stay events
   */
  handleCollisionEvents(entityA, entityB, colliderA, colliderB) {
    const prevA = this.previousCollisions.get(entityA.id);
    const prevB = this.previousCollisions.get(entityB.id);

    // Check if this is a new collision (enter) or continuing (stay)
    const isNewForA = !prevA || !prevA.has(entityB.id);
    const isNewForB = !prevB || !prevB.has(entityA.id);

    if (isNewForA && colliderA.onCollisionEnter) {
      colliderA.onCollisionEnter(entityA, entityB);
    } else if (!isNewForA && colliderA.onCollisionStay) {
      colliderA.onCollisionStay(entityA, entityB);
    }

    if (isNewForB && colliderB.onCollisionEnter) {
      colliderB.onCollisionEnter(entityB, entityA);
    } else if (!isNewForB && colliderB.onCollisionStay) {
      colliderB.onCollisionStay(entityB, entityA);
    }
  }

  /**
   * Handle collision exit events
   */
  handleCollisionExit(entityA, entityB, colliderA, colliderB) {
    const prevA = this.previousCollisions.get(entityA.id);
    const prevB = this.previousCollisions.get(entityB.id);

    // Check if collision ended
    if (prevA && prevA.has(entityB.id)) {
      if (colliderA.onCollisionExit) {
        colliderA.onCollisionExit(entityA, entityB);
      }
    }

    if (prevB && prevB.has(entityA.id)) {
      if (colliderB.onCollisionExit) {
        colliderB.onCollisionExit(entityB, entityA);
      }
    }
  }

  /**
   * Get collision system statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const gridStats = OptimizationConfig.spatialPartitioning.enabled ?
      this.optimizedGrid.getStats() : null;

    // Calculate efficiency
    const maxPossibleChecks = (this.stats.totalChecks * (this.stats.totalChecks - 1)) / 2;
    const efficiency = maxPossibleChecks > 0 ?
      ((maxPossibleChecks - this.stats.narrowPhaseChecks) / maxPossibleChecks * 100).toFixed(1) : 0;

    return {
      totalEntities: this.stats.totalChecks,
      narrowPhaseChecks: this.stats.narrowPhaseChecks,
      maxPossibleChecks: maxPossibleChecks,
      collisions: this.stats.collisions,
      efficiency: `${efficiency}%`,
      spatialGridEnabled: OptimizationConfig.spatialPartitioning.enabled,
      gridStats: gridStats
    };
  }
}
