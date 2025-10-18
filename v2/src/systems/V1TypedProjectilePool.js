/**
 * TypedProjectilePool - Generic object pool for any projectile class
 * Reduces garbage collection pressure by reusing projectile instances
 */
export class TypedProjectilePool {
  constructor(ProjectileClass, initialSize = 50) {
    this.ProjectileClass = ProjectileClass;
    this.pool = [];
    this.active = [];
    this.initialSize = initialSize;

    // Note: We don't pre-allocate because projectiles need engine and other params
    // Instead we'll create on-demand and recycle
  }

  /**
   * Get a projectile from the pool or create a new one
   * @param {Object} engine - Game engine
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} z - Starting Z position
   * @param {number} dirX - X direction
   * @param {number} dirZ - Z direction
   * @param {Object} weapon - Weapon/spell configuration
   * @param {Object} stats - Player stats
   * @param {number} dirY - Y direction (optional)
   * @returns {Object} Projectile instance
   */
  acquire(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    let projectile;

    if (this.pool.length > 0) {
      // Reuse from pool
      projectile = this.pool.pop();

      // Reset the projectile with new parameters
      if (projectile.reset) {
        projectile.reset(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
      } else {
        console.warn(`${this.ProjectileClass.name} missing reset() method, creating new instance`);
        projectile = new this.ProjectileClass(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
      }
    } else {
      // Pool empty, create new one
      projectile = new this.ProjectileClass(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    }

    // Track as active
    this.active.push(projectile);

    return projectile;
  }

  /**
   * Release a projectile back to the pool
   * @param {Object} projectile - Projectile to release
   */
  release(projectile) {
    // Remove from active list
    const index = this.active.indexOf(projectile);
    if (index > -1) {
      this.active.splice(index, 1);
    }

    // Remove from engine entities array (CRITICAL for preventing memory leak!)
    if (projectile.engine && projectile.engine.removeEntity) {
      projectile.engine.removeEntity(projectile);
    }

    // Don't let pool grow unbounded
    if (this.pool.length < this.initialSize * 2) {
      // Clean up any visual effects before pooling
      if (projectile.cleanupForPool) {
        projectile.cleanupForPool();
      }

      // Hide mesh
      if (projectile.mesh) {
        projectile.mesh.visible = false;
      }

      // Return to pool
      this.pool.push(projectile);
    } else {
      // Pool is full, dispose completely
      if (projectile.dispose) {
        projectile.dispose();
      }
    }
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
      className: this.ProjectileClass.name,
      poolSize: this.pool.length,
      activeCount: this.active.length,
      totalInstances: this.pool.length + this.active.length
    };
  }

  /**
   * Clean up pool resources
   */
  dispose() {
    // Dispose all projectiles
    [...this.pool, ...this.active].forEach(projectile => {
      if (projectile.dispose) {
        projectile.dispose();
      }
    });

    this.pool = [];
    this.active = [];
  }
}
