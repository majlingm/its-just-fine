import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { resourceCache } from '../systems/ResourceCache.js';

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
    // Use cached flame trail materials
    const colorChoice = Math.random();
    let colorType;
    if (colorChoice < 0.3) {
      colorType = 'yellow';
    } else if (colorChoice < 0.7) {
      colorType = 'orange';
    } else {
      colorType = 'red';
    }

    // Get cached material (cloned so we can modify opacity independently)
    const material = resourceCache.getFlameTrailMaterial(colorType);
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
