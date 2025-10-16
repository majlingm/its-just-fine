/**
 * WeaponSystem - Handles weapon firing and projectile creation
 *
 * Responsibilities:
 * - Process weapon cooldowns and reloads
 * - Handle fire input from player/AI
 * - Create projectile entities when weapons fire
 * - Apply weapon spread and multi-shot behavior
 *
 * Works with:
 * - Weapon component (weapon stats and state)
 * - Transform component (firing position and direction)
 * - AI component (for enemy firing)
 */

import { ComponentSystem } from '../../../core/ecs/ComponentSystem.js';
import { Entity } from '../../../core/ecs/Entity.js';
import { Transform } from '../../../core/components/Transform.js';
import { Movement } from '../../../core/components/Movement.js';
import { Renderable } from '../../../core/components/Renderable.js';
import { Projectile } from '../../../game/components/Projectile.js';
import { Collider } from '../../../core/components/Collider.js';

export class WeaponSystem extends ComponentSystem {
  constructor(engine) {
    // Require Weapon and Transform components
    super(['Weapon', 'Transform']);

    this.engine = engine;

    // Track fire requests
    this.fireRequests = new Map(); // entityId -> { targetX, targetZ, auto }
  }

  /**
   * Request an entity to fire their weapon
   * @param {number} entityId - Entity ID
   * @param {number} targetX - Target X position
   * @param {number} targetZ - Target Z position
   * @param {boolean} auto - Auto-fire (hold button)
   */
  requestFire(entityId, targetX, targetZ, auto = false) {
    this.fireRequests.set(entityId, { targetX, targetZ, auto });
  }

  /**
   * Process entities with weapons
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with Weapon + Transform
   */
  process(dt, entities) {
    for (const entity of entities) {
      const weapon = entity.getComponent('Weapon');
      const transform = entity.getComponent('Transform');

      // Update weapon state (cooldowns, reload)
      weapon.update(dt);

      // Check for fire requests
      const fireRequest = this.fireRequests.get(entity.id);
      if (fireRequest && weapon.canFire()) {
        this.fireWeapon(entity, weapon, transform, fireRequest.targetX, fireRequest.targetZ);

        // Clear request if not auto-fire
        if (!fireRequest.auto) {
          this.fireRequests.delete(entity.id);
        }
      }
    }
  }

  /**
   * Fire a weapon and create projectile(s)
   * @param {Entity} entity - Entity firing
   * @param {Weapon} weapon - Weapon component
   * @param {Transform} transform - Transform component
   * @param {number} targetX - Target X position
   * @param {number} targetZ - Target Z position
   */
  fireWeapon(entity, weapon, transform, targetX, targetZ) {
    // Consume ammo and start cooldown
    if (!weapon.fire()) return;

    // Calculate direction to target
    const dx = targetX - transform.x;
    const dz = targetZ - transform.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return; // No direction

    const dirX = dx / distance;
    const dirZ = dz / distance;

    // Create projectiles (handle multi-shot weapons like shotguns)
    for (let i = 0; i < weapon.projectilesPerShot; i++) {
      this.createProjectile(entity, weapon, transform, dirX, dirZ, i);
    }

    // Emit fire event
    this.emitFireEvent(entity, weapon);
  }

  /**
   * Create a single projectile
   * @param {Entity} owner - Entity that fired
   * @param {Weapon} weapon - Weapon configuration
   * @param {Transform} ownerTransform - Owner's transform
   * @param {number} dirX - Direction X (normalized)
   * @param {number} dirZ - Direction Z (normalized)
   * @param {number} shotIndex - Index for multi-shot spread
   */
  createProjectile(owner, weapon, ownerTransform, dirX, dirZ, shotIndex) {
    const projectile = new Entity();

    // Apply spread
    let spreadAngle = 0;
    if (weapon.spread > 0 && weapon.projectilesPerShot > 1) {
      // Distribute shots evenly across spread angle
      const angleStep = weapon.spread / (weapon.projectilesPerShot - 1);
      spreadAngle = (shotIndex * angleStep) - (weapon.spread / 2);
    } else if (weapon.spread > 0) {
      // Random spread for single shot
      spreadAngle = (Math.random() - 0.5) * weapon.spread;
    }

    // Apply spread to direction
    const angleRad = (spreadAngle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const finalDirX = dirX * cos - dirZ * sin;
    const finalDirZ = dirX * sin + dirZ * cos;

    // Transform - spawn slightly ahead of owner
    const spawnOffset = 1.0;
    const transform = new Transform();
    transform.init({
      x: ownerTransform.x + finalDirX * spawnOffset,
      y: ownerTransform.y,
      z: ownerTransform.z + finalDirZ * spawnOffset,
      scaleX: weapon.projectileSize,
      scaleY: weapon.projectileSize,
      scaleZ: weapon.projectileSize
    });
    projectile.addComponent(transform);

    // Movement - set velocity in direction
    const movement = new Movement();
    movement.init({
      velocityX: finalDirX * weapon.projectileSpeed,
      velocityZ: finalDirZ * weapon.projectileSpeed,
      speed: weapon.projectileSpeed,
      maxSpeed: weapon.projectileSpeed,
      drag: 0 // No drag for projectiles
    });
    projectile.addComponent(movement);

    // Renderable - visual appearance
    const renderable = new Renderable();
    renderable.init({
      modelType: 'sphere', // Simple sphere for now
      color: weapon.projectileColor,
      emissive: weapon.projectileColor,
      metalness: 0.8,
      roughness: 0.2,
      castShadow: false,
      receiveShadow: false
    });
    projectile.addComponent(renderable);

    // Projectile - damage and behavior
    const projectileComp = new Projectile();
    projectileComp.init({
      damage: weapon.damage,
      speed: weapon.projectileSpeed,
      lifetime: weapon.projectileLifetime,
      ownerId: owner.id,
      ownerTag: owner.hasTag('player') ? 'player' : 'enemy',
      piercing: weapon.piercing,
      homing: weapon.homing,
      explosive: weapon.explosive,
      explosionRadius: weapon.explosionRadius,
      targetTag: owner.hasTag('player') ? 'enemy' : 'player'
    });
    projectile.addComponent(projectileComp);

    // Collider - for hit detection
    const collider = new Collider();
    collider.init({
      shape: 'sphere',
      radius: weapon.projectileSize,
      layer: owner.hasTag('player') ? 'player_projectile' : 'enemy_projectile',
      collidesWith: owner.hasTag('player') ? ['enemy'] : ['player'],
      isSolid: false, // Projectiles don't push things
      isTrigger: true // Trigger collision events
    });
    projectile.addComponent(collider);

    // Tags
    projectile.addTag('projectile');
    if (owner.hasTag('player')) {
      projectile.addTag('player_projectile');
    } else {
      projectile.addTag('enemy_projectile');
    }

    // Add to engine
    this.engine.addEntity(projectile);

    // Emit projectile created event
    this.emitProjectileEvent(owner, projectile);
  }

  /**
   * Emit weapon fire event
   * @param {Entity} entity - Entity that fired
   * @param {Weapon} weapon - Weapon that fired
   */
  emitFireEvent(entity, weapon) {
    const event = new CustomEvent('weapon-fired', {
      detail: {
        entity: entity,
        weapon: weapon,
        weaponType: weapon.weaponType
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit projectile created event
   * @param {Entity} owner - Entity that created projectile
   * @param {Entity} projectile - Projectile entity
   */
  emitProjectileEvent(owner, projectile) {
    const event = new CustomEvent('projectile-created', {
      detail: {
        owner: owner,
        projectile: projectile
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear fire requests (call at end of frame)
   */
  clearFireRequests() {
    // Only clear non-auto fire requests
    for (const [entityId, request] of this.fireRequests) {
      if (!request.auto) {
        this.fireRequests.delete(entityId);
      }
    }
  }
}
