// Survival Mode - Endless waves on simple grass field
import { getAssetPath } from '../utils/assetPath.js';

export const survivalLevel = {
  name: 'Survive!',
  description: 'Endless waves of increasingly difficult enemies',
  groundType: 'void',
  music: getAssetPath('/assets/music/risinginferno.mp3'),
  isSurvival: true, // Flag for endless mode

  lighting: {
    background: 0x87ceeb, // Sky blue
    ambient: { color: 0xffffff, intensity: 0.8 },
    sun: {
      color: 0xffffff,
      intensity: 1.2,
      position: { x: 20, y: 40, z: 15 }
    },
    fill: { color: 0xccccff, intensity: 0.5 },
    hemisphere: {
      sky: 0xaaccff,
      ground: 0x888888,
      intensity: 0.7
    }
  },

  spawnBoundaries: {
    minX: -100,
    maxX: 100,
    minZ: -100,
    maxZ: 100
  },

  // Initial wave configuration - will scale infinitely
  waves: [
    {
      enemyCount: 40,
      spawnInterval: 1.0,
      spawnBatchSize: 5,
      groupSpawnChance: 0.7,
      enemyTypes: [
        // Shadow variations - 7 different types (crawlers disabled)
        { type: 'shadow', weight: 3 },           // Original: balanced, medium
        { type: 'shadow_lurker', weight: 5 },    // Small fast weak - common
        { type: 'shadow_titan', weight: 1 },     // Huge slow boss-like - rare
        { type: 'shadow_wraith', weight: 4 },    // Fast medium red - fairly common
        { type: 'shadow_colossus', weight: 2 },  // Large slow tanky - uncommon
        { type: 'shadow_flicker', weight: 6 },   // Tiny extremely fast - very common
        { type: 'shadow_void', weight: 2 },      // Large slow pure black - uncommon
        // { type: 'shadow_crawler', weight: 5 },   // Spider-like crawler - DISABLED
        // { type: 'shadow_serpent', weight: 4 },   // Worm/serpent crawler - DISABLED

        // Light variations - white counterparts with black outlines
        { type: 'light', weight: 3 },            // Original: balanced, medium
        { type: 'light_lurker', weight: 5 },     // Small fast weak - common
        { type: 'light_titan', weight: 1 },      // Huge slow boss-like - rare
        { type: 'light_wraith', weight: 4 },     // Fast medium blue - fairly common
        { type: 'light_colossus', weight: 2 },   // Large slow tanky - uncommon
        { type: 'light_flicker', weight: 6 },    // Tiny extremely fast - very common
        { type: 'light_void', weight: 2 }        // Large slow pure white - uncommon
        // { type: 'light_crawler', weight: 5 },    // Spider-like crawler - DISABLED
        // { type: 'light_serpent', weight: 4 }     // Worm/serpent crawler - DISABLED
      ]
    }
  ],

  // Boss spawns every 7 waves
  boss: {
    type: 'zombieLord',
    health: 3000,
    damage: 35,
    speed: 2.5
  },

  // Enemy behavior settings
  enemySettings: {
    rangedEnemies: ['fast'],
    elitesCanShoot: true,
    eliteShootChance: 0.6,
    shootRange: 12,
    shootCooldown: { min: 3.5, max: 5.5 },
    projectileSpeed: 7,
    projectileDamage: 15
  },

  // Minimal objects - just grass field
  objects: []
};
