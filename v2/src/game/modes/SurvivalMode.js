/**
 * SurvivalMode - Infinite wave-based survival gameplay
 *
 * Players survive endless waves of enemies with increasing difficulty.
 * Win condition: None (infinite mode)
 * Loss condition: Player death
 */

import { GameMode } from '../GameMode.js';

export class SurvivalMode extends GameMode {
  constructor() {
    super('survival', 'Survival');
  }

  /**
   * Initialize survival mode
   */
  async init(game) {
    await super.init(game);

    // Load the survival level (which loads environment and spawn config)
    await game.loadLevel('survival_void');
    console.log('✅ Level loaded');

    // Create player at level's start position
    await game.createPlayer();
    console.log('✅ Player created');

    // Initialize spawn system (spawn config already loaded by level system)
    await game.spawnSystem.init('survival_basic');
    console.log('✅ Spawn system initialized');
  }

  /**
   * Update survival mode
   */
  update(dt) {
    // Check loss condition
    if (this.checkLossCondition()) {
      this.game.gameState = 'gameover';
      console.log('💀 Game Over!');
    }
  }

  /**
   * Survival mode has no win condition (infinite)
   */
  checkWinCondition() {
    return false;
  }

  /**
   * Loss condition: Player is dead
   */
  checkLossCondition() {
    if (!this.game.player) return false;

    const health = this.game.player.getComponent('Health');
    return health && health.current <= 0;
  }
}
