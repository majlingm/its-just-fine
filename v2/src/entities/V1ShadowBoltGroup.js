import { Entity } from './V1Entity.js';

/**
 * ShadowBoltGroup - Container that manages 3 shadow bolts in a spinning triangle
 */
export class ShadowBoltGroup extends Entity {
  constructor(engine, x, y, z, dirX, dirZ, projectiles, rotationSpeed = 5) {
    super();
    this.engine = engine;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dirX = dirX;
    this.dirZ = dirZ;
    this.projectiles = projectiles; // Array of 3 projectiles
    this.rotationSpeed = rotationSpeed; // Radians per second
    this.currentRotation = 0;
    this.radius = 1.0; // Distance of projectiles from center
    this.speed = 10; // Group movement speed
    this.lifetime = 3.0;
    this.age = 0;

    // Store initial angles for each projectile
    this.projectileAngles = [
      0,
      (Math.PI * 2 / 3),
      (Math.PI * 4 / 3)
    ];
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Move center forward
    this.x += this.dirX * this.speed * dt;
    this.z += this.dirZ * this.speed * dt;

    // Rotate
    this.currentRotation += this.rotationSpeed * dt;

    // Update each projectile's position in the spinning triangle
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj || !proj.active) continue;

      const angle = this.projectileAngles[i] + this.currentRotation;

      // Calculate position relative to center
      const offsetX = Math.sin(angle) * this.radius;
      const offsetZ = Math.cos(angle) * this.radius;

      // Update projectile position
      proj.x = this.x + offsetX;
      proj.z = this.z + offsetZ;
      proj.y = this.y;

      if (proj.mesh) {
        proj.mesh.position.x = proj.x;
        proj.mesh.position.y = proj.y;
        proj.mesh.position.z = proj.z;
      }

      // Let projectile check collisions
      proj.checkCollisions();
    }
  }

  destroy() {
    // Destroy all managed projectiles
    for (const proj of this.projectiles) {
      if (proj && proj.active) {
        proj.destroy();
      }
    }
    this.projectiles = [];
    this.active = false;
    this.shouldRemove = true;
  }
}
