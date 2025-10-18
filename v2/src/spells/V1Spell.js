import { applySpellLevelScaling } from './V1spellLevelScaling.js';

/**
 * Base Spell class
 * All spells should extend this class
 */
export class V1Spell {
  constructor(config = {}) {
    // Basic properties
    this.name = config.name || 'Unnamed Spell';
    this.description = config.description || '';
    this.category = config.category || 'magic';
    this.level = config.level || 1;
    this.spellKey = config.spellKey || null; // Key for scaling lookup

    // Damage properties
    this.damage = config.damage || 10;
    this.damageSpread = config.damageSpread || 0; // % variance

    // Critical hit properties
    this.critChance = config.critChance || 0;
    this.critMultiplier = config.critMultiplier || 1.5;
    this.critDamageSpread = config.critDamageSpread || 0;

    // Cooldown
    this.cooldown = config.cooldown || 1.0;
    this.cooldownTimer = 0;

    // Targeting
    this.targeting = config.targeting || 'nearest'; // 'nearest', 'random', 'self', 'none'
    this.maxRange = config.maxRange || 20;

    // Visual/Audio
    this.color = config.color || 0xffffff;
  }

  /**
   * Calculate damage with randomized spread
   * @param {number} baseDamage - Base damage value
   * @param {number} spread - Spread percentage (e.g., 10 = 10% variance)
   * @returns {number} Damage with random variance applied
   */
  calculateDamageWithSpread(baseDamage, spread = 0) {
    if (spread <= 0) return baseDamage;

    const spreadDecimal = spread / 100;
    const variance = (Math.random() * 2 - 1) * spreadDecimal;

    return baseDamage * (1 + variance);
  }

  /**
   * Calculate damage with critical hit check
   * @param {number} baseDamage - Base damage value before crit
   * @returns {object} {damage: number, isCrit: boolean}
   */
  calculateDamage(baseDamage) {
    const isCrit = Math.random() < this.critChance;

    let finalDamage;
    if (isCrit) {
      const critBaseDamage = baseDamage * this.critMultiplier;
      finalDamage = this.calculateDamageWithSpread(critBaseDamage, this.critDamageSpread);
    } else {
      finalDamage = this.calculateDamageWithSpread(baseDamage, this.damageSpread);
    }

    return { damage: finalDamage, isCrit };
  }

  /**
   * Update cooldown timer
   * @param {number} dt - Delta time
   */
  updateCooldown(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
  }

  /**
   * Check if spell is ready to cast
   * @returns {boolean}
   */
  isReady() {
    return this.cooldownTimer <= 0;
  }

  /**
   * Trigger cooldown
   */
  triggerCooldown() {
    this.cooldownTimer = this.cooldown;
  }

  /**
   * Helper: Check if entity has health (v1 or v2)
   * @param {object} entity - Entity to check
   * @returns {boolean}
   */
  hasHealth(entity) {
    // v1 style: direct health property
    if (entity.health !== undefined) return true;

    // v2 style: Health component
    if (entity.getComponent && entity.getComponent('Health')) return true;

    return false;
  }

  /**
   * Helper: Get entity position (v1 or v2)
   * @param {object} entity - Entity to get position from
   * @returns {object} {x, z} position
   */
  getEntityPosition(entity) {
    // v1 style: direct x/z properties
    if (entity.x !== undefined && entity.z !== undefined) {
      return { x: entity.x, z: entity.z };
    }

    // v2 style: Transform component
    if (entity.getComponent) {
      const transform = entity.getComponent('Transform');
      if (transform) {
        return { x: transform.x, z: transform.z };
      }
    }

    return { x: 0, z: 0 };
  }

  /**
   * Wrap a v2 entity to be v1-compatible
   * Adds direct x/y/z/health properties that reference the components
   * @param {object} entity - v2 Entity to wrap
   * @returns {object} v1-compatible entity
   */
  wrapV2Entity(entity) {
    // If already has direct properties, return as-is (v1 entity)
    if (entity.x !== undefined && entity.z !== undefined) {
      return entity;
    }

    // v2 entity - add compatibility properties
    if (entity.getComponent) {
      const transform = entity.getComponent('Transform');
      const health = entity.getComponent('Health');

      if (transform) {
        // Add direct position properties that reference transform
        Object.defineProperty(entity, 'x', {
          get: () => transform.x,
          set: (v) => { transform.x = v; }
        });
        Object.defineProperty(entity, 'y', {
          get: () => transform.y,
          set: (v) => { transform.y = v; }
        });
        Object.defineProperty(entity, 'z', {
          get: () => transform.z,
          set: (v) => { transform.z = v; }
        });
      }

      if (health) {
        // Add direct health property that references component
        Object.defineProperty(entity, 'health', {
          get: () => health.current,
          set: (v) => { health.current = v; }
        });
        Object.defineProperty(entity, 'maxHealth', {
          get: () => health.max,
          set: (v) => { health.max = v; }
        });

        // Add takeDamage method for v1 compatibility
        if (!entity.takeDamage) {
          entity.takeDamage = function(damage, isCrit = false) {
            health.takeDamage(damage);
            return true;
          };
        }
      }
    }

    return entity;
  }

  /**
   * Find target based on targeting mode
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @returns {object|null} Target entity or null
   */
  findTarget(engine, player) {
    if (this.targeting === 'self') {
      return player;
    }

    if (this.targeting === 'none') {
      return null;
    }

    // Filter for enemies only (has health, active, not player, has 'enemy' tag)
    const enemies = engine.entities.filter(e =>
      this.hasHealth(e) &&
      e.active &&
      e !== player &&
      e.hasTag && e.hasTag('enemy') // Only target entities tagged as enemies
    );

    if (enemies.length === 0) return null;

    if (this.targeting === 'nearest') {
      let nearest = null;
      let minDist = this.maxRange;

      const playerPos = this.getEntityPosition(player);

      enemies.forEach(enemy => {
        const enemyPos = this.getEntityPosition(enemy);
        const dx = enemyPos.x - playerPos.x;
        const dz = enemyPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      });

      return nearest ? this.wrapV2Entity(nearest) : null;
    }

    if (this.targeting === 'random') {
      const playerPos = this.getEntityPosition(player);

      const inRange = enemies.filter(enemy => {
        const enemyPos = this.getEntityPosition(enemy);
        const dx = enemyPos.x - playerPos.x;
        const dz = enemyPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist <= this.maxRange;
      });

      if (inRange.length === 0) return null;
      const target = inRange[Math.floor(Math.random() * inRange.length)];
      return this.wrapV2Entity(target);
    }

    return null;
  }

  /**
   * Cast the spell
   * This should be overridden by subclasses
   * @param {object} engine - Game engine
   * @param {object} player - Player object
   * @param {object} stats - Player stats
   */
  cast(engine, player, stats) {
    throw new Error('cast() must be implemented by subclass');
  }

  /**
   * Update spell (for persistent/continuous spells)
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.updateCooldown(dt);
  }

  /**
   * Apply level scaling using centralized scaling data
   * Subclasses can override this, but by default it uses spellLevelScaling.js
   * @param {number} level - Spell level (1-7)
   */
  applyLevelScaling(level) {
    if (!this.spellKey) {
      console.warn(`Spell ${this.name} has no spellKey set for level scaling`);
      return;
    }

    // Use centralized scaling function
    applySpellLevelScaling(this, this.spellKey, level);
  }
}
