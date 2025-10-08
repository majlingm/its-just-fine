import * as THREE from 'three';
import { Entity } from './Entity.js';
import { createEnemySprite, createEliteGlow } from '../utils/sprites.js';
import { loadCharacterModel, CHARACTER_MODELS } from '../utils/modelLoader.js';
import { EnemyProjectile } from './EnemyProjectile.js';

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
      skeleton_mage: { health: 90, speed: 2.3, damage: 18, color: 0x8888cc }
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

      // Rotate to face player
      const targetRotation = Math.atan2(dx, dz);
      this.mesh.rotation.y = targetRotation;
    }

    const bobAmount = Math.sin(this.walkCycle) * 0.1;

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

    const projectile = new EnemyProjectile(
      this.engine,
      projectileX,
      projectileY,
      projectileZ,
      finalDirX,
      finalDirZ,
      this.projectileDamage,
      this.projectileSpeed
    );

    this.engine.addEntity(projectile);

    // Play sound effect if available
    if (this.engine.sound && this.engine.sound.playShoot) {
      this.engine.sound.playShoot();
    }
  }

  takeDamage(amount) {
    this.health -= amount;

    // Track total damage dealt
    if (this.engine.game) {
      this.engine.game.totalDamageDealt += amount;
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
