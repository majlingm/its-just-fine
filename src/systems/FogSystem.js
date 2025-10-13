import * as THREE from 'three';

/**
 * FogSystem - Handles boundary fog walls
 * Extracted from GameEngine for better modularity
 */
export class FogSystem {
  constructor(scene) {
    this.scene = scene;
    this.fogWalls = [];
    this.animationRunning = false;
  }

  /**
   * Create boundary fog walls at the edges of the play area
   * @param {Object} boundaries - Optional spawn boundaries { minX, maxX, minZ, maxZ }
   */
  createBoundaryFog(boundaries = null) {
    // Use spawn boundaries if provided, otherwise default to 90x90
    const maxX = boundaries ? boundaries.maxX : 90;
    const maxZ = boundaries ? boundaries.maxZ : 90;
    const minX = boundaries ? boundaries.minX : -90;
    const minZ = boundaries ? boundaries.minZ : -90;

    // Calculate dimensions
    const width = maxX - minX;
    const length = maxZ - minZ;
    const centerX = (maxX + minX) / 2;
    const centerZ = (maxZ + minZ) / 2;

    const fogHeight = 25;

    // Vertex shader - pass world position
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader - 3D Perlin noise for volumetric fog effect
    const fragmentShader = `
      uniform float time;
      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      // 3D Perlin noise implementation
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        // Use world position for volumetric effect
        vec3 pos = vWorldPosition * 0.08;

        // Multiple octaves of 3D noise for realistic fog
        float noise = 0.0;
        noise += snoise(pos + vec3(time * 0.1, time * 0.05, 0.0)) * 0.5;
        noise += snoise(pos * 2.0 + vec3(0.0, time * 0.08, time * 0.1)) * 0.25;
        noise += snoise(pos * 4.0 - vec3(time * 0.06, 0.0, time * 0.07)) * 0.125;

        // Normalize to 0-1
        noise = noise * 0.5 + 0.5;

        // Height-based fade
        float heightFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

        // Edge fade (thicker in center of fog wall)
        float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

        // Combine everything
        float density = noise * heightFade * edgeFade * 0.85;

        gl_FragColor = vec4(fogColor, density);
      }
    `;

    const fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        fogColor: { value: new THREE.Color(0xff69b4) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.fogWalls = [];

    // North wall (at +Z boundary)
    const northWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    northWall.position.set(centerX, fogHeight / 2, maxZ);
    this.scene.add(northWall);
    this.fogWalls.push(northWall);

    // South wall (at -Z boundary)
    const southWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    southWall.position.set(centerX, fogHeight / 2, minZ);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);
    this.fogWalls.push(southWall);

    // East wall (at +X boundary)
    const eastWall = new THREE.Mesh(
      new THREE.PlaneGeometry(length, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    eastWall.position.set(maxX, fogHeight / 2, centerZ);
    eastWall.rotation.y = Math.PI / 2;
    this.scene.add(eastWall);
    this.fogWalls.push(eastWall);

    // West wall (at -X boundary)
    const westWall = new THREE.Mesh(
      new THREE.PlaneGeometry(length, fogHeight, 1, 1),
      fogMaterial.clone()
    );
    westWall.position.set(minX, fogHeight / 2, centerZ);
    westWall.rotation.y = -Math.PI / 2;
    this.scene.add(westWall);
    this.fogWalls.push(westWall);

    // Start animation
    this.startAnimation();
  }

  /**
   * Start fog animation
   */
  startAnimation() {
    if (this.animationRunning) return;
    this.animationRunning = true;

    const animate = () => {
      if (!this.animationRunning) return;

      if (this.fogWalls && this.fogWalls.length > 0) {
        const time = performance.now() * 0.001;
        this.fogWalls.forEach(wall => {
          if (wall.material.uniforms) {
            wall.material.uniforms.time.value = time;
          }
        });
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop fog animation
   */
  stopAnimation() {
    this.animationRunning = false;
  }

  /**
   * Update fog color
   * @param {number} color - Three.js color hex value
   */
  updateFogColor(color) {
    this.fogWalls.forEach(wall => {
      if (wall.material.uniforms && wall.material.uniforms.fogColor) {
        wall.material.uniforms.fogColor.value.setHex(color);
      }
    });
  }

  /**
   * Clean up fog walls and stop animation
   */
  cleanup() {
    this.stopAnimation();

    this.fogWalls.forEach(wall => {
      this.scene.remove(wall);
      if (wall.geometry) wall.geometry.dispose();
      if (wall.material) wall.material.dispose();
    });
    this.fogWalls = [];
  }
}