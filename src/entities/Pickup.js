import * as THREE from 'three';
import { Entity } from './Entity.js';
import { createPickupSprite } from '../utils/sprites.js';

export class Pickup extends Entity {
  constructor(engine, x, z, type = 'xp', value = 1) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.type = type;
    this.value = value;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.createMesh();
  }

  createMesh() {
    // Create small round yellow/red XP pickup with glow
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');

    // Outer red glow (round)
    const outerGlow = ctx.createRadialGradient(12, 12, 4, 12, 12, 12);
    outerGlow.addColorStop(0, 'rgba(255, 100, 50, 0.6)');
    outerGlow.addColorStop(0.6, 'rgba(255, 150, 0, 0.3)');
    outerGlow.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // Core yellow (round)
    const coreGlow = ctx.createRadialGradient(12, 12, 1, 12, 12, 6);
    coreGlow.addColorStop(0, 'rgba(255, 255, 200, 1)');
    coreGlow.addColorStop(0.4, 'rgba(255, 200, 50, 0.9)');
    coreGlow.addColorStop(1, 'rgba(255, 150, 0, 0.5)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(12, 12, 6, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.3, 0.3, 1);

    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;

    // Bobbing motion
    this.mesh.position.y = 0.3 + Math.sin(this.engine.time * 3 + this.bobOffset) * 0.1;

    // Pulsing scale effect
    const pulse = 1 + Math.sin(this.engine.time * 4 + this.bobOffset) * 0.2;
    this.mesh.scale.set(0.3 * pulse, 0.3 * pulse, 1);

    // Pulsing glow effect
    this.mesh.material.opacity = 0.8 + Math.sin(this.engine.time * 5 + this.bobOffset) * 0.2;
  }

  moveToward(targetX, targetZ, speed, dt) {
    const dx = targetX - this.x;
    const dz = targetZ - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0) {
      this.x += (dx / dist) * speed * dt;
      this.z += (dz / dist) * speed * dt;
    }
  }
}
