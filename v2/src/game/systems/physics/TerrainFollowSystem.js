/**
 * TerrainFollowSystem - Makes entities follow terrain height and handle terrain collisions
 *
 * Responsibilities:
 * - Update entity Y position to match terrain height
 * - Handle collision with trees and rocks
 */

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';
import * as THREE from 'three';

export class TerrainFollowSystem extends ComponentSystem {
  constructor(environmentSystem) {
    super(['Transform', 'Movement']);
    this.environmentSystem = environmentSystem;

    // Cached raycaster to avoid creating new ones every frame
    this.raycaster = new THREE.Raycaster();
    this.rayOrigin = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3(0, -1, 0);

    // Cache last positions to avoid raycasting when not moving
    this.lastPositions = new Map(); // entityId -> {x, z, y}
  }

  /**
   * Process entities
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    // Only process if procedural terrain is enabled
    if (!this.environmentSystem.useProceduralTerrain) {
      return;
    }

    for (const entity of entities) {
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');

      if (!transform) continue;

      // Update height to match terrain using cached heightmap (super fast!)
      const terrainHeight = this.environmentSystem.getTerrainHeight(transform.x, transform.z);
      transform.y = terrainHeight;

      // Handle terrain object collisions (trees, rocks)
      if (movement) {
        this.handleTerrainCollisions(entity, transform, movement);
      }
    }
  }

  /**
   * Handle collision with terrain objects (trees, rocks)
   */
  handleTerrainCollisions(entity, transform, movement) {
    const colliders = this.environmentSystem.getTerrainColliders();
    if (!colliders || colliders.length === 0) return;

    // Entity radius (approximate)
    const entityRadius = 0.75;

    for (const collider of colliders) {
      // Calculate distance to collider
      const dx = transform.x - collider.x;
      const dz = transform.z - collider.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const minDistance = entityRadius + collider.radius;

      // If overlapping, push entity away
      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const angle = Math.atan2(dz, dx);

        // Push entity away from collider
        transform.x += Math.cos(angle) * overlap;
        transform.z += Math.sin(angle) * overlap;

        // Stop velocity in collision direction
        const velAngle = Math.atan2(movement.velocityZ, movement.velocityX);
        const angleDiff = Math.abs(velAngle - (angle + Math.PI));

        if (angleDiff < Math.PI / 2) {
          // Collision is in direction of movement, stop
          movement.velocityX *= 0.5;
          movement.velocityZ *= 0.5;
        }
      }
    }
  }
}
