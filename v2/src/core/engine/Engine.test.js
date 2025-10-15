import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Engine } from './Engine.js';

describe('Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new Engine();
  });

  describe('initialization', () => {
    it('should create engine with default state', () => {
      expect(engine.entities).toEqual([]);
      expect(engine.running).toBe(false);
      expect(engine.paused).toBe(false);
      expect(engine.time).toBe(0);
    });
  });

  describe('entity management', () => {
    it('should add entity', () => {
      const entity = { id: 1, active: true };
      engine.addEntity(entity);

      expect(engine.entities).toContain(entity);
      expect(engine.entities.length).toBe(1);
    });

    it('should not add duplicate entity', () => {
      const entity = { id: 1, active: true };
      engine.addEntity(entity);
      engine.addEntity(entity);

      expect(engine.entities.length).toBe(1);
    });

    it('should remove entity', () => {
      const entity = { id: 1, active: true };
      engine.addEntity(entity);
      engine.removeEntity(entity);

      expect(engine.entities).not.toContain(entity);
      expect(engine.entities.length).toBe(0);
    });

    it('should handle removing non-existent entity', () => {
      const entity = { id: 1, active: true };
      engine.removeEntity(entity);

      expect(engine.entities.length).toBe(0);
    });
  });

  describe('game loop', () => {
    it('should start engine', () => {
      vi.spyOn(global, 'requestAnimationFrame');
      engine.start();

      expect(engine.running).toBe(true);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop engine', () => {
      engine.running = true;
      engine.stop();

      expect(engine.running).toBe(false);
    });

    it('should pause engine', () => {
      engine.pause();
      expect(engine.paused).toBe(true);
    });

    it('should resume engine', () => {
      engine.paused = true;
      engine.resume();

      expect(engine.paused).toBe(false);
    });
  });

  describe('update', () => {
    it('should call onUpdate callback', () => {
      const onUpdate = vi.fn();
      engine.onUpdate = onUpdate;

      engine.update(0.016);

      expect(onUpdate).toHaveBeenCalledWith(0.016);
    });

    it('should update active entities', () => {
      const entity = {
        active: true,
        update: vi.fn()
      };
      engine.addEntity(entity);

      engine.update(0.016);

      expect(entity.update).toHaveBeenCalledWith(0.016);
    });

    it('should not update inactive entities', () => {
      const entity = {
        active: false,
        update: vi.fn()
      };
      engine.addEntity(entity);

      engine.update(0.016);

      expect(entity.update).not.toHaveBeenCalled();
    });

    it('should remove entities marked for removal', () => {
      const entity = {
        active: false,
        shouldRemove: true
      };
      engine.addEntity(entity);

      engine.update(0.016);

      expect(engine.entities).not.toContain(entity);
    });
  });

  describe('render', () => {
    it('should call onRender callback', () => {
      const onRender = vi.fn();
      engine.onRender = onRender;

      engine.render();

      expect(onRender).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should stop engine and clear entities', () => {
      const entity = { id: 1, active: true };
      engine.addEntity(entity);
      engine.running = true;

      engine.cleanup();

      expect(engine.running).toBe(false);
      expect(engine.entities.length).toBe(0);
    });
  });
});
