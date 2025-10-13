import * as THREE from 'three';
import { Entity } from './Entity.js';
import { createEnemySprite, createEliteGlow } from '../utils/sprites.js';
import { loadCharacterModel, CHARACTER_MODELS } from '../utils/modelLoader.js';
import { DamageNumber } from '../effects/DamageNumber.js';
import { gameSettings } from '../systems/GameSettings.js';
import { createShadowSilhouetteMaterial } from '../shaders/ShadowSilhouetteShader.js';

export class Enemy extends Entity {
  constructor(engine, x, z, type = 'bandit') {
    super();
    this.engine = engine;
    this.x = x;
    this.z = z;
    this.type = type;
    this.isElite = false;
    this.eliteAffix = null;
    this.walkCycle = Math.random() * Math.PI * 2; // Random start for variety
    this.mixer = null;
    this.walkAnimation = null;
    this.shaderMaterial = null; // For shadow type
    this.timeOffset = Math.random() * 100; // For shadow animation
    this.setupStats();
    this.createMesh();
  }

  setupStats() {
    const wave = this.engine.game?.wave || 1;

    const typeStats = {
      bandit: { health: 100, speed: 3, damage: 12, color: 0x2d2d2d },
      coyote: { health: 60, speed: 5, damage: 8, color: 0xd2691e },
      brute: { health: 240, speed: 1.5, damage: 25, color: 0x4a1a1a },
      gunman: { health: 80, speed: 2.5, damage: 15, color: 0x3a3a5a },
      charger: { health: 120, speed: 2, damage: 18, color: 0x5a3a1a },
      tiny: { health: 40, speed: 6, damage: 6, color: 0x3a2a1a },
      giant: { health: 400, speed: 1.2, damage: 35, color: 0x5a1a1a },
      skeleton_warrior: { health: 140, speed: 2.8, damage: 20, color: 0xcccccc },
      skeleton_mage: { health: 90, speed: 2.3, damage: 18, color: 0x8888cc },
      // Shadow variations - 9 different types
      shadow: { health: 120, speed: 2.0, damage: 18, color: 0x000000 }, // Original: Large, slow, tanky
      shadow_lurker: { health: 60, speed: 3.5, damage: 12, color: 0x1a0a0a }, // Small, fast, weak
      shadow_titan: { health: 300, speed: 1.2, damage: 30, color: 0x000000 }, // Huge, very slow, boss-like
      shadow_wraith: { health: 80, speed: 4.0, damage: 15, color: 0x0a0000 }, // Medium, very fast, red tint
      shadow_colossus: { health: 200, speed: 1.5, damage: 25, color: 0x050000 }, // Large, slow, dark red
      shadow_flicker: { health: 40, speed: 5.0, damage: 8, color: 0x1a0000 }, // Tiny, extremely fast, red
      shadow_void: { health: 150, speed: 1.8, damage: 22, color: 0x000000 }, // Large, slow, pure black
      shadow_crawler: { health: 70, speed: 4.5, damage: 10, color: 0x0a0000 }, // Fast spider-like crawler
      shadow_serpent: { health: 90, speed: 3.0, damage: 14, color: 0x1a0000 }, // Medium worm/serpent crawler
      // Light variations - white counterparts with black outlines
      light: { health: 120, speed: 2.0, damage: 18, color: 0xffffff }, // White version of shadow
      light_lurker: { health: 60, speed: 3.5, damage: 12, color: 0xf5f5f5 }, // White version of shadow_lurker
      light_titan: { health: 300, speed: 1.2, damage: 30, color: 0xffffff }, // White version of shadow_titan
      light_wraith: { health: 80, speed: 4.0, damage: 15, color: 0xfff5f5 }, // White version of shadow_wraith
      light_colossus: { health: 200, speed: 1.5, damage: 25, color: 0xfffaf0 }, // White version of shadow_colossus
      light_flicker: { health: 40, speed: 5.0, damage: 8, color: 0xfff5f0 }, // White version of shadow_flicker
      light_void: { health: 150, speed: 1.8, damage: 22, color: 0xffffff }, // White version of shadow_void
      light_crawler: { health: 70, speed: 4.5, damage: 10, color: 0xfff5f5 }, // White version of shadow_crawler
      light_serpent: { health: 90, speed: 3.0, damage: 14, color: 0xfff5f0 } // White version of shadow_serpent
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

    // Ranged attack properties (will be overridden by level settings)
    this.canShoot = false; // Default to false, level settings will enable
    this.shootTimer = 0;
    this.shootCooldown = 3.0 + Math.random() * 2.0; // 3-5 second cooldown
    this.shootRange = 15; // Only shoot if player is within this range
    this.projectileSpeed = 8; // Slow, dodgable projectiles
    this.projectileDamage = 15;

    // Freeze effect state
    this.isFrozen = false;
    this.freezeTimer = 0;
    this.freezeGlow = null;
  }

  async createMesh() {
    // Special case: all shadow and light types use custom shader instead of 3D model
    if (this.type.startsWith('shadow') || this.type.startsWith('light')) {
      this.createShadowMesh();
      return;
    }

    try {
      // Load 3D model based on enemy type
      const characterName = CHARACTER_MODELS[this.type] || CHARACTER_MODELS.bandit;
      const { scene: model, animations } = await loadCharacterModel(characterName);

      // Scale based on enemy type (all 1.5x larger)
      let scale = 1.05; // 0.7 * 1.5
      if (this.type === 'brute') {
        scale = 1.8; // 1.2 * 1.5
      } else if (this.type === 'coyote') {
        scale = 0.75; // 0.5 * 1.5
      } else if (this.type === 'tiny') {
        scale = 0.45; // 0.3 * 1.5
      } else if (this.type === 'giant') {
        scale = 2.7; // 1.8 * 1.5
      } else if (this.type === 'skeleton_warrior' || this.type === 'skeleton_mage') {
        scale = 1.2; // 0.8 * 1.5
      }

      model.scale.set(scale, scale, scale);
      model.rotation.y = Math.PI; // Face forward

      // Skeleton models need to be raised significantly (their origin is at the ground)
      if (this.type === 'skeleton_warrior' || this.type === 'skeleton_mage') {
        // Calculate the bounding box to find the height
        const box = new THREE.Box3().setFromObject(model);
        const height = box.max.y - box.min.y;

        // Raise the model so its bottom is at y=0 (ground level)
        // Since the model's pivot is at y=0, we need to offset it by half its height
        model.position.y = height * 0.5;
      }

      this.mesh = model;

      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Set up animation mixer if animations exist
      if (animations && animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);

        // Play walk animation if it exists
        const walkAnim = animations.find(clip =>
          clip.name.toLowerCase().includes('walk') ||
          clip.name.toLowerCase().includes('run')
        ) || animations[0];

        if (walkAnim) {
          this.walkAnimation = this.mixer.clipAction(walkAnim);
          this.walkAnimation.setLoop(THREE.LoopRepeat);

          // Adjust animation speed based on enemy type
          if (this.type === 'brute') {
            // Zombie walks slowly and stiffly
            this.walkAnimation.timeScale = 0.4;
          } else if (this.type === 'coyote') {
            // Coyote runs fast
            this.walkAnimation.timeScale = 1.5;
          } else if (this.type === 'charger') {
            // Charger has medium-fast animation
            this.walkAnimation.timeScale = 1.2;
          } else if (this.type === 'tiny') {
            // Tiny enemies move very fast
            this.walkAnimation.timeScale = 1.8;
          } else if (this.type === 'giant') {
            // Giants move slowly
            this.walkAnimation.timeScale = 0.5;
          } else if (this.type === 'skeleton_warrior') {
            // Skeleton warriors move at normal pace
            this.walkAnimation.timeScale = 1.1;
          } else if (this.type === 'skeleton_mage') {
            // Skeleton mages move slightly slower
            this.walkAnimation.timeScale = 0.9;
          } else {
            // Default speed for bandits and gunmen
            this.walkAnimation.timeScale = 1.0;
          }

          this.walkAnimation.play(); // Enemies are always moving
        }
      }

      // Add to scene after mesh is ready
      if (this.engine && this.engine.scene) {
        this.engine.scene.add(this.mesh);
      }
    } catch (error) {
      // Fallback to sprite
      const texture = createEnemySprite(this.type);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(material);

      if (this.type === 'brute') {
        sprite.scale.set(3.75, 3.75, 1); // 2.5 * 1.5
      } else if (this.type === 'coyote') {
        sprite.scale.set(2.25, 2.25, 1); // 1.5 * 1.5
      } else {
        sprite.scale.set(3, 3, 1); // 2 * 1.5
      }

      this.mesh = sprite;
    }
  }

  createShadowMesh() {
    // Detect mobile for brighter outline (no width check - all mobile devices)
    const isMobile = /iPhone|iPod|Android|iPad/i.test(navigator.userAgent);
    const isNativeApp = window.Capacitor !== undefined;
    const outlineColorValue = (isMobile || isNativeApp) ? 0x888888 : 0x0d0d0d; // Much brighter on mobile/app

    // Different sizes and properties for each shadow type
    const shadowConfig = {
      // Regular humanoid shadow - smooth black with red eyes
      shadow: {
        width: 2.5, height: 4.0,
        eyeColor: 0xff0000, eyeSize: 0.04,
        flowSpeed: 1.0, flowAmp: 1.0,
        waveCount: 2, waveType: 0, shapeType: 0,
        baseColor: 0x000000, gradientColor: 0x000000,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // Small blob creature - sharp chaotic waves, black/dark red
      shadow_lurker: {
        width: 1.5, height: 2.5,
        eyeColor: 0xff3333, eyeSize: 0.03,
        flowSpeed: 1.5, flowAmp: 1.2,
        waveCount: 3, waveType: 1, shapeType: 2,
        baseColor: 0x000000, gradientColor: 0x330000,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // Huge slow humanoid - pulsing waves, pure black
      shadow_titan: {
        width: 4.0, height: 6.0,
        eyeColor: 0xff0000, eyeSize: 0.06,
        flowSpeed: 0.5, flowAmp: 0.8,
        waveCount: 1, waveType: 2, shapeType: 0,
        baseColor: 0x000000, gradientColor: 0x000000,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // Tall thin wraith - smooth waves, BLACK TO RED GRADIENT with red eyes
      shadow_wraith: {
        width: 2.0, height: 4.5,
        eyeColor: 0xff0000, eyeSize: 0.025,
        flowSpeed: 2.0, flowAmp: 1.5,
        waveCount: 3, waveType: 0, shapeType: 3,
        baseColor: 0x000000, gradientColor: 0xff0000,  // Black to red!
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // Large tanky humanoid - smooth waves, dark
      shadow_colossus: {
        width: 3.5, height: 5.0,
        eyeColor: 0xdd0000, eyeSize: 0.05,
        flowSpeed: 0.7, flowAmp: 0.9,
        waveCount: 2, waveType: 0, shapeType: 0,
        baseColor: 0x000000, gradientColor: 0x1a0000,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // Tiny blob - sharp chaotic, dark red tint
      shadow_flicker: {
        width: 1.0, height: 1.8,
        eyeColor: 0xff5555, eyeSize: 0.02,
        flowSpeed: 2.5, flowAmp: 1.8,
        waveCount: 3, waveType: 1, shapeType: 2,
        baseColor: 0x1a0000, gradientColor: 0x330000,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // DOCTOR SHAPE - lab coat silhouette, BLACK TO RED GRADIENT with WHITE EYES!
      shadow_void: {
        width: 3.0, height: 4.5,
        eyeColor: 0xffffff, eyeSize: 0.045,  // White eyes!
        flowSpeed: 0.6, flowAmp: 0.7,
        waveCount: 1, waveType: 0, shapeType: 1,  // Doctor shape!
        baseColor: 0x000000, gradientColor: 0xaa0000,  // Black to red!
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // CRAWLER - spider-like low to ground, sharp chaotic waves
      shadow_crawler: {
        width: 3.5, height: 1.5,  // Wide and short!
        eyeColor: 0xff3333, eyeSize: 0.06,  // Large spider eyes!
        flowSpeed: 0.5, flowAmp: 1.3,
        waveCount: 1, waveType: 0, shapeType: 4,  // Spider crawler shape!
        baseColor: 0x000000, gradientColor: 0x220000,
        isCrawler: true,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // SERPENT - worm/snake crawler, smooth undulating waves
      shadow_serpent: {
        width: 4.0, height: 1.2,  // Very wide and flat!
        eyeColor: 0xff1111, eyeSize: 0.025,
        flowSpeed: 1.5, flowAmp: 1.1,
        waveCount: 2, waveType: 0, shapeType: 5,  // Serpent shape!
        baseColor: 0x1a0000, gradientColor: 0x330000,
        isCrawler: true,
        outlineColor: outlineColorValue, outlineWidth: 0.05
      },
      // LIGHT VARIATIONS - White/gray counterparts with red and black eyes
      // Regular humanoid light - smooth white with red eyes
      light: {
        width: 2.5, height: 4.0,
        eyeColor: 0xff0000, eyeSize: 0.04,
        flowSpeed: 1.0, flowAmp: 1.0,
        waveCount: 2, waveType: 0, shapeType: 0,
        baseColor: 0xffffff, gradientColor: 0xdddddd,  // White to light gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // Small blob creature - sharp chaotic waves, white/gray
      light_lurker: {
        width: 1.5, height: 2.5,
        eyeColor: 0xff3333, eyeSize: 0.03,
        flowSpeed: 1.5, flowAmp: 1.2,
        waveCount: 3, waveType: 1, shapeType: 2,
        baseColor: 0xffffff, gradientColor: 0xcccccc,  // White to gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // Huge slow humanoid - pulsing waves, pure white
      light_titan: {
        width: 4.0, height: 6.0,
        eyeColor: 0xff0000, eyeSize: 0.06,
        flowSpeed: 0.5, flowAmp: 0.8,
        waveCount: 1, waveType: 2, shapeType: 0,
        baseColor: 0xffffff, gradientColor: 0xeeeeee,  // Pure white to light gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // Tall thin wraith - smooth waves, WHITE TO GRAY GRADIENT with red eyes
      light_wraith: {
        width: 2.0, height: 4.5,
        eyeColor: 0xff0000, eyeSize: 0.025,
        flowSpeed: 2.0, flowAmp: 1.5,
        waveCount: 3, waveType: 0, shapeType: 3,
        baseColor: 0xffffff, gradientColor: 0xaaaaaa,  // White to gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // Large tanky humanoid - smooth waves, light gray
      light_colossus: {
        width: 3.5, height: 5.0,
        eyeColor: 0xdd0000, eyeSize: 0.05,
        flowSpeed: 0.7, flowAmp: 0.9,
        waveCount: 2, waveType: 0, shapeType: 0,
        baseColor: 0xffffff, gradientColor: 0xbbbbbb,  // White to medium gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // Tiny blob - sharp chaotic, light gray tint
      light_flicker: {
        width: 1.0, height: 1.8,
        eyeColor: 0xff5555, eyeSize: 0.02,
        flowSpeed: 2.5, flowAmp: 1.8,
        waveCount: 3, waveType: 1, shapeType: 2,
        baseColor: 0xffffff, gradientColor: 0xcccccc,  // White to gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // ANGEL SHAPE - white silhouette, WHITE TO GRAY GRADIENT with BLACK EYES!
      light_void: {
        width: 3.0, height: 4.5,
        eyeColor: 0x000000, eyeSize: 0.045,  // Black eyes for contrast
        flowSpeed: 0.6, flowAmp: 0.7,
        waveCount: 1, waveType: 0, shapeType: 1,  // Doctor/Angel shape!
        baseColor: 0xffffff, gradientColor: 0xbbbbbb,  // White to gray
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // CRAWLER - spider-like low to ground, sharp chaotic waves
      light_crawler: {
        width: 3.5, height: 1.5,  // Wide and short!
        eyeColor: 0xff3333, eyeSize: 0.06,  // Large red spider eyes!
        flowSpeed: 0.5, flowAmp: 1.3,
        waveCount: 1, waveType: 0, shapeType: 4,  // Spider crawler shape!
        baseColor: 0xffffff, gradientColor: 0xcccccc,  // White to gray
        isCrawler: true,
        outlineColor: 0x000000, outlineWidth: 0.08
      },
      // SERPENT - worm/snake crawler, smooth undulating waves
      light_serpent: {
        width: 4.0, height: 1.2,  // Very wide and flat!
        eyeColor: 0xff1111, eyeSize: 0.025,
        flowSpeed: 1.5, flowAmp: 1.1,
        waveCount: 2, waveType: 0, shapeType: 5,  // Serpent shape!
        baseColor: 0xffffff, gradientColor: 0xdddddd,  // White to light gray
        isCrawler: true,
        outlineColor: 0x000000, outlineWidth: 0.08
      }
    };

    const config = shadowConfig[this.type] || shadowConfig.shadow;

    // High resolution for smooth liquid distortion
    const geometry = new THREE.PlaneGeometry(config.width, config.height, 64, 64);

    // Create the shadow silhouette material with unique properties
    const fuzzyAmount = 0.6;
    this.shaderMaterial = createShadowSilhouetteMaterial(
      config.eyeColor,
      fuzzyAmount,
      config.eyeSize,
      config.flowSpeed,
      config.flowAmp,
      config.waveCount,
      config.waveType,
      config.shapeType,
      config.baseColor,
      config.gradientColor,
      config.isCrawler || false,
      config.outlineColor,
      config.outlineWidth
    );

    this.mesh = new THREE.Mesh(geometry, this.shaderMaterial);

    // Position and rotate to face camera (billboard style)
    this.mesh.position.set(this.x, config.height / 2, this.z);

    // Crawlers need to lay flat on the ground
    if (config.isCrawler) {
      this.mesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees to lay flat
    }

    // No shadows for shadow creatures
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    if (this.engine && this.engine.scene) {
      this.engine.scene.add(this.mesh);
    }
  }

  makeElite(affix) {
    this.isElite = true;
    this.eliteAffix = affix;

    this.health *= 3;
    this.maxHealth = this.health;
    this.damage *= 1.5;

    // Add glow when mesh is ready
    const addGlow = () => {
      if (!this.mesh) {
        setTimeout(addGlow, 50);
        return;
      }

      const glowTexture = createEliteGlow();
      const glowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Sprite(glowMat);
      const scale = this.mesh.scale ? this.mesh.scale.x * 1.5 : 1.5;
      glow.scale.set(scale, scale, 1);
      glow.position.y = 0.5;
      this.mesh.add(glow);
      this.glowMesh = glow;
    };

    addGlow();

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

  applyFreeze(duration = 10.0) {
    this.isFrozen = true;
    this.freezeTimer = duration;
    this.speed = this.baseSpeed * 0.2; // 20% speed when frozen (80% slower)

    // Create icy glow if not already present
    if (!this.freezeGlow && this.mesh) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(180, 240, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(120, 200, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(80, 160, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const glowMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Sprite(glowMat);
      const scale = this.mesh.scale ? this.mesh.scale.x * 1.8 : 1.8;
      glow.scale.set(scale, scale, 1);
      glow.position.y = 0.5;
      glow.renderOrder = 1000;
      this.mesh.add(glow);
      this.freezeGlow = glow;
    }
  }

  update(dt) {
    if (!this.active) return;
    if (!this.mesh) return; // Wait for mesh to load

    // Update shadow/light shader time for all shader-based types
    if ((this.type.startsWith('shadow') || this.type.startsWith('light')) && this.shaderMaterial && this.shaderMaterial.uniforms.time) {
      this.shaderMaterial.uniforms.time.value = performance.now() * 0.001 + this.timeOffset;
    }

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Handle freeze effect decay
    if (this.isFrozen) {
      this.freezeTimer -= dt;

      if (this.freezeTimer <= 0) {
        // Unfreeze
        this.isFrozen = false;
        this.freezeTimer = 0;
        this.speed = this.baseSpeed;

        // Remove freeze glow
        if (this.freezeGlow) {
          this.mesh.remove(this.freezeGlow);
          if (this.freezeGlow.material.map) {
            this.freezeGlow.material.map.dispose();
          }
          this.freezeGlow.material.dispose();
          this.freezeGlow = null;
        }
      } else if (this.freezeGlow) {
        // Pulse freeze glow
        this.freezeGlow.material.opacity = 0.5 + Math.sin(this.engine.time * 5) * 0.2;
      }
    }

    const player = this.engine.game?.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Ranged attack behavior - DISABLED FOR DEBUGGING
    // if (this.canShoot && !this.isFrozen) {
    //   this.shootTimer += dt;
    //
    //   // Only shoot if within range and cooldown is ready
    //   if (this.shootTimer >= this.shootCooldown && dist <= this.shootRange && dist > 3) {
    //     this.shootAtPlayer(player, dx, dz, dist);
    //     this.shootTimer = 0;
    //     // Randomize next cooldown slightly
    //     this.shootCooldown = 3.0 + Math.random() * 2.0;
    //   }
    // }

    // Charger behavior
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
      // Zombie (brute) has uneven, lurching movement
      let speedMultiplier = 1;
      if (this.type === 'brute') {
        // Create a lurching pattern - faster then slower
        speedMultiplier = 0.7 + Math.abs(Math.sin(this.engine.time * 2)) * 0.6;
      }

      // Calculate new position
      const newX = this.x + (dx / dist) * this.speed * dt * speedMultiplier;
      const newZ = this.z + (dz / dist) * this.speed * dt * speedMultiplier;

      // Check collision with level objects
      let finalX = newX;
      let finalZ = newZ;

      const game = this.engine.game;
      if (game && game.levelSystem) {
        const collision = game.levelSystem.checkCollision(newX, newZ, 0.5);
        if (collision.collided) {
          // Push enemy back from collision, but also try to navigate around it
          finalX = newX + collision.pushX * 0.5; // Reduce push to allow sliding
          finalZ = newZ + collision.pushZ * 0.5;
        }
      }

      this.x = finalX;
      this.z = finalZ;

      // Walking animation
      this.walkCycle += dt * this.speed * 2;

      // Rotate to face player (store for non-shadow/light or crawler types)
      const targetRotation = Math.atan2(dx, dz);

      // Only apply rotation now for non-shader-based enemies
      if (!this.type.startsWith('shadow') && !this.type.startsWith('light')) {
        this.mesh.rotation.y = targetRotation;
      }
    }

    const bobAmount = Math.sin(this.walkCycle) * 0.1;

    // Special handling for shader-based entities (2D planes - shadow and light)
    if (this.type.startsWith('shadow') || this.type.startsWith('light')) {
      // Get height from mesh (depends on variant)
      const height = this.mesh.geometry.parameters.height || 4.0;
      this.mesh.position.x = this.x;

      // Crawler types stay very close to ground
      const isCrawler = this.type.endsWith('_crawler') || this.type.endsWith('_serpent');
      if (isCrawler) {
        this.mesh.position.y = height / 2 + bobAmount * 0.3; // Minimal bobbing

        // Crawlers: Only rotate around Y axis to face player, no billboard
        const dx2 = this.engine.game.player.x - this.x;
        const dz2 = this.engine.game.player.z - this.z;
        const targetRotation = Math.atan2(dx2, dz2);
        this.mesh.rotation.y = targetRotation;
        // Keep flat on ground - no X or Z rotation
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
      } else {
        this.mesh.position.y = height / 2 + bobAmount;

        // Standing sprites: billboard effect (face camera)
        if (this.engine.camera) {
          this.mesh.lookAt(this.engine.camera.position);
        }
      }

      this.mesh.position.z = this.z;
    } else {
      // Normal 3D enemies
      this.mesh.position.x = this.x;
      this.mesh.position.y = 0 + bobAmount;
      this.mesh.position.z = this.z;

      // Zombie (brute) tilts and drags
      if (this.type === 'brute') {
        // Tilt to the side
        this.mesh.rotation.z = Math.sin(this.engine.time * 0.5) * 0.15;
        // Slight forward lean
        this.mesh.rotation.x = 0.2;
      } else {
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
      }
    }

    if (this.glowMesh) {
      this.glowMesh.material.opacity = 0.6 + Math.sin(this.engine.time * 3) * 0.2;
    }

    if (this.isElite && this.eliteAffix === 'regen') {
      this.health = Math.min(this.maxHealth, this.health + this.regenRate * dt);
    }
  }

  /**
   * Fire a projectile at the player
   * @param {object} player - Player object
   * @param {number} dx - Delta X to player
   * @param {number} dz - Delta Z to player
   * @param {number} dist - Distance to player
   */
  shootAtPlayer(player, dx, dz, dist) {
    // Normalize direction
    const dirX = dx / dist;
    const dirZ = dz / dist;

    // Add slight inaccuracy to make it dodgable
    const inaccuracy = 0.15; // ~15 degree spread
    const randomAngle = (Math.random() - 0.5) * inaccuracy;
    const cos = Math.cos(randomAngle);
    const sin = Math.sin(randomAngle);

    const finalDirX = dirX * cos - dirZ * sin;
    const finalDirZ = dirX * sin + dirZ * cos;

    // Create projectile slightly in front of enemy
    const spawnOffsetDist = 0.5;
    const projectileX = this.x + dirX * spawnOffsetDist;
    const projectileZ = this.z + dirZ * spawnOffsetDist;
    const projectileY = 0.5; // Waist height

    // Use projectile pool from game if available
    if (this.engine.game && this.engine.game.enemyProjectilePool) {
      const projectile = this.engine.game.enemyProjectilePool.acquire(
        projectileX,
        projectileY,
        projectileZ,
        finalDirX,
        finalDirZ,
        this.projectileDamage,
        this.projectileSpeed
      );
    } else {
      // Fallback (shouldn't happen in normal gameplay)
      console.warn('Enemy projectile pool not available');
    }

    // Play sound effect if available
    if (this.engine.sound && this.engine.sound.playShoot) {
      this.engine.sound.playShoot();
    }
  }

  takeDamage(amount, isCritical = false) {
    this.health -= amount;

    // Track total damage dealt
    if (this.engine.game) {
      this.engine.game.totalDamageDealt += amount;
    }

    // Show damage number if enabled
    if (gameSettings.get('gameplay.showDamageNumbers')) {
      const damageNumber = new DamageNumber(
        Math.round(amount),
        this.x,
        1.5, // Height above ground
        this.z,
        isCritical
      );
      this.engine.addEntity(damageNumber);
    }

    if (this.health <= 0) {
      this.playDeathExplosion();
      return true;
    }
    return false;
  }

  playDeathExplosion() {
    if (!this.mesh) return; // Already dead/cleaned up

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

    if (this.mesh) {
      this.mesh.visible = false;
    }
  }
}
