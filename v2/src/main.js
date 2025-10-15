/**
 * main.js - Entry point for v2 refactored game
 *
 * This is the minimal game loop that initializes the core systems
 * and sets up the foundation for migrating v1 game systems to v2 ECS architecture.
 */

import { Engine } from './core/engine/Engine.js';
import { EntityManager } from './core/engine/EntityManager.js';
import { Renderer } from './core/renderer/Renderer.js';
import { InputManager } from './core/input/InputManager.js';
import { ResourceCache } from './core/pooling/ResourceCache.js';
import { OptimizationConfig } from './config/optimization.js';
import { FrustumCuller } from './core/renderer/FrustumCuller.js';
import { RenderSystem } from './systems/render/RenderSystem.js';
import { MovementSystem } from './systems/movement/MovementSystem.js';
import { PlayerInputSystem } from './systems/input/PlayerInputSystem.js';
import { AISystem } from './systems/ai/AISystem.js';
import { SpawnSystem } from './systems/spawn/SpawnSystem.js';
import { CollisionSystem } from './systems/physics/CollisionSystem.js';
import { DamageSystem } from './systems/combat/DamageSystem.js';
import { WeaponSystem } from './systems/combat/WeaponSystem.js';
import { ProjectileSystem } from './systems/combat/ProjectileSystem.js';
import { ParticleSystem } from './systems/effects/ParticleSystem.js';
import { ParticleManager } from './systems/effects/ParticleManager.js';
import { StatusEffectSystem } from './systems/combat/StatusEffectSystem.js';
import { UISystem } from './systems/ui/UISystem.js';
import { AudioSystem } from './systems/audio/AudioSystem.js';
import { LevelingSystem } from './systems/progression/LevelingSystem.js';
import { PickupSystem } from './systems/items/PickupSystem.js';
import { entityFactory } from './systems/entity/EntityFactory.js';
import { Entity } from './core/ecs/Entity.js';
import { Transform } from './components/Transform.js';
import { Health } from './components/Health.js';
import { Movement } from './components/Movement.js';
import { Renderable } from './components/Renderable.js';
import { Collider } from './components/Collider.js';
import { Weapon } from './components/Weapon.js';
import { Experience } from './components/Experience.js';
import { Pickup } from './components/Pickup.js';
import * as THREE from 'three';

/**
 * Main Game Class
 *
 * Coordinates all systems and manages the game loop.
 * This replaces v1's DustAndDynamiteGame class with a clean ECS approach.
 */
class Game {
  constructor() {
    // Core systems
    this.engine = new Engine();
    this.entityManager = new EntityManager();
    this.renderer = new Renderer();
    this.input = new InputManager();
    this.frustumCuller = null; // Initialized after renderer

    // Game systems
    this.renderSystem = null;
    this.movementSystem = null;
    this.playerInputSystem = null;
    this.aiSystem = null;
    this.spawnSystem = null;
    this.collisionSystem = null;
    this.damageSystem = null;
    this.weaponSystem = null;
    this.projectileSystem = null;
    this.particleSystem = null;
    this.particleManager = null;
    this.statusEffectSystem = null;
    this.audioSystem = null;
    this.levelingSystem = null;
    this.pickupSystem = null;
    this.uiSystem = null;

    // Game state
    this.initialized = false;
    this.player = null;
    this.testEntities = [];
    this.currentWave = 1;
    this.enemiesKilled = 0;
  }

  /**
   * Initialize all game systems
   */
  async init() {
    console.log('🎮 Initializing Its Just Fine v2...');

    // Log optimization settings
    console.log('⚙️  Optimization Settings:');
    console.log(`  Resource Caching: ${OptimizationConfig.resourceCaching.enabled ? '✅' : '❌'}`);
    console.log(`  Particle Pooling: ${OptimizationConfig.particlePooling.enabled ? '✅' : '❌'}`);
    console.log(`  Frustum Culling: ${OptimizationConfig.frustumCulling.enabled ? '✅' : '❌'}`);
    console.log(`  Distance Updates: ${OptimizationConfig.distanceUpdates.enabled ? '✅' : '❌'}`);
    console.log(`  Spatial Partitioning: ${OptimizationConfig.spatialPartitioning.enabled ? '✅' : '❌'}`);

    // Initialize renderer
    const container = document.body;
    this.renderer.init(container, {
      backgroundColor: 0xff7744,
      antialias: true,
      lighting: {
        ambient: { color: 0xffbb66, intensity: 0.6 },
        sun: { color: 0xffdd88, intensity: 1.2, position: { x: 20, y: 40, z: 15 } },
        fill: { color: 0xff9944, intensity: 0.3 },
        hemisphere: { sky: 0xffdd99, ground: 0x4a3520, intensity: 0.5 }
      }
    });
    console.log('✅ Renderer initialized');

    // Initialize input
    this.input.init(this.renderer.renderer.domElement);
    console.log('✅ Input manager initialized');

    // Initialize frustum culler
    this.frustumCuller = new FrustumCuller(this.renderer.camera);
    console.log('✅ Frustum culler initialized');

    // Setup engine callbacks
    this.engine.onUpdate = (dt) => this.update(dt);
    this.engine.onRender = () => this.render();

    // Create test ground plane
    this.createGround();
    console.log('✅ Test ground created');

    // Initialize game systems (pass frustumCuller to systems that need it)
    this.renderSystem = new RenderSystem(this.renderer);
    this.movementSystem = new MovementSystem(this.frustumCuller);
    this.weaponSystem = new WeaponSystem(this.engine);
    this.playerInputSystem = new PlayerInputSystem(this.input, this.weaponSystem);
    this.aiSystem = new AISystem(this.frustumCuller);
    this.spawnSystem = new SpawnSystem();
    this.collisionSystem = new CollisionSystem();
    this.damageSystem = new DamageSystem();
    this.projectileSystem = new ProjectileSystem();
    this.particleSystem = new ParticleSystem();
    this.particleManager = new ParticleManager(this.engine, this.renderer);
    this.statusEffectSystem = new StatusEffectSystem();
    this.audioSystem = new AudioSystem();
    this.levelingSystem = new LevelingSystem();
    this.pickupSystem = new PickupSystem(this.engine);
    this.uiSystem = new UISystem();
    console.log('✅ Game systems initialized');

    // Initialize audio
    this.audioSystem.init();
    console.log('✅ Audio initialized');

    // Initialize leveling system
    this.levelingSystem.init();
    console.log('✅ Leveling system initialized');

    // Set player reference for pickup system
    // (will be set after player is created)

    // Initialize UI
    this.uiSystem.init();
    console.log('✅ UI initialized');

    // Create player
    this.createPlayer();
    console.log('✅ Player created');

    // Initialize spawn system with survival_basic config
    await this.spawnSystem.init('survival_basic');
    console.log('✅ Spawn system initialized');

    // Listen for enemy spawn events
    window.addEventListener('enemy-spawned', (event) => {
      const enemy = event.detail.entity;
      this.engine.addEntity(enemy);
      console.log(`Enemy spawned: ${enemy.displayName} (${enemy.id})`);
    });

    // Listen for entity death events to spawn particles and XP pickups
    window.addEventListener('entity-died', (event) => {
      const entity = event.detail.entity;
      const transform = entity.getComponent('Transform');

      if (transform && entity.hasTag('enemy')) {
        // Track kills
        this.enemiesKilled++;

        // Create death explosion particles
        this.particleManager.createBurst({
          x: transform.x,
          y: transform.y,
          z: transform.z,
          count: 20,
          burstSpeed: 5,
          lifetime: 0.8,
          fadeStart: 0.3,
          startColor: 0x00ff00, // Green for enemies
          endColor: 0x004400,
          startOpacity: 1.0,
          endOpacity: 0.0,
          startScale: 1.0,
          endScale: 0.1,
          scale: 0.15,
          gravity: -5,
          drag: 0.92,
          tag: 'death_particle'
        });

        // Spawn XP pickup at enemy death location
        this.spawnXPPickup(transform.x, transform.y, transform.z);
      }
    });

    // Listen for weapon fire events to spawn muzzle flash
    window.addEventListener('weapon-fired', (event) => {
      const entity = event.detail.entity;
      const transform = entity.getComponent('Transform');

      if (transform && entity.hasTag('player')) {
        // Create muzzle flash particle
        const dirX = Math.sin(transform.rotationY);
        const dirZ = Math.cos(transform.rotationY);

        this.particleManager.createParticle({
          x: transform.x + dirX,
          y: transform.y,
          z: transform.z + dirZ,
          scale: 0.4,
          lifetime: 0.1,
          fadeStart: 0,
          startColor: 0xffff00,
          endColor: 0xff8800,
          startOpacity: 1.0,
          endOpacity: 0.0,
          startScale: 1.5,
          endScale: 0.5,
          gravity: 0,
          drag: 0.8,
          tag: 'muzzle_flash'
        });
      }
    });

    this.initialized = true;
    console.log('✅ Game initialized successfully');
  }

  /**
   * Create the player entity
   */
  createPlayer() {
    // Create player entity from components
    const player = new Entity();

    // Transform - starting position at origin
    const transform = new Transform();
    transform.init({ x: 0, y: 0.5, z: 0, scaleX: 1.5, scaleY: 1.5, scaleZ: 1.5 });
    player.addComponent(transform);

    // Health
    const health = new Health();
    health.init({ max: 100, current: 100 });
    player.addComponent(health);

    // Movement - player speed
    const movement = new Movement();
    movement.init({ speed: 8, maxSpeed: 12, drag: 0 });
    player.addComponent(movement);

    // Renderable - distinct player appearance (blue sphere)
    const renderable = new Renderable();
    renderable.init({
      modelType: 'sphere',
      color: 0x4444ff,
      emissive: 0x2222aa,
      metalness: 0.3,
      roughness: 0.7,
      castShadow: true,
      receiveShadow: true
    });
    player.addComponent(renderable);

    // Collider - for collision detection with enemies
    const collider = new Collider();
    collider.init({
      shape: 'sphere',
      radius: 0.75,
      layer: 'player',
      collidesWith: ['enemy'],
      isSolid: true,  // Solid collision - player pushes and is pushed by enemies
      bounciness: 0.3,  // Some bounce on collision
      collisionResolutionMode: 'horizontal'  // 2.5D collision (ignore Y axis)
    });
    player.addComponent(collider);

    // Weapon - player can shoot
    const weapon = new Weapon();
    weapon.init({
      weaponType: 'magic_pistol',
      damage: 25,
      fireRate: 0.15,
      projectileSpeed: 25,
      projectileLifetime: 3,
      projectileSize: 0.3,
      projectileColor: 0xffff00,
      spread: 0,
      projectilesPerShot: 1,
      piercing: false,
      homing: false,
      explosive: false
    });
    player.addComponent(weapon);

    // Experience - player can level up
    const experience = new Experience();
    experience.init({
      level: 1,
      baseXPRequirement: 100,
      xpCurveMultiplier: 1.5,
      healthPerLevel: 10,
      damagePerLevel: 2,
      speedPerLevel: 0.1
    });
    player.addComponent(experience);

    // Tag as player
    player.addTag('player');

    // Add to engine
    this.engine.addEntity(player);
    this.player = player;

    // Set player reference for pickup system
    this.pickupSystem.setPlayer(player);

    console.log('Player created at origin');
  }

  /**
   * Create a test ground plane
   */
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.renderer.addToScene(ground);
  }

  /**
   * Spawn an XP pickup at a location
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   */
  spawnXPPickup(x, y, z) {
    const pickupEntity = new Entity();

    // Transform - start with initial scale for visibility
    const transform = new Transform();
    transform.init({
      x,
      y: y + 0.5,
      z,
      scaleX: 0.01,  // Start very small instead of 0
      scaleY: 0.01,
      scaleZ: 0.01
    });
    pickupEntity.addComponent(transform);

    // Renderable - green glowing sphere (larger and brighter)
    const renderable = new Renderable();
    renderable.init({
      modelType: 'sphere',
      color: 0x00ff00,
      emissive: 0x00ff00,
      metalness: 0.8,
      roughness: 0.2,
      castShadow: false,
      receiveShadow: false
    });
    pickupEntity.addComponent(renderable);

    // Pickup
    const pickup = new Pickup();
    pickup.init({
      pickupType: 'xp',
      value: 10,
      autoCollect: true,
      collectRadius: 0.8,      // Reduced from 1.5 - need to be closer to collect
      magnetRange: 3.0,         // Reduced from 5.0 - shorter attraction range
      magnetSpeed: 6.0,         // Reduced from 10.0 - slower attraction
      lifetime: 30,
      bobHeight: 0.3,
      bobSpeed: 2.0,
      rotateSpeed: 2.0
    });
    pickupEntity.addComponent(pickup);

    // Tag as pickup
    pickupEntity.addTag('pickup');
    pickupEntity.addTag('xp');

    // Add to engine
    this.engine.addEntity(pickupEntity);
  }


  /**
   * Start the game
   */
  start() {
    if (!this.initialized) {
      console.error('❌ Cannot start game - not initialized');
      return;
    }

    console.log('🚀 Starting game loop...');
    this.engine.start();
  }

  /**
   * Update game logic
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update frustum culler for this frame
    if (OptimizationConfig.frustumCulling.enabled && this.frustumCuller) {
      this.frustumCuller.updateFrustum();
    }

    // Process systems in order
    // 1. PlayerInputSystem - process player input
    this.playerInputSystem.update(dt, this.engine.entities);

    // 2. AISystem - update enemy AI
    this.aiSystem.update(dt, this.engine.entities);

    // 3. SpawnSystem - spawn new enemies based on waves
    this.spawnSystem.update(dt, this.engine.entities);

    // 4. WeaponSystem - handle weapon firing
    this.weaponSystem.update(dt, this.engine.entities);

    // 5. ProjectileSystem - update projectile behavior and lifetime
    this.projectileSystem.setAllEntities(this.engine.entities);
    this.projectileSystem.update(dt, this.engine.entities);

    // 6. ParticleSystem - update particle physics and visuals
    this.particleSystem.update(dt, this.engine.entities);

    // 6b. ParticleManager - update instanced particle pools
    this.particleManager.update(dt);

    // 7. StatusEffectSystem - apply status effects (DoT, CC, buffs/debuffs)
    this.statusEffectSystem.update(dt, this.engine.entities);

    // 8. MovementSystem - apply velocities to positions
    this.movementSystem.update(dt, this.engine.entities);

    // 9. CollisionSystem - detect and resolve collisions
    this.collisionSystem.update(dt, this.engine.entities);

    // 10. DamageSystem - handle damage and death
    this.damageSystem.update(dt, this.engine.entities);

    // 11. RenderSystem - sync Three.js meshes with entity components
    this.renderSystem.update(dt, this.engine.entities);

    // 12. AudioSystem - update audio (spatial audio, cleanup)
    this.audioSystem.update(dt, {
      player: this.player
    });

    // 13. LevelingSystem - handle XP and leveling (event-driven, but processes Experience components)
    this.levelingSystem.update(dt, this.engine.entities);

    // 14. PickupSystem - handle pickup collection and effects
    this.pickupSystem.update(dt, this.engine.entities);

    // 15. UISystem - update HUD based on game state
    const enemyCount = this.engine.entities.filter(e => e.active && e.hasTag('enemy')).length;
    this.uiSystem.update(dt, {
      player: this.player,
      currentWave: this.spawnSystem.currentWave || 1,
      enemyCount: enemyCount
    });

    // Clear frame-specific input state
    this.input.clearFrameState();
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('🧹 Cleaning up...');
    this.engine.cleanup();
    this.renderer.cleanup();
    this.input.cleanup();
  }
}

// Initialize and start the game
const game = new Game();

// Expose debug tools on window for testing
window.game = game;
window.ResourceCache = ResourceCache;
window.OptimizationConfig = OptimizationConfig;
window.logOptimizationStats = () => {
  console.log('📊 Optimization Statistics:');
  console.log('='.repeat(50));

  // Resource Cache stats
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
  console.log('  Textures Cached:', cacheStats.texturesCached);

  // Entity Manager stats
  if (game.entityManager) {
    const emStats = game.entityManager.getDebugInfo();
    console.log('\n🎯 Entity Manager:');
    console.log('  Total Entities:', emStats.totalEntities);
    console.log('  Active Entities:', emStats.activeEntities);
    console.log('  Groups:', emStats.groups);
    console.log('  Pools:', emStats.poolSizes);
  }

  // Particle Manager stats
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

  // Frustum Culler stats
  if (game.frustumCuller && OptimizationConfig.frustumCulling.enabled) {
    const fcStats = game.frustumCuller.getStats();
    console.log('\n🔭 Frustum Culling:');
    console.log('  Total Checks:', fcStats.totalChecks);
    console.log('  Visible:', fcStats.visible);
    console.log('  Culled:', fcStats.culled);
    console.log('  Always Update:', fcStats.alwaysUpdate);
    console.log('  Cull Rate:', fcStats.cullRate);
  }

  // AI System stats
  if (game.aiSystem) {
    const aiStats = game.aiSystem.getStats();
    console.log('\n🤖 AI System:');
    console.log('  Total Entities:', aiStats.totalEntities);
    console.log('  Frustum Culled:', aiStats.frustumCulled);
    console.log('  Throttled:', aiStats.throttled);
    console.log('  Updated:', aiStats.updated);
    console.log('  Cull Rate:', aiStats.cullRate);
    console.log('  Throttle Rate:', aiStats.throttleRate);
    console.log('  Update Rate:', aiStats.updateRate);
  }

  // Collision System stats
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
  console.log('💡 Tip: Use OptimizationConfig to toggle settings');
  console.log('💡 Run logOptimizationStats() again to see updated stats');
};

// Hide loading screen once game starts
function hideLoadingScreen() {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
  }
}

game.init().then(() => {
  hideLoadingScreen();
  game.start();
}).catch(error => {
  console.error('❌ Failed to initialize game:', error);
  console.error('Error stack:', error.stack);

  // Show error in loading screen
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

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.cleanup();
});

export { game };
