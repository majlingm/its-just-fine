import { Pickup } from '../entities/Pickup.js';

/**
 * PickupPool - Object pool for XP and health pickups
 * Reduces garbage collection pressure from frequent pickup creation
 */
export class PickupPool {
  constructor(engine, initialSize = 200) {
    this.engine = engine;
    this.pool = [];
    this.active = [];

    // Pre-allocate pickups (split between XP and health)
    for (let i = 0; i < initialSize; i++) {
      // Create mostly XP pickups (90%), some health pickups (10%)
      const type = i < initialSize * 0.9 ? 'xp' : 'health';
      const pickup = new Pickup(engine, 0, 0, type, type === 'xp' ? 1 : 10);
      pickup.active = false;
      pickup.shouldRemove = false;
      if (pickup.mesh) {
        pickup.mesh.visible = false;
      }
      this.pool.push(pickup);
    }
  }

  /**
   * Get a pickup from the pool
   * @param {number} x - X position
   * @param {number} z - Z position
   * @param {string} type - Pickup type ('xp' or 'health')
   * @param {number} value - Pickup value
   * @returns {Pickup} Pickup instance
   */
  acquire(x, z, type = 'xp', value = 1) {
    let pickup;

    // Try to find a pickup of the same type in the pool
    const sameTypeIndex = this.pool.findIndex(p => p.type === type);

    if (sameTypeIndex !== -1) {
      // Reuse pickup of same type
      pickup = this.pool.splice(sameTypeIndex, 1)[0];
    } else if (this.pool.length > 0) {
      // Reuse any pickup and change its type
      pickup = this.pool.pop();
      // Need to recreate mesh if type changed
      const needsNewMesh = pickup.type !== type;
      pickup.type = type;
      if (needsNewMesh) {
        // Remove old mesh
        if (pickup.mesh) {
          this.engine.scene.remove(pickup.mesh);
          if (pickup.mesh.material) {
            if (pickup.mesh.material.map) {
              pickup.mesh.material.map.dispose();
            }
            pickup.mesh.material.dispose();
          }
        }
        // Create new mesh for new type
        pickup.createMesh();
        this.engine.scene.add(pickup.mesh);
      }
    } else {
      // Pool empty, create new one
      console.warn('Pickup pool exhausted, creating new pickup');
      pickup = new Pickup(this.engine, x, z, type, value);
    }

    // Reset pickup properties
    pickup.x = x;
    pickup.z = z;
    pickup.value = value;
    pickup.bobOffset = Math.random() * Math.PI * 2;
    pickup.active = true;
    pickup.shouldRemove = false;

    // Show and position mesh
    if (pickup.mesh) {
      pickup.mesh.visible = true;
      pickup.mesh.position.set(x, 0.3, z);
      pickup.mesh.material.opacity = 1.0;

      // Reset scale
      const scale = type === 'health' ? 1.0 : 0.3;
      pickup.mesh.scale.set(scale, scale, 1);
      pickup.baseScale = scale;
    }

    // Track as active
    this.active.push(pickup);

    return pickup;
  }

  /**
   * Release a pickup back to the pool
   * @param {Pickup} pickup - Pickup to release
   */
  release(pickup) {
    // Hide mesh
    if (pickup.mesh) {
      pickup.mesh.visible = false;
    }

    // Reset state
    pickup.active = false;
    pickup.shouldRemove = false;

    // Remove from active list
    const index = this.active.indexOf(pickup);
    if (index > -1) {
      this.active.splice(index, 1);
    }

    // Return to pool (limit pool size)
    if (this.pool.length < 300) {
      this.pool.push(pickup);
    } else {
      // Pool is too full, dispose the pickup
      if (pickup.mesh) {
        this.engine.scene.remove(pickup.mesh);
        if (pickup.mesh.material) {
          if (pickup.mesh.material.map) {
            pickup.mesh.material.map.dispose();
          }
          pickup.mesh.material.dispose();
        }
      }
    }
  }

  /**
   * Update pool - check for pickups to recycle
   */
  update() {
    // Check active pickups for ones that need recycling
    for (let i = this.active.length - 1; i >= 0; i--) {
      const pickup = this.active[i];
      if (!pickup.active || pickup.shouldRemove) {
        this.release(pickup);
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
      totalInstances: this.pool.length + this.active.length,
      xpInPool: this.pool.filter(p => p.type === 'xp').length,
      healthInPool: this.pool.filter(p => p.type === 'health').length
    };
  }

  /**
   * Clean up pool resources
   */
  dispose() {
    // Dispose all pickups
    [...this.pool, ...this.active].forEach(pickup => {
      if (pickup.mesh) {
        this.engine.scene.remove(pickup.mesh);
        if (pickup.mesh.material) {
          if (pickup.mesh.material.map) {
            pickup.mesh.material.map.dispose();
          }
          pickup.mesh.material.dispose();
        }
      }
    });

    this.pool = [];
    this.active = [];
  }
}
