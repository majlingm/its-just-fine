# Claude Code Instructions for Its Just Fine - v2 (Refactored)

## Project Overview

**Its Just Fine v2** is the refactored version of the game, built from the ground up with:
- Entity Component System (ECS) architecture
- Configuration-driven design (JSON configs)
- Clean separation between engine and game logic
- 100% test coverage on core systems

## ⚠️ Important: This is v2 (NEW CODE ONLY)

**You are working in the v2/ directory** - the refactored codebase.

- ✅ This folder contains ONLY the new refactored code
- ❌ Do NOT reference or import anything from `../v1/` or `../src/`
- ✅ v2 is a clean slate with its own package.json and dependencies
- ✅ All code here follows ECS architecture patterns

## Architecture

### Core Principles

1. **Entity Component System**: Composition over inheritance
2. **Configuration-Driven**: All game content in JSON
3. **Separation of Concerns**: Engine vs Game Logic
4. **Test-Driven**: 100% coverage on core systems
5. **Documentation**: Every module has README.md

### Directory Structure

```
v2/
├── src/
│   ├── core/               # Reusable game engine
│   │   ├── engine/        # Game loop, EntityManager
│   │   ├── ecs/           # ECS core (Component, Entity, System)
│   │   ├── renderer/      # Three.js wrapper
│   │   └── input/         # Input management (Pointer Events API)
│   ├── components/         # ECS Components (pure data)
│   │   ├── Transform.js
│   │   ├── Health.js
│   │   ├── Movement.js
│   │   ├── Renderable.js
│   │   └── AI.js
│   ├── systems/
│   │   └── entity/EntityFactory.js  # Create entities from JSON
│   ├── config/
│   │   └── entities/      # JSON configurations
│   │       ├── enemies.json
│   │       └── bosses.json
│   └── utils/
│       └── ConfigLoader.js
├── package.json
├── vite.config.js
└── vitest.config.js
```

## Development Guidelines

### When Making Changes

1. **Read documentation first**: Check if README.md exists in the module
2. **Write tests**: All new code must have unit tests
3. **Update documentation**: Modify README.md when changing code
4. **Run tests**: `npm run test:coverage` before committing
5. **Update README.md**: Keep "Last Updated" current

### ECS Pattern

**Always use components and systems**:

```javascript
// ✅ GOOD: Component composition
const enemy = await entityFactory.createEnemy('shadow_lurker', {
  x: 10, z: 20
});

// ❌ BAD: Never use class inheritance
class SpecificEnemy extends Enemy { }
```

### Configuration Pattern

**Always define content in JSON**:

```javascript
// ✅ GOOD: Load from config
const config = await configLoader.getEnemy('flame_imp');

// ❌ BAD: Never hardcode stats
const enemy = { health: 100, speed: 5 };
```

## Documentation Protocol

### MANDATORY: README.md for Each Module

**Every directory in `src/` MUST have a README.md**:

- `src/core/README.md`
- `src/core/engine/README.md`
- `src/core/ecs/README.md`
- `src/core/renderer/README.md`
- `src/core/input/README.md`
- `src/components/README.md`
- `src/systems/entity/README.md`
- `src/config/README.md`
- `src/utils/README.md`

### README Template

```markdown
# [Module Name]

**Status**: [Active/Testing/Complete]
**Last Updated**: YYYY-MM-DD
**Test Coverage**: [Percentage]

## Overview
What this module does.

## Current State
- ✅ Implemented features
- ✅ Test coverage
- ⚠️ Known limitations

## How It Works
Implementation details.

## API Reference
Public interfaces with examples.

## Usage Examples
Real code examples.

## Testing
- Test file: `[ModuleName].test.js`
- Coverage: XX%
- Run: `npm run test:coverage`

## Related Files
Links to dependencies.

## Known Issues
Current limitations.

## Change Log
Recent changes.
```

### When to Update Documentation

**ALWAYS update README.md when you:**
- Create new files
- Modify public APIs
- Add features
- Fix bugs that change behavior
- Complete refactoring work
- Update tests

### Critical Rules for Claude

❗ **NEVER** modify code without updating README.md
❗ **ALWAYS** write tests for new code
❗ **ALWAYS** update "Last Updated" field
❗ **ALWAYS** maintain test coverage above 90%
❗ **NEVER** import from ../v1/ or ../src/

## Testing

### Run Tests

```bash
# All tests
npm run test

# With UI
npm run test:ui

# With coverage
npm run test:coverage

# Watch mode
npm test
```

### Test Requirements

- **Unit tests required** for all new code
- **Coverage target**: 90%+ on all modules
- **Test naming**: `[ModuleName].test.js`
- **Test location**: Same directory as source file

### Current Test Status

✅ **127 tests passing**
- Phase 1 (Core Engine): 36 tests, ~95% coverage
- Phase 2 (ECS): 49 tests, ~97% coverage
- Phase 3 (Config): 42 tests, 100% coverage

## Common Tasks

### Adding a New Component

1. Create `src/components/NewComponent.js`
2. Extend `Component` base class
3. Create `src/components/NewComponent.test.js`
4. Update `src/components/README.md`
5. Register in EntityFactory if needed

### Adding a New Enemy Type

1. Edit `src/config/entities/enemies.json`
2. Add entry with all properties
3. Done! No code changes needed.

### Adding a New System

1. Create `src/systems/[category]/NewSystem.js`
2. Extend `ComponentSystem` base class
3. Define required components
4. Implement `process(dt, entities)`
5. Create tests
6. Update documentation

## Current Phase

**Phase 4: Systems Migration** (In Progress)

Next steps:
1. Build game systems (spawn, combat, AI)
2. Integrate with renderer
3. Create playable game loop
4. Port features from v1

## Reference Documents

- `../ARCHITECTURE_REFACTOR.md` - Complete refactoring plan
- `README.md` - v2 project overview
- `../v1/` - Original game (reference only, don't import)

## Quick Commands

```bash
# Development
cd v2
npm install
npm run dev         # Start on port 5174

# Testing
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage  # With coverage

# Find documentation
find src -name "README.md"
```

## Critical Reminders

- ✅ You are in **v2/** - new refactored code
- ❌ Never import from **../v1/** or **../src/**
- ✅ Use ECS patterns (components + systems)
- ✅ Define content in JSON configs
- ✅ Write tests for everything
- ✅ Update README.md when changing code
- ✅ Maintain 90%+ test coverage

---

**Last Updated**: 2025-10-15
**Version**: 2.0.0
**Phase**: 4 (Systems Migration)
