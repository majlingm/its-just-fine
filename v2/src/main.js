/**
 * main.js - Entry point for v2 refactored game
 *
 * This is the minimal game loop that initializes the core systems
 * and sets up the foundation for migrating v1 game systems to v2 ECS architecture.
 */

import { Engine } from './core/engine/Engine.js';
import { Renderer } from './core/renderer/Renderer.js';
import { InputManager } from './core/input/InputManager.js';
import { RenderSystem } from './systems/render/RenderSystem.js';
import { MovementSystem } from './systems/movement/MovementSystem.js';
import { PlayerInputSystem } from './systems/input/PlayerInputSystem.js';
import { AISystem } from './systems/ai/AISystem.js';
import { SpawnSystem } from './systems/spawn/SpawnSystem.js';
import { CollisionSystem } from './systems/physics/CollisionSystem.js';
import { DamageSystem } from './systems/combat/DamageSystem.js';
import { WeaponSystem } from './systems/combat/WeaponSystem.js';
import { ProjectileSystem } from './systems/combat/ProjectileSystem.js';
import { entityFactory } from './systems/entity/EntityFactory.js';
import { Entity } from './core/ecs/Entity.js';
import { Transform } from './components/Transform.js';
import { Health } from './components/Health.js';
import { Movement } from './components/Movement.js';
import { Renderable } from './components/Renderable.js';
import { Collider } from './components/Collider.js';
import { Weapon } from './components/Weapon.js';
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
    this.renderer = new Renderer();
    this.input = new InputManager();

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

    // Game state
    this.initialized = false;
    this.player = null;
    this.testEntities = [];
  }

  /**
   * Initialize all game systems
   */
  async init() {
    console.log('🎮 Initializing Its Just Fine v2...');

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

    // Setup engine callbacks
    this.engine.onUpdate = (dt) => this.update(dt);
    this.engine.onRender = () => this.render();

    // Create test ground plane
    this.createGround();
    console.log('✅ Test ground created');

    // Initialize game systems
    this.renderSystem = new RenderSystem(this.renderer);
    this.movementSystem = new MovementSystem();
    this.weaponSystem = new WeaponSystem(this.engine);
    this.playerInputSystem = new PlayerInputSystem(this.input, this.weaponSystem);
    this.aiSystem = new AISystem();
    this.spawnSystem = new SpawnSystem();
    this.collisionSystem = new CollisionSystem();
    this.damageSystem = new DamageSystem();
    this.projectileSystem = new ProjectileSystem();
    console.log('✅ Game systems initialized');

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

    // Tag as player
    player.addTag('player');

    // Add to engine
    this.engine.addEntity(player);
    this.player = player;

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

    // 6. MovementSystem - apply velocities to positions
    this.movementSystem.update(dt, this.engine.entities);

    // 7. CollisionSystem - detect and resolve collisions
    this.collisionSystem.update(dt, this.engine.entities);

    // 8. DamageSystem - handle damage and death
    this.damageSystem.update(dt, this.engine.entities);

    // 9. RenderSystem - sync Three.js meshes with entity components
    this.renderSystem.update(dt, this.engine.entities);

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
