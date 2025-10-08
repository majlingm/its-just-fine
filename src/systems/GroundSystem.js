import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getAssetPath } from '../utils/assetPath.js';

/**
 * GroundSystem - Handles all ground generation and management
 * Extracted from GameEngine to maintain separation of concerns
 */
export class GroundSystem {
  constructor(scene) {
    this.scene = scene;
    this.groundMesh = null;
    this.groundTiles = [];
    this.loadingDesertGround = false;
    this.currentGroundType = null;
  }

  /**
   * Update the ground to a specific type
   * @param {string} groundType - Type of ground to create
   */
  updateGround(groundType) {
    // Cancel any pending desert ground loading
    this.loadingDesertGround = false;
    this.currentGroundType = groundType;

    // Remove existing ground if present
    this.cleanup();

    // Create new ground based on type
    switch(groundType) {
      case 'grass':
        this.createUrbanGround();
        break;
      case 'clouds':
      case 'pink-clouds':
        this.createCloudsGround();
        break;
      case 'glass':
        this.createGlassGround();
        break;
      case 'ice':
        this.createIceGround();
        break;
      case 'water':
        this.createWaterGround();
        break;
      case 'rainbow':
        this.createRainbowGround();
        break;
      case 'mirror':
        this.createMirrorGround();
        break;
      case 'lava':
        this.createLavaGround();
        break;
      case 'lava-mirror':
        this.createLavaMirrorGround();
        break;
      case 'dark':
        this.createDarkGround();
        break;
      case 'bright':
        this.createBrightGround();
        break;
      case 'neon':
        this.createNeonGround();
        break;
      case 'checkerboard':
        this.createCheckerboardGround();
        break;
      case 'void':
        this.createVoidGround();
        break;
      case 'matrix':
        this.createMatrixGround();
        break;
      case 'psychedelic':
        this.createPsychedelicGround();
        break;
      case 'desert':
      default:
        this.createDesertGround();
        break;
    }
  }

  /**
   * Clean up existing ground meshes
   */
  cleanup() {
    // Remove existing ground mesh
    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      if (this.groundMesh.geometry) this.groundMesh.geometry.dispose();
      if (this.groundMesh.material) {
        if (this.groundMesh.material.map) this.groundMesh.material.map.dispose();
        this.groundMesh.material.dispose();
      }
      this.groundMesh = null;
    }

    // Remove existing ground tiles
    if (this.groundTiles.length > 0) {
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
  }

  // ===== Ground Creation Methods =====

  async createUrbanGround() {
    const loader = new GLTFLoader();
    this.groundTiles = [];

    loader.load(getAssetPath('/models/retro-urban-kit/grass.glb'), (gltf) => {
      let grassGeometry = null;
      let grassMaterial = null;

      gltf.scene.traverse((child) => {
        if (child.isMesh && !grassGeometry) {
          grassGeometry = child.geometry;
          grassMaterial = child.material.clone();

          // Configure material for proper lighting
          if (grassMaterial.emissive !== undefined) {
            grassMaterial.emissive.setHex(0x000000);
            grassMaterial.emissiveIntensity = 0;
          }
          if (grassMaterial.emissiveMap !== undefined) {
            grassMaterial.emissiveMap = null;
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

      // Calculate tile size
      grassGeometry.computeBoundingBox();
      const box = grassGeometry.boundingBox;
      const actualWidth = box.max.x - box.min.x;
      const actualDepth = box.max.z - box.min.z;

      // Tile to cover 200x200 area
      const coverageArea = 200;
      const tilesX = Math.ceil(coverageArea / actualWidth);
      const tilesZ = Math.ceil(coverageArea / actualDepth);

      // Create grass tiles
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

      // Shadow receiver plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(coverageArea, coverageArea);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.01;
      shadowPlane.receiveShadow = true;
      shadowPlane.castShadow = false;
      this.scene.add(shadowPlane);
      this.groundTiles.push(shadowPlane);
    }, undefined, (error) => {
      console.error('Failed to load grass tiles:', error);
      this.createProceduralGround('grass');
    });
  }

  createDesertGround() {
    const canvas = document.createElement('canvas');
    const tileSize = 32;
    canvas.width = tileSize * 4;
    canvas.height = tileSize * 4;
    const ctx = canvas.getContext('2d');

    const tileImages = [];
    let loaded = 0;
    this.loadingDesertGround = true;

    const onAllTilesLoaded = () => {
      if (!this.loadingDesertGround) {
        console.log('Desert ground load cancelled');
        return;
      }

      // Draw sand pattern
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const tileIndex = Math.floor(Math.random() * 4);
          const tile = tileImages[tileIndex];
          if (tile) {
            ctx.drawImage(tile, x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
      }

      // Create texture
      const groundTexture = new THREE.CanvasTexture(canvas);
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(25, 25);

      const groundGeo = new THREE.PlaneGeometry(200, 200);
      const groundMat = new THREE.MeshStandardMaterial({
        map: groundTexture,
        roughness: 0.7,
        metalness: 0.2
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
      this.groundMesh = ground;
      this.loadingDesertGround = false;
    };

    // Load first 4 tiles (plain sand)
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === 4) {
          onAllTilesLoaded();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load tile ${i}`);
        loaded++;
        if (loaded === 4) {
          this.loadingDesertGround = false;
          this.createProceduralGround('desert');
        }
      };
      const tileNum = i.toString().padStart(4, '0');
      img.src = getAssetPath(`/assets/desert/Sliced/PNG${tileNum}.PNG`);
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

      // Grass variations
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
    } else {
      // Desert fallback
      ctx.fillStyle = '#c2a67a';
      ctx.fillRect(0, 0, 1024, 1024);

      // Sand variations
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
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base pink cloud color
    ctx.fillStyle = '#ffb3d9';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fluffy cloud variations
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
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base ice color
    ctx.fillStyle = '#d0e8ff';
    ctx.fillRect(0, 0, 1024, 1024);

    // Ice variations
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
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base water color
    ctx.fillStyle = '#1a6ba8';
    ctx.fillRect(0, 0, 512, 512);

    // Ripple patterns
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
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rainbow stripes
    const stripeWidth = 150;
    const colors = [
      '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
      '#0000ff', '#4b0082', '#9400d3'
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
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawLava = (time) => {
      // Base lava gradient
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#ff4400');
      gradient.addColorStop(0.5, '#ff8800');
      gradient.addColorStop(1, '#ff2200');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Flowing lava veins
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(time * 0.001 + i * 0.5) * 256) + 256;
        const y = (i * 20 + time * 0.05) % 512;
        const size = Math.sin(time * 0.002 + i) * 30 + 40;

        ctx.fillStyle = `rgba(255, ${Math.floor(180 + Math.sin(time * 0.003 + i) * 75)}, 0, 0.6)`;
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

    // Animate lava
    let animTime = 0;
    const animateLava = () => {
      if (this.groundMesh !== ground) return;
      animTime += 3;
      drawLava(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateLava);
    };
    animateLava();
  }

  createLavaMirrorGround() {
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
      animTime += 3;
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
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawNeon = (time) => {
      ctx.fillStyle = '#0a0015';
      ctx.fillRect(0, 0, 512, 512);

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

      // Glowing nodes
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
      animTime += 5;
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
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawVoid = (time) => {
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

      // Stars
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
      animTime += 4;
      drawVoid(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateVoid);
    };
    animateVoid();
  }

  createMatrixGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    const drops = Array(32).fill(0);

    const drawMatrix = () => {
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
      animTime += 2;
      drawPsychedelic(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animatePsychedelic);
    };
    animatePsychedelic();
  }
}