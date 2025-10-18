import * as THREE from 'three';

/**
 * GroundSystem - Manages ground plane and terrain
 *
 * Supports multiple ground types ported from v1:
 * - Solid colors (black, dark, bright)
 * - Patterns (checkerboard, neon, matrix)
 * - Effects (void, psychedelic, aurora, nebula, plasma)
 * - Materials (glass, ice, water, mirror, chrome)
 * - Environments (lava, rainbow, ocean, forest, snow, crystal)
 */
export class GroundSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.ground = null;
    this.currentType = 'black';
    this.animationFrameId = null;
  }

  /**
   * Create ground from environment config or type
   * @param {Object|string} config - Ground configuration or type string
   */
  create(config) {
    const groundType = typeof config === 'string' ? config : (config.type || 'black');
    const size = typeof config === 'object' ? config.size : 200;

    this.cleanup();
    this.currentType = groundType;

    switch(groundType) {
      case 'black':
        this.createBlackGround(size);
        break;
      case 'dark':
        this.createDarkGround(size);
        break;
      case 'bright':
        this.createBrightGround(size);
        break;
      case 'checkerboard':
        this.createCheckerboardGround(size);
        break;
      case 'void':
        this.createVoidGround(size);
        break;
      case 'neon':
        this.createNeonGround(size);
        break;
      case 'matrix':
        this.createMatrixGround(size);
        break;
      case 'psychedelic':
        this.createPsychedelicGround(size);
        break;
      case 'glass':
        this.createGlassGround(size);
        break;
      case 'ice':
        this.createIceGround(size);
        break;
      case 'water':
        this.createWaterGround(size);
        break;
      case 'mirror':
        this.createMirrorGround(size);
        break;
      case 'lava':
        this.createLavaGround(size);
        break;
      case 'rainbow':
        this.createRainbowGround(size);
        break;
      case 'chrome':
        this.createChromeGround(size);
        break;
      case 'aurora':
        this.createAuroraGround(size);
        break;
      case 'nebula':
        this.createNebulaGround(size);
        break;
      case 'plasma':
        this.createPlasmaGround(size);
        break;
      case 'ocean':
        this.createOceanGround(size);
        break;
      case 'snow':
        this.createSnowGround(size);
        break;
      case 'crystal':
        this.createCrystalGround(size);
        break;
      default:
        this.createBlackGround(size);
    }

    return this.ground;
  }

  /**
   * Solid black ground
   */
  createBlackGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Dark ground with subtle variations
   */
  createDarkGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle dark variations
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 5;
      ctx.fillStyle = `rgba(${Math.random() * 30}, ${Math.random() * 30}, ${Math.random() * 30}, 0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      color: 0x111111
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Bright ground with glowing spots
   */
  createBrightGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(0, 0, 512, 512);

    // Bright spots
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 40 + 20;
      ctx.fillStyle = `rgba(255, ${240 + Math.random() * 15}, ${200 + Math.random() * 55}, 0.2)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xffffee,
      emissiveIntensity: 0.3
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Checkerboard pattern
   */
  createCheckerboardGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const squareSize = 64;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Void ground with animated swirls and stars
   */
  createVoidGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawVoid = (time) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);

      // Swirling void patterns
      for (let i = 0; i < 40; i++) {
        const angle = time * 0.0005 + i * 0.3;
        const radius = 100 + Math.sin(time * 0.001 + i) * 80;
        const x = 256 + Math.cos(angle) * radius;
        const y = 256 + Math.sin(angle) * radius;
        const circleSize = Math.sin(time * 0.002 + i) * 30 + 40;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, circleSize);
        grad.addColorStop(0, `rgba(${80 + i * 2}, 0, ${120 + i * 3}, 0.3)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, circleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 123.456) * 256) + 256;
        const y = (Math.cos(i * 789.012) * 256) + 256;
        const twinkle = Math.sin(time * 0.005 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(200, 200, 255, ${twinkle * 0.6})`;
        ctx.fillRect(x, y, 2, 2);
      }
    };

    drawVoid(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x1a0033,
      emissiveIntensity: 0.2
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateVoid = () => {
      if (this.ground && this.currentType === 'void') {
        animTime += 4;
        drawVoid(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateVoid);
      }
    };
    animateVoid();
  }

  /**
   * Neon grid ground with animated colors
   */
  createNeonGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawNeon = (time) => {
      ctx.fillStyle = '#0a0015';
      ctx.fillRect(0, 0, 512, 512);

      const gridSize = 32;
      const hue = (time * 0.05) % 360;

      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += gridSize) {
        const alpha = Math.sin(time * 0.002 + i * 0.01) * 0.3 + 0.5;
        ctx.strokeStyle = `hsla(${(hue + i) % 360}, 100%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    };

    drawNeon(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x4411aa,
      emissiveIntensity: 0.4
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateNeon = () => {
      if (this.ground && this.currentType === 'neon') {
        animTime += 1;
        drawNeon(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateNeon);
      }
    };
    animateNeon();
  }

  /**
   * Matrix rain ground
   */
  createMatrixGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    const drops = Array(32).fill(0);

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = '#0f0';
      ctx.font = '16px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 16;
        const y = drops[i] * 16;

        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5 + 0.5})`;
        ctx.fillText(char, x, y);

        if (y > 512 && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    drawMatrix();
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0x001100,
      emissiveIntensity: 0.3
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    const animateMatrix = () => {
      if (this.ground && this.currentType === 'matrix') {
        drawMatrix();
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateMatrix);
      }
    };
    animateMatrix();
  }

  /**
   * Psychedelic animated patterns
   */
  createPsychedelicGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawPsychedelic = (time) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 50; i++) {
        const x = 256 + Math.sin(time * 0.001 + i * 0.2) * 200;
        const y = 256 + Math.cos(time * 0.0015 + i * 0.3) * 200;
        const radius = Math.sin(time * 0.002 + i) * 30 + 40;
        const hue = (time * 0.1 + i * 10) % 360;

        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPsychedelic(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.5,
      emissive: 0x330033,
      emissiveIntensity: 0.5
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animatePsychedelic = () => {
      if (this.ground && this.currentType === 'psychedelic') {
        animTime += 2;
        drawPsychedelic(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animatePsychedelic);
      }
    };
    animatePsychedelic();
  }

  /**
   * Glass ground
   */
  createGlassGround(size = 200) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xccffff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Ice ground
   */
  createIceGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e0f0ff';
    ctx.fillRect(0, 0, 512, 512);

    // Ice cracks
    for (let i = 0; i < 30; i++) {
      const x1 = Math.random() * 512;
      const y1 = Math.random() * 512;
      const x2 = x1 + (Math.random() - 0.5) * 100;
      const y2 = y1 + (Math.random() - 0.5) * 100;

      ctx.strokeStyle = `rgba(150, 200, 255, ${Math.random() * 0.3 + 0.2})`;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.1,
      metalness: 0.8,
      color: 0xddeeff
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Water ground with waves
   */
  createWaterGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawWater = (time) => {
      ctx.fillStyle = '#0066aa';
      ctx.fillRect(0, 0, 512, 512);

      // Waves
      for (let i = 0; i < 10; i++) {
        const y = (i * 60 + time * 0.5) % 512;
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.3 + Math.sin(time * 0.01 + i) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 10) {
          const waveY = y + Math.sin(x * 0.05 + time * 0.01) * 10;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    };

    drawWater(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.6,
      color: 0x0088cc
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateWater = () => {
      if (this.ground && this.currentType === 'water') {
        animTime += 2;
        drawWater(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateWater);
      }
    };
    animateWater();
  }

  /**
   * Mirror ground
   */
  createMirrorGround(size = 200) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.0,
      metalness: 1.0
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Lava ground with animated flow
   */
  createLavaGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawLava = (time) => {
      ctx.fillStyle = '#220000';
      ctx.fillRect(0, 0, 512, 512);

      // Lava flows
      for (let i = 0; i < 40; i++) {
        const x = (i * 30 + time * 0.3) % 512;
        const y = Math.sin(time * 0.001 + i) * 256 + 256;
        const radius = Math.sin(time * 0.002 + i) * 20 + 30;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(255, ${100 + Math.sin(time * 0.005 + i) * 50}, 0, 0.8)`);
        grad.addColorStop(1, 'rgba(100, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLava(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0xff3300,
      emissiveIntensity: 0.5
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateLava = () => {
      if (this.ground && this.currentType === 'lava') {
        animTime += 2;
        drawLava(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateLava);
      }
    };
    animateLava();
  }

  /**
   * Rainbow ground
   */
  createRainbowGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < 512; i++) {
      const hue = (i / 512) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(0, i, 512, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.6
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Chrome ground
   */
  createChromeGround(size = 200) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.1,
      metalness: 1.0
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Aurora ground with animated lights
   */
  createAuroraGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawAurora = (time) => {
      ctx.fillStyle = '#001122';
      ctx.fillRect(0, 0, 512, 512);

      // Aurora waves
      for (let i = 0; i < 5; i++) {
        const hue = (time * 0.1 + i * 60) % 360;
        for (let y = 0; y < 512; y += 4) {
          const wave = Math.sin(y * 0.01 + time * 0.002 + i) * 100 + 256;
          const alpha = Math.sin(y * 0.02 + time * 0.001) * 0.3 + 0.3;
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
          ctx.fillRect(wave - 50, y, 100, 4);
        }
      }
    };

    drawAurora(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x002244,
      emissiveIntensity: 0.4
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateAurora = () => {
      if (this.ground && this.currentType === 'aurora') {
        animTime += 1;
        drawAurora(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateAurora);
      }
    };
    animateAurora();
  }

  /**
   * Nebula ground with space clouds
   */
  createNebulaGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawNebula = (time) => {
      ctx.fillStyle = '#000510';
      ctx.fillRect(0, 0, 512, 512);

      // Nebula clouds
      for (let i = 0; i < 20; i++) {
        const x = Math.sin(time * 0.0005 + i * 0.5) * 200 + 256;
        const y = Math.cos(time * 0.0007 + i * 0.7) * 200 + 256;
        const radius = Math.sin(time * 0.001 + i) * 50 + 100;
        const hue = (i * 30 + time * 0.05) % 360;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.4)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (let i = 0; i < 200; i++) {
        const x = (Math.sin(i * 123.456) * 256) + 256;
        const y = (Math.cos(i * 789.012) * 256) + 256;
        const twinkle = Math.sin(time * 0.01 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fillRect(x, y, 2, 2);
      }
    };

    drawNebula(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0x110033,
      emissiveIntensity: 0.3
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animateNebula = () => {
      if (this.ground && this.currentType === 'nebula') {
        animTime += 1;
        drawNebula(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animateNebula);
      }
    };
    animateNebula();
  }

  /**
   * Plasma ground with flowing energy
   */
  createPlasmaGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawPlasma = (time) => {
      for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
          const value = Math.sin(x * 0.02 + time * 0.01) +
                       Math.sin(y * 0.02 + time * 0.015) +
                       Math.sin((x + y) * 0.015 + time * 0.02) +
                       Math.sin(Math.sqrt(x * x + y * y) * 0.02 + time * 0.01);
          const hue = ((value + 4) / 8) * 360;
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.fillRect(x, y, 4, 4);
        }
      }
    };

    drawPlasma(0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x660066,
      emissiveIntensity: 0.5
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);

    // Animate
    let animTime = 0;
    const animatePlasma = () => {
      if (this.ground && this.currentType === 'plasma') {
        animTime += 1;
        drawPlasma(animTime);
        texture.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(animatePlasma);
      }
    };
    animatePlasma();
  }

  /**
   * Ocean ground with waves
   */
  createOceanGround(size = 200) {
    this.createWaterGround(size); // Similar to water
  }

  /**
   * Snow ground
   */
  createSnowGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // Snowflakes
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(220, 230, 255, ${Math.random() * 0.5 + 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      color: 0xffffff
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Crystal cave ground
   */
  createCrystalGround(size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a0033';
    ctx.fillRect(0, 0, 512, 512);

    // Crystals
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 10;
      const hue = Math.random() * 60 + 240; // Blue-purple range

      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.8)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x4400aa,
      emissiveIntensity: 0.4
    });

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.renderer.addToScene(this.ground);
  }

  /**
   * Get ground physics properties
   * @returns {Object} Friction and restitution values
   */
  getPhysicsProperties() {
    if (!this.ground) return { friction: 0.8, restitution: 0.0 };
    return {
      friction: this.ground.userData.friction || 0.8,
      restitution: this.ground.userData.restitution || 0.0
    };
  }

  /**
   * Clean up ground and animations
   */
  cleanup() {
    // Cancel any animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.ground) {
      this.renderer.removeFromScene(this.ground);
      this.ground.geometry.dispose();
      this.ground.material.dispose();
      if (this.ground.material.map) {
        this.ground.material.map.dispose();
      }
      this.ground = null;
    }
  }
}
