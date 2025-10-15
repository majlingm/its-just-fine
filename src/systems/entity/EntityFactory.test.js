import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityFactory } from './EntityFactory.js';
import { Transform } from '../../components/Transform.js';
import { Health } from '../../components/Health.js';
import { Movement } from '../../components/Movement.js';
import { Renderable } from '../../components/Renderable.js';
import { AI } from '../../components/AI.js';
import { configLoader } from '../../utils/ConfigLoader.js';

// Mock configLoader
vi.mock('../../utils/ConfigLoader.js', () => ({
  configLoader: {
    getEnemy: vi.fn(),
    getBoss: vi.fn()
  }
}));

describe('EntityFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new EntityFactory();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should register default component types', () => {
      expect(factory.componentTypes.size).toBe(5);
      expect(factory.componentTypes.get('Transform')).toBe(Transform);
      expect(factory.componentTypes.get('Health')).toBe(Health);
      expect(factory.componentTypes.get('Movement')).toBe(Movement);
      expect(factory.componentTypes.get('Renderable')).toBe(Renderable);
      expect(factory.componentTypes.get('AI')).toBe(AI);
    });
  });

  describe('component registration', () => {
    it('should register custom component type', () => {
      class CustomComponent {
        init() {}
      }

      factory.registerComponent('Custom', CustomComponent);

      expect(factory.componentTypes.get('Custom')).toBe(CustomComponent);
      expect(factory.componentTypes.size).toBe(6);
    });

    it('should override existing component type', () => {
      class CustomTransform {
        init() {}
      }

      factory.registerComponent('Transform', CustomTransform);

      expect(factory.componentTypes.get('Transform')).toBe(CustomTransform);
      expect(factory.componentTypes.size).toBe(5); // Same size, replaced
    });
  });

  describe('creating entities from components', () => {
    it('should create entity with no components', () => {
      const entity = factory.create();

      expect(entity).toBeDefined();
      expect(entity.id).toBeGreaterThan(0);
      expect(entity.getAllComponents()).toHaveLength(0);
    });

    it('should create entity with single component', () => {
      const components = [
        { type: 'Transform', x: 10, y: 5, z: 0 }
      ];

      const entity = factory.create(components);

      expect(entity.hasComponent('Transform')).toBe(true);
      const transform = entity.getComponent('Transform');
      expect(transform.x).toBe(10);
      expect(transform.y).toBe(5);
      expect(transform.z).toBe(0);
    });

    it('should create entity with multiple components', () => {
      const components = [
        { type: 'Transform', x: 5, y: 10, z: 15 },
        { type: 'Health', current: 100, max: 100 },
        { type: 'Movement', speed: 5 }
      ];

      const entity = factory.create(components);

      expect(entity.hasComponent('Transform')).toBe(true);
      expect(entity.hasComponent('Health')).toBe(true);
      expect(entity.hasComponent('Movement')).toBe(true);

      const health = entity.getComponent('Health');
      expect(health.current).toBe(100);
      expect(health.max).toBe(100);
    });

    it('should add tags to entity', () => {
      const entity = factory.create([], ['enemy', 'shadow']);

      expect(entity.hasTag('enemy')).toBe(true);
      expect(entity.hasTag('shadow')).toBe(true);
    });

    it('should warn on unknown component type', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const components = [
        { type: 'UnknownComponent', data: 'test' }
      ];

      const entity = factory.create(components);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown component type: UnknownComponent');
      expect(entity.getAllComponents()).toHaveLength(0);

      consoleWarnSpy.mockRestore();
    });

    it('should initialize components with provided data', () => {
      const components = [
        {
          type: 'Health',
          current: 50,
          max: 150,
          regenRate: 5
        }
      ];

      const entity = factory.create(components);
      const health = entity.getComponent('Health');

      expect(health.current).toBe(50);
      expect(health.max).toBe(150);
      expect(health.regenRate).toBe(5);
    });
  });

  describe('creating enemies from config', () => {
    it('should create enemy from config', async () => {
      const enemyConfig = {
        displayName: 'Shadow Lurker',
        health: 100,
        speed: 5.5,
        maxSpeed: 8.0,
        scale: 0.8,
        model: 'shadow',
        color: 0x4a0080,
        ai: {
          behavior: 'chase_player',
          aggroRange: 30,
          attackRange: 2,
          attackCooldown: 1.0
        }
      };

      configLoader.getEnemy.mockResolvedValueOnce(enemyConfig);

      const enemy = await factory.createEnemy('shadow_lurker');

      expect(configLoader.getEnemy).toHaveBeenCalledWith('shadow_lurker');
      expect(enemy.configId).toBe('shadow_lurker');
      expect(enemy.displayName).toBe('Shadow Lurker');
      expect(enemy.hasTag('enemy')).toBe(true);
      expect(enemy.hasTag('shadow_lurker')).toBe(true);

      // Check components
      expect(enemy.hasComponent('Transform')).toBe(true);
      expect(enemy.hasComponent('Health')).toBe(true);
      expect(enemy.hasComponent('Movement')).toBe(true);
      expect(enemy.hasComponent('Renderable')).toBe(true);
      expect(enemy.hasComponent('AI')).toBe(true);

      const health = enemy.getComponent('Health');
      expect(health.current).toBe(100);
      expect(health.max).toBe(100);

      const movement = enemy.getComponent('Movement');
      expect(movement.speed).toBe(5.5);
      expect(movement.maxSpeed).toBe(8.0);

      const ai = enemy.getComponent('AI');
      expect(ai.behavior).toBe('chase_player');
      expect(ai.aggroRange).toBe(30);
    });

    it('should apply overrides to enemy config', async () => {
      const enemyConfig = {
        health: 100,
        speed: 5.5,
        x: 0,
        y: 0,
        z: 0
      };

      configLoader.getEnemy.mockResolvedValueOnce(enemyConfig);

      const enemy = await factory.createEnemy('shadow_lurker', {
        x: 10,
        z: 20,
        health: 150
      });

      const transform = enemy.getComponent('Transform');
      expect(transform.x).toBe(10);
      expect(transform.z).toBe(20);

      const health = enemy.getComponent('Health');
      expect(health.current).toBe(150);
      expect(health.max).toBe(150);
    });

    it('should create enemy without AI component if no AI config', async () => {
      const enemyConfig = {
        health: 100,
        speed: 5.5,
        model: 'simple'
      };

      configLoader.getEnemy.mockResolvedValueOnce(enemyConfig);

      const enemy = await factory.createEnemy('simple_enemy');

      expect(enemy.hasComponent('Transform')).toBe(true);
      expect(enemy.hasComponent('Health')).toBe(true);
      expect(enemy.hasComponent('Movement')).toBe(true);
      expect(enemy.hasComponent('Renderable')).toBe(true);
      expect(enemy.hasComponent('AI')).toBe(false);
    });

    it('should use default values for missing properties', async () => {
      const enemyConfig = {
        health: 100,
        speed: 5.5
      };

      configLoader.getEnemy.mockResolvedValueOnce(enemyConfig);

      const enemy = await factory.createEnemy('minimal_enemy');

      const transform = enemy.getComponent('Transform');
      expect(transform.x).toBe(0);
      expect(transform.y).toBe(0);
      expect(transform.z).toBe(0);
      expect(transform.scaleX).toBe(1);

      const renderable = enemy.getComponent('Renderable');
      expect(renderable.color).toBe(0xffffff);
      expect(renderable.castShadow).toBe(true);
      expect(renderable.receiveShadow).toBe(true);

      const movement = enemy.getComponent('Movement');
      expect(movement.maxSpeed).toBe(5.5 * 1.5); // speed * 1.5
    });
  });

  describe('creating bosses from config', () => {
    it('should create boss from config', async () => {
      const bossConfig = {
        name: 'Shadow Lord',
        health: 5000,
        speed: 4.0,
        maxSpeed: 7.0,
        scale: 2.5,
        model: 'shadow_boss',
        color: 0xff0000,
        phases: [
          { healthThreshold: 1.0, behavior: 'aggressive' },
          { healthThreshold: 0.5, behavior: 'berserk' }
        ],
        abilities: []
      };

      configLoader.getBoss.mockResolvedValueOnce(bossConfig);

      const boss = await factory.createBoss('shadow_lord');

      expect(configLoader.getBoss).toHaveBeenCalledWith('shadow_lord');
      expect(boss.configId).toBe('shadow_lord');
      expect(boss.displayName).toBe('Shadow Lord');
      expect(boss.isBoss).toBe(true);
      expect(boss.hasTag('boss')).toBe(true);
      expect(boss.hasTag('enemy')).toBe(true);
      expect(boss.hasTag('shadow_lord')).toBe(true);

      const health = boss.getComponent('Health');
      expect(health.current).toBe(5000);
      expect(health.max).toBe(5000);

      const ai = boss.getComponent('AI');
      expect(ai.behavior).toBe('boss');
      expect(ai.phases).toEqual(bossConfig.phases);
      expect(ai.currentPhase).toBe(0);
    });

    it('should apply overrides to boss config', async () => {
      const bossConfig = {
        health: 5000,
        speed: 4.0,
        phases: []
      };

      configLoader.getBoss.mockResolvedValueOnce(bossConfig);

      const boss = await factory.createBoss('test_boss', {
        x: 50,
        z: 50,
        health: 10000
      });

      const transform = boss.getComponent('Transform');
      expect(transform.x).toBe(50);
      expect(transform.z).toBe(50);

      const health = boss.getComponent('Health');
      expect(health.current).toBe(10000);
      expect(health.max).toBe(10000);
    });

    it('should not create AI component if boss has no phases', async () => {
      const bossConfig = {
        health: 5000,
        speed: 4.0,
        model: 'simple_boss'
      };

      configLoader.getBoss.mockResolvedValueOnce(bossConfig);

      const boss = await factory.createBoss('simple_boss');

      expect(boss.hasComponent('AI')).toBe(false);
    });

    it('should use default color for bosses', async () => {
      const bossConfig = {
        health: 5000,
        speed: 4.0
      };

      configLoader.getBoss.mockResolvedValueOnce(bossConfig);

      const boss = await factory.createBoss('test_boss');

      const renderable = boss.getComponent('Renderable');
      expect(renderable.color).toBe(0xff0000); // Default boss color
    });
  });

  describe('creating multiple enemies', () => {
    it('should create multiple enemies at positions', async () => {
      const enemyConfig = {
        health: 100,
        speed: 5.5
      };

      configLoader.getEnemy.mockResolvedValue(enemyConfig);

      const positionFn = (index) => ({
        x: index * 10,
        z: index * 5
      });

      const enemies = await factory.createEnemies('shadow_lurker', 3, positionFn);

      expect(enemies).toHaveLength(3);
      expect(configLoader.getEnemy).toHaveBeenCalledTimes(3);

      const transform0 = enemies[0].getComponent('Transform');
      expect(transform0.x).toBe(0);
      expect(transform0.z).toBe(0);

      const transform1 = enemies[1].getComponent('Transform');
      expect(transform1.x).toBe(10);
      expect(transform1.z).toBe(5);

      const transform2 = enemies[2].getComponent('Transform');
      expect(transform2.x).toBe(20);
      expect(transform2.z).toBe(10);
    });

    it('should create enemies at default position if no positionFn', async () => {
      const enemyConfig = {
        health: 100,
        speed: 5.5
      };

      configLoader.getEnemy.mockResolvedValue(enemyConfig);

      const enemies = await factory.createEnemies('shadow_lurker', 2);

      expect(enemies).toHaveLength(2);

      for (const enemy of enemies) {
        const transform = enemy.getComponent('Transform');
        expect(transform.x).toBe(0);
        expect(transform.z).toBe(0);
      }
    });
  });

  describe('cloning entities', () => {
    it('should clone entity with all components', () => {
      const components = [
        { type: 'Transform', x: 10, y: 5, z: 15 },
        { type: 'Health', current: 75, max: 100 },
        { type: 'Movement', speed: 5.5 }
      ];

      const original = factory.create(components, ['enemy', 'test']);
      const cloned = factory.clone(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.getAllComponents()).toHaveLength(3);

      const clonedTransform = cloned.getComponent('Transform');
      expect(clonedTransform.x).toBe(10);
      expect(clonedTransform.y).toBe(5);
      expect(clonedTransform.z).toBe(15);

      const clonedHealth = cloned.getComponent('Health');
      expect(clonedHealth.current).toBe(75);
      expect(clonedHealth.max).toBe(100);

      // Check tags are copied
      expect(cloned.hasTag('enemy')).toBe(true);
      expect(cloned.hasTag('test')).toBe(true);
    });

    it('should create independent clone', () => {
      const components = [
        { type: 'Transform', x: 10, y: 5, z: 15 }
      ];

      const original = factory.create(components);
      const cloned = factory.clone(original);

      // Modify original
      const originalTransform = original.getComponent('Transform');
      originalTransform.x = 999;

      // Clone should be unchanged
      const clonedTransform = cloned.getComponent('Transform');
      expect(clonedTransform.x).toBe(10);
    });
  });
});
