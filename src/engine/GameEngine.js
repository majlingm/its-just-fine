import * as THREE from 'three';
import { SoundSystem } from './SoundSystem.js';
import { ParticleSystem } from '../particles/ParticleSystem.js';
import { InstancedParticlePool } from '../effects/InstancedParticlePool.js';
import { GroundSystem } from '../systems/GroundSystem.js';
import { FogSystem } from '../systems/FogSystem.js';

/**
 * GameEngine - Pure rendering and physics engine
 * Responsible for:
 * - Three.js scene setup and rendering
 * - Camera and lighting management
 * - Entity lifecycle (add/remove/update)
 * - Core game loop
 *
 * NOT responsible for:
 * - Game logic (handled by DustAndDynamiteGame)
 * - Spell systems (handled by spell modules)
 * - UI (handled by React components)
 */
export class GameEngine {
  constructor() {
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Entity management
    this.entities = [];

    // Engine state
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.lastFrameTime = 0;

    // Subsystems (will be initialized in init())
    this.sound = null;
    this.particles = null;
    this.groundSystem = null;
    this.fogSystem = null;
    this.instancedParticlePools = null;

    // Lighting references
    this.lights = {
      ambient: null,
      sun: null,
      fill: null,
      hemisphere: null
    };

    // Camera settings
    this.cameraDistance = 12;

    // Frustum for culling
    this.frustum = new THREE.Frustum();
    this.frustumMatrix = new THREE.Matrix4();
  }

  /**
   * Initialize the game engine
   * @param {HTMLElement} container - DOM element to mount the renderer
   */
  init(container) {
    // Scene setup
    this.setupScene();

    // Camera setup
    this.setupCamera();

    // Renderer setup
    this.setupRenderer(container);

    // Lighting setup
    this.setupLighting();

    // Initialize subsystems
    this.initSubsystems();

    // Setup controls
    this.setupControls();

    // Handle window resize
    this.setupResizeHandler();
  }

  /**
   * Setup Three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xff7744); // Sunset sky
  }

  /**
   * Setup camera
   */
  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

    // Adjust camera distance based on device type
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Detect device type
    const isIPhone = /iPhone/i.test(userAgent);
    const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isTablet = isIPad || (isAndroid && width >= 768 && width <= 1024);
    const isMobile = (isIPhone || (isAndroid && width < 768)) && !isTablet;

    // Set camera distance based on device and orientation
    if (isMobile) {
      if (isLandscape) {
        this.cameraDistance = 28;  // Mobile landscape - zoomed out
      } else {
        this.cameraDistance = 32;  // Mobile portrait - zoomed out even more for better view
      }
    } else if (isTablet) {
      this.cameraDistance = 20;  // Tablets - medium zoom
    } else {
      this.cameraDistance = 15;  // Desktop - standard zoom
    }

    // Position camera for isometric-like view
    this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup renderer
   * @param {HTMLElement} container - Container element
   */
  setupRenderer(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light - warm orange-yellow
    this.lights.ambient = new THREE.AmbientLight(0xffbb66, 0.6);
    this.scene.add(this.lights.ambient);

    // Sun light - main directional light
    this.lights.sun = new THREE.DirectionalLight(0xffdd88, 1.2);
    this.lights.sun.position.set(20, 40, 15);
    this.lights.sun.castShadow = true;
    this.lights.sun.shadow.camera.left = -120;
    this.lights.sun.shadow.camera.right = 120;
    this.lights.sun.shadow.camera.top = 120;
    this.lights.sun.shadow.camera.bottom = -120;
    this.lights.sun.shadow.camera.near = 0.5;
    this.lights.sun.shadow.camera.far = 200;
    this.lights.sun.shadow.mapSize.width = 2048;
    this.lights.sun.shadow.mapSize.height = 2048;
    this.lights.sun.shadow.bias = -0.0001;
    this.scene.add(this.lights.sun);

    // Fill light - secondary directional light
    this.lights.fill = new THREE.DirectionalLight(0xff9944, 0.3);
    this.lights.fill.position.set(-10, 20, -10);
    this.scene.add(this.lights.fill);

    // Hemisphere light for ambient lighting
    this.lights.hemisphere = new THREE.HemisphereLight(0xffdd99, 0x4a3520, 0.5);
    this.scene.add(this.lights.hemisphere);
  }

  /**
   * Initialize subsystems
   */
  initSubsystems() {
    // Sound system
    this.sound = new SoundSystem();
    this.sound.init();

    // Particle system
    this.particles = new ParticleSystem(this.scene, 100);

    // Instanced particle pools
    this.instancedParticlePools = {
      trails: null,
      explosions: null,
      generic: null
    };

    // Ground system
    this.groundSystem = new GroundSystem(this.scene);
    this.groundSystem.updateGround('desert'); // Default ground

    // Fog system
    this.fogSystem = new FogSystem(this.scene);
    this.fogSystem.createBoundaryFog();
  }

  /**
   * Setup zoom controls (Q/E keys)
   */
  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        // Zoom out
        this.cameraDistance += 2;
        this.updateCameraPosition();
      } else if (e.key === 'e' || e.key === 'E') {
        // Zoom in
        this.cameraDistance = Math.max(5, this.cameraDistance - 2);
        this.updateCameraPosition();
      }
    });
  }

  /**
   * Update camera position based on distance
   */
  updateCameraPosition() {
    this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
    this.camera.lookAt(0, 0, 0);
    console.log('Camera distance:', this.cameraDistance);
  }

  /**
   * Setup window resize handler
   */
  setupResizeHandler() {
    this.resizeHandler = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Update lighting configuration
   * @param {Object} lightingConfig - Lighting configuration from level
   */
  updateLighting(lightingConfig) {
    if (!lightingConfig) return;

    // Update ambient light
    if (lightingConfig.ambient && this.lights.ambient) {
      this.lights.ambient.color.setHex(lightingConfig.ambient.color);
      this.lights.ambient.intensity = lightingConfig.ambient.intensity;
    }

    // Update sun light
    if (lightingConfig.sun && this.lights.sun) {
      this.lights.sun.color.setHex(lightingConfig.sun.color);
      this.lights.sun.intensity = lightingConfig.sun.intensity;
      if (lightingConfig.sun.position) {
        this.lights.sun.position.set(
          lightingConfig.sun.position.x,
          lightingConfig.sun.position.y,
          lightingConfig.sun.position.z
        );
      }
    }

    // Update fill light
    if (lightingConfig.fill && this.lights.fill) {
      this.lights.fill.color.setHex(lightingConfig.fill.color);
      this.lights.fill.intensity = lightingConfig.fill.intensity;
    }

    // Update hemisphere light
    if (lightingConfig.hemisphere && this.lights.hemisphere) {
      this.lights.hemisphere.color.setHex(lightingConfig.hemisphere.sky);
      this.lights.hemisphere.groundColor.setHex(lightingConfig.hemisphere.ground);
      this.lights.hemisphere.intensity = lightingConfig.hemisphere.intensity;
    }

    // Update background color
    if (lightingConfig.background) {
      this.scene.background.setHex(lightingConfig.background);
    }
  }

  /**
   * Update ground type
   * @param {string} groundType - Type of ground to display
   * @param {Object} groundSize - Optional ground size { width, length }
   */
  updateGround(groundType, groundSize) {
    if (this.groundSystem) {
      this.groundSystem.updateGround(groundType, groundSize);
    }
  }

  /**
   * Add an entity to the engine
   * @param {Object} entity - Entity to add
   */
  addEntity(entity) {
    this.entities.push(entity);
    // Add mesh if it exists (for async model loading, mesh is added later)
    if (entity.mesh && !this.scene.children.includes(entity.mesh)) {
      this.scene.add(entity.mesh);
    }
  }

  /**
   * Remove an entity from the engine
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
    if (entity.mesh) {
      this.scene.remove(entity.mesh);
    }
  }

  /**
   * Get or create instanced particle pool
   * @param {string} type - Type of particle pool
   * @returns {InstancedParticlePool} Particle pool instance
   */
  getInstancedParticlePool(type) {
    if (!this.instancedParticlePools[type]) {
      // Create on demand with type-specific configuration
      const configs = {
        flames: { maxParticles: 2000, size: 0.8, blending: THREE.AdditiveBlending },
        ice: { maxParticles: 1000, size: 0.3, blending: THREE.AdditiveBlending },
        shadow: { maxParticles: 1000, size: 0.6, blending: THREE.AdditiveBlending },
        fire_explosion: { maxParticles: 1500, size: 0.5, blending: THREE.AdditiveBlending },
        lightning_explosion: { maxParticles: 1000, size: 0.4, blending: THREE.AdditiveBlending },
        generic: { maxParticles: 2000, size: 1.0, blending: THREE.AdditiveBlending }
      };

      const config = configs[type] || configs.generic;
      this.instancedParticlePools[type] = new InstancedParticlePool(this.scene, config);
    }
    return this.instancedParticlePools[type];
  }

  /**
   * Start the game loop
   */
  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Pause the game
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume the game
   */
  resume() {
    this.paused = false;
    this.lastFrameTime = performance.now();
  }

  /**
   * Main game loop
   */
  gameLoop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.gameLoop);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent huge jumps
    if (!this.paused && deltaTime < 0.1) {
      this.time += deltaTime;
      this.update(deltaTime);
    }

    this.render();
  }

  /**
   * Check if an entity is visible in the camera frustum
   * @param {object} entity - Entity to check
   * @returns {boolean} True if entity is visible
   */
  isEntityVisible(entity) {
    // Always update certain entity types regardless of visibility
    if (entity.alwaysUpdate || entity.isPersistent || !entity.mesh) {
      return true;
    }

    // Create a bounding sphere for the entity
    // Most entities are roughly 1 unit in size, use 2 for safety margin
    const boundingSphere = new THREE.Sphere(
      new THREE.Vector3(entity.x || 0, entity.y || 0, entity.z || 0),
      2
    );

    return this.frustum.intersectsSphere(boundingSphere);
  }

  /**
   * Update all systems
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update frustum for culling
    if (this.camera) {
      this.frustumMatrix.multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.frustumMatrix);
    }

    // Update particle system
    if (this.particles) {
      this.particles.update(dt);
    }

    // Update instanced particle pools
    Object.values(this.instancedParticlePools).forEach(pool => {
      if (pool) pool.update(dt);
    });

    // Update projectile pools
    if (this.projectilePools) {
      this.projectilePools.forEach(pool => {
        if (pool) pool.update();
      });
    }

    // Update all entities with frustum culling
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      // Remove inactive entities
      if (!entity.active && entity.shouldRemove) {
        this.removeEntity(entity);
        continue;
      }

      // Update entity only if visible or important
      if (entity.active && entity.update && this.isEntityVisible(entity)) {
        entity.update(dt);
      }
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.running = false;

    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Clean up subsystems
    if (this.groundSystem) {
      this.groundSystem.cleanup();
    }

    if (this.fogSystem) {
      this.fogSystem.cleanup();
    }

    // Clean up renderer
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }

    // Clear entities
    this.entities = [];
  }
}