import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class IceLance extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    this.iceShards = [];
    this.shardSpawnTimer = 0;
    this.shardSpawnInterval = 0.04;
    this.hitEntities = new Set();
    this.pierceCount = 0;
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
    // Create ice shard particle
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    const colorChoice = Math.random();
    if (colorChoice < 0.3) {
      // White ice
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(230, 245, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
    } else if (colorChoice < 0.7) {
      // Light blue ice
      gradient.addColorStop(0, 'rgba(230, 245, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
    } else {
      // Cyan ice
      gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(150, 210, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.3, 0.3, 1);
    sprite.renderOrder = 998;

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.2;
    const offsetZ = (Math.random() - 0.5) * 0.2;

    sprite.position.set(
      this.x + offsetX,
      this.y + (Math.random() - 0.5) * 0.1,
      this.z + offsetZ
    );

    this.engine.scene.add(sprite);

    return {
      sprite: sprite,
      life: 0.25,
      age: 0,
      velocityY: (Math.random() - 0.5) * 0.3
    };
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
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
      this.iceShards.push(this.createIceShard());
    }

    // Update ice shard particles
    for (let i = this.iceShards.length - 1; i >= 0; i--) {
      const shard = this.iceShards[i];
      shard.age += dt;

      if (shard.age > shard.life) {
        this.engine.scene.remove(shard.sprite);
        this.iceShards.splice(i, 1);
      } else {
        // Drift and fade
        shard.sprite.position.y += shard.velocityY * dt;
        shard.sprite.material.opacity = 1 - (shard.age / shard.life);
        shard.sprite.scale.multiplyScalar(1 - dt * 0.3);
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

        const died = entity.takeDamage(this.damage);
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

  destroy() {
    // Clean up ice shard particles
    this.iceShards.forEach(shard => {
      this.engine.scene.remove(shard.sprite);
    });
    this.iceShards = [];

    super.destroy();
  }
}
