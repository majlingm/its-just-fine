import * as THREE from 'three';

/**
 * InstancedParticlePool - High-performance particle system using InstancedMesh
 *
 * Benefits:
 * - Renders thousands of particles in 1 draw call
 * - Reusable across different particle types
 * - Memory efficient with object pooling
 *
 * Usage:
 *   const pool = new InstancedParticlePool(scene, {
 *     texture: myTexture,
 *     maxParticles: 1000,
 *     size: 0.5
 *   });
 *
 *   const particle = pool.spawn(x, y, z, { life: 1.0, color: 0xff0000 });
 *   pool.update(dt);
 */
export class InstancedParticlePool {
  constructor(scene, options = {}) {
    this.scene = scene;

    // Configuration
    this.maxParticles = options.maxParticles || 2000;
    this.particleSize = options.size || 0.5;
    this.texture = options.texture || null;
    this.blending = options.blending || THREE.AdditiveBlending;
    this.transparent = options.transparent !== false;

    // Particle pool
    this.particles = []; // Active particles
    this.availableIndices = []; // Free instance indices

    // Create instanced mesh
    this.createInstancedMesh();

    // Temporary objects for matrix operations (reuse to avoid GC)
    this.tempMatrix = new THREE.Matrix4();
    this.tempPosition = new THREE.Vector3();
    this.tempScale = new THREE.Vector3();
    this.tempColor = new THREE.Color();
  }

  createInstancedMesh() {
    // Create geometry (simple quad)
    const geometry = new THREE.PlaneGeometry(this.particleSize, this.particleSize);

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: this.transparent,
      blending: this.blending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.maxParticles
    );

    this.instancedMesh.renderOrder = 998;

    // Initialize all instances as invisible
    const invisibleMatrix = new THREE.Matrix4();
    invisibleMatrix.makeScale(0, 0, 0);

    for (let i = 0; i < this.maxParticles; i++) {
      this.instancedMesh.setMatrixAt(i, invisibleMatrix);
      this.availableIndices.push(i);
    }

    // Add to scene
    this.scene.add(this.instancedMesh);
  }

  /**
   * Spawn a new particle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {object} config - Particle configuration
   * @returns {object|null} Particle data or null if pool is full
   */
  spawn(x, y, z, config = {}) {
    if (this.availableIndices.length === 0) {
      console.warn('Particle pool exhausted');
      return null;
    }

    const instanceIndex = this.availableIndices.pop();

    // Set initial matrix (position and scale)
    this.tempMatrix.makeTranslation(x, y, z);
    const scale = config.scale || 1.0;
    this.tempMatrix.scale(new THREE.Vector3(scale, scale, 1));
    this.instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Set color if provided
    if (config.color !== undefined) {
      if (typeof config.color === 'number') {
        this.tempColor.setHex(config.color);
      } else if (config.color instanceof THREE.Color) {
        this.tempColor.copy(config.color);
      }
      this.instancedMesh.setColorAt(instanceIndex, this.tempColor);
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }

    // Create particle data
    const particle = {
      instanceIndex: instanceIndex,
      x: x,
      y: y,
      z: z,
      age: 0,
      life: config.life || 1.0,
      scale: scale,
      initialScale: scale,
      velocity: config.velocity || { x: 0, y: 0, z: 0 },
      fadeOut: config.fadeOut !== false,
      shrink: config.shrink !== false,
      gravity: config.gravity || 0,
      userData: config.userData || {}
    };

    this.particles.push(particle);
    return particle;
  }

  /**
   * Update all particles
   * @param {number} dt - Delta time
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += dt;

      // Remove dead particles
      if (particle.age >= particle.life) {
        this.removeParticle(i);
        continue;
      }

      // Update position with velocity
      particle.x += particle.velocity.x * dt;
      particle.y += particle.velocity.y * dt;
      particle.z += particle.velocity.z * dt;

      // Apply gravity
      if (particle.gravity) {
        particle.velocity.y += particle.gravity * dt;
      }

      // Calculate life progress (0 to 1)
      const lifeProgress = particle.age / particle.life;

      // Update scale (shrink over time)
      let scale = particle.initialScale;
      if (particle.shrink) {
        scale = particle.initialScale * (1 - lifeProgress * 0.5);
      }

      // Update matrix (position + scale)
      this.tempMatrix.makeTranslation(particle.x, particle.y, particle.z);
      this.tempMatrix.scale(new THREE.Vector3(scale, scale, 1));
      this.instancedMesh.setMatrixAt(particle.instanceIndex, this.tempMatrix);

      // Update opacity (fade out) by modifying color alpha
      // Note: InstancedMesh doesn't support per-instance opacity directly
      // We can fake it by darkening the color
      if (particle.fadeOut) {
        const opacity = 1 - lifeProgress;
        this.instancedMesh.getColorAt(particle.instanceIndex, this.tempColor);
        this.tempColor.multiplyScalar(opacity);
        this.instancedMesh.setColorAt(particle.instanceIndex, this.tempColor);
      }
    }

    // Mark matrices as needing update if we updated any
    if (this.particles.length > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  /**
   * Remove particle at index
   * @param {number} index - Index in particles array
   */
  removeParticle(index) {
    const particle = this.particles[index];

    // Make instance invisible
    this.tempMatrix.makeScale(0, 0, 0);
    this.instancedMesh.setMatrixAt(particle.instanceIndex, this.tempMatrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Return instance to pool
    this.availableIndices.push(particle.instanceIndex);

    // Remove from active particles
    this.particles.splice(index, 1);
  }

  /**
   * Clear all particles
   */
  clear() {
    // Make all instances invisible
    const invisibleMatrix = new THREE.Matrix4();
    invisibleMatrix.makeScale(0, 0, 0);

    this.particles.forEach(particle => {
      this.instancedMesh.setMatrixAt(particle.instanceIndex, invisibleMatrix);
      this.availableIndices.push(particle.instanceIndex);
    });

    this.particles = [];
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Get number of active particles
   */
  getActiveCount() {
    return this.particles.length;
  }

  /**
   * Get number of available particle slots
   */
  getAvailableCount() {
    return this.availableIndices.length;
  }

  /**
   * Dispose of the particle pool
   */
  dispose() {
    this.clear();
    this.scene.remove(this.instancedMesh);
    this.instancedMesh.geometry.dispose();
    this.instancedMesh.material.dispose();
  }
}
