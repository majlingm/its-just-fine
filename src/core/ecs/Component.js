/**
 * Component - Base class for ECS components
 *
 * Components are pure data containers with no logic.
 * All game logic should be in Systems that process components.
 *
 * Design Principles:
 * - Components = Data only (no methods except init/reset)
 * - Systems = Logic that processes components
 * - Entities = Collections of components
 *
 * Usage:
 *   class HealthComponent extends Component {
 *     constructor() {
 *       super();
 *       this.current = 100;
 *       this.max = 100;
 *     }
 *   }
 */
export class Component {
  constructor() {
    // Component type (set automatically by subclass)
    this.type = this.constructor.name;

    // Entity reference (set when attached)
    this.entity = null;

    // Active state
    this.enabled = true;
  }

  /**
   * Initialize component with data
   * Override this in subclasses to set initial values
   * @param {Object} data - Initialization data
   */
  init(data = {}) {
    Object.assign(this, data);
  }

  /**
   * Reset component to initial state (for pooling)
   * Override this in subclasses if needed
   */
  reset() {
    this.enabled = true;
  }

  /**
   * Clone this component
   * @returns {Component} Cloned component
   */
  clone() {
    const cloned = new this.constructor();
    // Copy all enumerable properties
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== 'entity') {
        const value = this[key];
        // Deep clone objects/arrays
        if (value && typeof value === 'object') {
          cloned[key] = Array.isArray(value) ? [...value] : { ...value };
        } else {
          cloned[key] = value;
        }
      }
    }
    return cloned;
  }

  /**
   * Serialize component to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    const json = { type: this.type };
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== 'entity') {
        json[key] = this[key];
      }
    }
    return json;
  }

  /**
   * Deserialize component from JSON
   * @param {Object} json - JSON data
   */
  fromJSON(json) {
    for (const key in json) {
      if (key !== 'type') {
        this[key] = json[key];
      }
    }
  }
}
