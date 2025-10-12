/**
 * Base Spell class
 * All spells should extend this class
 */
export class Spell {
  constructor(config = {}) {
    // Basic properties
    this.name = config.name || 'Unnamed Spell';
    this.description = config.description || '';
    this.category = config.category || 'magic';
    this.level = config.level || 1;

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

    const enemies = engine.entities.filter(e =>
      e.health !== undefined &&
      e.active &&
      e !== player
    );

    if (enemies.length === 0) return null;

    if (this.targeting === 'nearest') {
      let nearest = null;
      let minDist = this.maxRange;

      enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dz = enemy.z - player.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      });

      return nearest;
    }

    if (this.targeting === 'random') {
      const inRange = enemies.filter(enemy => {
        const dx = enemy.x - player.x;
        const dz = enemy.z - player.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist <= this.maxRange;
      });

      if (inRange.length === 0) return null;
      return inRange[Math.floor(Math.random() * inRange.length)];
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
}
