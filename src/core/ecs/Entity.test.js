import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Entity } from './Entity.js';
import { Component } from './Component.js';

// Test components
class HealthComponent extends Component {
  constructor() {
    super();
    this.hp = 100;
  }
}

class PositionComponent extends Component {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
  }
}

describe('Entity', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity();
  });

  describe('initialization', () => {
    it('should have unique ID', () => {
      const entity1 = new Entity();
      const entity2 = new Entity();

      expect(entity1.id).toBeDefined();
      expect(entity2.id).toBeDefined();
      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should be active by default', () => {
      expect(entity.active).toBe(true);
      expect(entity.shouldRemove).toBe(false);
    });

    it('should have empty components map', () => {
      expect(entity.components.size).toBe(0);
    });

    it('should have empty tags set', () => {
      expect(entity.tags.size).toBe(0);
    });
  });

  describe('component management', () => {
    it('should add component', () => {
      const health = new HealthComponent();
      entity.addComponent(health);

      expect(entity.components.has('HealthComponent')).toBe(true);
      expect(health.entity).toBe(entity);
    });

    it('should add multiple components', () => {
      entity.addComponent(new HealthComponent());
      entity.addComponent(new PositionComponent());

      expect(entity.components.size).toBe(2);
    });

    it('should support method chaining for addComponent', () => {
      const result = entity
        .addComponent(new HealthComponent())
        .addComponent(new PositionComponent());

      expect(result).toBe(entity);
      expect(entity.components.size).toBe(2);
    });

    it('should get component by type', () => {
      const health = new HealthComponent();
      entity.addComponent(health);

      const retrieved = entity.getComponent('HealthComponent');

      expect(retrieved).toBe(health);
      expect(retrieved.hp).toBe(100);
    });

    it('should return null for non-existent component', () => {
      const component = entity.getComponent('NonExistent');
      expect(component).toBeNull();
    });

    it('should check if has component', () => {
      entity.addComponent(new HealthComponent());

      expect(entity.hasComponent('HealthComponent')).toBe(true);
      expect(entity.hasComponent('PositionComponent')).toBe(false);
    });

    it('should check if has multiple components', () => {
      entity.addComponent(new HealthComponent());
      entity.addComponent(new PositionComponent());

      expect(entity.hasComponents(['HealthComponent', 'PositionComponent'])).toBe(true);
      expect(entity.hasComponents(['HealthComponent', 'NonExistent'])).toBe(false);
    });

    it('should remove component', () => {
      const health = new HealthComponent();
      entity.addComponent(health);

      const removed = entity.removeComponent('HealthComponent');

      expect(removed).toBe(true);
      expect(entity.hasComponent('HealthComponent')).toBe(false);
      expect(health.entity).toBeNull();
    });

    it('should return false when removing non-existent component', () => {
      const removed = entity.removeComponent('NonExistent');
      expect(removed).toBe(false);
    });

    it('should get all components', () => {
      entity.addComponent(new HealthComponent());
      entity.addComponent(new PositionComponent());

      const components = entity.getAllComponents();

      expect(components.length).toBe(2);
      expect(components[0]).toBeInstanceOf(Component);
      expect(components[1]).toBeInstanceOf(Component);
    });

    it('should get component types', () => {
      entity.addComponent(new HealthComponent());
      entity.addComponent(new PositionComponent());

      const types = entity.getComponentTypes();

      expect(types).toContain('HealthComponent');
      expect(types).toContain('PositionComponent');
    });
  });

  describe('tag management', () => {
    it('should add tag', () => {
      entity.addTag('enemy');

      expect(entity.tags.has('enemy')).toBe(true);
    });

    it('should support method chaining for addTag', () => {
      const result = entity.addTag('enemy').addTag('hostile');

      expect(result).toBe(entity);
      expect(entity.tags.size).toBe(2);
    });

    it('should remove tag', () => {
      entity.addTag('enemy');
      const removed = entity.removeTag('enemy');

      expect(removed).toBe(true);
      expect(entity.tags.has('enemy')).toBe(false);
    });

    it('should return false when removing non-existent tag', () => {
      const removed = entity.removeTag('nonexistent');
      expect(removed).toBe(false);
    });

    it('should check if has tag', () => {
      entity.addTag('enemy');

      expect(entity.hasTag('enemy')).toBe(true);
      expect(entity.hasTag('player')).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('should mark entity for destruction', () => {
      entity.destroy();

      expect(entity.active).toBe(false);
      expect(entity.shouldRemove).toBe(true);
    });

    it('should cleanup entity', () => {
      const health = new HealthComponent();
      const position = new PositionComponent();

      entity.addComponent(health);
      entity.addComponent(position);
      entity.addTag('enemy');

      entity.cleanup();

      expect(entity.components.size).toBe(0);
      expect(entity.tags.size).toBe(0);
      expect(health.entity).toBeNull();
      expect(position.entity).toBeNull();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      entity.addComponent(new HealthComponent());
      entity.addTag('enemy');

      const json = entity.toJSON();

      expect(json.id).toBe(entity.id);
      expect(json.active).toBe(true);
      expect(json.tags).toContain('enemy');
      expect(json.components.length).toBe(1);
      expect(json.components[0].type).toBe('HealthComponent');
    });
  });
});
