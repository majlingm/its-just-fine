import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { resourceCache } from '../systems/ResourceCache.js';
import { FireExplosion } from './FireExplosion.js';

export class FlameProjectile extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);

    this.flames = []; // Array of particle references for cleanup
    this.flameSpawnTimer = 0;
    this.flameSpawnInterval = 0.03;
    this.hitEntities = new Set();
    this.pierceCount = 0;
    this.hasExploded = false;  // Track if we've already created an explosion

    // Get particle pool for flame trails
    this.flamePool = engine.getInstancedParticlePool('flames');
  }

  createMesh() {
    // Use cached fireball material
    const material = resourceCache.getFireballMaterial();
    const sprite = new THREE.Sprite(material);
    // Use spell level size scaling
    const scale = 1.2 * (this.weapon?.sizeScale || 1.0);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 999;

    this.mesh = sprite;
  }

  createFlameTrail() {
    // Determine color based on random choice
    const colorChoice = Math.random();
    let color;
    if (colorChoice < 0.3) {
      color = 0xffff00; // Yellow
    } else if (colorChoice < 0.7) {
      color = 0xffaa00; // Orange
    } else {
      color = 0xff4400; // Red
    }

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.3;
    const offsetZ = (Math.random() - 0.5) * 0.3;
    const offsetY = (Math.random() - 0.5) * 0.2;

    // Spawn particle using instanced pool
    const particle = this.flamePool.spawn(
      this.x + offsetX,
      this.y + offsetY,
      this.z + offsetZ,
      {
        life: 0.3,
        scale: 1.5, // Bigger particles for more visible trail
        velocity: { x: 0, y: Math.random() * 0.5 + 0.2, z: 0 },
        color: color,
        fadeOut: true,
        shrink: true,
        gravity: 0
      }
    );

    // Store particle reference for cleanup if needed
    if (particle) {
      return { particle, age: 0, life: 0.3 };
    }
    return null;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Check expiration timestamp (works even when not updated due to frustum culling)
    if (this.engine.time >= this.expiresAt) {
      // Only create explosion on expiration if we haven't exploded yet
      if (!this.hasExploded) {
        const explosion = new FireExplosion(
          this.engine,
          this.x,
          this.z,
          1.0,     // Small explosion for expiration
          0,       // No additional damage
          10       // Very few particles for expiration
        );
        this.engine.addEntity(explosion);
      }
      this.destroy();
      return;
    }

    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt; // 3D movement
    this.z += this.dirZ * this.speed * dt;

    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    // Spawn flame trail
    this.flameSpawnTimer += dt;
    if (this.flameSpawnTimer >= this.flameSpawnInterval) {
      this.flameSpawnTimer = 0;
      const trail = this.createFlameTrail();
      if (trail) {
        this.flames.push(trail);
      }
    }

    // Update flame particles - they're auto-updated by the pool,
    // just track for cleanup
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const flame = this.flames[i];
      flame.age += dt;

      if (flame.age > flame.life) {
        // Particle will be auto-removed by pool, just remove from our tracking
        this.flames.splice(i, 1);
      }
    }

    // Collision detection
    this.engine.entities.forEach(entity => {
      if (!entity.active || entity.health === undefined || this.hitEntities.has(entity)) return;
      if (entity === this.engine.game?.player) return; // Don't damage player

      const dx = entity.x - this.x;
      const dz = entity.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5) {
        this.hitEntities.add(entity);
        this.pierceCount++;

        // Only create explosion on first hit or if no pierce
        if (!this.hasExploded && (this.pierce === 0 || this.pierceCount === 1)) {
          this.hasExploded = true;
          const explosion = new FireExplosion(
            this.engine,
            this.x,  // Explosion at projectile position
            this.z,
            1.5,     // Small radius for individual fireball
            0,       // No additional damage (damage already dealt)
            15       // Fewer particles for impact explosion (15 instead of 30)
          );
          this.engine.addEntity(explosion);

          // Play explosion sound
          if (this.engine.sound && this.engine.sound.playExplosion) {
            this.engine.sound.playExplosion();
          }
        }

        const died = entity.takeDamage(this.damage, this.isCrit);
        if (died && this.engine.game) {
          this.engine.game.killCount++;
          this.engine.sound.playHit();
          this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
        }

        if (this.pierceCount > this.pierce) {
          // Final explosion when projectile reaches pierce limit
          const finalExplosion = new FireExplosion(
            this.engine,
            this.x,
            this.z,
            2.0,     // Slightly larger radius for final explosion
            0,       // No additional damage
            20       // Medium particles for final explosion
          );
          this.engine.addEntity(finalExplosion);
          this.destroy();
        }
      }
    });
  }

  /**
   * Clean up flame trails for pool reuse (without destroying the projectile)
   */
  cleanupForPool() {
    // Flame particles are managed by the instanced pool, just clear our tracking
    this.flames = [];
  }

  /**
   * Reset projectile for reuse from pool
   */
  reset(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    // Clean up old flame trails
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

    // Reinitialize particle pool reference
    this.flamePool = engine.getInstancedParticlePool('flames');

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
    this.hasExploded = false;
    this.hitEntities.clear();
    this.flameSpawnTimer = 0;
    this.active = true;
    this.shouldRemove = false;

    // Reset expiration timestamp
    this.expiresAt = engine.time + this.lifetime;

    // Show and position mesh
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(x, y, z);
      // Update size scaling if it changed
      const scale = 1.2 * (weapon?.sizeScale || 1.0);
      this.mesh.scale.set(scale, scale, 1);
    }
  }

  destroy() {
    // Flame particles are managed by the instanced pool, just clear our tracking
    this.flames = [];

    super.destroy();
  }
}
