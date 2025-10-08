import * as THREE from 'three';
import { Entity } from './Entity.js';

/**
 * EnemyProjectile - Slow, dodgable projectile fired by enemies
 */
export class EnemyProjectile extends Entity {
  constructor(engine, x, y, z, dirX, dirZ, damage = 10, speed = 8) {
    super();

    this.engine = engine;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dirX = dirX;
    this.dirZ = dirZ;
    this.damage = damage;
    this.speed = speed;
    this.lifetime = 5.0; // Despawn after 5 seconds
    this.age = 0;

    // Trail particles for visual feedback
    this.trails = [];
    this.trailSpawnTimer = 0;
    this.trailSpawnInterval = 0.1; // Spawn trail every 0.1s

    this.createVisual();
  }

  createVisual() {
    // Create glowing orb projectile
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Orange/red energy ball
    const gradient = ctx.createRadialGradient(16, 16, 4, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 220, 100, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 140, 50, 0.9)');
    gradient.addColorStop(0.6, 'rgba(255, 60, 30, 0.7)');
    gradient.addColorStop(1, 'rgba(200, 40, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Sprite(material);
    this.mesh.scale.set(0.8, 0.8, 1);
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.renderOrder = 100;
  }

  createTrailParticle() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255, 140, 50, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 80, 40, 0.5)');
    gradient.addColorStop(1, 'rgba(200, 40, 20, 0)');
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
    sprite.scale.set(0.4, 0.4, 1);
    sprite.renderOrder = 99;

    return {
      mesh: sprite,
      x: this.x,
      y: this.y,
      z: this.z,
      life: 0.3,
      age: 0,
      texture: texture,
      material: material
    };
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Despawn if too old
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Move projectile
    this.x += this.dirX * this.speed * dt;
    this.z += this.dirZ * this.speed * dt;

    // Update mesh position
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);

      // Slight bobbing motion for visual interest
      this.mesh.position.y += Math.sin(this.age * 10) * 0.05;
    }

    // Spawn trail particles
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= this.trailSpawnInterval) {
      this.trailSpawnTimer = 0;
      const trail = this.createTrailParticle();
      this.trails.push(trail);
      this.engine.scene.add(trail.mesh);
    }

    // Update trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      trail.age += dt;

      if (trail.age >= trail.life) {
        this.engine.scene.remove(trail.mesh);
        trail.texture.dispose();
        trail.material.dispose();
        this.trails.splice(i, 1);
      } else {
        // Fade out trail
        const fadeProgress = trail.age / trail.life;
        trail.material.opacity = 1 - fadeProgress;
        trail.mesh.scale.multiplyScalar(0.98);
      }
    }

    // Check collision with player
    const player = this.engine.game?.player;
    if (player && player.active) {
      const dx = player.x - this.x;
      const dz = player.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1.0) {
        // Hit player
        const godMode = this.engine.game?.godMode;
        if (!godMode && player.takeDamage && player.takeDamage(this.damage, 'Enemy projectile')) {
          // Player died
          if (this.engine.game && this.engine.game.onGameOver) {
            this.engine.game.gameOver = true;
          }
        }
        this.destroy();
      }
    }
  }

  hit() {
    this.destroy();
  }

  destroy() {
    // Clean up trails
    this.trails.forEach(trail => {
      this.engine.scene.remove(trail.mesh);
      trail.texture.dispose();
      trail.material.dispose();
    });
    this.trails = [];

    super.destroy();
  }
}
