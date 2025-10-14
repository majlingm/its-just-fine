import * as THREE from 'three';
import { Entity } from './Entity.js';

export class GroundLightningStrike extends Entity {
  constructor(engine, x, z, damage) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.damage = damage;
    this.lifetime = 0.5;
    this.age = 0;
    this.bolts = [];
    this.alwaysUpdate = true; // Always update to expire properly even when off-screen
    this.createLightningStrike();
  }

  createLightningStrike() {
    // Lightning bolt from sky to ground
    const startY = 20;
    const endY = 0;
    const segments = 20;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = startY + (endY - startY) * t;

      // Add horizontal random offset that increases near middle
      const jitter = Math.sin(t * Math.PI) * 2; // More jitter in middle
      const offsetX = (Math.random() - 0.5) * jitter;
      const offsetZ = (Math.random() - 0.5) * jitter;

      points.push(new THREE.Vector3(
        this.x + offsetX,
        y,
        this.z + offsetZ
      ));
    }

    // Main lightning bolt (bright blue-white)
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xccffff,
      linewidth: 5,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    const mainBolt = new THREE.Line(geometry, material);
    this.engine.scene.add(mainBolt);
    this.bolts.push(mainBolt);

    // Glow layer
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const glowBolt = new THREE.Line(geometry.clone(), glowMaterial);
    this.engine.scene.add(glowBolt);
    this.bolts.push(glowBolt);

    // Outer glow
    const outerGlowMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      linewidth: 8,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Line(geometry.clone(), outerGlowMaterial);
    this.engine.scene.add(outerGlow);
    this.bolts.push(outerGlow);

    // Create branching bolts
    const numBranches = 3;
    for (let b = 0; b < numBranches; b++) {
      const branchStart = Math.floor(segments * (0.3 + Math.random() * 0.4));
      const branchPoints = [];

      // Start from main bolt
      branchPoints.push(points[branchStart].clone());

      const branchSegments = 8;
      const branchDir = Math.random() * Math.PI * 2;
      const branchLength = 3;

      for (let i = 1; i <= branchSegments; i++) {
        const t = i / branchSegments;
        const y = points[branchStart].y - t * (points[branchStart].y * 0.5);
        const dist = t * branchLength;

        branchPoints.push(new THREE.Vector3(
          points[branchStart].x + Math.cos(branchDir) * dist + (Math.random() - 0.5) * 0.5,
          y,
          points[branchStart].z + Math.sin(branchDir) * dist + (Math.random() - 0.5) * 0.5
        ));
      }

      const branchGeom = new THREE.BufferGeometry().setFromPoints(branchPoints);
      const branchMat = new THREE.LineBasicMaterial({
        color: 0x88ccff,
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const branch = new THREE.Line(branchGeom, branchMat);
      this.engine.scene.add(branch);
      this.bolts.push(branch);
    }

    // Ground impact circle
    const circleSegments = 16;
    const circlePoints = [];
    const impactRadius = 1.5;

    for (let i = 0; i <= circleSegments; i++) {
      const angle = (i / circleSegments) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(
        this.x + Math.cos(angle) * impactRadius,
        0.05,
        this.z + Math.sin(angle) * impactRadius
      ));
    }

    const circleGeom = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 4,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    const circle = new THREE.Line(circleGeom, circleMat);
    this.engine.scene.add(circle);
    this.bolts.push(circle);

    this.mesh = mainBolt; // For entity system compatibility

    // Damage enemies in impact radius
    this.damageEnemiesInRadius(impactRadius);
  }

  damageEnemiesInRadius(radius) {
    this.engine.entities.forEach(entity => {
      if (!entity.active || entity.health === undefined) return;
      if (entity === this.engine.game?.player) return; // Don't damage player

      const dx = entity.x - this.x;
      const dz = entity.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= radius) {
        const died = entity.takeDamage(this.damage);
        if (died && this.engine.game) {
          this.engine.game.killCount++;
          this.engine.sound.playHit();
          this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
        }
      }
    });
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Quick flash then fade
    let opacity;
    if (this.age < 0.1) {
      opacity = 1;
    } else {
      opacity = 1 - ((this.age - 0.1) / (this.lifetime - 0.1));
    }

    this.bolts.forEach(bolt => {
      const baseopacity = bolt.material.opacity;
      bolt.material.opacity = opacity * (baseopacity / Math.max(0.1, bolt.material.opacity || 1));
    });
  }

  destroy() {
    this.bolts.forEach(bolt => {
      this.engine.scene.remove(bolt);
      if (bolt.geometry) {
        bolt.geometry.dispose();
      }
      if (bolt.material) {
        bolt.material.dispose();
      }
    });
    this.active = false;
    this.shouldRemove = true;
  }
}
