# Performance Optimization Backlog

This file tracks potential performance optimizations that could be implemented in the future.

---

## 🔥 High Priority

### 1. Explosion Effect Pooling
**Status:** Not Started
**Estimated Impact:** Medium (10-15 explosions per second during heavy combat)
**Complexity:** High

**Description:**
Pool `FireExplosion` and `LightningExplosion` objects to reduce GC pressure from frequent spell effects.

**Locations:**
- `/src/entities/FlameProjectile.js` - Creates FireExplosion on projectile impact (3 occurrences)
- `/src/effects/FireEffect.js` - PyroExplosion spell creates FireExplosion
- `/src/spells/spells/ThunderStrikeSpell.js` - Creates LightningExplosion (2 occurrences)
- `/src/spells/spellTypes.js` - Legacy spell system creates LightningExplosion

**Challenges:**
- Both explosion classes create complex dynamic structures:
  - 30 particle sprites with individual velocities and scales
  - 3 shockwave ring meshes with geometry updates
  - Materials that are cloned from ResourceCache
- Would need significant refactoring to support reset/reuse:
  - Pre-allocate particle and ring arrays
  - Add reset() method to reinitialize all particles and rings
  - Properly dispose of old materials when resetting
  - Handle variable particle counts (FireExplosion takes `particleCount` parameter)

**Implementation Approach:**
1. Create `ExplosionPool` using `TypedProjectilePool` pattern
2. Refactor `FireExplosion` and `LightningExplosion`:
   - Pre-allocate particle and ring arrays in constructor
   - Add `reset(engine, x, z, radius, damage, particleCount, isCrit)` method
   - Add `cleanupForPool()` to hide particles/rings without disposal
   - Ensure proper material cleanup and reuse
3. Update all creation sites to use `engine.explosionPool.acquire()`
4. Update GameEngine to call `explosionPool.update()` in main loop
5. Add cleanup in DustAndDynamiteGame.cleanup()

**Files to Modify:**
- Create: `/src/systems/ExplosionPool.js`
- Modify: `/src/entities/FireExplosion.js`
- Modify: `/src/entities/LightningExplosion.js`
- Modify: `/src/engine/GameEngine.js`
- Modify: `/src/engine/DustAndDynamiteGame.js`
- Modify: All spell/effect files that create explosions

---

### 2. ColoredLightning Pooling
**Status:** Not Started
**Estimated Impact:** Medium-Low (4 instances per Chain Lightning cast, if equipped)
**Complexity:** Medium

**Description:**
Pool `ColoredLightning` entities used by Chain Lightning spell and various lightning effects.

**Locations:**
- `/src/spells/spells/ChainLightningSpell.js` - Creates ColoredLightning for each chain (1 occurrence)
- `/src/effects/LightningEffect.js` - Creates ColoredLightning for effects (1 occurrence)
- `/src/effects/SpreadEffect.js` - Creates ColoredLightning for spread patterns (1 occurrence)
- `/src/weapons/weaponTypes.js` - Legacy weapon system creates ColoredLightning (1 occurrence)

**Challenges:**
- ColoredLightning creates dynamic line geometry between two points
- Uses custom line rendering with tapering and branch effects
- Would need to support reset for different positions and colors
- Less critical than explosions since Chain Lightning has built-in cooldown

**Implementation Approach:**
1. Create `LightningEffectPool` using `TypedProjectilePool` pattern
2. Add `reset(engine, startX, startY, startZ, endX, endY, endZ, damage, color, glowColor, width)` to ColoredLightning
3. Add `cleanupForPool()` to hide geometry without disposal
4. Update all creation sites to use pool
5. Integrate into GameEngine update loop

**Files to Modify:**
- Create: `/src/systems/LightningEffectPool.js`
- Modify: `/src/entities/ColoredLightning.js`
- Modify: `/src/engine/GameEngine.js`
- Modify: All spell/effect files that create ColoredLightning

---

## 📊 Current Pool Statistics (Implemented)

### ✅ Completed Pools

1. **ProjectilePool** (Generic projectiles)
   - Size: 200 pre-allocated
   - Status: Implemented in `/src/systems/ProjectilePool.js`

2. **EnemyProjectilePool** (Enemy bullets)
   - Size: 100 pre-allocated
   - Status: Implemented in `/src/systems/EnemyProjectilePool.js`

3. **TypedProjectilePool** (Spell projectiles)
   - Dynamic pools per projectile class (FlameProjectile, ShadowProjectile, IceLance, MagicBullet)
   - Size: 50 per type, created on-demand
   - Status: Implemented in `/src/systems/TypedProjectilePool.js`

4. **PickupPool** (XP orbs and health pickups) ⭐ **Biggest Impact**
   - Size: 200 pre-allocated (180 XP, 20 health)
   - Status: Implemented in `/src/systems/PickupPool.js`
   - Impact: Hundreds of pickups created per minute, major GC reduction

5. **InstancedParticlePool** (Visual particles)
   - Size: 2000 particles per pool
   - Status: Implemented in `/src/effects/InstancedParticlePool.js`
   - Uses InstancedMesh for efficient rendering

---

## 🎯 Other Potential Optimizations

### 3. Enemy Pooling
**Priority:** Low
**Impact:** Low-Medium (Enemies spawn every 1-2 seconds)
**Complexity:** High

Enemy objects are complex with AI, pathfinding, animations, and models. Pooling would require significant refactoring. Current enemy spawn rate doesn't justify the complexity.

### 4. Additional InstancedMesh Usage
**Priority:** Low
**Impact:** Low (Most particles already use InstancedMesh)
**Complexity:** Medium

Some particle effects (flame trails, ice shards, shadow trails) still use individual sprites. Could be converted to InstancedMesh, but current implementation with ResourceCache material caching is already quite efficient.

---

## 📝 Notes

- All pools follow the same pattern established by `TypedProjectilePool`
- Pools automatically expand if exhausted (with warning logs)
- Pool sizes can be tuned based on gameplay metrics
- Current frustum culling already prevents updating off-screen entities
- Memory cleanup is properly implemented with dispose() methods
