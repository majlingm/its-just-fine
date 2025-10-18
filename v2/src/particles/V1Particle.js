import * as THREE from 'three';

/**
 * Particle - Individual particle with lifecycle management
 */
export class Particle {
  constructor() {
    // Transform
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();

    // Visual properties
    this.sprite = null;
    this.startScale = 1;
    this.endScale = 1;
    this.currentScale = 1;
    this.startOpacity = 1;
    this.endOpacity = 0;
    this.currentOpacity = 1;

    // Lifecycle
    this.age = 0;
    this.lifetime = 1;
    this.active = false;
  }

  /**
   * Initialize/reset particle with new properties
   */
  init(config) {
    this.position.set(config.x || 0, config.y || 0, config.z || 0);
    this.velocity.set(config.vx || 0, config.vy || 0, config.vz || 0);
    this.acceleration.set(config.ax || 0, config.ay || 0, config.az || 0);

    this.startScale = config.startScale || 1;
    this.endScale = config.endScale !== undefined ? config.endScale : this.startScale;
    this.currentScale = this.startScale;

    this.startOpacity = config.startOpacity !== undefined ? config.startOpacity : 1;
    this.endOpacity = config.endOpacity !== undefined ? config.endOpacity : 0;
    this.currentOpacity = this.startOpacity;

    this.lifetime = config.lifetime || 1;
    this.age = 0;
    this.active = true;

    if (this.sprite && config.sprite) {
      // Copy sprite properties if provided
      if (config.sprite.material) {
        this.sprite.material = config.sprite.material.clone();
      }
    }

    this.updateVisuals();
  }

  /**
   * Update particle state
   */
  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Check if particle expired
    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    // Update physics
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;
    this.velocity.z += this.acceleration.z * dt;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Update visual properties based on lifetime progress
    const progress = this.age / this.lifetime;

    // Interpolate scale
    this.currentScale = this.startScale + (this.endScale - this.startScale) * progress;

    // Interpolate opacity
    this.currentOpacity = this.startOpacity + (this.endOpacity - this.startOpacity) * progress;

    this.updateVisuals();
  }

  /**
   * Update sprite visuals based on current state
   */
  updateVisuals() {
    if (!this.sprite) return;

    this.sprite.position.copy(this.position);
    this.sprite.scale.set(this.currentScale, this.currentScale, 1);

    if (this.sprite.material) {
      this.sprite.material.opacity = this.currentOpacity;
    }
  }

  /**
   * Reset particle to inactive state
   */
  reset() {
    this.active = false;
    this.age = 0;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
  }

  /**
   * Set sprite for this particle
   */
  setSprite(sprite) {
    this.sprite = sprite;
    this.updateVisuals();
  }
}
