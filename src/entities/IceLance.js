import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { resourceCache } from '../systems/ResourceCache.js';

export class IceLance extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    this.iceShards = []; // Track particle data for cleanup
    this.shardSpawnTimer = 0;
    this.shardSpawnInterval = 0.04;
    this.hitEntities = new Set();
    this.pierceCount = 0;

    // Get particle pool for ice shards
    this.iceShardPool = engine.getInstancedParticlePool('ice');
  }

  createMesh() {
    // Use spell level size scaling
    const sizeScale = this.weapon?.sizeScale || 1.0;

    // Create icicle shape using a cone geometry
    const geometry = new THREE.ConeGeometry(0.15 * sizeScale, 0.8 * sizeScale, 6);

    // Rotate to point horizontally
    geometry.rotateX(Math.PI / 2);

    // Create ice material with transparency and shimmer
    const material = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Add glowing core using sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(200, 240, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(150, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5 * sizeScale, 0.5 * sizeScale, 1);
    sprite.renderOrder = 999;

    // Group mesh and sprite
    const group = new THREE.Group();
    group.add(mesh);
    group.add(sprite);

    this.mesh = group;
    this.iceMesh = mesh;
  }

  createIceShard() {
    // Choose ice shard color variant
    const colorChoice = Math.random();
    let color;
    if (colorChoice < 0.3) {
      color = 0xffffff; // White
    } else if (colorChoice < 0.7) {
      color = 0xaaddff; // Light blue
    } else {
      color = 0x88ddff; // Cyan
    }

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.2;
    const offsetZ = (Math.random() - 0.5) * 0.2;

    // Spawn particle using instanced pool
    const particle = this.iceShardPool.spawn(
      this.x + offsetX,
      this.y + (Math.random() - 0.5) * 0.1,
      this.z + offsetZ,
      {
        life: 0.25,
        scale: 0.3,
        velocity: { x: 0, y: (Math.random() - 0.5) * 0.3, z: 0 },
        color: color,
        fadeOut: true,
        shrink: true,
        gravity: 0
      }
    );

    // Store particle reference for cleanup if needed
    if (particle) {
      return { particle, age: 0, life: 0.25 };
    }
    return null;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Check expiration timestamp (works even when not updated due to frustum culling)
    if (this.engine.time >= this.expiresAt) {
      this.destroy();
      return;
    }

    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt; // 3D movement
    this.z += this.dirZ * this.speed * dt;
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    // Rotate icicle to face direction of movement
    // After rotateX(PI/2), cone points along +Z, we need to align it with direction vector
    const angle = Math.atan2(this.dirX, this.dirZ);
    this.mesh.rotation.y = -angle;

    // Slight spinning animation
    this.iceMesh.rotation.z += dt * 5;

    // Spawn ice shard trail
    this.shardSpawnTimer += dt;
    if (this.shardSpawnTimer >= this.shardSpawnInterval) {
      this.shardSpawnTimer = 0;
      const shard = this.createIceShard();
      if (shard) {
        this.iceShards.push(shard);
      }
    }

    // Update ice shard particles - they're auto-updated by the pool,
    // just track for cleanup
    for (let i = this.iceShards.length - 1; i >= 0; i--) {
      const shard = this.iceShards[i];
      shard.age += dt;

      if (shard.age > shard.life) {
        // Particle will be auto-removed by pool, just remove from our tracking
        this.iceShards.splice(i, 1);
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

        const died = entity.takeDamage(this.damage, this.isCrit);
        if (died && this.engine.game) {
          this.engine.game.killCount++;
          this.engine.sound.playHit();
          this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
        }

        // Apply freeze effect with spell level duration
        if (!died && entity.applyFreeze) {
          const freezeDuration = this.weapon?.freezeDuration || 10.0;
          entity.applyFreeze(freezeDuration);
        }

        if (this.pierceCount > this.pierce) {
          this.destroy();
        }
      }
    });
  }

  /**
   * Clean up ice shards for pool reuse (without destroying the projectile)
   */
  cleanupForPool() {
    // Ice shard particles are managed by the instanced pool, just clear our tracking
    this.iceShards = [];
  }

  /**
   * Reset projectile for reuse from pool
   */
  reset(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    // Clean up old ice shards
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
    this.iceShardPool = engine.getInstancedParticlePool('ice');

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
    this.shardSpawnTimer = 0;
    this.active = true;
    this.shouldRemove = false;

    // Reset expiration timestamp
    this.expiresAt = engine.time + this.lifetime;

    // Show and position mesh
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(x, y, z);
      this.mesh.rotation.set(0, 0, 0);

      // Update size scaling if it changed
      const sizeScale = weapon?.sizeScale || 1.0;
      if (this.iceMesh) {
        this.iceMesh.scale.set(sizeScale, sizeScale, sizeScale);
      }
    }
  }

  destroy() {
    // Ice shard particles are managed by the instanced pool, just clear our tracking
    this.iceShards = [];

    super.destroy();
  }
}
