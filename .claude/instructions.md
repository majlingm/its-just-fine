# Claude Code Instructions for "Its Just Fine"

## Project Overview

**Its Just Fine** is a 3D bullet-heaven/vampire-survivors-like game built with Three.js, supporting web, desktop (Electron), and mobile (Capacitor/Android/iOS) platforms.

## Architecture Refactoring

🚧 **ACTIVE REFACTORING IN PROGRESS** 🚧

This project is undergoing a major architectural refactoring to improve modularity, reusability, and enable configuration-driven game design.

### ⚠️ CRITICAL: Two Codebases in Parallel

**OLD CODE** (existing game - still running):
- `src/engine/GameEngine.js` - Original game engine
- `src/engine/DustAndDynamiteGame.js` - Original game logic
- `src/entities/Entity.js`, `Enemy.js`, `BossEnemy.js` - Old entity system
- `src/systems/` - Old game systems (WaveSystem, etc.)

**NEW CODE** (refactored - being built):
- `src/core/` - New engine (Engine, Renderer, InputManager, EntityManager, ECS)
- `src/components/` - New ECS components (Transform, Health, Movement, Renderable, AI)
- `src/systems/entity/EntityFactory.js` - New entity creation
- `src/config/entities/` - New JSON configurations
- `src/utils/ConfigLoader.js` - New config loader

**⚠️ DO NOT MIX**: Keep old and new code separate. Document which system you're working on.

### Key Documents

- **`ARCHITECTURE_REFACTOR.md`**: Complete refactoring plan, schemas, and progress tracking
- **Always update this document** when completing tasks or making architectural decisions

### Refactoring Goals

1. **Separate Core Engine from Game Logic**: Reusable engine for other projects
2. **Renderer Abstraction**: Decouple Three.js from game logic
3. **Configuration-Driven Design**: All enemies, bosses, levels, waves in JSON
4. **Entity Component System (ECS)**: Replace inheritance with composition
5. **Modular Systems**: Independent, testable game systems

### Current Phase

**Phase 0: Planning** ✓ Complete
- Architecture plan documented in `ARCHITECTURE_REFACTOR.md`
- Migration strategy defined
- Configuration schemas designed

**Next Phase: Phase 1 - Core Engine Separation**
- Extract GameEngine.js → core/engine/Engine.js
- Create Renderer.js wrapper
- Create InputManager.js
- Create EntityManager.js

## Development Guidelines

### When Making Changes

1. **Check ARCHITECTURE_REFACTOR.md first**: Ensure changes align with refactoring plan
2. **Update progress**: Mark tasks as completed in the document
3. **Follow new architecture**: Use ECS patterns when creating new code
4. **Document decisions**: Add notes to the architecture document
5. **Test thoroughly**: Ensure changes don't break existing functionality

### Code Organization Principles

- **Core engine** (`core/`): Platform-agnostic, reusable across projects
- **Systems** (`systems/`): Game systems that process components
- **Components** (`components/`): Pure data, no logic
- **Behaviors** (`behaviors/`): Reusable AI scripts
- **Config** (`config/`): All game content defined in JSON

### Configuration Files

All new enemies, bosses, spells, levels should be added to JSON configs:
- `config/entities/enemies.json` - Enemy definitions
- `config/entities/bosses.json` - Boss configurations
- `config/spells/spells.json` - Spell definitions
- `config/levels/*.json` - Level configurations
- `config/waves/*.json` - Wave definitions

### ECS Pattern

When creating new entities, use component composition:

```javascript
// ✓ GOOD: Use EntityFactory with components
const enemy = entityFactory.create('shadow_lurker', {
  components: [
    { type: 'Transform', x: 10, z: 20 },
    { type: 'Health', max: 100 },
    { type: 'Movement', speed: 5 },
    { type: 'AI', behavior: 'chase_player' }
  ]
});

// ✗ BAD: Don't use inheritance
class SpecificEnemy extends Enemy { ... }
```

### Temporary Code Markers

Current temporary changes in codebase:
- **survival.js**: Spawn rate increased for testing (search for `// TEMPORARY`)
- **WaveSystem.js**: Spawn distance reduced for testing (search for `// TEMPORARY`)
- **DustAndDynamiteGame.js**: Spawn distance reduced for testing (search for `// TEMPORARY`)

**Note**: These should be reverted before production deployment.

## Testing

- Run `npm run dev` for web development
- Run `npm run electron` for desktop testing
- Run `npm run android:build` for Android build
- Run `npm run android:distribute` to deploy to Firebase App Distribution

## Deployment

### Web
- `npm run build` - Build for production
- Deploy to GitHub Pages or Firebase Hosting

### Mobile (Android)
- `npm run android:distribute` - Build and upload to Firebase App Distribution
- Testers automatically notified

## Important Files

### Core Architecture
- `src/engine/GameEngine.js` - Main game engine (to be refactored)
- `src/engine/DustAndDynamiteGame.js` - Game-specific logic (to be refactored)

### Entity System (Current - to be replaced by ECS)
- `src/entities/Entity.js` - Base entity class
- `src/entities/Player.js` - Player entity
- `src/entities/Enemy.js` - Enemy entity (stats will move to JSON)
- `src/entities/BossEnemy.js` - Boss entity (will move to JSON)

### Spell System (Partially refactored)
- `src/spells/SpellRegistry.js` - Spell registration
- `src/spells/spellData.json` - Spell configurations ✓ Already config-driven
- `src/spells/spells/*.js` - Spell implementations

### Level System
- `src/levels/*.js` - Level configurations (will move to JSON)
- `src/systems/WaveSystem.js` - Wave spawning logic
- `src/systems/LevelSystem.js` - Level loading

### Object Pooling
- `src/systems/TypedProjectilePool.js` - Projectile pooling
- `src/systems/EnemyProjectilePool.js` - Enemy projectile pooling
- `src/systems/PickupPool.js` - Pickup pooling

## Common Tasks

### Adding a New Enemy Type

**Current Method** (will be deprecated):
1. Edit `src/entities/Enemy.js`
2. Add hardcoded stats for new type

**Future Method** (use this for new content):
1. Add entry to `config/entities/enemies.json`:
```json
{
  "new_enemy": {
    "displayName": "New Enemy",
    "health": 150,
    "speed": 4.0,
    "damage": 20,
    "model": "enemy_model",
    "ai": { "behavior": "chase_player" }
  }
}
```
2. Add 3D model to assets
3. Done! No code changes needed.

### Adding a New Boss

**Future Method**:
1. Add to `config/entities/bosses.json` with phases and abilities
2. Add 3D model and effects
3. Register in wave configuration

### Creating a New Level

**Future Method**:
1. Create `config/levels/new_level.json`
2. Define environment, boundaries, wave config
3. Reference wave configuration file
4. Add to level selection menu

## Performance Considerations

- **Object Pooling**: Always use pools for projectiles, particles, enemies
- **Instanced Rendering**: Use InstancedParticlePool for particle effects
- **Frustum Culling**: Engine only updates visible entities
- **Spatial Partitioning**: Will be implemented in Phase 4

## Current Known Issues

- Entity count can grow if projectiles aren't properly pooled
- Timestamp expiration system implemented for off-screen projectiles
- Memory leaks fixed in TypedProjectilePool (added engine.removeEntity)

## Update Strategy

When working on refactoring:

1. **Always update ARCHITECTURE_REFACTOR.md**:
   - Mark tasks as completed ✓
   - Update progress percentages
   - Add notes about decisions made
   - Document any blockers or issues

2. **Keep both systems running during migration**:
   - Don't delete old code until new system is proven
   - Use feature flags if needed
   - Test thoroughly at each phase

3. **Document breaking changes**:
   - Note in ARCHITECTURE_REFACTOR.md
   - Add to migration guide
   - Consider backwards compatibility

## Questions & Decisions

Track important decisions in `ARCHITECTURE_REFACTOR.md` under "Notes & Decisions" section with date.

## Resources

- [Three.js Docs](https://threejs.org/docs/)
- [ECS Architecture](https://github.com/SanderMertens/ecs-faq)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

---

---

## Documentation Maintenance Protocol

### Module Documentation Structure

**IMPORTANT**: Only document NEW refactored code. Do NOT create README files for old code.

Each major NEW module/subsystem MUST have a `README.md` in its directory:

```
src/
├── core/                       # NEW - Document these
│   ├── README.md              # ✅ Core engine overview
│   ├── engine/README.md       # ✅ Engine subsystem (NEW)
│   ├── ecs/README.md          # ✅ ECS subsystem (NEW)
│   ├── renderer/README.md     # ✅ Renderer subsystem (NEW)
│   ├── input/README.md        # ✅ Input subsystem (NEW)
├── components/README.md       # ✅ NEW ECS Components
├── systems/
│   ├── entity/README.md       # ✅ NEW EntityFactory
│   ├── WaveSystem.js          # ❌ OLD - Don't document
│   ├── LevelSystem.js         # ❌ OLD - Don't document
├── config/README.md           # ✅ NEW Configuration schemas
├── utils/README.md            # ✅ NEW Utilities (ConfigLoader)
├── engine/                     # ❌ OLD - Don't document
│   ├── GameEngine.js          # ❌ OLD
│   └── DustAndDynamiteGame.js # ❌ OLD
├── entities/                   # ❌ OLD - Don't document
│   ├── Entity.js              # ❌ OLD
│   ├── Enemy.js               # ❌ OLD
│   └── BossEnemy.js           # ❌ OLD
```

**Rule**: Only document code in:
- `src/core/` (all new engine code)
- `src/components/` (new ECS components)
- `src/systems/entity/` (new EntityFactory)
- `src/config/` (new JSON configs)
- `src/utils/ConfigLoader.js` (new config loader)

### Documentation Requirements

**MANDATORY**: When you (Claude) create or modify code:

1. **Read First**: Check if `README.md` exists in the module directory
2. **Update Always**: Modify the README.md in the same session as code changes
3. **Be Complete**: Update all relevant sections (API, examples, known issues)
4. **Update Date**: Change "Last Updated" field to current date
5. **Update Status**: Reflect current state (Active/Refactoring/Testing/Complete)

### README Template

Each README.md should contain:

```markdown
# [Module Name]

**Status**: [Active/Refactoring/Deprecated/Complete]
**Last Updated**: YYYY-MM-DD
**Phase**: [Phase 1/2/3 from ARCHITECTURE_REFACTOR.md]
**Test Coverage**: [Percentage from vitest]

## Overview
What this module does and why it exists.

## Current State
- ✅ Implemented features
- ✅ Test coverage status
- ⚠️ Integration status
- ❌ Known limitations

## How It Works
Detailed explanation of implementation and design decisions.

## API Reference
Public classes, methods, and interfaces with type signatures.

## Usage Examples
Code examples showing common usage patterns.

## Testing
- Test file location
- How to run tests
- Coverage information

## Related Files
Links to dependencies and related documentation.

## Known Issues
Current bugs, limitations, and planned improvements.

## Change Log
Recent changes (most recent first).
```

### When to Update Documentation

**ALWAYS** update README.md when:
- ✅ Creating new files or modules
- ✅ Modifying public APIs
- ✅ Adding new features
- ✅ Refactoring code
- ✅ Fixing bugs that change behavior
- ✅ Updating tests
- ✅ Completing refactoring phases

### Critical Rules for Claude

❗ **NEVER** modify code without checking for README.md
❗ **ALWAYS** update README.md in the same session as code changes
❗ **ALWAYS** update "Last Updated" and "Status" fields
❗ **NEVER** leave documentation inconsistent with code
❗ **ALWAYS** document breaking changes prominently
❗ **ALWAYS** update test coverage information after running tests

### Quick Commands for Documentation

```bash
# Find all documentation
find src -name "README.md"

# Check documentation age
find src -name "README.md" -exec grep "Last Updated" {} \;

# Generate documentation list
find src -name "README.md" | sort
```

---

**Last Updated**: 2025-10-15
**Current Phase**: Phase 3 Complete (Configuration System), Phase 4 Next (Systems Migration)
