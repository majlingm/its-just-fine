import * as THREE from 'three';
import { getCameraConfig, getDeviceCameraSettings } from '../config/camera.js';

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

    // Camera configuration
    this.cameraMode = 'isometric'; // Default mode
    this.cameraConfig = null;
    this.cameraDistance = 12;
    this.cameraHorizontalAngle = 0;
    this.cameraVerticalAngle = Math.PI / 6;
    this.targetCameraDistance = 12;
    this.targetHorizontalAngle = 0;
    this.targetVerticalAngle = Math.PI / 6;

    // Camera target (what the camera looks at)
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.targetPosition = new THREE.Vector3(0, 0, 0);

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
    this.setupCamera(options.cameraMode, options.cameraConfig);

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
   * Setup camera with configuration
   * @param {string} mode - Camera mode ('isometric', 'thirdPerson', 'topDown', 'default')
   * @param {Object} customConfig - Optional custom camera configuration override
   */
  setupCamera(mode = null, customConfig = null) {
    // Get camera configuration
    this.cameraMode = mode || this.cameraMode;
    this.cameraConfig = customConfig || getCameraConfig(this.cameraMode);

    // Apply device-specific overrides
    const deviceSettings = getDeviceCameraSettings(this.cameraConfig);
    this.cameraConfig = { ...this.cameraConfig, ...deviceSettings };

    // Create camera based on type
    const aspect = window.innerWidth / window.innerHeight;
    if (this.cameraConfig.type === 'orthographic') {
      const size = this.cameraConfig.orthoSize || 15;
      this.camera = new THREE.OrthographicCamera(
        -size * aspect,
        size * aspect,
        size,
        -size,
        this.cameraConfig.near,
        this.cameraConfig.far
      );
    } else {
      // Perspective camera
      this.camera = new THREE.PerspectiveCamera(
        this.cameraConfig.fov,
        aspect,
        this.cameraConfig.near,
        this.cameraConfig.far
      );
    }

    // Initialize camera settings
    this.cameraDistance = this.cameraConfig.distance;
    this.targetCameraDistance = this.cameraDistance;
    this.cameraHorizontalAngle = this.cameraConfig.horizontalAngle;
    this.targetHorizontalAngle = this.cameraHorizontalAngle;
    this.cameraVerticalAngle = this.cameraConfig.verticalAngle;
    this.targetVerticalAngle = this.cameraVerticalAngle;

    // Position camera initially
    this.updateCameraPosition();
  }

  /**
   * Update camera position based on current settings
   * @param {Object} target - Optional target position { x, y, z }
   */
  updateCameraPosition(target = null) {
    if (!this.camera || !this.cameraConfig) return;

    // Update target position
    if (target) {
      this.targetPosition.set(target.x, target.y, target.z);
    }

    // Smooth camera parameters
    const follow = this.cameraConfig.follow || {};
    const smoothing = follow.smoothing || 0.1;

    // Lerp distance and angles
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * (1 - smoothing);
    this.cameraHorizontalAngle += (this.targetHorizontalAngle - this.cameraHorizontalAngle) * (1 - smoothing);
    this.cameraVerticalAngle += (this.targetVerticalAngle - this.cameraVerticalAngle) * (1 - smoothing);

    // Lerp camera target
    this.cameraTarget.lerp(this.targetPosition, 1 - smoothing);

    // Calculate camera position based on angles and distance
    const heightMultiplier = this.cameraConfig.heightMultiplier || 1.5;
    const radiusMultiplier = this.cameraConfig.radiusMultiplier || 0.5;

    const height = this.cameraDistance * heightMultiplier;
    const radius = this.cameraDistance * radiusMultiplier;

    // Calculate XZ position based on horizontal angle
    const x = this.cameraTarget.x + Math.sin(this.cameraHorizontalAngle) * radius;
    const z = this.cameraTarget.z + Math.cos(this.cameraHorizontalAngle) * radius;

    // Set camera position
    this.camera.position.set(x, height, z);

    // Look at target with optional offset
    const lookAtOffset = follow.lookAtOffset || { x: 0, y: 0, z: 0 };
    this.camera.lookAt(
      this.cameraTarget.x + lookAtOffset.x,
      this.cameraTarget.y + lookAtOffset.y,
      this.cameraTarget.z + lookAtOffset.z
    );
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
    if (!this.cameraConfig || !this.cameraConfig.zoom) return;

    const zoomSettings = this.cameraConfig.zoom;
    const step = zoomSettings.step || 2;

    if (delta > 0) {
      // Zoom out
      this.targetCameraDistance = Math.min(zoomSettings.max, this.targetCameraDistance + step);
    } else {
      // Zoom in
      this.targetCameraDistance = Math.max(zoomSettings.min, this.targetCameraDistance - step);
    }
  }

  /**
   * Rotate camera horizontally
   * @param {number} delta - Rotation delta in radians
   */
  rotateHorizontal(delta) {
    if (!this.cameraConfig || !this.cameraConfig.rotation || !this.cameraConfig.rotation.enabled) return;

    this.targetHorizontalAngle += delta;
  }

  /**
   * Rotate camera vertically
   * @param {number} delta - Rotation delta in radians
   */
  rotateVertical(delta) {
    if (!this.cameraConfig || !this.cameraConfig.rotation || !this.cameraConfig.rotation.enabled) return;

    const rotation = this.cameraConfig.rotation;
    this.targetVerticalAngle = Math.max(
      rotation.verticalMin || 0,
      Math.min(
        rotation.verticalMax || Math.PI / 2,
        this.targetVerticalAngle + delta
      )
    );
  }

  /**
   * Set camera mode (isometric, thirdPerson, etc.)
   * @param {string} mode - Camera mode
   */
  setCameraMode(mode) {
    if (this.cameraMode === mode) return;

    this.cameraMode = mode;
    this.setupCamera(mode);
  }

  /**
   * Update camera to follow a target
   * @param {Object} target - Target position { x, y, z }
   */
  followTarget(target) {
    this.updateCameraPosition(target);
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
