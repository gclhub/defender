// enemies.js - All enemy classes for Defender

const Enemies = (() => {
  const list = [];

  // Enemy types
  const TYPE = {
    LANDER: 'lander',
    MUTANT: 'mutant',
    BOMBER: 'bomber',
    POD: 'pod',
    SWARMER: 'swarmer',
    BAITER: 'baiter',
  };

  // Point values
  const POINTS = {
    lander: 150,
    mutant: 150,
    bomber: 250,
    pod: 1000,
    swarmer: 150,
    baiter: 200,
  };

  // Colors
  const COLORS = {
    lander: '#ff4444',
    mutant: '#ff00ff',
    bomber: '#ff8800',
    pod: '#aaaaff',
    swarmer: '#ffff00',
    baiter: '#00ffff',
  };

  let worldW = 0;
  let screenH = 0;
  let scannerTopY = 0; // Top of play area (below scanner)
  let baitersSpawnTimer = 0;
  let waveTimer = 0;

  function init(wW, sH, scanTop) {
    worldW = wW;
    screenH = sH;
    scannerTopY = scanTop;
    baitersSpawnTimer = 0;
    waveTimer = 0;
  }

  function _create(type, x, y) {
    const e = {
      type,
      x: Utils.wrap(x, worldW),
      y,
      vx: 0,
      vy: 0,
      hp: 1,
      active: true,
      points: POINTS[type],
      color: COLORS[type],
      // State fields
      state: 'idle',
      target: null,      // humanoid being abducted (lander)
      carryingHumanoid: null,
      animTimer: 0,
      animFrame: 0,
      fireTimer: 0,
      age: 0,
    };

    // Type-specific init
    switch (type) {
      case TYPE.LANDER:
        e.vx = Utils.randFloat(-100, 100);
        e.vy = Utils.randFloat(35, 80);
        e.state = 'descending';
        break;
      case TYPE.MUTANT:
        e.vx = Utils.randFloat(-1, 1) * 195;
        e.vy = Utils.randFloat(-1, 1) * 195;
        break;
      case TYPE.BOMBER:
        e.vx = Utils.randChoice([-1, 1]) * Utils.randFloat(130, 225);
        e.vy = 0;
        e.y = Utils.randFloat(scannerTopY + 30, screenH * 0.5);
        e.fireTimer = Utils.randFloat(1, 3);
        break;
      case TYPE.POD:
        e.vx = Utils.randFloat(-40, 40);
        e.vy = Utils.randFloat(-20, 20);
        e.y = Utils.randFloat(scannerTopY + 40, screenH * 0.4);
        break;
      case TYPE.SWARMER:
        e.vx = Utils.randFloat(-320, 320);
        e.vy = Utils.randFloat(-320, 320);
        break;
      case TYPE.BAITER:
        e.vx = Utils.randChoice([-1, 1]) * 320;
        e.vy = 0;
        e.y = Utils.randFloat(scannerTopY + 40, screenH * 0.6);
        break;
    }
    list.push(e);
    return e;
  }

  function spawnWave(wave) {
    list.length = 0;
    baitersSpawnTimer = 15 + Math.max(0, 5 - wave); // Baiters appear sooner in later waves
    waveTimer = 0;

    const groundY = Terrain.getGroundY();

    // Scale enemy counts with wave number
    const landers = 6 + wave * 2;
    const bombers = Math.max(0, wave - 1);
    const pods = Math.max(0, Math.floor(wave / 2));

    for (let i = 0; i < landers; i++) {
      const x = Utils.randFloat(0, worldW);
      const y = Utils.randFloat(scannerTopY + 30, scannerTopY + 100);
      _create(TYPE.LANDER, x, y);
    }

    for (let i = 0; i < bombers; i++) {
      const x = Utils.randFloat(0, worldW);
      const y = Utils.randFloat(scannerTopY + 40, screenH * 0.45);
      _create(TYPE.BOMBER, x, y);
    }

    for (let i = 0; i < pods; i++) {
      const x = Utils.randFloat(0, worldW);
      _create(TYPE.POD, x, 0);
    }
  }

  function update(dt, playerX, playerY, waveDifficulty) {
    waveTimer += dt;
    baitersSpawnTimer -= dt;

    const groundY = Terrain.getGroundY();

    // Spawn baiters if player is taking too long
    if (baitersSpawnTimer <= 0) {
      baitersSpawnTimer = 8;
      if (list.filter(e => e.active && e.type === TYPE.BAITER).length < 4) {
        const x = Utils.wrap(playerX + Utils.randFloat(-300, 300), worldW);
        _create(TYPE.BAITER, x, playerY + Utils.randFloat(-80, 80));
      }
    }

    const speed = 1 + waveDifficulty * 0.15;

    // Constants for boundary antigravity and behind-player scatter
    const ANTIGRAV_ZONE = 80;   // px from boundary where soft repulsion begins
    const ANTIGRAV_FORCE = 250; // acceleration magnitude of antigravity
    const SCATTER_RANGE_X = 800; // horizontal range behind player where scatter applies
    const SCATTER_RANGE_Y = 100; // vertical band within which behind-player scatter applies
    const SCATTER_FORCE = 280;   // acceleration magnitude of scatter force
    const SCATTER_PHASE_FREQ = 5; // oscillation rate for tie-breaking scatter direction when dy === 0

    for (const e of list) {
      if (!e.active) continue;

      e.age += dt;
      e.animTimer += dt;
      if (e.animTimer > 0.2) {
        e.animTimer = 0;
        e.animFrame = (e.animFrame + 1) % 4;
      }

      switch (e.type) {
        case TYPE.LANDER:
          _updateLander(e, dt, playerX, playerY, groundY, speed);
          break;
        case TYPE.MUTANT:
          _updateMutant(e, dt, playerX, playerY, speed);
          break;
        case TYPE.BOMBER:
          _updateBomber(e, dt, speed);
          break;
        case TYPE.POD:
          _updatePod(e, dt, speed);
          break;
        case TYPE.SWARMER:
          _updateSwarmer(e, dt, playerX, playerY, speed);
          break;
        case TYPE.BAITER:
          _updateBaiter(e, dt, playerX, playerY, speed);
          break;
      }

      // Soft antigravity near top and bottom screen boundaries — repels enemies before hard clamp
      const terrainAtX = Terrain.getYAtX(e.x);
      const topEdgeBound = scannerTopY + 10;
      const bottomEdgeBound = terrainAtX - 15;

      const distFromTop = e.y - topEdgeBound;
      if (distFromTop < ANTIGRAV_ZONE && distFromTop >= 0) {
        e.vy += ANTIGRAV_FORCE * (1 - distFromTop / ANTIGRAV_ZONE) * dt * speed;
      }

      // Bottom antigravity — skip Landers actively descending or hunting so they can reach the ground
      if (e.type !== TYPE.LANDER || (e.state !== 'descending' && e.state !== 'hunting')) {
        const distFromBottom = bottomEdgeBound - e.y;
        if (distFromBottom < ANTIGRAV_ZONE && distFromBottom >= 0) {
          e.vy -= ANTIGRAV_FORCE * (1 - distFromBottom / ANTIGRAV_ZONE) * dt * speed;
        }
      }

      // Scatter enemies that converge behind the player at the same altitude.
      // Without this, enemies line up in the player's wake and can be trivially eliminated by reversing.
      if (Player.isActive() && e.type !== TYPE.LANDER) {
        const playerDir = Player.getDir();
        let dxToEnemy = e.x - playerX;
        if (dxToEnemy > worldW / 2) dxToEnemy -= worldW;
        if (dxToEnemy < -worldW / 2) dxToEnemy += worldW;
        const dyToEnemy = e.y - playerY;
        // Enemy is "behind" when it lies on the side opposite to the player's facing direction
        if (dxToEnemy * playerDir < 0 && Math.abs(dxToEnemy) < SCATTER_RANGE_X && Math.abs(dyToEnemy) < SCATTER_RANGE_Y) {
          const pushDir = dyToEnemy !== 0 ? Math.sign(dyToEnemy) : (Math.sin(e.age * SCATTER_PHASE_FREQ) > 0 ? 1 : -1);
          e.vy += pushDir * SCATTER_FORCE * dt * speed;
        }
      }

      // Hard boundary clamp — keep entities inside the play area
      if (e.y < topEdgeBound) {
        e.y = topEdgeBound;
        if (e.vy < 0) e.vy = Math.abs(e.vy);
      }
      if (e.y > bottomEdgeBound) {
        e.y = bottomEdgeBound;
        if (e.vy > 0) e.vy = -Math.abs(e.vy);
      }
      e.x = Utils.wrap(e.x, worldW);
    }
  }

  function _updateLander(e, dt, playerX, playerY, groundY, speed) {
    const humanoids = Humanoids.getList();

    if (e.state === 'descending') {
      // Look for an un-targeted humanoid to abduct
      if (!e.target) {
        // Find nearest standing humanoid
        let best = null;
        let bestDist = Infinity;
        for (const h of humanoids) {
          if (!h.active || h.state !== 'standing') continue;
          // Check if already targeted by another lander
          let taken = false;
          for (const other of list) {
            if (other !== e && other.type === TYPE.LANDER && other.target === h) {
              taken = true;
              break;
            }
          }
          if (taken) continue;
          let dx = h.x - e.x;
          // Wrap-around distance
          if (dx > worldW / 2) dx -= worldW;
          if (dx < -worldW / 2) dx += worldW;
          const d = Math.abs(dx) + Math.abs(h.y - e.y);
          if (d < bestDist) {
            bestDist = d;
            best = h;
          }
        }
        if (best) {
          e.target = best;
          e.state = 'hunting';
        }
      }

      // Descend slowly if no target
      if (e.state === 'descending') {
        e.x += e.vx * dt * speed;
        e.y += e.vy * dt * speed;
        // Bounce off boundaries
        if (e.y > groundY - 30) {
          e.vy = -Math.abs(e.vy);
          e.y = groundY - 30;
        }
        if (e.y < scannerTopY + 30) {
          e.vy = Math.abs(e.vy);
        }
        // Drift horizontally
        e.vx += Utils.randFloat(-10, 10) * dt;
        e.vx = Utils.clamp(e.vx, -130 * speed, 130 * speed);
      }
    }

    if (e.state === 'hunting' && e.target) {
      if (!e.target.active || e.target.state === 'dead') {
        e.target = null;
        e.state = 'descending';
        return;
      }
      // Move toward target humanoid
      let dx = e.target.x - e.x;
      if (dx > worldW / 2) dx -= worldW;
      if (dx < -worldW / 2) dx += worldW;
      const dy = e.target.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < 15) {
        // Grab it
        e.target.state = 'grabbed';
        e.target.abductedBy = e;
        e.carryingHumanoid = e.target;
        e.target = null;
        e.state = 'ascending';
        e.vy = -130 * speed;
        e.vx = Utils.randFloat(-65, 65) * speed;
      } else {
        const spd = 130 * speed;
        e.vx = (dx / d) * spd;
        e.vy = (dy / d) * spd;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }
    }

    if (e.state === 'ascending') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.carryingHumanoid) {
        e.carryingHumanoid.x = e.x;
        e.carryingHumanoid.y = e.y + 20;
      }
      // Reached top — become mutant
      if (e.y <= scannerTopY + 5) {
        if (e.carryingHumanoid) {
          e.carryingHumanoid.state = 'dead';
          e.carryingHumanoid.active = false;
          e.carryingHumanoid = null;
        }
        // Transform into mutant
        e.type = TYPE.MUTANT;
        e.color = COLORS[TYPE.MUTANT];
        e.points = POINTS[TYPE.MUTANT];
        e.state = 'idle';
        e.vx = Utils.randFloat(-1, 1) * 195;
        e.vy = Utils.randFloat(-1, 1) * 195;
      }
    }
  }

  function _updateMutant(e, dt, playerX, playerY, speed) {
    // Home in aggressively on player
    let dx = playerX - e.x;
    if (dx > worldW / 2) dx -= worldW;
    if (dx < -worldW / 2) dx += worldW;
    let targetY = playerY;

    // When both mutant and player are near the top of the screen, approach from below
    // rather than converging at the ceiling — prevents trivial top-of-screen exploit
    const nearTop = scannerTopY + 100;
    if (playerY < nearTop && e.y < nearTop + 60) {
      targetY = playerY + 130;
    }

    const dy = targetY - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const targetVx = (dx / d) * 260 * speed;
    const targetVy = (dy / d) * 260 * speed;
    e.vx = Utils.lerp(e.vx, targetVx, dt * 2);
    e.vy = Utils.lerp(e.vy, targetVy, dt * 2);

    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }

  function _updateBomber(e, dt, speed) {
    e.x += e.vx * dt * speed;
    // Slight vertical drift
    e.vy = Math.sin(e.age * 0.7) * 30;
    e.y += e.vy * dt;

    // Drop bomb periodically
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = Utils.randFloat(1.5, 4);
      Projectiles.dropBomb(e.x, e.y);
    }

    // Reverse at world edges (won't happen due to wrap, but add slight direction change)
    e.vx += Utils.randFloat(-5, 5) * dt;
    e.vx = Utils.clamp(e.vx, -290 * speed, 290 * speed);
  }

  function _updatePod(e, dt, speed) {
    e.x += e.vx * dt * speed;
    e.y += e.vy * dt * speed;
    // Pods drift slowly
    e.vx += Utils.randFloat(-20, 20) * dt;
    e.vy += Utils.randFloat(-20, 20) * dt;
    e.vx = Utils.clamp(e.vx, -60, 60);
    e.vy = Utils.clamp(e.vy, -40, 40);
  }

  function _updateSwarmer(e, dt, playerX, playerY, speed) {
    // Erratic movement with slight homing
    let dx = playerX - e.x;
    if (dx > worldW / 2) dx -= worldW;
    if (dx < -worldW / 2) dx += worldW;
    const dy = playerY - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    // Mix of random and homing
    const homingStr = 0.4;
    e.vx += ((dx / d) * homingStr + Utils.randFloat(-1, 1) * (1 - homingStr)) * 640 * dt * speed;
    e.vy += ((dy / d) * homingStr + Utils.randFloat(-1, 1) * (1 - homingStr)) * 640 * dt * speed;

    // Push downward when near the top to prevent accumulation at the ceiling
    if (e.y < scannerTopY + 60) {
      e.vy += 400 * dt * speed;
    }

    const maxSpd = 350 * speed;
    const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    if (spd > maxSpd) {
      e.vx = (e.vx / spd) * maxSpd;
      e.vy = (e.vy / spd) * maxSpd;
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }

  function _updateBaiter(e, dt, playerX, playerY, speed) {
    // Aggressive player chasing
    let dx = playerX - e.x;
    if (dx > worldW / 2) dx -= worldW;
    if (dx < -worldW / 2) dx += worldW;
    let targetY = playerY;

    // When both baiter and player are near the top, approach from below
    // to prevent the top-of-screen exploit
    const nearTop = scannerTopY + 100;
    if (playerY < nearTop && e.y < nearTop + 60) {
      targetY = playerY + 110;
    }

    const dy = targetY - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const baiSpd = 350 * speed;
    e.vx = Utils.lerp(e.vx, (dx / d) * baiSpd, dt * 3);
    e.vy = Utils.lerp(e.vy, (dy / d) * baiSpd, dt * 3);

    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }

  /**
   * Destroy enemy at index, spawn swarmers if pod
   * Returns point value
   */
  function kill(e) {
    if (!e.active) return 0;

    const pts = e.points;

    // Release carried humanoid as falling
    if (e.carryingHumanoid) {
      e.carryingHumanoid.state = 'falling';
      e.carryingHumanoid.vy = 0;
      e.carryingHumanoid.abductedBy = null;
      e.carryingHumanoid = null;
    }

    // If pod, spawn swarmers
    if (e.type === TYPE.POD) {
      const numSwarmers = Utils.randInt(4, 8);
      for (let i = 0; i < numSwarmers; i++) {
        const angle = (i / numSwarmers) * Math.PI * 2;
        const s = _create(TYPE.SWARMER, e.x + Math.cos(angle) * 20, e.y + Math.sin(angle) * 20);
        s.vx = Math.cos(angle) * 150;
        s.vy = Math.sin(angle) * 150;
      }
    }

    // Particle explosion
    const colorMap = {
      lander: [255, 68, 68],
      mutant: [255, 0, 255],
      bomber: [255, 136, 0],
      pod: [170, 170, 255],
      swarmer: [255, 255, 0],
      baiter: [0, 255, 255],
    };
    Particles.explode(e.x, e.y, colorMap[e.type] || [255, 255, 255], 20, 200);
    Audio.explosion(e.type === TYPE.POD ? 2 : 1);

    e.active = false;
    return pts;
  }

  /**
   * Kill all active enemies (smart bomb)
   * Returns total points earned
   */
  function killAll() {
    let pts = 0;
    for (const e of list) {
      if (e.active) pts += kill(e);
    }
    return pts;
  }

  function render(ctx, cameraX, screenW) {
    ctx.save();
    for (const e of list) {
      if (!e.active) continue;
      const sx = Utils.worldToScreen(e.x, cameraX, screenW, worldW);
      if (sx < -60 || sx > screenW + 60) continue;

      switch (e.type) {
        case TYPE.LANDER:
          _drawLander(ctx, sx, e.y, e.animFrame, e.color);
          break;
        case TYPE.MUTANT:
          _drawMutant(ctx, sx, e.y, e.animFrame, e.color);
          break;
        case TYPE.BOMBER:
          _drawBomber(ctx, sx, e.y, e.animFrame, e.color);
          break;
        case TYPE.POD:
          _drawPod(ctx, sx, e.y, e.animFrame, e.color);
          break;
        case TYPE.SWARMER:
          _drawSwarmer(ctx, sx, e.y, e.animFrame, e.color);
          break;
        case TYPE.BAITER:
          _drawBaiter(ctx, sx, e.y, e.animFrame, e.color);
          break;
      }
    }
    ctx.restore();
  }

  // --- Drawing functions ---

  function _drawLander(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Body (rounded rect with fallback)
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sx - 10, sy - 8, 20, 16, 4);
    } else {
      ctx.rect(sx - 10, sy - 8, 20, 16);
    }
    ctx.stroke();

    // Engine pods
    const legOffset = frame < 2 ? 8 : 10;
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy + 8);
    ctx.lineTo(sx - 8, sy + legOffset);
    ctx.moveTo(sx + 8, sy + 8);
    ctx.lineTo(sx + 8, sy + legOffset);
    ctx.stroke();

    // Cockpit glow
    ctx.fillStyle = '#ff9999';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function _drawMutant(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Spiky shape
    const spikes = 6;
    const inner = 8;
    const outer = 14 + (frame % 2 === 0 ? 2 : 0);
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const px = sx + Math.cos(angle) * r;
      const py = sy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Center
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function _drawBomber(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Wing shape
    ctx.beginPath();
    ctx.moveTo(sx - 20, sy);
    ctx.lineTo(sx - 8, sy - 8);
    ctx.lineTo(sx, sy - 4);
    ctx.lineTo(sx + 8, sy - 8);
    ctx.lineTo(sx + 20, sy);
    ctx.lineTo(sx + 8, sy + 5);
    ctx.lineTo(sx, sy + 8);
    ctx.lineTo(sx - 8, sy + 5);
    ctx.closePath();
    ctx.stroke();

    // Engine glow
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function _drawPod(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(170,170,255,0.2)';
    ctx.lineWidth = 2;

    const pulse = 10 + Math.sin(frame * 1.2) * 2;
    ctx.beginPath();
    ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating lines
    for (let i = 0; i < 4; i++) {
      const a = (frame * 0.3 + i * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * pulse, sy + Math.sin(a) * pulse);
      ctx.stroke();
    }
  }

  function _drawSwarmer(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;

    // Diamond shape
    const s = 6 + (frame % 2);
    ctx.beginPath();
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx + s, sy);
    ctx.lineTo(sx, sy + s);
    ctx.lineTo(sx - s, sy);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,0,0.3)';
    ctx.fill();
  }

  function _drawBaiter(ctx, sx, sy, frame, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // UFO dish shape
    ctx.beginPath();
    ctx.ellipse(sx, sy, 18, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dome
    ctx.beginPath();
    ctx.arc(sx, sy - 4, 8, Math.PI, 0);
    ctx.stroke();

    // Lights
    const litColor = frame % 2 === 0 ? '#00ffff' : '#ffffff';
    ctx.fillStyle = litColor;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(sx + i * 7, sy + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render enemy blips on scanner
   */
  function renderScanner(ctx, scx, scy, scw, sch) {
    ctx.save();
    for (const e of list) {
      if (!e.active) continue;
      const sx = scx + (e.x / worldW) * scw;
      const sy = scy + sch * 0.5;
      ctx.fillStyle = e.color;
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    }
    ctx.restore();
  }

  function getList() { return list; }

  function countActive() {
    return list.filter(e => e.active).length;
  }

  function clear() {
    list.length = 0;
  }

  return {
    init,
    spawnWave,
    update,
    kill,
    killAll,
    render,
    renderScanner,
    getList,
    countActive,
    clear,
    TYPE,
    POINTS,
    COLORS,
  };
})();
