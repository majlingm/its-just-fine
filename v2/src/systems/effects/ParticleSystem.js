/**
 * ParticleSystem - Manages particle physics and lifecycle
 *
 * Responsibilities:
 * - Update particle age and lifetime
 * - Apply physics (velocity, gravity, drag)
 * - Update visual properties (opacity, scale, color)
 * - Remove expired particles
 * - Sync with Renderable component for visual updates
 *
 * Works with:
 * - Particle component (lifetime, physics, visual properties)
 * - Transform component (position)
 * - Movement component (velocity)
 * - Renderable component (visual updates)
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';
import { Entity } from '../../core/ecs/Entity.js';
import { Transform } from '../../components/Transform.js';
import { Movement } from '../../components/Movement.js';
import { Renderable } from '../../components/Renderable.js';
import { Particle } from '../../components/Particle.js';

export class ParticleSystem extends ComponentSystem {
  constructor() {
    // Require Particle, Transform, and Movement components
    super(['Particle', 'Transform', 'Movement']);
  }

  /**
   * Process particles
   * @param {number} dt - Delta time
   * @param {Array<Entity>} entities - Entities with Particle + Transform + Movement
   */
  process(dt, entities) {
    for (const entity of entities) {
      const particle = entity.getComponent('Particle');
      const transform = entity.getComponent('Transform');
      const movement = entity.getComponent('Movement');
      const renderable = entity.getComponent('Renderable');

      // Update particle age
      particle.update(dt);

      // Remove expired particles
      if (particle.isExpired() && particle.removeOnExpire) {
        entity.destroy();
        continue;
      }

      // Apply gravity
      if (particle.gravity !== 0) {
        movement.velocityY += particle.gravity * dt;
      }

      // Apply drag
      if (particle.drag !== 1) {
        movement.velocityX *= Math.pow(particle.drag, dt * 60);
        movement.velocityY *= Math.pow(particle.drag, dt * 60);
        movement.velocityZ *= Math.pow(particle.drag, dt * 60);
      }

      // Update visual properties if renderable exists
      if (renderable && renderable.enabled) {
        // Update opacity
        const currentOpacity = particle.getCurrentOpacity();
        if (renderable.material) {
          renderable.material.opacity = currentOpacity;
          renderable.material.transparent = true;
        }

        // Update scale
        const currentScale = particle.getCurrentScale();
        transform.scaleX = currentScale;
        transform.scaleY = currentScale;
        transform.scaleZ = currentScale;

        // Update color
        const currentColor = particle.getCurrentColor();
        if (renderable.material) {
          renderable.material.color.setHex(currentColor);
          renderable.material.emissive.setHex(currentColor);
        }
      }

      // Billboard effect (always face camera)
      if (particle.billboard) {
        // This will be handled by RenderSystem if needed
        // For now, particles will use default orientation
      }
    }
  }

  /**
   * Create a burst of particles at a position
   * @param {Engine} engine - Game engine
   * @param {Object} config - Particle configuration
   * @param {number} config.x - X position
   * @param {number} config.y - Y position
   * @param {number} config.z - Z position
   * @param {number} config.count - Number of particles
   * @param {Object} config.particle - Particle properties
   * @param {Object} config.renderable - Renderable properties
   * @returns {Array<Entity>} Created particles
   */
  static createBurst(engine, config) {
    const particles = [];
    const { x = 0, y = 0, z = 0, count = 10 } = config;

    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(engine, {
        x,
        y,
        z,
        ...config
      });

      // Add random velocity for burst effect
      const movement = particle.getComponent('Movement');
      if (movement && config.burstSpeed) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = config.burstSpeed * (0.8 + Math.random() * 0.4);
        movement.velocityX = Math.cos(angle) * speed;
        movement.velocityZ = Math.sin(angle) * speed;
        movement.velocityY = Math.random() * speed * 0.5;
      }

      particles.push(particle);
    }

    return particles;
  }

  /**
   * Create a single particle
   * @param {Engine} engine - Game engine
   * @param {Object} config - Particle configuration
   * @returns {Entity} Created particle
   */
  static createParticle(engine, config) {
    const entity = new Entity();

    // Transform
    const transform = new Transform();
    transform.init({
      x: config.x || 0,
      y: config.y || 0.5,
      z: config.z || 0,
      scaleX: config.scale || 0.2,
      scaleY: config.scale || 0.2,
      scaleZ: config.scale || 0.2
    });
    entity.addComponent(transform);

    // Movement
    const movement = new Movement();
    movement.init({
      velocityX: config.velocityX || 0,
      velocityY: config.velocityY || 0,
      velocityZ: config.velocityZ || 0,
      drag: 0
    });
    entity.addComponent(movement);

    // Particle
    const particle = new Particle();
    particle.init({
      lifetime: config.lifetime || 1.0,
      fadeStart: config.fadeStart || 0.5,
      startColor: config.startColor || 0xffff00,
      endColor: config.endColor || 0xff0000,
      startOpacity: config.startOpacity || 1.0,
      endOpacity: config.endOpacity || 0.0,
      startScale: config.startScale || 1.0,
      endScale: config.endScale || 0.5,
      gravity: config.gravity !== undefined ? config.gravity : -9.8,
      drag: config.drag || 0.95,
      billboard: config.billboard !== undefined ? config.billboard : true,
      removeOnExpire: config.removeOnExpire !== undefined ? config.removeOnExpire : true
    });
    entity.addComponent(particle);

    // Renderable
    const renderable = new Renderable();
    renderable.init({
      modelType: config.modelType || 'sphere',
      color: config.startColor || 0xffff00,
      emissive: config.startColor || 0xffff00,
      metalness: 0.8,
      roughness: 0.2,
      castShadow: false,
      receiveShadow: false
    });
    entity.addComponent(renderable);

    // Tags
    entity.addTag('particle');
    if (config.tag) {
      entity.addTag(config.tag);
    }

    // Add to engine
    engine.addEntity(entity);

    return entity;
  }
}
