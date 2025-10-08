# Game Redesign Plan - Magical Girl vs Zombies

## Theme Change
**From**: Bob Rocks (western/desert theme)
**To**: Anime magical girl fighting zombies

---

## 1. Wave System ✅ IN PROGRESS

### Completed:
- ✅ Created `WaveSystem.js` with full wave management
- ✅ Wave progression (4 waves per level)
- ✅ Enemy type mixing (normal, fast, elite)
- ✅ Difficulty scaling per wave
- ✅ Added wave config to `urbanOutpost.js` level

### Still Todo:
- ⏳ Add wave configs to other levels
- ⏳ Integrate into `DustAndDynamiteGame.js`
- ⏳ Add wave counter UI display
- ⏳ Add "Wave X Starting" notifications

---

## 2. Boss System ⏳ TODO

### Boss Features:
- Spawn ALONE after all waves complete
- Massive health pool (5000+ HP)
- Unique attack patterns:
  - **Charge attack** - Rushes at player
  - **Area slam** - AOE damage around boss
  - **Summon minions** - Spawns small zombies
  - **Projectile attack** - Shoots at player from range
- Telegraphed attacks (visual warnings)
- Phase changes (enrage at 50% HP, 25% HP)

### Implementation Steps:
1. Create `Boss.js` entity class
2. Add boss attack AI
3. Add visual attack telegraphs
4. Create boss health bar UI
5. Add boss defeat rewards/progression

---

## 3. Player Movement Upgrades ⏳ TODO

### New Upgrade Options:
- **Movement Speed** - Increase base movement (important for bosses!)
- **Dash Cooldown** - Reduce dash cooldown
- **Dash Distance** - Increase dash range
- **Stamina** - Add multiple dash charges

### Implementation:
- Add to level-up screen
- Update Player stats system
- Balance with existing upgrades

---

## 4. UI Theme Redesign 🎨 TODO

### Color Palette (Magical Girl / Cute):
```css
Primary: #FF6B9D (Hot Pink)
Secondary: #C724B1 (Magenta)
Accent: #FFD93D (Yellow/Gold)
Background: #4A2545 (Dark Purple)
Text: #FFF5E1 (Cream White)
Success: #6BCF7F (Mint Green)
Warning: #FF8C42 (Orange)
```

### UI Elements to Redesign:
- ⏳ Main menu background
- ⏳ Level select screen
- ⏳ In-game HUD (health, XP bar)
- ⏳ Wave counter display (top center)
- ⏳ Spell interface (cuter icons/buttons)
- ⏳ Level-up screen (magical sparkles!)
- ⏳ Boss health bar (dramatic, large)
- ⏳ Victory/defeat screens

### Visual Style:
- Rounded corners everywhere
- Gradient backgrounds
- Sparkle/star particle effects
- Cute fonts (bubbly, friendly)
- Hearts instead of generic icons
- Rainbow effects for magical attacks

---

## 5. Game Theme Updates 🎨 TODO

### Name Change:
**From**: Bob Rocks / Dust and Dynamite
**To**: TBD (Magical Girl name)
- Suggestions: "Magical Defense Squad", "Spell Girl Chronicles", "Enchanted Survivor"

### Visual Updates:
- ⏳ Update player character (magical girl sprite/model)
- ⏳ Add magical effects to spells (more sparkles!)
- ⏳ Update enemy appearance (zombies, undead)
- ⏳ Add anime-style hit effects (stars, impact lines)
- ⏳ Cute damage numbers (bouncy, colorful)

### Audio Updates:
- ⏳ Upbeat magical girl music
- ⏳ Cute spell sound effects
- ⏳ Dramatic boss music

---

## Implementation Order (Recommended)

### Phase 1: Core Gameplay (Do First)
1. **Complete Wave System**
   - Integrate into game loop
   - Add wave counter UI
   - Test wave progression

2. **Boss Implementation**
   - Create Boss entity
   - Implement attack patterns
   - Add boss health bar
   - Test boss fights

3. **Movement Upgrades**
   - Add to upgrade system
   - Balance with existing upgrades

### Phase 2: Visual Polish (Do Second)
4. **Basic UI Redesign**
   - Update color scheme
   - Redesign HUD
   - Add wave counter

5. **Theme Updates**
   - Update text/names
   - Add sparkle effects
   - Improve visual feedback

### Phase 3: Full Theme (Do Last)
6. **Complete Visual Overhaul**
   - Character art
   - Enemy models
   - Spell effects
   - Audio replacement

---

## Current Status

✅ **Completed**:
- Wave system architecture
- Wave configuration structure
- One level with wave config

⏳ **Next Steps** (in order):
1. Finish wave system integration (30 min)
2. Create Boss entity class (1 hour)
3. Add movement upgrades (30 min)
4. Basic UI color update (30 min)
5. Full UI redesign (2-3 hours)
6. Theme overhaul (ongoing)

---

## Questions to Answer:

1. **Boss Design**: What attacks should each boss have?
2. **UI Colors**: Approve the pink/purple/yellow palette?
3. **Game Name**: What should the new game be called?
4. **Character**: Keep simple sprites or want anime girl artwork?
5. **Enemies**: Keep current enemies or redesign as zombies?

---

Would you like me to:
- A) Continue with wave system integration NOW
- B) Jump to UI redesign first (visual changes)
- C) Create the Boss entity first (gameplay)
- D) Something else?
