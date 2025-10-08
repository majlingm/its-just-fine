// Urban Outpost Level - An abandoned settlement with buildings and cover

export const urbanOutpostLevel = {
  name: 'Ghost Town',
  description: 'An abandoned frontier outpost',
  groundType: 'desert', // sand texture
  music: '/assets/music/ashesandscreams.mp3',

  spawnBoundaries: {
    minX: -75,
    maxX: 75,
    minZ: -75,
    maxZ: 75
  },

  // Wave configuration - Medium difficulty (4x enemy counts)
  waves: [
    // Wave 1 - Steady start
    {
      enemyCount: 60,
      spawnInterval: 1.2,
      spawnBatchSize: 4,
      groupSpawnChance: 0.7,
      enemyTypes: [
        { type: 'normal', weight: 10 }
      ]
    },
    // Wave 2 - Fast enemies introduced
    {
      enemyCount: 80,
      spawnInterval: 1.0,
      spawnBatchSize: 5,
      groupSpawnChance: 0.6,
      enemyTypes: [
        { type: 'normal', weight: 7 },
        { type: 'fast', weight: 3 }
      ]
    },
    // Wave 3 - Elite pressure
    {
      enemyCount: 100,
      spawnInterval: 0.8,
      spawnBatchSize: 6,
      groupSpawnChance: 0.5,
      enemyTypes: [
        { type: 'normal', weight: 5 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 1 }
      ]
    },
    // Wave 4 - Final assault
    {
      enemyCount: 120,
      spawnInterval: 0.6,
      spawnBatchSize: 7,
      groupSpawnChance: 0.8,
      enemyTypes: [
        { type: 'normal', weight: 4 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 2 }
      ]
    }
  ],

  // Boss configuration
  boss: {
    type: 'zombieLord',
    health: 5000,
    damage: 50,
    speed: 3
  },

  // Enemy behavior settings
  enemySettings: {
    rangedEnemies: ['gunman'], // Only special gunman type can shoot
    elitesCanShoot: true,
    eliteShootChance: 0.7, // 70% of elites can shoot
    shootRange: 15,
    shootCooldown: { min: 3.0, max: 5.0 },
    projectileSpeed: 8,
    projectileDamage: 15
  },

  objects: [
    // Central buildings - main structures (collidable walls)
    // Building 1 - Left side
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a.glb', x: -30, y: 0, z: -15, scale: 1.5, rotation: { y: 0 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a-corner.glb', x: -30, y: 0, z: -5, scale: 1.5, rotation: { y: 0 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a-window.glb', x: -20, y: 0, z: -15, scale: 1.5, rotation: { y: 0 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a-door.glb', x: -20, y: 0, z: -5, scale: 1.5, rotation: { y: Math.PI } },

    // Building 2 - Right side
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-b.glb', x: 25, y: 0, z: 10, scale: 1.5, rotation: { y: Math.PI / 2 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-b-window.glb', x: 35, y: 0, z: 10, scale: 1.5, rotation: { y: Math.PI / 2 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-b-corner.glb', x: 25, y: 0, z: 20, scale: 1.5, rotation: { y: Math.PI / 2 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-b-door.glb', x: 35, y: 0, z: 20, scale: 1.5, rotation: { y: -Math.PI / 2 } },

    // Building 3 - Back area (damaged/broken - still collidable)
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-broken-type-a.glb', x: 0, y: 0, z: 40, scale: 1.5, rotation: { y: 0 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-broken-type-b.glb', x: 10, y: 0, z: 40, scale: 1.5, rotation: { y: 0.3 } },

    // Low walls for cover (collidable)
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a-low.glb', x: -45, y: 0, z: 0, scale: 1.2, rotation: { y: Math.PI / 4 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-a-low.glb', x: 45, y: 0, z: -25, scale: 1.2, rotation: { y: -Math.PI / 3 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/wall-b-low.glb', x: 0, y: 0, z: -35, scale: 1.2, rotation: { y: Math.PI / 2 } },

    // Fences around perimeter (non-collidable - can be shot/walked through)
    { model: '/packs/nature-kit/Models/GLTF format/fence_planks.glb', x: -60, y: 0, z: -40, scale: 1.5, rotation: { y: 0 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/fence_planks.glb', x: -60, y: 0, z: -30, scale: 1.5, rotation: { y: 0 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/fence_planks.glb', x: -60, y: 0, z: -20, scale: 1.5, rotation: { y: 0 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/fence_simple.glb', x: 60, y: 0, z: 30, scale: 1.5, rotation: { y: Math.PI }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/fence_simple.glb', x: 60, y: 0, z: 40, scale: 1.5, rotation: { y: Math.PI }, collidable: false },

    // Scattered debris and objects (collidable for cover)
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-dumpster-closed.glb', x: -15, y: 0, z: 25, scale: 1.0, rotation: { y: 0.5 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-dumpster-open.glb', x: 40, y: 0, z: -10, scale: 1.0, rotation: { y: -0.8 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-barrier-type-a.glb', x: -25, y: 0, z: 35, scale: 1.0, rotation: { y: Math.PI / 4 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-barrier-type-b.glb', x: 30, y: 0, z: -30, scale: 1.0, rotation: { y: -Math.PI / 3 } },

    // Wooden crates and pallets (collidable for cover)
    { model: '/packs/retro-urban-kit/Models/GLB format/pallet.glb', x: -40, y: 0, z: -20, scale: 1.0, rotation: { y: 0.3 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/pallet-small.glb', x: -38, y: 0, z: -18, scale: 1.0, rotation: { y: -0.5 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-block.glb', x: 35, y: 0, z: 35, scale: 1.0, rotation: { y: 0.7 } },
    { model: '/packs/nature-kit/Models/GLTF format/pallet.glb', x: -10, y: 0, z: -30, scale: 1.0, rotation: { y: -0.4 } },

    // Barrels and smaller debris (non-collidable)
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-bricks-type-a.glb', x: 15, y: 0, z: -20, scale: 1.0, rotation: { y: 0.6 }, collidable: false },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-bricks-type-b.glb', x: -20, y: 0, z: 15, scale: 1.0, rotation: { y: -0.7 }, collidable: false },

    // Trees for atmosphere (dead/sparse) - non-collidable
    { model: '/packs/retro-urban-kit/Models/GLB format/tree-shrub.glb', x: -50, y: 0, z: 45, scale: 1.2, rotation: { y: 0.3 }, collidable: false },
    { model: '/packs/retro-urban-kit/Models/GLB format/tree-small.glb', x: 50, y: 0, z: -45, scale: 1.0, rotation: { y: -0.8 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/tree_small_fall.glb', x: -55, y: 0, z: -50, scale: 1.5, rotation: { y: 1.2 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/stump_old.glb', x: 48, y: 0, z: 42, scale: 1.3, rotation: { y: -1.0 }, collidable: false },

    // Rocks scattered around (non-collidable decorations)
    { model: '/packs/nature-kit/Models/GLTF format/stone_tallB.glb', x: -65, y: 0, z: 10, scale: 1.0, rotation: { y: 0.4 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/stone_tallC.glb', x: 65, y: 0, z: -15, scale: 0.9, rotation: { y: -0.6 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/rock_smallFlatA.glb', x: 10, y: 0, z: 5, scale: 0.8, rotation: { y: 0.2 }, collidable: false },
    { model: '/packs/nature-kit/Models/GLTF format/rock_smallFlatB.glb', x: -8, y: 0, z: -8, scale: 0.7, rotation: { y: -0.3 }, collidable: false },

    // Border cliffs for canyon feel (collidable boundary)
    { model: '/packs/nature-kit/Models/GLTF format/cliff_block_stone.glb', x: -70, y: 0, z: -70, scale: 1.5, rotation: { y: Math.PI / 4 } },
    { model: '/packs/nature-kit/Models/GLTF format/cliff_block_stone.glb', x: 70, y: 0, z: -70, scale: 1.5, rotation: { y: -Math.PI / 4 } },
    { model: '/packs/nature-kit/Models/GLTF format/cliff_block_stone.glb', x: -70, y: 0, z: 70, scale: 1.5, rotation: { y: 3 * Math.PI / 4 } },
    { model: '/packs/nature-kit/Models/GLTF format/cliff_block_stone.glb', x: 70, y: 0, z: 70, scale: 1.5, rotation: { y: -3 * Math.PI / 4 } },

    // Additional scattered cover (collidable)
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-barrier-strong-type-a.glb', x: 0, y: 0, z: -25, scale: 1.0, rotation: { y: 0 } },
    { model: '/packs/retro-urban-kit/Models/GLB format/detail-barrier-strong-type-b.glb', x: -35, y: 0, z: 20, scale: 1.0, rotation: { y: Math.PI / 2 } },
  ]
};
