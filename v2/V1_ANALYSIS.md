# V1 Game Analysis - Feature Catalog

This document catalogs all features, systems, enemies, spells, and mechanics from the v1 version of "It's Just Fine" for implementation in v2.

## ENEMIES

### Standard Enemies (from Enemy.js - hardcoded)

v1 had 29 enemy types hardcoded in Enemy.js:

**Basic Human/Animal Enemies:**
- `bandit`: HP 100, Speed 3, Damage 12, Color 0x2d2d2d
- `coyote`: HP 60, Speed 5, Damage 8, Color 0xd2691e (fast, smaller)
- `brute`: HP 240, Speed 1.5, Damage 25, Color 0x4a1a1a (zombie, slow, tanky)
- `gunman`: HP 80, Speed 2.5, Damage 15, Color 0x3a3a5a (ranged attacks)
- `charger`: HP 120, Speed 2, Damage 18, Color 0x5a3a1a (charge attacks)
- `tiny`: HP 40, Speed 6, Damage 6, Color 0x3a2a1a (very small and fast)
- `giant`: HP 400, Speed 1.2, Damage 35, Color 0x5a1a1a (huge, slow, boss-like)

**Skeleton Enemies:**
- `skeleton_warrior`: HP 140, Speed 2.8, Damage 20, Color 0xcccccc
- `skeleton_mage`: HP 90, Speed 2.3, Damage 18, Color 0x8888cc

**Shadow Variations (9 types - shader-based silhouettes):**
- `shadow`: HP 120, Speed 2.0, Damage 18 - Large tanky base
- `shadow_lurker`: HP 60, Speed 3.5, Damage 12 - Small fast weak
- `shadow_titan`: HP 300, Speed 1.2, Damage 30 - Huge boss-like
- `shadow_wraith`: HP 80, Speed 4.0, Damage 15 - Fast red tint
- `shadow_colossus`: HP 200, Speed 1.5, Damage 25 - Large slow
- `shadow_flicker`: HP 40, Speed 5.0, Damage 8 - Tiny extremely fast
- `shadow_void`: HP 150, Speed 1.8, Damage 22 - Doctor silhouette, white eyes
- `shadow_crawler`: HP 70, Speed 4.5, Damage 10 - Spider-like, ground crawler
- `shadow_serpent`: HP 90, Speed 3.0, Damage 14 - Worm/snake crawler

**Light Variations (9 types - white counterparts with black outlines):**
- `light` through `light_serpent` - Same stats as shadow versions but white/gray colors

**Key Shadow/Light Features:**
- Custom shader materials with animated waves
- Different shapes (humanoid, doctor/angel, spider, serpent)
- Crawlers lay flat on ground
- Standing types billboard to face camera
- Each has unique eye colors and glow effects

### JSON-Based Enemies (from enemies.json - newer system)

v1 also had a newer JSON configuration system with 10 enemy types:

1. **shadow_lurker**: HP 100, Speed 5.5, Behavior: chase_player
2. **crystal_guardian**: HP 150, Speed 3.0, Behavior: patrol
3. **flame_imp**: HP 80, Speed 7.0, Behavior: swarm
4. **void_walker**: HP 200, Speed 4.0, Behavior: teleport (teleports every 5s)
5. **frost_sentinel**: HP 180, Speed 2.5, Behavior: ranged (15 range, projectiles)
6. **corrupted_knight**: HP 250, Speed 3.5, Behavior: charge (12 speed charge)
7. **arcane_wisp**: HP 50, Speed 8.0, Behavior: evade (70% evade chance)
8. **stone_golem**: HP 400, Speed 2.0, Behavior: tank (0.5 armor reduction)
9. **blood_hound**: HP 120, Speed 9.0, Behavior: pack_hunter (+5 damage in packs)
10. **lightning_elemental**: HP 130, Speed 6.0, Behavior: chain_attack (chains to 3 enemies)

**JSON Enemy Properties:**
- displayName, type, health, speed, maxSpeed, damage
- scale, model, color (hex), castShadow, receiveShadow
- AI behavior config (behavior type, aggroRange, attackRange, attackCooldown)
- Special behavior params (teleportRange, projectileSpeed, evadeChance, armor, etc.)

## BOSSES

### Boss Enemies (from bosses.json)

v1 had 5 fully-designed bosses with multi-phase mechanics:

1. **Shadow Lord**
   - HP: 5000, Speed: 4.0, Scale: 2.5
   - 3 Phases (100%, 66%, 33% HP thresholds)
   - Abilities: shadow_strike, dark_pulse, summon_minions, void_realm
   - Phase 1: Aggressive, Phase 2: Berserk + minions, Phase 3: Ultimate + all abilities

2. **Crystal Titan**
   - HP: 8000, Speed: 2.5, Scale: 3.0
   - 3 Phases (100%, 50%, 25% HP thresholds)
   - Abilities: crystal_spikes, reflect_shield, crystal_storm, prismatic_beam
   - Phase 1: Defensive, Phase 2: Aggressive, Phase 3: Berserk

3. **Inferno Dragon**
   - HP: 10000, Speed: 5.0, Scale: 3.5
   - 3 Phases (100%, 60%, 30% HP thresholds)
   - Abilities: flame_breath (cone), tail_swipe (knockback), fire_dive, meteor_rain, supernova
   - Phase 1: Ground melee, Phase 2: Aerial, Phase 3: Infernal rage

4. **Void Empress**
   - HP: 7500, Speed: 3.5, Scale: 2.2
   - 3 Phases (100%, 70%, 40% HP thresholds)
   - Abilities: void_bolt, reality_tear (slow effect), summon_void, dimensional_collapse (5 teleports)
   - Phase 1: Teleport, Phase 2: Summon, Phase 3: Chaos

5. **Elder Lich**
   - HP: 6000, Speed: 2.0, Scale: 2.0
   - 3 Phases (100%, 60%, 30% HP thresholds)
   - Abilities: death_bolt, raise_dead, soul_drain (heals 50%), bone_armor (60% reduction), death_wave
   - Phase 1: Necromancy, Phase 2: Defensive + Phylactery, Phase 3: Eternal Death

**Boss Features:**
- Phase-based behavior changes
- Multiple ability types (direct damage, AOE, summons, buffs)
- Special mechanics (reflect, teleport, heal, armor, knockback, slow)
- Cooldown-based ability system

## SPELLS / WEAPONS

### Player Spells (from spellData.json)

v1 had 11 fully-designed spells with 7-level progression:

1. **MAGIC_BULLET**
   - Category: magic, Targeting: none (spray)
   - L1: 8 dmg, 30 speed, 1 pierce, 0.08 cooldown
   - L7: 55 dmg, 60 speed, 10 pierce, 0.035 cooldown, 4 projectiles

2. **THUNDER_STRIKE**
   - Category: lightning, Targeting: nearest
   - L1: 200 dmg, 5 radius, 0.8 cooldown
   - L7: 800 dmg, 11 radius, 0.2 cooldown, more lightning branches

3. **CHAIN_LIGHTNING**
   - Category: lightning, Targeting: nearest
   - L1: 8 dmg, 3 chains, 4 chain range
   - L7: 18 dmg, 6 chains, 7 chain range

4. **FIREBALL**
   - Category: fire, Targeting: nearest
   - L1: 16 dmg, 20 speed, 2 pierce
   - L7: 80 dmg, 40 speed, 10 pierce, 4 projectiles

5. **PYRO_EXPLOSION**
   - Category: fire, Targeting: nearest
   - L1: 30 dmg, 3.5 radius, 1.5 cooldown
   - L7: 180 dmg, 8.5 radius, 0.3 cooldown

6. **RING_OF_FIRE**
   - Category: fire, Targeting: self (orbiting)
   - L1: 15 dmg, 64 particles, 2.2 radius
   - L7: 92 dmg, 128 particles, 3.2 radius, faster rotation

7. **ICE_LANCE**
   - Category: ice, Targeting: nearest
   - L1: 20 dmg, 25 speed, 3 pierce, 80% slow for 10s
   - L7: 110 dmg, 48 speed, 12 pierce, 94% slow for 23s

8. **RING_OF_ICE**
   - Category: ice, Targeting: self (orbiting)
   - L1: 10 dmg, freeze effect
   - L7: 67 dmg, stronger freeze, larger radius

9. **DASH_SHOCKWAVE**
   - Category: magic, Targeting: self (dash trail)
   - L1: 3 dmg, 5 radius, 12 knockback
   - L7: 20 dmg, 11 radius, 35 knockback

10. **SHADOW_BOLT**
    - Category: shadow, Targeting: none
    - L1: 25 dmg, 2.5 speed, 12 pierce, 5.0 cooldown, 20s lifetime
    - L7: 200 dmg, 2.5 speed, 35 pierce, 3.0 cooldown, 40s lifetime
    - Special: 3 spinning triangle formation, persistent

11. **SKULL_SHIELD**
    - Category: dark, Targeting: self (orbiting)
    - L1: 12 dmg, 1 skull, 15 knockback
    - L7: 73 dmg, 5 skulls, 38 knockback

**Spell Scaling Properties:**
- Each spell has 7 levels
- Scaling applies to: damage, speed, pierce, cooldown, projectileCount, radius, etc.
- Upgrade costs: 1x, 2x, 3x, 5x, 8x, 13x multipliers (Fibonacci-like)
- Categories: magic, lightning, fire, ice, shadow, dark

## PLAYER SYSTEMS

### Player Stats & Leveling (from Player.js)

**Base Stats:**
- Health: 100 HP (maxHealth: 100)
- Speed: 8
- Starting Level: 1
- Starting XP: 0, XP to next: 10

**XP System:**
- XP required for next level scales exponentially: `xpToNext *= 1.5`
- Level 1→2: 10 XP
- Level 2→3: 15 XP
- Level 3→4: 22 XP
- And so on...

**Stat Multipliers System:**
```javascript
stats = {
  damage: 1,
  cooldown: 1,
  projectileSpeed: 1,
  pierce: 0,
  moveSpeed: 1,
  pickupRadius: 2
}
```

**Weapons Array:**
- Player starts with: `[{ spellKey: 'FIREBALL', level: 1, lastShot: 0 }]`
- Can equip multiple spells

**Dash System:**
- Dash speed: 30
- Dash duration: 0.5s
- Dash cooldown: 1.0s
- Invincibility during dash
- Visual trail effect (shadow/light alternating)

**Invincibility Frames:**
- After taking damage: 0.5s invincibility
- Separate dash invincibility flag
- Flash effect during i-frames

### Spell Leveling System (from spellLevelScaling.js)

**Spell Level Progression:**
- Max level: 7 per spell
- Each attribute can be scaled independently
- Special attribute mappings:
  - `spreadAngle` → converted to radians for `spread`
  - `cooldownMin` / `cooldownMax` → for variable cooldowns

**Scaling Application:**
```javascript
applySpellLevelScaling(spell, spellKey, level)
```
- Modifies spell instance with level-scaled values
- Applies all progression attributes from spellData.json

**Upgrade Cost Formula:**
```javascript
getUpgradeCost(currentLevel, baseCost = 100)
// Multipliers: [1, 2, 3, 5, 8, 13]
// Level 1→2: 100 gold
// Level 2→3: 200 gold
// Level 6→7: 1300 gold
```

## LEVEL / ENVIRONMENT SYSTEMS

### Level System (from LevelSystem.js)

**Level Configuration:**
- Custom lighting per level (ambient, sun, fill, hemisphere)
- Ground types and sizes
- Music track per level
- Decorative 3D objects with:
  - Position (x, y, z)
  - Scale (uniform or vector)
  - Rotation
  - Collision enabled/disabled
  - Model path
  - Shadows

**Spawn Boundaries:**
- Defines spawn area for enemies
- Default: minX: -80, maxX: 80, minZ: -80, maxZ: 80
- Matched with fog boundaries

**Collision System:**
- Bounding box collision for level objects
- Circle-box collision detection
- Push-back vector calculation
- Entity radius consideration

**Features:**
- Model loading with GLTF
- Material property adjustments (metalness, roughness)
- Shadow casting/receiving setup
- Cleanup and disposal on level change

## ENEMY BEHAVIORS & AI

### AI Behaviors (from JSON configs and AISystem in v1)

1. **chase_player**: Basic pursuit behavior
2. **patrol**: Move between patrol points or random walk
3. **swarm**: Fast, aggressive group behavior
4. **teleport**: Periodic teleportation (teleportCooldown, teleportRange)
5. **ranged**: Keep distance and shoot projectiles
6. **charge**: Periodic high-speed charges
7. **evade**: Dodge attacks (evadeChance)
8. **tank**: High HP, damage reduction (armor)
9. **pack_hunter**: Bonus damage when near allies
10. **chain_attack**: Attacks chain to nearby enemies

### Enemy Features (from Enemy.js)

**Elite System:**
- Elite affixes: `fast` (1.8x speed), `tank` (2x HP, 0.7x speed), `regen` (2% HP/sec)
- 3x health multiplier
- 1.5x damage multiplier
- Visual glow effect

**Freeze Effect:**
- 20% speed when frozen
- Visual ice glow
- Duration-based

**Ranged Attacks:**
- Projectile pool system
- Inaccuracy for dodging
- Range checks
- Cooldown system

**Charger Behavior:**
- Charge cooldown tracking
- 4x speed during charge
- 1 second charge duration

**Special Movement:**
- Lurching (zombie/brute)
- Billboard facing (shadow/light)
- Ground crawlers (horizontal rotation only)

## MISSING INFORMATION / TODO

Items not fully documented from v1:

1. **Music/Audio System**: Need to find audio files and music implementation
2. **Level Definitions**: Need to find actual level JSON files (what levels exist, their objects, music, etc.)
3. **Pickup System**: XP orbs, health pickups, etc.
4. **Particle Effects**: Death explosions, spell effects
5. **UI System**: Health bars, XP bars, level up screen
6. **Wave System**: How waves progress, boss wave timing
7. **Save System**: Progress persistence
8. **Game Modes**: Survival, story mode, boss rush

## IMPLEMENTATION PRIORITY FOR V2

Based on this analysis, suggested implementation order:

1. ✅ **Cleanup ItsJustFine.js** - Done
2. ✅ **Analysis complete** - This document
3. **Enemy System**: Implement ECS-based enemies using JSON configs
4. **Spell System**: Implement all 11 spells with level scaling
5. **Player Leveling**: XP system and level-up mechanics
6. **Spell Leveling**: Upgrade system and UI
7. **Boss System**: Multi-phase bosses with abilities
8. **Environment System**: Level loading, collision, objects
9. **Audio System**: Music and sound effects
10. **Polish**: Particles, UI, save system
