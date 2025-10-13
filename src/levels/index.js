import { desertCanyonLevel } from './desertCanyon.js';
import { getAssetPath } from '../utils/assetPath.js';
import { urbanOutpostLevel } from './urbanOutpost.js';
import { abandonedTownLevel } from './abandonedTown.js';
import { bossRushLevel } from './bossRush.js';
import { survivalLevel } from './survival.js';
import { chapter1Level } from './chapter1.js';

export const LEVELS = {
  SURVIVAL: survivalLevel,
  DESERT_CANYON: desertCanyonLevel,
  URBAN_OUTPOST: urbanOutpostLevel,
  ABANDONED_TOWN: abandonedTownLevel,
  BOSS_RUSH: bossRushLevel,
  CHAPTER_1: chapter1Level
};

export const GAME_MODES = {
  SURVIVAL: {
    name: 'Survive!',
    levels: ['SURVIVAL']
  },
  STORY: {
    name: 'Story',
    levels: [] // Story mode now uses chapter system instead
  }
};

export function getLevelByName(name) {
  return Object.values(LEVELS).find(level => level.name === name);
}

export function getAllLevels() {
  return Object.values(LEVELS);
}
