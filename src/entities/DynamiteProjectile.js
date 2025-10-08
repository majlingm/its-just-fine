import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { Enemy } from './Enemy.js';

export class DynamiteProjectile extends Projectile {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    this.explosionRadius = 5;
    this.hasExploded = false;
  }

  createMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ff4444';
    ctx.fillRect(8, 12, 16, 10);

    ctx.fillStyle = '#333333';
    ctx.fillRect(14, 8, 4, 4);

    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(14, 4, 4, 4);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1, 1, 1);

    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    if (this.age > this.lifetime && !this.hasExploded) {
      this.explode();
      return;
    }

    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt; // 3D movement
    this.z += this.dirZ * this.speed * dt;

    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    this.mesh.material.opacity = Math.floor(this.age * 10) % 2 === 0 ? 1 : 0.5;
  }

  explode() {
    this.hasExploded = true;

    this.engine.sound.playExplosion();

    const explosionCanvas = document.createElement('canvas');
    explosionCanvas.width = 128;
    explosionCanvas.height = 128;
    const ctx = explosionCanvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const explosionTexture = new THREE.CanvasTexture(explosionCanvas);
    const explosionMat = new THREE.SpriteMaterial({
      map: explosionTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const explosion = new THREE.Sprite(explosionMat);
    explosion.scale.set(this.explosionRadius * 2, this.explosionRadius * 2, 1);
    explosion.position.set(this.x, 1, this.z);
    this.engine.scene.add(explosion);

    const enemies = this.engine.entities.filter(e => e instanceof Enemy && e.active);
    enemies.forEach(enemy => {
      const dx = enemy.x - this.x;
      const dz = enemy.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < this.explosionRadius) {
        if (enemy.takeDamage(this.damage)) {
          this.engine.game.killCount++;
          this.engine.game.dropXP(enemy.x, enemy.z, enemy.isElite);
        }
      }
    });

    setTimeout(() => {
      this.engine.scene.remove(explosion);
    }, 200);

    this.destroy();
  }

  hit() {
  }
}
