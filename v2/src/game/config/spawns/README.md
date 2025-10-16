# Spawn Configuration System

## 🎯 Config-First Design Philosophy

**The spawn system follows a config-first approach**:
1. **Design the config structure first** with all desired features
2. **Write code that reads and executes the config**
3. **Expand both config and code iteratively** as new needs arise

This ensures the system is data-driven, flexible, and easy to extend without code changes.

---

## 📋 Spawn Config Structure

### Top-Level Properties

| Property | Type | Description | Status |
|----------|------|-------------|---------|
| `id` | string | Unique spawn configuration ID | ✅ Implemented |
| `name` | string | Human-readable name | ✅ Implemented |
| `description` | string | What this spawn config does | ✅ Implemented |
| `spawnMode` | string | "wave_based", "continuous", "event_driven" | ⏳ Partially |
| `globalSettings` | object | Global spawn behavior settings | ⏳ Partially |
| `spawnAnimations` | array | Available spawn animation types | ⏳ TODO |
| `spawnPatterns` | array | Geometric spawn patterns | ⏳ TODO |
| `groupFormations` | array | Enemy group formations | ⏳ TODO |
| `triggers` | array | Spawn trigger definitions | ⏳ TODO |
| `waves` | array | Wave definitions | ✅ Implemented |
| `infiniteMode` | object | Infinite wave scaling settings | ⏳ Partially |
| `dynamicDifficulty` | object | Dynamic difficulty adjustment | ⏳ TODO |

---

## 🌍 Global Settings

Controls overall spawn behavior:

```json
{
  "globalSettings": {
    "startDelay": 3.0,                  // Delay before first spawn
    "wavePauseDelay": 5.0,              // Delay between waves
    "waveCompleteThreshold": 10,        // Enemies remaining to complete wave
    "spawnSafeDistance": 40,            // Min distance from player
    "spawnMaxDistance": 55,             // Max distance from player
    "allowOffscreenSpawns": true,       // Can spawn just outside view
    "minOffscreenDistance": 3,          // How far offscreen to spawn
    "playerProximityCheck": true,       // Check player distance
    "maxSpawnsPerFrame": 5              // Max entities spawned per frame
  }
}
```

**Implementation Status**: ⏳ Partially implemented (basic distance checking)

---

## 🎬 Spawn Animations

Visual effects when enemies appear:

### Animation Types

1. **Rise From Ground** - ⏳ TODO
   - Enemy emerges from below ground
   - Start underground, scale up while rising
   - Dust/particle effects

2. **Fade In** - ⏳ TODO
   - Enemy materializes gradually
   - Opacity 0 → 1 over duration
   - Optional shimmer/glow effect

3. **Portal Spawn** - ⏳ TODO
   - Portal opens, enemy steps through
   - Portal animation (open → close)
   - Swirl particle effects

4. **Instant** - ✅ Implemented (default)
   - No animation, immediate appearance

```json
{
  "id": "rise_from_ground",
  "enabled": true,
  "duration": 0.8,              // Animation duration in seconds
  "startScale": 0.1,            // Initial scale (0.1 = 10% size)
  "endScale": 1.0,              // Final scale (1.0 = 100% size)
  "startY": -1.0,               // Start position (underground)
  "endY": 0.0,                  // End position (ground level)
  "easing": "easeOutBack",      // Easing function
  "particleEffect": "dust_cloud" // Particle effect name
}
```

**Easing Functions**: linear, easeIn, easeOut, easeInOut, easeOutBack, bounce

---

## 📐 Spawn Patterns

Geometric patterns for enemy placement:

### Pattern Types

1. **Circle Around Player** - ⏳ TODO
   ```json
   {
     "type": "circle",
     "radiusMin": 40,           // Inner radius
     "radiusMax": 55,           // Outer radius
     "angleRandomness": 360,    // Full circle randomness
     "offsetRandomness": 5      // Position jitter
   }
   ```

2. **Arc Pattern** - ⏳ TODO
   ```json
   {
     "type": "arc",
     "radiusMin": 45,
     "radiusMax": 50,
     "arcAngle": 120,           // 120° arc
     "arcDirection": "front",   // front, back, left, right
     "pointCount": 5            // Points along arc
   }
   ```

3. **Grid Formation** - ⏳ TODO
   ```json
   {
     "type": "grid",
     "rows": 3,
     "columns": 3,
     "spacing": 3,              // Units between enemies
     "centerOffset": {"x": 0, "z": 50}
   }
   ```

4. **Random Scatter** - ✅ Implemented
   ```json
   {
     "type": "random",
     "count": 1,
     "radiusMin": 40,
     "radiusMax": 60
   }
   ```

5. **Offscreen Edge** - ⏳ TODO
   ```json
   {
     "type": "offscreen",
     "edgeBuffer": 5,           // Distance outside view
     "preferredEdges": ["top", "left", "right"],
     "avoidEdges": ["bottom"]   // Don't spawn from these edges
   }
   ```

---

## 👥 Group Formations

When enemies spawn in groups, they can form specific patterns:

### Formation Types

1. **Tight Cluster** - ⏳ TODO
   - Enemies spawn close together
   - No linked movement (scatter after spawn)
   ```json
   {
     "type": "cluster",
     "spacing": 2,
     "radiusVariation": 1,
     "linkedMovement": false
   }
   ```

2. **Line Formation** - ⏳ TODO
   - Enemies in a straight line
   - Optional linked movement (move as unit)
   ```json
   {
     "type": "line",
     "spacing": 3,
     "angle": 0,                // Line direction
     "linkedMovement": true,
     "formationSpeed": 0.8      // Formation moves slower
   }
   ```

3. **V-Formation** - ⏳ TODO
   - V-shaped attack formation
   - Leader at front, followers behind
   ```json
   {
     "type": "v_shape",
     "spacing": 2.5,
     "angle": 45,               // V angle
     "linkedMovement": true,
     "formationSpeed": 0.9,
     "leaderBehavior": "aggressive"
   }
   ```

4. **Surrounding Circle** - ⏳ TODO
   - Enemies form rotating circle
   - Rotates around center while moving
   ```json
   {
     "type": "circle",
     "radius": 5,
     "linkedMovement": true,
     "rotationSpeed": 0.5,      // Rotation speed
     "formationSpeed": 0.7
   }
   ```

5. **Scattered** - ✅ Implemented (default)
   - Random positions, no formation
   ```json
   {
     "type": "scattered",
     "radiusMin": 1,
     "radiusMax": 8,
     "linkedMovement": false
   }
   ```

**Linked Movement**: When enabled, enemies maintain formation while moving toward player

---

## 🎯 Spawn Triggers

Conditions that trigger enemy spawns:

### Trigger Types

1. **Time-Based** - ⏳ TODO
   ```json
   {
     "type": "time_based",
     "enabled": true,
     "interval": 30.0,          // Every 30 seconds
     "repeatMode": "continuous" // continuous, once, count
   }
   ```

2. **Enemy Count Threshold** - ⏳ TODO
   ```json
   {
     "type": "enemy_count",
     "enabled": true,
     "threshold": 5,            // When enemies drop below 5
     "operator": "less_than",   // less_than, greater_than, equals
     "checkInterval": 1.0       // Check every second
   }
   ```

3. **Wave Complete** - ✅ Implemented
   ```json
   {
     "type": "wave_complete",
     "enabled": true
   }
   ```

4. **Event-Based** - ⏳ TODO
   ```json
   {
     "type": "event",
     "enabled": true,
     "eventName": "boss_defeated", // Custom event name
     "cooldown": 5.0            // Min time between triggers
   }
   ```

5. **Spatial Trigger** - ⏳ TODO
   ```json
   {
     "type": "spatial",
     "enabled": true,
     "areaType": "circle",      // circle, rectangle
     "position": {"x": 0, "z": 50},
     "radius": 10,
     "triggerOnce": true        // Only trigger first time
   }
   ```

---

## 🌊 Wave Configuration

Each wave defines what enemies spawn and how:

```json
{
  "waveNumber": 1,
  "name": "First Contact",
  "triggers": ["wave_complete"],

  "spawnRules": {
    "totalEnemies": 10,          // Total enemies in wave
    "simultaneousMax": 15,       // Max alive at once
    "spawnInterval": 2.0,        // Seconds between spawns
    "spawnBatchSize": 2,         // Enemies per spawn
    "allowOverlap": false        // Can spawn on same spot
  },

  "enemyComposition": [
    {
      "enemyType": "shadow_lurker",
      "weight": 70,              // Weighted random selection
      "minCount": 6,             // Min of this type
      "maxCount": 8,             // Max of this type
      "spawnAnimation": "rise_from_ground",
      "spawnPattern": "circle_around_player",
      "groupFormation": "scattered",
      "groupChance": 0.3,        // 30% chance to spawn as group
      "groupSizeMin": 2,
      "groupSizeMax": 3
    }
  ],

  "spawnLocations": {
    "preferredPatterns": ["circle_around_player", "offscreen_edge"],
    "patternWeights": [60, 40], // 60% circle, 40% offscreen
    "avoidPlayerRadius": 35,    // Don't spawn too close
    "randomization": 0.3        // Add randomness (0-1)
  },

  "specialEvents": [
    {
      "type": "timed_spawn",     // Scripted spawn at specific time
      "time": 15.0,              // 15 seconds into wave
      "enemyType": "flame_imp",
      "count": 3,
      "spawnPattern": "arc_front",
      "groupFormation": "v_formation",
      "message": "Reinforcements incoming!"
    },
    {
      "type": "continuous_spawn", // Continuous spawning window
      "startTime": 20.0,
      "endTime": 40.0,
      "interval": 5.0,           // Spawn every 5 seconds
      "enemyType": "flame_imp",
      "count": 2
    }
  ],

  "rewards": {
    "xpMultiplier": 1.0,         // XP bonus for this wave
    "dropRateBonus": 0.0         // Drop rate bonus
  }
}
```

---

## ♾️ Infinite Mode

For survival modes with endless waves:

```json
{
  "enabled": true,
  "startAfterWave": 3,           // Start infinite after wave 3
  "loopWaves": [1, 2, 3],        // Repeat these waves

  "scaling": {
    "healthMultiplier": 0.15,    // +15% health per wave
    "damageMultiplier": 0.10,    // +10% damage per wave
    "speedMultiplier": 0.05,     // +5% speed per wave
    "countMultiplier": 0.20,     // +20% enemy count per wave
    "spawnRateMultiplier": -0.05, // -5% spawn interval (faster)
    "xpMultiplier": 0.10         // +10% XP per wave
  },

  "bossWaves": {
    "enabled": true,
    "frequency": 7,              // Boss every 7 waves
    "bossPool": [
      {
        "bossType": "corrupted_knight",
        "weight": 40,
        "spawnAnimation": "portal_spawn",
        "spawnPattern": "random_scatter",
        "messageDelay": 3.0,
        "message": "A powerful enemy approaches!"
      }
    ],
    "additionalEnemies": {
      "enabled": true,
      "count": 5,                // Spawn adds with boss
      "enemyTypes": ["shadow_lurker"],
      "spawnDelay": 10.0         // 10s after boss spawns
    }
  },

  "eliteWaves": {
    "enabled": true,
    "frequency": 5,              // Elite wave every 5 waves
    "eliteChance": 0.3,          // 30% of enemies are elite
    "eliteHealthBonus": 0.5,     // +50% health
    "eliteDamageBonus": 0.3,     // +30% damage
    "eliteSpeedBonus": 0.2,      // +20% speed
    "eliteXpBonus": 0.5          // +50% XP
  }
}
```

---

## 📊 Dynamic Difficulty

Adjusts difficulty based on player performance:

```json
{
  "enabled": false,              // ⏳ TODO
  "adjustmentInterval": 60.0,    // Check every 60 seconds

  "metrics": {
    "playerHealth": {
      "weight": 0.3,             // How much this matters
      "threshold": 0.5           // Target 50% health
    },
    "enemiesKilled": {
      "weight": 0.4,
      "targetPerMinute": 10      // Target 10 kills/minute
    },
    "timeSurvived": {
      "weight": 0.3,
      "targetTime": 600          // Target 10 minutes
    }
  },

  "adjustmentRange": {
    "min": 0.5,                  // Min 50% difficulty
    "max": 2.0,                  // Max 200% difficulty
    "step": 0.1                  // Adjust by 10% at a time
  }
}
```

---

## 🎮 Usage Example

### Creating a New Spawn Config

1. **Copy `survival_basic.json`** as a template
2. **Modify wave definitions** for your map
3. **Choose spawn patterns** that fit the environment
4. **Set animations** that match the theme
5. **Configure triggers** for your game mode
6. **Test and iterate**

### Linking to Map Config

In your map config (`maps/my_map.json`):

```json
{
  "id": "my_map",
  "spawnConfig": "spawns/survival_basic"  // References this file
}
```

---

## ✅ Implementation Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Spawning** |
| Wave-based spawning | ✅ | Basic implementation |
| Spawn intervals/batching | ✅ | Working |
| Enemy type selection | ✅ | Weighted random |
| **Spawn Patterns** |
| Circle around player | ⏳ | Partially (random angle) |
| Arc pattern | ⏳ | TODO |
| Grid formation | ⏳ | TODO |
| Offscreen spawning | ⏳ | TODO |
| Random scatter | ✅ | Working |
| **Group Formations** |
| Scattered (no formation) | ✅ | Default |
| Tight cluster | ⏳ | TODO |
| Line formation | ⏳ | TODO |
| V-formation | ⏳ | TODO |
| Circle formation | ⏳ | TODO |
| Linked movement | ⏳ | TODO |
| **Spawn Animations** |
| Instant | ✅ | Default |
| Rise from ground | ⏳ | TODO |
| Fade in | ⏳ | TODO |
| Portal spawn | ⏳ | TODO |
| **Triggers** |
| Wave complete | ✅ | Working |
| Time-based | ⏳ | TODO |
| Enemy count | ⏳ | TODO |
| Event-based | ⏳ | TODO |
| Spatial triggers | ⏳ | TODO |
| **Advanced Features** |
| Infinite mode scaling | ⏳ | Partial (basic scaling) |
| Boss waves | ⏳ | TODO |
| Elite enemies | ⏳ | TODO |
| Special events | ⏳ | TODO |
| Dynamic difficulty | ⏳ | TODO |

---

## 🔄 Extending the System

To add new features:

1. **Add to config first** - Define the JSON structure
2. **Update this README** - Document the new feature
3. **Mark as ⏳ TODO** - Indicate not yet implemented
4. **Implement in code** - Build the system to read config
5. **Update status to ✅** - Mark as implemented
6. **Write tests** - Verify it works

---

**Last Updated**: 2025-10-15
**Config Version**: 1.0.0
**Status**: ⏳ In Development
