import { Projectile } from '../entities/V1Projectile.js';
import { InstantLightning } from '../entities/V1InstantLightning.js';
import { ColoredLightning } from '../entities/V1ColoredLightning.js';
import { FlameProjectile } from '../entities/V1FlameProjectile.js';
import { IceLance } from '../entities/V1IceLance.js';
import { MagicBullet } from '../entities/V1MagicBullet.js';
import { FireExplosion } from '../entities/V1FireExplosion.js';
import { LightningExplosion } from '../entities/V1LightningExplosion.js';
import { RingOfFire } from '../entities/V1RingOfFire.js';
import { RingOfIce } from '../entities/V1RingOfIce.js';
import { DashShockwave } from '../entities/V1DashShockwave.js';
import { LightningEffect } from '../effects/V1LightningEffect.js';
import { FireEffect } from '../effects/V1FireEffect.js';
import { applySpellLevelScaling } from './V1spellLevelScaling.js';
import * as THREE from 'three';

/**
 * Calculate spell damage with randomized spread
 * @param {number} baseDamage - Base damage value
 * @param {number} damageSpread - Spread percentage (e.g., 10 = 10% variance)
 * @returns {number} Damage with random variance applied
 */
export function calculateDamageWithSpread(baseDamage, damageSpread = 0) {
  if (damageSpread <= 0) return baseDamage;

  // Convert spread to decimal (10% = 0.10)
  const spreadDecimal = damageSpread / 100;

  // Random variance: -spread to +spread
  const variance = (Math.random() * 2 - 1) * spreadDecimal;

  return baseDamage * (1 + variance);
}

/**
 * Calculate damage with critical hit check
 * @param {number} baseDamage - Base damage value before crit
 * @param {object} spell - Spell object with crit properties
 * @returns {object} {damage: number, isCrit: boolean}
 */
export function calculateDamageWithCrit(baseDamage, spell) {
  const critChance = spell?.critChance || 0;
  const critMultiplier = spell?.critMultiplier || 1;
  const critDamageSpread = spell?.critDamageSpread || 0;
  const damageSpread = spell?.damageSpread || 0;

  // Check for crit
  const isCrit = Math.random() < critChance;

  let finalDamage;
  if (isCrit) {
    // Apply crit multiplier then crit damage spread
    const critBaseDamage = baseDamage * critMultiplier;
    finalDamage = calculateDamageWithSpread(critBaseDamage, critDamageSpread);
  } else {
    // Apply normal damage spread
    finalDamage = calculateDamageWithSpread(baseDamage, damageSpread);
  }

  return { damage: finalDamage, isCrit };
}

// Configure reusable effects
const thunderStrikeEffect = new LightningEffect({
  color: 0xffff00,
  glowColor: 0xffffaa,
  width: 1.2,
  taper: true,
  gradientColor: 0xffffff,
  lifetime: 0.3,
  branches: 2 + Math.floor(Math.random() * 4),
  branchWidth: 0.4
});

const pyroExplosionEffect = new FireEffect({
  radius: 3.5,
  particleCount: 20,
  lifetime: 1.0,
  color: 0xff4400
});

export const SPELL_TYPES = {
  // ===== LIGHTNING SPELLS =====
  THUNDER_STRIKE: {
    name: 'Thunder Strike',
    desc: 'Sky lightning strikes ground with devastating explosion',
    category: 'lightning',
    level: 1, // Default level
    cooldown: 0.8,
    baseCooldownMin: 0.8,
    baseCooldownMax: 1.5,
    damage: 200,
    damageSpread: 15, // 15% damage variance
    critChance: 0.1, // 10% crit chance
    critMultiplier: 2.0, // 2x damage on crit
    critDamageSpread: 10, // 10% spread on crit damage
    targeting: 'random',
    maxRange: 15,
    isInstant: true,
    execute: (engine, player, target, spell, stats) => {
      if (!target) return;

      // Prevent simultaneous thunder strikes
      const currentTime = engine.time;
      if (!spell.lastGlobalStrike) spell.lastGlobalStrike = 0;
      if (currentTime - spell.lastGlobalStrike < 0.3) return;
      spell.lastGlobalStrike = currentTime;

      // Set random cooldown
      spell.cooldown = spell.baseCooldownMin + Math.random() * (spell.baseCooldownMax - spell.baseCooldownMin);

      // Spawn lightning effect with random offset
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetZ = (Math.random() - 0.5) * 3;

      // Update effect config for this strike with spell level stats
      const branchMin = spell.branchCountMin || 2;
      const branchMax = spell.branchCountMax || 5;
      const lightningWidth = spell.lightningWidth || 1.2;

      thunderStrikeEffect.config.branches = branchMin + Math.floor(Math.random() * (branchMax - branchMin + 1));
      thunderStrikeEffect.config.width = lightningWidth;

      const lightning = thunderStrikeEffect.spawn(engine, {
        startX: target.x + offsetX,
        startY: 35,
        startZ: target.z + offsetZ,
        endX: target.x,
        endY: 0, // Target ground
        endZ: target.z,
        damage: 0 // Explosion handles all damage
      });

      // Create ground explosion at impact with spell level radius
      const explosionRadius = spell.radius || 5;
      const {damage: finalDamage, isCrit} = calculateDamageWithCrit(
        spell.damage * stats.damage,
        spell
      );
      const explosion = new LightningExplosion(
        engine,
        target.x,
        target.z,
        explosionRadius,
        finalDamage,
        isCrit
      );
      engine.addEntity(explosion);
    }
  },

  CHAIN_LIGHTNING: {
    name: 'Chain Lightning',
    desc: 'Continuous lightning that chains between enemies',
    category: 'lightning',
    level: 1, // Default level
    cooldown: 0.15, // Fast continuous fire rate
    damage: 12,
    damageSpread: 10, // 10% damage variance
    critChance: 0.15, // 15% crit chance (higher for fast attacks)
    critMultiplier: 1.5, // 1.5x damage on crit (lower for fast attacks)
    critDamageSpread: 5, // 5% spread on crit damage
    targeting: 'random', // Random target within zone
    isInstant: true,
    isContinuous: true, // Mark as continuous spell
    chainCount: 3,
    chainRange: 8,
    maxRange: 15,
    execute: (engine, player, target, spell, stats) => {
      if (!target) return;

      const baseDamage = spell.damage * stats.damage;
      let currentTarget = target;
      const hitEnemies = new Set();
      let prevX = player.x;
      let prevZ = player.z;

      for (let i = 0; i < spell.chainCount; i++) {
        if (!currentTarget || hitEnemies.has(currentTarget)) break;

        // Calculate damage with crit for each chain
        const {damage, isCrit} = calculateDamageWithCrit(baseDamage, spell);

        // Create dark purple lightning bolt with spell level width
        const lightningWidth = spell.lightningWidth || 1.2;
        const lightning = new ColoredLightning(
          engine,
          prevX,
          1.0, // Character/enemy center height
          prevZ,
          currentTarget.x,
          1.0, // Enemy center height
          currentTarget.z,
          damage,
          0x2200aa, // Dark purple
          0x8844ff, // Purple glow
          lightningWidth
        );
        engine.addEntity(lightning);

        // Damage enemy
        const died = currentTarget.takeDamage(damage, isCrit);
        if (died && engine.game) {
          engine.game.killCount++;
          engine.sound.playHit();
          engine.game.dropXP(currentTarget.x, currentTarget.z, currentTarget.isElite);
        }

        hitEnemies.add(currentTarget);

        // Find next chain target
        let nextTarget = null;
        let minDist = spell.chainRange;

        engine.entities.forEach(e => {
          if (e.health === undefined || !e.active || hitEnemies.has(e)) return;
          if (e === engine.game?.player) return; // Don't chain to player
          const dx = e.x - currentTarget.x;
          const dz = e.z - currentTarget.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDist) {
            minDist = dist;
            nextTarget = e;
          }
        });

        prevX = currentTarget.x;
        prevZ = currentTarget.z;
        currentTarget = nextTarget;
      }
    }
  },

  // ===== FIRE SPELLS =====
  FIREBALL: {
    name: 'Fireball',
    desc: 'Blazing fire projectiles with trail',
    category: 'fire',
    level: 1, // Default level
    cooldown: 0.25,
    damage: 16,
    damageSpread: 10, // 10% damage variance
    critChance: 0.12, // 12% crit chance
    critMultiplier: 1.8, // 1.8x damage on crit
    critDamageSpread: 8, // 8% spread on crit damage
    speed: 20,
    pierce: 2,
    projectileCount: 1,
    spread: 0,
    targeting: 'nearest',
    maxRange: 20, // Don't target enemies too far away
    lifetime: 0.8,
    createProjectile: (engine, x, y, z, dirX, dirZ, spell, stats, dirY) => {
      return new FlameProjectile(engine, x, y, z, dirX, dirZ, spell, stats, dirY);
    }
  },

  PYRO_EXPLOSION: {
    name: 'Pyro Explosion',
    desc: 'Explosive fire area damage',
    category: 'fire',
    level: 1, // Default level
    cooldown: 1.5,
    damage: 30,
    damageSpread: 20, // 20% damage variance (more random for explosions)
    critChance: 0.2, // 20% crit chance (high for big hits)
    critMultiplier: 2.5, // 2.5x damage on crit (big explosions)
    critDamageSpread: 15, // 15% spread on crit damage
    targeting: 'nearest',
    isInstant: true,
    execute: (engine, player, target, spell, stats) => {
      if (!target) return;

      // Update effect config with spell level stats
      pyroExplosionEffect.config.radius = spell.radius || 3.5;
      pyroExplosionEffect.config.particleCount = spell.particleCount || 20;

      const {damage: finalDamage, isCrit} = calculateDamageWithCrit(
        spell.damage * stats.damage,
        spell
      );

      pyroExplosionEffect.spawn(engine, {
        x: target.x,
        y: 0, // Ground explosion
        z: target.z,
        damage: finalDamage,
        isCrit: isCrit
      });
    }
  },

  RING_OF_FIRE: {
    name: 'Ring of Fire',
    desc: 'Protective ring of many small flames that orbit the player',
    category: 'fire',
    level: 1, // Default level
    cooldown: 0, // No cooldown - continuous effect
    damage: 15, // Total DPS spread across many particles
    damageSpread: 5, // 5% damage variance (low for consistency)
    critChance: 0.08, // 8% crit chance (low for continuous damage)
    critMultiplier: 1.5, // 1.5x damage on crit
    critDamageSpread: 5, // 5% spread on crit damage
    targeting: 'self',
    isInstant: false,
    isContinuous: true,
    isPersistent: true, // Stays active as long as spell is active
    activeRing: null, // Store reference to active ring
    execute: (engine, player, target, spell, stats) => {
      // Only create ring if it doesn't exist
      if (!spell.activeRing || !spell.activeRing.active) {
        spell.activeRing = new RingOfFire(engine, player, spell.damage * stats.damage, spell);
        engine.addEntity(spell.activeRing);
      }
    }
  },

  // ===== ICE SPELLS =====
  ICE_LANCE: {
    name: 'Ice Lance',
    desc: 'Sharp icicle projectiles that pierce enemies',
    category: 'ice',
    level: 1, // Default level
    cooldown: 0.4,
    baseCooldownMin: 0.3,
    baseCooldownMax: 0.8,
    damage: 20,
    damageSpread: 12, // 12% damage variance
    critChance: 0.18, // 18% crit chance (high for precision weapon)
    critMultiplier: 2.2, // 2.2x damage on crit
    critDamageSpread: 10, // 10% spread on crit damage
    speed: 25,
    pierce: 3,
    projectileCount: 1,
    spread: 0,
    targeting: 'nearest',
    maxRange: 20, // Don't target enemies too far away
    lifetime: 0.8,
    hasRandomCooldown: true, // Flag to indicate random cooldown
    createProjectile: (engine, x, y, z, dirX, dirZ, spell, stats, dirY) => {
      return new IceLance(engine, x, y, z, dirX, dirZ, spell, stats, dirY);
    }
  },

  RING_OF_ICE: {
    name: 'Ring of Ice',
    desc: 'Protective ring of ice shards that orbit the player and freeze enemies',
    category: 'ice',
    level: 1, // Default level
    cooldown: 0, // No cooldown - continuous effect
    damage: 10, // Lower damage than Ring of Fire
    damageSpread: 5, // 5% damage variance (low for consistency)
    critChance: 0.08, // 8% crit chance (low for continuous damage)
    critMultiplier: 1.5, // 1.5x damage on crit
    critDamageSpread: 5, // 5% spread on crit damage
    targeting: 'self',
    isInstant: false,
    isContinuous: true,
    isPersistent: true, // Stays active as long as spell is active
    activeRing: null, // Store reference to active ring
    execute: (engine, player, target, spell, stats) => {
      // Only create ring if it doesn't exist
      if (!spell.activeRing || !spell.activeRing.active) {
        spell.activeRing = new RingOfIce(engine, player, spell.damage * stats.damage, spell);
        engine.addEntity(spell.activeRing);
      }
    }
  },

  // ===== MAGIC SPELLS =====
  MAGIC_BULLET: {
    name: 'Magic Bullet',
    desc: 'Fast rainbow bullets that spray in random directions',
    category: 'magic',
    level: 1, // Default level
    cooldown: 0.08, // Very fast fire rate
    damage: 8,
    damageSpread: 15, // 15% damage variance
    critChance: 0.1, // 10% crit chance
    critMultiplier: 2.0, // 2x damage on crit
    critDamageSpread: 10, // 10% spread on crit damage
    speed: 30, // Very fast
    pierce: 1,
    projectileCount: 1,
    spread: Math.PI * 2, // Full 360 degrees
    targeting: 'none', // No targeting - random directions
    lifetime: 0.6,
    createProjectile: (engine, x, y, z, dirX, dirZ, spell, stats, dirY) => {
      // Random direction (horizontal only for magic bullets)
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDirX = Math.cos(randomAngle);
      const randomDirZ = Math.sin(randomAngle);
      return new MagicBullet(engine, x, y, z, randomDirX, randomDirZ, spell, stats, 0); // No Y direction for random bullets
    }
  },

  DASH_SHOCKWAVE: {
    name: 'Dash Shockwave',
    desc: 'Passive ability that creates a continuous shockwave trail while dashing, pushing back enemies',
    category: 'magic',
    level: 1, // Default level
    cooldown: 0, // No cooldown - triggers on dash
    damage: 10, // Low damage - focus is on knockback
    damageSpread: 0, // No damage variance
    critChance: 0.1, // 10% crit chance
    critMultiplier: 1.5, // 1.5x damage on crit
    radius: 5, // Shockwave radius
    knockbackForce: 12, // Strong knockback distance
    targeting: 'self',
    isInstant: false,
    isContinuous: true,
    isPersistent: true, // Stays active as long as spell is active
    activeRing: null, // Store reference to active shockwave handler
    execute: (engine, player, target, spell, stats) => {
      // Only create shockwave handler if it doesn't exist
      if (!spell.activeRing || !spell.activeRing.active) {
        spell.activeRing = new DashShockwave(engine, player, spell.damage * stats.damage, spell);
        engine.addEntity(spell.activeRing);
      }
    }
  }
};

/**
 * Create a spell instance for a player with level scaling applied
 * @param {string} spellKey - The spell type key (e.g., 'THUNDER_STRIKE')
 * @param {number} level - The spell level (1-7)
 * @returns {object} A copy of the spell with level scaling applied
 */
export function createSpellInstance(spellKey, level = 1) {
  const baseSpell = SPELL_TYPES[spellKey];
  if (!baseSpell) {
    console.error(`Unknown spell type: ${spellKey}`);
    return null;
  }

  // Create a deep copy of the spell
  const spellInstance = { ...baseSpell };

  // Apply level scaling
  applySpellLevelScaling(spellInstance, spellKey, level);

  return spellInstance;
}

/**
 * Upgrade a spell to the next level
 * @param {object} spell - The spell instance to upgrade
 * @param {string} spellKey - The spell type key
 * @returns {boolean} True if upgrade successful, false if already max level
 */
export function upgradeSpell(spell, spellKey) {
  if (!spell || spell.level >= 7) {
    return false; // Already max level
  }

  const newLevel = spell.level + 1;
  applySpellLevelScaling(spell, spellKey, newLevel);

  return true;
}
