/**
 * Camera Configuration
 *
 * Highly customizable camera settings for different game modes and devices.
 * Supports multiple camera types, angles, and follow behaviors.
 */

export const CameraConfig = {
  /**
   * Default camera settings (used if no mode-specific config provided)
   */
  default: {
    // Camera type: 'perspective' or 'orthographic'
    type: 'perspective',

    // Perspective camera settings
    fov: 50,
    near: 0.1,
    far: 1000,

    // Camera distance from target
    distance: 12,

    // Camera angles (in radians)
    // Horizontal angle: rotation around Y axis (0 = north, π/2 = east, π = south, 3π/2 = west)
    horizontalAngle: 0,

    // Vertical angle: 0 = top-down, π/4 = 45°, π/2 = side view
    verticalAngle: Math.PI / 6, // ~30° from horizontal

    // Camera positioning formula
    // height = distance * heightMultiplier
    // radius = distance * radiusMultiplier
    heightMultiplier: 1.5,  // Camera Y position = distance * 1.5
    radiusMultiplier: 0.5,  // Camera XZ offset = distance * 0.5

    // Camera follow behavior
    follow: {
      enabled: true,
      smoothing: 0.1,       // 0 = instant, 1 = no follow
      lookAtOffset: { x: 0, y: 0, z: 0 }, // Offset from target position
      rotationSmoothing: 0.2
    },

    // Device-specific overrides
    deviceOverrides: {
      desktop: {
        distance: 12,
        heightMultiplier: 1.5,
        radiusMultiplier: 0.5
      },
      tablet: {
        distance: 20,
        heightMultiplier: 1.5,
        radiusMultiplier: 0.5
      },
      mobile: {
        portrait: {
          distance: 32,
          heightMultiplier: 1.5,
          radiusMultiplier: 0.5
        },
        landscape: {
          distance: 28,
          heightMultiplier: 1.5,
          radiusMultiplier: 0.5
        }
      }
    },

    // Zoom settings
    zoom: {
      min: 5,
      max: 50,
      step: 2,
      smoothing: 0.15,
      // Dynamic camera positioning when zooming
      dynamicAngle: {
        enabled: true,
        startThreshold: 0.7,
        zoomedHeightMult: 0.6,
        zoomedRadiusMult: 1.5
      }
    },

    // Rotation settings (for user control)
    rotation: {
      enabled: false,
      horizontalSpeed: 0.05,
      verticalSpeed: 0.03,
      verticalMin: 0,
      verticalMax: Math.PI / 2
    }
  },

  /**
   * Isometric camera (like v1)
   * Top-down angled view that follows the player
   */
  isometric: {
    type: 'perspective',
    fov: 50,
    near: 0.1,
    far: 1000,

    distance: 12,
    horizontalAngle: 0,
    verticalAngle: 0.5,
    heightMultiplier: 2.0,
    radiusMultiplier: 0.5,

    follow: {
      enabled: true,
      smoothing: 0.1,
      lookAtOffset: { x: 0, y: 1, z: 0 },  // Look at player's torso instead of feet
      rotationSmoothing: 0.2
    },

    deviceOverrides: {
      desktop: {
        distance: 12,
        heightMultiplier: 2.0,
        radiusMultiplier: 1
      },
      tablet: {
        distance: 12,
        heightMultiplier: 2.0,
        radiusMultiplier: 0.5
      },
      mobile: {
        portrait: {
          distance: 6,
          heightMultiplier: 2.0,
          radiusMultiplier: 0.5
        },
        landscape: {
          distance: 6,
          heightMultiplier: 2.0,
          radiusMultiplier: 0.5
        }
      }
    },

    zoom: {
      min: 3,
      max: 40,
      step: 1,
      smoothing: 0.15,
      // Dynamic camera positioning when zooming
      dynamicAngle: {
        enabled: true,
        // When to start transitioning (0.0 = always, 1.0 = only at max zoom)
        startThreshold: 0.85,
        // Camera position multipliers when fully zoomed in (third-person view)
        zoomedHeightMult: 1.0,      // Height multiplier when zoomed in
        zoomedRadiusMult: 1.5,      // Radius multiplier when zoomed in (how far behind player)
        zoomedLookAtYOffset: 2.0    // Look at a point 2 units above the player (creates horizontal view)
      }
    },

    rotation: {
      enabled: true, // Allow camera rotation with Q/E keys
      horizontalSpeed: 0.05,
      verticalSpeed: 0.03,
      verticalMin: 0.1,
      verticalMax: 0.9
    }
  },

  /**
   * Third-person camera (over-the-shoulder)
   * More cinematic, closer to player
   */
  thirdPerson: {
    type: 'perspective',
    fov: 60,
    near: 0.1,
    far: 1000,

    distance: 8,
    horizontalAngle: 0,
    verticalAngle: Math.PI / 4, // 45° angle

    heightMultiplier: 1.0,
    radiusMultiplier: 0.8,

    follow: {
      enabled: true,
      smoothing: 0.15,
      lookAtOffset: { x: 0, y: 1, z: 0 }, // Look at player torso
      rotationSmoothing: 0.25
    },

    deviceOverrides: {
      desktop: {
        distance: 8
      },
      tablet: {
        distance: 12
      },
      mobile: {
        portrait: {
          distance: 15
        },
        landscape: {
          distance: 12
        }
      }
    },

    zoom: {
      min: 3,
      max: 20,
      step: 1,
      smoothing: 0.2,
      // Dynamic camera positioning when zooming
      dynamicAngle: {
        enabled: true,
        startThreshold: 0.5,
        zoomedHeightMult: 0.5,
        zoomedRadiusMult: 1.2
      }
    },

    rotation: {
      enabled: true,
      horizontalSpeed: 0.08,
      verticalSpeed: 0.05,
      verticalMin: Math.PI / 8,
      verticalMax: Math.PI / 2.5
    }
  },

  /**
   * Top-down camera (bird's eye view)
   * Straight down, no angle
   */
  topDown: {
    type: 'orthographic',
    near: 0.1,
    far: 1000,

    distance: 20,
    horizontalAngle: 0,
    verticalAngle: 0, // Straight down

    heightMultiplier: 1.0,
    radiusMultiplier: 0,

    // Orthographic camera size
    orthoSize: 15,

    follow: {
      enabled: true,
      smoothing: 0.08,
      lookAtOffset: { x: 0, y: 0, z: 0 },
      rotationSmoothing: 0.1
    },

    zoom: {
      min: 5,
      max: 30,
      step: 2,
      smoothing: 0.1,
      // Dynamic camera positioning (disabled for top-down)
      dynamicAngle: {
        enabled: false,
        startThreshold: 1.0,
        zoomedHeightMult: 1.0,
        zoomedRadiusMult: 0.0
      }
    },

    rotation: {
      enabled: false
    }
  }
};

/**
 * Get camera configuration for a specific mode
 * @param {string} mode - Camera mode name ('default', 'isometric', 'thirdPerson', 'topDown')
 * @returns {Object} Camera configuration
 */
export function getCameraConfig(mode = 'default') {
  return CameraConfig[mode] || CameraConfig.default;
}

/**
 * Detect device type and orientation
 * @returns {Object} Device info
 */
export function detectDevice() {
  const userAgent = navigator.userAgent;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;

  const isIPhone = /iPhone/i.test(userAgent);
  const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isTablet = isIPad || (isAndroid && width >= 768 && width <= 1024);
  const isMobile = (isIPhone || (isAndroid && width < 768)) && !isTablet;

  return {
    type: isMobile ? 'mobile' : (isTablet ? 'tablet' : 'desktop'),
    orientation: isLandscape ? 'landscape' : 'portrait',
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    width,
    height
  };
}

/**
 * Get device-specific camera settings
 * @param {Object} config - Camera configuration
 * @returns {Object} Device-specific settings
 */
export function getDeviceCameraSettings(config) {
  const device = detectDevice();
  const overrides = config.deviceOverrides || {};

  if (device.isMobile) {
    return overrides.mobile?.[device.orientation] || overrides.mobile?.portrait || {};
  } else if (device.isTablet) {
    return overrides.tablet || {};
  } else {
    return overrides.desktop || {};
  }
}
