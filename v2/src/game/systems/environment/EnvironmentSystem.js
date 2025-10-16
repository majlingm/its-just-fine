import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GroundSystem } from './GroundSystem.js';

/**
 * EnvironmentSystem - Manages complete environment setup
 *
 * Orchestrates ground, lighting, objects, boundaries, and atmospheric effects.
 * Loads environment configurations and creates the game world.
 */
export class EnvironmentSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.groundSystem = new GroundSystem(renderer);
    this.gltfLoader = new GLTFLoader();

    // Environment state
    this.currentEnvironment = null;
    this.objects = [];
    this.lights = [];
    this.boundaries = null;
  }

  /**
   * Load and create environment from config
   * @param {Object} environmentConfig - Environment configuration
   * @returns {Promise} Resolves when environment is fully loaded
   */
  async load(environmentConfig) {
    // Cleanup existing environment
    this.cleanup();

    this.currentEnvironment = environmentConfig;

    // Create ground
    if (environmentConfig.ground) {
      this.groundSystem.create(environmentConfig.ground);
    }

    // Setup lighting
    if (environmentConfig.lighting) {
      this.setupLighting(environmentConfig.lighting);
    }

    // Setup fog
    if (environmentConfig.fog && environmentConfig.fog.enabled) {
      this.setupFog(environmentConfig.fog);
    }

    // Load and place objects
    if (environmentConfig.objects && environmentConfig.objects.length > 0) {
      await this.loadObjects(environmentConfig.objects);
    }

    // Store boundaries
    if (environmentConfig.boundaries) {
      this.boundaries = environmentConfig.boundaries;
    }

    return this.currentEnvironment;
  }

  /**
   * Setup all lighting from config
   * @param {Object} lightingConfig - Lighting configuration
   */
  setupLighting(lightingConfig) {
    const { background, ambient, sun, fill, hemisphere } = lightingConfig;

    // Set background color
    if (background !== undefined) {
      this.renderer.scene.background = new THREE.Color(background);
    }

    // Ambient light
    if (ambient) {
      const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
      this.renderer.addToScene(ambientLight);
      this.lights.push(ambientLight);
    }

    // Directional light (sun)
    if (sun) {
      const directionalLight = new THREE.DirectionalLight(sun.color, sun.intensity);

      if (sun.position) {
        directionalLight.position.set(sun.position.x, sun.position.y, sun.position.z);
      }

      if (sun.castShadow) {
        directionalLight.castShadow = true;

        const shadowMapSize = sun.shadowMapSize || 2048;
        directionalLight.shadow.mapSize.width = shadowMapSize;
        directionalLight.shadow.mapSize.height = shadowMapSize;

        // Setup shadow camera
        const shadowCameraSize = 100;
        directionalLight.shadow.camera.left = -shadowCameraSize;
        directionalLight.shadow.camera.right = shadowCameraSize;
        directionalLight.shadow.camera.top = shadowCameraSize;
        directionalLight.shadow.camera.bottom = -shadowCameraSize;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
      }

      this.renderer.addToScene(directionalLight);
      this.lights.push(directionalLight);
    }

    // Fill light
    if (fill) {
      const fillLight = new THREE.DirectionalLight(fill.color, fill.intensity);
      if (fill.position) {
        fillLight.position.set(fill.position.x, fill.position.y, fill.position.z);
      }
      this.renderer.addToScene(fillLight);
      this.lights.push(fillLight);
    }

    // Hemisphere light
    if (hemisphere) {
      const hemisphereLight = new THREE.HemisphereLight(
        hemisphere.sky,
        hemisphere.ground,
        hemisphere.intensity
      );
      this.renderer.addToScene(hemisphereLight);
      this.lights.push(hemisphereLight);
    }
  }

  /**
   * Setup fog from config
   * @param {Object} fogConfig - Fog configuration
   */
  setupFog(fogConfig) {
    const { color, near, far } = fogConfig;
    this.renderer.scene.fog = new THREE.Fog(color, near, far);
  }

  /**
   * Load and place all objects from config
   * @param {Array} objectsConfig - Array of object configurations
   * @returns {Promise} Resolves when all objects are loaded
   */
  async loadObjects(objectsConfig) {
    const loadPromises = objectsConfig.map(objConfig => this.loadObject(objConfig));
    await Promise.all(loadPromises);
  }

  /**
   * Load a single object from config
   * @param {Object} objConfig - Object configuration
   * @returns {Promise} Resolves when object is loaded
   */
  loadObject(objConfig) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        objConfig.asset,
        (gltf) => {
          const object = gltf.scene;

          // Apply transformations
          if (objConfig.position) {
            object.position.set(
              objConfig.position.x,
              objConfig.position.y,
              objConfig.position.z
            );
          }

          if (objConfig.rotation) {
            object.rotation.set(
              objConfig.rotation.x,
              objConfig.rotation.y,
              objConfig.rotation.z
            );
          }

          if (objConfig.scale) {
            object.scale.set(
              objConfig.scale.x,
              objConfig.scale.y,
              objConfig.scale.z
            );
          }

          // Set shadow properties
          if (objConfig.castShadow !== undefined) {
            object.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = objConfig.castShadow;
              }
            });
          }

          if (objConfig.receiveShadow !== undefined) {
            object.traverse((child) => {
              if (child.isMesh) {
                child.receiveShadow = objConfig.receiveShadow;
              }
            });
          }

          // Store metadata
          object.userData.id = objConfig.id;
          object.userData.solid = objConfig.solid !== undefined ? objConfig.solid : false;

          // Store collider info if provided
          if (objConfig.collider) {
            object.userData.collider = objConfig.collider;
          }

          // Add to scene
          this.renderer.addToScene(object);
          this.objects.push(object);

          resolve(object);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load object ${objConfig.id} from ${objConfig.asset}:`, error);
          // Don't reject - just skip this object and continue
          resolve(null);
        }
      );
    });
  }

  /**
   * Get all solid objects with collision
   * @returns {Array} Array of solid objects with collider data
   */
  getSolidObjects() {
    return this.objects.filter(obj => obj.userData.solid);
  }

  /**
   * Get boundaries configuration
   * @returns {Object} Boundary limits
   */
  getBoundaries() {
    return this.boundaries || {
      type: 'box',
      minX: -100,
      maxX: 100,
      minZ: -100,
      maxZ: 100,
      height: 50,
      killPlane: -10
    };
  }

  /**
   * Check if position is within boundaries
   * @param {THREE.Vector3} position - Position to check
   * @returns {boolean} True if within boundaries
   */
  isWithinBoundaries(position) {
    const bounds = this.getBoundaries();

    if (bounds.type === 'box') {
      return position.x >= bounds.minX &&
             position.x <= bounds.maxX &&
             position.z >= bounds.minZ &&
             position.z <= bounds.maxZ;
    }

    if (bounds.type === 'circle') {
      const distance = Math.sqrt(position.x * position.x + position.z * position.z);
      return distance <= bounds.radius;
    }

    return true;
  }

  /**
   * Check if position is below kill plane
   * @param {THREE.Vector3} position - Position to check
   * @returns {boolean} True if below kill plane
   */
  isBelowKillPlane(position) {
    const bounds = this.getBoundaries();
    return position.y < (bounds.killPlane || -10);
  }

  /**
   * Get ground physics properties
   * @returns {Object} Friction and restitution
   */
  getGroundPhysics() {
    return this.groundSystem.getPhysicsProperties();
  }

  /**
   * Clean up environment
   */
  cleanup() {
    // Cleanup ground
    this.groundSystem.cleanup();

    // Remove all objects
    this.objects.forEach(obj => {
      this.renderer.removeFromScene(obj);
      obj.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.objects = [];

    // Remove all lights
    this.lights.forEach(light => {
      this.renderer.removeFromScene(light);
    });
    this.lights = [];

    // Clear fog
    this.renderer.scene.fog = null;

    // Reset state
    this.currentEnvironment = null;
    this.boundaries = null;
  }
}
