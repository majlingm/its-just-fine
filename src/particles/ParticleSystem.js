import * as THREE from 'three';
import { Particle } from './Particle.js';

/**
 * ParticleSystem - Manages particle lifecycle and pooling
 */
export class ParticleSystem {
  constructor(scene, poolSize = 100) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.particles = [];
    this.activeParticles = [];

    this.initializePool();
  }

  /**
   * Initialize object pool with particles
   */
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const particle = new Particle();

      // Create sprite for particle
      const sprite = new THREE.Sprite();
      sprite.visible = false;
      particle.setSprite(sprite);
      this.scene.add(sprite);

      this.particles.push(particle);
    }
  }

  /**
   * Get an inactive particle from the pool
   * @returns {Particle|null} Available particle or null if pool exhausted
   */
  getParticle() {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        return this.particles[i];
      }
    }
    return null; // Pool exhausted
  }

  /**
   * Spawn a single particle with given configuration
   * @param {Object} config - Particle configuration
   * @returns {Particle|null} The spawned particle or null if pool full
   */
  spawn(config) {
    const particle = this.getParticle();
    if (!particle) {
      console.warn('Particle pool exhausted');
      return null;
    }

    particle.init(config);
    particle.sprite.visible = true;
    this.activeParticles.push(particle);

    return particle;
  }

  /**
   * Update all active particles
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update particles backwards so we can remove safely
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.update(dt);

      // Remove if inactive
      if (!particle.active) {
        particle.sprite.visible = false;
        this.activeParticles.splice(i, 1);
      }
    }
  }

  /**
   * Get count of active particles
   * @returns {number} Number of active particles
   */
  getActiveCount() {
    return this.activeParticles.length;
  }

  /**
   * Get count of available particles in pool
   * @returns {number} Number of available particles
   */
  getAvailableCount() {
    return this.poolSize - this.activeParticles.length;
  }

  /**
   * Clear all active particles
   */
  clear() {
    this.activeParticles.forEach(particle => {
      particle.reset();
      particle.sprite.visible = false;
    });
    this.activeParticles = [];
  }

  /**
   * Destroy the particle system
   */
  destroy() {
    this.particles.forEach(particle => {
      if (particle.sprite) {
        this.scene.remove(particle.sprite);
        if (particle.sprite.material) {
          particle.sprite.material.dispose();
        }
      }
    });
    this.particles = [];
    this.activeParticles = [];
  }
}
