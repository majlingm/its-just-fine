import { Component } from '../ecs/Component.js';

/**
 * Transform Component
 * Represents position, rotation, and scale in 3D space
 */
export class Transform extends Component {
  constructor() {
    super();

    // Position
    this.x = 0;
    this.y = 0;
    this.z = 0;

    // Rotation (euler angles in radians)
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationZ = 0;

    // Scale
    this.scaleX = 1;
    this.scaleY = 1;
    this.scaleZ = 1;
  }

  /**
   * Set position
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Set rotation
   * @param {number} x - Rotation around X axis (radians)
   * @param {number} y - Rotation around Y axis (radians)
   * @param {number} z - Rotation around Z axis (radians)
   */
  setRotation(x, y, z) {
    this.rotationX = x;
    this.rotationY = y;
    this.rotationZ = z;
  }

  /**
   * Set uniform scale
   * @param {number} scale - Uniform scale factor
   */
  setScale(scale) {
    this.scaleX = scale;
    this.scaleY = scale;
    this.scaleZ = scale;
  }

  /**
   * Set non-uniform scale
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setScaleXYZ(x, y, z) {
    this.scaleX = x;
    this.scaleY = y;
    this.scaleZ = z;
  }
}
