import * as THREE from 'three';
import { Entity } from './Entity.js';

export class ElectricFieldEffect extends Entity {
  constructor(engine, x, z, radius, duration, damage, damageInterval = 0.3) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.radius = radius;
    this.lifetime = duration;
    this.age = 0;
    this.damage = damage;
    this.damageInterval = damageInterval;
    this.lastDamageTime = 0;
    this.arcs = [];
    this.createField();
  }

  createField() {
    // Create circular electric field on the ground
    const segments = 32;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = this.x + Math.cos(angle) * this.radius;
      const z = this.z + Math.sin(angle) * this.radius;
      points.push(new THREE.Vector3(x, 0.1, z));
    }

    // Outer ring
    const ringGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x00ddff,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Line(ringGeometry, ringMaterial);
    this.engine.scene.add(ring);
    this.arcs.push(ring);

    // Inner glow ring
    const innerPoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = this.x + Math.cos(angle) * this.radius * 0.7;
      const z = this.z + Math.sin(angle) * this.radius * 0.7;
      innerPoints.push(new THREE.Vector3(x, 0.15, z));
    }
    const innerRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(innerPoints),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      })
    );
    this.engine.scene.add(innerRing);
    this.arcs.push(innerRing);

    // Create random electric arcs within the field
    this.arcUpdateTimer = 0;
    this.mesh = ring; // For entity system compatibility
  }

  createRandomArc() {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const r1 = Math.random() * this.radius;
    const r2 = Math.random() * this.radius;

    const x1 = this.x + Math.cos(angle1) * r1;
    const z1 = this.z + Math.sin(angle1) * r1;
    const x2 = this.x + Math.cos(angle2) * r2;
    const z2 = this.z + Math.sin(angle2) * r2;

    const points = [];
    const segments = 6;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const y = 0.1 + Math.random() * 0.3;

      // Add jagged offset
      const offset = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * 0.5;
      const dx = z2 - z1;
      const dz = -(x2 - x1);
      const mag = Math.sqrt(dx * dx + dz * dz) || 1;

      points.push(new THREE.Vector3(
        x + (dx / mag) * offset,
        y,
        z + (dz / mag) * offset
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x88ddff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const arc = new THREE.Line(geometry, material);
    this.engine.scene.add(arc);

    return { line: arc, life: 0.1, age: 0 };
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Pulse effect
    const pulse = Math.sin(this.age * 15) * 0.3 + 0.7;
    this.arcs.forEach(arc => {
      if (arc.material) {
        arc.material.opacity = pulse * (1 - this.age / this.lifetime);
      }
    });

    // Create random arcs
    this.arcUpdateTimer += dt;
    if (this.arcUpdateTimer > 0.05 && this.arcs.length < 20) {
      this.arcUpdateTimer = 0;
      if (Math.random() < 0.5) {
        this.arcs.push(this.createRandomArc());
      }
    }

    // Update and remove old arcs
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const arc = this.arcs[i];
      if (arc.age !== undefined) {
        arc.age += dt;
        if (arc.age > arc.life) {
          this.engine.scene.remove(arc.line);
          this.arcs.splice(i, 1);
        } else {
          arc.line.material.opacity = 1 - (arc.age / arc.life);
        }
      }
    }

    // Damage enemies in range
    const currentTime = this.age;
    if (currentTime - this.lastDamageTime >= this.damageInterval) {
      this.lastDamageTime = currentTime;

      this.engine.entities.forEach(entity => {
        if (!entity.active || entity.health === undefined) return;
        if (entity === this.engine.game?.player) return; // Don't damage player

        const dx = entity.x - this.x;
        const dz = entity.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= this.radius) {
          const died = entity.takeDamage(this.damage);
          if (died && this.engine.game) {
            this.engine.game.killCount++;
            this.engine.sound.playHit();
            this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
          }
        }
      });
    }
  }

  destroy() {
    this.arcs.forEach(arc => {
      if (arc.line) {
        this.engine.scene.remove(arc.line);
      } else {
        this.engine.scene.remove(arc);
      }
    });
    this.active = false;
    this.shouldRemove = true;
  }
}
