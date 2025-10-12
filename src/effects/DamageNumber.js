import * as THREE from 'three';

/**
 * DamageNumber - Floating damage number that appears when enemies are hit
 */
export class DamageNumber {
  constructor(damage, x, y, z, isCritical = false) {
    this.damage = damage;
    this.x = x;
    this.y = y;
    this.z = z;
    this.isCritical = isCritical;
    this.lifetime = 1.0; // 1 second
    this.age = 0;
    this.active = true;
    this.shouldRemove = false;

    // Velocity for upward float
    this.vy = 3; // Float upward
    this.vx = (Math.random() - 0.5) * 2; // Slight random horizontal drift

    this.createSprite();
  }

  createSprite() {
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Larger canvas for crits
    canvas.width = this.isCritical ? 192 : 128;
    canvas.height = this.isCritical ? 96 : 64;

    // Set font based on critical hit
    const fontSize = this.isCritical ? 64 : 32;
    context.font = `bold ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillText(this.damage.toString(), centerX + 2, centerY + 2);

    // Draw text (bright red for critical, white for normal)
    const textColor = this.isCritical ? '#ff0000' : '#ffffff';
    context.fillStyle = textColor;
    context.fillText(this.damage.toString(), centerX, centerY);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // Always render on top
    });

    this.mesh = new THREE.Sprite(material);
    // Larger scale for crits
    const scale = this.isCritical ? 3 : 2;
    const scaleY = this.isCritical ? 1.5 : 1;
    this.mesh.scale.set(scale, scaleY, 1);
    this.mesh.position.set(this.x, this.y, this.z);
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;

    // Float upward and drift
    this.y += this.vy * dt;
    this.x += this.vx * dt;

    // Fade out based on age
    const fadeStart = 0.5;
    if (this.age > fadeStart) {
      const fadeProgress = (this.age - fadeStart) / (this.lifetime - fadeStart);
      this.mesh.material.opacity = 1 - fadeProgress;
    }

    // Update position
    this.mesh.position.set(this.x, this.y, this.z);

    // Deactivate when lifetime expires
    if (this.age >= this.lifetime) {
      this.active = false;
      this.shouldRemove = true;
    }
  }

  dispose() {
    if (this.mesh) {
      if (this.mesh.material.map) {
        this.mesh.material.map.dispose();
      }
      this.mesh.material.dispose();
    }
  }
}
