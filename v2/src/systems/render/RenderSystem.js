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
        // Entity doesn't exist or is being removed, clean up mesh directly
        const mesh = this.meshCache.get(entityId);
        if (mesh) {
          this.renderer.removeFromScene(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
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

    // Create geometry based on modelType
    // Map enemy-specific model types to actual geometries
    switch (renderable.modelType) {
      // Basic geometric shapes
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        break;

      // Enemy-specific models (map to appropriate geometries)
      case 'shadow':
      case 'knight':
      case 'hound':
        // Humanoid/creature enemies - use capsule-like shape
        geometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
        break;

      case 'crystal':
      case 'golem':
        // Blocky/crystalline enemies - use octahedron
        geometry = new THREE.OctahedronGeometry(0.5, 0);
        break;

      case 'flame':
      case 'wisp':
      case 'lightning':
        // Energy/elemental enemies - use icosahedron (more organic)
        geometry = new THREE.IcosahedronGeometry(0.5, 1);
        break;

      case 'void':
        // Void enemies - use sphere
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        break;

      case 'frost':
        // Frost enemies - use dodecahedron (icy crystal)
        geometry = new THREE.DodecahedronGeometry(0.5, 0);
        break;

      case 'custom':
        // Custom geometry from geometryData
        if (renderable.geometryData) {
          geometry = renderable.geometryData;
        } else {
          console.warn(`Entity ${entity.id}: custom modelType but no geometryData provided`);
          geometry = new THREE.BoxGeometry(1, 1, 1); // Fallback
        }
        break;

      default:
        console.warn(`Entity ${entity.id}: unknown modelType "${renderable.modelType}", using sphere`);
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
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

      // Dispose geometry and material
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }

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

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }

    this.meshCache.clear();
  }

  /**
   * Handle entity removal
   * @param {Entity} entity - Entity being removed
   */
  onEntityRemoved(entity) {
    this.removeMesh(entity);
  }
}
