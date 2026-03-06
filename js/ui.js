// ui.js - HUD, title screen, game over screen, pause overlay for Defender

const UI = (() => {
  // Retro font settings
  const FONT_TITLE = 'bold 48px "Courier New", monospace';
  const FONT_LARGE = 'bold 28px "Courier New", monospace';
  const FONT_MEDIUM = '18px "Courier New", monospace';
  const FONT_SMALL = '13px "Courier New", monospace';
  const FONT_TINY = '11px "Courier New", monospace';

  const COLOR_TITLE = '#ff6600';
  const COLOR_WHITE = '#ffffff';
  const COLOR_GREEN = '#00ff44';
  const COLOR_YELLOW = '#ffff00';
  const COLOR_CYAN = '#00ffff';
  const COLOR_DIM = '#888888';

  let flashTimer = 0;
  let flashAlpha = 0;

  function triggerFlash() {
    flashTimer = 0.4;
    flashAlpha = 0.8;
  }

  function updateFlash(dt) {
    if (flashTimer > 0) {
      flashTimer -= dt;
      flashAlpha = (flashTimer / 0.4) * 0.8;
    } else {
      flashAlpha = 0;
    }
  }

  /**
   * Draw title / start screen
   */
  function drawTitle(ctx, screenW, screenH, highScore, stars) {
    // Starfield
    _drawStars(ctx, stars, screenW, screenH, 0, 0);

    // Title backdrop
    const cx = screenW / 2;
    ctx.save();

    // Glow effect
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR_TITLE;
    ctx.font = FONT_TITLE;
    ctx.fillText('DEFENDER', cx, screenH * 0.22);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = COLOR_YELLOW;
    ctx.font = FONT_LARGE;
    ctx.fillText('★  ARCADE CLASSIC  ★', cx, screenH * 0.32);

    // High score
    ctx.fillStyle = COLOR_CYAN;
    ctx.font = FONT_MEDIUM;
    ctx.fillText(`HIGH SCORE: ${highScore}`, cx, screenH * 0.42);

    // Press Enter
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 400);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = FONT_LARGE;
    ctx.fillText('PRESS  ENTER  TO  START', cx, screenH * 0.52);
    ctx.globalAlpha = 1;

    // Controls reference
    const controlsY = screenH * 0.62;
    const lineH = 22;
    ctx.fillStyle = COLOR_GREEN;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('— CONTROLS —', cx, controlsY);

    ctx.fillStyle = COLOR_DIM;
    ctx.font = FONT_TINY;
    const controls = [
      ['LEFT / RIGHT  (or A/D)', 'Thrust'],
      ['UP / DOWN    (or W/S)', 'Move Up/Down'],
      ['F or R',               'Reverse Direction'],
      ['SPACE',                'Fire Laser'],
      ['B or E',               'Smart Bomb'],
      ['H or Q',               'Hyperspace'],
      ['P or ESC',             'Pause'],
    ];
    for (let i = 0; i < controls.length; i++) {
      const y = controlsY + lineH + i * lineH;
      ctx.fillStyle = '#aaffaa';
      ctx.textAlign = 'right';
      ctx.fillText(controls[i][0], cx - 10, y);
      ctx.fillStyle = COLOR_DIM;
      ctx.textAlign = 'left';
      ctx.fillText(controls[i][1], cx + 10, y);
    }

    // Copyright note
    ctx.textAlign = 'center';
    ctx.fillStyle = '#444444';
    ctx.font = FONT_TINY;
    ctx.fillText('Inspired by Defender © 1981 Williams Electronics', cx, screenH - 10);

    ctx.restore();
  }

  /**
   * Draw game over screen
   */
  function drawGameOver(ctx, screenW, screenH, score, highScore, stars) {
    _drawStars(ctx, stars, screenW, screenH, 0, 0);

    const cx = screenW / 2;
    ctx.save();
    ctx.textAlign = 'center';

    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4444';
    ctx.font = FONT_TITLE;
    ctx.fillText('GAME OVER', cx, screenH * 0.3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLOR_WHITE;
    ctx.font = FONT_LARGE;
    ctx.fillText(`SCORE:  ${score}`, cx, screenH * 0.45);

    ctx.fillStyle = COLOR_CYAN;
    ctx.font = FONT_MEDIUM;
    ctx.fillText(`HIGH SCORE:  ${highScore}`, cx, screenH * 0.55);

    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 400);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = FONT_LARGE;
    ctx.fillText('PRESS  ENTER  TO  RESTART', cx, screenH * 0.68);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /**
   * Draw pause overlay
   */
  function drawPause(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR_YELLOW;
    ctx.font = FONT_TITLE;
    ctx.fillText('PAUSED', screenW / 2, screenH / 2 - 30);

    ctx.fillStyle = COLOR_DIM;
    ctx.font = FONT_MEDIUM;
    ctx.fillText('Press P or ESC to resume', screenW / 2, screenH / 2 + 20);
    ctx.restore();
  }

  /**
   * Draw wave intermission screen
   */
  function drawWaveIntermission(ctx, screenW, screenH, wave, bonusScore, timer) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, screenW, screenH);

    const cx = screenW / 2;
    ctx.textAlign = 'center';

    ctx.fillStyle = COLOR_GREEN;
    ctx.font = FONT_TITLE;
    ctx.fillText(`WAVE ${wave}`, cx, screenH * 0.35);

    ctx.fillStyle = COLOR_YELLOW;
    ctx.font = FONT_LARGE;
    ctx.fillText('CLEARED!', cx, screenH * 0.46);

    if (bonusScore > 0) {
      ctx.fillStyle = COLOR_CYAN;
      ctx.font = FONT_MEDIUM;
      ctx.fillText(`HUMANOID BONUS: +${bonusScore}`, cx, screenH * 0.57);
    }

    ctx.fillStyle = COLOR_WHITE;
    ctx.font = FONT_SMALL;
    const remaining = Math.ceil(timer);
    ctx.fillText(`Next wave in ${remaining}...`, cx, screenH * 0.68);
    ctx.restore();
  }

  /**
   * Draw HUD
   */
  function drawHUD(ctx, screenW, screenH, scannerH) {
    const score = Player.getScore();
    const lives = Player.getLives();
    const bombs = Player.getSmartBombs();
    const wave = Game.getWave();

    ctx.save();

    // Score
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 10, scannerH + 22);

    // High score centered
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR_DIM;
    ctx.font = FONT_TINY;
    ctx.fillText(`HI ${Player.getHighScore()}`, screenW / 2, scannerH + 15);

    // Wave number
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR_YELLOW;
    ctx.font = FONT_SMALL;
    ctx.fillText(`WAVE ${wave}`, screenW - 10, scannerH + 22);

    // Lives (ship icons)
    const lifeX = 10;
    const lifeY = screenH - 28;
    for (let i = 0; i < Math.min(lives, 8); i++) {
      _drawMiniShip(ctx, lifeX + i * 26, lifeY);
    }

    // Smart bombs
    const bombX = screenW - 10;
    for (let i = 0; i < Math.min(bombs, 8); i++) {
      _drawMiniBomb(ctx, bombX - i * 20, lifeY + 2);
    }

    ctx.restore();
  }

  function _drawMiniShip(ctx, sx, sy) {
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx + 12, sy + 5);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx + 4, sy + 5);
    ctx.lineTo(sx, sy + 10);
    ctx.closePath();
    ctx.stroke();
  }

  function _drawMiniBomb(ctx, sx, sy) {
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy + 5, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffaa44';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 1);
    ctx.lineTo(sx - 4, sy - 5);
    ctx.stroke();
  }

  /**
   * Draw screen flash (smart bomb / hit effect)
   */
  function drawFlash(ctx, screenW, screenH) {
    if (flashAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();
  }

  /**
   * Draw floating score pop-ups
   */
  const popups = [];

  function addScorePopup(wx, wy, pts, cameraX, screenW, worldW) {
    const sx = Utils.worldToScreen(wx, cameraX, screenW, worldW);
    popups.push({ x: sx, y: wy, text: `+${pts}`, life: 1.0 });
  }

  function updatePopups(dt) {
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].life -= dt * 1.5;
      popups[i].y -= 30 * dt;
      if (popups[i].life <= 0) popups.splice(i, 1);
    }
  }

  function drawPopups(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Courier New", monospace';
    for (const p of popups) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = COLOR_YELLOW;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * Draw stars (background parallax)
   */
  function _drawStars(ctx, stars, screenW, screenH, cameraX, scrollSpeed) {
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      const sx = ((s.x - cameraX * s.speed + screenW * 10) % screenW);
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(sx, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawStars(ctx, stars, screenW, screenH, cameraX) {
    _drawStars(ctx, stars, screenW, screenH, cameraX, 1);
  }

  /**
   * Draw all-humanoids-lost catastrophe overlay
   */
  function drawCatastrophe(ctx, screenW, screenH, timer) {
    const alpha = Math.min(1, timer * 3);
    ctx.save();
    ctx.globalAlpha = alpha * (0.4 + 0.3 * Math.sin(Date.now() / 100));
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('ALL HUMANOIDS LOST!', screenW / 2, screenH / 2 - 20);
    ctx.fillStyle = '#ffff00';
    ctx.font = FONT_MEDIUM;
    ctx.fillText('LANDERS BECOME MUTANTS!', screenW / 2, screenH / 2 + 15);
    ctx.restore();
  }

  return {
    triggerFlash,
    updateFlash,
    drawTitle,
    drawGameOver,
    drawPause,
    drawWaveIntermission,
    drawHUD,
    drawFlash,
    addScorePopup,
    updatePopups,
    drawPopups,
    drawStars,
    drawCatastrophe,
  };
})();
