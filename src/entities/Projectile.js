import * as THREE from 'three';
import { Entity } from './Entity.js';
import { resourceCache } from '../systems/ResourceCache.js';
import { calculateDamageWithCrit } from '../utils/damageCalculations.js';

export class Projectile extends Entity {
  constructor(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    super();
    this.engine = engine;
    this.x = x;
    this.y = y || 0.5;
    this.z = z;
    this.dirX = dirX;
    this.dirY = dirY; // Support 3D direction
    this.dirZ = dirZ;
    this.speed = weapon.speed * stats.projectileSpeed;

    // Calculate damage with crit if available
    const baseDamage = weapon.damage * stats.damage;
    const {damage, isCrit} = calculateDamageWithCrit(baseDamage, weapon);
    this.damage = damage;
    this.isCrit = isCrit;

    this.pierce = weapon.pierce + stats.pierce;
    this.pierceCount = 0;
    this.lifetime = weapon.lifetime || 3;
    this.age = 0;

    // Set expiration timestamp (more reliable than age with frustum culling)
    this.expiresAt = engine.time + this.lifetime;

    this.createMesh();

    // Set initial mesh position
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
    }
  }

  createMesh() {
    // Use cached material instead of creating new texture every time
    const material = resourceCache.getProjectileMaterial('#ffff00');
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);

    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Check expiration timestamp (works even when not updated due to frustum culling)
    if (this.engine.time >= this.expiresAt) {
      this.destroy();
      return;
    }

    // Calculate new position (3D movement)
    const newX = this.x + this.dirX * this.speed * dt;
    const newY = this.y + this.dirY * this.speed * dt;
    const newZ = this.z + this.dirZ * this.speed * dt;

    // Check collision with level objects
    const game = this.engine.game;
    if (game && game.levelSystem) {
      const collision = game.levelSystem.checkCollision(newX, newZ, 0.2);
      if (collision.collided) {
        // Projectile hits wall, destroy it
        this.destroy();
        return;
      }
    }

    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;
  }

  hit() {
    this.pierceCount++;
    if (this.pierceCount > this.pierce) {
      this.destroy();
    }
  }
}
