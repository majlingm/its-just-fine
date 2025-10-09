// Performance Monitoring Script for Dust & Dynamite
// Run this in the browser console to monitor performance

(function() {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;
  let minFps = 999;
  let maxFps = 0;
  let gcCount = 0;
  let lastGCCheck = performance.memory ? performance.memory.usedJSHeapSize : 0;

  // Create performance display
  const display = document.createElement('div');
  display.style.position = 'fixed';
  display.style.top = '10px';
  display.style.right = '10px';
  display.style.padding = '10px';
  display.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  display.style.color = '#00ff00';
  display.style.fontFamily = 'monospace';
  display.style.fontSize = '12px';
  display.style.zIndex = '10000';
  display.style.borderRadius = '5px';
  display.style.minWidth = '250px';
  document.body.appendChild(display);

  // Monitor texture count
  let textureCount = 0;
  let materialCount = 0;
  let geometryCount = 0;

  function countResources() {
    if (window.game && window.game.engine) {
      const renderer = window.game.engine.renderer;
      if (renderer && renderer.info) {
        textureCount = renderer.info.memory.textures;
        materialCount = Object.keys(renderer.info.programs).length;
        geometryCount = renderer.info.memory.geometries;
      }
    }
  }

  function update() {
    frames++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
      fps = Math.round(frames * 1000 / delta);
      minFps = Math.min(minFps, fps);
      maxFps = Math.max(maxFps, fps);
      frames = 0;
      lastTime = currentTime;

      // Check for GC (significant heap drop)
      if (performance.memory) {
        const currentHeap = performance.memory.usedJSHeapSize;
        if (currentHeap < lastGCCheck * 0.8) {
          gcCount++;
        }
        lastGCCheck = currentHeap;
      }

      countResources();
    }

    // Get pool stats if available
    let poolStats = '';
    if (window.game && window.game.projectilePool) {
      const stats = window.game.projectilePool.getStats();
      poolStats = `Projectile Pool: ${stats.activeCount}/${stats.totalCreated}\\n`;
    }
    if (window.game && window.game.enemyProjectilePool) {
      const stats = window.game.enemyProjectilePool.getStats();
      poolStats += `Enemy Pool: ${stats.activeCount}/${stats.totalCreated}\\n`;
    }

    // Get cache stats if available
    let cacheStats = '';
    if (window.resourceCache) {
      const stats = window.resourceCache.getStats();
      cacheStats = `Cache: T:${stats.textures} M:${stats.materials} G:${stats.geometries}\\n`;
    }

    // Memory info
    let memInfo = '';
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(1);
      memInfo = `Memory: ${usedMB}MB / ${limitMB}MB\\n`;
      memInfo += `GC Count: ${gcCount}\\n`;
    }

    display.innerHTML = `
<strong>🎮 Performance Monitor</strong><br>
FPS: ${fps} (${minFps}-${maxFps})<br>
${memInfo}
${poolStats}
${cacheStats}
Textures: ${textureCount}<br>
Materials: ${materialCount}<br>
Geometries: ${geometryCount}<br>
<br>
<small>Press ESC to close</small>
    `;

    requestAnimationFrame(update);
  }

  // Start monitoring
  update();

  // Close on ESC
  document.addEventListener('keydown', function closeMonitor(e) {
    if (e.key === 'Escape') {
      display.remove();
      document.removeEventListener('keydown', closeMonitor);
    }
  });

  console.log('✅ Performance monitor started. Press ESC to close.');
})();