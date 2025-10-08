// Survival Mode - Endless waves on simple grass field
import { getAssetPath } from '../utils/assetPath.js';

export const survivalLevel = {
  name: 'Survive!',
  description: 'Endless waves of increasingly difficult enemies',
  groundType: 'checkerboard',
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
        { type: 'bandit', weight: 5 },
        { type: 'coyote', weight: 3 },
        { type: 'brute', weight: 2 },
        { type: 'tiny', weight: 4 },
        { type: 'giant', weight: 1 },
        { type: 'skeleton_warrior', weight: 3 },
        { type: 'skeleton_mage', weight: 2 }
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
