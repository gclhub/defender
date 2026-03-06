// player.js - Player ship class for Defender

const Player = (() => {
  // Ship dimensions
  const SHIP_W = 24;
  const SHIP_H = 12;
  const MAX_SPEED_X = 1400;
  const MAX_SPEED_Y = 700;
  const THRUST = 2200;
  const FRICTION = 0.93;
  const FIRE_RATE = 0.12; // seconds between shots
  const INVUL_TIME = 3.0; // seconds of invulnerability on respawn
  const HYPERSPACE_DEATH_CHANCE = 0.05; // 5% chance of death

  let x = 0, y = 0;
  let vx = 0, vy = 0;
  let dir = 1; // 1 = right, -1 = left
  let lives = 3;
  let smartBombs = 3;
  let score = 0;
  let highScore = 0;
  let fireTimer = 0;
  let invulTimer = 0;
  let active = true;
  let deathTimer = 0; // countdown before respawn
  let thrustParticleTimer = 0;
  let worldW = 0;
  let screenH = 0;
  let scannerTopY = 0;

  function init(wW, sH, scanTop) {
    worldW = wW;
    screenH = sH;
    scannerTopY = scanTop;
    // Load high score from localStorage
    try {
      highScore = parseInt(localStorage.getItem('defenderHighScore') || '0', 10);
    } catch (_) { highScore = 0; }
    reset();
  }

  function reset() {
    x = worldW / 2;
    y = screenH / 2;
    vx = 0;
    vy = 0;
    dir = 1;
    lives = 3;
    smartBombs = 3;
    score = 0;
    fireTimer = 0;
    invulTimer = INVUL_TIME;
    active = true;
    deathTimer = 0;
  }

  // Returns the y clamped so the ship bottom edge stays above the terrain surface
  function _clampAboveTerrain(wx, wy) {
    const terrainY = Terrain.getYAtX(wx);
    return wy + SHIP_H / 2 >= terrainY ? terrainY - SHIP_H / 2 : wy;
  }

  function respawn() {
    x = worldW * Math.random();
    y = (screenH - scannerTopY) / 2 + scannerTopY;
    y = _clampAboveTerrain(x, y);
    vx = 0;
    vy = 0;
    dir = 1;
    invulTimer = INVUL_TIME;
    active = true;
    deathTimer = 0;
  }

  function update(dt) {
    if (!active) {
      deathTimer -= dt;
      return;
    }

    fireTimer -= dt;
    if (invulTimer > 0) invulTimer -= dt;

    // --- Input handling ---

    // Horizontal thrust
    if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) {
      vx += THRUST * dt;
      dir = 1;
    }
    if (Input.isDown('ArrowLeft') || Input.isDown('KeyA')) {
      vx -= THRUST * dt;
      dir = -1;
    }

    // Vertical movement
    if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) {
      vy -= THRUST * dt;
    }
    if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) {
      vy += THRUST * dt;
    }

    // Reverse direction
    if (Input.wasPressed('KeyF') || Input.wasPressed('KeyR')) {
      dir = -dir;
    }

    // Fire
    if ((Input.isDown('Space')) && fireTimer <= 0) {
      Projectiles.fireLaser(x + dir * SHIP_W / 2, y, dir);
      Audio.laser();
      fireTimer = FIRE_RATE;
    }

    // Smart bomb
    if (Input.wasPressed('KeyB') || Input.wasPressed('KeyE')) {
      if (smartBombs > 0) {
        smartBombs--;
        const pts = Enemies.killAll();
        addScore(pts);
        Audio.smartBomb();
        // Signal screen flash to game
        Game.triggerFlash();
      }
    }

    // Hyperspace
    if (Input.wasPressed('KeyH') || Input.wasPressed('KeyQ')) {
      Audio.hyperspace();
      if (Math.random() < HYPERSPACE_DEATH_CHANCE) {
        die();
      } else {
        x = Utils.randFloat(0, worldW);
        y = Utils.randFloat(scannerTopY + 30, screenH - 60);
        y = _clampAboveTerrain(x, y);
      }
    }

    // Apply friction
    vx *= Math.pow(FRICTION, dt * 60);
    vy *= Math.pow(FRICTION, dt * 60);

    // Clamp speed
    vx = Utils.clamp(vx, -MAX_SPEED_X, MAX_SPEED_X);
    vy = Utils.clamp(vy, -MAX_SPEED_Y, MAX_SPEED_Y);

    // Move
    x = Utils.wrap(x + vx * dt, worldW);
    y += vy * dt;

    // Vertical bounds
    y = Utils.clamp(y, scannerTopY + 10, screenH - 20);

    // Terrain collision: prevent the ship from flying through hills
    const prevY = y;
    y = _clampAboveTerrain(x, y);
    if (y < prevY && vy > 0) vy = 0;

    // Thrust particles
    if ((Input.isDown('ArrowRight') || Input.isDown('ArrowLeft') ||
         Input.isDown('KeyA') || Input.isDown('KeyD'))) {
      thrustParticleTimer -= dt;
      if (thrustParticleTimer <= 0) {
        thrustParticleTimer = 0.03;
        const px = x - dir * (SHIP_W / 2 + 2);
        const py = y;
        Particles.explode(px, py, [255, 140, 0], 2, 80, [1, 3]);
      }
    }
  }

  function die() {
    if (!active) return;
    if (invulTimer > 0) return;

    active = false;
    lives--;
    Audio.playerDeath();
    Particles.explode(x, y, [0, 200, 255], 40, 300, [2, 6]);
    deathTimer = 3.0; // Time before respawn attempt

    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem('defenderHighScore', String(highScore)); } catch (_) {}
    }
  }

  function addScore(pts) {
    const prevScore = score;
    score += pts;
    // Extra life every 10,000 points
    if (Math.floor(score / 10000) > Math.floor(prevScore / 10000)) {
      lives++;
    }
    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem('defenderHighScore', String(highScore)); } catch (_) {}
    }
  }

  function render(ctx, cameraX, screenW) {
    if (!active) return;

    // Invulnerability flicker
    if (invulTimer > 0 && Math.floor(invulTimer * 10) % 2 === 0) return;

    const sx = Utils.worldToScreen(x, cameraX, screenW, worldW);
    ctx.save();
    ctx.translate(sx, y);

    // Mirror horizontally based on direction
    if (dir === -1) ctx.scale(-1, 1);

    _drawShip(ctx);

    ctx.restore();
  }

  function _drawShip(ctx) {
    // Main body
    ctx.strokeStyle = '#00aaff';
    ctx.fillStyle = 'rgba(0,100,220,0.4)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(SHIP_W / 2, 0);         // Nose
    ctx.lineTo(-SHIP_W / 2, -SHIP_H / 2); // Top tail
    ctx.lineTo(-SHIP_W / 4, 0);         // Center indent
    ctx.lineTo(-SHIP_W / 2, SHIP_H / 2);  // Bottom tail
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.arc(SHIP_W / 6, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Engine exhaust area
    ctx.strokeStyle = '#0044aa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-SHIP_W / 4, -SHIP_H / 4);
    ctx.lineTo(-SHIP_W / 2, -SHIP_H / 4);
    ctx.moveTo(-SHIP_W / 4, SHIP_H / 4);
    ctx.lineTo(-SHIP_W / 2, SHIP_H / 4);
    ctx.stroke();
  }

  /**
   * Render player blip on scanner
   */
  function renderScanner(ctx, scx, scy, scw, sch) {
    const sx = scx + (x / worldW) * scw;
    const sy = scy + sch * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 2, sy - 4, 4, 8);
  }

  // Getters
  function getX() { return x; }
  function getY() { return y; }
  function getDir() { return dir; }
  function getLives() { return lives; }
  function getSmartBombs() { return smartBombs; }
  function getScore() { return score; }
  function getHighScore() { return highScore; }
  function isActive() { return active; }
  function getDeathTimer() { return deathTimer; }
  function isInvulnerable() { return invulTimer > 0; }
  function getWidth() { return SHIP_W; }
  function getHeight() { return SHIP_H; }

  return {
    init,
    reset,
    respawn,
    update,
    render,
    renderScanner,
    die,
    addScore,
    getX, getY, getDir,
    getLives, getSmartBombs, getScore, getHighScore,
    isActive, getDeathTimer, isInvulnerable,
    getWidth, getHeight,
  };
})();
