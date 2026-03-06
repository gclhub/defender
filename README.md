# Defender — Browser Arcade Game

A fully playable, browser-based replica of the classic 1981 arcade game **Defender** by Williams Electronics. Built with HTML5 Canvas and vanilla JavaScript — no frameworks, no dependencies, no build step.

## How to Play

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. No server required — works with `file://` protocol
3. Press **ENTER** to start

## Controls

| Action | Key(s) |
|---|---|
| Thrust Right | `Arrow Right` or `D` |
| Thrust Left | `Arrow Left` or `A` |
| Move Up | `Arrow Up` or `W` |
| Move Down | `Arrow Down` or `S` |
| Reverse Direction | `F` or `R` |
| Fire Laser | `Space` |
| Smart Bomb | `B` or `E` |
| Hyperspace | `H` or `Q` |
| Pause | `P` or `Escape` |
| Start / Restart | `Enter` |

## Gameplay Tips

- **Protect the humanoids** — if all humanoids are abducted and turned into mutants, the game becomes extremely difficult
- **Catch falling humanoids** after shooting their abductors for bonus points (higher catch = more points, up to 1000)
- **Smart bombs** (start with 3) destroy every enemy on screen — save them for emergencies
- **Hyperspace** is an emergency escape but has a small chance of killing you
- Watch the **scanner (minimap)** at the top to track enemies across the whole world
- **Baiters** appear if you take too long — they are fast and aggressive
- **Pods** release Swarmers when destroyed — watch out!

## Enemy Types

| Enemy | Points | Behavior |
|---|---|---|
| Lander | 150 | Descends to abduct humanoids; carries them upward |
| Mutant | 150 | Aggressive homing enemy; created when Lander successfully abducts |
| Bomber | 250 | Drops persistent mines/bombs |
| Pod | 1000 | Releases Swarmers when destroyed |
| Swarmer | 150 | Fast, erratic enemies released from Pods |
| Baiter | 200 | Fast UFO that appears if you take too long |

## Scoring

- **Lander**: 150 pts
- **Mutant**: 150 pts
- **Bomber**: 250 pts
- **Pod**: 1,000 pts
- **Swarmer**: 150 pts
- **Baiter**: 200 pts
- **Catching a falling humanoid**: 500-1,000 pts (height bonus)
- **Surviving humanoid bonus** (wave end): 500 pts per humanoid
- **Extra life**: awarded every 10,000 points

## Features

- Horizontally scrolling world (8x screen width, seamlessly wrapping)
- Minimap/scanner showing the entire world
- Procedural terrain generation
- All 6 classic enemy types with authentic behaviors
- Humanoid abduction mechanic
- Particle explosion effects
- Web Audio API sound effects (procedurally generated)
- Smart bombs (screen-clearing weapon)
- Hyperspace emergency teleport
- Wave system with increasing difficulty
- High score persistence via localStorage
- Responsive — fills any browser window

## File Structure

```
index.html          — Main HTML file, entry point
css/
  style.css         — Fullscreen canvas styling
js/
  game.js           — Main game loop, state management
  player.js         — Player ship (movement, shooting, lives, smart bombs)
  enemies.js        — All enemy classes (Lander, Mutant, Bomber, Pod, Swarmer, Baiter)
  humanoid.js       — Humanoid class (ground people, abduction logic)
  terrain.js        — Terrain/mountain generation and rendering
  scanner.js        — Minimap/radar scanner rendering
  particles.js      — Particle/explosion effects system
  projectile.js     — Laser and bomb projectiles
  input.js          — Keyboard input handler
  audio.js          — Web Audio API sound effects
  ui.js             — HUD, title screen, game over screen, pause overlay
  utils.js          — Utility functions (collision detection, math helpers)
README.md           — This file
```

## Credits

Inspired by **Defender** (C) 1981 Williams Electronics, designed by Eugene Jarvis and Larry DeMar.
This is a fan-made recreation for educational purposes.
