import * as THREE from 'three';

/**
 * Renderer - Three.js rendering abstraction (Platform-agnostic)
 *
 * Responsibilities:
 * - Scene management
 * - Camera setup and control
 * - WebGL renderer initialization
 * - Lighting management
 * - Rendering loop
 *
 * NOT responsible for:
 * - Game logic
 * - Entity management (handled by Engine)
 * - Input handling (handled by InputManager)
 */
export class Renderer {
  constructor() {
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;

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

    // Resize handler reference
    this.resizeHandler = null;
  }

  /**
   * Initialize the renderer
   * @param {HTMLElement} container - DOM element to mount the renderer
   * @param {Object} options - Renderer options
   */
  init(container, options = {}) {
    // Scene setup
    this.setupScene(options.backgroundColor);

    // Camera setup
    this.setupCamera(options.cameraDistance);

    // Renderer setup
    this.setupRenderer(container, options.antialias);

    // Lighting setup
    this.setupLighting(options.lighting);

    // Handle window resize
    this.setupResizeHandler();
  }

  /**
   * Setup Three.js scene
   * @param {number} backgroundColor - Background color (hex)
   */
  setupScene(backgroundColor = 0xff7744) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);
  }

  /**
   * Setup camera
   * @param {number} distance - Optional camera distance override
   */
  setupCamera(distance = null) {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

    // Adjust camera distance based on device type if not provided
    if (distance !== null) {
      this.cameraDistance = distance;
    } else {
      this.cameraDistance = this.detectDeviceCameraDistance();
    }

    // Position camera for isometric-like view
    this.updateCameraPosition();
  }

  /**
   * Detect appropriate camera distance based on device
   * @returns {number} Camera distance
   */
  detectDeviceCameraDistance() {
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
      return isLandscape ? 28 : 32;
    } else if (isTablet) {
      return 20;
    } else {
      return 15;  // Desktop
    }
  }

  /**
   * Update camera position based on distance
   */
  updateCameraPosition() {
    this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup WebGL renderer
   * @param {HTMLElement} container - Container element
   * @param {boolean} antialias - Enable antialiasing
   */
  setupRenderer(container, antialias = true) {
    this.renderer = new THREE.WebGLRenderer({ antialias });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup scene lighting
   * @param {Object} lightingConfig - Optional lighting configuration
   */
  setupLighting(lightingConfig = {}) {
    // Ambient light - warm orange-yellow
    const ambientColor = lightingConfig.ambient?.color || 0xffbb66;
    const ambientIntensity = lightingConfig.ambient?.intensity || 0.6;
    this.lights.ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(this.lights.ambient);

    // Sun light - main directional light
    const sunColor = lightingConfig.sun?.color || 0xffdd88;
    const sunIntensity = lightingConfig.sun?.intensity || 1.2;
    this.lights.sun = new THREE.DirectionalLight(sunColor, sunIntensity);

    const sunPos = lightingConfig.sun?.position || { x: 20, y: 40, z: 15 };
    this.lights.sun.position.set(sunPos.x, sunPos.y, sunPos.z);
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
    const fillColor = lightingConfig.fill?.color || 0xff9944;
    const fillIntensity = lightingConfig.fill?.intensity || 0.3;
    this.lights.fill = new THREE.DirectionalLight(fillColor, fillIntensity);
    this.lights.fill.position.set(-10, 20, -10);
    this.scene.add(this.lights.fill);

    // Hemisphere light for ambient lighting
    const hemisphereColor = lightingConfig.hemisphere?.sky || 0xffdd99;
    const hemisphereGround = lightingConfig.hemisphere?.ground || 0x4a3520;
    const hemisphereIntensity = lightingConfig.hemisphere?.intensity || 0.5;
    this.lights.hemisphere = new THREE.HemisphereLight(hemisphereColor, hemisphereGround, hemisphereIntensity);
    this.scene.add(this.lights.hemisphere);
  }

  /**
   * Update lighting configuration
   * @param {Object} lightingConfig - Lighting configuration
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
   * Add mesh to scene
   * @param {THREE.Object3D} mesh - Mesh to add
   */
  addToScene(mesh) {
    if (mesh && !this.scene.children.includes(mesh)) {
      this.scene.add(mesh);
    }
  }

  /**
   * Remove mesh from scene
   * @param {THREE.Object3D} mesh - Mesh to remove
   */
  removeFromScene(mesh) {
    if (mesh) {
      this.scene.remove(mesh);
    }
  }

  /**
   * Check if position is visible in camera frustum
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {number} radius - Bounding radius
   * @returns {boolean} True if visible
   */
  isVisible(x, y, z, radius = 2) {
    const boundingSphere = new THREE.Sphere(
      new THREE.Vector3(x, y, z),
      radius
    );
    return this.frustum.intersectsSphere(boundingSphere);
  }

  /**
   * Update frustum for culling calculations
   */
  updateFrustum() {
    if (this.camera) {
      this.frustumMatrix.multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.frustumMatrix);
    }
  }

  /**
   * Zoom camera in or out
   * @param {number} delta - Zoom delta (positive = zoom out, negative = zoom in)
   */
  zoom(delta) {
    if (delta > 0) {
      // Zoom out
      this.cameraDistance += 2;
    } else {
      // Zoom in
      this.cameraDistance = Math.max(5, this.cameraDistance - 2);
    }
    this.updateCameraPosition();
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
    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Clean up renderer
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}
