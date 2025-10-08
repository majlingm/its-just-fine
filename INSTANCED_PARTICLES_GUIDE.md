# Instanced Particle System Guide

## Overview

The `InstancedParticlePool` provides **high-performance particle rendering** using THREE.js InstancedMesh. This allows rendering **thousands of particles in a single draw call** instead of one per particle.

## Performance Benefits

| Technique | Draw Calls (1000 particles) | Use Case |
|-----------|----------------------------|----------|
| **Individual Sprites** | 1000 | Full control, different materials |
| **InstancedMesh** | 1 | Same material, massive particle counts |
| **Points System** | 1 | Ultra-simple particles |

### When to Use InstancedParticlePool

✅ **Use when:**
- You need hundreds/thousands of particles
- All particles share same texture
- Particles only differ in position/scale/color
- Performance is critical

❌ **Don't use when:**
- Less than ~50 particles
- Need different textures per particle
- Need complex per-particle logic
- Need to change particle material each frame

---

## Basic Usage

### 1. Access from Engine

The particle pools are available globally via the game engine:

```javascript
// Pools are auto-created on first use
const trailPool = this.engine.instancedParticlePools.trails;
const explosionPool = this.engine.instancedParticlePools.explosions;
const genericPool = this.engine.instancedParticlePools.generic;
```

### 2. Initialize a Pool

```javascript
import { InstancedParticlePool } from '../effects/InstancedParticlePool.js';

// Create texture (shared by all particles)
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');
const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 32, 32);
const texture = new THREE.CanvasTexture(canvas);

// Create pool
const pool = new InstancedParticlePool(scene, {
  texture: texture,
  maxParticles: 2000,    // Maximum particles
  size: 0.5,             // Base size
  blending: THREE.AdditiveBlending,
  transparent: true
});

// Store in engine for global access
this.engine.instancedParticlePools.myPool = pool;
```

### 3. Spawn Particles

```javascript
// Simple spawn
const particle = pool.spawn(x, y, z);

// Spawn with configuration
const particle = pool.spawn(x, y, z, {
  life: 1.0,                    // Lifetime in seconds
  scale: 1.5,                   // Size multiplier
  color: 0xff0000,              // Color (hex or THREE.Color)
  velocity: { x: 1, y: 2, z: 0 }, // Movement per second
  gravity: -9.8,                // Y acceleration
  fadeOut: true,                // Fade opacity over lifetime
  shrink: true,                 // Shrink over lifetime
  userData: { custom: 'data' }  // Store custom data
});
```

### 4. Automatic Updates

The engine automatically updates all particle pools:

```javascript
// In GameEngine.update():
Object.values(this.instancedParticlePools).forEach(pool => {
  if (pool) pool.update(dt);
});
```

Particles are automatically:
- ✅ Aged and removed when lifetime expires
- ✅ Moved based on velocity
- ✅ Affected by gravity
- ✅ Faded and shrunk based on settings
- ✅ Returned to pool when dead

---

## Complete Example: Explosion Effect

```javascript
import { InstancedParticlePool } from '../effects/InstancedParticlePool.js';

export class Explosion {
  constructor(engine, x, y, z) {
    this.engine = engine;

    // Initialize pool if needed
    if (!engine.instancedParticlePools.explosions) {
      const texture = this.createExplosionTexture();
      engine.instancedParticlePools.explosions = new InstancedParticlePool(
        engine.scene,
        {
          texture: texture,
          maxParticles: 1000,
          size: 0.3,
          blending: THREE.AdditiveBlending
        }
      );
    }

    // Spawn burst of particles
    const pool = engine.instancedParticlePools.explosions;
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 5 + Math.random() * 5;

      pool.spawn(x, y, z, {
        life: 0.5 + Math.random() * 0.5,
        scale: 0.5 + Math.random() * 1.0,
        color: Math.random() > 0.5 ? 0xff8800 : 0xff4400,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.random() * 5,
          z: Math.sin(angle) * speed
        },
        gravity: -10,
        fadeOut: true,
        shrink: true
      });
    }
  }

  createExplosionTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);

    return new THREE.CanvasTexture(canvas);
  }
}
```

---

## Magic Bullet Implementation

The Magic Bullet spell uses instanced particles for trails:

```javascript
// Initialize trail pool once
initTrailPool() {
  if (!this.engine.instancedParticlePools.trails) {
    const texture = this.createTrailTexture();
    this.engine.instancedParticlePools.trails = new InstancedParticlePool(
      this.engine.scene,
      { texture, maxParticles: 2000, size: 0.25 }
    );
  }
}

// Spawn trail particle
createTrailParticle() {
  const pool = this.engine.instancedParticlePools.trails;
  const hue = this.hueShift % 360;
  const color = new THREE.Color().setHSL(hue / 360, 1.0, 0.7);

  return pool.spawn(this.x, this.y, this.z, {
    life: 0.15,
    color: color,
    fadeOut: true,
    shrink: true
  });
}

// In update loop
this.trailSpawnTimer += dt;
if (this.trailSpawnTimer >= this.trailSpawnInterval) {
  this.trailSpawnTimer = 0;
  this.trails.push(this.createTrailParticle());
}
```

**Result**: 500 trail particles = **1 draw call** instead of 500!

---

## Advanced Features

### Custom Particle Behavior

Store custom logic in `userData`:

```javascript
const particle = pool.spawn(x, y, z, {
  userData: {
    rotationSpeed: Math.random() * 5,
    bounceCount: 0
  }
});

// Later, access in your own update loop:
myParticles.forEach(p => {
  p.userData.rotationSpeed += dt;
  // Custom logic here
});
```

### Pool Management

```javascript
// Check capacity
console.log(`Active: ${pool.getActiveCount()}`);
console.log(`Available: ${pool.getAvailableCount()}`);

// Clear all particles
pool.clear();

// Dispose when done
pool.dispose();
```

---

## Migration Guide: Sprites → InstancedParticles

### Before (Individual Sprites):
```javascript
createParticle() {
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  this.scene.add(sprite);
  return { sprite, life: 1.0, age: 0 };
}

update(dt) {
  this.particles.forEach(p => {
    p.age += dt;
    if (p.age > p.life) {
      this.scene.remove(p.sprite);
      p.sprite.material.dispose();
    } else {
      p.sprite.material.opacity = 1 - (p.age / p.life);
    }
  });
}
```

### After (Instanced Pool):
```javascript
createParticle() {
  return pool.spawn(x, y, z, {
    life: 1.0,
    fadeOut: true
  });
}

update(dt) {
  // Pool handles everything automatically!
  // Just clean up dead references:
  this.particles = this.particles.filter(p => p.age < p.life);
}
```

---

## Performance Tips

1. **Reuse pools** - Create once, use everywhere
2. **Limit maxParticles** - Don't allocate more than you need
3. **Cache textures** - Share textures across multiple pools
4. **Batch spawns** - Spawn many particles at once when possible
5. **Clean references** - Remove dead particle references from arrays

---

## API Reference

### Constructor Options
```javascript
{
  texture: THREE.Texture,        // Particle texture (required)
  maxParticles: number,          // Pool capacity (default: 2000)
  size: number,                  // Base particle size (default: 0.5)
  blending: THREE.Blending,      // Blend mode (default: AdditiveBlending)
  transparent: boolean           // Transparency (default: true)
}
```

### Spawn Configuration
```javascript
{
  life: number,                  // Lifetime in seconds (default: 1.0)
  scale: number,                 // Size multiplier (default: 1.0)
  color: number | THREE.Color,   // Particle color
  velocity: {x, y, z},          // Movement per second
  gravity: number,               // Y acceleration
  fadeOut: boolean,              // Auto-fade (default: true)
  shrink: boolean,               // Auto-shrink (default: true)
  userData: object               // Custom data
}
```

### Methods
- `spawn(x, y, z, config)` - Create particle
- `update(dt)` - Update all particles (automatic)
- `clear()` - Remove all particles
- `getActiveCount()` - Get active particle count
- `getAvailableCount()` - Get free slots
- `dispose()` - Clean up and remove from scene
