import * as THREE from 'three';

export function createPlayerSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Cowboy hat - brown with detail
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(40, 12, 48, 8); // Brim
  ctx.fillRect(48, 8, 32, 4); // Brim extension
  ctx.fillStyle = '#654321';
  ctx.fillRect(52, 20, 24, 12); // Hat crown
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(54, 22, 20, 3); // Hat shadow
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(56, 24, 16, 4); // Hat band
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(60, 26, 2, 2); // Hat ornament

  // Face - skin tone with detail
  ctx.fillStyle = '#ffdbac';
  ctx.fillRect(52, 32, 24, 20); // Face

  // Hair edges
  ctx.fillStyle = '#654321';
  ctx.fillRect(50, 34, 4, 6); // Left sideburn
  ctx.fillRect(74, 34, 4, 6); // Right sideburn

  // Eyes with whites
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(56, 36, 6, 4); // Left eye white
  ctx.fillRect(66, 36, 6, 4); // Right eye white
  ctx.fillStyle = '#4a90e2';
  ctx.fillRect(58, 37, 3, 3); // Left iris
  ctx.fillRect(68, 37, 3, 3); // Right iris
  ctx.fillStyle = '#000000';
  ctx.fillRect(59, 37, 2, 2); // Left pupil
  ctx.fillRect(69, 37, 2, 2); // Right pupil

  // Nose
  ctx.fillStyle = '#e6c4a0';
  ctx.fillRect(62, 42, 4, 4);

  // Bandana/neckerchief - red with pattern
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(52, 48, 24, 8); // Bandana
  ctx.fillStyle = '#990000';
  ctx.fillRect(56, 50, 4, 4); // Bandana pattern
  ctx.fillRect(68, 50, 4, 4);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(54, 48, 2, 2); // Highlight
  ctx.fillRect(72, 48, 2, 2);

  // Shirt - blue with detail
  ctx.fillStyle = '#2a5f8f';
  ctx.fillRect(44, 56, 40, 32); // Torso
  ctx.fillStyle = '#1a4f7f';
  ctx.fillRect(48, 60, 4, 24); // Shirt detail left
  ctx.fillRect(76, 60, 4, 24); // Shirt detail right
  ctx.fillStyle = '#3a6f9f';
  ctx.fillRect(60, 58, 8, 4); // Collar

  // Vest - brown leather with buttons
  ctx.fillStyle = '#654321';
  ctx.fillRect(48, 56, 32, 28); // Vest body
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(50, 58, 28, 2); // Vest shadow
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(52, 60, 4, 4); // Button top
  ctx.fillRect(72, 60, 4, 4);
  ctx.fillRect(52, 72, 4, 4); // Button bottom
  ctx.fillRect(72, 72, 4, 4);
  ctx.fillStyle = '#a0826d';
  ctx.fillRect(53, 61, 2, 2); // Button shine
  ctx.fillRect(73, 61, 2, 2);

  // Arms
  ctx.fillStyle = '#2a5f8f';
  ctx.fillRect(32, 60, 12, 24); // Left arm
  ctx.fillRect(84, 60, 12, 24); // Right arm
  ctx.fillStyle = '#1a4f7f';
  ctx.fillRect(34, 62, 2, 20); // Arm shadow

  // Gun holster - detailed
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(80, 72, 12, 16); // Holster right side
  ctx.fillStyle = '#654321';
  ctx.fillRect(82, 74, 8, 12); // Holster body
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(84, 76, 4, 2); // Gun handle
  ctx.fillStyle = '#8b8b8b';
  ctx.fillRect(85, 78, 2, 6); // Gun barrel

  // Hands - skin with detail
  ctx.fillStyle = '#ffdbac';
  ctx.fillRect(32, 80, 8, 8); // Left hand
  ctx.fillRect(88, 80, 8, 8); // Right hand
  ctx.fillStyle = '#e6c4a0';
  ctx.fillRect(34, 82, 4, 4); // Hand shading

  // Pants - dark blue with detail
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(44, 88, 40, 20); // Pants
  ctx.fillStyle = '#0a2a4a';
  ctx.fillRect(46, 90, 2, 16); // Left seam
  ctx.fillRect(80, 90, 2, 16); // Right seam

  // Belt with buckle
  ctx.fillStyle = '#654321';
  ctx.fillRect(44, 88, 40, 6); // Belt
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(46, 89, 36, 4); // Belt highlight
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(60, 88, 8, 6); // Belt buckle
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(61, 89, 6, 4); // Buckle detail

  // Boots - dark brown with detail
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(48, 108, 12, 16); // Left boot
  ctx.fillRect(68, 108, 12, 16); // Right boot
  ctx.fillStyle = '#654321';
  ctx.fillRect(48, 112, 12, 4); // Boot detail left
  ctx.fillRect(68, 112, 12, 4); // Boot detail right
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(50, 110, 8, 2); // Boot top
  ctx.fillRect(70, 110, 8, 2);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(52, 116, 4, 2); // Spur left
  ctx.fillRect(72, 116, 4, 2); // Spur right

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createEnemySprite(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (type === 'bandit') {
    // Black hat - scaled 2x
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(44, 16, 40, 8); // Brim
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(52, 24, 24, 12); // Crown

    // Face - darker skin
    ctx.fillStyle = '#c9a570';
    ctx.fillRect(52, 36, 24, 16);

    // Eyes - menacing
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(56, 40, 4, 4);
    ctx.fillRect(68, 40, 4, 4);

    // Bandana mask - red
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(52, 48, 24, 12);
    ctx.fillStyle = '#990000';
    ctx.fillRect(56, 52, 4, 4);
    ctx.fillRect(68, 52, 4, 4);

    // Dark vest
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(44, 60, 40, 32);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(48, 64, 32, 24);

    // Arms
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(32, 64, 12, 24);
    ctx.fillRect(84, 64, 12, 24);

    // Pants - worn brown
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(44, 92, 40, 20);

    // Boots
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(48, 112, 12, 16);
    ctx.fillRect(68, 112, 12, 16);
  } else if (type === 'coyote') {
    // Coyote ears - scaled 2x
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(48, 44, 8, 12); // Left ear
    ctx.fillRect(72, 44, 8, 12); // Right ear
    ctx.fillStyle = '#ffa07a';
    ctx.fillRect(50, 48, 4, 6); // Inner ear
    ctx.fillRect(74, 48, 4, 6);

    // Head
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(52, 56, 24, 16);

    // Snout
    ctx.fillStyle = '#c08050';
    ctx.fillRect(56, 64, 16, 12);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(60, 68, 8, 4); // Nose

    // Eyes - yellow/red
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(56, 60, 4, 4);
    ctx.fillRect(68, 60, 4, 4);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(58, 60, 2, 2); // Pupil
    ctx.fillRect(70, 60, 2, 2);

    // Body
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(44, 76, 40, 24);

    // Legs
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(48, 100, 8, 16);
    ctx.fillRect(72, 100, 8, 16);

    // Tail
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(80, 80, 12, 8);
    ctx.fillRect(88, 84, 8, 4);
  } else if (type === 'brute') {
    // Large head - bald - scaled 2x
    ctx.fillStyle = '#c9a570';
    ctx.fillRect(40, 28, 48, 24);

    // Angry eyes
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(48, 36, 8, 6);
    ctx.fillRect(72, 36, 8, 6);

    // Scar
    ctx.fillStyle = '#990000';
    ctx.fillRect(76, 32, 4, 16);

    // Bandana headband
    ctx.fillStyle = '#654321';
    ctx.fillRect(40, 28, 48, 6);

    // Massive torso
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(28, 52, 72, 48);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(36, 60, 56, 32); // Vest

    // Arms - huge
    ctx.fillStyle = '#c9a570';
    ctx.fillRect(20, 56, 16, 32);
    ctx.fillRect(92, 56, 16, 32);

    // Fists
    ctx.fillStyle = '#a07850';
    ctx.fillRect(20, 84, 16, 12);
    ctx.fillRect(92, 84, 16, 12);

    // Legs
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(40, 100, 20, 24);
    ctx.fillRect(68, 100, 20, 24);
  } else if (type === 'gunman') {
    // Hat - gray - scaled 2x
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(44, 16, 40, 8);
    ctx.fillRect(52, 24, 24, 12);

    // Face
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(52, 36, 24, 16);

    // Mustache
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(48, 48, 32, 6);

    // Eyes - focused
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(56, 40, 4, 4);
    ctx.fillRect(68, 40, 4, 4);

    // Coat - duster style
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(40, 52, 48, 48);
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(44, 56, 4, 40); // Coat edge
    ctx.fillRect(80, 56, 4, 40);

    // Gun belt - with holsters
    ctx.fillStyle = '#654321';
    ctx.fillRect(40, 80, 48, 6);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(36, 84, 12, 16); // Left holster
    ctx.fillRect(80, 84, 12, 16); // Right holster
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(38, 88, 4, 8); // Gun barrel

    // Legs
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(48, 100, 12, 24);
    ctx.fillRect(68, 100, 12, 24);

    // Boots
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(48, 112, 12, 12);
    ctx.fillRect(68, 112, 12, 12);
  } else if (type === 'charger') {
    // Bull skull helmet - scaled 2x
    ctx.fillStyle = '#e8d4b0';
    ctx.fillRect(44, 32, 40, 20);

    // Horns - white/yellow
    ctx.fillStyle = '#fffacd';
    ctx.fillRect(36, 36, 12, 8); // Left horn
    ctx.fillRect(80, 36, 12, 8); // Right horn
    ctx.fillRect(32, 32, 8, 8); // Horn tip left
    ctx.fillRect(88, 32, 8, 8); // Horn tip right

    // Eye sockets - dark
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(52, 40, 6, 6);
    ctx.fillRect(70, 40, 6, 6);

    // Glowing red eyes inside
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(54, 42, 2, 2);
    ctx.fillRect(72, 42, 2, 2);

    // Body - tribal outfit
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(40, 52, 48, 36);
    ctx.fillStyle = '#654321';
    ctx.fillRect(44, 56, 40, 4); // Chest strap
    ctx.fillRect(44, 72, 40, 4);

    // War paint/patterns
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(48, 60, 4, 8);
    ctx.fillRect(76, 60, 4, 8);

    // Muscular arms
    ctx.fillStyle = '#c9a570';
    ctx.fillRect(28, 56, 12, 28);
    ctx.fillRect(88, 56, 12, 28);

    // Legs - powerful
    ctx.fillStyle = '#654321';
    ctx.fillRect(44, 88, 16, 24);
    ctx.fillRect(68, 88, 16, 24);

    // Hooves
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(44, 108, 16, 12);
    ctx.fillRect(68, 108, 16, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createEliteGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(40, 40, 10, 40, 40, 40);
  gradient.addColorStop(0, 'rgba(255, 170, 0, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 80, 80);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createProjectileSprite(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');

  // Outer glow
  const outerGlow = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
  outerGlow.addColorStop(0, color);
  outerGlow.addColorStop(0.4, color);
  outerGlow.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
  outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = outerGlow;
  ctx.fillRect(0, 0, 24, 24);

  // Core - bright center
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(11, 11, 2, 2);

  // Inner glow
  const innerGlow = ctx.createRadialGradient(12, 12, 1, 12, 12, 5);
  innerGlow.addColorStop(0, '#ffffff');
  innerGlow.addColorStop(0.5, color);
  innerGlow.addColorStop(1, 'rgba(255, 200, 0, 0.5)');
  ctx.fillStyle = innerGlow;
  ctx.fillRect(7, 7, 10, 10);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createPickupSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Outer glow - pulsing effect
  const outerGlow = ctx.createRadialGradient(16, 16, 4, 16, 16, 16);
  outerGlow.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
  outerGlow.addColorStop(0.5, 'rgba(0, 255, 136, 0.4)');
  outerGlow.addColorStop(1, 'rgba(0, 255, 136, 0)');
  ctx.fillStyle = outerGlow;
  ctx.fillRect(0, 0, 32, 32);

  // XP gem shape - hexagon
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.lineTo(24, 10);
  ctx.lineTo(24, 18);
  ctx.lineTo(16, 22);
  ctx.lineTo(8, 18);
  ctx.lineTo(8, 10);
  ctx.closePath();
  ctx.fill();

  // Darker facets for depth
  ctx.fillStyle = '#00cc66';
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.lineTo(24, 10);
  ctx.lineTo(16, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#008844';
  ctx.beginPath();
  ctx.moveTo(16, 14);
  ctx.lineTo(24, 18);
  ctx.lineTo(16, 22);
  ctx.closePath();
  ctx.fill();

  // Highlight shine
  ctx.fillStyle = '#88ffcc';
  ctx.fillRect(14, 8, 4, 2);
  ctx.fillRect(16, 10, 2, 2);

  // Inner sparkle
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(15, 12, 2, 2);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
