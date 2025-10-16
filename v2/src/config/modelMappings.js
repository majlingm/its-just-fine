/**
 * Model Mappings - Maps enemy types to their GLTF model files
 *
 * This configuration defines which 3D model file should be used for each enemy type.
 * Models are loaded from /assets/characters/ or /assets/SkeletonsKit/
 */

export const MODEL_MAPPINGS = {
  // Player character
  'player': '/assets/characters/anime_character_cyberstyle.glb',

  // Standard character models (bandit, coyote, etc.)
  'bandit': '/assets/characters/Models/GLB format/character-a.glb',
  'coyote': '/assets/characters/Models/GLB format/character-b.glb',
  'brute': '/assets/characters/Models/GLB format/character-c.glb',
  'gunman': '/assets/characters/Models/GLB format/character-d.glb',
  'charger': '/assets/characters/Models/GLB format/character-e.glb',
  'tiny': '/assets/characters/Models/GLB format/character-f.glb',
  'giant': '/assets/characters/Models/GLB format/character-g.glb',

  // Skeleton models
  'skeleton_warrior': '/assets/SkeletonsKit/characters/gltf/Skeleton_Warrior.glb',
  'skeleton_mage': '/assets/SkeletonsKit/characters/gltf/Skeleton_Mage.glb',

  // Note: Shader-based enemies (shadow/light types) don't use models
  // They are rendered using shader materials with PlaneGeometry
};

/**
 * Get the model path for an enemy type
 * @param {string} modelType - The model type from enemy config
 * @returns {string|null} Path to the model file, or null if not found
 */
export function getModelPath(modelType) {
  return MODEL_MAPPINGS[modelType] || null;
}

/**
 * Check if a model type uses a GLTF model
 * @param {string} modelType - The model type
 * @returns {boolean} True if this type uses a GLTF model
 */
export function usesGLTFModel(modelType) {
  return modelType in MODEL_MAPPINGS;
}
