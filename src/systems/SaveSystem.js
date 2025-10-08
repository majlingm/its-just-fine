export class SaveSystem {
  constructor() {
    this.storageKey = 'dustAndDynamite_save';
  }

  saveGame(gameState) {
    try {
      const saveData = {
        version: '1.0',
        timestamp: Date.now(),
        player: {
          level: gameState.player.level,
          xp: gameState.player.xp,
          xpToNext: gameState.player.xpToNext,
          health: gameState.player.health,
          maxHealth: gameState.player.maxHealth,
          stats: { ...gameState.player.stats },
          weapons: gameState.player.weapons.map(w => ({
            type: w.type,
            level: w.level
          }))
        },
        progress: {
          wave: gameState.wave,
          killCount: gameState.killCount,
          highestWave: this.getHighestWave(),
          totalKills: this.getTotalKills() + gameState.killCount
        },
        settings: {
          soundEnabled: gameState.engine.sound.enabled
        }
      };

      // Update highest wave if current is higher
      if (gameState.wave > saveData.progress.highestWave) {
        saveData.progress.highestWave = gameState.wave;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return null;

      const saveData = JSON.parse(saved);

      // Validate version
      if (saveData.version !== '1.0') {
        console.warn('Save data version mismatch');
        return null;
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  deleteSave() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  hasSave() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  getHighestWave() {
    const saved = this.loadGame();
    return saved?.progress?.highestWave || 0;
  }

  getTotalKills() {
    const saved = this.loadGame();
    return saved?.progress?.totalKills || 0;
  }

  saveProgress(wave, kills) {
    const current = this.loadGame() || {
      version: '1.0',
      progress: { highestWave: 0, totalKills: 0 }
    };

    if (wave > current.progress.highestWave) {
      current.progress.highestWave = wave;
    }
    current.progress.totalKills = (current.progress.totalKills || 0) + kills;
    current.timestamp = Date.now();

    localStorage.setItem(this.storageKey, JSON.stringify(current));
  }
}
