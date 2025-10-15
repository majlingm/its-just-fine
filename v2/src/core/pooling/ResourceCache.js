/**
 * ResourceCache - Singleton cache for Three.js resources
 *
 * Prevents creating duplicate materials, geometries, and textures.
 * Dramatically reduces memory usage and GPU overhead.
 *
 * Usage:
 * ```javascript
 * const material = ResourceCache.getMaterial('enemy', { color: 0x00ff00 });
 * const geometry = ResourceCache.getGeometry('sphere', { radius: 1 });
 * ```
 */

import * as THREE from 'three';

class ResourceCacheClass {
  constructor() {
    // Caches
    this.materials = new Map(); // key -> material
    this.geometries = new Map(); // key -> geometry
    this.textures = new Map(); // key -> texture

    // Statistics
    this.stats = {
      materialsCreated: 0,
      materialsReused: 0,
      geometriesCreated: 0,
      geometriesReused: 0,
      texturesCreated: 0,
      texturesReused: 0
    };
  }

  /**
   * Get or create a material
   * @param {string} key - Unique cache key
   * @param {Object} config - Material configuration
   * @returns {THREE.Material} Cached or new material
   */
  getMaterial(key, config = {}) {
    if (this.materials.has(key)) {
      this.stats.materialsReused++;
      return this.materials.get(key);
    }

    // Create new material
    const material = new THREE.MeshStandardMaterial({
      color: config.color || 0xffffff,
      emissive: config.emissive || 0x000000,
      metalness: config.metalness !== undefined ? config.metalness : 0.3,
      roughness: config.roughness !== undefined ? config.roughness : 0.7,
      transparent: config.transparent || false,
      opacity: config.opacity !== undefined ? config.opacity : 1.0,
      side: config.side || THREE.FrontSide,
      ...config
    });

    this.materials.set(key, material);
    this.stats.materialsCreated++;

    return material;
  }

  /**
   * Get or create a geometry
   * @param {string} type - Geometry type (sphere, box, plane, etc.)
   * @param {Object} params - Geometry parameters
   * @returns {THREE.BufferGeometry} Cached or new geometry
   */
  getGeometry(type, params = {}) {
    const key = `${type}_${JSON.stringify(params)}`;

    if (this.geometries.has(key)) {
      this.stats.geometriesReused++;
      return this.geometries.get(key);
    }

    let geometry;

    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          params.radius || 1,
          params.widthSegments || 16,
          params.heightSegments || 12
        );
        break;

      case 'box':
        geometry = new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1
        );
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(
          params.width || 1,
          params.height || 1
        );
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          params.radiusTop || 1,
          params.radiusBottom || 1,
          params.height || 1,
          params.radialSegments || 16
        );
        break;

      case 'cone':
        geometry = new THREE.ConeGeometry(
          params.radius || 1,
          params.height || 1,
          params.radialSegments || 16
        );
        break;

      default:
        console.warn(`Unknown geometry type: ${type}`);
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    this.geometries.set(key, geometry);
    this.stats.geometriesCreated++;

    return geometry;
  }

  /**
   * Get or create a texture
   * @param {string} key - Unique cache key
   * @param {Function} createFn - Function to create texture
   * @returns {THREE.Texture} Cached or new texture
   */
  getTexture(key, createFn) {
    if (this.textures.has(key)) {
      this.stats.texturesReused++;
      return this.textures.get(key);
    }

    const texture = createFn();
    this.textures.set(key, texture);
    this.stats.texturesCreated++;

    return texture;
  }

  /**
   * Get a projectile material by color
   * @param {number} color - Hex color
   * @returns {THREE.Material} Material for projectile
   */
  getProjectileMaterial(color) {
    return this.getMaterial(`projectile_${color}`, {
      color: color,
      emissive: color,
      metalness: 0.8,
      roughness: 0.2,
      transparent: false
    });
  }

  /**
   * Get a particle material by color
   * @param {number} color - Hex color
   * @returns {THREE.Material} Material for particle
   */
  getParticleMaterial(color) {
    return this.getMaterial(`particle_${color}`, {
      color: color,
      emissive: color,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 1.0
    });
  }

  /**
   * Get an enemy material by color
   * @param {number} color - Hex color
   * @returns {THREE.Material} Material for enemy
   */
  getEnemyMaterial(color) {
    return this.getMaterial(`enemy_${color}`, {
      color: color,
      emissive: Math.floor(color * 0.3),
      metalness: 0.3,
      roughness: 0.7
    });
  }

  /**
   * Clear a specific cache entry
   * @param {string} type - Cache type (materials, geometries, textures)
   * @param {string} key - Cache key
   */
  clearEntry(type, key) {
    const cache = this[type];
    if (!cache) return;

    const resource = cache.get(key);
    if (resource && resource.dispose) {
      resource.dispose();
    }
    cache.delete(key);
  }

  /**
   * Clear all caches and dispose resources
   */
  clear() {
    // Dispose materials
    for (const material of this.materials.values()) {
      if (material.dispose) {
        material.dispose();
      }
    }
    this.materials.clear();

    // Dispose geometries
    for (const geometry of this.geometries.values()) {
      if (geometry.dispose) {
        geometry.dispose();
      }
    }
    this.geometries.clear();

    // Dispose textures
    for (const texture of this.textures.values()) {
      if (texture.dispose) {
        texture.dispose();
      }
    }
    this.textures.clear();

    // Reset stats
    this.stats = {
      materialsCreated: 0,
      materialsReused: 0,
      geometriesCreated: 0,
      geometriesReused: 0,
      texturesCreated: 0,
      texturesReused: 0
    };
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      ...this.stats,
      materialsCached: this.materials.size,
      geometriesCached: this.geometries.size,
      texturesCached: this.textures.size,
      totalCached: this.materials.size + this.geometries.size + this.textures.size,
      materialReuseRate: this.stats.materialsCreated > 0
        ? ((this.stats.materialsReused / (this.stats.materialsCreated + this.stats.materialsReused)) * 100).toFixed(1) + '%'
        : '0%',
      geometryReuseRate: this.stats.geometriesCreated > 0
        ? ((this.stats.geometriesReused / (this.stats.geometriesCreated + this.stats.geometriesReused)) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

// Export singleton instance
export const ResourceCache = new ResourceCacheClass();
