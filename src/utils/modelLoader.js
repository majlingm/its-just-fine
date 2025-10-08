import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getAssetPath } from './assetPath.js';

const loader = new GLTFLoader();
const modelCache = {};

export function loadCharacterModel(characterName) {
  return new Promise((resolve, reject) => {
    // Check if it's a full path or just a character name
    const relativePath = characterName.includes('/')
      ? characterName
      : `/assets/characters/Models/GLB format/${characterName}.glb`;

    // Get the correct path for the environment
    const modelPath = getAssetPath(relativePath);

    // Check if this is player or skeleton model - these should always load fresh
    const shouldSkipCache =
      modelPath.includes('anime_character_cyberstyle') ||
      modelPath.includes('beautiful_witch') ||
      modelPath.includes('skeleton') ||
      modelPath.includes('Skeleton');

    console.log('Loading model from path:', modelPath);

    if (shouldSkipCache) {
      console.log('(no cache for player/skeleton)');
    } else if (modelCache[characterName]) {
      // Use cached model for non-player, non-skeleton models
      console.log('Using cached model');
      const cachedData = modelCache[characterName];
      const clone = cachedData.scene.clone(true);
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      clone.scale.set(1, 1, 1);
      resolve({ scene: clone, animations: cachedData.animations });
      return;
    }

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        const animations = gltf.animations;

        // Cache only non-player, non-skeleton models
        if (!shouldSkipCache) {
          modelCache[characterName] = {
            scene: model.clone(true),
            animations: animations
          };
        }

        resolve({ scene: model, animations: animations });
      },
      undefined,
      (error) => {
        console.error('Error loading model:', modelPath, error);
        reject(error);
      }
    );
  });
}

/**
 * Preload all character models (caches non-player, non-skeleton models)
 */
export async function preloadAllModels(onProgress = null) {
  const modelNames = Object.values(CHARACTER_MODELS);
  const uniqueModels = [...new Set(modelNames)]; // Remove duplicates

  let loaded = 0;
  const total = uniqueModels.length;
  let preloadComplete = false;

  console.log('Starting model preload (selective caching)...');

  for (const modelName of uniqueModels) {
    try {
      // This will cache non-player, non-skeleton models automatically
      await loadCharacterModel(modelName);
      loaded++;
      if (onProgress) {
        onProgress(loaded, total, modelName);
      }
    } catch (error) {
      console.warn(`Failed to load model ${modelName}:`, error);
    }
  }

  preloadComplete = true;
  console.log(`Preloaded ${loaded}/${total} character models (cached non-player/skeleton models)`);
  return preloadComplete;
}

export function isPreloadComplete() {
  // Check if we have some models cached (but not player/skeleton)
  return Object.keys(modelCache).length > 0;
}

// Character assignments for the game
export const CHARACTER_MODELS = {
  player: '/assets/characters/anime_character_cyberstyle.glb',
  bandit: 'character-b',
  coyote: 'character-c',
  brute: 'character-l', // Zombie - slow and lumbering
  gunman: 'character-e',
  charger: 'character-f',
  boss: 'character-g',
  tiny: 'character-c', // Small, fast - reuse coyote model
  giant: 'character-l', // Large, slow - reuse brute model
  skeleton_warrior: '/assets/SkeletonsKit/characters/gltf/Skeleton_Warrior.glb',
  skeleton_mage: '/assets/SkeletonsKit/characters/gltf/Skeleton_Mage.glb'
};
