import * as THREE from 'three';
import { resourceCache } from './ResourceCache.js';

/**
 * EnemyProjectilePool - Object pool for enemy projectiles
 */
export class EnemyProjectilePool {
  constructor(engine, initialSize = 50) {
    this.engine = engine;
    this.pool = [];
    this.active = [];

    // Pre-create projectiles
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createPooledProjectile());
    }
  }

  /**
   * Create a pooled enemy projectile with reusable mesh
   */
  createPooledProjectile() {
    const projectile = {
      // Entity properties
      active: false,
      shouldRemove: false,

      // Position and movement
      x: 0,
      y: 1,
      z: 0,
      dirX: 0,
      dirZ: 0,

      // Combat stats
      damage: 10,
      speed: 8,

      // Lifetime
      lifetime: 5.0,
      age: 0,

      // Trail management
      trails: [],
      trailSpawnTimer: 0,
      trailSpawnInterval: 0.1,

      // Mesh (created once, reused)
      mesh: null,

      // Reference to engine
      engine: this.engine
    };

    // Create mesh using cached material
    const material = resourceCache.getProjectileMaterial('#ff8c32'); // Orange color for enemy projectiles
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.visible = false; // Start hidden
    sprite.renderOrder = 100;
    projectile.mesh = sprite;

    // Add to scene (but hidden)
    this.engine.scene.add(sprite);

    return projectile;
  }

  /**
   * Get an enemy projectile from the pool
   */
  acquire(x, y, z, dirX, dirZ, damage = 10, speed = 8) {
    let projectile;

    if (this.pool.length > 0) {
      // Reuse from pool
      projectile = this.pool.pop();
    } else {
      // Pool empty, create new one
      console.warn('Enemy projectile pool exhausted, creating new projectile');
      projectile = this.createPooledProjectile();
    }

    // Reset and configure projectile
    this.resetProjectile(projectile, x, y, z, dirX, dirZ, damage, speed);

    // Track as active
    this.active.push(projectile);

    // Add to engine entities
    if (!this.engine.entities.includes(projectile)) {
      this.engine.entities.push(projectile);
    }

    return projectile;
  }

  /**
   * Reset enemy projectile with new parameters
   */
  resetProjectile(projectile, x, y, z, dirX, dirZ, damage, speed) {
    // Reset position
    projectile.x = x;
    projectile.y = y || 1;
    projectile.z = z;

    // Reset direction
    projectile.dirX = dirX;
    projectile.dirZ = dirZ;

    // Reset stats
    projectile.damage = damage;
    projectile.speed = speed;

    // Reset lifetime
    projectile.lifetime = 5.0;
    projectile.age = 0;

    // Reset trail spawn timer
    projectile.trailSpawnTimer = 0;

    // Clear any existing trails
    projectile.trails.forEach(trail => {
      if (trail.mesh) {
        this.engine.scene.remove(trail.mesh);
        if (trail.material) trail.material.dispose();
      }
    });
    projectile.trails = [];

    // Reset entity state
    projectile.active = true;
    projectile.shouldRemove = false;

    // Update mesh position and visibility
    if (projectile.mesh) {
      projectile.mesh.position.set(x, y || 1, z);
      projectile.mesh.visible = true;
    }

    // Add update method
    projectile.update = function(dt) {
      if (!this.active) return;

      this.age += dt;

      // Despawn if too old
      if (this.age > this.lifetime) {
        this.destroy();
        return;
      }

      // Move projectile
      this.x += this.dirX * this.speed * dt;
      this.z += this.dirZ * this.speed * dt;

      // Update mesh position
      if (this.mesh) {
        this.mesh.position.set(this.x, this.y, this.z);
        // Slight bobbing motion for visual interest
        this.mesh.position.y += Math.sin(this.age * 10) * 0.05;
      }

      // Spawn trail particles (simplified to reduce allocations)
      this.trailSpawnTimer += dt;
      if (this.trailSpawnTimer >= this.trailSpawnInterval && this.trails.length < 5) {
        this.trailSpawnTimer = 0;

        // Reuse cached trail material
        const trailMaterial = resourceCache.getProjectileMaterial('#ff5028');
        const sprite = new THREE.Sprite(trailMaterial);
        sprite.scale.set(0.4, 0.4, 1);
        sprite.position.set(this.x, this.y, this.z);
        sprite.renderOrder = 99;

        this.trails.push({
          mesh: sprite,
          age: 0,
          life: 0.3,
          material: trailMaterial
        });

        this.engine.scene.add(sprite);
      }

      // Update trails
      for (let i = this.trails.length - 1; i >= 0; i--) {
        const trail = this.trails[i];
        trail.age += dt;

        if (trail.age >= trail.life) {
          this.engine.scene.remove(trail.mesh);
          this.trails.splice(i, 1);
        } else {
          // Fade out trail
          const fadeProgress = trail.age / trail.life;
          trail.material.opacity = 1 - fadeProgress;
          trail.mesh.scale.multiplyScalar(0.98);
        }
      }

      // Check collision with player
      const player = this.engine.game?.player;
      if (player && player.active) {
        const dx = player.x - this.x;
        const dz = player.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.0) {
          // Hit player
          const godMode = this.engine.game?.godMode;
          if (!godMode && player.takeDamage && player.takeDamage(this.damage, 'Enemy projectile')) {
            // Player died
            if (this.engine.game && this.engine.game.onGameOver) {
              this.engine.game.gameOver = true;
            }
          }
          this.destroy();
        }
      }
    };

    // Add hit method
    projectile.hit = function() {
      this.destroy();
    };

    // Add destroy method that returns to pool
    projectile.destroy = function() {
      // Clean up trails
      this.trails.forEach(trail => {
        if (trail.mesh) {
          this.engine.scene.remove(trail.mesh);
        }
      });
      this.trails = [];

      this.active = false;
      this.shouldRemove = true;
      // The pool will handle recycling in its update
    };
  }

  /**
   * Release a projectile back to the pool
   */
  release(projectile) {
    // Hide mesh
    if (projectile.mesh) {
      projectile.mesh.visible = false;
    }

    // Clean up any remaining trails
    projectile.trails.forEach(trail => {
      if (trail.mesh) {
        this.engine.scene.remove(trail.mesh);
      }
    });
    projectile.trails = [];

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
      }
      // Clean up trails
      projectile.trails.forEach(trail => {
        if (trail.mesh) {
          this.engine.scene.remove(trail.mesh);
        }
      });
    });

    this.pool = [];
    this.active = [];
  }
}