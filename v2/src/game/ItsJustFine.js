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

// Entity Factory
import { entityFactory } from '../game/systems/entity/EntityFactory.js';

// Config
import { configLoader } from '../utils/ConfigLoader.js';

import { OptimizationConfig } from '../core/config/optimization.js';

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
    this.cameraSystem = new CameraSystem(this.renderer.camera, {
      horizontalAngle: 0,
      verticalAngle: 0.5,
      distance: 6,
      heightMultiplier: 2.0,
      radiusMultiplier: 0.5,
      smoothing: 0.1,
      verticalMin: 0.1,
      verticalMax: 0.9,
      distanceMin: 3,
      distanceMax: 20
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

    // Input
    this.weaponSystem = new WeaponSystem(this.engine);
    this.playerInputSystem = new PlayerInputSystem(this.input, this.weaponSystem);

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

    // Level management
    this.levelSystem = new LevelSystem(this.renderer);

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
        // Death particles
        this.particleManager.createBurst({
          x: transform.x,
          y: transform.y,
          z: transform.z,
          count: 20,
          burstSpeed: 5,
          lifetime: 0.8,
          fadeStart: 0.3,
          startColor: 0x00ff00,
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
      const entity = event.detail.entity;
      const transform = entity.getComponent('Transform');

      if (transform && entity.hasTag('player')) {
        // Muzzle flash
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
    this.collisionSystem.update(dt, this.engine.entities);
    this.damageSystem.update(dt, this.engine.entities);
    this.animationSystem.update(dt, this.engine.entities);
    this.renderSystem.update(dt, this.engine.entities);
    this.audioSystem.update(dt, { player: this.player });
    this.levelingSystem.update(dt, this.engine.entities);
    this.pickupSystem.update(dt, this.engine.entities);

    // Update UI
    const enemyCount = this.engine.entities.filter(e => e.active && e.hasTag('enemy')).length;
    const boss = this.engine.entities.find(e => e.active && e.hasTag('boss'));

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
