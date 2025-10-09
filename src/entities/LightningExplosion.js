import * as THREE from 'three';
import { Entity } from './Entity.js';
import { resourceCache } from '../systems/ResourceCache.js';

export class LightningExplosion extends Entity {
  constructor(engine, x, z, radius, damage) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.radius = radius;
    this.damage = damage;
    this.lifetime = 0.6;
    this.age = 0;
    this.particles = [];
    this.hasDamaged = false;
    this.createExplosion();
  }

  createExplosion() {
    // Create blue electric explosion particles
    const numParticles = 30;

    for (let i = 0; i < numParticles; i++) {
      // Use cached materials for lightning particles
      const colorChoice = Math.random();
      let colorType;
      if (colorChoice < 0.3) {
        colorType = 'white';
      } else if (colorChoice < 0.7) {
        colorType = 'blue';
      } else {
        colorType = 'purple';
      }

      // Get cached material and clone it for independent properties
      const baseMaterial = resourceCache.getLightningParticleMaterial(colorType);
      const material = baseMaterial.clone();
      const sprite = new THREE.Sprite(material);

      const angle = (i / numParticles) * Math.PI * 2;
      const distance = Math.random() * 0.3;
      const velocityMagnitude = 3 + Math.random() * 5;

      sprite.position.set(
        this.x + Math.cos(angle) * distance,
        0.2 + Math.random() * 0.3,
        this.z + Math.sin(angle) * distance
      );

      const initialScale = 0.3 + Math.random() * 0.3;
      sprite.scale.set(initialScale, initialScale, 1);

      this.engine.scene.add(sprite);

      this.particles.push({
        sprite: sprite,
        velocityX: Math.cos(angle) * velocityMagnitude,
        velocityZ: Math.sin(angle) * velocityMagnitude,
        velocityY: Math.random() * 2 + 1,
        initialScale: initialScale,
        maxScale: initialScale * (2 + Math.random() * 2)
      });
    }

    // Create expanding shockwave rings
    this.shockwaveRings = [];
    const ringCount = 3;

    for (let r = 0; r < ringCount; r++) {
      const circleSegments = 32;
      const circlePoints = [];

      for (let i = 0; i <= circleSegments; i++) {
        const angle = (i / circleSegments) * Math.PI * 2;
        const startRadius = this.radius * 0.3;
        circlePoints.push(new THREE.Vector3(
          this.x + Math.cos(angle) * startRadius,
          0.05,
          this.z + Math.sin(angle) * startRadius
        ));
      }

      const circleGeom = new THREE.BufferGeometry().setFromPoints(circlePoints);
      const circleMat = new THREE.LineBasicMaterial({
        color: 0x88ddff,
        linewidth: 8,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Line(circleGeom, circleMat);
      this.engine.scene.add(ring);

      this.shockwaveRings.push({
        mesh: ring,
        startRadius: this.radius * 0.3,
        targetRadius: this.radius * (1 + r * 0.3),
        delay: r * 0.05, // Stagger the rings
        age: 0
      });
    }

    this.mesh = null; // For entity system compatibility
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Damage enemies once at start with high damage
    if (!this.hasDamaged) {
      this.hasDamaged = true;
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

    // Update particles
    const progress = this.age / this.lifetime;

    this.particles.forEach(particle => {
      // Expand outward
      particle.sprite.position.x += particle.velocityX * dt;
      particle.sprite.position.z += particle.velocityZ * dt;

      // Rise and slow down
      particle.velocityY -= dt * 5; // Gravity
      particle.sprite.position.y += particle.velocityY * dt;

      // Grow then shrink
      let scale;
      if (progress < 0.3) {
        scale = particle.initialScale + (particle.maxScale - particle.initialScale) * (progress / 0.3);
      } else {
        scale = particle.maxScale * (1 - ((progress - 0.3) / 0.7));
      }
      particle.sprite.scale.set(scale, scale, 1);

      // Fade out
      particle.sprite.material.opacity = 1 - progress;
    });

    // Update shockwave rings
    this.shockwaveRings.forEach(ring => {
      ring.age += dt;

      // Start expanding after delay
      if (ring.age > ring.delay) {
        const ringProgress = Math.min(1, (ring.age - ring.delay) / 0.3);
        const currentRadius = ring.startRadius + (ring.targetRadius - ring.startRadius) * ringProgress;

        // Update ring geometry
        const positions = ring.mesh.geometry.attributes.position.array;
        const circleSegments = (positions.length / 3) - 1;

        for (let i = 0; i <= circleSegments; i++) {
          const angle = (i / circleSegments) * Math.PI * 2;
          positions[i * 3] = this.x + Math.cos(angle) * currentRadius;
          positions[i * 3 + 2] = this.z + Math.sin(angle) * currentRadius;
        }
        ring.mesh.geometry.attributes.position.needsUpdate = true;

        // Fade out as it expands
        ring.mesh.material.opacity = 0.5 * (1 - ringProgress);
      }
    });
  }

  destroy() {
    this.particles.forEach(particle => {
      this.engine.scene.remove(particle.sprite);
    });
    this.particles = [];

    // Clean up shockwave rings
    this.shockwaveRings.forEach(ring => {
      this.engine.scene.remove(ring.mesh);
      if (ring.mesh.geometry) {
        ring.mesh.geometry.dispose();
      }
      if (ring.mesh.material) {
        ring.mesh.material.dispose();
      }
    });
    this.shockwaveRings = [];

    this.active = false;
    this.shouldRemove = true;
  }
}
