import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createEliteGlow } from '../utils/sprites.js';
import { loadCharacterModel, CHARACTER_MODELS } from '../utils/modelLoader.js';

export class BossEnemy extends Enemy {
  constructor(engine, x, z) {
    super(engine, x, z, 'boss');
    this.isBoss = true;
    this.mixer = null;
    this.walkAnimation = null;
  }

  setupStats() {
    const wave = this.engine.game?.wave || 1;

    this.baseSpeed = 3.5;
    this.speed = 3.5;
    this.health = 10000 + wave * 2000; // Massive health pool
    this.maxHealth = this.health;
    this.damage = 40 + wave * 5;
    this.baseColor = 0x1a1a1a;

    this.attackTimer = 0;
    this.attackCooldown = 2.5;
    this.lastAttackType = null;

    // Charge attack properties
    this.isCharging = false;
    this.chargeSpeed = 25;
    this.chargeDuration = 0;
    this.chargeMaxDuration = 0.8;
    this.chargeDirection = { x: 0, z: 0 };
    this.chargeWindupTime = 0;
    this.chargeWindupDuration = 0.7;
    this.chargeRecoveryTime = 0;
    this.chargeRecoveryDuration = 0.8;

    // Movement behavior
    this.movementMode = 'chase'; // chase, circle, charge
    this.circleDirection = 1;
    this.circleTime = 0;
  }

  async createMesh() {
    try {
      // Load boss 3D model
      const { scene: model, animations } = await loadCharacterModel(CHARACTER_MODELS.boss);
      model.scale.set(3.0, 3.0, 3.0); // Boss is much larger
      model.rotation.y = Math.PI;

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
          this.walkAnimation.play(); // Boss is always moving
        }
      }

      // Add red glow for boss (raised up so it doesn't hide ground effects)
      const glowTexture = createEliteGlow();
      const glowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        color: 0xff0000,
        depthWrite: false, // Don't write to depth buffer
        depthTest: false // Don't test depth, always render behind
      });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(8, 8, 1); // Smaller, less obtrusive glow
      glow.position.y = 3.5; // Raised up to chest level
      glow.renderOrder = -1; // Render behind other objects
      this.mesh.add(glow);
      this.glowMesh = glow;

      // Add to scene after mesh is ready
      if (this.engine && this.engine.scene) {
        this.engine.scene.add(this.mesh);
      }
    } catch (error) {
      // Fallback to sprite
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
      sprite.scale.set(8, 8, 1); // Much larger sprite fallback

      this.mesh = sprite;
    }
  }

  update(dt) {
    if (!this.active) return;
    if (!this.mesh) return; // Wait for mesh to load

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(dt);
    }

    const player = this.engine.game?.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Handle charge recovery (boss stays still after charge)
    if (this.chargeRecoveryTime > 0) {
      this.chargeRecoveryTime -= dt;

      // Gradually return to normal scale
      const recoveryProgress = 1 - (this.chargeRecoveryTime / this.chargeRecoveryDuration);
      const scaleY = 1.0 + (0.2 - 0.2 * recoveryProgress); // 1.2 -> 1.0
      this.mesh.scale.set(3.0, 3.0 * scaleY, 3.0);

      if (this.glowMesh) {
        this.glowMesh.material.opacity = 0.25 + Math.sin(this.engine.time * 4) * 0.15;
        this.glowMesh.scale.set(8, 8, 1);
      }

      // Rotate to face player during recovery
      if (dist > 0) {
        const targetRotation = Math.atan2(dx, dz);
        this.mesh.rotation.y = targetRotation;
      }

      if (this.chargeRecoveryTime <= 0) {
        this.movementMode = 'circle';
        this.circleTime = 2;
        this.mesh.scale.set(3.0, 3.0, 3.0); // Ensure normal scale
      }

      this.mesh.position.x = this.x;
      this.mesh.position.y = 0;
      this.mesh.position.z = this.z;
      return;
    }

    // Handle charge windup (boss crouches like a sprinter)
    if (this.chargeWindupTime > 0) {
      this.chargeWindupTime -= dt;

      // Crouch animation - compress on Y axis, stretch on X/Z slightly
      const windupProgress = 1 - (this.chargeWindupTime / this.chargeWindupDuration);
      const crouchAmount = Math.sin(windupProgress * Math.PI); // 0 -> 1 -> 0 smooth curve
      const scaleY = 1.0 - crouchAmount * 0.3; // Crouch down 30%
      const scaleXZ = 1.0 + crouchAmount * 0.1; // Widen slightly
      this.mesh.scale.set(3.0 * scaleXZ, 3.0 * scaleY, 3.0 * scaleXZ);

      if (this.glowMesh) {
        this.glowMesh.material.opacity = 0.6 + Math.sin(this.engine.time * 20) * 0.3;
        this.glowMesh.scale.set(10, 10, 1);
      }

      // Rotate to face player during windup
      if (dist > 0) {
        const targetRotation = Math.atan2(dx, dz);
        this.mesh.rotation.y = targetRotation;
      }

      if (this.chargeWindupTime <= 0) {
        // Start charge - stretch forward
        this.isCharging = true;
        this.chargeDuration = this.chargeMaxDuration;
        this.mesh.scale.set(3.0, 3.0 * 1.2, 3.0); // Stretch vertically during charge
        if (dist > 0) {
          this.chargeDirection.x = dx / dist;
          this.chargeDirection.z = dz / dist;
        }
      }

      this.mesh.position.x = this.x;
      this.mesh.position.y = 0;
      this.mesh.position.z = this.z;
      return;
    }

    // Handle charge movement
    if (this.isCharging) {
      this.chargeDuration -= dt;

      if (this.chargeDuration <= 0) {
        // End charge, enter recovery
        this.isCharging = false;
        this.chargeRecoveryTime = this.chargeRecoveryDuration;
      } else {
        // Move at high speed in charge direction
        const newX = this.x + this.chargeDirection.x * this.chargeSpeed * dt;
        const newZ = this.z + this.chargeDirection.z * this.chargeSpeed * dt;

        const game = this.engine.game;
        if (game && game.levelSystem) {
          const collision = game.levelSystem.checkCollision(newX, newZ, 2.0);
          if (collision.collided) {
            // Stop charge on collision, enter recovery
            this.isCharging = false;
            this.chargeRecoveryTime = this.chargeRecoveryDuration;
          } else {
            this.x = newX;
            this.z = newZ;
          }
        } else {
          this.x = newX;
          this.z = newZ;
        }
      }

      this.mesh.position.x = this.x;
      this.mesh.position.y = 0;
      this.mesh.position.z = this.z;

      if (this.glowMesh) {
        this.glowMesh.material.opacity = 0.8;
        this.glowMesh.scale.set(12, 12, 1);
      }
      return;
    }

    // Normal movement
    if (dist > 0) {
      let moveX = 0, moveZ = 0;

      if (this.movementMode === 'circle') {
        this.circleTime -= dt;
        if (this.circleTime <= 0) {
          this.movementMode = 'chase';
        }

        // Circle around player
        const perpX = -dz / dist;
        const perpZ = dx / dist;
        moveX = (dx / dist) * 0.3 + perpX * this.circleDirection;
        moveZ = (dz / dist) * 0.3 + perpZ * this.circleDirection;

        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (mag > 0) {
          moveX /= mag;
          moveZ /= mag;
        }
      } else {
        // Chase player
        moveX = dx / dist;
        moveZ = dz / dist;
      }

      // Calculate new position
      const newX = this.x + moveX * this.speed * dt;
      const newZ = this.z + moveZ * this.speed * dt;

      // Check collision with level objects
      let finalX = newX;
      let finalZ = newZ;

      const game = this.engine.game;
      if (game && game.levelSystem) {
        const collision = game.levelSystem.checkCollision(newX, newZ, 2.0);
        if (collision.collided) {
          // Push boss back from collision
          finalX = newX + collision.pushX * 0.5;
          finalZ = newZ + collision.pushZ * 0.5;
        }
      }

      this.x = finalX;
      this.z = finalZ;

      // Rotate to face player
      const targetRotation = Math.atan2(dx, dz);
      this.mesh.rotation.y = targetRotation;
    }

    this.mesh.position.x = this.x;
    this.mesh.position.y = 0;
    this.mesh.position.z = this.z;

    // Ensure normal scale during normal movement
    this.mesh.scale.set(3.0, 3.0, 3.0);

    if (this.glowMesh && !this.isCharging) {
      this.glowMesh.material.opacity = 0.25 + Math.sin(this.engine.time * 4) * 0.15;
      this.glowMesh.scale.set(8, 8, 1);
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

    // Don't attack during charge windup, charge, or recovery
    if (this.chargeWindupTime > 0 || this.isCharging || this.chargeRecoveryTime > 0) return;

    const rand = Math.random();
    let attackType;

    // Check if in Boss Rush mode - don't summon minions
    const isBossRush = this.engine.game?.levelSystem?.currentLevel?.name === 'Boss Rush';

    // Weighted attack selection
    if (isBossRush) {
      // Boss Rush: Only use charge, projectile, and shockwave
      if (rand < 0.4) {
        attackType = 'charge';
      } else if (rand < 0.75) {
        attackType = 'projectile';
      } else {
        attackType = 'shockwave';
      }
    } else {
      // Normal mode: Include summon
      if (rand < 0.35) {
        attackType = 'charge';
      } else if (rand < 0.65) {
        attackType = 'projectile';
      } else if (rand < 0.85) {
        attackType = 'shockwave';
      } else {
        attackType = 'summon';
      }
    }

    // Avoid repeating the same attack
    if (attackType === this.lastAttackType && Math.random() > 0.5) {
      attackType = rand < 0.5 ? 'projectile' : 'shockwave';
    }

    this.lastAttackType = attackType;

    if (attackType === 'charge') {
      this.initiateCharge();
    } else if (attackType === 'projectile') {
      this.fireProjectile();
    } else if (attackType === 'shockwave') {
      this.createShockwave();
    } else {
      this.summonMinions();
    }
  }

  initiateCharge() {
    // Start charge windup
    this.chargeWindupTime = this.chargeWindupDuration;
    this.movementMode = 'chase';
  }

  fireProjectile() {
    const player = this.engine.game?.player;
    if (!player) return;

    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist === 0) return;

    // Fire 1-3 projectiles
    const projectileCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < projectileCount; i++) {
      const spreadAngle = (i - (projectileCount - 1) / 2) * 0.3;
      const angle = Math.atan2(dx, dz) + spreadAngle;

      const dirX = Math.sin(angle);
      const dirZ = Math.cos(angle);

      this.createBossProjectile(dirX, dirZ);
    }
  }

  createBossProjectile(dirX, dirZ) {
    // Create large, slow-moving projectile
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw a large bright red/orange energy ball with glow
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, '#ffff00'); // Bright yellow center
    gradient.addColorStop(0.3, '#ff4400'); // Orange-red
    gradient.addColorStop(0.6, '#ff0000'); // Red
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0)'); // Transparent dark red
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    // Add inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 15, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 4, 1); // Larger and more visible

    const projectile = {
      mesh: sprite,
      x: this.x,
      z: this.z,
      dirX: dirX,
      dirZ: dirZ,
      speed: 8,
      damage: 25,
      lifetime: 5,
      age: 0,
      active: true,
      isBossProjectile: true
    };

    sprite.position.set(this.x, 1.5, this.z);
    this.engine.scene.add(sprite);

    // Add update logic
    const originalUpdate = projectile.update;
    projectile.update = (dt) => {
      if (!projectile.active) return;

      projectile.age += dt;
      if (projectile.age > projectile.lifetime) {
        projectile.active = false;
        this.engine.scene.remove(sprite);
        return;
      }

      projectile.x += projectile.dirX * projectile.speed * dt;
      projectile.z += projectile.dirZ * projectile.speed * dt;

      sprite.position.x = projectile.x;
      sprite.position.z = projectile.z;

      // Pulsing effect
      const scale = 4 + Math.sin(projectile.age * 8) * 0.4;
      sprite.scale.set(scale, scale, 1);

      // Check collision with player
      const player = this.engine.game?.player;
      if (player) {
        const dx = player.x - projectile.x;
        const dz = player.z - projectile.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 2.0) {
          const godMode = this.engine.game?.godMode;
          if (!godMode && player.takeDamage(projectile.damage, 'Boss projectile')) {
            // Player died
            if (this.engine.game) {
              this.engine.game.gameOver = true;
              this.engine.pause();
              this.engine.sound.playDeath();

              // Save progress on game over
              if (this.engine.game.saveSystem) {
                this.engine.game.saveSystem.saveProgress(this.engine.game.wave, this.engine.game.killCount);
              }

              if (this.engine.game.onGameOver) {
                this.engine.game.onGameOver({
                  time: Math.floor(this.engine.time),
                  kills: this.engine.game.killCount,
                  wave: this.engine.game.wave,
                  highestWave: this.engine.game.saveSystem?.getHighestWave() || 0,
                  totalKills: this.engine.game.saveSystem?.getTotalKills() || 0
                });
              }
            }
          }
          projectile.active = false;
          this.engine.scene.remove(sprite);
        }
      }
    };

    this.engine.addEntity(projectile);
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
    let hasHitPlayer = false; // Prevent multiple hits from same shockwave
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

        if (!hasHitPlayer && Math.abs(dist - waveRadius) < 1 && time > 0.2) {
          hasHitPlayer = true;
          const godMode = this.engine.game?.godMode;
          if (!godMode && this.engine.game.player.takeDamage(15, 'Boss shockwave attack')) {
            // Player died
            this.engine.game.gameOver = true;
            this.engine.pause();
            this.engine.sound.playDeath();

            // Save progress on game over
            if (this.engine.game.saveSystem) {
              this.engine.game.saveSystem.saveProgress(this.engine.game.wave, this.engine.game.killCount);
            }

            if (this.engine.game.onGameOver) {
              this.engine.game.onGameOver({
                time: Math.floor(this.engine.time),
                kills: this.engine.game.killCount,
                wave: this.engine.game.wave,
                highestWave: this.engine.game.saveSystem?.getHighestWave() || 0,
                totalKills: this.engine.game.saveSystem?.getTotalKills() || 0
              });
            }
          }
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

    // Only trigger victory if not in survival mode and all waves are complete
    const isSurvival = this.engine.game?.levelConfig?.isSurvival;
    const allWavesComplete = this.engine.game?.waveSystem?.allWavesCompleted;

    if (!isSurvival && allWavesComplete && this.engine.game && this.engine.game.onVictory) {
      this.engine.game.onVictory({
        time: Math.floor(this.engine.time),
        kills: this.engine.game.killCount,
        level: this.engine.game.currentLevelName
      });
    }

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
