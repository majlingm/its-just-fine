import { Component } from '../ecs/Component.js';

/**
 * Animation Component
 * Handles skeletal animations for GLTF models
 */
export class Animation extends Component {
  constructor() {
    super();

    // Three.js animation mixer
    this.mixer = null;

    // Animation clips stored by name
    this.clips = new Map();

    // Animation actions stored by name
    this.actions = new Map();

    // Currently playing animation
    this.currentAnimation = null;

    // Animation state
    this.isPlaying = false;
  }

  /**
   * Set the mixer and clips from a loaded GLTF model
   * @param {THREE.AnimationMixer} mixer
   * @param {Array<THREE.AnimationClip>} clips
   */
  setAnimations(mixer, clips) {
    this.mixer = mixer;

    // Store clips and create actions
    clips.forEach(clip => {
      this.clips.set(clip.name, clip);
      const action = mixer.clipAction(clip);
      this.actions.set(clip.name, action);
    });
  }

  /**
   * Play an animation by name
   * @param {string} animationName
   * @param {number} fadeTime - Fade in/out time in seconds
   */
  play(animationName, fadeTime = 0.2) {
    const action = this.actions.get(animationName);
    if (!action) {
      console.warn(`Animation "${animationName}" not found`);
      return;
    }

    // Fade out current animation
    if (this.currentAnimation && this.currentAnimation !== animationName) {
      const currentAction = this.actions.get(this.currentAnimation);
      if (currentAction) {
        currentAction.fadeOut(fadeTime);
      }
    }

    // Fade in new animation
    if (this.currentAnimation !== animationName) {
      action.reset().fadeIn(fadeTime).play();
      this.currentAnimation = animationName;
    } else if (!action.isRunning()) {
      action.play();
    }

    this.isPlaying = true;
  }

  /**
   * Stop current animation
   * @param {number} fadeTime - Fade out time in seconds
   */
  stop(fadeTime = 0.2) {
    if (this.currentAnimation) {
      const action = this.actions.get(this.currentAnimation);
      if (action) {
        action.fadeOut(fadeTime);
      }
    }
    this.isPlaying = false;
  }

  /**
   * Update animation mixer
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }

  /**
   * Find animation by partial name match (case insensitive)
   * @param {string} searchTerm
   * @returns {string|null} Animation name or null
   */
  findAnimation(searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    for (const [name] of this.clips) {
      if (name.toLowerCase().includes(lowerSearch)) {
        return name;
      }
    }
    return null;
  }
}
