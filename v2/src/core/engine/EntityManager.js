/**
 * EntityManager - Entity lifecycle and management (Platform-agnostic)
 *
 * Responsibilities:
 * - Entity creation and destruction
 * - Entity lifecycle management
 * - Entity queries and filtering
 * - Entity group management (tags)
 *
 * NOT responsible for:
 * - Entity update logic (handled by Engine)
 * - Entity rendering (handled by Renderer)
 * - Component system (handled by ECS layer)
 */
export class EntityManager {
  constructor() {
    // Entity storage
    this.entities = [];
    this.entityMap = new Map(); // id -> entity
    this.nextEntityId = 1;

    // Entity groups (tags)
    this.groups = new Map(); // tag -> Set<entity>

    // Entity pools (for recycling)
    this.pools = new Map(); // type -> entity[]
  }

  /**
   * Create a new entity
   * @param {Object} config - Entity configuration
   * @returns {Object} The created entity
   */
  createEntity(config = {}) {
    const entity = {
      id: this.nextEntityId++,
      active: true,
      shouldRemove: false,
      tags: new Set(),
      ...config,
    };

    this.entities.push(entity);
    this.entityMap.set(entity.id, entity);

    // Add to groups if tags provided
    if (config.tags) {
      for (const tag of config.tags) {
        this.addToGroup(entity, tag);
      }
    }

    return entity;
  }

  /**
   * Remove an entity
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    if (!entity) return;

    // Mark for removal
    entity.active = false;
    entity.shouldRemove = true;

    // Remove from groups
    for (const tag of entity.tags) {
      this.removeFromGroup(entity, tag);
    }

    // Remove from entity list
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }

    // Remove from map
    this.entityMap.delete(entity.id);

    // Call cleanup if entity has one
    if (entity.cleanup) {
      entity.cleanup();
    }
  }

  /**
   * Get entity by ID
   * @param {number} id - Entity ID
   * @returns {Object|null} Entity or null if not found
   */
  getEntity(id) {
    return this.entityMap.get(id) || null;
  }

  /**
   * Get all active entities
   * @returns {Array<Object>} Array of active entities
   */
  getActiveEntities() {
    return this.entities.filter(e => e.active);
  }

  /**
   * Get all entities with a specific tag
   * @param {string} tag - Tag name
   * @returns {Array<Object>} Array of entities
   */
  getEntitiesByTag(tag) {
    const group = this.groups.get(tag);
    return group ? Array.from(group) : [];
  }

  /**
   * Add an entity to a group
   * @param {Object} entity - Entity to add
   * @param {string} tag - Group tag
   */
  addToGroup(entity, tag) {
    if (!this.groups.has(tag)) {
      this.groups.set(tag, new Set());
    }
    this.groups.get(tag).add(entity);
    entity.tags.add(tag);
  }

  /**
   * Remove an entity from a group
   * @param {Object} entity - Entity to remove
   * @param {string} tag - Group tag
   */
  removeFromGroup(entity, tag) {
    const group = this.groups.get(tag);
    if (group) {
      group.delete(entity);
      if (group.size === 0) {
        this.groups.delete(tag);
      }
    }
    entity.tags.delete(tag);
  }

  /**
   * Check if an entity has a specific tag
   * @param {Object} entity - Entity to check
   * @param {string} tag - Tag name
   * @returns {boolean}
   */
  hasTag(entity, tag) {
    return entity.tags.has(tag);
  }

  /**
   * Query entities by filter function
   * @param {Function} filterFn - Filter function (entity) => boolean
   * @returns {Array<Object>} Filtered entities
   */
  query(filterFn) {
    return this.entities.filter(filterFn);
  }

  /**
   * Get entity count
   * @returns {number} Total entity count
   */
  getEntityCount() {
    return this.entities.length;
  }

  /**
   * Get active entity count
   * @returns {number} Active entity count
   */
  getActiveEntityCount() {
    return this.entities.filter(e => e.active).length;
  }

  /**
   * Create or get entity pool for a specific type
   * @param {string} type - Entity type
   * @returns {Array} Pool array
   */
  getPool(type) {
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    return this.pools.get(type);
  }

  /**
   * Get entity from pool or create new one
   * @param {string} type - Entity type
   * @param {Object} config - Entity configuration
   * @param {Function} createFn - Creation function if pool is empty
   * @returns {Object} Entity from pool or newly created
   */
  getFromPool(type, config, createFn) {
    const pool = this.getPool(type);

    let entity;
    if (pool.length > 0) {
      entity = pool.pop();
      entity.active = true;
      entity.shouldRemove = false;

      // Reset entity with new config
      if (entity.reset) {
        entity.reset(config);
      }
    } else {
      entity = createFn(config);
      entity.poolType = type;
    }

    // Add back to entity list if not already there
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
      this.entityMap.set(entity.id, entity);
    }

    return entity;
  }

  /**
   * Return entity to pool
   * @param {Object} entity - Entity to return to pool
   */
  returnToPool(entity) {
    if (!entity || !entity.poolType) {
      this.removeEntity(entity);
      return;
    }

    // Deactivate entity
    entity.active = false;
    entity.shouldRemove = false;

    // Remove from groups (if entity has tags)
    if (entity.tags) {
      for (const tag of entity.tags) {
        this.removeFromGroup(entity, tag);
      }
    }

    // Remove from active list but keep in map
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }

    // Add to pool
    const pool = this.getPool(entity.poolType);
    pool.push(entity);
  }

  /**
   * Clear a specific pool
   * @param {string} type - Pool type to clear
   */
  clearPool(type) {
    const pool = this.getPool(type);

    // Cleanup all pooled entities
    for (const entity of pool) {
      if (entity.cleanup) {
        entity.cleanup();
      }
      this.entityMap.delete(entity.id);
    }

    pool.length = 0;
  }

  /**
   * Clear all pools
   */
  clearAllPools() {
    for (const [type] of this.pools) {
      this.clearPool(type);
    }
    this.pools.clear();
  }

  /**
   * Update all entities (called by Engine)
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Process entities in reverse to safely remove
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      // Remove entities marked for removal
      if (!entity.active && entity.shouldRemove) {
        if (entity.poolType) {
          this.returnToPool(entity);
        } else {
          this.removeEntity(entity);
        }
        continue;
      }

      // Update active entities
      if (entity.active && entity.update) {
        entity.update(dt);
      }
    }
  }

  /**
   * Clean up all entities
   */
  cleanup() {
    // Cleanup all entities
    for (const entity of this.entities) {
      if (entity.cleanup) {
        entity.cleanup();
      }
    }

    // Clear all pools
    this.clearAllPools();

    // Clear data structures
    this.entities = [];
    this.entityMap.clear();
    this.groups.clear();
    this.nextEntityId = 1;
  }

  /**
   * Get debug info
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      totalEntities: this.entities.length,
      activeEntities: this.getActiveEntityCount(),
      groups: Array.from(this.groups.keys()),
      groupCounts: Object.fromEntries(
        Array.from(this.groups.entries()).map(([tag, set]) => [tag, set.size])
      ),
      pools: Array.from(this.pools.keys()),
      poolSizes: Object.fromEntries(
        Array.from(this.pools.entries()).map(([type, pool]) => [type, pool.length])
      ),
    };
  }
}
