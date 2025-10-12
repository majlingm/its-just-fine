import * as THREE from 'three';
import { Entity } from './Entity.js';
import { calculateDamageWithCrit } from '../spells/spellTypes.js';

export class RingOfIce extends Entity {
  constructor(engine, player, damage, spell = null) {
    super();
    this.engine = engine;
    this.player = player;
    this.baseDamage = damage * 0.05; // Less damage than Ring of Fire (5% vs 9%)
    this.spell = spell; // Store spell for crit calculation
    this.iceParticles = [];

    // Use spell level stats if provided, otherwise use defaults
    this.particleCount = spell?.particleCount || 64;
    this.ringRadius = spell?.ringRadius || 2.2;
    this.rotationSpeed = spell?.rotationSpeed || 1.2;
    this.regenerationRate = spell?.regenerationRate || 0.1;
    this.burstCooldown = spell?.burstCooldown || 1.5;
    this.burstDamageMultiplier = spell?.burstDamageMultiplier || 5;
    this.freezeDuration = spell?.freezeDuration || 10.0;
    this.particleSizeMin = spell?.particleSizeMin || 0.55;
    this.particleSizeMax = spell?.particleSizeMax || 0.9;

    this.currentRotation = 0;
    this.regenerationTimer = 0;
    this.damageInterval = 0.15; // Same hit frequency
    this.lastDamageTime = new Map(); // Track last damage time per entity

    // Burst mode properties
    this.burstActive = false;
    this.burstCooldownTimer = 0;
    this.burstProjectiles = []; // Store burst projectiles

    this.createIceRing();
  }

  // Check if ring is at least half full (50% or more particles active)
  isRingFull() {
    if (this.burstCooldownTimer > 0) return false;
    const activeCount = this.iceParticles.filter(p => p.active).length;
    return activeCount >= this.particleCount * 0.5; // 50% or more
  }

  // Trigger burst - shoot all particles outward
  triggerBurst() {
    if (!this.isRingFull() || this.burstActive) return;

    this.burstActive = true;
    this.burstCooldownTimer = this.burstCooldown;

    // Convert all active particles to projectiles
    this.iceParticles.forEach(particle => {
      if (particle.active) {
        const angle = this.currentRotation + particle.angleOffset;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        // Get current particle position
        const radiusOffset = Math.sin(particle.bobPhase + angle * 2) * 0.2;
        const radius = this.ringRadius + radiusOffset;
        const x = this.player.x + Math.cos(angle) * radius;
        const z = this.player.z + Math.sin(angle) * radius;

        // Calculate burst damage with crit
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

  createIceParticle(index) {
    // Create animated ice particle with varying sizes
    const particleSize = 32 + Math.random() * 20; // Random size between 32-52
    const canvas = document.createElement('canvas');
    canvas.width = particleSize;
    canvas.height = particleSize;
    const ctx = canvas.getContext('2d');

    const center = particleSize / 2;
    const gradient = ctx.createRadialGradient(center, center, 2, center, center, center);
    const colorChoice = Math.random();

    if (colorChoice < 0.25) {
      // Bright white-cyan core (coldest)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(220, 245, 255, 0.95)');
      gradient.addColorStop(0.5, 'rgba(180, 230, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(150, 210, 255, 0)');
    } else if (colorChoice < 0.5) {
      // Bright cyan
      gradient.addColorStop(0, 'rgba(220, 245, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(180, 230, 255, 0.9)');
      gradient.addColorStop(0.6, 'rgba(140, 210, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(100, 190, 255, 0)');
    } else if (colorChoice < 0.8) {
      // Light blue ice
      gradient.addColorStop(0, 'rgba(200, 235, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(150, 210, 255, 0.9)');
      gradient.addColorStop(0.6, 'rgba(120, 190, 240, 0.7)');
      gradient.addColorStop(1, 'rgba(80, 160, 220, 0)');
    } else {
      // Deep blue ice
      gradient.addColorStop(0, 'rgba(180, 220, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(130, 190, 240, 0.9)');
      gradient.addColorStop(0.6, 'rgba(100, 160, 220, 0.7)');
      gradient.addColorStop(1, 'rgba(70, 130, 200, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, particleSize, particleSize);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);

    // Larger, varied scale for more visible ice
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

  createIceRing() {
    for (let i = 0; i < this.particleCount; i++) {
      this.iceParticles.push(this.createIceParticle(i));
    }
  }

  update(dt) {
    if (!this.active) return;

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
        if (entity === this.engine.game?.player) return;
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

          // Apply freeze effect on burst hit too
          if (!died && entity.applyFreeze) {
            entity.applyFreeze(this.freezeDuration);
          }
        }
      });
    }

    // Update regeneration timer (don't regenerate during burst cooldown)
    const destroyedCount = this.iceParticles.filter(p => !p.active).length;
    if (destroyedCount > 0 && this.burstCooldownTimer === 0) {
      // Use faster regeneration rate if recovering from burst
      const isRecoveringFromBurst = destroyedCount > this.particleCount * 0.1; // More than 10% missing
      const currentRegenRate = isRecoveringFromBurst ? 0.01 : this.regenerationRate;

      this.regenerationTimer += dt;
      if (this.regenerationTimer >= currentRegenRate) {
        this.regenerationTimer = 0;
        // Find first destroyed particle and regenerate it
        const destroyed = this.iceParticles.find(p => !p.active);
        if (destroyed) {
          destroyed.active = true;
          destroyed.sprite.visible = true;
          // Recreate texture for variety
          const index = this.iceParticles.indexOf(destroyed);
          const newParticle = this.createIceParticle(index);
          destroyed.sprite.material.map = newParticle.sprite.material.map;
          this.engine.scene.remove(newParticle.sprite);
        }
      }
    }

    // Update each ice particle
    this.iceParticles.forEach((particle, index) => {
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
      const radiusOffset = Math.sin(particle.bobPhase + angle * 2) * 0.2;
      const radius = this.ringRadius + radiusOffset;

      const x = this.player.x + Math.cos(angle) * radius;
      const z = this.player.z + Math.sin(angle) * radius;

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
        if (entity === this.engine.game?.player) return; // Don't damage player

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

            // Apply freeze effect
            if (!died && entity.applyFreeze) {
              entity.applyFreeze(this.freezeDuration);
            }

            // Destroy this particle
            particle.active = false;
          }
        }
      });
    });
  }

  destroy() {
    this.iceParticles.forEach(particle => {
      this.engine.scene.remove(particle.sprite);
      if (particle.sprite.material.map) {
        particle.sprite.material.map.dispose();
      }
      particle.sprite.material.dispose();
    });
    this.iceParticles = [];
    this.lastDamageTime.clear();

    this.active = false;
    this.shouldRemove = true;
  }
}
