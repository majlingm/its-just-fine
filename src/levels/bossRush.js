// Boss Rush Level - Each wave is a boss fight for testing
import { getAssetPath } from '../utils/assetPath.js';

export const bossRushLevel = {
  name: 'Boss Rush',
  description: 'Test your skills against multiple bosses',
  groundType: 'rock', // Dark rocky ground
  music: getAssetPath('/assets/music/ashesandscreams.mp3'),

  spawnBoundaries: {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50
  },

  // Wave configuration - Each wave spawns only 1 boss
  waves: [
    // Wave 1 - First Boss
    {
      enemyCount: 1,
      spawnInterval: 0.1,
      spawnBatchSize: 1,
      groupSpawnChance: 0,
      enemyTypes: [
        { type: 'boss', weight: 1 }
      ]
    },
    // Wave 2 - Second Boss (stronger)
    {
      enemyCount: 1,
      spawnInterval: 0.1,
      spawnBatchSize: 1,
      groupSpawnChance: 0,
      enemyTypes: [
        { type: 'boss', weight: 1 }
      ]
    },
    // Wave 3 - Third Boss (even stronger)
    {
      enemyCount: 1,
      spawnInterval: 0.1,
      spawnBatchSize: 1,
      groupSpawnChance: 0,
      enemyTypes: [
        { type: 'boss', weight: 1 }
      ]
    },
    // Wave 4 - Fourth Boss (very strong)
    {
      enemyCount: 1,
      spawnInterval: 0.1,
      spawnBatchSize: 1,
      groupSpawnChance: 0,
      enemyTypes: [
        { type: 'boss', weight: 1 }
      ]
    }
  ],

  // Final boss after waves
  boss: {
    type: 'zombieLord',
    health: 8000,
    damage: 75,
    speed: 4
  },

  // Enemy behavior settings
  enemySettings: {
    rangedEnemies: [],
    elitesCanShoot: true,
    eliteShootChance: 1.0,
    shootRange: 20,
    shootCooldown: { min: 2.0, max: 3.0 },
    projectileSpeed: 12,
    projectileDamage: 25
  },

  objects: [
    // Minimal arena - just some cover
    // Central pillar
    { model: getAssetPath('/models/retro-urban-kit/wall-a.glb'), x: 0, y: 0, z: 0, scale: 2.0, rotation: { y: 0 } },

    // Four corner pillars for cover
    { model: getAssetPath('/models/retro-urban-kit/wall-a-low.glb'), x: -20, y: 0, z: -20, scale: 1.5, rotation: { y: Math.PI / 4 } },
    { model: getAssetPath('/models/retro-urban-kit/wall-a-low.glb'), x: 20, y: 0, z: -20, scale: 1.5, rotation: { y: -Math.PI / 4 } },
    { model: getAssetPath('/models/retro-urban-kit/wall-a-low.glb'), x: -20, y: 0, z: 20, scale: 1.5, rotation: { y: 3 * Math.PI / 4 } },
    { model: getAssetPath('/models/retro-urban-kit/wall-a-low.glb'), x: 20, y: 0, z: 20, scale: 1.5, rotation: { y: -3 * Math.PI / 4 } },

    // Border rocks (non-collidable decorations)
    { model: getAssetPath('/models/nature-kit/stone_tallB.glb'), x: -45, y: 0, z: -45, scale: 1.5, rotation: { y: 0.4 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/stone_tallC.glb'), x: 45, y: 0, z: -45, scale: 1.5, rotation: { y: -0.6 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/stone_tallB.glb'), x: -45, y: 0, z: 45, scale: 1.5, rotation: { y: 2.0 }, collidable: false },
    { model: getAssetPath('/models/nature-kit/stone_tallC.glb'), x: 45, y: 0, z: 45, scale: 1.5, rotation: { y: -2.0 }, collidable: false },

    // Border cliffs for arena boundary (collidable)
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -50, y: 0, z: -50, scale: 1.5, rotation: { y: Math.PI / 4 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 50, y: 0, z: -50, scale: 1.5, rotation: { y: -Math.PI / 4 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: -50, y: 0, z: 50, scale: 1.5, rotation: { y: 3 * Math.PI / 4 } },
    { model: getAssetPath('/models/nature-kit/cliff_block_stone.glb'), x: 50, y: 0, z: 50, scale: 1.5, rotation: { y: -3 * Math.PI / 4 } },
  ]
};
