import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class ShadowProjectile extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);

    this.trails = []; // Track particle data for cleanup
    this.trailSpawnTimer = 0;
    this.trailSpawnInterval = 0.02; // Spawn more frequently for denser trail
    this.hitEntities = new Set();
    this.pierceCount = 0;

    // Get particle pool for shadow trails
    this.shadowTrailPool = engine.getInstancedParticlePool('shadow');
  }

  createMesh() {
    // Create shadow bolt sprite with fuzzy appearance
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Outer fuzzy white glow (softer, wider)
    const outerGradient = ctx.createRadialGradient(32, 32, 10, 32, 32, 32);
    outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    outerGradient.addColorStop(0.4, 'rgba(200, 200, 200, 0.5)');
    outerGradient.addColorStop(0.7, 'rgba(150, 150, 150, 0.3)');
    outerGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, 64, 64);

    // Dark purple-black core (softer edges for fuzzy look)
    const innerGradient = ctx.createRadialGradient(32, 32, 3, 32, 32, 15);
    innerGradient.addColorStop(0, 'rgba(40, 0, 60, 0.9)');
    innerGradient.addColorStop(0.5, 'rgba(20, 0, 30, 0.6)');
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);

    // Smaller size for the main bolt
    const scale = 0.7 * (this.weapon?.sizeScale || 1.0);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 999;

    this.mesh = sprite;
  }

  createShadowTrail() {
    // Choose shadow color variant (dark purple/gray tones)
    const colorChoice = Math.random();
    let color;
    if (colorChoice < 0.3) {
      color = 0x1e002d; // Dark purple
    } else if (colorChoice < 0.7) {
      color = 0x444444; // Gray
    } else {
      color = 0x888888; // Light gray
    }

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.4;
    const offsetZ = (Math.random() - 0.5) * 0.4;

    // Spawn particle using instanced pool
    const particle = this.shadowTrailPool.spawn(
      this.x + offsetX,
      this.y + (Math.random() - 0.5) * 0.3,
      this.z + offsetZ,
      {
        life: 0.4,
        scale: 2.0, // Even bigger particles for more visible trail
        velocity: { x: 0, y: Math.random() * 0.3 + 0.1, z: 0 },
        color: color,
        fadeOut: true,
        shrink: true,
        gravity: 0
      }
    );

    // Store particle reference for cleanup if needed
    if (particle) {
      return { particle, age: 0, life: 0.4 };
    }
    return null;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Only update position if not managed by group
    if (!this.managedByGroup) {
      this.x += this.dirX * this.speed * dt;
      this.y += this.dirY * this.speed * dt;
      this.z += this.dirZ * this.speed * dt;

      this.mesh.position.x = this.x;
      this.mesh.position.y = this.y;
      this.mesh.position.z = this.z;
    }

    // Spawn shadow trail
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= this.trailSpawnInterval) {
      this.trailSpawnTimer = 0;
      const trail = this.createShadowTrail();
      if (trail) {
        this.trails.push(trail);
      }
    }

    // Update trail particles - they're auto-updated by the pool,
    // just track for cleanup
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      trail.age += dt;

      if (trail.age > trail.life) {
        // Particle will be auto-removed by pool, just remove from our tracking
        this.trails.splice(i, 1);
      }
    }

    // Collision detection (unless managed by group)
    if (!this.managedByGroup) {
      this.checkCollisions();
    }
  }

  /**
   * Check collisions - can be called by ShadowBoltGroup or from update
   */
  checkCollisions() {
    this.engine.entities.forEach(entity => {
      if (!entity.active || entity.health === undefined || this.hitEntities.has(entity)) return;
      if (entity === this.engine.game?.player) return;

      const dx = entity.x - this.x;
      const dz = entity.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5) {
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
   * Clean up shadow trails for pool reuse (without destroying the projectile)
   */
  cleanupForPool() {
    // Shadow trail particles are managed by the instanced pool, just clear our tracking
    this.trails = [];
  }

  /**
   * Reset projectile for reuse from pool
   */
  reset(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    // Clean up old shadow trails
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
    this.shadowTrailPool = engine.getInstancedParticlePool('shadow');

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
    this.active = true;
    this.shouldRemove = false;

    // Show and position mesh
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(x, y, z);
      // Update size scaling if it changed (smaller size for fuzzy look)
      const scale = 0.7 * (weapon?.sizeScale || 1.0);
      this.mesh.scale.set(scale, scale, 1);
    }
  }

  destroy() {
    // Shadow trail particles are managed by the instanced pool, just clear our tracking
    this.trails = [];

    super.destroy();
  }
}
