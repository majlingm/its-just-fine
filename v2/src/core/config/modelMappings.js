/**
 * Model Mappings - Maps enemy types to their GLTF model files
 *
 * This configuration defines which 3D model file should be used for each enemy type.
 * Models are loaded from /assets/characters/ or /assets/SkeletonsKit/
 */

export const MODEL_MAPPINGS = {
  // Player character
  'player': '/assets/characters/anime_character_cyberstyle.glb',

  // Standard character models (from v1)
  'bandit': '/assets/characters/character-b.glb',
  'coyote': '/assets/characters/character-c.glb',
  'brute': '/assets/characters/character-l.glb', // Zombie - slow and lumbering
  'gunman': '/assets/characters/character-e.glb',
  'charger': '/assets/characters/character-f.glb',
  'tiny': '/assets/characters/character-c.glb', // Small, fast - reuse coyote model
  'giant': '/assets/characters/character-l.glb', // Large, slow - reuse brute model

  // New enemy types (using additional character models)
  'flame_imp': '/assets/characters/character-d.glb', // Fast attacker
  'crystal_guardian': '/assets/characters/character-h.glb', // Defensive tank-like
  'void_walker': '/assets/characters/character-i.glb', // Mysterious
  'frost_sentinel': '/assets/characters/character-j.glb', // Ranged attacker
  'corrupted_knight': '/assets/characters/character-g.glb', // Heavy armor
  'arcane_wisp': '/assets/characters/character-a.glb', // Light, evasive
  'stone_golem': '/assets/characters/character-k.glb', // Large and sturdy
  'blood_hound': '/assets/characters/character-c.glb', // Beast-like (reuse coyote)
  'lightning_elemental': '/assets/characters/character-m.glb', // Energy-based

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
