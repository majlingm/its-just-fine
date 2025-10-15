# Debug Context - Entity Removal Issue

## Problem
Enemies are not disappearing when their health reaches 0. They stop flashing red (damage visual feedback works), but they continue to exist in the scene and keep moving.

## What We've Tried

### 1. Added Debug Logging
- **DamageSystem.js line 162**: Added console.log when entity dies
- **Engine.js line 119**: Added console.log when entity is removed
- **RenderSystem.js line 45**: Added console.log when mesh is removed

### 2. Fixed RenderSystem
- **RenderSystem.js line 44**: Added check for `entity.shouldRemove` flag
- RenderSystem now checks inactive entities AND entities marked for removal

### 3. Fixed DamageSystem Death Check
- **DamageSystem.js line 75**: Added null check for `health` component
- Changed from `if (health.enabled && ...)` to `if (health && health.enabled && ...)`

### 4. Increased Player Damage
- **DamageSystem.js line 28**: Increased player damage from 10 to 50 for faster testing

## Current Console Output
```
DamageSystem: 1 hit Shadow Lurker for 50 damage (100 -> 50)
DamageSystem: 1 hit Shadow Lurker for 50 damage (50 -> 0)
```

**MISSING:** We never see "DamageSystem: [enemy] died" message, which means `handleDeath()` is never being called!

## Code Flow

### DamageSystem.process() (lines 43-79)
```javascript
1. Update invincibility timers (lines 44-52)
2. Process damage from collisions (lines 54-70)
   - Loops through entities with Health + Collider
   - Skips if health <= 0 (line 60)
3. Handle death (lines 72-78)
   - Loops through ALL entities
   - Checks: health && health.enabled && health.current <= 0 && !health.isDead
   - Calls handleDeath()
```

### handleDeath() (lines 158-169)
```javascript
- Sets health.isDead = true
- Logs "DamageSystem: [name] died"
- Emits death event
- Calls entity.destroy()
```

### entity.destroy() (Entity.js lines 139-142)
```javascript
- Sets entity.active = false
- Sets entity.shouldRemove = true
```

### Engine.update() (Engine.js lines 107-129)
```javascript
1. Calls this.onUpdate(dt) -> Game.update() -> All systems run
2. Loops through entities backwards
3. Removes entities where: !entity.active && entity.shouldRemove
```

## The Bug

The death check loop (DamageSystem.js lines 72-78) is iterating over ALL entities, but it's checking `health.current <= 0`. However, the entities that just took damage might not be included in this loop properly, OR there's an issue with how the ComponentSystem is filtering entities.

## Key Files

### /Users/majling/Development/its-just-fine/v2/src/systems/combat/DamageSystem.js
- Line 28: playerDamage = 50
- Line 43: process() method
- Line 55-70: Damage application loop (works - we see damage messages)
- Line 72-78: Death handling loop (NOT WORKING - no "died" messages)
- Line 158: handleDeath() method

### /Users/majling/Development/its-just-fine/v2/src/core/ecs/ComponentSystem.js
Check how `update()` filters entities! The issue might be that the death loop uses `entities` directly instead of the filtered entities from the ComponentSystem.

### /Users/majling/Development/its-just-fine/v2/src/systems/render/RenderSystem.js
- Line 44: Checks for entity.shouldRemove
- Line 45: Debug logging for mesh removal

### /Users/majling/Development/its-just-fine/v2/src/core/engine/Engine.js
- Line 118-121: Entity removal logic

## Next Steps to Debug

1. **Check ComponentSystem.js** - How does it filter entities? The death loop might be receiving a different set of entities than expected.

2. **Add more debug logging** in DamageSystem death loop:
```javascript
// Handle death
console.log(`DamageSystem: Checking ${entities.length} entities for death`);
for (const entity of entities) {
  const health = entity.getComponent('Health');
  if (health) {
    console.log(`  Entity ${entity.id}: health=${health.current}, isDead=${health.isDead}`);
  }
  if (health && health.enabled && health.current <= 0 && !health.isDead) {
    this.handleDeath(entity);
  }
}
```

3. **Check if entities array is correct** - Maybe the entities passed to the death loop don't include enemies?

4. **Verify Health component exists** - Maybe enemies don't have Health components properly initialized?

## System Order
From main.js lines 208-229:
1. PlayerInputSystem
2. AISystem
3. SpawnSystem
4. MovementSystem
5. CollisionSystem
6. DamageSystem ← Problem is here
7. RenderSystem

## Hypothesis
The `entities` array passed to DamageSystem.process() might not include all enemies, OR there's something wrong with how ComponentSystem filters entities. The first loop (damage application) works fine because it iterates over `this.entities` (ComponentSystem's filtered list), but the second loop (death handling) uses the `entities` parameter directly.

Check ComponentSystem.js to see if there's a mismatch!

## Immediate Action Plan

### Step 1: Add Comprehensive Debug Logging
Add this to DamageSystem.js right before line 72:

```javascript
// Handle death
console.log(`=== Death Check: ${entities.length} total entities ===`);
for (const entity of entities) {
  const health = entity.getComponent('Health');
  if (health) {
    console.log(`  Entity ${entity.id} (${entity.displayName}): health=${health.current}/${health.max}, isDead=${health.isDead}, enabled=${health.enabled}`);
  }
}
```

This will show us:
- How many entities are being checked
- Which entities have Health components
- What their current health values are
- Whether isDead flag is set

### Step 2: Check ComponentSystem.js
Read `/Users/majling/Development/its-just-fine/v2/src/core/ecs/ComponentSystem.js` and verify:
1. How does `update()` filter entities?
2. Does it pass ALL entities or only filtered ones?
3. Is there a method to get all entities vs filtered entities?

The issue might be that ComponentSystem only passes entities WITH the required components (Health + Collider), but some entities might have Health but NOT Collider after they die.

### Step 3: Verify the Fix
The likely issue is that **the death loop should NOT iterate over the filtered `entities` parameter**. It should iterate over ALL entities from the engine.

Change DamageSystem.js line 72-78 to iterate over all entities, not just filtered ones. We might need to pass the full entity list separately or access it differently.

### Step 4: Alternative Solution
If ComponentSystem is the issue, we can bypass it entirely. Move the death check OUTSIDE of the ComponentSystem's process method:

**Option A: Make DamageSystem handle death differently**
```javascript
// In main.js, after damageSystem.update():
this.damageSystem.update(dt, this.engine.entities);
this.damageSystem.handleDeaths(this.engine.entities); // New method
```

**Option B: Check death in a separate system**
Create a DeathSystem that only checks for dead entities and removes them.

### Step 5: Quick Fix to Test Theory
Before doing anything complex, add this ONE line of debug logging to verify if the loop even runs:

In DamageSystem.js line 72, add:
```javascript
// Handle death
console.log(`DamageSystem: Checking ${entities.length} entities for death`);
for (const entity of entities) {
```

If this prints and shows entities.length > 0, then the loop runs but the condition fails.
If this never prints, then the death handling code is never reached.

## Most Likely Root Cause

Looking at ComponentSystem pattern, it probably filters entities to only those WITH the required components (Health + Collider). When an enemy takes damage to 0:
1. Health.current = 0
2. ComponentSystem sees entity has Health + Collider
3. Entity is included in damage loop
4. BUT... if something disables the Collider or Health component, the entity might be filtered OUT of the next frame's entity list
5. Death loop never sees the entity

**THE FIX:** Death handling should check ALL entities, not just those with Health + Collider. We need to access the full entity list from Engine, not the filtered list from ComponentSystem.

---

## After Fixing Entity Removal Bug - Continue with the Plan!

Once enemies properly disappear when killed, we continue with **Phase 4: Systems Migration**

### Remaining Tasks from Todo List

1. ✅ Design comprehensive config architecture
2. ✅ Update ARCHITECTURE_REFACTOR.md with config details
3. ✅ Design spawn config structure with all features
4. ✅ Create example spawn configuration files
5. ✅ Create SpawnSystem based on config
6. ✅ Integrate SpawnSystem into main game loop
7. ✅ Fix AI behavior fallbacks for unimplemented behaviors
8. ✅ Fix aggro range vs spawn distance issue
9. ✅ Design Collider component for collision detection
10. ✅ Create CollisionSystem for entity collision detection
11. ✅ Create DamageSystem for combat damage
12. ✅ Add Collider components to player and enemies
13. ✅ Integrate collision and damage into game loop
14. ✅ Test collision and damage systems
15. ✅ Add collision resolution mode to Collider component
16. ✅ Update enemy colliders to collide with each other
17. ✅ Refactor collision properties (isSolid, bounciness)
18. 🔄 **Fix entity removal bug** ← Currently working on this
19. ⏳ Write tests for SpawnSystem
20. ⏳ Document SpawnSystem code

### Next Systems to Migrate (After Bug Fix)

According to ARCHITECTURE_REFACTOR.md, we still need to migrate:

#### High Priority Systems
1. **WeaponSystem** - Player weapon mechanics (ranged/melee)
   - Create Weapon component
   - Create WeaponSystem
   - Handle shooting/attacking input
   - Create projectile entities
   - Integrate with DamageSystem

2. **ProjectileSystem** - Projectile movement and collision
   - Create Projectile component
   - Handle projectile lifetime
   - Integrate with CollisionSystem for hit detection

3. **UISystem** - HUD rendering (health, ammo, wave info)
   - Create UI components
   - Health bars
   - Wave counter
   - Score display

#### Medium Priority Systems
4. **AudioSystem** - Sound effects and music
5. **ParticleSystem** - Visual effects (explosions, hits, etc.)
6. **PowerupSystem** - Collectible powerups

#### Low Priority (Polish)
7. **CameraSystem** - Camera shake, follow player
8. **PostProcessingSystem** - Visual effects (bloom, vignette)

### Immediate Next Steps After Bug Fix

1. **Clean up debug logging** - Remove temporary console.logs from:
   - DamageSystem.js
   - Engine.js
   - RenderSystem.js

2. **Test gameplay** - Verify:
   - Enemies spawn correctly ✅
   - Player can move ✅
   - Enemies chase player ✅
   - Collision works ✅
   - Damage is applied ✅
   - Enemies disappear when killed ← Need to fix
   - Wave system progresses
   - Multiple enemy types work

3. **Implement WeaponSystem** - This is critical for gameplay:
   - Player currently damages enemies by touching them (melee)
   - Need to add shooting mechanic
   - Create Weapon component with properties:
     - weaponType (pistol, rifle, shotgun, etc.)
     - damage
     - fireRate
     - range
     - ammo/magazine
   - Create ProjectileSystem for bullets

4. **Update DamageSystem** - Add projectile damage:
   - Currently only handles collision-based damage
   - Need to handle projectile hits
   - Keep invincibility frames
   - Add damage types (melee, projectile, explosive)

### Architecture Notes

- **Config-driven design** - Keep using JSON configs for weapons, projectiles
- **ECS pattern** - All new systems should extend ComponentSystem
- **Event-driven** - Use CustomEvents for cross-system communication
- **Performance** - Use spatial partitioning where needed

### Reference Files

**IMPORTANT: Read these files to understand the full context**

1. **Architecture Document** (READ THIS FIRST!)
   - Path: `/Users/majling/Development/its-just-fine/v2/docs/ARCHITECTURE_REFACTOR.md`
   - Contains: Full v2 refactor plan, ECS architecture, system design patterns
   - **Action:** Use the Read tool to load this file at the start of the session

2. **Main Game Loop**
   - Path: `/Users/majling/Development/its-just-fine/v2/src/main.js`
   - Contains: System initialization and update order

3. **Config Examples**
   - Spawn configs: `/Users/majling/Development/its-just-fine/v2/config/spawn/`
   - Enemy configs: `/Users/majling/Development/its-just-fine/v2/config/enemies/`

4. **Key Source Files**
   - DamageSystem: `/Users/majling/Development/its-just-fine/v2/src/systems/combat/DamageSystem.js`
   - ComponentSystem: `/Users/majling/Development/its-just-fine/v2/src/core/ecs/ComponentSystem.js`
   - Engine: `/Users/majling/Development/its-just-fine/v2/src/core/engine/Engine.js`

---

## Summary

**Current Status:** Entity removal bug in DamageSystem - enemies don't disappear when health reaches 0

**Current Task:** Fix the death handling loop to properly check all entities

**Next Task:** Implement WeaponSystem and ProjectileSystem for ranged combat

**Overall Goal:** Complete v2 ECS refactor with all game systems migrated
