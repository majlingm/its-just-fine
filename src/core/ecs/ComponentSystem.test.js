import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentSystem } from './ComponentSystem.js';
import { Entity } from './Entity.js';
import { Component } from './Component.js';

// Test components
class TransformComponent extends Component {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
  }
}

class VelocityComponent extends Component {
  constructor() {
    super();
    this.vx = 0;
    this.vy = 0;
  }
}

// Test system
class MovementSystem extends ComponentSystem {
  constructor() {
    super(['TransformComponent', 'VelocityComponent']);
  }

  process(dt, entities) {
    for (const entity of entities) {
      const transform = entity.getComponent('TransformComponent');
      const velocity = entity.getComponent('VelocityComponent');

      transform.x += velocity.vx * dt;
      transform.y += velocity.vy * dt;
    }
  }
}

describe('ComponentSystem', () => {
  let system;

  beforeEach(() => {
    system = new MovementSystem();
  });

  describe('initialization', () => {
    it('should store required components', () => {
      expect(system.requiredComponents).toEqual([
        'TransformComponent',
        'VelocityComponent'
      ]);
    });

    it('should be enabled by default', () => {
      expect(system.enabled).toBe(true);
    });

    it('should have default priority', () => {
      expect(system.priority).toBe(0);
    });
  });

  describe('entity matching', () => {
    it('should match entity with all required components', () => {
      const entity = new Entity();
      entity.addComponent(new TransformComponent());
      entity.addComponent(new VelocityComponent());

      expect(system.matches(entity)).toBe(true);
    });

    it('should not match entity missing components', () => {
      const entity = new Entity();
      entity.addComponent(new TransformComponent());

      expect(system.matches(entity)).toBe(false);
    });

    it('should not match entity with no components', () => {
      const entity = new Entity();

      expect(system.matches(entity)).toBe(false);
    });

    it('should not match entity without components map', () => {
      const entity = { id: 1 };

      expect(system.matches(entity)).toBe(false);
    });
  });

  describe('filtering entities', () => {
    it('should filter matching entities', () => {
      const entity1 = new Entity();
      entity1.addComponent(new TransformComponent());
      entity1.addComponent(new VelocityComponent());

      const entity2 = new Entity();
      entity2.addComponent(new TransformComponent());

      const entity3 = new Entity();
      entity3.addComponent(new TransformComponent());
      entity3.addComponent(new VelocityComponent());

      const entities = [entity1, entity2, entity3];
      const matching = system.getMatchingEntities(entities);

      expect(matching.length).toBe(2);
      expect(matching).toContain(entity1);
      expect(matching).toContain(entity3);
      expect(matching).not.toContain(entity2);
    });

    it('should return empty array when no matches', () => {
      const entity = new Entity();
      entity.addComponent(new TransformComponent());

      const matching = system.getMatchingEntities([entity]);

      expect(matching).toEqual([]);
    });
  });

  describe('system processing', () => {
    it('should process matching entities', () => {
      const entity = new Entity();
      const transform = new TransformComponent();
      const velocity = new VelocityComponent();

      transform.x = 0;
      transform.y = 0;
      velocity.vx = 10;
      velocity.vy = 5;

      entity.addComponent(transform);
      entity.addComponent(velocity);

      system.update(0.1, [entity]);

      expect(transform.x).toBe(1); // 10 * 0.1
      expect(transform.y).toBe(0.5); // 5 * 0.1
    });

    it('should not process non-matching entities', () => {
      const entity = new Entity();
      const transform = new TransformComponent();
      transform.x = 0;
      entity.addComponent(transform);

      system.update(0.1, [entity]);

      expect(transform.x).toBe(0); // No change
    });

    it('should process multiple matching entities', () => {
      const entity1 = new Entity();
      const transform1 = new TransformComponent();
      const velocity1 = new VelocityComponent();
      velocity1.vx = 10;
      entity1.addComponent(transform1);
      entity1.addComponent(velocity1);

      const entity2 = new Entity();
      const transform2 = new TransformComponent();
      const velocity2 = new VelocityComponent();
      velocity2.vx = 20;
      entity2.addComponent(transform2);
      entity2.addComponent(velocity2);

      system.update(0.1, [entity1, entity2]);

      expect(transform1.x).toBe(1);
      expect(transform2.x).toBe(2);
    });
  });

  describe('lifecycle hooks', () => {
    it('should call init hook', () => {
      const initSpy = vi.fn();
      system.init = initSpy;

      system.init();

      expect(initSpy).toHaveBeenCalled();
    });

    it('should call cleanup hook', () => {
      const cleanupSpy = vi.fn();
      system.cleanup = cleanupSpy;

      system.cleanup();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('system without required components', () => {
    it('should work with no required components', () => {
      const universalSystem = new ComponentSystem([]);
      const entity = new Entity();

      expect(universalSystem.matches(entity)).toBe(true);
    });
  });
});
