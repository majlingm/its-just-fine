/**
 * ComponentSystem - Base class for ECS systems
 *
 * Systems contain logic that processes entities with specific components.
 * They are stateless and only operate on component data.
 *
 * Design Principles:
 * - Systems = Logic (no data, only behavior)
 * - Systems process entities that have required components
 * - Systems should be independent and composable
 *
 * Usage:
 *   class MovementSystem extends ComponentSystem {
 *     constructor() {
 *       super(['Transform', 'Movement']); // Required components
 *     }
 *
 *     update(dt, entities) {
 *       for (const entity of entities) {
 *         const transform = entity.getComponent('Transform');
 *         const movement = entity.getComponent('Movement');
 *         // Process movement...
 *       }
 *     }
 *   }
 */
export class ComponentSystem {
  /**
   * @param {Array<string>} requiredComponents - Component types this system requires
   */
  constructor(requiredComponents = []) {
    this.requiredComponents = requiredComponents;
    this.enabled = true;
    this.priority = 0; // Lower priority = runs first
  }

  /**
   * Check if entity has all required components
   * @param {Object} entity - Entity to check
   * @returns {boolean}
   */
  matches(entity) {
    if (!entity.components) return false;

    for (const componentType of this.requiredComponents) {
      if (!entity.hasComponent(componentType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter entities that match system requirements
   * @param {Array<Object>} entities - All entities
   * @returns {Array<Object>} Filtered entities
   */
  getMatchingEntities(entities) {
    return entities.filter(entity => this.matches(entity));
  }

  /**
   * Initialize system (called once)
   * Override this in subclasses if needed
   */
  init() {
    // Override in subclass
  }

  /**
   * Update system logic (called every frame)
   * Override this in subclasses
   * @param {number} dt - Delta time in seconds
   * @param {Array<Object>} entities - All entities
   */
  update(dt, entities) {
    // Override in subclass
    const matchingEntities = this.getMatchingEntities(entities);
    this.process(dt, matchingEntities);
  }

  /**
   * Process matching entities
   * Override this instead of update() for simpler systems
   * @param {number} dt - Delta time
   * @param {Array<Object>} entities - Entities that match required components
   */
  process(dt, entities) {
    // Override in subclass
  }

  /**
   * Cleanup system (called when system is removed)
   * Override this in subclasses if needed
   */
  cleanup() {
    // Override in subclass
  }
}
