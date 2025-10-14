import * as THREE from 'three';
import { Entity } from './Entity.js';

/**
 * DashShockwave - Passive ability that triggers a shockwave when player dashes
 * Creates continuous shockwave trail along dash path with strong knockback
 */
export class DashShockwave extends Entity {
  constructor(engine, player, baseDamage, spell) {
    super();
    this.engine = engine;
    this.player = player;
    this.baseDamage = baseDamage;
    this.spell = spell;
    this.active = true;

    // Store player's last dash state and position
    this.playerWasDashing = false;
    this.lastShockwaveTime = 0;
    this.shockwaveInterval = 0.05; // Create shockwave every 0.05 seconds during dash
  }

  update(dt) {
    if (!this.active || !this.player || !this.player.active) {
      return;
    }

    // Check if player is dashing
    if (this.player.isDashing) {
      // Create shockwaves continuously along the dash path
      this.lastShockwaveTime += dt;

      if (this.lastShockwaveTime >= this.shockwaveInterval) {
        this.triggerShockwave();
        this.lastShockwaveTime = 0;
      }
    }

    // Update dash state for next frame
    this.playerWasDashing = this.player.isDashing;
  }

  triggerShockwave() {
    const shockwaveRadius = this.spell.radius || 5;
    const knockbackForce = this.spell.knockbackForce || 20; // Much stronger default

    // Visual effect - expanding ring (toned down)
    this.createShockwaveVisual(shockwaveRadius);

    // Track enemies already hit for damage (but not knockback!)
    if (!this.hitEnemiesThisDash) {
      this.hitEnemiesThisDash = new Set();
    }

    // Damage and knockback enemies in range
    this.engine.entities.forEach(enemy => {
      if (!enemy.health || !enemy.active || enemy === this.player) return;

      const dx = enemy.x - this.player.x;
      const dz = enemy.z - this.player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= shockwaveRadius && dist > 0.1) { // Prevent division by zero
        // Apply damage only once per dash
        if (!this.hitEnemiesThisDash.has(enemy)) {
          this.hitEnemiesThisDash.add(enemy);

          // Apply minimal damage with crit check
          const {damage, isCrit} = this.calculateDamage();
          const died = enemy.takeDamage(damage, isCrit);

          if (died && this.engine.game) {
            this.engine.game.killCount++;
            this.engine.sound.playHit();
            this.engine.game.dropXP(enemy.x, enemy.z, enemy.isElite);
          }
        }

        // Apply strong knockback EVERY frame they're in range - push away from player
        const knockbackDirX = dx / dist;
        const knockbackDirZ = dz / dist;

        // Much stronger knockback force applied continuously
        const actualKnockback = knockbackForce * 0.1; // Apply per frame for continuous push
        enemy.x += knockbackDirX * actualKnockback;
        enemy.z += knockbackDirZ * actualKnockback;
      }
    });

    // Clear hit enemies when dash ends
    if (!this.player.isDashing && this.hitEnemiesThisDash) {
      this.hitEnemiesThisDash.clear();
    }
  }

  calculateDamage() {
    const critChance = this.spell.critChance || 0;
    const critMultiplier = this.spell.critMultiplier || 1.5;
    const isCrit = Math.random() < critChance;

    const damage = isCrit
      ? this.baseDamage * critMultiplier
      : this.baseDamage;

    return { damage, isCrit };
  }

  createShockwaveVisual(radius) {
    // Create subtle expanding ring effect
    const segments = 32; // Reduced from 64
    const geometry = new THREE.RingGeometry(0.2, radius * 0.08, segments);

    // Subtle cyan material
    const material = new THREE.MeshBasicMaterial({
      color: 0x88bbff,
      transparent: true,
      opacity: 0.3, // Reduced from 0.8
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2; // Lay flat on ground
    ring.position.set(this.player.x, 0.05, this.player.z); // Closer to ground

    this.engine.scene.add(ring);

    // Animate ring expansion - faster and subtler
    const startTime = this.engine.time;
    const duration = 0.3; // Faster fade from 0.5
    const maxScale = radius / (radius * 0.08);

    const animate = () => {
      const elapsed = this.engine.time - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.engine.scene.remove(ring);
        geometry.dispose();
        material.dispose();
        return;
      }

      // Expand and fade quickly
      const scale = 1 + progress * maxScale;
      ring.scale.set(scale, scale, 1);
      material.opacity = 0.3 * (1 - progress);

      requestAnimationFrame(animate);
    };

    animate();

    // Reduced particle burst
    this.createParticleBurst(radius);
  }

  createParticleBurst(radius) {
    const particleCount = 8; // Reduced from 20
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 5 + Math.random() * 2; // Slower particles

      // Create smaller particle sprite
      const canvas = document.createElement('canvas');
      canvas.width = 12; // Smaller from 16
      canvas.height = 12;
      const ctx = canvas.getContext('2d');

      // Subtle cyan gradient
      const gradient = ctx.createRadialGradient(6, 6, 1, 6, 6, 6);
      gradient.addColorStop(0, 'rgba(136, 187, 255, 0.6)'); // More transparent
      gradient.addColorStop(0.5, 'rgba(102, 170, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(68, 136, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 12, 12);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(material);

      const size = 0.2 + Math.random() * 0.15; // Smaller size
      sprite.scale.set(size, size, 1);
      sprite.position.set(this.player.x, 0.3, this.player.z); // Lower to ground

      this.engine.scene.add(sprite);

      particles.push({
        sprite: sprite,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.25, // Shorter life from 0.4
        age: 0,
        initialSize: size
      });
    }

    // Animate particles
    const animate = () => {
      let allDead = true;

      particles.forEach(p => {
        if (p.age < p.life) {
          allDead = false;
          p.age += 0.016;
          const progress = p.age / p.life;

          const speedMult = 1 - progress * 0.5;
          p.sprite.position.x += p.vx * 0.016 * speedMult;
          p.sprite.position.z += p.vz * 0.016 * speedMult;

          p.sprite.material.opacity = 1 - Math.pow(progress, 0.5);

          const scale = p.initialSize * (1 - progress * 0.5);
          p.sprite.scale.set(scale, scale, 1);
        }
      });

      if (!allDead) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach(p => {
          this.engine.scene.remove(p.sprite);
          p.sprite.material.map.dispose();
          p.sprite.material.dispose();
        });
      }
    };

    animate();
  }

  destroy() {
    this.active = false;
    this.shouldRemove = true;
  }
}
