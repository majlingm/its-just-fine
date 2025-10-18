# V1 Spell and Particle System Migration

## Overview
This document tracks the migration of the spell and particle systems from v1 to v2. The classes have been copied as-is to get them working initially, with the plan to refactor them to fit the v2 architecture later.

## What Was Copied

### Particle System (v2/src/particles/)
- ✅ **Particle.js** - Individual particle with lifecycle management
- ✅ **ParticleEmitter.js** - Configuration-based particle spawner with burst and cone patterns
- ✅ **ParticleSystem.js** - Manages particle lifecycle and object pooling

### Spell System (v2/src/spells/)

#### Base Classes
- ✅ **Spell.js** - Base spell class with damage calculation, cooldown, targeting
- ✅ **ProjectileSpell.js** - Base class for projectile-based spells
- ✅ **InstantSpell.js** - Base class for instant execution spells
- ✅ **PersistentSpell.js** - Base class for persistent entity spells

#### Spell Implementations (v2/src/spells/spells/)
- ✅ **ChainLightningSpell.js** - Multi-target chaining lightning
- ✅ **DashShockwaveSpell.js** - Dash movement with shockwave
- ✅ **IceLanceSpell.js** - Piercing ice projectile
- ✅ **MagicBulletSpell.js** - Fast rainbow bullets in random directions
- ✅ **PyroExplosionSpell.js** - Fire explosion spell
- ✅ **RingOfFireSpell.js** - Persistent rotating fire ring
- ✅ **RingOfIceSpell.js** - Persistent rotating ice ring
- ✅ **ShadowBoltSpell.js** - Shadow projectile with spreading
- ✅ **SkullShieldSpell.js** - Rotating skull shield
- ✅ **ThunderStrikeSpell.js** - Sky lightning strike

#### Utilities
- ✅ **SpellRegistry.js** - Spell registration and lookup system
- ✅ **spellLevelScaling.js** - Centralized level scaling configuration
- ✅ **spellData.json** - Spell configuration data
- ✅ **spellTypes.js** - Spell type definitions and factory functions
- ✅ **FireballSpell.js** - Legacy fireball spell (kept for compatibility)

## Dependencies Required

The spell system has dependencies on v1 systems that need to be either:
1. Copied from v1 (temporary solution)
2. Adapted to work with v2 architecture (long-term solution)

### Entity Dependencies (v2/src/entities/)
- ✅ **Projectile.js** - Base projectile class
- ✅ **ColoredLightning.js** - Used by ChainLightningSpell
- ✅ **DashShockwave.js** - Used by DashShockwaveSpell
- ✅ **FireExplosion.js** - Used by PyroExplosionSpell
- ✅ **FlameProjectile.js** - Used by FireballSpell
- ✅ **IceLance.js** - Used by IceLanceSpell
- ✅ **InstantLightning.js** - Used by ChainLightningSpell
- ✅ **LightningExplosion.js** - Used by ThunderStrikeSpell
- ✅ **MagicBullet.js** - Used by MagicBulletSpell
- ✅ **RingOfFire.js** - Used by RingOfFireSpell
- ✅ **RingOfIce.js** - Used by RingOfIceSpell
- ✅ **ShadowBoltGroup.js** - Used by ShadowBoltSpell
- ✅ **ShadowProjectile.js** - Used by ShadowBoltSpell
- ✅ **SkullShield.js** - Used by SkullShieldSpell

### Effect Dependencies (v2/src/effects/)
- ✅ **FireEffect.js** - Fire particle effects
- ✅ **LightningEffect.js** - Lightning visual effects

### System Dependencies (v2/src/systems/)
- ✅ **TypedProjectilePool.js** - Object pooling for projectiles

## Import Usage

```javascript
// Import particle system
import { Particle, ParticleEmitter, ParticleSystem } from './particles';

// Import spell base classes
import { Spell, ProjectileSpell, InstantSpell, PersistentSpell } from './spells';

// Import specific spells
import { MagicBulletSpell, ThunderStrikeSpell } from './spells';

// Import utilities
import { SpellRegistry, applySpellLevelScaling } from './spells';

// Import entities
import { Projectile, MagicBullet, IceLance, RingOfFire } from './entities';

// Import effects
import { FireEffect, LightningEffect } from './effects';

// Import systems
import { TypedProjectilePool } from './systems';
```

## Next Steps

### Phase 1: Get It Working (✅ Complete)
- [x] Copy particle classes
- [x] Copy spell classes
- [x] Create index exports for spells and particles
- [x] Copy required entity dependencies (14 entities)
- [x] Copy required effect dependencies (2 effects)
- [x] Copy TypedProjectilePool system
- [x] Create index exports for entities, effects, and systems
- [ ] Basic integration test (ready to begin)

### Phase 2: Refactor for V2
- [ ] Adapt particle system to use v2 ECS architecture
- [ ] Adapt spell system to use v2 component/system pattern
- [ ] Migrate entity classes to v2 architecture
- [ ] Update effect system for v2
- [ ] Replace v1 engine references with v2 equivalents
- [ ] Update pooling to use v2's pooling system

### Phase 3: Optimization
- [ ] Review and optimize particle rendering
- [ ] Optimize spell casting performance
- [ ] Implement v2-specific optimizations
- [ ] Profile and tune

## Key Differences: V1 vs V2

### V1 Architecture
- Object-oriented entity model
- Direct engine references
- Manual object pooling
- Scene-based rendering with THREE.js

### V2 Architecture (Target)
- ECS (Entity Component System) pattern
- System-based processing
- Centralized pooling via `core/pooling`
- Abstracted rendering layer

## Notes
- All files are copied **as-is** from v1
- No modifications have been made yet
- Imports reference v1 paths (`../../entities/`, `../../effects/`)
- These will need updating once dependencies are resolved
- The goal is to get it working first, then refactor
