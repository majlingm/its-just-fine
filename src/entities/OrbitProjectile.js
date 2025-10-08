import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class OrbitProjectile extends Projectile {
  constructor(engine, x, y, z, weapon, stats) {
    super(engine, x, y, z, 0, 0, weapon, stats);
    this.orbitRadius = 3;
    this.orbitSpeed = 3;
    this.angle = Math.random() * Math.PI * 2;
    this.lifetime = 999;
  }

  createMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');

    // Electric ring effect
    const gradient = ctx.createRadialGradient(24, 24, 10, 24, 24, 24);
    gradient.addColorStop(0, 'rgba(200, 240, 255, 0)');
    gradient.addColorStop(0.4, 'rgba(150, 220, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(100, 200, 255, 1)');
    gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 1.5, 1);

    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    const player = this.engine.game?.player;
    if (!player) {
      this.destroy();
      return;
    }

    this.angle += this.orbitSpeed * dt;
    this.x = player.x + Math.cos(this.angle) * this.orbitRadius;
    this.z = player.z + Math.sin(this.angle) * this.orbitRadius;

    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
  }

  hit() {
    // Orbit weapon doesn't get destroyed on hit
  }
}
