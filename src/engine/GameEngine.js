import * as THREE from 'three';
import { SoundSystem } from './SoundSystem.js';
import { ParticleSystem } from '../particles/ParticleSystem.js';
import { InstancedParticlePool } from '../effects/InstancedParticlePool.js';

export class GameEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.entities = [];
    this.particles = null;
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.lastFrameTime = 0;
  }

  init(container) {
    // Scene - sunset atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xff7744); // Orange-red sunset sky

    // Camera - adjust zoom based on screen size with better perspective
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.cameraDistance = isMobile ? 18 : 12; // Closer camera for desktop
    // Position camera more top-down for better isometric-like view
    this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
    this.camera.lookAt(0, 0, 0);

    // Debug zoom controls (Q/E keys)
    this.setupZoomControls();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Sound
    this.sound = new SoundSystem();
    this.sound.init();

    // Particle System
    this.particles = new ParticleSystem(this.scene, 100);

    // Instanced Particle Pools (for high-performance rendering)
    this.instancedParticlePools = {
      trails: null, // Will be initialized when first needed
      explosions: null,
      generic: null
    };

    // Default lighting - warm red/yellow tones
    const ambientLight = new THREE.AmbientLight(0xffbb66, 0.6); // Warm orange-yellow
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;

    // Main directional light - sun with warm tone
    const sunLight = new THREE.DirectionalLight(0xffdd88, 1.2); // Warm yellow
    sunLight.position.set(20, 40, 15); // Higher angle for shorter shadows
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Fill light with warm tone
    const fillLight = new THREE.DirectionalLight(0xff9944, 0.3); // Orange
    fillLight.position.set(-10, 20, -10);
    this.scene.add(fillLight);
    this.fillLight = fillLight;

    // Hemisphere light with warm tones
    const hemiLight = new THREE.HemisphereLight(0xffdd99, 0x4a3520, 0.5); // Warm yellow sky
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;

    // Ground
    this.createGround();

    // Boundary fog walls
    this.createBoundaryFog();

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  createGround() {
    // Start with desert ground by default
    this.updateGround('desert');
  }

  createBoundaryFog() {
    const boundary = 90;
    const fogHeight = 25;
    const fogThickness = 15;

    // Vertex shader - pass world position
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader - 3D Perlin noise
    const fragmentShader = `
      uniform float time;
      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      // 3D Perlin noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        // Use world position for volumetric effect
        vec3 pos = vWorldPosition * 0.08;

        // Multiple octaves of 3D noise
        float noise = 0.0;
        noise += snoise(pos + vec3(time * 0.1, time * 0.05, 0.0)) * 0.5;
        noise += snoise(pos * 2.0 + vec3(0.0, time * 0.08, time * 0.1)) * 0.25;
        noise += snoise(pos * 4.0 - vec3(time * 0.06, 0.0, time * 0.07)) * 0.125;

        // Normalize to 0-1
        noise = noise * 0.5 + 0.5;

        // Height-based fade
        float heightFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

        // Edge fade (thicker in center of fog wall)
        float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

        // Combine everything
        float density = noise * heightFade * edgeFade * 0.85;

        gl_FragColor = vec4(fogColor, density);
      }
    `;

    const fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        fogColor: { value: new THREE.Color(0xff69b4) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.fogWalls = [];

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boundary * 2, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    northWall.position.set(0, fogHeight / 2, boundary + fogThickness / 2);
    this.scene.add(northWall);
    this.fogWalls.push(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boundary * 2, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    southWall.position.set(0, fogHeight / 2, -boundary - fogThickness / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);
    this.fogWalls.push(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boundary * 2, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    eastWall.position.set(boundary + fogThickness / 2, fogHeight / 2, 0);
    eastWall.rotation.y = Math.PI / 2;
    this.scene.add(eastWall);
    this.fogWalls.push(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boundary * 2, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    westWall.position.set(-boundary - fogThickness / 2, fogHeight / 2, 0);
    westWall.rotation.y = -Math.PI / 2;
    this.scene.add(westWall);
    this.fogWalls.push(westWall);

    // Animate fog
    const animate = () => {
      if (this.fogWalls && this.fogWalls.length > 0) {
        const time = performance.now() * 0.001;
        this.fogWalls.forEach(wall => {
          if (wall.material.uniforms) {
            wall.material.uniforms.time.value = time;
          }
        });
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  updateLighting(lightingConfig) {
    if (!lightingConfig) return;

    // Update ambient light
    if (lightingConfig.ambient) {
      this.ambientLight.color.setHex(lightingConfig.ambient.color);
      this.ambientLight.intensity = lightingConfig.ambient.intensity;
    }

    // Update sun light
    if (lightingConfig.sun) {
      this.sunLight.color.setHex(lightingConfig.sun.color);
      this.sunLight.intensity = lightingConfig.sun.intensity;
      if (lightingConfig.sun.position) {
        this.sunLight.position.set(
          lightingConfig.sun.position.x,
          lightingConfig.sun.position.y,
          lightingConfig.sun.position.z
        );
      }
    }

    // Update fill light
    if (lightingConfig.fill) {
      this.fillLight.color.setHex(lightingConfig.fill.color);
      this.fillLight.intensity = lightingConfig.fill.intensity;
    }

    // Update hemisphere light
    if (lightingConfig.hemisphere) {
      this.hemiLight.color.setHex(lightingConfig.hemisphere.sky);
      this.hemiLight.groundColor.setHex(lightingConfig.hemisphere.ground);
      this.hemiLight.intensity = lightingConfig.hemisphere.intensity;
    }

    // Update background color
    if (lightingConfig.background) {
      this.scene.background.setHex(lightingConfig.background);
    }
  }

  updateGround(groundType) {
    // Cancel any pending desert ground loading
    this.loadingDesertGround = false;

    // Remove existing ground if present
    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      if (this.groundMesh.geometry) this.groundMesh.geometry.dispose();
      if (this.groundMesh.material) {
        if (this.groundMesh.material.map) this.groundMesh.material.map.dispose();
        this.groundMesh.material.dispose();
      }
      this.groundMesh = null;
    }

    // Remove existing ground tiles if present
    if (this.groundTiles) {
      this.groundTiles.forEach(tile => {
        this.scene.remove(tile);
        if (tile.geometry) tile.geometry.dispose();
        if (tile.material) {
          if (tile.material.map) tile.material.map.dispose();
          tile.material.dispose();
        }
      });
      this.groundTiles = [];
    }

    if (groundType === 'grass') {
      this.createUrbanGround();
    } else if (groundType === 'clouds' || groundType === 'pink-clouds') {
      this.createCloudsGround();
    } else if (groundType === 'glass') {
      this.createGlassGround();
    } else if (groundType === 'ice') {
      this.createIceGround();
    } else if (groundType === 'water') {
      this.createWaterGround();
    } else if (groundType === 'rainbow') {
      this.createRainbowGround();
    } else if (groundType === 'mirror') {
      this.createMirrorGround();
    } else if (groundType === 'lava') {
      this.createLavaGround();
    } else if (groundType === 'lava-mirror') {
      this.createLavaMirrorGround();
    } else if (groundType === 'dark') {
      this.createDarkGround();
    } else if (groundType === 'bright') {
      this.createBrightGround();
    } else if (groundType === 'neon') {
      this.createNeonGround();
    } else if (groundType === 'checkerboard') {
      this.createCheckerboardGround();
    } else if (groundType === 'void') {
      this.createVoidGround();
    } else if (groundType === 'matrix') {
      this.createMatrixGround();
    } else if (groundType === 'psychedelic') {
      this.createPsychedelicGround();
    } else {
      this.createDesertGround();
    }
  }

  async createUrbanGround() {
    // Use retro-urban-kit grass tiles to create ground
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    this.groundTiles = [];

    // Load grass tile model
    loader.load('/packs/retro-urban-kit/Models/GLB format/grass.glb', (gltf) => {
      // First, get the mesh from the loaded model
      let grassMesh = null;
      let grassGeometry = null;
      let grassMaterial = null;

      gltf.scene.traverse((child) => {
        if (child.isMesh && !grassMesh) {
          grassMesh = child;
          grassGeometry = child.geometry;
          grassMaterial = child.material.clone(); // Clone to avoid sharing

          // Ensure material receives colored lighting with some reflectivity
          // Don't override color - keep original grass color
          // Turn off any emissive properties
          if (grassMaterial.emissive !== undefined) {
            grassMaterial.emissive.setHex(0x000000);
            grassMaterial.emissiveIntensity = 0;
          }
          if (grassMaterial.emissiveMap !== undefined) {
            grassMaterial.emissiveMap = null; // Remove emissive texture
          }
          if (grassMaterial.metalness !== undefined) {
            grassMaterial.metalness = 0.2;
          }
          if (grassMaterial.roughness !== undefined) {
            grassMaterial.roughness = 0.7;
          }
        }
      });

      if (!grassGeometry || !grassMaterial) {
        console.error('Could not find mesh in grass model');
        this.createProceduralGround('grass');
        return;
      }

      // Calculate bounding box to know actual tile size
      grassGeometry.computeBoundingBox();
      const box = grassGeometry.boundingBox;
      const actualWidth = box.max.x - box.min.x;
      const actualDepth = box.max.z - box.min.z;

      console.log('Grass tile actual size:', actualWidth, 'x', actualDepth);

      // Tile the grass to cover 200x200 area
      const coverageArea = 200;
      const tilesX = Math.ceil(coverageArea / actualWidth);
      const tilesZ = Math.ceil(coverageArea / actualDepth);

      console.log('Creating grid:', tilesX, 'x', tilesZ);

      // Create individual grass tiles
      for (let x = 0; x < tilesX; x++) {
        for (let z = 0; z < tilesZ; z++) {
          const mesh = new THREE.Mesh(grassGeometry, grassMaterial);
          mesh.position.set(
            (x * actualWidth) - (coverageArea / 2),
            0,
            (z * actualDepth) - (coverageArea / 2)
          );
          mesh.receiveShadow = false;
          mesh.castShadow = false;

          this.scene.add(mesh);
          this.groundTiles.push(mesh);
        }
      }

      // Create a shadow receiver plane ABOVE the grass
      const shadowPlaneGeo = new THREE.PlaneGeometry(coverageArea, coverageArea);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.01; // Just above grass
      shadowPlane.receiveShadow = true;
      shadowPlane.castShadow = false;
      this.scene.add(shadowPlane);
      this.groundTiles.push(shadowPlane);
    }, undefined, (error) => {
      console.error('Failed to load grass tiles, using fallback:', error);
      this.createProceduralGround('grass');
    });
  }

  createDesertGround() {
    const textureLoader = new THREE.TextureLoader();

    // Create canvas for simple repeating sand texture
    const canvas = document.createElement('canvas');
    const tileSize = 32;
    canvas.width = tileSize * 4;
    canvas.height = tileSize * 4;
    const ctx = canvas.getContext('2d');

    // Load just the basic sand tiles (first 4 are plain sand variations)
    const tileImages = [];
    let loaded = 0;
    this.loadingDesertGround = true;

    const onAllTilesLoaded = () => {
      // Check if we're still supposed to create desert ground
      // (user might have switched levels while loading)
      if (!this.loadingDesertGround) {
        console.log('Desert ground load cancelled - level changed');
        return;
      }

      // Draw a simple pattern with just sand tiles (no cacti or decorations)
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          // Only use tiles 0-3 (plain sand variations)
          const tileIndex = Math.floor(Math.random() * 4);
          const tile = tileImages[tileIndex];
          if (tile) {
            ctx.drawImage(tile, x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
      }

      // Create texture from canvas
      const groundTexture = new THREE.CanvasTexture(canvas);
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(25, 25); // Repeat the pattern

      const groundGeo = new THREE.PlaneGeometry(200, 200);
      const groundMat = new THREE.MeshStandardMaterial({
        map: groundTexture,
        roughness: 0.7,
        metalness: 0.2
        // Don't override color - let texture show through
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
      this.groundMesh = ground;
      this.loadingDesertGround = false;
    };

    // Load only the first 4 tiles (plain sand)
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === 4) {
          onAllTilesLoaded();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load tile ${i}, using fallback`);
        loaded++;
        if (loaded === 4) {
          this.loadingDesertGround = false;
          this.createProceduralGround('desert');
        }
      };
      const tileNum = i.toString().padStart(4, '0');
      img.src = `/assets/desert/Sliced/PNG${tileNum}.PNG`;
      tileImages[i] = img;
    }
  }

  createProceduralGround(type = 'grass') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (type === 'grass') {
      // Base grass color
      ctx.fillStyle = '#3a5f2a';
      ctx.fillRect(0, 0, 1024, 1024);

      // Add grass color variations
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 30 + 10;
        const greenShade = Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${greenShade + 40}, ${greenShade + 80}, ${greenShade + 30}, 0.3)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add darker grass patches
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 50 + 30;
        ctx.fillStyle = 'rgba(30, 50, 20, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add lighter grass highlights
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 20 + 5;
        ctx.fillStyle = 'rgba(120, 160, 80, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add some dirt patches (brown)
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 40 + 20;
        ctx.fillStyle = 'rgba(90, 70, 50, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Desert fallback
      ctx.fillStyle = '#c2a67a';
      ctx.fillRect(0, 0, 1024, 1024);

      // Sand color variations
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 30 + 10;
        const sandShade = Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgba(${sandShade + 180}, ${sandShade + 150}, ${sandShade + 100}, 0.2)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(5, 5);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createCloudsGround() {
    // Create soft pink cloud texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base pink cloud color
    ctx.fillStyle = '#ffb3d9';
    ctx.fillRect(0, 0, 1024, 1024);

    // Add fluffy cloud variations
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 150 + 100;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(255, 200, 230, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 180, 220, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 150, 200, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add lighter cloud highlights
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 100 + 50;

      ctx.fillStyle = 'rgba(255, 230, 245, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.0,
      emissive: 0xffccee,
      emissiveIntensity: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createGlassGround() {
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      color: 0xcceeff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createIceGround() {
    // Create icy texture with cracks
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base ice color
    ctx.fillStyle = '#d0e8ff';
    ctx.fillRect(0, 0, 1024, 1024);

    // Add ice variations
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 80 + 40;
      ctx.fillStyle = `rgba(180, 220, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add cracks
    ctx.strokeStyle = 'rgba(160, 200, 240, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
      for (let j = 0; j < 3; j++) {
        ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xe0f0ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createWaterGround() {
    // Create water texture with ripples
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base water color
    ctx.fillStyle = '#1a6ba8';
    ctx.fillRect(0, 0, 512, 512);

    // Add ripple patterns
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const maxRadius = Math.random() * 50 + 30;

      for (let r = 10; r < maxRadius; r += 10) {
        ctx.strokeStyle = `rgba(100, 180, 230, ${0.3 * (1 - r / maxRadius)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0x2288bb,
      roughness: 0.05,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createRainbowGround() {
    // Create rainbow gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Create diagonal rainbow stripes
    const stripeWidth = 150;
    const colors = [
      '#ff0000', // Red
      '#ff7f00', // Orange
      '#ffff00', // Yellow
      '#00ff00', // Green
      '#0000ff', // Blue
      '#4b0082', // Indigo
      '#9400d3'  // Violet
    ];

    for (let i = -10; i < 20; i++) {
      const colorIndex = ((i % colors.length) + colors.length) % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.save();
      ctx.translate(0, i * stripeWidth);
      ctx.rotate(-Math.PI / 4);
      ctx.fillRect(-1024, -stripeWidth, 3000, stripeWidth);
      ctx.restore();
    }

    // Add soft overlay for dreamy effect
    const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 700);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0xffffff,
      emissiveIntensity: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createMirrorGround() {
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.02,
      metalness: 1.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createLavaGround() {
    // Animated lava texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create initial lava pattern
    const drawLava = (time) => {
      // Base lava color
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#ff4400');
      gradient.addColorStop(0.5, '#ff8800');
      gradient.addColorStop(1, '#ff2200');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Add flowing lava veins
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(time * 0.001 + i * 0.5) * 256) + 256;
        const y = (i * 20 + time * 0.05) % 512;
        const size = Math.sin(time * 0.002 + i) * 30 + 40;

        ctx.fillStyle = `rgba(255, ${Math.floor(180 + Math.sin(time * 0.003 + i) * 75)}, 0, 0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add bright spots
      for (let i = 0; i < 15; i++) {
        const x = (Math.cos(time * 0.002 + i) * 200) + 256;
        const y = (Math.sin(time * 0.0015 + i * 0.8) * 200) + 256;
        const size = Math.sin(time * 0.004 + i) * 15 + 20;

        ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLava(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xff4400,
      emissiveIntensity: 0.5,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    // Animate lava (slow)
    let animTime = 0;
    const animateLava = () => {
      if (this.groundMesh !== ground) return; // Stop if ground changed
      animTime += 3; // Slower animation
      drawLava(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateLava);
    };
    animateLava();
  }

  createLavaMirrorGround() {
    // Reflective lava
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawLava = (time) => {
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 400);
      gradient.addColorStop(0, '#ff8800');
      gradient.addColorStop(0.5, '#ff4400');
      gradient.addColorStop(1, '#cc2200');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Flowing patterns
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.001 + i) * 200) + 256;
        const y = (Math.cos(time * 0.0012 + i * 0.7) * 200) + 256;
        const size = Math.sin(time * 0.003 + i) * 40 + 50;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLava(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.05,
      metalness: 0.9,
      emissive: 0xff6600,
      emissiveIntensity: 0.6,
      emissiveMap: texture,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateLava = () => {
      if (this.groundMesh !== ground) return;
      animTime += 3; // Slower animation
      drawLava(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateLava);
    };
    animateLava();
  }

  createDarkGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Very dark stone texture
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle dark variations
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 5;
      ctx.fillStyle = `rgba(${Math.random() * 30}, ${Math.random() * 30}, ${Math.random() * 30}, 0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      color: 0x111111
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createBrightGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Bright white/yellow base
    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(0, 0, 512, 512);

    // Bright spots
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 40 + 20;
      ctx.fillStyle = `rgba(255, ${240 + Math.random() * 15}, ${200 + Math.random() * 55}, 0.2)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xffffee,
      emissiveIntensity: 0.3
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createNeonGround() {
    // Animated neon grid
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawNeon = (time) => {
      // Dark base
      ctx.fillStyle = '#0a0015';
      ctx.fillRect(0, 0, 512, 512);

      // Neon grid lines
      const gridSize = 32;
      const hue = (time * 0.05) % 360;

      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += gridSize) {
        const alpha = Math.sin(time * 0.002 + i * 0.01) * 0.3 + 0.5;
        ctx.strokeStyle = `hsla(${(hue + i) % 360}, 100%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Glowing nodes at intersections
      for (let x = 0; x <= 512; x += gridSize) {
        for (let y = 0; y <= 512; y += gridSize) {
          const pulsePhase = Math.sin(time * 0.003 + (x + y) * 0.01);
          if (pulsePhase > 0.7) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
            grad.addColorStop(0, `hsla(${(hue + x + y) % 360}, 100%, 80%, 1)`);
            grad.addColorStop(1, `hsla(${(hue + x + y) % 360}, 100%, 60%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    drawNeon(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x6600ff,
      emissiveIntensity: 0.4,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateNeon = () => {
      if (this.groundMesh !== ground) return;
      animTime += 5; // Slower animation
      drawNeon(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateNeon);
    };
    animateNeon();
  }

  createCheckerboardGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const squareSize = 64;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createVoidGround() {
    // Animated void with swirling darkness
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawVoid = (time) => {
      // Deep space black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);

      // Swirling void patterns
      for (let i = 0; i < 40; i++) {
        const angle = time * 0.0005 + i * 0.3;
        const radius = 100 + Math.sin(time * 0.001 + i) * 80;
        const x = 256 + Math.cos(angle) * radius;
        const y = 256 + Math.sin(angle) * radius;
        const size = Math.sin(time * 0.002 + i) * 30 + 40;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, `rgba(${80 + i * 2}, 0, ${120 + i * 3}, 0.3)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant stars
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 123.456) * 256) + 256;
        const y = (Math.cos(i * 789.012) * 256) + 256;
        const twinkle = Math.sin(time * 0.005 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(200, 200, 255, ${twinkle * 0.6})`;
        ctx.fillRect(x, y, 2, 2);
      }
    };

    drawVoid(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x1a0033,
      emissiveIntensity: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateVoid = () => {
      if (this.groundMesh !== ground) return;
      animTime += 4; // Slower animation
      drawVoid(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateVoid);
    };
    animateVoid();
  }

  createMatrixGround() {
    // Matrix-style digital rain
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    const drops = Array(32).fill(0);

    const drawMatrix = (time) => {
      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = '#0f0';
      ctx.font = '16px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 16;
        const y = drops[i] * 16;

        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5 + 0.5})`;
        ctx.fillText(char, x, y);

        if (y > 512 && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    // Initial fill
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x003300,
      emissiveIntensity: 0.3
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    const animateMatrix = () => {
      if (this.groundMesh !== ground) return;
      drawMatrix();
      texture.needsUpdate = true;
      requestAnimationFrame(animateMatrix);
    };
    animateMatrix();
  }

  createPsychedelicGround() {
    // Animated psychedelic patterns
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawPsychedelic = (time) => {
      for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
          const hue = (x + y + time * 0.1) % 360;
          const saturation = 80 + Math.sin(time * 0.001 + x * 0.01) * 20;
          const lightness = 50 + Math.cos(time * 0.001 + y * 0.01) * 20;
          const wave = Math.sin(x * 0.02 + time * 0.002) * Math.cos(y * 0.02 + time * 0.003);

          ctx.fillStyle = `hsl(${hue + wave * 60}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Spiraling overlay
      for (let i = 0; i < 5; i++) {
        const angle = time * 0.001 + i * Math.PI * 2 / 5;
        const radius = 100 + Math.sin(time * 0.002 + i) * 50;
        const x = 256 + Math.cos(angle) * radius;
        const y = 256 + Math.sin(angle) * radius;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, 60);
        grad.addColorStop(0, `hsla(${(time * 0.2 + i * 72) % 360}, 100%, 70%, 0.5)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPsychedelic(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animatePsychedelic = () => {
      if (this.groundMesh !== ground) return;
      animTime += 2; // Much slower animation
      drawPsychedelic(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animatePsychedelic);
    };
    animatePsychedelic();
  }

  setupZoomControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        // Zoom out
        this.cameraDistance += 2;
        this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera distance:', this.cameraDistance);
      } else if (e.key === 'e' || e.key === 'E') {
        // Zoom in
        this.cameraDistance = Math.max(5, this.cameraDistance - 2);
        this.camera.position.set(0, this.cameraDistance * 1.5, this.cameraDistance * 0.5);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera distance:', this.cameraDistance);
      }
    });
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addEntity(entity) {
    this.entities.push(entity);
    // Only add mesh if it's already created (for async model loading, mesh is added in createMesh)
    if (entity.mesh && !this.scene.children.includes(entity.mesh)) {
      this.scene.add(entity.mesh);
    }
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
    if (entity.mesh) {
      this.scene.remove(entity.mesh);
    }
  }

  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.running = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastFrameTime = performance.now();
  }

  gameLoop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.gameLoop);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    if (!this.paused && deltaTime < 0.1) {
      this.time += deltaTime;
      this.update(deltaTime);
    }

    this.render();
  }

  update(dt) {
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
      if (!entity.active && entity.shouldRemove) {
        this.removeEntity(entity);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  cleanup() {
    this.running = false;
    window.removeEventListener('resize', () => this.handleResize());
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
