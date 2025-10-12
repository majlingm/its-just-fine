/**
 * StatsTracker - Tracks DPS and performance metrics
 */
export class StatsTracker {
  constructor() {
    // DPS tracking
    this.damageEvents = []; // Array of {timestamp, damage}
    this.rollingWindowSeconds = 5; // 5 second rolling average
    this.currentDPS = 0;
    this.rollingAverageDPS = 0;
    this.totalDamageDealt = 0;

    // Performance tracking
    this.fps = 0;
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.fpsUpdateInterval = 0.5; // Update FPS every 0.5 seconds

    // Frame time tracking for more accurate FPS
    this.frameTimes = [];
    this.maxFrameTimes = 60; // Keep last 60 frames for averaging
  }

  /**
   * Record damage dealt
   * @param {number} damage - Damage amount
   * @param {number} timestamp - Current game time
   */
  recordDamage(damage, timestamp) {
    this.damageEvents.push({
      timestamp: timestamp,
      damage: damage
    });
    this.totalDamageDealt += damage;

    // Clean up old events (older than rolling window)
    this.cleanupOldEvents(timestamp);
  }

  /**
   * Remove damage events older than the rolling window
   * @param {number} currentTime - Current game time
   */
  cleanupOldEvents(currentTime) {
    const cutoffTime = currentTime - this.rollingWindowSeconds;
    this.damageEvents = this.damageEvents.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * Calculate current DPS (damage in last second)
   * @param {number} currentTime - Current game time
   * @returns {number} DPS
   */
  calculateCurrentDPS(currentTime) {
    const oneSecondAgo = currentTime - 1;
    const recentDamage = this.damageEvents
      .filter(event => event.timestamp > oneSecondAgo)
      .reduce((sum, event) => sum + event.damage, 0);

    return recentDamage;
  }

  /**
   * Calculate rolling average DPS (last 5 seconds)
   * @param {number} currentTime - Current game time
   * @returns {number} Average DPS
   */
  calculateRollingAverageDPS(currentTime) {
    this.cleanupOldEvents(currentTime);

    if (this.damageEvents.length === 0) return 0;

    const totalDamage = this.damageEvents.reduce((sum, event) => sum + event.damage, 0);
    const timeWindow = Math.min(this.rollingWindowSeconds, currentTime - this.damageEvents[0].timestamp);

    if (timeWindow <= 0) return 0;

    return totalDamage / timeWindow;
  }

  /**
   * Update DPS calculations
   * @param {number} currentTime - Current game time
   */
  updateDPS(currentTime) {
    this.currentDPS = this.calculateCurrentDPS(currentTime);
    this.rollingAverageDPS = this.calculateRollingAverageDPS(currentTime);
  }

  /**
   * Record a frame for FPS calculation
   * @param {number} dt - Delta time for this frame
   * @param {number} currentTime - Current game time
   */
  recordFrame(dt, currentTime) {
    this.frameCount++;
    this.frameTimes.push(dt);

    // Keep only last N frame times
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }

    // Update FPS periodically
    if (currentTime - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      this.calculateFPS();
      this.lastFPSUpdate = currentTime;
    }
  }

  /**
   * Calculate FPS from frame times
   */
  calculateFPS() {
    if (this.frameTimes.length === 0) {
      this.fps = 0;
      return;
    }

    // Average frame time
    const avgFrameTime = this.frameTimes.reduce((sum, dt) => sum + dt, 0) / this.frameTimes.length;

    // Convert to FPS (avoid division by zero)
    this.fps = avgFrameTime > 0 ? Math.round(1 / avgFrameTime) : 0;
  }

  /**
   * Update all stats
   * @param {number} dt - Delta time
   * @param {number} currentTime - Current game time
   */
  update(dt, currentTime) {
    this.updateDPS(currentTime);
    this.recordFrame(dt, currentTime);
  }

  /**
   * Get memory stats (Chrome/Edge only)
   * @returns {object} Memory stats object or null if not available
   */
  getMemoryStats() {
    // Check if performance.memory is available (Chrome/Edge)
    if (!performance.memory) {
      return null;
    }

    const memory = performance.memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // Convert to MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // Convert to MB
      heapUsagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }

  /**
   * Get current stats
   * @returns {object} Stats object
   */
  getStats() {
    return {
      currentDPS: Math.round(this.currentDPS),
      rollingAverageDPS: Math.round(this.rollingAverageDPS),
      totalDamageDealt: Math.round(this.totalDamageDealt),
      fps: this.fps,
      memory: this.getMemoryStats()
    };
  }

  /**
   * Reset all stats
   */
  reset() {
    this.damageEvents = [];
    this.currentDPS = 0;
    this.rollingAverageDPS = 0;
    this.totalDamageDealt = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.frameTimes = [];
  }
}
