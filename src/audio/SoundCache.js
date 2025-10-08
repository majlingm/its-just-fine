/**
 * Manages loading and caching of audio files
 */
export class SoundCache {
  constructor(audioContext) {
    this.context = audioContext;
    this.cache = new Map();
    this.loading = new Map(); // Track in-progress loads
  }

  /**
   * Load and cache an audio file
   * @param {string} url - URL to the audio file
   * @returns {Promise<AudioBuffer>} The decoded audio buffer
   */
  async load(url) {
    // Return from cache if available
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Wait if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    // Start loading
    const loadPromise = this._loadFile(url);
    this.loading.set(url, loadPromise);

    try {
      const buffer = await loadPromise;
      this.cache.set(url, buffer);
      this.loading.delete(url);
      return buffer;
    } catch (error) {
      this.loading.delete(url);
      throw error;
    }
  }

  /**
   * Internal method to load audio file
   * @private
   */
  async _loadFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  /**
   * Preload multiple audio files
   * @param {string[]} urls - Array of URLs to preload
   * @returns {Promise<void>}
   */
  async preload(urls) {
    await Promise.all(urls.map(url => this.load(url)));
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }
}
