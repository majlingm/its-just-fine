import * as THREE from 'three';
import { Projectile } from '../entities/Projectile.js';
import { resourceCache } from './ResourceCache.js';

/**
 * ProjectilePool - Object pool for projectiles to reduce GC pressure
 */
export class ProjectilePool {
  constructor(engine, initialSize = 100) {
    this.engine = engine;
    this.pool = [];
    this.active = [];

    // Pre-create projectiles
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createPooledProjectile());
    }
  }

  /**
   * Create a pooled projectile with reusable mesh
   */
  createPooledProjectile() {
    const projectile = {
      // Entity properties
      active: false,
      shouldRemove: false,

      // Position and movement
      x: 0,
      y: 0.5,
      z: 0,
      dirX: 0,
      dirY: 0,
      dirZ: 0,

      // Combat stats
      speed: 10,
      damage: 10,
      pierce: 0,
      pierceCount: 0,

      // Lifetime
      lifetime: 3,
      age: 0,

      // Mesh (created once, reused)
      mesh: null,

      // Reference to engine
      engine: this.engine
    };

    // Create mesh using cached material
    const material = resourceCache.getProjectileMaterial('#ffff00');
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.visible = false; // Start hidden
    projectile.mesh = sprite;

    // Add to scene (but hidden)
    this.engine.scene.add(sprite);

    return projectile;
  }

  /**
   * Get a projectile from the pool
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} z - Starting Z position
   * @param {number} dirX - X direction
   * @param {number} dirZ - Z direction
   * @param {Object} weapon - Weapon configuration
   * @param {Object} stats - Player stats
   * @param {number} dirY - Y direction (optional)
   * @returns {Object} Pooled projectile object
   */
  acquire(x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    let projectile;

    if (this.pool.length > 0) {
      // Reuse from pool
      projectile = this.pool.pop();
    } else {
      // Pool empty, create new one
      console.warn('Projectile pool exhausted, creating new projectile');
      projectile = this.createPooledProjectile();
    }

    // Reset and configure projectile
    this.resetProjectile(projectile, x, y, z, dirX, dirZ, weapon, stats, dirY);

    // Track as active
    this.active.push(projectile);

    // Add to engine entities
    if (!this.engine.entities.includes(projectile)) {
      this.engine.entities.push(projectile);
    }

    return projectile;
  }

  /**
   * Reset projectile with new parameters
   */
  resetProjectile(projectile, x, y, z, dirX, dirZ, weapon, stats, dirY) {
    // Reset position
    projectile.x = x;
    projectile.y = y || 0.5;
    projectile.z = z;

    // Reset direction
    projectile.dirX = dirX;
    projectile.dirY = dirY;
    projectile.dirZ = dirZ;

    // Reset stats from weapon and player
    projectile.speed = weapon.speed * stats.projectileSpeed;
    projectile.damage = weapon.damage * stats.damage;
    projectile.pierce = weapon.pierce + stats.pierce;
    projectile.pierceCount = 0;

    // Reset lifetime
    projectile.lifetime = weapon.lifetime || 3;
    projectile.age = 0;

    // Reset entity state
    projectile.active = true;
    projectile.shouldRemove = false;

    // Update mesh position and visibility
    if (projectile.mesh) {
      projectile.mesh.position.set(x, y || 0.5, z);
      projectile.mesh.visible = true;

      // Update material color if needed (for different weapon types)
      if (weapon.color && weapon.color !== '#ffff00') {
        projectile.mesh.material = resourceCache.getProjectileMaterial(weapon.color);
      }
    }

    // Add update method
    projectile.update = function(dt) {
      if (!this.active) return;

      this.age += dt;
      if (this.age > this.lifetime) {
        this.destroy();
        return;
      }

      // Calculate new position (3D movement)
      const newX = this.x + this.dirX * this.speed * dt;
      const newY = this.y + this.dirY * this.speed * dt;
      const newZ = this.z + this.dirZ * this.speed * dt;

      // Check collision with level objects
      const game = this.engine.game;
      if (game && game.levelSystem) {
        const collision = game.levelSystem.checkCollision(newX, newZ, 0.2);
        if (collision.collided) {
          this.destroy();
          return;
        }
      }

      this.x = newX;
      this.y = newY;
      this.z = newZ;

      if (this.mesh) {
        this.mesh.position.x = this.x;
        this.mesh.position.y = this.y;
        this.mesh.position.z = this.z;
      }
    };

    // Add hit method
    projectile.hit = function() {
      this.pierceCount++;
      if (this.pierceCount > this.pierce) {
        this.destroy();
      }
    };

    // Add destroy method that returns to pool
    projectile.destroy = function() {
      this.active = false;
      this.shouldRemove = true;
      // The pool will handle recycling in its update
    };
  }

  /**
   * Release a projectile back to the pool
   * @param {Object} projectile - Projectile to release
   */
  release(projectile) {
    // Hide mesh
    if (projectile.mesh) {
      projectile.mesh.visible = false;
    }

    // Reset state
    projectile.active = false;
    projectile.shouldRemove = false;

    // Remove from active list
    const index = this.active.indexOf(projectile);
    if (index > -1) {
      this.active.splice(index, 1);
    }

    // Return to pool
    this.pool.push(projectile);
  }

  /**
   * Update pool - check for projectiles to recycle
   */
  update() {
    // Check active projectiles for ones that need recycling
    for (let i = this.active.length - 1; i >= 0; i--) {
      const projectile = this.active[i];
      if (!projectile.active || projectile.shouldRemove) {
        this.release(projectile);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.active.length,
      totalCreated: this.pool.length + this.active.length
    };
  }

  /**
   * Clean up pool resources
   */
  dispose() {
    // Dispose all meshes
    [...this.pool, ...this.active].forEach(projectile => {
      if (projectile.mesh) {
        this.engine.scene.remove(projectile.mesh);
        if (projectile.mesh.material) projectile.mesh.material.dispose();
        if (projectile.mesh.geometry) projectile.mesh.geometry.dispose();
      }
    });

    this.pool = [];
    this.active = [];
  }
}