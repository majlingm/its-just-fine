/**
 * PickupSystem - Manages pickup collection and effects
 *
 * Responsibilities:
 * - Detect player proximity to pickups
 * - Apply magnetic attraction
 * - Handle collection (health, XP, powerups)
 * - Visual animations (bobbing, rotating, glowing)
 * - Despawn expired pickups
 *
 * Works with:
 * - Pickup component
 * - Transform component (for position/movement)
 * - Renderable component (for visual effects)
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';

export class PickupSystem extends ComponentSystem {
  constructor(engine) {
    // Require Pickup and Transform components
    super(['Pickup', 'Transform']);

    // Player reference
    this.player = null;

    // Engine reference for particle effects
    this.engine = engine;
  }

  /**
   * Process pickups
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with Pickup and Transform
   */
  process(dt, entities) {
    // Find player if we don't have it
    if (!this.player) {
      // Will be set by main game loop
      return;
    }

    const playerTransform = this.player.getComponent('Transform');
    if (!playerTransform) return;

    for (const entity of entities) {
      const pickup = entity.getComponent('Pickup');
      const transform = entity.getComponent('Transform');

      // Skip if already collected
      if (pickup.hasBeenCollected) continue;

      // Update age
      pickup.update(dt);

      // Check for expiration
      if (pickup.isExpired()) {
        entity.destroy();
        continue;
      }

      // Don't allow collection until spawn animation is complete
      if (!pickup.isSpawnComplete()) {
        // Visual effects only during spawn
        this.updateVisuals(entity, pickup, transform, dt);
        continue;
      }

      // Calculate distance to player
      const dx = playerTransform.x - transform.x;
      const dz = playerTransform.z - transform.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Check for collection
      if (pickup.autoCollect && distance <= pickup.collectRadius) {
        this.collectPickup(entity, this.player);
        continue;
      }

      // Apply magnetic attraction
      if (distance <= pickup.magnetRange) {
        pickup.isBeingCollected = true;

        // Move toward player
        const dirX = dx / distance;
        const dirZ = dz / distance;

        transform.x += dirX * pickup.magnetSpeed * dt;
        transform.z += dirZ * pickup.magnetSpeed * dt;
      }

      // Visual effects
      this.updateVisuals(entity, pickup, transform, dt);
    }
  }

  /**
   * Update visual effects (bobbing, rotation)
   * @param {Entity} entity - Pickup entity
   * @param {Pickup} pickup - Pickup component
   * @param {Transform} transform - Transform component
   * @param {number} dt - Delta time
   */
  updateVisuals(entity, pickup, transform, dt) {
    const renderable = entity.getComponent('Renderable');
    if (!renderable) return;

    // Spawn animation (scale in)
    if (!pickup.isSpawnComplete()) {
      const progress = pickup.getSpawnProgress();
      const scale = progress; // Ease in
      transform.scaleX = scale;
      transform.scaleY = scale;
      transform.scaleZ = scale;
    }

    // Vertical bobbing
    if (pickup.bobHeight > 0) {
      const bobOffset = Math.sin(pickup.age * pickup.bobSpeed) * pickup.bobHeight;
      transform.y = 0.5 + bobOffset; // Base height + bob
    }

    // Rotation
    if (pickup.rotateSpeed > 0) {
      transform.rotationY += pickup.rotateSpeed * dt;
    }

    // Glow/pulse effect
    if (pickup.glowIntensity > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(pickup.age * 3);
      const glowColor = this.getPickupColor(pickup.pickupType);
      renderable.emissive = glowColor;
      // Pulse emissive intensity (handled by material properties)
    }
  }

  /**
   * Get color for pickup type
   * @param {string} pickupType
   * @returns {number} Hex color
   */
  getPickupColor(pickupType) {
    switch (pickupType) {
      case 'health':
        return 0xff0000; // Red
      case 'xp':
        return 0x00ff00; // Green
      case 'coin':
        return 0xffff00; // Yellow
      case 'powerup':
        return 0x00ffff; // Cyan
      case 'shield':
        return 0x0088ff; // Blue
      case 'damage':
        return 0xff8800; // Orange
      case 'speed':
        return 0xff00ff; // Magenta
      default:
        return 0xffffff; // White
    }
  }

  /**
   * Collect a pickup
   * @param {Entity} pickupEntity - Pickup entity
   * @param {Entity} collector - Entity collecting the pickup (usually player)
   */
  collectPickup(pickupEntity, collector) {
    const pickup = pickupEntity.getComponent('Pickup');

    // Mark as collected
    pickup.hasBeenCollected = true;

    // Apply effect based on type
    switch (pickup.pickupType) {
      case 'health':
        this.applyHealthPickup(collector, pickup);
        break;

      case 'xp':
        this.applyXPPickup(collector, pickup);
        break;

      case 'coin':
        this.applyCoinPickup(collector, pickup);
        break;

      case 'powerup':
      case 'shield':
      case 'damage':
      case 'speed':
      case 'haste':
        this.applyPowerup(collector, pickup);
        break;

      default:
        console.warn(`Unknown pickup type: ${pickup.pickupType}`);
    }

    // Emit pickup collected event
    this.emitPickupEvent(pickupEntity, collector);

    // Create collection particle effect
    this.createCollectionEffect(pickupEntity);

    // Remove pickup entity
    pickupEntity.destroy();
  }

  /**
   * Apply health pickup
   * @param {Entity} collector
   * @param {Pickup} pickup
   */
  applyHealthPickup(collector, pickup) {
    const health = collector.getComponent('Health');
    if (!health) return;

    const previousHealth = health.current;
    health.current = Math.min(health.max, health.current + pickup.value);

    const actualHealing = health.current - previousHealth;
    console.log(`💚 Healed ${actualHealing} HP (${health.current}/${health.max})`);
  }

  /**
   * Apply XP pickup
   * @param {Entity} collector
   * @param {Pickup} pickup
   */
  applyXPPickup(collector, pickup) {
    const experience = collector.getComponent('Experience');
    if (!experience) return;

    experience.addXP(pickup.value);
    console.log(`⭐ Gained ${pickup.value} XP`);
  }

  /**
   * Apply coin/currency pickup
   * @param {Entity} collector
   * @param {Pickup} pickup
   */
  applyCoinPickup(collector, pickup) {
    // Emit coin collected event (can be tracked by a currency system)
    const event = new CustomEvent('coin-collected', {
      detail: {
        collector: collector,
        amount: pickup.value
      }
    });
    window.dispatchEvent(event);

    console.log(`💰 Collected ${pickup.value} coins`);
  }

  /**
   * Apply powerup effect
   * @param {Entity} collector
   * @param {Pickup} pickup
   */
  applyPowerup(collector, pickup) {
    // Apply status effect based on powerup type
    let effectConfig = pickup.powerupEffect;

    // Default effects if not specified
    if (!effectConfig) {
      effectConfig = this.getDefaultPowerupEffect(pickup);
    }

    // Apply the effect
    import('../combat/StatusEffectSystem.js').then(module => {
      module.StatusEffectSystem.applyEffect(collector, effectConfig);
      console.log(`⚡ Applied ${pickup.pickupType} powerup`);
    });
  }

  /**
   * Get default powerup effect config
   * @param {Pickup} pickup
   * @returns {Object} Status effect config
   */
  getDefaultPowerupEffect(pickup) {
    switch (pickup.pickupType) {
      case 'shield':
        return {
          type: 'shield',
          duration: pickup.powerupDuration,
          strength: 0.5, // 50% damage reduction
          color: 0x00ffff
        };

      case 'damage':
        return {
          type: 'strength',
          duration: pickup.powerupDuration,
          strength: 0.5, // 50% damage boost
          color: 0xff8800
        };

      case 'speed':
      case 'haste':
        return {
          type: 'haste',
          duration: pickup.powerupDuration,
          strength: 0.5, // 50% speed boost
          color: 0xff00ff
        };

      default:
        return {
          type: 'powerup',
          duration: pickup.powerupDuration,
          strength: 1.0,
          color: 0xffffff
        };
    }
  }

  /**
   * Create visual effect on collection
   * @param {Entity} pickupEntity
   */
  createCollectionEffect(pickupEntity) {
    const transform = pickupEntity.getComponent('Transform');
    const pickup = pickupEntity.getComponent('Pickup');

    if (!transform) return;

    // Import ParticleSystem and create burst
    if (this.engine) {
      import('../effects/ParticleSystem.js').then(module => {
        const color = this.getPickupColor(pickup.pickupType);

        module.ParticleSystem.createBurst(this.engine, {
          x: transform.x,
          y: transform.y,
          z: transform.z,
          count: 8,
          burstSpeed: 3,
          lifetime: 0.5,
          fadeStart: 0.2,
          startColor: color,
          endColor: color,
          startOpacity: 1.0,
          endOpacity: 0.0,
          startScale: 1.0,
          endScale: 0.3,
          scale: 0.1,
          gravity: 2,
          drag: 0.9,
          tag: 'pickup_collect'
        });
      });
    }
  }

  /**
   * Emit pickup collected event
   * @param {Entity} pickupEntity
   * @param {Entity} collector
   */
  emitPickupEvent(pickupEntity, collector) {
    const event = new CustomEvent('pickup-collected', {
      detail: {
        pickup: pickupEntity,
        collector: collector,
        pickupType: pickupEntity.getComponent('Pickup')?.pickupType
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Set player reference
   * @param {Entity} player
   */
  setPlayer(player) {
    this.player = player;
  }
}
