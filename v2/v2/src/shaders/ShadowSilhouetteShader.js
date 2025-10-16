import * as THREE from 'three';

/**
 * Shader that creates a fuzzy, morphing black silhouette with glowing eyes
 * Perfect for shadow/void creatures
 */

export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float time;
  uniform float flowSpeed;
  uniform float flowAmp;
  uniform float waveCount;
  uniform float waveType; // 0=smooth, 1=sharp, 2=pulse

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // World position for fragment shader
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    // Different wave functions based on waveType
    float wave = 0.0;

    if (waveType < 0.5) {
      // Smooth sine waves (default)
      wave += sin(pos.x * 8.0 + time * 1.5 * flowSpeed) * 0.12 * flowAmp;
      if (waveCount >= 2.0) {
        wave += cos(pos.y * 6.0 + time * 1.2 * flowSpeed) * 0.10 * flowAmp;
      }
      if (waveCount >= 3.0) {
        wave += sin((pos.x + pos.y) * 5.0 + time * 1.0 * flowSpeed) * 0.08 * flowAmp;
      }
    } else if (waveType < 1.5) {
      // Sharp triangular waves
      wave += (abs(sin(pos.x * 8.0 + time * 1.5 * flowSpeed)) * 2.0 - 1.0) * 0.12 * flowAmp;
      if (waveCount >= 2.0) {
        wave += (abs(cos(pos.y * 6.0 + time * 1.2 * flowSpeed)) * 2.0 - 1.0) * 0.10 * flowAmp;
      }
      if (waveCount >= 3.0) {
        wave += (abs(sin((pos.x + pos.y) * 5.0 + time * 1.0 * flowSpeed)) * 2.0 - 1.0) * 0.08 * flowAmp;
      }
    } else {
      // Pulsing waves (smoothstep)
      float pulse1 = smoothstep(0.0, 1.0, abs(sin(pos.x * 8.0 + time * 1.5 * flowSpeed)));
      wave += (pulse1 * 2.0 - 1.0) * 0.12 * flowAmp;
      if (waveCount >= 2.0) {
        float pulse2 = smoothstep(0.0, 1.0, abs(cos(pos.y * 6.0 + time * 1.2 * flowSpeed)));
        wave += (pulse2 * 2.0 - 1.0) * 0.10 * flowAmp;
      }
      if (waveCount >= 3.0) {
        float pulse3 = smoothstep(0.0, 1.0, abs(sin((pos.x + pos.y) * 5.0 + time * 1.0 * flowSpeed)));
        wave += (pulse3 * 2.0 - 1.0) * 0.08 * flowAmp;
      }
    }

    // Push vertices
    pos += normal * wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentShader = `
  uniform float time;
  uniform vec3 eyeColor;
  uniform float fuzzyAmount;
  uniform float eyeSize;
  uniform float flowSpeed;
  uniform float flowAmp;
  uniform float waveCount;
  uniform float waveType;
  uniform float shapeType; // 0=humanoid, 1=doctor, 2=blob, 3=tall_thin, 4=spider_crawler, 5=serpent
  uniform vec3 baseColor;
  uniform vec3 gradientColor;
  uniform float isCrawler; // 1.0 for crawlers, 0.0 for standing enemies
  uniform vec3 outlineColor; // Configurable outline color
  uniform float outlineWidth; // Configurable outline width

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec2 uv = vUv;
    float x = uv.x - 0.5;
    float y = uv.y;
    float shape = 0.0;

    if (shapeType < 0.5) {
      // Humanoid shape
      float head = length(vec2(x, y - 0.85)) - 0.12;
      float bodyWidth = 0.15 + smoothstep(0.3, 0.6, y) * 0.08;
      float body = abs(x) - bodyWidth;
      body = max(body, -(y - 0.15));
      body = max(body, -(0.7 - y));
      shape = min(head, body);
    } else if (shapeType < 1.5) {
      // Doctor/lab coat shape (wider at bottom)
      float head = length(vec2(x, y - 0.85)) - 0.12;
      float bodyWidth = 0.15 + smoothstep(0.15, 0.4, y) * 0.12; // Wider flare
      float body = abs(x) - bodyWidth;
      body = max(body, -(y - 0.1)); // Wider at bottom
      body = max(body, -(0.7 - y));
      shape = min(head, body);
    } else if (shapeType < 2.5) {
      // Blob/amorphous (organic circle)
      float blob = length(vec2(x, y - 0.5)) - 0.25;
      // Add some organic variation
      blob += sin(y * 20.0 + time) * 0.03;
      blob += cos(x * 15.0 + time * 1.2) * 0.03;
      shape = blob;
    } else if (shapeType < 3.5) {
      // Tall thin wraith
      float head = length(vec2(x, y - 0.88)) - 0.10; // Smaller head
      float bodyWidth = 0.10 + smoothstep(0.4, 0.7, y) * 0.05; // Very thin
      float body = abs(x) - bodyWidth;
      body = max(body, -(y - 0.1));
      body = max(body, -(0.75 - y)); // Taller
      shape = min(head, body);
    } else if (shapeType < 4.5) {
      // Spider/crawler shape - horizontal orientation
      // Center at 0.5
      float xCentered = x;
      float yCentered = y - 0.5;

      // Main body (oval, wider than tall)
      float body = length(vec2(xCentered * 1.2, yCentered * 1.8)) - 0.2;

      // Head bump at front (top of UV)
      float head = length(vec2(xCentered * 1.5, yCentered - 0.15)) - 0.12;

      // 8 legs as thin rectangles extending from body
      float allLegs = 1.0;

      // Front pair
      float leg1 = length(vec2(max(abs(xCentered) - 0.15, 0.0), yCentered + 0.12)) - 0.15;
      float leg2 = length(vec2(max(abs(xCentered) - 0.15, 0.0), yCentered - 0.12)) - 0.15;

      // Middle pair
      float leg3 = length(vec2(max(abs(xCentered) - 0.05, 0.0), yCentered + 0.18)) - 0.18;
      float leg4 = length(vec2(max(abs(xCentered) - 0.05, 0.0), yCentered - 0.18)) - 0.18;

      // Back pair
      float leg5 = length(vec2(max(abs(xCentered) + 0.05, 0.0), yCentered + 0.15)) - 0.15;
      float leg6 = length(vec2(max(abs(xCentered) + 0.05, 0.0), yCentered - 0.15)) - 0.15;

      // Extra back pair
      float leg7 = length(vec2(max(abs(xCentered) + 0.12, 0.0), yCentered + 0.12)) - 0.12;
      float leg8 = length(vec2(max(abs(xCentered) + 0.12, 0.0), yCentered - 0.12)) - 0.12;

      allLegs = min(allLegs, leg1);
      allLegs = min(allLegs, leg2);
      allLegs = min(allLegs, leg3);
      allLegs = min(allLegs, leg4);
      allLegs = min(allLegs, leg5);
      allLegs = min(allLegs, leg6);
      allLegs = min(allLegs, leg7);
      allLegs = min(allLegs, leg8);

      shape = min(min(body, head), allLegs);
    } else {
      // Serpent/worm shape - HORIZONTAL (along X axis, head at top of UV)
      float xCentered = x;
      float yCentered = y - 0.5;

      // Long horizontal ellipse (head to tail goes up-down in UV, which is forward-back when rotated)
      float serpent = length(vec2(xCentered * 2.5, yCentered * 0.8)) - 0.15;

      // Pointed head at y=0.85
      float headTaper = smoothstep(0.7, 0.85, y);
      serpent += headTaper * 0.08;

      // Tapered tail at y=0.15
      float tailTaper = smoothstep(0.3, 0.15, y);
      serpent += tailTaper * 0.08;

      // Add segmentation along the body
      float segments = sin(y * 40.0 + time * 2.0) * 0.015;
      serpent += segments;

      shape = serpent;
    }

    // Simple liquid distortion - 1-3 large smooth waves
    float flow = 0.0;

    if (isCrawler > 0.5) {
      // Horizontal waves for crawlers (flow along length/X axis)
      flow += sin(vWorldPos.z * 10.0 + time * 1.5 * flowSpeed) * 0.8 * flowAmp;

      if (waveCount >= 2.0) {
        flow += cos(vWorldPos.x * 8.0 + time * 1.2 * flowSpeed) * 0.6 * flowAmp;
      }

      if (waveCount >= 3.0) {
        flow += sin((vWorldPos.x + vWorldPos.z) * 6.0 + time * 1.0 * flowSpeed) * 0.5 * flowAmp;
      }
    } else {
      // Vertical waves for standing enemies (flow along height/Y axis)
      flow += sin(vWorldPos.x * 10.0 + time * 1.5 * flowSpeed) * 0.8 * flowAmp;

      if (waveCount >= 2.0) {
        flow += cos(vWorldPos.y * 8.0 + time * 1.2 * flowSpeed) * 0.6 * flowAmp;
      }

      if (waveCount >= 3.0) {
        flow += sin((vWorldPos.x + vWorldPos.y) * 6.0 + time * 1.0 * flowSpeed) * 0.5 * flowAmp;
      }
    }

    // Apply flow to shape edges
    shape += flow * 0.04;

    // Fuzzy edges
    float alpha = 1.0 - smoothstep(-0.02, 0.02, shape);

    // Configurable outline for visibility
    float outlineAlpha = smoothstep(outlineWidth, 0.02, shape) - smoothstep(0.02, -0.02, shape);

    // Discard pixels outside silhouette and outline
    if (alpha < 0.1 && outlineAlpha < 0.1) discard;

    // Create gradient from bottom to top
    vec3 colorGradient = mix(baseColor, gradientColor, smoothstep(0.0, 1.0, y));

    // Flowing highlights (subtle)
    float highlight = flow * 0.08;
    colorGradient += vec3(highlight * 0.4, highlight * 0.3, highlight * 0.6);

    // Eyes - configurable size and position
    vec2 leftEyePos, rightEyePos;

    if (shapeType > 3.5 && shapeType < 4.5) {
      // Spider - large eyes on head bump (center-left area)
      leftEyePos = vec2(0.45, 0.4);
      rightEyePos = vec2(0.55, 0.4);
    } else if (shapeType > 4.5) {
      // Serpent - eyes at head (top of UV = forward when rotated)
      leftEyePos = vec2(0.45, 0.8);
      rightEyePos = vec2(0.55, 0.8);
    } else {
      // Default - humanoid eye positions
      leftEyePos = vec2(0.4, 0.85);
      rightEyePos = vec2(0.6, 0.85);
    }

    float leftEyeDist = length(uv - leftEyePos);
    float rightEyeDist = length(uv - rightEyePos);

    // Pulsing eyes
    float eyePulse = sin(time * 2.5) * 0.4 + 0.6;
    float leftEyeGlow = smoothstep(eyeSize, 0.0, leftEyeDist) * eyePulse;
    float rightEyeGlow = smoothstep(eyeSize, 0.0, rightEyeDist) * eyePulse;
    float eyeGlow = max(leftEyeGlow, rightEyeGlow);

    // Eye halos
    float eyeHalo = (smoothstep(eyeSize * 4.0, eyeSize, leftEyeDist) +
                     smoothstep(eyeSize * 4.0, eyeSize, rightEyeDist)) * 0.5 * eyePulse;

    // Mix in eyes
    vec3 finalColor = mix(colorGradient, eyeColor, eyeGlow + eyeHalo);

    // Mix in bright outline for visibility
    finalColor = mix(finalColor, outlineColor, outlineAlpha * 0.7);
    float finalAlpha = max(alpha * 0.95, outlineAlpha * 0.6);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

/**
 * Create a shadow silhouette material
 * @param {number} eyeColorHex - Hex color for the eyes (default: red)
 * @param {number} fuzzyAmount - Amount of fuzziness (0-1, default: 0.5)
 * @param {number} eyeSize - Size of eyes (default: 0.04)
 * @param {number} flowSpeed - Speed multiplier for liquid flow (default: 1.0)
 * @param {number} flowAmp - Amplitude multiplier for liquid flow (default: 1.0)
 * @param {number} waveCount - Number of waves (1-3, default: 2)
 * @param {number} waveType - Type of wave (0=smooth, 1=sharp, 2=pulse, default: 0)
 * @param {number} shapeType - Shape type (0=humanoid, 1=doctor, 2=blob, 3=tall_thin, 4=spider_crawler, 5=serpent, default: 0)
 * @param {number} baseColorHex - Base color (default: black)
 * @param {number} gradientColorHex - Gradient color (default: black)
 * @param {number} outlineColorHex - Outline color (default: almost black 0x0d0d0d)
 * @param {number} outlineWidthValue - Outline width (default: 0.05)
 * @returns {THREE.ShaderMaterial}
 */
export function createShadowSilhouetteMaterial(
  eyeColorHex = 0xff0000,
  fuzzyAmount = 0.5,
  eyeSize = 0.04,
  flowSpeed = 1.0,
  flowAmp = 1.0,
  waveCount = 2,
  waveType = 0,
  shapeType = 0,
  baseColorHex = 0x000000,
  gradientColorHex = 0x000000,
  isCrawler = false,
  outlineColorHex = 0x0d0d0d,
  outlineWidthValue = 0.05
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      eyeColor: { value: new THREE.Color(eyeColorHex) },
      fuzzyAmount: { value: fuzzyAmount },
      eyeSize: { value: eyeSize },
      flowSpeed: { value: flowSpeed },
      flowAmp: { value: flowAmp },
      waveCount: { value: waveCount },
      waveType: { value: waveType },
      shapeType: { value: shapeType },
      baseColor: { value: new THREE.Color(baseColorHex) },
      gradientColor: { value: new THREE.Color(gradientColorHex) },
      isCrawler: { value: isCrawler ? 1.0 : 0.0 },
      outlineColor: { value: new THREE.Color(outlineColorHex) },
      outlineWidth: { value: outlineWidthValue }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
}
