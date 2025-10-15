# Optimization Roadmap - V2

This document outlines additional optimization opportunities based on v1 analysis and modern best practices.

---

## ✅ Already Implemented in V2

- ✅ **Resource Cache** (Materials & Geometries) - 98-99% reuse rate
- ✅ **Particle Pooling with InstancedMesh** - GPU-accelerated, single draw call
- ✅ **Optimization Configuration System** - Toggleable, measurable
- ✅ **Debug Tools & Statistics** - Real-time monitoring

---

## 🚀 High Priority (Significant Impact)

### 1. Frustum Culling for Entities

**Status**: Partially implemented in v1, needs full integration in v2

**What it does**: Don't update entities outside the camera's view frustum.

**Expected Impact**: 30-50% CPU savings with many off-screen entities

**V1 Implementation** (`/src/engine/GameEngine.js`):
```javascript
updateVisibleEntities(dt) {
  this.camera.updateFrustum();

  for (const entity of this.entities) {
    if (entity.alwaysUpdate || entity.isPersistent) {
      entity.update(dt);
      continue;
    }

    if (this.camera.isInFrustum(entity.position, entity.boundingRadius)) {
      entity.update(dt);
    }
  }
}
```

**V2 Integration Plan**:
1. Add `updateFrustum()` to Camera/Renderer
2. Add `isInFrustum()` check to MovementSystem, AISystem
3. Add `alwaysUpdate` flag to Entity
4. Configure via `OptimizationConfig.general.frustumCulling`

**Files to Create**:
- `/src/core/renderer/FrustumCuller.js`

**Files to Modify**:
- `/src/systems/movement/MovementSystem.js`
- `/src/systems/ai/AISystem.js`
- `/src/core/renderer/Renderer.js`

---

### 2. Distance-Based Update Frequency

**Status**: v1 had throttled updates for direction indicators, v2 needs AI throttling

**What it does**: Update distant entities less frequently (e.g., 5-10 FPS instead of 60 FPS).

**Expected Impact**: 20-40% CPU savings for AI and physics with many entities

**V1 Pattern** (`/src/engine/DustAndDynamiteGame.js`):
```javascript
// Update direction indicators 5x per second instead of 60x
this.directionUpdateTimer += dt;
if (this.directionUpdateTimer >= 0.2) {
  this.updateDirectionIndicators();
  this.directionUpdateTimer = 0;
}
```

**V2 Implementation Strategy**:
```javascript
// In AISystem
updateThrottled(dt, entities) {
  const playerPos = this.player.getComponent('Transform');

  for (const entity of entities) {
    const transform = entity.getComponent('Transform');
    const distance = getDistance(playerPos, transform);

    // Determine update frequency based on distance
    const updateInterval = distance < 20 ? 0 : // Close: every frame
                          distance < 50 ? 0.1 : // Medium: 10 FPS
                          0.2; // Far: 5 FPS

    entity.updateTimer = (entity.updateTimer || 0) + dt;
    if (entity.updateTimer >= updateInterval) {
      this.updateAI(entity, entity.updateTimer);
      entity.updateTimer = 0;
    }
  }
}
```

**Configuration**:
```javascript
OptimizationConfig.general.distanceBasedUpdates = {
  enabled: true,
  closeDistance: 20,
  mediumDistance: 50,
  closeFPS: 60,
  mediumFPS: 10,
  farFPS: 5
}
```

---

### 3. Spatial Partitioning (Quadtree/Grid)

**Status**: Not in v1, critical for collision scaling

**What it does**: Organize entities spatially to reduce collision checks from O(n²) to O(n log n).

**Expected Impact**: 50-90% faster collision detection with 100+ entities

**Use Cases**:
- Player-enemy collision
- Projectile-enemy collision
- Pickup-player collision
- Enemy-enemy collision (if needed)

**Implementation Approach**:
```javascript
// Simple uniform grid (easier than quadtree, good for uniform distribution)
class SpatialGrid {
  constructor(worldSize, cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map(); // "x,y" -> [entities]
  }

  insert(entity, x, z) {
    const cellX = Math.floor(x / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    const key = `${cellX},${cellZ}`;

    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(entity);
  }

  query(x, z, radius) {
    // Return entities in cells overlapping the query circle
    const results = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerX = Math.floor(x / this.cellSize);
    const centerZ = Math.floor(z / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${centerX + dx},${centerZ + dz}`;
        if (this.cells.has(key)) {
          results.push(...this.cells.get(key));
        }
      }
    }
    return results;
  }

  clear() {
    this.cells.clear();
  }
}
```

**V2 Integration**:
- Use in CollisionSystem to reduce collision pairs
- Rebuild grid each frame (fast for moving entities)
- Configure cell size based on typical entity size

**Files to Create**:
- `/src/core/spatial/SpatialGrid.js`

**Files to Modify**:
- `/src/systems/physics/CollisionSystem.js`

---

## 🎯 Medium Priority (Moderate Impact)

### 4. Typed Projectile Pool

**Status**: v1 had advanced implementation, v2 can adopt

**What it does**: Use TypedArrays for projectile positions and velocities.

**Expected Impact**: 10-20% faster projectile updates

**V1 Implementation** (`/src/systems/TypedProjectilePool.js`):
```javascript
class TypedProjectilePool {
  constructor(maxSize) {
    // Typed arrays for cache-friendly access
    this.posX = new Float32Array(maxSize);
    this.posY = new Float32Array(maxSize);
    this.velX = new Float32Array(maxSize);
    this.velY = new Float32Array(maxSize);
    this.active = new Uint8Array(maxSize); // Boolean as byte
    this.lifetime = new Float32Array(maxSize);
  }

  update(dt) {
    // Vectorizable loop
    for (let i = 0; i < this.maxSize; i++) {
      if (!this.active[i]) continue;

      this.posX[i] += this.velX[i] * dt;
      this.posY[i] += this.velY[i] * dt;
      this.lifetime[i] -= dt;

      if (this.lifetime[i] <= 0) {
        this.active[i] = 0;
      }
    }
  }
}
```

**V2 Note**: We already have this pattern in InstancedParticlePool! Can extend to projectiles.

---

### 5. Audio Source Pooling

**Status**: v1 had SoundCache, v2 needs AudioSource pooling

**What it does**: Reuse Web Audio API AudioBufferSourceNodes instead of creating new ones.

**Expected Impact**: 15-30% reduction in audio latency spikes

**V1 Pattern** (`/src/audio/SoundCache.js`):
```javascript
class SoundCache {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map(); // Prevent duplicate loads
  }

  async load(url) {
    // Check cache
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Check in-flight
    if (this.inFlight.has(url)) {
      return this.inFlight.get(url);
    }

    // Load
    const promise = this.fetch(url);
    this.inFlight.set(url, promise);

    const buffer = await promise;
    this.cache.set(url, buffer);
    this.inFlight.delete(url);

    return buffer;
  }
}
```

**V2 Extension**:
```javascript
class AudioSourcePool {
  constructor(audioContext, maxSources = 20) {
    this.context = audioContext;
    this.available = [];
    this.active = new Set();

    // Pre-create sources
    for (let i = 0; i < maxSources; i++) {
      this.available.push(this.createSource());
    }
  }

  acquire(buffer) {
    let source = this.available.pop();
    if (!source) {
      source = this.createSource();
    }

    source.buffer = buffer;
    this.active.add(source);

    source.onended = () => {
      this.release(source);
    };

    return source;
  }

  release(source) {
    this.active.delete(source);
    source.buffer = null;
    source.onended = null;
    this.available.push(source);
  }
}
```

**Files to Create**:
- `/src/systems/audio/AudioSourcePool.js`

**Files to Modify**:
- `/src/systems/audio/AudioSystem.js`

---

### 6. Model Preloading with Progress

**Status**: v1 had excellent preload system

**What it does**: Preload all models before gameplay with progress tracking.

**Expected Impact**: Eliminates mid-game hitches, better UX

**V1 Implementation** (`/src/utils/modelLoader.js`):
```javascript
async preloadModels(progressCallback) {
  const modelPaths = [
    'models/player.glb',
    'models/enemy.glb',
    // ...
  ];

  let loaded = 0;
  const total = modelPaths.length;

  for (const path of modelPaths) {
    await this.loadModel(path);
    loaded++;
    progressCallback(loaded / total);
  }
}
```

**V2 Integration**:
- Add to loading screen initialization
- Show progress bar during load
- Cache all enemy/pickup models

---

## 📊 Low Priority (Minor Impact or Complex)

### 7. Level of Detail (LOD)

**What it does**: Use simpler models for distant entities.

**Expected Impact**: 20-40% GPU savings (if models are complex)

**V2 Note**: Current models are simple primitives (spheres, boxes), LOD not needed yet. Consider when using complex 3D models.

---

### 8. Texture Atlasing

**What it does**: Combine multiple textures into single texture to reduce draw calls.

**Expected Impact**: 10-20% GPU savings (if using many textures)

**V2 Note**: Currently using procedural materials (MeshStandardMaterial), no textures. Consider if adding texture-based effects.

---

### 9. Web Workers for AI/Pathfinding

**What it does**: Offload expensive AI calculations to background thread.

**Expected Impact**: 20-30% main thread savings (for complex AI)

**V2 Note**: Current AI is simple chase behavior. Consider for more complex pathfinding algorithms.

---

## 📋 Implementation Priority

### Phase 1 (Next Sprint)
1. ✅ Frustum Culling - Biggest bang for buck
2. ✅ Distance-Based Updates - Easy to implement, good impact
3. ✅ Spatial Partitioning - Critical for scaling

### Phase 2 (Later)
4. Audio Source Pooling - Improves audio performance
5. Model Preloading - Better UX

### Phase 3 (Future)
6. LOD System - Only if using complex models
7. Texture Atlasing - Only if using textures
8. Web Workers - Only if AI becomes complex

---

## 🔧 Configuration Updates Needed

Add to `/src/config/optimization.js`:

```javascript
export const OptimizationConfig = {
  // ... existing config ...

  // Frustum Culling
  frustumCulling: {
    enabled: true,
    alwaysUpdatePlayer: true,
    alwaysUpdatePickups: true,
    debug: false
  },

  // Distance-Based Updates
  distanceUpdates: {
    enabled: true,
    closeDistance: 20,
    mediumDistance: 50,
    farDistance: 100,
    closeFPS: 60,
    mediumFPS: 10,
    farFPS: 5,
    applyToAI: true,
    applyToPhysics: false, // Keep physics at full rate
    debug: false
  },

  // Spatial Partitioning
  spatialPartitioning: {
    enabled: true,
    cellSize: 10, // World units per cell
    rebuildEveryFrame: true,
    debug: false
  }
};
```

---

## 📈 Expected Overall Impact

With all Phase 1 optimizations:
- **CPU**: 50-70% reduction in update time for large entity counts
- **GPU**: 20-30% reduction in draw calls
- **Scalability**: Support 200-500+ entities (vs 50-100 currently)
- **FPS**: Maintain 60 FPS with 10x more entities

---

## ✅ Success Metrics

1. **Frustum Culling**: Track % of entities culled per frame
2. **Distance Updates**: Track avg update frequency per entity
3. **Spatial Partitioning**: Compare collision check count before/after
4. **Overall**: FPS with 100, 200, 500 entities

Use `logOptimizationStats()` to monitor all metrics!
