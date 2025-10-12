/**
 * GameSettings - Central settings management system
 * Handles gameplay, graphics, controls, and other game settings
 */

const DEFAULT_SETTINGS = {
  // Gameplay settings
  gameplay: {
    showDamageNumbers: true, // Show floating damage numbers when enemies are hit
  },

  // Control settings
  controls: {
    // Camera movement behavior:
    // 'continuous' - walking direction updates continuously with camera rotation
    // 'locked' - direction locks when key pressed, only updates on key release/press
    cameraMovementMode: 'locked', // 'continuous' or 'locked'
  },
};

export class GameSettings {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = [];
    this.load();
  }

  /**
   * Load settings from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('gameSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings added in updates
        this.settings = this.mergeWithDefaults(parsed, DEFAULT_SETTINGS);
        console.log('Settings loaded:', this.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to localStorage
   */
  save() {
    try {
      localStorage.setItem('gameSettings', JSON.stringify(this.settings));
      console.log('Settings saved');
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Merge saved settings with defaults (for backwards compatibility)
   */
  mergeWithDefaults(saved, defaults) {
    const result = {};

    for (const key in defaults) {
      if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
        result[key] = this.mergeWithDefaults(
          saved[key] || {},
          defaults[key]
        );
      } else {
        result[key] = saved[key] !== undefined ? saved[key] : defaults[key];
      }
    }

    return result;
  }

  /**
   * Get a setting value
   * @param {string} path - Dot notation path (e.g., 'controls.cameraMovementMode')
   */
  get(path) {
    const keys = path.split('.');
    let value = this.settings;

    for (const key of keys) {
      if (value === undefined) return undefined;
      value = value[key];
    }

    return value;
  }

  /**
   * Set a setting value
   * @param {string} path - Dot notation path (e.g., 'controls.cameraMovementMode')
   * @param {*} value - New value
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  /**
   * Reset all settings to defaults
   */
  reset() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.save();
  }

  /**
   * Reset a specific category to defaults
   * @param {string} category - Category name (e.g., 'controls')
   */
  resetCategory(category) {
    if (DEFAULT_SETTINGS[category]) {
      this.settings[category] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[category]));
      this.save();
    }
  }

  /**
   * Get all settings
   */
  getAll() {
    return this.settings;
  }

  /**
   * Get settings for a specific category
   * @param {string} category - Category name
   */
  getCategory(category) {
    return this.settings[category] || {};
  }

  /**
   * Add a listener for settings changes
   * @param {Function} callback - Called when settings change
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   * @param {Function} callback - Listener to remove
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of settings change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const gameSettings = new GameSettings();

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  window.gameSettings = gameSettings;
}
