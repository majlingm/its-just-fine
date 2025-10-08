// Abandoned Town Level - A complete small western town with buildings, streets, and cover

export const abandonedTownLevel = {
  name: 'Abandoned Town',
  description: 'A deserted frontier settlement with a main street and scattered buildings',
  groundType: 'grass', // grass/dirt texture
  music: '/assets/music/ashesandscreams.mp3',

  spawnBoundaries: {
    minX: -80,
    maxX: 80,
    minZ: -80,
    maxZ: 80
  },

  // Wave configuration - Hard level (4x+ enemy counts)
  waves: [
    // Wave 1 - Aggressive opening
    {
      enemyCount: 80,
      spawnInterval: 1.0,
      spawnBatchSize: 5,
      groupSpawnChance: 0.8,
      enemyTypes: [
        { type: 'normal', weight: 7 },
        { type: 'fast', weight: 3 }
      ]
    },
    // Wave 2 - Relentless pressure
    {
      enemyCount: 100,
      spawnInterval: 0.8,
      spawnBatchSize: 6,
      groupSpawnChance: 0.7,
      enemyTypes: [
        { type: 'normal', weight: 5 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 1 }
      ]
    },
    // Wave 3 - Elite swarm
    {
      enemyCount: 120,
      spawnInterval: 0.6,
      spawnBatchSize: 7,
      groupSpawnChance: 0.6,
      enemyTypes: [
        { type: 'normal', weight: 4 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 2 }
      ]
    },
    // Wave 4 - Overwhelming force
    {
      enemyCount: 140,
      spawnInterval: 0.5,
      spawnBatchSize: 8,
      groupSpawnChance: 0.9, // Mostly massive groups
      enemyTypes: [
        { type: 'normal', weight: 3 },
        { type: 'fast', weight: 4 },
        { type: 'elite', weight: 3 }
      ]
    }
  ],

  // Boss configuration - Tougher boss
  boss: {
    type: 'zombieLord',
    health: 6000,
    damage: 60,
    speed: 3.5
  },

  // Enemy behavior settings - Hard mode
  enemySettings: {
    rangedEnemies: ['gunman', 'brute'], // Only gunman and brute special types
    elitesCanShoot: true,
    eliteShootChance: 0.9, // 90% of elites can shoot (hard mode!)
    shootRange: 18,
    shootCooldown: { min: 2.0, max: 4.0 },
    projectileSpeed: 10,
    projectileDamage: 18
  },

  objects: [
    // ===== GROUND LAYOUT =====
    // Main Street (vertical) - asphalt road
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: -60, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: -40, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: -20, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-center.glb', x: 0, y: 0.02, z: 0, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: 20, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: 40, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/road-asphalt-straight.glb', x: 0, y: 0.02, z: 60, scale: 2, rotation: { y: 0 }, collidable: false },

    // Side Street (horizontal, east)
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: 20, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: 40, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: 60, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },

    // Side Street (horizontal, west)
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: -20, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: -40, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },
    { model: '/models/retro-urban-kit/road-dirt-straight.glb', x: -60, y: 0.02, z: 0, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },

    // Grass patches around town edges (don't need these anymore since we have tiled grass ground)
    // { model: '/models/retro-urban-kit/grass.glb', x: -70, y: 0, z: -70, scale: 3, rotation: { y: 0 }, collidable: false },
    // { model: '/models/retro-urban-kit/grass.glb', x: 70, y: 0, z: -70, scale: 3, rotation: { y: Math.PI / 2 }, collidable: false },
    // { model: '/models/retro-urban-kit/grass.glb', x: -70, y: 0, z: 70, scale: 3, rotation: { y: -Math.PI / 2 }, collidable: false },
    // { model: '/models/retro-urban-kit/grass.glb', x: 70, y: 0, z: 70, scale: 3, rotation: { y: Math.PI }, collidable: false },

    // ===== WEST SIDE BUILDINGS =====
    // Building 1: Small shop (north-west)
    { model: '/models/retro-urban-kit/wall-a.glb', x: -25, y: 0, z: -50, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-window.glb', x: -25, y: 0, z: -40, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-corner.glb', x: -25, y: 0, z: -30, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -35, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-window.glb', x: -45, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-corner.glb', x: -55, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -55, y: 0, z: -40, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-door.glb', x: -55, y: 0, z: -50, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-roof.glb', x: -40, y: 0, z: -40, scale: 2, rotation: { y: 0 }, collidable: false },

    // Building 2: Two-story building (mid-west)
    { model: '/models/retro-urban-kit/wall-b.glb', x: -25, y: 0, z: -15, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: -25, y: 0, z: -5, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: -25, y: 0, z: 5, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-door.glb', x: -35, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: -45, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: -55, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: -55, y: 0, z: -5, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: -55, y: 0, z: -15, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/balcony-type-a.glb', x: -40, y: 0, z: -10, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/wall-b-roof.glb', x: -40, y: 0, z: -5, scale: 2, rotation: { y: 0 }, collidable: false },

    // Building 3: Garage/warehouse (south-west)
    { model: '/models/retro-urban-kit/wall-a-garage.glb', x: -25, y: 0, z: 35, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -25, y: 0, z: 45, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-corner.glb', x: -25, y: 0, z: 55, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -35, y: 0, z: 55, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -45, y: 0, z: 55, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-corner.glb', x: -55, y: 0, z: 55, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a.glb', x: -55, y: 0, z: 45, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-window.glb', x: -55, y: 0, z: 35, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/roof-metal-type-a.glb', x: -40, y: 0, z: 45, scale: 2, rotation: { y: 0 }, collidable: false },

    // ===== EAST SIDE BUILDINGS =====
    // Building 4: Corner store (north-east)
    { model: '/models/retro-urban-kit/wall-b.glb', x: 25, y: 0, z: -50, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-door.glb', x: 25, y: 0, z: -40, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: 25, y: 0, z: -30, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: 35, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 45, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: 55, y: 0, z: -30, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: 55, y: 0, z: -40, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 55, y: 0, z: -50, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/detail-awning-wide.glb', x: 40, y: 0, z: -30, scale: 2, rotation: { y: Math.PI }, collidable: false },
    { model: '/models/retro-urban-kit/wall-b-roof.glb', x: 40, y: 0, z: -40, scale: 2, rotation: { y: 0 }, collidable: false },

    // Building 5: Painted building (mid-east)
    { model: '/models/retro-urban-kit/wall-a-painted.glb', x: 25, y: 0, z: -15, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-window.glb', x: 25, y: 0, z: -5, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-corner-painted.glb', x: 25, y: 0, z: 5, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-painted.glb', x: 35, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-door.glb', x: 45, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-corner-painted.glb', x: 55, y: 0, z: 5, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-a-painted.glb', x: 55, y: 0, z: -5, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-painted.glb', x: 55, y: 0, z: -15, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-a-roof.glb', x: 40, y: 0, z: -5, scale: 2, rotation: { y: 0 }, collidable: false },

    // Building 6: Large warehouse (south-east)
    { model: '/models/retro-urban-kit/wall-b.glb', x: 30, y: 0, z: 30, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-garage.glb', x: 30, y: 0, z: 40, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 30, y: 0, z: 50, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: 30, y: 0, z: 60, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 40, y: 0, z: 60, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 50, y: 0, z: 60, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-corner.glb', x: 60, y: 0, z: 60, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: 60, y: 0, z: 50, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b.glb', x: 60, y: 0, z: 40, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/wall-b-window.glb', x: 60, y: 0, z: 30, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/roof-metal-type-b.glb', x: 45, y: 0, z: 45, scale: 2, rotation: { y: 0 }, collidable: false },

    // ===== STREET COVER & DECORATIONS =====
    // Barriers and cover along main street
    { model: '/models/retro-urban-kit/detail-barrier-strong-type-a.glb', x: -12, y: 0, z: -25, scale: 2, rotation: { y: 0 } },
    { model: '/models/retro-urban-kit/detail-barrier-strong-type-b.glb', x: 12, y: 0, z: 25, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/detail-barrier-type-a.glb', x: -10, y: 0, z: 50, scale: 2, rotation: { y: Math.PI / 4 } },
    { model: '/models/retro-urban-kit/detail-barrier-type-b.glb', x: 10, y: 0, z: -50, scale: 2, rotation: { y: -Math.PI / 4 } },

    // Dumpsters for cover
    { model: '/models/retro-urban-kit/detail-dumpster-closed.glb', x: -18, y: 0, z: -45, scale: 2, rotation: { y: Math.PI / 2 } },
    { model: '/models/retro-urban-kit/detail-dumpster-open.glb', x: 18, y: 0, z: 45, scale: 2, rotation: { y: -Math.PI / 2 } },
    { model: '/models/retro-urban-kit/detail-dumpster-closed.glb', x: -45, y: 0, z: 15, scale: 2, rotation: { y: Math.PI } },

    // Crates and pallets
    { model: '/models/retro-urban-kit/pallet.glb', x: -15, y: 0, z: 30, scale: 2, rotation: { y: 0.3 } },
    { model: '/models/retro-urban-kit/pallet-small.glb', x: -13, y: 0, z: 32, scale: 2, rotation: { y: -0.5 } },
    { model: '/models/retro-urban-kit/detail-block.glb', x: 15, y: 0, z: -30, scale: 2, rotation: { y: 0.7 } },
    { model: '/models/retro-urban-kit/pallet.glb', x: 50, y: 0, z: 15, scale: 2, rotation: { y: -0.8 } },

    // Benches
    { model: '/models/retro-urban-kit/detail-bench.glb', x: -15, y: 0.01, z: -35, scale: 2, rotation: { y: Math.PI / 2 }, collidable: false },
    { model: '/models/retro-urban-kit/detail-bench.glb', x: 15, y: 0.01, z: 35, scale: 2, rotation: { y: -Math.PI / 2 }, collidable: false },

    // Street lights
    { model: '/models/retro-urban-kit/detail-light-double.glb', x: -12, y: 0.01, z: 0, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/detail-light-double.glb', x: 12, y: 0.01, z: 0, scale: 2, rotation: { y: Math.PI }, collidable: false },
    { model: '/models/retro-urban-kit/detail-light-single.glb', x: -12, y: 0.01, z: -55, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/detail-light-single.glb', x: 12, y: 0.01, z: 55, scale: 2, rotation: { y: Math.PI }, collidable: false },

    // ===== ABANDONED VEHICLES =====
    { model: '/models/retro-urban-kit/truck-grey.glb', x: -8, y: 0, z: -10, scale: 2, rotation: { y: Math.PI }, collidable: false },
    { model: '/models/retro-urban-kit/truck-green-cargo.glb', x: 8, y: 0, z: 15, scale: 2, rotation: { y: 0 }, collidable: false },
    { model: '/models/retro-urban-kit/truck-flat.glb', x: 70, y: 0, z: 8, scale: 2, rotation: { y: -Math.PI / 2 }, collidable: false },

    // ===== TREES & VEGETATION =====
    // Small urban trees in corners
    { model: '/models/retro-urban-kit/tree-park-large.glb', x: -70, y: 0, z: -65, scale: 2.5, rotation: { y: 0.3 } },
    { model: '/models/retro-urban-kit/tree-park-large.glb', x: 70, y: 0, z: -65, scale: 2.5, rotation: { y: -0.8 } },
    { model: '/models/retro-urban-kit/tree-park-large.glb', x: -70, y: 0, z: 65, scale: 2.5, rotation: { y: 1.2 } },
    { model: '/models/retro-urban-kit/tree-park-large.glb', x: 70, y: 0, z: 65, scale: 2.5, rotation: { y: -1.5 } },

    // Pine trees on outskirts
    { model: '/models/retro-urban-kit/tree-pine-large.glb', x: -75, y: 0, z: -30, scale: 2.8, rotation: { y: 0.5 } },
    { model: '/models/retro-urban-kit/tree-pine-large.glb', x: -75, y: 0, z: 30, scale: 2.8, rotation: { y: -0.6 } },
    { model: '/models/retro-urban-kit/tree-pine-large.glb', x: 75, y: 0, z: -30, scale: 2.8, rotation: { y: 0.9 } },
    { model: '/models/retro-urban-kit/tree-pine-large.glb', x: 75, y: 0, z: 30, scale: 2.8, rotation: { y: -1.1 } },

    // Shrubs scattered around
    { model: '/models/retro-urban-kit/tree-shrub.glb', x: -60, y: 0, z: -60, scale: 2, rotation: { y: 0.4 }, collidable: false },
    { model: '/models/retro-urban-kit/tree-shrub.glb', x: 60, y: 0, z: -60, scale: 2, rotation: { y: -0.7 }, collidable: false },
    { model: '/models/retro-urban-kit/tree-shrub.glb', x: -60, y: 0, z: 60, scale: 2, rotation: { y: 1.0 }, collidable: false },
    { model: '/models/retro-urban-kit/tree-shrub.glb', x: 60, y: 0, z: 60, scale: 2, rotation: { y: -0.9 }, collidable: false },

    // ===== BROKEN/DAMAGED ELEMENTS =====
    // Broken walls showing abandonment
    { model: '/models/retro-urban-kit/wall-broken-type-a.glb', x: -70, y: 0, z: -10, scale: 2, rotation: { y: 0 } },
    { model: '/models/retro-urban-kit/wall-broken-type-b.glb', x: -70, y: 0, z: 10, scale: 2, rotation: { y: 0.3 } },
    { model: '/models/retro-urban-kit/wall-broken-type-a.glb', x: 70, y: 0, z: -10, scale: 2, rotation: { y: Math.PI } },
    { model: '/models/retro-urban-kit/wall-broken-type-b.glb', x: 70, y: 0, z: 10, scale: 2, rotation: { y: Math.PI - 0.3 } },

    // Debris
    { model: '/models/retro-urban-kit/detail-bricks-type-a.glb', x: -20, y: 0.01, z: -20, scale: 2, rotation: { y: 0.6 }, collidable: false },
    { model: '/models/retro-urban-kit/detail-bricks-type-b.glb', x: 20, y: 0.01, z: 20, scale: 2, rotation: { y: -0.7 }, collidable: false },
    { model: '/models/retro-urban-kit/planks.glb', x: -65, y: 0.01, z: -5, scale: 2, rotation: { y: 0.5 }, collidable: false },
    { model: '/models/retro-urban-kit/planks.glb', x: 65, y: 0.01, z: 5, scale: 2, rotation: { y: -0.8 }, collidable: false },
  ]
};
