# It's Just Fine - Development Tools

This directory contains the development tools suite for building and managing game content.

## 🛠️ Available Tools

### 1. Asset Viewer
**Status:** ✅ Implemented
**Path:** `/tools/asset-viewer/`

Browse and preview all game assets including:
- Sprites (environment, items, equipment, props)
- Textures (ground tiles)
- 3D Models (coming soon)

Features:
- Grid and list view modes
- Search and filter assets
- Zoom controls
- Asset preview with metadata

### 2. World Builder
**Status:** 🚧 Coming Soon
**Path:** `/tools/world-builder/`

Design and construct game levels:
- Place terrain tiles
- Position objects and props
- Configure spawn points
- Export level data

### 3. Spell Creator
**Status:** 🚧 Coming Soon
**Path:** `/tools/spell-creator/`

Create and balance spells:
- Configure damage and effects
- Set cooldowns and mana costs
- Design visual effects
- Export spell definitions

### 4. Effects Creator
**Status:** 🚧 Coming Soon
**Path:** `/tools/effects-creator/`

Design particle effects and animations:
- Particle system editor
- Visual effect previews
- Animation timeline
- Export effect configurations

### 5. Enemy Creator
**Status:** 🚧 Coming Soon
**Path:** `/tools/enemy-creator/`

Configure enemy types:
- Set stats and attributes
- Define AI behavior
- Configure loot drops
- Export enemy data

## 📁 Directory Structure

```
tools/
├── index.html              # Main tools launcher
├── asset-viewer/           # Asset browsing tool
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── world-builder/          # Level design tool
├── spell-creator/          # Spell configuration tool
├── effects-creator/        # VFX design tool
├── enemy-creator/          # Enemy configuration tool
└── shared/                 # Shared utilities and components
    ├── components/
    │   └── FileExplorer.js # Reusable file browser
    ├── utils/
    │   └── AssetLoader.js  # Asset loading utility
    └── styles/
        └── tools.css       # Shared styling
```

## 🚀 Getting Started

1. Open the tools launcher:
   ```
   http://localhost:5173/tools/
   ```

2. Select a tool from the grid

3. Each tool is a standalone web application that can be developed independently

## 🔧 Development Guidelines

### Adding a New Tool

1. Create a new directory under `/tools/`
2. Include at minimum:
   - `index.html` - Tool UI
   - `main.js` - Tool logic
   - `styles.css` - Tool-specific styles
3. Add the tool to the launcher in `/tools/index.html`
4. Use shared utilities from `/tools/shared/`

### Shared Utilities

#### AssetLoader
```javascript
import { AssetLoader } from '../shared/utils/AssetLoader.js';

const loader = new AssetLoader();
const texture = await loader.loadTexture('sprites/items/sword.png');
const data = await loader.loadJSON('data/spells.json');
```

#### FileExplorer
```javascript
import { FileExplorer } from '../shared/components/FileExplorer.js';

const explorer = new FileExplorer('container-id', {
    onSelect: (path) => console.log('Selected:', path)
});
explorer.render();
```

### Styling

All tools inherit base styles from `/tools/shared/styles/tools.css`:
- Dark theme with purple accents
- Responsive grid layouts
- Form controls and buttons
- Common UI components

Add tool-specific styles in the tool's own `styles.css`.

## 📝 Asset Management

Tools should reference assets from:
```
../../public/assets/
├── sprites/
│   ├── environment/
│   ├── items/
│   ├── equipment/
│   └── props/
├── textures/
│   └── ground/
├── models/
└── data/
```

## 🔮 Future Enhancements

- [ ] Asset import/export functionality
- [ ] Real-time collaboration
- [ ] Undo/redo system
- [ ] Asset validation
- [ ] Automated testing tools
- [ ] Performance profiling
- [ ] Live game preview
- [ ] Asset version control

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Game Asset Guidelines](../docs/assets.md)
- [Level Design Patterns](../docs/levels.md)

---

**Note:** These tools are designed to run in the browser and use modern ES6 modules. Make sure to run them through a development server (Vite).
