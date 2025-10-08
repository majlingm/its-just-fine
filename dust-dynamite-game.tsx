import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// ==================== GAME ENGINE ====================

class GameEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.entities = [];
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.lastFrameTime = 0;
  }

  init(container) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6b5344);
    this.scene.fog = new THREE.Fog(0x6b5344, 30, 100);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 18, 18);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // Sound
    this.sound = new SoundSystem();
    this.sound.init();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffd700, 0.4);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Ground
    this.createGround();

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  createGround() {
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      'https://filterforge.com/filters/10458.jpg',
      (groundTexture) => {
        console.log('Ground texture loaded successfully');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(6, 6);
        
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({ 
          map: groundTexture, 
          roughness: 0.3, 
          metalness: 0.7 
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
      },
      undefined,
      (err) => {
        console.error('Error loading texture, using procedural fallback:', err);
        this.createProceduralGround();
      }
    );
  }

  createProceduralGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
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
    this.scene.add(ground);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addEntity(entity) {
    this.entities.push(entity);
    if (entity.mesh) {
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

// ==================== SOUND SYSTEM ====================

class SoundSystem {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.masterVolume = 0.3;
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  playShoot() {
    if (!this.enabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.05);
  }

  playExplosion() {
    if (!this.enabled || !this.context) return;
    
    const bufferSize = this.context.sampleRate * 0.5;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.context.sampleRate * 0.1));
    }
    
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    source.start(this.context.currentTime);
  }

  playHit() {
    if (!this.enabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  }

  playLevelUp() {
    if (!this.enabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.setValueAtTime(500, this.context.currentTime + 0.1);
    osc.frequency.setValueAtTime(600, this.context.currentTime + 0.2);
    osc.frequency.setValueAtTime(800, this.context.currentTime + 0.3);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.4);
  }

  playPickup() {
    if (!this.enabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.setValueAtTime(900, this.context.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  }

  playDeath() {
    if (!this.enabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.8);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.8);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.8);
  }
}

// ==================== WEAPON DEFINITIONS ====================

const WEAPON_TYPES = {
  TWIN_REVOLVERS: {
    name: 'Twin Revolvers',
    desc: 'Fires twin shots at nearest enemy',
    cooldown: 0.35,
    damage: 12,
    speed: 18,
    pierce: 1,
    projectileCount: 2,
    spread: 0.3,
    targeting: 'nearest',
    lifetime: 2.5,
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      return new Projectile(engine, x, z, dirX, dirZ, weapon, stats);
    }
  },
  
  SHOTGUN: {
    name: 'Scattergun',
    desc: 'Wide spread of pellets',
    cooldown: 0.8,
    damage: 8,
    speed: 15,
    pierce: 0,
    projectileCount: 6,
    spread: 0.6,
    targeting: 'nearest',
    lifetime: 1.5,
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      return new Projectile(engine, x, z, dirX, dirZ, weapon, stats);
    }
  },
  
  RIFLE: {
    name: 'Long Rifle',
    desc: 'High damage, long range shots',
    cooldown: 1.2,
    damage: 35,
    speed: 25,
    pierce: 3,
    projectileCount: 1,
    spread: 0,
    targeting: 'farthest',
    lifetime: 4,
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      const proj = new Projectile(engine, x, z, dirX, dirZ, weapon, stats);
      proj.mesh.scale.set(1.2, 1.2, 1);
      return proj;
    }
  },
  
  THROWING_KNIVES: {
    name: 'Throwing Knives',
    desc: 'Rapid fire in multiple directions',
    cooldown: 0.15,
    damage: 6,
    speed: 20,
    pierce: 0,
    projectileCount: 1,
    spread: 0,
    targeting: 'nearest',
    lifetime: 2,
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      const proj = new Projectile(engine, x, z, dirX, dirZ, weapon, stats);
      const texture = createProjectileSprite('#cccccc');
      proj.mesh.material.map = texture;
      proj.mesh.scale.set(0.6, 0.6, 1);
      return proj;
    }
  },
  
  DYNAMITE: {
    name: 'Dynamite',
    desc: 'Explosive area damage',
    cooldown: 1.5,
    damage: 25,
    speed: 12,
    pierce: 999,
    projectileCount: 1,
    spread: 0,
    targeting: 'nearest',
    lifetime: 1.5,
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      const proj = new DynamiteProjectile(engine, x, z, dirX, dirZ, weapon, stats);
      return proj;
    }
  },
  
  LASSO: {
    name: 'Whirling Lasso',
    desc: 'Orbits around you',
    cooldown: 0.1,
    damage: 15,
    speed: 0,
    pierce: 999,
    projectileCount: 1,
    spread: 0,
    targeting: 'orbit',
    createProjectile: (engine, x, z, dirX, dirZ, weapon, stats) => {
      return new OrbitProjectile(engine, x, z, weapon, stats);
    }
  }
};

// ==================== SPRITE GENERATION ====================

function createPlayerSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a5f7a';
  ctx.fillRect(16, 8, 32, 8);
  ctx.fillRect(20, 16, 24, 4);
  
  ctx.fillStyle = '#ffdbac';
  ctx.fillRect(24, 20, 16, 12);
  
  ctx.fillStyle = '#2a9fd6';
  ctx.fillRect(20, 32, 24, 20);
  
  ctx.fillStyle = '#2a9fd6';
  ctx.fillRect(14, 36, 6, 12);
  ctx.fillRect(44, 36, 6, 12);
  
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(24, 52, 8, 12);
  ctx.fillRect(32, 52, 8, 12);
  
  ctx.fillStyle = '#333333';
  ctx.fillRect(44, 40, 8, 3);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createEnemySprite(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  if (type === 'bandit') {
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(20, 12, 24, 8);
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(24, 20, 16, 12);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(24, 26, 16, 6);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(20, 32, 24, 20);
    ctx.fillRect(24, 52, 8, 12);
    ctx.fillRect(32, 52, 8, 12);
  } else if (type === 'coyote') {
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(24, 28, 16, 8);
    ctx.fillRect(28, 24, 8, 4);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(20, 36, 24, 12);
    ctx.fillRect(22, 48, 6, 8);
    ctx.fillRect(36, 48, 6, 8);
  } else if (type === 'brute') {
    ctx.fillStyle = '#4a1a1a';
    ctx.fillRect(16, 16, 32, 16);
    ctx.fillRect(12, 32, 40, 24);
    ctx.fillStyle = '#331111';
    ctx.fillRect(20, 56, 10, 8);
    ctx.fillRect(34, 56, 10, 8);
  } else if (type === 'gunman') {
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(22, 12, 20, 8);
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(24, 20, 16, 12);
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(20, 32, 24, 20);
    ctx.fillStyle = '#333333';
    ctx.fillRect(14, 36, 6, 16);
    ctx.fillRect(24, 52, 8, 12);
    ctx.fillRect(32, 52, 8, 12);
  } else if (type === 'charger') {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(20, 20, 24, 12);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(18, 32, 28, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 20, 4, 6);
    ctx.fillRect(42, 20, 4, 6);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(22, 48, 8, 10);
    ctx.fillRect(34, 48, 8, 10);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createEliteGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(40, 40, 10, 40, 40, 40);
  gradient.addColorStop(0, 'rgba(255, 170, 0, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 80, 80);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createProjectileSprite(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(8, 8, 2, 8, 8, 8);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createPickupSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.lineTo(26, 12);
  ctx.lineTo(24, 24);
  ctx.lineTo(16, 28);
  ctx.lineTo(8, 24);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#00aa55';
  ctx.fillRect(14, 12, 4, 12);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ==================== ENTITY BASE CLASS ====================

class Entity {
  constructor() {
    this.active = true;
    this.shouldRemove = false;
    this.mesh = null;
    this.x = 0;
    this.z = 0;
  }

  update(dt) {
    // Override in subclasses
  }

  destroy() {
    this.active = false;
    this.shouldRemove = true;
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }
}

// ==================== PLAYER ====================

class Player extends Entity {
  constructor(engine) {
    super();
    this.engine = engine;
    this.x = 0;
    this.z = 0;
    this.speed = 8;
    this.health = 100;
    this.maxHealth = 100;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    
    this.stats = {
      damage: 1,
      cooldown: 1,
      projectileSpeed: 1,
      pierce: 0,
      moveSpeed: 1,
      pickupRadius: 2
    };

    this.weapons = [
      { type: WEAPON_TYPES.TWIN_REVOLVERS, level: 1, lastShot: 0 }
    ];

    this.createMesh();
  }

  createMesh() {
    // Create a container group for the player
    this.mesh = new THREE.Group();

    // Load 3D model
    const loader = new GLTFLoader();
    const modelPath = '/assets/characters/beautiful_witch.glb';
    console.log('Loading player model from:', modelPath);

    loader.load(
      modelPath,
      (gltf) => {
        console.log('Player model loaded successfully:', gltf);

        // Add the loaded model to our group
        const model = gltf.scene;
        model.scale.set(0.8, 0.8, 0.8); // Adjusted scale for witch model

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log('Model size:', size);
        console.log('Model center:', center);

        // Position model relative to the group
        model.position.set(-center.x, -box.min.y, -center.z);

        // Add animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          console.log('Found animations:', gltf.animations.length);
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        this.mesh.add(model);
        this.model = model;

        // Add muzzle flash
        const flashCanvas = document.createElement('canvas');
        flashCanvas.width = 32;
        flashCanvas.height = 32;
        const ctx = flashCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 4, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const flashTexture = new THREE.CanvasTexture(flashCanvas);
        const flashMat = new THREE.SpriteMaterial({
          map: flashTexture,
          transparent: true,
          opacity: 0
        });
        const flash = new THREE.Sprite(flashMat);
        flash.scale.set(1.5, 1.5, 1);
        flash.position.set(0, size.y * 0.5, 0.5);
        this.mesh.add(flash);
        this.muzzleFlash = flash;
      },
      (progress) => {
        console.log('Loading player model...', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading player model:', error);
        console.log('Falling back to sprite-based player');

        // Fallback to sprite if model fails to load
        const texture = createPlayerSprite();
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 2, 1);

        this.mesh.add(sprite);

        // Add muzzle flash to sprite fallback
        const flashCanvas = document.createElement('canvas');
        flashCanvas.width = 32;
        flashCanvas.height = 32;
        const ctx = flashCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 4, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const flashTexture = new THREE.CanvasTexture(flashCanvas);
        const flashMat = new THREE.SpriteMaterial({
          map: flashTexture,
          transparent: true,
          opacity: 0
        });
        const flash = new THREE.Sprite(flashMat);
        flash.scale.set(1.5, 1.5, 1);
        flash.position.z = 0.5;
        this.mesh.add(flash);
        this.muzzleFlash = flash;
      }
    );
  }

  showMuzzleFlash() {
    if (this.muzzleFlash) {
      this.muzzleFlash.material.opacity = 0.8;
      setTimeout(() => {
        if (this.muzzleFlash) {
          this.muzzleFlash.material.opacity = 0;
        }
      }, 50);
    }
  }

  handleInput(keys, dt) {
    let dx = 0, dz = 0;
    
    // Don't process input if game is paused or in menus
    const game = this.engine.game;
    if (game && (game.levelingUp || game.gameOver)) {
      return;
    }
    
    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    
    if (game && (game.touchActive || game.mouseActive)) {
      let offsetX, offsetY;
      
      if (game.touchActive) {
        offsetX = game.touchCurrentX - game.touchStartX;
        offsetY = game.touchCurrentY - game.touchStartY;
      } else {
        offsetX = game.mouseCurrentX - game.mouseStartX;
        offsetY = game.mouseCurrentY - game.mouseStartY;
      }
      
      const deadzone = 10;
      if (Math.abs(offsetX) > deadzone || Math.abs(offsetY) > deadzone) {
        const maxDrag = 100;
        dx = Math.max(-1, Math.min(1, offsetX / maxDrag));
        dz = Math.max(-1, Math.min(1, offsetY / maxDrag));
      }
    }
    
    if (dx !== 0 || dz !== 0) {
      const mag = Math.sqrt(dx * dx + dz * dz);
      dx /= mag;
      dz /= mag;
      this.x += dx * this.speed * this.stats.moveSpeed * dt;
      this.z += dz * this.speed * this.stats.moveSpeed * dt;
    }

    this.x = Math.max(-90, Math.min(90, this.x));
    this.z = Math.max(-90, Math.min(90, this.z));
  }

  update(dt) {
    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;

    // Update animations if mixer exists
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
}

// ==================== ENEMY ====================

class Enemy extends Entity {
  constructor(engine, x, z, type = 'bandit') {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.type = type;
    this.isElite = false;
    this.eliteAffix = null;
    this.setupStats();
    this.createMesh();
  }

  setupStats() {
    const wave = this.engine.game?.wave || 1;
    
    const typeStats = {
      bandit: { health: 50, speed: 3, damage: 12, color: 0x2d2d2d },
      coyote: { health: 30, speed: 5, damage: 8, color: 0xd2691e },
      brute: { health: 120, speed: 1.5, damage: 25, color: 0x4a1a1a },
      gunman: { health: 40, speed: 2.5, damage: 15, color: 0x3a3a5a },
      charger: { health: 60, speed: 2, damage: 18, color: 0x5a3a1a }
    };
    
    const stats = typeStats[this.type] || typeStats.bandit;
    
    this.baseSpeed = stats.speed;
    this.speed = stats.speed;
    this.health = stats.health + wave * 8;
    this.maxHealth = this.health;
    this.damage = stats.damage + wave * 3;
    this.baseColor = stats.color;
    
    this.chargeTimer = 0;
    this.chargeCooldown = 3;
    this.isCharging = false;
  }

  createMesh() {
    const texture = createEnemySprite(this.type);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    
    if (this.type === 'brute') {
      sprite.scale.set(2.5, 2.5, 1);
    } else if (this.type === 'coyote') {
      sprite.scale.set(1.5, 1.5, 1);
    } else {
      sprite.scale.set(2, 2, 1);
    }
    
    this.mesh = sprite;
  }

  makeElite(affix) {
    this.isElite = true;
    this.eliteAffix = affix;
    
    this.health *= 3;
    this.maxHealth = this.health;
    this.damage *= 1.5;
    
    const glowTexture = createEliteGlow();
    const glowMat = new THREE.SpriteMaterial({ 
      map: glowTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(this.mesh.scale.x * 1.5, this.mesh.scale.y * 1.5, 1);
    glow.position.z = -0.1;
    this.mesh.add(glow);
    this.glowMesh = glow;
    
    if (affix === 'fast') {
      this.speed *= 1.8;
      this.baseSpeed *= 1.8;
    } else if (affix === 'tank') {
      this.health *= 2;
      this.maxHealth = this.health;
      this.speed *= 0.7;
      this.baseSpeed *= 0.7;
    } else if (affix === 'regen') {
      this.regenRate = this.maxHealth * 0.02;
    }
  }

  update(dt) {
    if (!this.active) return;

    const player = this.engine.game?.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (this.type === 'charger' && !this.isCharging) {
      this.chargeTimer += dt;
      if (this.chargeTimer > this.chargeCooldown && dist < 20) {
        this.isCharging = true;
        this.speed = this.baseSpeed * 4;
        this.chargeTimer = 0;
      }
    }
    
    if (this.isCharging) {
      this.chargeTimer += dt;
      if (this.chargeTimer > 1) {
        this.isCharging = false;
        this.speed = this.baseSpeed;
        this.chargeTimer = 0;
      }
    }
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.z += (dz / dist) * this.speed * dt;
    }

    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
    
    if (this.glowMesh) {
      this.glowMesh.material.opacity = 0.6 + Math.sin(this.engine.time * 3) * 0.2;
    }
    
    if (this.isElite && this.eliteAffix === 'regen') {
      this.health = Math.min(this.maxHealth, this.health + this.regenRate * dt);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.playDeathExplosion();
      return true;
    }
    return false;
  }

  playDeathExplosion() {
    this.active = false;
    this.shouldRemove = true;
    
    const particleCount = 20;
    const particles = [];
    
    const colors = [
      ['#ffff00', '#ffaa00'],
      ['#ffaa00', '#ff6600'],
      ['#ff6600', '#ff0000'],
      ['#ff0000', '#aa0000'],
      ['#ffcc00', '#ff9900'],
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 4;
      
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      
      const colorPair = colors[Math.floor(Math.random() * colors.length)];
      const gradient = ctx.createRadialGradient(8, 8, 2, 8, 8, 8);
      gradient.addColorStop(0, colorPair[0]);
      gradient.addColorStop(1, colorPair[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(material);
      
      const size = 0.3 + Math.random() * 0.5;
      sprite.scale.set(size, size, 1);
      sprite.position.set(this.x, 1, this.z);
      
      this.engine.scene.add(sprite);
      
      particles.push({
        sprite: sprite,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        age: 0,
        initialSize: size
      });
    }
    
    const animate = () => {
      let allDead = true;
      
      particles.forEach(p => {
        if (p.age < p.life) {
          allDead = false;
          p.age += 0.016;
          const progress = p.age / p.life;
          
          const speedMult = 1 - progress * 0.5;
          p.sprite.position.x += p.vx * 0.016 * speedMult;
          p.sprite.position.z += p.vz * 0.016 * speedMult;
          
          p.sprite.material.opacity = 1 - Math.pow(progress, 0.5);
          
          const scale = p.initialSize * (1 - progress * 0.7);
          p.sprite.scale.set(scale, scale, 1);
        }
      });
      
      if (!allDead) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach(p => {
          this.engine.scene.remove(p.sprite);
        });
      }
    };
    
    animate();
    
    this.mesh.visible = false;
  }
}

// ==================== BOSS ENEMY ====================

class BossEnemy extends Enemy {
  constructor(engine, x, z) {
    super(engine, x, z, 'boss');
    this.isBoss = true;
  }

  setupStats() {
    const wave = this.engine.game?.wave || 1;
    
    this.baseSpeed = 2;
    this.speed = 2;
    this.health = 500 + wave * 100;
    this.maxHealth = this.health;
    this.damage = 40 + wave * 5;
    this.baseColor = 0x1a1a1a;
    
    this.attackTimer = 0;
    this.attackCooldown = 3;
    this.lastAttackType = null;
  }

  createMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(20, 20, 88, 30);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(10, 50, 108, 50);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(15, 100, 25, 28);
    ctx.fillRect(88, 100, 25, 28);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(35, 30, 12, 12);
    ctx.fillRect(81, 30, 12, 12);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 4, 1);
    
    this.mesh = sprite;
    
    const glowTexture = createEliteGlow();
    const glowMat = new THREE.SpriteMaterial({ 
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      color: 0xff0000
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(6, 6, 1);
    glow.position.z = -0.1;
    this.mesh.add(glow);
    this.glowMesh = glow;
  }

  update(dt) {
    if (!this.active) return;

    const player = this.engine.game?.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.z += (dz / dist) * this.speed * dt;
    }

    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
    
    if (this.glowMesh) {
      this.glowMesh.material.opacity = 0.4 + Math.sin(this.engine.time * 4) * 0.2;
    }
    
    this.attackTimer += dt;
    if (this.attackTimer > this.attackCooldown) {
      this.performSpecialAttack();
      this.attackTimer = 0;
    }
  }

  performSpecialAttack() {
    const player = this.engine.game?.player;
    if (!player) return;

    const attackType = Math.random() > 0.5 ? 'shockwave' : 'summon';
    
    if (attackType === 'shockwave') {
      this.createShockwave();
    } else {
      this.summonMinions();
    }
  }

  createShockwave() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const wave = new THREE.Sprite(material);
    wave.scale.set(2, 2, 1);
    wave.position.set(this.x, 1, this.z);
    
    this.engine.scene.add(wave);
    
    let time = 0;
    const animate = () => {
      time += 0.016;
      const progress = time / 1.5;
      
      if (progress < 1) {
        const scale = 2 + progress * 8;
        wave.scale.set(scale, scale, 1);
        wave.material.opacity = 1 - progress;
        
        const dx = this.engine.game.player.x - this.x;
        const dz = this.engine.game.player.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const waveRadius = scale;
        
        if (Math.abs(dist - waveRadius) < 1 && time > 0.2) {
          this.engine.game.player.takeDamage(15);
        }
        
        requestAnimationFrame(animate);
      } else {
        this.engine.scene.remove(wave);
      }
    };
    
    animate();
  }

  summonMinions() {
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dist = 5;
      const x = this.x + Math.cos(angle) * dist;
      const z = this.z + Math.sin(angle) * dist;
      
      const minion = new Enemy(this.engine, x, z, 'bandit');
      minion.health *= 0.5;
      this.engine.addEntity(minion);
    }
  }

  playDeathExplosion() {
    this.active = false;
    this.shouldRemove = true;
    
    const particleCount = 40;
    const particles = [];
    
    const colors = [
      ['#ff0000', '#aa0000'],
      ['#ffaa00', '#ff0000'],
      ['#ff6600', '#ff0000'],
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 3 + Math.random() * 5;
      
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      
      const colorPair = colors[Math.floor(Math.random() * colors.length)];
      const gradient = ctx.createRadialGradient(12, 12, 3, 12, 12, 12);
      gradient.addColorStop(0, colorPair[0]);
      gradient.addColorStop(1, colorPair[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 24, 24);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(material);
      
      const size = 0.5 + Math.random() * 0.8;
      sprite.scale.set(size, size, 1);
      sprite.position.set(this.x, 1, this.z);
      
      this.engine.scene.add(sprite);
      
      particles.push({
        sprite: sprite,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        age: 0,
        initialSize: size
      });
    }
    
    const animate = () => {
      let allDead = true;
      
      particles.forEach(p => {
        if (p.age < p.life) {
          allDead = false;
          p.age += 0.016;
          const progress = p.age / p.life;
          
          const speedMult = 1 - progress * 0.5;
          p.sprite.position.x += p.vx * 0.016 * speedMult;
          p.sprite.position.z += p.vz * 0.016 * speedMult;
          
          p.sprite.material.opacity = 1 - Math.pow(progress, 0.5);
          
          const scale = p.initialSize * (1 - progress * 0.7);
          p.sprite.scale.set(scale, scale, 1);
        }
      });
      
      if (!allDead) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach(p => {
          this.engine.scene.remove(p.sprite);
        });
      }
    };
    
    animate();
    
    this.mesh.visible = false;
  }
}

// ==================== PROJECTILE ====================

class Projectile extends Entity {
  constructor(engine, x, z, dirX, dirZ, weapon, stats) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.dirX = dirX;
    this.dirZ = dirZ;
    this.speed = weapon.speed * stats.projectileSpeed;
    this.damage = weapon.damage * stats.damage;
    this.pierce = weapon.pierce + stats.pierce;
    this.pierceCount = 0;
    this.lifetime = weapon.lifetime || 3;
    this.age = 0;
    this.createMesh();
  }

  createMesh() {
    const texture = createProjectileSprite('#ffff00');
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    
    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    this.x += this.dirX * this.speed * dt;
    this.z += this.dirZ * this.speed * dt;
    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
  }

  hit() {
    this.pierceCount++;
    if (this.pierceCount > this.pierce) {
      this.destroy();
    }
  }
}

// ==================== DYNAMITE PROJECTILE ====================

class DynamiteProjectile extends Projectile {
  constructor(engine, x, z, dirX, dirZ, weapon, stats) {
    super(engine, x, z, dirX, dirZ, weapon, stats);
    this.explosionRadius = 5;
    this.hasExploded = false;
  }

  createMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(8, 12, 16, 10);
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(14, 8, 4, 4);
    
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(14, 4, 4, 4);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1, 1, 1);
    
    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    
    if (this.age > this.lifetime && !this.hasExploded) {
      this.explode();
      return;
    }

    this.x += this.dirX * this.speed * dt;
    this.z += this.dirZ * this.speed * dt;
    
    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
    
    this.mesh.material.opacity = Math.floor(this.age * 10) % 2 === 0 ? 1 : 0.5;
  }

  explode() {
    this.hasExploded = true;
    
    this.engine.sound.playExplosion();
    
    const explosionCanvas = document.createElement('canvas');
    explosionCanvas.width = 128;
    explosionCanvas.height = 128;
    const ctx = explosionCanvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    const explosionTexture = new THREE.CanvasTexture(explosionCanvas);
    const explosionMat = new THREE.SpriteMaterial({ 
      map: explosionTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const explosion = new THREE.Sprite(explosionMat);
    explosion.scale.set(this.explosionRadius * 2, this.explosionRadius * 2, 1);
    explosion.position.set(this.x, 1, this.z);
    this.engine.scene.add(explosion);
    
    const enemies = this.engine.entities.filter(e => e instanceof Enemy && e.active);
    enemies.forEach(enemy => {
      const dx = enemy.x - this.x;
      const dz = enemy.z - this.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < this.explosionRadius) {
        if (enemy.takeDamage(this.damage)) {
          this.engine.game.killCount++;
          this.engine.game.dropXP(enemy.x, enemy.z, enemy.isElite);
        }
      }
    });
    
    setTimeout(() => {
      this.engine.scene.remove(explosion);
    }, 200);
    
    this.destroy();
  }

  hit() {
  }
}

// ==================== ORBIT PROJECTILE ====================

class OrbitProjectile extends Projectile {
  constructor(engine, x, z, weapon, stats) {
    super(engine, x, z, 0, 0, weapon, stats);
    this.orbitRadius = 3;
    this.orbitSpeed = 3;
    this.angle = Math.random() * Math.PI * 2;
    this.lifetime = 999;
  }

  createMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#6b5345';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 1.5, 1);
    
    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;

    const player = this.engine.game?.player;
    if (!player) {
      this.destroy();
      return;
    }

    this.angle += this.orbitSpeed * dt;
    this.x = player.x + Math.cos(this.angle) * this.orbitRadius;
    this.z = player.z + Math.sin(this.angle) * this.orbitRadius;
    
    this.mesh.position.x = this.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.z;
  }

  hit() {
  }
}

// ==================== PICKUP ====================

class Pickup extends Entity {
  constructor(engine, x, z, type = 'xp', value = 1) {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.type = type;
    this.value = value;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.createMesh();
  }

  createMesh() {
    const texture = createPickupSprite();
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    
    this.mesh = sprite;
  }

  update(dt) {
    if (!this.active) return;
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
    
    this.mesh.position.y = 0.3 + Math.sin(this.engine.time * 3 + this.bobOffset) * 0.1;
  }

  moveToward(targetX, targetZ, speed, dt) {
    const dx = targetX - this.x;
    const dz = targetZ - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0) {
      this.x += (dx / dist) * speed * dt;
      this.z += (dz / dist) * speed * dt;
    }
  }
}

// ==================== GAME LOGIC ====================

class DustAndDynamiteGame {
  constructor(engine) {
    this.engine = engine;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.keys = {};
    this.wave = 1;
    this.lastSpawn = 0;
    this.killCount = 0;
    this.gameOver = false;
    this.levelingUp = false;
    this.bossSpawned = false;
    this.onLevelUp = null;
    this.onGameOver = null;
    this.onUpdate = null;

    engine.game = this;
    this.setupInput();
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.touchActive = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.touchCurrentY = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchActive = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchCurrentX = e.touches[0].clientX;
        this.touchCurrentY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0 && this.touchActive) {
        this.touchCurrentX = e.touches[0].clientX;
        this.touchCurrentY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => {
      this.touchActive = false;
    });

    window.addEventListener('touchcancel', () => {
      this.touchActive = false;
    });

    this.mouseActive = false;
    this.mouseStartX = 0;
    this.mouseStartY = 0;
    this.mouseCurrentX = 0;
    this.mouseCurrentY = 0;

    window.addEventListener('mousedown', (e) => {
      this.mouseActive = true;
      this.mouseStartX = e.clientX;
      this.mouseStartY = e.clientY;
      this.mouseCurrentX = e.clientX;
      this.mouseCurrentY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouseActive) {
        this.mouseCurrentX = e.clientX;
        this.mouseCurrentY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouseActive = false;
    });
  }

  start() {
    this.player = new Player(this.engine);
    this.engine.addEntity(this.player);
    this.engine.start();
  }

  update(dt) {
    if (this.gameOver || this.levelingUp) return;

    if (!this.player || !this.player.active) return;

    this.player.handleInput(this.keys, dt);
    this.player.update(dt);

    this.engine.camera.position.x = this.player.x;
    this.engine.camera.position.z = this.player.z + 18;
    this.engine.camera.lookAt(this.player.x, 0, this.player.z);

    this.updateWeapons(dt);

    this.enemies = this.engine.entities.filter(e => e instanceof Enemy);
    this.projectiles = this.engine.entities.filter(e => e instanceof Projectile);
    this.pickups = this.engine.entities.filter(e => e instanceof Pickup);

    this.checkCollisions(dt);

    this.updatePickups(dt);

    this.spawnEnemies(dt);

    const newWave = Math.floor(this.engine.time / 60) + 1;
    if (newWave > this.wave) {
      this.wave = newWave;
    }

    if (this.onUpdate) {
      this.onUpdate({
        health: Math.max(0, Math.floor(this.player.health)),
        maxHealth: this.player.maxHealth,
        xp: this.player.xp,
        level: this.player.level,
        xpProgress: (this.player.xp / this.player.xpToNext) * 100,
        time: Math.floor(this.engine.time),
        enemyCount: this.enemies.length,
        kills: this.killCount
      });
    }
  }

  updateWeapons(dt) {
    this.player.weapons.forEach(weaponInstance => {
      const weapon = weaponInstance.type;
      
      if (weapon.targeting === 'orbit') {
        const existingOrbits = this.engine.entities.filter(
          e => e instanceof OrbitProjectile && e.active && e.weaponType === weapon.name
        );
        
        if (existingOrbits.length === 0) {
          const proj = weapon.createProjectile(
            this.engine,
            this.player.x,
            this.player.z,
            0,
            0,
            weapon,
            this.player.stats
          );
          proj.weaponType = weapon.name;
          this.engine.addEntity(proj);
        }
        return;
      }
      
      if (this.engine.time - weaponInstance.lastShot > weapon.cooldown * this.player.stats.cooldown) {
        
        let target = null;
        
        if (weapon.targeting === 'nearest') {
          let minDist = Infinity;
          this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dz = e.z - this.player.z;
            const dist = dx * dx + dz * dz;
            if (dist < minDist) {
              minDist = dist;
              target = e;
            }
          });
        } else if (weapon.targeting === 'farthest') {
          let maxDist = 0;
          this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dz = e.z - this.player.z;
            const dist = dx * dx + dz * dz;
            if (dist > maxDist && dist < 2500) {
              maxDist = dist;
              target = e;
            }
          });
        }

        if (target) {
          const dx = target.x - this.player.x;
          const dz = target.z - this.player.z;
          const mag = Math.sqrt(dx * dx + dz * dz);
          const dirX = dx / mag;
          const dirZ = dz / mag;

          const totalProjectiles = weapon.projectileCount || 1;
          const spread = weapon.spread || 0;

          for (let i = 0; i < totalProjectiles; i++) {
            const spreadAngle = (i - (totalProjectiles - 1) / 2) * spread;
            const cos = Math.cos(spreadAngle);
            const sin = Math.sin(spreadAngle);
            const newDirX = dirX * cos - dirZ * sin;
            const newDirZ = dirX * sin + dirZ * cos;

            const proj = weapon.createProjectile(
              this.engine,
              this.player.x,
              this.player.z,
              newDirX,
              newDirZ,
              weapon,
              this.player.stats
            );
            this.engine.addEntity(proj);
          }
          
          this.player.showMuzzleFlash();
          this.engine.sound.playShoot();
          weaponInstance.lastShot = this.engine.time;
        }
      }
    });
  }

  checkCollisions(dt) {
    this.projectiles.forEach(proj => {
      if (!proj.active) return;
      
      if (proj instanceof DynamiteProjectile) return;
      
      this.enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        const dx = enemy.x - proj.x;
        const dz = enemy.z - proj.z;
        const hitRadius = proj instanceof OrbitProjectile ? 1.5 : 1;
        
        if (dx * dx + dz * dz < hitRadius * hitRadius) {
          if (enemy.takeDamage(proj.damage * (proj instanceof OrbitProjectile ? dt : 1))) {
            this.killCount++;
            this.engine.sound.playHit();
            this.dropXP(enemy.x, enemy.z, enemy.isElite);
          }
          
          if (!(proj instanceof OrbitProjectile)) {
            proj.hit();
          }
        }
      });
    });

    this.enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      const dx = this.player.x - enemy.x;
      const dz = this.player.z - enemy.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 1.5) {
        if (this.player.takeDamage(enemy.damage * dt)) {
          this.gameOver = true;
          this.engine.pause();
          this.engine.sound.playDeath();
          if (this.onGameOver) {
            this.onGameOver({
              time: Math.floor(this.engine.time),
              kills: this.killCount
            });
          }
        }
      }
    });
  }

  updatePickups(dt) {
    const radius = this.player.stats.pickupRadius;
    
    this.pickups.forEach(pickup => {
      if (!pickup.active) return;
      
      const dx = this.player.x - pickup.x;
      const dz = this.player.z - pickup.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < radius * 3) {
        pickup.moveToward(this.player.x, this.player.z, 10, dt);
      }
      
      if (dist < radius) {
        if (pickup.type === 'xp') {
          this.engine.sound.playPickup();
          if (this.player.addXP(pickup.value)) {
            this.triggerLevelUp();
          }
        }
        pickup.destroy();
      }
    });
  }

  dropXP(x, z, isElite = false) {
    const baseXP = 1 + Math.floor(this.wave / 5);
    const xpValue = isElite ? baseXP * 5 : baseXP;
    
    for (let i = 0; i < xpValue; i++) {
      const pickup = new Pickup(
        this.engine,
        x + (Math.random() - 0.5) * 2,
        z + (Math.random() - 0.5) * 2,
        'xp',
        1
      );
      this.engine.addEntity(pickup);
    }
  }

  spawnEnemies(dt) {
    const spawnInterval = Math.max(0.15, 0.8 - this.wave * 0.05);
    const maxEnemies = 150 + this.wave * 10;
    
    if (this.wave % 3 === 0 && !this.bossSpawned) {
      this.spawnBoss();
      this.bossSpawned = true;
      return;
    }
    
    if (this.wave % 3 !== 0) {
      this.bossSpawned = false;
    }
    
    if (this.engine.time - this.lastSpawn > spawnInterval && this.enemies.length < maxEnemies) {
      const spawnCount = Math.min(3, 1 + Math.floor(this.wave / 3));
      
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 15;
        const x = this.player.x + Math.cos(angle) * dist;
        const z = this.player.z + Math.sin(angle) * dist;
        
        const roll = Math.random();
        let type;
        if (roll < 0.4) type = 'bandit';
        else if (roll < 0.65) type = 'coyote';
        else if (roll < 0.8) type = 'brute';
        else if (roll < 0.9) type = 'gunman';
        else type = 'charger';
        
        const enemy = new Enemy(this.engine, x, z, type);
        
        if (Math.random() < 0.05) {
          const affixes = ['fast', 'tank', 'regen'];
          const affix = affixes[Math.floor(Math.random() * affixes.length)];
          enemy.makeElite(affix);
        }
        
        this.engine.addEntity(enemy);
      }
      
      this.lastSpawn = this.engine.time;
    }
  }

  spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50;
    const x = this.player.x + Math.cos(angle) * dist;
    const z = this.player.z + Math.sin(angle) * dist;
    
    const boss = new BossEnemy(this.engine, x, z);
    this.engine.addEntity(boss);
    
    this.engine.sound.playExplosion();
  }

  triggerLevelUp() {
    this.levelingUp = true;
    this.engine.pause();
    this.engine.sound.playLevelUp();
    
    const statUpgrades = [
      { id: 'damage', name: 'Damage Up', desc: '+15% damage', type: 'stat', apply: (p) => p.stats.damage *= 1.15 },
      { id: 'cooldown', name: 'Fire Rate', desc: '+10% fire rate', type: 'stat', apply: (p) => p.stats.cooldown = Math.max(0.5, p.stats.cooldown * 0.9) },
      { id: 'speed', name: 'Move Speed', desc: '+10% move speed', type: 'stat', apply: (p) => p.stats.moveSpeed *= 1.1 },
      { id: 'pierce', name: 'Pierce', desc: '+1 pierce', type: 'stat', apply: (p) => p.stats.pierce += 1 },
      { id: 'health', name: 'Max Health', desc: '+20 max health', type: 'stat', apply: (p) => { p.maxHealth += 20; p.health += 20; } },
      { id: 'radius', name: 'Pickup Radius', desc: '+40% pickup range', type: 'stat', apply: (p) => p.stats.pickupRadius *= 1.4 },
    ];

    const weaponUpgrades = [
      { 
        id: 'shotgun', 
        name: 'Scattergun', 
        desc: 'Wide spread of pellets', 
        type: 'weapon',
        weaponType: WEAPON_TYPES.SHOTGUN,
        apply: (p) => {
          if (!p.weapons.find(w => w.type === WEAPON_TYPES.SHOTGUN)) {
            p.weapons.push({ type: WEAPON_TYPES.SHOTGUN, level: 1, lastShot: 0 });
          }
        }
      },
      { 
        id: 'rifle', 
        name: 'Long Rifle', 
        desc: 'High damage sniper', 
        type: 'weapon',
        weaponType: WEAPON_TYPES.RIFLE,
        apply: (p) => {
          if (!p.weapons.find(w => w.type === WEAPON_TYPES.RIFLE)) {
            p.weapons.push({ type: WEAPON_TYPES.RIFLE, level: 1, lastShot: 0 });
          }
        }
      },
      { 
        id: 'knives', 
        name: 'Throwing Knives', 
        desc: 'Rapid multi-target', 
        type: 'weapon',
        weaponType: WEAPON_TYPES.THROWING_KNIVES,
        apply: (p) => {
          if (!p.weapons.find(w => w.type === WEAPON_TYPES.THROWING_KNIVES)) {
            p.weapons.push({ type: WEAPON_TYPES.THROWING_KNIVES, level: 1, lastShot: 0 });
          }
        }
      },
      { 
        id: 'dynamite', 
        name: 'Dynamite', 
        desc: 'Explosive area damage', 
        type: 'weapon',
        weaponType: WEAPON_TYPES.DYNAMITE,
        apply: (p) => {
          if (!p.weapons.find(w => w.type === WEAPON_TYPES.DYNAMITE)) {
            p.weapons.push({ type: WEAPON_TYPES.DYNAMITE, level: 1, lastShot: 0 });
          }
        }
      },
      { 
        id: 'lasso', 
        name: 'Whirling Lasso', 
        desc: 'Orbits around you', 
        type: 'weapon',
        weaponType: WEAPON_TYPES.LASSO,
        apply: (p) => {
          if (!p.weapons.find(w => w.type === WEAPON_TYPES.LASSO)) {
            p.weapons.push({ type: WEAPON_TYPES.LASSO, level: 1, lastShot: 0 });
          }
        }
      }
    ];

    const availableWeapons = weaponUpgrades.filter(wu => 
      !this.player.weapons.find(w => w.type === wu.weaponType)
    );

    const choices = [];
    
    if (availableWeapons.length > 0) {
      const numWeapons = Math.min(2, availableWeapons.length);
      const selectedWeapons = [...availableWeapons]
        .sort(() => Math.random() - 0.5)
        .slice(0, numWeapons);
      choices.push(...selectedWeapons);
    }
    
    const remainingSlots = 3 - choices.length;
    const selectedStats = [...statUpgrades]
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingSlots);
    choices.push(...selectedStats);
    
    const finalChoices = choices.sort(() => Math.random() - 0.5);
    
    if (this.onLevelUp) {
      this.onLevelUp(finalChoices);
    }
  }

  selectUpgrade(upgrade) {
    upgrade.apply(this.player);
    this.levelingUp = false;
    this.engine.resume();
    
    this.pickups.forEach(p => {
      if (p.active) {
        const dx = this.player.x - p.x;
        const dz = this.player.z - p.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 20) {
          p.x = this.player.x;
          p.z = this.player.z;
        }
      }
    });
  }
}

// ==================== REACT COMPONENT ====================

const DustAndDynamite = () => {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const gameRef = useRef(null);
  const [uiState, setUiState] = useState({
    health: 100,
    maxHealth: 100,
    xp: 0,
    level: 1,
    xpProgress: 0,
    time: 0,
    enemyCount: 0,
    levelingUp: false,
    upgradeChoices: [],
    gameOver: false,
    gameOverTime: 0,
    kills: 0,
    weapons: []
  });

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const uiScale = isMobile ? 0.7 : 1;

  useEffect(() => {
    const engine = new GameEngine();
    engine.init(mountRef.current);
    engineRef.current = engine;

    const game = new DustAndDynamiteGame(engine);
    gameRef.current = game;

    game.onUpdate = (state) => {
      setUiState(prev => ({ 
        ...prev, 
        ...state, 
        levelingUp: prev.levelingUp, 
        upgradeChoices: prev.upgradeChoices, 
        gameOver: prev.gameOver,
        gameOverTime: prev.gameOverTime,
        weapons: game.player ? game.player.weapons.map(w => w.type.name) : []
      }));
    };

    game.onLevelUp = (choices) => {
      setUiState(prev => ({ ...prev, levelingUp: true, upgradeChoices: choices }));
    };

    game.onGameOver = (stats) => {
      setUiState(prev => ({ ...prev, gameOver: true, gameOverTime: Date.now(), ...stats }));
    };

    const originalUpdate = engine.update.bind(engine);
    engine.update = (dt) => {
      originalUpdate(dt);
      game.update(dt);
    };

    game.start();

    return () => {
      engine.cleanup();
    };
  }, []);

  const handleUpgradeSelect = (upgrade) => {
    gameRef.current.selectUpgrade(upgrade);
    setUiState(prev => ({ ...prev, levelingUp: false, upgradeChoices: [] }));
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative', 
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    }}>
      <div ref={mountRef} style={{ 
        width: '100%', 
        height: '100%', 
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        top: isMobile ? 10 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        fontSize: `${16 * uiScale}px`,
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 5 }}>Health</div>
        <div style={{
          width: 300 * uiScale,
          height: 25 * uiScale,
          background: '#333',
          border: '3px solid #666',
          position: 'relative',
          borderRadius: 5
        }}>
          <div style={{
            width: `${(uiState.health / uiState.maxHealth) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #c41e3a, #ff6b6b)',
            transition: 'width 0.3s',
            borderRadius: 3
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${14 * uiScale}px`,
            fontWeight: 'bold'
          }}>
            {uiState.health}/{uiState.maxHealth}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: isMobile ? 10 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        fontSize: `${16 * uiScale}px`,
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        <div style={{
          width: 400 * uiScale,
          height: 20 * uiScale,
          background: '#333',
          border: '3px solid #666',
          position: 'relative',
          borderRadius: 5,
          marginBottom: 5
        }}>
          <div style={{
            width: `${uiState.xpProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ff00, #00aa00)',
            transition: 'width 0.3s',
            borderRadius: 3
          }} />
        </div>
        <div style={{ fontSize: `${14 * uiScale}px`, color: '#ffd700' }}>
          Level {uiState.level}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: isMobile ? 10 : 20,
        left: isMobile ? 10 : 20,
        color: '#fff',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        fontSize: `${14 * uiScale}px`,
        pointerEvents: 'none'
      }}>
        <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: 5 }}>
          Wave {Math.floor(uiState.time / 60) + 1}
        </div>
        <div style={{ color: '#ddd', fontSize: `${12 * uiScale}px` }}>
          {Math.floor(uiState.time / 60)}:{(uiState.time % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {uiState.levelingUp && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          color: '#fff',
          padding: isMobile ? '10px' : '0',
          zIndex: 9999,
          touchAction: 'auto'
        }}>
          <h1 style={{ fontSize: `${48 * uiScale}px`, color: '#ffd700', marginBottom: isMobile ? 20 : 40 }}>LEVEL UP!</h1>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 15 : 30,
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '400px' : 'none',
            zIndex: 10000,
            touchAction: 'auto'
          }}>
            {uiState.upgradeChoices.map((upgrade, i) => (
              <button
                key={i}
                onClick={() => handleUpgradeSelect(upgrade)}
                style={{
                  width: isMobile ? '100%' : 250,
                  padding: isMobile ? 20 : 30,
                  background: 'linear-gradient(135deg, #3a2a1a, #2a1a0a)',
                  border: '3px solid #8b4513',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'center',
                  fontFamily: 'Georgia, serif',
                  color: '#fff',
                  zIndex: 10001,
                  position: 'relative',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.borderColor = '#ffd700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = '#8b4513';
                }}
              >
                <h2 style={{ fontSize: `${24 * uiScale}px`, color: '#ffd700', marginBottom: 15, margin: 0 }}>
                  {upgrade.name}
                </h2>
                <p style={{ fontSize: `${16 * uiScale}px`, color: '#ddd', margin: 0, marginTop: 15 }}>
                  {upgrade.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {uiState.gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          color: '#fff'
        }}>
          <h1 style={{ fontSize: `${64 * uiScale}px`, color: '#c41e3a', marginBottom: 20 }}>GAME OVER</h1>
          <div style={{ fontSize: `${24 * uiScale}px`, marginBottom: 10 }}>
            Survived: {Math.floor(uiState.time / 60)}:{(uiState.time % 60).toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: `${24 * uiScale}px`, marginBottom: 40 }}>
            Kills: {uiState.kills}
          </div>
          <button
            onClick={handleRestart}
            style={{
              padding: isMobile ? '12px 30px' : '15px 40px',
              fontSize: `${20 * uiScale}px`,
              background: '#8b4513',
              color: '#fff',
              border: '3px solid #ffd700',
              borderRadius: 5,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default DustAndDynamite;