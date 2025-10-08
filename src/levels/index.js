import { desertCanyonLevel } from './desertCanyon.js';
import { urbanOutpostLevel } from './urbanOutpost.js';
import { abandonedTownLevel } from './abandonedTown.js';
import { bossRushLevel } from './bossRush.js';
import { survivalLevel } from './survival.js';

export const LEVELS = {
  SURVIVAL: survivalLevel,
  DESERT_CANYON: desertCanyonLevel,
  URBAN_OUTPOST: urbanOutpostLevel,
  ABANDONED_TOWN: abandonedTownLevel,
  BOSS_RUSH: bossRushLevel
};

export const GAME_MODES = {
  SURVIVAL: {
    name: 'Survive!',
    levels: ['SURVIVAL']
  },
  STORY: {
    name: 'Story',
    levels: ['DESERT_CANYON', 'URBAN_OUTPOST', 'ABANDONED_TOWN', 'BOSS_RUSH']
  }
};

export function getLevelByName(name) {
  return Object.values(LEVELS).find(level => level.name === name);
}

export function getAllLevels() {
  return Object.values(LEVELS);
}
