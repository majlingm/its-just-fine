import * as THREE from 'three';
import { Entity } from './V1Entity.js';
import { resourceCache } from '../systems/V1ResourceCache.js';
import { calculateDamageWithCrit } from '../utils/V1damageCalculations.js';

export class RingOfFire extends Entity {
  constructor(engine, player, damage, spell = null, realPlayer = null) {
    super();
    this.engine = engine;
    this.player = player; // v1 compatibility (fallback)
    this.realPlayer = realPlayer; // Real player entity with Transform
    this.baseDamage = damage * 0.09; // Each particle does 9% of base damage
    this.spell = spell; // Store spell for crit calculation
    this.fireParticles = [];

    // Use spell level stats if provided, otherwise use defaults
    this.particleCount = spell?.particleCount || 64;
    this.ringRadius = spell?.ringRadius || 2.2;
    this.rotationSpeed = spell?.rotationSpeed || 1.5;
    this.regenerationRate = spell?.regenerationRate || 0.1;
    this.burstCooldown = spell?.burstCooldown || 1.5;
    this.burstDamageMultiplier = spell?.burstDamageMultiplier || 6;
    this.particleSizeMin = spell?.particleSizeMin || 0.55;
    this.particleSizeMax = spell?.particleSizeMax || 0.9;

    this.currentRotation = 0;
    this.regenerationTimer = 0;
    this.damageInterval = 0.15; // More frequent hits but lower damage per hit
    this.lastDamageTime = new Map(); // Track last damage time per entity

    // Burst mode properties
    this.burstActive = false;
    this.burstCooldownTimer = 0;
    this.burstProjectiles = []; // Store burst projectiles

    this.createFireRing();
  }

  // Check if ring is at least half full (50% or more particles active)
  isRingFull() {
    if (this.burstCooldownTimer > 0) return false;
    const activeCount = this.fireParticles.filter(p => p.active).length;
    return activeCount >= this.particleCount * 0.5; // 50% or more
  }

  // Trigger burst - shoot all particles outward
  triggerBurst() {
    if (!this.isRingFull() || this.burstActive) return;

    console.log('🔥 Ring of Fire BURST!');
    this.burstActive = true;
    this.burstCooldownTimer = this.burstCooldown;

    // Get current player position
    const playerPos = this.getPlayerPosition();

    // Convert all active particles to projectiles
    this.fireParticles.forEach(particle => {
      if (particle.active) {
        const angle = this.currentRotation + particle.angleOffset;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        // Get current particle position
        const radiusOffset = Math.sin(particle.bobPhase + angle * 2) * 0.2;
        const radius = this.ringRadius + radiusOffset;
        const x = playerPos.x + Math.cos(angle) * radius;
        const z = playerPos.z + Math.sin(angle) * radius;

        // Calculate burst damage with crit (create temp spell object with burst damage)
        const burstSpell = {...this.spell, damage: this.baseDamage * this.burstDamageMultiplier};
        const {damage: burstDamage, isCrit} = calculateDamageWithCrit(
          this.baseDamage * this.burstDamageMultiplier,
          this.spell
        );

        this.burstProjectiles.push({
          sprite: particle.sprite,
          x: x,
          z: z,
          dirX: dirX,
          dirZ: dirZ,
          initialSpeed: 50, // High initial speed
          targetSpeed: 15, // Final cruising speed
          currentSpeed: 50, // Current speed (will decelerate)
          lifetime: 2.0,
          age: 0,
          damage: burstDamage,
          isCrit: isCrit,
          hitEntities: new Set()
        });

        particle.active = false;
      }
    });

    this.burstActive = false;
  }

  createFireParticle(index) {
    // Use cached materials for fire particles
    const colorChoice = Math.random();
    let colorType;
    if (colorChoice < 0.25) {
      colorType = 'white';
    } else if (colorChoice < 0.5) {
      colorType = 'yellow';
    } else if (colorChoice < 0.8) {
      colorType = 'orange';
    } else {
      colorType = 'red';
    }

    // Get cached material and clone it for independent properties
    const baseMaterial = resourceCache.getRingOfFireMaterial(colorType);
    const material = baseMaterial.clone();
    const sprite = new THREE.Sprite(material);

    // Larger, varied scale for more visible fire
    const baseScale = this.particleSizeMin + Math.random() * (this.particleSizeMax - this.particleSizeMin);
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.renderOrder = 900;

    this.engine.scene.add(sprite);

    const angle = (index / this.particleCount) * Math.PI * 2;
    // Add slight random offset to angle for less uniform distribution
    const angleOffset = angle + (Math.random() - 0.5) * 0.15;

    return {
      sprite: sprite,
      active: true,
      angleOffset: angleOffset,
      baseScale: baseScale,
      bobPhase: Math.random() * Math.PI * 2, // Random phase for bobbing
      scalePhase: Math.random() * Math.PI * 2, // Random phase for pulsing
      age: 0
    };
  }

  createFireRing() {
    for (let i = 0; i < this.particleCount; i++) {
      this.fireParticles.push(this.createFireParticle(i));
    }
  }

  // Get current player position (supports both v1 and v2)
  getPlayerPosition() {
    if (this.realPlayer && this.realPlayer.getComponent) {
      const transform = this.realPlayer.getComponent('Transform');
      if (transform) {
        return { x: transform.x, y: transform.y, z: transform.z };
      }
    }
    // Fallback to v1 player object
    return { x: this.player.x, y: this.player.y, z: this.player.z };
  }

  update(dt) {
    if (!this.active) return;

    // Get current player position
    const playerPos = this.getPlayerPosition();

    // Update rotation
    this.currentRotation += this.rotationSpeed * dt;

    // Update burst cooldown timer
    if (this.burstCooldownTimer > 0) {
      this.burstCooldownTimer -= dt;
      if (this.burstCooldownTimer < 0) {
        this.burstCooldownTimer = 0;
      }
    }

    // Update burst projectiles
    for (let i = this.burstProjectiles.length - 1; i >= 0; i--) {
      const proj = this.burstProjectiles[i];
      proj.age += dt;

      if (proj.age > proj.lifetime) {
        this.burstProjectiles.splice(i, 1);
        continue;
      }

      // Apply ease-out deceleration (fast start, slow down to target speed)
      const decelDuration = 0.4; // Decelerate over first 0.4 seconds
      if (proj.age < decelDuration) {
        const decelProgress = proj.age / decelDuration;
        // Cubic ease-out: 1 - (1 - x)^3
        const easeOut = 1 - Math.pow(1 - decelProgress, 3);
        proj.currentSpeed = proj.initialSpeed + (proj.targetSpeed - proj.initialSpeed) * easeOut;
      } else {
        proj.currentSpeed = proj.targetSpeed;
      }

      // Move projectile
      proj.x += proj.dirX * proj.currentSpeed * dt;
      proj.z += proj.dirZ * proj.currentSpeed * dt;
      proj.sprite.position.x = proj.x;
      proj.sprite.position.z = proj.z;
      proj.sprite.visible = true; // Make sure sprite is visible

      // Fade out
      proj.sprite.material.opacity = 1 - (proj.age / proj.lifetime);

      // Check collision with enemies
      this.engine.entities.forEach(entity => {
        if (!entity.active || entity.health === undefined) return;
        if (entity.hasTag && entity.hasTag('player')) return;
        if (proj.hitEntities.has(entity)) return;

        const dx = entity.x - proj.x;
        const dz = entity.z - proj.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.6) {
          proj.hitEntities.add(entity);

          const died = entity.takeDamage(proj.damage, proj.isCrit);
          if (died && this.engine.game) {
            this.engine.game.killCount++;
            this.engine.sound.playHit();
            this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
          }
        }
      });
    }

    // Update regeneration timer (don't regenerate during burst cooldown)
    const destroyedCount = this.fireParticles.filter(p => !p.active).length;
    if (destroyedCount > 0 && this.burstCooldownTimer === 0) {
      // Use faster regeneration rate if recovering from burst
      const isRecoveringFromBurst = destroyedCount > this.particleCount * 0.1; // More than 10% missing
      const currentRegenRate = isRecoveringFromBurst ? 0.01 : this.regenerationRate;

      this.regenerationTimer += dt;
      if (this.regenerationTimer >= currentRegenRate) {
        this.regenerationTimer = 0;
        // Find first destroyed particle and regenerate it
        const destroyed = this.fireParticles.find(p => !p.active);
        if (destroyed) {
          destroyed.active = true;
          destroyed.sprite.visible = true;
          // Just change the material color variant for variety, don't create new texture
          const colorChoice = Math.random();
          let colorType;
          if (colorChoice < 0.25) {
            colorType = 'white';
          } else if (colorChoice < 0.5) {
            colorType = 'yellow';
          } else if (colorChoice < 0.8) {
            colorType = 'orange';
          } else {
            colorType = 'red';
          }
          // Update material with cached version (cloned)
          const baseMaterial = resourceCache.getRingOfFireMaterial(colorType);
          destroyed.sprite.material = baseMaterial.clone();
        }
      }
    }

    // Update each fire particle
    this.fireParticles.forEach((particle, index) => {
      if (!particle.active) {
        // Don't hide sprites if they're being used by burst projectiles
        const isInBurst = this.burstProjectiles.some(proj => proj.sprite === particle.sprite);
        if (!isInBurst) {
          particle.sprite.visible = false;
        }
        return;
      }

      particle.age += dt;

      // Calculate position around player with sinusoidal wave motion
      particle.bobPhase += dt * 3;
      const angle = this.currentRotation + particle.angleOffset;

      // Add sinusoidal radius variation for wave-like motion around the ring
      const radiusOffset = Math.sin(particle.bobPhase + angle * 2) * 0.2; // Reduced to keep ring tighter
      const radius = this.ringRadius + radiusOffset;

      const x = playerPos.x + Math.cos(angle) * radius;
      const z = playerPos.z + Math.sin(angle) * radius;

      // Constant height with just subtle flicker
      const flicker = Math.abs(Math.sin(particle.age * 12)) * 0.08;
      const y = 0.5 + flicker;

      particle.sprite.position.set(x, y, z);

      // Pulsing scale animation based on base scale
      particle.scalePhase += dt * 5;
      const scale = particle.baseScale * (1.0 + Math.sin(particle.scalePhase) * 0.25);
      particle.sprite.scale.set(scale, scale, 1);

      // Flickering opacity
      particle.sprite.material.opacity = 0.8 + Math.sin(particle.age * 10) * 0.2;

      // Check collision with enemies
      this.engine.entities.forEach(entity => {
        if (!entity.active || entity.health === undefined) return;
        if (entity.hasTag && entity.hasTag('player')) return; // Don't damage player

        const dx = entity.x - x;
        const dz = entity.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
          // Check if enough time has passed since last damage
          const currentTime = this.engine.time || 0;
          const lastDamage = this.lastDamageTime.get(entity) || 0;

          if (currentTime - lastDamage >= this.damageInterval) {
            this.lastDamageTime.set(entity, currentTime);

            const {damage, isCrit} = calculateDamageWithCrit(this.baseDamage, this.spell);
            const died = entity.takeDamage(damage, isCrit);
            if (died && this.engine.game) {
              this.engine.game.killCount++;
              this.engine.sound.playHit();
              this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
            }

            // Destroy this particle
            particle.active = false;
          }
        }
      });
    });
  }

  destroy() {
    this.fireParticles.forEach(particle => {
      this.engine.scene.remove(particle.sprite);
      if (particle.sprite.material.map) {
        particle.sprite.material.map.dispose();
      }
      particle.sprite.material.dispose();
    });
    this.fireParticles = [];
    this.lastDamageTime.clear();

    this.active = false;
    this.shouldRemove = true;
  }
}
