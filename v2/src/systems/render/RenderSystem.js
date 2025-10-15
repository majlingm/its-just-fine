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
import * as THREE from 'three';

export class RenderSystem extends ComponentSystem {
  constructor(renderer) {
    // Require Transform and Renderable components
    super(['Transform', 'Renderable']);

    this.renderer = renderer;

    // Track which entities have meshes created
    this.meshCache = new Map(); // entityId -> mesh
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

      // Create mesh if it doesn't exist
      if (!renderable.mesh && !this.meshCache.has(entity.id)) {
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
  createMesh(entity, transform, renderable) {
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

      default:
        console.warn(`Entity ${entity.id}: unknown modelType "${renderable.modelType}", using sphere`);
        geometry = useCache ?
          ResourceCache.getGeometry('sphere', { radius: 0.5, widthSegments: 16, heightSegments: 16 }) :
          new THREE.SphereGeometry(0.5, 16, 16);
    }

    // Get cached material or create new one
    const materialKey = `${renderable.modelType}_${renderable.color}_${renderable.emissive}`;
    const material = useCache ?
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

    // Store mesh reference in component
    renderable.mesh = mesh;

    // Cache mesh
    this.meshCache.set(entity.id, mesh);

    // Add to scene
    this.renderer.addToScene(mesh);
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

    // Update rotation
    mesh.rotation.set(transform.rotationX, transform.rotationY, transform.rotationZ);

    // Update scale
    mesh.scale.set(transform.scaleX, transform.scaleY, transform.scaleZ);

    // Update material properties if changed
    if (mesh.material) {
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
