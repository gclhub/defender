// game.js - Main game loop, state management, initialization for Defender

const Game = (() => {
  // Game states
  const STATE = {
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WAVE_INTERMISSION: 'wave_intermission',
    GAME_OVER: 'game_over',
  };

  let canvas, ctx;
  let screenW, screenH;
  let state = STATE.TITLE;
  let wave = 1;
  let lastTime = 0;
  let worldW = 0;
  let cameraX = 0;
  let stars = [];
  let scannerH = 0;
  let intermissionTimer = 0;
  let intermissionBonus = 0;
  let catastropheTimer = 0;
  let allHumanoidsLostHandled = false;

  const WORLD_SCALE = 8; // World is 8x screen width

  // --- Initialization ---

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    _resize();
    window.addEventListener('resize', _resize);

    Input.init();
    Audio.init();

    _generateStars();

    requestAnimationFrame(_loop);
  }

  function _resize() {
    screenW = window.innerWidth;
    screenH = window.innerHeight;
    canvas.width = screenW;
    canvas.height = screenH;
    worldW = screenW * WORLD_SCALE;
    scannerH = Scanner.getHeight();
  }

  function _generateStars() {
    stars = [];
    const numStars = 200;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * screenW,
        y: Math.random() * screenH,
        size: Math.random() < 0.7 ? 1 : 2,
        brightness: 0.2 + Math.random() * 0.8,
        speed: 0.05 + Math.random() * 0.3, // Parallax speed multiplier
      });
    }
  }

  // --- Game loop ---

  function _loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap dt at 50ms
    lastTime = timestamp;

    _update(dt);
    _render();

    Input.flush();
    requestAnimationFrame(_loop);
  }

  function _update(dt) {
    // Global input available in all states
    Audio.resume();

    switch (state) {
      case STATE.TITLE:
        if (Input.wasPressed('Enter')) {
          _startGame();
        }
        break;

      case STATE.PLAYING:
        _updatePlaying(dt);
        break;

      case STATE.PAUSED:
        if (Input.wasPressed('KeyP') || Input.wasPressed('Escape')) {
          state = STATE.PLAYING;
        }
        break;

      case STATE.WAVE_INTERMISSION:
        intermissionTimer -= dt;
        if (intermissionTimer <= 0) {
          _startWave(wave + 1);
        }
        break;

      case STATE.GAME_OVER:
        if (Input.wasPressed('Enter')) {
          _startGame();
        }
        break;
    }
  }

  function _updatePlaying(dt) {
    // Pause check
    if (Input.wasPressed('KeyP') || Input.wasPressed('Escape')) {
      state = STATE.PAUSED;
      return;
    }

    // Update flash
    UI.updateFlash(dt);

    // Update player
    Player.update(dt);

    // Update camera to follow player
    const targetCamX = Utils.wrap(Player.getX(), worldW);
    // Smooth camera
    let dx = targetCamX - cameraX;
    if (dx > worldW / 2) dx -= worldW;
    if (dx < -worldW / 2) dx += worldW;
    cameraX = Utils.wrap(cameraX + dx * Math.min(dt * 20, 1), worldW);

    // Check if player needs respawn
    if (!Player.isActive()) {
      if (Player.getDeathTimer() <= 0) {
        if (Player.getLives() <= 0) {
          state = STATE.GAME_OVER;
          return;
        }
        Player.respawn();
      }
    }

    // Update enemies
    Enemies.update(dt, Player.getX(), Player.getY(), wave);

    // Update humanoids
    Humanoids.update(dt, worldW, screenH);

    // Update projectiles
    Projectiles.update(dt, worldW);

    // Update particles
    Particles.update(dt);

    // Update UI popups
    UI.updatePopups(dt);

    // --- Collision detection ---
    _checkCollisions();

    // Check all humanoids lost
    if (!allHumanoidsLostHandled && Humanoids.countAlive() === 0) {
      allHumanoidsLostHandled = true;
      catastropheTimer = 2.0;
      _humanoidsCatastrophe();
    }

    if (catastropheTimer > 0) {
      catastropheTimer -= dt;
    }

    // Check wave cleared
    if (Enemies.countActive() === 0) {
      _waveCleared();
    }
  }

  function _checkCollisions() {
    const lasers = Projectiles.getLasers();
    const bombs = Projectiles.getBombs();
    const enemies = Enemies.getList();
    const humanoids = Humanoids.getList();

    // Player ship hitbox
    const playerW = Player.getWidth();
    const playerH = Player.getHeight();
    const px = Player.getX();
    const py = Player.getY();

    // Lasers vs enemies
    for (const laser of lasers) {
      if (!laser.active) continue;
      for (const e of enemies) {
        if (!e.active) continue;
        const lsx = Utils.worldToScreen(laser.x, cameraX, screenW, worldW);
        const esx = Utils.worldToScreen(e.x, cameraX, screenW, worldW);

        if (Utils.rectCollide(
          lsx - Projectiles.LASER_WIDTH / 2, laser.y - Projectiles.LASER_HEIGHT / 2,
          Projectiles.LASER_WIDTH, Projectiles.LASER_HEIGHT,
          esx - 14, e.y - 14, 28, 28
        )) {
          laser.active = false;
          const pts = Enemies.kill(e);
          Player.addScore(pts);
          UI.addScorePopup(e.x, e.y, pts, cameraX, screenW, worldW);
        }
      }
    }

    // Bombs vs player
    if (Player.isActive() && !Player.isInvulnerable()) {
      for (const b of bombs) {
        if (!b.active) continue;
        const bsx = Utils.worldToScreen(b.x, cameraX, screenW, worldW);
        const psx = Utils.worldToScreen(px, cameraX, screenW, worldW);
        if (Utils.circleCollide(
          bsx, b.y, Projectiles.BOMB_RADIUS,
          psx, py, playerW / 2
        )) {
          b.active = false;
          Player.die();
          return;
        }
      }
    }

    // Enemies vs player
    if (Player.isActive() && !Player.isInvulnerable()) {
      for (const e of enemies) {
        if (!e.active) continue;
        const esx = Utils.worldToScreen(e.x, cameraX, screenW, worldW);
        const psx = Utils.worldToScreen(px, cameraX, screenW, worldW);
        if (Utils.circleCollide(esx, e.y, 12, psx, py, playerW / 2 - 2)) {
          Player.die();
          return;
        }
      }
    }

    // Player catches falling humanoids
    for (const h of humanoids) {
      if (h.state !== 'falling') continue;
      const hsx = Utils.worldToScreen(h.x, cameraX, screenW, worldW);
      const psx = Utils.worldToScreen(px, cameraX, screenW, worldW);
      if (Utils.rectCollide(
        psx - playerW / 2, py - playerH / 2, playerW, playerH,
        hsx - 6, h.y, 12, 18
      )) {
        // Catch! Score based on height — higher catch = more points
        const heightFrac = 1 - (h.y / (screenH - scannerH));
        const bonus = Math.round(500 + heightFrac * 500);
        h.state = 'standing';
        h.active = true;
        h.vy = 0;
        // Land on terrain
        h.baseY = Terrain.getYAtX(h.x) - Humanoids.HUMANOID_HEIGHT;
        h.y = h.baseY;
        Player.addScore(bonus);
        UI.addScorePopup(h.x, h.y, bonus, cameraX, screenW, worldW);
        Audio.humanoidCatch();
      }
    }
  }

  function _humanoidsCatastrophe() {
    // All landers become mutants
    const enemies = Enemies.getList();
    for (const e of enemies) {
      if (!e.active) continue;
      if (e.type === Enemies.TYPE.LANDER) {
        e.type = Enemies.TYPE.MUTANT;
        e.color = Enemies.COLORS[Enemies.TYPE.MUTANT];
        e.points = Enemies.POINTS[Enemies.TYPE.MUTANT];
        e.state = 'idle';
        if (e.carryingHumanoid) {
          e.carryingHumanoid.state = 'dead';
          e.carryingHumanoid.active = false;
          e.carryingHumanoid = null;
        }
        e.vx = Utils.randFloat(-1, 1) * 130;
        e.vy = Utils.randFloat(-1, 1) * 130;
      }
    }
    Audio.mutantWarning();
    UI.triggerFlash();
  }

  function _waveCleared() {
    const aliveHumanoids = Humanoids.countAlive();
    intermissionBonus = aliveHumanoids * 500;
    Player.addScore(intermissionBonus);
    Audio.waveComplete();

    intermissionTimer = 4.0;
    state = STATE.WAVE_INTERMISSION;
  }

  function _startGame() {
    wave = 1;
    _setupWorld();
    Player.reset();
    allHumanoidsLostHandled = false;
    catastropheTimer = 0;
    _startWave(1);
    state = STATE.PLAYING;
    Audio.waveStart(1);
  }

  function _setupWorld() {
    worldW = screenW * WORLD_SCALE;
    scannerH = Scanner.getHeight();

    Terrain.generate(worldW, screenH);
    Player.init(worldW, screenH, scannerH);
    Enemies.init(worldW, screenH, scannerH);
    Projectiles.clearAll();
    Particles.clear();
    cameraX = Player.getX();
  }

  function _startWave(w) {
    wave = w;
    allHumanoidsLostHandled = false;
    catastropheTimer = 0;
    Enemies.init(worldW, screenH, scannerH);
    Projectiles.clearAll();
    Particles.clear();

    // Respawn humanoids
    Humanoids.spawnWave(worldW, 10);

    // Spawn enemies
    Enemies.spawnWave(wave);

    // Give a smart bomb per wave (up to 5 max) — access via small bonus
    // (handled by wave bonuses above)

    state = STATE.PLAYING;
    Audio.waveStart(wave);
    UI.triggerFlash();
  }

  // --- Rendering ---

  function _render() {
    ctx.clearRect(0, 0, screenW, screenH);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, screenW, screenH);

    switch (state) {
      case STATE.TITLE:
        UI.drawTitle(ctx, screenW, screenH, _getStoredHighScore(), stars);
        break;

      case STATE.PLAYING:
      case STATE.PAUSED:
        _renderGame();
        if (state === STATE.PAUSED) {
          UI.drawPause(ctx, screenW, screenH);
        }
        break;

      case STATE.WAVE_INTERMISSION:
        _renderGame();
        UI.drawWaveIntermission(ctx, screenW, screenH, wave, intermissionBonus, intermissionTimer);
        break;

      case STATE.GAME_OVER:
        _renderGame();
        UI.drawGameOver(ctx, screenW, screenH, Player.getScore(), Player.getHighScore(), stars);
        break;
    }
  }

  function _renderGame() {
    // Stars (parallax)
    UI.drawStars(ctx, stars, screenW, screenH, cameraX * 0.1);

    // Terrain
    Terrain.render(ctx, cameraX, screenW);

    // Enemies
    Enemies.render(ctx, cameraX, screenW);

    // Humanoids
    Humanoids.render(ctx, cameraX, screenW, worldW);

    // Player
    Player.render(ctx, cameraX, screenW);

    // Projectiles
    Projectiles.renderLasers(ctx, cameraX, screenW, worldW);
    Projectiles.renderBombs(ctx, cameraX, screenW, worldW);

    // Particles
    Particles.render(ctx, cameraX, screenW, worldW);

    // Scanner
    Scanner.render(ctx, screenW, worldW);

    // HUD
    UI.drawHUD(ctx, screenW, screenH, scannerH);

    // Score popups
    UI.drawPopups(ctx);

    // Flash effect
    UI.drawFlash(ctx, screenW, screenH);

    // Catastrophe overlay
    if (catastropheTimer > 0) {
      UI.drawCatastrophe(ctx, screenW, screenH, catastropheTimer);
    }
  }

  // --- Public API ---

  function triggerFlash() {
    UI.triggerFlash();
  }

  function getWave() { return wave; }

  // Load high score for title screen before player initialized
  function _getStoredHighScore() {
    try {
      return parseInt(localStorage.getItem('defenderHighScore') || '0', 10);
    } catch (_) { return 0; }
  }

  return { init, triggerFlash, getWave };
})();

// Start the game when DOM is ready
window.addEventListener('load', () => {
  Game.init();
});
