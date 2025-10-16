import { Component } from '../../core/ecs/Component.js';

/**
 * AI Component
 * Represents AI behavior state and configuration
 */
export class AI extends Component {
  constructor() {
    super();

    // Behavior type
    this.behavior = 'idle'; // 'idle', 'chase_player', 'patrol', 'flee', etc.
    this.behaviorScript = null; // Reference to behavior script instance

    // State machine
    this.state = 'idle';
    this.previousState = null;
    this.stateTime = 0; // Time in current state

    // Target reference
    this.target = null; // Entity being targeted (e.g., player)
    this.targetPosition = null; // Last known target position

    // Aggro/detection
    this.aggroRange = 30;
    this.attackRange = 2;
    this.detectionRadius = 35;
    this.hasLineOfSight = false;

    // Attack timing
    this.attackCooldown = 1.0;
    this.timeSinceLastAttack = 0;
    this.canAttack = true;

    // Patrol (if applicable)
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.patrolWaitTime = 2.0;

    // Decision-making
    this.updateInterval = 0.1; // How often to make decisions (seconds)
    this.timeSinceLastUpdate = 0;

    // Behavior flags
    this.aggressive = true;
    this.fleesWhenLowHealth = false;
    this.healthThresholdToFlee = 0.2; // 20% health

    // AI state data (flexible for different behaviors)
    this.customData = {};
  }

  /**
   * Change AI state
   * @param {string} newState
   */
  setState(newState) {
    if (this.state !== newState) {
      this.previousState = this.state;
      this.state = newState;
      this.stateTime = 0;
    }
  }

  /**
   * Check if in specific state
   * @param {string} state
   * @returns {boolean}
   */
  isInState(state) {
    return this.state === state;
  }

  /**
   * Check if can attack
   * @returns {boolean}
   */
  canPerformAttack() {
    return this.canAttack && this.timeSinceLastAttack >= this.attackCooldown;
  }

  /**
   * Reset attack cooldown
   */
  performedAttack() {
    this.timeSinceLastAttack = 0;
    this.canAttack = false;
  }

  /**
   * Get distance to target
   * @param {Object} entity - Entity with Transform component
   * @returns {number|null}
   */
  getDistanceToTarget(entity) {
    if (!this.target || !entity.components) return null;

    const transform = entity.getComponent('Transform');
    const targetTransform = this.target.getComponent?.('Transform');

    if (!transform || !targetTransform) return null;

    const dx = targetTransform.x - transform.x;
    const dz = targetTransform.z - transform.z;

    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Check if target is in range
   * @param {Object} entity - Entity with Transform component
   * @param {number} range - Range to check
   * @returns {boolean}
   */
  isTargetInRange(entity, range) {
    const distance = this.getDistanceToTarget(entity);
    return distance !== null && distance <= range;
  }
}
