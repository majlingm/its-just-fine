import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const modelCache = {};
let preloadComplete = false;

export function loadCharacterModel(characterName) {
  return new Promise((resolve, reject) => {
    // Check if it's a full path or just a character name
    const modelPath = characterName.includes('/')
      ? characterName
      : `/assets/characters/Models/GLB format/${characterName}.glb`;

    // All models are now cached (including skeletons after proper cloning)
    if (modelCache[characterName]) {
      // Clone cached model with animations - use deep clone for proper bone structure
      const cachedData = modelCache[characterName];
      const clone = cachedData.scene.clone(true); // true = deep clone
      // Reset position for fresh use
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

        // Store all models in cache (with proper cloning for skeletons)
        modelCache[characterName] = {
          scene: model.clone(true),
          animations: animations
        };

        resolve({ scene: model, animations: animations });
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Preload all character models to prevent stuttering during gameplay
 */
export async function preloadAllModels(onProgress = null) {
  const modelNames = Object.values(CHARACTER_MODELS);
  const uniqueModels = [...new Set(modelNames)]; // Remove duplicates

  let loaded = 0;
  const total = uniqueModels.length;

  for (const modelName of uniqueModels) {
    try {
      await loadCharacterModel(modelName);
      loaded++;
      if (onProgress) {
        onProgress(loaded, total, modelName);
      }
    } catch (error) {
      console.warn(`Failed to preload model ${modelName}:`, error);
    }
  }

  preloadComplete = true;
  console.log(`Preloaded ${loaded}/${total} character models`);
}

export function isPreloadComplete() {
  return preloadComplete;
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
