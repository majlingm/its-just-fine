import * as THREE from 'three';

/**
 * ParticleEmitter - Configuration-based particle spawner
 */
export class ParticleEmitter {
  constructor(particleSystem, config = {}) {
    this.particleSystem = particleSystem;
    this.config = {
      // Spawn configuration
      count: 10,

      // Lifetime range
      lifetime: { min: 0.5, max: 1.0 },

      // Scale range
      startScale: { min: 0.5, max: 1.0 },
      endScale: { min: 0.2, max: 0.5 },

      // Opacity
      startOpacity: 1.0,
      endOpacity: 0.0,

      // Velocity
      velocity: {
        radial: { min: 1, max: 3 },      // Radial velocity from center
        upward: { min: 0, max: 1 },      // Upward velocity
        spread: 0                         // Random spread
      },

      // Acceleration (gravity, etc.)
      acceleration: { x: 0, y: -5, z: 0 },

      // Texture/material
      texture: null,
      material: null,

      ...config
    };
  }

  /**
   * Helper to get random value from range
   */
  randomRange(range) {
    if (typeof range === 'number') return range;
    return range.min + Math.random() * (range.max - range.min);
  }

  /**
   * Create a texture from a canvas with gradient
   */
  createGradientTexture(colors) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);

    colors.forEach((colorStop, index) => {
      const position = index / (colors.length - 1);
      gradient.addColorStop(position, colorStop);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Spawn particles in a burst pattern
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} z - Center Z position
   * @returns {Array<Particle>} Array of spawned particles
   */
  burst(x, y, z) {
    const particles = [];
    const count = this.config.count;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radialVel = this.randomRange(this.config.velocity.radial);
      const upwardVel = this.randomRange(this.config.velocity.upward);
      const spread = this.config.velocity.spread;

      const vx = Math.cos(angle) * radialVel + (Math.random() - 0.5) * spread;
      const vy = upwardVel + (Math.random() - 0.5) * spread;
      const vz = Math.sin(angle) * radialVel + (Math.random() - 0.5) * spread;

      const particleConfig = {
        x: x + (Math.random() - 0.5) * 0.3,
        y: y + (Math.random() - 0.5) * 0.3,
        z: z + (Math.random() - 0.5) * 0.3,
        vx, vy, vz,
        ax: this.config.acceleration.x,
        ay: this.config.acceleration.y,
        az: this.config.acceleration.z,
        startScale: this.randomRange(this.config.startScale),
        endScale: this.randomRange(this.config.endScale),
        startOpacity: this.config.startOpacity,
        endOpacity: this.config.endOpacity,
        lifetime: this.randomRange(this.config.lifetime)
      };

      // Set material if provided
      if (this.config.material) {
        particleConfig.sprite = {
          material: this.config.material
        };
      } else if (this.config.texture) {
        const material = new THREE.SpriteMaterial({
          map: this.config.texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        particleConfig.sprite = { material };
      }

      const particle = this.particleSystem.spawn(particleConfig);
      if (particle) {
        particles.push(particle);
      }
    }

    return particles;
  }

  /**
   * Spawn particles in a cone pattern
   * @param {number} x - Start X position
   * @param {number} y - Start Y position
   * @param {number} z - Start Z position
   * @param {number} dirX - Direction X
   * @param {number} dirY - Direction Y
   * @param {number} dirZ - Direction Z
   * @param {number} coneAngle - Cone angle in radians
   * @returns {Array<Particle>} Array of spawned particles
   */
  cone(x, y, z, dirX, dirY, dirZ, coneAngle = 0.5) {
    const particles = [];
    const count = this.config.count;

    for (let i = 0; i < count; i++) {
      // Random angle within cone
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * coneAngle;

      // Convert to velocity direction
      const speed = this.randomRange(this.config.velocity.radial);
      const vx = dirX + Math.sin(phi) * Math.cos(theta) * speed;
      const vy = dirY + Math.sin(phi) * Math.sin(theta) * speed;
      const vz = dirZ + Math.cos(phi) * speed;

      const particleConfig = {
        x, y, z,
        vx, vy, vz,
        ax: this.config.acceleration.x,
        ay: this.config.acceleration.y,
        az: this.config.acceleration.z,
        startScale: this.randomRange(this.config.startScale),
        endScale: this.randomRange(this.config.endScale),
        startOpacity: this.config.startOpacity,
        endOpacity: this.config.endOpacity,
        lifetime: this.randomRange(this.config.lifetime)
      };

      // Set material if provided
      if (this.config.material) {
        particleConfig.sprite = { material: this.config.material };
      } else if (this.config.texture) {
        const material = new THREE.SpriteMaterial({
          map: this.config.texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        particleConfig.sprite = { material };
      }

      const particle = this.particleSystem.spawn(particleConfig);
      if (particle) {
        particles.push(particle);
      }
    }

    return particles;
  }
}
