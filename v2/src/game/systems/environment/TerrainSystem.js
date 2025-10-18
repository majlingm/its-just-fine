/**
 * TerrainSystem - Generates procedural 3D terrain with mountains, valleys, and vegetation
 *
 * Features:
 * - Heightmap-based terrain using noise
 * - Mountains, hills, and valleys
 * - Procedural tree and rock placement
 * - Biome-based coloring
 */

import * as THREE from 'three';
import { NoiseGenerator } from '../../../utils/NoiseGenerator.js';
import { InstancedParticlePool } from '../../../core/pooling/InstancedParticlePool.js';

export class TerrainSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.terrain = null;
    this.objects = []; // Trees, rocks, etc.
    this.objectColliders = []; // Collision data for trees/rocks
    this.noise = new NoiseGenerator(Date.now());
    this.currentStyle = 'normal'; // 'normal' or 'fantasy'
    this.particlePool = null; // Instanced particle pool for fantasy terrain
    this.particleData = []; // Individual particle positions and velocities

    // Normal terrain configuration
    this.normalConfig = {
      size: 400,
      segments: 200,
      heightScale: 30,
      noiseScale: 0.02,
      octaves: 4,
      persistence: 0.5,
      treeCount: 200,
      rockCount: 100,
      minSlope: 0.3,
      treeRadius: 0.5,
      rockRadius: 1.0,
    };

    // Fantasy terrain configuration - more dramatic and colorful
    this.fantasyConfig = {
      size: 400,
      segments: 200,
      heightScale: 50,     // Taller mountains
      noiseScale: 0.015,   // Larger features
      octaves: 5,          // More detail layers
      persistence: 0.6,    // More complex terrain
      treeCount: 0,        // No trees
      rockCount: 0,        // No rocks
      crystalCount: 80,    // Reduced from 150 - glowing crystals
      mushroomCount: 60,   // Reduced from 100 - glowing mushrooms
      minSlope: 0.3,
      crystalRadius: 1.0,
      mushroomRadius: 0.8,
    };

    this.config = this.normalConfig;
  }

  /**
   * Generate the terrain
   * @param {string} style - 'normal' or 'fantasy'
   */
  generate(style = 'normal') {
    this.currentStyle = style;
    this.config = style === 'fantasy' ? this.fantasyConfig : this.normalConfig;

    console.log(`🏔️ Generating ${style} procedural terrain...`);

    this.cleanup();

    // Create terrain mesh
    this.createTerrainMesh();

    // Place vegetation and rocks
    this.placeObjects();

    // Create particle system for fantasy terrain
    if (style === 'fantasy') {
      this.createParticleSystem();
    }

    console.log('✅ Terrain generated');
  }

  /**
   * Create the heightmap terrain mesh
   */
  createTerrainMesh() {
    const { size, segments, heightScale, noiseScale, octaves, persistence } = this.config;

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

    // Get position attribute
    const positions = geometry.attributes.position.array;
    const colors = [];

    // Store heightmap as a 2D grid matching the mesh vertices
    this.heightGrid = [];
    this.gridSize = segments + 1; // Number of vertices per side
    this.gridSpacing = size / segments; // Distance between vertices
    this.gridMin = -size / 2; // Start position

    // Generate heightmap and colors
    let vertexIndex = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      // Generate height using fractal brownian motion
      const noiseValue = this.noise.fbm(
        x * noiseScale,
        z * noiseScale,
        octaves,
        persistence
      );

      // Remap from (-1, 1) to (0, 1) so terrain is always above Y=0
      const normalizedNoise = (noiseValue + 1) / 2;
      const height = normalizedNoise * heightScale;

      // Set Z position (height) - before rotation, Z becomes Y
      positions[i + 2] = height;

      // Store in grid array for fast lookup
      this.heightGrid[vertexIndex] = height;
      vertexIndex++;

      // Generate color based on height (biome coloring)
      const color = this.getTerrainColor(height, heightScale);
      colors.push(color.r, color.g, color.b);
    }

    // Add vertex colors
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Recompute normals for proper lighting
    geometry.computeVertexNormals();

    // Create material with vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Create mesh
    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.terrain.receiveShadow = true;

    // Add to scene
    this.renderer.addToScene(this.terrain);
  }

  /**
   * Get terrain color based on height (simple biome system)
   */
  getTerrainColor(height, maxHeight) {
    const normalized = height / maxHeight; // 0 to 1

    if (this.currentStyle === 'fantasy') {
      // Fantasy dreamlike colors - vibrant purples, pinks, blues
      if (normalized < 0.2) {
        // Low areas - deep purple
        return new THREE.Color(0x4a148c);
      } else if (normalized < 0.4) {
        // Mid-low - violet
        return new THREE.Color(0x7b1fa2);
      } else if (normalized < 0.6) {
        // Mid - pink/magenta
        return new THREE.Color(0xc2185b);
      } else if (normalized < 0.75) {
        // Mid-high - cyan/turquoise
        return new THREE.Color(0x00acc1);
      } else if (normalized < 0.9) {
        // High - bright blue
        return new THREE.Color(0x1e88e5);
      } else {
        // Peaks - glowing white/cyan
        return new THREE.Color(0xe0f7fa);
      }
    } else {
      // Normal terrain colors
      if (normalized < 0.3) {
        // Low areas - dark green (valleys/forests)
        return new THREE.Color(0x2d5016);
      } else if (normalized < 0.5) {
        // Mid areas - grass green
        return new THREE.Color(0x4a7c23);
      } else if (normalized < 0.7) {
        // Higher areas - lighter green
        return new THREE.Color(0x6b9940);
      } else if (normalized < 0.85) {
        // Mountain slopes - brown/gray
        return new THREE.Color(0x8b7355);
      } else {
        // Peaks - gray/white (rocky/snow)
        return new THREE.Color(0xa0a0a0);
      }
    }
  }

  /**
   * Place trees and rocks on the terrain
   */
  placeObjects() {
    const { size, minSlope } = this.config;

    if (this.currentStyle === 'fantasy') {
      // Place fantasy objects (crystals and mushrooms)
      const { crystalCount, mushroomCount } = this.config;

      // Place crystals
      for (let i = 0; i < crystalCount; i++) {
        const x = (Math.random() - 0.5) * size * 0.8;
        const z = (Math.random() - 0.5) * size * 0.8;
        const height = this.getHeightAt(x, z);
        const slope = this.getSlopeAt(x, z);

        // Place crystals on any terrain
        if (slope < minSlope + 0.2) {
          this.placeCrystal(x, height, z);
        }
      }

      // Place glowing mushrooms
      for (let i = 0; i < mushroomCount; i++) {
        const x = (Math.random() - 0.5) * size * 0.8;
        const z = (Math.random() - 0.5) * size * 0.8;
        const height = this.getHeightAt(x, z);
        const slope = this.getSlopeAt(x, z);

        // Mushrooms prefer gentle slopes and lower areas
        if (slope < minSlope && height < 25) {
          this.placeMushroom(x, height, z);
        }
      }
    } else {
      // Place normal objects (trees and rocks)
      const { treeCount, rockCount } = this.config;

      // Place trees
      for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * size * 0.8;
        const z = (Math.random() - 0.5) * size * 0.8;
        const height = this.getHeightAt(x, z);
        const slope = this.getSlopeAt(x, z);

        // Only place trees on gentle slopes and lower elevations
        if (slope < minSlope && height < 15) {
          this.placeTree(x, height, z);
        }
      }

      // Place rocks
      for (let i = 0; i < rockCount; i++) {
        const x = (Math.random() - 0.5) * size * 0.8;
        const z = (Math.random() - 0.5) * size * 0.8;
        const height = this.getHeightAt(x, z);

        this.placeRock(x, height, z);
      }
    }
  }

  /**
   * Place a tree at the given position
   */
  placeTree(x, y, z) {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f1a });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage (cone shape)
    const foliageGeometry = new THREE.ConeGeometry(2, 5, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 5.5;
    foliage.castShadow = true;
    tree.add(foliage);

    // Position tree
    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;

    // Add collision data
    this.objectColliders.push({
      x,
      z,
      radius: this.config.treeRadius,
      type: 'tree'
    });

    this.objects.push(tree);
    this.renderer.addToScene(tree);
  }

  /**
   * Place a rock at the given position
   */
  placeRock(x, y, z) {
    const size = 0.5 + Math.random() * 1.5;
    const geometry = new THREE.DodecahedronGeometry(size, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rock = new THREE.Mesh(geometry, material);

    rock.position.set(x, y + size * 0.5, z);
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;

    // Add collision data
    this.objectColliders.push({
      x,
      z,
      radius: size,
      type: 'rock'
    });

    this.objects.push(rock);
    this.renderer.addToScene(rock);
  }

  /**
   * Place a glowing crystal tower at the given position
   */
  placeCrystal(x, y, z) {
    const group = new THREE.Group();

    // Tower height and complexity
    const towerHeight = 3 + Math.random() * 5;
    const crystalCount = 4 + Math.floor(Math.random() * 6); // 4-9 crystals

    // Create shared material for all crystals in this tower
    const hue = Math.random() * 0.3; // Vary between cyan and blue
    const color = new THREE.Color().setHSL(0.5 + hue * 0.1, 1.0, 0.5);
    const emissiveColor = new THREE.Color().setHSL(0.5 + hue * 0.1, 1.0, 0.7);

    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissiveColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    // Generate crystals in a spiral tower pattern
    for (let i = 0; i < crystalCount; i++) {
      const progress = i / crystalCount;

      // Spiral positioning
      const angle = progress * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.3 + Math.random() * 0.4;
      const crystalX = Math.cos(angle) * radius * (1 - progress * 0.5);
      const crystalZ = Math.sin(angle) * radius * (1 - progress * 0.5);
      const crystalY = progress * towerHeight;

      // Crystal size - smaller as we go up
      const sizeVariation = 0.8 + Math.random() * 0.4;
      const baseSize = (1 - progress * 0.4) * sizeVariation;
      const crystalHeight = 1.5 + Math.random() * 2;

      // Create individual crystal
      const geometry = new THREE.OctahedronGeometry(0.4 * baseSize, 0);
      const crystal = new THREE.Mesh(geometry, material);

      // Position and stretch
      crystal.position.set(crystalX, crystalY + crystalHeight * 0.5, crystalZ);
      crystal.scale.set(1, crystalHeight / 0.8, 1);

      // Rotate crystals at varied angles pointing upward and outward
      crystal.rotation.set(
        (Math.random() - 0.5) * 0.5, // Slight tilt on X
        Math.random() * Math.PI * 2,   // Random Y rotation
        (Math.random() - 0.5) * 0.5    // Slight tilt on Z
      );

      crystal.castShadow = false;
      group.add(crystal);

      // Add smaller accent crystals occasionally
      if (Math.random() > 0.6 && i < crystalCount - 1) {
        const accentGeometry = new THREE.OctahedronGeometry(0.2 * baseSize, 0);
        const accent = new THREE.Mesh(accentGeometry, material);

        const accentAngle = angle + (Math.random() - 0.5) * 1.5;
        const accentRadius = radius * 0.6;
        accent.position.set(
          Math.cos(accentAngle) * accentRadius,
          crystalY + 0.5,
          Math.sin(accentAngle) * accentRadius
        );
        accent.scale.set(1, 1.2, 1);
        accent.rotation.set(
          (Math.random() - 0.5) * Math.PI,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI
        );
        accent.castShadow = false;
        group.add(accent);
      }
    }

    // Position and rotate tower
    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    // Add collision data
    this.objectColliders.push({
      x,
      z,
      radius: this.config.crystalRadius,
      type: 'crystal'
    });

    this.objects.push(group);
    this.renderer.addToScene(group);
  }

  /**
   * Place a glowing mushroom at the given position
   */
  placeMushroom(x, y, z) {
    const size = 0.5 + Math.random() * 1.5;
    const group = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.25, size * 1.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4789,
      emissive: 0x6a148c,
      emissiveIntensity: 0.8, // Increased for stronger glow
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = size * 0.75;
    stem.castShadow = false; // Disable shadows for performance
    group.add(stem);

    // Cap
    const capGeometry = new THREE.SphereGeometry(size, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xdd00dd,
      emissiveIntensity: 1.2, // Increased for stronger glow without lights
      roughness: 0.7,
      metalness: 0.3,
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = size * 1.5;
    cap.castShadow = false; // Disable shadows for performance
    group.add(cap);

    // Position and rotate
    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    // Add collision data
    this.objectColliders.push({
      x,
      z,
      radius: this.config.mushroomRadius,
      type: 'mushroom'
    });

    this.objects.push(group);
    this.renderer.addToScene(group);
  }

  /**
   * Create particle system for fantasy terrain
   */
  createParticleSystem() {
    const particleCount = 2000;
    const { size } = this.config;

    // Create buffer geometry for points
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Create circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create particle material
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texture,
    });

    this.particles = new THREE.Points(geometry, material);
    this.renderer.addToScene(this.particles);

    // Initialize particle data
    this.particleData = [];

    // Initialize all particles
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const z = (Math.random() - 0.5) * size * 0.8;
      const baseY = this.getHeightAt(x, z);
      const y = baseY + Math.random() * 25; // Stagger heights

      // Set initial position
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random rainbow color
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1.0, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Initial size (will pulsate)
      sizes[i] = 0.3 + Math.random() * 0.4; // Small: 0.3-0.7

      // Store particle data
      this.particleData.push({
        x: x,
        y: y,
        z: z,
        baseX: x,
        baseZ: z,
        baseY: baseY,
        speed: 1.0 + Math.random() * 1.5,
        life: 0,
        maxLife: 8 + Math.random() * 4,
        baseSize: sizes[i],
        pulseSpeed: 2.0 + Math.random() * 3.0,
        pulsePhase: Math.random() * Math.PI * 2,
        colorHue: hue,
      });
    }

    console.log(`✨ Spawned ${particleCount} fantasy particles`);
  }

  /**
   * Update particle system (call this each frame)
   */
  updateParticles(dt) {
    if (!this.particles || !this.particleData.length) return;

    const positions = this.particles.geometry.attributes.position.array;
    const sizes = this.particles.geometry.attributes.size.array;
    const colors = this.particles.geometry.attributes.color.array;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.particleData.length; i++) {
      const particle = this.particleData[i];

      // Update life
      particle.life += dt;

      // Move particle up
      particle.y += particle.speed * dt;

      // Slight horizontal drift
      particle.x += (Math.random() - 0.5) * 0.1 * dt;
      particle.z += (Math.random() - 0.5) * 0.1 * dt;

      // Pulsating size
      const pulseValue = Math.sin(time * particle.pulseSpeed + particle.pulsePhase);
      const pulseFactor = 0.7 + pulseValue * 0.3; // Pulsate between 0.7x and 1.0x

      // Fade out near end of life
      const lifeProgress = particle.life / particle.maxLife;
      const fadeFactor = 1.0 - Math.pow(lifeProgress, 2); // Quadratic fade

      sizes[i] = particle.baseSize * pulseFactor * fadeFactor;

      // Reset if particle exceeded lifetime or went too high
      if (particle.life >= particle.maxLife || particle.y > particle.baseY + 30) {
        particle.life = 0;

        // New random position
        particle.baseX = (Math.random() - 0.5) * this.config.size * 0.8;
        particle.baseZ = (Math.random() - 0.5) * this.config.size * 0.8;
        particle.baseY = this.getHeightAt(particle.baseX, particle.baseZ);

        particle.x = particle.baseX;
        particle.y = particle.baseY;
        particle.z = particle.baseZ;

        // New rainbow color
        particle.colorHue = Math.random();
        const color = new THREE.Color().setHSL(particle.colorHue, 1.0, 0.6);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      // Update position
      positions[i * 3] = particle.x;
      positions[i * 3 + 1] = particle.y;
      positions[i * 3 + 2] = particle.z;
    }

    // Mark for update
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Get terrain height at world position using bilinear interpolation
   */
  getHeightAt(x, z) {
    if (!this.heightGrid || this.heightGrid.length === 0) {
      return 0;
    }

    // Convert world position to grid coordinates
    const gridX = (x - this.gridMin) / this.gridSpacing;
    const gridZ = (z - this.gridMin) / this.gridSpacing;

    // Get the four surrounding grid points
    const x0 = Math.floor(gridX);
    const x1 = Math.ceil(gridX);
    const z0 = Math.floor(gridZ);
    const z1 = Math.ceil(gridZ);

    // Clamp to grid bounds
    const clampedX0 = Math.max(0, Math.min(x0, this.gridSize - 1));
    const clampedX1 = Math.max(0, Math.min(x1, this.gridSize - 1));
    const clampedZ0 = Math.max(0, Math.min(z0, this.gridSize - 1));
    const clampedZ1 = Math.max(0, Math.min(z1, this.gridSize - 1));

    // Get heights at four corners
    const h00 = this.heightGrid[clampedZ0 * this.gridSize + clampedX0];
    const h10 = this.heightGrid[clampedZ0 * this.gridSize + clampedX1];
    const h01 = this.heightGrid[clampedZ1 * this.gridSize + clampedX0];
    const h11 = this.heightGrid[clampedZ1 * this.gridSize + clampedX1];

    // Bilinear interpolation
    const fx = gridX - x0;
    const fz = gridZ - z0;

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  /**
   * Get slope at world position (for object placement)
   */
  getSlopeAt(x, z) {
    const delta = 1;
    const h1 = this.getHeightAt(x - delta, z);
    const h2 = this.getHeightAt(x + delta, z);
    const h3 = this.getHeightAt(x, z - delta);
    const h4 = this.getHeightAt(x, z + delta);

    const dx = (h2 - h1) / (delta * 2);
    const dz = (h4 - h3) / (delta * 2);

    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Get collision objects for physics
   * @returns {Array} Array of collision objects
   */
  getCollisionObjects() {
    return this.objectColliders;
  }

  /**
   * Clean up terrain and objects
   */
  cleanup() {
    if (this.terrain) {
      this.renderer.removeFromScene(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain.material.dispose();
      this.terrain = null;
    }

    for (const obj of this.objects) {
      this.renderer.removeFromScene(obj);
      obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    this.objects = [];
    this.objectColliders = [];

    // Clean up particles
    if (this.particles) {
      this.renderer.removeFromScene(this.particles);
      this.particles.geometry.dispose();
      if (this.particles.material.map) {
        this.particles.material.map.dispose();
      }
      this.particles.material.dispose();
      this.particles = null;
      this.particleData = [];
    }

    if (this.heightGrid) {
      this.heightGrid = null;
    }
  }
}
