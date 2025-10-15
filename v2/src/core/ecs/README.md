# Core ECS (Entity Component System)

**Status**: Active
**Last Updated**: 2025-10-15
**Phase**: Phase 2 (ECS System Implementation)
**Test Coverage**: 97%+

## Overview

The ECS (Entity Component System) module provides a composition-based architecture for game objects. Instead of using inheritance, entities are composed of components (data) which are processed by systems (logic).

## Current State

- ✅ Component.js - Base component class (100% coverage)
- ✅ Entity.js - Entity with component management (100% coverage)
- ✅ ComponentSystem.js - Base system class (93% coverage)
- ✅ Comprehensive unit tests (49 tests)
- ✅ Full serialization support (toJSON/fromJSON)
- ⚠️ Not yet integrated with game loop

## How It Works

### ECS Pattern

The ECS pattern separates data from logic:

```
Component (Data)  ←──┐
                     │
Entity (Container) ──┤  Has many components
                     │
Component (Data)  ←──┘

System (Logic) ──→ Processes entities with specific components
```

**Three Core Concepts**:

1. **Component** - Pure data container (no logic)
   - Example: `Transform`, `Health`, `Movement`

2. **Entity** - Container for components (no logic)
   - Just an ID + component collection

3. **System** - Logic that processes components
   - Example: `MovementSystem` processes entities with `Transform` + `Movement`

### Component Lifecycle

```javascript
1. Create component:     new Health()
2. Initialize with data: component.init({ current: 100, max: 100 })
3. Attach to entity:     entity.addComponent(component)
4. System processes:     healthSystem.update(dt, entities)
5. Detach from entity:   entity.removeComponent('Health')
6. Reset for pooling:    component.reset()
```

### Entity Lifecycle

```javascript
1. Create entity:        new Entity()
2. Add components:       entity.addComponent(new Transform())
3. Add tags:             entity.addTag('enemy')
4. Systems process:      All systems filter and process
5. Mark for removal:     entity.destroy()
6. Cleanup:              entity.cleanup()
```

### System Execution

```javascript
1. System defines required components: ['Transform', 'Movement']
2. System filters entities that match
3. System processes each matching entity
4. System modifies component data
```

## Modules

### Component.js

Base class for all components - pure data containers.

**File**: `Component.js` (97 lines)
**Tests**: `Component.test.js` (100% coverage)

**Key Features**:
- Type-based identification
- Entity reference tracking
- Enabled/disabled state
- Clone support
- Serialization (toJSON/fromJSON)
- Reset for object pooling

### Entity.js

Container for components with tag-based grouping.

**File**: `Entity.js` (172 lines)
**Tests**: `Entity.test.js` (100% coverage)

**Key Features**:
- Unique entity IDs
- Component management (add/remove/get/has)
- Tag-based grouping
- Active state tracking
- Cleanup lifecycle
- Serialization support

### ComponentSystem.js

Base class for systems that process components.

**File**: `ComponentSystem.js` (101 lines)
**Tests**: `ComponentSystem.test.js` (93% coverage)

**Key Features**:
- Automatic entity filtering
- Component requirement checking
- Priority-based execution
- Enable/disable support
- Init/update/cleanup lifecycle

## API Reference

### Component

```typescript
class Component {
  constructor()

  // Properties
  type: string                  // Automatically set to class name
  entity: Entity | null         // Reference to parent entity
  enabled: boolean              // Active state

  // Lifecycle
  init(data: Object): void      // Initialize with data
  reset(): void                 // Reset to initial state (for pooling)

  // Utilities
  clone(): Component            // Create a copy
  toJSON(): Object              // Serialize to JSON
  fromJSON(json: Object): void  // Deserialize from JSON
}
```

### Entity

```typescript
class Entity {
  constructor()

  // Properties
  id: number                           // Unique entity ID
  components: Map<string, Component>   // Component storage
  active: boolean                      // Active state
  shouldRemove: boolean                // Marked for removal
  tags: Set<string>                    // Tag collection

  // Component Management
  addComponent(component: Component): Entity
  removeComponent(type: string): boolean
  getComponent(type: string): Component | null
  hasComponent(type: string): boolean
  hasComponents(types: Array<string>): boolean
  getAllComponents(): Array<Component>
  getComponentTypes(): Array<string>

  // Tag Management
  addTag(tag: string): Entity
  removeTag(tag: string): boolean
  hasTag(tag: string): boolean

  // Lifecycle
  destroy(): void                      // Mark for removal
  cleanup(): void                      // Cleanup before removal
  toJSON(): Object                     // Serialize to JSON
}

// Static
Entity.nextId: number                  // Global ID counter
```

### ComponentSystem

```typescript
class ComponentSystem {
  constructor(requiredComponents: Array<string>)

  // Properties
  requiredComponents: Array<string>    // Component types required
  enabled: boolean                     // Active state
  priority: number                     // Execution order (lower = first)

  // Entity Filtering
  matches(entity: Entity): boolean
  getMatchingEntities(entities: Array<Entity>): Array<Entity>

  // Lifecycle
  init(): void                         // Initialize system
  update(dt: number, entities: Array<Entity>): void  // Update each frame
  process(dt: number, entities: Array<Entity>): void // Process matching entities
  cleanup(): void                      // Cleanup on removal
}
```

## Usage Examples

### Creating Components

```javascript
import { Component } from './core/ecs/Component.js';

// Define a new component
class PositionComponent extends Component {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  reset() {
    super.reset();
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}

// Create and initialize
const position = new PositionComponent();
position.init({ x: 10, y: 0, z: 20 });

// Clone
const copy = position.clone();

// Serialize
const json = position.toJSON();
// { type: 'PositionComponent', x: 10, y: 0, z: 20, enabled: true }
```

### Building Entities

```javascript
import { Entity } from './core/ecs/Entity.js';
import { Transform } from '../components/Transform.js';
import { Health } from '../components/Health.js';
import { Movement } from '../components/Movement.js';

// Create entity with components (method chaining)
const enemy = new Entity()
  .addComponent(new Transform().init({ x: 10, z: 20 }))
  .addComponent(new Health().init({ max: 100 }))
  .addComponent(new Movement().init({ speed: 5 }))
  .addTag('enemy')
  .addTag('hostile');

// Access components
const transform = enemy.getComponent('Transform');
transform.x += 5;

// Check components
if (enemy.hasComponent('Health')) {
  const health = enemy.getComponent('Health');
  health.current -= 10;
}

// Remove component
enemy.removeComponent('Movement');

// Serialize entity
const json = enemy.toJSON();
```

### Creating Systems

```javascript
import { ComponentSystem } from './core/ecs/ComponentSystem.js';

// Create a movement system
class MovementSystem extends ComponentSystem {
  constructor() {
    super(['Transform', 'Movement']); // Required components
    this.priority = 10;
  }

  // Process matching entities
  process(dt, entities) {
    for (const entity of entities) {
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');

      // Apply movement
      transform.x += movement.velocity.x * dt;
      transform.y += movement.velocity.y * dt;
      transform.z += movement.velocity.z * dt;
    }
  }
}

// Create and use system
const movementSystem = new MovementSystem();
movementSystem.init();

// In game loop
const allEntities = entityManager.getActiveEntities();
movementSystem.update(deltaTime, allEntities);
// Automatically filters to entities with Transform + Movement
```

### Component Composition Pattern

```javascript
// Instead of inheritance:
// ❌ class FlyingEnemy extends Enemy { }

// Use composition:
// ✅ Combine components to create behavior
const flyingEnemy = new Entity()
  .addComponent(new Transform())
  .addComponent(new Health())
  .addComponent(new Movement())
  .addComponent(new Flying())      // Add flying behavior
  .addComponent(new AI())
  .addTag('enemy')
  .addTag('flying');

const groundEnemy = new Entity()
  .addComponent(new Transform())
  .addComponent(new Health())
  .addComponent(new Movement())
  // No Flying component = ground-based
  .addComponent(new AI())
  .addTag('enemy')
  .addTag('ground');

// Systems automatically handle different entity types
// FlyingSystem only processes entities with Flying component
// MovementSystem processes both (they both have Movement)
```

## Testing

### Test Files
- `Component.test.js` - 14 tests
- `Entity.test.js` - 18 tests
- `ComponentSystem.test.js` - 17 tests

### Running Tests

```bash
# Run all ECS tests
npm run test -- src/core/ecs

# Run specific test
npm run test -- src/core/ecs/Entity.test.js

# With coverage
npm run test:coverage
```

### Coverage

- **Component.js**: 100% statements, 100% branches, 100% functions
- **Entity.js**: 100% statements, 100% branches, 100% functions
- **ComponentSystem.js**: 93.47% statements, 87.5% branches, 90.9% functions

### Key Test Scenarios

Component.js tests:
- Component creation and initialization
- Type identification
- Entity reference tracking
- Cloning with deep copy
- Serialization (toJSON/fromJSON)
- Reset for pooling

Entity.js tests:
- Entity ID generation
- Component add/remove/get
- Multiple component management
- Tag-based grouping
- Lifecycle (destroy, cleanup)
- Serialization

ComponentSystem.js tests:
- Entity filtering by components
- Required component checking
- Process method delegation
- Priority system
- Enable/disable functionality

## Related Files

- `../../components/Transform.js` - Position/rotation/scale component
- `../../components/Health.js` - Health/damage component
- `../../components/Movement.js` - Velocity/speed component
- `../../components/Renderable.js` - Visual representation component
- `../../components/AI.js` - AI behavior component
- `../../systems/entity/EntityFactory.js` - Creates entities from JSON
- `../engine/EntityManager.js` - Manages entity lifecycle

## Known Issues

### ComponentSystem.js

- ⚠️ Some edge cases in filtering logic (only 93% coverage)
- 💡 Consider caching filtered entities for performance
- 💡 Add system dependency ordering

### Entity.js

- ✅ No known issues (100% coverage)

### Component.js

- ✅ No known issues (100% coverage)

## Performance Considerations

### Component
- Lightweight data-only objects
- Clone uses shallow copy for objects (deep enough for game data)
- Serialization includes all enumerable properties

### Entity
- Map for O(1) component lookups
- Set for O(1) tag lookups
- Component iteration is O(n) where n = component count
- Consider component pools for frequently created components

### ComponentSystem
- Entity filtering is O(n * m) where n = entities, m = required components
- Consider caching filtered entities between frames
- Priority-based ordering allows optimization control

## ECS Best Practices

### Components (Data)

✅ **DO**:
- Keep components pure data (no methods except init/reset)
- One component per concern (Transform, Health, Movement)
- Use simple types (numbers, strings, arrays, objects)
- Initialize all properties in constructor

❌ **DON'T**:
- Add game logic to components
- Store references to other entities in components
- Create component hierarchies (inheritance)
- Add complex methods

### Systems (Logic)

✅ **DO**:
- Systems are stateless (operate only on component data)
- One system per behavior (MovementSystem, RenderSystem)
- Use priority for execution order
- Filter entities efficiently

❌ **DON'T**:
- Store entity references in systems
- Modify entity list during iteration
- Create system hierarchies
- Access components not in requiredComponents

### Entities (Containers)

✅ **DO**:
- Compose entities from components
- Use tags for grouping (enemy, player, projectile)
- Call destroy() instead of removing directly
- Chain addComponent() for readability

❌ **DON'T**:
- Add custom methods to entities
- Store logic in entities
- Create entity subclasses
- Manually manipulate component map

## Future Improvements

### Phase 4 (Systems Migration)
- [ ] Integrate with game loop
- [ ] Build actual game systems (combat, spawn, AI)
- [ ] System execution ordering
- [ ] Entity archetype optimization

### Performance
- [ ] Component pooling
- [ ] Entity archetype caching
- [ ] Batch component operations
- [ ] Spatial partitioning for systems

### Nice to Have
- [ ] Component dependencies (Transform requires Position)
- [ ] System groups (UpdateSystems, RenderSystems)
- [ ] Entity prefabs/templates
- [ ] Component change events

## Change Log

### 2025-10-15
- ✅ Initial implementation of Component.js
- ✅ Initial implementation of Entity.js
- ✅ Initial implementation of ComponentSystem.js
- ✅ Comprehensive unit tests added (49 tests)
- ✅ 97%+ test coverage achieved
- ✅ Full serialization support
- ✅ Documentation created

---

**Last Updated**: 2025-10-15
**Maintained By**: Claude + Developer
**Status**: Ready for Phase 4 integration
