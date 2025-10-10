import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';
import { Projectile } from '../entities/Projectile.js';
import { DynamiteProjectile } from '../entities/DynamiteProjectile.js';
import { OrbitProjectile } from '../entities/OrbitProjectile.js';
import { Pickup } from '../entities/Pickup.js';
import { SPELL_TYPES } from '../spells/spellTypes.js';
import { upgradeWeapon, createWeaponUpgradeOption } from '../weapons/weaponUpgrades.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { ProjectilePool } from '../systems/ProjectilePool.js';
import { EnemyProjectilePool } from '../systems/EnemyProjectilePool.js';
import { LEVELS } from '../levels/index.js';

export class DustAndDynamiteGame {
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
    this.isPaused = false; // For manual pausing
    this.godMode = false; // Disabled by default (toggle with ~ key)
    this.bossSpawned = false;
    this.currentBoss = null; // Track active boss
    this.victory = false;
    this.onLevelUp = null;
    this.onGameOver = null;
    this.onVictory = null;
    this.onUpdate = null;
    this.totalDamageDealt = 0;

    // Save and level systems
    this.saveSystem = new SaveSystem();
    this.levelSystem = new LevelSystem(engine);
    this.waveSystem = new WaveSystem(this);
    this.currentLevelName = 'Desert Canyon';

    // Initialize projectile pools for performance
    this.projectilePool = new ProjectilePool(engine, 200);
    this.enemyProjectilePool = new EnemyProjectilePool(engine, 100);

    // Wave system callbacks
    this.onWaveUpdate = null; // New callback for wave UI updates

    // Enemy indicator throttling
    this.lastIndicatorUpdate = 0;
    this.indicatorUpdateInterval = 0.2; // Update 5 times per second for better responsiveness
    this.trackedEnemyId = null; // Track which enemy we're pointing at
    this.arrowPosition = null; // Store the fixed arrow position
    this.lastEnemyOnScreenTime = 0; // Track when enemies were last visible
    this.arrowDelayTime = 1; // Seconds to wait before showing arrow (reduced for testing)

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

  async start(levelName = null) {
    // Load level if specified, otherwise use default
    const level = levelName ? LEVELS[levelName] : LEVELS.DESERT_CANYON;
    this.levelConfig = level; // Store level config for wave system
    if (level) {
      await this.levelSystem.loadLevel(level);
      this.currentLevelName = level.name;

      // Initialize wave system with level's wave configuration
      if (level.waves && level.waves.length > 0) {
        this.waveSystem.init(level.waves);
        this.waveSystem.onWaveStart = (waveNum, totalWaves) => {
          if (this.onWaveUpdate) {
            this.onWaveUpdate(this.waveSystem.getWaveInfo());
          }
        };
        this.waveSystem.onWaveComplete = (waveNum, totalWaves) => {
          if (this.onWaveUpdate) {
            this.onWaveUpdate(this.waveSystem.getWaveInfo());
          }
        };
        this.waveSystem.onAllWavesComplete = () => {
          if (this.onWaveUpdate) {
            this.onWaveUpdate(this.waveSystem.getWaveInfo());
          }
        };
        this.waveSystem.onBossSpawn = () => {
          this.spawnBoss();
        };
      }
    }

    this.player = new Player(this.engine);
    this.engine.addEntity(this.player);
    this.engine.start();
  }

  async loadFromSave(saveData) {
    // Load level
    const level = LEVELS.DESERT_CANYON; // Default for now
    if (level) {
      await this.levelSystem.loadLevel(level);
      this.currentLevelName = level.name;
    }

    // Restore player state
    this.player = new Player(this.engine);
    this.player.level = saveData.player.level;
    this.player.xp = saveData.player.xp;
    this.player.xpToNext = saveData.player.xpToNext;
    this.player.health = saveData.player.health;
    this.player.maxHealth = saveData.player.maxHealth;
    this.player.stats = { ...saveData.player.stats };
    this.player.weapons = saveData.player.weapons.map(w => ({
      type: w.type,
      level: w.level,
      lastShot: 0
    }));

    this.engine.addEntity(this.player);

    // Restore game state
    this.wave = saveData.progress.wave;
    this.killCount = saveData.progress.killCount || 0;

    this.engine.start();
  }

  saveGame() {
    return this.saveSystem.saveGame(this);
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.engine.pause();
    } else {
      this.engine.resume();
    }
    return this.isPaused;
  }

  /**
   * Set pause state
   * @param {boolean} paused - Whether to pause or resume
   */
  setPause(paused) {
    this.isPaused = paused;
    if (this.isPaused) {
      this.engine.pause();
    } else {
      this.engine.resume();
    }
  }

  update(dt) {
    if (this.gameOver || this.levelingUp || this.isPaused) return;

    if (!this.player || !this.player.active) return;

    this.player.handleInput(this.keys, dt);
    this.player.update(dt);

    // Use the engine's camera distance (which Q/E keys modify)
    const cameraDistance = this.engine.cameraDistance;

    // Update camera to follow player using the current zoom level
    this.engine.camera.position.x = this.player.x;
    this.engine.camera.position.y = cameraDistance * 1.5;
    this.engine.camera.position.z = this.player.z + cameraDistance * 0.5;
    this.engine.camera.lookAt(this.player.x, 0, this.player.z);

    this.updateWeapons(dt);

    this.enemies = this.engine.entities.filter(e => e instanceof Enemy);
    this.projectiles = this.engine.entities.filter(e => e instanceof Projectile);
    this.pickups = this.engine.entities.filter(e => e instanceof Pickup);

    this.checkCollisions(dt);

    this.updatePickups(dt);

    // Update wave system (handles enemy spawning)
    this.waveSystem.update(dt);

    // Update projectile pools to recycle inactive projectiles
    this.projectilePool.update();
    this.enemyProjectilePool.update();

    // Old wave system for levels without wave config (fallback)
    const newWave = Math.floor(this.engine.time / 60) + 1;
    if (newWave > this.wave) {
      this.wave = newWave;
    }

    // Check if boss is still alive
    if (this.currentBoss && (!this.currentBoss.active || this.currentBoss.shouldRemove)) {
      this.currentBoss = null;
    }

    // Calculate nearest enemy direction for off-screen indicator (throttled)
    let nearestEnemyDirection = null;
    let nearestEnemyDistance = Infinity;

    // Only update indicator periodically
    const currentTime = this.engine.time;
    if (currentTime - this.lastIndicatorUpdate >= this.indicatorUpdateInterval) {
      this.lastIndicatorUpdate = currentTime;

      // Step 1: Find THE nearest enemy (only one!)
      let nearestEnemy = null;
      let nearestDist = Infinity;
      let anyEnemyOnScreen = false;

      this.enemies.forEach(enemy => {
        if (!enemy.active) return;

        const dx = enemy.x - this.player.x;
        const dz = enemy.z - this.player.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      // Step 2: Check if ANY enemy is visible on screen
      const camera = this.engine.camera;
      const zoomFactor = this.engine.cameraDistance / 10; // Normalize around 10
      const visibilityMargin = 1.0 + Math.min(0.3, zoomFactor * 0.1);

      this.enemies.forEach(enemy => {
        if (!enemy.active || anyEnemyOnScreen) return;

        const enemyWorldPos = new THREE.Vector3(enemy.x, 1, enemy.z);
        const screenPos = enemyWorldPos.clone();
        screenPos.project(camera);

        const isOnScreen = screenPos.z > 0 &&
                          screenPos.z < 1 &&
                          Math.abs(screenPos.x) < visibilityMargin &&
                          Math.abs(screenPos.y) < visibilityMargin;

        if (isOnScreen) {
          anyEnemyOnScreen = true;
          this.lastEnemyOnScreenTime = currentTime; // Update last seen time
        }
      });

      // Step 3: Check if THE NEAREST enemy is visible
      if (nearestEnemy) {
        // Project enemy position to screen space
        const enemyWorldPos = new THREE.Vector3(nearestEnemy.x, 1, nearestEnemy.z);
        const screenPos = enemyWorldPos.clone();
        screenPos.project(camera);

        // Check if enemy is actually visible on screen with margin
        // screenPos.x and .y are in normalized device coordinates (-1 to 1)
        // screenPos.z < 0 means behind camera
        const isOnScreen = screenPos.z > 0 &&
                          screenPos.z < 1 &&
                          Math.abs(screenPos.x) < visibilityMargin &&
                          Math.abs(screenPos.y) < visibilityMargin;

        // Step 4: Show arrow ONLY if nearest enemy is off-screen AND 7 seconds have passed
        const timeSinceEnemyOnScreen = currentTime - this.lastEnemyOnScreenTime;
        const shouldShowArrow = !isOnScreen && !anyEnemyOnScreen && timeSinceEnemyOnScreen >= this.arrowDelayTime;

        if (shouldShowArrow && screenPos.z > 0 && screenPos.z < 1) {
          // Track if we switched enemies
          const enemyChanged = this.trackedEnemyId !== nearestEnemy.id;
          if (enemyChanged) {
            this.trackedEnemyId = nearestEnemy.id;
          }

          // Always recalculate arrow position based on current enemy position
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          const centerX = screenWidth / 2;
          const centerY = screenHeight / 2;

          // Enemy position in screen pixels
          const enemyScreenX = (screenPos.x * centerX) + centerX;
          const enemyScreenY = (-screenPos.y * centerY) + centerY;

          // Direction from center to enemy
          const dirX = enemyScreenX - centerX;
          const dirY = enemyScreenY - centerY;
          const length = Math.sqrt(dirX * dirX + dirY * dirY);

          if (length > 1) {
            const normX = dirX / length;
            const normY = dirY / length;

            // Calculate arrow position on screen edge (adjusted for larger arrow)
            const padding = 35; // 35 pixels from edge to account for 50x50 arrow
            const scaleX = Math.abs(normX) > 0.001 ? (centerX - padding) / Math.abs(normX) : Infinity;
            const scaleY = Math.abs(normY) > 0.001 ? (centerY - padding) / Math.abs(normY) : Infinity;
            const scale = Math.min(scaleX, scaleY);

            this.arrowPosition = {
              x: centerX + normX * scale,
              y: centerY + normY * scale
            };

            // Pass both arrow position and current enemy screen coordinates
            nearestEnemyDirection = {
              arrowPosition: this.arrowPosition,
              enemyScreenPos: screenPos // Current enemy position for rotation calculation
            };
            nearestEnemyDistance = nearestDist;
            this.cachedEnemyChanged = enemyChanged;
          } else {
            // Enemy is too close to center, don't show arrow
            nearestEnemyDirection = null;
            nearestEnemyDistance = Infinity;
            this.arrowPosition = null;
            this.cachedEnemyChanged = false;
          }

        } else {
          // Nearest enemy IS on screen, no arrow needed
          nearestEnemyDirection = null;
          nearestEnemyDistance = Infinity;
          this.trackedEnemyId = null;
          this.arrowPosition = null; // Clear arrow position
          this.cachedEnemyChanged = false;
        }
      } else {
        // No enemies at all
        nearestEnemyDirection = null;
        nearestEnemyDistance = Infinity;
        this.trackedEnemyId = null;
        this.arrowPosition = null; // Clear arrow position
        this.cachedEnemyChanged = false;
      }

      // Store the calculated values for use until next update
      this.cachedEnemyDirection = nearestEnemyDirection;
      this.cachedEnemyDistance = nearestEnemyDistance;
    } else {
      // Use cached values between updates
      nearestEnemyDirection = this.cachedEnemyDirection;
      nearestEnemyDistance = this.cachedEnemyDistance;
    }

    if (this.onUpdate) {
      const waveInfo = this.waveSystem.getWaveInfo();

      this.onUpdate({
        health: Math.max(0, Math.floor(this.player.health)),
        maxHealth: this.player.maxHealth,
        xp: this.player.xp,
        level: this.player.level,
        xpProgress: (this.player.xp / this.player.xpToNext),
        time: Math.floor(this.engine.time),
        enemyCount: this.enemies.length,
        kills: this.killCount,
        bossHealth: this.currentBoss ? Math.max(0, Math.floor(this.currentBoss.health)) : 0,
        bossMaxHealth: this.currentBoss ? this.currentBoss.maxHealth : 0,
        hasBoss: !!this.currentBoss,
        // Wave system info
        currentWave: waveInfo.currentWave,
        totalWaves: waveInfo.totalWaves,
        waveActive: waveInfo.waveActive,
        allWavesCompleted: waveInfo.allWavesCompleted,
        enemiesRemaining: waveInfo.enemiesRemaining,
        // Enemy indicator info
        nearestEnemyDirection: nearestEnemyDirection,
        nearestEnemyDistance: nearestEnemyDistance,
        enemyChanged: this.cachedEnemyChanged || false
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
          // Calculate player center height
          const playerScale = this.player.mesh?.scale.y || 1.0;
          const baseHeight = 3.0; // Base model height in units
          const playerHeight = baseHeight * playerScale;
          const playerCenterY = playerHeight / 2;

          const proj = weapon.createProjectile(
            this.engine,
            this.player.x,
            playerCenterY, // Spawn at player center height
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

        // Handle pattern weapons (don't need target)
        if (weapon.isPattern && weapon.execute) {
          weapon.execute(this.engine, this.player, weapon, this.player.stats);
          this.engine.sound.playShoot();
          weaponInstance.lastShot = this.engine.time;
          return;
        }

        // Handle instant weapons (like lightning)
        if (weapon.isInstant && weapon.execute) {
          // Find target based on targeting type
          const maxRange = weapon.maxRange || Infinity;

          if (weapon.targeting === 'random') {
            // Pick randomly from all valid targets
            const recentlyHit = weapon.recentlyHit || new Map();
            const currentTime = this.engine.time;
            const validTargets = [];

            this.enemies.forEach(e => {
              // Skip recently hit enemies if weapon tracks them
              if (weapon.recentlyHit) {
                const lastHitTime = recentlyHit.get(e);
                if (lastHitTime && currentTime - lastHitTime < 0.5) {
                  return;
                }
              }

              const dx = e.x - this.player.x;
              const dz = e.z - this.player.z;
              const dist = dx * dx + dz * dz;
              if (dist <= maxRange * maxRange) {
                validTargets.push(e);
              }
            });

            // Pick random target from valid targets
            if (validTargets.length > 0) {
              target = validTargets[Math.floor(Math.random() * validTargets.length)];
            }
          } else if (weapon.targeting === 'instant' || weapon.targeting === 'nearest') {
            // Nearest targeting
            let minDist = Infinity;
            this.enemies.forEach(e => {
              const dx = e.x - this.player.x;
              const dz = e.z - this.player.z;
              const dist = dx * dx + dz * dz;
              if (dist < minDist && dist <= maxRange * maxRange) {
                minDist = dist;
                target = e;
              }
            });
          }

          if (target) {
            weapon.execute(this.engine, this.player, target, weapon, this.player.stats);
            // Use special sounds for different weapons
            if (weapon.name === 'Thunder Strike' && this.engine.sound.playThunder) {
              this.engine.sound.playThunder();
            } else if (weapon.name === 'Chain Lightning' && this.engine.sound.playLightning) {
              this.engine.sound.playLightning();
            } else {
              this.engine.sound.playShoot();
            }
            weaponInstance.lastShot = this.engine.time;
          }
          return;
        }

        // Handle persistent spells (like Ring of Fire - orbits player)
        if (weapon.isPersistent && weapon.execute) {
          weapon.execute(this.engine, this.player, null, weapon, this.player.stats);
          weaponInstance.lastShot = this.engine.time;
          return;
        }

        // Handle spells with no targeting (like Magic Bullet - shoots in random directions)
        if (weapon.targeting === 'none') {
          // Calculate player center height
          const playerScale = this.player.mesh?.scale.y || 1.0;
          const baseHeight = 3.0; // Base model height in units
          const playerHeight = baseHeight * playerScale;
          const playerCenterY = playerHeight / 2;

          const totalProjectiles = weapon.projectileCount || 1;

          for (let i = 0; i < totalProjectiles; i++) {
            const proj = weapon.createProjectile(
              this.engine,
              this.player.x,
              playerCenterY, // Spawn at player center height
              this.player.z,
              0, // Direction will be randomized in createProjectile
              0,
              weapon,
              this.player.stats
            );
            this.engine.addEntity(proj);
          }

          this.player.showMuzzleFlash();
          this.engine.sound.playShoot();
          weaponInstance.lastShot = this.engine.time;
          return;
        }

        if (weapon.targeting === 'nearest') {
          const maxRange = weapon.maxRange || 50; // Default max range for projectile weapons
          const maxRangeSq = maxRange * maxRange;
          let minDist = Infinity;
          this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dz = e.z - this.player.z;
            const dist = dx * dx + dz * dz;
            if (dist < minDist && dist <= maxRangeSq) {
              minDist = dist;
              target = e;
            }
          });
        } else if (weapon.targeting === 'farthest') {
          const maxRange = weapon.maxRange || 50; // Default max range for projectile weapons
          const maxRangeSq = maxRange * maxRange;
          let maxDist = 0;
          this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dz = e.z - this.player.z;
            const dist = dx * dx + dz * dz;
            if (dist > maxDist && dist <= maxRangeSq) {
              maxDist = dist;
              target = e;
            }
          });
        }

        if (target) {
          const dx = target.x - this.player.x;
          const dz = target.z - this.player.z;

          // Calculate target height based on mesh scale
          const targetScale = target.mesh?.scale.y || 1.0;
          const baseHeight = 3.0; // Base model height in units
          const targetHeight = baseHeight * targetScale;
          const targetCenterY = targetHeight / 2; // Center is half the total height

          // Calculate player center height
          const playerScale = this.player.mesh?.scale.y || 1.0;
          const playerHeight = baseHeight * playerScale;
          const playerCenterY = playerHeight / 2;

          // Never aim lower than player center
          const targetY = Math.max(playerCenterY, targetCenterY);
          const dy = targetY - playerCenterY;

          const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const dirX = dx / mag;
          const dirY = dy / mag;
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
              playerCenterY, // Spawn at player center height
              this.player.z,
              newDirX,
              newDirZ,
              weapon,
              this.player.stats,
              dirY // Pass Y direction
            );
            this.engine.addEntity(proj);
          }

          this.player.showMuzzleFlash();
          this.engine.sound.playShoot();
          weaponInstance.lastShot = this.engine.time;

          // Set random cooldown if spell has variable cooldown
          if (weapon.hasRandomCooldown && weapon.baseCooldownMin && weapon.baseCooldownMax) {
            weapon.cooldown = weapon.baseCooldownMin + Math.random() * (weapon.baseCooldownMax - weapon.baseCooldownMin);
          }
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
        // Initialize contact damage tracking
        if (!enemy.lastContactDamageTime) {
          enemy.lastContactDamageTime = 0;
        }

        // Apply contact damage once per second
        const currentTime = this.engine.time;
        if (currentTime - enemy.lastContactDamageTime >= 0.5) {
          enemy.lastContactDamageTime = currentTime;

          if (!this.godMode && this.player.takeDamage(enemy.damage, `Enemy contact (${enemy.constructor.name})`)) {
            this.gameOver = true;
            this.engine.pause();
            this.engine.sound.playDeath();

            // Save progress on game over
            this.saveSystem.saveProgress(this.wave, this.killCount);

            if (this.onGameOver) {
              this.onGameOver({
                time: Math.floor(this.engine.time),
                kills: this.killCount,
                wave: this.wave,
                highestWave: this.saveSystem.getHighestWave(),
                totalKills: this.saveSystem.getTotalKills()
              });
            }
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

  /**
   * Spawn enemy by type - called by wave system
   * @param {string} type - Enemy difficulty type (normal, fast, elite)
   * @param {number} angle - Optional spawn angle (for group spawning)
   * @param {number} dist - Optional spawn distance (for group spawning)
   */
  spawnEnemyByType(type, angle = null, dist = null) {
    // Use provided angle/dist or generate random ones
    if (angle === null) angle = Math.random() * Math.PI * 2;
    if (dist === null) dist = 40 + Math.random() * 15;

    const x = this.player.x + Math.cos(angle) * dist;
    const z = this.player.z + Math.sin(angle) * dist;

    // Handle boss type separately
    if (type === 'boss') {
      const boss = new BossEnemy(this.engine, x, z);

      // Bosses always have ranged attacks
      boss.canShoot = true;
      boss.shootRange = 20;
      boss.shootCooldown = 2.0 + Math.random() * 2.0;
      boss.projectileSpeed = 12;
      boss.projectileDamage = 25;

      this.currentBoss = boss; // Track the boss
      this.engine.addEntity(boss);
      return;
    }

    // Map wave enemy types to actual enemy types
    let enemyType;

    // Check if it's already a specific enemy type (bandit, skeleton_warrior, etc.)
    const validTypes = ['bandit', 'coyote', 'brute', 'gunman', 'charger', 'tiny', 'giant', 'skeleton_warrior', 'skeleton_mage'];
    if (validTypes.includes(type)) {
      // Use the type directly
      enemyType = type;
    } else if (type === 'fast') {
      // Fast enemies - coyote or charger
      enemyType = Math.random() < 0.5 ? 'coyote' : 'charger';
    } else if (type === 'elite') {
      // Elite enemies - brute or gunman with elite affix
      enemyType = Math.random() < 0.5 ? 'brute' : 'gunman';
    } else {
      // Normal enemies - bandit or coyote
      enemyType = Math.random() < 0.6 ? 'bandit' : 'coyote';
    }

    const enemy = new Enemy(this.engine, x, z, enemyType);

    // Apply HP scaling for survival mode (every 7 waves increases HP)
    if (this.levelConfig?.isSurvival) {
      const currentWave = this.waveSystem.currentWave + 1;
      const hpScaleTier = Math.floor(currentWave / 7); // Tier increases every 7 waves
      const hpMultiplier = 1 + (hpScaleTier * 0.3); // 30% more HP per tier
      enemy.health *= hpMultiplier;
      enemy.maxHealth *= hpMultiplier;
    }

    // Apply elite affixes first
    const isElite = type === 'elite';
    if (isElite) {
      const affixes = ['fast', 'tank', 'regen'];
      const affix = affixes[Math.floor(Math.random() * affixes.length)];
      enemy.makeElite(affix);
    }

    // Apply level-specific enemy settings
    const currentLevel = this.levelSystem.currentLevel;
    if (currentLevel && currentLevel.enemySettings) {
      const settings = currentLevel.enemySettings;

      // Determine if this enemy can shoot
      let canShoot = false;

      // Check if it's a special ranged enemy type (like gunman)
      if (settings.rangedEnemies && settings.rangedEnemies.includes(enemyType)) {
        canShoot = true;
      }

      // Check if it's an elite and elites can shoot
      if (isElite && settings.elitesCanShoot) {
        // Apply elite shoot chance
        const eliteShootChance = settings.eliteShootChance !== undefined ? settings.eliteShootChance : 1.0;
        if (Math.random() < eliteShootChance) {
          canShoot = true;
        }
      }

      enemy.canShoot = canShoot;

      // Apply shooting parameters if this enemy can shoot
      if (enemy.canShoot) {
        enemy.shootRange = settings.shootRange || 15;
        enemy.shootCooldown = settings.shootCooldown
          ? settings.shootCooldown.min + Math.random() * (settings.shootCooldown.max - settings.shootCooldown.min)
          : 3.0 + Math.random() * 2.0;
        enemy.projectileSpeed = settings.projectileSpeed || 8;
        enemy.projectileDamage = settings.projectileDamage || 15;
      }
    }

    this.engine.addEntity(enemy);
  }

  spawnEnemies(dt) {
    // Only use old spawn system if wave system is not active
    if (this.waveSystem.waveConfig && this.waveSystem.waveConfig.length > 0) {
      return; // Wave system handles spawning
    }

    // Fallback to old spawn system for levels without wave config
    const spawnInterval = Math.max(0.05, 0.8 - this.wave * 0.05);
    const maxEnemies = 500 + this.wave * 20;

    if (this.wave % 3 === 0 && !this.bossSpawned) {
      this.spawnBoss();
      this.bossSpawned = true;
      return;
    }

    if (this.wave % 3 !== 0) {
      this.bossSpawned = false;
    }

    if (this.engine.time - this.lastSpawn > spawnInterval && this.enemies.length < maxEnemies) {
      const spawnCount = Math.min(10, 5 + Math.floor(this.wave / 2));

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

    // Bosses always have ranged attacks
    boss.canShoot = true;
    boss.shootRange = 20; // Long range for boss
    boss.shootCooldown = 2.0 + Math.random() * 2.0; // 2-4 second cooldown
    boss.projectileSpeed = 12; // Fast projectiles
    boss.projectileDamage = 25; // High damage

    this.currentBoss = boss; // Track the boss
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

    // All available spell types
    const allSpellTypes = [
      SPELL_TYPES.THUNDER_STRIKE,
      SPELL_TYPES.CHAIN_LIGHTNING,
      SPELL_TYPES.FIREBALL,
      SPELL_TYPES.PYRO_EXPLOSION,
      SPELL_TYPES.RING_OF_FIRE,
      SPELL_TYPES.ICE_LANCE,
      SPELL_TYPES.MAGIC_BULLET
    ];

    // Create weapon upgrade options (new weapons or upgrades)
    const weaponUpgrades = [];

    // Add upgrade options for existing spells
    this.player.weapons.forEach(weaponInstance => {
      if (weaponInstance.level < 5) {
        weaponUpgrades.push(createWeaponUpgradeOption(weaponInstance.type, weaponInstance.level));
      }
    });

    // Add new spell options
    allSpellTypes.forEach(spellType => {
      if (!this.player.weapons.find(w => w.type === spellType)) {
        weaponUpgrades.push(createWeaponUpgradeOption(spellType, 0));
      }
    });

    const choices = [];

    // Add 2 weapon options (prioritize upgrades for existing weapons)
    if (weaponUpgrades.length > 0) {
      const numWeapons = Math.min(2, weaponUpgrades.length);
      const selectedWeapons = [...weaponUpgrades]
        .sort(() => Math.random() - 0.5)
        .slice(0, numWeapons);
      choices.push(...selectedWeapons);
    }

    // Fill remaining slots with stat upgrades
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

  /**
   * Create a projectile using the pool for better performance
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} z - Starting Z position
   * @param {number} dirX - X direction
   * @param {number} dirZ - Z direction
   * @param {Object} weapon - Weapon configuration
   * @param {Object} stats - Player stats
   * @param {number} dirY - Y direction (optional)
   * @returns {Object} Pooled projectile
   */
  createPooledProjectile(x, y, z, dirX, dirZ, weapon, stats, dirY = 0) {
    return this.projectilePool.acquire(x, y, z, dirX, dirZ, weapon, stats, dirY);
  }

  cleanup() {
    if (this.levelSystem) {
      this.levelSystem.cleanup();
    }
    if (this.projectilePool) {
      this.projectilePool.dispose();
    }
    if (this.enemyProjectilePool) {
      this.enemyProjectilePool.dispose();
    }
  }
}
