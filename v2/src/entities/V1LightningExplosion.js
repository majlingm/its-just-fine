import * as THREE from 'three';
import { Entity } from './V1Entity.js';
import { resourceCache } from '../systems/V1ResourceCache.js';

export class LightningExplosion extends Entity {
  constructor(engine, x, z, radius, damage, isCrit = false) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.radius = radius;
    this.damage = damage;
    this.isCrit = isCrit;
    this.lifetime = 0.6;
    this.age = 0;
    this.particles = []; // Store particle tracking data
    this.hasDamaged = false;
    this.alwaysUpdate = true; // Always update to expire properly even when off-screen

    // Get particle pool
    this.particlePool = engine.getInstancedParticlePool('lightning_explosion');

    this.createExplosion();
  }

  createExplosion() {
    // Create blue electric explosion particles
    const numParticles = 30;

    for (let i = 0; i < numParticles; i++) {
      // Choose lightning color variant
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.3) {
        color = 0xffffff; // White
      } else if (colorChoice < 0.7) {
        color = 0x88ddff; // Blue
      } else {
        color = 0xcc88ff; // Purple
      }

      const angle = (i / numParticles) * Math.PI * 2;
      const distance = Math.random() * 0.3;
      const velocityMagnitude = 3 + Math.random() * 5;

      const initialScale = 0.3 + Math.random() * 0.3;
      const maxScale = initialScale * (2 + Math.random() * 2);

      // Spawn particle using instanced pool
      const particle = this.particlePool.spawn(
        this.x + Math.cos(angle) * distance,
        0.2 + Math.random() * 0.3,
        this.z + Math.sin(angle) * distance,
        {
          life: this.lifetime,
          scale: initialScale,
          velocity: {
            x: Math.cos(angle) * velocityMagnitude,
            y: Math.random() * 2 + 1,
            z: Math.sin(angle) * velocityMagnitude
          },
          color: color,
          fadeOut: false, // We'll handle fading manually for grow/shrink effect
          shrink: false, // We'll handle scaling manually
          gravity: -5 // Apply gravity
        }
      );

      // Store tracking data for custom grow/shrink animation
      if (particle) {
        this.particles.push({
          particle: particle,
          initialScale: initialScale,
          maxScale: maxScale
        });
      }
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
        if (entity.hasTag && entity.hasTag('player')) return; // Don't damage player

        const dx = entity.x - this.x;
        const dz = entity.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= this.radius) {
          const died = entity.takeDamage(this.damage, this.isCrit);
          if (died && this.engine.game) {
            this.engine.game.killCount++;
            this.engine.sound.playHit();
            this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
          }
        }
      });
    }

    // Update particles - handle custom grow/shrink and fade
    const progress = this.age / this.lifetime;

    this.particles.forEach(data => {
      const particle = data.particle;

      // Grow then shrink
      let scale;
      if (progress < 0.3) {
        scale = data.initialScale + (data.maxScale - data.initialScale) * (progress / 0.3);
      } else {
        scale = data.maxScale * (1 - ((progress - 0.3) / 0.7));
      }

      // Update particle scale manually
      const instanceIndex = particle.instanceIndex;
      this.particlePool.tempMatrix.makeTranslation(particle.x, particle.y, particle.z);
      this.particlePool.tempMatrix.scale(new THREE.Vector3(scale, scale, 1));
      this.particlePool.instancedMesh.setMatrixAt(instanceIndex, this.particlePool.tempMatrix);

      // Fade out manually
      const opacity = 1 - progress;
      this.particlePool.tempColor.copy(particle.initialColor).multiplyScalar(opacity);
      this.particlePool.instancedMesh.setColorAt(instanceIndex, this.particlePool.tempColor);
    });

    // Mark matrices as needing update
    if (this.particles.length > 0) {
      this.particlePool.instancedMesh.instanceMatrix.needsUpdate = true;
      this.particlePool.instancedMesh.instanceColor.needsUpdate = true;
    }

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
    // Particles are managed by the instanced pool, just clear our tracking
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
