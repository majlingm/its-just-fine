import { Component } from '../core/ecs/Component.js';

/**
 * Boss Component
 * Handles boss-specific behavior like phases, abilities, and special attacks
 */
export class Boss extends Component {
  constructor() {
    super();

    // Boss identity
    this.isBoss = true;
    this.bossName = '';
    this.bossType = '';

    // Phase system
    this.phases = []; // Array of phase configs
    this.currentPhase = 0;
    this.phaseTriggered = false;

    // Abilities
    this.abilities = []; // Array of ability configs
    this.abilityCooldowns = new Map(); // abilityName -> remaining cooldown
    this.lastAbilityTime = 0;

    // Attack patterns
    this.attackPattern = 'basic'; // basic, charge, slam, summon, projectile
    this.attackCooldown = 2.0;
    this.lastAttackTime = 0;

    // Special behaviors
    this.enraged = false;
    this.canSummonMinions = false;
    this.minionType = '';
    this.maxMinions = 3;
    this.currentMinions = 0;
    this.minionSpawnCooldown = 10.0;
    this.lastMinionSpawnTime = 0;

    // Animation/Visual state
    this.isCharging = false;
    this.chargeTarget = null;
    this.chargeSpeed = 8.0;
    this.chargeDuration = 0;

    // Invulnerability during special attacks
    this.invulnerable = false;
    this.invulnerabilityDuration = 0;
  }

  /**
   * Check if boss should transition to next phase
   * @param {Health} health - Boss health component
   * @returns {boolean} - True if phase should change
   */
  shouldChangePhase(health) {
    if (this.currentPhase >= this.phases.length) {
      return false;
    }

    const currentPhaseConfig = this.phases[this.currentPhase];
    if (!currentPhaseConfig) return false;

    const healthPercent = health.current / health.max;
    return healthPercent <= currentPhaseConfig.healthThreshold && !this.phaseTriggered;
  }

  /**
   * Transition to next phase
   * @param {number} phaseIndex - Index of phase to transition to
   */
  enterPhase(phaseIndex) {
    if (phaseIndex >= this.phases.length) {
      return;
    }

    this.currentPhase = phaseIndex;
    this.phaseTriggered = true;

    const phase = this.phases[phaseIndex];

    // Apply phase modifications
    if (phase.damageMultiplier) {
      // Will be applied by combat system
    }
    if (phase.speedMultiplier) {
      // Will be applied by movement system
    }
    if (phase.enrage) {
      this.enraged = true;
    }

    console.log(`Boss ${this.bossName} entered phase ${phaseIndex + 1}: ${phase.name || 'Unnamed'}`);
  }

  /**
   * Check if ability is off cooldown
   * @param {string} abilityName - Name of ability
   * @returns {boolean} - True if ability can be used
   */
  canUseAbility(abilityName) {
    const cooldown = this.abilityCooldowns.get(abilityName);
    return !cooldown || cooldown <= 0;
  }

  /**
   * Start ability cooldown
   * @param {string} abilityName - Name of ability
   * @param {number} duration - Cooldown duration in seconds
   */
  startAbilityCooldown(abilityName, duration) {
    this.abilityCooldowns.set(abilityName, duration);
  }

  /**
   * Update ability cooldowns
   * @param {number} dt - Delta time
   */
  updateCooldowns(dt) {
    for (const [ability, cooldown] of this.abilityCooldowns) {
      if (cooldown > 0) {
        this.abilityCooldowns.set(ability, cooldown - dt);
      }
    }
  }

  /**
   * Get current phase configuration
   * @returns {object|null} - Current phase config
   */
  getCurrentPhase() {
    return this.phases[this.currentPhase] || null;
  }

  /**
   * Check if boss can attack
   * @param {number} currentTime - Current game time
   * @returns {boolean} - True if can attack
   */
  canAttack(currentTime) {
    return (currentTime - this.lastAttackTime) >= this.attackCooldown;
  }

  /**
   * Mark attack as used
   * @param {number} currentTime - Current game time
   */
  useAttack(currentTime) {
    this.lastAttackTime = currentTime;
  }

  /**
   * Check if boss can summon minions
   * @param {number} currentTime - Current game time
   * @returns {boolean} - True if can summon
   */
  canSummonMinions(currentTime) {
    return this.canSummonMinions &&
           this.currentMinions < this.maxMinions &&
           (currentTime - this.lastMinionSpawnTime) >= this.minionSpawnCooldown;
  }

  /**
   * Mark minion summon as used
   * @param {number} currentTime - Current game time
   */
  summonedMinion(currentTime) {
    this.currentMinions++;
    this.lastMinionSpawnTime = currentTime;
  }

  /**
   * Decrement minion count when one dies
   */
  minionDied() {
    this.currentMinions = Math.max(0, this.currentMinions - 1);
  }
}
