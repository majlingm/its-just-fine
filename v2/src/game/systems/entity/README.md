# Entity Factory System

**Status**: Active
**Last Updated**: 2025-10-15
**Phase**: Phase 3 (Configuration System)
**Test Coverage**: 100%

## Overview

The EntityFactory system creates ECS entities from JSON configurations. It bridges the gap between data-driven design (JSON files) and runtime entity creation, allowing game content to be defined without code changes.

**Key Principle**: All game entities can be created from JSON configuration alone.

## Current State

- ✅ EntityFactory.js - Creates entities from config (100% coverage)
- ✅ Component registry system
- ✅ Enemy creation from JSON
- ✅ Boss creation with multi-phase AI
- ✅ Batch entity creation
- ✅ Entity cloning
- ✅ Comprehensive unit tests (24 tests)
- ⚠️ Not yet integrated with game loop

## How It Works

### Configuration-Driven Entity Creation

```
JSON Config → EntityFactory → ECS Entity
     ↓              ↓              ↓
{             read config     Entity with:
  health,     create comps    - Transform
  speed,      add tags        - Health
  ai          return entity   - Movement
}                             - Renderable
                              - AI
```

### Entity Creation Flow

```javascript
1. Load JSON config:     configLoader.getEnemy('shadow_lurker')
2. Parse config:         Extract health, speed, ai, etc.
3. Create components:    new Health(), new Movement(), etc.
4. Initialize:           component.init(configData)
5. Build entity:         entity.addComponent(component)
6. Add tags:             entity.addTag('enemy')
7. Return entity:        Ready to use
```

## EntityFactory.js

**File**: `EntityFactory.js` (237 lines)
**Tests**: `EntityFactory.test.js` (24 tests, 100% coverage)

### Component Registry

The factory maintains a registry of component types:

```javascript
{
  'Transform' => Transform class,
  'Health' => Health class,
  'Movement' => Movement class,
  'Renderable' => Renderable class,
  'AI' => AI class
}
```

This allows the factory to dynamically create components from string names in JSON.

## API Reference

### EntityFactory

```typescript
class EntityFactory {
  constructor()

  // Component Registry
  registerComponent(name: string, ComponentClass: Class): void

  // Entity Creation
  create(
    components: Array<ComponentDefinition>,
    tags: Array<string>
  ): Entity

  createEnemy(
    enemyId: string,
    overrides?: Object
  ): Promise<Entity>

  createBoss(
    bossId: string,
    overrides?: Object
  ): Promise<Entity>

  createEnemies(
    enemyId: string,
    count: number,
    positionFn?: (index: number) => {x, z}
  ): Promise<Array<Entity>>

  clone(entity: Entity): Entity
}

// Singleton instance
export const entityFactory: EntityFactory
```

### Component Definition

```typescript
interface ComponentDefinition {
  type: string;          // Component type name
  [key: string]: any;    // Component properties
}
```

## Usage Examples

### Basic Entity Creation

```javascript
import { entityFactory } from './systems/entity/EntityFactory.js';

// Create entity from component definitions
const entity = entityFactory.create(
  [
    { type: 'Transform', x: 10, y: 0, z: 20 },
    { type: 'Health', max: 100, current: 100 },
    { type: 'Movement', speed: 5 }
  ],
  ['enemy', 'hostile']
);
```

### Create Enemy from JSON

```javascript
import { entityFactory } from './systems/entity/EntityFactory.js';

// Create enemy (loads config/entities/enemies.json)
const enemy = await entityFactory.createEnemy('shadow_lurker', {
  x: 10,
  z: 20
});

// Enemy now has all components defined in JSON:
// - Transform (position, rotation, scale)
// - Health (max health from config)
// - Movement (speed from config)
// - Renderable (model, color from config)
// - AI (behavior, aggro, attack from config)
```

### Create Boss from JSON

```javascript
// Create boss with multi-phase AI
const boss = await entityFactory.createBoss('inferno_dragon', {
  x: 0,
  z: 50
});

// Boss has boss-specific features:
// - Higher health
// - Multi-phase AI
// - Special abilities
// - 'boss' tag
```

### Batch Create Enemies

```javascript
// Create 10 enemies in a circle
const enemies = await entityFactory.createEnemies(
  'flame_imp',
  10,
  (i) => {
    const angle = (i / 10) * Math.PI * 2;
    return {
      x: Math.cos(angle) * 30,
      z: Math.sin(angle) * 30
    };
  }
);
```

### Clone Existing Entity

```javascript
// Create one enemy
const original = await entityFactory.createEnemy('crystal_guardian');

// Clone it multiple times
const clone1 = entityFactory.clone(original);
const clone2 = entityFactory.clone(original);

// Clones have same components but different IDs
```

### Override Config Values

```javascript
// Use config but override specific values
const strongEnemy = await entityFactory.createEnemy('shadow_lurker', {
  health: 500,      // Override default health
  speed: 10,        // Override default speed
  x: 100,
  z: 200
});
```

### Register Custom Component

```javascript
import { Collision } from '../components/Collision.js';

// Register new component type
entityFactory.registerComponent('Collision', Collision);

// Now can create entities with Collision component
const entity = entityFactory.create([
  { type: 'Transform', x: 0, y: 0, z: 0 },
  { type: 'Collision', radius: 5, mass: 10 }
], []);
```

## Integration with Config System

### Enemy Config Example

```json
{
  "shadow_lurker": {
    "displayName": "Shadow Lurker",
    "health": 100,
    "speed": 6.0,
    "scale": 1.2,
    "model": "humanoid",
    "color": 0x1a0033,
    "ai": {
      "behavior": "chase_player",
      "aggroRange": 25,
      "attackRange": 2.5,
      "attackCooldown": 1.2
    }
  }
}
```

### How Factory Uses Config

```javascript
// Factory reads JSON
const config = await configLoader.getEnemy('shadow_lurker');

// Transforms into components
const components = [
  { type: 'Transform', scaleX: config.scale, ... },
  { type: 'Health', max: config.health, current: config.health },
  { type: 'Movement', speed: config.speed, ... },
  { type: 'Renderable', model: config.model, color: config.color },
  { type: 'AI', behavior: config.ai.behavior, ... }
];

// Creates entity
return entityFactory.create(components, ['enemy', 'shadow_lurker']);
```

## Testing

### Test Files
- `EntityFactory.test.js` - 24 tests

### Running Tests

```bash
# Run EntityFactory tests
npm run test -- src/systems/entity/EntityFactory.test.js

# With coverage
npm run test:coverage
```

### Coverage

- **EntityFactory.js**: 100% statements, 100% branches, 100% functions

### Test Scenarios

1. **Component Registry**
   - Default components registered
   - Custom component registration

2. **Basic Entity Creation**
   - Create entity from component list
   - Add tags to entities
   - Handle unknown component types

3. **Enemy Creation**
   - Create from valid config
   - Apply position overrides
   - Handle invalid enemy IDs
   - Verify all components created
   - Check tags assigned correctly

4. **Boss Creation**
   - Create from boss config
   - Multi-phase AI setup
   - Boss-specific tags

5. **Batch Creation**
   - Create multiple enemies
   - Position function application
   - Async batch operations

6. **Entity Cloning**
   - Clone all components
   - Clone all tags
   - Verify new entity ID

## Component Mapping

### How JSON Maps to Components

| JSON Field | Component | Property |
|------------|-----------|----------|
| `x, y, z` | Transform | position |
| `scale` | Transform | scaleX/Y/Z |
| `health` | Health | max, current |
| `speed` | Movement | speed |
| `maxSpeed` | Movement | maxSpeed |
| `model` | Renderable | modelType |
| `color` | Renderable | color |
| `ai.behavior` | AI | behavior |
| `ai.aggroRange` | AI | aggroRange |
| `ai.attackRange` | AI | attackRange |
| `ai.attackCooldown` | AI | attackCooldown |

### Boss-Specific Mapping

| JSON Field | Component | Property |
|------------|-----------|----------|
| `phases` | AI | phases |
| `abilities` | AI | abilities |
| `name` | entity | displayName |

## Design Patterns

### Factory Pattern

The EntityFactory uses the Factory pattern to encapsulate entity creation:

```javascript
// Instead of:
const entity = new Entity();
entity.addComponent(new Transform().init({...}));
entity.addComponent(new Health().init({...}));
// ... many more lines

// Use factory:
const entity = await entityFactory.createEnemy('shadow_lurker');
```

### Registry Pattern

Component types are registered and looked up dynamically:

```javascript
// Register once
entityFactory.registerComponent('CustomComponent', CustomComponent);

// Use anywhere
const entity = entityFactory.create([
  { type: 'CustomComponent', prop: 'value' }
], []);
```

### Builder Pattern

Entity creation is a multi-step build process:

```javascript
1. Load config
2. Build component list
3. Create entity
4. Add components
5. Add tags
6. Attach metadata
7. Return entity
```

## Related Files

- `../../core/ecs/Entity.js` - Entity class
- `../../core/ecs/Component.js` - Component base class
- `../../components/` - All component types
- `../../utils/ConfigLoader.js` - Loads JSON configs
- `../../config/entities/enemies.json` - Enemy definitions
- `../../config/entities/bosses.json` - Boss definitions

## Known Issues

- ✅ 100% test coverage, no known issues
- 💡 Consider validation for required config fields
- 💡 Consider entity templates/prefabs
- 💡 Consider component dependencies

## Performance Considerations

### EntityFactory
- Component lookup is O(1) via Map
- Config loading is cached by ConfigLoader
- Async operations for batch creation

### Memory
- Singleton pattern reduces overhead
- Component registry is small (~5 entries)
- No entity caching (creates fresh each time)

### Optimization Tips
- Batch create enemies when possible
- Use clone() for identical entities
- Preload configs at game start
- Consider entity pooling in game loop

## Best Practices

### DO ✅

1. **Always use factory for entity creation**
   ```javascript
   ✅ const enemy = await entityFactory.createEnemy('shadow_lurker');
   ❌ const enemy = new Entity(); // manual setup
   ```

2. **Define entities in JSON**
   ```javascript
   ✅ Create new enemy type in enemies.json
   ❌ Hardcode entity creation in code
   ```

3. **Use overrides for variation**
   ```javascript
   ✅ createEnemy('shadow_lurker', { health: 200 })
   ❌ Create separate config for slightly different entity
   ```

4. **Batch create when possible**
   ```javascript
   ✅ createEnemies('flame_imp', 10, positionFn)
   ❌ Loop creating enemies one by one
   ```

### DON'T ❌

1. **Don't modify config at runtime**
   ```javascript
   ❌ config.health = 500; // Modifies cached config
   ✅ createEnemy('id', { health: 500 }); // Use overrides
   ```

2. **Don't skip factory**
   ```javascript
   ❌ const entity = new Entity(); // Missing config data
   ✅ const entity = await entityFactory.createEnemy('id');
   ```

3. **Don't store factory references in entities**
   ```javascript
   ❌ entity.factory = entityFactory; // Unnecessary coupling
   ✅ Import entityFactory where needed
   ```

## Future Improvements

### Phase 4 (Systems Migration)
- [ ] Integrate with spawn system
- [ ] Entity pooling for performance
- [ ] Validation of required config fields
- [ ] Component dependency checking

### Nice to Have
- [ ] Entity templates/prefabs
- [ ] Entity composition (inherit from base)
- [ ] Hot-reload entity configs
- [ ] Visual entity editor
- [ ] Entity versioning

### Advanced Features
- [ ] Conditional component creation
- [ ] Component value expressions (e.g., `"health": "base * 1.5"`)
- [ ] Entity inheritance in config
- [ ] Dynamic component loading

## Change Log

### 2025-10-15
- ✅ Initial implementation of EntityFactory
- ✅ Component registry system
- ✅ Enemy and boss creation
- ✅ Batch creation support
- ✅ Entity cloning
- ✅ Config integration
- ✅ Comprehensive unit tests (24 tests)
- ✅ 100% test coverage achieved
- ✅ Documentation created

---

**Last Updated**: 2025-10-15
**Maintained By**: Claude + Developer
**Status**: Ready for Phase 4 integration
