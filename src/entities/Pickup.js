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
    // Create small round pickup with glow (color depends on type)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Different colors and sizes for different types
    let outerColor1, outerColor2, outerColor3, coreColor1, coreColor2, coreColor3;
    let scale;

    if (this.type === 'health') {
      // Health pickups use larger canvas for bigger outline
      canvas.width = 48;
      canvas.height = 48;
      const center = 24;

      // Outer white/pink glow ring
      const outlineGlow = ctx.createRadialGradient(center, center, 16, center, center, 24);
      outlineGlow.addColorStop(0, 'rgba(255, 200, 200, 0)');
      outlineGlow.addColorStop(0.5, 'rgba(255, 150, 150, 0.6)');
      outlineGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = outlineGlow;
      ctx.beginPath();
      ctx.arc(center, center, 24, 0, Math.PI * 2);
      ctx.fill();

      // Large bright red body
      const outerGlow = ctx.createRadialGradient(center, center, 2, center, center, 18);
      outerGlow.addColorStop(0, 'rgba(255, 50, 50, 1)');
      outerGlow.addColorStop(0.3, 'rgba(255, 0, 0, 1)');
      outerGlow.addColorStop(0.7, 'rgba(200, 0, 0, 0.9)');
      outerGlow.addColorStop(1, 'rgba(255, 0, 0, 0.4)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(center, center, 18, 0, Math.PI * 2);
      ctx.fill();

      // Small bright center highlight
      const coreGlow = ctx.createRadialGradient(center, center, 0, center, center, 6);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGlow.addColorStop(0.5, 'rgba(255, 150, 150, 1)');
      coreGlow.addColorStop(1, 'rgba(255, 50, 50, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(center, center, 6, 0, Math.PI * 2);
      ctx.fill();

      scale = 1.0; // Much larger than XP
    } else {
      // XP pickups - small and simple
      canvas.width = 24;
      canvas.height = 24;

      // Yellow/orange XP pickup
      outerColor1 = 'rgba(255, 100, 50, 0.6)';
      outerColor2 = 'rgba(255, 150, 0, 0.3)';
      outerColor3 = 'rgba(255, 200, 0, 0)';
      coreColor1 = 'rgba(255, 255, 200, 1)';
      coreColor2 = 'rgba(255, 200, 50, 0.9)';
      coreColor3 = 'rgba(255, 150, 0, 0.5)';

      // Outer glow (round)
      const outerGlow = ctx.createRadialGradient(12, 12, 4, 12, 12, 12);
      outerGlow.addColorStop(0, outerColor1);
      outerGlow.addColorStop(0.6, outerColor2);
      outerGlow.addColorStop(1, outerColor3);
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(12, 12, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core (round)
      const coreGlow = ctx.createRadialGradient(12, 12, 1, 12, 12, 6);
      coreGlow.addColorStop(0, coreColor1);
      coreGlow.addColorStop(0.4, coreColor2);
      coreGlow.addColorStop(1, coreColor3);
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();

      scale = 0.3; // Normal size
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scale, scale, 1);

    this.mesh = sprite;
    this.baseScale = scale; // Store for pulsing animation
  }

  update(dt) {
    if (!this.active) return;
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;

    const scale = this.baseScale || 0.3;

    if (this.type === 'health') {
      // Health pickups: dramatic pulsing and bobbing
      this.mesh.position.y = 0.5 + Math.sin(this.engine.time * 2 + this.bobOffset) * 0.2;

      // Strong pulse effect with outline breathing
      const pulse = 1 + Math.sin(this.engine.time * 3 + this.bobOffset) * 0.3;
      this.mesh.scale.set(scale * pulse, scale * pulse, 1);

      // Strong opacity pulsing for the outline
      this.mesh.material.opacity = 0.7 + Math.sin(this.engine.time * 3 + this.bobOffset) * 0.3;
    } else {
      // XP pickups: gentle bobbing
      this.mesh.position.y = 0.3 + Math.sin(this.engine.time * 3 + this.bobOffset) * 0.1;

      // Gentle pulsing scale effect
      const pulse = 1 + Math.sin(this.engine.time * 4 + this.bobOffset) * 0.2;
      this.mesh.scale.set(scale * pulse, scale * pulse, 1);

      // Gentle glow effect
      this.mesh.material.opacity = 0.8 + Math.sin(this.engine.time * 5 + this.bobOffset) * 0.2;
    }
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
