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