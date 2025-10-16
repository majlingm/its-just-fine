/**
 * RenderSystem - Synchronizes Three.js meshes with ECS entity components
 *
 * This system bridges the ECS component data with Three.js visual representation.
 * It processes entities with Transform and Renderable components, creating/updating
 * their Three.js meshes and adding/removing them from the scene.
 *
 * Responsibilities:
 * - Create Three.js meshes from Renderable component data
 * - Sync mesh position/rotation/scale with Transform component
 * - Add/remove meshes from scene based on entity lifecycle
 * - Handle visibility and material updates
 *
 * Migration from v1:
 * - Replaces direct mesh management in entity classes
 * - Centralizes all rendering logic in one system
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';
import { ResourceCache } from '../../core/pooling/ResourceCache.js';
import { OptimizationConfig } from '../../config/optimization.js';
import { createShadowSilhouetteMaterial } from '../../shaders/ShadowSilhouetteShader.js';
import { modelLoader } from '../../utils/ModelLoader.js';
import { getModelPath, usesGLTFModel } from '../../config/modelMappings.js';
import * as THREE from 'three';

export class RenderSystem extends ComponentSystem {
  constructor(renderer) {
    // Require Transform and Renderable components
    super(['Transform', 'Renderable']);

    this.renderer = renderer;

    // Track which entities have meshes created
    this.meshCache = new Map(); // entityId -> mesh
    this.loadingModels = new Set(); // entityIds currently loading models
  }

  /**
   * Process entities with Transform and Renderable components
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    // First pass: remove meshes for inactive/disabled/destroyed entities
    for (const [entityId, mesh] of this.meshCache) {
      const entity = entities.find(e => e.id === entityId);

      // Remove mesh if entity doesn't exist, is inactive, or marked for removal
      if (!entity || !entity.active || entity.shouldRemove) {
        // Entity doesn't exist or is being removed, clean up mesh
        const mesh = this.meshCache.get(entityId);
        if (mesh) {
          this.renderer.removeFromScene(mesh);
          // NOTE: DO NOT dispose geometry/material - managed by ResourceCache
          this.meshCache.delete(entityId);
        }
        continue;
      }

      const renderable = entity.getComponent('Renderable');
      if (!renderable || !renderable.enabled) {
        this.removeMesh(entity);
      }
    }

    // Second pass: create/update meshes for active entities
    for (const entity of entities) {
      // Skip inactive entities
      if (!entity.active) continue;

      const transform = entity.getComponent('Transform');
      const renderable = entity.getComponent('Renderable');

      // Skip if renderable is disabled
      if (!renderable.enabled) continue;

      // Create mesh if it doesn't exist (and not currently loading)
      if (!renderable.mesh && !this.meshCache.has(entity.id) && !this.loadingModels.has(entity.id)) {
        this.createMesh(entity, transform, renderable);
      }

      // Sync mesh with components
      if (renderable.mesh) {
        this.syncMesh(entity, transform, renderable);
      }
    }
  }

  /**
   * Create a Three.js mesh from component data
   * @param {Entity} entity - Entity to create mesh for
   * @param {Transform} transform - Transform component
   * @param {Renderable} renderable - Renderable component
   */
  async createMesh(entity, transform, renderable) {
    // Check if this model type uses a GLTF model
    if (usesGLTFModel(renderable.modelType)) {
      await this.createGLTFMesh(entity, transform, renderable);
      return;
    }

    let geometry;

    // Use ResourceCache if enabled, otherwise create directly
    const useCache = OptimizationConfig.resourceCaching.enabled;

    // Get cached geometry based on modelType
    // Map enemy-specific model types to actual geometries
    switch (renderable.modelType) {
      // Basic geometric shapes
      case 'cube':
        geometry = useCache ?
          ResourceCache.getGeometry('box', { width: 1, height: 1, depth: 1 }) :
          new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = useCache ?
          ResourceCache.getGeometry('sphere', { radius: 0.5, widthSegments: 32, heightSegments: 32 }) :
          new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = useCache ?
          ResourceCache.getGeometry('cylinder', { radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 32 }) :
          new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'cone':
        geometry = useCache ?
          ResourceCache.getGeometry('cone', { radius: 0.5, height: 1, radialSegments: 32 }) :
          new THREE.ConeGeometry(0.5, 1, 32);
        break;

      // Enemy-specific models (map to appropriate geometries)
      case 'shadow':
      case 'knight':
      case 'hound':
        // Humanoid/creature enemies - use box for now (TODO: add capsule to ResourceCache)
        geometry = useCache ?
          ResourceCache.getGeometry('box', { width: 0.6, height: 1.6, depth: 0.6 }) :
          new THREE.BoxGeometry(0.6, 1.6, 0.6);
        break;

      case 'crystal':
      case 'golem':
        // Blocky/crystalline enemies - use box
        geometry = useCache ?
          ResourceCache.getGeometry('box', { width: 1, height: 1, depth: 1 }) :
          new THREE.BoxGeometry(1, 1, 1);
        break;

      case 'flame':
      case 'wisp':
      case 'lightning':
        // Energy/elemental enemies - use sphere
        geometry = useCache ?
          ResourceCache.getGeometry('sphere', { radius: 0.5, widthSegments: 16, heightSegments: 12 }) :
          new THREE.SphereGeometry(0.5, 16, 12);
        break;

      case 'void':
        // Void enemies - use sphere
        geometry = useCache ?
          ResourceCache.getGeometry('sphere', { radius: 0.5, widthSegments: 16, heightSegments: 16 }) :
          new THREE.SphereGeometry(0.5, 16, 16);
        break;

      case 'frost':
        // Frost enemies - use box (TODO: add dodecahedron to ResourceCache)
        geometry = useCache ?
          ResourceCache.getGeometry('box', { width: 1, height: 1, depth: 1 }) :
          new THREE.BoxGeometry(1, 1, 1);
        break;

      case 'custom':
        // Custom geometry from geometryData
        if (renderable.geometryData) {
          geometry = renderable.geometryData;
        } else {
          console.warn(`Entity ${entity.id}: custom modelType but no geometryData provided`);
          geometry = useCache ?
            ResourceCache.getGeometry('box', { width: 1, height: 1, depth: 1 }) :
            new THREE.BoxGeometry(1, 1, 1);
        }
        break;

      case 'shader':
        // Shader-based enemies (shadow/light types) - will be handled specially below
        // Use plane geometry for shader enemies
        if (renderable.shaderConfig) {
          const config = renderable.shaderConfig;
          const segments = 64; // Match v1's segment count
          geometry = new THREE.PlaneGeometry(
            config.width || 2.5,
            config.height || 4.0,
            segments,
            segments
          );
        } else {
          console.warn(`Entity ${entity.id}: shader modelType but no shaderConfig provided`);
          geometry = new THREE.PlaneGeometry(2.5, 4.0, 64, 64);
        }
        break;

      default:
        console.warn(`Entity ${entity.id}: unknown modelType "${renderable.modelType}", using sphere`);
        geometry = useCache ?
          ResourceCache.getGeometry('sphere', { radius: 0.5, widthSegments: 16, heightSegments: 16 }) :
          new THREE.SphereGeometry(0.5, 16, 16);
    }

    // Create material based on model type
    let material;

    if (renderable.modelType === 'shader' && renderable.shaderConfig) {
      // Create shader material for shadow/light enemies
      const config = renderable.shaderConfig;
      const fuzzyAmount = 0.6; // Default fuzzy amount

      material = createShadowSilhouetteMaterial(
        config.eyeColor,
        fuzzyAmount,
        config.eyeSize,
        config.flowSpeed,
        config.flowAmp,
        config.waveCount,
        config.waveType,
        config.shapeType,
        config.baseColor,
        config.gradientColor,
        config.isCrawler || false,
        config.outlineColor,
        config.outlineWidth
      );
    } else {
      // Get cached material or create new one
      const materialKey = `${renderable.modelType}_${renderable.color}_${renderable.emissive}`;
      material = useCache ?
        ResourceCache.getMaterial(materialKey, {
          color: renderable.color,
          emissive: renderable.emissive,
          metalness: renderable.metalness,
          roughness: renderable.roughness,
          transparent: renderable.transparent,
          opacity: renderable.opacity
        }) :
        new THREE.MeshStandardMaterial({
          color: renderable.color,
          emissive: renderable.emissive,
          metalness: renderable.metalness,
          roughness: renderable.roughness,
          transparent: renderable.transparent,
          opacity: renderable.opacity
        });
    }

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Set mesh properties
    mesh.castShadow = renderable.castShadow;
    mesh.receiveShadow = renderable.receiveShadow;
    mesh.visible = renderable.visible;
    mesh.frustumCulled = renderable.frustumCulled;
    mesh.renderOrder = renderable.renderOrder;

    // Set initial transform
    mesh.position.set(transform.x, transform.y, transform.z);
    mesh.rotation.set(transform.rotationX, transform.rotationY, transform.rotationZ);
    mesh.scale.set(transform.scaleX, transform.scaleY, transform.scaleZ);

    // Special handling for shader-based enemies
    if (renderable.modelType === 'shader' && renderable.shaderConfig) {
      const config = renderable.shaderConfig;
      // Position at correct height (half of height for standing, close to ground for crawlers)
      if (config.isCrawler) {
        mesh.position.y = config.height / 2;
        mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
      } else {
        mesh.position.y = config.height / 2;
        // Standing enemies will be billboarded in syncMesh
      }
    }

    // Store mesh reference in component
    renderable.mesh = mesh;

    // Cache mesh
    this.meshCache.set(entity.id, mesh);

    // Add to scene
    this.renderer.addToScene(mesh);
  }

  /**
   * Create a GLTF model mesh synchronously (for pre-loading before entity is added)
   * @param {Entity} entity - Entity to create mesh for
   * @param {Transform} transform - Transform component
   * @param {Renderable} renderable - Renderable component
   */
  async createGLTFMeshSync(entity, transform, renderable) {
    return this.createGLTFMesh(entity, transform, renderable);
  }

  /**
   * Create a GLTF model mesh
   * @param {Entity} entity - Entity to create mesh for
   * @param {Transform} transform - Transform component
   * @param {Renderable} renderable - Renderable component
   */
  async createGLTFMesh(entity, transform, renderable) {
    const modelPath = getModelPath(renderable.modelType);

    if (!modelPath) {
      console.warn(`No model path found for modelType: ${renderable.modelType}`);
      return;
    }

    // Mark entity as loading
    this.loadingModels.add(entity.id);

    try {
      // For player, use the original scene directly (no cloning needed since there's only one)
      // For enemies/other entities, clone using SkeletonUtils for proper deep cloning
      let modelScene, animations;
      if (renderable.modelType === 'player') {
        const gltf = await modelLoader.load(modelPath);
        modelScene = gltf.scene;
        animations = gltf.animations;
      } else {
        modelScene = await modelLoader.clone(modelPath);
        // TODO: Clone animations for enemies if needed
      }

      // Check if entity still exists (might have been removed while loading)
      if (!entity.active) {
        this.loadingModels.delete(entity.id);
        return;
      }

      // Player model scale
      const modelScale = renderable.modelType === 'player' ? 1 : 1;

      // Store model scale in renderable component so it persists during sync
      renderable.modelScale = modelScale;

      // Set initial transform
      modelScene.position.set(transform.x, transform.y, transform.z);
      modelScene.scale.set(transform.scaleX * modelScale, transform.scaleY * modelScale, transform.scaleZ * modelScale);

      // Set initial rotation from transform
      modelScene.rotation.set(transform.rotationX, transform.rotationY, transform.rotationZ);

      // Apply shadow settings to all meshes in the model
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = renderable.castShadow;
          child.receiveShadow = renderable.receiveShadow;
        }
      });

      // Store mesh reference in component
      renderable.mesh = modelScene;

      // Set up animations if they exist
      if (animations && animations.length > 0) {
        const animationComponent = entity.getComponent('Animation');
        if (animationComponent) {
          const mixer = new THREE.AnimationMixer(modelScene);
          animationComponent.setAnimations(mixer, animations);
          console.log(`✅ Loaded ${animations.length} animations for ${renderable.modelType}`);
        }
      }

      // Cache mesh
      this.meshCache.set(entity.id, modelScene);

      // Add to scene
      this.renderer.addToScene(modelScene);

    } catch (error) {
      console.error(`Failed to load model for entity ${entity.id}:`, error);
    } finally {
      this.loadingModels.delete(entity.id);
    }
  }

  /**
   * Sync mesh transform and properties with component data
   * @param {Entity} entity - Entity
   * @param {Transform} transform - Transform component
   * @param {Renderable} renderable - Renderable component
   */
  syncMesh(entity, transform, renderable) {
    const mesh = renderable.mesh;

    // Update position
    mesh.position.set(transform.x, transform.y, transform.z);

    // Update rotation directly from transform
    mesh.rotation.set(transform.rotationX, transform.rotationY, transform.rotationZ);

    // Update scale (apply model scale multiplier to preserve GLTF model scaling)
    const modelScale = renderable.modelScale || 1;
    mesh.scale.set(transform.scaleX * modelScale, transform.scaleY * modelScale, transform.scaleZ * modelScale);

    // Update material properties if changed (only for standard materials, not shader materials)
    if (mesh.material && renderable.modelType !== 'shader') {
      mesh.material.color.setHex(renderable.color);
      mesh.material.emissive.setHex(renderable.emissive);
      mesh.material.metalness = renderable.metalness;
      mesh.material.roughness = renderable.roughness;
      mesh.material.opacity = renderable.opacity;
      mesh.material.transparent = renderable.transparent;
    }

    // Update visibility
    mesh.visible = renderable.visible;

    // Update shadow properties
    mesh.castShadow = renderable.castShadow;
    mesh.receiveShadow = renderable.receiveShadow;

    // Update render order
    mesh.renderOrder = renderable.renderOrder;

    // Special handling for shader-based enemies
    if (renderable.modelType === 'shader' && renderable.shaderConfig) {
      const config = renderable.shaderConfig;

      // Update shader time uniform for animation
      if (mesh.material.uniforms && mesh.material.uniforms.time) {
        mesh.material.uniforms.time.value = performance.now() * 0.001;
      }

      // Billboard behavior for non-crawler enemies (make them face the camera)
      if (!config.isCrawler && this.renderer.camera) {
        mesh.lookAt(this.renderer.camera.position);
      }
    }
  }

  /**
   * Remove mesh from scene and clean up
   * @param {Entity} entity - Entity to remove mesh from
   */
  removeMesh(entity) {
    const mesh = this.meshCache.get(entity.id);
    if (mesh) {
      // Remove from scene
      this.renderer.removeFromScene(mesh);

      // NOTE: DO NOT dispose geometry/material here!
      // They are managed by ResourceCache and shared across entities

      // Remove from cache
      this.meshCache.delete(entity.id);

      // Clear renderable reference
      const renderable = entity.getComponent('Renderable');
      if (renderable) {
        renderable.mesh = null;
      }
    }
  }

  /**
   * Clean up all meshes
   */
  cleanup() {
    for (const [entityId, mesh] of this.meshCache) {
      this.renderer.removeFromScene(mesh);
      // NOTE: DO NOT dispose geometry/material - managed by ResourceCache
    }

    this.meshCache.clear();

    // Clear the ResourceCache (this disposes all shared resources)
    ResourceCache.clear();
  }

  /**
   * Handle entity removal
   * @param {Entity} entity - Entity being removed
   */
  onEntityRemoved(entity) {
    this.removeMesh(entity);
  }
}
