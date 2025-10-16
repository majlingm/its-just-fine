import { Component } from '../ecs/Component.js';

/**
 * Movement Component
 * Represents velocity, speed, and movement state
 */
export class Movement extends Component {
  constructor() {
    super();

    // Velocity
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;

    // Speed settings
    this.speed = 5.0; // Base movement speed
    this.maxSpeed = 10.0; // Maximum speed cap

    // Acceleration
    this.acceleration = 20.0;
    this.deceleration = 15.0;

    // Rotation speed
    this.rotationSpeed = 3.0;

    // Movement flags
    this.canMove = true;
    this.isGrounded = false;

    // Friction/drag
    this.drag = 0.9;
  }

  /**
   * Get current speed (magnitude of velocity)
   * @returns {number}
   */
  getSpeed() {
    return Math.sqrt(
      this.velocityX * this.velocityX +
      this.velocityY * this.velocityY +
      this.velocityZ * this.velocityZ
    );
  }

  /**
   * Set velocity
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setVelocity(x, y, z) {
    this.velocityX = x;
    this.velocityY = y;
    this.velocityZ = z;
  }

  /**
   * Add to velocity
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addVelocity(x, y, z) {
    this.velocityX += x;
    this.velocityY += y;
    this.velocityZ += z;
  }

  /**
   * Stop movement
   */
  stop() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }

  /**
   * Normalize velocity to max speed
   */
  capSpeed() {
    const currentSpeed = this.getSpeed();
    if (currentSpeed > this.maxSpeed) {
      const ratio = this.maxSpeed / currentSpeed;
      this.velocityX *= ratio;
      this.velocityY *= ratio;
      this.velocityZ *= ratio;
    }
  }
}
