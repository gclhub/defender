// particles.js - Particle/explosion effects system for Defender

const Particles = (() => {
  const pool = [];
  const active = [];

  // Pre-allocate pool
  const POOL_SIZE = 500;
  for (let i = 0; i < POOL_SIZE; i++) {
    pool.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      r: 0, g: 0, b: 0,
      size: 2,
      active: false,
    });
  }

  function acquire() {
    if (pool.length > 0) return pool.pop();
    // If pool empty, recycle oldest active particle
    return active.shift() || {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      r: 0, g: 0, b: 0,
      size: 2,
      active: false,
    };
  }

  /**
   * Spawn an explosion at world coordinates (wx, wy)
   * color: [r, g, b]
   * count: number of particles
   * speed: max speed
   */
  function explode(wx, wy, color, count = 20, speed = 200, sizeRange = [1, 4]) {
    for (let i = 0; i < count; i++) {
      const p = acquire();
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      p.x = wx;
      p.y = wy;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = 1.0;
      p.maxLife = Utils.randFloat(0.4, 1.2);
      p.r = color[0];
      p.g = color[1];
      p.b = color[2];
      p.size = Utils.randFloat(sizeRange[0], sizeRange[1]);
      p.active = true;
      active.push(p);
    }
  }

  /**
   * Spawn debris particles (for terrain destruction, etc.)
   */
  function debris(wx, wy, color, count = 30, speed = 300) {
    for (let i = 0; i < count; i++) {
      const p = acquire();
      const angle = -Math.PI / 2 + Utils.randFloat(-Math.PI / 3, Math.PI / 3);
      const spd = Utils.randFloat(50, speed);
      p.x = wx;
      p.y = wy;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd - 100;
      p.life = 1.0;
      p.maxLife = Utils.randFloat(0.5, 1.5);
      p.r = color[0];
      p.g = color[1];
      p.b = color[2];
      p.size = Utils.randFloat(2, 5);
      p.active = true;
      active.push(p);
    }
  }

  /**
   * Update all particles
   */
  function update(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Slight gravity on particles
      p.vy += 60 * dt;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) {
        p.active = false;
        active.splice(i, 1);
        pool.push(p);
      }
    }
  }

  /**
   * Render all particles.
   * cameraX: world camera position
   * screenW: screen width
   * worldW: total world width
   */
  function render(ctx, cameraX, screenW, worldW) {
    for (const p of active) {
      const sx = Utils.worldToScreen(p.x, cameraX, screenW, worldW);
      // Only draw if roughly on screen
      if (sx < -20 || sx > screenW + 20) continue;

      const alpha = Math.max(0, p.life);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
      ctx.fillRect(sx - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  function clear() {
    while (active.length > 0) {
      pool.push(active.pop());
    }
  }

  return { explode, debris, update, render, clear };
})();
