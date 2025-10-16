import { Component } from '../ecs/Component.js';

/**
 * Renderable Component
 * Represents visual appearance (mesh, material, visibility)
 */
export class Renderable extends Component {
  constructor() {
    super();

    // Three.js mesh reference
    this.mesh = null;

    // Model/geometry info
    this.modelType = 'cube'; // 'cube', 'sphere', 'custom', 'shader', etc.
    this.geometryData = null; // Custom geometry data
    this.shaderConfig = null; // For shader-based enemies (shadow/light types)
    this.modelScale = 1; // Scale multiplier for GLTF models (applied once, preserved during sync)

    // Material properties
    this.color = 0xffffff;
    this.emissive = 0x000000;
    this.metalness = 0;
    this.roughness = 1;
    this.opacity = 1;
    this.transparent = false;

    // Visibility
    this.visible = true;
    this.castShadow = true;
    this.receiveShadow = true;

    // Rendering flags
    this.frustumCulled = true; // Use frustum culling
    this.renderOrder = 0; // Render order (lower = rendered first)

    // Animation state
    this.animationName = null;
    this.animationTime = 0;
  }

  /**
   * Show mesh
   */
  show() {
    this.visible = true;
    if (this.mesh) {
      this.mesh.visible = true;
    }
  }

  /**
   * Hide mesh
   */
  hide() {
    this.visible = false;
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }

  /**
   * Set color
   * @param {number} color - Hex color
   */
  setColor(color) {
    this.color = color;
    if (this.mesh && this.mesh.material) {
      this.mesh.material.color.setHex(color);
    }
  }

  /**
   * Set opacity
   * @param {number} opacity - 0-1
   */
  setOpacity(opacity) {
    this.opacity = opacity;
    this.transparent = opacity < 1;

    if (this.mesh && this.mesh.material) {
      this.mesh.material.opacity = opacity;
      this.mesh.material.transparent = this.transparent;
    }
  }
}
