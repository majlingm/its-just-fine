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

// Systems
import { RenderSystem } from '../systems/render/RenderSystem.js';
import { MovementSystem } from '../systems/movement/MovementSystem.js';
import { PlayerInputSystem } from '../systems/input/PlayerInputSystem.js';
import { AISystem } from '../systems/ai/AISystem.js';
import { BossSystem } from '../systems/entity/BossSystem.js';
import { SpawnSystem } from '../systems/spawn/SpawnSystem.js';
import { CollisionSystem } from '../systems/physics/CollisionSystem.js';
import { DamageSystem } from '../systems/combat/DamageSystem.js';
import { WeaponSystem } from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem } from '../systems/combat/ProjectileSystem.js';
import { ParticleSystem } from '../systems/effects/ParticleSystem.js';
import { ParticleManager } from '../systems/effects/ParticleManager.js';
import { StatusEffectSystem } from '../systems/combat/StatusEffectSystem.js';
import { AudioSystem } from '../systems/audio/AudioSystem.js';
import { LevelingSystem } from '../systems/progression/LevelingSystem.js';
import { PickupSystem } from '../systems/items/PickupSystem.js';
import { UISystem } from '../systems/ui/UISystem.js';

// Components
import { Entity } from '../core/ecs/Entity.js';
import { Transform } from '../components/Transform.js';
import { Health } from '../components/Health.js';
import { Movement } from '../components/Movement.js';
import { Renderable } from '../components/Renderable.js';
import { Collider } from '../components/Collider.js';
import { Weapon } from '../components/Weapon.js';
import { Experience } from '../components/Experience.js';
import { Pickup } from '../components/Pickup.js';

// Entity Factory
import { entityFactory } from '../systems/entity/EntityFactory.js';

import { OptimizationConfig } from '../config/optimization.js';
import * as THREE from 'three';

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

    // Setup engine callbacks
    this.engine.onUpdate = (dt) => this.update(dt);
    this.engine.onRender = () => this.render();

    // Initialize all game systems
    this.initializeSystems();
    console.log('✅ Systems initialized');

    // Create test ground
    this.createGround();

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

        // Spawn XP pickup
        this.spawnXPPickup(transform.x, transform.y, transform.z);
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
    const player = new Entity();

    // Transform
    const transform = new Transform();
    transform.init({ x: 0, y: 0, z: 0, scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0, rotationY: Math.PI });
    player.addComponent(transform);

    // Health
    const health = new Health();
    health.init({ max: 100, current: 100 });
    player.addComponent(health);

    // Movement
    const movement = new Movement();
    movement.init({ speed: 8, maxSpeed: 12, drag: 0 });
    player.addComponent(movement);

    // Renderable - Load 3D model
    const renderable = new Renderable();
    renderable.init({
      modelType: 'player',
      color: 0xffffff,
      castShadow: true,
      receiveShadow: true
    });
    player.addComponent(renderable);

    // Collider
    const collider = new Collider();
    collider.init({
      shape: 'sphere',
      radius: 0.75,
      layer: 'player',
      collidesWith: ['enemy'],
      isSolid: true,
      bounciness: 0.3,
      collisionResolutionMode: 'horizontal'
    });
    player.addComponent(collider);

    // Weapon
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

    // Experience
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

    return player;
  }

  /**
   * Spawn XP pickup
   */
  spawnXPPickup(x, y, z) {
    const pickupEntity = new Entity();

    const transform = new Transform();
    transform.init({
      x,
      y: y + 0.5,
      z,
      scaleX: 0.01,
      scaleY: 0.01,
      scaleZ: 0.01
    });
    pickupEntity.addComponent(transform);

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

    const pickup = new Pickup();
    pickup.init({
      pickupType: 'xp',
      value: 10,
      autoCollect: true,
      collectRadius: 0.8,
      magnetRange: 3.0,
      magnetSpeed: 6.0,
      lifetime: 30,
      bobHeight: 0.3,
      bobSpeed: 2.0,
      rotateSpeed: 2.0
    });
    pickupEntity.addComponent(pickup);

    pickupEntity.addTag('pickup');
    pickupEntity.addTag('xp');

    this.engine.addEntity(pickupEntity);
  }

  /**
   * Create ground plane
   */
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.renderer.addToScene(ground);
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
        this.renderer.followTarget({
          x: playerTransform.x,
          y: playerTransform.y,
          z: playerTransform.z
        });
      }
    }

    // Update current game mode
    if (this.currentMode && this.gameState === 'playing') {
      this.currentMode.update(dt);
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
    this.renderSystem.update(dt, this.engine.entities);
    this.audioSystem.update(dt, { player: this.player });
    this.levelingSystem.update(dt, this.engine.entities);
    this.pickupSystem.update(dt, this.engine.entities);

    // Update UI
    const enemyCount = this.engine.entities.filter(e => e.active && e.hasTag('enemy')).length;
    const boss = this.engine.entities.find(e => e.active && e.hasTag('boss'));

    this.uiSystem.update(dt, {
      player: this.player,
      currentWave: this.spawnSystem.currentWave || 1,
      enemyCount: enemyCount,
      boss: boss
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
    this.engine.cleanup();
    this.renderer.cleanup();
    this.input.cleanup();
  }
}
