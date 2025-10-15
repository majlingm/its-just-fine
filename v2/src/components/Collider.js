import { Component } from '../core/ecs/Component.js';

/**
 * Collider Component
 * Defines collision geometry and behavior for an entity
 *
 * Supports multiple collision shapes:
 * - sphere: Simple radius-based collision (fastest, good for most entities)
 * - box: AABB (Axis-Aligned Bounding Box) collision
 * - capsule: Good for player/humanoid characters
 *
 * Collision layers allow filtering what can collide with what
 */
export class Collider extends Component {
  constructor() {
    super();

    // Collision shape
    this.shape = 'sphere'; // 'sphere', 'box', 'capsule'

    // Shape-specific parameters
    // Sphere: uses radius
    this.radius = 0.5;

    // Box: uses halfExtents (half-width, half-height, half-depth)
    this.halfExtents = { x: 0.5, y: 0.5, z: 0.5 };

    // Capsule: uses radius and height
    this.height = 1.0;

    // Collision offset from entity position
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetZ = 0;

    // Collision behavior
    this.isTrigger = false; // If true, detects collisions but doesn't resolve them (passes through)
    this.isSolid = true; // If true, collider physically blocks movement (separation + bounce)
    this.isStatic = false; // If true, this collider doesn't move (optimization)
    this.bounciness = 0.3; // Bounce coefficient (0 = no bounce, 1 = perfect bounce)
    this.mass = 1.0; // Mass for physics calculations

    // Collision resolution mode
    // - 'horizontal': Ignore Y axis (good for 2.5D games, prevents sinking/floating)
    // - 'full3d': Full 3D collision resolution (all axes)
    // - 'custom': Use axisMask for custom axis filtering
    this.collisionResolutionMode = 'horizontal';
    this.axisMask = { x: true, y: false, z: true }; // Used when mode is 'custom'

    // Collision filtering
    this.layer = 'default'; // Which layer this collider is on
    this.collidesWith = ['default']; // Which layers this collider can collide with

    // Collision state (set by CollisionSystem)
    this.isColliding = false;
    this.collidingWith = []; // Array of entity IDs currently colliding with

    // Collision callbacks (optional)
    this.onCollisionEnter = null; // Called when collision starts
    this.onCollisionStay = null; // Called while collision continues
    this.onCollisionExit = null; // Called when collision ends
  }

  /**
   * Check if this collider can collide with another collider
   * @param {Collider} other - Other collider
   * @returns {boolean}
   */
  canCollideWith(other) {
    // Check if other's layer is in our collidesWith list
    return this.collidesWith.includes(other.layer);
  }

  /**
   * Get the world position of the collider (entity position + offset)
   * @param {Transform} transform - Entity's transform component
   * @returns {object} - {x, y, z}
   */
  getWorldPosition(transform) {
    return {
      x: transform.x + this.offsetX,
      y: transform.y + this.offsetY,
      z: transform.z + this.offsetZ
    };
  }

  /**
   * Get collision bounds (for broad-phase optimization)
   * @param {Transform} transform - Entity's transform component
   * @returns {object} - {minX, maxX, minY, maxY, minZ, maxZ}
   */
  getBounds(transform) {
    const pos = this.getWorldPosition(transform);

    switch (this.shape) {
      case 'sphere':
        return {
          minX: pos.x - this.radius,
          maxX: pos.x + this.radius,
          minY: pos.y - this.radius,
          maxY: pos.y + this.radius,
          minZ: pos.z - this.radius,
          maxZ: pos.z + this.radius
        };

      case 'box':
        return {
          minX: pos.x - this.halfExtents.x,
          maxX: pos.x + this.halfExtents.x,
          minY: pos.y - this.halfExtents.y,
          maxY: pos.y + this.halfExtents.y,
          minZ: pos.z - this.halfExtents.z,
          maxZ: pos.z + this.halfExtents.z
        };

      case 'capsule':
        const r = this.radius;
        const h = this.height / 2;
        return {
          minX: pos.x - r,
          maxX: pos.x + r,
          minY: pos.y - h - r,
          maxY: pos.y + h + r,
          minZ: pos.z - r,
          maxZ: pos.z + r
        };

      default:
        return {
          minX: pos.x - 0.5,
          maxX: pos.x + 0.5,
          minY: pos.y - 0.5,
          maxY: pos.y + 0.5,
          minZ: pos.z - 0.5,
          maxZ: pos.z + 0.5
        };
    }
  }
}
