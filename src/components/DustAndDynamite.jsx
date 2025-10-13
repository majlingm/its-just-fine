import React, { useEffect, useRef, useState } from "react";
import { GameEngine } from "../engine/GameEngine.js";
import { DustAndDynamiteGame } from "../engine/DustAndDynamiteGame.js";
import { spellRegistry } from "../spells/SpellRegistry.js";
import { LEVELS, GAME_MODES, getAllLevels } from "../levels/index.js";
import { preloadAllModels } from "../utils/modelLoader.js";
import { getAssetPath } from "../utils/assetPath.js";
import { StoryScene } from "./StoryScene.jsx";
import { STORY_CHAPTERS, getChapter, getNextChapter } from "../story/storyConfig.js";

const DustAndDynamite = () => {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const gameRef = useRef(null);

  // Spell visual configuration
  const getSpellVisuals = (spellName) => {
    const visuals = {
      'Thunder Strike': { color: '#ffff00', gradient: 'radial-gradient(circle, rgba(255, 255, 0, 0.8), rgba(200, 200, 0, 0.3))', icon: '⚡', border: '#ffff00' },
      'Chain Lightning': { color: '#8844ff', gradient: 'radial-gradient(circle, rgba(136, 68, 255, 0.8), rgba(68, 34, 200, 0.3))', icon: '🌩️', border: '#aa66ff' },
      'Fireball': { color: '#ff4400', gradient: 'radial-gradient(circle, rgba(255, 68, 0, 0.8), rgba(200, 0, 0, 0.3))', icon: '🔥', border: '#ff6622' },
      'Pyro Explosion': { color: '#ff8800', gradient: 'radial-gradient(circle, rgba(255, 136, 0, 0.8), rgba(200, 68, 0, 0.3))', icon: '💥', border: '#ffaa44' },
      'Ring of Fire': { color: '#ff2200', gradient: 'radial-gradient(circle, rgba(255, 34, 0, 0.8), rgba(200, 0, 0, 0.3))', icon: '🔴', border: '#ff4422' },
      'Ice Lance': { color: '#00ddff', gradient: 'radial-gradient(circle, rgba(0, 221, 255, 0.8), rgba(0, 150, 200, 0.3))', icon: '❄️', border: '#22eeff' },
      'Ring of Ice': { color: '#66ccff', gradient: 'radial-gradient(circle, rgba(102, 204, 255, 0.8), rgba(50, 150, 200, 0.3))', icon: '💎', border: '#88ddff' },
      'Magic Bullet': { color: '#ff00ff', gradient: 'radial-gradient(circle, rgba(255, 0, 255, 0.8), rgba(200, 0, 200, 0.3))', icon: '✨', border: '#ff44ff' },
      'Static Burst': { color: '#ffffff', gradient: 'radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(180, 180, 255, 0.3))', icon: '⚡', border: '#ccddff' },
      'Power Chord': { color: '#ff0000', gradient: 'radial-gradient(circle, rgba(255, 0, 0, 0.8), rgba(200, 0, 0, 0.3))', icon: '⚡', border: '#ff4444' },
    };
    return visuals[spellName] || { color: '#ffd700', gradient: 'radial-gradient(circle, rgba(255, 215, 0, 0.8), rgba(180, 150, 0, 0.3))', icon: '⭐', border: '#ffd700' };
  };
  const [uiState, setUiState] = useState({
    health: 100,
    maxHealth: 100,
    xp: 0,
    level: 1,
    xpProgress: 0,
    time: 0,
    enemyCount: 0,
    levelingUp: false,
    upgradeChoices: [],
    gameOver: false,
    gameOverTime: 0,
    victory: false,
    victoryTime: 0,
    kills: 0,
    damage: 0,
    weapons: [],
    wave: 1,
    highestWave: 0,
    totalKills: 0,
    // Wave system state
    currentWave: 1,
    totalWaves: 4,
    waveActive: false,
    allWavesCompleted: false,
    bossSpawned: false,
    enemiesRemaining: 0,
    // Boss tracking
    hasBoss: false,
    bossHealth: 0,
    bossMaxHealth: 0,
    // Enemy indicator
    nearestEnemyDirection: null,
    nearestEnemyDistance: 0,
    enemyChanged: false,
  });

  const [showWeaponPanel, setShowWeaponPanel] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedUpgradeIndex, setSelectedUpgradeIndex] = useState(0);
  const [waveNotification, setWaveNotification] = useState(null);
  const [showDevMenu, setShowDevMenu] = useState(false); // Dev menu starts hidden, toggle with P key
  const [showStoryLevels, setShowStoryLevels] = useState(false); // Toggle story submenu
  const [selectedGround, setSelectedGround] = useState('checkerboard'); // Default ground for survival
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, current: '' });

  // Story mode state
  const [showingStoryIntro, setShowingStoryIntro] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [storyMode, setStoryMode] = useState(false);
  const [storyFadeOut, setStoryFadeOut] = useState(false);
  const [gameLoadedBehindScene, setGameLoadedBehindScene] = useState(false);
  const introAudioRef = useRef(null);
  const introTimerRef = useRef(null);

  // Arrow rotation and position tracking for smooth interpolation
  const arrowRotationRef = useRef(0);
  const [arrowRotation, setArrowRotation] = useState(0);
  const arrowPositionRef = useRef({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });

  const userAgent = navigator.userAgent;
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Detect device type (same logic as game camera)
  const isIPhone = /iPhone/i.test(userAgent);
  const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isTablet = isIPad || (isAndroid && width >= 768 && width <= 1024);
  const isMobile = (isIPhone || (isAndroid && width < 768)) && !isTablet;
  const isLandscape = width > height;

  const uiScale = isMobile ? 0.7 : isTablet ? 0.85 : 1;

  // Gamepad navigation for upgrades
  useEffect(() => {
    if (!uiState.levelingUp) return;

    let lastDpadInput = 0;
    let lastButtonInput = 0;

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gamepad = gamepads[0];

      if (!gamepad || !uiState.upgradeChoices.length) return;

      const now = Date.now();

      // D-pad or left stick horizontal (left/right)
      const deadzone = 0.5;
      const horizontal = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] :
                        (gamepad.buttons[14]?.pressed ? -1 : gamepad.buttons[15]?.pressed ? 1 : 0);

      if (horizontal !== 0 && now - lastDpadInput > 200) {
        if (horizontal < 0) {
          setSelectedUpgradeIndex(prev => Math.max(0, prev - 1));
        } else {
          setSelectedUpgradeIndex(prev => Math.min(uiState.upgradeChoices.length - 1, prev + 1));
        }
        lastDpadInput = now;
      }

      // A button to select
      if (gamepad.buttons[0]?.pressed && now - lastButtonInput > 200) {
        handleUpgradeSelect(uiState.upgradeChoices[selectedUpgradeIndex]);
        lastButtonInput = now;
      }
    };

    const interval = setInterval(checkGamepad, 50);
    return () => clearInterval(interval);
  }, [uiState.levelingUp, uiState.upgradeChoices, selectedUpgradeIndex]);

  // Start game loading timer when intro scene is showing
  useEffect(() => {
    if (showingStoryIntro && currentChapter && !gameStarted) {
      // Start timer to trigger game loading
      const startGameAtSecond = currentChapter.intro.startGameAtSecond || 0;
      if (startGameAtSecond > 0) {
        introTimerRef.current = setTimeout(() => {
          handleStartGame(currentChapter.level.levelKey);
        }, startGameAtSecond * 1000);
      }
    }

    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
      }
    };
  }, [showingStoryIntro, currentChapter, gameStarted]);

  useEffect(() => {
    if (!gameStarted || !selectedLevel) return;

    const initGame = async () => {
      // Show loading screen (but not for story mode)
      if (!storyMode) {
        setLoading(true);
      }

      // Preload all models
      await preloadAllModels((loaded, total, modelName) => {
        if (!storyMode) {
          setLoadingProgress({ loaded, total, current: modelName });
        }
      });

      // Initialize game after preloading
      const engine = new GameEngine();
      engine.init(mountRef.current);
      engineRef.current = engine;

      const game = new DustAndDynamiteGame(engine);
      gameRef.current = game;

      game.onUpdate = (state) => {
        setUiState((prev) => ({
          ...prev,
          ...state,
          levelingUp: prev.levelingUp,
          upgradeChoices: prev.upgradeChoices,
          gameOver: prev.gameOver,
          gameOverTime: prev.gameOverTime,
          weapons: game.player ? game.player.weapons.map((w) => {
            const spell = spellRegistry.createSpell(w.spellKey, w.level);
            return spell ? spell.name : w.spellKey;
          }) : [],
        }));
      };

      game.onWaveUpdate = (waveInfo) => {
        setUiState((prev) => ({
          ...prev,
          currentWave: waveInfo.currentWave,
          totalWaves: waveInfo.totalWaves,
          waveActive: waveInfo.waveActive,
          allWavesCompleted: waveInfo.allWavesCompleted,
          bossSpawned: waveInfo.bossSpawned,
          enemiesRemaining: waveInfo.enemiesRemaining,
        }));
      };

      game.onLevelUp = (choices) => {
        setUiState((prev) => ({
          ...prev,
          levelingUp: true,
          upgradeChoices: choices,
        }));
      };

      game.onGameOver = (stats) => {
        setUiState((prev) => ({
          ...prev,
          gameOver: true,
          gameOverTime: Date.now(),
          ...stats,
        }));
      };

      game.onVictory = (stats) => {
        setUiState((prev) => ({
          ...prev,
          victory: true,
          victoryTime: Date.now(),
          damage: Math.floor(game.totalDamageDealt || 0),
          ...stats,
        }));

        // Handle story mode progression
        if (storyMode && currentChapter) {
          const nextChapter = getNextChapter(currentChapter.id);
          if (nextChapter) {
            // Automatically progress to next chapter after a delay
            setTimeout(() => {
              setUiState((prev) => ({ ...prev, victory: false }));
              setCurrentChapter(nextChapter);
              setShowingStoryIntro(true);
              setGameStarted(false);
            }, 3000);
          }
        }
      };

      const originalUpdate = engine.update.bind(engine);
      engine.update = (dt) => {
        originalUpdate(dt);
        game.update(dt);
      };

      await game.start(selectedLevel);

      // Hide loading screen or trigger story fade out
      if (storyMode) {
        // Story mode: game loaded, trigger scene fade out
        setGameLoadedBehindScene(true);
        setStoryFadeOut(true);

        // Stop level music immediately - let intro audio continue
        if (engine.sound) {
          engine.sound.stopMusic();
        }

        // Listen for intro audio to end, then start level music
        if (introAudioRef.current) {
          const handleIntroEnd = () => {
            if (engine.sound && gameRef.current?.levelConfig?.music) {
              engine.sound.playMusic(gameRef.current.levelConfig.music);
            }
          };

          introAudioRef.current.addEventListener('ended', handleIntroEnd);

          // Store cleanup function
          const cleanup = () => {
            if (introAudioRef.current) {
              introAudioRef.current.removeEventListener('ended', handleIntroEnd);
            }
          };

          // Return cleanup
          return cleanup;
        }
      } else {
        // Normal mode: just hide loading
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, [gameStarted, selectedLevel]);

  const handleUpgradeSelect = (upgrade) => {
    gameRef.current.selectUpgrade(upgrade);
    setUiState((prev) => ({ ...prev, levelingUp: false, upgradeChoices: [] }));
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleStartGame = (levelKey) => {
    setSelectedLevel(levelKey);
    setGameStarted(true);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const toggleWeapon = (spellKey) => {
    if (!gameRef.current || !gameRef.current.player) return;

    const player = gameRef.current.player;
    const existingIndex = player.weapons.findIndex(
      (w) => w.spellKey === spellKey,
    );

    if (existingIndex >= 0) {
      // Remove weapon
      player.weapons.splice(existingIndex, 1);
    } else {
      // Add weapon with spell key
      player.weapons.push({ spellKey: spellKey, level: 1, lastShot: 0 });
    }
  };

  const hasWeapon = (spellKey) => {
    if (!gameRef.current || !gameRef.current.player) return false;
    return gameRef.current.player.weapons.some((w) => w.spellKey === spellKey);
  };

  const getWeaponLevel = (spellKey) => {
    if (!gameRef.current || !gameRef.current.player) return 1;
    const weapon = gameRef.current.player.weapons.find((w) => w.spellKey === spellKey);
    return weapon?.level || 1;
  };

  const handleSpellUpgrade = (spellKey, event) => {
    event.stopPropagation(); // Prevent toggle when clicking upgrade button

    if (!gameRef.current || !gameRef.current.player) return;

    const player = gameRef.current.player;
    const weapon = player.weapons.find((w) => w.spellKey === spellKey);

    if (!weapon) return;

    // Increment level (max level 7)
    if (weapon.level < 7) {
      weapon.level++;

      // Clear cached spell instance so it gets recreated with new level
      weapon.spellInstance = null;

      // If this is a ring spell, find the ring entity and destroy it so it recreates with new stats
      const isRingSpell = spellKey === 'RING_OF_FIRE' || spellKey === 'RING_OF_ICE';
      if (isRingSpell && gameRef.current.engine) {
        const ringEntity = gameRef.current.engine.entities.find(entity =>
          entity.active &&
          (entity.constructor.name === 'RingOfFire' || entity.constructor.name === 'RingOfIce')
        );
        if (ringEntity) {
          ringEntity.destroy();
        }
      }
    }
  };

  const handleGroundChange = (groundType) => {
    if (!gameRef.current || !gameRef.current.engine) return;
    setSelectedGround(groundType);
    gameRef.current.engine.updateGround(groundType);
  };

  // Get all active ring spells
  const getRingSpells = () => {
    if (!gameRef.current || !gameRef.current.player) return [];
    const rings = [];
    const ringFire = gameRef.current.player.weapons.find((w) => w.spellKey === 'RING_OF_FIRE');
    const ringIce = gameRef.current.player.weapons.find((w) => w.spellKey === 'RING_OF_ICE');
    if (ringFire) rings.push(ringFire);
    if (ringIce) rings.push(ringIce);
    return rings;
  };

  // Check if any ring is full
  const isAnyRingFull = () => {
    if (!engineRef.current || !engineRef.current.entities) return false;

    // Find ring entities in the engine's entity list
    const ringEntities = engineRef.current.entities.filter(entity =>
      entity.active &&
      entity.isRingFull &&
      typeof entity.isRingFull === 'function'
    );

    return ringEntities.some(ring => ring.isRingFull());
  };

  // Trigger ring burst for all active rings
  const triggerRingBurst = () => {
    if (!engineRef.current || !engineRef.current.entities) return;

    // Find ring entities in the engine's entity list
    const ringEntities = engineRef.current.entities.filter(entity =>
      entity.active &&
      entity.isRingFull &&
      entity.triggerBurst &&
      typeof entity.isRingFull === 'function' &&
      typeof entity.triggerBurst === 'function'
    );

    ringEntities.forEach(ring => {
      if (ring.isRingFull()) {
        ring.triggerBurst();
      }
    });
  };

  // Keyboard handler for ring burst (R key) and dev menu toggle (P key)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        triggerRingBurst();
      }
      if (e.key === 'p' || e.key === 'P') {
        setShowDevMenu(prev => {
          const newState = !prev;
          if (gameRef.current) {
            if (newState) {
              // Auto-pause when opening dev menu
              gameRef.current.setPause(true);
              // Update pause button text if it exists
              const btn = document.getElementById('pause-btn');
              if (btn) {
                btn.textContent = 'PAUSED';
                btn.style.borderColor = 'rgba(255, 200, 0, 0.5)';
              }
            } else {
              // Auto-unpause when closing dev menu
              gameRef.current.setPause(false);
              // Update pause button text if it exists
              const btn = document.getElementById('pause-btn');
              if (btn) {
                btn.textContent = 'PAUSE';
                btn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }
          }
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  // Smooth arrow rotation and position animation
  useEffect(() => {
    if (!uiState.nearestEnemyDirection || !uiState.nearestEnemyDirection.enemyScreenPos) return;

    // Reset when enemy changes (new arrow position)
    if (uiState.enemyChanged) {
      const arrowPos = uiState.nearestEnemyDirection.arrowPosition;
      const enemyScreenPos = uiState.nearestEnemyDirection.enemyScreenPos;

      if (arrowPos && enemyScreenPos) {
        // Set initial position and rotation for new enemy
        arrowPositionRef.current = { ...arrowPos };
        setArrowPosition({ ...arrowPos });

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        const enemyScreenX = (enemyScreenPos.x * centerX) + centerX;
        const enemyScreenY = (-enemyScreenPos.y * centerY) + centerY;

        const dirX = enemyScreenX - arrowPos.x;
        const dirY = enemyScreenY - arrowPos.y;

        const initialRotation = Math.atan2(dirY, dirX) * (180 / Math.PI) + 90;
        arrowRotationRef.current = initialRotation;
        setArrowRotation(initialRotation);
      }
    }

    let animationId;

    const animate = () => {
      const targetArrowPos = uiState.nearestEnemyDirection.arrowPosition;
      const enemyScreenPos = uiState.nearestEnemyDirection.enemyScreenPos;

      if (!targetArrowPos || !enemyScreenPos) return;

      // Smooth position interpolation
      const currentPos = arrowPositionRef.current;
      const positionSpeed = 0.12; // Smooth position transition speed
      const newX = currentPos.x + (targetArrowPos.x - currentPos.x) * positionSpeed;
      const newY = currentPos.y + (targetArrowPos.y - currentPos.y) * positionSpeed;

      arrowPositionRef.current = { x: newX, y: newY };
      setArrowPosition({ x: newX, y: newY });

      // Calculate target rotation using interpolated position
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      const enemyScreenX = (enemyScreenPos.x * centerX) + centerX;
      const enemyScreenY = (-enemyScreenPos.y * centerY) + centerY;

      const dirX = enemyScreenX - newX;
      const dirY = enemyScreenY - newY;

      const targetRotation = Math.atan2(dirY, dirX) * (180 / Math.PI) + 90;

      // Smooth rotation interpolation
      const currentRotation = arrowRotationRef.current;

      // Calculate shortest angular distance
      let diff = targetRotation - currentRotation;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      // Interpolate rotation
      const rotationSpeed = 0.15;
      const newRotation = currentRotation + diff * rotationSpeed;

      arrowRotationRef.current = newRotation;
      setArrowRotation(newRotation);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [uiState.nearestEnemyDirection, uiState.enemyChanged]);

  // Wave notification system
  useEffect(() => {
    if (!gameStarted) return;

    // Show wave start notification
    if (uiState.waveActive && uiState.currentWave > 0 && uiState.totalWaves > 0) {
      setWaveNotification(`Wave ${uiState.currentWave} Starting!`);
      const timer = setTimeout(() => setWaveNotification(null), 2500);
      return () => clearTimeout(timer);
    }

    // Show all waves complete notification
    if (uiState.allWavesCompleted && !uiState.bossSpawned) {
      setWaveNotification('All Waves Complete! Boss Incoming...');
      const timer = setTimeout(() => setWaveNotification(null), 3000);
      return () => clearTimeout(timer);
    }

    // Show boss spawn notification
    if (uiState.bossSpawned) {
      setWaveNotification('⚔️ BOSS FIGHT! ⚔️');
      const timer = setTimeout(() => setWaveNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uiState.currentWave, uiState.waveActive, uiState.allWavesCompleted, uiState.bossSpawned, gameStarted]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      {/* Loading Screen */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            color: "rgba(255, 255, 255, 0.9)",
            zIndex: 4000,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6, marginBottom: 40 }}>
            Loading Assets
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: 300,
              height: 2,
              background: "rgba(255, 255, 255, 0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`,
                height: "100%",
                background: "rgba(255, 255, 255, 0.9)",
                transition: "width 0.3s",
              }}
            />
          </div>

          <div style={{ marginTop: 20, fontSize: 14, fontWeight: 200, opacity: 0.7 }}>
            {loadingProgress.loaded} / {loadingProgress.total}
          </div>

          {loadingProgress.current && (
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 200, opacity: 0.5 }}>
              {loadingProgress.current.split('/').pop().replace('.glb', '')}
            </div>
          )}
        </div>
      )}

      {/* Start Screen */}
      {!gameStarted && !loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url('${getAssetPath('/assets/main-menu.png')}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            color: "#fff",
            zIndex: 3000,
            overflow: "hidden",
          }}
        >
          {/* Dark overlay for minimalist aesthetic */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.55)",
            zIndex: 1,
          }} />
          {/* Animated particles background */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 2,
            overflow: "hidden",
            pointerEvents: "none",
          }}>
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: `${Math.random() * 6 + 3}px`,
                  height: `${Math.random() * 6 + 3}px`,
                  borderRadius: "50%",
                  background: ["#ff4400", "#ff8800", "#ffaa00", "#ff2200", "#ffcc00"][Math.floor(Math.random() * 5)],
                  boxShadow: `0 0 ${Math.random() * 25 + 15}px currentColor`,
                  bottom: `${Math.random() * 20 - 10}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `fireRise ${Math.random() * 4 + 3}s infinite ease-out`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.6 + 0.4,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes fireRise {
              0% {
                transform: translateY(0) translateX(0) scale(1);
                opacity: 1;
              }
              25% {
                transform: translateY(-25vh) translateX(10px) scale(0.9);
                opacity: 0.8;
              }
              50% {
                transform: translateY(-50vh) translateX(-15px) scale(0.7);
                opacity: 0.5;
              }
              75% {
                transform: translateY(-75vh) translateX(20px) scale(0.5);
                opacity: 0.3;
              }
              100% {
                transform: translateY(-110vh) translateX(-10px) scale(0.2);
                opacity: 0;
              }
            }
          `}</style>
          <div style={{ textAlign: "center", position: "relative", zIndex: 10, marginBottom: 80 }}>
            <h1
              style={{
                fontSize: `${72 * uiScale}px`,
                color: "rgba(255, 255, 255, 0.95)",
                marginBottom: 16,
                fontWeight: 200,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              This is Fine
            </h1>
            <p
              style={{
                fontSize: `${18 * uiScale}px`,
                color: "rgba(255, 255, 255, 0.6)",
                fontWeight: 200,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.1em",
                margin: 0,
              }}
            >
              Just surviving the latest apocalypse
            </p>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              cursor: "pointer",
              zIndex: 100,
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
            }}
          >
            ⛶ Fullscreen
          </button>

          {/* Main Menu */}
          {!showStoryLevels ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 35,
                position: "relative",
                zIndex: 10,
              }}
            >
              {/* Survive Option */}
              <div
                onClick={() => handleStartGame('SURVIVAL')}
                style={{
                  cursor: "pointer",
                  fontSize: `${36 * uiScale}px`,
                  color: "rgba(255, 255, 255, 0.7)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Survive
              </div>

              {/* Story Option */}
              <div
                onClick={() => {
                  // Start story mode from Chapter 1
                  const firstChapter = STORY_CHAPTERS[0];
                  setCurrentChapter(firstChapter);
                  setShowingStoryIntro(true);
                  setStoryMode(true);
                }}
                style={{
                  cursor: "pointer",
                  fontSize: `${36 * uiScale}px`,
                  color: "rgba(255, 255, 255, 0.7)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Story
              </div>
            </div>
          ) : (
            /* Story Levels Submenu */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 30,
                position: "relative",
                zIndex: 10,
              }}
            >
              {/* Back Button */}
              <div
                onClick={() => setShowStoryLevels(false)}
                style={{
                  cursor: "pointer",
                  fontSize: `${24 * uiScale}px`,
                  color: "rgba(255, 255, 255, 0.5)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  marginBottom: 20,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }}
              >
                ← Back
              </div>

              {/* Story Levels */}
              {GAME_MODES.STORY.levels.map(levelKey => {
                const level = LEVELS[levelKey];
                return (
                  <div
                    key={levelKey}
                    onClick={() => handleStartGame(levelKey)}
                    style={{
                      cursor: "pointer",
                      fontSize: `${28 * uiScale}px`,
                      color: "rgba(255, 255, 255, 0.7)",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                      letterSpacing: "0.05em",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {level.name}
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              fontSize: `${12 * uiScale}px`,
              color: "rgba(255, 255, 255, 0.4)",
              textAlign: "center",
              maxWidth: "600px",
              position: "absolute",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              letterSpacing: "0.05em",
            }}
          >
            <p>WASD to move • Arrow Keys to rotate/tilt camera • SPACE to dash</p>
          </div>
        </div>
      )}

      {/* Story Intro Audio - Keep alive even after scene fades */}
      {storyMode && currentChapter?.intro?.audio && (
        <audio
          ref={introAudioRef}
          src={currentChapter.intro.audio}
          autoPlay
          style={{ display: 'none' }}
        />
      )}

      {/* Story Intro Scene */}
      {showingStoryIntro && currentChapter && (
        <StoryScene
          chapter={currentChapter}
          shouldFadeOut={storyFadeOut}
          onComplete={() => {
            setShowingStoryIntro(false);
          }}
        />
      )}

      {/* Game UI - only show when game started */}
      {gameStarted && (
        <>
          {/* Boss Health Bar - minimalist */}
          {uiState.hasBoss && (
            <div
              style={{
                position: "absolute",
                top: 40,
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgba(255, 255, 255, 0.9)",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                pointerEvents: "none",
                textAlign: "center",
                fontWeight: 200,
                letterSpacing: "0.2em",
              }}
            >
              <div style={{ marginBottom: 8, textTransform: "uppercase", opacity: 0.6 }}>
                Boss
              </div>
              <div
                style={{
                  width: 300,
                  height: 2,
                  background: "rgba(255, 255, 255, 0.1)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${(uiState.bossHealth / uiState.bossMaxHealth) * 100}%`,
                    height: "100%",
                    background: "rgba(255, 255, 255, 0.9)",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}

          {/* Player Health - minimalist */}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              pointerEvents: "none",
              fontFamily: "'Inter', sans-serif",
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
              Health
            </div>
            <div style={{ fontSize: 32, fontWeight: 200, letterSpacing: "0.05em" }}>
              {uiState.health}
            </div>
            <div
              style={{
                marginTop: 8,
                width: 100,
                height: 2,
                background: "rgba(255, 255, 255, 0.1)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${(uiState.health / uiState.maxHealth) * 100}%`,
                  height: "100%",
                  background: "rgba(255, 255, 255, 0.9)",
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>

          {/* XP Bar - rainbow centered */}
          <div
            style={{
              position: "absolute",
              bottom: isMobile ? 100 : 40,
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              fontFamily: "'Inter', sans-serif",
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
              Level {uiState.level}
            </div>
            <div
              style={{
                width: isMobile ? "50vw" : "33vw",
                height: 4,
                background: "rgba(50, 50, 50, 0.5)",
                position: "relative",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <div
                style={{
                  width: `${Math.max(uiState.xpProgress * 100, 2)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)",
                  transition: "width 0.3s",
                  borderRadius: 2,
                  boxShadow: "0 0 15px rgba(255, 100, 255, 0.5)",
                }}
              />
            </div>
          </div>

          {/* Enemy Direction Indicator */}
          {uiState.nearestEnemyDirection !== null && typeof uiState.nearestEnemyDirection === 'object' ? (
            (() => {
              // nearestEnemyDirection now contains both arrow position and enemy screen position
              const targetArrowPos = uiState.nearestEnemyDirection.arrowPosition;
              const enemyScreenPos = uiState.nearestEnemyDirection.enemyScreenPos;

              // Safety checks
              if (!targetArrowPos || !enemyScreenPos) return null;
              if (targetArrowPos.x === undefined || targetArrowPos.y === undefined) return null;
              if (enemyScreenPos.x === undefined || enemyScreenPos.y === undefined) return null;

              // Use the smoothly interpolated arrow position
              const x = arrowPosition.x || targetArrowPos.x;
              const y = arrowPosition.y || targetArrowPos.y;

              // Use the smoothly interpolated rotation
              const rotation = arrowRotation;

              return (
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: `translate(-50%, -50%)`,
                    pointerEvents: "none",
                    zIndex: 500,
                  }}
                >
                  {/* Triangle arrow container with directional bounce */}
                  <div
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: "none", // No CSS transition needed, we're using JS animation
                      animation: "arrowBounce 0.8s ease-out infinite",
                    }}
                  >
                    {/* Sharp triangle arrow */}
                    <svg width="50" height="50" viewBox="0 0 50 50">
                      <defs>
                        <filter id="arrowGlow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Sharp triangle - white with black border */}
                      <path
                        d="M 25 8
                           L 38 38
                           L 12 38
                           Z"
                        fill="#ffffff"
                        fillOpacity="1"
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        filter="url(#arrowGlow)"
                      />
                      {/* Inner highlight - light gray for depth */}
                      <path
                        d="M 25 14
                           L 33 32
                           L 17 32
                           Z"
                        fill="#f0f0f0"
                        fillOpacity="0.7"
                      />
                    </svg>
                  </div>

                  <style>
                    {`
                      @keyframes arrowBounce {
                        0%, 100% {
                          transform: rotate(${rotation}deg) translateY(0);
                        }
                        50% {
                          transform: rotate(${rotation}deg) translateY(-12px);
                        }
                      }
                    `}
                  </style>
                </div>
              );
            })()
          ) : null}

          {/* Wave and Enemy Count - Upper Right - minimalist */}
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              fontFamily: "'Inter', sans-serif",
              color: "rgba(255, 255, 255, 0.9)",
              pointerEvents: "none",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
              {uiState.totalWaves > 0 ? (
                <>
                  {uiState.allWavesCompleted ? (
                    uiState.bossSpawned ? "Boss Battle" : "Complete"
                  ) : (
                    `Wave ${uiState.currentWave}/${uiState.totalWaves === Infinity ? '∞' : uiState.totalWaves}`
                  )}
                </>
              ) : (
                `Wave ${Math.floor(uiState.time / 60) + 1}`
              )}
            </div>
            {uiState.totalWaves > 0 && !uiState.allWavesCompleted && (
              <div style={{ fontSize: 32, fontWeight: 200, letterSpacing: "0.05em", marginBottom: 12 }}>
                {uiState.enemiesRemaining}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 200, opacity: 0.6 }}>
              {Math.floor(uiState.time / 60)}:{(uiState.time % 60).toString().padStart(2, "0")}
            </div>
          </div>

          {/* Performance Stats - Toggle in Dev Menu */}
          {uiState.showStats && uiState.stats && (
            <div
              style={{
                position: "absolute",
                top: 140,
                left: 40,
                fontFamily: "'Inter', sans-serif",
                color: "rgba(255, 255, 255, 0.9)",
                pointerEvents: "none",
                background: "rgba(0, 0, 0, 0.3)",
                padding: 16,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.5, marginBottom: 12 }}>
                Stats
              </div>

              {/* DPS Metrics */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6, marginBottom: 4 }}>
                  Current DPS
                </div>
                <div style={{ fontSize: 18, fontWeight: 200, letterSpacing: "0.05em" }}>
                  {uiState.stats.currentDPS}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6, marginBottom: 4 }}>
                  Avg DPS (5s)
                </div>
                <div style={{ fontSize: 18, fontWeight: 200, letterSpacing: "0.05em" }}>
                  {uiState.stats.rollingAverageDPS}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6, marginBottom: 4 }}>
                  Total Damage
                </div>
                <div style={{ fontSize: 14, fontWeight: 200, letterSpacing: "0.05em" }}>
                  {uiState.stats.totalDamageDealt.toLocaleString()}
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: "100%", height: 1, background: "rgba(255, 255, 255, 0.1)", marginBottom: 12 }} />

              {/* Performance Metrics */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6, marginBottom: 4 }}>
                  FPS
                </div>
                <div style={{ fontSize: 18, fontWeight: 200, letterSpacing: "0.05em" }}>
                  {uiState.stats.fps}
                </div>
              </div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                  Entities: {uiState.stats.entityCount}
                </div>
              </div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                  Projectiles: {uiState.stats.projectileCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                  Enemies: {uiState.stats.enemyCount}
                </div>
              </div>

              {/* Memory Stats (Chrome/Edge only) */}
              {uiState.stats.memory && (
                <>
                  {/* Divider */}
                  <div style={{ width: "100%", height: 1, background: "rgba(255, 255, 255, 0.1)", marginTop: 12, marginBottom: 12 }} />

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6, marginBottom: 4 }}>
                      Heap Usage
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 200, letterSpacing: "0.05em", minWidth: 180 }}>
                      {uiState.stats.memory.usedJSHeapSize}MB / {uiState.stats.memory.jsHeapSizeLimit}MB ({uiState.stats.memory.heapUsagePercent}%)
                    </div>
                  </div>
                </>
              )}

              {/* THREE.js Stats */}
              {uiState.stats.three && (
                <>
                  {/* Divider */}
                  <div style={{ width: "100%", height: 1, background: "rgba(255, 255, 255, 0.1)", marginTop: 12, marginBottom: 12 }} />

                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                      Geometries: {uiState.stats.three.geometries}
                    </div>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                      Textures: {uiState.stats.three.textures}
                    </div>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                      Draw Calls: {uiState.stats.three.drawCalls}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 200, opacity: 0.6 }}>
                      Triangles: {uiState.stats.three.triangles.toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Wave Notification - minimalist */}
          {waveNotification && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "rgba(255, 255, 255, 0.95)",
                fontFamily: "'Inter', sans-serif",
                fontSize: 72,
                fontWeight: 200,
                letterSpacing: "0.1em",
                zIndex: 5000,
                pointerEvents: "none",
                animation: "fadeInOut 2.5s ease-in-out",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {waveNotification}
            </div>
          )}

          <style>
            {`
              @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                20% { transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
              }
            `}
          </style>

          {/* Ring Burst Button */}
          {getRingSpells().length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: isMobile ? 160 : isTablet ? 40 : 30,
                // Move to left side on iPad or landscape mobile to avoid steering controls
                ...(isTablet || (isMobile && isLandscape) ? {
                  left: isMobile ? 20 : isTablet ? 30 : 30,
                } : {
                  right: isMobile ? 20 : 30,
                }),
                pointerEvents: "auto",
              }}
            >
              <button
                onClick={triggerRingBurst}
                disabled={!isAnyRingFull()}
                style={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  borderRadius: "50%",
                  background: isAnyRingFull()
                    ? getRingSpells().length === 2
                      ? "radial-gradient(circle, #ff8800 0%, #88ddff 50%, #ff4400 100%)" // Mixed fire + ice
                      : getRingSpells()[0].spellKey === 'RING_OF_FIRE'
                        ? "radial-gradient(circle, #ff8800, #ff4400)" // Fire only
                        : "radial-gradient(circle, #88ddff, #4499ff)" // Ice only
                    : "#333",
                  border: isAnyRingFull() ? "4px solid #ffd700" : "3px solid #666",
                  cursor: isAnyRingFull() ? "pointer" : "not-allowed",
                  fontSize: `${isMobile ? 24 : 32}px`,
                  fontFamily: "Georgia, serif",
                  color: isAnyRingFull() ? "#fff" : "#666",
                  textShadow: isAnyRingFull() ? "2px 2px 4px rgba(0,0,0,0.8)" : "none",
                  boxShadow: isAnyRingFull()
                    ? "0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)"
                    : "none",
                  transition: "all 0.3s",
                  opacity: isAnyRingFull() ? 1 : 0.5,
                  animation: isAnyRingFull() ? "pulse 1.5s infinite" : "none",
                }}
                onMouseEnter={(e) => {
                  if (isAnyRingFull()) {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                💥
              </button>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  color: "#fff",
                  fontSize: `${isMobile ? 10 : 12}px`,
                  fontFamily: "Georgia, serif",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  pointerEvents: "none",
                }}
              >
                [R] Burst {getRingSpells().length === 2 ? "(Both)" : ""}
              </div>
            </div>
          )}

          <style>
            {`
              @keyframes pulse {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3);
                }
                50% {
                  box-shadow: 0 0 40px rgba(255, 215, 0, 1), inset 0 0 20px rgba(255, 255, 255, 0.5);
                }
              }
            `}
          </style>

          {/* Level Up Screen - minimalist */}
          {uiState.levelingUp && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                color: "rgba(255, 255, 255, 0.9)",
                zIndex: 9999,
              }}
            >
              {/* Decorative corner patterns */}
              <div style={{ position: "absolute", top: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", top: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", bottom: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderTop: "none" }} />
              <div style={{ position: "absolute", bottom: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderTop: "none" }} />

              <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6, marginBottom: isMobile ? 30 : 60 }}>
                Level {uiState.level}
              </div>

              <div style={{
                display: "flex",
                gap: isMobile ? 20 : 60,
                alignItems: "stretch",
                flexDirection: isMobile ? "column" : "row",
                maxHeight: isMobile ? "60vh" : "auto",
                overflowY: isMobile ? "auto" : "visible",
                padding: isMobile ? "0 20px" : 0,
              }}>
                {uiState.upgradeChoices.map((upgrade, i) => (
                  <button
                    key={i}
                    onClick={() => handleUpgradeSelect(upgrade)}
                    style={{
                      width: isMobile ? "100%" : 280,
                      minHeight: isMobile ? "auto" : "auto",
                      padding: 0,
                      background: "transparent",
                      border: selectedUpgradeIndex === i ? "1px solid rgba(255, 255, 255, 0.6)" : "1px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      fontFamily: "'Inter', sans-serif",
                      color: "rgba(255, 255, 255, 0.9)",
                      opacity: selectedUpgradeIndex === i ? 1 : 0.6,
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile && selectedUpgradeIndex !== i) {
                        e.currentTarget.style.opacity = "0.6";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }
                    }}
                    onTouchStart={(e) => {
                      if (isMobile) {
                        // Update selected index on touch
                        setSelectedUpgradeIndex(i);
                      }
                    }}
                  >
                    <div style={{ padding: isMobile ? "20px" : 40, textAlign: "center" }}>
                      <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 300, letterSpacing: "0.1em", marginBottom: isMobile ? 12 : 20 }}>
                        {upgrade.name}
                      </div>
                      <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 200, opacity: 0.7, lineHeight: 1.6 }}>
                        {upgrade.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mobile hint */}
              {isMobile && (
                <div style={{
                  marginTop: 20,
                  fontSize: 11,
                  opacity: 0.5,
                  fontWeight: 200,
                  textAlign: "center"
                }}>
                  Tap to select • Scroll for more options
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Button - Icon Only */}
          <button
            onClick={toggleFullscreen}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 32,
              height: 32,
              padding: 0,
              background: "rgba(0, 0, 0, 0.2)",
              color: "rgba(255, 255, 255, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            }}
            title="Toggle Fullscreen"
          >
            ⛶
          </button>

          {/* Dev Menu - Toggle with ~ key */}
          {showDevMenu && (
            <>
              {/* God Mode Button */}
              <button
                onClick={() => {
                  if (gameRef.current && gameRef.current.player) {
                    gameRef.current.godMode = !gameRef.current.godMode;
                    const btn = document.getElementById('god-mode-btn');
                    if (btn) {
                      btn.textContent = gameRef.current.godMode ? 'God Mode: ON' : 'God Mode: OFF';
                      btn.style.borderColor = gameRef.current.godMode ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                    }
                  }
                }}
                id="god-mode-btn"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 140,
                  padding: "8px 16px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 200,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  zIndex: 1000,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.godMode ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.godMode ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                God Mode: OFF
              </button>

              {/* Pause Button */}
              <button
                onClick={() => {
                  if (gameRef.current) {
                    const isPaused = gameRef.current.togglePause();
                    const btn = document.getElementById('pause-btn');
                    if (btn) {
                      btn.textContent = isPaused ? 'PAUSED' : 'PAUSE';
                      btn.style.borderColor = isPaused ? 'rgba(255, 200, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                    }
                  }
                }}
                id="pause-btn"
                style={{
                  position: "absolute",
                  bottom: 60,
                  left: 140,
                  padding: "8px 16px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(255, 200, 0, 0.5)",  // Yellow border since it starts paused
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 200,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  zIndex: 1000,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.isPaused ? "rgba(255, 200, 0, 0.7)" : "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.isPaused ? "rgba(255, 200, 0, 0.5)" : "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                PAUSED
              </button>

              {/* Stats Toggle Button */}
              <button
                onClick={() => {
                  if (gameRef.current) {
                    gameRef.current.showStats = !gameRef.current.showStats;
                    const btn = document.getElementById('stats-btn');
                    if (btn) {
                      btn.textContent = gameRef.current.showStats ? 'Stats: ON' : 'Stats: OFF';
                      btn.style.borderColor = gameRef.current.showStats ? 'rgba(0, 200, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                    }
                  }
                }}
                id="stats-btn"
                style={{
                  position: "absolute",
                  bottom: 100,
                  left: 140,
                  padding: "8px 16px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 200,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  zIndex: 1000,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.showStats ? "rgba(0, 200, 255, 0.7)" : "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = gameRef.current?.showStats ? "rgba(0, 200, 255, 0.5)" : "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                Stats: OFF
              </button>

              {/* Spell Toggle Panel */}
              <button
                onClick={() => setShowWeaponPanel(!showWeaponPanel)}
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  padding: "8px 16px",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 200,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  zIndex: 1000,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                {showWeaponPanel ? "Hide" : "Spells"}
              </button>

              {/* Ground Selector - Dev Menu */}
              {gameRef.current?.levelConfig?.isSurvival && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 300,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    zIndex: 1000,
                  }}
                >
                  <label
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      fontWeight: 200,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Ground:
                  </label>
                  <select
                    value={selectedGround}
                    onChange={(e) => handleGroundChange(e.target.value)}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      fontWeight: 200,
                      outline: "none",
                      transition: "all 0.3s",
                    }}
                  >
                    <optgroup label="Dreamy">
                      <option value="pink-clouds">Pink Clouds</option>
                      <option value="rainbow">Rainbow</option>
                      <option value="psychedelic">Psychedelic</option>
                      <option value="aurora">Aurora Borealis</option>
                      <option value="nebula">Nebula</option>
                    </optgroup>
                    <optgroup label="Reflective">
                      <option value="mirror">Mirror</option>
                      <option value="glass">Glass</option>
                      <option value="ice">Ice</option>
                      <option value="water">Water</option>
                      <option value="crystal">Crystal Cave</option>
                      <option value="chrome">Chrome</option>
                    </optgroup>
                    <optgroup label="Animated">
                      <option value="lava">Lava</option>
                      <option value="lava-mirror">Lava Mirror</option>
                      <option value="neon">Neon Grid</option>
                      <option value="void">Void</option>
                      <option value="matrix">Matrix</option>
                      <option value="portal">Portal Swirl</option>
                      <option value="plasma">Plasma Field</option>
                    </optgroup>
                    <optgroup label="Nature">
                      <option value="realistic-grass">Realistic Grass (3D)</option>
                      <option value="grass">Grass</option>
                      <option value="desert">Desert</option>
                      <option value="ocean">Ocean Waves</option>
                      <option value="forest">Forest Floor</option>
                      <option value="snow">Snow</option>
                    </optgroup>
                    <optgroup label="Tech">
                      <option value="circuit">Circuit Board</option>
                      <option value="hologram">Hologram Grid</option>
                      <option value="datastream">Data Stream</option>
                    </optgroup>
                    <optgroup label="Simple">
                      <option value="bright">Bright</option>
                      <option value="dark">Dark</option>
                      <option value="checkerboard">Checkerboard</option>
                    </optgroup>
                  </select>
                </div>
              )}
            </>
          )}

          {showDevMenu && showWeaponPanel && (
            <div
              style={{
                position: "absolute",
                bottom: 70,
                right: 20,
                background: "rgba(0, 0, 0, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: 20,
                maxHeight: "70vh",
                overflowY: "auto",
                fontFamily: "'Inter', sans-serif",
                color: "rgba(255, 255, 255, 0.9)",
                minWidth: 280,
                zIndex: 999,
              }}
            >
              <h3
                style={{ margin: "0 0 16px 0", color: "rgba(255, 255, 255, 0.9)", fontSize: 14, fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase" }}
              >
                Test Spells
              </h3>
              <button
                onClick={() => {
                  // Add all spells using spell registry
                  if (gameRef.current && gameRef.current.player) {
                    const allSpellKeys = spellRegistry.getAvailableSpells();
                    allSpellKeys.forEach((spellKey) => {
                      const hasSpell = gameRef.current.player.weapons.some(
                        (w) => w.spellKey === spellKey
                      );
                      if (!hasSpell) {
                        gameRef.current.player.weapons.push({
                          spellKey: spellKey,
                          level: 1,
                          lastShot: 0,
                        });
                      }
                    });
                  }
                }}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 200,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                  width: "100%",
                  transition: "all 0.3s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
              >
                Turn On All Spells
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {spellRegistry.getAvailableSpells().map((spellKey) => {
                  const spell = spellRegistry.createSpell(spellKey, 1);
                  if (!spell) return null;

                  const active = hasWeapon(spellKey);
                  const level = getWeaponLevel(spellKey);
                  const canUpgrade = level < 7;

                  return (
                    <div
                      key={spellKey}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "stretch",
                      }}
                    >
                      <button
                        onClick={() => toggleWeapon(spellKey)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          background: active
                            ? "rgba(255, 255, 255, 0.05)"
                            : "transparent",
                          color: "rgba(255, 255, 255, 0.9)",
                          border: active
                            ? "1px solid rgba(255, 255, 255, 0.4)"
                            : "1px solid rgba(255, 255, 255, 0.15)",
                          cursor: "pointer",
                          fontSize: 12,
                          textAlign: "left",
                          transition: "all 0.3s",
                          fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = active ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.15)";
                        }}
                      >
                        <div style={{ fontWeight: 300, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>
                            {active ? "✓ " : ""}
                            {spell.name}
                          </span>
                          {active && <span style={{ fontSize: 10, background: "rgba(255, 255, 255, 0.1)", padding: "2px 8px", fontWeight: 200, opacity: 0.7 }}>Lv.{level}</span>}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 200, lineHeight: 1.4 }}>
                          {spell.desc}
                        </div>
                      </button>
                      {active && canUpgrade && (
                        <button
                          onClick={(e) => handleSpellUpgrade(spellKey, e)}
                          style={{
                            padding: "10px 12px",
                            background: "transparent",
                            color: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 200,
                            letterSpacing: "0.1em",
                            whiteSpace: "nowrap",
                            transition: "all 0.3s",
                            fontFamily: "'Inter', sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                          }}
                        >
                          UP
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Game Over Screen - minimalist */}
          {uiState.gameOver && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                color: "rgba(255, 255, 255, 0.9)",
                zIndex: 2000,
              }}
            >
              {/* Decorative corner patterns */}
              <div style={{ position: "absolute", top: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", top: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", bottom: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderTop: "none" }} />
              <div style={{ position: "absolute", bottom: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderTop: "none" }} />

              <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.4, marginBottom: 40 }}>
                Game Over
              </div>

              <div style={{ textAlign: "center", marginBottom: 60 }}>
                <div style={{ fontSize: 14, fontWeight: 200, opacity: 0.6, marginBottom: 12, letterSpacing: "0.15em" }}>
                  Wave {uiState.wave}
                </div>
                <div style={{ fontSize: 48, fontWeight: 200, marginBottom: 12 }}>
                  {uiState.kills}
                </div>
                <div style={{ fontSize: 12, fontWeight: 200, opacity: 0.6, letterSpacing: "0.15em" }}>
                  Kills
                </div>
              </div>

              <button
                onClick={handleRestart}
                style={{
                  padding: "16px 48px",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 200,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Victory Screen - minimalist */}
          {uiState.victory && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                color: "rgba(255, 255, 255, 0.9)",
                zIndex: 2000,
              }}
            >
              {/* Decorative corner patterns */}
              <div style={{ position: "absolute", top: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", top: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderBottom: "none" }} />
              <div style={{ position: "absolute", bottom: 40, left: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderRight: "none", borderTop: "none" }} />
              <div style={{ position: "absolute", bottom: 40, right: 40, width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.2)", borderLeft: "none", borderTop: "none" }} />

              <div style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6, marginBottom: 40 }}>
                {storyMode && currentChapter && !getNextChapter(currentChapter.id) ? "Story Complete" : "Victory"}
              </div>

              <div style={{ textAlign: "center", marginBottom: 60 }}>
                <div style={{ fontSize: 14, fontWeight: 200, opacity: 0.6, marginBottom: 12, letterSpacing: "0.15em" }}>
                  {Math.floor(uiState.time / 60)}:{(uiState.time % 60).toString().padStart(2, "0")}
                </div>
                <div style={{ fontSize: 48, fontWeight: 200, marginBottom: 12 }}>
                  {uiState.kills}
                </div>
                <div style={{ fontSize: 12, fontWeight: 200, opacity: 0.6, letterSpacing: "0.15em" }}>
                  Kills
                </div>
              </div>

              <div style={{ display: "flex", gap: 40 }}>
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setSelectedLevel(null);
                    setStoryMode(false);
                    setCurrentChapter(null);
                    setShowingStoryIntro(false);
                    setStoryFadeOut(false);
                    setGameLoadedBehindScene(false);
                  }}
                  style={{
                    padding: "16px 48px",
                    background: "transparent",
                    color: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    fontWeight: 200,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }}
                >
                  Main Menu
                </button>
                <button
                  onClick={handleRestart}
                  style={{
                    padding: "16px 48px",
                    background: "transparent",
                    color: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    fontWeight: 200,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DustAndDynamite;
