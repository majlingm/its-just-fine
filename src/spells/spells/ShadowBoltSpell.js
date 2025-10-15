import { ProjectileSpell } from '../ProjectileSpell.js';
import { ShadowProjectile } from '../../entities/ShadowProjectile.js';
import { ShadowBoltGroup } from '../../entities/ShadowBoltGroup.js';
import spellData from '../spellData.json';

/**
 * Shadow Bolt - Dark projectiles with white edges, slower than fireball
 * Fires 3 bolts in a spinning triangle formation
 */
export class ShadowBoltSpell extends ProjectileSpell {
  constructor(level = 1) {
    const data = spellData.SHADOW_BOLT;

    super({
      spellKey: 'SHADOW_BOLT',
      name: data.name,
      description: data.description,
      category: data.category,
      targeting: data.targeting,
      level: level,

      // Load base stats from JSON
      ...data.base,

      // Projectile class
      projectileClass: ShadowProjectile
    });

    // Apply level scaling using base class method
    this.applyLevelScaling(level);

    // Override stats for triangle formation (after scaling)
    this.projectileCount = 3;
    this.speed = 2.5; // Slow but steady
    this.cooldown = 5.0; // Very rare
    this.pierce = (this.pierce || 2) + 10; // +10 additional pierce
    this.lifetime = 20.0; // Persist for a long time
    this.rotationAngle = 0; // Track rotation for spinning effect
  }

  /**
   * Override cast to create spinning triangle formation
   */
  cast(engine, player, stats) {
    if (!this.projectileClass) {
      console.error('ProjectileSpell: No projectileClass defined');
      return;
    }

    const pool = this.getProjectilePool(engine);

    // Random direction for the group
    const baseAngle = Math.random() * Math.PI * 2;
    const direction = {
      dirX: Math.sin(baseAngle),
      dirZ: Math.cos(baseAngle)
    };

    // Create 3 projectiles
    const projectiles = [];
    for (let i = 0; i < this.projectileCount; i++) {
      const projectile = pool
        ? pool.acquire(
            engine,
            player.x,
            0.5,
            player.z,
            direction.dirX,
            direction.dirZ,
            this,
            stats,
            0
          )
        : new this.projectileClass(
            engine,
            player.x,
            0.5,
            player.z,
            direction.dirX,
            direction.dirZ,
            this,
            stats,
            0
          );

      // Mark as managed by group so it doesn't update position independently
      projectile.managedByGroup = true;
      engine.addEntity(projectile);
      projectiles.push(projectile);
    }

    // Create group to manage spinning
    const group = new ShadowBoltGroup(
      engine,
      player.x,
      0.5,
      player.z,
      direction.dirX,
      direction.dirZ,
      projectiles,
      2 // rotation speed in radians/sec (slower)
    );
    // Use the spell's speed
    group.speed = this.speed;
    group.lifetime = this.lifetime || 3.0;
    engine.addEntity(group);
  }
}
