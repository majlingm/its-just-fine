/**
 * PlayerInputSystem - Processes player input and applies to movement
 *
 * This system handles keyboard/touch/gamepad input for entities tagged as 'player'.
 * It converts input into velocity that the MovementSystem will then apply.
 *
 * Responsibilities:
 * - Read input from InputManager
 * - Calculate movement direction from WASD/arrow keys
 * - Apply movement velocity to Movement component
 * - Handle rotation based on movement direction
 *
 * Migration from v1:
 * - Replaces Player.handleInput() method
 * - Uses ECS components instead of direct property manipulation
 */

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';

export class PlayerInputSystem extends ComponentSystem {
  constructor(inputManager, weaponSystem = null) {
    // Require Transform and Movement components
    super(['Transform', 'Movement']);

    this.inputManager = inputManager;
    this.weaponSystem = weaponSystem;
    this.cameraSystem = null; // Will be set externally
  }

  /**
   * Set the weapon system for shooting
   * @param {WeaponSystem} weaponSystem
   */
  setWeaponSystem(weaponSystem) {
    this.weaponSystem = weaponSystem;
  }

  /**
   * Set the camera system for camera-relative controls
   * @param {CameraSystem} cameraSystem
   */
  setCameraSystem(cameraSystem) {
    this.cameraSystem = cameraSystem;
  }

  /**
   * Process player entities with input
   * @param {number} dt - Delta time in seconds
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    for (const entity of entities) {
      // Only process entities tagged as 'player'
      if (!entity.hasTag('player')) {
        continue;
      }

      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');

      if (!transform || !movement) {
        continue;
      }

      // Calculate input direction (camera-relative)
      let inputX = 0;
      let inputZ = 0;

      // WASD keys (in camera space)
      if (this.inputManager.isKeyDown('w')) inputZ = -1;  // Forward (camera forward)
      if (this.inputManager.isKeyDown('s')) inputZ = 1;   // Backward (camera backward)
      if (this.inputManager.isKeyDown('a')) inputX = -1;  // Left (camera left)
      if (this.inputManager.isKeyDown('d')) inputX = 1;   // Right (camera right)

      // Apply input to velocity
      if (inputX !== 0 || inputZ !== 0) {
        // Normalize diagonal movement
        const magnitude = Math.sqrt(inputX * inputX + inputZ * inputZ);
        let normalizedX = inputX / magnitude;
        let normalizedZ = inputZ / magnitude;

        // Rotate input by camera angle to make it camera-relative
        if (this.cameraSystem) {
          const cameraAngle = -this.cameraSystem.config.horizontalAngle; // Negate to match camera rotation

          // Rotate the input vector by the camera's horizontal angle
          const cos = Math.cos(cameraAngle);
          const sin = Math.sin(cameraAngle);

          const rotatedX = normalizedX * cos - normalizedZ * sin;
          const rotatedZ = normalizedX * sin + normalizedZ * cos;

          normalizedX = rotatedX;
          normalizedZ = rotatedZ;
        }

        // Set velocity based on speed
        movement.velocityX = normalizedX * movement.speed;
        movement.velocityZ = normalizedZ * movement.speed;

        // Update rotation to face movement direction
        if (normalizedX !== 0 || normalizedZ !== 0) {
          transform.rotationY = Math.atan2(normalizedX, normalizedZ);
        }
      } else {
        // No input - stop movement (or apply friction via drag in MovementSystem)
        movement.velocityX = 0;
        movement.velocityZ = 0;
      }

      // Handle shooting
      if (this.weaponSystem) {
        this.handleShooting(entity, transform);
      }
    }
  }

  /**
   * Handle shooting input
   * @param {Entity} entity - Player entity
   * @param {Transform} transform - Player transform
   */
  handleShooting(entity, transform) {
    // Check for shooting input (space bar or primary pointer/mouse)
    const isShooting = this.inputManager.isKeyDown(' ') || this.inputManager.isPrimaryPointerDown();

    if (isShooting) {
      // For now, shoot in the direction the player is facing
      // TODO: Calculate actual world position from pointer screen coordinates
      // This requires camera projection which we'll add later

      // Simple approach: shoot forward from player
      const shootDistance = 20; // Distance ahead to target
      const dirX = Math.sin(transform.rotationY);
      const dirZ = Math.cos(transform.rotationY);

      const targetX = transform.x + dirX * shootDistance;
      const targetZ = transform.z + dirZ * shootDistance;

      // Request weapon fire
      this.weaponSystem.requestFire(entity.id, targetX, targetZ, true);
    }
  }
}
