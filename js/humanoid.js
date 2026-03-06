// humanoid.js - Humanoid class for Defender

const Humanoids = (() => {
  const list = [];
  const HUMANOID_WIDTH = 10;
  const HUMANOID_HEIGHT = 18;
  const FALL_SPEED = 200; // pixels per second when falling

  function spawn(worldX, terrainY) {
    list.push({
      x: worldX,
      y: terrainY - HUMANOID_HEIGHT,
      baseY: terrainY - HUMANOID_HEIGHT,
      vx: 0,
      vy: 0,
      state: 'standing', // standing | grabbed | falling | caught | dead
      abductedBy: null,  // reference to the lander holding this humanoid
      animFrame: 0,
      animTimer: 0,
      active: true,
    });
  }

  function spawnWave(worldW, count) {
    list.length = 0;
    const spacing = worldW / count;
    for (let i = 0; i < count; i++) {
      const wx = spacing * i + Utils.randFloat(20, spacing - 20);
      const ty = Terrain.getYAtX(wx);
      spawn(wx, ty);
    }
  }

  function update(dt, worldW, screenH) {
    for (const h of list) {
      if (!h.active) continue;

      h.animTimer += dt;
      if (h.animTimer > 0.3) {
        h.animTimer = 0;
        h.animFrame = (h.animFrame + 1) % 2;
      }

      if (h.state === 'grabbed') {
        // Position controlled by abductor
        if (h.abductedBy && h.abductedBy.active) {
          h.x = h.abductedBy.x;
          h.y = h.abductedBy.y + 20;
        } else {
          // Lander was shot — start falling
          h.state = 'falling';
          h.vy = 0;
          h.abductedBy = null;
        }
      } else if (h.state === 'falling') {
        h.vy += 300 * dt; // gravity
        h.vy = Math.min(h.vy, FALL_SPEED);
        h.y += h.vy * dt;
        h.x = Utils.wrap(h.x, worldW);

        const terrainY = Terrain.getYAtX(h.x);
        if (h.y + HUMANOID_HEIGHT >= terrainY) {
          // Hit the ground — humanoid dies
          h.y = terrainY - HUMANOID_HEIGHT;
          h.state = 'dead';
          h.active = false;
        }
      } else if (h.state === 'standing') {
        // Slight bobbing animation handled in render
        // Update base Y in case terrain changes (it doesn't in this implementation)
      }
    }

    // Remove dead ones
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].active && list[i].state === 'dead') {
        // Keep in list but inactive for removal tracking
      }
    }
  }

  /**
   * Draw a simple stick figure humanoid
   */
  function _drawFigure(ctx, sx, y, animFrame, color = '#00ffff') {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.arc(sx, y + 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(sx, y + 6);
    ctx.lineTo(sx, y + 13);
    ctx.stroke();

    // Arms (waving)
    if (animFrame === 0) {
      ctx.beginPath();
      ctx.moveTo(sx - 5, y + 9);
      ctx.lineTo(sx + 5, y + 9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(sx - 5, y + 7);
      ctx.lineTo(sx + 5, y + 11);
      ctx.stroke();
    }

    // Legs
    ctx.beginPath();
    if (animFrame === 0) {
      ctx.moveTo(sx, y + 13);
      ctx.lineTo(sx - 4, y + 18);
      ctx.moveTo(sx, y + 13);
      ctx.lineTo(sx + 4, y + 18);
    } else {
      ctx.moveTo(sx, y + 13);
      ctx.lineTo(sx - 2, y + 18);
      ctx.moveTo(sx, y + 13);
      ctx.lineTo(sx + 6, y + 18);
    }
    ctx.stroke();
  }

  function render(ctx, cameraX, screenW, worldW) {
    ctx.save();
    for (const h of list) {
      if (!h.active && h.state !== 'falling') continue;
      if (h.state === 'dead') continue;

      const sx = Utils.worldToScreen(h.x, cameraX, screenW, worldW);
      if (sx < -20 || sx > screenW + 20) continue;

      let color = '#00ffff';
      if (h.state === 'grabbed') color = '#ff8800';
      else if (h.state === 'falling') color = '#ffff00';

      _drawFigure(ctx, sx, h.y, h.animFrame, color);
    }
    ctx.restore();
  }

  /**
   * Render humanoid blips on scanner
   */
  function renderScanner(ctx, scx, scy, scw, sch, worldW) {
    ctx.save();
    for (const h of list) {
      if (!h.active && h.state !== 'falling') continue;
      if (h.state === 'dead') continue;
      const sx = scx + (h.x / worldW) * scw;
      const sy = scy + sch * 0.85;
      ctx.fillStyle = h.state === 'grabbed' ? '#ff8800' : '#00ffff';
      ctx.fillRect(sx - 1, sy - 2, 2, 4);
    }
    ctx.restore();
  }

  function getList() { return list; }

  function countAlive() {
    return list.filter(h => h.active || h.state === 'falling').length;
  }

  function clear() {
    list.length = 0;
  }

  return {
    spawn,
    spawnWave,
    update,
    render,
    renderScanner,
    getList,
    countAlive,
    clear,
    HUMANOID_WIDTH,
    HUMANOID_HEIGHT,
  };
})();
