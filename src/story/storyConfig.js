import { getAssetPath } from '../utils/assetPath.js';

/**
 * Story Mode Configuration
 * Each chapter has:
 * - intro: Image and audio scene shown before the level
 * - level: The actual gameplay level
 */

export const STORY_CHAPTERS = [
  {
    id: 'CHAPTER_1',
    name: 'Chapter 1: The Awakening',
    intro: {
      image: getAssetPath('/assets/story/chapter1.png'),
      audio: getAssetPath('/assets/story/chapter1.mp3'),
      // Optional: Text overlay (can be added later)
      text: null,
      // Time in seconds when the level should start (0 = wait for audio to end)
      startGameAtSecond: 20
    },
    level: {
      // Will be defined in level file
      levelKey: 'CHAPTER_1'
    }
  }
  // More chapters can be added here
  // {
  //   id: 'CHAPTER_2',
  //   name: 'Chapter 2: The Journey Begins',
  //   intro: {
  //     image: getAssetPath('/assets/story/chapter2.png'),
  //     audio: getAssetPath('/assets/story/chapter2.mp3')
  //   },
  //   level: {
  //     levelKey: 'CHAPTER_2'
  //   }
  // }
];

/**
 * Get chapter by ID
 */
export function getChapter(chapterId) {
  return STORY_CHAPTERS.find(ch => ch.id === chapterId);
}

/**
 * Get next chapter
 */
export function getNextChapter(currentChapterId) {
  const currentIndex = STORY_CHAPTERS.findIndex(ch => ch.id === currentChapterId);
  if (currentIndex === -1 || currentIndex >= STORY_CHAPTERS.length - 1) {
    return null;
  }
  return STORY_CHAPTERS[currentIndex + 1];
}

/**
 * Get chapter by index (0-based)
 */
export function getChapterByIndex(index) {
  return STORY_CHAPTERS[index] || null;
}

/**
 * Get total number of chapters
 */
export function getTotalChapters() {
  return STORY_CHAPTERS.length;
}
