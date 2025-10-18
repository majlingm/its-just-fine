import * as THREE from 'three';
import { Entity } from './V1Entity.js';
import { calculateDamageWithCrit } from '../utils/V1damageCalculations.js';

export class SkullShield extends Entity {
  constructor(engine, player, damage, spell = null) {
    super();
    this.engine = engine;
    this.player = player;
    this.baseDamage = damage;
    this.spell = spell;
    this.skulls = [];

    // Use spell level stats if provided, otherwise use defaults
    this.skullCount = spell?.skullCount || 1;
    this.ringRadius = spell?.ringRadius || 2.5;
    this.rotationSpeed = spell?.rotationSpeed || 1.2;
    this.knockbackForce = spell?.knockbackForce || 15;
    this.damageInterval = 0.2; // Damage cooldown per skull per enemy
    this.lastDamageTime = new Map(); // Track last damage time per skull per entity

    this.currentRotation = 0;

    this.createSkullRing();
  }

  createSkullSprite() {
    // Create white skull with red eyes and smile
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // White skull head (round)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(32, 28, 22, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jaw (bottom part)
    ctx.beginPath();
    ctx.ellipse(32, 45, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(32, 28, 22, 25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(32, 45, 18, 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red eyes (glowing)
    const eyeGradient = ctx.createRadialGradient(22, 22, 2, 22, 22, 6);
    eyeGradient.addColorStop(0, '#ff0000');
    eyeGradient.addColorStop(1, '#880000');
    ctx.fillStyle = eyeGradient;

    // Left eye
    ctx.beginPath();
    ctx.ellipse(22, 22, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(42, 22, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye outlines
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(22, 22, 6, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(42, 22, 6, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Nose (small triangle)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(32, 30);
    ctx.lineTo(28, 38);
    ctx.lineTo(36, 38);
    ctx.closePath();
    ctx.fill();

    // Smile (curved line with teeth)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(32, 40, 14, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Teeth (small rectangles)
    ctx.fillStyle = 'black';
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 4.5;
      const y = 44 + Math.abs(i - 2.5) * 0.5;
      ctx.fillRect(x, y, 2, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);

    sprite.scale.set(1.0, 1.0, 1);
    sprite.renderOrder = 900;

    this.engine.scene.add(sprite);

    return sprite;
  }

  createSkullRing() {
    for (let i = 0; i < this.skullCount; i++) {
      const sprite = this.createSkullSprite();
      const angle = (i / this.skullCount) * Math.PI * 2;

      this.skulls.push({
        sprite: sprite,
        active: true,
        angleOffset: angle,
        bobPhase: Math.random() * Math.PI * 2,
        age: 0
      });
    }
  }

  update(dt) {
    if (!this.active) return;

    // Update rotation
    this.currentRotation += this.rotationSpeed * dt;

    // Update each skull
    this.skulls.forEach((skull, index) => {
      if (!skull.active) {
        skull.sprite.visible = false;
        return;
      }

      skull.age += dt;

      // Calculate position around player
      skull.bobPhase += dt * 3;
      const angle = this.currentRotation + skull.angleOffset;

      // Slight radius variation for dynamic motion
      const radiusOffset = Math.sin(skull.bobPhase) * 0.3;
      const radius = this.ringRadius + radiusOffset;

      const x = this.player.x + Math.cos(angle) * radius;
      const z = this.player.z + Math.sin(angle) * radius;

      // Bobbing height
      const bob = Math.abs(Math.sin(skull.age * 4)) * 0.2;
      const y = 0.8 + bob;

      skull.sprite.position.set(x, y, z);

      // Billboard effect (face camera)
      if (this.engine.camera) {
        skull.sprite.lookAt(this.engine.camera.position);
      }

      // Slight pulsing scale
      const scalePulse = 1.0 + Math.sin(skull.age * 6) * 0.1;
      skull.sprite.scale.set(scalePulse, scalePulse, 1);

      // Check collision with enemies
      this.engine.entities.forEach(entity => {
        if (!entity.active || entity.health === undefined) return;
        if (entity.hasTag && entity.hasTag('player')) return;

        const dx = entity.x - x;
        const dz = entity.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.6) {
          // Check if enough time has passed since last damage from this skull to this enemy
          const currentTime = this.engine.time || 0;
          const damageKey = `${index}-${entity.id || entity.x + '-' + entity.z}`;
          const lastDamage = this.lastDamageTime.get(damageKey) || 0;

          if (currentTime - lastDamage >= this.damageInterval) {
            this.lastDamageTime.set(damageKey, currentTime);

            // Apply damage with crit
            const {damage, isCrit} = calculateDamageWithCrit(this.baseDamage, this.spell);
            const died = entity.takeDamage(damage, isCrit);

            if (died && this.engine.game) {
              this.engine.game.killCount++;
              this.engine.sound.playHit();
              this.engine.game.dropXP(entity.x, entity.z, entity.isElite);
            }

            // Apply knockback - push away from player
            if (dist > 0.1) {
              const knockbackDirX = dx / dist;
              const knockbackDirZ = dz / dist;
              entity.x += knockbackDirX * this.knockbackForce * 0.1;
              entity.z += knockbackDirZ * this.knockbackForce * 0.1;
            }
          }
        }
      });
    });
  }

  destroy() {
    this.skulls.forEach(skull => {
      this.engine.scene.remove(skull.sprite);
      if (skull.sprite.material.map) {
        skull.sprite.material.map.dispose();
      }
      skull.sprite.material.dispose();
    });
    this.skulls = [];
    this.lastDamageTime.clear();

    this.active = false;
    this.shouldRemove = true;
  }
}
