/**
 * Engine - Core game loop and entity management (Platform-agnostic)
 *
 * Responsibilities:
 * - Game loop (start, stop, pause, resume)
 * - Time management (delta time, total time)
 * - Entity lifecycle (add, remove, update)
 * - Event coordination
 *
 * NOT responsible for:
 * - Rendering (handled by Renderer)
 * - Input (handled by InputManager)
 * - Game logic (handled by Game layer)
 */
export class Engine {
  constructor() {
    // Entity management
    this.entities = [];

    // Engine state
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.lastFrameTime = 0;

    // Callbacks
    this.onUpdate = null;  // Called every frame with dt
    this.onRender = null;  // Called every frame for rendering

    // Entity pool reference (set during init)
    this.entityPool = null;
  }

  /**
   * Add an entity to the engine
   * @param {Object} entity - Entity to add
   */
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }

  /**
   * Remove an entity from the engine
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Start the game loop
   */
  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Pause the game
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume the game
   */
  resume() {
    this.paused = false;
    this.lastFrameTime = performance.now();
  }

  /**
   * Main game loop
   */
  gameLoop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.gameLoop);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent huge jumps
    if (!this.paused && deltaTime < 0.1) {
      this.time += deltaTime;
      this.update(deltaTime);
    }

    this.render();
  }

  /**
   * Update all entities
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Call custom update callback if provided
    if (this.onUpdate) {
      this.onUpdate(dt);
    }

    // Update all active entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      // Remove inactive entities marked for removal
      if (!entity.active && entity.shouldRemove) {
        this.removeEntity(entity);
        continue;
      }

      // Update active entities
      if (entity.active && entity.update) {
        entity.update(dt);
      }
    }
  }

  /**
   * Render the scene
   */
  render() {
    // Call custom render callback if provided
    if (this.onRender) {
      this.onRender();
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.running = false;
    this.entities = [];
  }
}
