import { CameraConfig } from '../config/camera.js';

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

      // Dynamic zoom settings (nested in zoom config)
      dynamicZoom: config.dynamicZoom || {
        enabled: true,
        maxAngleIncrease: 0.3,
        startThreshold: 0.0
      },

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
    const { horizontalAngle, verticalAngle, distance, heightMultiplier, radiusMultiplier, distanceMin, distanceMax, dynamicZoom } = this.config;

    // Calculate zoom factor (0 = fully zoomed in, 1 = fully zoomed out)
    const zoomFactor = (distance - distanceMin) / (distanceMax - distanceMin);

    // Calculate dynamic multipliers and lookAt offset based on zoom
    let finalHeightMultiplier = heightMultiplier;
    let finalRadiusMultiplier = radiusMultiplier;
    let lookAtYOffset = 0; // How much to offset the lookAt point vertically

    if (dynamicZoom.enabled && zoomFactor < (1 - dynamicZoom.startThreshold)) {
      // Calculate how much of the effect to apply based on threshold
      const effectStrength = (1 - dynamicZoom.startThreshold - zoomFactor) / (1 - dynamicZoom.startThreshold);

      // Interpolate to third-person values when zoomed in
      // Third-person has lower height (closer to player level) and more radius (behind player)
      const targetHeightMult = dynamicZoom.zoomedHeightMult || 0.8;
      const targetRadiusMult = dynamicZoom.zoomedRadiusMult || 1.2;

      finalHeightMultiplier = heightMultiplier + (targetHeightMult - heightMultiplier) * effectStrength;
      finalRadiusMultiplier = radiusMultiplier + (targetRadiusMult - radiusMultiplier) * effectStrength;

      // Also adjust where the camera is looking - look forward instead of down at player
      // When fully zoomed in, look at a point ahead of the player at player height
      const maxLookAtOffset = dynamicZoom.zoomedLookAtYOffset || 0;
      lookAtYOffset = maxLookAtOffset * effectStrength;
    }

    // Calculate height and radius
    const height = distance * finalHeightMultiplier;
    const radius = distance * finalRadiusMultiplier;

    // Calculate position using horizontal angle
    const x = this.target.x + Math.sin(horizontalAngle) * radius;
    const y = height;
    const z = this.target.z + Math.cos(horizontalAngle) * radius;

    // Store lookAt offset for use in updateCameraPosition
    this.dynamicLookAtYOffset = lookAtYOffset;

    return { x, y, z };
  }

  /**
   * Update camera position and orientation
   * @param {number} dt - Delta time
   */
  updateCameraPosition(dt) {
    const desiredPosition = this.calculateCameraPosition();

    // Get the dynamic lookAt Y offset from calculateCameraPosition
    const lookAtYOffset = this.dynamicLookAtYOffset || 0;

    // Apply smoothing
    if (this.config.smoothing > 0) {
      const smoothFactor = Math.min(1, this.config.smoothing);
      this.currentPosition.x += (desiredPosition.x - this.currentPosition.x) * smoothFactor;
      this.currentPosition.y += (desiredPosition.y - this.currentPosition.y) * smoothFactor;
      this.currentPosition.z += (desiredPosition.z - this.currentPosition.z) * smoothFactor;

      // Apply lookAt offset - when zoomed in, look at a point above the player
      const targetLookAtY = this.target.y + lookAtYOffset;
      this.currentLookAt.x += (this.target.x - this.currentLookAt.x) * smoothFactor;
      this.currentLookAt.y += (targetLookAtY - this.currentLookAt.y) * smoothFactor;
      this.currentLookAt.z += (this.target.z - this.currentLookAt.z) * smoothFactor;
    } else {
      this.currentPosition.x = desiredPosition.x;
      this.currentPosition.y = desiredPosition.y;
      this.currentPosition.z = desiredPosition.z;
      this.currentLookAt.x = this.target.x;
      this.currentLookAt.y = this.target.y + lookAtYOffset;
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
