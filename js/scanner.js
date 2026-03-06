// scanner.js - Minimap/radar scanner rendering for Defender

const Scanner = (() => {
  const SCANNER_HEIGHT = 50;
  const SCANNER_BG = 'rgba(0,20,0,0.85)';
  const SCANNER_BORDER = '#004400';

  function getHeight() { return SCANNER_HEIGHT; }

  function render(ctx, screenW, worldW) {
    const scx = 0;
    const scy = 0;
    const scw = screenW;
    const sch = SCANNER_HEIGHT;

    // Background
    ctx.fillStyle = SCANNER_BG;
    ctx.fillRect(scx, scy, scw, sch);

    // Border
    ctx.strokeStyle = SCANNER_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(scx + 1, scy + 1, scw - 2, sch - 2);

    // Draw dividing lines to suggest segments
    ctx.strokeStyle = 'rgba(0,80,0,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const lx = scx + (i / 10) * scw;
      ctx.beginPath();
      ctx.moveTo(lx, scy + 5);
      ctx.lineTo(lx, scy + sch - 5);
      ctx.stroke();
    }

    // Terrain outline
    Terrain.renderScanner(ctx, scx, scy, scw, sch);

    // Humanoids
    Humanoids.renderScanner(ctx, scx, scy, scw, sch, worldW);

    // Enemies
    Enemies.renderScanner(ctx, scx, scy, scw, sch);

    // Player
    Player.renderScanner(ctx, scx, scy, scw, sch);

    // Camera viewport indicator
    const camFraction = worldW / screenW; // Ratio of world to screen
    const viewportW = scw / camFraction;
    // Center of player in scanner
    const playerScanX = scx + (Player.getX() / worldW) * scw;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      playerScanX - viewportW / 2,
      scy + 2,
      viewportW,
      sch - 4
    );

    // Label
    ctx.fillStyle = 'rgba(0,200,0,0.6)';
    ctx.font = '9px monospace';
    ctx.fillText('SCANNER', scx + 4, scy + sch - 4);
  }

  return { render, getHeight };
})();
