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
    this.cameraAngle = 0; // Rotation angle in radians
    this.targetCameraAngle = 0; // Target angle for smooth rotation
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

    // Detect device type
    const isIPhone = /iPhone/i.test(userAgent);
    const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isTablet = isIPad || (isAndroid && width >= 768 && width <= 1024);
    const isMobile = (isIPhone || (isAndroid && width < 768)) && !isTablet;

    // Set camera distance based on device
    if (isMobile) {
      this.cameraDistance = 18;  // Mobile phones - current setting
    } else if (isTablet) {
      this.cameraDistance = 14;  // Tablets - more zoomed in than current mobile
    } else {
      this.cameraDistance = 15;  // Desktop - more zoomed out than current
    }

    // Position camera for isometric-like view
    this.updateCameraPosition();
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
   * Setup zoom and rotation controls (Q/E for zoom, Z/C for rotation)
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
      } else if (e.key === 'z' || e.key === 'Z') {
        // Rotate camera left
        this.targetCameraAngle += Math.PI / 4; // 45 degrees
      } else if (e.key === 'c' || e.key === 'C') {
        // Rotate camera right
        this.targetCameraAngle -= Math.PI / 4; // 45 degrees
      }
    });
  }

  /**
   * Update camera position based on distance and angle
   */
  updateCameraPosition() {
    const x = Math.sin(this.cameraAngle) * this.cameraDistance * 0.5;
    const z = Math.cos(this.cameraAngle) * this.cameraDistance * 0.5;
    this.camera.position.set(x, this.cameraDistance * 1.5, z);
    this.camera.lookAt(0, 0, 0);
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
   */
  updateGround(groundType) {
    if (this.groundSystem) {
      this.groundSystem.updateGround(groundType);
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
      // Create on demand
      this.instancedParticlePools[type] = new InstancedParticlePool(
        this.scene,
        1000, // Max particles
        {
          color: type === 'explosions' ? 0xff4400 : 0xffffff,
          size: type === 'explosions' ? 2 : 1
        }
      );
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
   * Update all systems
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Smooth camera rotation
    if (Math.abs(this.targetCameraAngle - this.cameraAngle) > 0.01) {
      const rotationSpeed = 5.0; // Rotation speed multiplier
      const diff = this.targetCameraAngle - this.cameraAngle;
      this.cameraAngle += diff * rotationSpeed * dt;
      this.updateCameraPosition();
    }

    // Update particle system
    if (this.particles) {
      this.particles.update(dt);
    }

    // Update instanced particle pools
    Object.values(this.instancedParticlePools).forEach(pool => {
      if (pool) pool.update(dt);
    });

    // Update all entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.active && entity.update) {
        entity.update(dt);
      }
      // Remove inactive entities
      if (!entity.active && entity.shouldRemove) {
        this.removeEntity(entity);
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