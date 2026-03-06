// input.js - Keyboard input handler for Defender

const Input = (() => {
  const keys = {};
  const justPressed = {};
  const justReleased = {};

  function init() {
    window.addEventListener('keydown', (e) => {
      if (!keys[e.code]) {
        justPressed[e.code] = true;
      }
      keys[e.code] = true;
      // Prevent default for game keys to avoid page scrolling
      const gameCodes = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'KeyP', 'Escape', 'Enter', 'KeyB', 'KeyE',
        'KeyH', 'KeyQ', 'KeyF', 'KeyR', 'KeyW', 'KeyS', 'KeyA', 'KeyD'
      ];
      if (gameCodes.includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      justReleased[e.code] = true;
    });
  }

  function isDown(code) {
    return !!keys[code];
  }

  function wasPressed(code) {
    return !!justPressed[code];
  }

  function wasReleased(code) {
    return !!justReleased[code];
  }

  /**
   * Call at end of each frame to clear just-pressed/released state
   */
  function flush() {
    for (const k in justPressed) delete justPressed[k];
    for (const k in justReleased) delete justReleased[k];
  }

  return { init, isDown, wasPressed, wasReleased, flush };
})();
