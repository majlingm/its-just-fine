import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from './Component.js';

// Test component
class TestComponent extends Component {
  constructor() {
    super();
    this.value = 0;
    this.name = '';
  }
}

describe('Component', () => {
  let component;

  beforeEach(() => {
    component = new TestComponent();
  });

  describe('initialization', () => {
    it('should have correct type', () => {
      expect(component.type).toBe('TestComponent');
    });

    it('should be enabled by default', () => {
      expect(component.enabled).toBe(true);
    });

    it('should have null entity reference', () => {
      expect(component.entity).toBeNull();
    });
  });

  describe('init', () => {
    it('should initialize with data', () => {
      component.init({ value: 42, name: 'test' });

      expect(component.value).toBe(42);
      expect(component.name).toBe('test');
    });

    it('should handle empty data', () => {
      expect(() => component.init()).not.toThrow();
      expect(() => component.init({})).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset to enabled state', () => {
      component.enabled = false;
      component.reset();

      expect(component.enabled).toBe(true);
    });
  });

  describe('clone', () => {
    it('should create a copy', () => {
      component.value = 42;
      component.name = 'test';

      const cloned = component.clone();

      expect(cloned).not.toBe(component);
      expect(cloned.value).toBe(42);
      expect(cloned.name).toBe('test');
    });

    it('should not copy entity reference', () => {
      component.entity = { id: 1 };
      const cloned = component.clone();

      expect(cloned.entity).toBeNull();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      component.value = 42;
      component.name = 'test';

      const json = component.toJSON();

      expect(json.type).toBe('TestComponent');
      expect(json.value).toBe(42);
      expect(json.name).toBe('test');
    });

    it('should not serialize entity reference', () => {
      component.entity = { id: 1 };
      const json = component.toJSON();

      expect(json.entity).toBeUndefined();
    });

    it('should deserialize from JSON', () => {
      const json = { type: 'TestComponent', value: 99, name: 'loaded' };
      component.fromJSON(json);

      expect(component.value).toBe(99);
      expect(component.name).toBe('loaded');
    });
  });
});
