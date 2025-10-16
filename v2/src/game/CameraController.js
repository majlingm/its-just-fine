/**
 * CameraController - Game-specific camera control
 *
 * This is game-specific functionality that uses the engine's CameraSystem.
 * Handles input and makes game decisions about camera behavior.
 *
 * Responsibilities:
 * - Handle keyboard input for camera control
 * - Handle mouse wheel for zoom
 * - Update engine's CameraSystem based on input
 *
 * Controls:
 * - Arrow Left/Right: Rotate camera horizontally
 * - Arrow Up/Down: Tilt camera vertically
 * - Mouse Wheel: Zoom in/out
 */
export class CameraController {
  constructor(cameraSystem, inputManager, config = {}) {
    this.cameraSystem = cameraSystem;
    this.input = inputManager;

    // Control speeds
    this.horizontalSpeed = config.horizontalSpeed || 2.0;
    this.verticalSpeed = config.verticalSpeed || 0.5;
    this.zoomSpeed = config.zoomSpeed || 0.5;

    // Controls enabled
    this.enabled = true;
  }

  /**
   * Update camera controller - handle input and update camera system
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (!this.enabled) return;

    // Handle rotation (Arrow Left/Right)
    let horizontalDelta = 0;
    if (this.input.isKeyDown('arrowleft')) {
      horizontalDelta -= this.horizontalSpeed * dt;
    }
    if (this.input.isKeyDown('arrowright')) {
      horizontalDelta += this.horizontalSpeed * dt;
    }

    // Handle tilt (Arrow Up/Down)
    let verticalDelta = 0;
    if (this.input.isKeyDown('arrowup')) {
      verticalDelta -= this.verticalSpeed * dt;
    }
    if (this.input.isKeyDown('arrowdown')) {
      verticalDelta += this.verticalSpeed * dt;
    }

    // Apply angle changes to camera system
    if (horizontalDelta !== 0 || verticalDelta !== 0) {
      this.cameraSystem.adjustAngles(horizontalDelta, verticalDelta);
    }

    // Handle zoom (Mouse Wheel)
    const wheelDelta = this.input.getMouseWheel();
    if (wheelDelta !== 0) {
      // Normalize wheel delta and apply zoom
      const zoomDelta = wheelDelta * this.zoomSpeed * dt * 10; // Multiply by 10 for more noticeable zoom
      this.cameraSystem.adjustDistance(zoomDelta);
    }
  }

  /**
   * Enable/disable camera controls
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if controls are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Update control speeds
   * @param {Object} speeds - {horizontalSpeed, verticalSpeed, zoomSpeed}
   */
  updateSpeeds(speeds) {
    if (speeds.horizontalSpeed !== undefined) this.horizontalSpeed = speeds.horizontalSpeed;
    if (speeds.verticalSpeed !== undefined) this.verticalSpeed = speeds.verticalSpeed;
    if (speeds.zoomSpeed !== undefined) this.zoomSpeed = speeds.zoomSpeed;
  }
}
