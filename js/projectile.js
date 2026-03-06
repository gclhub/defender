// projectile.js - Laser and bomb projectiles for Defender

const Projectiles = (() => {
  // Player lasers
  const lasers = [];
  // Enemy bombs/mines
  const bombs = [];

  const LASER_SPEED = 1350;  // px/s in world space
  const LASER_WIDTH = 16;
  const LASER_HEIGHT = 3;
  const LASER_MAX_AGE = 1.5; // seconds

  const BOMB_RADIUS = 6;
  const BOMB_MAX_AGE = 5.0;

  function fireLaser(wx, wy, dir) {
    lasers.push({
      x: wx,
      y: wy,
      vx: LASER_SPEED * dir,
      vy: 0,
      dir,
      age: 0,
      active: true,
    });
  }

  function dropBomb(wx, wy) {
    bombs.push({
      x: wx,
      y: wy,
      vx: 0,
      vy: 30,
      age: 0,
      active: true,
    });
  }

  function update(dt, worldW) {
    for (const l of lasers) {
      if (!l.active) continue;
      l.x = Utils.wrap(l.x + l.vx * dt, worldW);
      l.y += l.vy * dt;
      l.age += dt;
      if (l.age > LASER_MAX_AGE) l.active = false;
    }

    for (const b of bombs) {
      if (!b.active) continue;
      b.x = Utils.wrap(b.x + b.vx * dt, worldW);
      b.y += b.vy * dt;
      b.age += dt;
      if (b.age > BOMB_MAX_AGE) b.active = false;
    }

    // Compact arrays
    _compact(lasers);
    _compact(bombs);
  }

  function _compact(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].active) arr.splice(i, 1);
    }
  }

  function renderLasers(ctx, cameraX, screenW, worldW) {
    ctx.save();
    for (const l of lasers) {
      if (!l.active) continue;
      const sx = Utils.worldToScreen(l.x, cameraX, screenW, worldW);
      if (sx < -LASER_WIDTH * 2 || sx > screenW + LASER_WIDTH * 2) continue;
      // Draw laser as bright horizontal bar
      const gradient = ctx.createLinearGradient(
        sx - (LASER_WIDTH / 2) * l.dir, l.y,
        sx + (LASER_WIDTH / 2) * l.dir, l.y
      );
      gradient.addColorStop(0, 'rgba(255,255,100,0)');
      gradient.addColorStop(0.3, 'rgba(255,255,100,1)');
      gradient.addColorStop(0.7, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,100,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        sx - LASER_WIDTH / 2,
        l.y - LASER_HEIGHT / 2,
        LASER_WIDTH,
        LASER_HEIGHT
      );
    }
    ctx.restore();
  }

  function renderBombs(ctx, cameraX, screenW, worldW) {
    ctx.save();
    for (const b of bombs) {
      if (!b.active) continue;
      const sx = Utils.worldToScreen(b.x, cameraX, screenW, worldW);
      if (sx < -BOMB_RADIUS * 4 || sx > screenW + BOMB_RADIUS * 4) continue;

      // Pulsing mine
      const pulse = 0.6 + 0.4 * Math.sin(b.age * 8);
      ctx.strokeStyle = `rgba(255,100,0,${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, b.y, BOMB_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,60,0,${pulse * 0.5})`;
      ctx.fill();

      // Cross lines
      ctx.strokeStyle = `rgba(255,200,0,${pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - BOMB_RADIUS - 3, b.y);
      ctx.lineTo(sx + BOMB_RADIUS + 3, b.y);
      ctx.moveTo(sx, b.y - BOMB_RADIUS - 3);
      ctx.lineTo(sx, b.y + BOMB_RADIUS + 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function getLasers() { return lasers; }
  function getBombs() { return bombs; }

  function clearAll() {
    lasers.length = 0;
    bombs.length = 0;
  }

  return {
    fireLaser,
    dropBomb,
    update,
    renderLasers,
    renderBombs,
    getLasers,
    getBombs,
    clearAll,
    LASER_WIDTH,
    LASER_HEIGHT,
    BOMB_RADIUS,
  };
})();
