/**
 * main.js - Entry point for Its Just Fine v2
 *
 * This is the MINIMAL entry point that:
 * 1. Imports the game class
 * 2. Creates an instance
 * 3. Initializes and starts the game
 *
 * All game-specific logic is in src/game/
 */

import { ItsJustFine } from './game/ItsJustFine.js';
import { SurvivalMode } from './game/modes/SurvivalMode.js';
import { ResourceCache } from './core/pooling/ResourceCache.js';
import { OptimizationConfig } from './core/config/optimization.js';

// Create game instance
const game = new ItsJustFine();

// Expose to window for debugging
window.game = game;
window.ResourceCache = ResourceCache;
window.OptimizationConfig = OptimizationConfig;

// Debug function for optimization stats
window.logOptimizationStats = () => {
  console.log('📊 Optimization Statistics:');
  console.log('='.repeat(50));

  // Resource Cache
  const cacheStats = ResourceCache.getStats();
  console.log('\n🎨 Resource Cache:');
  console.log('  Materials Cached:', cacheStats.materialsCached);
  console.log('  Materials Created:', cacheStats.materialsCreated);
  console.log('  Materials Reused:', cacheStats.materialsReused);
  console.log('  Material Reuse Rate:', cacheStats.materialReuseRate);
  console.log('  Geometries Cached:', cacheStats.geometriesCached);
  console.log('  Geometries Created:', cacheStats.geometriesCreated);
  console.log('  Geometries Reused:', cacheStats.geometriesReused);
  console.log('  Geometry Reuse Rate:', cacheStats.geometryReuseRate);

  // Particle Manager
  if (game.particleManager) {
    const pmStats = game.particleManager.getStats();
    console.log('\n✨ Particle Manager:');
    console.log('  Mode:', pmStats.mode);
    console.log('  Total Spawned:', pmStats.totalSpawned);
    console.log('  Entity Particles:', pmStats.entityParticles);
    console.log('  Instanced Particles:', pmStats.instancedParticles);
    console.log('  Pool Count:', pmStats.poolCount);
    console.log('  Active/Capacity:', `${pmStats.totalActive}/${pmStats.totalCapacity}`);
    console.log('  Utilization:', pmStats.utilizationRate);
  }

  // Frustum Culler
  if (game.frustumCuller && OptimizationConfig.frustumCulling.enabled) {
    const fcStats = game.frustumCuller.getStats();
    console.log('\n🔭 Frustum Culling:');
    console.log('  Total Checks:', fcStats.totalChecks);
    console.log('  Visible:', fcStats.visible);
    console.log('  Culled:', fcStats.culled);
    console.log('  Cull Rate:', fcStats.cullRate);
  }

  // AI System
  if (game.aiSystem) {
    const aiStats = game.aiSystem.getStats();
    console.log('\n🤖 AI System:');
    console.log('  Total Entities:', aiStats.totalEntities);
    console.log('  Frustum Culled:', aiStats.frustumCulled);
    console.log('  Throttled:', aiStats.throttled);
    console.log('  Updated:', aiStats.updated);
    console.log('  Update Rate:', aiStats.updateRate);
  }

  // Collision System
  if (game.collisionSystem) {
    const csStats = game.collisionSystem.getStats();
    console.log('\n💥 Collision System:');
    console.log('  Total Entities:', csStats.totalEntities);
    console.log('  Narrow Phase Checks:', csStats.narrowPhaseChecks);
    console.log('  Max Possible Checks:', csStats.maxPossibleChecks);
    console.log('  Collisions:', csStats.collisions);
    console.log('  Efficiency:', csStats.efficiency);
    console.log('  Spatial Grid:', csStats.spatialGridEnabled ? '✅' : '❌');
    if (csStats.gridStats) {
      console.log('  Grid Cell Size:', csStats.gridStats.cellSize);
      console.log('  Grid Cells:', csStats.gridStats.cellCount);
      console.log('  Avg Entities/Cell:', csStats.gridStats.avgEntitiesPerCell);
      console.log('  Avg Entities/Query:', csStats.gridStats.avgEntitiesPerQuery);
    }
  }

  console.log('\n' + '='.repeat(50));
};

// Hide loading screen
function hideLoadingScreen() {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
  }
}

// Initialize and start the game
game.init().then(() => {
  console.log('🎮 Game initialized, starting Survival Mode...');

  // Create and start survival mode
  const survivalMode = new SurvivalMode();
  game.startGameMode(survivalMode);

  hideLoadingScreen();
  console.log('🚀 Game started!');
}).catch(error => {
  console.error('❌ Failed to initialize game:', error);
  console.error('Error stack:', error.stack);

  // Show error
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.innerHTML = `
      <div style="color: #ff4444;">
        ❌ Failed to initialize game<br>
        <div style="font-size: 16px; margin-top: 10px; color: #ff8888;">
          ${error.message}
        </div>
        <div style="font-size: 12px; margin-top: 10px; color: #ffaaaa;">
          Check browser console for details
        </div>
      </div>
    `;
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.cleanup();
});

export { game };
