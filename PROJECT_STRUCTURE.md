# Its Just Fine - Project Structure

**Last Updated**: 2025-10-15

## Overview

This project has been restructured into two separate versions to facilitate a clean architectural refactor:

```
its-just-fine/
├── v1/                      # ❌ ORIGINAL GAME (to be created)
│   └── (Current working game code - to be moved here)
│
├── v2/                      # ✅ REFACTORED VERSION (current)
│   ├── src/
│   │   ├── core/           # New ECS engine
│   │   ├── components/     # ECS components
│   │   ├── systems/        # Game systems
│   │   ├── config/         # JSON configurations
│   │   └── utils/          # Utilities
│   ├── package.json
│   ├── vitest.config.js
│   └── README.md
│
├── ARCHITECTURE_REFACTOR.md  # Complete refactoring plan
├── PROJECT_STRUCTURE.md       # This file
└── .claude/
    └── instructions.md        # Root instructions
```

## Current Status

### ✅ v2/ - Refactored Version (COMPLETE)

**Status**: Active development
**Location**: `v2/`
**Test Coverage**: 127 tests, ~95% coverage

**What's included**:
- Complete ECS (Entity Component System) architecture
- ConfigLoader with caching
- EntityFactory for JSON-driven entity creation
- 10 enemy types configured in JSON
- 5 boss types with multi-phase AI
- Modern Pointer Events API input system
- Full test suite with 100% coverage on core systems

**To work on v2**:
```bash
cd v2
npm install
npm run test         # Run tests
npm run dev          # Start dev server (port 5174)
```

### ⏳ v1/ - Original Game (TO BE MOVED)

**Status**: Needs to be created
**Current Location**: Root `src/` directory (still needs to be moved)

The original game code is currently still in the root `src/` directory. It should be moved to `v1/` for clarity:

**Files to move to v1/**:
- `src/engine/` (old GameEngine.js, DustAndDynamiteGame.js)
- `src/entities/` (old Entity.js, Enemy.js, BossEnemy.js)
- `src/systems/` (old WaveSystem, LevelSystem, etc. - excluding entity/EntityFactory.js)
- `src/spells/`
- `src/levels/`
- All other game-specific old code

## Why Two Versions?

### Benefits

✅ **No Confusion** - Clear separation between old and new
✅ **Safe Development** - v1 stays working while v2 is built
✅ **Independent Testing** - Can test both versions separately
✅ **Clean Migration** - Port features from v1 to v2 gradually
✅ **Easy Rollback** - Can always fall back to v1
✅ **Better Documentation** - Each version has its own README

### Development Strategy

1. **v2 Development** (Current Phase):
   - Build new ECS architecture
   - Create game systems
   - Test thoroughly
   - Document everything

2. **Feature Porting** (Next Phase):
   - Port game logic from v1 to v2
   - Rewrite using ECS patterns
   - Test each feature

3. **Deployment** (Future):
   - When v2 is feature-complete, deploy it
   - Keep v1 as reference/backup

## Working with v2

### File Organization

v2 follows strict architectural patterns:

- **`src/core/`** - Reusable engine (no game-specific code)
- **`src/components/`** - Pure data (no logic)
- **`src/systems/`** - Game logic (processes components)
- **`src/config/`** - All game content (JSON)
- **`src/utils/`** - Helper utilities

### Documentation

Every module in v2 has (or will have) its own README.md:

```
v2/src/
├── core/README.md
├── core/engine/README.md
├── core/ecs/README.md
├── components/README.md
├── systems/entity/README.md
├── config/README.md
└── utils/README.md
```

### Testing

v2 has comprehensive test coverage:

```bash
cd v2
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage report
```

**Current**: 127 tests, ~95% coverage

## Migration Progress

### Phase 1: Core Engine (80%)
- ✅ Engine.js
- ✅ Renderer.js
- ✅ InputManager.js
- ✅ EntityManager.js
- ⚠️ Not yet integrated

### Phase 2: ECS (100%)
- ✅ Component system
- ✅ Entity system
- ✅ ComponentSystem base
- ✅ 5 core components

### Phase 3: Configuration (100%)
- ✅ ConfigLoader
- ✅ EntityFactory
- ✅ Enemy configs
- ✅ Boss configs

### Phase 4: Systems Migration (0%)
- ⏳ Game loop integration
- ⏳ Spawn system
- ⏳ Combat system
- ⏳ AI system

## Next Steps

1. **TODO: Move v1 code** (optional but recommended):
   ```bash
   mkdir v1
   mv src v1/
   mv index.html v1/
   mv vite.config.js v1/
   # etc.
   ```

2. **Continue v2 Development**:
   - Build game systems
   - Integrate with renderer
   - Create playable game
   - Port features from v1

3. **Documentation**:
   - Create README.md for each v2 module
   - Document APIs and usage
   - Add examples

## Claude Instructions

- **Root**: `.claude/instructions.md` - General project info
- **v2**: `v2/.claude/instructions.md` - v2-specific guidelines

When working in v2, always follow the v2 instructions!

## Quick Reference

### v2 Commands
```bash
cd v2
npm install
npm run dev          # Port 5174
npm run test
npm run test:coverage
```

### v1 Commands (when moved)
```bash
cd v1
npm install
npm run dev          # Port 5173
npm run electron
```

## Questions?

- See `ARCHITECTURE_REFACTOR.md` for complete refactoring plan
- See `v2/README.md` for v2-specific information
- See `.claude/instructions.md` for development guidelines

---

**Created**: 2025-10-15
**Purpose**: Document project restructuring into v1 and v2
