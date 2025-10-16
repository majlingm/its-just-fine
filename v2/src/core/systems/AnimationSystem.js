import { ComponentSystem } from '../ecs/ComponentSystem.js';

/**
 * AnimationSystem - Updates animation mixers and manages animation state
 *
 * Handles:
 * - Updating THREE.AnimationMixer for each entity
 * - Switching between walk/idle animations based on movement
 * - Finding and playing animations by name
 */
export class AnimationSystem extends ComponentSystem {
  constructor() {
    super(['Animation', 'Movement']);
  }

  /**
   * Process entities with Animation and Movement components
   * @param {number} dt - Delta time in seconds
   * @param {Array<Entity>} entities - Entities to process
   */
  process(dt, entities) {
    for (const entity of entities) {
      const animation = entity.getComponent('Animation');
      const movement = entity.getComponent('Movement');

      if (!animation || !animation.mixer) continue;

      // Update animation mixer
      animation.update(dt);

      // Auto-switch between walk and idle animations for entities with movement
      if (movement) {
        this.updateMovementAnimations(entity, animation, movement);
      }
    }
  }

  /**
   * Update walk/idle animations based on movement state
   * @param {Entity} entity
   * @param {Animation} animation
   * @param {Movement} movement
   */
  updateMovementAnimations(entity, animation, movement) {
    // Determine if entity is moving
    const isMoving = Math.abs(movement.velocityX) > 0.1 || Math.abs(movement.velocityZ) > 0.1;

    // Find walk and idle animations if not already found
    if (!animation.walkAnimName) {
      animation.walkAnimName = animation.findAnimation('walk') || animation.findAnimation('run');
    }
    if (!animation.idleAnimName) {
      animation.idleAnimName = animation.findAnimation('idle');
    }

    // Switch between animations based on movement
    if (isMoving && animation.walkAnimName) {
      if (animation.currentAnimation !== animation.walkAnimName) {
        animation.play(animation.walkAnimName, 0.2);
      }
    } else if (!isMoving && animation.idleAnimName) {
      if (animation.currentAnimation !== animation.idleAnimName) {
        animation.play(animation.idleAnimName, 0.2);
      }
    }
  }
}
