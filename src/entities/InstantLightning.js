import * as THREE from 'three';
import { Entity } from './Entity.js';

export class InstantLightning extends Entity {
  constructor(engine, startX, startY, startZ, endX, endY, endZ, damage) {
    super();
    this.engine = engine;
    this.startX = startX;
    this.startY = startY;
    this.startZ = startZ;
    this.endX = endX;
    this.endY = endY;
    this.endZ = endZ;
    this.damage = damage;
    this.lifetime = 0.2;
    this.age = 0;
    this.bolts = [];
    this.createBolts();
  }

  createBolts() {
    // Create jagged lightning bolt
    const segments = 12;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = this.startX + (this.endX - this.startX) * t;
      const y = this.startY + (this.endY - this.startY) * t;
      const z = this.startZ + (this.endZ - this.startZ) * t;

      // Add random offset perpendicular to the line
      const offset = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * 0.8;
      const dx = this.endZ - this.startZ;
      const dz = -(this.endX - this.startX);
      const mag = Math.sqrt(dx * dx + dz * dz) || 1;

      points.push(new THREE.Vector3(
        x + (dx / mag) * offset,
        y + (Math.random() - 0.5) * 0.4,
        z + (dz / mag) * offset
      ));
    }

    // Main bolt (blue)
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      linewidth: 4,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    const bolt = new THREE.Line(geometry, material);
    this.engine.scene.add(bolt);
    this.bolts.push(bolt);

    // Glow (white)
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const glowBolt = new THREE.Line(geometry.clone(), glowMaterial);
    this.engine.scene.add(glowBolt);
    this.bolts.push(glowBolt);

    this.mesh = bolt; // For entity system compatibility
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Fade out
    const opacity = 1 - (this.age / this.lifetime);
    this.bolts.forEach(bolt => {
      bolt.material.opacity = opacity;
    });
  }

  destroy() {
    this.bolts.forEach(bolt => {
      this.engine.scene.remove(bolt);
    });
    this.active = false;
    this.shouldRemove = true;
  }
}
