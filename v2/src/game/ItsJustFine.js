/**
 * ItsJustFine - Main Game Class
 *
 * This is the game-specific logic for "It's Just Fine"
 * Uses the generic v2 engine but contains game-specific initialization,
 * player setup, and game mode management.
 *
 * Similar to v1's DustAndDynamiteGame but built on v2's ECS architecture.
 */

import { Engine } from '../core/engine/Engine.js';
import { Renderer } from '../core/renderer/Renderer.js';
import { InputManager } from '../core/input/InputManager.js';
import { FrustumCuller } from '../core/renderer/FrustumCuller.js';
import { CameraSystem } from '../core/camera/CameraSystem.js';
import { CameraController } from './CameraController.js';

// Systems
import { RenderSystem } from '../core/systems/RenderSystem.js';
import { MovementSystem } from '../core/systems/MovementSystem.js';
import { PlayerInputSystem } from '../game/systems/input/PlayerInputSystem.js';
import { AISystem } from '../game/systems/ai/AISystem.js';
import { BossSystem } from '../game/systems/entity/BossSystem.js';
import { SpawnSystem } from '../game/systems/spawn/SpawnSystem.js';
import { CollisionSystem } from '../core/systems/CollisionSystem.js';
import { DamageSystem } from '../game/systems/combat/DamageSystem.js';
import { WeaponSystem } from '../game/systems/combat/WeaponSystem.js';
import { ProjectileSystem } from '../game/systems/combat/ProjectileSystem.js';
import { ParticleSystem } from '../game/systems/effects/ParticleSystem.js';
import { ParticleManager } from '../game/systems/effects/ParticleManager.js';
import { StatusEffectSystem } from '../game/systems/combat/StatusEffectSystem.js';
import { AudioSystem } from '../game/systems/audio/AudioSystem.js';
import { LevelingSystem } from '../game/systems/progression/LevelingSystem.js';
import { PickupSystem } from '../game/systems/items/PickupSystem.js';
import { UISystem } from '../game/systems/ui/UISystem.js';
import { AnimationSystem } from '../core/systems/AnimationSystem.js';
import { LevelSystem } from '../game/systems/level/LevelSystem.js';
import { TerrainFollowSystem } from '../game/systems/physics/TerrainFollowSystem.js';

// Entity Factory
import { entityFactory } from '../game/systems/entity/EntityFactory.js';

// Config
import { configLoader } from '../utils/ConfigLoader.js';

import { OptimizationConfig } from '../core/config/optimization.js';
import { CameraConfig, getCameraConfig, getDeviceCameraSettings } from '../core/config/camera.js';

/**
 * Main game class for "It's Just Fine"
 */
export class ItsJustFine {
  constructor() {
    // Core engine systems
    this.engine = new Engine();
    this.renderer = new Renderer();
    this.input = new InputManager();
    this.frustumCuller = null;
    this.cameraSystem = null;
    this.cameraController = null;

    // Game systems
    this.renderSystem = null;
    this.movementSystem = null;
    this.playerInputSystem = null;
    this.aiSystem = null;
    this.bossSystem = null;
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
    this.animationSystem = null;
    this.levelSystem = null;
    this.terrainFollowSystem = null;

    // Game state
    this.initialized = false;
    this.player = null;
    this.currentMode = null; // Will be SurvivalMode, StoryMode, etc.
    this.gameState = 'menu'; // menu, playing, paused, gameover, victory
  }

  /**
   * Initialize the game
   * @param {HTMLElement} container - DOM container for renderer
   * @param {Object} options - Game options
   */
  async init(container = document.body, options = {}) {
    console.log('🎮 Initializing Its Just Fine v2...');

    // Initialize renderer with isometric camera mode
    this.renderer.init(container, {
      backgroundColor: 0xff7744,
      antialias: true,
      cameraMode: 'isometric', // Use isometric camera like v1
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
    console.log('✅ Input initialized');

    // Initialize frustum culler
    this.frustumCuller = new FrustumCuller(this.renderer.camera);
    console.log('✅ Frustum culler initialized');

    // Initialize camera system (engine-level)
    // Get isometric camera config and apply device-specific settings
    const cameraConfig = getCameraConfig('isometric');
    const deviceSettings = getDeviceCameraSettings(cameraConfig);

    this.cameraSystem = new CameraSystem(this.renderer.camera, {
      horizontalAngle: cameraConfig.horizontalAngle,
      verticalAngle: cameraConfig.verticalAngle,
      distance: deviceSettings.distance || cameraConfig.distance,
      heightMultiplier: deviceSettings.heightMultiplier || cameraConfig.heightMultiplier,
      radiusMultiplier: deviceSettings.radiusMultiplier || cameraConfig.radiusMultiplier,
      smoothing: cameraConfig.follow.smoothing,
      verticalMin: cameraConfig.rotation.verticalMin,
      verticalMax: cameraConfig.rotation.verticalMax,
      distanceMin: cameraConfig.zoom.min,
      distanceMax: cameraConfig.zoom.max,
      dynamicZoom: cameraConfig.zoom.dynamicAngle
    });

    // Initialize camera controller (game-level)
    this.cameraController = new CameraController(this.cameraSystem, this.input, {
      horizontalSpeed: 2.0,
      verticalSpeed: 0.5,
      zoomSpeed: 0.5
    });
    console.log('✅ Camera system initialized');

    // Setup engine callbacks
    this.engine.onUpdate = (dt) => this.update(dt);
    this.engine.onRender = () => this.render();

    // Initialize all game systems
    this.initializeSystems();
    console.log('✅ Systems initialized');

    this.initialized = true;
    console.log('✅ Game initialized');
  }

  /**
   * Initialize all game systems
   */
  initializeSystems() {
    // Rendering
    this.renderSystem = new RenderSystem(this.renderer);

    // Movement & Physics
    this.movementSystem = new MovementSystem(this.frustumCuller);
    this.collisionSystem = new CollisionSystem();

    // Level management (needs to be before TerrainFollowSystem)
    this.levelSystem = new LevelSystem(this.renderer);

    // Terrain (needs levelSystem.environmentSystem)
    this.terrainFollowSystem = new TerrainFollowSystem(this.levelSystem.environmentSystem);

    // Input
    this.weaponSystem = new WeaponSystem(this.engine);
    this.playerInputSystem = new PlayerInputSystem(this.input, this.weaponSystem);
    this.playerInputSystem.setCameraSystem(this.cameraSystem); // Enable camera-relative controls

    // AI & Spawning
    this.aiSystem = new AISystem(this.frustumCuller);
    this.bossSystem = new BossSystem(this.engine, entityFactory);
    this.spawnSystem = new SpawnSystem();

    // Combat
    this.damageSystem = new DamageSystem();
    this.projectileSystem = new ProjectileSystem();
    this.statusEffectSystem = new StatusEffectSystem();

    // Effects
    this.particleSystem = new ParticleSystem();
    this.particleManager = new ParticleManager(this.engine, this.renderer);

    // Set scene reference on engine (for v1 particle pool compatibility)
    this.engine.scene = this.renderer.scene;

    // Audio
    this.audioSystem = new AudioSystem();
    this.audioSystem.init();

    // Progression
    this.levelingSystem = new LevelingSystem();
    this.levelingSystem.init();
    this.pickupSystem = new PickupSystem(this.engine);

    // UI
    this.uiSystem = new UISystem();
    this.uiSystem.init();

    // Animation
    this.animationSystem = new AnimationSystem();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup game event listeners
   */
  setupEventListeners() {
    // Enemy spawn events
    window.addEventListener('enemy-spawned', (event) => {
      const enemy = event.detail.entity;
      this.engine.addEntity(enemy);
    });

    // Entity death events
    window.addEventListener('entity-died', (event) => {
      const entity = event.detail.entity;
      const transform = entity.getComponent('Transform');

      if (transform && entity.hasTag('enemy')) {
        // Import FireExplosion dynamically
        import('../entities/V1FireExplosion.js').then(({ FireExplosion }) => {
          // Create fire explosion at death location
          const explosion = new FireExplosion(
            this.engine,
            transform.x,
            transform.z,
            2.0,      // radius
            0,        // no damage
            30,       // particle count
            false     // not crit
          );
          this.engine.addEntity(explosion);
        });

        // Register kill with level system
        if (this.levelSystem) {
          const enemyType = entity.userData?.enemyType || 'unknown';
          const killPoints = entity.userData?.killPoints || 10;
          this.levelSystem.registerKill(enemyType, killPoints);
        }

        // TODO: Implement XP drop system from v1
        // Should use entityFactory to create XP pickups based on enemy config
      }
    });

    // Weapon fire events
    window.addEventListener('weapon-fired', (event) => {
      // Removed muzzle flash effect
    });
  }

  /**
   * Create player entity
   * @returns {Entity} Player entity
   */
  async createPlayer() {
    // Use entityFactory to create player (it will be registered)
    const player = entityFactory.createPlayer({
      x: 0,
      y: 0,
      z: 0,
      health: 100,
      speed: 8,
      level: 1,
      xp: 0
    });

    this.engine.addEntity(player);
    this.player = player;

    // Set player reference for systems that need it
    this.pickupSystem.setPlayer(player);

    // Set camera to follow player
    const playerTransform = player.getComponent('Transform');
    if (playerTransform) {
      this.cameraSystem.setTarget({
        x: playerTransform.x,
        y: playerTransform.y,
        z: playerTransform.z
      });
    }

    console.log('Player created:', player.id);
    return player;
  }

  /**
   * Load a level
   * @param {string} levelId - Level identifier
   * @returns {Promise} Resolves when level is loaded
   */
  async loadLevel(levelId) {
    console.log(`Loading level: ${levelId}`);

    // Load level configuration and environment
    await this.levelSystem.loadLevel(levelId);

    // Start the level
    this.levelSystem.startLevel();

    console.log(`Level loaded: ${this.levelSystem.levelConfig.name}`);
    return this.levelSystem.levelConfig;
  }

  /**
   * Start a game mode
   * @param {GameMode} mode - Game mode instance
   */
  async startGameMode(mode) {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    this.currentMode = mode;
    this.gameState = 'playing';

    // Let the mode initialize
    await mode.init(this);

    // Start game loop
    this.engine.start();
  }

  /**
   * Update game
   */
  update(dt) {
    // Update frustum culler
    if (OptimizationConfig.frustumCulling.enabled && this.frustumCuller) {
      this.frustumCuller.updateFrustum();
    }

    // Update camera to follow player
    if (this.player) {
      const playerTransform = this.player.getComponent('Transform');
      if (playerTransform) {
        // Set camera target to player position
        this.cameraSystem.setTarget({
          x: playerTransform.x,
          y: playerTransform.y,
          z: playerTransform.z
        });
      }
    }

    // Update camera controller (handles input)
    this.cameraController.update(dt);

    // Update camera system (calculates and applies position)
    this.cameraSystem.updateCameraPosition(dt);

    // Update current game mode
    if (this.currentMode && this.gameState === 'playing') {
      this.currentMode.update(dt);
    }

    // Update level system
    if (this.levelSystem) {
      this.levelSystem.updateTime(dt);
      // Update environment (particles, etc.)
      if (this.levelSystem.environmentSystem) {
        this.levelSystem.environmentSystem.update(dt);
      }
    }

    // Update V1 spells for player
    if (this.player && this.player.userData && this.player.userData.activeSpells) {
      const playerTransform = this.player.getComponent('Transform');
      if (playerTransform) {
        // Create v1-compatible objects
        const v1Engine = {
          addEntity: (ent) => this.engine.addEntity(ent),
          entities: this.engine.entities,
          scene: this.renderer.scene, // Use renderer's scene
          time: this.engine.time,
          getInstancedParticlePool: (poolName) => this.engine.getInstancedParticlePool(poolName)
        };

        const v1Player = {
          x: playerTransform.x,
          y: playerTransform.y,
          z: playerTransform.z
        };

        const v1Stats = {
          damage: 1.0,
          projectileSpeed: 1.0
        };

        // Check for auto-cast toggle (T key)
        if (this.input.isKeyPressed('t')) {
          if (this.player.userData.autoSpellCast === undefined) {
            this.player.userData.autoSpellCast = true; // Initialize to true
          }
          this.player.userData.autoSpellCast = !this.player.userData.autoSpellCast;
          console.log(`🎯 Auto-cast spells: ${this.player.userData.autoSpellCast ? 'ON' : 'OFF'}`);
        }

        // Default auto-cast to true if not set
        const shouldAutoCast = this.player.userData.autoSpellCast !== false;

        // Update and optionally auto-cast all active spells
        for (const spell of this.player.userData.activeSpells) {
          spell.update(dt);

          // Auto-cast if ready and enabled
          if (shouldAutoCast && spell.isReady()) {
            try {
              // Pass both v1Player (for compatibility) and real player entity
              spell.cast(v1Engine, v1Player, v1Stats, this.player);
              spell.triggerCooldown();
            } catch (error) {
              console.error(`Error casting spell ${spell.name}:`, error);
            }
          }

          // Check for burst trigger (E key for Ring of Fire/Ice)
          if (this.input.isKeyPressed('e')) {
            if (spell.activeEntity && typeof spell.activeEntity.triggerBurst === 'function') {
              spell.activeEntity.triggerBurst();
            }
          }
        }
      }
    }

    // Update systems
    this.playerInputSystem.update(dt, this.engine.entities);
    this.aiSystem.update(dt, this.engine.entities);
    this.bossSystem.update(dt, this.engine.entities);
    this.spawnSystem.update(dt, this.engine.entities);
    this.weaponSystem.update(dt, this.engine.entities);
    this.projectileSystem.setAllEntities(this.engine.entities);
    this.projectileSystem.update(dt, this.engine.entities);
    this.particleSystem.update(dt, this.engine.entities);
    this.particleManager.update(dt);
    this.statusEffectSystem.update(dt, this.engine.entities);
    this.movementSystem.update(dt, this.engine.entities);
    this.terrainFollowSystem.update(dt, this.engine.entities); // Update terrain height and collisions
    this.collisionSystem.update(dt, this.engine.entities);
    this.damageSystem.update(dt, this.engine.entities);
    this.animationSystem.update(dt, this.engine.entities);
    this.renderSystem.update(dt, this.engine.entities);
    this.audioSystem.update(dt, { player: this.player });
    this.levelingSystem.update(dt, this.engine.entities);
    this.pickupSystem.update(dt, this.engine.entities);

    // Update UI (filter out V1 entities that don't have hasTag)
    const enemyCount = this.engine.entities.filter(e => e.active && e.hasTag && e.hasTag('enemy')).length;
    const boss = this.engine.entities.find(e => e.active && e.hasTag && e.hasTag('boss'));

    this.uiSystem.update(dt, {
      player: this.player,
      currentWave: this.levelSystem?.getLevelInfo()?.wave || this.spawnSystem.currentWave || 1,
      enemyCount: enemyCount,
      boss: boss,
      levelInfo: this.levelSystem?.getLevelInfo()
    });

    // Clear input state
    this.input.clearFrameState();
  }

  /**
   * Render game
   */
  render() {
    this.renderer.render();
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.levelSystem) {
      this.levelSystem.cleanup();
    }
    this.engine.cleanup();
    this.renderer.cleanup();
    this.input.cleanup();
  }
}
