import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * ModelLoader - Centralized model loading with caching
 *
 * Handles loading and caching of GLTF and FBX models for enemies and other entities.
 * Models are cached after first load to avoid repeated network requests.
 */
export class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.cache = new Map(); // path -> Promise<Model>
    this.models = new Map(); // path -> Model
  }

  /**
   * Load a model (GLTF or FBX)
   * @param {string} path - Path to the model file
   * @returns {Promise<Object>} Model object with scene and animations
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

    // Determine loader based on file extension
    const isFBX = path.toLowerCase().endsWith('.fbx');
    const loader = isFBX ? this.fbxLoader : this.gltfLoader;

    // Start new load
    const loadPromise = new Promise((resolve, reject) => {
      loader.load(
        path,
        (result) => {
          // Normalize the result format
          let model;
          if (isFBX) {
            // FBX loader returns the scene directly
            model = {
              scene: result,
              animations: result.animations || []
            };
          } else {
            // GLTF loader returns an object with scene and animations
            model = result;
          }

          this.models.set(path, model);
          this.cache.delete(path);
          resolve(model);
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
