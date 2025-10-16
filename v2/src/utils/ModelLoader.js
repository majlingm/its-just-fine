import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * ModelLoader - Centralized model loading with caching
 *
 * Handles loading and caching of GLTF models for enemies and other entities.
 * Models are cached after first load to avoid repeated network requests.
 */
export class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map(); // path -> Promise<GLTF>
    this.models = new Map(); // path -> GLTF
  }

  /**
   * Load a GLTF model
   * @param {string} path - Path to the model file
   * @returns {Promise<Object>} GLTF object
   */
  async load(path) {
    // Return cached model if available
    if (this.models.has(path)) {
      return this.models.get(path);
    }

    // Return in-progress load if available
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    // Start new load
    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          this.models.set(path, gltf);
          this.cache.delete(path);
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.error(`Failed to load model: ${path}`, error);
          this.cache.delete(path);
          reject(error);
        }
      );
    });

    this.cache.set(path, loadPromise);
    return loadPromise;
  }

  /**
   * Clone a loaded model's scene with proper deep cloning
   * Uses SkeletonUtils to properly clone skeletal animations and hierarchies
   * @param {string} path - Path to the model
   * @returns {Promise<Object3D>} Deep cloned scene
   */
  async clone(path) {
    const gltf = await this.load(path);
    // Use SkeletonUtils for proper deep cloning that preserves skeletal animations
    return SkeletonUtils.clone(gltf.scene);
  }

  /**
   * Clear all cached models
   */
  clear() {
    this.models.clear();
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      loaded: this.models.size,
      loading: this.cache.size
    };
  }
}

// Singleton instance
export const modelLoader = new ModelLoader();
