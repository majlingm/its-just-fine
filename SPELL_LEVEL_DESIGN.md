# Spell Level System Design (7 Levels)

## General Upgrade Attributes (Common Across Spell Types)

### Combat Attributes
- **Damage**: Base damage dealt
- **Cooldown**: Time between casts (lower is better)
- **Range**: Maximum effective range or targeting distance

### Projectile Attributes (for projectile spells)
- **Speed**: Projectile travel speed
- **Pierce**: Number of enemies projectile can pass through
- **Projectile Count**: Number of projectiles fired per cast
- **Spread**: Angle between multiple projectiles
- **Lifetime**: How long projectile exists before disappearing

### Area Effect Attributes (for AoE spells)
- **Radius**: Size of explosion/effect area
- **Particle Count**: Number of damage-dealing particles

### Persistent Effect Attributes (for ring spells)
- **Particle Count**: Number of orbiting particles
- **Ring Radius**: Distance particles orbit from player
- **Regeneration Rate**: Speed at which destroyed particles respawn
- **Rotation Speed**: How fast ring rotates
- **Burst Damage Multiplier**: Damage multiplier when burst is triggered
- **Burst Cooldown**: Cooldown after using burst ability

### Status Effect Attributes (for ice spells)
- **Freeze Duration**: How long enemies are frozen
- **Freeze Slow Amount**: Movement speed reduction percentage

### Visual Attributes
- **Size/Scale**: Visual size of effects
- **Width/Thickness**: Line/beam thickness
- **Branch Count**: Number of lightning branches
- **Trail Intensity**: Particle trail density
- **Color Intensity**: Brightness/saturation of effects

---

## Spell-Specific Upgrade Progression

### ⚡ THUNDER_STRIKE
**Type**: Instant AoE Lightning

**Upgradeable Attributes**:
1. **Damage**: 200 → 250 → 300 → 375 → 475 → 600 → 800
2. **Explosion Radius**: 5 → 5.5 → 6 → 7 → 8 → 9.5 → 11
3. **Cooldown (Min-Max)**: 0.8-1.5s → 0.7-1.3s → 0.6-1.1s → 0.5-0.9s → 0.4-0.7s → 0.3-0.5s → 0.2-0.4s
4. **Lightning Width**: 1.2 → 1.3 → 1.4 → 1.6 → 1.8 → 2.1 → 2.5
5. **Branch Count**: 2-5 → 3-6 → 4-7 → 5-8 → 6-10 → 7-12 → 8-15
6. **Shockwave Rings**: 3 → 3 → 4 → 4 → 5 → 5 → 6

---

### ⚡ CHAIN_LIGHTNING
**Type**: Continuous Chaining Lightning

**Upgradeable Attributes**:
1. **Damage**: 8 → 9 → 10 → 12 → 14 → 16 → 18
2. **Chain Count**: 3 → 3 → 4 → 4 → 5 → 5 → 6
3. **Chain Range**: 4 → 4.5 → 5 → 5.5 → 6 → 6.5 → 7
4. **Cooldown**: 0.15s → 0.14s → 0.13s → 0.12s → 0.11s → 0.10s → 0.09s
5. **Max Range**: 8 → 9 → 10 → 11 → 12 → 13 → 14
6. **Lightning Width**: 1.2 (constant - no thickness increase)

**Balance Notes**: Heavily nerfed for balance. Damage reduced to 8-18 (vs original 12-60), max chains reduced to 6 (vs 12), chain range and initial range cut by ~30-40%. This spell is now a support/crowd control option rather than a primary damage dealer.

---

### 🔥 FIREBALL
**Type**: Projectile

**Upgradeable Attributes**:
1. **Damage**: 16 → 20 → 26 → 34 → 45 → 60 → 80
2. **Speed**: 20 → 22 → 24 → 27 → 30 → 34 → 40
3. **Pierce**: 2 → 3 → 4 → 5 → 6 → 8 → 10
4. **Projectile Count**: 1 → 1 → 2 → 2 → 3 → 3 → 4
5. **Spread Angle**: 0° → 0° → 15° → 15° → 20° → 20° → 25°
6. **Cooldown**: 0.25s → 0.23s → 0.20s → 0.17s → 0.14s → 0.11s → 0.08s
7. **Size Scale**: 1.0x → 1.1x → 1.2x → 1.35x → 1.5x → 1.7x → 2.0x

---

### 🔥 PYRO_EXPLOSION
**Type**: Instant AoE Fire

**Upgradeable Attributes**:
1. **Damage**: 30 → 40 → 55 → 75 → 100 → 135 → 180
2. **Radius**: 3.5 → 4.0 → 4.5 → 5.2 → 6.0 → 7.0 → 8.5
3. **Cooldown**: 1.5s → 1.3s → 1.1s → 0.9s → 0.7s → 0.5s → 0.3s
4. **Particle Count**: 20 → 25 → 30 → 40 → 50 → 65 → 85
5. **Shockwave Rings**: 3 → 3 → 4 → 4 → 5 → 5 → 6

---

### 🔥 RING_OF_FIRE
**Type**: Persistent Orbiting Ring

**Upgradeable Attributes**:
1. **Damage (Total DPS)**: 15 → 20 → 27 → 37 → 50 → 68 → 92
2. **Particle Count**: 64 → 72 → 80 → 90 → 100 → 112 → 128
3. **Ring Radius**: 2.2 → 2.3 → 2.4 → 2.5 → 2.7 → 2.9 → 3.2
4. **Regeneration Rate**: 0.1s → 0.09s → 0.08s → 0.07s → 0.06s → 0.05s → 0.04s
5. **Burst Regen Rate**: 0.01s (same all levels)
6. **Rotation Speed**: 1.5 → 1.6 → 1.7 → 1.9 → 2.1 → 2.4 → 2.8
7. **Burst Damage Mult**: 6x → 6.5x → 7x → 8x → 9x → 11x → 14x
8. **Burst Cooldown**: 1.5s → 1.4s → 1.2s → 1.0s → 0.8s → 0.6s → 0.4s
9. **Particle Size**: 0.55-0.9 → 0.6-0.95 → 0.65-1.0 → 0.7-1.1 → 0.75-1.2 → 0.85-1.35 → 1.0-1.5

---

### ❄️ ICE_LANCE
**Type**: Projectile with Freeze

**Upgradeable Attributes**:
1. **Damage**: 20 → 26 → 34 → 45 → 60 → 80 → 110
2. **Speed**: 25 → 27 → 30 → 33 → 37 → 42 → 48
3. **Pierce**: 3 → 4 → 5 → 6 → 7 → 9 → 12
4. **Cooldown (Min-Max)**: 0.3-0.8s → 0.28-0.7s → 0.25-0.6s → 0.22-0.5s → 0.18-0.4s → 0.14-0.3s → 0.1-0.2s
5. **Freeze Duration**: 10s → 11s → 12s → 14s → 16s → 19s → 23s
6. **Freeze Slow**: 80% → 82% → 84% → 86% → 88% → 91% → 94%
7. **Size Scale**: 1.0x → 1.1x → 1.2x → 1.35x → 1.5x → 1.7x → 2.0x
8. **Trail Particle Rate**: 0.04s → 0.04s → 0.035s → 0.03s → 0.025s → 0.02s → 0.015s

---

### ❄️ RING_OF_ICE
**Type**: Persistent Orbiting Ring with Freeze

**Upgradeable Attributes**:
1. **Damage (Total DPS)**: 10 → 14 → 19 → 26 → 36 → 49 → 67
2. **Particle Count**: 64 → 72 → 80 → 90 → 100 → 112 → 128
3. **Ring Radius**: 2.2 → 2.3 → 2.4 → 2.5 → 2.7 → 2.9 → 3.2
4. **Regeneration Rate**: 0.1s → 0.09s → 0.08s → 0.07s → 0.06s → 0.05s → 0.04s
5. **Burst Regen Rate**: 0.01s (same all levels)
6. **Rotation Speed**: 1.2 → 1.3 → 1.4 → 1.6 → 1.8 → 2.1 → 2.5
7. **Burst Damage Mult**: 5x → 5.5x → 6x → 7x → 8x → 10x → 13x
8. **Burst Cooldown**: 1.5s → 1.4s → 1.2s → 1.0s → 0.8s → 0.6s → 0.4s
9. **Freeze Duration**: 10s → 11s → 12s → 14s → 16s → 19s → 23s
10. **Freeze Slow**: 80% → 82% → 84% → 86% → 88% → 91% → 94%
11. **Particle Size**: 0.55-0.9 → 0.6-0.95 → 0.65-1.0 → 0.7-1.1 → 0.75-1.2 → 0.85-1.35 → 1.0-1.5

---

### ✨ MAGIC_BULLET
**Type**: Random Direction Projectile

**Upgradeable Attributes**:
1. **Damage**: 8 → 11 → 15 → 21 → 29 → 40 → 55
2. **Speed**: 30 → 33 → 36 → 40 → 45 → 51 → 60
3. **Pierce**: 1 → 2 → 3 → 4 → 5 → 7 → 10
4. **Cooldown**: 0.08s → 0.07s → 0.06s → 0.05s → 0.045s → 0.04s → 0.035s
5. **Projectile Count**: 1 → 1 → 2 → 2 → 3 → 3 → 4
6. **Lifetime**: 1.5s → 1.6s → 1.8s → 2.0s → 2.3s → 2.7s → 3.2s
7. **Size Scale**: 0.4 → 0.45 → 0.5 → 0.55 → 0.6 → 0.7 → 0.85

**Performance Optimizations**:
- Reduced trail particle spawn rate (4x slower)
- Limited max trail particles per bullet (5)
- Cached textures for bullet and trail sprites
- Optimized trail particle updates and cleanup

---

## Scaling Philosophy

### Damage Scaling
- **Early levels (1-3)**: +25-30% per level (modest growth)
- **Mid levels (4-5)**: +30-35% per level (accelerating)
- **Late levels (6-7)**: +35-40% per level (powerful)

### Cooldown Scaling
- **Early levels**: Small reductions (10-15%)
- **Late levels**: Significant reductions (20-30%)
- **Max level**: Extremely fast (spam-friendly)

### Visual Scaling
- **Size/Width**: Grows moderately (don't make too large)
- **Particle Count**: Increases for density and visual impact
- **Effects**: More impressive at higher levels

### Utility Scaling
- **Pierce**: Increases significantly at higher levels
- **Chain Count**: Doubles by max level
- **Freeze Duration**: Grows substantially for crowd control

---

## Balance Considerations

1. **Early Game (Levels 1-2)**: Functional but basic
2. **Mid Game (Levels 3-5)**: Noticeable power increase, new mechanics unlock (multi-projectile, etc.)
3. **Late Game (Levels 6-7)**: Spectacular, screen-clearing power

**Upgrade Cost**: Should increase exponentially with level
- Level 1→2: 1x cost
- Level 2→3: 2x cost
- Level 3→4: 3x cost
- Level 4→5: 5x cost
- Level 5→6: 8x cost
- Level 6→7: 13x cost
