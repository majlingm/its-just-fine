# Its Just Fine - v2 (Refactored)

**Status**: Active Development
**Version**: 2.0.0
**Architecture**: Entity Component System (ECS)

## Overview

This is the refactored version of Its Just Fine, rebuilt from the ground up with a modern ECS architecture, configuration-driven design, and complete separation between engine and game logic.

## Architecture

- **Core Engine** (`src/core/`) - Reusable, platform-agnostic game engine
- **ECS System** (`src/core/ecs/`) - Entity Component System implementation
- **Components** (`src/components/`) - Pure data components
- **Systems** (`src/systems/`) - Game logic that processes components
- **Configuration** (`src/config/`) - JSON-driven game content

## Current Status

### ✅ Completed (Phase 1-3)

- **Phase 1**: Core Engine Separation (80%)
  - ✅ Engine.js - Game loop and entity management
  - ✅ Renderer.js - Three.js abstraction
  - ✅ InputManager.js - Modern Pointer Events API
  - ✅ EntityManager.js - Entity lifecycle and pooling
  - ⚠️ Not yet integrated into game

- **Phase 2**: Entity Component System (100%)
  - ✅ Component base class with serialization
  - ✅ ComponentSystem base class with filtering
  - ✅ Entity class with component management
  - ✅ 5 core components (Transform, Health, Movement, Renderable, AI)

- **Phase 3**: Configuration System (100%)
  - ✅ ConfigLoader with caching
  - ✅ EntityFactory for JSON-driven entities
  - ✅ 10 enemy types in JSON
  - ✅ 5 boss types with multi-phase AI

### 🚧 In Progress

- **Phase 4**: Systems Migration
  - Integrate new engine into game
  - Migrate game systems to ECS
  - Build actual playable game

## Project Structure

```
v2/
├── src/
│   ├── core/               # NEW Engine
│   │   ├── engine/        # Game loop, EntityManager
│   │   ├── ecs/           # ECS core (Component, Entity, System)
│   │   ├── renderer/      # Three.js wrapper
│   │   └── input/         # Input management
│   ├── components/         # ECS Components
│   │   ├── Transform.js
│   │   ├── Health.js
│   │   ├── Movement.js
│   │   ├── Renderable.js
│   │   └── AI.js
│   ├── systems/
│   │   └── entity/        # EntityFactory
│   ├── config/
│   │   └── entities/      # JSON configs
│   └── utils/
│       └── ConfigLoader.js
├── package.json
├── vite.config.js
├── vitest.config.js
└── README.md (this file)
```

## Getting Started

### Install Dependencies

```bash
cd v2
npm install
```

### Run Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Development

```bash
# Start dev server (port 5174)
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

## Test Coverage

**127 tests passing** with ~95% coverage:

- Phase 1 (Core Engine): 36 tests
- Phase 2 (ECS): 49 tests
- Phase 3 (Config): 42 tests

Key coverage:
- ✅ ConfigLoader: 100%
- ✅ EntityFactory: 100%
- ✅ Engine: 100%
- ✅ Entity: 100%
- ✅ Component: 98.87%

## Usage Examples

### Creating Entities from Config

```javascript
import { entityFactory } from './systems/entity/EntityFactory.js';

// Create enemy from JSON config
const enemy = await entityFactory.createEnemy('shadow_lurker', {
  x: 10,
  z: 20
});

// Create boss with overrides
const boss = await entityFactory.createBoss('inferno_dragon', {
  health: 15000
});

// Batch create enemies
const enemies = await entityFactory.createEnemies('flame_imp', 5,
  (i) => ({ x: i * 10, z: i * 5 })
);
```

### Using the Engine

```javascript
import { Engine } from './core/engine/Engine.js';
import { Renderer } from './core/renderer/Renderer.js';

const engine = new Engine();
const renderer = new Renderer();

renderer.init(canvas);

engine.start({
  onUpdate: (dt) => {
    // Game logic
  },
  onRender: () => {
    renderer.render();
  }
});
```

## Documentation

Each subsystem has its own README.md:

- [Core Engine](src/core/README.md) - Coming soon
- [ECS System](src/core/ecs/README.md) - Coming soon
- [Components](src/components/README.md) - Coming soon
- [Configuration](src/config/README.md) - Coming soon

## Configuration Files

All game content is defined in JSON:

- `config/entities/enemies.json` - 10 enemy types
- `config/entities/bosses.json` - 5 boss types with phases

Adding new content is as simple as editing JSON - no code changes required!

## Next Steps

1. **Phase 4**: Migrate game systems to ECS
2. **Integration**: Build actual game using new engine
3. **Polish**: Optimize, document, and refine

## Related Files

- See `../ARCHITECTURE_REFACTOR.md` for complete refactoring plan
- See `../.claude/instructions.md` for development guidelines
- See `../v1/` for original game code

---

**Last Updated**: 2025-10-15
**Maintained By**: Claude + Developer
