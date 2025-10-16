# V1 to V2 Migration Plan

**Document Created**: 2025-10-16
**Status**: Planning Phase
**Purpose**: Comprehensive analysis of v1 game and migration strategy to v2 ECS architecture

---

## Table of Contents
1. [V1 Game Overview](#v1-game-overview)
2. [V1 Architecture Analysis](#v1-architecture-analysis)
3. [Assets Inventory](#assets-inventory)
4. [Systems Mapping](#systems-mapping)
5. [Migration Strategy](#migration-strategy)
6. [Implementation Plan](#implementation-plan)

---

## V1 Game Overview

### Game Name
**"Dust and Dynamite"** / **"It's Just Fine"**

### Game Type
Top-down survival/wave-based shooter with RPG elements

### Core Gameplay
- Player controls a character from top-down perspective
- Survive waves of enemies
- Use spells/weapons to defeat enemies
- Collect XP and level up
- Choose upgrades between levels
- Multiple game modes: Survival, Story, Boss Rush

### Technology Stack (v1)
- **Framework**: React (for UI/menu)
- **Renderer**: Three.js (3D graphics)
- **Audio**: Web Audio API with procedural sound generation
- **Architecture**: OOP with class-based entities
- **Models**: GLTF/GLB character models from public/models/

---

## V1 Architecture Analysis

### File Structure

```
v1/src/
├── main.jsx                    # React entry point
├── components/
│   ├── DustAndDynamite.jsx    # Main game component (React)
│   └── StoryScene.jsx          # Story cutscenes
├── entities/
│   ├── Entity.js               # Base entity class
│   ├── Player.js               # Player character (~500 lines)
│   ├── Enemy.js                # Enemy base class (~900 lines) ⭐
│   ├── BossEnemy.js            # Boss enemies (~600 lines)
│   ├── Projectile.js           # Base projectile
│   ├── *Projectile.js          # Specific projectiles (Flame, Ice, Magic, etc.)
│   ├── ColoredLightning.js     # Lightning visual effects
│   ├── FireExplosion.js        # Explosion effects
│   ├── Pickup.js               # XP/item pickups
│   └── [Many more spell effect entities]
├── spells/
│   ├── Spell.js                # Base spell class
│   ├── SpellRegistry.js        # Spell registration system
│   ├── spellTypes.js           # Spell definitions
│   ├── spellLevelScaling.js    # Level-up scaling
│   └── spells/
│       ├── ThunderStrikeSpell.js
│       ├── ChainLightningSpell.js
│       ├── FireballSpell.js
│       ├── PyroExplosionSpell.js
│       ├── IceLanceSpell.js
│       ├── RingOfFireSpell.js
│       ├── RingOfIceSpell.js
│       ├── MagicBulletSpell.js
│       ├── ShadowBoltSpell.js
│       ├── SkullShieldSpell.js
│       └── DashShockwaveSpell.js
├── weapons/
│   ├── weaponTypes.js          # Weapon definitions
│   └── weaponUpgrades.js       # Weapon upgrade system
├── levels/
│   ├── index.js                # Level registry
│   ├── survival.js             # Survival mode config
│   ├── desertCanyon.js         # Desert map
│   ├── urbanOutpost.js         # Urban map
│   ├── abandonedTown.js        # Town map
│   ├── bossRush.js             # Boss rush mode
│   └── chapter1.js             # Story chapter 1
├── systems/
│   ├── WaveSystem.js           # Wave spawning logic
│   ├── GameSettings.js         # Game settings manager
│   ├── LevelSystem.js          # Level/map management
│   └── [Other systems]
├── effects/
│   ├── DamageNumber.js         # Floating damage text
│   └── [Particle effects]
├── particles/
│   ├── Particle.js             # Particle base class
│   ├── ParticleEmitter.js      # Particle emitter
│   └── ParticleSystem.js       # Particle management
├── audio/
│   ├── ProceduralSounds.js     # Procedural audio generation
│   ├── SoundCache.js           # Sound caching
│   └── SoundScheduler.js       # Audio scheduling
├── shaders/
│   ├── ShadowSilhouetteShader.js  # Custom shadow shader for enemies
│   └── [Other shaders]
├── utils/
│   ├── modelLoader.js          # GLTF model loading
│   ├── sprites.js              # Sprite generation
│   ├── damageCalculations.js  # Damage formulas
│   └── assetPath.js            # Asset path resolution
└── core/                       # Shared ECS components (being migrated)
```

### Key Classes & Responsibilities

#### DustAndDynamiteGame.js (Main Game Class)
**Location**: `src/components/DustAndDynamite.jsx` (React component)
**Responsibilities**:
- Game state management (menu, playing, paused, gameover)
- UI rendering (health bar, XP bar, wave counter, level-up screen)
- Spell selection and upgrade management
- Wave progression logic
- Victory/defeat conditions
- Integration with React for menus

**Size**: ~2000 lines (React + game logic mixed)

#### Player.js
**Responsibilities**:
- Player movement (WASD input)
- Health management
- XP and leveling
- Spell/weapon management
- Player mesh/model
- Collision with enemies
- Dash ability

**Stats**:
- Health: 100 (scales with level: +10 per level)
- Speed: 8-10 units/sec
- Damage: Base weapon damage + level scaling
- XP curve: Exponential (100 * 1.5^level)

#### Enemy.js ⭐ CRITICAL
**Responsibilities**:
- Enemy AI (chase player)
- 20+ enemy types with different stats
- Shadow/Light variations (use custom shader)
- 3D model loading for some types
- Elite enemy modifiers (fast, tank, regen)
- Freeze effect support
- Ranged attack capability
- Death animations

**Enemy Types** (from `setupStats()` method):
1. **Standard Types** (use 3D models):
   - `bandit` - Basic enemy
   - `coyote` - Fast, low health
   - `brute` - Slow, high health (zombie)
   - `gunman` - Ranged attacker
   - `charger` - Charges at player
   - `tiny` - Very small and fast
   - `giant` - Huge and slow
   - `skeleton_warrior` - Melee skeleton
   - `skeleton_mage` - Ranged skeleton

2. **Shadow Variations** (use custom shader - black silhouettes):
   - `shadow` - Original balanced type
   - `shadow_lurker` - Small, fast, weak
   - `shadow_titan` - Huge, slow, boss-like
   - `shadow_wraith` - Fast, red tint
   - `shadow_colossus` - Large, tanky
   - `shadow_flicker` - Tiny, extremely fast
   - `shadow_void` - Large, pure black (doctor shape)
   - `shadow_crawler` - Spider-like (disabled in survival)
   - `shadow_serpent` - Worm-like (disabled in survival)

3. **Light Variations** (white versions with black outlines):
   - `light` - White version of shadow
   - `light_lurker` - White lurker
   - `light_titan` - White titan
   - `light_wraith` - White wraith
   - `light_colossus` - White colossus
   - `light_flicker` - White flicker
   - `light_void` - White void (angel shape)
   - `light_crawler` - White crawler (disabled)
   - `light_serpent` - White serpent (disabled)

**Enemy Scaling**:
- Health: base + (wave * 8)
- Damage: base + (wave * 3)
- Elite multipliers: Health ×3, Damage ×1.5

#### BossEnemy.js
**Responsibilities**:
- Multi-phase boss fights
- Phase-based behavior changes
- Special abilities per boss type
- Boss health bars
- Summon minions

**Boss Types**:
- `zombieLord` - Undead boss
- `corrupted_knight` - Melee boss
- `stone_golem` - Tank boss
- `arcane_wisp` - Magic boss
- [Others defined in config]

#### Spell System
**Base Class**: `Spell.js`
**Registry**: `SpellRegistry.js`

**Spell Types** (11 total):
1. **Thunder Strike** - Lightning damage
2. **Chain Lightning** - Bounces between enemies
3. **Fireball** - Fire projectile
4. **Pyro Explosion** - AoE fire explosion
5. **Ring of Fire** - Spinning fire orbits
6. **Ice Lance** - Ice projectile with freeze
7. **Ring of Ice** - Spinning ice orbits
8. **Magic Bullet** - Basic projectile
9. **Static Burst** - Electric AoE
10. **Shadow Bolt** - Dark projectile
11. **Skull Shield** - Defensive spell
12. **Dash Shockwave** - Dash attack

**Spell Properties**:
- Damage
- Cooldown
- Projectile speed (if projectile)
- Piercing
- Homing
- Explosive
- Status effects (freeze, burn, stun)
- Level scaling

### Level/Map System

**Level Definition Format** (from `survival.js`):
```javascript
{
  name: 'Survive!',
  description: 'Endless waves',
  groundType: 'void',  // 'grass', 'desert', 'urban', 'void'
  music: 'path/to/music.mp3',
  isSurvival: true,

  lighting: {
    background: 0x87ceeb,
    ambient: { color, intensity },
    sun: { color, intensity, position },
    fill: { color, intensity },
    hemisphere: { sky, ground, intensity }
  },

  spawnBoundaries: { minX, maxX, minZ, maxZ },

  waves: [
    {
      enemyCount: 40,
      spawnInterval: 1.0,
      spawnBatchSize: 5,
      groupSpawnChance: 0.7,
      enemyTypes: [
        { type: 'shadow', weight: 3 },
        { type: 'shadow_lurker', weight: 5 },
        // ... weighted random selection
      ]
    }
  ],

  boss: {
    type: 'zombieLord',
    health: 3000,
    damage: 35,
    speed: 2.5
  },

  enemySettings: {
    rangedEnemies: ['fast'],
    elitesCanShoot: true,
    shootRange: 12,
    projectileSpeed: 7,
    projectileDamage: 15
  },

  objects: [
    // Environmental props (rocks, buildings, etc.)
  ]
}
```

**Available Maps**:
1. **survival.js** - Infinite waves, void ground
2. **desertCanyon.js** - Desert theme with props
3. **urbanOutpost.js** - Urban environment
4. **abandonedTown.js** - Town with buildings
5. **bossRush.js** - Boss-only mode
6. **chapter1.js** - Story mode chapter

### Wave System

**Spawn Logic**:
- Start delay: 3 seconds
- Waves spawn in batches
- Group spawning (tight formations)
- Weighted random enemy selection
- Boss every 7 waves
- Infinite scaling (health, damage, count increase)

**Spawn Patterns**:
- Circle around player (radius 40-55 units)
- Offscreen edges
- Random scatter
- Group formations

---

## Assets Inventory

### 3D Models
**Location**: `/public/models/`

1. **nature-kit/** - Nature assets (trees, rocks, cacti)
   - 37 GLTF files
   - Used in: Desert Canyon, Abandoned Town

2. **retro-urban-kit/** - Urban assets (buildings, props)
   - 50 GLTF files
   - Used in: Urban Outpost, Abandoned Town

**Character Models** (from `modelLoader.js`):
- `CHARACTER_MODELS` maps enemy types to model files
- Models include:
  - `anime_character_cyberstyle.glb` - Bandit
  - `anime_character_mummy.glb` - Brute (zombie)
  - `anime_character_skeleton.glb` - Skeleton warrior
  - `anime_character_witch.glb` - Skeleton mage
  - [Others]

### Audio Assets
**Location**: `/public/assets/music/`

1. **Music**:
   - `risinginferno.mp3` - Survival mode music
   - `ashesandscreams.mp3` - Action music

2. **Sound Effects** (`/public/assets/music/sfx/WAV SFX/SFX/`):
   - Spells/ - Fireball, Ice, Lightning sounds
   - Torch/ - Fire sounds
   - Doors Gates and Chests/ - Environmental sounds
   - [Many more categorized SFX]

### Procedural Assets
**Generated at runtime**:
- Enemy sprites (via `sprites.js`)
- Shadow/light shader materials (via `ShadowSilhouetteShader.js`)
- Particle textures (canvas-based)
- Glow effects
- Damage number text

### Textures
**Minimal external textures**:
- Most visuals are procedural
- Ground textures in levels (checkerboard, grass, desert)
- Possibly some UI textures (not confirmed)

---

## Systems Mapping

### V1 System → V2 System Migration

| V1 System | V1 File | V2 Equivalent | Status | Notes |
|-----------|---------|---------------|--------|-------|
| **Game Loop** | DustAndDynamite.jsx | game/ItsJustFine.js | ✅ Created | Separated from React |
| **Player** | entities/Player.js | systems/input/PlayerInputSystem.js + components | ✅ Exists | Needs player entity factory |
| **Enemy AI** | entities/Enemy.js | systems/ai/AISystem.js + config | ⚠️ Partial | Need all 20 enemy types in config |
| **Boss AI** | entities/BossEnemy.js | systems/ai/BossAISystem.js | ❌ TODO | Multi-phase boss logic |
| **Wave Spawning** | systems/WaveSystem.js | systems/spawn/SpawnSystem.js | ✅ Exists | Need to match v1 spawn patterns |
| **Spell Casting** | spells/*.js | systems/combat/SpellSystem.js | ❌ TODO | 11 spells to migrate |
| **Projectiles** | entities/*Projectile.js | systems/combat/ProjectileSystem.js | ✅ Exists | Need spell projectile types |
| **Damage** | utils/damageCalculations.js | systems/combat/DamageSystem.js | ✅ Exists | Check damage formulas match |
| **Leveling** | Player.js (XP logic) | systems/progression/LevelingSystem.js | ✅ Exists | Check XP curve matches |
| **Pickups** | entities/Pickup.js | systems/items/PickupSystem.js | ✅ Exists | XP pickup works |
| **Particle Effects** | particles/*.js | systems/effects/ParticleSystem.js | ✅ Exists | InstancedMesh pools |
| **Audio** | audio/*.js | systems/audio/AudioSystem.js | ✅ Exists | Need procedural sounds |
| **UI/HUD** | DustAndDynamite.jsx (UI) | systems/ui/UISystem.js | ✅ Exists | Need upgrade screen |
| **Level Loading** | levels/*.js + LevelSystem.js | game/modes/*.js + config/maps/ | ⚠️ Partial | Survival exists, need others |
| **Collision** | (inline in entities) | systems/physics/CollisionSystem.js | ✅ Exists | Player-enemy collision works |
| **Status Effects** | Enemy.js (freeze logic) | systems/combat/StatusEffectSystem.js | ✅ Exists | Freeze, burn, stun |
| **Rendering** | (mixed in entities) | systems/render/RenderSystem.js | ✅ Exists | Syncs components to Three.js |
| **Camera** | (in DustAndDynamite.jsx) | game/ItsJustFine.js | ✅ Done | Camera follow implemented |

---

## Migration Strategy

### Phase-Based Approach

#### ✅ Phase 1-3: Engine Foundation (COMPLETED)
- Core ECS engine
- Component system
- Entity factory
- Config loader

#### 🔄 Phase 4: Game Recreation (IN PROGRESS)

**Priority 1: Core Gameplay Loop**
1. ✅ Player entity with movement
2. ✅ Basic enemy spawning
3. ✅ Enemy AI (chase player)
4. ⚠️ Player shooting (need to verify works)
5. ⚠️ Enemy death and XP drops (exists but untested)
6. ⚠️ Player damage on enemy collision (exists but untested)

**Priority 2: All Enemy Types**
1. ❌ Create configs for all 20 enemy types
2. ❌ Implement shadow/light shader in v2
3. ❌ Integrate 3D model loading
4. ❌ Elite enemy affixes
5. ❌ Enemy ranged attacks

**Priority 3: Spell System**
1. ❌ Create spell system architecture
2. ❌ Migrate all 11 spells
3. ❌ Spell level scaling
4. ❌ Spell upgrade tree

**Priority 4: UI & Progression**
1. ⚠️ Level-up screen (UI exists, need upgrade selection)
2. ❌ Spell selection menu
3. ❌ Game over screen
4. ❌ Victory screen
5. ❌ Main menu

**Priority 5: Additional Maps**
1. ✅ Survival mode
2. ❌ Desert Canyon
3. ❌ Urban Outpost
4. ❌ Abandoned Town
5. ❌ Boss Rush
6. ❌ Story Mode (Chapter 1)

**Priority 6: Boss System**
1. ❌ Boss AI system
2. ❌ Multi-phase behavior
3. ❌ Boss health bars
4. ❌ Minion summoning

**Priority 7: Polish**
1. ❌ Audio system (procedural sounds)
2. ❌ Better particle effects
3. ❌ Environmental props
4. ❌ Damage numbers (floating text)
5. ❌ Camera shake
6. ❌ Screen flash effects

---

## Implementation Plan

### Step 1: Asset Migration
**Task**: Copy necessary assets from v1 to v2

```bash
# Models
cp -r /v1/public/models/ /v2/public/models/

# Audio
cp -r /v1/public/assets/ /v2/public/assets/

# Shaders (if needed)
cp /v1/src/shaders/ShadowSilhouetteShader.js /v2/src/shaders/
```

**Files to Copy**:
- ✅ `/public/models/` → `/v2/public/models/`
- ✅ `/public/assets/music/` → `/v2/public/assets/music/`
- ✅ `/src/shaders/ShadowSilhouetteShader.js` → `/v2/src/shaders/`
- ✅ `/src/utils/modelLoader.js` → `/v2/src/utils/`
- ✅ `/src/utils/sprites.js` → `/v2/src/utils/`

### Step 2: Enemy Configuration
**Task**: Create JSON configs for all enemy types

**Create**: `/v2/src/config/entities/enemies.json`

Extract stats from `Enemy.js setupStats()` method and convert to JSON:

```json
{
  "shadow_lurker": {
    "name": "Shadow Lurker",
    "description": "Small, fast, weak shadow creature",
    "modelType": "shadow",
    "useShader": true,
    "stats": {
      "health": 60,
      "speed": 3.5,
      "damage": 12,
      "color": 0x1a0a0a
    },
    "shaderConfig": {
      "width": 1.5,
      "height": 2.5,
      "eyeColor": 0xff3333,
      "eyeSize": 0.03,
      "flowSpeed": 1.5,
      "flowAmp": 1.2,
      "waveCount": 3,
      "waveType": 1,
      "shapeType": 2,
      "baseColor": 0x000000,
      "gradientColor": 0x330000
    },
    "scaling": {
      "healthPerWave": 8,
      "damagePerWave": 3
    }
  },
  // ... all 20 enemy types
}
```

### Step 3: Spell System
**Task**: Create spell system from scratch

**Architecture**:
```
v2/src/systems/combat/
├── SpellSystem.js       # Cast spells, manage cooldowns
├── SpellRegistry.js     # Register all spell types
└── spells/
    ├── ThunderStrike.js
    ├── Fireball.js
    └── [...]
```

**Spell Component**:
```javascript
// New component: Spell.js
class Spell {
  constructor() {
    this.spellType = 'magic_bullet';
    this.damage = 25;
    this.cooldown = 0.5;
    this.currentCooldown = 0;
    this.projectileSpeed = 25;
    this.piercing = false;
    this.homing = false;
    this.explosive = false;
    this.statusEffects = []; // freeze, burn, stun
  }
}
```

### Step 4: Boss System
**Task**: Implement multi-phase boss AI

**Create**: `/v2/src/systems/ai/BossAISystem.js`

**Features**:
- Phase transitions at health thresholds
- Phase-specific behaviors
- Minion summoning
- Boss health bar UI

### Step 5: Map/Level System
**Task**: Create level loader and map configs

**Create**: `/v2/src/config/maps/`
- `survival.json`
- `desert_canyon.json`
- `urban_outpost.json`
- `abandoned_town.json`
- `boss_rush.json`
- `chapter1.json`

**Level Loader**:
```javascript
// v2/src/systems/level/LevelSystem.js
class LevelSystem {
  async loadLevel(levelId) {
    const config = await ConfigLoader.getMapConfig(levelId);

    // Setup ground
    this.createGround(config.groundType);

    // Setup lighting
    this.applyLighting(config.lighting);

    // Setup spawn boundaries
    this.spawnBoundaries = config.spawnBoundaries;

    // Load environmental objects
    this.loadObjects(config.objects);

    // Start music
    this.playMusic(config.music);
  }
}
```

### Step 6: UI/Menus
**Task**: Implement game menus and screens

**Components to Create**:
1. Main Menu (select game mode)
2. Level Select (choose map)
3. Pause Menu
4. Level-Up Screen (choose upgrade)
5. Game Over Screen (retry/quit)
6. Victory Screen (next level)

**Architecture**:
```
v2/src/game/ui/
├── MainMenu.js
├── LevelSelect.js
├── PauseMenu.js
├── LevelUpScreen.js
├── GameOverScreen.js
└── VictoryScreen.js
```

### Step 7: Audio Integration
**Task**: Integrate procedural audio and SFX

**Copy from v1**:
- `audio/ProceduralSounds.js` → v2
- `audio/SoundCache.js` → v2
- `audio/SoundScheduler.js` → v2

**Integrate**:
- Spell cast sounds
- Enemy death sounds
- Player damage sounds
- Background music
- UI sounds

### Step 8: Polish & Effects
**Task**: Visual and gameplay polish

**Features**:
1. Damage numbers (floating text)
2. Screen shake on hit
3. Flash effects
4. Better particle effects
5. Environmental props rendering
6. Minimap (optional)

---

## Critical Differences: V1 vs V2

### Architecture
| Aspect | V1 | V2 |
|--------|----|----|
| **Paradigm** | OOP (classes) | ECS (components) |
| **Data** | Hardcoded in classes | JSON configs |
| **UI** | React components | Vanilla JS UI system |
| **State** | React state | Game class properties |
| **Rendering** | Mixed in entity classes | RenderSystem |
| **Physics** | Inline in update() | PhysicsSystems |

### Entity Lifecycle
| Aspect | V1 | V2 |
|--------|----|----|
| **Creation** | `new Enemy(...)` | `EntityFactory.create('shadow_lurker')` |
| **Update** | `entity.update(dt)` | Systems process components |
| **Rendering** | `entity.mesh` auto-updates | RenderSystem syncs to mesh |
| **Death** | `entity.playDeathExplosion()` | DamageSystem → event → cleanup |

### Advantages of V2
- ✅ **Data-driven**: All enemies/spells/maps in JSON
- ✅ **Testable**: Systems can be unit tested
- ✅ **Reusable**: Core engine works for other games
- ✅ **Modding**: Easy to add content via JSON
- ✅ **Performance**: Better optimization opportunities
- ✅ **Maintainability**: Clear separation of concerns

---

## Next Actions

### Immediate (Week 1)
1. ✅ Copy assets from v1 to v2
2. ❌ Create complete enemy configs (all 20 types)
3. ❌ Verify core gameplay loop works
4. ❌ Implement spell system basics

### Short-term (Week 2-3)
1. ❌ Implement all 11 spells
2. ❌ Create level-up/upgrade screen
3. ❌ Implement boss AI system
4. ❌ Integrate audio system

### Medium-term (Week 4-5)
1. ❌ Create all map configs
2. ❌ Implement main menu
3. ❌ Add environmental props
4. ❌ Polish effects

### Long-term (Week 6+)
1. ❌ Story mode implementation
2. ❌ Advanced features (minimap, etc.)
3. ❌ Performance optimization
4. ❌ Playtesting and balance

---

## Success Criteria

**v2 matches v1 when**:
- ✅ Player can move with WASD
- ⚠️ Player can shoot with mouse (verify)
- ⚠️ Enemies spawn in waves (working)
- ⚠️ Enemies chase and damage player (verify)
- ❌ Player can kill enemies and gain XP
- ❌ Level-up grants stat/spell upgrades
- ❌ All 11 spells work like v1
- ❌ All enemy types behave correctly
- ❌ Bosses have multi-phase fights
- ❌ Survival mode plays identically
- ❌ All maps are playable
- ❌ Audio/SFX match v1

---

**Status Legend**:
- ✅ Complete
- ⚠️ Partial/Needs Verification
- ❌ Not Started
- 🔄 In Progress
