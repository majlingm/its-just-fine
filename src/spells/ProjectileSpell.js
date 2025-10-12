import { Spell } from './Spell.js';

/**
 * ProjectileSpell - Base class for spells that fire projectiles
 */
export class ProjectileSpell extends Spell {
  constructor(config = {}) {
    super(config);

    // Projectile-specific properties
    this.speed = config.speed || 10;
    this.pierce = config.pierce || 0;
    this.projectileCount = config.projectileCount || 1;
    this.spread = config.spread || 0; // Angle in radians
    this.lifetime = config.lifetime || 3;
    this.sizeScale = config.sizeScale || 1.0;

    // Projectile class to instantiate
    this.projectileClass = config.projectileClass || null;
  }

  /**
   * Calculate direction to target or spread pattern
   * @param {object} player - Player object
   * @param {object} target - Target entity (can be null for spread patterns)
   * @param {number} index - Index for multi-projectile spells
   * @param {number} total - Total number of projectiles
   * @returns {object} {dirX, dirZ, dirY}
   */
  calculateDirection(player, target, index = 0, total = 1) {
    if (!target && this.spread === 0) {
      // Default forward direction
      return { dirX: 0, dirZ: 1, dirY: 0 };
    }

    let baseAngle;
    if (target) {
      // Aim at target
      const dx = target.x - player.x;
      const dz = target.z - player.z;
      baseAngle = Math.atan2(dx, dz);
    } else {
      // Random direction
      baseAngle = Math.random() * Math.PI * 2;
    }

    // Apply spread for multiple projectiles
    let angle = baseAngle;
    if (total > 1 && this.spread > 0) {
      const spreadStart = baseAngle - this.spread / 2;
      angle = spreadStart + (this.spread * index / (total - 1));
    }

    return {
      dirX: Math.sin(angle),
      dirZ: Math.cos(angle),
      dirY: 0
    };
  }

  /**
   * Cast the projectile spell
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  cast(engine, player, stats) {
    if (!this.projectileClass) {
      console.error('ProjectileSpell: No projectileClass defined');
      return;
    }

    const target = this.findTarget(engine, player);

    // Fire projectiles
    for (let i = 0; i < this.projectileCount; i++) {
      const direction = this.calculateDirection(player, target, i, this.projectileCount);

      // Create projectile with spell stats
      const projectile = new this.projectileClass(
        engine,
        player.x,
        0.5, // Default height
        player.z,
        direction.dirX,
        direction.dirZ,
        this, // Pass spell as weapon
        stats,
        direction.dirY
      );

      engine.addEntity(projectile);
    }

    // Note: cooldown is managed by the game loop via weaponInstance.lastShot
    // Don't call this.triggerCooldown() here as it uses a separate cooldown system
  }

  /**
   * Create a projectile (for backward compatibility)
   * @param {object} engine - Game engine
   * @param {number} x - Start X position
   * @param {number} y - Start Y position
   * @param {number} z - Start Z position
   * @param {number} dirX - X direction
   * @param {number} dirZ - Z direction
   * @param {object} weapon - Weapon (this spell)
   * @param {object} stats - Player stats
   * @param {number} dirY - Y direction (optional)
   * @returns {object} Projectile entity
   */
  createProjectile(engine, x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    if (!this.projectileClass) {
      console.error('ProjectileSpell: No projectileClass defined');
      return null;
    }
    return new this.projectileClass(engine, x, y, z, dirX, dirZ, this, stats, dirY);
  }
}
