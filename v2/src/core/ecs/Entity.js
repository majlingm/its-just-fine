/**
 * Entity - ECS Entity with component management
 *
 * An entity is just a container for components.
 * All behavior is defined by the components it has and the systems that process them.
 *
 * Usage:
 *   const entity = new Entity();
 *   entity.addComponent(new Transform());
 *   entity.addComponent(new Health());
 *
 *   const transform = entity.getComponent('Transform');
 *   if (entity.hasComponent('Health')) {
 *     // ...
 *   }
 */
export class Entity {
  constructor() {
    // Unique entity ID
    this.id = Entity.nextId++;

    // Component storage
    this.components = new Map(); // componentType -> component instance

    // Entity state
    this.active = true;
    this.shouldRemove = false;

    // Tags for grouping
    this.tags = new Set();

    // Display name (optional, for debugging)
    this.displayName = '';

    // Entity type (for typed pools)
    this.entityType = '';

    // Pooling flags
    this._pooled = false;       // Is this entity from a pool?
    this._poolType = null;      // Pool type for returning to correct pool
  }

  /**
   * Add a component to this entity
   * @param {Component} component - Component instance
   * @returns {Entity} This entity (for chaining)
   */
  addComponent(component) {
    const type = component.type || component.constructor.name;
    component.entity = this;
    this.components.set(type, component);
    return this;
  }

  /**
   * Remove a component from this entity
   * @param {string} componentType - Component type name
   * @returns {boolean} True if component was removed
   */
  removeComponent(componentType) {
    const component = this.components.get(componentType);
    if (component) {
      component.entity = null;
      this.components.delete(componentType);
      return true;
    }
    return false;
  }

  /**
   * Get a component by type
   * @param {string} componentType - Component type name
   * @returns {Component|null} Component instance or null
   */
  getComponent(componentType) {
    return this.components.get(componentType) || null;
  }

  /**
   * Check if entity has a component
   * @param {string} componentType - Component type name
   * @returns {boolean}
   */
  hasComponent(componentType) {
    return this.components.has(componentType);
  }

  /**
   * Check if entity has all specified components
   * @param {Array<string>} componentTypes - Array of component type names
   * @returns {boolean}
   */
  hasComponents(componentTypes) {
    for (const type of componentTypes) {
      if (!this.hasComponent(type)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all components
   * @returns {Array<Component>} Array of all components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Get component types
   * @returns {Array<string>} Array of component type names
   */
  getComponentTypes() {
    return Array.from(this.components.keys());
  }

  /**
   * Add a tag to this entity
   * @param {string} tag - Tag name
   * @returns {Entity} This entity (for chaining)
   */
  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  /**
   * Remove a tag from this entity
   * @param {string} tag - Tag name
   * @returns {boolean} True if tag was removed
   */
  removeTag(tag) {
    return this.tags.delete(tag);
  }

  /**
   * Check if entity has a tag
   * @param {string} tag - Tag name
   * @returns {boolean}
   */
  hasTag(tag) {
    return this.tags.has(tag);
  }

  /**
   * Mark entity for removal
   */
  destroy() {
    this.active = false;
    this.shouldRemove = true;
  }

  /**
   * Cleanup entity (called before removal)
   */
  cleanup() {
    // Cleanup all components
    for (const component of this.components.values()) {
      component.entity = null;
    }
    this.components.clear();
    this.tags.clear();
  }

  /**
   * Serialize entity to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      active: this.active,
      tags: Array.from(this.tags),
      components: Array.from(this.components.values()).map(c => c.toJSON())
    };
  }
}

// Static ID counter
Entity.nextId = 1;
