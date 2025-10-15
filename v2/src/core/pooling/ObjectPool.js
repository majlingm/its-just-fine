/**
 * ObjectPool - Generic object pool for performance optimization
 *
 * Reduces garbage collection pressure by reusing objects instead of
 * creating and destroying them frequently.
 *
 * Usage:
 * ```javascript
 * const pool = new ObjectPool(() => new MyClass(), 50);
 * const obj = pool.acquire();
 * // ... use obj ...
 * pool.release(obj);
 * ```
 */

export class ObjectPool {
  /**
   * Create an object pool
   * @param {Function} createFn - Function that creates new instances
   * @param {number} initialSize - Initial pool size
   * @param {number} maxSize - Maximum pool size (prevents unbounded growth)
   */
  constructor(createFn, initialSize = 10, maxSize = -1) {
    this.createFn = createFn;
    this.initialSize = initialSize;
    this.maxSize = maxSize; // -1 = unlimited

    // Pool storage
    this.available = [];
    this.active = new Set();

    // Statistics
    this.totalCreated = 0;
    this.totalAcquired = 0;
    this.totalReleased = 0;

    // Pre-allocate initial objects
    this.preallocate(initialSize);
  }

  /**
   * Pre-allocate objects to the pool
   * @param {number} count - Number of objects to create
   */
  preallocate(count) {
    for (let i = 0; i < count; i++) {
      const obj = this.createFn();
      this.available.push(obj);
      this.totalCreated++;
    }
  }

  /**
   * Acquire an object from the pool
   * @returns {*} Object from pool (either reused or newly created)
   */
  acquire() {
    let obj;

    if (this.available.length > 0) {
      // Reuse existing object
      obj = this.available.pop();
    } else {
      // Create new object if pool is empty
      obj = this.createFn();
      this.totalCreated++;
    }

    this.active.add(obj);
    this.totalAcquired++;

    return obj;
  }

  /**
   * Release an object back to the pool
   * @param {*} obj - Object to return to pool
   * @returns {boolean} True if released successfully
   */
  release(obj) {
    if (!this.active.has(obj)) {
      console.warn('ObjectPool: Tried to release object not from this pool');
      return false;
    }

    this.active.delete(obj);
    this.totalReleased++;

    // Check max pool size
    if (this.maxSize > 0 && this.available.length >= this.maxSize) {
      // Pool is full, dispose the object instead
      if (obj.dispose && typeof obj.dispose === 'function') {
        obj.dispose();
      }
      return true;
    }

    // Reset object if it has a reset method
    if (obj.reset && typeof obj.reset === 'function') {
      obj.reset();
    }

    this.available.push(obj);
    return true;
  }

  /**
   * Release all active objects back to the pool
   */
  releaseAll() {
    const activeObjects = Array.from(this.active);
    for (const obj of activeObjects) {
      this.release(obj);
    }
  }

  /**
   * Clear the pool and dispose all objects
   */
  clear() {
    // Dispose all available objects
    for (const obj of this.available) {
      if (obj.dispose && typeof obj.dispose === 'function') {
        obj.dispose();
      }
    }

    // Dispose all active objects
    for (const obj of this.active) {
      if (obj.dispose && typeof obj.dispose === 'function') {
        obj.dispose();
      }
    }

    this.available = [];
    this.active.clear();
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool stats
   */
  getStats() {
    return {
      available: this.available.length,
      active: this.active.size,
      total: this.available.length + this.active.size,
      totalCreated: this.totalCreated,
      totalAcquired: this.totalAcquired,
      totalReleased: this.totalReleased,
      reuseRate: this.totalAcquired > 0
        ? ((this.totalAcquired - this.totalCreated) / this.totalAcquired * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Dispose the pool and all objects
   */
  dispose() {
    this.clear();
    this.createFn = null;
  }
}
