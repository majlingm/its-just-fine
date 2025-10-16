import { Entity } from '../../core/ecs/Entity.js';
import { Transform } from '../../components/Transform.js';
import { Health } from '../../components/Health.js';
import { Movement } from '../../components/Movement.js';
import { Renderable } from '../../components/Renderable.js';
import { AI } from '../../components/AI.js';
import { Collider } from '../../components/Collider.js';
import { Boss } from '../../components/Boss.js';
import { configLoader } from '../../utils/ConfigLoader.js';

/**
 * EntityFactory - Create entities from configuration
 *
 * Builds ECS entities from JSON config files.
 * Handles component creation and initialization.
 */
export class EntityFactory {
  constructor() {
    // Component registry - maps component types to classes
    this.componentTypes = new Map([
      ['Transform', Transform],
      ['Health', Health],
      ['Movement', Movement],
      ['Renderable', Renderable],
      ['AI', AI],
      ['Collider', Collider],
      ['Boss', Boss],
    ]);
  }

  /**
   * Register a custom component type
   * @param {string} name - Component name
   * @param {Class} ComponentClass - Component class
   */
  registerComponent(name, ComponentClass) {
    this.componentTypes.set(name, ComponentClass);
  }

  /**
   * Create an entity from a component list
   * @param {Array<Object>} components - Component definitions
   * @param {Array<string>} tags - Entity tags
   * @returns {Entity} Created entity
   */
  create(components = [], tags = []) {
    const entity = new Entity();

    // Add components
    for (const componentDef of components) {
      const ComponentClass = this.componentTypes.get(componentDef.type);

      if (!ComponentClass) {
        console.warn(`Unknown component type: ${componentDef.type}`);
        continue;
      }

      const component = new ComponentClass();
      component.init(componentDef);
      entity.addComponent(component);
    }

    // Add tags
    for (const tag of tags) {
      entity.addTag(tag);
    }

    return entity;
  }

  /**
   * Create an enemy entity from config
   * @param {string} enemyId - Enemy ID from config
   * @param {Object} overrides - Override config values (supports multipliers for infinite mode)
   * @returns {Promise<Entity>} Created enemy entity
   */
  async createEnemy(enemyId, overrides = {}) {
    const config = await configLoader.getEnemy(enemyId);

    // Merge config with overrides
    const finalConfig = { ...config, ...overrides };

    // Apply scaling multipliers if provided (for infinite mode)
    const healthMult = finalConfig.healthMultiplier || 1;
    const damageMult = finalConfig.damageMultiplier || 1;
    const speedMult = finalConfig.speedMultiplier || 1;

    const scaledHealth = Math.floor(finalConfig.health * healthMult);
    const scaledSpeed = finalConfig.speed * speedMult;
    const scaledMaxSpeed = (finalConfig.maxSpeed || finalConfig.speed * 1.5) * speedMult;

    // Build component list from config
    const components = [
      {
        type: 'Transform',
        x: finalConfig.x || 0,
        y: finalConfig.y || 0,
        z: finalConfig.z || 0,
        scaleX: finalConfig.scale || 1,
        scaleY: finalConfig.scale || 1,
        scaleZ: finalConfig.scale || 1,
      },
      {
        type: 'Health',
        current: scaledHealth,
        max: scaledHealth,
      },
      {
        type: 'Movement',
        speed: scaledSpeed,
        maxSpeed: scaledMaxSpeed,
      },
      {
        type: 'Renderable',
        modelType: finalConfig.model,
        color: finalConfig.color || 0xffffff,
        castShadow: finalConfig.castShadow !== false,
        receiveShadow: finalConfig.receiveShadow !== false,
        shaderConfig: finalConfig.shaderConfig || null,
      },
    ];

    // Add AI component if AI config exists
    if (finalConfig.ai) {
      components.push({
        type: 'AI',
        behavior: finalConfig.ai.behavior || 'idle',
        aggroRange: finalConfig.ai.aggroRange || 30,
        attackRange: finalConfig.ai.attackRange || 2,
        attackCooldown: finalConfig.ai.attackCooldown || 1.0,
      });
    }

    // Add Collider component for collision detection
    components.push({
      type: 'Collider',
      shape: 'sphere',
      radius: 0.5,
      layer: 'enemy',
      collidesWith: ['player', 'enemy'],  // Collide with player AND other enemies
      isSolid: true,  // Solid collision - entities push each other apart
      bounciness: 0.3,  // Some bounce on collision
      collisionResolutionMode: 'horizontal'  // 2.5D collision (ignore Y axis)
    });

    // Create entity with enemy tag
    const entity = this.create(components, ['enemy', enemyId]);

    // Store original config reference
    entity.configId = enemyId;
    entity.displayName = finalConfig.displayName || enemyId;

    return entity;
  }

  /**
   * Create a boss entity from config
   * @param {string} bossId - Boss ID from config
   * @param {Object} overrides - Override config values
   * @returns {Promise<Entity>} Created boss entity
   */
  async createBoss(bossId, overrides = {}) {
    const config = await configLoader.getEnemy(bossId);

    // Merge config with overrides
    const finalConfig = { ...config, ...overrides };

    // Build component list (similar to enemy but with boss-specific features)
    const components = [
      {
        type: 'Transform',
        x: finalConfig.x || 0,
        y: finalConfig.y || 0,
        z: finalConfig.z || 0,
        scaleX: finalConfig.scale || 1,
        scaleY: finalConfig.scale || 1,
        scaleZ: finalConfig.scale || 1,
      },
      {
        type: 'Health',
        current: finalConfig.health,
        max: finalConfig.health,
      },
      {
        type: 'Movement',
        speed: finalConfig.speed,
        maxSpeed: finalConfig.maxSpeed || finalConfig.speed * 1.5,
      },
      {
        type: 'Renderable',
        modelType: finalConfig.model,
        color: finalConfig.color || 0xff0000,
        castShadow: finalConfig.castShadow !== false,
        receiveShadow: finalConfig.receiveShadow !== false,
        shaderConfig: finalConfig.shaderConfig || null,
      },
    ];

    // Add AI component
    if (finalConfig.ai) {
      components.push({
        type: 'AI',
        behavior: finalConfig.ai.behavior || 'boss',
        aggroRange: finalConfig.ai.aggroRange || 50,
        attackRange: finalConfig.ai.attackRange || 3,
        attackCooldown: finalConfig.ai.attackCooldown || 1.5,
      });
    }

    // Add Boss component with phase and ability data
    if (finalConfig.boss) {
      const bossConfig = finalConfig.boss;
      components.push({
        type: 'Boss',
        bossName: bossConfig.bossName || finalConfig.displayName || bossId,
        bossType: bossConfig.bossType || 'melee',
        phases: bossConfig.phases || [],
        abilities: bossConfig.abilities || [],
        attackPattern: bossConfig.attackPattern || 'basic',
        attackCooldown: bossConfig.attackCooldown || 2.0,
        canSummonMinions: bossConfig.canSummonMinions || false,
        minionType: bossConfig.minionType || '',
        maxMinions: bossConfig.maxMinions || 3,
        minionSpawnCooldown: bossConfig.minionSpawnCooldown || 10.0,
      });
    }

    // Add Collider component (bosses are larger)
    components.push({
      type: 'Collider',
      shape: 'sphere',
      radius: (finalConfig.scale || 1) * 1.5,
      layer: 'enemy',
      collidesWith: ['player', 'enemy'],
      isSolid: true,
      bounciness: 0.2,
      collisionResolutionMode: 'horizontal'
    });

    // Create entity with boss tags
    const entity = this.create(components, ['boss', 'enemy', bossId]);

    // Store config reference
    entity.configId = bossId;
    entity.displayName = finalConfig.displayName || bossId;
    entity.isBoss = true;

    return entity;
  }

  /**
   * Create multiple enemies
   * @param {string} enemyId - Enemy ID
   * @param {number} count - Number to create
   * @param {Function} positionFn - Function to determine position for each (index) => {x, z}
   * @returns {Promise<Array<Entity>>} Array of created enemies
   */
  async createEnemies(enemyId, count, positionFn) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      const position = positionFn ? positionFn(i) : { x: 0, z: 0 };
      promises.push(this.createEnemy(enemyId, position));
    }

    return Promise.all(promises);
  }

  /**
   * Clone an entity (create copy with same components)
   * @param {Entity} entity - Entity to clone
   * @returns {Entity} Cloned entity
   */
  clone(entity) {
    const cloned = new Entity();

    // Clone all components
    for (const component of entity.getAllComponents()) {
      const clonedComponent = component.clone();
      cloned.addComponent(clonedComponent);
    }

    // Copy tags
    for (const tag of entity.tags) {
      cloned.addTag(tag);
    }

    return cloned;
  }
}

// Singleton instance
export const entityFactory = new EntityFactory();
