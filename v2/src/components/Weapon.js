import { Component } from '../core/ecs/Component.js';

/**
 * Weapon Component
 * Represents a weapon that can fire projectiles
 *
 * Supports various weapon types with different fire rates,
 * damage values, and projectile behaviors.
 */
export class Weapon extends Component {
  constructor() {
    super();

    // Weapon configuration
    this.weaponType = 'pistol'; // pistol, rifle, shotgun, magic, etc.
    this.damage = 10;
    this.fireRate = 0.2; // Seconds between shots
    this.projectileSpeed = 30;
    this.projectileLifetime = 3; // Seconds before projectile expires
    this.projectileSize = 0.2;
    this.projectileColor = 0xffff00; // Yellow by default

    // Ammo (optional - infinite if not set)
    this.hasAmmo = false;
    this.currentAmmo = -1; // -1 = infinite
    this.maxAmmo = -1;
    this.reloadTime = 0;

    // Weapon state
    this.cooldownTimer = 0; // Time until can fire again
    this.isReloading = false;
    this.reloadTimer = 0;

    // Projectile behavior
    this.projectileType = 'bullet'; // bullet, laser, magic, rocket
    this.piercing = false; // Can hit multiple enemies
    this.homing = false; // Seeks nearest enemy
    this.explosive = false; // Deals area damage
    this.explosionRadius = 0;

    // Spread/accuracy
    this.spread = 0; // Angle in degrees
    this.projectilesPerShot = 1; // For shotgun-style weapons

    // Visual/audio
    this.muzzleFlash = true;
    this.shootSound = null;
    this.impactEffect = 'default';
  }

  /**
   * Check if weapon can fire
   * @returns {boolean}
   */
  canFire() {
    if (!this.enabled) return false;
    if (this.cooldownTimer > 0) return false;
    if (this.isReloading) return false;
    if (this.hasAmmo && this.currentAmmo <= 0) return false;
    return true;
  }

  /**
   * Fire the weapon (consumes ammo and starts cooldown)
   */
  fire() {
    if (!this.canFire()) return false;

    // Consume ammo
    if (this.hasAmmo && this.currentAmmo > 0) {
      this.currentAmmo--;
    }

    // Start cooldown
    this.cooldownTimer = this.fireRate;

    return true;
  }

  /**
   * Start reloading
   */
  startReload() {
    if (!this.hasAmmo) return false;
    if (this.isReloading) return false;
    if (this.currentAmmo === this.maxAmmo) return false;

    this.isReloading = true;
    this.reloadTimer = this.reloadTime;
    return true;
  }

  /**
   * Complete reload
   */
  finishReload() {
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  /**
   * Update weapon state (cooldowns, reload)
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Update cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    // Update reload
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }
  }
}
