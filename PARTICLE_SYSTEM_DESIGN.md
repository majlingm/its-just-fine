# Particle System Design

## Overview
Design a lightweight particle system for the game that manages sprite-based particles efficiently.

## Current State
Particles are currently managed manually in individual entity classes:
- FireExplosion.js - 30 fire particles
- LightningExplosion.js - 30 electric particles
- FlameProjectile.js - Trail particles

**Problems with current approach:**
- Code duplication across entities
- Manual scene management (add/remove)
- No object pooling
- Limited reusability
- Hard to maintain consistent behavior

## Proposed Solution: Custom Particle System

### Why Custom vs Library?
**Pros of Custom:**
- Lightweight - only what we need
- No learning curve
- Perfect integration with existing code
- Easy to extend for game-specific needs
- No external dependencies

**Cons of Library (e.g., three-particles):**
- Additional bundle size
- Potential overkill for simple sprite particles
- Learning/integration overhead
- May not fit our existing sprite-based approach

**Decision: Build Custom System**

## Architecture

### Core Components

#### 1. ParticleSystem (Manager)
- Owns all particles
- Updates active particles each frame
- Handles object pooling
- Manages particle lifecycle

#### 2. Particle (Individual particle)
- Position, velocity, acceleration
- Scale (start, end, current)
- Opacity (start, end, current)
- Age, lifetime
- Sprite reference
- Update behavior

#### 3. ParticleEmitter (Spawner)
- Configuration-based particle spawning
- Spawn patterns (burst, stream, cone, etc.)
- Particle templates

### File Structure
```
src/particles/
├── ParticleSystem.js    - Main system manager
├── Particle.js          - Individual particle class
└── ParticleEmitter.js   - Emitter/spawner
```

## Features

### Phase 1 (Implement Now)
- Basic particle lifecycle
- Sprite-based rendering
- Common behaviors (fade, scale, move)
- Object pooling (50-100 particle pool)
- Emitter with burst/continuous modes

### Phase 2 (Future)
- Particle affectors (gravity, wind, attraction)
- Collision detection
- Texture atlasing
- More spawn patterns
- GPU particles for massive effects

## Implementation Plan

1. Create ParticleSystem class
   - Manages pool of reusable particles
   - Update loop integration
   - Scene management

2. Create Particle class
   - Properties and lifecycle
   - Update method
   - Reset method for pooling

3. Create ParticleEmitter class
   - Configuration object
   - Spawn methods
   - Patterns

4. Integrate with existing effects
   - Replace manual particle code in FireExplosion
   - Replace manual particle code in LightningExplosion
   - Replace manual particle code in FlameProjectile

5. Test and optimize
   - Verify performance
   - Tune pool size
   - Profile memory usage

## Example Usage
```javascript
// In effect class
const emitter = new ParticleEmitter(particleSystem, {
  texture: fireTexture,
  count: 30,
  lifetime: { min: 0.5, max: 0.8 },
  startScale: { min: 0.3, max: 0.5 },
  endScale: { min: 0.8, max: 1.2 },
  startOpacity: 1,
  endOpacity: 0,
  velocity: {
    radial: { min: 3, max: 8 },
    upward: { min: 1, max: 2 }
  }
});

emitter.burst(x, y, z);
```

## Performance Considerations
- Pool size: 100 particles (sufficient for current needs)
- Reuse sprites instead of creating/destroying
- Update only active particles
- Consider spatial hashing if > 500 particles
- Batch similar particles for rendering (future)

## Integration Points
- GameEngine.update() - Call particleSystem.update(dt)
- GameEngine.init() - Initialize particle system
- Effects - Use emitters instead of manual particles
