import { Projectile } from '../entities/Projectile.js';
import { InstantLightning } from '../entities/InstantLightning.js';
import { ColoredLightning } from '../entities/ColoredLightning.js';
import { GroundLightningStrike } from '../entities/GroundLightningStrike.js';
import { FlameProjectile } from '../entities/FlameProjectile.js';
import { FireExplosion } from '../entities/FireExplosion.js';
import { LightningExplosion } from '../entities/LightningExplosion.js';
import { createProjectileSprite } from '../utils/sprites.js';
import { LightningEffect } from '../effects/LightningEffect.js';
import { SpreadEffect } from '../effects/SpreadEffect.js';
import { FireEffect } from '../effects/FireEffect.js';
import * as THREE from 'three';

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

const staticBurstEffect = new SpreadEffect({
  color: 0xffffff,
  glowColor: 0xccddff,
  width: 1.5,
  boltCount: 6,
  spreadAngle: 0.25,
  rangeMin: 8,
  rangeMax: 12,
  lifetime: 0.2
});

const powerChordEffect = new LightningEffect({
  color: 0xff0000,
  glowColor: 0xff8888,
  width: 3,
  taper: false,
  gradientColor: null,
  lifetime: 0.2,
  branches: 0,
  groundSparks: 0
});

const pyroExplosionEffect = new FireEffect({
  radius: 3.5,
  particleCount: 20,
  lifetime: 1.0,
  color: 0xff4400
});

export const WEAPON_TYPES = {
  SHOTGUN: {
    name: 'Static Burst',
    desc: 'Wide spread of electric sparks',
    cooldown: 0.8,
    damage: 8,
    targeting: 'nearest',
    isInstant: true,
    maxRange: 10,
    execute: (engine, player, target, weapon, stats) => {
      if (!target) return;

      const baseAngle = Math.atan2(target.z - player.z, target.x - player.x);

      // Spawn spread effect
      staticBurstEffect.spawn(engine, {
        x: player.x,
        y: 1.0, // Character center height
        z: player.z,
        targetAngle: baseAngle,
        damage: weapon.damage * stats.damage
      });

      // Check if any enemy is hit by bolts
      for (let i = 0; i < staticBurstEffect.config.boltCount; i++) {
        const spreadOffset = (i - (staticBurstEffect.config.boltCount - 1) / 2) * staticBurstEffect.config.spreadAngle;
        const angle = baseAngle + spreadOffset;
        const range = staticBurstEffect.config.rangeMin + Math.random() * (staticBurstEffect.config.rangeMax - staticBurstEffect.config.rangeMin);

        engine.entities.forEach(entity => {
          if (!entity.active || entity.health === undefined) return;

          const dx = entity.x - player.x;
          const dz = entity.z - player.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const entityAngle = Math.atan2(dz, dx);
          const angleDiff = Math.abs(entityAngle - angle);

          if (dist < range && angleDiff < 0.3) {
            const died = entity.takeDamage(weapon.damage * stats.damage);
            if (died && engine.game) {
              engine.game.killCount++;
              engine.sound.playHit();
              engine.game.dropXP(entity.x, entity.z, entity.isElite);
            }
          }
        });
      }
    }
  },

  RIFLE: {
    name: 'Power Chord',
    desc: 'High voltage lightning beam',
    cooldown: 1.2,
    damage: 35,
    targeting: 'farthest',
    isInstant: true,
    maxRange: 25,
    pierce: 3,
    execute: (engine, player, target, weapon, stats) => {
      if (!target) return;

      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > weapon.maxRange) return;

      // Spawn power chord beam
      powerChordEffect.spawn(engine, {
        startX: player.x,
        startY: 1.0, // Character center height
        startZ: player.z,
        endX: target.x,
        endY: 1.0, // Enemy center height
        endZ: target.z,
        damage: weapon.damage * stats.damage
      });

      // Pierce through multiple enemies in the beam path
      const angle = Math.atan2(dz, dx);
      let hitCount = 0;

      engine.entities.forEach(entity => {
        if (!entity.active || entity.health === undefined || hitCount >= weapon.pierce) return;

        const edx = entity.x - player.x;
        const edz = entity.z - player.z;
        const entityDist = Math.sqrt(edx * edx + edz * edz);
        const entityAngle = Math.atan2(edz, edx);
        const angleDiff = Math.abs(entityAngle - angle);

        if (entityDist <= dist && angleDiff < 0.2) {
          const died = entity.takeDamage(weapon.damage * stats.damage);
          if (died && engine.game) {
            engine.game.killCount++;
            engine.sound.playHit();
            engine.game.dropXP(entity.x, entity.z, entity.isElite);
          }
          hitCount++;
        }
      });
    }
  },

  DYNAMITE: {
    name: 'Pyro Explosion',
    desc: 'Explosive fire area damage',
    cooldown: 1.5,
    damage: 30,
    targeting: 'nearest',
    isInstant: true,
    execute: (engine, player, target, weapon, stats) => {
      if (!target) return;

      pyroExplosionEffect.spawn(engine, {
        x: target.x,
        y: 0, // Ground explosion
        z: target.z,
        damage: weapon.damage * stats.damage
      });
    }
  },

  LIGHTNING: {
    name: 'Chain Lightning',
    desc: 'Lightning chains between enemies',
    cooldown: 0.5,
    damage: 18,
    targeting: 'instant',
    isInstant: true,
    chainCount: 3,
    chainRange: 8,
    execute: (engine, player, target, weapon, stats) => {
      if (!target) return;

      const damage = weapon.damage * stats.damage;
      let currentTarget = target;
      const hitEnemies = new Set();
      let prevX = player.x;
      let prevZ = player.z;

      for (let i = 0; i < weapon.chainCount; i++) {
        if (!currentTarget || hitEnemies.has(currentTarget)) break;

        // Create black/dark purple lightning bolt
        const lightning = new ColoredLightning(
          engine,
          prevX,
          1.0, // Character/enemy center height
          prevZ,
          currentTarget.x,
          1.0, // Enemy center height
          currentTarget.z,
          damage,
          0x2200aa, // Dark purple (almost black)
          0x8844ff, // Purple glow
          1.2
        );
        engine.addEntity(lightning);

        // Damage enemy
        const died = currentTarget.takeDamage(damage);
        if (died && engine.game) {
          engine.game.killCount++;
          engine.sound.playHit();
          engine.game.dropXP(currentTarget.x, currentTarget.z, currentTarget.isElite);
        }

        hitEnemies.add(currentTarget);

        // Find next chain target
        let nextTarget = null;
        let minDist = weapon.chainRange;

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

  FIRE_LANCE: {
    name: 'Fireball',
    desc: 'Blazing fire projectiles with trail',
    cooldown: 0.25,
    damage: 16,
    speed: 20,
    pierce: 2,
    projectileCount: 1,
    spread: 0,
    targeting: 'nearest',
    maxRange: 35, // Don't target enemies too far away
    lifetime: 2,
    createProjectile: (engine, x, y, z, dirX, dirZ, weapon, stats, dirY) => {
      return new FlameProjectile(engine, x, y, z, dirX, dirZ, weapon, stats, dirY);
    }
  },

  FROST_SHOT: {
    name: 'Thunder Strike',
    desc: 'Sky lightning strikes ground with devastating explosion',
    cooldown: 0.8,
    baseCooldownMin: 0.8,
    baseCooldownMax: 1.5,
    damage: 200, // High damage for instant kills
    targeting: 'random', // Pick random target from available enemies
    maxRange: 15,
    isInstant: true,
    execute: (engine, player, target, weapon, stats) => {
      if (!target) return;

      // Prevent simultaneous thunder strikes
      const currentTime = engine.time;
      if (!weapon.lastGlobalStrike) weapon.lastGlobalStrike = 0;
      if (currentTime - weapon.lastGlobalStrike < 0.3) return;
      weapon.lastGlobalStrike = currentTime;

      // Set random cooldown
      weapon.cooldown = weapon.baseCooldownMin + Math.random() * (weapon.baseCooldownMax - weapon.baseCooldownMin);

      // Spawn lightning effect with random offset
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetZ = (Math.random() - 0.5) * 3;

      // Update effect config for this strike
      thunderStrikeEffect.config.branches = 2 + Math.floor(Math.random() * 4);

      const lightning = thunderStrikeEffect.spawn(engine, {
        startX: target.x + offsetX,
        startY: 35,
        startZ: target.z + offsetZ,
        endX: target.x,
        endY: 0, // Target ground
        endZ: target.z,
        damage: 0 // Explosion handles all damage
      });

      // Create ground explosion at impact
      const explosion = new LightningExplosion(
        engine,
        target.x,
        target.z,
        5, // Larger explosion radius
        weapon.damage * stats.damage
      );
      engine.addEntity(explosion);
    }
  }
};
