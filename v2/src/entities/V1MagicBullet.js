import * as THREE from 'three';
import { Projectile } from './V1Projectile.js';
import { InstancedParticlePool } from '../effects/V1InstancedParticlePool.js';

// Cached textures for performance
let cachedBulletTexture = null;
let cachedTrailTexture = null;

export class MagicBullet extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    this.trails = [];
    this.trailSpawnTimer = 0;
    // Reduce trail spawn rate significantly - less trails = better performance
    this.trailSpawnInterval = 0.08; // Was 0.02, now 4x slower
    this.hitEntities = new Set();
    this.pierceCount = 0;
    this.hueShift = Math.random() * 360; // Start at random hue
    this.maxTrails = 5; // Limit trail particles per bullet

    // Initialize instanced trail pool if needed
    this.initTrailPool();
  }

  initTrailPool() {
    // Create shared trail pool if it doesn't exist
    if (!this.engine.instancedParticlePools.trails) {
      // Create cached trail texture
      if (!cachedTrailTexture) {
        const canvas = document.createElement('canvas');
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(6, 6, 1, 6, 6, 6);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(200, 150, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 12, 12);

        cachedTrailTexture = new THREE.CanvasTexture(canvas);
      }

      this.engine.instancedParticlePools.trails = new InstancedParticlePool(
        this.engine.scene,
        {
          texture: cachedTrailTexture,
          maxParticles: 2000,
          size: 0.25,
          blending: THREE.AdditiveBlending
        }
      );
    }
  }

  createMesh() {
    // Cache texture for reuse across all bullets
    if (!cachedBulletTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.7, 'rgba(255, 200, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(200, 150, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);

      cachedBulletTexture = new THREE.CanvasTexture(canvas);
    }

    const material = new THREE.SpriteMaterial({
      map: cachedBulletTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    // Use spell level size scaling
    const scale = 0.4 * (this.weapon?.sizeScale || 1.0);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 999;

    this.mesh = sprite;
  }

  createTrailParticle() {
    // Use instanced particle pool for trails
    const pool = this.engine.instancedParticlePools.trails;
    if (!pool) return null;

    // Get rainbow color based on current hue
    const hue = this.hueShift % 360;
    const color = new THREE.Color().setHSL(hue / 360, 1.0, 0.7);

    // Spawn particle from pool
    const particle = pool.spawn(this.x, this.y, this.z, {
      life: 0.15,
      scale: 1.0,
      color: color,
      fadeOut: true,
      shrink: true
    });

    return particle;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Check expiration timestamp (works even when not updated due to frustum culling)
    if (this.engine.time >= this.expiresAt) {
      this.destroy();
      return;
    }

    // Update position
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt; // 3D movement
    this.z += this.dirZ * this.speed * dt;

    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    // Cycle through rainbow colors
    this.hueShift += dt * 360; // Full rainbow cycle every second
    const hue = this.hueShift % 360;
    const color = new THREE.Color();
    color.setHSL(hue / 360, 1.0, 0.7);
    this.mesh.material.color = color;

    // Spawn trail particles (with limit to prevent performance issues)
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= this.trailSpawnInterval && this.trails.length < this.maxTrails) {
      this.trailSpawnTimer = 0;
      const particle = this.createTrailParticle();
      if (particle) {
        this.trails.push(particle);
      }
    }

    // Clean up dead trail references (pool handles actual updates)
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      // Pool auto-removes dead particles, just clean up our references
      if (trail.age >= trail.life) {
        this.trails.splice(i, 1);
      }
    }

    // Collision detection
    this.engine.entities.forEach(entity => {
      if (!entity.active || entity.health === undefined || this.hitEntities.has(entity)) return;
      if (entity.hasTag && entity.hasTag('player')) return; // Don't damage player

      const dx = entity.x - this.x;
      const dz = entity.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.4) {
        this.hitEntities.add(entity);
        this.pierceCount++;

        const died = entity.takeDamage(this.damage, this.isCrit);
        if (died && this.engine.game) {
          this.engine.game.killCount++;
          this.engine.sound.playHit();
          this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
        }

        if (this.pierceCount > this.pierce) {
          this.destroy();
        }
      }
    });
  }

  /**
   * Clean up trails for pool reuse (without destroying the projectile)
   */
  cleanupForPool() {
    // Clear trail references (instanced pool handles cleanup automatically)
    this.trails = [];
  }

  /**
   * Reset projectile for reuse from pool
   */
  reset(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    // Clean up old trails
    this.cleanupForPool();

    // Reset base projectile properties
    this.engine = engine;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dirX = dirX;
    this.dirY = dirY;
    this.dirZ = dirZ;
    this.weapon = weapon;

    // Calculate damage with crit
    const critChance = weapon.critChance || 0;
    const isCrit = Math.random() < critChance;
    const baseDamage = weapon.damage * stats.damage;
    if (isCrit) {
      this.damage = baseDamage * (weapon.critMultiplier || 2.0);
      this.isCrit = true;
    } else {
      this.damage = baseDamage;
      this.isCrit = false;
    }

    this.speed = weapon.speed * stats.projectileSpeed;
    this.pierce = weapon.pierce + stats.pierce;
    this.lifetime = weapon.lifetime || 3;

    // Reset instance variables
    this.age = 0;
    this.pierceCount = 0;
    this.hitEntities.clear();
    this.trailSpawnTimer = 0;
    this.hueShift = Math.random() * 360; // New random starting hue
    this.active = true;
    this.shouldRemove = false;

    // Reset expiration timestamp
    this.expiresAt = engine.time + this.lifetime;

    // Reinitialize trail pool if needed
    this.initTrailPool();

    // Show and position mesh
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(x, y, z);
      // Update size scaling if it changed
      const scale = 0.4 * (weapon?.sizeScale || 1.0);
      this.mesh.scale.set(scale, scale, 1);
    }
  }

  destroy() {
    // Clear trail references (pool handles cleanup automatically)
    this.trails = [];

    // Make sure mesh is hidden
    if (this.mesh) {
      this.mesh.visible = false;
    }

    // Mark for removal
    this.active = false;
    this.shouldRemove = true;
  }
}
