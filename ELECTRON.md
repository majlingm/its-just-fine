# Electron Desktop App

This game is now available as a desktop application using Electron!

## 🎮 Quick Start

### Run the Desktop App
```bash
# Build and run the desktop app
npm run electron:build

# Or just run with existing build
npm run electron
```

### Development Mode
```bash
# Start Vite dev server in one terminal
npm run dev

# Run Electron with dev server in another terminal
npm run electron:dev
```

## 📦 Building Distributables

### Build for Current Platform
```bash
npm run dist
```

### Build for Specific Platforms
```bash
# Windows (.exe installer)
npm run dist:win

# macOS (.dmg)
npm run dist:mac

# Linux (AppImage)
npm run dist:linux
```

Built apps will be in the `release/` folder.

## 🎯 Features

- **Native Performance**: Direct GPU access for better performance
- **Fullscreen Support**: Press F11 for immersive fullscreen
- **No Browser UI**: Clean gaming experience
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Offline Play**: No internet connection required

## 🎮 Controls

- **F11**: Toggle fullscreen
- **Cmd/Ctrl + R**: Reload game
- **Cmd/Ctrl + Q**: Quit application
- **Cmd/Ctrl + Shift + I**: Developer tools (dev mode only)

## 📝 Configuration

The Electron configuration is in:
- `electron.js` - Main process file
- `package.json` > `build` section - Build configuration

## 🚀 Distributing Your Game

1. Build for your target platform(s):
   ```bash
   npm run dist
   ```

2. Find the installer in `release/` folder:
   - **Windows**: `It's Just Fine Setup 1.0.0.exe`
   - **macOS**: `It's Just Fine-1.0.0.dmg`
   - **Linux**: `It's Just Fine-1.0.0.AppImage`

3. Share with friends or upload to game platforms!

## 📱 Icon Setup

Currently using the default Vite icon. To add a custom icon:

1. Create your icon in these sizes:
   - Windows: 256x256 `.ico` file
   - macOS: 512x512 `.icns` file
   - Linux: 512x512 `.png` file

2. Place in `build/` folder

3. Update `package.json`:
   ```json
   "build": {
     "mac": {
       "icon": "build/icon.icns"
     },
     "win": {
       "icon": "build/icon.ico"
     },
     "linux": {
       "icon": "build/icon.png"
     }
   }
   ```

## 🔧 Troubleshooting

- **White Screen**: Make sure you've built the project first with `npm run build`
- **Can't Load Assets**: Check that `vite.config.js` has `base: './'`
- **Performance Issues**: Electron includes Chromium, so it uses more RAM than the web version

## 🎉 That's It!

Your game is now a desktop app! Perfect for:
- Steam release
- itch.io distribution
- Epic Games Store
- Or just playing offline!