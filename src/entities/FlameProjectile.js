import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class FlameProjectile extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);

    this.flames = [];
    this.flameSpawnTimer = 0;
    this.flameSpawnInterval = 0.03;
    this.hitEntities = new Set();
    this.pierceCount = 0;
  }

  createMesh() {
    // Create main fire sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 150, 0, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    // Use spell level size scaling
    const scale = 1.2 * (this.weapon?.sizeScale || 1.0);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 999;

    this.mesh = sprite;
  }

  createFlameTrail() {
    // Create flame trail particle
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(12, 12, 1, 12, 12, 12);
    const colorChoice = Math.random();
    if (colorChoice < 0.3) {
      // Yellow flame
      gradient.addColorStop(0, 'rgba(255, 255, 150, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    } else if (colorChoice < 0.7) {
      // Orange flame
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(200, 50, 0, 0)');
    } else {
      // Red flame
      gradient.addColorStop(0, 'rgba(255, 150, 100, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 24, 24);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.renderOrder = 998;

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.3;
    const offsetZ = (Math.random() - 0.5) * 0.3;

    sprite.position.set(
      this.x + offsetX,
      this.y + (Math.random() - 0.5) * 0.2,
      this.z + offsetZ
    );

    this.engine.scene.add(sprite);

    return {
      sprite: sprite,
      life: 0.3,
      age: 0,
      velocityY: Math.random() * 0.5 + 0.2
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

    // Spawn flame trail
    this.flameSpawnTimer += dt;
    if (this.flameSpawnTimer >= this.flameSpawnInterval) {
      this.flameSpawnTimer = 0;
      this.flames.push(this.createFlameTrail());
    }

    // Update flame particles
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const flame = this.flames[i];
      flame.age += dt;

      if (flame.age > flame.life) {
        this.engine.scene.remove(flame.sprite);
        this.flames.splice(i, 1);
      } else {
        // Rise up and fade
        flame.sprite.position.y += flame.velocityY * dt;
        flame.sprite.material.opacity = 1 - (flame.age / flame.life);
        flame.sprite.scale.multiplyScalar(1 - dt * 0.5);
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

        if (this.pierceCount > this.pierce) {
          this.destroy();
        }
      }
    });
  }

  destroy() {
    // Clean up flame particles
    this.flames.forEach(flame => {
      this.engine.scene.remove(flame.sprite);
    });
    this.flames = [];

    super.destroy();
  }
}
