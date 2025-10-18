import * as THREE from 'three';

/**
 * ResourceCache - Singleton cache for textures, materials, and geometries
 * Prevents recreating the same resources multiple times
 */
class ResourceCache {
  constructor() {
    this.textures = new Map();
    this.materials = new Map();
    this.geometries = new Map();
    this.sprites = new Map();
    this.canvases = new Map();
  }

  /**
   * Get or create a cached texture
   * @param {string} key - Unique identifier for the texture
   * @param {Function} createFn - Function that creates the texture if not cached
   * @returns {THREE.Texture} Cached or newly created texture
   */
  getTexture(key, createFn) {
    if (!this.textures.has(key)) {
      const texture = createFn();
      this.textures.set(key, texture);
    }
    return this.textures.get(key);
  }

  /**
   * Get or create a cached material
   * @param {string} key - Unique identifier for the material
   * @param {Function} createFn - Function that creates the material if not cached
   * @returns {THREE.Material} Cached or newly created material
   */
  getMaterial(key, createFn) {
    if (!this.materials.has(key)) {
      const material = createFn();
      this.materials.set(key, material);
    }
    // Return a clone to prevent shared material state issues
    return this.materials.get(key).clone();
  }

  /**
   * Get or create a shared material (not cloned)
   * @param {string} key - Unique identifier for the material
   * @param {Function} createFn - Function that creates the material if not cached
   * @returns {THREE.Material} Cached or newly created material (shared instance)
   */
  getSharedMaterial(key, createFn) {
    if (!this.materials.has(key)) {
      const material = createFn();
      this.materials.set(key, material);
    }
    return this.materials.get(key);
  }

  /**
   * Get or create a cached geometry
   * @param {string} key - Unique identifier for the geometry
   * @param {Function} createFn - Function that creates the geometry if not cached
   * @returns {THREE.BufferGeometry} Cached or newly created geometry
   */
  getGeometry(key, createFn) {
    if (!this.geometries.has(key)) {
      const geometry = createFn();
      this.geometries.set(key, geometry);
    }
    return this.geometries.get(key);
  }

  /**
   * Get or create a cached canvas
   * @param {string} key - Unique identifier for the canvas
   * @param {Function} drawFn - Function that draws on the canvas
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {HTMLCanvasElement} Cached or newly created canvas
   */
  getCanvas(key, drawFn, width = 64, height = 64) {
    if (!this.canvases.has(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      drawFn(ctx, width, height);
      this.canvases.set(key, canvas);
    }
    return this.canvases.get(key);
  }

  /**
   * Get fireball main sprite material with cached texture
   * @returns {THREE.SpriteMaterial} Sprite material for fireball
   */
  getFireballMaterial() {
    const key = 'fireball_main';

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, centerX);

        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 0, 0.9)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, 32, 32);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a new material instance (not cloned) for independent scaling
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Create a projectile sprite material with cached texture
   * @param {string} color - Color of the projectile
   * @returns {THREE.SpriteMaterial} Sprite material for projectile
   */
  getProjectileMaterial(color = '#ffff00') {
    const key = `projectile_${color}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const centerX = width / 2;
        const centerY = height / 2;

        // Outer glow
        const outerGlow = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, centerX);
        outerGlow.addColorStop(0, color);
        outerGlow.addColorStop(0.4, color);
        outerGlow.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
        outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, width, height);

        // Core - bright center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 1, centerY - 1, 2, 2);

        // Inner glow
        const innerGlow = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, 5);
        innerGlow.addColorStop(0, '#ffffff');
        innerGlow.addColorStop(0.5, color);
        innerGlow.addColorStop(1, 'rgba(255, 200, 0, 0.5)');
        ctx.fillStyle = innerGlow;
        ctx.fillRect(centerX - 5, centerY - 5, 10, 10);
      }, 24, 24);

      return new THREE.CanvasTexture(canvas);
    });

    // Create material with cached texture (clone for independent opacity/scale)
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }

  /**
   * Get flame trail material with cached texture
   * @param {string} colorType - Color type (yellow, orange, red)
   * @returns {THREE.SpriteMaterial} Sprite material for flame trail
   */
  getFlameTrailMaterial(colorType = 'orange') {
    const key = `flame_trail_${colorType}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, centerX);

        if (colorType === 'yellow') {
          gradient.addColorStop(0, 'rgba(255, 255, 150, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.6)');
          gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        } else if (colorType === 'orange') {
          gradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
          gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');
        } else { // red
          gradient.addColorStop(0, 'rgba(255, 150, 100, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
          gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, 24, 24);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a cloned material so each sprite can have its own opacity
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Get ice shard material with cached texture
   * @param {string} colorType - Color type (white, lightblue, cyan)
   * @returns {THREE.SpriteMaterial} Sprite material for ice shard
   */
  getIceShardMaterial(colorType = 'lightblue') {
    const key = `ice_shard_${colorType}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, centerX / 2);

        if (colorType === 'white') {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(230, 245, 255, 0.6)');
          gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
        } else if (colorType === 'lightblue') {
          gradient.addColorStop(0, 'rgba(230, 245, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.6)');
          gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
        } else { // cyan
          gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(150, 210, 255, 0.6)');
          gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, 16, 16);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a cloned material so each sprite can have its own opacity
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Get ring of fire particle material with cached texture
   * @param {string} colorType - Color type (white, yellow, orange, red)
   * @returns {THREE.SpriteMaterial} Sprite material for ring of fire particle
   */
  getRingOfFireMaterial(colorType = 'orange') {
    const key = `ring_fire_${colorType}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const size = Math.random() < 0.5 ? 32 : 48; // Vary size for visual interest
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const center = width / 2;
        const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);

        if (colorType === 'white') {
          // Bright white-yellow core (hottest)
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.95)');
          gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        } else if (colorType === 'yellow') {
          // Bright yellow
          gradient.addColorStop(0, 'rgba(255, 255, 180, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 220, 100, 0.9)');
          gradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.7)');
          gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        } else if (colorType === 'orange') {
          // Orange flames
          gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
          gradient.addColorStop(0.6, 'rgba(255, 80, 0, 0.7)');
          gradient.addColorStop(1, 'rgba(200, 40, 0, 0)');
        } else { // red
          // Red/dark flames (cooler)
          gradient.addColorStop(0, 'rgba(255, 150, 80, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 100, 40, 0.9)');
          gradient.addColorStop(0.6, 'rgba(200, 50, 0, 0.7)');
          gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, size, size);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a cloned material so each sprite can have its own properties
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Get lightning explosion particle material with cached texture
   * @param {string} colorType - Color type (white, blue, purple)
   * @returns {THREE.SpriteMaterial} Sprite material for lightning explosion
   */
  getLightningParticleMaterial(colorType = 'blue') {
    const key = `lightning_particle_${colorType}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const center = width / 2;
        const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);

        if (colorType === 'white') {
          // White core
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.9)');
          gradient.addColorStop(0.6, 'rgba(150, 180, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        } else if (colorType === 'blue') {
          // Electric blue
          gradient.addColorStop(0, 'rgba(200, 220, 255, 1)');
          gradient.addColorStop(0.3, 'rgba(100, 150, 255, 0.8)');
          gradient.addColorStop(0.7, 'rgba(50, 100, 200, 0.4)');
          gradient.addColorStop(1, 'rgba(20, 50, 150, 0)');
        } else { // purple
          // Purple electric
          gradient.addColorStop(0, 'rgba(220, 180, 255, 1)');
          gradient.addColorStop(0.3, 'rgba(150, 100, 255, 0.8)');
          gradient.addColorStop(0.7, 'rgba(100, 50, 200, 0.4)');
          gradient.addColorStop(1, 'rgba(50, 20, 150, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, 32, 32);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a cloned material
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Get fire explosion particle material with cached texture
   * @param {number} variant - Variant number (0-4) for visual variety
   * @returns {THREE.SpriteMaterial} Sprite material for fire explosion
   */
  getFireExplosionMaterial(variant = 0) {
    const key = `fire_explosion_${variant}`;

    // Get cached texture or create new one
    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        const center = width / 2;
        const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);

        // Different color schemes for variety
        const colors = [
          ['#ffff00', '#ffaa00'],
          ['#ffaa00', '#ff6600'],
          ['#ff6600', '#ff0000'],
          ['#ff0000', '#aa0000'],
          ['#ffcc00', '#ff9900']
        ];

        const colorPair = colors[variant % colors.length];
        gradient.addColorStop(0, colorPair[0]);
        gradient.addColorStop(1, colorPair[1]);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, 32, 32);

      return new THREE.CanvasTexture(canvas);
    });

    // Return a cloned material
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Get enemy sprite material with cached texture
   * @param {string} type - Enemy type
   * @returns {THREE.SpriteMaterial} Sprite material for enemy
   */
  getEnemyMaterial(type) {
    const key = `enemy_${type}`;

    // This would need the actual enemy sprite drawing logic
    // For now, returning a basic colored sprite
    const colors = {
      bandit: '#8B4513',
      coyote: '#D2691E',
      brute: '#800000',
      gunman: '#2F4F4F',
      charger: '#B22222',
      tiny: '#DEB887',
      giant: '#4B0000'
    };

    const color = colors[type] || '#FF0000';

    const texture = this.getTexture(key, () => {
      const canvas = this.getCanvas(key, (ctx, width, height) => {
        // Simple enemy sprite for now
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(width/2, height/2, width/3, 0, Math.PI * 2);
        ctx.fill();
      }, 64, 64);

      return new THREE.CanvasTexture(canvas);
    });

    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
  }

  /**
   * Clear all caches - use sparingly
   */
  clear() {
    // Dispose of Three.js resources properly
    this.textures.forEach(texture => texture.dispose());
    this.materials.forEach(material => material.dispose());
    this.geometries.forEach(geometry => geometry.dispose());

    // Clear maps
    this.textures.clear();
    this.materials.clear();
    this.geometries.clear();
    this.sprites.clear();
    this.canvases.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      textures: this.textures.size,
      materials: this.materials.size,
      geometries: this.geometries.size,
      canvases: this.canvases.size,
      totalMemoryItems: this.textures.size + this.materials.size + this.geometries.size
    };
  }
}

// Export singleton instance
export const resourceCache = new ResourceCache();