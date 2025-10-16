/**
 * CameraSystem - Generic, highly configurable camera system for the engine
 *
 * This is engine-level functionality, not game-specific.
 * Provides a flexible camera that can be controlled by game code.
 *
 * Responsibilities:
 * - Position camera based on configuration
 * - Follow targets with smoothing
 * - Handle multiple camera modes (perspective, orthographic)
 * - Provide camera positioning utilities
 *
 * Does NOT:
 * - Handle input (that's game-specific)
 * - Make game decisions (that's game-specific)
 */
export class CameraSystem {
  constructor(camera, config = {}) {
    this.camera = camera;

    // Camera configuration
    this.config = {
      // Camera angles
      horizontalAngle: config.horizontalAngle || 0,
      verticalAngle: config.verticalAngle || 0.5,

      // Distance from target
      distance: config.distance || 10,

      // Position multipliers
      heightMultiplier: config.heightMultiplier || 2.0,
      radiusMultiplier: config.radiusMultiplier || 0.5,

      // Smoothing
      smoothing: config.smoothing !== undefined ? config.smoothing : 0.1,

      // Limits
      verticalMin: config.verticalMin || 0.1,
      verticalMax: config.verticalMax || 0.9,
      distanceMin: config.distanceMin || 2,
      distanceMax: config.distanceMax || 50,

      ...config
    };

    // Current state
    this.target = { x: 0, y: 0, z: 0 };
    this.currentPosition = { x: 0, y: 0, z: 0 };
    this.currentLookAt = { x: 0, y: 0, z: 0 };

    // Initialize camera position
    this.updateCameraPosition(0);
  }

  /**
   * Set target to follow
   * @param {Object} target - {x, y, z}
   */
  setTarget(target) {
    this.target.x = target.x || 0;
    this.target.y = target.y || 0;
    this.target.z = target.z || 0;
  }

  /**
   * Set camera angles
   * @param {number} horizontal - Horizontal angle in radians
   * @param {number} vertical - Vertical angle (0-1, 0=top-down, 1=horizontal)
   */
  setAngles(horizontal, vertical) {
    this.config.horizontalAngle = horizontal;
    this.config.verticalAngle = Math.max(
      this.config.verticalMin,
      Math.min(this.config.verticalMax, vertical)
    );
  }

  /**
   * Set camera distance
   * @param {number} distance - Distance from target
   */
  setDistance(distance) {
    this.config.distance = Math.max(
      this.config.distanceMin,
      Math.min(this.config.distanceMax, distance)
    );
  }

  /**
   * Adjust camera angles (relative change)
   * @param {number} deltaHorizontal - Change in horizontal angle
   * @param {number} deltaVertical - Change in vertical angle
   */
  adjustAngles(deltaHorizontal, deltaVertical) {
    this.config.horizontalAngle += deltaHorizontal;
    this.config.verticalAngle += deltaVertical;
    this.config.verticalAngle = Math.max(
      this.config.verticalMin,
      Math.min(this.config.verticalMax, this.config.verticalAngle)
    );
  }

  /**
   * Adjust camera distance (relative change)
   * @param {number} delta - Change in distance
   */
  adjustDistance(delta) {
    this.config.distance += delta;
    this.config.distance = Math.max(
      this.config.distanceMin,
      Math.min(this.config.distanceMax, this.config.distance)
    );
  }

  /**
   * Calculate desired camera position based on current config
   * @returns {Object} {x, y, z}
   */
  calculateCameraPosition() {
    const { horizontalAngle, verticalAngle, distance, heightMultiplier, radiusMultiplier } = this.config;

    // Calculate height and radius based on vertical angle
    const height = distance * (heightMultiplier - verticalAngle * (heightMultiplier - 0.5));
    const radius = distance * (radiusMultiplier + verticalAngle * (1.1 - radiusMultiplier));

    // Calculate position using horizontal angle
    const x = this.target.x + Math.sin(horizontalAngle) * radius;
    const y = height;
    const z = this.target.z + Math.cos(horizontalAngle) * radius;

    return { x, y, z };
  }

  /**
   * Update camera position and orientation
   * @param {number} dt - Delta time
   */
  updateCameraPosition(dt) {
    const desiredPosition = this.calculateCameraPosition();

    // Apply smoothing
    if (this.config.smoothing > 0) {
      const smoothFactor = Math.min(1, this.config.smoothing);
      this.currentPosition.x += (desiredPosition.x - this.currentPosition.x) * smoothFactor;
      this.currentPosition.y += (desiredPosition.y - this.currentPosition.y) * smoothFactor;
      this.currentPosition.z += (desiredPosition.z - this.currentPosition.z) * smoothFactor;

      this.currentLookAt.x += (this.target.x - this.currentLookAt.x) * smoothFactor;
      this.currentLookAt.y += (this.target.y - this.currentLookAt.y) * smoothFactor;
      this.currentLookAt.z += (this.target.z - this.currentLookAt.z) * smoothFactor;
    } else {
      this.currentPosition.x = desiredPosition.x;
      this.currentPosition.y = desiredPosition.y;
      this.currentPosition.z = desiredPosition.z;
      this.currentLookAt.x = this.target.x;
      this.currentLookAt.y = this.target.y;
      this.currentLookAt.z = this.target.z;
    }

    // Apply to camera
    this.camera.position.set(
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    );
    this.camera.lookAt(
      this.currentLookAt.x,
      this.currentLookAt.y,
      this.currentLookAt.z
    );
  }

  /**
   * Get current configuration
   * @returns {Object} Current config
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current camera state
   * @returns {Object} Current state
   */
  getState() {
    return {
      horizontalAngle: this.config.horizontalAngle,
      verticalAngle: this.config.verticalAngle,
      distance: this.config.distance,
      target: { ...this.target },
      position: { ...this.currentPosition }
    };
  }
}
