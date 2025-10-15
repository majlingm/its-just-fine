# Utilities

**Status**: Active
**Last Updated**: 2025-10-15
**Phase**: Phase 3 (Configuration System)
**Test Coverage**: 100%

## Overview

The utils module contains utility classes and functions that support the core game systems. These are reusable, generic helpers that aren't specific to game logic.

**Key Principle**: Utilities are reusable, stateless helpers.

## Current State

- ✅ ConfigLoader.js - Async JSON config loader with caching (100% coverage)
- ✅ Comprehensive unit tests (18 tests)
- ✅ Full integration with EntityFactory
- ⚠️ Not yet integrated with game loop

## How It Works

### Configuration Loading Flow

```
Request Config → Check Cache → Load from File → Cache Result → Return
                       ↓              ↓              ↓
                    Return       fetch() JSON    Store in Map
```

### Caching Strategy

```javascript
First call:  configLoader.getEnemy('shadow_lurker')
             ↓
             Load from /src/config/entities/enemies.json
             ↓
             Cache in Map
             ↓
             Return config

Second call: configLoader.getEnemy('shadow_lurker')
             ↓
             Found in cache (instant return)
```

## Modules

### ConfigLoader.js

**Purpose**: Load and cache JSON configuration files

**File**: `ConfigLoader.js` (160 lines)
**Tests**: `ConfigLoader.test.js` (18 tests, 100% coverage)

**Key Features**:
- Async JSON loading with `fetch()`
- Automatic caching for performance
- Error handling and validation
- Support for multiple config types
- Cache management (clear, preload)
- Singleton pattern

## API Reference

### ConfigLoader

```typescript
class ConfigLoader {
  constructor()

  // Properties
  cache: Map<string, Object>   // Cached configs
  basePath: string              // Base path for configs

  // Generic Loading
  load(path: string): Promise<Object>

  // Specific Loaders
  loadEnemies(): Promise<Object>
  loadBosses(): Promise<Object>
  loadLevel(levelId: string): Promise<Object>
  loadWaves(waveId: string): Promise<Object>
  loadSpells(): Promise<Object>

  // Get Specific Entity
  getEnemy(enemyId: string): Promise<Object>
  getBoss(bossId: string): Promise<Object>

  // Cache Management
  preload(paths: Array<string>): Promise<Array<Object>>
  clearCache(): void
  clearCached(path: string): void
  getCacheSize(): number
}

// Singleton instance
export const configLoader: ConfigLoader
```

## Usage Examples

### Basic Config Loading

```javascript
import { configLoader } from './utils/ConfigLoader.js';

// Load entire enemy config file
const allEnemies = await configLoader.loadEnemies();
console.log(Object.keys(allEnemies));
// ['shadow_lurker', 'crystal_guardian', ...]

// Load entire boss config file
const allBosses = await configLoader.loadBosses();
console.log(Object.keys(allBosses));
// ['shadow_lord', 'crystal_titan', ...]
```

### Get Specific Entity

```javascript
// Get specific enemy by ID
const shadowLurker = await configLoader.getEnemy('shadow_lurker');
console.log(shadowLurker.health);      // 100
console.log(shadowLurker.speed);       // 5.5
console.log(shadowLurker.ai.behavior); // "chase_player"

// Get specific boss by ID
const dragon = await configLoader.getBoss('inferno_dragon');
console.log(dragon.health);         // 10000
console.log(dragon.phases.length);  // 3
```

### Error Handling

```javascript
try {
  const config = await configLoader.getEnemy('invalid_id');
} catch (error) {
  console.error('Enemy not found:', error.message);
  // "Enemy config not found: invalid_id"
}

try {
  const config = await configLoader.load('missing-file.json');
} catch (error) {
  console.error('Load failed:', error.message);
  // "Failed to load config: missing-file.json (404)"
}
```

### Preload Configs at Game Start

```javascript
// Preload multiple configs for faster access later
await configLoader.preload([
  'entities/enemies.json',
  'entities/bosses.json',
  'spells/spells.json'
]);

// Now these are cached and instant to access
const enemy = await configLoader.getEnemy('shadow_lurker'); // Instant!
```

### Cache Management

```javascript
// Check cache size
console.log(configLoader.getCacheSize()); // 2

// Clear specific cached file
configLoader.clearCached('entities/enemies.json');

// Clear entire cache (useful for hot-reload)
configLoader.clearCache();
console.log(configLoader.getCacheSize()); // 0
```

### Custom Config Loading

```javascript
// Load any JSON file relative to /src/config
const customConfig = await configLoader.load('my-custom-config.json');

// Load with absolute path
const absoluteConfig = await configLoader.load('/assets/data.json');
```

## Integration with Other Systems

### EntityFactory Integration

```javascript
// EntityFactory uses ConfigLoader internally
import { entityFactory } from '../systems/entity/EntityFactory.js';

// This calls configLoader.getEnemy() internally
const enemy = await entityFactory.createEnemy('shadow_lurker');

// ConfigLoader caches the config, so subsequent calls are fast
const enemy2 = await entityFactory.createEnemy('shadow_lurker'); // Cached!
```

### Game Initialization Pattern

```javascript
import { configLoader } from './utils/ConfigLoader.js';

// Initialize game
async function initGame() {
  // Preload all configs
  await configLoader.preload([
    'entities/enemies.json',
    'entities/bosses.json',
    'levels/level1.json',
    'waves/default.json'
  ]);

  console.log('All configs loaded!');

  // Now game can access configs instantly
  startGame();
}
```

## Testing

### Test Files
- `ConfigLoader.test.js` - 18 tests

### Running Tests

```bash
# Run ConfigLoader tests
npm run test -- src/utils/ConfigLoader.test.js

# With coverage
npm run test:coverage
```

### Coverage

- **ConfigLoader.js**: 100% statements, 100% branches, 100% functions

### Test Scenarios

1. **Basic Loading**
   - Load JSON file successfully
   - Cache loaded config
   - Return cached config on second call

2. **Specific Loaders**
   - loadEnemies() loads enemies.json
   - loadBosses() loads bosses.json
   - getEnemy() returns specific enemy
   - getBoss() returns specific boss

3. **Error Handling**
   - 404 errors throw appropriate messages
   - Invalid enemy ID throws error
   - Invalid boss ID throws error

4. **Cache Management**
   - clearCache() clears all cached configs
   - clearCached() clears specific config
   - getCacheSize() returns correct count
   - preload() loads multiple configs

5. **Path Resolution**
   - Relative paths work correctly
   - Absolute paths work correctly
   - basePath is applied correctly

## Design Patterns

### Singleton Pattern

ConfigLoader uses a singleton to ensure one shared cache:

```javascript
// Singleton instance
export const configLoader = new ConfigLoader();

// Everyone uses the same instance = shared cache
import { configLoader } from './utils/ConfigLoader.js';
```

**Benefits**:
- Single shared cache across entire application
- No duplicate config loading
- Consistent state

---

### Lazy Loading Pattern

Configs are loaded on-demand, not upfront:

```javascript
// Not loaded yet
const loader = new ConfigLoader();

// Loads on first access
const config = await loader.getEnemy('shadow_lurker');

// Cached for future access
const config2 = await loader.getEnemy('shadow_lurker'); // Instant!
```

**Benefits**:
- Fast initial startup
- Only load what's needed
- Cache what's used

---

### Promise-Based API

All loading is asynchronous:

```javascript
// Async/await syntax
const config = await configLoader.getEnemy('shadow_lurker');

// Promise syntax
configLoader.getEnemy('shadow_lurker')
  .then(config => {
    console.log(config.health);
  });
```

**Benefits**:
- Non-blocking loading
- Better user experience
- Works with modern async patterns

## Performance Considerations

### ConfigLoader Performance

| Operation | First Call | Cached Call | Complexity |
|-----------|-----------|-------------|------------|
| load() | ~10-50ms | <1ms | O(1) cache lookup |
| getEnemy() | ~10-50ms | <1ms | O(1) object access |
| clearCache() | <1ms | N/A | O(1) |
| preload() | ~N*20ms | N/A | O(n) parallel |

### Memory Usage

- Each cached config: ~1-5KB
- Total cache size: ~10-50KB (depends on configs)
- Map overhead: negligible

### Optimization Tips

1. **Preload at startup**
   ```javascript
   await configLoader.preload(['entities/enemies.json']);
   ```

2. **Don't clear cache unnecessarily**
   ```javascript
   // ❌ BAD: Clears cache every frame
   setInterval(() => configLoader.clearCache(), 16);

   // ✅ GOOD: Cache persists
   const config = await configLoader.getEnemy('shadow_lurker');
   ```

3. **Use singleton instance**
   ```javascript
   // ✅ GOOD: Shared cache
   import { configLoader } from './utils/ConfigLoader.js';

   // ❌ BAD: New instance, no shared cache
   const loader = new ConfigLoader();
   ```

## Best Practices

### DO ✅

1. **Use the singleton instance**
   ```javascript
   import { configLoader } from './utils/ConfigLoader.js';
   ```

2. **Preload configs at game start**
   ```javascript
   await configLoader.preload(['entities/enemies.json']);
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     const config = await configLoader.getEnemy(id);
   } catch (error) {
     console.error('Failed to load enemy:', error);
   }
   ```

4. **Let cache persist**
   - Cache improves performance
   - Only clear when necessary (hot-reload, testing)

### DON'T ❌

1. **Don't create multiple instances**
   ```javascript
   ❌ const loader = new ConfigLoader(); // Loses shared cache
   ✅ import { configLoader } from './utils/ConfigLoader.js';
   ```

2. **Don't load synchronously**
   ```javascript
   ❌ const config = fs.readFileSync('config.json'); // Blocks!
   ✅ const config = await configLoader.load('config.json');
   ```

3. **Don't ignore errors**
   ```javascript
   ❌ await configLoader.getEnemy(id); // Might throw!
   ✅ try { await configLoader.getEnemy(id); } catch (e) { }
   ```

4. **Don't bypass the loader**
   ```javascript
   ❌ fetch('/src/config/enemies.json'); // No caching!
   ✅ configLoader.loadEnemies(); // Cached!
   ```

## Related Files

- `../config/entities/enemies.json` - Enemy configurations
- `../config/entities/bosses.json` - Boss configurations
- `../systems/entity/EntityFactory.js` - Uses ConfigLoader
- `../core/ecs/Entity.js` - Entities created from configs

## Known Issues

- ✅ 100% test coverage, no known issues
- 💡 Consider JSON schema validation
- 💡 Consider config versioning
- 💡 Consider hot-reload support

## Future Improvements

### Phase 4 (Systems Migration)
- [ ] Load level configs
- [ ] Load wave spawn configs
- [ ] Load spell configs
- [ ] Load weapon configs

### Nice to Have
- [ ] Config schema validation (JSON Schema)
- [ ] Config hot-reload for development
- [ ] Config versioning and migration
- [ ] TypeScript type generation from configs
- [ ] Config compression for large files

### Advanced Features
- [ ] Remote config loading (CDN)
- [ ] Config A/B testing
- [ ] Config inheritance/composition
- [ ] Config expressions and templates
- [ ] Config localization support

## Change Log

### 2025-10-15
- ✅ Initial implementation of ConfigLoader
- ✅ Async JSON loading with fetch()
- ✅ Automatic caching system
- ✅ Enemy and boss config loaders
- ✅ Preload functionality
- ✅ Cache management (clear, size)
- ✅ Comprehensive unit tests (18 tests)
- ✅ 100% test coverage achieved
- ✅ Integration with EntityFactory
- ✅ Documentation created

---

**Last Updated**: 2025-10-15
**Maintained By**: Claude + Developer
**Status**: Ready for Phase 4 integration
