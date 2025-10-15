import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from './EntityManager.js';

describe('EntityManager', () => {
  let manager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  describe('entity creation', () => {
    it('should create entity with unique ID', () => {
      const entity1 = manager.createEntity();
      const entity2 = manager.createEntity();

      expect(entity1.id).toBeDefined();
      expect(entity2.id).toBeDefined();
      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should create entity with config', () => {
      const entity = manager.createEntity({ name: 'test', value: 42 });

      expect(entity.name).toBe('test');
      expect(entity.value).toBe(42);
      expect(entity.active).toBe(true);
    });

    it('should add entity to list', () => {
      const entity = manager.createEntity();

      expect(manager.entities).toContain(entity);
      expect(manager.getEntity(entity.id)).toBe(entity);
    });
  });

  describe('entity removal', () => {
    it('should remove entity', () => {
      const entity = manager.createEntity();
      manager.removeEntity(entity);

      expect(manager.entities).not.toContain(entity);
      expect(entity.active).toBe(false);
      expect(entity.shouldRemove).toBe(true);
    });

    it('should handle removing null entity', () => {
      expect(() => manager.removeEntity(null)).not.toThrow();
    });
  });

  describe('entity queries', () => {
    it('should get entity by ID', () => {
      const entity = manager.createEntity();

      const found = manager.getEntity(entity.id);
      expect(found).toBe(entity);
    });

    it('should return null for non-existent ID', () => {
      const found = manager.getEntity(9999);
      expect(found).toBeNull();
    });

    it('should get active entities', () => {
      const active1 = manager.createEntity();
      const active2 = manager.createEntity();
      const inactive = manager.createEntity();
      inactive.active = false;

      const activeEntities = manager.getActiveEntities();

      expect(activeEntities).toContain(active1);
      expect(activeEntities).toContain(active2);
      expect(activeEntities).not.toContain(inactive);
    });

    it('should query entities by filter', () => {
      manager.createEntity({ type: 'enemy' });
      manager.createEntity({ type: 'player' });
      manager.createEntity({ type: 'enemy' });

      const enemies = manager.query(e => e.type === 'enemy');

      expect(enemies.length).toBe(2);
    });
  });

  describe('entity groups (tags)', () => {
    it('should add entity to group', () => {
      const entity = manager.createEntity();
      manager.addToGroup(entity, 'enemies');

      expect(entity.tags).toContain('enemies');
      expect(manager.getEntitiesByTag('enemies')).toContain(entity);
    });

    it('should remove entity from group', () => {
      const entity = manager.createEntity();
      manager.addToGroup(entity, 'enemies');
      manager.removeFromGroup(entity, 'enemies');

      expect(entity.tags).not.toContain('enemies');
      expect(manager.getEntitiesByTag('enemies')).not.toContain(entity);
    });

    it('should check if entity has tag', () => {
      const entity = manager.createEntity();
      manager.addToGroup(entity, 'enemies');

      expect(manager.hasTag(entity, 'enemies')).toBe(true);
      expect(manager.hasTag(entity, 'players')).toBe(false);
    });

    it('should get entities by tag', () => {
      const enemy1 = manager.createEntity();
      const enemy2 = manager.createEntity();
      const player = manager.createEntity();

      manager.addToGroup(enemy1, 'enemies');
      manager.addToGroup(enemy2, 'enemies');
      manager.addToGroup(player, 'players');

      const enemies = manager.getEntitiesByTag('enemies');

      expect(enemies.length).toBe(2);
      expect(enemies).toContain(enemy1);
      expect(enemies).toContain(enemy2);
      expect(enemies).not.toContain(player);
    });
  });

  describe('entity pooling', () => {
    it('should get entity from pool', () => {
      const createFn = (config) => ({ ...config, pooled: true });
      const entity = manager.getFromPool('bullet', { damage: 10 }, createFn);

      expect(entity.pooled).toBe(true);
      expect(entity.damage).toBe(10);
      expect(entity.poolType).toBe('bullet');
    });

    it('should reuse pooled entity', () => {
      const createFn = (config) => ({ id: Math.random(), ...config });

      // Create and return to pool
      const entity1 = manager.getFromPool('bullet', { damage: 10 }, createFn);
      manager.returnToPool(entity1);

      // Get from pool again
      const entity2 = manager.getFromPool('bullet', { damage: 20 }, createFn);

      // Should be same entity instance
      expect(entity2.id).toBe(entity1.id);
      expect(entity2.active).toBe(true);
    });

    it('should return entity to pool', () => {
      const createFn = (config) => ({ ...config });
      const entity = manager.getFromPool('bullet', {}, createFn);

      manager.returnToPool(entity);

      expect(entity.active).toBe(false);
      expect(manager.entities).not.toContain(entity);
    });

    it('should clear specific pool', () => {
      const createFn = (config) => ({ ...config });
      const entity1 = manager.getFromPool('bullet', {}, createFn);
      const entity2 = manager.getFromPool('bullet', {}, createFn);

      manager.returnToPool(entity1);
      manager.returnToPool(entity2);

      manager.clearPool('bullet');

      const pool = manager.getPool('bullet');
      expect(pool.length).toBe(0);
    });
  });

  describe('entity counts', () => {
    it('should get entity count', () => {
      manager.createEntity();
      manager.createEntity();
      manager.createEntity();

      expect(manager.getEntityCount()).toBe(3);
    });

    it('should get active entity count', () => {
      manager.createEntity();
      manager.createEntity();
      const inactive = manager.createEntity();
      inactive.active = false;

      expect(manager.getActiveEntityCount()).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all entities and pools', () => {
      manager.createEntity();
      manager.createEntity();

      const createFn = (config) => ({ ...config });
      const pooled = manager.getFromPool('bullet', {}, createFn);
      manager.returnToPool(pooled);

      manager.cleanup();

      expect(manager.entities.length).toBe(0);
      expect(manager.entityMap.size).toBe(0);
      expect(manager.groups.size).toBe(0);
      expect(manager.pools.size).toBe(0);
    });
  });

  describe('debug info', () => {
    it('should provide debug information', () => {
      manager.createEntity();
      manager.createEntity();
      const enemy = manager.createEntity();
      manager.addToGroup(enemy, 'enemies');

      const info = manager.getDebugInfo();

      expect(info.totalEntities).toBe(3);
      expect(info.activeEntities).toBe(3);
      expect(info.groups).toContain('enemies');
      expect(info.groupCounts.enemies).toBe(1);
    });
  });
});
