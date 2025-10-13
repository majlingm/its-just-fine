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
    this.groundSize = null; // Custom ground dimensions { width, length }
  }

  /**
   * Update the ground to a specific type
   * @param {string} groundType - Type of ground to create
   * @param {Object} groundSize - Optional ground size { width, length }
   */
  updateGround(groundType, groundSize = null) {
    // Cancel any pending desert ground loading
    this.loadingDesertGround = false;
    this.currentGroundType = groundType;
    this.groundSize = groundSize;

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
      case 'aurora':
        this.createAuroraGround();
        break;
      case 'nebula':
        this.createNebulaGround();
        break;
      case 'ocean':
        this.createOceanGround();
        break;
      case 'forest':
        this.createForestGround();
        break;
      case 'snow':
        this.createSnowGround();
        break;
      case 'crystal':
        this.createCrystalCaveGround();
        break;
      case 'chrome':
        this.createChromeGround();
        break;
      case 'circuit':
        this.createCircuitBoardGround();
        break;
      case 'hologram':
        this.createHologramGridGround();
        break;
      case 'datastream':
        this.createDataStreamGround();
        break;
      case 'portal':
        this.createPortalGround();
        break;
      case 'plasma':
        this.createPlasmaGround();
        break;
      case 'realistic-grass':
        this.createRealisticGrassGround();
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

    // Use custom ground size if provided, otherwise default to 200x200
    const width = this.groundSize?.width || 200;
    const length = this.groundSize?.length || 200;
    const groundGeo = new THREE.PlaneGeometry(width, length);
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

  createAuroraGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawAurora = (time) => {
      // Dark sky base
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#001a33');
      gradient.addColorStop(1, '#000a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Aurora waves
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const layerOffset = layer * 100;
        const hue = (time * 0.05 + layer * 40) % 360;

        for (let x = 0; x <= 512; x += 5) {
          const wave1 = Math.sin(x * 0.01 + time * 0.002 + layer) * 40;
          const wave2 = Math.sin(x * 0.02 - time * 0.001 + layer) * 20;
          const y = 256 + wave1 + wave2 + layerOffset;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(512, 512);
        ctx.lineTo(0, 512);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 200 + layerOffset, 0, 400 + layerOffset);
        grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.1)`);
        grad.addColorStop(0.5, `hsla(${hue}, 90%, 50%, 0.4)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Stars
      for (let i = 0; i < 150; i++) {
        const x = (Math.sin(i * 123.456) * 256) + 256;
        const y = (Math.cos(i * 789.012) * 256) + 256;
        const twinkle = Math.sin(time * 0.003 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Bright aurora streaks
      for (let i = 0; i < 8; i++) {
        const x = (time * 0.3 + i * 64) % 512;
        const y = 256 + Math.sin(time * 0.001 + i) * 80;
        const size = 40 + Math.sin(time * 0.004 + i) * 20;
        const hue = (time * 0.1 + i * 45) % 360;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.6)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawAurora(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.2,
      emissive: 0x002244,
      emissiveIntensity: 0.5,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateAurora = () => {
      if (this.groundMesh !== ground) return;
      animTime += 3;
      drawAurora(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateAurora);
    };
    animateAurora();
  }

  createNebulaGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawNebula = (time) => {
      // Deep space background
      ctx.fillStyle = '#0a0015';
      ctx.fillRect(0, 0, 512, 512);

      // Cosmic dust clouds
      for (let i = 0; i < 25; i++) {
        const x = (Math.sin(i * 2.345 + time * 0.0001) * 150) + 256;
        const y = (Math.cos(i * 3.456 + time * 0.00015) * 150) + 256;
        const size = 80 + Math.sin(time * 0.002 + i) * 40;
        const hue = (i * 30 + time * 0.03) % 360;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.4)`);
        grad.addColorStop(0.5, `hsla(${hue + 30}, 80%, 50%, 0.2)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brighter cosmic filaments
      for (let i = 0; i < 15; i++) {
        const x = (Math.cos(i * 1.234 + time * 0.0003) * 180) + 256;
        const y = (Math.sin(i * 4.567 - time * 0.0002) * 180) + 256;
        const size = 50 + Math.cos(time * 0.003 + i) * 25;
        const hue = (i * 45 + time * 0.05) % 360;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.6)`);
        grad.addColorStop(0.6, `hsla(${hue + 60}, 90%, 60%, 0.3)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (let i = 0; i < 200; i++) {
        const x = (Math.sin(i * 12.345) * 256) + 256;
        const y = (Math.cos(i * 67.890) * 256) + 256;
        const size = Math.random() > 0.95 ? 2 : 1;
        const brightness = Math.sin(time * 0.005 + i) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(x - size/2, y - size/2, size, size);
      }

      // Bright stars with glow
      for (let i = 0; i < 10; i++) {
        const x = (Math.sin(i * 45.678) * 220) + 256;
        const y = (Math.cos(i * 89.012) * 220) + 256;
        const pulse = Math.sin(time * 0.004 + i) * 0.3 + 0.7;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grad.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
        grad.addColorStop(0.5, `rgba(200, 220, 255, ${pulse * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawNebula(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0x220055,
      emissiveIntensity: 0.6,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateNebula = () => {
      if (this.groundMesh !== ground) return;
      animTime += 4;
      drawNebula(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateNebula);
    };
    animateNebula();
  }

  createOceanGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawOcean = (time) => {
      // Deep ocean base
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#0a4d7a');
      gradient.addColorStop(0.5, '#0e6da3');
      gradient.addColorStop(1, '#0a5580');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Wave layers
      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath();
        const amplitude = 15 + layer * 8;
        const frequency = 0.015 + layer * 0.005;
        const speed = 0.003 + layer * 0.001;
        const yOffset = layer * 20;

        for (let x = 0; x <= 512; x += 3) {
          const wave1 = Math.sin(x * frequency + time * speed) * amplitude;
          const wave2 = Math.cos(x * frequency * 1.5 - time * speed * 0.7) * (amplitude * 0.5);
          const y = 128 + yOffset + wave1 + wave2;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(512, 512);
        ctx.lineTo(0, 512);
        ctx.closePath();

        const alpha = 0.15 - layer * 0.03;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      // Foam patterns
      for (let i = 0; i < 30; i++) {
        const x = (i * 30 + time * 0.5) % 512;
        const y = 100 + Math.sin(time * 0.002 + i) * 40 + Math.sin(x * 0.02) * 20;
        const size = 8 + Math.sin(time * 0.003 + i) * 5;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 0.004 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sunlight reflections
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(i * 2.3 + time * 0.001) * 200) + 256;
        const y = (Math.cos(i * 3.1 + time * 0.0015) * 100) + 150;
        const size = 15 + Math.sin(time * 0.003 + i) * 8;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.5, 'rgba(200, 240, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawOcean(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0x1a6ba8,
      roughness: 0.05,
      metalness: 0.7,
      emissive: 0x0a3d5a,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateOcean = () => {
      if (this.groundMesh !== ground) return;
      animTime += 5;
      drawOcean(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateOcean);
    };
    animateOcean();
  }

  createForestGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark earth base
    ctx.fillStyle = '#2d2416';
    ctx.fillRect(0, 0, 1024, 1024);

    // Moss patches
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 60 + 40;
      const mossShade = Math.floor(Math.random() * 30);

      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, `rgba(${mossShade + 60}, ${mossShade + 100}, ${mossShade + 50}, 0.7)`);
      grad.addColorStop(0.7, `rgba(${mossShade + 40}, ${mossShade + 80}, ${mossShade + 30}, 0.4)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dirt and earth texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 15 + 3;
      const earthShade = Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgba(${earthShade + 70}, ${earthShade + 50}, ${earthShade + 30}, 0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fallen leaves
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 12 + 6;
      const angle = Math.random() * Math.PI * 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Leaf colors - browns, reds, oranges
      const leafType = Math.random();
      let leafColor;
      if (leafType < 0.4) {
        leafColor = `rgba(${140 + Math.random() * 40}, ${80 + Math.random() * 40}, 30, 0.6)`;
      } else if (leafType < 0.7) {
        leafColor = `rgba(${160 + Math.random() * 40}, ${60 + Math.random() * 30}, 20, 0.5)`;
      } else {
        leafColor = `rgba(${100 + Math.random() * 40}, ${120 + Math.random() * 40}, 30, 0.5)`;
      }

      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Small twigs and debris
    ctx.strokeStyle = 'rgba(80, 60, 40, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = Math.random() * 20 + 10;
      const angle = Math.random() * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Mushrooms
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 8 + 4;

      // Cap
      ctx.fillStyle = `rgba(${160 + Math.random() * 40}, ${80 + Math.random() * 40}, 60, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Spots
      if (Math.random() > 0.5) {
        ctx.fillStyle = 'rgba(220, 200, 180, 0.5)';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.05,
      color: 0x3a2f1e
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  createSnowGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const drawSnow = (time) => {
      // Soft white/blue snow base
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, '#f0f8ff');
      gradient.addColorStop(0.5, '#ffffff');
      gradient.addColorStop(1, '#e8f4ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // Snow texture variations
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 25 + 5;
        const blueShade = Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgba(${230 + blueShade}, ${240 + blueShade}, 255, ${Math.random() * 0.3 + 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snow drifts and shadows
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 80 + 40;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, 'rgba(220, 230, 245, 0.3)');
        grad.addColorStop(1, 'rgba(200, 215, 235, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparkling ice crystals - animated
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 123.456) * 512) + 512;
        const y = (Math.cos(i * 789.012) * 512) + 512;
        const sparkle = Math.sin(time * 0.005 + i * 0.5) * 0.5 + 0.5;
        const size = 2 + Math.sin(time * 0.003 + i) * 1;

        // Diamond sparkle effect
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.001 + i);

        const sparkleGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
        sparkleGrad.addColorStop(0, `rgba(255, 255, 255, ${sparkle})`);
        sparkleGrad.addColorStop(0.3, `rgba(200, 230, 255, ${sparkle * 0.6})`);
        sparkleGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sparkleGrad;

        // Star shape
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const angle = (j * Math.PI / 2);
          ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
          ctx.lineTo(Math.cos(angle + Math.PI / 4) * size * 2, Math.sin(angle + Math.PI / 4) * size * 2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Soft snow highlights
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 30 + 15;
        const glow = Math.sin(time * 0.002 + i) * 0.15 + 0.2;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, `rgba(255, 255, 255, ${glow})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawSnow(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0xeef8ff,
      emissiveIntensity: 0.15,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      transparent: true,
      opacity: 0.98
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateSnow = () => {
      if (this.groundMesh !== ground) return;
      animTime += 3;
      drawSnow(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateSnow);
    };
    animateSnow();
  }

  createCrystalCaveGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawCrystal = (time) => {
      // Deep cave background with purple/blue tones
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 400);
      gradient.addColorStop(0, '#1a0f2e');
      gradient.addColorStop(0.5, '#0f0a1e');
      gradient.addColorStop(1, '#050208');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Crystal formations
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 2.345) * 200) + 256;
        const y = (Math.cos(i * 3.456) * 200) + 256;
        const size = 40 + Math.sin(i * 1.234) * 25;
        const rotation = time * 0.0005 + i * 0.5;

        // Prismatic color shift
        const hue = (time * 0.1 + i * 12) % 360;
        const pulse = Math.sin(time * 0.003 + i * 0.7) * 0.3 + 0.7;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Crystal glow
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
        glowGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${pulse * 0.6})`);
        glowGrad.addColorStop(0.5, `hsla(${hue + 30}, 90%, 60%, ${pulse * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Crystal shape (hexagonal)
        ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.8)`;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI / 3);
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner prismatic reflection
        ctx.fillStyle = `hsla(${hue + 180}, 100%, 80%, 0.4)`;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI / 3);
          const px = Math.cos(angle) * size * 0.5;
          const py = Math.sin(angle) * size * 0.5;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Smaller floating crystal particles
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 12.345 + time * 0.0002) * 230) + 256;
        const y = (Math.cos(i * 67.890 + time * 0.00025) * 230) + 256;
        const size = 3 + Math.sin(time * 0.004 + i) * 2;
        const hue = (time * 0.15 + i * 20) % 360;
        const twinkle = Math.sin(time * 0.006 + i) * 0.4 + 0.6;

        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reflective light beams
      for (let i = 0; i < 8; i++) {
        const angle = time * 0.0003 + i * Math.PI / 4;
        const length = 150 + Math.sin(time * 0.002 + i) * 50;
        const hue = (time * 0.08 + i * 45) % 360;

        ctx.save();
        ctx.translate(256, 256);
        ctx.rotate(angle);

        const beamGrad = ctx.createLinearGradient(0, 0, length, 0);
        beamGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.2)`);
        beamGrad.addColorStop(0.5, `hsla(${hue}, 90%, 60%, 0.1)`);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, -2, length, 4);

        ctx.restore();
      }
    };

    drawCrystal(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0x8844ff,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x6633cc,
      emissiveIntensity: 0.6,
      emissiveMap: texture,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateCrystal = () => {
      if (this.groundMesh !== ground) return;
      animTime += 4;
      drawCrystal(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateCrystal);
    };
    animateCrystal();
  }

  createChromeGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawChrome = (time) => {
      // Base chrome gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
      baseGrad.addColorStop(0, '#e8e8e8');
      baseGrad.addColorStop(0.25, '#c0c0c0');
      baseGrad.addColorStop(0.5, '#f5f5f5');
      baseGrad.addColorStop(0.75, '#b8b8b8');
      baseGrad.addColorStop(1, '#d8d8d8');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Moving reflection bands
      for (let i = 0; i < 6; i++) {
        const offset = (time * 0.1 + i * 85) % 512;
        const angle = Math.sin(time * 0.0005 + i) * 0.3;

        ctx.save();
        ctx.translate(0, offset - 256);
        ctx.rotate(angle);

        const bandGrad = ctx.createLinearGradient(0, -50, 0, 50);
        bandGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        bandGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
        bandGrad.addColorStop(0.5, 'rgba(200, 200, 200, 0.3)');
        bandGrad.addColorStop(0.9, 'rgba(80, 80, 80, 0.6)');
        bandGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, -50, 512, 100);

        ctx.restore();
      }

      // Circular reflection patterns
      for (let i = 0; i < 15; i++) {
        const x = (Math.sin(i * 2.567 + time * 0.0004) * 180) + 256;
        const y = (Math.cos(i * 3.891 + time * 0.0005) * 180) + 256;
        const size = 30 + Math.sin(time * 0.002 + i) * 15;

        const circGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
        circGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        circGrad.addColorStop(0.3, 'rgba(220, 220, 220, 0.3)');
        circGrad.addColorStop(0.6, 'rgba(150, 150, 150, 0.2)');
        circGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = circGrad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sharp highlights
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(i * 45.678 + time * 0.0003) * 220) + 256;
        const y = (Math.cos(i * 78.901 + time * 0.0004) * 220) + 256;
        const intensity = Math.sin(time * 0.005 + i) * 0.5 + 0.5;

        const highlightGrad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        highlightGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        highlightGrad.addColorStop(0.5, `rgba(240, 240, 255, ${intensity * 0.5})`);
        highlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Environmental reflections (colored)
      const envHue = (time * 0.05) % 360;
      for (let i = 0; i < 5; i++) {
        const x = 100 + i * 80;
        const y = 256 + Math.sin(time * 0.002 + i) * 100;
        const size = 50;

        const envGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
        envGrad.addColorStop(0, `hsla(${(envHue + i * 30) % 360}, 60%, 70%, 0.15)`);
        envGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = envGrad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawChrome(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xcccccc,
      roughness: 0.01,
      metalness: 1.0,
      envMapIntensity: 2.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateChrome = () => {
      if (this.groundMesh !== ground) return;
      animTime += 3;
      drawChrome(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateChrome);
    };
    animateChrome();
  }

  createCircuitBoardGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawCircuit = (time) => {
      // PCB green background
      ctx.fillStyle = '#0a4a2e';
      ctx.fillRect(0, 0, 512, 512);

      // Circuit traces (copper/gold)
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Horizontal traces
      for (let i = 0; i < 15; i++) {
        const y = i * 35 + 20;
        const segments = 8;

        ctx.beginPath();
        ctx.moveTo(0, y);

        for (let s = 0; s < segments; s++) {
          const x1 = (s * 512) / segments;
          const x2 = ((s + 1) * 512) / segments;
          const midX = (x1 + x2) / 2;

          if (s % 2 === 0) {
            ctx.lineTo(midX, y);
            ctx.lineTo(midX, y + 10);
            ctx.lineTo(x2, y + 10);
          } else {
            ctx.lineTo(x2, y + 10);
          }
        }
        ctx.stroke();
      }

      // Vertical traces
      for (let i = 0; i < 12; i++) {
        const x = i * 45 + 25;

        ctx.beginPath();
        ctx.moveTo(x, 0);

        for (let y = 0; y < 512; y += 40) {
          const nextY = Math.min(y + 40, 512);
          if ((y / 40) % 2 === 0) {
            ctx.lineTo(x, nextY);
          } else {
            ctx.lineTo(x + 10, y);
            ctx.lineTo(x + 10, nextY);
            ctx.lineTo(x, nextY);
          }
        }
        ctx.stroke();
      }

      // IC chips and components
      for (let i = 0; i < 8; i++) {
        const x = 80 + (i % 3) * 150;
        const y = 80 + Math.floor(i / 3) * 150;
        const width = 40 + Math.random() * 20;
        const height = 30 + Math.random() * 15;

        // Chip body
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - width/2, y - height/2, width, height);

        // Chip pins
        ctx.fillStyle = '#c0c0c0';
        const pins = 6;
        for (let p = 0; p < pins; p++) {
          // Left pins
          ctx.fillRect(x - width/2 - 4, y - height/2 + (p * height / (pins - 1)) - 1, 4, 2);
          // Right pins
          ctx.fillRect(x + width/2, y - height/2 + (p * height / (pins - 1)) - 1, 4, 2);
        }

        // Chip label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('IC' + i, x, y + 3);
      }

      // SMD components (resistors, capacitors)
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const width = 6 + Math.random() * 6;
        const height = 3 + Math.random() * 3;
        const angle = Math.random() * Math.PI;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Component body
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-width/2, -height/2, width, height);

        // End caps (silver)
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(-width/2, -height/2, 2, height);
        ctx.fillRect(width/2 - 2, -height/2, 2, height);

        ctx.restore();
      }

      // Solder pads with pulsing lights
      for (let i = 0; i < 40; i++) {
        const x = (Math.sin(i * 3.456) * 230) + 256;
        const y = (Math.cos(i * 7.891) * 230) + 256;
        const pulse = Math.sin(time * 0.003 + i * 0.5) * 0.5 + 0.5;

        // Pad
        ctx.fillStyle = '#c9a84b';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        if (pulse > 0.7) {
          const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 10);
          glowGrad.addColorStop(0, `rgba(255, 200, 0, ${pulse})`);
          glowGrad.addColorStop(0.5, `rgba(255, 150, 0, ${pulse * 0.5})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Via holes
      ctx.fillStyle = '#d4af37';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner hole
        ctx.fillStyle = '#0a4a2e';
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4af37';
      }

      // Data flow animation along traces
      const flowPositions = 10;
      for (let i = 0; i < flowPositions; i++) {
        const progress = ((time * 0.05 + i * 50) % 512) / 512;
        const x = progress * 512;
        const y = (i % 15) * 35 + 20;

        const flowGrad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        flowGrad.addColorStop(0, 'rgba(0, 255, 200, 0.8)');
        flowGrad.addColorStop(0.5, 'rgba(0, 200, 150, 0.4)');
        flowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flowGrad;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawCircuit(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x0a4a2e,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0x00ff88,
      emissiveIntensity: 0.2,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateCircuit = () => {
      if (this.groundMesh !== ground) return;
      animTime += 5;
      drawCircuit(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateCircuit);
    };
    animateCircuit();
  }

  createHologramGridGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawHologram = (time) => {
      // Deep space background
      ctx.fillStyle = '#000510';
      ctx.fillRect(0, 0, 512, 512);

      // Perspective grid parameters
      const gridSize = 32;
      const vanishingY = -200;
      const baseY = 512;
      const hue = (time * 0.05) % 360;

      // Draw perspective grid lines
      ctx.lineWidth = 1.5;

      // Horizontal lines (receding into distance)
      for (let i = 0; i <= 16; i++) {
        const y = baseY - (i * gridSize);
        const depth = i / 16;
        const alpha = 0.3 + Math.sin(time * 0.002 + i * 0.3) * 0.3;
        const glowIntensity = Math.sin(time * 0.004 + i * 0.2) * 0.5 + 0.5;

        // Calculate perspective scaling
        const scaleY = depth * 0.7;
        const yPos = baseY - (baseY - vanishingY) * scaleY;

        // Line glow
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(512, yPos);
        ctx.stroke();

        // Main line
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(512, yPos);
        ctx.stroke();

        // Pulsing highlights
        if (glowIntensity > 0.7) {
          ctx.strokeStyle = `hsla(${hue}, 100%, 90%, ${glowIntensity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, yPos);
          ctx.lineTo(512, yPos);
          ctx.stroke();
        }
      }

      // Vertical lines
      for (let i = 0; i <= 16; i++) {
        const x = i * gridSize;
        const alpha = 0.3 + Math.sin(time * 0.003 + i * 0.4) * 0.2;
        const glowIntensity = Math.sin(time * 0.005 + i * 0.3) * 0.5 + 0.5;

        // Line glow
        ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 100%, 60%, ${alpha * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 512);

        // Perspective convergence
        const perspectiveX = 256 + (x - 256) * 0.3;
        ctx.lineTo(perspectiveX, 0);
        ctx.stroke();

        // Main line
        ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 100%, 70%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 512);
        ctx.lineTo(perspectiveX, 0);
        ctx.stroke();

        // Pulsing highlights
        if (glowIntensity > 0.7) {
          ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 100%, 90%, ${glowIntensity * 0.8})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 512);
          ctx.lineTo(perspectiveX, 0);
          ctx.stroke();
        }
      }

      // Grid intersection nodes
      for (let x = 0; x <= 16; x++) {
        for (let y = 0; y <= 16; y++) {
          const xPos = x * gridSize;
          const depth = y / 16;
          const scaleY = depth * 0.7;
          const yPos = baseY - (baseY - vanishingY) * scaleY;

          const pulse = Math.sin(time * 0.004 + x * 0.3 + y * 0.4);

          if (pulse > 0.5) {
            const size = 3 + pulse * 2;
            const intensity = (pulse - 0.5) * 2;

            const nodeGrad = ctx.createRadialGradient(xPos, yPos, 0, xPos, yPos, size * 2);
            nodeGrad.addColorStop(0, `hsla(${(hue + 60) % 360}, 100%, 80%, ${intensity})`);
            nodeGrad.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 100%, 60%, ${intensity * 0.5})`);
            nodeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = nodeGrad;
            ctx.beginPath();
            ctx.arc(xPos, yPos, size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Holographic data packets traveling along grid
      for (let i = 0; i < 15; i++) {
        const progress = ((time * 0.03 + i * 34.567) % 512) / 512;
        const xLine = (i % 16) * gridSize;
        const yPos = 512 - progress * 512;

        const packetHue = (hue + i * 24) % 360;
        const packetGrad = ctx.createRadialGradient(xLine, yPos, 0, xLine, yPos, 12);
        packetGrad.addColorStop(0, `hsla(${packetHue}, 100%, 80%, 0.9)`);
        packetGrad.addColorStop(0.4, `hsla(${packetHue}, 100%, 60%, 0.6)`);
        packetGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = packetGrad;
        ctx.beginPath();
        ctx.arc(xLine, yPos, 12, 0, Math.PI * 2);
        ctx.fill();

        // Trailing effect
        ctx.fillStyle = `hsla(${packetHue}, 100%, 70%, 0.3)`;
        ctx.fillRect(xLine - 1, yPos, 2, 20);
      }

      // Scanline effect
      const scanY = (time * 0.5) % 512;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
      scanGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
      scanGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, 512, 60);

      // Holographic glitch effect (occasional)
      if (Math.sin(time * 0.001) > 0.95) {
        const glitchY = Math.random() * 512;
        const glitchHeight = 20 + Math.random() * 40;
        ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 70%, 0.3)`;
        ctx.fillRect(0, glitchY, 512, glitchHeight);
      }
    };

    drawHologram(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x0088ff,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x0066cc,
      emissiveIntensity: 0.8,
      emissiveMap: texture,
      transparent: true,
      opacity: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateHologram = () => {
      if (this.groundMesh !== ground) return;
      animTime += 6;
      drawHologram(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateHologram);
    };
    animateHologram();
  }

  createDataStreamGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Character sets for data stream
    const binaryChars = '01';
    const hexChars = '0123456789ABCDEF';
    const dataColumns = 32;
    const columnData = Array(dataColumns).fill(null).map(() => ({
      speed: 0.5 + Math.random() * 2,
      offset: Math.random() * 512,
      chars: [],
      useHex: Math.random() > 0.5
    }));

    const drawDataStream = (time) => {
      // Dark digital background
      ctx.fillStyle = 'rgba(0, 5, 10, 0.15)';
      ctx.fillRect(0, 0, 512, 512);

      ctx.font = '12px monospace';
      ctx.textAlign = 'center';

      // Draw data streams
      for (let col = 0; col < dataColumns; col++) {
        const column = columnData[col];
        const x = (col * 512 / dataColumns) + 8;
        const chars = column.useHex ? hexChars : binaryChars;

        // Color based on column type
        const hue = column.useHex ? 120 : 200;
        const baseAlpha = 0.7;

        // Update column offset
        column.offset = (column.offset + column.speed) % 512;

        // Draw characters in column
        for (let i = -2; i < 20; i++) {
          const y = (column.offset + i * 20) % 600 - 50;

          if (y < 0 || y > 512) continue;

          // Random character
          const char = chars[Math.floor(Math.random() * chars.length)];

          // Fade effect based on position
          const fadeTop = Math.min(1, y / 100);
          const fadeBottom = Math.min(1, (512 - y) / 100);
          const fade = Math.min(fadeTop, fadeBottom);
          const alpha = baseAlpha * fade;

          // Leading bright character
          if (i === 0) {
            // Glow effect for leading char
            const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 20);
            glowGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
            glowGrad.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${alpha * 0.5})`);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${alpha})`;
            ctx.fillText(char, x, y);
          } else {
            // Trailing characters
            const trailAlpha = alpha * (1 - (i / 20));
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${trailAlpha})`;
            ctx.fillText(char, x, y);
          }
        }
      }

      // Data packets (horizontal streams)
      for (let i = 0; i < 8; i++) {
        const y = (i * 64) + 32;
        const progress = ((time * 0.1 + i * 64) % 612) - 50;

        // Packet composition
        const packetLength = 5;
        const packetHue = (i * 45 + time * 0.05) % 360;

        for (let p = 0; p < packetLength; p++) {
          const x = progress - (p * 15);

          if (x < 0 || x > 512) continue;

          const charSet = Math.random() > 0.5 ? hexChars : binaryChars;
          const char = charSet[Math.floor(Math.random() * charSet.length)];

          // Brightness decreases for trailing chars
          const brightness = 1 - (p / packetLength) * 0.5;

          if (p === 0) {
            // Leading packet glow
            const packetGrad = ctx.createRadialGradient(x, y, 0, x, y, 15);
            packetGrad.addColorStop(0, `hsla(${packetHue}, 100%, 80%, 0.8)`);
            packetGrad.addColorStop(0.5, `hsla(${packetHue}, 90%, 60%, 0.4)`);
            packetGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = packetGrad;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `hsla(${packetHue}, 100%, ${50 + brightness * 40}%, ${brightness})`;
          ctx.fillText(char, x, y);
        }
      }

      // Binary rain (Matrix-style background)
      ctx.font = '10px monospace';
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 12.345) * 250) + 256;
        const y = ((time * 0.3 + i * 50) % 612) - 50;

        if (y < 0 || y > 512) continue;

        const char = Math.random() > 0.5 ? '0' : '1';
        const alpha = 0.1 + Math.random() * 0.2;

        ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
        ctx.fillText(char, x, y);
      }

      // System status indicators
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      const statusTexts = [
        'SYS.OK',
        'NET.ACTIVE',
        'DATA.FLOW',
        'PROC.100%',
        'MEM.ALLOC',
        'I/O.READY'
      ];

      for (let i = 0; i < statusTexts.length; i++) {
        const x = 10;
        const y = 20 + i * 15;
        const pulse = Math.sin(time * 0.005 + i) * 0.3 + 0.7;

        ctx.fillStyle = `rgba(0, 255, 150, ${pulse * 0.5})`;
        ctx.fillText(statusTexts[i], x, y);
      }

      // Scan lines
      for (let i = 0; i < 512; i += 4) {
        ctx.fillStyle = 'rgba(0, 50, 100, 0.05)';
        ctx.fillRect(0, i, 512, 2);
      }

      // Occasional data burst flash
      if (Math.sin(time * 0.002) > 0.97) {
        const burstX = Math.random() * 512;
        const burstY = Math.random() * 512;
        const burstSize = 50 + Math.random() * 100;

        const burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstSize);
        burstGrad.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
        burstGrad.addColorStop(0.5, 'rgba(0, 150, 255, 0.3)');
        burstGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = burstGrad;
        ctx.beginPath();
        ctx.arc(burstX, burstY, burstSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawDataStream(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x001122,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x003366,
      emissiveIntensity: 0.5,
      emissiveMap: texture
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    let animTime = 0;
    const animateDataStream = () => {
      if (this.groundMesh !== ground) return;
      animTime += 4;
      drawDataStream(animTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animateDataStream);
    };
    animateDataStream();
  }

  createPortalGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Portal swirl parameters
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let swirlTime = 0;

    const drawPortal = (time) => {
      // Dark background with subtle gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 256);
      bgGradient.addColorStop(0, '#1a0033');
      bgGradient.addColorStop(0.5, '#0d001a');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw swirling portal rings
      const numRings = 8;
      for (let ring = 0; ring < numRings; ring++) {
        const ringRadius = 30 + ring * 30;
        const numSegments = 12 + ring * 4;

        for (let i = 0; i < numSegments; i++) {
          const segmentAngle = (i / numSegments) * Math.PI * 2;
          const swirlOffset = time * 0.002 + ring * 0.3;
          const angle = segmentAngle + swirlOffset;

          // Calculate segment position with swirl distortion
          const distortion = Math.sin(time * 0.003 + ring * 0.5) * 15;
          const x = centerX + Math.cos(angle) * (ringRadius + distortion);
          const y = centerY + Math.sin(angle) * (ringRadius + distortion);

          // Color varies by ring and time
          const hue = (ring * 40 + time * 0.1) % 360;
          const brightness = 50 + Math.sin(time * 0.005 + i * 0.5) * 30;

          ctx.beginPath();
          ctx.arc(x, y, 3 + ring * 0.5, 0, Math.PI * 2);

          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6 + ring);
          gradient.addColorStop(0, `hsla(${hue}, 100%, ${brightness}%, 1)`);
          gradient.addColorStop(0.3, `hsla(${hue}, 100%, ${brightness}%, 0.6)`);
          gradient.addColorStop(1, `hsla(${hue}, 100%, ${brightness}%, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      // Central vortex glow
      const vortexGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
      vortexGradient.addColorStop(0, `hsla(${270 + Math.sin(time * 0.002) * 30}, 100%, 70%, 0.8)`);
      vortexGradient.addColorStop(0.3, `hsla(${280 + Math.sin(time * 0.002) * 30}, 100%, 50%, 0.4)`);
      vortexGradient.addColorStop(0.6, `hsla(${290 + Math.sin(time * 0.002) * 30}, 100%, 40%, 0.2)`);
      vortexGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = vortexGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add swirling particles
      const numParticles = 20;
      for (let i = 0; i < numParticles; i++) {
        const particleAngle = (i / numParticles) * Math.PI * 2 + time * 0.004;
        const particleRadius = 100 + Math.sin(time * 0.003 + i) * 50;
        const px = centerX + Math.cos(particleAngle) * particleRadius;
        const py = centerY + Math.sin(particleAngle) * particleRadius;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${180 + i * 10}, 100%, 80%, ${0.5 + Math.sin(time * 0.01 + i) * 0.3})`;
        ctx.fill();
      }
    };

    // Initial draw
    drawPortal(0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x4400aa,
      emissiveIntensity: 0.3,
      emissiveMap: texture
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    // Animate portal swirl
    const animatePortal = () => {
      if (this.groundMesh !== ground) return;
      swirlTime += 16; // Approximate 60fps timing
      drawPortal(swirlTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animatePortal);
    };
    animatePortal();
  }

  createPlasmaGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    let plasmaTime = 0;

    const drawPlasma = (time) => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Plasma field generation using multiple sine waves
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          // Multiple overlapping plasma patterns
          const cx = x - canvas.width / 2;
          const cy = y - canvas.height / 2;

          // Pattern 1: Circular waves
          const dist1 = Math.sqrt(cx * cx + cy * cy);
          const wave1 = Math.sin(dist1 * 0.05 - time * 0.003) * 128;

          // Pattern 2: Vertical waves
          const wave2 = Math.sin(x * 0.02 + time * 0.002) * 64;

          // Pattern 3: Horizontal waves
          const wave3 = Math.sin(y * 0.02 - time * 0.002) * 64;

          // Pattern 4: Diagonal waves
          const wave4 = Math.sin((x + y) * 0.01 + time * 0.001) * 32;

          // Pattern 5: Another circular pattern with different frequency
          const dist2 = Math.sqrt((cx + 100) * (cx + 100) + (cy - 100) * (cy - 100));
          const wave5 = Math.sin(dist2 * 0.03 + time * 0.004) * 96;

          // Combine all waves
          const combined = wave1 + wave2 + wave3 + wave4 + wave5;

          // Map to color using plasma palette
          const colorValue = (combined + 256) % 512;
          const normalizedValue = colorValue / 512;

          const index = (y * canvas.width + x) * 4;

          // Create plasma color palette (hot colors)
          if (normalizedValue < 0.25) {
            // Dark purple to blue
            data[index] = normalizedValue * 4 * 100;     // R
            data[index + 1] = normalizedValue * 4 * 50;  // G
            data[index + 2] = 100 + normalizedValue * 4 * 155; // B
          } else if (normalizedValue < 0.5) {
            // Blue to cyan
            const t = (normalizedValue - 0.25) * 4;
            data[index] = 100 + t * 100;     // R
            data[index + 1] = 50 + t * 150;  // G
            data[index + 2] = 255;           // B
          } else if (normalizedValue < 0.75) {
            // Cyan to yellow
            const t = (normalizedValue - 0.5) * 4;
            data[index] = 200 + t * 55;      // R
            data[index + 1] = 200 + t * 55;  // G
            data[index + 2] = 255 - t * 155; // B
          } else {
            // Yellow to bright white
            const t = (normalizedValue - 0.75) * 4;
            data[index] = 255;                // R
            data[index + 1] = 255 - t * 55;   // G
            data[index + 2] = 100 + t * 155;  // B
          }
          data[index + 3] = 255; // Alpha

          // Add energy pulses
          if (Math.random() < 0.001) {
            const pulseRadius = 3;
            for (let py = -pulseRadius; py <= pulseRadius; py++) {
              for (let px = -pulseRadius; px <= pulseRadius; px++) {
                const pulseIndex = ((y + py) * canvas.width + (x + px)) * 4;
                if (pulseIndex >= 0 && pulseIndex < data.length - 3) {
                  data[pulseIndex] = Math.min(255, data[pulseIndex] + 100);
                  data[pulseIndex + 1] = Math.min(255, data[pulseIndex + 1] + 100);
                  data[pulseIndex + 2] = Math.min(255, data[pulseIndex + 2] + 100);
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Add glow overlay
      ctx.globalCompositeOperation = 'screen';
      const glowGradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
      glowGradient.addColorStop(0, `hsla(${180 + Math.sin(time * 0.001) * 60}, 100%, 60%, 0.3)`);
      glowGradient.addColorStop(0.5, `hsla(${240 + Math.sin(time * 0.001) * 60}, 100%, 50%, 0.2)`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    };

    // Initial draw
    drawPlasma(0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x4488ff,
      emissiveIntensity: 0.4,
      emissiveMap: texture
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    // Animate plasma field
    const animatePlasma = () => {
      if (this.groundMesh !== ground) return;
      plasmaTime += 16; // Approximate 60fps timing
      drawPlasma(plasmaTime);
      texture.needsUpdate = true;
      requestAnimationFrame(animatePlasma);
    };
    animatePlasma();
  }

  createRealisticGrassGround() {
    // Create realistic lawn texture for base ground
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base lawn green - lush green
    ctx.fillStyle = '#2d6a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add fine grass texture details
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = Math.random() * 4 + 1;
      const angle = Math.random() * Math.PI * 2;

      ctx.strokeStyle = `rgba(${40 + Math.random() * 40}, ${90 + Math.random() * 60}, ${40 + Math.random() * 40}, ${Math.random() * 0.4 + 0.1})`;
      ctx.lineWidth = Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Add lawn-like color patches
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 30 + 5;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const greenShift = Math.random() * 30;
      gradient.addColorStop(0, `rgba(${45 + greenShift}, ${110 + greenShift}, ${45 + greenShift}, 0.2)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);

    const baseGroundGeo = new THREE.PlaneGeometry(200, 200);
    const baseGroundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.9,
      metalness: 0
    });
    const baseGround = new THREE.Mesh(baseGroundGeo, baseGroundMat);
    baseGround.rotation.x = -Math.PI / 2;
    baseGround.receiveShadow = true;
    this.scene.add(baseGround);
    this.groundMesh = baseGround;

    // Grass blade geometry - very thick blades for lush grass
    const bladeGeometry = new THREE.BufferGeometry();
    const bladeVertices = new Float32Array([
      // Very thick base for ultra-dense grass
      -0.035, 0, 0,       // Bottom left
       0.035, 0, 0,       // Bottom right
       0.008, 2.0, 0,      // Top center (very tall blade)
    ]);

    const bladeUVs = new Float32Array([
      0, 0,
      1, 0,
      0.5, 1
    ]);

    bladeGeometry.setAttribute('position', new THREE.BufferAttribute(bladeVertices, 3));
    bladeGeometry.setAttribute('uv', new THREE.BufferAttribute(bladeUVs, 2));
    bladeGeometry.computeVertexNormals();

    // Custom shader material for grass
    const grassVertexShader = `
      uniform float time;
      uniform vec3 windDirection;

      attribute vec3 offset;
      attribute vec4 orientation;
      attribute float scale;
      attribute float phase;

      varying vec2 vUv;
      varying float vHeight;
      varying float vWindStrength;

      vec3 applyQuaternion(vec3 v, vec4 q) {
        return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
      }

      void main() {
        vUv = uv;
        vHeight = position.y;

        // Apply instance transform
        vec3 transformed = position * scale;
        transformed = applyQuaternion(transformed, orientation);

        // Wind animation - affects top of grass more than bottom
        float windStrength = sin(time * 2.0 + phase + offset.x * 0.1 + offset.z * 0.1) * 0.4
                           + sin(time * 3.5 + phase * 2.0 + offset.x * 0.2) * 0.2;
        windStrength *= position.y / 2.0; // Normalized to very tall blade height
        vWindStrength = windStrength;

        // Apply wind displacement - more movement for taller grass
        transformed.x += windDirection.x * windStrength * 0.5;
        transformed.z += windDirection.z * windStrength * 0.5;

        // Slight vertical bob
        transformed.y += sin(time * 1.5 + phase) * 0.02 * position.y;

        // Add instance offset
        transformed += offset;

        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const grassFragmentShader = `
      uniform vec3 baseColor;
      uniform vec3 tipColor;
      uniform float time;

      varying vec2 vUv;
      varying float vHeight;
      varying float vWindStrength;

      void main() {
        // Gradient from base to tip (normalized for 2.0 unit tall blades)
        float heightFactor = vHeight / 2.0;

        // Mix between base dark green and lighter tip
        vec3 color = mix(baseColor, tipColor, heightFactor);

        // Add subtle color variation based on wind
        color += vec3(0.0, abs(vWindStrength) * 0.15, 0.0);

        // Very slight darkening at the very bottom for depth
        if (heightFactor < 0.05) {
          color *= 0.9;
        }

        // Keep grass mostly opaque
        float alpha = 0.95;

        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Create shader material
    const grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windDirection: { value: new THREE.Vector3(1, 0, 0.5).normalize() },
        baseColor: { value: new THREE.Color(0x2d5a2d) }, // Rich dark green at base
        tipColor: { value: new THREE.Color(0x5aca5a) }   // Bright green at tip
      },
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    });

    // Create irregular grass patches
    const numPatches = 50; // More patches for fuller coverage
    const patchData = [];

    // Generate irregular blob-shaped patches
    for (let i = 0; i < numPatches; i++) {
      const centerX = (Math.random() - 0.5) * 80;
      const centerZ = (Math.random() - 0.5) * 80;

      // Create irregular shape using multiple control points
      const numPoints = 5 + Math.floor(Math.random() * 4); // 5-8 control points
      const controlPoints = [];

      for (let p = 0; p < numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const radiusVar = Math.random() * 8 + 6; // 6-14 radius variation
        controlPoints.push({
          x: centerX + Math.cos(angle) * radiusVar,
          z: centerZ + Math.sin(angle) * radiusVar
        });
      }

      patchData.push({
        x: centerX,
        z: centerZ,
        controlPoints: controlPoints,
        density: Math.random() * 0.5 + 1.5, // 150-200% density (ultra thick)
        heightScale: Math.random() * 0.3 + 1.1, // 110-140% height (all tall)
        baseRadius: Math.random() * 6 + 8 // Base size for blob
      });
    }

    // Calculate total grass blades needed
    let totalBlades = 0;
    const bladesPerPatch = [];

    for (const patch of patchData) {
      // Estimate area using base radius for blade count
      const patchBladeCount = Math.floor(patch.baseRadius * patch.baseRadius * 400 * patch.density); // Extremely dense
      bladesPerPatch.push(patchBladeCount);
      totalBlades += patchBladeCount;
    }

    const instanceCount = totalBlades;

    const grassMesh = new THREE.InstancedMesh(bladeGeometry, grassMaterial, instanceCount);
    grassMesh.castShadow = false; // Disabled for performance
    grassMesh.receiveShadow = false;

    // Set up instance attributes
    const offsets = new Float32Array(instanceCount * 3);
    const orientations = new Float32Array(instanceCount * 4); // Quaternions
    const scales = new Float32Array(instanceCount);
    const phases = new Float32Array(instanceCount);

    let index = 0;
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const matrix = new THREE.Matrix4();

    // Helper function to check if point is inside irregular polygon
    const isPointInPolygon = (x, z, controlPoints) => {
      let inside = false;
      const n = controlPoints.length;

      let p1x = controlPoints[0].x;
      let p1z = controlPoints[0].z;

      for (let i = 0; i < n + 1; i++) {
        const p2x = controlPoints[i % n].x;
        const p2z = controlPoints[i % n].z;

        if (z > Math.min(p1z, p2z)) {
          if (z <= Math.max(p1z, p2z)) {
            if (x <= Math.max(p1x, p2x)) {
              let xinters;
              if (p1z !== p2z) {
                xinters = (z - p1z) * (p2x - p1x) / (p2z - p1z) + p1x;
              }
              if (p1x === p2x || x <= xinters) {
                inside = !inside;
              }
            }
          }
        }
        p1x = p2x;
        p1z = p2z;
      }
      return inside;
    };

    // Generate grass blades for each patch
    for (let patchIdx = 0; patchIdx < patchData.length; patchIdx++) {
      const patch = patchData[patchIdx];
      const bladeCount = bladesPerPatch[patchIdx];

      let bladesPlaced = 0;
      let attempts = 0;
      const maxAttempts = bladeCount * 3; // Allow more attempts to fill irregular shapes

      while (bladesPlaced < bladeCount && attempts < maxAttempts) {
        attempts++;

        // Generate random position within bounding box of patch
        const testX = patch.x + (Math.random() - 0.5) * patch.baseRadius * 2.5;
        const testZ = patch.z + (Math.random() - 0.5) * patch.baseRadius * 2.5;

        // Check if point is inside the irregular shape
        if (isPointInPolygon(testX, testZ, patch.controlPoints)) {
          const i3 = index * 3;
          const i4 = index * 4;

          // Add slight randomness to position
          offsets[i3] = testX + (Math.random() - 0.5) * 0.05;
          offsets[i3 + 1] = 0; // Y position (on ground)
          offsets[i3 + 2] = testZ + (Math.random() - 0.5) * 0.05;

          // Random rotation - all grass has some natural tilt
          euler.set(
            (Math.random() - 0.5) * 0.25,  // Natural tilt on X
            Math.random() * Math.PI * 2,   // Random rotation on Y
            (Math.random() - 0.5) * 0.25   // Natural tilt on Z
          );
          quaternion.setFromEuler(euler);

          orientations[i4] = quaternion.x;
          orientations[i4 + 1] = quaternion.y;
          orientations[i4 + 2] = quaternion.z;
          orientations[i4 + 3] = quaternion.w;

          // All grass is thick and tall
          scales[index] = (1.0 + Math.random() * 0.5) * patch.heightScale; // Scale for 2.0 unit base height

          // Random phase for wind animation
          phases[index] = Math.random() * Math.PI * 2;

          // Set instance matrix
          matrix.compose(
            new THREE.Vector3(offsets[i3], offsets[i3 + 1], offsets[i3 + 2]),
            quaternion,
            new THREE.Vector3(scales[index], scales[index], scales[index])
          );
          grassMesh.setMatrixAt(index, matrix);

          index++;
          bladesPlaced++;
        }
      }
    }

    // Add custom attributes
    bladeGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    bladeGeometry.setAttribute('orientation', new THREE.InstancedBufferAttribute(orientations, 4));
    bladeGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1));
    bladeGeometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));

    grassMesh.instanceMatrix.needsUpdate = true;
    // Don't rotate the grass mesh - blades should already be vertical
    grassMesh.position.y = 0.01; // Slightly above ground to prevent z-fighting

    this.scene.add(grassMesh);

    // Store reference for cleanup
    this.grassMesh = grassMesh;
    this.grassMaterial = grassMaterial;

    // Animate grass
    const animateGrass = () => {
      if (this.grassMesh !== grassMesh) return; // Stop if ground changed

      // Update time uniform for wind animation
      grassMaterial.uniforms.time.value += 0.016; // ~60fps

      // Slowly rotate wind direction
      const windAngle = grassMaterial.uniforms.time.value * 0.1;
      grassMaterial.uniforms.windDirection.value.x = Math.cos(windAngle);
      grassMaterial.uniforms.windDirection.value.z = Math.sin(windAngle);

      requestAnimationFrame(animateGrass);
    };
    animateGrass();

    // Skip decorations with such dense grass - looks cleaner
    // this.addGrassDecorations();
  }

  addGrassDecorations() {
    // Add a few random rocks
    const rockGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let i = 0; i < 15; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.scale.set(
        0.5 + Math.random() * 1.5,
        0.3 + Math.random() * 0.7,
        0.5 + Math.random() * 1.5
      );
      rock.position.set(
        (Math.random() - 0.5) * 80,
        rock.scale.y * 0.3,
        (Math.random() - 0.5) * 80
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      // Store for cleanup
      if (!this.decorations) this.decorations = [];
      this.decorations.push(rock);
    }

    // Add small flowers (simple colored spheres)
    const flowerColors = [0xffff00, 0xff00ff, 0xff8800, 0x00ffff, 0xffffff];

    for (let i = 0; i < 25; i++) {
      const flowerGeometry = new THREE.SphereGeometry(0.1, 6, 4);
      const flowerMaterial = new THREE.MeshStandardMaterial({
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        emissive: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0
      });

      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(
        (Math.random() - 0.5) * 60,
        0.4 + Math.random() * 0.2,
        (Math.random() - 0.5) * 60
      );
      this.scene.add(flower);

      if (!this.decorations) this.decorations = [];
      this.decorations.push(flower);
    }
  }

  // Override cleanup to handle grass-specific cleanup
  cleanup() {
    // Clean up grass mesh if it exists
    if (this.grassMesh) {
      this.scene.remove(this.grassMesh);
      if (this.grassMesh.geometry) this.grassMesh.geometry.dispose();
      if (this.grassMaterial) this.grassMaterial.dispose();
      this.grassMesh = null;
      this.grassMaterial = null;
    }

    // Clean up decorations
    if (this.decorations) {
      this.decorations.forEach(decoration => {
        this.scene.remove(decoration);
        if (decoration.geometry) decoration.geometry.dispose();
        if (decoration.material) decoration.material.dispose();
      });
      this.decorations = [];
    }

    // Call original cleanup
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
}