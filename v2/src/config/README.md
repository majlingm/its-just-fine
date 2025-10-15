# Configuration Files

**Status**: Active
**Last Updated**: 2025-10-15
**Phase**: Phase 3 (Configuration System)
**Test Coverage**: 100% (via ConfigLoader)

## Overview

This directory contains all game content defined in JSON format. Instead of hardcoding entity properties in JavaScript, we use data-driven configuration files that can be edited without changing code.

**Key Principle**: All game content is data, not code.

## Current State

- ✅ enemies.json - 10 diverse enemy types (100% tested via ConfigLoader)
- ✅ bosses.json - 5 epic bosses with multi-phase AI (100% tested via ConfigLoader)
- ✅ All configurations load successfully
- ✅ Integration with EntityFactory complete
- ⚠️ Not yet integrated with spawn system

## How It Works

### Configuration-Driven Design

```
JSON File → ConfigLoader → EntityFactory → ECS Entity
    ↓             ↓              ↓             ↓
Define        Load+Cache    Create Comps   Ready to use
```

### Benefits

1. **No Code Changes**: Add new enemies by editing JSON
2. **Easy Balancing**: Tweak health/damage without recompiling
3. **Version Control**: Track content changes separately from code
4. **Hot Reload**: Potentially reload configs without restart
5. **Designer-Friendly**: Non-programmers can edit content

## Directory Structure

```
config/
└── entities/
    ├── enemies.json    # Regular enemy definitions
    └── bosses.json     # Boss enemy definitions
```

## Configuration Files

### enemies.json

**Purpose**: Defines regular enemy types

**File**: `entities/enemies.json` (203 lines)

**Enemy Count**: 10 unique enemy types

**Enemy Types**:
1. `shadow_lurker` - Basic melee chaser (health: 100)
2. `crystal_guardian` - Patrol defender (health: 150)
3. `flame_imp` - Fast swarmer (health: 80)
4. `void_walker` - Teleporter (health: 200)
5. `frost_sentinel` - Ranged attacker (health: 180)
6. `corrupted_knight` - Charger (health: 250)
7. `arcane_wisp` - Evasive support (health: 50)
8. `stone_golem` - Tank (health: 400)
9. `blood_hound` - Pack hunter (health: 120)
10. `lightning_elemental` - Chain attacker (health: 130)

**Schema**:
```typescript
{
  "[enemyId]": {
    displayName: string,        // Display name
    type: "enemy",              // Type identifier
    health: number,             // Max health
    speed: number,              // Base movement speed
    maxSpeed: number,           // Maximum speed
    damage: number,             // Base damage
    scale: number,              // Visual scale
    model: string,              // Model type
    color: number,              // Hex color
    castShadow: boolean,        // Cast shadows
    receiveShadow: boolean,     // Receive shadows
    ai: {
      behavior: string,         // AI behavior type
      aggroRange: number,       // Detection range
      attackRange: number,      // Attack range
      attackCooldown: number,   // Attack cooldown (seconds)
      // Behavior-specific properties
      [key: string]: any
    }
  }
}
```

---

### bosses.json

**Purpose**: Defines boss enemy types with multi-phase AI

**File**: `entities/bosses.json` (335 lines)

**Boss Count**: 5 epic bosses

**Boss Types**:
1. `shadow_lord` - 3 phases, summons minions (health: 5000)
2. `crystal_titan` - 3 phases, reflect shield (health: 8000)
3. `inferno_dragon` - 3 phases, aerial attacks (health: 10000)
4. `void_empress` - 3 phases, teleport chaos (health: 7500)
5. `elder_lich` - 3 phases, necromancy (health: 6000)

**Schema**:
```typescript
{
  "[bossId]": {
    name: string,               // Internal name
    displayName: string,        // Display name
    type: "boss",               // Type identifier
    health: number,             // Max health
    speed: number,              // Base speed
    maxSpeed: number,           // Max speed
    scale: number,              // Visual scale (usually 2+)
    model: string,              // Model type
    color: number,              // Hex color
    phases: Array<{
      healthThreshold: number,  // Health % to trigger (0-1)
      name: string,             // Phase name
      behavior: string,         // Phase behavior
      abilities: Array<string>  // Available abilities
    }>,
    abilities: Array<{
      id: string,               // Ability ID
      name: string,             // Display name
      cooldown: number,         // Cooldown (seconds)
      damage?: number,          // Damage amount
      range?: number,           // Range
      duration?: number,        // Duration (seconds)
      // Ability-specific properties
      [key: string]: any
    }>
  }
}
```

## Enemy Archetypes

### Melee Enemies

**Shadow Lurker** (Basic Chaser)
- Health: 100
- Speed: 5.5
- Behavior: chase_player
- Use Case: Early game, basic threat

**Flame Imp** (Swarmer)
- Health: 80
- Speed: 7.0
- Behavior: swarm
- Use Case: Fast, weak, overwhelming numbers

**Corrupted Knight** (Charger)
- Health: 250
- Speed: 3.5 (12 when charging)
- Behavior: charge
- Use Case: High damage, telegraphed attacks

---

### Defensive Enemies

**Crystal Guardian** (Patrol Defender)
- Health: 150
- Speed: 3.0
- Behavior: patrol
- Use Case: Guarding areas, predictable movement

**Stone Golem** (Tank)
- Health: 400
- Speed: 2.0
- Armor: 50% damage reduction
- Behavior: tank
- Use Case: Slow, high health, damage sponge

---

### Ranged Enemies

**Frost Sentinel** (Ranged Attacker)
- Health: 180
- Speed: 2.5
- Attack Range: 15
- Behavior: ranged
- Use Case: Keep distance, projectile attacks

**Lightning Elemental** (Chain Attacker)
- Health: 130
- Speed: 6.0
- Attack Range: 8 (chains to 5 units, max 3 chains)
- Behavior: chain_attack
- Use Case: Multi-target damage

---

### Special Enemies

**Void Walker** (Teleporter)
- Health: 200
- Speed: 4.0
- Teleport Range: 10 (every 5 seconds)
- Behavior: teleport
- Use Case: Unpredictable movement

**Arcane Wisp** (Evasive Support)
- Health: 50
- Speed: 8.0
- Evade Chance: 70%
- Behavior: evade
- Use Case: Hard to hit, support role

**Blood Hound** (Pack Hunter)
- Health: 120
- Speed: 9.0
- Pack Bonus: +5 damage per nearby hound
- Behavior: pack_hunter
- Use Case: Dangerous in groups

## Boss Design

### Shadow Lord

**Theme**: Darkness and summoning

**Phases**:
1. **Awakening** (100% health) - Aggressive, basic attacks
2. **Enraged** (66% health) - Summons shadow minions
3. **Desperate** (33% health) - Void realm ultimate

**Abilities**:
- Shadow Strike (3s cooldown, 50 damage, 5 range)
- Dark Pulse (8s cooldown, 30 damage, 15 range, AOE)
- Summon Minions (15s cooldown, 3 shadow_lurkers)
- Void Realm (30s cooldown, 100 damage, 20 range, 5s duration)

---

### Crystal Titan

**Theme**: Defense and reflection

**Phases**:
1. **Dormant** (100% health) - Defensive, reflect shield
2. **Awakened** (50% health) - Aggressive, crystal storm
3. **Shattered** (25% health) - Berserk, prismatic beam

**Abilities**:
- Crystal Spikes (4s cooldown, 40 damage, 10 range)
- Reflect Shield (12s cooldown, 5s duration, 50% reflect)
- Crystal Storm (20s cooldown, 25 damage, 25 range, 6s duration)
- Prismatic Beam (25s cooldown, 150 damage, 30 range)

---

### Inferno Dragon

**Theme**: Fire and aerial combat

**Phases**:
1. **Ground Assault** (100% health) - Melee attacks
2. **Aerial Dominance** (60% health) - Flying, fire dives
3. **Infernal Rage** (30% health) - Ultimate abilities

**Abilities**:
- Flame Breath (5s cooldown, 45 damage, 15 range, cone)
- Tail Swipe (6s cooldown, 60 damage, 8 range, knockback)
- Fire Dive (18s cooldown, 80 damage, 10 range, AOE)
- Meteor Rain (22s cooldown, 35 damage, 30 range, 12 meteors, 8s)
- Supernova (40s cooldown, 200 damage, 40 range, AOE)

---

### Void Empress

**Theme**: Teleportation and void magic

**Phases**:
1. **Manifestation** (100% health) - Teleport behavior
2. **Corruption** (70% health) - Summons void walkers
3. **Oblivion** (40% health) - Chaos, dimensional collapse

**Abilities**:
- Void Bolt (2.5s cooldown, 55 damage, 25 range)
- Reality Tear (10s cooldown, 40 damage, 20 range, 4s, 50% slow)
- Summon Void (18s cooldown, 2 void_walkers)
- Dimensional Collapse (35s cooldown, 120 damage, 35 range, 5 teleports)

---

### Elder Lich

**Theme**: Necromancy and death magic

**Phases**:
1. **Necromancy** (100% health) - Summon undead
2. **Phylactery Power** (60% health) - Defensive, soul drain
3. **Eternal Death** (30% health) - Ultimate death wave

**Abilities**:
- Death Bolt (3.5s cooldown, 48 damage, 20 range)
- Raise Dead (12s cooldown, 4 shadow_lurkers)
- Soul Drain (15s cooldown, 30 damage, 15 range, 50% lifesteal)
- Bone Armor (20s cooldown, 8s duration, 60% damage reduction)
- Death Wave (30s cooldown, 100 damage, 40 range, AOE)

## Usage Examples

### Loading Enemy Config

```javascript
import { configLoader } from '../utils/ConfigLoader.js';

// Load specific enemy
const config = await configLoader.getEnemy('shadow_lurker');

console.log(config.health);      // 100
console.log(config.speed);       // 5.5
console.log(config.ai.behavior); // "chase_player"
```

### Loading Boss Config

```javascript
// Load boss
const boss = await configLoader.getBoss('inferno_dragon');

console.log(boss.health);              // 10000
console.log(boss.phases.length);       // 3
console.log(boss.abilities.length);    // 5
console.log(boss.phases[0].name);      // "Phase 1: Ground Assault"
```

### Creating Entity from Config

```javascript
import { entityFactory } from '../systems/entity/EntityFactory.js';

// EntityFactory automatically loads and uses config
const enemy = await entityFactory.createEnemy('void_walker', {
  x: 10,
  z: 20
});

// All properties from config are applied
const health = enemy.getComponent('Health');
console.log(health.max); // 200 (from config)

const movement = enemy.getComponent('Movement');
console.log(movement.speed); // 4.0 (from config)

const ai = enemy.getComponent('AI');
console.log(ai.behavior); // "teleport" (from config)
```

## Adding New Content

### Adding a New Enemy

1. **Edit** `config/entities/enemies.json`
2. **Add** new enemy entry:

```json
{
  "my_new_enemy": {
    "displayName": "My New Enemy",
    "type": "enemy",
    "health": 120,
    "speed": 5.0,
    "maxSpeed": 7.5,
    "damage": 15,
    "scale": 1.0,
    "model": "custom_model",
    "color": 0xff00ff,
    "castShadow": true,
    "receiveShadow": true,
    "ai": {
      "behavior": "custom_behavior",
      "aggroRange": 30,
      "attackRange": 2,
      "attackCooldown": 1.5
    }
  }
}
```

3. **Use** it in game:

```javascript
const enemy = await entityFactory.createEnemy('my_new_enemy');
```

**No code changes required!**

---

### Adding a New Boss

1. **Edit** `config/entities/bosses.json`
2. **Add** boss with phases and abilities
3. **Use** it in game:

```javascript
const boss = await entityFactory.createBoss('my_boss');
```

## Configuration Best Practices

### DO ✅

1. **Use consistent naming**
   - snake_case for IDs
   - Title Case for display names

2. **Balance enemy stats progressively**
   - Early enemies: 50-150 health
   - Mid enemies: 150-300 health
   - Late enemies: 300-500 health
   - Bosses: 5000-10000 health

3. **Define all properties**
   - Include all fields even if using defaults
   - Makes config self-documenting

4. **Group similar enemy types**
   - Melee enemies together
   - Ranged enemies together
   - Special enemies together

### DON'T ❌

1. **Don't use duplicate IDs**
   - Each enemy ID must be unique
   - ConfigLoader uses ID as key

2. **Don't hardcode values in code**
   - Keep all content in JSON
   - Code should reference config, not contain values

3. **Don't use extreme values**
   - Speed: 0.5-15 is reasonable
   - Health: 20-10000 is reasonable
   - Keep gameplay balanced

## Color Reference

Colors are defined as hex numbers (not strings):

```javascript
// Common colors used in configs
0xff0000  // Red
0x00ff00  // Green
0x0000ff  // Blue
0xffffff  // White
0x000000  // Black
0xff8800  // Orange
0x00ffff  // Cyan
0xff00ff  // Magenta
0xffff00  // Yellow
0x888888  // Gray
```

## Integration with Systems

### ConfigLoader

Loads and caches JSON files:

```javascript
import { configLoader } from '../utils/ConfigLoader.js';

// First call: Loads from file
const enemy1 = await configLoader.getEnemy('shadow_lurker');

// Second call: Returns cached version (fast)
const enemy2 = await configLoader.getEnemy('shadow_lurker');
```

### EntityFactory

Transforms configs into entities:

```javascript
import { entityFactory } from '../systems/entity/EntityFactory.js';

// Factory reads config and creates entity
const enemy = await entityFactory.createEnemy('shadow_lurker');

// Entity has all components from config
// Transform, Health, Movement, Renderable, AI
```

## Related Files

- `../utils/ConfigLoader.js` - Loads JSON files
- `../systems/entity/EntityFactory.js` - Creates entities from config
- `../core/ecs/Entity.js` - Entity container
- `../components/` - Component definitions

## Known Issues

- ✅ All configs load successfully
- 💡 Consider config validation schema
- 💡 Consider config editor tool
- 💡 Consider config hot-reload

## Performance Considerations

### Configuration Loading
- Configs loaded once and cached
- Async loading doesn't block game
- Minimal memory footprint (~10KB total)

### Best Practices
- Load all configs at game start
- Use caching (automatic via ConfigLoader)
- Don't reload configs frequently

## Future Improvements

### Phase 4 (Systems Migration)
- [ ] Weapon configs
- [ ] Spell configs
- [ ] Level configs
- [ ] Wave spawn configs

### Nice to Have
- [ ] Config validation (JSON schema)
- [ ] Visual config editor
- [ ] Config hot-reload during development
- [ ] Config inheritance (base enemy + variants)
- [ ] Config expressions (calculated values)

### Advanced Features
- [ ] Difficulty scaling in config
- [ ] Random enemy variants
- [ ] Procedural enemy generation
- [ ] Config versioning

## Change Log

### 2025-10-15
- ✅ Initial creation of enemies.json (10 enemy types)
- ✅ Initial creation of bosses.json (5 boss types)
- ✅ Multi-phase boss AI definitions
- ✅ Diverse enemy archetypes (melee, ranged, special)
- ✅ Complete ability definitions for bosses
- ✅ Integration with ConfigLoader
- ✅ Integration with EntityFactory
- ✅ 100% test coverage via ConfigLoader tests

---

**Last Updated**: 2025-10-15
**Maintained By**: Claude + Developer
**Status**: Ready for Phase 4 integration
