/**
 * Shared utility for loading game assets across all tools
 */
export class AssetLoader {
    constructor(basePath = '../../public/assets') {
        this.basePath = basePath;
        this.cache = new Map();
    }

    /**
     * Load a texture/image asset
     */
    async loadTexture(path) {
        const fullPath = `${this.basePath}/${path}`;

        if (this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(fullPath, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = fullPath;
        });
    }

    /**
     * Load JSON data
     */
    async loadJSON(path) {
        const fullPath = `${this.basePath}/${path}`;

        if (this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }

        const response = await fetch(fullPath);
        const data = await response.json();
        this.cache.set(fullPath, data);
        return data;
    }

    /**
     * Get all assets in a directory
     */
    async listAssets(directory, extensions = ['.png', '.jpg']) {
        // Note: This requires a manifest file since browsers can't list directories
        try {
            const manifest = await this.loadJSON(`${directory}/manifest.json`);
            return manifest.files || [];
        } catch (error) {
            console.warn(`No manifest found for ${directory}`, error);
            return [];
        }
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
