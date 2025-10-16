/**
 * InstancedParticlePool - GPU-accelerated particle system using InstancedMesh
 *
 * Benefits over entity-based particles:
 * - Single draw call for thousands of particles
 * - Reduced CPU overhead (no entity/component updates)
 * - Better GPU utilization (instanced rendering)
 * - ~10-100x performance improvement
 *
 * Trade-offs:
 * - Less flexible (fixed geometry/material per pool)
 * - Manual matrix updates required
 * - No automatic ECS integration
 *
 * Usage:
 * ```javascript
 * const pool = new InstancedParticlePool(renderer, {
 *   maxParticles: 1000,
 *   geometry: sphereGeometry,
 *   material: particleMaterial
 * });
 *
 * const particle = pool.spawn({ x, y, z, velocityX, velocityY, velocityZ });
 * pool.update(dt);
 * ```
 */

import * as THREE from 'three';
import { OptimizationConfig } from '../../core/config/optimization.js';

export class InstancedParticlePool {
  constructor(renderer, config = {}) {
    this.renderer = renderer;
    this.config = {
      maxParticles: config.maxParticles || OptimizationConfig.particlePooling.maxParticles,
      geometry: config.geometry,
      material: config.material,
      frustumCulled: OptimizationConfig.particlePooling.cullingEnabled,
      castShadow: config.castShadow || false,
      receiveShadow: config.receiveShadow || false
    };

    // Create InstancedMesh
    this.mesh = new THREE.InstancedMesh(
      this.config.geometry,
      this.config.material,
      this.config.maxParticles
    );
    this.mesh.frustumCulled = this.config.frustumCulled;
    this.mesh.castShadow = this.config.castShadow;
    this.mesh.receiveShadow = this.config.receiveShadow;

    // Add to scene
    this.renderer.addToScene(this.mesh);

    // Particle data arrays (Structure of Arrays for cache efficiency)
    this.active = new Array(this.config.maxParticles).fill(false);

    // Position
    this.posX = new Float32Array(this.config.maxParticles);
    this.posY = new Float32Array(this.config.maxParticles);
    this.posZ = new Float32Array(this.config.maxParticles);

    // Velocity
    this.velX = new Float32Array(this.config.maxParticles);
    this.velY = new Float32Array(this.config.maxParticles);
    this.velZ = new Float32Array(this.config.maxParticles);

    // Physics
    this.gravity = new Float32Array(this.config.maxParticles);
    this.drag = new Float32Array(this.config.maxParticles);

    // Lifetime
    this.lifetime = new Float32Array(this.config.maxParticles);
    this.age = new Float32Array(this.config.maxParticles);

    // Visual properties
    this.startScale = new Float32Array(this.config.maxParticles);
    this.endScale = new Float32Array(this.config.maxParticles);
    this.startOpacity = new Float32Array(this.config.maxParticles);
    this.endOpacity = new Float32Array(this.config.maxParticles);

    // Color (stored as RGB components for interpolation)
    this.startColorR = new Float32Array(this.config.maxParticles);
    this.startColorG = new Float32Array(this.config.maxParticles);
    this.startColorB = new Float32Array(this.config.maxParticles);
    this.endColorR = new Float32Array(this.config.maxParticles);
    this.endColorG = new Float32Array(this.config.maxParticles);
    this.endColorB = new Float32Array(this.config.maxParticles);

    // Temp matrix for updates
    this.matrix = new THREE.Matrix4();
    this.color = new THREE.Color();

    // Pool statistics
    this.stats = {
      activeCount: 0,
      spawnCount: 0,
      recycleCount: 0,
      poolFull: 0
    };

    // Initialize all instances as invisible
    this.hideAllInstances();
  }

  /**
   * Hide all instances (set to zero scale)
   */
  hideAllInstances() {
    this.matrix.makeScale(0, 0, 0);
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.mesh.setMatrixAt(i, this.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Spawn a new particle
   * @param {Object} config - Particle configuration
   * @returns {number|null} Particle index or null if pool is full
   */
  spawn(config = {}) {
    // Find first inactive particle
    let index = -1;
    for (let i = 0; i < this.config.maxParticles; i++) {
      if (!this.active[i]) {
        index = i;
        break;
      }
    }

    // Pool is full
    if (index === -1) {
      this.stats.poolFull++;
      if (OptimizationConfig.particlePooling.debug) {
        console.warn('InstancedParticlePool: Pool is full, cannot spawn particle');
      }
      return null;
    }

    // Activate particle
    this.active[index] = true;
    this.stats.activeCount++;
    this.stats.spawnCount++;

    // Position
    this.posX[index] = config.x || 0;
    this.posY[index] = config.y || 0;
    this.posZ[index] = config.z || 0;

    // Velocity
    this.velX[index] = config.velocityX || 0;
    this.velY[index] = config.velocityY || 0;
    this.velZ[index] = config.velocityZ || 0;

    // Physics
    this.gravity[index] = config.gravity !== undefined ? config.gravity : -9.8;
    this.drag[index] = config.drag !== undefined ? config.drag : 0.95;

    // Lifetime
    this.lifetime[index] = config.lifetime || 1.0;
    this.age[index] = 0;

    // Visual
    this.startScale[index] = config.startScale !== undefined ? config.startScale : 1.0;
    this.endScale[index] = config.endScale !== undefined ? config.endScale : 0.5;
    this.startOpacity[index] = config.startOpacity !== undefined ? config.startOpacity : 1.0;
    this.endOpacity[index] = config.endOpacity !== undefined ? config.endOpacity : 0.0;

    // Color
    const startColor = config.startColor || 0xffffff;
    const endColor = config.endColor || 0x000000;
    this.color.setHex(startColor);
    this.startColorR[index] = this.color.r;
    this.startColorG[index] = this.color.g;
    this.startColorB[index] = this.color.b;
    this.color.setHex(endColor);
    this.endColorR[index] = this.color.r;
    this.endColorG[index] = this.color.g;
    this.endColorB[index] = this.color.b;

    return index;
  }

  /**
   * Spawn a burst of particles
   * @param {Object} config - Burst configuration
   * @returns {Array<number>} Array of particle indices
   */
  spawnBurst(config = {}) {
    const indices = [];
    const count = config.count || 10;
    const { x = 0, y = 0, z = 0 } = config;

    for (let i = 0; i < count; i++) {
      // Random direction for burst
      const angle = (Math.PI * 2 * i) / count;
      const speed = (config.burstSpeed || 5) * (0.8 + Math.random() * 0.4);

      const index = this.spawn({
        x,
        y,
        z,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.random() * speed * 0.5,
        velocityZ: Math.sin(angle) * speed,
        ...config
      });

      if (index !== null) {
        indices.push(index);
      }
    }

    return indices;
  }

  /**
   * Update all active particles
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    let needsUpdate = false;

    for (let i = 0; i < this.config.maxParticles; i++) {
      if (!this.active[i]) continue;

      // Update age
      this.age[i] += dt;

      // Check for expiration
      if (this.age[i] >= this.lifetime[i]) {
        this.active[i] = false;
        this.stats.activeCount--;
        this.stats.recycleCount++;

        // Hide instance
        this.matrix.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this.matrix);
        needsUpdate = true;
        continue;
      }

      // Apply gravity
      this.velY[i] += this.gravity[i] * dt;

      // Apply drag (frame-rate-independent)
      const dragFactor = Math.pow(this.drag[i], dt * 60);
      this.velX[i] *= dragFactor;
      this.velY[i] *= dragFactor;
      this.velZ[i] *= dragFactor;

      // Update position
      this.posX[i] += this.velX[i] * dt;
      this.posY[i] += this.velY[i] * dt;
      this.posZ[i] += this.velZ[i] * dt;

      // Interpolate scale
      const progress = this.age[i] / this.lifetime[i];
      const scale = this.startScale[i] + (this.endScale[i] - this.startScale[i]) * progress;

      // Update instance matrix
      this.matrix.makeScale(scale, scale, scale);
      this.matrix.setPosition(this.posX[i], this.posY[i], this.posZ[i]);
      this.mesh.setMatrixAt(i, this.matrix);
      needsUpdate = true;

      // Color interpolation (handled by material, or could use instanceColor attribute)
      // For now, particles share the same material color
      // To have per-particle colors, need to use InstancedBufferAttribute
    }

    if (needsUpdate) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      maxParticles: this.config.maxParticles,
      activeCount: this.stats.activeCount,
      availableCount: this.config.maxParticles - this.stats.activeCount,
      utilizationRate: (this.stats.activeCount / this.config.maxParticles * 100).toFixed(1) + '%',
      totalSpawned: this.stats.spawnCount,
      totalRecycled: this.stats.recycleCount,
      poolFullCount: this.stats.poolFull
    };
  }

  /**
   * Clear all particles
   */
  clear() {
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.active[i] = false;
    }
    this.stats.activeCount = 0;
    this.hideAllInstances();
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.renderer.removeFromScene(this.mesh);
    this.mesh.dispose();
  }
}
