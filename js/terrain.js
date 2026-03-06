// terrain.js - Terrain/mountain generation and rendering for Defender

const Terrain = (() => {
  let points = [];       // Array of {x, y} world coordinates
  let worldW = 0;
  let groundY = 0;
  let screenH = 0;

  const TERRAIN_COLOR = '#2a8a2a';
  const TERRAIN_OUTLINE_COLOR = '#44cc44';
  const SEGMENT_WIDTH = 60;

  function generate(worldWidth, screenHeight) {
    worldW = worldWidth;
    screenH = screenHeight;
    groundY = screenHeight - 40; // HUD space for scanner is at top

    points = [];
    const numPoints = Math.ceil(worldWidth / SEGMENT_WIDTH) + 2;

    // Generate terrain using simple noise-like approach
    let y = groundY - 40;
    for (let i = 0; i < numPoints; i++) {
      const x = i * SEGMENT_WIDTH;
      // Random height variation
      y += Utils.randFloat(-40, 40);
      y = Utils.clamp(y, groundY - 120, groundY - 10);
      points.push({ x, y });
    }

    // Ensure seamless loop: last point connects to first
    points.push({ x: worldWidth, y: points[0].y });
  }

  /**
   * Get terrain Y at a given world X (for humanoid placement and collision)
   */
  function getYAtX(wx) {
    const wrappedX = Utils.wrap(wx, worldW);
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (wrappedX >= p1.x && wrappedX <= p2.x) {
        const t = (wrappedX - p1.x) / (p2.x - p1.x);
        return Utils.lerp(p1.y, p2.y, t);
      }
    }
    return groundY;
  }

  /**
   * Render the terrain given camera position
   */
  function render(ctx, cameraX, screenW) {
    ctx.save();

    // Draw terrain polygon
    ctx.fillStyle = TERRAIN_COLOR;
    ctx.strokeStyle = TERRAIN_OUTLINE_COLOR;
    ctx.lineWidth = 2;

    // Collect visible terrain points without using worldToScreen() (which wraps
    // coordinates and creates visual artifacts when points span the world boundary).
    // We check three offsets: -worldW (left wrap), 0 (normal), and +worldW (right wrap)
    // so that the terrain renders correctly when the camera is near either wrap boundary.
    const margin = SEGMENT_WIDTH;
    const visiblePoints = [];

    for (const offset of [-worldW, 0, worldW]) {
      for (let i = 0; i < points.length; i++) {
        const sx = points[i].x + offset - cameraX + screenW / 2;
        if (sx >= -margin && sx <= screenW + margin) {
          visiblePoints.push({ sx, sy: points[i].y });
        }
      }
    }

    if (visiblePoints.length === 0) {
      ctx.restore();
      return;
    }

    // Sort by screen X so we draw a continuous left-to-right polygon
    visiblePoints.sort((a, b) => a.sx - b.sx);

    ctx.beginPath();
    ctx.moveTo(visiblePoints[0].sx, visiblePoints[0].sy);
    for (let i = 1; i < visiblePoints.length; i++) {
      ctx.lineTo(visiblePoints[i].sx, visiblePoints[i].sy);
    }

    // Close polygon down to the bottom of the screen
    ctx.lineTo(visiblePoints[visiblePoints.length - 1].sx, screenH);
    ctx.lineTo(visiblePoints[0].sx, screenH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render the terrain outline for the scanner minimap
   * scx, scy = scanner area top-left
   * scw, sch = scanner area dimensions
   */
  function renderScanner(ctx, scx, scy, scw, sch) {
    ctx.save();
    ctx.strokeStyle = '#33aa33';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const sx = scx + (points[i].x / worldW) * scw;
      // Map terrain y to scanner height (terrain is near bottom)
      const sy = scy + sch * 0.85;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function getPoints() { return points; }
  function getGroundY() { return groundY; }
  function getWorldW() { return worldW; }

  return { generate, getYAtX, render, renderScanner, getPoints, getGroundY, getWorldW };
})();
