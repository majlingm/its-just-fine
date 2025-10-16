/**
 * BossSystem - Handles boss-specific behavior
 *
 * Manages boss phases, special attacks, and abilities.
 * Processes entities with Boss and Health components.
 *
 * Responsibilities:
 * - Phase transitions based on health thresholds
 * - Charge attacks with movement
 * - Ground slam area attacks
 * - Minion summoning
 * - Ability cooldown management
 */

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';

export class BossSystem extends ComponentSystem {
  constructor(entityManager, entityFactory) {
    // Require Boss, Health, Transform, and Movement components
    super(['Boss', 'Health', 'Transform', 'Movement']);

    this.entityManager = entityManager;
    this.entityFactory = entityFactory;
    this.currentTime = 0;
  }

  /**
   * Process bosses
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities to process (bosses)
   */
  process(dt, entities) {
    this.currentTime += dt;

    for (const entity of entities) {
      const boss = entity.getComponent('Boss');
      const health = entity.getComponent('Health');
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');

      // Update cooldowns
      boss.updateCooldowns(dt);

      // Check for phase transitions
      this.checkPhaseTransition(entity, boss, health, movement);

      // Handle charge attack
      if (boss.isCharging) {
        this.processCharge(entity, boss, transform, movement, dt);
      }

      // Update invulnerability
      if (boss.invulnerable) {
        boss.invulnerabilityDuration -= dt;
        if (boss.invulnerabilityDuration <= 0) {
          boss.invulnerable = false;
          boss.invulnerabilityDuration = 0;
        }
      }

      // Execute boss attack patterns based on type
      this.executeBossPattern(entity, boss, transform);
    }
  }

  /**
   * Check if boss should transition to next phase
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Health} health - Health component
   * @param {Movement} movement - Movement component
   */
  checkPhaseTransition(entity, boss, health, movement) {
    if (boss.shouldChangePhase(health)) {
      const nextPhase = boss.currentPhase + 1;
      boss.enterPhase(nextPhase);

      // Apply phase multipliers to stats
      const phase = boss.getCurrentPhase();
      if (phase) {
        // Store original speed if not already stored
        if (!movement.baseSpeed) {
          movement.baseSpeed = movement.speed;
        }

        // Apply speed multiplier
        if (phase.speedMultiplier) {
          movement.speed = movement.baseSpeed * phase.speedMultiplier;
          movement.maxSpeed = movement.speed * 1.5;
        }

        // Damage multiplier will be applied by combat system when dealing damage
        // Store it on the boss component for easy access
        boss.damageMultiplier = phase.damageMultiplier || 1.0;
      }

      // Reset phase triggered flag after a short delay
      setTimeout(() => {
        boss.phaseTriggered = false;
      }, 1000);
    }
  }

  /**
   * Execute boss attack pattern
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   */
  executeBossPattern(entity, boss, transform) {
    // Check if boss can attack
    if (!boss.canAttack(this.currentTime)) {
      return;
    }

    // Execute pattern based on boss attack pattern
    switch (boss.attackPattern) {
      case 'charge':
        this.initiateCharge(entity, boss, transform);
        break;

      case 'slam':
        this.executeSlamAttack(entity, boss, transform);
        break;

      case 'summon':
        this.summonMinions(entity, boss, transform);
        break;

      case 'projectile':
        // TODO: Implement projectile attack
        // Will be handled by a future ProjectileSystem
        boss.useAttack(this.currentTime);
        break;

      case 'basic':
      default:
        // Basic melee attack - handled by CombatSystem
        boss.useAttack(this.currentTime);
        break;
    }
  }

  /**
   * Initiate a charge attack
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   */
  initiateCharge(entity, boss, transform) {
    // Find player to charge at
    const player = this.entityManager.getEntitiesByTag('player')[0];
    if (!player) return;

    const playerTransform = player.getComponent('Transform');
    if (!playerTransform) return;

    // Start charge
    boss.isCharging = true;
    boss.chargeTarget = { x: playerTransform.x, z: playerTransform.z };
    boss.chargeDuration = 0;

    // Make boss invulnerable during charge windup
    boss.invulnerable = true;
    boss.invulnerabilityDuration = 0.3;

    boss.useAttack(this.currentTime);

    console.log(`${boss.bossName} charges!`);
  }

  /**
   * Process ongoing charge attack
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   * @param {Movement} movement - Movement component
   * @param {number} dt - Delta time
   */
  processCharge(entity, boss, transform, movement, dt) {
    if (!boss.chargeTarget) {
      boss.isCharging = false;
      return;
    }

    // Calculate direction to target
    const dx = boss.chargeTarget.x - transform.x;
    const dz = boss.chargeTarget.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Stop charging if reached target or time limit exceeded
    if (distance < 2.0 || boss.chargeDuration > 3.0) {
      boss.isCharging = false;
      boss.chargeTarget = null;
      boss.chargeDuration = 0;
      return;
    }

    // Move towards target at charge speed
    const normalizedDx = dx / distance;
    const normalizedDz = dz / distance;

    const moveDistance = boss.chargeSpeed * dt;
    transform.x += normalizedDx * moveDistance;
    transform.z += normalizedDz * moveDistance;

    boss.chargeDuration += dt;

    // Deal damage to entities in path
    this.damageEntitiesInPath(entity, boss, transform);
  }

  /**
   * Damage entities in charge path
   * @param {Entity} bossEntity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   */
  damageEntitiesInPath(bossEntity, boss, transform) {
    // Find player
    const player = this.entityManager.getEntitiesByTag('player')[0];
    if (!player) return;

    const playerTransform = player.getComponent('Transform');
    const playerHealth = player.getComponent('Health');

    if (!playerTransform || !playerHealth) return;

    // Check if player is within damage radius
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 2.5) {
      // Get charge ability damage
      const chargeAbility = boss.abilities.find(a => a.name === 'charge');
      const damage = chargeAbility ? chargeAbility.damage : boss.attackCooldown * 30;

      // Apply damage multiplier from current phase
      const finalDamage = Math.floor(damage * (boss.damageMultiplier || 1.0));

      playerHealth.current -= finalDamage;
      console.log(`${boss.bossName} charge hits for ${finalDamage} damage!`);
    }
  }

  /**
   * Execute ground slam attack
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   */
  executeSlamAttack(entity, boss, transform) {
    // Find slam ability to get radius and damage
    const slamAbility = boss.abilities.find(a => a.name === 'ground_slam');
    const radius = slamAbility ? slamAbility.radius : 8;
    const damage = slamAbility ? slamAbility.damage : 50;

    // Apply damage multiplier from current phase
    const finalDamage = Math.floor(damage * (boss.damageMultiplier || 1.0));

    // Find all entities within radius
    const player = this.entityManager.getEntitiesByTag('player')[0];
    if (!player) {
      boss.useAttack(this.currentTime);
      return;
    }

    const playerTransform = player.getComponent('Transform');
    const playerHealth = player.getComponent('Health');

    if (!playerTransform || !playerHealth) {
      boss.useAttack(this.currentTime);
      return;
    }

    // Check if player is in range
    const dx = playerTransform.x - transform.x;
    const dz = playerTransform.z - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance <= radius) {
      playerHealth.current -= finalDamage;
      console.log(`${boss.bossName} ground slam hits for ${finalDamage} damage!`);
    }

    boss.useAttack(this.currentTime);
    console.log(`${boss.bossName} slams the ground!`);
  }

  /**
   * Summon minions
   * @param {Entity} entity - Boss entity
   * @param {Boss} boss - Boss component
   * @param {Transform} transform - Transform component
   */
  async summonMinions(entity, boss, transform) {
    // Check if boss can summon minions
    if (!boss.canSummonMinions(this.currentTime)) {
      return;
    }

    // Get summon ability
    const summonAbility = boss.abilities.find(a => a.name === 'summon_minions');
    const minionType = summonAbility ? summonAbility.minionType : boss.minionType;
    const minionCount = summonAbility ? summonAbility.minionCount : 3;

    if (!minionType) {
      console.warn(`Boss ${boss.bossName} tried to summon but has no minionType`);
      return;
    }

    console.log(`${boss.bossName} summons ${minionCount} ${minionType}!`);

    // Spawn minions around boss
    for (let i = 0; i < minionCount; i++) {
      // Calculate spawn position in circle around boss
      const angle = (i / minionCount) * Math.PI * 2;
      const spawnRadius = 5;
      const spawnX = transform.x + Math.cos(angle) * spawnRadius;
      const spawnZ = transform.z + Math.sin(angle) * spawnRadius;

      try {
        // Create minion entity
        const minion = await this.entityFactory.createEnemy(minionType, {
          x: spawnX,
          z: spawnZ,
        });

        // Add to entity manager
        this.entityManager.addEntity(minion);

        // Track minion count
        boss.summonedMinion(this.currentTime);
      } catch (error) {
        console.error(`Failed to summon minion ${minionType}:`, error);
      }
    }

    boss.useAttack(this.currentTime);
  }

  /**
   * Handle when a boss minion dies
   * @param {Entity} bossEntity - Boss entity
   */
  minionDied(bossEntity) {
    const boss = bossEntity.getComponent('Boss');
    if (boss) {
      boss.minionDied();
    }
  }
}
