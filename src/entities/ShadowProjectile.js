import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class ShadowProjectile extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);

    this.trails = [];
    this.trailSpawnTimer = 0;
    this.trailSpawnInterval = 0.04;
    this.hitEntities = new Set();
    this.pierceCount = 0;
  }

  createMesh() {
    // Create shadow bolt sprite with black center and white edges
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Outer white glow
    const outerGradient = ctx.createRadialGradient(32, 32, 20, 32, 32, 32);
    outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    outerGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)');
    outerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, 64, 64);

    // Dark purple-black core
    const innerGradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 18);
    innerGradient.addColorStop(0, 'rgba(40, 0, 60, 1)');
    innerGradient.addColorStop(0.5, 'rgba(20, 0, 30, 0.9)');
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);

    // Use spell level size scaling
    const scale = 1.0 * (this.weapon?.sizeScale || 1.0);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 999;

    this.mesh = sprite;
  }

  createShadowTrail() {
    // Create trailing shadow particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // White wispy edge
    const outerGradient = ctx.createRadialGradient(16, 16, 8, 16, 16, 16);
    outerGradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
    outerGradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.5)');
    outerGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, 32, 32);

    // Dark center
    const innerGradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 8);
    innerGradient.addColorStop(0, 'rgba(30, 0, 45, 0.8)');
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.6, 0.6, 1);
    sprite.renderOrder = 998;

    // Random offset from projectile path
    const offsetX = (Math.random() - 0.5) * 0.4;
    const offsetZ = (Math.random() - 0.5) * 0.4;

    sprite.position.set(
      this.x + offsetX,
      this.y + (Math.random() - 0.5) * 0.3,
      this.z + offsetZ
    );

    this.engine.scene.add(sprite);

    return {
      sprite: sprite,
      life: 0.4,
      age: 0,
      velocityY: Math.random() * 0.3 + 0.1
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
    this.y += this.dirY * this.speed * dt;
    this.z += this.dirZ * this.speed * dt;

    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    // Spawn shadow trail
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= this.trailSpawnInterval) {
      this.trailSpawnTimer = 0;
      this.trails.push(this.createShadowTrail());
    }

    // Update trail particles
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      trail.age += dt;

      if (trail.age > trail.life) {
        this.engine.scene.remove(trail.sprite);
        trail.sprite.material.map.dispose();
        trail.sprite.material.dispose();
        this.trails.splice(i, 1);
      } else {
        // Drift and fade
        trail.sprite.position.y += trail.velocityY * dt;
        trail.sprite.material.opacity = 1 - (trail.age / trail.life);
        trail.sprite.scale.multiplyScalar(1 - dt * 0.3);
      }
    }

    // Collision detection
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

  destroy() {
    // Clean up trail particles
    this.trails.forEach(trail => {
      this.engine.scene.remove(trail.sprite);
      if (trail.sprite.material.map) {
        trail.sprite.material.map.dispose();
      }
      trail.sprite.material.dispose();
    });
    this.trails = [];

    super.destroy();
  }
}
