/**
 * Optimization Configuration
 *
 * Central configuration for all performance optimizations.
 * Each optimization can be toggled on/off for testing and performance comparison.
 */

export const OptimizationConfig = {
  // Resource Caching (Materials & Geometries)
  resourceCaching: {
    enabled: true,               // Use ResourceCache for Three.js resources
    debug: false                 // Log cache statistics
  },

  // Entity Pooling
  entityPooling: {
    enabled: false,              // Not integrated yet
    initialPoolSize: 50,        // Pre-allocate entities
    maxPoolSize: 200,            // Maximum pool size
    expandBy: 10,                // Grow by this amount when pool is empty
    poolByType: true,            // Separate pools per entity type
    preWarmOnStart: true,        // Create initial pool on game start
    debug: false                 // Log pool statistics
  },

  // Projectile Pooling
  projectilePooling: {
    enabled: false,              // Not integrated yet
    initialPoolSize: 100,        // Pre-allocate projectiles
    maxPoolSize: 500,            // Maximum pool size
    expandBy: 20,                // Grow by this amount when pool is empty
    preWarmOnStart: true,        // Create initial pool on game start
    debug: false                 // Log pool statistics
  },

  // Particle System Optimization
  particlePooling: {
    enabled: true,               // ✅ ACTIVE - InstancedMesh rendering
    useInstancedMesh: true,      // Use InstancedMesh for particles
    maxParticles: 1000,          // Maximum concurrent particles
    instancesPerType: 500,       // Instances per particle type
    cullingEnabled: true,        // Frustum culling for particles
    maxDistance: 100,            // Max render distance for particles
    lodEnabled: true,            // Level of detail for distant particles
    debug: false                 // Log particle statistics
  },

  // Audio Caching
  audioCaching: {
    enabled: false,              // Not implemented yet
    maxCachedSounds: 50,         // Maximum sounds to keep in memory
    preloadCommonSounds: true,   // Preload frequently used sounds
    pooledAudioSources: 20,      // Pooled audio source objects
    spatialAudioEnabled: true,   // 3D spatial audio
    maxAudioDistance: 50,        // Max distance for spatial audio
    debug: false                 // Log audio statistics
  },

  // Frustum Culling
  frustumCulling: {
    enabled: true,               // Don't update entities outside camera view
    alwaysUpdatePlayer: true,    // Always update player entity
    alwaysUpdatePickups: true,   // Always update pickup entities
    applyToAI: false,            // Don't cull AI (enemies need to move toward player off-screen)
    applyToMovement: true,       // Apply to movement system
    applyToPhysics: false,       // Don't cull physics
    updateRadius: 5,             // Extra radius beyond bounding sphere
    debug: false                 // Log culling statistics
  },

  // Distance-Based Updates
  distanceUpdates: {
    enabled: true,               // Update distant entities less frequently
    closeDistance: 20,           // Distance for full-rate updates
    mediumDistance: 50,          // Distance for medium-rate updates
    farDistance: 100,            // Distance for low-rate updates
    closeFPS: 60,                // Update frequency for close entities (every frame)
    mediumFPS: 10,               // Update frequency for medium entities
    farFPS: 5,                   // Update frequency for far entities
    applyToAI: true,             // Apply to AI system
    applyToPhysics: false,       // Don't throttle physics (keep at full rate)
    debug: false                 // Log update frequency statistics
  },

  // Spatial Partitioning
  spatialPartitioning: {
    enabled: true,               // Use spatial grid for collision detection
    cellSize: 10,                // World units per grid cell
    rebuildEveryFrame: true,     // Rebuild grid each frame (good for moving entities)
    debug: false                 // Log spatial grid statistics
  },

  // General Performance
  general: {
    targetFPS: 60,               // Target framerate
    shadowsEnabled: true,        // Enable/disable shadows
    shadowMapSize: 1024,         // Shadow map resolution
    antialias: true,             // Anti-aliasing
    pixelRatio: 1,               // Render pixel ratio (1 = native, 0.5 = half)
    frustumCulling: true,        // Enable frustum culling
    occlusionCulling: false      // Occlusion culling (expensive)
  },

  // Debug/Profiling
  profiling: {
    enabled: false,              // Enable performance profiling
    showStats: false,            // Show stats panel
    logFrameTime: false,         // Log frame times
    logSystemTime: false,        // Log individual system times
    memoryTracking: false        // Track memory usage
  }
};

/**
 * Get optimization config section
 * @param {string} section - Config section name
 * @returns {Object} Config section
 */
export function getOptimizationConfig(section) {
  return OptimizationConfig[section] || {};
}

/**
 * Update optimization config
 * @param {string} section - Config section name
 * @param {Object} updates - Config updates
 */
export function updateOptimizationConfig(section, updates) {
  if (OptimizationConfig[section]) {
    Object.assign(OptimizationConfig[section], updates);
  }
}

/**
 * Enable/disable all optimizations
 * @param {boolean} enabled
 */
export function setAllOptimizations(enabled) {
  OptimizationConfig.resourceCaching.enabled = enabled;
  OptimizationConfig.entityPooling.enabled = enabled;
  OptimizationConfig.projectilePooling.enabled = enabled;
  OptimizationConfig.particlePooling.enabled = enabled;
  OptimizationConfig.audioCaching.enabled = enabled;
  OptimizationConfig.frustumCulling.enabled = enabled;
  OptimizationConfig.distanceUpdates.enabled = enabled;
  OptimizationConfig.spatialPartitioning.enabled = enabled;
}

/**
 * Get current optimization stats
 * @returns {Object} Stats object
 */
export function getOptimizationStats() {
  return {
    entityPooling: OptimizationConfig.entityPooling.enabled,
    projectilePooling: OptimizationConfig.projectilePooling.enabled,
    particlePooling: OptimizationConfig.particlePooling.enabled,
    audioCaching: OptimizationConfig.audioCaching.enabled
  };
}
