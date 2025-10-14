import * as THREE from 'three';
import { Entity } from './Entity.js';

export class ColoredLightning extends Entity {
  constructor(engine, startX, startY, startZ, endX, endY, endZ, damage, color = 0x88ccff, glowColor = 0xffffff, width = 4, taper = false, gradientColor = null) {
    super();
    this.engine = engine;
    this.startX = startX;
    this.startY = startY;
    this.startZ = startZ;
    this.endX = endX;
    this.endY = endY;
    this.endZ = endZ;
    this.damage = damage;
    this.lifetime = 0.2;
    this.age = 0;
    this.bolts = [];
    this.color = color;
    this.glowColor = glowColor;
    this.width = width * 0.02; // Scale down width even more
    this.taper = taper; // Whether to taper from thick to thin
    this.gradientColor = gradientColor; // End color for gradient (null = no gradient)
    this.alwaysUpdate = true; // Always update to expire properly even when off-screen
    this.createBolts();
  }

  createBolts() {
    // Create jagged lightning bolt path
    const segments = 15;
    const points = [];
    this.pathPoints = []; // Store points for branch connections

    // Calculate perpendicular vectors for offset
    const dirX = this.endX - this.startX;
    const dirY = this.endY - this.startY;
    const dirZ = this.endZ - this.startZ;
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

    // Create perpendicular vector for horizontal offset
    const perpX = -dirZ;
    const perpZ = dirX;
    const perpMag = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = this.startX + dirX * t;
      const y = this.startY + dirY * t;
      const z = this.startZ + dirZ * t;

      // Add jagged offset (not at endpoints)
      const offset = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * length * 0.08;
      const yOffset = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * length * 0.05;

      const point = new THREE.Vector3(
        x + (perpX / perpMag) * offset,
        y + yOffset,
        z + (perpZ / perpMag) * offset
      );
      points.push(point);
      this.pathPoints.push(point); // Store for branch connections
    }

    // Create tube geometry for main bolt
    const curve = new THREE.CatmullRomCurve3(points);

    // If tapering, create custom radius function
    let radiusFunction = null;
    if (this.taper) {
      radiusFunction = (t) => {
        // t goes from 0 (start) to 1 (end)
        // Start thick, end thin
        return this.width * (1.5 - t * 1.2); // Start at 1.5x width, end at 0.3x width
      };
    }

    const tubeGeometry = this.taper
      ? new THREE.TubeGeometry(curve, segments * 2, this.width, 8, false, radiusFunction)
      : new THREE.TubeGeometry(curve, segments * 2, this.width, 8, false);

    // If gradient color is specified, apply vertex colors
    if (this.gradientColor) {
      const colors = [];
      const startColor = new THREE.Color(this.color);
      const endColor = new THREE.Color(this.gradientColor);
      const vertexCount = tubeGeometry.attributes.position.count;

      for (let i = 0; i < vertexCount; i++) {
        // Calculate position along the tube (0 to 1)
        const segmentIndex = Math.floor(i / 8); // 8 vertices per segment
        const t = segmentIndex / (segments * 2);

        // Interpolate between start and end color
        const color = startColor.clone().lerp(endColor, t);
        colors.push(color.r, color.g, color.b);
      }

      tubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    const material = new THREE.MeshBasicMaterial({
      color: this.gradientColor ? 0xffffff : new THREE.Color(this.color),
      vertexColors: this.gradientColor ? true : false,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const tubeMesh = new THREE.Mesh(tubeGeometry, material);
    this.engine.scene.add(tubeMesh);
    this.bolts.push(tubeMesh);

    // Create glow layer
    let glowRadiusFunction = null;
    if (this.taper) {
      glowRadiusFunction = (t) => {
        return this.width * 1.5 * (1.5 - t * 1.2);
      };
    }

    const glowGeometry = this.taper
      ? new THREE.TubeGeometry(curve, segments * 2, this.width * 1.5, 8, false, glowRadiusFunction)
      : new THREE.TubeGeometry(curve, segments * 2, this.width * 1.5, 8, false);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.glowColor),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.engine.scene.add(glowMesh);
    this.bolts.push(glowMesh);

    // Add light blue outer glow layer
    let outerGlowRadiusFunction = null;
    if (this.taper) {
      outerGlowRadiusFunction = (t) => {
        return this.width * 4 * (1.5 - t * 1.2);
      };
    }

    const outerGlowGeometry = this.taper
      ? new THREE.TubeGeometry(curve, segments * 2, this.width * 4, 8, false, outerGlowRadiusFunction)
      : new THREE.TubeGeometry(curve, segments * 2, this.width * 4, 8, false);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x66ccff), // Brighter light blue
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    this.engine.scene.add(outerGlowMesh);
    this.bolts.push(outerGlowMesh);

    // Add some random branches for thicker bolts
    if (this.width > 0.1) {
      const branchCount = Math.floor(this.width * 10);
      for (let b = 0; b < branchCount; b++) {
        const branchStart = Math.floor(segments * (0.2 + Math.random() * 0.6));
        const branchPoints = [];

        branchPoints.push(points[branchStart].clone());

        const branchDir = Math.random() * Math.PI * 2;
        const branchLength = 2 + Math.random() * 2;

        for (let i = 1; i <= 5; i++) {
          const t = i / 5;
          branchPoints.push(new THREE.Vector3(
            points[branchStart].x + Math.cos(branchDir) * t * branchLength + (Math.random() - 0.5) * 0.5,
            points[branchStart].y - t * 0.5,
            points[branchStart].z + Math.sin(branchDir) * t * branchLength + (Math.random() - 0.5) * 0.5
          ));
        }

        const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
        const branchGeometry = new THREE.TubeGeometry(branchCurve, 10, this.width * 0.5, 6, false);
        const branchMesh = new THREE.Mesh(branchGeometry, material.clone());
        this.engine.scene.add(branchMesh);
        this.bolts.push(branchMesh);
      }
    }

    this.mesh = tubeMesh;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age > this.lifetime) {
      this.destroy();
      return;
    }

    // Fade out all meshes
    const opacity = 1 - (this.age / this.lifetime);
    this.bolts.forEach(mesh => {
      if (mesh.material) {
        mesh.material.opacity = opacity;
      }
    });
  }

  destroy() {
    this.bolts.forEach(mesh => {
      this.engine.scene.remove(mesh);
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        mesh.material.dispose();
      }
    });
    this.active = false;
    this.shouldRemove = true;
  }
}
