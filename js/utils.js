// utils.js - Utility functions for Defender

const Utils = (() => {
  /**
   * Check AABB collision between two rectangles
   */
  function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /**
   * Check circle collision
   */
  function circleCollide(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy < (ar + br) * (ar + br);
  }

  /**
   * Wrap a value within [0, max)
   */
  function wrap(value, max) {
    return ((value % max) + max) % max;
  }

  /**
   * Clamp a value between min and max
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation
   */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Return a random float in [min, max)
   */
  function randFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Return a random integer in [min, max]
   */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Return a random element from an array
   */
  function randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Angle from (x1,y1) to (x2,y2) in radians
   */
  function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Distance between two points
   */
  function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Convert world X to screen X given camera offset and world width
   */
  function worldToScreen(worldX, cameraX, screenWidth, worldWidth) {
    let sx = worldX - cameraX;
    // Handle wrap-around rendering
    if (sx < -worldWidth / 2) sx += worldWidth;
    if (sx > worldWidth / 2) sx -= worldWidth;
    return sx + screenWidth / 2;
  }

  return {
    rectCollide,
    circleCollide,
    wrap,
    clamp,
    lerp,
    randFloat,
    randInt,
    randChoice,
    angleTo,
    dist,
    worldToScreen,
  };
})();
