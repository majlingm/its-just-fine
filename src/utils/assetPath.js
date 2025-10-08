// Utility to handle asset paths for both development and GitHub Pages

// Determine if we're on GitHub Pages by checking the URL
const isGitHubPages = window.location.hostname.includes('github.io') ||
                      window.location.pathname.includes('/its-just-fine');

// Set base path based on environment
const BASE_PATH = isGitHubPages ? '/its-just-fine' : '';

/**
 * Get the correct asset path for the current environment
 * @param {string} path - The asset path (should start with /)
 * @returns {string} The full path with base prepended if needed
 */
export function getAssetPath(path) {
  // If path doesn't start with /, add it
  const normalizedPath = path.startsWith('/') ? path : '/' + path;

  // Add base path if we're on GitHub Pages
  return BASE_PATH ? BASE_PATH + normalizedPath : normalizedPath;
}

// Export for debugging
export const IS_GITHUB_PAGES = isGitHubPages;
export const ASSET_BASE_PATH = BASE_PATH;

console.log('Asset path helper initialized:', {
  isGitHubPages,
  basePath: BASE_PATH || '(root)',
  examplePath: getAssetPath('/assets/test.glb')
});