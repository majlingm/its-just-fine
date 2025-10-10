import * as THREE from 'three';
import { Entity } from './Entity.js';
import { createPlayerSprite } from '../utils/sprites.js';
import { loadCharacterModel, CHARACTER_MODELS } from '../utils/modelLoader.js';
import { SPELL_TYPES } from '../spells/spellTypes.js';

export class Player extends Entity {
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
    this.walkCycle = 0;
    this.isMoving = false;
    this.mixer = null;
    this.animations = {};

    // Dash properties
    this.isDashing = false;
    this.dashSpeed = 30;
    this.dashDuration = 0.5; // Longer slide
    this.dashCooldown = 1.0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashDirection = { x: 0, z: 0 };

    // Camera rotation
    this.cameraAngle = 0;  // Horizontal rotation
    this.cameraVerticalAngle = 0.5;  // Vertical angle (0.5 = default, 0 = top-down, 1 = more horizontal)

    this.stats = {
      damage: 1,
      cooldown: 1,
      projectileSpeed: 1,
      pierce: 0,
      moveSpeed: 1,
      pickupRadius: 2
    };

    this.weapons = [
      { type: SPELL_TYPES.FIREBALL, level: 1, lastShot: 0 }
    ];

    this.createMesh();
  }

  async createMesh() {
    try {
      // Load 3D model with animations
      console.log('Loading player model:', CHARACTER_MODELS.player);
      const { scene: model, animations } = await loadCharacterModel(CHARACTER_MODELS.player);
      console.log('Player model loaded successfully');

      model.scale.set(2.0, 2.0, 2.0);
      model.rotation.y = Math.PI; // Face forward

      this.mesh = model;

      // Enable shadows and improve texture quality
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Improve texture quality
          if (child.material) {
            if (child.material.map) {
              child.material.map.anisotropy = 16; // Max anisotropic filtering
              child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.map.magFilter = THREE.LinearFilter;
            }
            child.material.needsUpdate = true;
          }
        }
      });

      // Set up animation mixer if animations exist
      if (animations && animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);

        // Store animations
        animations.forEach((clip) => {
          this.animations[clip.name] = this.mixer.clipAction(clip);
        });

        // Try to find walk and idle animations
        let walkAnim = null;
        let idleAnim = null;

        // Look for animations containing 'walk' or 'idle' (case insensitive)
        animations.forEach((clip) => {
          const nameLower = clip.name.toLowerCase();
          if (nameLower.includes('walk') || nameLower.includes('run')) {
            walkAnim = this.mixer.clipAction(clip);
          }
          if (nameLower.includes('idle')) {
            idleAnim = this.mixer.clipAction(clip);
          }
        });

        // Store animations
        if (walkAnim) {
          this.walkAnimation = walkAnim;
          this.walkAnimation.setLoop(THREE.LoopRepeat);
        }
        if (idleAnim) {
          this.idleAnimation = idleAnim;
          this.idleAnimation.setLoop(THREE.LoopRepeat);
          this.idleAnimation.play(); // Start with idle
        }
      }

      // Add to scene after mesh is ready
      if (this.engine && this.engine.scene) {
        this.engine.scene.add(this.mesh);
      }
    } catch (error) {
      console.error('Failed to load player model:', error);
      console.log('Falling back to sprite');
      // Fallback to sprite
      const texture = createPlayerSprite();
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(2, 2, 1);
      this.mesh = sprite;
    }
  }

  showMuzzleFlash() {
    // Muzzle flash removed
  }

  handleInput(keys, dt) {
    let dx = 0, dz = 0;

    // Don't process input if game is paused or in menus
    const game = this.engine.game;
    if (game && (game.levelingUp || game.gameOver)) {
      return;
    }

    // Check for gamepad input
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[0]; // Use first connected gamepad
    let gamepadDash = false;

    if (gamepad) {
      // Left stick for movement (axes 0 and 1)
      const deadzone = 0.15;
      const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
      const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;

      if (leftX !== 0 || leftY !== 0) {
        dx += leftX;
        dz += leftY;
      }

      // Right stick for camera rotation (axes 2 and 3)
      const rightX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
      if (rightX !== 0) {
        this.cameraAngle += rightX * dt * 2; // Rotate camera
      }

      // Button 0 (A on Xbox, X on PlayStation) for dash
      if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
        gamepadDash = true;
      }
    }

    // Handle keyboard camera rotation (arrow keys)
    if (keys['arrowleft']) {
      this.cameraAngle -= dt * 2; // Rotate camera left
    }
    if (keys['arrowright']) {
      this.cameraAngle += dt * 2; // Rotate camera right
    }
    if (keys['arrowup']) {
      this.cameraVerticalAngle = Math.max(0.1, this.cameraVerticalAngle - dt * 0.5); // Tilt camera up (more top-down)
    }
    if (keys['arrowdown']) {
      this.cameraVerticalAngle = Math.min(0.9, this.cameraVerticalAngle + dt * 0.5); // Tilt camera down (more horizontal)
    }

    // Handle dash input (spacebar or gamepad button)
    if ((keys[' '] || gamepadDash) && !this.isDashing && this.dashCooldownTimer <= 0) {
      // Get current movement direction (keyboard + gamepad)
      let dashDx = dx; // Start with gamepad input
      let dashDz = dz;

      // Add keyboard input (WASD only for movement)
      if (keys['w']) dashDz -= 1;
      if (keys['s']) dashDz += 1;
      if (keys['a']) dashDx -= 1;
      if (keys['d']) dashDx += 1;

      // If moving, dash in movement direction; otherwise dash forward
      if (dashDx !== 0 || dashDz !== 0) {
        const mag = Math.sqrt(dashDx * dashDx + dashDz * dashDz);
        this.dashDirection.x = dashDx / mag;
        this.dashDirection.z = dashDz / mag;
      } else if (this.mesh) {
        // Dash in facing direction
        this.dashDirection.x = Math.sin(this.mesh.rotation.y);
        this.dashDirection.z = Math.cos(this.mesh.rotation.y);
      }

      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldownTimer = this.dashCooldown;

      // Play dash sound
      if (this.engine && this.engine.sound) {
        this.engine.sound.playDash();
      }
    }

    // WASD only for movement (arrows now control camera)
    if (keys['w']) dz -= 1;
    if (keys['s']) dz += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

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

    // Use dash movement if dashing
    if (this.isDashing) {
      dx = this.dashDirection.x;
      dz = this.dashDirection.z;
      const newX = this.x + dx * this.dashSpeed * dt;
      const newZ = this.z + dz * this.dashSpeed * dt;

      this.x = newX;
      this.z = newZ;
      this.isMoving = true;
    } else if (dx !== 0 || dz !== 0) {
      const mag = Math.sqrt(dx * dx + dz * dz);
      dx /= mag;
      dz /= mag;

      // Calculate new position
      const newX = this.x + dx * this.speed * this.stats.moveSpeed * dt;
      const newZ = this.z + dz * this.speed * this.stats.moveSpeed * dt;

      // Check collision with level objects
      let finalX = newX;
      let finalZ = newZ;

      if (game && game.levelSystem) {
        const collision = game.levelSystem.checkCollision(newX, newZ, 0.5);
        if (collision.collided) {
          // Push player back from collision
          finalX = newX + collision.pushX;
          finalZ = newZ + collision.pushZ;
        }
      }

      this.x = finalX;
      this.z = finalZ;
      this.isMoving = true;

      // Update rotation to face movement direction
      if (this.mesh) {
        const targetRotation = Math.atan2(dx, dz);
        this.mesh.rotation.y = targetRotation;
      }
    } else {
      this.isMoving = false;
    }

    this.x = Math.max(-90, Math.min(90, this.x));
    this.z = Math.max(-90, Math.min(90, this.z));
  }

  update(dt) {
    if (!this.mesh) return; // Wait for mesh to load

    // Update dash timers
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt;
    }

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Switch between walk and idle animations based on movement
    if (this.walkAnimation && this.idleAnimation) {
      if (this.isMoving) {
        if (!this.walkAnimation.isRunning()) {
          this.idleAnimation.fadeOut(0.2);
          this.walkAnimation.reset().fadeIn(0.2).play();
        }
      } else {
        if (!this.idleAnimation.isRunning()) {
          this.walkAnimation.fadeOut(0.2);
          this.idleAnimation.reset().fadeIn(0.2).play();
        }
      }
    } else if (this.walkAnimation) {
      // Fallback if only walk animation exists
      if (this.isMoving && !this.walkAnimation.isRunning()) {
        this.walkAnimation.play();
      } else if (!this.isMoving && this.walkAnimation.isRunning()) {
        this.walkAnimation.stop();
      }
    }

    // Walking animation (bobbing fallback if no skeletal animation)
    if (this.isMoving && !this.mixer) {
      this.walkCycle += dt * 10;
    }

    const bobAmount = (this.isMoving && !this.mixer) ? Math.sin(this.walkCycle) * 0.15 : 0;

    this.mesh.position.x = this.x;
    this.mesh.position.y = 0 + bobAmount;
    this.mesh.position.z = this.z;

    // Camera rotation is now handled in DustAndDynamiteGame.js
    // to avoid conflicts with the main camera update
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

  takeDamage(amount, source = 'unknown') {
    this.health -= amount;
    return this.health <= 0;
  }
}
