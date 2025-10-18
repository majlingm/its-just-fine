/**
 * NoiseGenerator - Simple Perlin-like noise for procedural generation
 *
 * Based on improved Perlin noise algorithm
 */
export class NoiseGenerator {
  constructor(seed = 12345) {
    this.seed = seed;
    this.permutation = this.generatePermutation();
  }

  /**
   * Generate permutation table for noise
   */
  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle using seed
    let random = this.seed;
    for (let i = 255; i > 0; i--) {
      random = (random * 16807) % 2147483647;
      const j = Math.floor((random / 2147483647) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate to avoid overflow
    return [...p, ...p];
  }

  /**
   * Fade function for smooth interpolation
   */
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  lerp(t, a, b) {
    return a + t * (b - a);
  }

  /**
   * Gradient function
   */
  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Noise value between -1 and 1
   */
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const p = this.permutation;
    const a = p[X] + Y;
    const aa = p[a];
    const ab = p[a + 1];
    const b = p[X + 1] + Y;
    const ba = p[b];
    const bb = p[b + 1];

    return this.lerp(v,
      this.lerp(u, this.grad(p[aa], x, y), this.grad(p[ba], x - 1, y)),
      this.lerp(u, this.grad(p[ab], x, y - 1), this.grad(p[bb], x - 1, y - 1))
    );
  }

  /**
   * Fractal Brownian Motion - layered noise for natural-looking terrain
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} octaves - Number of noise layers
   * @param {number} persistence - How much each octave contributes
   * @returns {number} Noise value between -1 and 1
   */
  fbm(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}
