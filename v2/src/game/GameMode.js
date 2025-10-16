/**
 * GameMode - Base class for game modes
 *
 * Defines the interface that all game modes must implement.
 * Game modes control:
 * - Level/map loading
 * - Spawn configuration
 * - Win/loss conditions
 * - Mode-specific mechanics
 */

export class GameMode {
  constructor(modeId, modeName) {
    this.id = modeId;
    this.name = modeName;
    this.game = null; // Reference to ItsJustFine instance
  }

  /**
   * Initialize the game mode
   * @param {ItsJustFine} game - Main game instance
   */
  async init(game) {
    this.game = game;
  }

  /**
   * Update game mode logic
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Override in subclasses
  }

  /**
   * Check win condition
   * @returns {boolean} True if won
   */
  checkWinCondition() {
    return false;
  }

  /**
   * Check loss condition
   * @returns {boolean} True if lost
   */
  checkLossCondition() {
    return false;
  }

  /**
   * Cleanup mode
   */
  cleanup() {
    // Override in subclasses
  }
}
