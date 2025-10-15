import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigLoader } from './ConfigLoader.js';

describe('ConfigLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new ConfigLoader();
    // Clear cache before each test
    loader.clearCache();

    // Mock fetch
    global.fetch = vi.fn();
  });

  describe('initialization', () => {
    it('should initialize with empty cache', () => {
      expect(loader.getCacheSize()).toBe(0);
    });

    it('should have default base path', () => {
      expect(loader.basePath).toBe('/src/config');
    });
  });

  describe('loading configs', () => {
    it('should load a config file', async () => {
      const mockConfig = { test: 'data' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      const result = await loader.load('test.json');

      expect(result).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/test.json');
    });

    it('should handle absolute paths', async () => {
      const mockConfig = { test: 'data' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await loader.load('/absolute/path/config.json');

      expect(global.fetch).toHaveBeenCalledWith('/absolute/path/config.json');
    });

    it('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(loader.load('missing.json')).rejects.toThrow(
        'Failed to load config: missing.json (404)'
      );
    });

    it('should throw error on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loader.load('test.json')).rejects.toThrow('Network error');
    });
  });

  describe('caching', () => {
    it('should cache loaded configs', async () => {
      const mockConfig = { test: 'data' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      // First load
      await loader.load('test.json');
      expect(loader.getCacheSize()).toBe(1);

      // Second load should use cache
      const result = await loader.load('test.json');
      expect(result).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should return cached config without fetching', async () => {
      const mockConfig = { test: 'data' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await loader.load('test.json');

      // Clear fetch mock to prove cache is used
      global.fetch.mockClear();

      const result = await loader.load('test.json');
      expect(result).toEqual(mockConfig);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear specific cached config', async () => {
      const mockConfig = { test: 'data' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockConfig
      });

      await loader.load('test.json');
      expect(loader.getCacheSize()).toBe(1);

      loader.clearCached('test.json');
      expect(loader.getCacheSize()).toBe(0);

      // Should fetch again after clearing cache
      await loader.load('test.json');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await loader.load('test1.json');
      await loader.load('test2.json');
      expect(loader.getCacheSize()).toBe(2);

      loader.clearCache();
      expect(loader.getCacheSize()).toBe(0);
    });
  });

  describe('loading enemies', () => {
    it('should load enemies config', async () => {
      const mockEnemies = {
        shadow_lurker: { health: 100 },
        flame_imp: { health: 80 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnemies
      });

      const result = await loader.loadEnemies();

      expect(result).toEqual(mockEnemies);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/entities/enemies.json');
    });

    it('should get specific enemy by id', async () => {
      const mockEnemies = {
        shadow_lurker: { health: 100, damage: 10 },
        flame_imp: { health: 80, damage: 12 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnemies
      });

      const enemy = await loader.getEnemy('shadow_lurker');

      expect(enemy).toEqual({ health: 100, damage: 10 });
    });

    it('should throw error for missing enemy', async () => {
      const mockEnemies = {
        shadow_lurker: { health: 100 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnemies
      });

      await expect(loader.getEnemy('missing_enemy')).rejects.toThrow(
        'Enemy config not found: missing_enemy'
      );
    });
  });

  describe('loading bosses', () => {
    it('should load bosses config', async () => {
      const mockBosses = {
        shadow_lord: { health: 5000 },
        crystal_titan: { health: 8000 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBosses
      });

      const result = await loader.loadBosses();

      expect(result).toEqual(mockBosses);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/entities/bosses.json');
    });

    it('should get specific boss by id', async () => {
      const mockBosses = {
        shadow_lord: { health: 5000, phases: 3 },
        crystal_titan: { health: 8000, phases: 3 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBosses
      });

      const boss = await loader.getBoss('shadow_lord');

      expect(boss).toEqual({ health: 5000, phases: 3 });
    });

    it('should throw error for missing boss', async () => {
      const mockBosses = {
        shadow_lord: { health: 5000 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBosses
      });

      await expect(loader.getBoss('missing_boss')).rejects.toThrow(
        'Boss config not found: missing_boss'
      );
    });
  });

  describe('loading levels', () => {
    it('should load level config', async () => {
      const mockLevel = { id: 'level1', waves: 5 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLevel
      });

      const result = await loader.loadLevel('level1');

      expect(result).toEqual(mockLevel);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/levels/level1.json');
    });
  });

  describe('loading waves', () => {
    it('should load waves config', async () => {
      const mockWaves = { waves: [{ enemies: 10 }] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWaves
      });

      const result = await loader.loadWaves('wave1');

      expect(result).toEqual(mockWaves);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/waves/wave1.json');
    });
  });

  describe('loading spells', () => {
    it('should load spells config', async () => {
      const mockSpells = {
        fireball: { damage: 50 },
        ice_shard: { damage: 30 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpells
      });

      const result = await loader.loadSpells();

      expect(result).toEqual(mockSpells);
      expect(global.fetch).toHaveBeenCalledWith('/src/config/spells/spells.json');
    });
  });

  describe('preloading', () => {
    it('should preload multiple configs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ test: 'data' })
      });

      const paths = ['config1.json', 'config2.json', 'config3.json'];
      const results = await loader.preload(paths);

      expect(results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(loader.getCacheSize()).toBe(3);
    });

    it('should handle preload errors gracefully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ test: 'data1' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        });

      const paths = ['config1.json', 'missing.json'];

      await expect(loader.preload(paths)).rejects.toThrow();
      // First config should still be cached
      expect(loader.getCacheSize()).toBe(1);
    });
  });
});
