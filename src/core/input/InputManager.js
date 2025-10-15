/**
 * InputManager - Modern pointer/touch input handling
 *
 * Uses Pointer Events API for unified mouse/touch/pen input
 * Battle-tested for Three.js games
 *
 * Responsibilities:
 * - Keyboard input tracking
 * - Pointer input (mouse + multi-touch unified via Pointer Events)
 * - Input state caching (processed in game loop)
 * - Canvas-normalized coordinates
 *
 * NOT responsible for:
 * - Game-specific input interpretation (handled by Game layer)
 * - UI event handling (handled by UI layer)
 *
 * Best Practices Applied:
 * ✅ Uses Pointer Events (not legacy touch/mouse)
 * ✅ Sets canvas.style.touchAction = 'none' to prevent browser gestures
 * ✅ Uses { passive: false } for preventDefault() support
 * ✅ Normalizes coordinates to canvas size
 * ✅ Tracks pointers by pointerId (multi-touch)
 * ✅ Caches input deltas; heavy work done in game loop
 */
export class InputManager {
  constructor() {
    // Keyboard state
    this.keys = new Map();
    this.keysPressed = new Set();
    this.keysReleased = new Set();

    // Pointer state (unified mouse + touch)
    this.pointers = new Map(); // pointerId -> { x, y, startX, startY, button, type }
    this.primaryPointer = null; // First pointer for simple games
    this.pointerDeltas = new Map(); // pointerId -> { dx, dy } (for game loop)

    // Mouse wheel (still separate)
    this.mouseWheel = 0;

    // Swipe detection cache
    this.swipeStart = null;
    this.swipeEnd = null;

    // Event handlers
    this.handlers = {
      keyDown: null,
      keyUp: null,
      pointerDown: null,
      pointerMove: null,
      pointerUp: null,
      pointerCancel: null,
      wheel: null,
    };

    // Canvas reference for coordinate normalization
    this.canvas = null;
    this.canvasRect = null;

    // Enabled state
    this.enabled = false;
  }

  /**
   * Initialize input manager and attach event listeners
   * @param {HTMLCanvasElement} canvas - Canvas element to attach listeners to
   */
  init(canvas) {
    if (this.enabled) return;

    this.canvas = canvas;
    this.canvasRect = canvas.getBoundingClientRect();

    // CRITICAL: Prevent browser touch gestures (zoom, scroll, pan)
    canvas.style.touchAction = 'none';

    // Keyboard events
    this.handlers.keyDown = (e) => this.handleKeyDown(e);
    this.handlers.keyUp = (e) => this.handleKeyUp(e);

    // Pointer events (unified mouse + touch)
    this.handlers.pointerDown = (e) => this.handlePointerDown(e);
    this.handlers.pointerMove = (e) => this.handlePointerMove(e);
    this.handlers.pointerUp = (e) => this.handlePointerUp(e);
    this.handlers.pointerCancel = (e) => this.handlePointerCancel(e);

    // Mouse wheel (still separate)
    this.handlers.wheel = (e) => this.handleWheel(e);

    // Attach listeners
    // { passive: false } allows preventDefault() to work
    document.addEventListener('keydown', this.handlers.keyDown);
    document.addEventListener('keyup', this.handlers.keyUp);

    canvas.addEventListener('pointerdown', this.handlers.pointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.handlers.pointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.handlers.pointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this.handlers.pointerCancel, { passive: false });
    canvas.addEventListener('wheel', this.handlers.wheel, { passive: false });

    // Update canvas rect on window resize
    this.resizeHandler = () => {
      this.canvasRect = this.canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', this.resizeHandler);

    this.enabled = true;
  }

  /**
   * Normalize pointer coordinates to canvas space
   * @param {number} clientX - Client X coordinate
   * @param {number} clientY - Client Y coordinate
   * @returns {{x: number, y: number}} Canvas-relative coordinates
   */
  normalizeCoordinates(clientX, clientY) {
    if (!this.canvasRect) {
      return { x: clientX, y: clientY };
    }

    // Convert from page coordinates to canvas-relative coordinates
    const x = clientX - this.canvasRect.left;
    const y = clientY - this.canvasRect.top;

    return { x, y };
  }

  /**
   * Handle keyboard key down
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (!this.keys.get(key)) {
      this.keysPressed.add(key);
    }
    this.keys.set(key, true);
  }

  /**
   * Handle keyboard key up
   * @param {KeyboardEvent} e
   */
  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys.set(key, false);
    this.keysReleased.add(key);
  }

  /**
   * Handle pointer down (mouse click or touch start)
   * @param {PointerEvent} e
   */
  handlePointerDown(e) {
    e.preventDefault();

    const coords = this.normalizeCoordinates(e.clientX, e.clientY);

    const pointer = {
      id: e.pointerId,
      x: coords.x,
      y: coords.y,
      startX: coords.x,
      startY: coords.y,
      button: e.button, // 0=left, 1=middle, 2=right
      type: e.pointerType, // 'mouse', 'touch', 'pen'
      pressure: e.pressure,
    };

    this.pointers.set(e.pointerId, pointer);

    // First pointer becomes primary
    if (!this.primaryPointer) {
      this.primaryPointer = pointer;

      // Start swipe detection
      this.swipeStart = {
        x: coords.x,
        y: coords.y,
        time: performance.now(),
      };
    }

    // Capture pointer to receive events even if it leaves canvas
    if (this.canvas.setPointerCapture) {
      this.canvas.setPointerCapture(e.pointerId);
    }
  }

  /**
   * Handle pointer move (mouse move or touch move)
   * @param {PointerEvent} e
   */
  handlePointerMove(e) {
    e.preventDefault();

    const pointer = this.pointers.get(e.pointerId);
    if (!pointer) return;

    const coords = this.normalizeCoordinates(e.clientX, e.clientY);

    // Calculate delta for game loop
    const dx = coords.x - pointer.x;
    const dy = coords.y - pointer.y;
    this.pointerDeltas.set(e.pointerId, { dx, dy });

    // Update position
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.pressure = e.pressure;
  }

  /**
   * Handle pointer up (mouse release or touch end)
   * @param {PointerEvent} e
   */
  handlePointerUp(e) {
    e.preventDefault();

    const pointer = this.pointers.get(e.pointerId);
    if (pointer) {
      const coords = this.normalizeCoordinates(e.clientX, e.clientY);

      // End swipe detection
      if (pointer === this.primaryPointer) {
        this.swipeEnd = {
          x: coords.x,
          y: coords.y,
          time: performance.now(),
        };
        this.primaryPointer = null;
      }

      this.pointers.delete(e.pointerId);
      this.pointerDeltas.delete(e.pointerId);
    }

    // Release pointer capture
    if (this.canvas.releasePointerCapture) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore - pointer may not have been captured
      }
    }

    // Update primary pointer to next available
    if (!this.primaryPointer && this.pointers.size > 0) {
      this.primaryPointer = this.pointers.values().next().value;
    }
  }

  /**
   * Handle pointer cancel (pointer removed/interrupted)
   * @param {PointerEvent} e
   */
  handlePointerCancel(e) {
    // Treat like pointer up
    this.handlePointerUp(e);
  }

  /**
   * Handle mouse wheel
   * @param {WheelEvent} e
   */
  handleWheel(e) {
    e.preventDefault();
    this.mouseWheel = e.deltaY;
  }

  /**
   * Check if a key is currently held down
   * @param {string} key - Key name (lowercase)
   * @returns {boolean}
   */
  isKeyDown(key) {
    return this.keys.get(key.toLowerCase()) || false;
  }

  /**
   * Check if a key was just pressed this frame
   * @param {string} key - Key name (lowercase)
   * @returns {boolean}
   */
  isKeyPressed(key) {
    return this.keysPressed.has(key.toLowerCase());
  }

  /**
   * Check if a key was just released this frame
   * @param {string} key - Key name (lowercase)
   * @returns {boolean}
   */
  isKeyReleased(key) {
    return this.keysReleased.has(key.toLowerCase());
  }

  /**
   * Get primary pointer (first pointer or mouse)
   * @returns {{x: number, y: number, button: number, type: string}|null}
   */
  getPrimaryPointer() {
    return this.primaryPointer ? { ...this.primaryPointer } : null;
  }

  /**
   * Check if primary pointer is down
   * @returns {boolean}
   */
  isPrimaryPointerDown() {
    return this.primaryPointer !== null;
  }

  /**
   * Get primary pointer position
   * @returns {{x: number, y: number}|null}
   */
  getPointerPosition() {
    return this.primaryPointer
      ? { x: this.primaryPointer.x, y: this.primaryPointer.y }
      : null;
  }

  /**
   * Get all active pointers (for multi-touch)
   * @returns {Map<number, Object>} Map of pointerId -> pointer data
   */
  getPointers() {
    return new Map(this.pointers);
  }

  /**
   * Get pointer delta (movement since last frame)
   * @param {number} pointerId - Pointer ID
   * @returns {{dx: number, dy: number}|null}
   */
  getPointerDelta(pointerId) {
    return this.pointerDeltas.get(pointerId) || null;
  }

  /**
   * Get primary pointer delta
   * @returns {{dx: number, dy: number}|null}
   */
  getPrimaryPointerDelta() {
    return this.primaryPointer
      ? this.getPointerDelta(this.primaryPointer.id)
      : null;
  }

  /**
   * Get number of active pointers
   * @returns {number}
   */
  getPointerCount() {
    return this.pointers.size;
  }

  /**
   * Check if a specific pointer button is down
   * @param {number} button - Button number (0=left, 1=middle, 2=right)
   * @returns {boolean}
   */
  isPointerButtonDown(button) {
    if (!this.primaryPointer) return false;
    return this.primaryPointer.button === button;
  }

  /**
   * Get mouse wheel delta (cleared each frame)
   * @returns {number}
   */
  getMouseWheel() {
    return this.mouseWheel;
  }

  /**
   * Get swipe direction if a swipe gesture was detected
   * @returns {string|null} - 'up', 'down', 'left', 'right', or null
   */
  getSwipeDirection() {
    if (!this.swipeStart || !this.swipeEnd) return null;

    const dx = this.swipeEnd.x - this.swipeStart.x;
    const dy = this.swipeEnd.y - this.swipeStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = this.swipeEnd.time - this.swipeStart.time;

    // Swipe thresholds
    const minDistance = 50;
    const maxDuration = 500;

    if (distance < minDistance || duration > maxDuration) {
      return null;
    }

    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Clear frame-specific input state (call at end of each frame in game loop)
   * IMPORTANT: Call this after processing input in your update() function
   */
  clearFrameState() {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouseWheel = 0;
    this.pointerDeltas.clear();
    this.swipeStart = null;
    this.swipeEnd = null;
  }

  /**
   * Reset all input state
   */
  reset() {
    this.keys.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.pointers.clear();
    this.pointerDeltas.clear();
    this.primaryPointer = null;
    this.mouseWheel = 0;
    this.swipeStart = null;
    this.swipeEnd = null;
  }

  /**
   * Clean up and remove event listeners
   */
  cleanup() {
    if (!this.enabled) return;

    // Remove event listeners
    document.removeEventListener('keydown', this.handlers.keyDown);
    document.removeEventListener('keyup', this.handlers.keyUp);

    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlers.pointerDown);
      this.canvas.removeEventListener('pointermove', this.handlers.pointerMove);
      this.canvas.removeEventListener('pointerup', this.handlers.pointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlers.pointerCancel);
      this.canvas.removeEventListener('wheel', this.handlers.wheel);

      // Restore touch-action
      this.canvas.style.touchAction = '';
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    this.reset();
    this.canvas = null;
    this.canvasRect = null;
    this.enabled = false;
  }
}
