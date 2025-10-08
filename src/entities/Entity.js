export class Entity {
  constructor() {
    this.active = true;
    this.shouldRemove = false;
    this.mesh = null;
    this.x = 0;
    this.z = 0;
  }

  update(dt) {
    // Override in subclasses
  }

  destroy() {
    this.active = false;
    this.shouldRemove = true;
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }
}
