/**
 * SoundScheduler - Manages timing and scheduling of sounds
 * Prevents sound spam and allows delayed/scheduled playback
 */
export class SoundScheduler {
  constructor() {
    this.scheduledSounds = [];
    this.lastPlayedTimes = new Map(); // Track when each sound type was last played
    this.minInterval = new Map(); // Minimum time between plays for each sound type
  }

  /**
   * Set minimum interval between plays for a specific sound type
   * @param {string} soundType - Type of sound (e.g., 'shoot', 'hit')
   * @param {number} interval - Minimum seconds between plays
   */
  setMinInterval(soundType, interval) {
    this.minInterval.set(soundType, interval);
  }

  /**
   * Check if a sound can be played based on rate limiting
   * @param {string} soundType - Type of sound
   * @param {number} currentTime - Current audio context time
   * @returns {boolean} Whether the sound can be played
   */
  canPlay(soundType, currentTime) {
    const lastTime = this.lastPlayedTimes.get(soundType);
    const minInterval = this.minInterval.get(soundType);

    if (!lastTime || !minInterval) return true;

    return (currentTime - lastTime) >= minInterval;
  }

  /**
   * Mark that a sound was played
   * @param {string} soundType - Type of sound
   * @param {number} currentTime - Current audio context time
   */
  markPlayed(soundType, currentTime) {
    this.lastPlayedTimes.set(soundType, currentTime);
  }

  /**
   * Schedule a sound to play after a delay
   * @param {Function} playFunction - Function to call to play the sound
   * @param {number} delay - Delay in seconds
   * @param {string} soundType - Type of sound (for rate limiting)
   * @returns {Object} Scheduled sound object with cancel method
   */
  schedule(playFunction, delay = 0, soundType = null) {
    const scheduledSound = {
      playFunction,
      delay,
      soundType,
      startTime: performance.now(),
      cancelled: false,
      cancel: function() {
        this.cancelled = true;
      }
    };

    this.scheduledSounds.push(scheduledSound);

    // Set up timeout to play the sound
    setTimeout(() => {
      if (!scheduledSound.cancelled) {
        playFunction();
      }
      // Remove from scheduled list
      const index = this.scheduledSounds.indexOf(scheduledSound);
      if (index > -1) {
        this.scheduledSounds.splice(index, 1);
      }
    }, delay * 1000);

    return scheduledSound;
  }

  /**
   * Cancel all scheduled sounds
   */
  cancelAll() {
    this.scheduledSounds.forEach(sound => sound.cancel());
    this.scheduledSounds = [];
  }

  /**
   * Cancel scheduled sounds of a specific type
   * @param {string} soundType - Type of sound to cancel
   */
  cancelType(soundType) {
    this.scheduledSounds
      .filter(sound => sound.soundType === soundType)
      .forEach(sound => sound.cancel());
  }

  /**
   * Get count of scheduled sounds
   * @returns {number} Number of pending scheduled sounds
   */
  getPendingCount() {
    return this.scheduledSounds.filter(s => !s.cancelled).length;
  }

  /**
   * Clear tracking history (useful for testing or reset)
   */
  reset() {
    this.lastPlayedTimes.clear();
    this.cancelAll();
  }
}
