import * as THREE from 'three';

/**
 * GroundSystem - Manages ground plane and terrain
 *
 * Creates and manages the ground surface based on environment configuration.
 * Supports simple planes, textured terrains, and heightmap-based terrain.
 */
export class GroundSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.ground = null;
  }

  /**
   * Create ground from environment config
   * @param {Object} groundConfig - Ground configuration from environment
   */
  create(groundConfig) {
    // Remove existing ground if any
    if (this.ground) {
      this.renderer.removeFromScene(this.ground);
      this.ground = null;
    }

    const {
      type = 'plane',
      size = 200,
      texture = null,
      normalMap = null,
      color = 0x4a7c3b,
      receiveShadow = true,
      properties = {}
    } = groundConfig;

    let geometry;

    if (type === 'terrain' && groundConfig.heightmap) {
      // Heightmap terrain (future implementation)
      geometry = new THREE.PlaneGeometry(size, size, 128, 128);
      // TODO: Apply heightmap displacement
    } else {
      // Simple plane
      geometry = new THREE.PlaneGeometry(size, size);
    }

    // Create checkered pattern texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Draw solid black ground
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const checkerTexture = new THREE.CanvasTexture(canvas);
    checkerTexture.wrapS = THREE.RepeatWrapping;
    checkerTexture.wrapT = THREE.RepeatWrapping;
    checkerTexture.repeat.set(10, 10);

    // Create material with checker pattern
    const material = new THREE.MeshStandardMaterial({
      map: checkerTexture,
      roughness: 0.8,
      metalness: 0.2
    });

    // Load custom texture if provided (overrides checker pattern)
    if (texture) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(texture, (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(20, 20);
        material.map = loadedTexture;
        material.needsUpdate = true;
      });
    }

    // Load normal map if provided
    if (normalMap) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(normalMap, (loadedNormalMap) => {
        loadedNormalMap.wrapS = THREE.RepeatWrapping;
        loadedNormalMap.wrapT = THREE.RepeatWrapping;
        loadedNormalMap.repeat.set(20, 20);
        material.normalMap = loadedNormalMap;
        material.needsUpdate = true;
      });
    }

    // Create mesh
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2; // Lay flat
    this.ground.position.y = 0;
    this.ground.receiveShadow = receiveShadow;

    // Store physics properties for later use
    this.ground.userData.friction = properties.friction || 0.8;
    this.ground.userData.restitution = properties.restitution || 0.0;

    // Add to scene
    this.renderer.addToScene(this.ground);

    return this.ground;
  }

  /**
   * Get ground physics properties
   * @returns {Object} Friction and restitution values
   */
  getPhysicsProperties() {
    if (!this.ground) return { friction: 0.8, restitution: 0.0 };
    return {
      friction: this.ground.userData.friction,
      restitution: this.ground.userData.restitution
    };
  }

  /**
   * Clean up ground
   */
  cleanup() {
    if (this.ground) {
      this.renderer.removeFromScene(this.ground);
      this.ground.geometry.dispose();
      this.ground.material.dispose();
      this.ground = null;
    }
  }
}
