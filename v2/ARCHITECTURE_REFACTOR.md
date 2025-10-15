# Architecture Refactoring Plan - v2

**Project**: Its Just Fine v2 (Refactored Version)
**Status**: Phase 4 (Systems Migration) - In Progress
**Started**: 2025-10-15
**Goal**: Migrate existing game (v1) to new ECS architecture (v2)

---

## 🎯 Project Structure

This is **v2** - the refactored version of Its Just Fine, located in its own directory:

```
its-just-fine/
├── v1/                          # ❌ OLD GAME (to be moved from root)
│   └── (Original game code - reference only)
│
├── v2/                          # ✅ THIS DIRECTORY (new refactored code)
│   ├── src/
│   ├── package.json             # Independent package.json
│   ├── vite.config.js           # Port 5174 (different from v1)
│   └── vitest.config.js
│
├── PROJECT_STRUCTURE.md         # Explains v1/v2 split
└── ARCHITECTURE_REFACTOR.md     # This file (copied to v2/)
```

**Important**: v2 is a **standalone refactored version**, not a modification of v1. It has its own:
- ✅ package.json
- ✅ Dependencies
- ✅ Dev server (port 5174)
- ✅ Test suite

---

## 🎯 Objectives

1. **Separate Core Engine from Game Logic**: Make the engine reusable for other projects
2. **Renderer Abstraction**: Decouple Three.js rendering from game logic
3. **Configuration-Driven Design**: Define all game content in JSON (enemies, spells, maps, spawns)
4. **Entity Component System (ECS)**: Replace inheritance with composition
5. **Modular Systems**: Independent, testable game systems
6. **Config-First Development**: Design configs before code, expand iteratively

---

## 📊 v1 Architecture Issues (What We're Fixing)

- ❌ Game logic mixed with engine code (`DustAndDynamiteGame.js` handles rendering)
- ❌ Hard-coded entity behaviors (`Enemy.js`, `BossEnemy.js` have stats in code)
- ❌ Tight coupling between systems
- ❌ Limited reusability across different game modes
- ❌ Configuration scattered throughout codebase
- ❌ Difficult to add new content without code changes

---

## 🏗️ v2 Architecture (Complete Structure)

```
v2/src/
├── 📁 core/                      # PURE ENGINE (reusable for any game)
│   ├── 📁 engine/
│   │   ├── Engine.js             # ✅ COMPLETE (147 lines) - Core game loop, time management
│   │   └── EntityManager.js      # ✅ COMPLETE (311 lines) - Entity creation, destruction, lifecycle
│   │
│   ├── 📁 ecs/                   # ✅ COMPLETE - Entity Component System (core)
│   │   ├── Component.js          # ✅ COMPLETE (96 lines) - Base component class
│   │   ├── ComponentSystem.js    # ✅ COMPLETE (105 lines) - Base system class
│   │   ├── Entity.js             # ✅ COMPLETE (178 lines) - ECS entity
│   │   ├── ComponentRegistry.js  # ⏳ TODO - Register component types
│   │   └── Query.js              # ⏳ TODO - Entity query system
│   │
│   ├── 📁 pooling/               # ⏳ TODO - Object Pooling
│   │   ├── ObjectPool.js         # Generic object pool
│   │   ├── PoolManager.js        # Manage all pools
│   │   └── Poolable.js           # Poolable interface/mixin
│   │
│   ├── 📁 renderer/
│   │   ├── Renderer.js           # ✅ COMPLETE (335 lines) - Three.js wrapper/abstraction
│   │   ├── Camera.js             # ⏳ TODO - Camera system
│   │   ├── LightingSystem.js     # ⏳ TODO - Lights management
│   │   ├── MaterialCache.js      # ⏳ TODO - Material pooling
│   │   └── ShaderManager.js      # ⏳ TODO - Custom shaders
│   │
│   ├── 📁 physics/               # ⏳ TODO - Physics systems
│   │   ├── CollisionSystem.js    # Collision detection
│   │   ├── MovementSystem.js     # Movement/velocity processing
│   │   └── SpatialGrid.js        # Spatial partitioning for optimization
│   │
│   ├── 📁 input/
│   │   ├── InputManager.js       # ✅ COMPLETE (324 lines) - Keyboard, mouse, touch input
│   │   └── InputMapper.js        # ⏳ TODO - Rebindable controls
│   │
│   └── 📁 audio/                 # ⏳ TODO - Audio systems
│       ├── AudioEngine.js        # Sound playback
│       ├── SoundCache.js         # Sound pooling
│       └── MusicManager.js       # Background music
│
├── 📁 components/                # ECS Components (data only)
│   ├── Transform.js              # ✅ COMPLETE (72 lines) - Position, rotation, scale
│   ├── Health.js                 # ✅ COMPLETE (82 lines) - HP, max HP, shields
│   ├── Movement.js               # ✅ COMPLETE (92 lines) - Velocity, speed, acceleration
│   ├── Renderable.js             # ✅ COMPLETE (84 lines) - Mesh, material, visibility
│   ├── AI.js                     # ✅ COMPLETE (119 lines) - Behavior data, state
│   ├── Combat.js                 # ⏳ TODO - Damage, attack speed, crit
│   ├── Projectile.js             # ⏳ TODO - Projectile-specific data
│   ├── Lifetime.js               # ⏳ TODO - TTL, age, expiration
│   └── StatusEffects.js          # ⏳ TODO - Active effects array
│
├── 📁 systems/                   # GAME SYSTEMS (game-specific logic)
│   ├── 📁 entity/
│   │   ├── EntityFactory.js      # ✅ COMPLETE (237 lines) - Create entities from config
│   │   └── Prefabs.js            # ⏳ TODO - Reusable entity templates
│   │
│   ├── 📁 spawning/              # ⏳ TODO: Phase 4
│   │   ├── SpawnSystem.js        # Spawning logic (game-specific rules)
│   │   ├── WaveManager.js        # Wave progression logic
│   │   └── SpawnPatterns.js      # Spawn formations (circle, line, grid)
│   │
│   ├── 📁 combat/                # ⏳ TODO: Phase 4
│   │   ├── DamageSystem.js       # Damage calculation (game balance)
│   │   ├── HealthSystem.js       # Health management
│   │   ├── ProjectileSystem.js   # Projectile logic
│   │   └── StatusEffectSystem.js # Buffs/debuffs (freeze, burn, stun)
│   │
│   ├── 📁 progression/           # ⏳ TODO: Phase 4
│   │   ├── XPSystem.js           # Experience collection (RPG mechanic)
│   │   ├── LevelUpSystem.js      # Level progression
│   │   └── UpgradeSystem.js      # Upgrade selection
│   │
│   └── 📁 world/                 # ⏳ TODO: Phase 4
│       ├── LevelLoader.js        # Load level configurations
│       ├── GroundSystem.js       # Terrain generation
│       └── EnvironmentSystem.js  # Props, fog, skybox
│
├── 📁 behaviors/                 # ⏳ TODO: Phase 4 - AI Behaviors (reusable scripts)
│   ├── ChasePlayer.js            # Chase player behavior
│   ├── ShootAtPlayer.js          # Ranged attack behavior
│   ├── PatrolArea.js             # Patrol behavior
│   ├── FleeWhenLowHealth.js      # Flee behavior
│   └── BossPhases.js             # Boss phase transitions
│
├── 📁 effects/                   # ⏳ TODO: Phase 4 - Visual/Audio effects
│   ├── ParticleSystem.js         # Particle rendering
│   ├── EffectFactory.js          # Create effects from config
│   └── DamageNumbers.js          # Floating damage text
│
├── 📁 game/                      # ⏳ TODO: Phase 4 - Game-specific code
│   ├── Game.js                   # Main game controller
│   ├── GameMode.js               # Base game mode class
│   ├── 📁 modes/
│   │   ├── SurvivalMode.js       # Survival mode logic
│   │   ├── StoryMode.js          # Story mode logic
│   │   └── BossRushMode.js       # Boss rush mode logic
│   │
│   └── 📁 ui/
│       ├── HUD.js                # Heads-up display
│       ├── MenuSystem.js         # Main menu, pause menu
│       └── UpgradeScreen.js      # Level-up upgrades
│
├── 📁 config/                    # 🎯 ALL GAME CONFIGURATIONS (JSON-Driven Design)
│   │
│   ├── 📁 maps/                  # ⏳ TODO - Map/Level Definitions (TOP-LEVEL)
│   │   ├── survival_desert.json  # Survival mode - Desert map
│   │   ├── survival_town.json    # Survival mode - Abandoned town
│   │   ├── story_01_canyon.json  # Story mode - Canyon level
│   │   ├── story_02_ruins.json   # Story mode - Ancient ruins
│   │   └── boss_rush.json        # Boss rush mode map
│   │   │
│   │   │   Map config structure (hierarchical):
│   │   │   {
│   │   │     "id": "survival_desert",
│   │   │     "name": "Desert Wasteland",
│   │   │     "description": "Survive waves of enemies in the scorching desert",
│   │   │     "gameMode": "survival",              # ✅ IMPLEMENTED
│   │   │     "environment": "environments/desert", # ⏳ TODO - Links to environment config
│   │   │     "spawnConfig": "spawns/desert_survival", # ⏳ TODO - Links to spawn config
│   │   │     "winConditions": {                   # ⏳ TODO
│   │   │       "type": "survive_time",            # survive_time, kill_boss, collect_items
│   │   │       "duration": 600,                   # 10 minutes for time-based
│   │   │       "bossId": null,                    # Boss ID for kill_boss mode
│   │   │       "itemId": null,                    # Item ID for collect mode
│   │   │       "itemCount": 0                     # How many items to collect
│   │   │     },
│   │   │     "loseConditions": {                  # ⏳ TODO
│   │   │       "type": "player_death",            # player_death, time_limit
│   │   │       "timeLimit": null
│   │   │     },
│   │   │     "difficulty": {                      # ⏳ TODO
│   │   │       "enemyHealthMultiplier": 1.0,
│   │   │       "enemyDamageMultiplier": 1.0,
│   │   │       "enemySpeedMultiplier": 1.0,
│   │   │       "spawnRateMultiplier": 1.0
│   │   │     },
│   │   │     "playerStart": {"x": 0, "y": 0, "z": 0}, # ⏳ TODO
│   │   │     "cameraConfig": {                    # ⏳ TODO
│   │   │       "type": "follow",                  # follow, fixed, orbit
│   │   │       "distance": 15,
│   │   │       "angle": 45,
│   │   │       "height": 22.5
│   │   │     },
│   │   │     "music": "audio/music/desert_theme", # ⏳ TODO
│   │   │     "ambientSounds": ["wind", "sandstorm"] # ⏳ TODO
│   │   │   }
│   │
│   ├── 📁 spawns/                # ⏳ TODO - Spawn/Wave Configurations
│   │   ├── desert_survival.json  # Desert survival spawn rules
│   │   ├── town_survival.json    # Town survival spawn rules
│   │   ├── story_canyon.json     # Story mode canyon spawns
│   │   └── boss_rush.json        # Boss rush spawn config
│   │   │
│   │   │   Spawn config structure:
│   │   │   {
│   │   │     "id": "desert_survival",
│   │   │     "mode": "infinite_waves",            # ⏳ TODO - infinite_waves, fixed_waves, boss_only
│   │   │     "startDelay": 3.0,                   # ⏳ TODO
│   │   │     "wavePauseDelay": 5.0,               # ⏳ TODO
│   │   │     "waves": [                           # ⏳ TODO
│   │   │       {
│   │   │         "waveNumber": 1,
│   │   │         "enemyCount": 10,
│   │   │         "spawnInterval": 2.0,            # Seconds between spawns
│   │   │         "spawnBatchSize": 2,             # Enemies per spawn
│   │   │         "groupSpawnChance": 0.5,         # 0-1, chance of tight groups
│   │   │         "enemyTypes": [                  # Weighted random selection
│   │   │           {"type": "shadow_lurker", "weight": 70},
│   │   │           {"type": "flame_imp", "weight": 30}
│   │   │         ],
│   │   │         "spawnPattern": "circle",        # circle, arc, grid, random
│   │   │         "spawnRadius": {"min": 40, "max": 55},
│   │   │         "bossAfterWave": false
│   │   │       }
│   │   │     ],
│   │   │     "infiniteScaling": {                 # ⏳ TODO - For survival mode
│   │   │       "healthScale": 0.15,               # +15% per wave
│   │   │       "damageScale": 0.10,               # +10% per wave
│   │   │       "countScale": 0.20,                # +20% enemies per wave
│   │   │       "bossEveryNWaves": 7               # Boss every 7 waves
│   │   │     }
│   │   │   }
│   │
│   ├── 📁 environments/          # ⏳ TODO - Map Environment Data
│   │   ├── desert.json           # Desert environment
│   │   ├── town.json             # Town environment
│   │   └── canyon.json           # Canyon environment
│   │   │
│   │   │   Environment config structure:
│   │   │   {
│   │   │     "id": "desert",
│   │   │     "ground": {                          # ⏳ TODO
│   │   │       "type": "plane",                   # plane, terrain, mesh
│   │   │       "size": 200,
│   │   │       "texture": "textures/desert_sand",
│   │   │       "color": "#d2b48c",
│   │   │       "roughness": 0.8,
│   │   │       "metalness": 0.2
│   │   │     },
│   │   │     "sky": {                             # ⏳ TODO
│   │   │       "type": "gradient",                # gradient, skybox, procedural
│   │   │       "topColor": "#87ceeb",
│   │   │       "bottomColor": "#f4a460"
│   │   │     },
│   │   │     "lighting": {                        # ⏳ TODO (partially implemented)
│   │   │       "ambient": {"color": "#ffbb66", "intensity": 0.6},
│   │   │       "sun": {"color": "#ffdd88", "intensity": 1.2, "position": [20, 40, 15]},
│   │   │       "fill": {"color": "#ff9944", "intensity": 0.3},
│   │   │       "hemisphere": {"sky": "#ffdd99", "ground": "#4a3520", "intensity": 0.5}
│   │   │     },
│   │   │     "fog": {                             # ⏳ TODO
│   │   │       "enabled": true,
│   │   │       "color": "#f4a460",
│   │   │       "near": 50,
│   │   │       "far": 150
│   │   │     },
│   │   │     "props": [                           # ⏳ TODO - Decorative objects
│   │   │       {"model": "cactus", "count": 20, "spawnArea": "random"},
│   │   │       {"model": "rock", "count": 15, "spawnArea": "random"}
│   │   │     ]
│   │   │   }
│   │
│   ├── 📁 entities/              # Entity Type Definitions
│   │   ├── enemies.json          # ✅ COMPLETE - 10 enemy types
│   │   ├── bosses.json           # ✅ COMPLETE - 5 boss types
│   │   ├── projectiles.json      # ⏳ TODO - Projectile types
│   │   ├── pickups.json          # ⏳ TODO - Collectible items
│   │   └── props.json            # ⏳ TODO - Environmental props
│   │   │
│   │   │   Entity configs define stats, components, behaviors
│   │   │   See enemies.json/bosses.json for examples
│   │
│   ├── 📁 spells/                # ⏳ TODO - Player Abilities
│   │   ├── starter_spells.json   # Starting spell options
│   │   ├── fire_spells.json      # Fire-based spells
│   │   ├── ice_spells.json       # Ice-based spells
│   │   ├── lightning_spells.json # Lightning spells
│   │   └── upgrades.json         # Spell upgrade trees
│   │   │
│   │   │   Spell config structure:
│   │   │   {
│   │   │     "id": "fireball",
│   │   │     "name": "Fireball",
│   │   │     "description": "Launch a blazing fireball",
│   │   │     "type": "projectile",              # projectile, area, buff, summon
│   │   │     "damage": 25,
│   │   │     "cooldown": 0.5,
│   │   │     "manaCost": 0,                     # For future mana system
│   │   │     "projectile": {
│   │   │       "speed": 20,
│   │   │       "lifetime": 3.0,
│   │   │       "piercing": false,
│   │   │       "homing": false,
│   │   │       "model": "fireball",
│   │   │       "trail": "fire_trail"
│   │   │     },
│   │   │     "effects": [                       # Status effects on hit
│   │   │       {"type": "burn", "duration": 3.0, "damagePerSecond": 5}
│   │   │     ],
│   │   │     "upgrades": ["fireball_split", "fireball_explosive"]
│   │   │   }
│   │
│   ├── 📁 progression/           # ⏳ TODO - Leveling & Upgrades
│   │   ├── xp_curve.json         # Experience required per level
│   │   ├── stat_scaling.json     # How stats scale with level
│   │   └── upgrade_tree.json     # Upgrade options per level
│   │   │
│   │   │   Progression config structure:
│   │   │   {
│   │   │     "xpCurve": {
│   │   │       "formula": "exponential",        # linear, exponential, custom
│   │   │       "baseXP": 100,
│   │   │       "multiplier": 1.5,
│   │   │       "maxLevel": 50
│   │   │     },
│   │   │     "statScaling": {
│   │   │       "healthPerLevel": 10,
│   │   │       "damagePerLevel": 2,
│   │   │       "speedPerLevel": 0.1
│   │   │     },
│   │   │     "upgradePool": [                   # Random upgrade choices
│   │   │       {"id": "health_boost", "rarity": "common"},
│   │   │       {"id": "damage_boost", "rarity": "common"},
│   │   │       {"id": "spell_cooldown", "rarity": "rare"}
│   │   │     ]
│   │   │   }
│   │
│   ├── 📁 audio/                 # ⏳ TODO - Sound/Music Configs
│   │   ├── music.json            # Music track definitions
│   │   ├── sound_effects.json    # SFX definitions
│   │   └── audio_settings.json   # Volume, mixing settings
│   │
│   ├── 📁 ui/                    # ⏳ TODO - UI Configurations
│   │   ├── hud.json              # HUD layout and elements
│   │   ├── menus.json            # Menu structures
│   │   └── themes.json           # Color schemes, fonts
│   │
│   ├── game_balance.json         # ⏳ TODO - Global Balance
│   │   │   {
│   │   │     "player": {
│   │   │       "baseHealth": 100,
│   │   │       "baseDamage": 10,
│   │   │       "baseSpeed": 8,
│   │   │       "invulnerabilityTime": 0.5,      # After taking damage
│   │   │       "dashCooldown": 1.0,
│   │   │       "dashDistance": 5.0
│   │   │     },
│   │   │     "enemies": {
│   │   │       "globalHealthMultiplier": 1.0,
│   │   │       "globalDamageMultiplier": 1.0,
│   │   │       "xpDropMultiplier": 1.0
│   │   │     },
│   │   │     "combat": {
│   │   │       "critChance": 0.1,
│   │   │       "critMultiplier": 2.0,
│   │   │       "knockbackForce": 5.0
│   │   │     }
│   │   │   }
│   │
│   └── game_modes.json           # ⏳ TODO - Game Mode Definitions
│       │   {
│       │     "survival": {
│       │       "name": "Survival",
│       │       "description": "Survive infinite waves",
│       │       "availableMaps": ["survival_desert", "survival_town"],
│       │       "features": ["infinite_waves", "difficulty_scaling", "high_scores"]
│       │     },
│       │     "story": {
│       │       "name": "Story Mode",
│       │       "description": "Progress through levels",
│       │       "availableMaps": ["story_01_canyon", "story_02_ruins"],
│       │       "features": ["fixed_waves", "boss_battles", "progression"]
│       │     },
│       │     "boss_rush": {
│       │       "name": "Boss Rush",
│       │       "description": "Fight bosses back-to-back",
│       │       "availableMaps": ["boss_rush"],
│       │       "features": ["boss_only", "time_attack"]
│       │     }
│       │   }
│
└── 📁 utils/                     # Utilities
    ├── ConfigLoader.js           # ✅ COMPLETE (160 lines) - Load and validate configs
    ├── MathUtils.js              # ⏳ TODO - Math helpers
    └── Validator.js              # ⏳ TODO - JSON schema validation
```

### Legend
- ✅ **COMPLETE** - Implemented and tested
- ⏳ **TODO** - Planned for Phase 4+
- 📁 - Directory

---

## 🎯 Configuration System Design (Hierarchical & Modular)

### Configuration Hierarchy

The v2 architecture uses a **hierarchical, reference-based configuration system** where configs link to each other, creating a modular and maintainable design:

```
┌──────────────────────────────────────────────────────────────┐
│                    GAME MODE CONFIG                          │
│              (game_modes.json)                               │
│  - Defines available modes (survival, story, boss_rush)      │
│  - Lists which maps are available for each mode              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ references
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      MAP CONFIG                              │
│               (maps/survival_desert.json)                    │
│  - Map metadata (name, description, game mode)               │
│  - Win/lose conditions                                       │
│  - References: environment config, spawn config              │
│  - Player spawn point, camera settings                       │
└──────────────┬───────────────────────┬───────────────────────┘
               │                       │
     references│              references│
               ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  ENVIRONMENT CONFIG      │  │    SPAWN CONFIG              │
│  (environments/desert)   │  │  (spawns/desert_survival)    │
│  - Ground/terrain        │  │  - Wave definitions          │
│  - Sky/fog/lighting      │  │  - Enemy composition         │
│  - Props/decorations     │  │  - Spawn patterns/timing     │
│  - Audio (music/ambient) │  │  - Difficulty scaling        │
└──────────────────────────┘  └─────────────┬────────────────┘
                                            │
                                   references│
                                            ▼
                              ┌──────────────────────────────┐
                              │    ENTITY CONFIGS            │
                              │  (entities/enemies.json)     │
                              │  - Enemy stats/behaviors     │
                              │  - Boss configurations       │
                              │  - Component definitions     │
                              └──────────────────────────────┘
```

### Configuration Flow Example

**How a player starts a Survival Desert map:**

1. **Player selects "Survival" mode** from menu
   - `game_modes.json` → shows "survival_desert" as available map

2. **Map loads: `maps/survival_desert.json`**
   - Sets gameMode: "survival"
   - References environment: "environments/desert"
   - References spawn config: "spawns/desert_survival"
   - Sets win condition: survive_time (600 seconds)
   - Sets player start position (0, 0, 0)

3. **Environment loads: `environments/desert.json`**
   - Creates desert ground plane
   - Sets lighting (sun position, ambient color)
   - Spawns props (cacti, rocks)
   - Starts desert music

4. **Spawn system loads: `spawns/desert_survival.json`**
   - Mode: infinite_waves
   - Wave 1: 10 shadow_lurkers + flame_imps
   - Spawn interval: 2 seconds
   - Spawn pattern: circle around player

5. **Entities created: `entities/enemies.json`**
   - Creates shadow_lurker with stats from JSON
   - Creates flame_imp with stats from JSON
   - Each has Transform, Health, Movement, Renderable, AI components

### Benefits of This Design

✅ **Modularity**: Maps can share environments/spawn configs
✅ **Reusability**: One desert environment used by multiple maps
✅ **Easy Testing**: Can test spawn configs independently
✅ **Designer-Friendly**: Non-programmers can create content
✅ **A/B Testing**: Easy to create variants and compare
✅ **Moddability**: Players can add custom maps/enemies
✅ **Version Control**: Small, focused files (good for git)
✅ **No Code Changes**: Add content by creating JSON files

### Implementation Status

| Config Type | Status | Files | Description |
|------------|--------|-------|-------------|
| Entities | ✅ Complete | enemies.json, bosses.json | 10 enemies, 5 bosses |
| Spawns | ⏳ In Progress | spawns/survival_basic.json | Spawn patterns, waves, formations |
| Maps | ⏳ TODO | maps/*.json | Top-level map definitions |
| Environments | ⏳ TODO | environments/*.json | Terrain, lighting, props |
| Spells | ⏳ TODO | spells/*.json | Player abilities/upgrades |
| Progression | ⏳ TODO | progression/*.json | XP, leveling, stat scaling |
| Game Modes | ⏳ TODO | game_modes.json | Mode definitions |
| Balance | ⏳ TODO | game_balance.json | Global tuning values |

---

## 🏗️ Config-First Development Methodology

### Core Principle: **Design Data Before Code**

v2 follows a strict **config-first approach** where game systems are built around JSON configurations rather than hardcoded logic. This ensures flexibility, moddability, and rapid iteration.

### Development Process

```
1. DESIGN CONFIG STRUCTURE
   ↓
   - Think through all desired features
   - Create comprehensive JSON schema
   - Add more features than currently needed
   - Document every property

2. MARK IMPLEMENTATION STATUS
   ↓
   - ✅ IMPLEMENTED - Feature works
   - ⏳ TODO - Feature defined but not coded
   - Document what each field does

3. WRITE CODE TO READ CONFIG
   ↓
   - Code interprets JSON data
   - Implements ✅ IMPLEMENTED features first
   - Leaves ⏳ TODO features for later
   - Never hardcode game data

4. EXPAND ITERATIVELY
   ↓
   - Add new config features as needed
   - Update both config AND code together
   - Maintain clear status markers
   - Keep documentation in sync
```

### Example: Spawn System (Config-First)

**Step 1: Design Complete Config Structure**
```json
{
  "spawnAnimations": [...],    // ⏳ TODO - All animation types defined
  "spawnPatterns": [...],      // ⏳ TODO - All patterns defined
  "groupFormations": [...],    // ⏳ TODO - All formations defined
  "triggers": [...],           // ⏳ TODO - All triggers defined
  "waves": [                   // ✅ IMPLEMENTED - Basic waves work
    {
      "enemyComposition": [...],
      "spawnRules": {...}
    }
  ],
  "infiniteMode": {...},       // ⏳ TODO - Scaling defined
  "dynamicDifficulty": {...}   // ⏳ TODO - Metrics defined
}
```

**Step 2: Create README Documentation**
- List ALL config properties (even unimplemented)
- Mark each as ✅ IMPLEMENTED or ⏳ TODO
- Provide examples for every feature
- Explain how to extend the system

**Step 3: Implement Core Features**
```javascript
// SpawnSystem.js - Reads config, implements features
class SpawnSystem {
  loadConfig(configId) {
    // Load JSON config
    this.config = await ConfigLoader.getSpawnConfig(configId);

    // Implement ONLY ✅ IMPLEMENTED features
    this.initWaves(this.config.waves);              // ✅
    // this.initAnimations(this.config.animations);  // ⏳ TODO
    // this.initPatterns(this.config.patterns);      // ⏳ TODO
  }
}
```

**Step 4: Expand Over Time**
- User wants linked movement? Already in config as ⏳ TODO
- Implement the feature in code
- Update status from ⏳ TODO to ✅ IMPLEMENTED
- No config changes needed!

### Benefits of Config-First

✅ **Future-Proof**: Features defined before needed
✅ **No Breaking Changes**: Additive, never change structure
✅ **Clear Roadmap**: TODO markers show what's planned
✅ **Designer-Friendly**: Non-programmers can see what's possible
✅ **Rapid Iteration**: Change values without recompiling
✅ **Moddability**: Players can create custom content
✅ **Documentation**: Config structure IS the documentation
✅ **Testing**: Can mock configs without code changes

### Config-First Rules

1. **NEVER hardcode game data in code**
   - ❌ BAD: `const SPAWN_DISTANCE = 40;`
   - ✅ GOOD: `config.globalSettings.spawnSafeDistance`

2. **Design complete configs upfront**
   - Think of ALL possible features
   - Add them to config even if not implemented
   - Mark clearly as ⏳ TODO

3. **Keep status markers accurate**
   - ✅ IMPLEMENTED = Feature actually works
   - ⏳ TODO = Defined but not coded yet
   - Update when implementing features

4. **Document in config comments**
   - Explain what each field does
   - Provide value ranges
   - Give examples

5. **Expand configs, don't replace them**
   - Add new fields (backward compatible)
   - Never remove or rename fields
   - Use versioning if breaking changes needed

### Config Documentation Standard

Every config directory MUST have a `README.md` with:

1. **Config Structure Overview** - All top-level properties
2. **Property Tables** - Every field documented with status
3. **Examples** - Real-world usage examples
4. **Implementation Checklist** - ✅/⏳ status for all features
5. **Extension Guide** - How to add new features

**Example**: See `src/config/spawns/README.md` for the spawn system

---

## 🚀 Migration Plan (Phased Approach)

### Phase 1: Core Engine Separation ✅ COMPLETED
**Status**: 100% Complete (moved to v2)
**Completed**: 2025-10-15

**Tasks**:
- [x] Extract `GameEngine.js` → `core/engine/Engine.js`
- [x] Create `core/renderer/Renderer.js` (Three.js wrapper)
- [x] Create `core/input/InputManager.js` (Pointer Events API)
- [x] Create `core/engine/EntityManager.js`
- [x] Move all files to v2 directory
- [x] Create independent package.json for v2
- [x] Configure v2 to run on port 5174

**Files Created in v2**:
- `src/core/engine/Engine.js` - 147 lines
- `src/core/renderer/Renderer.js` - 335 lines
- `src/core/input/InputManager.js` - 324 lines
- `src/core/engine/EntityManager.js` - 311 lines
- `src/core/engine/README.md` - Complete documentation

**Test Coverage**: 36 tests, 95%+ coverage

---

### Phase 2: Component System ✅ COMPLETED
**Status**: 100% Complete
**Completed**: 2025-10-15

**Tasks**:
- [x] Implement `Component` base class
- [x] Create 5 core components (Transform, Health, Movement, Renderable, AI)
- [x] Create `ComponentSystem` base class
- [x] Create `Entity` class with component management
- [x] Write comprehensive tests
- [x] Create module documentation

**Files Created in v2**:
- `src/core/ecs/Component.js` - 96 lines
- `src/core/ecs/ComponentSystem.js` - 105 lines
- `src/core/ecs/Entity.js` - 178 lines
- `src/components/*.js` - 5 component files
- `src/core/ecs/README.md` - Complete documentation
- `src/components/README.md` - Complete documentation

**Test Coverage**: 49 tests, 97%+ coverage

---

### Phase 3: Configuration System ✅ COMPLETED
**Status**: 100% Complete
**Completed**: 2025-10-15

**Tasks**:
- [x] Create `utils/ConfigLoader.js`
- [x] Create `config/entities/enemies.json` (10 enemy types)
- [x] Create `config/entities/bosses.json` (5 boss types)
- [x] Create `EntityFactory` to build entities from config
- [x] Write comprehensive tests (100% coverage)
- [x] Create module documentation

**Files Created in v2**:
- `src/utils/ConfigLoader.js` - 160 lines
- `src/systems/entity/EntityFactory.js` - 237 lines
- `src/config/entities/enemies.json` - 10 enemy types
- `src/config/entities/bosses.json` - 5 boss types
- `src/utils/README.md` - Complete documentation
- `src/config/README.md` - Complete documentation
- `src/systems/entity/README.md` - Complete documentation

**Test Coverage**: 42 tests, 100% coverage

---

### Phase 4: Systems Migration ⏳ IN PROGRESS
**Timeline**: Week 4-6
**Status**: **NEXT STEP** - Start migrating game systems from v1

**Goal**: Port working game logic from v1 to v2 using ECS architecture

**Tasks**:
- [ ] **Examine v1 game code** to understand current implementation
- [ ] Create `SpawnSystem.js` (migrate from v1's `WaveSystem`)
- [ ] Create `DamageSystem.js` (migrate from v1 combat code)
- [ ] Create `HealthSystem.js` (process Health components)
- [ ] Create `ProjectileSystem.js` (migrate from v1 projectiles)
- [ ] Create `AISystem.js` (migrate from v1 AI behaviors)
- [ ] Create `RenderSystem.js` (update Three.js meshes from components)
- [ ] Create `MovementSystem.js` (process Movement + Transform components)
- [ ] Create main game file that uses new Engine
- [ ] Integrate all systems with game loop
- [ ] Test: Full game playthrough works like v1

**Migration Strategy**:
1. Read v1 code to understand how systems work
2. Create equivalent ECS system in v2
3. Test system independently
4. Integrate with game loop
5. Verify behavior matches v1

**Files to Create in v2**:
- `src/systems/spawning/SpawnSystem.js`
- `src/systems/spawning/WaveManager.js`
- `src/systems/combat/DamageSystem.js`
- `src/systems/combat/HealthSystem.js`
- `src/systems/combat/ProjectileSystem.js`
- `src/systems/combat/AISystem.js`
- `src/systems/render/RenderSystem.js`
- `src/systems/physics/MovementSystem.js`
- `src/main.js` - Main game entry point

**v1 Files to Study** (for reference, don't modify):
- `../src/systems/WaveSystem.js` - Understand wave spawning
- `../src/entities/Enemy.js` - Understand enemy behavior
- `../src/entities/BossEnemy.js` - Understand boss logic
- `../src/engine/DustAndDynamiteGame.js` - Understand game loop

**Success Criteria**:
- All v1 gameplay working in v2
- Systems process ECS components
- Configuration-driven (no hardcoded stats)
- Full game playthrough works end-to-end
- Performance equal to or better than v1

---

### Phase 5: Polish & Cleanup ⏳ Not Started
**Timeline**: Week 6-7
**Status**: Not Started

**Tasks**:
- [ ] Add any missing wave/level configurations
- [ ] Remove any remaining hardcoded values
- [ ] Performance profiling and optimization
- [ ] Add JSON schema validation
- [ ] Final testing across all platforms
- [ ] Update all documentation
- [ ] Create migration guide

**Success Criteria**:
- Clean codebase with no hardcoded game data
- Full documentation for all modules
- Performance at least as good as v1
- Easy to add new content via JSON configs

---

## 📈 Progress Tracking

| Phase | Status | Progress | Completion Date |
|-------|--------|----------|-----------------|
| Phase 1: Core Engine | ✅ Completed | 100% | 2025-10-15 |
| Phase 2: Component System | ✅ Completed | 100% | 2025-10-15 |
| Phase 3: Configuration | ✅ Completed | 100% | 2025-10-15 |
| Phase 4: Systems Migration | ⏳ In Progress | 0% | - |
| Phase 5: Polish & Cleanup | Not Started | 0% | - |

**Overall Progress**: ~60% (Phases 1-3 complete, Phase 4 next)

**Test Coverage**: 127 tests passing
- Phase 1 (Core Engine): 36 tests
- Phase 2 (ECS): 49 tests
- Phase 3 (Config): 42 tests

---

## 📚 Documentation Created

All v2 modules have comprehensive README.md files:

- ✅ `src/core/engine/README.md` - Engine and EntityManager
- ✅ `src/core/ecs/README.md` - ECS system (Component, Entity, ComponentSystem)
- ✅ `src/components/README.md` - All 5 components
- ✅ `src/systems/entity/README.md` - EntityFactory
- ✅ `src/config/README.md` - Configuration files (10 enemies, 5 bosses)
- ✅ `src/utils/README.md` - ConfigLoader
- ✅ `PROGRESS_SUMMARY.md` - Overall progress summary
- ✅ `README.md` - v2 project overview

---

## 💡 Benefits of v2 Architecture

✅ **Reusability**: Core engine can be used for other games
✅ **Modding Support**: Easy to add content via JSON configs
✅ **Testing**: Systems can be unit tested independently (127 tests!)
✅ **Balance Tweaking**: Designers can modify configs without code
✅ **Maintainability**: Clear separation of concerns
✅ **Performance**: Better optimization opportunities with ECS
✅ **Collaboration**: Artists/designers work in configs, devs in code
✅ **Rapid Prototyping**: Quick iteration on game design

---

## 🎯 Next Steps (Phase 4)

1. **Examine v1 Code**: Study how current game systems work
2. **Create Core Systems**: Build SpawnSystem, DamageSystem, AISystem, etc.
3. **Integrate Game Loop**: Create main.js that ties everything together
4. **Test Migration**: Verify v2 plays the same as v1
5. **Iterate**: Fix any issues, improve systems

---

## 📝 Notes & Decisions

### 2025-10-15 (Late Night) - Project Restructure ✅
- **Project Restructure**: Split into v1 (old) and v2 (new)
  - Created independent v2/ directory
  - v2 has its own package.json, dependencies, configs
  - v2 runs on port 5174 (v1 stays on 5173)
  - Complete separation prevents confusion
  - Can develop v2 while v1 stays working
  - Separate .claude/instructions.md for each version

### 2025-10-15 (Late Night) - Documentation System Created ✅
- **Documentation System**: Created comprehensive README.md for all modules
  - 6 module documentation files created
  - Every module documented: How it works, API, usage, tests
  - Documentation protocol in .claude/instructions.md
  - README.md required for all new modules
  - Must update documentation when code changes

### 2025-10-15 (Late Night) - Phase 3 Completed ✅
- **Phase 3: Configuration System** - 100% Complete
  - ConfigLoader with caching
  - EntityFactory creates entities from JSON
  - 10 enemy types configured
  - 5 boss types with multi-phase AI
  - 100% test coverage
  - Can add enemies/bosses by editing JSON only!

### 2025-10-15 (Evening) - Phase 2 Completed ✅
- **Phase 2: ECS System** - 100% Complete
  - Component, Entity, ComponentSystem base classes
  - 5 core components (Transform, Health, Movement, Renderable, AI)
  - 49 tests, 97%+ coverage
  - ECS pattern established

### 2025-10-15 (Evening) - Phase 1 Completed ✅
- **Phase 1: Core Engine** - 100% Complete
  - Engine, Renderer, InputManager, EntityManager
  - 36 tests, 95%+ coverage
  - All core classes working

---

**Last Updated**: 2025-10-15
**Current Phase**: Phase 4 (Systems Migration)
**Next Action**: Start migrating v1 game systems to v2 ECS architecture
