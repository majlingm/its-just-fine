import { ColoredLightning } from '../entities/ColoredLightning.js';

/**
 * Lightning effect - creates electric bolts with branches
 * Configuration options:
 * - color: Main bolt color (default: 0x88ccff)
 * - glowColor: Glow layer color (default: 0xffffff)
 * - width: Bolt thickness (default: 4)
 * - taper: Taper from thick to thin (default: false)
 * - gradientColor: End color for gradient (default: null)
 * - lifetime: How long the bolt lasts (default: 0.3)
 * - branches: Number of branches (default: 0)
 * - branchWidth: Branch thickness multiplier (default: 0.4)
 * - maxDepth: Maximum recursion depth for branches (default: 1)
 */
export class LightningEffect {
  constructor(config = {}) {
    this.config = {
      color: 0x88ccff,
      glowColor: 0xffffff,
      width: 4,
      taper: false,
      gradientColor: null,
      lifetime: 0.3,
      branches: 0,
      branchWidth: 0.4,
      maxDepth: 1, // Prevent infinite recursion
      ...config
    };
  }

  /**
   * Spawn a lightning bolt
   * @param {Object} engine - Game engine
   * @param {Object} params - { startX, startY, startZ, endX, endY, endZ, damage, depth }
   * @returns {ColoredLightning} The created lightning entity
   */
  spawn(engine, params) {
    const { startX, startY, startZ, endX, endY, endZ, damage = 0, depth = 0 } = params;

    // Calculate width based on depth (branches get progressively thinner)
    const width = this.config.width * Math.pow(this.config.branchWidth, depth);

    // Create main lightning bolt
    const lightning = new ColoredLightning(
      engine,
      startX, startY, startZ,
      endX, endY, endZ,
      damage,
      this.config.color,
      this.config.glowColor,
      width,
      this.config.taper,
      this.config.gradientColor
    );
    lightning.lifetime = this.config.lifetime;
    engine.addEntity(lightning);

    // Create branches if configured and depth allows - wait for pathPoints to be created
    if (this.config.branches > 0 && depth < this.config.maxDepth) {
      setTimeout(() => {
        if (!lightning.pathPoints || lightning.pathPoints.length === 0) return;

        for (let i = 0; i < this.config.branches; i++) {
          // Pick a random point along the main bolt path (not the endpoints)
          const pathIndex = Math.floor(2 + Math.random() * (lightning.pathPoints.length - 4));
          const branchStart = lightning.pathPoints[pathIndex];

          const branchAngle = Math.random() * Math.PI * 2;
          const branchDist = 1.5 + Math.random() * 2;

          // Branch mostly goes down/sideways, rarely up
          const upwardChance = Math.random();
          let verticalDirection;
          if (upwardChance < 0.15) { // 15% chance to go up
            verticalDirection = Math.random() * 0.3; // Slight upward
          } else {
            verticalDirection = -Math.random() * 0.8; // Mostly downward
          }
          const endHeight = branchStart.y + verticalDirection * (1 + Math.random() * 3);

          const endX = branchStart.x + Math.cos(branchAngle) * branchDist;
          const endZ = branchStart.z + Math.sin(branchAngle) * branchDist;

          // Recursively spawn branch with reduced width and increased depth
          const branch = this.spawn(engine, {
            startX: branchStart.x,
            startY: branchStart.y,
            startZ: branchStart.z,
            endX: endX,
            endY: endHeight,
            endZ: endZ,
            damage: 0,
            depth: depth + 1
          });

          // Store branch endpoint for damage calculation
          if (!lightning.branchEndpoints) lightning.branchEndpoints = [];
          lightning.branchEndpoints.push({ x: endX, y: endHeight, z: endZ });

          // Collect endpoints from sub-branches recursively
          if (branch.branchEndpoints) {
            lightning.branchEndpoints.push(...branch.branchEndpoints);
          }
        }
      }, 0);
    }

    return lightning;
  }
}
