/* ============================================================================
   Survive Fire for Brainrots - v0.5 Lava biome / Level 4
   Pseudo-3D top-down dungeon with camera follow + atmospheric torchlight
   ============================================================================ */

const TILE      = 32;
const MAP_W     = 50;
const MAP_H     = 40;
const GAME_W    = 800;
const GAME_H    = 576;
const WORLD_W   = MAP_W * TILE;
const WORLD_H   = MAP_H * TILE;

// Camera zoom for the gameplay layer. Higher = the player and brainrots
// take up more of the screen and you see less of the surrounding world,
// which makes traversal feel more exploratory. The HUD and skybox render
// on a separate UI camera at zoom 1 so they stay screen-correct.
const GAME_ZOOM = 1.6;
const BASE_SPEED      = 200;
const CARRY_PENALTY   = 38;
const MIN_CARRY_SPEED = 70;
// Pixel distance between each carried brainrot in the worm-tail trail.
// Sprites are ~48px after pickup scaling (0.85 of the 56px world size), so
// this leaves a small overlap while keeping each follower clearly distinct.
const CARRY_SPACING   = 36;
const STARTING_HEARTS = 3;
const INVINCIBLE_MS   = 1500;

// Jump mechanic - the player can hop briefly to clear lava tiles or just to
// add motion polish. While airborne, lava-touch damage is suppressed (the
// player is in the air); other hazards still apply. The jump is purely
// visual lift - the physics body never leaves ground, so collisions and
// world bounds keep working normally.
const JUMP_DURATION_MS = 520;
const JUMP_HEIGHT_PX   = 38;
// Total lockout per jump = JUMP_DURATION_MS + JUMP_COOLDOWN_MS. Was 700 ms
// (520+180), which is just slow enough that natural pillar-to-pillar tap
// rhythm on touch devices lands ~half its presses inside the still-
// rejecting cooldown window. Dropped to 80 ms (=> 600 ms total lockout)
// so back-to-back rhythmic jumps register reliably.
const JUMP_COOLDOWN_MS = 80;

const LABEL_DISTANCE = 180;

const PLAYER_LIGHT_RADIUS = 230;
const TORCH_LIGHT_RADIUS  = 95;
const DARKNESS_COLOR      = 0x040108;
const DARKNESS_ALPHA      = 0.86;

const METEOR_FALL_MS      = 900;
const METEOR_SHOCK_MS     = 380;
const METEOR_SHOCK_MAX_R  = 65;
const METEOR_SPAWN_MS     = 450;
const METEOR_SPAWN_JITTER = 150;
const METEOR_SALVO_CHANCE = 0.55;
const METEOR_KNOCKBACK    = 220;

// Lingering fire patches that meteors leave behind on impact. Walking into
// a fire costs a heart and scatters carried brainrots, so the wasteland
// becomes more dangerous the longer you spend in it.
const FIRE_DURATION_MS    = 5000;
const FIRE_FADE_MS        = 800;
const FIRE_HIT_RADIUS     = 18;

// Lava biome (level 4). The world is mostly molten lava with raised stone
// platforms; the player can step onto lava but takes a heart of damage with
// each iframe window, so prolonged exposure quickly drains hearts. Geysers
// erupt from random lava tiles on a short cooldown - they telegraph in red
// before launching a vertical flame column that damages anything within the
// blast radius (so even on platforms you have to dodge near-edge geysers).
const LAVA_TICK_MS         = 350;     // delay between successive lava-touch hits while standing on lava
const GEYSER_TELEGRAPH_MS  = 950;
const GEYSER_ERUPT_MS      = 750;
const GEYSER_COOLDOWN_MS   = 600;
const GEYSER_HIT_RADIUS    = 38;
const GEYSER_SPAWN_MS      = 1300;
const GEYSER_SPAWN_JITTER  = 500;
const GEYSER_MAX_ACTIVE    = 6;
const GEYSER_KNOCKBACK     = 240;

// The Bloop is a visible cephalopod that hunts the player Pac-Man style:
// it always knows where you are and constantly closes in. When it has direct
// line-of-sight it chases at full tilt; when cover blocks LOS it slows to
// search, but it never gives up. Touching the player = catch (lose a heart,
// scatter brainrots, brief Bloop stun). Hide behind coral to wait it out.
const BLOOP_RADIUS           = 32;     // physics body collider radius (smaller than tile so it can navigate)
// Bloop2.png is 850x556 with healthy transparent padding on all sides and a
// clean silhouette (no chopped edges like the original bloop.png). Source aspect
// ratio is ~1.53:1, so we render with explicit width/height to preserve the
// fish's natural proportions instead of forcing a square. BLOOP_VIS_SIZE is the
// approximate visible fish width on screen, used to size the chase/search/stun
// glow halos under the sprite.
const BLOOP_DISPLAY_W        = 210;    // rendered width  in px
const BLOOP_DISPLAY_H        = 137;    // rendered height in px (210 * 556/850)
const BLOOP_VIS_SIZE         = 178;    // approx visible fish width in px (210 * 720/850)

// Player avatar render sizes. Tuned to match the visible footprint of an
// in-world brainrot (which renders in a 56×56 box but has transparent padding
// in its source art, so the visible character is closer to ~40 px tall).
// boy_avatar is square (256×256 source); boy_scuba is wider (800×512 source)
// so we preserve its 1.5625:1 ratio rather than squashing it.
const PLAYER_AVATAR_W        = 40;
const PLAYER_AVATAR_H        = 40;
const PLAYER_SCUBA_W         = 95;
const PLAYER_SCUBA_H         = 61;     // 95 * 512/800 = 60.8 — wider swim pose than the standing boy
const BLOOP_ACTIVATION_DIST  = 200;    // px from base before the Bloop wakes up
const BASE_SAFE_RADIUS       = 130;    // px - Bloop cannot hurt the player inside this circle
const BLOOP_SPEED_HUNT       = 95;     // moving toward player without LOS
const BLOOP_SPEED_SEARCH     = 85;     // heading to last known position
const BLOOP_SPEED_CHASE      = 125;    // direct LOS - full pursuit
const BLOOP_VISION_RANGE     = 480;    // px - where chase mode kicks in
const BLOOP_CATCH_RADIUS     = 50;     // px from Bloop center = caught
const BLOOP_SEARCH_TIME_MS   = 3500;   // search last-seen, then resume hunt
const BLOOP_STUN_TIME_MS     = 1400;

// Boss arena (level 5 - "The Hatch Below"). After clearing L4 with all four
// ultimates collected, the player is dropped into a forest clearing where Los
// Hackers emerges from a hatch in the ground. The arena is a fixed-size open
// field (not tile-based) and gameplay shifts from collect-and-carry to a
// pure action fight: player has hearts + an ability bar, boss has an HP bar.
//
// v0.6.0 ships the kill-loop skeleton: forest visuals, static boss, the
// Wail Shot ability (Lirili / Slot 1), and a victory route to WinScene.
// v0.6.1 adds the other 3 abilities, drones, and the 3-phase attack patterns.
// v0.6.2 adds the rumble/hatch cinematic intro and audio.
const ARENA_W = 1280;
const ARENA_H = 960;

// Boss reveal: camera starts zoomed out at this factor centered on the hatch
// while Los Hackers rises, then tweens to GAME_ZOOM to start the fight. Lower
// than 1.0 means "more of the arena visible" - tuned to fit the full boss
// sprite plus some surrounding context comfortably inside the viewport.
const BOSS_REVEAL_ZOOM      = 0.85;

const BOSS_HP_MAX           = 1000;       // total HP across all phases
const BOSS_DISPLAY_W        = 280;        // sprite render width  in px
const BOSS_DISPLAY_H        = 180;        // sprite render height in px
// Hitbox sized to roughly match the visible boss silhouette (~80% of the
// sprite's display size) so projectiles that visibly hit the boss actually
// register damage. Was a too-small radius-70 circle in v0.6.0 first cut,
// which let wail shots sail past the wider edges of the sprite without
// overlapping the body.
const BOSS_BODY_W           = 220;
const BOSS_BODY_H           = 130;
const BOSS_TOUCH_DAMAGE     = 1;          // hearts lost on body contact
const BOSS_FLASH_MS         = 220;        // red-tint duration on hit feedback

// Slot 1: Wail Shot (Lirili). A fast sonic projectile that auto-aims at the
// boss in v0.6.0 (cursor/joystick aim arrives in v0.6.1 alongside Bombardiro's
// targeted bomb). Light chip damage, short cooldown - the bread-and-butter dps.
const WAIL_COOLDOWN_MS      = 1500;
const WAIL_DAMAGE           = 25;
const WAIL_PROJ_SPEED       = 480;        // px/s
const WAIL_PROJ_LIFE_MS     = 1400;       // self-destruct after this long
const WAIL_PROJ_RADIUS      = 14;         // visual + collider half-size

// Boss Phase 1 stalker AI + bite-cone attack (v0.6.1a).
//
// State machine: idle (stalking) -> telegraph (red cone visible, boss frozen)
//                -> lunge (snap forward, deals damage in cone) -> recover
//                -> idle. The bite direction is locked at the moment of
// telegraph so the player has a fixed dodge target.
const BOSS_MOVE_SPEED_P1    = 70;         // px/s while stalking the player
const BOSS_BITE_COOLDOWN    = 3800;       // ms between bite attempts (idle-to-idle)
const BOSS_BITE_RANGE       = 320;        // px - max range to even consider biting
const BOSS_BITE_TELEGRAPH   = 700;        // ms cone visible before lunge
const BOSS_BITE_LUNGE_MS    = 220;        // ms of forward dash during lunge
const BOSS_BITE_RECOVER     = 520;        // ms boss is stunned after lunging
const BOSS_BITE_REACH       = 175;        // px - cone reach
const BOSS_BITE_HALF_ANGLE  = Math.PI / 3; // 60 deg either side -> 120 deg cone
const BOSS_BITE_DAMAGE      = 2;          // hearts per cone hit
const BOSS_LUNGE_VELOCITY   = 280;        // px/s during lunge

// Slot 3: Capitano Tidal Dash. Snap the player a few tiles in their facing
// direction with iframes, doubling as a dodge tool against the bite cone.
// Cooldown is moderate so the player can't dash-spam through every attack.
//
// Primary keyboard input is *double-tap* an arrow / WASD key to dash in that
// direction (Diablo-style). The on-screen Slot 3 button is kept for touch.
const DASH_COOLDOWN_MS      = 4500;
const DASH_DISTANCE         = 110;        // px (~3.5 tiles)
const DASH_DURATION_MS      = 220;
const DASH_IFRAMES_MS       = 320;        // slightly outlasts the dash itself
const DASH_DOUBLE_TAP_MS    = 280;        // window between taps to count as double

// Slot 2: Bombardiro Pasta Bomb. Big slow AOE — auto-aimed at the boss in
// v0.6.1b (cursor aim deferred). Long cooldown, heavy single-target damage,
// generous telegraph so it feels like a "commit to this exchange" tool.
const BOMB_COOLDOWN_MS      = 5500;
const BOMB_DAMAGE           = 100;        // 4× a Wail Shot
const BOMB_RADIUS           = 110;        // px AOE
const BOMB_TRAVEL_MS        = 720;        // arc time from player to target
const BOMB_WARNING_MS       = 800;        // red ring telegraph before detonation
const BOMB_ARC_HEIGHT       = 180;        // peak rise above linear path

// Phase 2 — "Pixel Storm". HP-gated transition; boss shifts to lavender tint
// and gains the Pixel Rain attack on top of the existing bite cone.
const BOSS_PHASE_2_HP_PCT   = 0.66;       // HP fraction that triggers P2
const PHASE_SHIFT_INVULN_MS = 1500;       // both player and boss locked during transition

// Pixel Rain attack: scatter falling pixels with telegraphed landing zones.
// Each pixel's warning circle is visible for RAIN_PIXEL_FALL_MS before the
// pixel actually impacts, so an alert player has time to step out.
const RAIN_PIXEL_COUNT      = 14;         // total pixels per cast
const RAIN_PIXEL_DAMAGE     = 1;          // hearts per impact
const RAIN_PIXEL_RADIUS     = 38;         // px - both warning ring and damage radius
const RAIN_PIXEL_FALL_MS    = 1400;       // warning visible this long before impact
const RAIN_TOTAL_MS         = 3500;       // total cast duration (pixels staggered across this)
const RAIN_RECOVER_MS       = 700;        // boss-stunned-after-cast window
// Weighted attack pick in Phase 2: bite when reachable, otherwise rain.
const P2_BITE_PROBABILITY   = 0.50;

// Phase 3 — "System Critical". Triggered at 33% HP. Boss tints crimson and
// gains the Ring Pulse attack on top of the existing P2 kit.
const BOSS_PHASE_3_HP_PCT   = 0.33;
// Phase 3 attack weights. Bite stays as the close-range threat; rain and
// ring pulse split the rest. Bite still falls back to the alternates if the
// player kites past BOSS_BITE_RANGE.
const P3_BITE_PROBABILITY   = 0.40;
const P3_RAIN_PROBABILITY   = 0.30;       // remainder (0.30) goes to ring pulse

// Ring Pulse attack: 3 expanding shockwaves from the boss, staggered. Each
// is a thin annulus that damages the player when the wavefront crosses them.
// Counters by being either far away (ring loses tension at radius) or by
// dashing radially through it during the brief edge-overlap window.
const RING_PULSE_COUNT      = 3;          // pulses per cast
const RING_PULSE_DELAY      = 600;        // ms between pulses
const RING_PULSE_TELEGRAPH  = 700;        // ms warning before each pulse fires
const RING_PULSE_DURATION   = 1200;       // ms for each pulse to expand to max
const RING_PULSE_MAX_R      = 540;        // px - radius at end of expansion
const RING_PULSE_BAND       = 30;         // px - hit band thickness (annulus)
const RING_PULSE_DAMAGE     = 1;          // hearts per pulse hit
const RING_PULSE_RECOVER_MS = 800;        // post-cast vulnerable window

// Slot 4: Hydra Channel Beam. Hold-to-channel; player roots, beam streams
// from player toward the boss dealing tick damage. High dps but you can't
// dodge while channeling - so it's a "find a safe window" tool. Channel
// breaks on damage, on dash, on key-up, or on max duration.
const HYDRA_COOLDOWN_MS     = 9000;       // 9 s between channels
const HYDRA_MAX_DURATION    = 3000;       // ms - hard cap on a single channel
const HYDRA_TICK_MS         = 100;        // damage tick frequency
const HYDRA_DAMAGE_PER_TICK = 8;          // 80 dps total
const HYDRA_BEAM_HALF_W     = 12;         // px - half-width for line-vs-circle hit checks

// Drones. Glitch cubes that spawn at the start of the recover window after
// a Phase-2/3 long cast (rain, ring pulse). Kamikaze AI: orbit briefly, then
// each drone individually dashes toward the player. They die in 1 hit (wail,
// bomb, hydra) or on player contact, dealing 1 heart on impact.
const DRONE_HP              = 1;
const DRONE_CONTACT_DAMAGE  = 1;
const DRONE_SIZE            = 22;         // px - visual + hit radius
const DRONE_LIFETIME_MS     = 3500;       // total time before auto-fade
const DRONE_ORBIT_MS        = 1500;       // time spent orbiting before dashing
const DRONE_DASH_MS         = 900;        // dash duration
const DRONE_ORBIT_RADIUS    = 95;         // px from boss
const DRONE_ORBIT_SPEED     = 1.4;        // rad/s
const DRONE_DASH_SPEED      = 280;        // px/s during dash
const DRONE_SPAWN_COUNT     = 3;          // drones per spawn batch
const DRONE_MAX_ALIVE       = 5;          // hard cap on simultaneous drones

const tx = (t) => t * TILE + TILE / 2;

/* ============================================================================
   Map definitions - per level
   ============================================================================ */

function buildMapL1() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('#'));

  const carve = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (yy >= 0 && yy < MAP_H && xx >= 0 && xx < MAP_W) {
          map[yy][xx] = '.';
        }
      }
    }
  };
  const place = (x, y, ch) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = ch;
  };

  // Northern Sanctum
  carve(13, 3, 24, 9);
  // North-to-landing corridor
  carve(22, 12, 6, 5);
  // Landing junction
  carve(15, 17, 20, 3);
  // West Wing
  carve(4, 20, 18, 10);
  // East Wing
  carve(28, 20, 18, 10);
  // West connector to entrance
  carve(10, 30, 6, 3);
  // East connector to entrance
  carve(34, 30, 6, 3);
  // Entrance Hall
  carve(7, 33, 36, 5);

  // Decorative inner pillars (single-tile walls inside rooms for visual depth)
  place(17, 6, '#');  place(33, 6, '#');     // Sanctum pillars
  place(17, 9, '#');  place(33, 9, '#');
  place(8, 22, '.');  place(8, 27, '.');     // ensure brainrot tiles stay floor
  place(13, 24, '#'); place(37, 24, '#');    // Wing center pillars

  // Brainrot positions
  place(25, 7, '5');   // Lirili Larila (Sanctum)
  place(8, 22, '3');   // Trippi Troppi (West top)
  place(8, 28, '4');   // Boneca (West bottom)
  place(41, 22, '2');  // Brr Brr Patapim (East top)
  place(41, 28, '1');  // Bombombini Gusini (East bottom)

  // Base
  place(25, 35, 'B');

  // Torches
  const torchPositions = [
    [15, 4], [35, 4], [15, 11], [35, 11],     // Sanctum
    [22, 12], [27, 12],                         // North-corridor mouth
    [22, 16], [27, 16],                         // North-corridor exit
    [5, 20], [21, 20],                          // West wing top
    [5, 29], [21, 29],                          // West wing bottom
    [28, 20], [45, 20],                         // East wing top
    [28, 29], [45, 29],                         // East wing bottom
    [10, 33], [42, 33],                         // Entrance corners
    [10, 37], [42, 37],
  ];
  torchPositions.forEach(([x, y]) => {
    if (map[y] && map[y][x] === '.') place(x, y, 'T');
  });

  // Axe pivots (ceiling anchors)
  const axePositions = [
    [20, 5], [30, 5],            // Sanctum
    [24, 13], [26, 14],          // North corridor
    [11, 23], [16, 26],          // West wing
    [33, 23], [38, 26],          // East wing
    [18, 35], [32, 35],          // Entrance hall
  ];
  axePositions.forEach(([x, y]) => {
    if (map[y] && map[y][x] === '.') place(x, y, 'A');
  });

  return map;
}

function buildMapL2() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));

  const place = (x, y, ch) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = ch;
  };

  // Outer cliff border (impassable rock walls around the playable area)
  for (let x = 0; x < MAP_W; x++) {
    place(x, 0, '#'); place(x, 1, '#');
    place(x, MAP_H - 1, '#'); place(x, MAP_H - 2, '#');
  }
  for (let y = 0; y < MAP_H; y++) {
    place(0, y, '#'); place(1, y, '#');
    place(MAP_W - 1, y, '#'); place(MAP_W - 2, y, '#');
  }

  // Scattered rock spire clusters across the wasteland.
  // Each entry is [centerX, centerY, sizePattern] where pattern is a small footprint.
  const spires = [
    [10, 8],  [16, 5],  [38, 6],  [44, 11],
    [7, 18],  [22, 14], [30, 13], [40, 22],
    [12, 26], [25, 25], [33, 28], [44, 30],
    [6, 33],  [18, 34], [38, 34],
  ];
  spires.forEach(([cx, cy]) => {
    place(cx, cy, '#');
    if ((cx + cy) % 2 === 0) place(cx + 1, cy, '#');
    if ((cx * 7 + cy) % 3 === 0) place(cx, cy + 1, '#');
    if ((cx + cy * 3) % 5 === 0) place(cx - 1, cy, '#');
  });

  // 5 brainrots scattered across the wasteland (open desert positions)
  place(11, 6,  '5'); // Ballerina Cappuccina (top-left clearing)
  place(35, 9,  '4'); // Frigo Camelo (top-right ridge)
  place(20, 19, '3'); // Tung Tung Tung Sahur (mid)
  place(39, 26, '2'); // Cappuccino Assassino (east)
  place(8,  28, '1'); // Bombardiro Crocodilo (south-west)

  // Base / portal — south-center
  place(25, 35, 'B');

  return map;
}

function buildMapL3() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const place = (x, y, ch) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = ch;
  };

  // Outer "abyss" border — deep dark water that walls off the playable area.
  for (let x = 0; x < MAP_W; x++) {
    place(x, 0, '#'); place(x, 1, '#');
    place(x, MAP_H - 1, '#'); place(x, MAP_H - 2, '#');
  }
  for (let y = 0; y < MAP_H; y++) {
    place(0, y, '#'); place(1, y, '#');
    place(MAP_W - 1, y, '#'); place(MAP_W - 2, y, '#');
  }

  // No coral, no kelp, no shipwreck - completely open seafloor. The chase
  // begins the moment the player leaves the base zone, with the abyss border
  // as the only thing walling in the playable area.

  // Brainrot spawns - each near cover, scattered across the map.
  place(13, 9,  '1'); // Tralalero Tralala (north-west reef)
  place(36, 10, '2'); // Abyssaloco (north-east reef)
  place(7,  23, '3'); // Bluberrinni Octopusini (mid-west kelp shadow)
  place(43, 23, '4'); // Orcalero Orcala (mid-east reef)
  place(20, 30, '5'); // Capitano Moby (south of shipwreck)

  // Base / portal — south-center
  place(25, 36, 'B');

  return map;
}

// Level 4 - volcanic biome. Default fill is 'L' (lava floor). Navigation
// is built around 2x2 stepping-stone pillars separated by single-tile
// lava gaps - the player must time jumps to hop pillar-to-pillar without
// landing in the lava (which costs a heart and scatters carried brainrots).
// Geysers erupting in the lava strips between pillars add a timing layer
// on top of the pure traversal challenge.
function buildMapL4() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('L'));
  const place = (x, y, ch) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = ch;
  };
  const platform = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) place(x, y, '.');
    }
  };
  // 2x2 stepping pillar - top-left corner at (x, y). Adjacent pillars
  // anchored 3 tiles apart give a 1-tile lava gap between them.
  const pillar = (x, y) => {
    place(x,     y,     '.');
    place(x + 1, y,     '.');
    place(x,     y + 1, '.');
    place(x + 1, y + 1, '.');
  };

  // Outer cliff border (impassable rock)
  for (let x = 0; x < MAP_W; x++) {
    place(x, 0, '#'); place(x, 1, '#');
    place(x, MAP_H - 1, '#'); place(x, MAP_H - 2, '#');
  }
  for (let y = 0; y < MAP_H; y++) {
    place(0, y, '#'); place(1, y, '#');
    place(MAP_W - 1, y, '#'); place(MAP_W - 2, y, '#');
  }

  // 3x3 brainrot rest-stop platforms (one brainrot in the center tile).
  platform(6,  5, 8,  7);   place(7,  6, '1');   // NW
  platform(23, 5, 25, 7);   place(24, 6, '2');   // N-center
  platform(40, 5, 42, 7);   place(41, 6, '3');   // NE
  platform(14, 22, 16, 24); place(15, 23, '4');  // SW-mid
  platform(33, 22, 35, 24); place(34, 23, '5');  // SE-mid

  // Big base platform (south-center) - the only generous landmass.
  platform(22, 33, 26, 36); place(24, 35, 'B');

  // ===== Stepping-stone pillar network (2x2 pillars, 1-tile lava gaps) =====
  // Each `pillar(x, y)` paints a 2x2 block. Adjacent pillars are placed 3
  // tiles apart in either axis, leaving exactly one tile of lava between
  // them - the canonical jump distance.

  // Central vertical trunk (cols 24-25): base → platform 2.
  // First pillar at rows 30-31 leaves a 1-tile lava gap (row 32) above
  // the base top edge (row 33); last pillar at rows 9-10 leaves a 1-tile
  // gap (row 8) below platform 2 (rows 5-7).
  pillar(24, 30); pillar(24, 27); pillar(24, 24); pillar(24, 21);
  pillar(24, 18); pillar(24, 15); pillar(24, 12); pillar(24, 9);

  // Mid-row branches off the junction pillar (24, 21) rows 21-22.
  // West toward platform 4 (cols 14-16): pillar(21, 21) and pillar(18, 21).
  // Final jump = pillar (18, 21) col 18 → lava col 17 → platform 4 col 16.
  pillar(21, 21); pillar(18, 21);
  // East toward platform 5 (cols 33-35): pillar(27, 21) and pillar(30, 21).
  // Final jump = pillar (30, 21) col 31 → lava col 32 → platform 5 col 33.
  pillar(27, 21); pillar(30, 21);

  // North-west chain from trunk pillar (24, 12) westward to platform 1.
  // Row 12-13 chain: pillars at cols 21, 18, 15, 12, 9, 6.
  pillar(21, 12); pillar(18, 12); pillar(15, 12); pillar(12, 12);
  pillar(9,  12); pillar(6,  12);
  // Vertical step at cols 6-7: pillar(6, 9) rows 9-10. From there the
  // player jumps north over row 8 to platform 1 (rows 5-7) — 1-tile gap.
  pillar(6, 9);

  // North-east chain mirrors the NW chain.
  pillar(27, 12); pillar(30, 12); pillar(33, 12); pillar(36, 12);
  pillar(39, 12); pillar(42, 12);
  pillar(42, 9);

  // A handful of off-axis decoy / safety pillars give the open lava rooms
  // visual variety and a few alternate paths for skilled players.
  pillar(6,  18); pillar(42, 18);   // mid-side
  pillar(9,  27); pillar(39, 27);   // SW/SE between mid platforms and base

  return map;
}

/* ============================================================================
   Levels
   ============================================================================ */

const LEVELS = {
  1: {
    id: 1,
    name: 'The Whirling Halls',
    biome: 'temple',
    bg: '#020108',
    buildMap: buildMapL1,
    brainrotIds: ['bombo', 'chimpanzini', 'meowl', 'boneca', 'fragola'],
    ultimateId: 'lirili',         // Strawberry Elephant
    hazard: 'axe',
    introHint: 'Find all 5 brainrots in the temple!',
  },
  2: {
    id: 2,
    name: 'The Falling Sky',
    biome: 'desert',
    bg: '#3a1a2a',
    buildMap: buildMapL2,
    brainrotIds: ['pancake', 'cappuccino', 'tung', 'frigo', 'ballerina'],
    ultimateId: 'bombardiro',     // Bombardiro Crocodilo
    hazard: 'meteor',
    introHint: 'Meteors are falling - watch the red zones!',
  },
  3: {
    id: 3,
    name: "The Bloop's Domain",
    biome: 'ocean',
    bg: '#03101c',
    buildMap: buildMapL3,
    brainrotIds: ['tralalero', 'abyssaloco', 'octopusini', 'orcalero', 'trippi'],
    ultimateId: 'capitano',       // Capitano Moby
    hazard: 'bloop',
    introHint: 'The Bloop wakes when you leave base - dodge mines and jellyfish!',
  },
  4: {
    id: 4,
    name: 'The Burning Below',
    biome: 'lava',
    bg: '#1a0508',
    buildMap: buildMapL4,
    brainrotIds: ['arcadragon', 'cannelloni', 'cocofanto', 'nuclearo', 'frigo'],
    ultimateId: 'hydra',          // Hydra Dragon Cannelloni
    hazard: 'lava',
    introHint: 'Stay on the stone platforms - lava burns and geysers erupt!',
  },
};

// The endgame boss. Beating L4 unlocks the lore-only "Final Battle" hook;
// the actual Los Hackers fight scene is on the roadmap (see GAME_SPEC.md).
const FINAL_BOSS_ID = 'losHackers';

/* ============================================================================
   Brainrot data
   ============================================================================ */

const BRAINROT_REGISTRY = {
  // ===== Level 1 roster =====
  bombo:       { id: 'bombo',       name: 'Bombombini Gusini',     emoji: '🦢', accent: '💣',
                 spriteKey: 'sprite_bombo' },
  chimpanzini: { id: 'chimpanzini', name: 'Chimpanzini Bananini',  emoji: '🐵', accent: '🍌',
                 spriteKey: 'sprite_chimpanzini' },
  meowl:       { id: 'meowl',       name: 'Meowl',                 emoji: '🦉', accent: '🐱',
                 spriteKey: 'sprite_meowl' },
  boneca:      { id: 'boneca',      name: 'Boneca Ambalabu',       emoji: '🐸', accent: '🛞',
                 spriteKey: 'sprite_boneca' },
  fragola:     { id: 'fragola',     name: 'Fragola La La La',      emoji: '🍓', accent: '🎶',
                 spriteKey: 'sprite_fragola' },
  // ===== Level 2 roster =====
  pancake:     { id: 'pancake',     name: 'Pancake and Syrup',     emoji: '🥞', accent: '🍯',
                 spriteKey: 'sprite_pancake' },
  cappuccino:  { id: 'cappuccino',  name: 'Cappuccino Assassino',  emoji: '☕', accent: '🥷',
                 spriteKey: 'sprite_cappuccino' },
  tung:        { id: 'tung',        name: 'Tung Tung Tung Sahur',  emoji: '🪵', accent: '🦇',
                 spriteKey: 'sprite_tung' },
  frigo:       { id: 'frigo',       name: 'Frigo Camelo',          emoji: '🧊', accent: '🐫',
                 spriteKey: 'sprite_frigo' },
  ballerina:   { id: 'ballerina',   name: 'Ballerina Cappuccina',  emoji: '🩰', accent: '☕',
                 spriteKey: 'sprite_ballerina' },
  // ===== Level 3 roster =====
  tralalero:   { id: 'tralalero',   name: 'Tralalero Tralala',     emoji: '🦈', accent: '👟',
                 spriteKey: 'sprite_tralalero' },
  abyssaloco:  { id: 'abyssaloco',  name: 'Abyssaloco',            emoji: '🐙', accent: '🪸',
                 spriteKey: 'sprite_abyssaloco' },
  octopusini:  { id: 'octopusini',  name: 'Bluberrinni Octopusini',emoji: '🫐', accent: '🐙',
                 spriteKey: 'sprite_octopusini' },
  orcalero:    { id: 'orcalero',    name: 'Orcalero Orcala',       emoji: '🐋', accent: '🌊',
                 spriteKey: 'sprite_orcalero' },
  trippi:      { id: 'trippi',      name: 'Trippi Troppi',         emoji: '🐱', accent: '🍤',
                 spriteKey: 'sprite_trippi' },
  // ===== Level 4 roster =====
  arcadragon:  { id: 'arcadragon',  name: 'Arcadragon',            emoji: '🐉', accent: '🎮',
                 spriteKey: 'sprite_arcadragon' },
  cannelloni:  { id: 'cannelloni',  name: 'Dragon Cannelloni',     emoji: '🐲', accent: '🍝',
                 spriteKey: 'sprite_cannelloni' },
  cocofanto:   { id: 'cocofanto',   name: 'Cocofanto Elefanto',    emoji: '🥥', accent: '🐘',
                 spriteKey: 'sprite_cocofanto' },
  nuclearo:    { id: 'nuclearo',    name: 'Nuclearo Dinossauro',   emoji: '🦖', accent: '☢️',
                 spriteKey: 'sprite_nuclearo' },
  // ===== Per-level ULTIMATE rewards (unlocked on level win) =====
  // The `power` metadata is shown on the level-complete pop-up and tells the
  // player what gameplay role each ultimate plays in the final boss fight.
  lirili:      { id: 'lirili',      name: 'Strawberry Elephant',   emoji: '🐘', accent: '🍓',
                 spriteKey: 'sprite_lirili',     ultimate: true,
                 power: {
                   name: 'Wail Shot',
                   description: 'Press 1 / Tap the gold button to hurl a sonic blast towards your enemy.',
                 } },
  bombardiro:  { id: 'bombardiro',  name: 'Bombardiro Crocodilo',  emoji: '🐊', accent: '✈️',
                 spriteKey: 'sprite_bombardiro', ultimate: true,
                 power: {
                   name: 'Pasta Bomb',
                   description: 'Press 2 / Tap the orange button to lob a pasta bomb towards your enemy for massive damage.',
                 } },
  capitano:    { id: 'capitano',    name: 'Capitano Moby',         emoji: '⚓', accent: '🐳',
                 spriteKey: 'sprite_capitano',   ultimate: true,
                 power: {
                   name: 'Tidal Dash',
                   description: 'Double tap in the direction you want to go to make a fast dash to escape danger.',
                 } },
  hydra:       { id: 'hydra',       name: 'Hydra Dragon Cannelloni', emoji: '🐉', accent: '🍝',
                 spriteKey: 'sprite_hydra',      ultimate: true,
                 power: {
                   name: 'Hydra Channel Beam',
                   description: 'Press 4 / press and hold the cyan button to strike your enemies with a channel beam for the largest damage points.',
                 } },
  // ===== Final boss (lore-only for now) =====
  losHackers:  { id: 'losHackers',  name: 'Los Hackers',           emoji: '👤', accent: '⚡',
                 spriteKey: 'sprite_los_hackers', boss: true },
};

function getLevelBrainrotMap(levelId) {
  const ids = LEVELS[levelId].brainrotIds;
  const map = {};
  ids.forEach((id, i) => { map[String(i + 1)] = BRAINROT_REGISTRY[id]; });
  return map;
}

function getLevelBrainrots(levelId) {
  return LEVELS[levelId].brainrotIds.map((id) => BRAINROT_REGISTRY[id]);
}

function makeBrainrotVisual(scene, x, y, data, displaySize) {
  let visual;
  if (data.spriteKey && scene.textures.exists(data.spriteKey)) {
    visual = scene.add.image(x, y, data.spriteKey).setOrigin(0.5);
    visual.setDisplaySize(displaySize, displaySize);
  } else {
    visual = scene.add.text(x, y, data.emoji + (data.accent || ''), {
      fontSize: `${Math.round(displaySize)}px`,
    }).setOrigin(0.5);
  }
  visual.baseScaleX = visual.scaleX;
  visual.baseScaleY = visual.scaleY;
  return visual;
}

function setBrainrotScale(visual, factor) {
  const bx = visual.baseScaleX ?? 1;
  const by = visual.baseScaleY ?? 1;
  visual.setScale(bx * factor, by * factor);
}

/* ----- pixel-art heart for the HUD -----
 *
 * 7x7 bitmap rendered as Phaser graphics rectangles, wrapped in a
 * Container so callers can tween scale/alpha/position uniformly (the
 * loseHeart pulse + setAlpha(0.2) on lost hearts both work just like
 * the old emoji text). Returned container exposes `.heartSize` for
 * layout calculations, and is centered around its own (0,0) origin.
 *
 * The bitmap was tuned to read clearly at 4px-per-cell (28x28 visible,
 * matching the old 26px emoji size). Pass `px:3` for a slightly smaller
 * variant used in the boss HUD.
 */
const PIXEL_HEART_PATTERN = [
  '.##.##.',
  '#######',
  '#######',
  '#######',
  '.#####.',
  '..###..',
  '...#...',
];

function makePixelHeart(scene, x, y, opts = {}) {
  const px = opts.px ?? 4;
  const fillColor = opts.color ?? 0xff4f6a;
  const shadowColor = opts.shadowColor ?? 0x4a0a18;
  const highlightColor = opts.highlightColor ?? 0xffd9e3;

  const container = scene.add.container(x, y);
  const heartW = PIXEL_HEART_PATTERN[0].length * px;
  const heartH = PIXEL_HEART_PATTERN.length * px;
  const ox = -heartW / 2;
  const oy = -heartH / 2;

  // Drop shadow (1px down-right) for some weight against bright skies.
  const shadow = scene.add.graphics();
  shadow.fillStyle(shadowColor, 0.7);
  PIXEL_HEART_PATTERN.forEach((row, r) => {
    [...row].forEach((c, ci) => {
      if (c === '#') shadow.fillRect(ox + ci * px + 1, oy + r * px + 1, px, px);
    });
  });

  // Main heart body.
  const fill = scene.add.graphics();
  fill.fillStyle(fillColor, 1);
  PIXEL_HEART_PATTERN.forEach((row, r) => {
    [...row].forEach((c, ci) => {
      if (c === '#') fill.fillRect(ox + ci * px, oy + r * px, px, px);
    });
  });

  // Two-pixel sheen on the upper-left lobe so the heart reads round.
  const hi = scene.add.graphics();
  hi.fillStyle(highlightColor, 0.85);
  [[1, 1], [2, 1]].forEach(([cx, cy]) => {
    hi.fillRect(ox + cx * px, oy + cy * px, px, px);
  });

  container.add([shadow, fill, hi]);
  container.heartSize = { w: heartW, h: heartH };
  return container;
}

/* ============================================================================
   Dev / prod mode toggle

   Flip DEV_MODE to `false` before sharing the GitHub Pages URL with family.
   In dev mode the title screen ignores progression and shows ALL level pills
   plus the boss pill regardless of save state - useful for jumping into any
   level / the boss to test changes. In prod mode the title screen reads
   LocalStorage and only shows pills the player has actually unlocked.

   The save itself is always written/read regardless of DEV_MODE; dev mode
   just doesn't gate visibility on it. That way you can play through to
   verify progression, then flip the flag and confirm prod-mode looks right.
   ============================================================================ */

const DEV_MODE = true;

/* ============================================================================
   Save state (LocalStorage, single slot per browser)

   Persists between sessions so replaying L1->L4->Boss isn't required every
   time the player opens the page. Single shared slot per browser is the
   simplest fit for family-share - no slot picker UI, no cloud sync.

   Schema (v1):
   {
     schemaVersion: 1,
     lastClearedLevel: 0..4,        // 0 = nothing cleared yet
     bossDefeated:    boolean,
     unlockedUltimates: string[],   // brainrot ids
     introSeen:       boolean,      // true once the v0.6.3 narrative intro played
     lastUpdatedAt:   number,       // Date.now() at last write
   }

   Defensive read drops unknown brainrot ids if the roster ever changes
   (e.g. a level gets renamed mid-development), so a stale save can't
   crash the title screen.
   ============================================================================ */

const SAVE_KEY = 'survive-fire-brainrots:save:v1';
const SAVE_SCHEMA_VERSION = 1;

const SaveState = {
  _default() {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      lastClearedLevel: 0,
      bossDefeated: false,
      unlockedUltimates: [],
      introSeen: false,
      lastUpdatedAt: 0,
    };
  },

  read() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this._default();
      const parsed = JSON.parse(raw);
      const knownUltimates = new Set(
        Object.values(LEVELS).map((lv) => lv.ultimateId).filter(Boolean),
      );
      return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        lastClearedLevel: Math.max(0, Math.min(4, Number(parsed?.lastClearedLevel) || 0)),
        bossDefeated: parsed?.bossDefeated === true,
        unlockedUltimates: Array.isArray(parsed?.unlockedUltimates)
          ? parsed.unlockedUltimates.filter((id) => knownUltimates.has(id))
          : [],
        introSeen: parsed?.introSeen === true,
        lastUpdatedAt: Number(parsed?.lastUpdatedAt) || 0,
      };
    } catch (e) {
      console.warn('[SaveState] read failed, returning defaults:', e);
      return this._default();
    }
  },

  write(patch) {
    const next = {
      ...this.read(),
      ...patch,
      lastUpdatedAt: Date.now(),
      schemaVersion: SAVE_SCHEMA_VERSION,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[SaveState] write failed:', e);
    }
    return next;
  },

  recordLevelCleared(levelId, ultimateId) {
    const cur = this.read();
    const ults = new Set(cur.unlockedUltimates);
    if (ultimateId) ults.add(ultimateId);
    return this.write({
      lastClearedLevel: Math.max(cur.lastClearedLevel, levelId),
      unlockedUltimates: Array.from(ults),
    });
  },

  recordBossDefeat() {
    return this.write({ bossDefeated: true });
  },

  recordIntroSeen() {
    return this.write({ introSeen: true });
  },

  reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn('[SaveState] reset failed:', e);
    }
    return this._default();
  },
};

/* ============================================================================
   Sfx + Tts
   ============================================================================ */

const Sfx = {
  ctx: null,
  _droneNodes: null,  // active dread drone (oscillator handles, see playDreadDrone)
  init() {
    if (!this.ctx) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new Ctx();
      } catch (e) { /* noop */ }
    }
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(type) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const presets = {
      pickup:  { freq: 660, end: 990,  dur: 0.16, type: 'sine',     vol: 0.18 },
      deposit: { freq: 440, end: 220,  dur: 0.30, type: 'triangle', vol: 0.20 },
      hit:     { freq: 200, end: 60,   dur: 0.25, type: 'sawtooth', vol: 0.22 },
      portal:  { freq: 330, end: 880,  dur: 0.50, type: 'sine',     vol: 0.20 },
      win:     { freq: 523, end: 1046, dur: 0.80, type: 'triangle', vol: 0.22 },
    };
    const p = presets[type] || presets.pickup;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.end), t0 + p.dur);
    gain.gain.setValueAtTime(p.vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + p.dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + p.dur);
  },
  // Single bird chirp - high-pitched, short, slight pitch sweep with
  // randomized parameters so a stream of these reads as natural ambience
  // rather than a robotic ping. Used by IntroScene's bird loop.
  chirp() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const dur = 0.07 + Math.random() * 0.09;
    const startFreq = 2400 + Math.random() * 1800;
    // 60% chance of an upward chirp, 40% downward, gives variety
    const endFreq = startFreq * (Math.random() < 0.6
      ? (1.10 + Math.random() * 0.20)
      : (0.78 + Math.random() * 0.18));
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.linearRampToValueAtTime(endFreq, t0 + dur);
    const peak = 0.045 + Math.random() * 0.035;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  },
  // Sustained low-frequency dread drone for the Los Hackers approach.
  // Two slightly detuned saw waves through a low-pass filter give the
  // thick "something is wrong" pad. fadeInMs/durationMs let the caller
  // shape attack and total length; stopDreadDrone() can also cut early.
  playDreadDrone({ durationMs = 5000, fadeInMs = 400, fadeOutMs = 700 } = {}) {
    if (!this.ctx) return;
    this.stopDreadDrone();
    const t0 = this.ctx.currentTime;
    const totalSec = durationMs / 1000;
    const fadeInSec = fadeInMs / 1000;
    const fadeOutSec = fadeOutMs / 1000;
    const fundFreq = 55; // ~A1
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const o3 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    o1.type = 'sawtooth'; o1.frequency.setValueAtTime(fundFreq, t0);
    o2.type = 'sawtooth'; o2.frequency.setValueAtTime(fundFreq * 1.012, t0); // 12-cent detune
    o3.type = 'sine';     o3.frequency.setValueAtTime(fundFreq * 1.5, t0);   // perfect fifth pad
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t0);
    filter.Q.setValueAtTime(2, t0);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + fadeInSec);
    gain.gain.linearRampToValueAtTime(0.18, t0 + Math.max(fadeInSec, totalSec - fadeOutSec));
    gain.gain.linearRampToValueAtTime(0, t0 + totalSec);

    o1.connect(filter); o2.connect(filter); o3.connect(filter);
    filter.connect(gain).connect(this.ctx.destination);
    o1.start(t0); o2.start(t0); o3.start(t0);
    o1.stop(t0 + totalSec); o2.stop(t0 + totalSec); o3.stop(t0 + totalSec);

    this._droneNodes = { o1, o2, o3, gain, endsAt: t0 + totalSec };
  },
  stopDreadDrone() {
    if (!this.ctx || !this._droneNodes) return;
    const { o1, o2, o3, gain } = this._droneNodes;
    const t = this.ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);
      o1.stop(t + 0.27);
      o2.stop(t + 0.27);
      o3.stop(t + 0.27);
    } catch (e) { /* nodes may have already ended */ }
    this._droneNodes = null;
  },
  // Cheerful chiptune loop for the true-ending dance party. Two voices:
  // a square-wave melody bouncing through a G-major arpeggio motif, plus
  // a triangle-wave bass walking root/fifth. Each "bar" is scheduled
  // ~150ms before the previous one ends so the loop is gapless. Stopping
  // is best-effort: notes already scheduled in the audio graph play out
  // their tail (which is short - eighth notes), but no new bars get
  // queued. Pass volume 0.05-0.15 for tasteful background levels.
  playHappyLoop({ volume = 0.10 } = {}) {
    if (!this.ctx) return;
    this.stopHappyLoop();

    // G major scale frequencies (Hz). Hand-rolled rather than computed
    // so the table is greppable and easy to tweak.
    const F = {
      G2: 98.00,  D3: 146.83, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, FS4: 369.99, G4: 392.00,
      A4: 440.00, B4: 493.88,
    };

    // 16-step pattern at 0.20s per step = ~150 BPM eighth notes.
    // 0 = rest. Two-bar phrase that resolves back to the I chord.
    const MEL = [
      F.G3, 0,    F.B3, 0,    F.D4, 0,    F.G4, 0,
      F.E4, 0,    F.D4, 0,    F.B3, 0,    F.D4, 0,
      F.A3, 0,    F.C4, 0,    F.D4, 0,    F.G4, 0,
      F.A4, F.G4, F.E4, 0,    F.D4, 0,    F.G3, 0,
    ];
    // Bass holds each root for 4 steps (half note) in the alternating
    // I - V pattern that gives major-key songs their lift.
    const BASS = [
      F.G2, 0,    0,    0,    F.D3, 0,    0,    0,
      F.G2, 0,    0,    0,    F.D3, 0,    0,    0,
      F.D3, 0,    0,    0,    F.G2, 0,    0,    0,
      F.D3, 0,    0,    0,    F.G2, 0,    0,    0,
    ];

    const STEP_SEC = 0.20;
    const BAR_SEC  = STEP_SEC * MEL.length;

    this._happyLoopActive = true;
    this._happyLoopVolume = volume;
    let nextStart = this.ctx.currentTime + 0.05;

    const scheduleBar = () => {
      if (!this._happyLoopActive || !this.ctx) return;
      const t0 = nextStart;
      for (let i = 0; i < MEL.length; i++) {
        const t = t0 + i * STEP_SEC;
        // Melody: square wave for that chiptune bite. 85% step length so
        // notes have a tiny gap (staccato bounce).
        if (MEL[i]) this._scheduleHappyNote(t, MEL[i], STEP_SEC * 0.85, 'square', volume * 0.55);
        // Bass: triangle wave (mellow), held longer for sustain feel.
        if (BASS[i]) this._scheduleHappyNote(t, BASS[i], STEP_SEC * 1.6, 'triangle', volume);
      }
      nextStart += BAR_SEC;
      const wait = (nextStart - this.ctx.currentTime - 0.15) * 1000;
      this._happyLoopTimer = setTimeout(scheduleBar, Math.max(50, wait));
    };
    scheduleBar();
  },
  _scheduleHappyNote(t, freq, dur, type, vol) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },
  stopHappyLoop() {
    if (this._happyLoopTimer) {
      clearTimeout(this._happyLoopTimer);
      this._happyLoopTimer = null;
    }
    this._happyLoopActive = false;
  },
  // Discordant cluster sting - root + minor 9th + tritone, descending.
  // Plays once on Los Hackers' first appearance to punch the moment.
  playDreadSting() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const dur = 1.1;
    const freqs = [220.00, 233.08, 311.13]; // A3, A#3, D#4 (root + b9 + tritone)
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t0);
      osc.frequency.exponentialRampToValueAtTime(f * 0.92, t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.08, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    });
  },
};

const Tts = {
  italianVoice: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      this.italianVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('it')) || null;
    };
    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;
  },
  speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'it-IT';
      u.rate = 1.1;
      u.volume = 1.0;
      if (this.italianVoice) u.voice = this.italianVoice;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  },
  // Narrate is the English counterpart of speak() - used by the v0.6.3
  // narrative intro / outro cards. We deliberately don't pin a voice (let
  // the browser pick its default English voice) and slow the rate slightly
  // so the storybook lines feel deliberate rather than rushed.
  narrate(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.95;
      u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  },
  cancel() {
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
  },
};

/* ============================================================================
   Touch button registry

   Bypasses Phaser's per-camera input plumbing so HUD buttons hit-test
   directly in canvas-pixel space. Why we need this: the gameplay scenes
   run three cameras (skybox / zoomed gameplay / unzoomed UI) and call
   `cameras.main.setZoom(1.6)`. Even with `setScrollFactor(0)` plus
   `cameras.main.ignore(button)`, on iPad we observed the visible button
   ending up offset from its hit zone (taps to the LEFT of the JUMP
   button were registering as hits, taps in the visible center were not).
   Reproducing the exact Phaser internals is fragile and varies by
   version - so instead, every touch button registers a pure
   x/y/hit-shape entry here, and one global `pointerdown` listener
   compares pointer.x/pointer.y (which Phaser always reports in
   canvas-pixel space, already inverse of Scale.FIT) against those
   entries. No camera transform, no ignore() plumbing, no zoom math.

   Bonus: the registry exposes `contains(pointer)` so the virtual
   joystick can refuse to start a drag on the same tap that just
   activated a HUD button (matters for slot 4 / Hydra at x=442, which
   sits inside the joystick's left-60% drag region).
   ============================================================================ */

class TouchButtonRegistry {
  constructor(scene) {
    this.scene = scene;
    this.buttons = [];
    this._heldByPointer = new Map();

    scene.input.on('pointerdown', this._onPointerDown, this);
    scene.input.on('pointerup', this._onPointerUp, this);
    scene.input.on('pointerupoutside', this._onPointerUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this._onPointerDown, this);
      scene.input.off('pointerup', this._onPointerUp, this);
      scene.input.off('pointerupoutside', this._onPointerUp, this);
      this.buttons.length = 0;
      this._heldByPointer.clear();
    });
  }

  // def: { x, y, shape: 'circle'|'rect', hitR?, w?, h?, onTap, onRelease? }
  add(def) { this.buttons.push(def); return def; }

  contains(pointer) {
    for (const b of this.buttons) {
      if (this._hit(b, pointer.x, pointer.y)) return true;
    }
    return false;
  }

  _hit(b, x, y) {
    if (b.shape === 'rect') {
      return Math.abs(x - b.x) <= b.w / 2 && Math.abs(y - b.y) <= b.h / 2;
    }
    const dx = x - b.x;
    const dy = y - b.y;
    return (dx * dx + dy * dy) <= b.hitR * b.hitR;
  }

  _onPointerDown(pointer) {
    for (const b of this.buttons) {
      if (this._hit(b, pointer.x, pointer.y)) {
        b.onTap?.(pointer);
        if (b.onRelease) this._heldByPointer.set(pointer.id, b);
        return;
      }
    }
  }

  _onPointerUp(pointer) {
    const b = this._heldByPointer.get(pointer.id);
    if (!b) return;
    this._heldByPointer.delete(pointer.id);
    b.onRelease(pointer);
  }
}

/* ============================================================================
   Virtual joystick (mobile)
   ============================================================================ */

class VirtualJoystick {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.pointerId = null;
    this.startX = 0; this.startY = 0;
    this.currentX = 0; this.currentY = 0;
    this.maxRadius = 70;

    // Invisible joystick: drag anywhere on the left 60% of the screen to
    // move. We intentionally don't render the touch-down ring or the
    // gold thumb dot - they were obscuring the player avatar on phones.
    // The drag math (getVector) is identical to a visualised joystick.

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }
  onDown(p) {
    if (this.active) return;
    // Defer to HUD touch buttons: if this tap landed on JUMP / an ability
    // slot, don't also start a joystick drag. Slot 4 (Hydra) is at x=442
    // which is inside the left-60% region, so the registry check is the
    // only thing keeping a hold-to-channel tap from also yanking the
    // player around.
    if (this.scene.touchButtons?.contains(p)) return;
    if (p.x > this.scene.scale.width * 0.6) return;
    this.active = true;
    this.pointerId = p.id;
    this.startX = p.x; this.startY = p.y;
    this.currentX = p.x; this.currentY = p.y;
  }
  onMove(p) {
    if (!this.active || p.id !== this.pointerId) return;
    let dx = p.x - this.startX;
    let dy = p.y - this.startY;
    const d = Math.hypot(dx, dy);
    if (d > this.maxRadius) { dx = (dx / d) * this.maxRadius; dy = (dy / d) * this.maxRadius; }
    this.currentX = this.startX + dx;
    this.currentY = this.startY + dy;
  }
  onUp(p) {
    if (p.id !== this.pointerId) return;
    this.active = false;
    this.pointerId = null;
  }
  getVector() {
    if (!this.active) return { x: 0, y: 0 };
    return {
      x: (this.currentX - this.startX) / this.maxRadius,
      y: (this.currentY - this.startY) / this.maxRadius,
    };
  }
}

/* ============================================================================
   Viewport refresh helper

   iOS Safari changes the visible viewport in three sneaky ways:
   1. URL bar shows / hides as the user scrolls or interacts.
   2. orientationchange fires BEFORE layout has settled.
   3. bfcache restore (pageshow) resumes the page without firing resize.

   Whenever the visible viewport changes shape, Phaser's cached canvas-
   bounding-rect goes stale, and pointer math + canvas size start
   drifting. This helper wires every event that can reshape the visible
   area to a single `scale.refresh()` call, plus a defensive 80 ms
   delayed refresh to catch orientationchange that fires before layout
   has settled.

   Using a free function keeps it identical across TitleScene / GameScene
   / BossScene; previously only the gameplay scenes had this and the
   title screen would render the canvas oversized at first paint.
   ============================================================================ */

function bindViewportRefresh(scene) {
  const handler = () => scene.scale.refresh();
  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);
  window.addEventListener('pageshow', handler);
  // visualViewport.resize is THE event for iOS URL-bar show/hide. Plain
  // window.resize doesn't always fire for those transitions, which is
  // how the title screen ended up with the canvas overflowing the
  // visible area on iPhone landscape.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handler);
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
    window.removeEventListener('pageshow', handler);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handler);
    }
  });
  scene.time.delayedCall(80, () => {
    if (scene.scene.isActive()) scene.scale.refresh();
  });
}

/* ============================================================================
   Boot Scene
   ============================================================================ */

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.on('loaderror', (file) => {
      console.warn(`[Sprite missing] key="${file.key}" path="${file.src}" — update the this.load.image() call in game.js or restore the file in assets/sprites/`);
    });
    // Level 1 - Temple roster
    this.load.image('sprite_bombo',       'assets/sprites/Bombombini_Gusini.png');
    this.load.image('sprite_chimpanzini', 'assets/sprites/ChimpanziniBananini.png');
    this.load.image('sprite_meowl',       'assets/sprites/Meowl.png');
    this.load.image('sprite_boneca',      'assets/sprites/Boneca_Ambalabu.png');
    this.load.image('sprite_fragola',     'assets/sprites/Fragola_La_La_La.png');
    // Level 2 - Falling Sky roster
    this.load.image('sprite_pancake',     'assets/sprites/Pancake_and_Syrup.png');
    this.load.image('sprite_cappuccino',  'assets/sprites/Cappuccino_Assassino.png');
    this.load.image('sprite_tung',        'assets/sprites/Tung_Tung_Tung_Sahur.png');
    this.load.image('sprite_frigo',       'assets/sprites/FrigoCamelo.png');
    this.load.image('sprite_ballerina',   'assets/sprites/Ballerina_cappucina.png');
    // Level 3 - Bloop's Domain roster
    this.load.image('sprite_tralalero',   'assets/sprites/TralaleroTralala.png');
    this.load.image('sprite_abyssaloco',  'assets/sprites/Abyssaloco.png');
    this.load.image('sprite_octopusini',  'assets/sprites/BluberrinniOctopusini.png');
    this.load.image('sprite_orcalero',    'assets/sprites/Orcalero_Orcala.png');
    this.load.image('sprite_trippi',      'assets/sprites/Trippi_Troppi.png');
    // Level 4 - Burning Below roster
    this.load.image('sprite_arcadragon',  'assets/sprites/Arcadragon.png');
    this.load.image('sprite_cannelloni',  'assets/sprites/Dragon_Cannelloni.png');
    this.load.image('sprite_cocofanto',   'assets/sprites/Cocofanto.png');
    this.load.image('sprite_nuclearo',    'assets/sprites/Nuclearo_Dinossauro.png');
    // (frigo already loaded above; reused on L4)
    // Per-level ULTIMATE rewards - unlocked on level win, currently cosmetic.
    this.load.image('sprite_lirili',      'assets/sprites/ULTIMATE_L1_Strawberryelephant.png');
    this.load.image('sprite_bombardiro',  'assets/sprites/ULTIMATE_L2_Bombardiro_Crocodilo.png');
    this.load.image('sprite_capitano',    'assets/sprites/ULTIMATE_L3_Capitano_Moby.png');
    this.load.image('sprite_hydra',       'assets/sprites/ULTIMATE_L4_Hydra_Dragon_Cannelloni.png');
    // Final boss (lore-only for now - the actual boss arena scene is TBD).
    this.load.image('sprite_los_hackers', 'assets/sprites/ULTIMATE_BATTLE_Los_Hackers.png');
    // The Bloop - level 3 hunter
    this.load.image('sprite_bloop',       'assets/sprites/Bloop2.png');
    // Player avatars. boy_avatar is the default for L1, L2, L4 + Boss; the
    // ocean level (L3) swaps in boy_scuba for the underwater theme.
    this.load.image('sprite_player_boy',       'assets/sprites/boy_avatar.png');
    this.load.image('sprite_player_boy_scuba', 'assets/sprites/boy_scuba.png');
  }
  create() {
    Tts.init();
    this.scene.start('Intro');
  }
}

/* ============================================================================
   Intro Scene (v0.6.3)

   Plays once on first launch (gated by SaveState.introSeen) so the player
   gets a short narrative setup before the title screen: idyllic forest,
   brainrots having fun, sky darkens, Los Hackers descends, brainrots
   scatter, hero rises - "Bring them home." Then drops to the Title.

   Skippable after a 1500ms grace window with any tap / key. The skip path
   and the natural-completion path both write `introSeen: true` to save
   state so subsequent loads bypass the cinematic. Dev mode and the title
   screen's "replay intro" link both pass `{ force: true }` to bypass the
   gate without clearing the flag.

   Implementation notes:
   - Visuals are drawn directly with Phaser.Graphics (no atlas / no new
     assets) - skybox / floor / scatter / trees mirror the BossScene forest
     vocabulary so the world reads as the same place where the boss lives.
   - Zelda-style typewriter cards: a full-screen dim overlay plus a bold
     gold-cream serif text in a bordered dialog box at the bottom of the
     screen. Text reveals letter-by-letter at 35 ms/char, lingers, then
     fades. No TTS - the player reads at their own pace.
   ============================================================================ */

class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  create(data) {
    bindViewportRefresh(this);
    Tts.init();

    // Gate: skip straight to Title if we've already played the intro and
    // the caller didn't explicitly force a replay. DEV_MODE always plays.
    const save = SaveState.read();
    const force = data?.force === true;
    if (save.introSeen && !DEV_MODE && !force) {
      this.scene.start('Title');
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#1a0f1f');
    this.introEnded = false;
    this._sceneStartedAt = this.time.now;
    this.scheduledCalls = [];
    // Card display objects (dim overlay + dialog box + text + typer
    // TimerEvent). Pushed by showZeldaCard, drained on skip/shutdown so
    // a partially-typed card can't survive into the title scene.
    this.activeCardObjects = [];

    // Audio context. On the very first page load some browsers (Safari
    // iOS especially) won't actually start audio until a user gesture,
    // so the ambient bird loop may be silent until the player taps to
    // skip - but on every replay-from-title the gesture has already
    // happened and birds + drone work normally.
    Sfx.init();
    Sfx.resume();

    /* ----- forest skybox ----- */
    const sky = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      const r = Math.floor(120 + (1 - t) * 80);
      const gr = Math.floor(170 + (1 - t) * 40);
      const b = Math.floor(190 - t * 60);
      sky.fillStyle((r << 16) | (gr << 8) | b, 1);
      sky.fillRect(0, y, W, 4);
    }
    sky.fillStyle(0xfff5c4, 0.10);
    for (let i = 0; i < 6; i++) {
      const x = (W / 6) * i + 30;
      sky.fillTriangle(x, 0, x - 40, H, x + 40, H);
    }

    /* ----- distant tree band ----- */
    const treeBand = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const cx = (W / 8) * i + 45;
      const cy = H * 0.55;
      treeBand.fillStyle(0x3a2616, 1);
      treeBand.fillRect(cx - 8, cy - 2, 16, 36);
      treeBand.fillStyle(0x1f4a14, 1);
      treeBand.fillCircle(cx, cy - 28, 32);
      treeBand.fillCircle(cx - 18, cy - 20, 24);
      treeBand.fillCircle(cx + 18, cy - 20, 24);
      treeBand.fillStyle(0x2f6a1c, 1);
      treeBand.fillCircle(cx - 6, cy - 34, 18);
      treeBand.fillCircle(cx + 10, cy - 32, 16);
    }

    /* ----- grass floor ----- */
    const floor = this.add.graphics();
    floor.fillStyle(0x2a4a1a, 1);
    floor.fillRect(0, H * 0.55, W, H * 0.45);
    floor.fillStyle(0x1f3a14, 0.55);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.56), H);
      const r = Phaser.Math.Between(20, 60);
      floor.fillCircle(x, y, r);
    }

    /* ----- foreground scatter (ferns / mushrooms / grass tufts) ----- */
    const scatter = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.58), H - 10);
      const kind = Math.random();
      if (kind < 0.55) {
        scatter.lineStyle(2, 0x6db84a, 0.85);
        scatter.lineBetween(x - 3, y + 4, x - 3, y - 2);
        scatter.lineBetween(x,     y + 4, x,     y - 4);
        scatter.lineBetween(x + 3, y + 4, x + 3, y - 1);
      } else if (kind < 0.85) {
        scatter.fillStyle(0x4a8c2e, 0.85);
        scatter.fillCircle(x, y, 4);
        scatter.fillCircle(x + 4, y - 1, 3);
        scatter.fillCircle(x - 4, y - 1, 3);
      } else {
        scatter.fillStyle(0xfff8e8, 1);
        scatter.fillRect(x - 1, y, 2, 4);
        scatter.fillStyle(0xc8323a, 1);
        scatter.fillCircle(x, y, 3);
      }
    }

    /* ----- happy brainrots in the foreground ----- */
    // Sample 10 across the four levels so the opening visually hints at
    // the full roster you're about to meet. Each one bobs idly.
    const sampleIds = [
      'bombo', 'chimpanzini', 'meowl', 'boneca', 'fragola',
      'pancake', 'tralalero', 'octopusini', 'arcadragon', 'cocofanto',
    ];
    this.brainrotSprites = sampleIds.map((id, i) => {
      const dataItem = BRAINROT_REGISTRY[id];
      const t = i / (sampleIds.length - 1);
      const x = 70 + t * (W - 140) + Phaser.Math.Between(-14, 14);
      const y = H * 0.66 + Phaser.Math.Between(-10, 28);
      const v = makeBrainrotVisual(this, x, y, dataItem, 46);
      v._homeY = y;
      v._bobTween = this.tweens.add({
        targets: v, y: y - 8,
        duration: 600 + i * 80,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      return v;
    });

    /* ----- twinkly sparkles (idyllic vibe) ----- */
    this.sparkleG = this.add.graphics();
    this.sparkles = [];
    for (let i = 0; i < 16; i++) {
      this.sparkles.push({
        x: Phaser.Math.Between(40, W - 40),
        y: Phaser.Math.Between(80, Math.round(H * 0.55)),
        twinkle: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    /* ----- crimson "darkness" overlay (alpha=0 until beat 2) ----- */
    this.darkOverlay = this.add.graphics();
    this.darkOverlay.fillStyle(0x4a0a18, 1);
    this.darkOverlay.fillRect(0, 0, W, H);
    this.darkOverlay.setAlpha(0);
    this.darkOverlay.setDepth(50);

    /* ----- skip hint (revealed after the grace window) ----- */
    this.skipGraceMs = 1500;
    this.skipHint = this.add.text(W - 12, H - 10, 'tap / press any key to skip ▸', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px', color: '#ffffffaa',
    }).setOrigin(1, 1).setAlpha(0).setDepth(10000);

    const skip = () => {
      if (this.introEnded) return;
      if (this.time.now - this._sceneStartedAt < this.skipGraceMs) return;
      this.endIntro();
    };
    this.input.on('pointerdown', () => { Sfx.resume(); skip(); });
    this.input.keyboard.on('keydown', skip);

    this.scheduledCalls.push(this.time.delayedCall(this.skipGraceMs, () => {
      if (this.introEnded || !this.skipHint?.scene) return;
      this.tweens.add({ targets: this.skipHint, alpha: 1, duration: 400 });
    }));

    /* ============================
       Beat schedule
       ============================ */

    // Beat 0 (immediate): start ambient bird loop for the idyllic phase
    this.startBirdAmbience();

    // Beat 1 (t=400): Card 1 - "Long ago, the brainrots lived in peace."
    this.scheduledCalls.push(this.time.delayedCall(400, () => {
      if (this.introEnded) return;
      this.showZeldaCard('Long ago, the brainrots lived in peace…');
    }));

    // Beat 2 (t=4500): Birds cut, sky darkens, dread drone fades in
    this.scheduledCalls.push(this.time.delayedCall(4500, () => {
      if (this.introEnded) return;
      this.stopBirdAmbience();
      this.tweens.add({
        targets: this.darkOverlay,
        alpha: 0.55,
        duration: 700, ease: 'Quad.easeIn',
      });
      this.cameras.main.shake(700, 0.005);
      Sfx.play('hit');
      // Drone runs from sky-darken through the rest of the cinematic so
      // the dread carries through Card 2 + scatter + Card 3.
      Sfx.playDreadDrone({ durationMs: 6500, fadeInMs: 500, fadeOutMs: 800 });
    }));

    // Beat 3 (t=5200): Los Hackers descends + Card 2 + dread sting on landing
    this.scheduledCalls.push(this.time.delayedCall(5200, () => {
      if (this.introEnded) return;
      let lh;
      if (this.textures.exists('sprite_los_hackers')) {
        // Match the boss-fight display size so the silhouette reads as
        // "the same enormous threat you'll face later" rather than a
        // little floating villain icon.
        lh = this.add.image(W / 2, -160, 'sprite_los_hackers')
          .setDisplaySize(BOSS_DISPLAY_W, BOSS_DISPLAY_H);
      } else {
        lh = this.add.text(W / 2, -160, '👤⚡', { fontSize: '96px' }).setOrigin(0.5);
      }
      lh.setDepth(60);
      this.losHackersSprite = lh;
      // Land in the lower half so it doesn't collide with the dialog
      // box that now lives at the top of the screen.
      this.tweens.add({
        targets: lh,
        y: H * 0.42,
        duration: 900,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          if (this.introEnded) return;
          this.cameras.main.shake(500, 0.015);
          Sfx.play('hit');
          Sfx.playDreadSting();
          // Sinister pulsing scale on the boss silhouette
          const baseSx = lh.scaleX;
          const baseSy = lh.scaleY;
          this.tweens.add({
            targets: lh,
            scaleX: baseSx * 1.06, scaleY: baseSy * 1.06,
            duration: 420,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        },
      });
      this.showZeldaCard('Until Los Hackers came.');
    }));

    // Beat 4 (t=6300): Brainrots scatter to the corners and fade
    this.scheduledCalls.push(this.time.delayedCall(6300, () => {
      if (this.introEnded) return;
      this.brainrotSprites.forEach((b, i) => {
        if (b._bobTween) b._bobTween.stop();
        const dx = (b.x < W / 2)
          ? -120 - Math.random() * 90
          : 120 + Math.random() * 90;
        const dy = -50 - Math.random() * 70;
        this.tweens.add({
          targets: b,
          x: b.x + dx,
          y: b.y + dy,
          alpha: 0.18,
          angle: Phaser.Math.Between(-30, 30),
          duration: 1100,
          delay: i * 55,
          ease: 'Quad.easeOut',
        });
      });
      Sfx.play('hit');
    }));

    // Beat 5 (t=8100): Hero rises + Card 3
    this.scheduledCalls.push(this.time.delayedCall(8100, () => {
      if (this.introEnded) return;
      let hero;
      if (this.textures.exists('sprite_player_boy')) {
        hero = this.add.image(W / 2, H * 0.82, 'sprite_player_boy').setDisplaySize(70, 70);
      } else {
        hero = this.add.text(W / 2, H * 0.82, '🏃', { fontSize: '56px' }).setOrigin(0.5);
      }
      hero.setAlpha(0);
      hero.setDepth(70);
      this.heroSprite = hero;
      this.tweens.add({
        targets: hero, alpha: 1, y: H * 0.74,
        duration: 700, ease: 'Quad.easeOut',
      });
      this.showZeldaCard('Help the brainrots.');
    }));

    // Beat 6 (t=10800): End the cinematic and route to Title
    this.scheduledCalls.push(this.time.delayedCall(10800, () => {
      this.endIntro();
    }));

    // Bookkeeping cleanup if the scene shuts down for any other reason
    // (e.g. dev hot-reload). Without this, dangling listeners on the
    // input plugin would survive and double-fire on re-entry, and any
    // playing dread drone would carry into the title scene.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Tts.cancel();
      Sfx.stopDreadDrone();
      this._birdLoopActive = false;
      this.input?.removeAllListeners?.();
      this.input?.keyboard?.removeAllListeners?.();
    });
  }

  // Ambient bird chirps for the idyllic phase. Each iteration plays one
  // or a 2-3 chirp cluster, then schedules the next iteration. The loop
  // self-cancels via `_birdLoopActive` so endIntro / sky-darken can stop
  // it cleanly without leaving a dangling timer firing chirps over the
  // dread drone.
  startBirdAmbience() {
    this._birdLoopActive = true;
    const scheduleNext = () => {
      if (!this._birdLoopActive || this.introEnded) return;
      const isCluster = Math.random() < 0.35;
      if (isCluster) {
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const c = this.time.delayedCall(i * (60 + Math.random() * 80), () => {
            if (this._birdLoopActive && !this.introEnded) Sfx.chirp();
          });
          this.scheduledCalls.push(c);
        }
      } else {
        Sfx.chirp();
      }
      const nextDelay = 600 + Math.random() * 1000;
      this._birdEvent = this.time.delayedCall(nextDelay, scheduleNext);
      this.scheduledCalls.push(this._birdEvent);
    };
    scheduleNext();
  }

  stopBirdAmbience() {
    this._birdLoopActive = false;
    if (this._birdEvent) {
      this._birdEvent.remove(false);
      this._birdEvent = null;
    }
  }

  // Zelda-style narrative card: dim overlay + small bordered dialog box
  // at the TOP of the screen + bold cream-gold pixel-style text revealed
  // letter-by-letter (typewriter at 60ms/char, slower for readability).
  // No TTS - the user reads at their own pace, then it fades and the
  // visual beat keeps playing.
  showZeldaCard(text) {
    const W = this.scale.width;
    const H = this.scale.height;

    const CHAR_DELAY_MS = 60;
    const LINGER_MS     = 1100;
    const FADE_MS       = 380;

    // Subtle dim vignette so the card text is always legible regardless
    // of which beat is on screen behind it.
    const dim = this.add.graphics().setDepth(9999);
    dim.fillStyle(0x000000, 0.55);
    dim.fillRect(0, 0, W, H);
    dim.setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 1, duration: 280, ease: 'Quad.easeOut' });

    // Top-anchored dialog box with gold-cream double border.
    const boxW = Math.min(560, W * 0.86);
    const boxH = 80;
    const boxCx = W / 2;
    const boxCy = H * 0.13;
    const box = this.add.graphics().setDepth(10000);
    box.fillStyle(0x0a0610, 0.94);
    box.fillRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    box.lineStyle(3, 0xfde58c, 0.95);
    box.strokeRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    // Inner thin gold rim for depth
    box.lineStyle(1, 0xffe066, 0.55);
    box.strokeRoundedRect(boxCx - boxW / 2 + 5, boxCy - boxH / 2 + 5, boxW - 10, boxH - 10, 6);
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 280, ease: 'Quad.easeOut' });

    const card = this.add.text(boxCx, boxCy, '', {
      // Pixel-art font (loaded via Google Fonts in index.html). Falls
      // back to bold serif if the network blocks the request.
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#fde58c',
      stroke: '#1a0a08',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: boxW - 36 },
    }).setOrigin(0.5).setDepth(10001).setAlpha(0);
    card.setShadow(2, 2, '#3a2410', 3, true, true);
    this.tweens.add({ targets: card, alpha: 1, duration: 280 });

    // Letter-by-letter reveal
    let i = 0;
    const typer = this.time.addEvent({
      delay: CHAR_DELAY_MS,
      repeat: text.length - 1,
      callback: () => {
        i++;
        if (card?.scene) card.setText(text.slice(0, i));
      },
    });

    // Fade the whole card out together after the linger
    const lingerEnd = text.length * CHAR_DELAY_MS + LINGER_MS;
    const fadeTween = this.tweens.add({
      targets: [dim, box, card],
      alpha: 0,
      delay: lingerEnd,
      duration: FADE_MS,
      onComplete: () => {
        dim.destroy();
        box.destroy();
        card.destroy();
        if (typer) typer.remove(false);
        this.activeCardObjects = this.activeCardObjects.filter(
          (o) => o !== dim && o !== box && o !== card && o !== typer && o !== fadeTween,
        );
      },
    });

    this.activeCardObjects.push(dim, box, card, typer, fadeTween);
    return lingerEnd + FADE_MS;
  }

  update(_time, delta) {
    if (this.introEnded) return;
    if (this.sparkleG && this.sparkles) {
      this.sparkleG.clear();
      this.sparkles.forEach((s) => {
        s.twinkle += (delta || 16) * 0.004;
        const a = 0.4 + Math.sin(s.twinkle) * 0.5;
        if (a > 0) {
          this.sparkleG.fillStyle(0xfff5c4, Math.max(0, a));
          this.sparkleG.fillCircle(s.x, s.y, 1.5);
        }
      });
    }
  }

  endIntro() {
    if (this.introEnded) return;
    this.introEnded = true;
    this.stopBirdAmbience();
    Sfx.stopDreadDrone();
    Tts.cancel();
    this.scheduledCalls.forEach((c) => c?.remove(false));
    this.scheduledCalls = [];
    // Tear down any in-flight Zelda card (graphics, text, typer event,
    // fade tween) explicitly. tweens.killAll() below would prevent the
    // fadeTween's onComplete from firing, so without this the card
    // graphics would zombie into the title scene.
    if (this.activeCardObjects) {
      this.activeCardObjects.forEach((o) => {
        if (!o) return;
        if (typeof o.destroy === 'function') o.destroy();
        else if (typeof o.remove === 'function') o.remove(false);
      });
      this.activeCardObjects = [];
    }
    this.tweens.killAll();
    SaveState.recordIntroSeen();
    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(550, () => this.scene.start('Title'));
  }
}

/* ============================================================================
   Title Scene
   ============================================================================ */

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    // Force the canvas to fit the actual visible viewport before we lay
    // out any UI. Without this, iOS Safari first-paint with the URL bar
    // showing was reporting #game-container as URL-bar-hidden tall, the
    // canvas was sized to that taller rect, and the bottom of the title
    // (level pills, BOSS dev pill, drag-hint text) fell behind the
    // browser chrome. bindViewportRefresh also re-fires on every chrome
    // show/hide / orientation flip / bfcache restore.
    bindViewportRefresh(this);

    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a0f1f');

    /* ----- forest background (matches the intro environment so the
       title visually leads into the narrative) ----- */
    this.drawForestBackground(W, H);

    /* ----- title (Press Start 2P pixel font, two lines) ----- */
    this.add.text(W / 2, H * 0.15, 'SURVIVE FIRE', {
      fontFamily: '"Press Start 2P", Impact, Charcoal, sans-serif',
      fontSize: '28px', color: '#ffe066',
      stroke: '#1a0f1f', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.27, 'FOR BRAINROTS', {
      fontFamily: '"Press Start 2P", Impact, Charcoal, sans-serif',
      fontSize: '28px', color: '#ff6b9d',
      stroke: '#1a0f1f', strokeThickness: 6,
    }).setOrigin(0.5);

    /* ----- launch helpers (used by buttons + keyboard shortcuts) ----- */
    const save = SaveState.read();

    this._launch = (levelId) => {
      Sfx.init(); Sfx.resume(); Sfx.play('portal');
      this.scene.start('Game', { levelId });
    };

    this._launchBoss = () => {
      Sfx.init(); Sfx.resume(); Sfx.play('portal');
      // Boss expects a full kit in `allDeposited`. In prod mode the player
      // earned all four ultimates by clearing L4, so we could pass exactly
      // their save - but stitching in every collectible brainrot too means
      // the WinScene roster lights up correctly post-victory regardless of
      // how the player got here. Same payload as the old dev-only shortcut.
      const allUltimates = Object.values(LEVELS)
        .map((lv) => lv.ultimateId)
        .filter(Boolean);
      const allBrainrots = Object.values(LEVELS).flatMap((lv) => lv.brainrotIds);
      this.scene.start('Boss', {
        allDeposited: [...new Set([...allUltimates, ...allBrainrots])],
      });
    };

    /* ----- view containers (toggled by showView) ----- */
    this.mainMenuContainer = this.add.container(0, 0);
    this.optionsContainer  = this.add.container(0, 0);
    this.goodbyeContainer  = this.add.container(0, 0);

    this.allPills = this.buildAllPillsDef(save);
    this.buildMainMenuView(W, H);
    this.buildOptionsView(W, H);
    this.buildGoodbyeView(W, H);

    this.showView('main');

    /* ----- persistent footer (visible on main + options) ----- */
    this.buildFooter(W, H);

    /* ----- keyboard shortcuts (work from main + options) ----- */
    this.bindKeyboardShortcuts();
  }

  /* ----- forest backdrop (same vocabulary as IntroScene) ----- */
  drawForestBackground(W, H) {
    const sky = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      const r = Math.floor(120 + (1 - t) * 80);
      const gr = Math.floor(170 + (1 - t) * 40);
      const b = Math.floor(190 - t * 60);
      sky.fillStyle((r << 16) | (gr << 8) | b, 1);
      sky.fillRect(0, y, W, 4);
    }
    sky.fillStyle(0xfff5c4, 0.10);
    for (let i = 0; i < 6; i++) {
      const x = (W / 6) * i + 30;
      sky.fillTriangle(x, 0, x - 40, H, x + 40, H);
    }

    const treeBand = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const cx = (W / 8) * i + 45;
      const cy = H * 0.55;
      treeBand.fillStyle(0x3a2616, 1);
      treeBand.fillRect(cx - 8, cy - 2, 16, 36);
      treeBand.fillStyle(0x1f4a14, 1);
      treeBand.fillCircle(cx, cy - 28, 32);
      treeBand.fillCircle(cx - 18, cy - 20, 24);
      treeBand.fillCircle(cx + 18, cy - 20, 24);
      treeBand.fillStyle(0x2f6a1c, 1);
      treeBand.fillCircle(cx - 6, cy - 34, 18);
      treeBand.fillCircle(cx + 10, cy - 32, 16);
    }

    const floor = this.add.graphics();
    floor.fillStyle(0x2a4a1a, 1);
    floor.fillRect(0, H * 0.55, W, H * 0.45);
    floor.fillStyle(0x1f3a14, 0.55);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.56), H);
      const r = Phaser.Math.Between(20, 60);
      floor.fillCircle(x, y, r);
    }

    const scatter = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.58), H - 10);
      const kind = Math.random();
      if (kind < 0.55) {
        scatter.lineStyle(2, 0x6db84a, 0.85);
        scatter.lineBetween(x - 3, y + 4, x - 3, y - 2);
        scatter.lineBetween(x,     y + 4, x,     y - 4);
        scatter.lineBetween(x + 3, y + 4, x + 3, y - 1);
      } else if (kind < 0.85) {
        scatter.fillStyle(0x4a8c2e, 0.85);
        scatter.fillCircle(x, y, 4);
        scatter.fillCircle(x + 4, y - 1, 3);
        scatter.fillCircle(x - 4, y - 1, 3);
      } else {
        scatter.fillStyle(0xfff8e8, 1);
        scatter.fillRect(x - 1, y, 2, 4);
        scatter.fillStyle(0xc8323a, 1);
        scatter.fillCircle(x, y, 3);
      }
    }

    // Subtle twinkly sparkles in the canopy / sky for some life. We use
    // a static set (no per-frame update on the title screen) - one tween
    // per sparkle keeps the cost bounded.
    for (let i = 0; i < 14; i++) {
      const sx = Phaser.Math.Between(40, W - 40);
      const sy = Phaser.Math.Between(80, Math.round(H * 0.55));
      const s = this.add.graphics();
      s.fillStyle(0xfff5c4, 0.7);
      s.fillCircle(sx, sy, 1.5);
      s.setAlpha(0.3);
      this.tweens.add({
        targets: s, alpha: 0.95,
        duration: 800 + i * 90,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  /* ----- pixel-style menu button ----- */
  makePixelButton(x, y, label, opts = {}) {
    const BTN_W   = opts.width  ?? 280;
    const BTN_H   = opts.height ?? 54;
    const fontPx  = opts.fontSize ?? '14px';
    const accent  = opts.accent ?? 0xfde58c;     // border + hover fill
    const dim     = opts.dim    ?? 0x0a0610;     // resting fill
    const textCol = opts.color  ?? '#fde58c';

    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? accent : dim, hover ? 1 : 0.92);
      bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 8);
      bg.lineStyle(3, accent, 1);
      bg.strokeRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 8);
      bg.lineStyle(1, 0xffe066, 0.55);
      bg.strokeRoundedRect(-BTN_W / 2 + 5, -BTN_H / 2 + 5, BTN_W - 10, BTN_H - 10, 6);
    };
    drawBg(false);

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: fontPx,
      color: textCol,
      stroke: '#1a0a08',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(BTN_W, BTN_H);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { drawBg(true); text.setColor('#1a0a08'); });
    btn.on('pointerout',  () => { drawBg(false); text.setColor(textCol); });
    btn.on('pointerdown', () => { if (opts.onClick) opts.onClick(); });

    return btn;
  }

  /* ----- main menu view (Start Game / Options / Exit) ----- */
  buildMainMenuView(W, H) {
    const c = this.mainMenuContainer;
    const startBtn = this.makePixelButton(W / 2, H * 0.50, 'START GAME', {
      onClick: () => {
        // "Start Game" = play from the beginning. In dev mode this still
        // works as a quick L1 launch.
        this._launch(1);
      },
    });
    const optsBtn = this.makePixelButton(W / 2, H * 0.64, 'OPTIONS', {
      onClick: () => this.showView('options'),
    });
    const exitBtn = this.makePixelButton(W / 2, H * 0.78, 'EXIT', {
      // Browsers block window.close() on user-opened tabs (which is how
      // most family members will visit), so the click shows a graceful
      // goodbye screen instead of failing silently.
      onClick: () => this.showView('goodbye'),
    });
    c.add([startBtn, optsBtn, exitBtn]);
  }

  /* ----- options view (level select, mirrors the old pill row) ----- */
  buildOptionsView(W, H) {
    const c = this.optionsContainer;

    // Subtitle
    const subtitle = this.add.text(W / 2, H * 0.40, 'SELECT A LEVEL', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '14px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setOrigin(0.5);
    const hint = this.add.text(W / 2, H * 0.46,
      'WASD / arrows to move \u00b7 drag the left side on mobile', {
        fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#dddddd',
      }).setOrigin(0.5);
    c.add([subtitle, hint]);

    // Level pills (existing styling preserved)
    const visiblePills = this.allPills.filter((p) => p.unlocked);
    const PILL_W = 144;
    const PILL_H = 76;
    const PILL_GAP = 14;
    const pillY = H * 0.62;
    const rowW = visiblePills.length * PILL_W
      + Math.max(0, visiblePills.length - 1) * PILL_GAP;
    const rowStartX = W / 2 - rowW / 2 + PILL_W / 2;
    visiblePills.forEach((def, i) => {
      const x = rowStartX + i * (PILL_W + PILL_GAP);
      const pill = this.makeLevelPill(x, pillY, def, PILL_W, PILL_H);
      c.add(pill);
    });

    // Back button at the bottom
    const backBtn = this.makePixelButton(W / 2, H * 0.85, '\u2190 BACK', {
      width: 180, height: 44, fontSize: '12px',
      onClick: () => this.showView('main'),
    });
    c.add(backBtn);
  }

  /* ----- pill (level / boss) ----- */
  makeLevelPill(xCenter, yCenter, def, PILL_W, PILL_H) {
    const btn = this.add.container(xCenter, yCenter);
    const bg = this.add.graphics();
    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? def.color : 0x1a0f1f, 1);
      bg.fillRoundedRect(-PILL_W / 2, -PILL_H / 2, PILL_W, PILL_H, 12);
      bg.lineStyle(3, hover ? 0xffe066 : def.color, 1);
      bg.strokeRoundedRect(-PILL_W / 2, -PILL_H / 2, PILL_W, PILL_H, 12);
    };
    drawBg(false);

    const isBoss = def.kind === 'boss';
    const tag = this.add.text(0, -22, isBoss ? 'FINAL BATTLE' : `LEVEL ${def.id}`, {
      fontFamily: '"Press Start 2P", Impact, Charcoal, sans-serif',
      fontSize: isBoss ? '9px' : '10px',
      color: isBoss ? '#ffd54a' : '#ffe066',
    }).setOrigin(0.5);
    const name = this.add.text(0, 4, def.label, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '11px', color: '#ffffff',
      align: 'center', wordWrap: { width: PILL_W - 16, useAdvancedWrap: true },
    }).setOrigin(0.5);
    const hintText = isBoss ? 'Press B' : `Press ${def.id}`;
    const hint = this.add.text(0, 26, hintText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px', color: '#aaaaaa',
    }).setOrigin(0.5);

    btn.add([bg, tag, name, hint]);
    btn.setSize(PILL_W, PILL_H);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      drawBg(true);
      tag.setColor('#1a0f1f');
      name.setColor('#1a0f1f');
      hint.setColor('#1a0f1f');
    });
    btn.on('pointerout', () => {
      drawBg(false);
      tag.setColor(isBoss ? '#ffd54a' : '#ffe066');
      name.setColor('#ffffff');
      hint.setColor('#aaaaaa');
    });
    btn.on('pointerdown', () => {
      if (isBoss) this._launchBoss();
      else this._launch(def.id);
    });

    this.tweens.add({
      targets: btn, scale: 1.04,
      duration: 1100 + (typeof def.id === 'number' ? def.id * 80 : 480),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    return btn;
  }

  buildAllPillsDef(save) {
    return [
      { kind: 'level', id: 1, label: 'The Whirling Halls', color: 0x9c6bff,
        unlocked: DEV_MODE || save.lastClearedLevel + 1 >= 1 },
      { kind: 'level', id: 2, label: 'The Falling Sky',    color: 0xff7a3a,
        unlocked: DEV_MODE || save.lastClearedLevel + 1 >= 2 },
      { kind: 'level', id: 3, label: "The Bloop's Domain", color: 0x1fa5c8,
        unlocked: DEV_MODE || save.lastClearedLevel + 1 >= 3 },
      { kind: 'level', id: 4, label: 'The Burning Below',  color: 0xff4a18,
        unlocked: DEV_MODE || save.lastClearedLevel + 1 >= 4 },
      { kind: 'boss',  id: 'boss', label: 'Los Hackers',   color: 0xff3a3a,
        unlocked: DEV_MODE || save.lastClearedLevel >= 4 },
    ];
  }

  /* ----- goodbye view (Exit button destination) ----- */
  buildGoodbyeView(W, H) {
    const c = this.goodbyeContainer;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.92);
    overlay.fillRect(0, 0, W, H);
    const headline = this.add.text(W / 2, H * 0.42, 'THANKS\nFOR PLAYING.', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '22px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 4,
      align: 'center', lineSpacing: 12,
    }).setOrigin(0.5);
    const note = this.add.text(W / 2, H * 0.62, 'You can close this tab now.', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px', color: '#cccccc',
    }).setOrigin(0.5);
    const longLive = this.add.text(W / 2, H * 0.74, 'long live the brainrots.', {
      fontFamily: 'Georgia, serif', fontStyle: 'italic',
      fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);
    // Quiet Back-to-title affordance, just in case the player changed
    // their mind. Pixel font, dim, bottom-left so it doesn't feel like
    // the primary path.
    const back = this.add.text(W / 2, H * 0.86, '\u2190 back', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#fde58c'));
    back.on('pointerout',  () => back.setColor('#888888'));
    back.on('pointerdown', () => this.showView('main'));
    c.add([overlay, headline, note, longLive, back]);
  }

  /* ----- footer (replay intro + dev hint, persists on main + options) ----- */
  buildFooter(W, H) {
    // Small pixel-font "replay intro" link in the bottom-left. Bypasses
    // the introSeen gate via { force: true }.
    const replayLink = this.add.text(8, H - 4, '\u25B8 replay intro', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '9px', color: '#cccccc',
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true }).setDepth(50);
    replayLink.on('pointerover', () => replayLink.setColor('#ffe066'));
    replayLink.on('pointerout',  () => replayLink.setColor('#cccccc'));
    replayLink.on('pointerdown', () => {
      this.scene.start('Intro', { force: true });
    });
    this.replayLink = replayLink;

    if (DEV_MODE) {
      this.devHint = this.add.text(W - 8, H - 4,
        'dev: Shift+1..4 first-clear modal \u00b7 Alt+Shift+1..4 replay modal \u00b7 B boss \u00b7 clear save: localStorage.removeItem("'
          + SAVE_KEY + '")',
        { fontFamily: 'system-ui', fontSize: '9px', color: '#5a4f6a' }
      ).setOrigin(1, 1).setDepth(50);
    }
  }

  /* ----- view switching ----- */
  showView(name) {
    this.currentView = name;
    if (this.mainMenuContainer) this.mainMenuContainer.setVisible(name === 'main');
    if (this.optionsContainer)  this.optionsContainer.setVisible(name === 'options');
    if (this.goodbyeContainer)  this.goodbyeContainer.setVisible(name === 'goodbye');
    // Footer fades out on the goodbye screen (it's the end of the journey).
    const showFooter = name !== 'goodbye';
    if (this.replayLink) this.replayLink.setVisible(showFooter);
    if (this.devHint)    this.devHint.setVisible(showFooter);
  }

  /* ----- keyboard shortcuts ----- */
  bindKeyboardShortcuts() {
    const launchIfUnlocked = (levelId) => {
      const def = this.allPills.find((p) => p.id === levelId);
      if (def?.unlocked) this._launch(levelId);
    };
    // Space / Enter on main menu = Start Game (L1).
    this.input.keyboard.once('keydown-SPACE', () => {
      if (this.currentView === 'goodbye') return;
      launchIfUnlocked(1);
    });
    this.input.keyboard.once('keydown-ENTER', () => {
      if (this.currentView === 'goodbye') return;
      launchIfUnlocked(1);
    });
    // ESC: from options -> main, from goodbye -> main, from main -> no-op.
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.currentView === 'options') this.showView('main');
      else if (this.currentView === 'goodbye') this.showView('main');
    });
    // Number key launches that level. Shift + number opens the level-complete
    // MODAL preview without playing the level (dev convenience).
    const launchModalPreview = (levelId, mode) => {
      Sfx.init(); Sfx.resume(); Sfx.play('portal');
      this.scene.start('Game', { levelId, previewModal: true, previewMode: mode });
    };
    const numberHandler = (id) => (e) => {
      if (this.currentView === 'goodbye') return;
      if (e?.shiftKey) launchModalPreview(id, e.altKey ? 'replay' : 'first-clear');
      else this._launch(id);
    };
    this.input.keyboard.on('keydown-ONE',   numberHandler(1));
    this.input.keyboard.on('keydown-TWO',   numberHandler(2));
    this.input.keyboard.on('keydown-THREE', numberHandler(3));
    this.input.keyboard.on('keydown-FOUR',  numberHandler(4));
    this.input.keyboard.on('keydown-B', () => {
      if (this.currentView === 'goodbye') return;
      const bossDef = this.allPills.find((p) => p.kind === 'boss');
      if (bossDef?.unlocked) this._launchBoss();
    });
  }
}

/* ============================================================================
   GameScene
   ============================================================================ */

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create(data) {
    Sfx.init(); Sfx.resume();

    // Multi-touch: Phaser 3 only registers 1 active touch by default, which
    // means a player dragging the joystick with their left thumb couldn't
    // also tap the JUMP / ability buttons with their right thumb - the
    // second touch would be silently dropped. addPointer(2) reserves two
    // extra pointer slots so the player can hold the joystick AND tap a
    // button (or two buttons) simultaneously. Critical for L4 pillar-to-
    // pillar jumps which require movement + jump in the same instant.
    this.input.addPointer(2);

    bindViewportRefresh(this);

    // Phaser destroys non-main cameras on scene shutdown but the references
    // on `this` persist - null them out so setupCameras() builds fresh ones
    // on every level start / restart.
    this.skyCamera = null;
    this.uiCamera = null;
    // Same for the addedtoscene listener: if it survived the previous scene
    // run, it could call .ignore() on destroyed cameras and silently break
    // the new scene's render. Clear all listeners on this event before re-
    // registering inside setupCameras().
    this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE);

    this.levelId = data?.levelId ?? 1;
    this.levelConfig = LEVELS[this.levelId];
    this.biome = this.levelConfig.biome;
    this.levelBrainrotMap = getLevelBrainrotMap(this.levelId);
    this.levelBrainrots = getLevelBrainrots(this.levelId);
    this.allDeposited = data?.allDeposited ?? [];
    // Dev preview flag: when true, skip straight to the level-complete modal
    // without playing the level. "Proceed" returns to the title screen so the
    // user can flip through every level's modal in seconds. previewMode picks
    // which layout to show: 'first-clear' (default) renders saved-line + two
    // buttons; 'replay' renders single "Back to main" with replay copy.
    this.isModalPreview = data?.previewModal === true;
    this.previewMode = this.isModalPreview ? (data?.previewMode || 'first-clear') : null;

    this.cameras.main.setBackgroundColor(this.levelConfig.bg);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this.map = this.levelConfig.buildMap();
    this.deposited = new Set(data?.deposited ?? []);
    this.hearts = data?.hearts ?? STARTING_HEARTS;
    if (this.hearts <= 0) this.hearts = STARTING_HEARTS;
    this.invincibleUntil = 0;
    this.portalActive = false;
    this.portalActivatedAt = 0;
    this.gameOver = false;

    this.drawSkybox();
    this.drawFloor();
    this.collectStaticEntities();
    this.drawWalls();
    this.createWallColliders();
    this.createTorches();
    this.createOceanAmbience();
    this.createLavaAmbience();
    this.createBase();
    this.createBrainrots();
    this.applyDepositedState();
    this.createHazards();
    this.createPlayer();

    this.physics.add.collider(this.player, this.wallsGroup);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(50, 40);
    this.cameras.main.setZoom(GAME_ZOOM);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.input.keyboard.on('keydown-SPACE', () => this.tryJump(this.time.now));
    // Touch-button registry MUST be created before VirtualJoystick so the
    // joystick's onDown can call `this.touchButtons.contains(p)` to skip
    // taps that landed on a HUD button. Order also matters for listener
    // dispatch: registry registers its pointerdown listener first, so its
    // _onPointerDown fires before joystick.onDown - meaning by the time
    // the joystick checks `contains`, any onTap callbacks have already run.
    this.touchButtons = new TouchButtonRegistry(this);
    this.joystick = new VirtualJoystick(this);
    this.createJumpButton();

    this.createLighting();
    this.createHUD();

    this.setupCameras();

    if (this.isModalPreview) {
      // Pre-populate `deposited` with this level's brainrots so triggerWin
      // counts them as collected, then jump straight to the modal. The level
      // briefly flashes behind the modal backdrop (78% opaque) but it doesn't
      // matter for preview purposes.
      this.deposited = new Set(this.levelConfig.brainrotIds);
      this.time.delayedCall(50, () => {
        if (!this.scene.isActive()) return;
        this.triggerWin();
      });
    } else {
      this.flashText(`LEVEL ${this.levelId}: ${this.levelConfig.name.toUpperCase()}`, 1500);
      this.time.delayedCall(1500, () => {
        if (!this.gameOver) this.flashText(this.levelConfig.introHint, 1600);
      });
    }
  }

  /* ----- camera setup -----
   * Three layered cameras keep the gameplay zoomed-in while screen-locked
   * elements (skybox + HUD) render at 1:1:
   *
   *   1. skyCamera  - back layer (zoom 1, no scroll). Renders the biome
   *      skybox graphics so they fill the whole screen instead of getting
   *      stretched by the gameplay zoom.
   *   2. cameras.main - middle layer, zoomed gameplay camera that follows
   *      the player. Renders all world objects (floor, walls, brainrots,
   *      hazards, etc.).
   *   3. uiCamera - top layer (zoom 1, no scroll). Renders HUD, joystick,
   *      jump button, level banner, and L1 lighting overlay.
   *
   * Routing rule:
   *   - scrollFactor != 0    -> world (cameras.main)
   *   - scrollFactor == 0 + depth <  0 -> background (skyCamera)
   *   - scrollFactor == 0 + depth >= 0 -> HUD (uiCamera)
   *
   * A scene-level addedtoscene listener auto-partitions objects added later
   * (hazard sprites, flash text, etc.) on the next tick.
   */
  setupCameras() {
    if (this.uiCamera) return;

    this.skyCamera = this.cameras.add(0, 0, GAME_W, GAME_H);
    this.skyCamera.setScroll(0, 0);
    this.skyCamera.setBackgroundColor('rgba(0,0,0,0)');

    this.uiCamera = this.cameras.add(0, 0, GAME_W, GAME_H);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setBackgroundColor('rgba(0,0,0,0)');

    // Cameras render in array order. We need [sky, main, ui] so the skybox
    // sits underneath the gameplay layer. add() always appends, so move the
    // sky camera to the front of the list.
    const list = this.cameras.cameras;
    const skyIdx = list.indexOf(this.skyCamera);
    if (skyIdx > 0) {
      list.splice(skyIdx, 1);
      list.unshift(this.skyCamera);
    }

    const partition = (obj) => {
      if (!obj || !obj.scene) return;
      const screenLocked =
        obj.scrollFactorX === 0 && obj.scrollFactorY === 0;
      if (!screenLocked) {
        // World object - main cam only.
        this.skyCamera.ignore(obj);
        this.uiCamera.ignore(obj);
        return;
      }
      const depth = obj.depth ?? 0;
      if (depth < 0) {
        // Screen-locked background (skybox, ambience streaks, etc.).
        this.cameras.main.ignore(obj);
        this.uiCamera.ignore(obj);
      } else {
        // Screen-locked HUD/foreground (joystick, jump btn, hearts, banner,
        // lighting darkness, etc.).
        this.cameras.main.ignore(obj);
        this.skyCamera.ignore(obj);
      }
    };

    this.children.list.forEach(partition);

    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, (obj) => {
      // Defer one tick so any chained .setScrollFactor(0) has run before we
      // decide which camera the object belongs to.
      this.time.delayedCall(0, () => partition(obj));
    });
  }

  /* ----- map parsing ----- */

  collectStaticEntities() {
    this.brainrotSpawns = {};
    this.torchSpawns = [];
    this.axeSpawns = [];
    this.baseSpawn = { x: tx(25), y: tx(35) };

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = this.map[y][x];
        if (ch in this.levelBrainrotMap) {
          this.brainrotSpawns[ch] = { x, y, data: this.levelBrainrotMap[ch] };
        } else if (ch === 'T') {
          this.torchSpawns.push({ x, y });
        } else if (ch === 'A') {
          this.axeSpawns.push({ x, y });
        } else if (ch === 'B') {
          this.baseSpawn = { x: tx(x), y: tx(y) };
        }
      }
    }
  }

  createHazards() {
    if (this.levelConfig.hazard === 'axe') {
      this.createAxes();
      this.meteors = [];
    } else if (this.levelConfig.hazard === 'meteor') {
      this.createMeteorSystem();
      this.axes = [];
    } else if (this.levelConfig.hazard === 'bloop') {
      this.createBloopSystem();
      this.axes = [];
      this.meteors = [];
    } else if (this.levelConfig.hazard === 'lava') {
      this.createLavaSystem();
      this.axes = [];
      this.meteors = [];
    }
  }

  /* ----- floor rendering ----- */

  drawSkybox() {
    if (this.biome === 'desert') {
      this.drawDuskSkybox();
    } else if (this.biome === 'ocean') {
      this.drawOceanSkybox();
    } else if (this.biome === 'lava') {
      this.drawLavaSkybox();
    }
  }

  drawDuskSkybox() {
    const skyG = this.add.graphics().setDepth(-2000).setScrollFactor(0);
    const W = this.scale.width;
    const H = this.scale.height;
    const stops = [
      [0x4a1f3a, 0.0],
      [0x8a2c43, 0.35],
      [0xd9633a, 0.62],
      [0xf2a35a, 0.85],
      [0xffd28a, 1.0],
    ];
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const lerpColor = (c1, c2, t) => {
      const r = lerp((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
      const g = lerp((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
      const b = lerp(c1 & 0xff, c2 & 0xff, t);
      return (r << 16) | (g << 8) | b;
    };
    for (let y = 0; y < H; y += 2) {
      const t = y / H;
      let i = 0;
      while (i < stops.length - 1 && stops[i + 1][1] < t) i++;
      const tt = (t - stops[i][1]) / Math.max(0.0001, stops[i + 1][1] - stops[i][1]);
      skyG.fillStyle(lerpColor(stops[i][0], stops[i + 1][0], tt), 1);
      skyG.fillRect(0, y, W, 2);
    }
    for (let i = 0; i < 6; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(20, Math.floor(H * 0.45));
      const len = Phaser.Math.Between(40, 90);
      const streak = this.add.graphics().setDepth(-1999).setScrollFactor(0);
      streak.lineStyle(2, 0xffd9a0, 0.85);
      streak.lineBetween(sx, sy, sx - len * 0.85, sy + len);
      streak.lineStyle(1, 0xffae5a, 0.5);
      streak.lineBetween(sx + 1, sy + 2, sx - len * 0.7, sy + len * 0.9);
    }
  }

  drawOceanSkybox() {
    // Deep-water vignette as a screen-space backdrop. The actual seafloor and
    // walls are drawn in world-space, but this gives the camera edges a
    // "looking up at the surface" feel and frames the level moodily.
    const W = this.scale.width;
    const H = this.scale.height;
    const skyG = this.add.graphics().setDepth(-2000).setScrollFactor(0);

    // Vertical gradient: bright surface up top, deep abyss at the bottom.
    const stops = [
      [0x1b6a92, 0.0],
      [0x0e4870, 0.32],
      [0x062f4f, 0.62],
      [0x031c33, 1.0],
    ];
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const lerpColor = (c1, c2, t) => {
      const r = lerp((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
      const g = lerp((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
      const b = lerp(c1 & 0xff, c2 & 0xff, t);
      return (r << 16) | (g << 8) | b;
    };
    for (let y = 0; y < H; y += 2) {
      const t = y / H;
      let i = 0;
      while (i < stops.length - 1 && stops[i + 1][1] < t) i++;
      const tt = (t - stops[i][1]) / Math.max(0.0001, stops[i + 1][1] - stops[i][1]);
      skyG.fillStyle(lerpColor(stops[i][0], stops[i + 1][0], tt), 1);
      skyG.fillRect(0, y, W, 2);
    }

    // Surface wave shimmer along the very top of the screen.
    const shimmer = this.add.graphics().setDepth(-1999).setScrollFactor(0);
    shimmer.fillStyle(0x9bd9ee, 0.15);
    shimmer.fillRect(0, 0, W, 12);
    shimmer.fillStyle(0xc0e8f6, 0.25);
    for (let i = 0; i < W; i += 6) {
      const wy = 4 + Math.sin(i * 0.15) * 2;
      shimmer.fillRect(i, wy, 4, 2);
    }
  }

  drawLavaSkybox() {
    const skyG = this.add.graphics().setDepth(-2000).setScrollFactor(0);
    const W = this.scale.width;
    const H = this.scale.height;
    // Volcanic dusk - dark red gradient with charcoal smoke at top.
    const stops = [
      { y: 0,        color: 0x0a0103 },
      { y: H * 0.18, color: 0x2a0408 },
      { y: H * 0.40, color: 0x4a0a0a },
      { y: H * 0.62, color: 0x6a1a08 },
      { y: H * 0.82, color: 0x8a2a08 },
      { y: H,        color: 0xb04018 },
    ];
    const bandH = 4;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      const segments = Math.ceil((b.y - a.y) / bandH);
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(a.color),
          Phaser.Display.Color.IntegerToColor(b.color),
          1, t,
        );
        const col = (c.r << 16) | (c.g << 8) | c.b;
        skyG.fillStyle(col, 1);
        skyG.fillRect(0, a.y + s * bandH, W, bandH + 1);
      }
    }
    // Drifting smoke clouds high in the sky
    const smoke = this.add.graphics().setDepth(-1980).setScrollFactor(0);
    smoke.fillStyle(0x1a0a08, 0.45);
    for (let i = 0; i < 8; i++) {
      const cx = (i / 8) * W + Math.random() * 60;
      const cy = H * 0.10 + Math.random() * H * 0.18;
      smoke.fillEllipse(cx, cy, 140, 28);
    }
    smoke.fillStyle(0x2a1408, 0.30);
    for (let i = 0; i < 6; i++) {
      const cx = Math.random() * W;
      const cy = H * 0.05 + Math.random() * H * 0.12;
      smoke.fillEllipse(cx, cy, 100, 20);
    }
    // Distant ember sparks high in the sky
    const sparkG = this.add.graphics().setDepth(-1970).setScrollFactor(0);
    sparkG.fillStyle(0xffaa44, 0.5);
    for (let i = 0; i < 30; i++) {
      sparkG.fillCircle(
        Math.random() * W,
        Math.random() * H * 0.45,
        Math.random() * 1.2 + 0.4,
      );
    }
  }

  drawFloor() {
    const g = this.add.graphics().setDepth(-1000);
    if (this.biome === 'desert') {
      this.drawDesertFloor(g);
    } else if (this.biome === 'ocean') {
      this.drawOceanFloor(g);
    } else if (this.biome === 'lava') {
      this.drawLavaFloor(g);
    } else {
      this.drawTempleFloor(g);
    }
  }

  drawTempleFloor(g) {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = this.map[y][x];
        if (ch !== '#') {
          const checker = (x + y) % 2 === 0;
          g.fillStyle(checker ? 0x33252e : 0x2c1e26, 1);
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
          if (((x * 7 + y * 13) % 17) === 0) {
            g.fillStyle(0x3e2c34, 1);
            g.fillRect(x * TILE + 4, y * TILE + 4, 4, 4);
          }
          g.lineStyle(1, 0x1f1218, 0.6);
          g.strokeRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
  }

  drawDesertFloor(g) {
    // Pass 1: solid uniform sand base across all walkable tiles (no checkerboard)
    g.fillStyle(0xc89564, 1);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '#') {
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }

    // Pass 2: large soft dunes - lighter sand patches as ellipses
    const lightDunes = [
      [tx(8),  tx(10), 360, 110],
      [tx(28), tx(8),  420, 130],
      [tx(15), tx(22), 380, 120],
      [tx(38), tx(18), 340, 100],
      [tx(10), tx(33), 300, 90],
      [tx(36), tx(32), 360, 110],
    ];
    g.fillStyle(0xddae7f, 0.5);
    lightDunes.forEach(([cx, cy, w, h]) => g.fillEllipse(cx, cy, w, h));

    // Pass 3: deeper-shadow dune dips - slightly darker patches
    const darkDunes = [
      [tx(18), tx(15), 260, 80],
      [tx(32), tx(25), 300, 90],
      [tx(8),  tx(20), 200, 60],
      [tx(42), tx(8),  220, 70],
    ];
    g.fillStyle(0xa97a4d, 0.32);
    darkDunes.forEach(([cx, cy, w, h]) => g.fillEllipse(cx, cy, w, h));

    // Pass 4: very sparse cracks (organic, drawn as curved-ish chains across multiple tiles)
    const cracks = [
      [tx(6),  tx(14), tx(11), tx(17)],
      [tx(20), tx(6),  tx(26), tx(9)],
      [tx(33), tx(19), tx(38), tx(22)],
      [tx(15), tx(29), tx(22), tx(31)],
      [tx(28), tx(33), tx(34), tx(36)],
    ];
    g.lineStyle(1, 0x7a4f25, 0.4);
    cracks.forEach(([x1, y1, x2, y2]) => {
      const mx = (x1 + x2) / 2 + Phaser.Math.Between(-12, 12);
      const my = (y1 + y2) / 2 + Phaser.Math.Between(-8, 8);
      g.lineBetween(x1, y1, mx, my);
      g.lineBetween(mx, my, x2, y2);
    });

    // Pass 5: scattered pebbles - very few, organic spacing
    const pebbleCount = 32;
    for (let i = 0; i < pebbleCount; i++) {
      const px = Phaser.Math.Between(2 * TILE, (MAP_W - 2) * TILE);
      const py = Phaser.Math.Between(2 * TILE, (MAP_H - 2) * TILE);
      const tileX = Math.floor(px / TILE);
      const tileY = Math.floor(py / TILE);
      if (this.map[tileY] && this.map[tileY][tileX] === '#') continue;
      g.fillStyle(0x7a5230, 0.65);
      g.fillCircle(px, py, 2.5);
      g.fillStyle(0x5e3d20, 0.55);
      g.fillCircle(px + 1, py + 1, 1.5);
    }
  }

  drawOceanFloor(g) {
    // Solid turquoise sand base, washed in soft cyan light from above.
    g.fillStyle(0x2c7385, 1);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '#') {
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }

    // Lighter sandy patches (sun-lit clearings on the seabed)
    const lightPatches = [
      [tx(10), tx(11), 360, 110],
      [tx(28), tx(8),  420, 130],
      [tx(20), tx(22), 380, 120],
      [tx(38), tx(18), 340, 100],
      [tx(12), tx(31), 300, 90],
      [tx(36), tx(31), 360, 110],
    ];
    g.fillStyle(0x4f9aac, 0.45);
    lightPatches.forEach(([cx, cy, w, h]) => g.fillEllipse(cx, cy, w, h));

    // Deeper, darker shadow basins
    const darkPatches = [
      [tx(18), tx(15), 260, 80],
      [tx(32), tx(25), 300, 90],
      [tx(8),  tx(20), 200, 60],
      [tx(42), tx(8),  220, 70],
    ];
    g.fillStyle(0x14495a, 0.45);
    darkPatches.forEach(([cx, cy, w, h]) => g.fillEllipse(cx, cy, w, h));

    // Ripply current lines weaving across the seafloor
    const currents = [
      [tx(5),  tx(11), tx(15), tx(13)],
      [tx(20), tx(7),  tx(28), tx(10)],
      [tx(35), tx(20), tx(43), tx(23)],
      [tx(15), tx(28), tx(22), tx(30)],
      [tx(28), tx(33), tx(38), tx(35)],
    ];
    g.lineStyle(1, 0x82c5d3, 0.35);
    currents.forEach(([x1, y1, x2, y2]) => {
      const mx = (x1 + x2) / 2 + Phaser.Math.Between(-12, 12);
      const my = (y1 + y2) / 2 + Phaser.Math.Between(-8, 8);
      g.lineBetween(x1, y1, mx, my);
      g.lineBetween(mx, my, x2, y2);
    });

    // Scattered seashells & starfish on the seabed
    const shellCount = 28;
    for (let i = 0; i < shellCount; i++) {
      const px = Phaser.Math.Between(2 * TILE, (MAP_W - 2) * TILE);
      const py = Phaser.Math.Between(2 * TILE, (MAP_H - 2) * TILE);
      const tileX = Math.floor(px / TILE);
      const tileY = Math.floor(py / TILE);
      if (this.map[tileY] && this.map[tileY][tileX] === '#') continue;
      const kind = i % 3;
      if (kind === 0) {
        // Pink scallop
        g.fillStyle(0xf3a2b7, 0.85);
        g.fillCircle(px, py, 2.5);
        g.lineStyle(1, 0xc36a7e, 0.7);
        g.lineBetween(px, py, px - 2, py + 2);
        g.lineBetween(px, py, px + 2, py + 2);
      } else if (kind === 1) {
        // White cowrie
        g.fillStyle(0xe8e2c3, 0.85);
        g.fillCircle(px, py, 2);
        g.fillStyle(0xb6a877, 0.6);
        g.fillCircle(px + 1, py + 1, 1);
      } else {
        // Tiny orange starfish
        g.fillStyle(0xff9c4a, 0.85);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          g.fillCircle(px + Math.cos(a) * 1.6, py + Math.sin(a) * 1.6, 1);
        }
        g.fillStyle(0xffc88a, 0.95);
        g.fillCircle(px, py, 1.4);
      }
    }
  }

  /* ----- wall rendering ----- */

  drawWalls() {
    if (this.biome === 'desert') {
      this.drawDesertWalls();
    } else if (this.biome === 'ocean') {
      this.drawOceanWalls();
    } else if (this.biome === 'lava') {
      this.drawLavaWalls();
    } else {
      this.drawTempleWalls();
    }
  }

  drawLavaFloor(g) {
    // Two-pass: first paint molten lava as the base layer for all 'L' tiles,
    // then overlay raised stone platforms on '.' tiles. Walls are drawn
    // separately by drawLavaWalls().

    // Pass 1 - molten lava base over the entire map (covers everything; the
    // stone platforms drawn next sit on top).
    g.fillStyle(0xff4a18, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    // Cooler red flow zones
    g.fillStyle(0xc62a14, 0.55);
    for (let i = 0; i < 18; i++) {
      const cx = Phaser.Math.Between(0, WORLD_W);
      const cy = Phaser.Math.Between(0, WORLD_H);
      g.fillEllipse(cx, cy, 320 + Math.random() * 160, 120 + Math.random() * 60);
    }
    // Bright hot spots
    g.fillStyle(0xffd860, 0.45);
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * WORLD_W;
      const cy = Math.random() * WORLD_H;
      g.fillEllipse(cx, cy, 50 + Math.random() * 40, 22 + Math.random() * 18);
    }
    // Crusty crack lines (thin black veins)
    g.lineStyle(2, 0x2a0a08, 0.55);
    for (let i = 0; i < 32; i++) {
      const x0 = Math.random() * WORLD_W;
      const y0 = Math.random() * WORLD_H;
      let x = x0, y = y0;
      for (let s = 0; s < 6; s++) {
        const nx = x + (Math.random() - 0.5) * 80;
        const ny = y + (Math.random() - 0.5) * 80;
        g.lineBetween(x, y, nx, ny);
        x = nx; y = ny;
      }
    }

    // Pass 2 - stone platforms on '.' tiles, rendered as chunky isometric
    // pillars rising out of the lava. Drawing splits across two depth
    // bands so the player can walk *on top of* the platform top surface
    // but still appear *in front of* the platform front/side faces when
    // standing south of it:
    //
    //   topG (depth -996): drop shadow + the entire raised top surface,
    //     drawn under any moving object (player has depth = body.y).
    //   sidesG per-row (depth (y+1)*TILE - 0.5): the front + L/R side
    //     faces of pillars on row y. Same convention as the wall layer
    //     so the player walking on the row below correctly renders in
    //     front of the cliff face.
    const SIDE_H = 12;        // px - apparent pillar height
    const SLANT  = 4;         // px - horizontal skew on side faces
    const isLavaNb = (nx, ny) => {
      if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return true;
      return this.map[ny][nx] === 'L';
    };

    const topG = this.add.graphics().setDepth(-996);

    for (let y = 0; y < MAP_H; y++) {
      const sidesG = this.add.graphics();
      let anySides = false;
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '.') continue;
        const px = x * TILE;
        const py = y * TILE;
        const seed = (x * 73 + y * 31) >>> 0;
        const lavaAbove = isLavaNb(x, y - 1);
        const lavaBelow = isLavaNb(x, y + 1);
        const lavaLeft  = isLavaNb(x - 1, y);
        const lavaRight = isLavaNb(x + 1, y);

        // ----- side / front faces (per-row sidesG) -----

        // Drop shadow on the lava beneath the pillar
        sidesG.fillStyle(0x000000, 0.55);
        sidesG.fillEllipse(px + TILE / 2 + 4, py + TILE + 8, TILE * 0.95, 9);
        sidesG.fillStyle(0x000000, 0.30);
        sidesG.fillEllipse(px + TILE / 2 + 7, py + TILE + 12, TILE * 0.85, 6);

        // Front face (south-facing cliff drop) - dark basalt with magma cracks
        if (lavaBelow) {
          anySides = true;
          sidesG.fillStyle(0x0e0708, 1);
          sidesG.fillRect(px, py + TILE, TILE, SIDE_H);
          sidesG.fillStyle(0x1c1014, 1);
          sidesG.fillRect(px + 1, py + TILE, TILE - 2, SIDE_H - 1);
          if (seed % 3 === 0) {
            sidesG.fillStyle(0xff6a18, 0.85);
            sidesG.fillRect(px + 5 + (seed % 8), py + TILE + 3, 1, 6);
          }
          if (seed % 4 === 0) {
            sidesG.fillStyle(0xffaa44, 0.7);
            sidesG.fillRect(px + 16 + (seed % 6), py + TILE + 5, 1, 4);
          }
          sidesG.lineStyle(1, 0x4a3848, 0.85);
          sidesG.lineBetween(px, py + TILE, px + TILE, py + TILE);
        }

        // Right side face - skewed parallelogram suggests perspective
        if (lavaRight) {
          anySides = true;
          sidesG.fillStyle(0x231a26, 1);
          sidesG.beginPath();
          sidesG.moveTo(px + TILE,         py);
          sidesG.lineTo(px + TILE + SLANT, py + 2);
          sidesG.lineTo(px + TILE + SLANT, py + TILE + 2);
          sidesG.lineTo(px + TILE,         py + TILE);
          sidesG.closePath();
          sidesG.fillPath();
          sidesG.lineStyle(1, 0x4a3a4e, 0.85);
          sidesG.lineBetween(px + TILE, py, px + TILE + SLANT, py + 2);
        }

        // Left side face - darkest, in shadow
        if (lavaLeft) {
          anySides = true;
          sidesG.fillStyle(0x150d18, 1);
          sidesG.beginPath();
          sidesG.moveTo(px,         py);
          sidesG.lineTo(px - SLANT, py + 2);
          sidesG.lineTo(px - SLANT, py + TILE + 2);
          sidesG.lineTo(px,         py + TILE);
          sidesG.closePath();
          sidesG.fillPath();
        }

        // ----- top surface (single low-depth topG so player walks over it) -----
        topG.fillStyle(0x2c2530, 1);
        topG.fillRect(px, py, TILE, TILE);
        topG.fillStyle(0x3c333e, 1);
        topG.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        for (let k = 0; k < 9; k++) {
          const sx = px + ((seed * (k + 1) * 7) % TILE);
          const sy = py + ((seed * (k + 3) * 11) % TILE);
          const sz = ((seed * (k + 5)) % 3) + 1;
          topG.fillStyle(k % 2 ? 0x52424e : 0x1e1820, 0.8);
          topG.fillRect(sx, sy, sz, sz);
        }
        // Warm rim highlight on lava-facing top edges
        topG.lineStyle(2, 0xff8a44, 0.85);
        if (lavaAbove) topG.lineBetween(px, py, px + TILE, py);
        if (lavaRight) topG.lineBetween(px + TILE - 0.5, py, px + TILE - 0.5, py + TILE);
        if (lavaBelow) topG.lineBetween(px, py + TILE - 0.5, px + TILE, py + TILE - 0.5);
        if (lavaLeft)  topG.lineBetween(px + 0.5, py, px + 0.5, py + TILE);
        // Soft inner glow strip
        topG.lineStyle(1, 0xffd066, 0.45);
        if (lavaAbove) topG.lineBetween(px + 2, py + 2, px + TILE - 2, py + 2);
        if (lavaRight) topG.lineBetween(px + TILE - 2, py + 2, px + TILE - 2, py + TILE - 2);
        if (lavaBelow) topG.lineBetween(px + 2, py + TILE - 2, px + TILE - 2, py + TILE - 2);
        if (lavaLeft)  topG.lineBetween(px + 2, py + 2, px + 2, py + TILE - 2);
      }
      if (anySides) sidesG.setDepth((y + 1) * TILE - 0.5);
      else sidesG.destroy();
    }
  }

  drawTempleWalls() {
    for (let y = 0; y < MAP_H; y++) {
      const g = this.add.graphics();
      let any = false;
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] === '#') {
          any = true;
          g.fillStyle(0x6b4327, 1);
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
          g.fillStyle(0x8b6347, 1);
          g.fillRect(x * TILE, y * TILE, TILE, 3);
          g.lineStyle(1, 0x33201a, 0.7);
          g.strokeRect(x * TILE, y * TILE, TILE, TILE);

          const below = y + 1 < MAP_H ? this.map[y + 1][x] : null;
          if (below !== '#') {
            g.fillStyle(0x4a2e1f, 1);
            g.fillRect(x * TILE, (y + 1) * TILE, TILE, 16);
            g.fillStyle(0x33201a, 1);
            g.fillRect(x * TILE, (y + 1) * TILE + 14, TILE, 2);
            g.fillStyle(0x5c3a2a, 1);
            g.fillRect(x * TILE, (y + 1) * TILE, TILE, 2);
          }
        }
      }
      if (any) g.setDepth((y + 1) * TILE - 0.5);
      else g.destroy();
    }
  }

  drawDesertWalls() {
    // Each '#' tile is rendered as one of three desert objects:
    //   - border tiles  -> sand DUNES that ring the playable area
    //   - interior tiles -> CACTUS (~1/3 by hash) or BOULDER (rest)
    // This gives the wasteland real variety instead of tile-aligned cliff slabs.
    const isBorder = (x, y) =>
      x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2;

    for (let y = 0; y < MAP_H; y++) {
      const g = this.add.graphics();
      let any = false;
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '#') continue;
        any = true;

        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;

        if (isBorder(x, y)) {
          this.drawDuneTile(g, x, y, cx, cy);
        } else if (((x * 7 + y * 13) % 3) === 0) {
          this.drawCactusTile(g, x, y, cx, cy);
        } else {
          this.drawBoulderTile(g, x, y, cx, cy);
        }
      }
      if (any) g.setDepth((y + 1) * TILE - 0.5);
      else g.destroy();
    }
  }

  /* ----- desert tile types: dunes, cacti, boulders ----- */

  drawDuneTile(g, x, y, cx, cy) {
    // Sand-mound visual for the perimeter that frames the playable wasteland.
    // Adjacent dune tiles share y-aligned ripples so the border reads as one
    // continuous drift instead of 50 individual mounds.
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    // Base sand body (slightly warmer / deeper than the floor sand).
    g.fillStyle(0xb98851, 1);
    g.fillRect(tx0, ty0, TILE, TILE);

    // Sun-lit upper slope.
    g.fillStyle(0xd4a26b, 0.85);
    g.fillRect(tx0, ty0 + 2, TILE, 8);
    g.fillStyle(0xe1b681, 0.6);
    g.fillRect(tx0, ty0 + 4, TILE, 4);

    // Shadow side at the bottom of the dune.
    g.fillStyle(0x8b6135, 0.45);
    g.fillRect(tx0, ty0 + TILE - 8, TILE, 6);
    g.fillStyle(0x6f4d27, 0.3);
    g.fillRect(tx0, ty0 + TILE - 3, TILE, 3);

    // Wind-blown ripple lines - same y in every tile in the row so the
    // ripples connect across tiles.
    g.lineStyle(1, 0x8b6135, 0.45);
    [6, 13, 20, 26].forEach((rh, i) => {
      const ry = ty0 + rh + ((y + i) % 2);
      g.lineBetween(tx0, ry, tx0 + TILE, ry);
    });

    // Soft crest highlight curve on the dune
    g.lineStyle(1, 0xddae7f, 0.7);
    g.lineBetween(tx0, ty0 + 6 + ((x + y) % 2), tx0 + TILE, ty0 + 6 + ((x + y + 1) % 2));

    // Sparse pebbles for grain.
    if ((x * 3 + y * 7) % 4 === 0) {
      g.fillStyle(0x7a5230, 0.7);
      g.fillCircle(tx0 + 8 + ((x * 5) % 14), ty0 + 14 + ((y * 3) % 8), 1.5);
    }
    if ((x * 5 + y * 2) % 5 === 0) {
      g.fillStyle(0x5e3d20, 0.55);
      g.fillCircle(tx0 + 18 + ((x * 7) % 10), ty0 + 22 + ((y * 5) % 6), 1);
    }
  }

  drawCactusTile(g, x, y, cx, cy) {
    // Saguaro-style cactus: ground patch + tall trunk + 0-2 arms + spines.
    const seed = (x * 5 + y * 11) % 4;
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    // Sand patch under the cactus (so collision tile has matching ground).
    g.fillStyle(0xc89564, 1);
    g.fillRect(tx0, ty0, TILE, TILE);
    g.fillStyle(0xa97a4d, 0.4);
    g.fillEllipse(cx, cy + 8, 28, 14);

    // Soft organic ground shadow at the cactus base.
    g.fillStyle(0x4a2510, 0.18);
    g.fillEllipse(cx + 2, cy + 14, 26, 9);
    g.fillStyle(0x4a2510, 0.32);
    g.fillEllipse(cx + 1, cy + 14, 18, 6);

    // Trunk: tall vertical body, bottom anchored near the bottom of the tile.
    const trunkH = 38 + seed * 2;
    const trunkW = 11;
    const trunkCY = cy + 14 - trunkH / 2;

    // Trunk shadow side
    g.fillStyle(0x2e5020, 1);
    g.fillEllipse(cx + 2, trunkCY, trunkW, trunkH);
    // Trunk body
    g.fillStyle(0x3d6b28, 1);
    g.fillEllipse(cx, trunkCY, trunkW, trunkH);
    // Sun-hit highlight on the left
    g.fillStyle(0x5a8a3a, 1);
    g.fillEllipse(cx - 3, trunkCY + 2, 3, trunkH - 6);
    g.fillStyle(0x76a850, 0.9);
    g.fillEllipse(cx - 3, trunkCY + 2, 1.5, trunkH - 8);

    // Vertical ribbed lines down the trunk.
    g.lineStyle(1, 0x2e5020, 0.65);
    g.lineBetween(cx - 2, trunkCY - trunkH / 2 + 4, cx - 2, trunkCY + trunkH / 2 - 4);
    g.lineBetween(cx + 2, trunkCY - trunkH / 2 + 5, cx + 2, trunkCY + trunkH / 2 - 5);

    // Left arm (most cacti have one).
    if (seed >= 1) {
      const armBaseY = trunkCY - trunkH / 4 + ((seed * 3) % 5) - 2;
      // Horizontal connector
      g.fillStyle(0x2e5020, 1);
      g.fillEllipse(cx - 7, armBaseY + 1, 11, 7);
      g.fillStyle(0x3d6b28, 1);
      g.fillEllipse(cx - 7, armBaseY, 10, 6);
      // Vertical arm going up
      g.fillStyle(0x2e5020, 1);
      g.fillEllipse(cx - 11 + 1, armBaseY - 7, 7, 14);
      g.fillStyle(0x3d6b28, 1);
      g.fillEllipse(cx - 11, armBaseY - 7, 6, 14);
      g.fillStyle(0x5a8a3a, 1);
      g.fillEllipse(cx - 12, armBaseY - 7, 1.5, 11);
    }

    // Right arm (some cacti have a second).
    if (seed === 2 || seed === 3) {
      const armBaseY = trunkCY + 2 + ((seed * 5) % 4);
      g.fillStyle(0x2e5020, 1);
      g.fillEllipse(cx + 7, armBaseY + 1, 11, 7);
      g.fillStyle(0x3d6b28, 1);
      g.fillEllipse(cx + 7, armBaseY, 10, 6);
      g.fillStyle(0x2e5020, 1);
      g.fillEllipse(cx + 11 + 1, armBaseY - 7, 7, 12);
      g.fillStyle(0x3d6b28, 1);
      g.fillEllipse(cx + 11, armBaseY - 7, 6, 12);
      g.fillStyle(0x5a8a3a, 0.9);
      g.fillEllipse(cx + 10, armBaseY - 7, 1.5, 9);
    }

    // Spines along the trunk (small cream dots).
    g.fillStyle(0xeed4a3, 0.85);
    for (let i = 0; i < 7; i++) {
      const sy = trunkCY - trunkH / 2 + 6 + i * (trunkH - 12) / 6;
      g.fillCircle(cx - 3, sy, 0.6);
      g.fillCircle(cx + 3, sy, 0.6);
    }

    // A flower bud on top sometimes.
    if (seed === 1) {
      g.fillStyle(0xe8607a, 1);
      g.fillCircle(cx, trunkCY - trunkH / 2 + 1, 2.5);
      g.fillStyle(0xffb0c0, 0.9);
      g.fillCircle(cx - 1, trunkCY - trunkH / 2, 1.2);
    }
  }

  drawBoulderTile(g, x, y, cx, cy) {
    // Round, sun-lit boulder sitting on a sand patch. No tile-aligned edges.
    const seed = (x * 5 + y * 11) % 6;
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    // Sand patch (so the tile blends with the surrounding floor).
    g.fillStyle(0xc89564, 1);
    g.fillRect(tx0, ty0, TILE, TILE);

    // Soft organic ground shadow.
    g.fillStyle(0x4a2510, 0.12);
    g.fillEllipse(cx + 2, cy + 9, 30, 11);
    g.fillStyle(0x4a2510, 0.22);
    g.fillEllipse(cx + 2, cy + 9, 24, 8);

    // Boulder body - irregular oval, slightly off-center for organic feel.
    const bw = 24 + (seed % 3) * 2;
    const bh = 19 + ((seed * 3) % 4);
    const offX = (seed - 2) % 3;
    const offY = -3;
    // Underside / shadow tone first
    g.fillStyle(0x5a3a1c, 1);
    g.fillEllipse(cx + offX + 3, cy + offY + 4, bw, bh);
    // Main body
    g.fillStyle(0x8a6238, 1);
    g.fillEllipse(cx + offX, cy + offY, bw, bh);

    // Add a secondary lobe so the boulder isn't a perfect oval.
    if (seed % 2 === 0) {
      g.fillStyle(0x8a6238, 1);
      g.fillEllipse(cx + offX - bw / 3, cy + offY + 2, bw * 0.55, bh * 0.7);
    } else {
      g.fillStyle(0x8a6238, 1);
      g.fillEllipse(cx + offX + bw / 3, cy + offY + 1, bw * 0.55, bh * 0.7);
    }

    // Sun-hit highlight on the upper-left.
    g.fillStyle(0xa67c4a, 1);
    g.fillEllipse(cx + offX - 3, cy + offY - 3, bw - 8, bh - 8);
    g.fillStyle(0xc8954c, 0.85);
    g.fillEllipse(cx + offX - 5, cy + offY - 5, bw - 14, bh - 12);
    g.fillStyle(0xddb069, 0.7);
    g.fillEllipse(cx + offX - 6, cy + offY - 6, bw - 18, bh - 14);

    // Shadow accent on the lower-right.
    g.fillStyle(0x432a14, 0.6);
    g.fillEllipse(cx + offX + 5, cy + offY + 5, bw - 14, bh - 9);

    // A crack or two for stone character.
    if (seed % 2 === 0) {
      g.lineStyle(1, 0x3a2010, 0.7);
      g.lineBetween(cx + offX - 5, cy + offY, cx + offX + 5, cy + offY + 2);
    }
    if (seed === 3) {
      g.lineStyle(1, 0x3a2010, 0.6);
      g.lineBetween(cx + offX - 1, cy + offY - 6, cx + offX + 2, cy + offY + 4);
    }
    if (seed === 1) {
      g.lineStyle(1, 0x3a2010, 0.55);
      g.lineBetween(cx + offX + 3, cy + offY - 4, cx + offX + 6, cy + offY + 3);
    }

    // Loose pebbles around the base for a settled, weathered look.
    if (seed === 1) {
      g.fillStyle(0x6e4520, 1);
      g.fillCircle(cx - 13, cy + 11, 2);
    }
    if (seed === 4) {
      g.fillStyle(0x6e4520, 1);
      g.fillCircle(cx + 13, cy + 12, 2);
      g.fillCircle(cx + 16, cy + 10, 1.5);
    }
    if (seed === 2) {
      g.fillStyle(0x6e4520, 1);
      g.fillCircle(cx + 11, cy + 13, 1.5);
      g.fillCircle(cx - 10, cy + 12, 1.2);
    }
  }

  /* ----- ocean wall rendering ----- */

  drawOceanWalls() {
    // Border tiles render as the inky abyss; interior tiles are split among
    // coral mounds (most), kelp clusters, and the central shipwreck spine.
    const isBorder = (x, y) =>
      x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2;

    for (let y = 0; y < MAP_H; y++) {
      const g = this.add.graphics();
      let any = false;
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '#') continue;
        any = true;

        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;

        if (isBorder(x, y)) {
          this.drawAbyssTile(g, x, y);
        } else if (this.isShipwreckTile(x, y)) {
          this.drawShipwreckTile(g, x, y, cx, cy);
        } else if (((x * 11 + y * 5) % 4) === 0) {
          this.drawKelpTile(g, x, y, cx, cy);
        } else {
          this.drawCoralTile(g, x, y, cx, cy);
        }
      }
      if (any) g.setDepth((y + 1) * TILE - 0.5);
      else g.destroy();
    }
  }

  isShipwreckTile(x, y) {
    // Matches the wreck spine layout in buildMapL3: y=16 columns 23..30,
    // plus the small ribs we placed.
    const wreckRow = 16;
    if (y === wreckRow && x >= 23 && x <= 30) return true;
    if (y === wreckRow - 1 && (x === 23 || x === 30)) return true;
    if (y === wreckRow + 1 && (x === 26 || x === 27)) return true;
    return false;
  }

  drawAbyssTile(g, x, y) {
    // The border looks like a band of deep, swallowing dark water.
    const tx0 = x * TILE;
    const ty0 = y * TILE;
    g.fillStyle(0x031827, 1);
    g.fillRect(tx0, ty0, TILE, TILE);
    // A subtle current ripple texture
    g.fillStyle(0x0a2a40, 0.6);
    g.fillRect(tx0, ty0 + 4, TILE, 4);
    g.fillStyle(0x06203a, 0.5);
    g.fillRect(tx0, ty0 + TILE - 6, TILE, 4);
    // Tiny current arcs across the tile
    g.lineStyle(1, 0x4d8aa6, 0.25);
    [8, 18, 26].forEach((rh, i) => {
      const ry = ty0 + rh + ((y + i) % 2);
      g.lineBetween(tx0 + 2, ry, tx0 + TILE - 2, ry);
    });
    // Deeper-shadow vignette toward the absolute edge of the map
    if (x < 1 || x >= MAP_W - 1 || y < 1 || y >= MAP_H - 1) {
      g.fillStyle(0x010810, 0.5);
      g.fillRect(tx0, ty0, TILE, TILE);
    }
  }

  drawCoralTile(g, x, y, cx, cy) {
    // Bumpy pink/red coral mound. Distinct silhouette and bright color so
    // it reads as cover against the muted seafloor.
    const seed = (x * 5 + y * 11) % 6;
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    // Sand patch base
    g.fillStyle(0x2c7385, 1);
    g.fillRect(tx0, ty0, TILE, TILE);

    // Soft cyan glow under the coral
    g.fillStyle(0xa9e7ee, 0.18);
    g.fillEllipse(cx, cy + 10, 30, 11);

    // Subtle organic shadow on the seabed
    g.fillStyle(0x062f4f, 0.35);
    g.fillEllipse(cx + 2, cy + 11, 26, 9);

    // Coral body: 3 stacked irregular lobes for a bumpy organic shape
    const baseColor = (seed % 2 === 0) ? 0xe05a89 : 0xe07a4a; // mix of pink + warm coral
    const midColor  = (seed % 2 === 0) ? 0xff86b1 : 0xff9d6a;
    const liteColor = (seed % 2 === 0) ? 0xffc2dc : 0xffd0a8;

    g.fillStyle(0x9c3963, 1); // shadow undertone
    g.fillEllipse(cx + 2, cy + 2, 26, 18);
    g.fillStyle(baseColor, 1);
    g.fillEllipse(cx, cy, 24, 17);
    // Secondary lobe
    g.fillStyle(baseColor, 1);
    g.fillEllipse(cx + (seed % 2 === 0 ? -8 : 8), cy - 4, 14, 10);
    g.fillEllipse(cx + (seed % 3 === 0 ? 6 : -4), cy - 8, 10, 8);
    // Highlight
    g.fillStyle(midColor, 1);
    g.fillEllipse(cx - 3, cy - 4, 14, 10);
    g.fillStyle(liteColor, 0.8);
    g.fillEllipse(cx - 5, cy - 6, 6, 5);

    // Coral polyp dots
    g.fillStyle(0xfff0d6, 0.85);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + seed;
      const r = 4 + (i % 3);
      g.fillCircle(cx + Math.cos(a) * 6, cy - 2 + Math.sin(a) * 4, 1.2);
    }
    // A few tiny anemone tips reaching upward
    if (seed % 3 === 0) {
      g.fillStyle(0xffd9aa, 0.95);
      g.fillCircle(cx - 6, cy - 9, 1.5);
      g.fillCircle(cx + 4, cy - 11, 1.3);
    }
  }

  drawKelpTile(g, x, y, cx, cy) {
    // Kelp cluster: a few tall waving green strands. Tile collider stays
    // tile-sized so the player still bumps into it as cover.
    const seed = (x * 7 + y * 13) % 5;
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    g.fillStyle(0x2c7385, 1);
    g.fillRect(tx0, ty0, TILE, TILE);

    // Murky shaded base (kelp grows in cooler patches)
    g.fillStyle(0x14495a, 0.55);
    g.fillEllipse(cx, cy + 10, 28, 10);

    // 3-4 tall green strands of varying height + slight curve
    const strandsCount = 3 + (seed % 2);
    for (let i = 0; i < strandsCount; i++) {
      const phase = i + seed;
      const baseX = tx0 + 6 + i * (20 / strandsCount) + (phase % 2);
      const baseY = ty0 + TILE - 2;
      const topY = baseY - (24 + ((phase * 5) % 8));
      const sway = ((phase * 3) % 5) - 2;
      // Shadow strand behind
      g.fillStyle(0x12381c, 1);
      g.fillEllipse(baseX + 1, (baseY + topY) / 2 + 1, 5, baseY - topY);
      // Main strand
      g.fillStyle(0x2c7a3a, 1);
      g.fillEllipse(baseX, (baseY + topY) / 2, 4, baseY - topY);
      // Highlight on the lit side
      g.fillStyle(0x4ea84d, 1);
      g.fillEllipse(baseX - 1, (baseY + topY) / 2, 1.5, baseY - topY - 4);
      // Bulb tip
      g.fillStyle(0x6dc85a, 1);
      g.fillCircle(baseX + sway, topY, 2.2);
      g.fillStyle(0xb6f06b, 0.85);
      g.fillCircle(baseX + sway - 0.5, topY - 0.5, 1);
    }

    // Subtle leaf shadows on the seabed
    g.fillStyle(0x0e2a14, 0.35);
    g.fillEllipse(cx, cy + 11, 22, 5);
  }

  drawShipwreckTile(g, x, y, cx, cy) {
    // Weathered dark wood beam. Tiles in the wreck row connect into a
    // long horizontal hull silhouette across the middle of the map.
    const seed = (x * 5 + y * 11) % 4;
    const tx0 = x * TILE;
    const ty0 = y * TILE;

    // Sand stained around the wreck
    g.fillStyle(0x2c7385, 1);
    g.fillRect(tx0, ty0, TILE, TILE);
    g.fillStyle(0x1c4a55, 0.65);
    g.fillEllipse(cx, cy + 10, 32, 10);

    // Hull base — broad weathered plank
    g.fillStyle(0x2a1a10, 1);
    g.fillRect(tx0, ty0 + 4, TILE, TILE - 6);
    // Top edge (sun-bleached lip)
    g.fillStyle(0x4a3020, 1);
    g.fillRect(tx0, ty0 + 4, TILE, 3);
    g.fillStyle(0x5a3c28, 0.9);
    g.fillRect(tx0, ty0 + 4, TILE, 1);

    // Plank seams - vertical lines breaking the hull into boards
    g.lineStyle(1, 0x120808, 0.85);
    [10, 22].forEach((dx) => g.lineBetween(tx0 + dx, ty0 + 5, tx0 + dx, ty0 + TILE - 2));

    // Weathered grain
    g.lineStyle(1, 0x3a2418, 0.55);
    g.lineBetween(tx0 + 3, ty0 + 12, tx0 + TILE - 3, ty0 + 12);
    g.lineBetween(tx0 + 3, ty0 + 22, tx0 + TILE - 3, ty0 + 22);

    // Rusted iron fasteners
    if (seed % 2 === 0) {
      g.fillStyle(0x6e3010, 1);
      g.fillCircle(tx0 + 8, ty0 + 9, 1.6);
      g.fillStyle(0xa66338, 0.9);
      g.fillCircle(tx0 + 8, ty0 + 9, 0.8);
    }
    if (seed === 1 || seed === 3) {
      g.fillStyle(0x6e3010, 1);
      g.fillCircle(tx0 + TILE - 8, ty0 + 22, 1.6);
      g.fillStyle(0xa66338, 0.9);
      g.fillCircle(tx0 + TILE - 8, ty0 + 22, 0.8);
    }

    // Algae/moss tufts clinging to the wreck
    g.fillStyle(0x2a5a2a, 0.7);
    g.fillEllipse(tx0 + 6, ty0 + TILE - 4, 7, 3);
    g.fillStyle(0x3e7a3a, 0.75);
    g.fillEllipse(tx0 + 6, ty0 + TILE - 4, 5, 2);
    if (seed === 2) {
      g.fillStyle(0x2a5a2a, 0.7);
      g.fillEllipse(tx0 + TILE - 8, ty0 + TILE - 4, 6, 2.5);
    }
  }

  /* ----- lava wall rendering ----- */

  drawLavaWalls() {
    // Cliff walls drawn as tall isometric basalt pillars. Each tile renders
    // its top + a tall front face + thin left/right side faces (only on the
    // edges that face open lava / non-wall tiles), mirroring the platform
    // pillar style but at greater apparent height for serious "you can't
    // walk through this" reads.
    const FRONT_H = 22;       // px - tall cliff drop
    const SIDE_SLANT = 5;     // px - perspective slant on side faces
    const isWall = (nx, ny) => {
      if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return true;
      return this.map[ny][nx] === '#';
    };
    for (let y = 0; y < MAP_H; y++) {
      const g = this.add.graphics();
      let any = false;
      for (let x = 0; x < MAP_W; x++) {
        if (this.map[y][x] !== '#') continue;
        any = true;
        const tx0 = x * TILE;
        const ty0 = y * TILE;
        const seed = (x * 113 + y * 67) % 100;
        const wallAbove = isWall(x, y - 1);
        const wallBelow = isWall(x, y + 1);
        const wallLeft  = isWall(x - 1, y);
        const wallRight = isWall(x + 1, y);

        // 1. Right side face (only when the right neighbour is open)
        if (!wallRight) {
          g.fillStyle(0x1a100c, 1);
          g.beginPath();
          g.moveTo(tx0 + TILE,             ty0);
          g.lineTo(tx0 + TILE + SIDE_SLANT, ty0 + 3);
          g.lineTo(tx0 + TILE + SIDE_SLANT, ty0 + TILE + (wallBelow ? 0 : FRONT_H));
          g.lineTo(tx0 + TILE,             ty0 + TILE + (wallBelow ? 0 : FRONT_H));
          g.closePath();
          g.fillPath();
          g.lineStyle(1, 0x3e281c, 0.7);
          g.lineBetween(tx0 + TILE, ty0, tx0 + TILE + SIDE_SLANT, ty0 + 3);
        }

        // 2. Left side face (only when the left neighbour is open)
        if (!wallLeft) {
          g.fillStyle(0x0c0604, 1);
          g.beginPath();
          g.moveTo(tx0,             ty0);
          g.lineTo(tx0 - SIDE_SLANT, ty0 + 3);
          g.lineTo(tx0 - SIDE_SLANT, ty0 + TILE + (wallBelow ? 0 : FRONT_H));
          g.lineTo(tx0,             ty0 + TILE + (wallBelow ? 0 : FRONT_H));
          g.closePath();
          g.fillPath();
        }

        // 3. Top surface (cooked basalt slab)
        g.fillStyle(0x2a1c18, 1);
        g.fillRect(tx0, ty0, TILE, TILE);
        g.fillStyle(0x3e2a22, 1);
        g.fillRect(tx0 + 1, ty0 + 1, TILE - 2, TILE - 2);
        // Speckled mineral grain
        for (let k = 0; k < 7; k++) {
          const sx = tx0 + ((seed * (k + 1) * 7) % TILE);
          const sy = ty0 + ((seed * (k + 3) * 5) % TILE);
          g.fillStyle(k % 2 ? 0x5a3e30 : 0x180c08, 0.8);
          g.fillRect(sx, sy, 1, 1);
        }
        // Faint magma vein
        if (seed % 4 === 0) {
          g.fillStyle(0x8a2a10, 0.7);
          g.fillRect(tx0 + 3 + (seed % 18), ty0 + 6 + (seed % 12), 2, 1);
          g.fillStyle(0xff6a18, 0.55);
          g.fillRect(tx0 + 3 + (seed % 18), ty0 + 6 + (seed % 12), 1, 1);
        }
        // Warm rim along the top edge facing open space
        if (!wallAbove) {
          g.fillStyle(0x6a2810, 0.55);
          g.fillRect(tx0, ty0, TILE, 2);
          g.lineStyle(1, 0x8a3a18, 0.85);
          g.lineBetween(tx0, ty0, tx0 + TILE, ty0);
        }

        // 4. Tall front face (only when the tile below isn't another wall)
        if (!wallBelow) {
          g.fillStyle(0x080403, 1);
          g.fillRect(tx0, (y + 1) * TILE, TILE, FRONT_H);
          g.fillStyle(0x180c08, 1);
          g.fillRect(tx0 + 1, (y + 1) * TILE + 1, TILE - 2, FRONT_H - 2);
          // Top rim of the cliff face (warmer, suggests glow from above)
          g.fillStyle(0x331a10, 1);
          g.fillRect(tx0, (y + 1) * TILE, TILE, 2);
          // Vertical fissures with magma deep inside
          if (seed % 3 === 0) {
            g.fillStyle(0x8a2a10, 0.85);
            g.fillRect(tx0 + 4 + (seed % 10), (y + 1) * TILE + 3, 1, FRONT_H - 6);
            g.fillStyle(0xff6a18, 0.8);
            g.fillRect(tx0 + 4 + (seed % 10), (y + 1) * TILE + 6, 1, 6);
          }
          if (seed % 5 === 0) {
            g.fillStyle(0xffaa44, 0.85);
            g.fillRect(tx0 + 18 + (seed % 6), (y + 1) * TILE + 8, 1, 5);
          }
          // Subtle stone-grain stippling on the front face
          for (let k = 0; k < 6; k++) {
            const sx = tx0 + ((seed * (k + 2) * 3) % TILE);
            const sy = (y + 1) * TILE + 4 + ((seed * (k + 1)) % (FRONT_H - 6));
            g.fillStyle(k % 2 ? 0x231410 : 0x0a0604, 0.85);
            g.fillRect(sx, sy, 1, 1);
          }
          // Bottom shadow line
          g.fillStyle(0x000000, 0.6);
          g.fillRect(tx0, (y + 1) * TILE + FRONT_H - 1, TILE, 1);
        }
      }
      if (any) g.setDepth((y + 1) * TILE - 0.5);
      else g.destroy();
    }
  }

  /* ----- lava ambient effects ----- */

  createLavaAmbience() {
    if (this.biome !== 'lava') return;
    // Floating ember sparks rising from the lava with a flickering glow.
    this.embers = [];
    const emberG = this.add.graphics().setDepth(900);
    emberG.setBlendMode(Phaser.BlendModes.ADD);
    this.emberG = emberG;
    for (let i = 0; i < 70; i++) {
      this.embers.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 2 + 0.8,
        vy: -(Math.random() * 18 + 10),
        wob: Math.random() * Math.PI * 2,
        life: Math.random() * 4000,
        maxLife: Math.random() * 3000 + 3500,
      });
    }
    // Subtle warm wash across the world to sell the heat haze
    const wash = this.add.graphics().setDepth(901);
    wash.setBlendMode(Phaser.BlendModes.ADD);
    wash.fillStyle(0xff5018, 0.05);
    wash.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  updateLavaAmbience(time, delta) {
    if (!this.embers || !this.emberG) return;
    const g = this.emberG;
    g.clear();
    const dt = (delta || 16) / 1000;
    for (const e of this.embers) {
      e.life += delta || 16;
      e.x += Math.sin(e.wob + time * 0.001) * 8 * dt;
      e.y += e.vy * dt;
      if (e.life >= e.maxLife || e.y < 0) {
        // Respawn near the lava surface
        const tries = 6;
        for (let t = 0; t < tries; t++) {
          const tx = Phaser.Math.Between(2, MAP_W - 3);
          const ty = Phaser.Math.Between(2, MAP_H - 3);
          if (this.map[ty] && this.map[ty][tx] === 'L') {
            e.x = tx * TILE + Phaser.Math.Between(0, TILE - 1);
            e.y = ty * TILE + Phaser.Math.Between(0, TILE - 1);
            break;
          }
        }
        e.life = 0;
        e.maxLife = Math.random() * 3000 + 3500;
        e.vy = -(Math.random() * 18 + 10);
        e.r = Math.random() * 2 + 0.8;
      }
      // Fade based on life progress
      const t = e.life / e.maxLife;
      const a = Math.max(0, Math.min(1, 1 - t));
      g.fillStyle(0xffaa44, 0.85 * a);
      g.fillCircle(e.x, e.y, e.r);
      g.fillStyle(0xff6020, 0.45 * a);
      g.fillCircle(e.x, e.y, e.r * 1.8);
    }
  }

  /* ----- ocean ambient effects ----- */

  createOceanAmbience() {
    // Drifting bubbles + slanting god rays. Both purely cosmetic.
    if (this.biome !== 'ocean') return;

    // God rays: a few wide diagonal light bands across the world.
    const rayG = this.add.graphics().setDepth(-90);
    rayG.fillStyle(0xb6e6f5, 0.07);
    for (let i = 0; i < 6; i++) {
      const ax = WORLD_W * (0.1 + i * 0.16);
      const top = -40;
      const bot = WORLD_H + 40;
      const slant = 220;
      rayG.beginPath();
      rayG.moveTo(ax, top);
      rayG.lineTo(ax + 60, top);
      rayG.lineTo(ax + 60 + slant, bot);
      rayG.lineTo(ax + slant, bot);
      rayG.closePath();
      rayG.fillPath();
    }
    rayG.fillStyle(0xddf2fa, 0.04);
    for (let i = 0; i < 6; i++) {
      const ax = WORLD_W * (0.06 + i * 0.16);
      const top = -40;
      const bot = WORLD_H + 40;
      const slant = 240;
      rayG.beginPath();
      rayG.moveTo(ax, top);
      rayG.lineTo(ax + 24, top);
      rayG.lineTo(ax + 24 + slant, bot);
      rayG.lineTo(ax + slant, bot);
      rayG.closePath();
      rayG.fillPath();
    }

    // Drifting bubbles: short-lived circles that rise. We spawn a steady
    // stream from random world positions every 250ms.
    this.bubbles = [];
    this.nextBubbleAt = 0;

    // Permanent seafloor decorations (anemones, urchins, starfish).
    this.placeSeafloorDecorations();

    // Schools of fish (decorative), sea turtles (decorative), and jellyfish
    // (HAZARDOUS) all drift across periodically. Jellyfish use their own
    // tighter cadence so the seafloor feels actively dangerous.
    this.nextSchoolAt = this.time.now + 1500;
    this.nextTurtleAt = this.time.now + 6000;
    this.nextJellyAt = this.time.now + 1500;

    // Active jellyfish hazards - touching one costs a heart.
    this.jellyfish = [];
  }

  spawnJellyfishHazard() {
    // Drifts upward across the map. Touching the bell stings the player.
    const startX = Phaser.Math.Between(2 * TILE, WORLD_W - 2 * TILE);
    const startY = WORLD_H + 40;
    const endY = -40;
    const dur = 18000 + Math.random() * 6000;

    // Container holds the danger aura + emoji so they move together.
    const container = this.add.container(startX, startY);
    const aura = this.add.graphics();
    const drawAura = (alpha) => {
      aura.clear();
      aura.fillStyle(0xff5e7a, 0.14 * alpha);
      aura.fillCircle(0, 4, 36);
      aura.fillStyle(0xff8fa6, 0.22 * alpha);
      aura.fillCircle(0, 4, 26);
      aura.fillStyle(0xffc0d0, 0.32 * alpha);
      aura.fillCircle(0, 4, 16);
    };
    drawAura(1);
    const emoji = this.add.text(0, 0, '🪼', { fontSize: '38px' })
      .setOrigin(0.5);
    container.add([aura, emoji]);
    container.setSize(72, 72);
    container.setDepth(startY + 250);

    const entry = {
      container,
      aura,
      emoji,
      drawAura,
      hazardRadius: 32,
      flashUntil: 0,
    };
    this.jellyfish.push(entry);

    // Vertical drift
    this.tweens.add({
      targets: container,
      y: endY,
      duration: dur,
      ease: 'Sine.easeInOut',
      onUpdate: () => container.setDepth(container.y + 250),
      onComplete: () => {
        container.destroy();
        const idx = this.jellyfish.indexOf(entry);
        if (idx >= 0) this.jellyfish.splice(idx, 1);
      },
    });
    // Sway
    this.tweens.add({
      targets: container,
      x: startX + Phaser.Math.Between(-60, 60),
      duration: dur / 2,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    // Pulse the bell
    this.tweens.add({
      targets: emoji,
      scaleY: 1.2,
      scaleX: 0.9,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  updateJellyfishHazard(time) {
    if (!this.jellyfish || this.jellyfish.length === 0) return;
    for (let i = this.jellyfish.length - 1; i >= 0; i--) {
      const e = this.jellyfish[i];
      if (!e.container || !e.container.active) {
        this.jellyfish.splice(i, 1);
        continue;
      }
      // Pulsing aura - sine breathing tied to time
      const pulse = 0.7 + Math.sin(time / 220) * 0.3;
      e.drawAura(pulse);
      // Brief white flash if just stung the player
      if (time < e.flashUntil) {
        e.emoji.setAlpha(1);
        e.emoji.setScale(1.3 * e.emoji.scaleX / Math.max(0.0001, e.emoji.scaleX));
      } else {
        e.emoji.setAlpha(0.92);
      }

      // Player collision (skip during invincibility)
      if (this.invincibleUntil <= time) {
        const dx = this.player.x - e.container.x;
        const dy = this.player.y - e.container.y;
        if (Math.hypot(dx, dy) < e.hazardRadius) {
          this.onPlayerHit(time);
          // Knockback away from the jelly
          const dist = Math.hypot(dx, dy) || 1;
          this.player.body.setVelocity((dx / dist) * 280, (dy / dist) * 280);
          e.flashUntil = time + 220;
        }
      }
    }
  }

  placeSeafloorDecorations() {
    // Scatter a few dozen tiny critter graphics onto walkable tiles for
    // visual texture. They render below sprites so the player walks "over"
    // them without colliding. Slot 0 is reserved for explosive mines that
    // are tracked in this.mines and animated/checked each frame.
    this.mines = [];
    const placements = [];
    const tries = 60;
    for (let i = 0; i < tries; i++) {
      const cx = Phaser.Math.Between(3, MAP_W - 4);
      const cy = Phaser.Math.Between(3, MAP_H - 4);
      if (this.map[cy][cx] === '#') continue;
      // Avoid base zone (mines and decorations)
      if (Math.hypot(cx - 25, cy - 36) < 4) continue;
      // Mines additionally need a slightly larger no-spawn zone so the
      // player isn't immediately blown up the moment they leave the base.
      const isMine = (i % 4) === 0;
      if (isMine && Math.hypot(cx - 25, cy - 36) < 6) continue;
      // Don't drop a mine right on a brainrot tile either
      if (isMine) {
        const t = this.map[cy][cx];
        if (t >= '1' && t <= '5') continue;
      }
      placements.push({ cx, cy, kind: i % 4 });
    }

    placements.forEach((p) => {
      const wx = tx(p.cx) + Phaser.Math.FloatBetween(-8, 8);
      const wy = tx(p.cy) + Phaser.Math.FloatBetween(-8, 8);

      if (p.kind === 0) {
        // MINE - explosive hazard. Tracked separately for collision checks.
        this.spawnMine(wx, wy);
        return;
      }

      const g = this.add.graphics().setDepth(wy - 40);

      if (p.kind === 1) {
        // Sea urchin - dark spiky ball
        g.fillStyle(0x2a0a1a, 0.95);
        g.fillCircle(wx, wy, 5);
        g.lineStyle(1, 0x4a1a3a, 0.9);
        for (let k = 0; k < 14; k++) {
          const ang = (k / 14) * Math.PI * 2;
          g.lineBetween(wx, wy, wx + Math.cos(ang) * 9, wy + Math.sin(ang) * 9);
        }
        g.fillStyle(0x6a2a4a, 0.9);
        g.fillCircle(wx - 1, wy - 1, 2.2);
      } else if (p.kind === 2) {
        // Starfish
        g.fillStyle(0xff8c4a, 0.95);
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2 - Math.PI / 2;
          const tipX = wx + Math.cos(ang) * 6;
          const tipY = wy + Math.sin(ang) * 6;
          g.fillTriangle(
            wx + Math.cos(ang + 0.6) * 3, wy + Math.sin(ang + 0.6) * 3,
            wx + Math.cos(ang - 0.6) * 3, wy + Math.sin(ang - 0.6) * 3,
            tipX, tipY,
          );
        }
        g.fillStyle(0xffc88a, 1);
        g.fillCircle(wx, wy, 2.5);
        g.fillStyle(0xffe0b8, 0.85);
        g.fillCircle(wx - 1, wy - 1, 1);
      } else {
        // Coral fan - small colored frond
        g.fillStyle(0xff5e7a, 0.85);
        g.fillEllipse(wx, wy + 1, 4, 2);
        g.lineStyle(1.5, 0xffaac4, 0.9);
        for (let k = 0; k < 5; k++) {
          const ang = -Math.PI / 2 + (k - 2) * 0.35;
          g.lineBetween(wx, wy, wx + Math.cos(ang) * 6, wy + Math.sin(ang) * 6);
        }
        g.fillStyle(0xffc0d0, 1);
        g.fillCircle(wx + 0.5, wy - 1, 1.4);
      }
    });
  }

  /* ----- mines (Level 3 ocean hazard) ----- */

  spawnMine(wx, wy) {
    const g = this.add.graphics();
    g.x = wx;
    g.y = wy;
    g.setDepth(wy - 30);
    const mine = {
      x: wx,
      y: wy,
      g,
      radius: 22,         // proximity that triggers detonation
    };
    this.drawMineSprite(g, 1);
    this.mines.push(mine);
  }

  drawMineSprite(g, pulse) {
    g.clear();
    // Outer red warning halo
    g.fillStyle(0xff2040, 0.16 * pulse);
    g.fillCircle(0, 0, 22);
    g.fillStyle(0xff4060, 0.20 * pulse);
    g.fillCircle(0, 0, 16);
    // 8 dark spikes around the body
    g.fillStyle(0x0a0e1a, 1);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const tipX = Math.cos(ang) * 14;
      const tipY = Math.sin(ang) * 14;
      g.fillTriangle(
        Math.cos(ang + 0.22) * 7, Math.sin(ang + 0.22) * 7,
        Math.cos(ang - 0.22) * 7, Math.sin(ang - 0.22) * 7,
        tipX, tipY,
      );
    }
    // Dark body
    g.fillStyle(0x12182a, 1);
    g.fillCircle(0, 0, 9);
    g.fillStyle(0x223046, 1);
    g.fillCircle(-1.5, -1.5, 7);
    g.fillStyle(0x3a4a66, 0.7);
    g.fillCircle(-2, -2, 4);
    // Glowing red warning dot (pulses)
    g.fillStyle(0xff80a0, 0.7 * pulse);
    g.fillCircle(0, 0, 5);
    g.fillStyle(0xff2040, pulse);
    g.fillCircle(0, 0, 3);
    g.fillStyle(0xffe0e0, pulse * 0.85);
    g.fillCircle(-0.5, -0.5, 1.4);
  }

  updateMines(time) {
    if (!this.mines || this.mines.length === 0) return;
    const pulse = 0.55 + Math.sin(time / 240) * 0.45;
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      this.drawMineSprite(m.g, pulse);
      // Player collision (skip during invincibility frames)
      if (this.invincibleUntil <= time) {
        const dx = this.player.x - m.x;
        const dy = this.player.y - m.y;
        if (Math.hypot(dx, dy) < m.radius) {
          this.explodeMine(m, time);
          this.mines.splice(i, 1);
        }
      }
    }
  }

  explodeMine(m, time) {
    // Outer shockwave ring
    const ring = this.add.circle(m.x, m.y, 18, 0xff4060, 0.7).setDepth(m.y + 50);
    this.tweens.add({
      targets: ring,
      scale: 5,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
    // Inner bright flash
    const flash = this.add.circle(m.x, m.y, 22, 0xffe890, 1).setDepth(m.y + 60);
    this.tweens.add({
      targets: flash,
      scale: 2.6,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
    // Smoke puff
    const smoke = this.add.circle(m.x, m.y - 4, 14, 0x4a3a3a, 0.65).setDepth(m.y + 55);
    this.tweens.add({
      targets: smoke,
      y: m.y - 30,
      scale: 2.0,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => smoke.destroy(),
    });
    // Shrapnel particles
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 32 + Math.random() * 26;
      const sz = 2 + Math.random() * 2;
      const color = i % 2 === 0 ? 0xff8060 : 0xffd066;
      const p = this.add.circle(m.x, m.y, sz, color, 1).setDepth(m.y + 65);
      this.tweens.add({
        targets: p,
        x: m.x + Math.cos(ang) * dist,
        y: m.y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 480 + Math.random() * 220,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    this.cameras.main.shake(260, 0.014);
    Sfx.play('hit');
    m.g.destroy();

    // Damage + radial knockback (only if not in iframes; updateMines guards
    // this, but we double-check defensively).
    if (this.invincibleUntil <= time) {
      this.onPlayerHit(time);
      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.player.body.setVelocity((dx / dist) * 380, (dy / dist) * 380);
    }
  }

  spawnFishSchool() {
    // School of small fish drifts horizontally across the world.
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -60 : WORLD_W + 60;
    const endX = fromLeft ? WORLD_W + 60 : -60;
    const startY = Phaser.Math.Between(3 * TILE, WORLD_H - 3 * TILE);
    const endY = startY + Phaser.Math.Between(-180, 180);
    const count = Phaser.Math.Between(4, 7);
    const speed = 80 + Math.random() * 50;
    const dur = (Math.abs(endX - startX) / speed) * 1000;
    const palette = ['🐟', '🐠', '🐡'];
    const emoji = palette[Phaser.Math.Between(0, palette.length - 1)];

    for (let i = 0; i < count; i++) {
      const lag = i * (60 + Math.random() * 40);
      const offsetY = (Math.random() - 0.5) * 24;
      const sx = startX + (fromLeft ? -lag : lag);
      const fish = this.add.text(sx, startY + offsetY, emoji, {
        fontSize: '18px',
      }).setOrigin(0.5);
      fish.setAlpha(0.92);
      fish.setDepth(startY + offsetY + 200);
      if (fromLeft) fish.setFlipX(true);

      this.tweens.add({
        targets: fish,
        x: endX + (fromLeft ? -lag : lag),
        y: endY + offsetY,
        duration: dur,
        ease: 'Sine.easeInOut',
        onComplete: () => fish.destroy(),
      });
      this.tweens.add({
        targets: fish,
        scaleY: 1.15,
        duration: 240 + i * 30,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  spawnSeaTurtle() {
    // Sea turtle slowly crosses horizontally - purely decorative.
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -50 : WORLD_W + 50;
    const endX = fromLeft ? WORLD_W + 50 : -50;
    const y = Phaser.Math.Between(4 * TILE, WORLD_H - 4 * TILE);
    const dur = 22000 + Math.random() * 6000;
    const turtle = this.add.text(startX, y, '🐢', {
      fontSize: '30px',
    }).setOrigin(0.5).setAlpha(0.9);
    turtle.setDepth(y + 220);
    if (!fromLeft) turtle.setFlipX(true);

    this.tweens.add({
      targets: turtle,
      x: endX,
      duration: dur,
      ease: 'Linear',
      onComplete: () => turtle.destroy(),
    });
    this.tweens.add({
      targets: turtle,
      y: y - 10,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  updateOceanAmbience(time) {
    if (this.biome !== 'ocean') return;
    if (time > this.nextBubbleAt) {
      const bx = Phaser.Math.Between(2 * TILE, WORLD_W - 2 * TILE);
      const by = Phaser.Math.Between(2 * TILE, WORLD_H - 2 * TILE);
      const r = Phaser.Math.FloatBetween(2, 4);
      const sprite = this.add.circle(bx, by, r, 0xc8edf6, 0.65)
        .setStrokeStyle(1, 0xffffff, 0.85)
        .setDepth(by + 60);
      this.tweens.add({
        targets: sprite,
        y: by - 80 - Math.random() * 40,
        alpha: 0,
        scale: 0.6,
        duration: 1800 + Math.random() * 800,
        ease: 'Sine.easeOut',
        onComplete: () => sprite.destroy(),
      });
      this.nextBubbleAt = time + 220 + Math.random() * 160;
    }

    if (time > this.nextSchoolAt) {
      this.spawnFishSchool();
      this.nextSchoolAt = time + 5000 + Math.random() * 4000;
    }

    if (time > this.nextJellyAt) {
      this.spawnJellyfishHazard();
      // 35% chance to immediately spawn a paired jelly for cluster pressure
      if (Math.random() < 0.35) {
        this.time.delayedCall(450 + Math.random() * 400, () => {
          if (this.scene.isActive() && this.biome === 'ocean') {
            this.spawnJellyfishHazard();
          }
        });
      }
      // Aggressive cadence: a new jelly every ~2.4 - 4.5 s
      this.nextJellyAt = time + 2400 + Math.random() * 2100;
    }

    if (time > this.nextTurtleAt) {
      this.spawnSeaTurtle();
      this.nextTurtleAt = time + 14000 + Math.random() * 8000;
    }

    this.updateJellyfishHazard(time);
    this.updateMines(time);
  }

  createWallColliders() {
    this.wallsGroup = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      let runStart = -1;
      for (let x = 0; x <= MAP_W; x++) {
        const isWall = x < MAP_W && this.map[y][x] === '#';
        if (isWall && runStart === -1) runStart = x;
        else if (!isWall && runStart !== -1) {
          const runLen = x - runStart;
          const cx = runStart * TILE + (runLen * TILE) / 2;
          const cy = y * TILE + TILE / 2;
          const w = this.add.zone(cx, cy, runLen * TILE, TILE).setOrigin(0.5);
          this.physics.add.existing(w, true);
          this.wallsGroup.add(w);
          runStart = -1;
        }
      }
    }
  }

  /* ----- torches ----- */

  createTorches() {
    this.torches = [];
    if (this.biome !== 'temple') return;
    this.torchSpawns.forEach(({ x, y }) => {
      const px = tx(x), py = tx(y);
      const flame = this.add.text(px, py - 4, '🔥', { fontSize: '22px' }).setOrigin(0.5);
      flame.setDepth(py + 8);
      this.tweens.add({
        targets: flame, scale: 1.15,
        duration: 280 + Math.random() * 120,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.torches.push({ x: px, y: py, sprite: flame });
    });
  }

  /* ----- base / portal ----- */

  createBase() {
    const x = this.baseSpawn.x;
    const y = this.baseSpawn.y;

    this.baseGlow = this.add.circle(x, y, 60, 0x9c6bff, 0.22).setDepth(-50);
    this.tweens.add({
      targets: this.baseGlow, alpha: 0.4, scale: 1.1,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Bloop levels show an additional safe-zone halo so the player can read
    // exactly how far the protection extends.
    if (this.levelConfig?.hazard === 'bloop') {
      this.baseSafeZone = this.add.graphics().setDepth(-45);
      this.baseSafeRingPulse = 0;
    }

    this.baseRing = this.add.graphics().setDepth(-20);
    this.redrawBase();

    this.baseLabel = this.add.text(x, y - 60, 'BASE', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '10px', color: '#cbb3ff',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setOrigin(0.5);
    this.baseLabel.setDepth(y - 60);

    this.statueSlots = [];
    this.levelBrainrots.forEach((b, i) => {
      const angle = -Math.PI + (i / 5) * Math.PI;
      const sx = x + Math.cos(angle) * 64;
      const sy = y + Math.sin(angle) * 38;
      const s = makeBrainrotVisual(this, sx, sy, b, 24).setAlpha(0.25);
      s.setDepth(sy);
      this.statueSlots.push({ id: b.id, sprite: s });
    });
  }

  redrawBase() {
    const g = this.baseRing;
    const x = this.baseSpawn.x;
    const y = this.baseSpawn.y;
    g.clear();
    if (this.portalActive) {
      g.fillStyle(0x9c6bff, 0.5);
      g.fillCircle(x, y, 42);
      g.lineStyle(4, 0xffe066, 1);
      g.strokeCircle(x, y, 42);
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeCircle(x, y, 32);
      g.strokeCircle(x, y, 24);
    } else {
      g.fillStyle(0x3a234d, 0.6);
      g.fillCircle(x, y, 40);
      g.lineStyle(3, 0x9c6bff, 0.9);
      g.strokeCircle(x, y, 40);
      g.lineStyle(1, 0xcbb3ff, 0.7);
      g.strokeCircle(x, y, 32);
      g.strokeCircle(x, y, 24);
    }
  }

  /* ----- brainrots ----- */

  createBrainrots() {
    this.brainrots = [];
    const isDesert = this.biome === 'desert';
    const isOcean = this.biome === 'ocean';
    const isLava = this.biome === 'lava';
    Object.values(this.brainrotSpawns).forEach((spawn) => {
      const px = tx(spawn.x), py = tx(spawn.y);
      const data = spawn.data;

      // In the open desert, give brainrots a warm sunset glow behind them so they
      // pop against the sand without reading as a dark crater pit.
      if (isDesert) {
        const glowOuter = this.add.circle(px, py + 4, 40, 0xffd28a, 0.18);
        glowOuter.setDepth(-13);
        const glow = this.add.circle(px, py + 4, 26, 0xffe39a, 0.30);
        glow.setDepth(-12);
      }
      // Underwater: a soft phosphorescent cyan glow so the brainrots pop
      // against the muted seafloor, reading as bioluminescent oddities.
      if (isOcean) {
        const glowOuter = this.add.circle(px, py + 4, 42, 0x9be4f0, 0.16);
        glowOuter.setDepth(-13);
        const glow = this.add.circle(px, py + 4, 28, 0xc8f0f8, 0.28);
        glow.setDepth(-12);
      }
      // Lava biome: a cool teal halo so the brainrots cut through the
      // bright orange floor instead of blending into it.
      if (isLava) {
        const glowOuter = this.add.circle(px, py + 4, 44, 0x46e6dc, 0.18);
        glowOuter.setDepth(-13);
        const glow = this.add.circle(px, py + 4, 28, 0xb8fff6, 0.32);
        glow.setDepth(-12);
      }

      // Soft, organic ground shadow built from layered low-alpha ellipses.
      // The decreasing alpha and asymmetric offsets give the shadow a feathered
      // edge and a slightly irregular silhouette instead of a hard oval stamp.
      const shadow = this.add.graphics();
      let shCol, shadowLayers;
      if (isDesert) {
        shCol = 0x4a2510;
        shadowLayers = [
          { ox: -2, oy: 1,  w: 40, h: 15, a: 0.05 },
          { ox: 2,  oy: 0,  w: 34, h: 13, a: 0.09 },
          { ox: -1, oy: -1, w: 28, h: 11, a: 0.13 },
          { ox: 1,  oy: 0,  w: 22, h: 9,  a: 0.18 },
          { ox: 0,  oy: -1, w: 16, h: 6,  a: 0.24 },
        ];
      } else if (isOcean) {
        shCol = 0x031c33;
        shadowLayers = [
          { ox: -2, oy: 1,  w: 40, h: 15, a: 0.06 },
          { ox: 2,  oy: 0,  w: 34, h: 13, a: 0.10 },
          { ox: -1, oy: -1, w: 28, h: 11, a: 0.16 },
          { ox: 1,  oy: 0,  w: 22, h: 9,  a: 0.22 },
          { ox: 0,  oy: -1, w: 16, h: 6,  a: 0.28 },
        ];
      } else if (isLava) {
        shCol = 0x100808;
        shadowLayers = [
          { ox: -2, oy: 1,  w: 40, h: 15, a: 0.10 },
          { ox: 2,  oy: 0,  w: 34, h: 13, a: 0.16 },
          { ox: -1, oy: -1, w: 28, h: 11, a: 0.22 },
          { ox: 1,  oy: 0,  w: 22, h: 9,  a: 0.30 },
          { ox: 0,  oy: -1, w: 14, h: 5,  a: 0.40 },
        ];
      } else {
        shCol = 0x05030a;
        shadowLayers = [
          { ox: -2, oy: 1,  w: 38, h: 14, a: 0.08 },
          { ox: 2,  oy: 0,  w: 32, h: 12, a: 0.14 },
          { ox: -1, oy: -1, w: 26, h: 10, a: 0.22 },
          { ox: 1,  oy: 0,  w: 20, h: 7,  a: 0.30 },
          { ox: 0,  oy: -1, w: 14, h: 5,  a: 0.38 },
        ];
      }
      shadowLayers.forEach((l) => {
        shadow.fillStyle(shCol, l.a);
        shadow.fillEllipse(l.ox, l.oy, l.w, l.h);
      });
      shadow.x = px;
      shadow.y = py + 16;
      shadow.setDepth(-10);

      const sprite = makeBrainrotVisual(this, px, py, data, 56);
      sprite.setDepth(py);

      const label = this.add.text(px, py + 34, data.name, {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '8px', color: '#fde58c',
        stroke: '#1a0a08', strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5).setAlpha(0);
      label.setDepth(py + 1);

      this.tweens.add({
        targets: sprite, y: py - 6,
        duration: 900 + Math.random() * 300,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.brainrots.push({
        id: data.id,
        data,
        sprite,
        label,
        shadow,
        homeX: px,
        homeY: py,
        state: 'wild',
      });
    });
  }

  applyDepositedState() {
    if (!this.deposited || this.deposited.size === 0) return;
    this.brainrots.forEach((b) => {
      if (this.deposited.has(b.id)) {
        this.tweens.killTweensOf(b.sprite);
        b.sprite.setVisible(false);
        b.shadow.setVisible(false);
        b.label.setVisible(false);
        b.state = 'deposited';
      }
    });
    this.statueSlots.forEach((slot) => {
      if (this.deposited.has(slot.id)) {
        slot.sprite.setAlpha(1);
        setBrainrotScale(slot.sprite, 1.4);
      }
    });
  }

  /* ----- axes ----- */

  createAxes() {
    this.axes = [];
    this.axeSpawns.forEach((spawn, i) => {
      const ax = tx(spawn.x), ay = tx(spawn.y);
      const length = 84 + ((i * 17) % 12);
      const period = 1500 + ((i * 311) % 900);
      const phase  = (i * 421) % 1500;

      const chain = this.add.graphics();
      const blade = this.add.text(0, 0, '🪓', { fontSize: '36px' }).setOrigin(0.5);
      const container = this.add.container(ax, ay, [chain, blade]);

      // Ceiling anchor block (visual)
      const anchor = this.add.rectangle(ax, ay, 12, 12, 0x4a2e1f).setStrokeStyle(2, 0x6b4327);
      anchor.setDepth(ay + 1);

      const axe = {
        anchorX: ax, anchorY: ay,
        length, period, phase,
        chain, blade, container, anchor,
        bladeWorldX: ax, bladeWorldY: ay + length,
      };
      this.axes.push(axe);
    });
  }

  /* ----- player ----- */

  createPlayer() {
    const px = this.baseSpawn.x;
    const py = this.baseSpawn.y - 4;

    this.playerShadow = this.add.ellipse(px, py + 16, 22, 8, 0x000000, 0.5);
    this.playerShadow.setDepth(-10);

    // The "player" is two objects glued together every frame:
    //   - this.player        - an invisible Text used as the physics anchor.
    //                          It always sits at ground level so collisions,
    //                          world bounds, and tile lookups stay correct
    //                          even while the player is mid-jump.
    //   - this.playerVisual  - the visible boy avatar sprite. updateDepthSort()
    //                          syncs it to this.player.x and applies the
    //                          jumpLift y-offset so the jump renders cleanly
    //                          without disturbing physics.
    this.player = this.add.text(px, py, '🏃', { fontSize: '36px' })
      .setOrigin(0.5)
      .setVisible(false);
    this.physics.add.existing(this.player);
    this.player.body.setSize(20, 20).setOffset(8, 12);
    this.player.body.setCollideWorldBounds(true);
    this.player.setDepth(py);

    // Per-level avatar swap: ocean level uses the scuba diver, every other
    // level uses the default boy avatar. Sized to match the visible footprint
    // of an in-world brainrot (see PLAYER_AVATAR_* / PLAYER_SCUBA_* constants).
    const isOcean = this.levelId === 3;
    const avatarKey = isOcean ? 'sprite_player_boy_scuba' : 'sprite_player_boy';
    const dispW = isOcean ? PLAYER_SCUBA_W : PLAYER_AVATAR_W;
    const dispH = isOcean ? PLAYER_SCUBA_H : PLAYER_AVATAR_H;
    this.playerVisual = this.add.image(px, py, avatarKey)
      .setOrigin(0.5)
      .setDisplaySize(dispW, dispH)
      .setDepth(py);
    // Capture the displaySize-baked scale as the BASE scale. The walk-bob
    // animation multiplies by this so setScale() doesn't blow the avatar
    // back up to its native source size (256×256 / 800×512).
    this.playerBaseScaleX = this.playerVisual.scaleX;
    this.playerBaseScaleY = this.playerVisual.scaleY;

    // Jump state - the lift is recomputed every frame in updateJump().
    this.jumpLift = 0;
    this.isAirborne = false;
    this.jumpStartedAt = -10000;

    // Distance-based carry trail. Each entry is { x, y, d } where `d` is the
    // cumulative distance the player has traveled at the moment the entry was
    // recorded. Sampling by distance (instead of frame index) keeps each
    // carried brainrot at a fixed pixel offset behind the next one, so the
    // trail looks like a snake / worm even when the player is slowed down by
    // a heavy load.
    this.carryTrail = [];
    this.carryTrailDist = 0;
    this.carried = [];
  }

  /* ----- lighting ----- */

  createLighting() {
    this.darkness = null;
    if (this.biome !== 'temple') return;
    // The darkness rendertexture renders on the UI camera (zoom 1, screen
    // space), so the light textures need to be sized to the *zoomed* light
    // radius - otherwise the lit area would feel tiny when the gameplay
    // camera is zoomed in.
    this.lightLargeR = Math.round(PLAYER_LIGHT_RADIUS * GAME_ZOOM);
    this.lightSmallR = Math.round(TORCH_LIGHT_RADIUS * GAME_ZOOM);
    this.makeLightTexture('lightLarge', this.lightLargeR, 22);
    this.makeLightTexture('lightSmall', this.lightSmallR, 14);

    this.darkness = this.add.renderTexture(0, 0, GAME_W, GAME_H)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(8000);
  }

  makeLightTexture(key, radius, steps) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    for (let i = steps; i >= 1; i--) {
      const r = (i / steps) * radius;
      const alpha = Math.pow((steps - i + 1) / steps, 2.2);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(radius, radius, r);
    }
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  updateLighting() {
    if (!this.darkness) return;
    const cam = this.cameras.main;
    const z = cam.zoom || 1;
    this.darkness.clear();
    this.darkness.fill(DARKNESS_COLOR, DARKNESS_ALPHA);

    const lr = this.lightLargeR;
    const sr = this.lightSmallR;

    // Convert world coords to screen coords (the darkness rt lives on the UI
    // camera at zoom 1, so we need (worldX - cam.scrollX) * cam.zoom).
    const toScreenX = (wx) => (wx - cam.scrollX) * z;
    const toScreenY = (wy) => (wy - cam.scrollY) * z;

    const px = toScreenX(this.player.x);
    const py = toScreenY(this.player.y);
    this.darkness.erase('lightLarge', px - lr, py - lr);

    this.torches.forEach((t) => {
      const txs = toScreenX(t.x);
      const tys = toScreenY(t.y);
      if (txs > -160 && txs < GAME_W + 160 && tys > -160 && tys < GAME_H + 160) {
        const flicker = sr + Math.sin(this.scene.systems.game.loop.time / 90 + t.x * 0.01) * 6;
        this.darkness.erase('lightSmall', txs - flicker, tys - flicker);
      }
    });

    if (this.portalActive) {
      const bx = toScreenX(this.baseSpawn.x);
      const by = toScreenY(this.baseSpawn.y);
      this.darkness.erase('lightLarge', bx - lr, by - lr);
    }
  }

  /* ----- jump button (on-screen, mobile-friendly) ----- */

  createJumpButton() {
    const x = GAME_W - 70;
    const y = GAME_H - 70;
    // Visible ring stays at 42, but the tappable region is bumped way up
    // to 64 so off-center thumbs still register on iPad landscape. Trying
    // to hit a 42-px circle in the bottom-right corner while the other
    // thumb drags the joystick is a fiddly task; double the slack helps.
    const visualR = 42;
    const hitR = 64;
    this.jumpBtn = this.add.container(x, y).setScrollFactor(0).setDepth(11500);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f1f, 0.55);
    bg.fillCircle(0, 0, visualR);
    bg.lineStyle(3, 0xffe066, 0.85);
    bg.strokeCircle(0, 0, visualR);
    const label = this.add.text(0, -2, 'JUMP', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '11px', color: '#ffe066',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setOrigin(0.5);
    const hint = this.add.text(0, 18, '(space)', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '7px', color: '#cbb3ff',
    }).setOrigin(0.5);
    this.jumpBtnBg = bg;
    this.jumpBtnLabel = label;
    this.jumpBtn.add([bg, label, hint]);

    // Hit-test happens in TouchButtonRegistry, NOT via setInteractive. The
    // visible button still lives on the uiCamera (zoom 1), but Phaser's
    // input plugin was sending hits through cameras.main (zoom 1.6) on
    // iPad, leaving the hit zone offset from the visible ring. The
    // registry compares the pointer's canvas pixel directly to the
    // button's screen position - no camera transform, exact match.
    this.touchButtons.add({
      x: x,
      y: y,
      shape: 'circle',
      hitR: hitR,
      onTap: () => {
        // Tap feedback: pulse the LABEL only. Scaling the container would
        // also scale the visual ring, but more importantly any hit-area
        // shrink mid-animation is no longer possible because we're not
        // using container-bound geometry anymore.
        this.tweens.killTweensOf(this.jumpBtnLabel);
        this.jumpBtnLabel.setScale(1);
        this.tweens.add({
          targets: this.jumpBtnLabel,
          scale: { from: 1.28, to: 1 },
          duration: 130,
          ease: 'Cubic.easeOut',
        });
        this.tryJump(this.time.now);
      },
    });
  }

  updateJumpButton(time) {
    if (!this.jumpBtn || !this.jumpBtnBg) return;
    const onCooldown =
      this.isAirborne ||
      (time - this.jumpStartedAt < JUMP_DURATION_MS + JUMP_COOLDOWN_MS);
    const bg = this.jumpBtnBg;
    bg.clear();
    if (onCooldown) {
      // Filled progress arc indicates remaining cooldown (drawn as fill alpha).
      bg.fillStyle(0x1a0f1f, 0.40);
      bg.fillCircle(0, 0, 42);
      bg.lineStyle(3, 0x6a4f6a, 0.7);
      bg.strokeCircle(0, 0, 42);
      this.jumpBtnLabel.setColor('#6a4f6a');
    } else {
      const pulse = 0.55 + Math.sin(time / 200) * 0.10;
      bg.fillStyle(0x1a0f1f, pulse);
      bg.fillCircle(0, 0, 42);
      bg.lineStyle(3, 0xffe066, 0.95);
      bg.strokeCircle(0, 0, 42);
      this.jumpBtnLabel.setColor('#ffe066');
    }
  }

  /* ----- HUD ----- */

  createHUD() {
    this.hudCollected = this.add.text(12, 8, 'Collected 0/5', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '12px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(10000);

    this.hudLevel = this.add.text(12, 30, `Lv ${this.levelId} - ${this.levelConfig.name}`, {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '9px', color: '#cbb3ff',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(10000);

    this.hudCarried = this.add.text(GAME_W - 12, 8, 'BAG 0', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '12px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10000);

    // Pixel-art hearts replace the emoji ❤️ to match the pixel-font HUD.
    // Containers (not text) so they tween cleanly via loseHeart() and
    // can be alpha-dimmed on hits.
    this.hudHearts = [];
    const heartSpacing = 34;
    const heartPx = 4;
    const heartH = PIXEL_HEART_PATTERN.length * heartPx;
    const heartsTotalWidth = (STARTING_HEARTS - 1) * heartSpacing;
    const heartStartX = GAME_W / 2 - heartsTotalWidth / 2;
    const heartCenterY = 14 + heartH / 2;
    for (let i = 0; i < STARTING_HEARTS; i++) {
      const h = makePixelHeart(this, heartStartX + i * heartSpacing, heartCenterY, {
        px: heartPx,
      })
        .setScrollFactor(0)
        .setDepth(10000);
      if (i >= this.hearts) h.setAlpha(0.2);
      this.hudHearts.push(h);
    }
  }

  flashText(message, durationMs = 1500) {
    // Zelda-style flash: pixel-font cream-gold text on a dark plum slab
    // with a thin gold border. Same banner mechanics as before (top-of-
    // screen, fades, ignored by world + sky cameras), just dressed to
    // match the narrative cards and the title menu.
    const padX = 18;
    const padY = 12;
    const text = this.add.text(GAME_W / 2, 50, message, {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '12px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 3,
      align: 'center', lineSpacing: 4,
      wordWrap: { width: GAME_W - 80, useAdvancedWrap: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002);
    const tw = text.width + padX * 2;
    const th = text.height + padY * 2;
    const box = this.add.graphics().setScrollFactor(0).setDepth(10001);
    box.fillStyle(0x0a0610, 0.92);
    box.fillRoundedRect(GAME_W / 2 - tw / 2, 50 - th / 2, tw, th, 8);
    box.lineStyle(2, 0xfde58c, 0.9);
    box.strokeRoundedRect(GAME_W / 2 - tw / 2, 50 - th / 2, tw, th, 8);
    box.lineStyle(1, 0xffe066, 0.45);
    box.strokeRoundedRect(GAME_W / 2 - tw / 2 + 4, 50 - th / 2 + 4, tw - 8, th - 8, 6);

    if (this.cameras && this.cameras.main) {
      this.cameras.main.ignore(text);
      this.cameras.main.ignore(box);
    }
    if (this.skyCamera) {
      this.skyCamera.ignore(text);
      this.skyCamera.ignore(box);
    }
    this.tweens.add({
      targets: [text, box], alpha: 0, duration: 400, delay: durationMs,
      onComplete: () => { text.destroy(); box.destroy(); },
    });
  }

  /* ----- update loop ----- */

  update(time, delta) {
    if (this.gameOver) return;

    this.handleMovement(time);
    this.updateJump(time);
    this.updateJumpButton(time);
    if (this.levelConfig.hazard === 'axe') {
      this.updateAxes(time);
    } else if (this.levelConfig.hazard === 'meteor') {
      this.updateMeteors(time);
      this.updateFires(time);
    } else if (this.levelConfig.hazard === 'bloop') {
      this.updateBloop(time);
      this.drawBaseSafeZone(time);
    } else if (this.levelConfig.hazard === 'lava') {
      this.updateLavaTouch(time);
      this.updateGeysers(time);
      this.updateLavaAmbience(time, delta);
    }
    this.updateOceanAmbience(time);
    this.updateCarried();
    this.updateBrainrotLabels();
    this.checkPickups();
    if (this.levelConfig.hazard === 'axe') {
      this.checkAxeHits(time);
    }
    this.checkBaseInteraction(time);
    this.updateDepthSort();
    this.updateLighting();
    this.updatePlayerInvincibilityVisual(time);
  }

  /* ----- movement ----- */

  handleMovement(time) {
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown  || this.wasd.S.isDown) vy = 1;

    const stick = this.joystick.getVector();
    if (stick.x !== 0 || stick.y !== 0) {
      vx = stick.x; vy = stick.y;
    }
    const mag = Math.hypot(vx, vy);
    if (mag > 1) { vx /= mag; vy /= mag; }

    const speed = Math.max(MIN_CARRY_SPEED, BASE_SPEED - this.carried.length * CARRY_PENALTY);
    this.player.body.setVelocity(vx * speed, vy * speed);

    const moving = mag > 0.1;
    if (moving) {
      const facingX = vx < 0 ? -1 : 1;
      const bob = 1 + Math.sin(time / 90) * 0.06;
      // Multiply by the base scale so the avatar keeps its display size and
      // only the sign / bob factor changes.
      this.playerVisual.setScale(
        this.playerBaseScaleX * facingX,
        this.playerBaseScaleY * bob,
      );

      // Push to the distance-based carry trail.
      const last = this.carryTrail[0];
      if (!last) {
        this.carryTrail.unshift({ x: this.player.x, y: this.player.y, d: 0 });
      } else {
        const step = Math.hypot(this.player.x - last.x, this.player.y - last.y);
        // Only record samples a meaningful distance apart so we don't fill the
        // trail with duplicate points when the player is near-stationary.
        if (step >= 1.5) {
          this.carryTrailDist += step;
          this.carryTrail.unshift({ x: this.player.x, y: this.player.y, d: this.carryTrailDist });
          // Trim by total distance covered, not by array length, so the trail
          // is always long enough for the longest possible carry stack.
          const MAX_TRAIL_DIST = CARRY_SPACING * 12 + 80;
          while (this.carryTrail.length > 1) {
            const oldest = this.carryTrail[this.carryTrail.length - 1];
            if (this.carryTrailDist - oldest.d > MAX_TRAIL_DIST) {
              this.carryTrail.pop();
            } else {
              break;
            }
          }
        }
      }
    } else {
      // Idle: keep current facing (sign of scaleX), reset bob to 1, but always
      // honor the base scale so the avatar stays at its intended display size.
      const sign = this.playerVisual.scaleX < 0 ? -1 : 1;
      this.playerVisual.setScale(this.playerBaseScaleX * sign, this.playerBaseScaleY);
    }
  }

  /* ----- jump ----- */

  tryJump(time) {
    if (this.gameOver) return;
    if (this.isAirborne) return;
    if (time - this.jumpStartedAt < JUMP_DURATION_MS + JUMP_COOLDOWN_MS) return;
    this.isAirborne = true;
    this.jumpStartedAt = time;
    this.jumpLift = 0.001;
    Sfx.play('pickup');  // light "pop" - reuses an existing SFX
    // Tiny squash on takeoff for some juice. Multiply by the base scale so
    // the tween doesn't reset the avatar to its native 256-px source size.
    const baseY = this.playerBaseScaleY;
    this.tweens.add({
      targets: this.playerVisual,
      scaleY: { from: baseY * 1.18, to: baseY },
      duration: 140,
      ease: 'Sine.easeOut',
    });
  }

  updateJump(time) {
    if (!this.isAirborne) {
      this.jumpLift = 0;
      return;
    }
    const t = (time - this.jumpStartedAt) / JUMP_DURATION_MS;
    if (t >= 1) {
      this.jumpLift = 0;
      this.isAirborne = false;
      // Landing squash for juice. See note in tryJump - multiply by the base
      // scale so the tween doesn't snap the avatar back to native source size.
      const baseY = this.playerBaseScaleY;
      this.tweens.add({
        targets: this.playerVisual,
        scaleY: { from: baseY * 0.85, to: baseY },
        duration: 130,
        ease: 'Sine.easeOut',
      });
      return;
    }
    // Parabolic arc: sin(t * π) is 0 at t=0, peak 1 at t=0.5, 0 at t=1.
    this.jumpLift = Math.sin(t * Math.PI) * JUMP_HEIGHT_PX;
  }

  /* ----- axes ----- */

  updateAxes(time) {
    this.axes.forEach((axe) => {
      const t = (time + axe.phase) / axe.period;
      const angle = Math.sin(t * Math.PI * 2) * (Math.PI / 3);
      const bx = axe.anchorX + Math.sin(angle) * axe.length;
      const by = axe.anchorY + Math.cos(angle) * axe.length;

      axe.chain.clear();
      axe.chain.lineStyle(2, 0x666666, 1);
      axe.chain.lineBetween(0, 0, Math.sin(angle) * axe.length, Math.cos(angle) * axe.length);

      axe.blade.setPosition(Math.sin(angle) * axe.length, Math.cos(angle) * axe.length);
      axe.blade.setRotation(angle);

      axe.bladeWorldX = bx;
      axe.bladeWorldY = by;
      axe.container.setDepth(by);
    });
  }

  /* ----- carry trail ----- */

  updateCarried() {
    if (this.carried.length === 0) return;

    // No movement yet -> stack at the player so the brainrots don't pop in
    // somewhere unexpected. They'll spread out the moment the player walks.
    if (this.carryTrail.length === 0) {
      this.carried.forEach((c) => {
        c.sprite.setPosition(this.player.x, this.player.y);
        c.shadow.setPosition(this.player.x, this.player.y + 16);
      });
      return;
    }

    const headD = this.carryTrail[0].d;
    const oldestD = this.carryTrail[this.carryTrail.length - 1].d;

    this.carried.forEach((c, i) => {
      const targetD = headD - CARRY_SPACING * (i + 1);
      let pos;
      if (targetD <= oldestD) {
        // Trail not long enough yet; clamp to the oldest recorded point.
        const oldest = this.carryTrail[this.carryTrail.length - 1];
        pos = { x: oldest.x, y: oldest.y };
      } else {
        pos = this.sampleCarryTrail(targetD);
      }
      c.sprite.setPosition(pos.x, pos.y - 4);
      c.shadow.setPosition(pos.x, pos.y + 12);
    });
  }

  // Walk newest -> oldest to find the segment [a, b] whose cumulative
  // distances span `targetD`, then linearly interpolate. Trail is short
  // (a few dozen entries at most) so a linear scan is cheap.
  sampleCarryTrail(targetD) {
    const trail = this.carryTrail;
    for (let j = 0; j < trail.length - 1; j++) {
      const a = trail[j];
      const b = trail[j + 1];
      if (a.d >= targetD && b.d <= targetD) {
        const denom = a.d - b.d;
        const t = denom > 0 ? (a.d - targetD) / denom : 0;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
    }
    const head = trail[0];
    return { x: head.x, y: head.y };
  }

  /* ----- brainrot label proximity ----- */

  updateBrainrotLabels() {
    this.brainrots.forEach((b) => {
      if (b.state !== 'wild') return;
      const dx = this.player.x - b.sprite.x;
      const dy = this.player.y - b.sprite.y;
      const dist = Math.hypot(dx, dy);
      const visible = dist < LABEL_DISTANCE ? 1 : 0;
      if (Math.abs(b.label.alpha - visible) > 0.05) {
        this.tweens.killTweensOf(b.label);
        this.tweens.add({ targets: b.label, alpha: visible, duration: 250 });
      }
      b.label.setPosition(b.sprite.x, b.sprite.y + 32);
    });
  }

  /* ----- pickups ----- */

  checkPickups() {
    this.brainrots.forEach((b) => {
      if (b.state !== 'wild') return;
      const dx = this.player.x - b.sprite.x;
      const dy = this.player.y - b.sprite.y;
      if (Math.hypot(dx, dy) < 28) this.pickup(b);
    });
  }

  pickup(b) {
    b.state = 'carried';
    this.tweens.killTweensOf(b.sprite);
    this.tweens.killTweensOf(b.label);
    b.label.setAlpha(0);
    setBrainrotScale(b.sprite, 0.85);

    this.carried.push(b);
    this.updateCarriedHud();

    Sfx.play('pickup');
    Tts.speak(b.data.name);
    this.flashText(`+ ${b.data.name}!`, 900);

    const burst = this.add.text(b.sprite.x, b.sprite.y, '✨', {
      fontSize: '24px',
    }).setOrigin(0.5);
    burst.setDepth(b.sprite.y + 100);
    this.tweens.add({
      targets: burst, alpha: 0, scale: 1.6, y: burst.y - 30,
      duration: 500, onComplete: () => burst.destroy(),
    });
  }

  /* ----- coalesced screen shake -----
   * Spammy hazards (meteor salvos on L2, geyser eruptions on L4) used to
   * stack 2-3 shakes within ~150 ms because each event fires its own
   * `cameras.main.shake()`. The result felt like the camera was
   * permanently jittering on those levels - especially nauseating during
   * extended fights. shakeOnce() suppresses any new shake while a
   * previously-issued one is still in its window, so successive triggers
   * collapse into one continuous shake instead of compounding.
   *
   * Player-hit and game-over shakes are ONE-time events per trigger, so
   * they keep using cameras.main.shake() directly - we want full impact
   * on those, not a coalesced one. */
  shakeOnce(durationMs, intensity) {
    const now = this.time.now;
    if (now < (this._shakeBusyUntil ?? 0)) return;
    this._shakeBusyUntil = now + durationMs;
    this.cameras.main.shake(durationMs, intensity);
  }

  /* ----- meteor system ----- */

  createMeteorSystem() {
    this.meteors = [];
    this.fires = [];
    this.nextMeteorAt = 0;
  }

  pickMeteorTarget() {
    for (let attempt = 0; attempt < 12; attempt++) {
      const cx = Phaser.Math.Between(3, MAP_W - 4);
      const cy = Phaser.Math.Between(3, MAP_H - 4);
      if (this.map[cy][cx] === '#') continue;
      const wx = tx(cx), wy = tx(cy);
      // Don't drop directly on base
      if (Math.hypot(wx - this.baseSpawn.x, wy - this.baseSpawn.y) < 90) continue;
      // Don't drop directly on the player (give them a fighting chance with the telegraph)
      if (Math.hypot(wx - this.player.x, wy - this.player.y) < 60) continue;
      return { x: wx, y: wy };
    }
    return null;
  }

  spawnMeteor(time) {
    const target = this.pickMeteorTarget();
    if (!target) return;
    // 45-degree diagonal incoming from upper-right -> lower-left
    const dx = 520, dy = -520;
    const dist = Math.hypot(dx, dy);
    const m = {
      state: 'falling',
      x: target.x,
      y: target.y,
      stateStart: time,
      sprite: null,
      shock: null,
      hit: false,
      dirX: dx / dist,
      dirY: dy / dist,
    };

    m.sprite = this.add.container(target.x + dx, target.y + dy);
    m.sprite.setDepth(99999);
    const ball = this.add.graphics();
    ball.fillStyle(0xff3300, 0.4);
    ball.fillCircle(0, 0, 30);
    ball.fillStyle(0xff7733, 0.85);
    ball.fillCircle(0, 0, 22);
    ball.fillStyle(0xffd84a, 1);
    ball.fillCircle(0, 0, 14);
    ball.fillStyle(0xffffff, 1);
    ball.fillCircle(-2, -2, 6);
    m.sprite.add(ball);
    m.trail = this.add.graphics().setDepth(99998);
    this.tweens.add({
      targets: m.sprite,
      x: target.x,
      y: target.y,
      duration: METEOR_FALL_MS,
      ease: 'Cubic.easeIn',
    });
    this.meteors.push(m);
  }

  updateMeteors(time) {
    if (this.gameOver) return;
    if (time > this.nextMeteorAt) {
      this.spawnMeteor(time);
      // Occasional double-tap "salvo" so the sky has multiple fireballs in flight at once.
      if (Math.random() < METEOR_SALVO_CHANCE) this.spawnMeteor(time);
      this.nextMeteorAt = time + METEOR_SPAWN_MS + Phaser.Math.Between(-METEOR_SPAWN_JITTER, METEOR_SPAWN_JITTER);
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      if (!this.tickMeteor(this.meteors[i], time)) {
        this.meteors.splice(i, 1);
      }
    }
  }

  tickMeteor(m, time) {
    const elapsed = time - m.stateStart;

    if (m.state === 'falling') {
      if (m.trail && m.sprite) {
        m.trail.clear();
        const sx = m.sprite.x;
        const sy = m.sprite.y;
        const ux = m.dirX;
        const uy = m.dirY;
        const trailLen = 220;
        // Layered tapered flame trail along trajectory (going up-and-back from the fireball)
        m.trail.fillStyle(0x661a0a, 0.30);
        for (let i = 0; i < 8; i++) {
          const t = i / 8;
          const r = 26 - t * 22;
          m.trail.fillCircle(sx + ux * trailLen * t, sy + uy * trailLen * t, r);
        }
        m.trail.fillStyle(0xff3300, 0.45);
        for (let i = 0; i < 8; i++) {
          const t = i / 8;
          const r = 20 - t * 18;
          m.trail.fillCircle(sx + ux * trailLen * 0.78 * t, sy + uy * trailLen * 0.78 * t, r);
        }
        m.trail.fillStyle(0xff8a33, 0.7);
        for (let i = 0; i < 8; i++) {
          const t = i / 8;
          const r = 14 - t * 12;
          m.trail.fillCircle(sx + ux * trailLen * 0.55 * t, sy + uy * trailLen * 0.55 * t, r);
        }
        m.trail.fillStyle(0xffe066, 0.85);
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          const r = 8 - t * 7;
          m.trail.fillCircle(sx + ux * trailLen * 0.30 * t, sy + uy * trailLen * 0.30 * t, r);
        }
        // Sparking ember dots fluttering off the trail
        for (let i = 0; i < 5; i++) {
          const t = (i + 1) / 6;
          const wob = (Math.sin(time / 50 + i) * 8);
          const ex = sx + ux * trailLen * t + uy * wob;
          const ey = sy + uy * trailLen * t - ux * wob;
          m.trail.fillStyle(0xffd066, 0.9);
          m.trail.fillCircle(ex, ey, 1.5);
        }
      }
      if (elapsed >= METEOR_FALL_MS) {
        m.state = 'shock';
        m.stateStart = time;
        if (m.sprite) { m.sprite.destroy(); m.sprite = null; }
        if (m.trail) { m.trail.destroy(); m.trail = null; }
        Sfx.play('hit');
        // Halved magnitude + coalesced. With METEOR_SALVO_CHANCE = 0.55,
        // two impacts often land within 150 ms of each other on L2, and
        // the previous (120 ms, 0.005) was stacking into a continuous
        // head-rattle. shakeOnce keeps the per-strike thump but stops the
        // pile-up.
        this.shakeOnce(80, 0.0025);
        // Drop a lingering fire patch the player has to dodge. Replaces the
        // old inert scorched crater so meteor strikes leave persistent danger
        // zones, not harmless decoration.
        this.spawnFire(m.x, m.y, time);
        m.shock = this.add.graphics().setDepth(m.y + 600);
      }
      return true;
    }

    if (m.state === 'shock') {
      const t = Math.min(1, elapsed / METEOR_SHOCK_MS);
      const radius = 18 + (METEOR_SHOCK_MAX_R - 18) * t;
      m.shock.clear();
      m.shock.lineStyle(3, 0xffaa00, (1 - t) * 0.85);
      m.shock.strokeCircle(m.x, m.y, radius);
      m.shock.lineStyle(1, 0xffe066, (1 - t) * 0.5);
      m.shock.strokeCircle(m.x, m.y, radius - 4);

      if (!m.hit && this.invincibleUntil <= time) {
        const dx = this.player.x - m.x;
        const dy = this.player.y - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist < radius + 10) {
          m.hit = true;
          this.onPlayerHit(time);
          const ang = dist > 0.001 ? Math.atan2(dy, dx) : Phaser.Math.FloatBetween(0, Math.PI * 2);
          this.player.body.setVelocity(Math.cos(ang) * METEOR_KNOCKBACK, Math.sin(ang) * METEOR_KNOCKBACK);
        }
      }

      if (elapsed >= METEOR_SHOCK_MS) {
        if (m.shock) { m.shock.destroy(); m.shock = null; }
        return false;
      }
      return true;
    }

    return false;
  }

  /* ----- fires (lingering meteor impact zones) ----- */

  spawnFire(x, y, time) {
    // Three layered graphics so the fire reads at a glance:
    //   scorch -> permanent dark stain on the sand
    //   glow   -> soft outer pulsing aura
    //   g      -> the animated flames themselves
    const scorch = this.add.graphics().setDepth(-7);
    scorch.fillStyle(0x2a1408, 0.55);
    scorch.fillCircle(x, y, FIRE_HIT_RADIUS + 8);
    scorch.fillStyle(0x4a2010, 0.45);
    scorch.fillCircle(x, y, FIRE_HIT_RADIUS - 2);
    scorch.fillStyle(0x1a0804, 0.5);
    scorch.fillCircle(x - 3, y - 2, 6);

    const glow = this.add.graphics().setDepth(-6);
    const flames = this.add.graphics().setDepth(-5);

    this.fires.push({
      x, y,
      spawnedAt: time,
      expiresAt: time + FIRE_DURATION_MS,
      scorch, glow, g: flames,
    });
  }

  updateFires(time) {
    if (this.gameOver) return;
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i];
      const remaining = f.expiresAt - time;

      if (remaining <= 0) {
        f.g.destroy();
        f.glow.destroy();
        f.scorch.destroy();
        this.fires.splice(i, 1);
        continue;
      }

      // Fade alpha + hit radius during the last FIRE_FADE_MS so the player has
      // a fair window to walk back through dying embers without taking damage.
      const fadeAlpha = Math.min(1, remaining / FIRE_FADE_MS);
      const tBase = time / 100 + f.spawnedAt;

      // Outer pulsing glow
      f.glow.clear();
      const pulse = 0.7 + Math.sin(time / 180) * 0.18;
      f.glow.fillStyle(0xff4400, 0.16 * fadeAlpha * pulse);
      f.glow.fillCircle(f.x, f.y, FIRE_HIT_RADIUS + 16);
      f.glow.fillStyle(0xff6a00, 0.22 * fadeAlpha);
      f.glow.fillCircle(f.x, f.y, FIRE_HIT_RADIUS + 6);

      // Animated flame layers
      f.g.clear();

      // Outer dim red flames - 6 tongues circling
      f.g.fillStyle(0x9b1a08, 0.50 * fadeAlpha);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 + tBase * 0.30;
        const wob = Math.sin(tBase + j) * 3;
        const fx = f.x + Math.cos(a) * (8 + wob);
        const fy = f.y + Math.sin(a) * (8 + wob) - 1;
        f.g.fillCircle(fx, fy, 11);
      }

      // Mid orange flames - 5 tongues, slight lift
      f.g.fillStyle(0xff5a14, 0.72 * fadeAlpha);
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 + tBase * 0.50;
        const wob = Math.sin(tBase * 1.3 + j * 1.5) * 2.5;
        const fx = f.x + Math.cos(a) * (5 + wob);
        const fy = f.y + Math.sin(a) * (5 + wob) - 3;
        f.g.fillCircle(fx, fy, 8);
      }

      // Inner yellow tongues lifting upward
      f.g.fillStyle(0xffaa1a, 0.88 * fadeAlpha);
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * Math.PI * 2 + tBase * 0.70;
        const wob = Math.sin(tBase * 1.7 + j * 2) * 2;
        const fx = f.x + Math.cos(a) * (3 + wob);
        const fy = f.y + Math.sin(a) * (3 + wob) - 5;
        f.g.fillCircle(fx, fy, 6);
      }

      // Bright shifting core
      f.g.fillStyle(0xffec80, 0.95 * fadeAlpha);
      f.g.fillCircle(f.x + Math.sin(tBase) * 1.5, f.y - 3 + Math.cos(tBase * 1.3) * 1.5, 4);
      f.g.fillStyle(0xffffff, 0.7 * fadeAlpha);
      f.g.fillCircle(f.x, f.y - 4, 2);

      // Rising spark embers
      f.g.fillStyle(0xffd066, 0.75 * fadeAlpha);
      for (let j = 0; j < 4; j++) {
        const phase = ((time / 60) + j * 25) % 100;
        const sx = f.x + Math.sin(j * 2.3 + time / 200) * 9;
        const sy = f.y - 4 - phase * 0.28;
        f.g.fillCircle(sx, sy, Math.max(0.4, 1.6 - phase * 0.014));
      }

      // Damage check (skip during fade-out so the player can step through dying embers).
      if (remaining > FIRE_FADE_MS && this.invincibleUntil <= time) {
        const dx = this.player.x - f.x;
        const dy = this.player.y - f.y;
        if (Math.hypot(dx, dy) < FIRE_HIT_RADIUS) {
          this.onPlayerHit(time);
        }
      }
    }
  }

  /* ----- lava hazard (Level 4) ----- */

  createLavaSystem() {
    // The lava biome has two damage sources: stepping onto an 'L' tile, and
    // standing too close to an active geyser eruption. createLavaSystem just
    // sets up state and timers; the per-frame work happens in
    // updateLavaTouch() / updateGeysers().
    this.geysers = [];
    this.geyserG = this.add.graphics().setDepth(1100);
    this.geyserG.setBlendMode(Phaser.BlendModes.ADD);
    this.nextGeyserAt = this.time.now + 600;
    this.lastLavaTickAt = 0;
  }

  updateLavaTouch(time) {
    if (this.gameOver) return;
    // Airborne players hover over the lava - the whole point of the jump.
    if (this.isAirborne) return;
    if (this.invincibleUntil > time) return;
    if (time - this.lastLavaTickAt < LAVA_TICK_MS) return;
    const tileX = Math.floor(this.player.x / TILE);
    const tileY = Math.floor(this.player.y / TILE);
    if (!this.map[tileY] || this.map[tileY][tileX] !== 'L') return;
    // Player is standing on lava - take damage and nudge them away from the
    // tile they're on so they don't immediately re-enter on the next iframe
    // window (gives a brief recoil).
    this.lastLavaTickAt = time;
    Sfx.play('hit');
    this.flashText('LAVA BURN!', 700);
    // Soft knockback toward the closest stone platform tile (or back the
    // way the player came if no platform is adjacent).
    const knockX = (Math.random() - 0.5) * 80;
    const knockY = -60 - Math.random() * 30;
    this.player.body.setVelocity(knockX, knockY);
    this.onPlayerHit(time);
  }

  spawnGeyser(time) {
    if (this.geysers.length >= GEYSER_MAX_ACTIVE) return;
    // Pick a random lava tile away from the player base so the level
    // start isn't immediately hostile.
    const baseTileX = Math.floor(this.baseSpawn.x / TILE);
    const baseTileY = Math.floor(this.baseSpawn.y / TILE);
    let chosen = null;
    for (let tries = 0; tries < 20; tries++) {
      const tx = Phaser.Math.Between(3, MAP_W - 4);
      const ty = Phaser.Math.Between(3, MAP_H - 4);
      if (!this.map[ty] || this.map[ty][tx] !== 'L') continue;
      const dx = tx - baseTileX;
      const dy = ty - baseTileY;
      if (Math.hypot(dx, dy) < 5) continue;  // keep base safe
      chosen = { tx, ty }; break;
    }
    if (!chosen) return;
    const wx = chosen.tx * TILE + TILE / 2;
    const wy = chosen.ty * TILE + TILE / 2;
    this.geysers.push({
      x: wx,
      y: wy,
      state: 'telegraph',
      stateStart: time,
      hit: false,
    });
  }

  updateGeysers(time) {
    if (this.gameOver) return;
    if (time > this.nextGeyserAt) {
      this.spawnGeyser(time);
      this.nextGeyserAt = time + GEYSER_SPAWN_MS +
        Phaser.Math.Between(-GEYSER_SPAWN_JITTER, GEYSER_SPAWN_JITTER);
    }
    // Render all geysers in one ADD-blended graphics pass.
    const g = this.geyserG;
    g.clear();
    const t100 = time / 100;

    for (let i = this.geysers.length - 1; i >= 0; i--) {
      const ge = this.geysers[i];
      const elapsed = time - ge.stateStart;

      if (ge.state === 'telegraph') {
        const t = Math.min(1, elapsed / GEYSER_TELEGRAPH_MS);
        const pulse = 0.5 + Math.sin(time / 70) * 0.4;
        // Pulsing red warning ring on the lava surface
        const r = 14 + t * 16;
        g.fillStyle(0xff2a0a, 0.30 + 0.25 * pulse);
        g.fillCircle(ge.x, ge.y, r + 8);
        g.fillStyle(0xff8a18, 0.55 + 0.25 * pulse);
        g.fillCircle(ge.x, ge.y, r);
        g.fillStyle(0xffe066, 0.85 * pulse);
        g.fillCircle(ge.x, ge.y, r * 0.6);
        // Bubbling magma blobs rising
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + time / 200;
          const off = 4 + Math.sin(time / 180 + k) * 4;
          const bx = ge.x + Math.cos(a) * (8 + off);
          const by = ge.y + Math.sin(a) * (8 + off) * 0.4;
          g.fillStyle(0xffa040, 0.7);
          g.fillCircle(bx, by, 2 + Math.random() * 1.5);
        }
        if (elapsed >= GEYSER_TELEGRAPH_MS) {
          ge.state = 'erupt';
          ge.stateStart = time;
          Sfx.play('hit');
          // Halved magnitude + coalesced. Geysers cluster around the
          // player on L4 ("the burning below") and used to stack shakes
          // through every cooldown window. Less intensity, no piling up.
          this.shakeOnce(100, 0.003);
        }
        continue;
      }

      if (ge.state === 'erupt') {
        const t = Math.min(1, elapsed / GEYSER_ERUPT_MS);
        // Rising flame column reaches max height halfway through, then
        // collapses. Width pulses with t.
        const liftEase = Math.sin(t * Math.PI);     // 0..1..0
        const colHeight = 130 * liftEase;
        const colWidth  = 30 + 20 * liftEase;

        // Base radial blast (damage zone visualization)
        g.fillStyle(0xff3a08, 0.55 * (1 - t * 0.3));
        g.fillCircle(ge.x, ge.y, GEYSER_HIT_RADIUS);
        g.fillStyle(0xffaa30, 0.6 * (1 - t * 0.3));
        g.fillCircle(ge.x, ge.y, GEYSER_HIT_RADIUS - 8);

        // Vertical flame column (drawn upward) - 3 layers
        const topY = ge.y - colHeight;
        // Outer red
        g.fillStyle(0xc81808, 0.55);
        g.fillEllipse(ge.x, ge.y - colHeight * 0.35, colWidth, colHeight * 0.7);
        g.fillEllipse(ge.x, topY + 6, colWidth * 0.7, 14);
        // Mid orange
        g.fillStyle(0xff5a14, 0.75);
        g.fillEllipse(ge.x, ge.y - colHeight * 0.30, colWidth * 0.7, colHeight * 0.6);
        g.fillEllipse(ge.x, topY + 8, colWidth * 0.5, 10);
        // Inner yellow
        g.fillStyle(0xffd066, 0.92);
        g.fillEllipse(ge.x, ge.y - colHeight * 0.25, colWidth * 0.45, colHeight * 0.5);
        g.fillEllipse(ge.x, topY + 12, colWidth * 0.3, 6);
        // Bright core spike
        g.fillStyle(0xffffff, 0.85);
        g.fillEllipse(ge.x, ge.y - colHeight * 0.22, colWidth * 0.18, colHeight * 0.4);

        // Flying embers radiating out from the eruption
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + t100;
          const dist = 10 + t * 38;
          const ex = ge.x + Math.cos(a) * dist;
          const ey = ge.y + Math.sin(a) * dist - t * 20;
          g.fillStyle(0xffd066, 0.85 * (1 - t));
          g.fillCircle(ex, ey, 2);
        }

        // Damage check (only once per eruption)
        if (!ge.hit && this.invincibleUntil <= time) {
          const dx = this.player.x - ge.x;
          const dy = this.player.y - ge.y;
          const dist = Math.hypot(dx, dy);
          if (dist < GEYSER_HIT_RADIUS) {
            ge.hit = true;
            // Knockback away from geyser
            const ang = Math.atan2(dy, dx);
            this.player.body.setVelocity(
              Math.cos(ang) * GEYSER_KNOCKBACK,
              Math.sin(ang) * GEYSER_KNOCKBACK,
            );
            this.onPlayerHit(time);
          }
        }

        if (elapsed >= GEYSER_ERUPT_MS) {
          ge.state = 'cooldown';
          ge.stateStart = time;
        }
        continue;
      }

      if (ge.state === 'cooldown') {
        const t = Math.min(1, elapsed / GEYSER_COOLDOWN_MS);
        // Fading scorched glow on the surface
        g.fillStyle(0x6a1808, 0.5 * (1 - t));
        g.fillCircle(ge.x, ge.y, 18);
        g.fillStyle(0x401004, 0.7 * (1 - t));
        g.fillCircle(ge.x, ge.y, 12);
        // Lazy smoke whisp
        g.fillStyle(0x2a1410, 0.4 * (1 - t));
        g.fillEllipse(ge.x + Math.sin(time / 200) * 4, ge.y - 8 - t * 8, 16, 6);
        if (elapsed >= GEYSER_COOLDOWN_MS) {
          this.geysers.splice(i, 1);
        }
      }
    }
  }

  /* ----- bloop chase (Level 3 hazard) ----- */

  createBloopSystem() {
    // Generate an invisible circular collider texture once - the Bloop's
    // physics body anchors to this. The bloop.png sprite is laid on top
    // each frame at the body's position.
    if (!this.textures.exists('bloop_anchor')) {
      const tg = this.add.graphics();
      tg.fillStyle(0xffffff, 1);
      tg.fillCircle(BLOOP_RADIUS, BLOOP_RADIUS, BLOOP_RADIUS);
      tg.generateTexture('bloop_anchor', BLOOP_RADIUS * 2, BLOOP_RADIUS * 2);
      tg.destroy();
    }

    // Spawn the Bloop near the top of the playable area, between the upper
    // coral rows so the body has a clear walkable spot. Player starts in the
    // south and the Bloop hunts them down from the moment they emerge.
    const spawnX = WORLD_W / 2;
    const spawnY = tx(9);

    this.bloopBody = this.physics.add.image(spawnX, spawnY, 'bloop_anchor');
    this.bloopBody.setVisible(false);
    this.bloopBody.body.setCircle(BLOOP_RADIUS);
    this.physics.add.collider(this.bloopBody, this.wallsGroup);

    // The actual creature visual - the bloop.png sprite art.
    this.bloopSprite = this.add.image(spawnX, spawnY, 'sprite_bloop')
      .setOrigin(0.5);
    this.bloopSprite.setDisplaySize(BLOOP_DISPLAY_W, BLOOP_DISPLAY_H);
    this.bloopSprite.setDepth(spawnY + 1);

    // Soft layered drop shadow under the Bloop.
    this.bloopShadow = this.add.graphics().setDepth(-9);

    // Pulsing glow ring rendered behind the sprite when the Bloop is chasing.
    this.bloopGlow = this.add.graphics();

    // Alert indicator that floats above the Bloop ("!" chasing, "?" searching)
    this.bloopAlert = this.add.text(spawnX, spawnY - 110, '', {
      fontFamily: 'Impact, Charcoal, sans-serif',
      fontSize: '40px', color: '#ff2a4a',
      stroke: '#1a0508', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    this.bloop = {
      state: 'dormant',     // dormant | hunting | chasing | searching | stunned
      activated: false,     // flips true once player first leaves the base zone
      stateStart: this.time.now,
      lastSeenX: this.baseSpawn.x,
      lastSeenY: this.baseSpawn.y,
      faceDirX: 0,
      faceDirY: 1,
    };
  }

  isPlayerInSafeZone() {
    const dx = this.player.x - this.baseSpawn.x;
    const dy = this.player.y - this.baseSpawn.y;
    return Math.hypot(dx, dy) < BASE_SAFE_RADIUS;
  }

  drawBaseSafeZone(time) {
    const g = this.baseSafeZone;
    if (!g) return;
    g.clear();
    const x = this.baseSpawn.x;
    const y = this.baseSpawn.y;
    const playerSafe = this.isPlayerInSafeZone();
    const pulse = 0.5 + Math.sin(time / 380) * 0.5;

    // Soft fill - brighter when player is inside
    const fillAlpha = playerSafe ? 0.16 : 0.07;
    g.fillStyle(0x6ec4d8, fillAlpha);
    g.fillCircle(x, y, BASE_SAFE_RADIUS);

    // Pulsing ring at the perimeter
    const ringAlpha = playerSafe ? 0.85 : 0.55;
    g.lineStyle(3, 0x9bd9ee, ringAlpha * pulse);
    g.strokeCircle(x, y, BASE_SAFE_RADIUS);
    g.lineStyle(1.5, 0xc8edf6, 0.6 * pulse);
    g.strokeCircle(x, y, BASE_SAFE_RADIUS - 4);
  }

  // Wake the Bloop up the first time the player ventures away from base.
  bloopWake(time) {
    this.bloop.activated = true;
    this.setBloopState('hunting', time);
    Sfx.play('hit');
    this.cameras.main.shake(220, 0.008);
    if (this.bloopAlert) {
      this.tweens.killTweensOf(this.bloopAlert);
      this.bloopAlert.setText('!').setColor('#ff2a4a').setScale(2.2).setAlpha(1);
      this.tweens.add({
        targets: this.bloopAlert,
        scale: 1,
        duration: 420,
        ease: 'Back.easeOut',
      });
    }
    if (this.bloopSprite) {
      this.tweens.add({
        targets: this.bloopSprite,
        scaleX: this.bloopSprite.scaleX * 1.15,
        scaleY: this.bloopSprite.scaleY * 1.15,
        duration: 220,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // Cast a ray between two points in half-tile steps.
  // Returns true if any wall tile is in the way.
  lineHitsWall(x0, y0, x1, y1) {
    const stepLen = TILE / 2;
    const total = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(total / stepLen));
    for (let i = 1; i < steps - 1; i++) {
      const t = i / steps;
      const wx = x0 + (x1 - x0) * t;
      const wy = y0 + (y1 - y0) * t;
      const tileX = Math.floor(wx / TILE);
      const tileY = Math.floor(wy / TILE);
      if (tileY < 0 || tileY >= MAP_H) continue;
      if (tileX < 0 || tileX >= MAP_W) continue;
      if (this.map[tileY][tileX] === '#') return true;
    }
    return false;
  }

  bloopHasLOS() {
    return !this.lineHitsWall(
      this.bloopBody.x, this.bloopBody.y,
      this.player.x, this.player.y,
    );
  }

  setBloopState(newState, time) {
    if (this.bloop.state === newState) return;
    const wasState = this.bloop.state;
    this.bloop.state = newState;
    this.bloop.stateStart = time;

    if (newState === 'chasing' && wasState !== 'chasing') {
      // Spotted! Audio sting + camera flash + alert pop.
      Sfx.play('hit');
      this.cameras.main.shake(120, 0.005);
      if (this.bloopAlert) {
        this.tweens.killTweensOf(this.bloopAlert);
        this.bloopAlert.setText('!');
        this.bloopAlert.setColor('#ff2a4a');
        this.bloopAlert.setScale(1.8);
        this.bloopAlert.setAlpha(1);
        this.tweens.add({
          targets: this.bloopAlert,
          scale: 1,
          duration: 320,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  bloopCatchPlayer(time) {
    this.setBloopState('stunned', time);
    this.onPlayerHit(time);
    const dx = this.player.x - this.bloopBody.x;
    const dy = this.player.y - this.bloopBody.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.player.body.setVelocity((dx / dist) * 360, (dy / dist) * 360);
    this.cameras.main.shake(260, 0.014);
  }

  updateBloop(time) {
    if (this.gameOver || !this.bloop) return;

    const b = this.bloop;
    const body = this.bloopBody;
    const px = this.player.x;
    const py = this.player.y;

    // ----- dormancy gate: stay asleep until player leaves base -----
    if (!b.activated) {
      const dx0 = px - this.baseSpawn.x;
      const dy0 = py - this.baseSpawn.y;
      if (Math.hypot(dx0, dy0) > BLOOP_ACTIVATION_DIST) {
        this.bloopWake(time);
      } else {
        // Render the sleeping Bloop and skip AI / movement.
        body.body.setVelocity(0, 0);
        this.updateBloopSprite(time);
        this.drawBloopShadow();
        this.drawBloopGlow(time);
        this.updateBloopAlert();
        return;
      }
    }

    const dxToP = px - body.x;
    const dyToP = py - body.y;
    const distToPlayer = Math.hypot(dxToP, dyToP);
    const losClear = this.bloopHasLOS();
    const playerVisible = distToPlayer < BLOOP_VISION_RANGE && losClear;
    const playerSafe = this.isPlayerInSafeZone();

    // ----- state transitions (Pac-Man style: never gives up) -----
    switch (b.state) {
      case 'hunting':
        // Default mode - always closing in. If we get LOS, snap to chasing.
        if (playerVisible) this.setBloopState('chasing', time);
        break;

      case 'chasing':
        if (playerVisible) {
          b.lastSeenX = px;
          b.lastSeenY = py;
          // Catch check - only if player isn't standing in their safe base.
          if (
            !playerSafe &&
            distToPlayer < BLOOP_CATCH_RADIUS &&
            this.invincibleUntil <= time
          ) {
            this.bloopCatchPlayer(time);
            return;
          }
        } else {
          // Cover broke our line of sight - dart to the last spot we saw the player.
          this.setBloopState('searching', time);
        }
        break;

      case 'searching':
        if (playerVisible) {
          this.setBloopState('chasing', time);
        } else if (
          Math.hypot(b.lastSeenX - body.x, b.lastSeenY - body.y) < 30 ||
          time - b.stateStart > BLOOP_SEARCH_TIME_MS
        ) {
          // Got to the last-seen spot or timed out - resume hunting them down
          // (Pac-Man: we always know where you are, just slower without LOS).
          this.setBloopState('hunting', time);
        }
        break;

      case 'stunned':
        if (time - b.stateStart > BLOOP_STUN_TIME_MS) {
          if (playerVisible) this.setBloopState('chasing', time);
          else this.setBloopState('hunting', time);
        }
        break;
    }

    // ----- choose target + speed based on state -----
    let speed = 0;
    let targetX = px, targetY = py;
    switch (b.state) {
      case 'hunting':   speed = BLOOP_SPEED_HUNT;   targetX = px; targetY = py; break;
      case 'chasing':   speed = BLOOP_SPEED_CHASE;  targetX = px; targetY = py; break;
      case 'searching': speed = BLOOP_SPEED_SEARCH; targetX = b.lastSeenX; targetY = b.lastSeenY; break;
      case 'stunned':   speed = 0; break;
    }

    // If the player has retreated into the base safe zone, the Bloop loiters
    // at the edge instead of charging in. It still tracks the base direction
    // so it's ready to chase the moment the player steps out.
    if (playerSafe && b.state !== 'stunned') {
      const dxBB = body.x - this.baseSpawn.x;
      const dyBB = body.y - this.baseSpawn.y;
      const dBB = Math.hypot(dxBB, dyBB) || 1;
      const edgeR = BASE_SAFE_RADIUS + 28;
      targetX = this.baseSpawn.x + (dxBB / dBB) * edgeR;
      targetY = this.baseSpawn.y + (dyBB / dBB) * edgeR;
      speed = BLOOP_SPEED_HUNT * 0.7;
    }

    const dx = targetX - body.x;
    const dy = targetY - body.y;
    const targetDist = Math.hypot(dx, dy);
    if (speed > 0 && targetDist > 4) {
      const vx = (dx / targetDist) * speed;
      const vy = (dy / targetDist) * speed;
      body.body.setVelocity(vx, vy);
      b.faceDirX = dx / targetDist;
      b.faceDirY = dy / targetDist;
    } else {
      body.body.setVelocity(0, 0);
    }

    // ----- visuals -----
    this.updateBloopSprite(time);
    this.drawBloopShadow();
    this.drawBloopGlow(time);
    this.updateBloopAlert();
  }

  updateBloopSprite(time) {
    const s = this.bloopSprite;
    if (!s) return;
    const bx = this.bloopBody.x;
    const by = this.bloopBody.y;
    const state = this.bloop.state;
    const dormant = !this.bloop.activated;
    // Slow lazy bob when dormant, normal bob when active
    const bob = dormant
      ? Math.sin(time / 700) * 2
      : Math.sin(time / 320) * 3;
    s.setPosition(bx, by + bob);
    s.setDepth(by);

    // Face direction of motion (only when moving)
    const fdx = this.bloop.faceDirX || 0;
    if (!dormant && Math.abs(fdx) > 0.05) {
      s.setFlipX(fdx > 0);
    }

    // State-based color cue (chasing pulses red; stunned washes cool blue)
    if (dormant) {
      s.setTint(0x6080a0);
      s.setAlpha(0.55);
    } else if (state === 'chasing') {
      s.setAlpha(1);
      const pulse = 0.6 + Math.sin(time / 110) * 0.4;
      const r = 0xff;
      const g = Math.round(0x60 + (1 - pulse) * 0x60);
      const b = Math.round(0x60 + (1 - pulse) * 0x60);
      s.setTint((r << 16) | (g << 8) | b);
    } else if (state === 'stunned') {
      s.setAlpha(1);
      s.setTint(0x9bd9ee);
    } else if (state === 'searching') {
      s.setAlpha(1);
      s.setTint(0xffd0a0);
    } else {
      s.setAlpha(1);
      s.clearTint();
    }
  }

  drawBloopShadow() {
    const sg = this.bloopShadow;
    const bx = this.bloopBody.x;
    const by = this.bloopBody.y + 60;
    sg.clear();
    sg.fillStyle(0x010810, 0.05);
    sg.fillEllipse(bx, by, 150, 38);
    sg.fillStyle(0x010810, 0.10);
    sg.fillEllipse(bx, by, 120, 30);
    sg.fillStyle(0x010810, 0.18);
    sg.fillEllipse(bx, by, 92, 22);
    sg.fillStyle(0x010810, 0.26);
    sg.fillEllipse(bx, by, 64, 16);
  }

  drawBloopGlow(time) {
    const g = this.bloopGlow;
    g.clear();
    if (!this.bloop || !this.bloop.activated) return;
    const bx = this.bloopBody.x;
    const by = this.bloopBody.y;
    const state = this.bloop.state;
    if (state === 'chasing') {
      const pulse = 0.6 + Math.sin(time / 110) * 0.4;
      g.fillStyle(0xff2040, 0.20 * pulse);
      g.fillCircle(bx, by, BLOOP_VIS_SIZE * 0.55);
      g.fillStyle(0xff6080, 0.30 * pulse);
      g.fillCircle(bx, by, BLOOP_VIS_SIZE * 0.42);
    } else if (state === 'searching') {
      g.fillStyle(0xff9c4a, 0.18);
      g.fillCircle(bx, by, BLOOP_VIS_SIZE * 0.42);
    } else if (state === 'stunned') {
      g.fillStyle(0x6ec4d8, 0.22);
      g.fillCircle(bx, by, BLOOP_VIS_SIZE * 0.4);
    }
    // Behind the sprite, in front of the shadow
    g.setDepth(by - 1);
  }

  updateBloopAlert() {
    const a = this.bloopAlert;
    if (!a) return;
    a.setPosition(this.bloopBody.x, this.bloopBody.y - 110);
    a.setDepth(this.bloopBody.y + 400);
    if (!this.bloop?.activated) {
      // Dormant: floating "z" snooze cue
      a.setText('z').setColor('#9bd9ee').setAlpha(0.6);
      return;
    }
    const state = this.bloop?.state;
    if (state === 'chasing') {
      a.setText('!').setColor('#ff2a4a').setAlpha(1);
    } else if (state === 'searching') {
      a.setText('?').setColor('#ffaa44').setAlpha(0.9);
    } else if (state === 'stunned') {
      a.setText('×').setColor('#9bd9ee').setAlpha(0.7);
    } else {
      a.setText('!').setColor('#ff7080').setAlpha(0.55);
    }
  }

  /* ----- axe hits ----- */

  checkAxeHits(time) {
    if (this.invincibleUntil > time) return;
    for (const axe of this.axes) {
      const dx = this.player.x - axe.bladeWorldX;
      const dy = this.player.y - axe.bladeWorldY;
      if (Math.hypot(dx, dy) < 22) {
        this.onPlayerHit(time);
        break;
      }
    }
  }

  onPlayerHit(time) {
    this.invincibleUntil = time + INVINCIBLE_MS;
    Sfx.play('hit');
    this.cameras.main.shake(180, 0.008);
    this.flashText('OUCH! Brainrots scattered!', 1200);

    const isLavaBiome = this.biome === 'lava';
    this.carried.forEach((c) => {
      // Scatter near the player's current position so they don't end up
      // unreachable. In the lava biome, prefer scattering onto stone
      // platforms ('.') rather than lava tiles so the player isn't forced
      // to walk into more lava just to retrieve dropped brainrots.
      const tries = isLavaBiome ? 16 : 6;
      let tx2 = c.homeX, ty2 = c.homeY;
      let acceptedLava = false;
      for (let i = 0; i < tries; i++) {
        const ox = Phaser.Math.Between(-72, 72);
        const oy = Phaser.Math.Between(-48, 48);
        const candX = Phaser.Math.Clamp(this.player.x + ox, TILE * 2, WORLD_W - TILE * 2);
        const candY = Phaser.Math.Clamp(this.player.y + oy, TILE * 2, WORLD_H - TILE * 2);
        const tileX = Math.floor(candX / TILE);
        const tileY = Math.floor(candY / TILE);
        const ch = this.map[tileY] && this.map[tileY][tileX];
        if (!ch || ch === '#') continue;
        if (isLavaBiome && ch === 'L') {
          // Remember as a fallback but keep looking for a stone tile.
          if (!acceptedLava) { tx2 = candX; ty2 = candY; acceptedLava = true; }
          continue;
        }
        tx2 = candX; ty2 = candY; break;
      }

      this.tweens.killTweensOf(c.sprite);
      c.sprite.x = tx2;
      c.sprite.y = ty2;
      c.shadow.setPosition(tx2, ty2 + 16);
      c.label.setPosition(tx2, ty2 + 26).setAlpha(0);
      setBrainrotScale(c.sprite, 1);
      c.state = 'wild';

      this.tweens.add({
        targets: c.sprite, y: ty2 - 6,
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    this.carried.length = 0;
    this.updateCarriedHud();

    const knockX = Phaser.Math.Between(-1, 1);
    const knockY = Phaser.Math.Between(-1, 1);
    this.player.body.setVelocity(knockX * 200, knockY * 200);

    this.loseHeart();
  }

  loseHeart() {
    if (this.gameOver) return;
    this.hearts = Math.max(0, this.hearts - 1);
    const lostIdx = this.hearts;
    const lostHeart = this.hudHearts[lostIdx];
    if (lostHeart) {
      this.tweens.add({
        targets: lostHeart,
        scale: 1.6,
        duration: 140,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => lostHeart.setAlpha(0.2).setScale(1),
      });
    }
    if (this.hearts <= 0) this.handleGameOver();
  }

  handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    Sfx.play('hit');
    this.cameras.main.shake(420, 0.014);
    let msg;
    if (this.levelConfig.hazard === 'meteor') msg = 'BURIED BY METEORS - retrying';
    else if (this.levelConfig.hazard === 'bloop') msg = 'THE BLOOP CAUGHT YOU - retrying';
    else if (this.levelConfig.hazard === 'lava') msg = 'CONSUMED BY LAVA - retrying';
    else msg = 'YOU FELL TO THE AXES - retrying';
    this.flashText(msg, 1400);
    this.time.delayedCall(1400, () => {
      this.cameras.main.fade(500, 30, 5, 10);
      if (this.skyCamera) this.skyCamera.fade(500, 30, 5, 10);
      if (this.uiCamera) this.uiCamera.fade(500, 30, 5, 10);
    });
    this.time.delayedCall(1900, () => {
      this.scene.restart({
        levelId: this.levelId,
        deposited: Array.from(this.deposited),
        allDeposited: this.allDeposited,
      });
    });
  }

  updatePlayerInvincibilityVisual(time) {
    const inv = this.invincibleUntil > time;
    if (inv) this.playerVisual.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.4 : 1);
    else this.playerVisual.setAlpha(1);
  }

  /* ----- base / portal interaction ----- */

  checkBaseInteraction(time) {
    const dx = this.player.x - this.baseSpawn.x;
    const dy = this.player.y - this.baseSpawn.y;
    const onBase = Math.hypot(dx, dy) < 38;

    if (this.portalActive && onBase && time - this.portalActivatedAt > 1200) {
      this.triggerWin();
      return;
    }

    if (onBase && this.carried.length > 0) {
      const toDeposit = this.carried.slice();
      this.carried.length = 0;

      toDeposit.forEach((c, i) => {
        this.deposited.add(c.id);
        const slot = this.statueSlots.find(s => s.id === c.id);
        if (slot) {
          slot.sprite.setAlpha(1);
          setBrainrotScale(slot.sprite, 1.4);
        }

        const baseSX = c.sprite.baseScaleX ?? 1;
        const baseSY = c.sprite.baseScaleY ?? 1;
        this.tweens.add({
          targets: c.sprite,
          alpha: 0,
          scaleX: baseSX * 0.4,
          scaleY: baseSY * 0.4,
          y: c.sprite.y - 30,
          duration: 350, delay: i * 60,
          onComplete: () => c.sprite.destroy(),
        });
        this.tweens.add({
          targets: c.shadow, alpha: 0, duration: 350,
          onComplete: () => c.shadow.destroy(),
        });
        c.label.destroy();
        Sfx.play('deposit');
      });

      this.updateCarriedHud();
      this.flashText(`Deposited ${toDeposit.length}! (${this.deposited.size}/5)`, 1100);

      if (this.deposited.size >= 5 && !this.portalActive) this.activatePortal(time);
    }
  }

  updateCarriedHud() {
    const n = this.carried.length;
    this.hudCarried.setText('BAG ' + n);
    this.hudCollected.setText('Collected ' + this.deposited.size + '/5');

    let color = '#ffffff';
    let scale = 1;
    if (n >= 4) { color = '#ff6b6b'; scale = 1.15; }
    else if (n >= 2) { color = '#ffe066'; scale = 1.05; }
    this.hudCarried.setColor(color);
    this.tweens.killTweensOf(this.hudCarried);
    this.hudCarried.setScale(scale);
    if (n >= 4) {
      this.tweens.add({
        targets: this.hudCarried,
        scale: scale * 1.08,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  activatePortal(time) {
    this.portalActive = true;
    this.portalActivatedAt = time;
    this.redrawBase();
    Sfx.play('portal');
    this.cameras.main.flash(400, 156, 107, 255);
    if (this.skyCamera) this.skyCamera.flash(400, 156, 107, 255);
    if (this.uiCamera) this.uiCamera.flash(400, 156, 107, 255);
    this.flashText('PORTAL OPEN! Step in to escape!', 2000);
    if (this.baseLabel) this.baseLabel.setText('PORTAL').setColor('#ffe066');

    const x = this.baseSpawn.x;
    const y = this.baseSpawn.y;
    for (let i = 0; i < 12; i++) {
      const t = this.add.text(x, y, '✨', { fontSize: '20px' }).setOrigin(0.5);
      t.setDepth(y + 200);
      const angle = (i / 12) * Math.PI * 2;
      this.tweens.add({
        targets: t,
        x: x + Math.cos(angle) * 80,
        y: y + Math.sin(angle) * 80,
        alpha: 0, scale: 0.4,
        duration: 1100, onComplete: () => t.destroy(),
      });
    }
  }

  triggerWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    Sfx.play('win');

    const cumulative = (this.allDeposited ?? []).concat(Array.from(this.deposited));
    const nextLevelId = this.levelId + 1;

    // Per-level ULTIMATE unlock. The unlocked id is stitched into
    // `cumulative` so it'll show up lit on the WinScene roster grid AND
    // on the level-complete modal we're about to show.
    const ultimateId = this.levelConfig.ultimateId;
    if (ultimateId && !cumulative.includes(ultimateId)) cumulative.push(ultimateId);
    const ultimate = ultimateId ? BRAINROT_REGISTRY[ultimateId] : null;

    // Replay detection. Two ways a run can show the replay-flavored modal:
    //   1. Real replay: player already cleared this level (or higher) before.
    //   2. Preview replay: dev held Alt+Shift+N on title to preview the
    //      replay layout (single back button, "CLEARED AGAIN" copy).
    // First-clear previews (Shift+N without Alt) deliberately render the
    // first-clear layout so devs can review the celebratory copy + the new
    // two-button row + saved-line.
    const saveBefore = SaveState.read();
    const realReplay = this.levelId <= saveBefore.lastClearedLevel;
    const previewReplay = this.isModalPreview && this.previewMode === 'replay';
    const isReplay = previewReplay || (!this.isModalPreview && realReplay);

    // Decide where the right-button (or the single Back button) routes.
    // Real plays use the regular forward routes (Game / Boss / Win); preview
    // runs always collapse to Title so a dev can flip between modals
    // without re-launching the level. Replay runs (real or previewed) only
    // ever surface a single Back-to-main button, so they always route Title.
    let nextRoute, nextPayload, nextButtonLabel;
    if (isReplay) {
      nextRoute = 'Title';
      nextPayload = {};
      nextButtonLabel = '⟵ Back to Title';
    } else if (LEVELS[nextLevelId]) {
      nextButtonLabel = `Proceed to Level ${nextLevelId}`;
      if (this.isModalPreview) {
        nextRoute = 'Title';
        nextPayload = {};
      } else {
        nextRoute = 'Game';
        nextPayload = { levelId: nextLevelId, allDeposited: cumulative };
      }
    } else {
      // L4 first-clear (or any non-replay clear with no nextLevelId): always
      // hand off to the boss. The "View Roster" branch used to surface here
      // when `cumulative` was missing ultimates - which only ever happened
      // via the dev `Shift+4` modal preview shortcut - so it was effectively
      // a dev-only artifact that real players never saw. Collapsed to a
      // single "Final Battle" CTA.
      nextButtonLabel = 'Final Battle';
      if (this.isModalPreview) {
        nextRoute = 'Title';
        nextPayload = {};
      } else {
        nextRoute = 'Boss';
        nextPayload = { allDeposited: cumulative };
      }
    }

    // Persist progression. Skipped on modal previews (which intentionally
    // shouldn't pollute the save) and on replays of an already-cleared
    // level (no new info to record). First clears advance lastClearedLevel
    // and merge the level's ultimate into unlockedUltimates.
    if (!this.isModalPreview && !isReplay) {
      SaveState.recordLevelCleared(this.levelId, ultimateId);
    }

    this.showLevelCompleteModal({
      ultimate,
      nextRoute,
      nextPayload,
      nextButtonLabel,
      isReplay,
    });
  }

  /* ----- level-complete modal ----- *
   * A celebration pop-up shown when the player exits via the portal. Built
   * with raw Phaser graphics + text rather than a modal scene because we want
   * the level scene's frozen-state to remain visible in the background.
   * Stays put until the player clicks "Proceed". */

  showLevelCompleteModal({ ultimate, nextRoute, nextPayload, nextButtonLabel, isReplay = false }) {
    // GameScene runs three cameras (main / sky / ui) with a partition system
    // that routes objects to a camera based on their scrollFactor + depth.
    // Modal must render on the UI camera so it sits screen-locked above the
    // gameplay (which is otherwise mid-scroll when the player reaches the
    // portal). We force every modal child to scrollFactor=0 AND explicitly
    // ignore them on the world + sky cameras, mirroring what flashText does.
    const W = GAME_W;
    const H = GAME_H;

    const lockToUi = (obj) => {
      obj.setScrollFactor(0);
      obj.setDepth(20000);
      if (this.cameras?.main) this.cameras.main.ignore(obj);
      if (this.skyCamera) this.skyCamera.ignore(obj);
      return obj;
    };

    const elements = [];
    const add = (obj) => {
      lockToUi(obj);
      elements.push(obj);
      return obj;
    };

    // Backdrop: full-screen dark veil that also swallows clicks so the player
    // can't accidentally interact with the frozen level beneath the modal.
    const backdrop = add(this.add.rectangle(W / 2, H / 2, W, H, 0x05050a, 0.78));
    backdrop.setInteractive();

    // Card panel - centered. Sized smaller now that the superpower
    // description is gone (the per-level modal is no longer the place
    // to teach ultimates - they only matter in the final battle).
    const cardW = Math.min(560, W - 40);
    const cardH = Math.min(440, H - 40);
    const cardX = W / 2;
    const cardY = H / 2;

    const card = add(this.add.graphics());
    // Drop shadow
    card.fillStyle(0x000000, 0.55);
    card.fillRoundedRect(cardX - cardW / 2 + 6, cardY - cardH / 2 + 8, cardW, cardH, 22);
    // Body - keeps the dark plum so the gold border + cream pixel text pop.
    card.fillStyle(0x0a0610, 0.97);
    card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22);
    // Gold border (matches the intro/outro Zelda-style cards)
    card.lineStyle(3, 0xfde58c, 0.95);
    card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22);
    // Inner thin gold rim for depth (same trick as the title menu buttons
    // and the narrative cards).
    card.lineStyle(1, 0xffe066, 0.55);
    card.strokeRoundedRect(cardX - cardW / 2 + 5, cardY - cardH / 2 + 5, cardW - 10, cardH - 10, 18);

    // Header (pixel font). Replay runs use a slightly less-shouty headline
    // since the player isn't unlocking anything new.
    add(this.add.text(cardX, cardY - cardH / 2 + 36,
      isReplay ? `LEVEL ${this.levelId} CLEARED AGAIN!` : `LEVEL ${this.levelId} COMPLETE!`, {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '17px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5));

    // Subtitle / congrats line (pixel font, small enough to keep one-liner
    // weight on the headline). wordWrap covers longer replay copy.
    add(this.add.text(cardX, cardY - cardH / 2 + 76,
      isReplay
        ? `This ultimate is already in your collection.`
        : `You captured a new ultimate brainrot!`, {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '10px', color: '#cbb3ff',
      stroke: '#1a0a08', strokeThickness: 2,
      align: 'center', lineSpacing: 4,
      wordWrap: { width: cardW - 80, useAdvancedWrap: true },
    }).setOrigin(0.5));

    // Buttons sit at the bottom of the card. Layout is driven by isReplay
    // (not nextRoute) so that dev modal previews still get to render the
    // first-clear layout even though their right-button routes back to
    // Title under the hood.
    const btnH = 50;
    const btnY = cardY + cardH / 2 - 38;
    const isSingleBtn = isReplay;

    // Vertically center the {portrait + name + (optional) saved-line}
    // block in the open space between the subtitle bottom and the button
    // top, so the celebration doesn't visually drift toward either edge
    // (and so the saved-line + name + portrait read as one group instead
    // of saved-line floating against the buttons).
    const subtitleY = cardY - cardH / 2 + 76;
    const subtitleBottomY = subtitleY + 8;          // ~half the subtitle text height
    const btnTopY = btnY - btnH / 2;
    const blockCenterY = (subtitleBottomY + btnTopY) / 2;

    const portraitH = 140;
    const gapPortraitToName = 22;
    const nameH = 14;
    const gapNameToSaved = 22;
    const savedH = 10;

    const showSaved = !isReplay;
    const blockH = portraitH + gapPortraitToName + nameH
      + (showSaved ? gapNameToSaved + savedH : 0);
    const blockTopY = blockCenterY - blockH / 2;
    const portraitY = blockTopY + portraitH / 2;
    const nameY = portraitY + portraitH / 2 + gapPortraitToName + nameH / 2;
    const savedY = nameY + nameH / 2 + gapNameToSaved + savedH / 2;

    // Ultimate brainrot showcase. Sprite (or emoji fallback) + name only -
    // the superpower description was removed since ultimates aren't
    // wielded in the per-level loop; their explanations belong in the
    // final battle hand-off, not here.
    if (ultimate) {
      let portrait;
      if (ultimate.spriteKey && this.textures.exists(ultimate.spriteKey)) {
        portrait = add(this.add.image(cardX, portraitY, ultimate.spriteKey)
          .setOrigin(0.5)
          .setDisplaySize(portraitH, portraitH));
      } else {
        portrait = add(this.add.text(cardX, portraitY,
          `${ultimate.emoji}${ultimate.accent || ''}`,
          { fontSize: '108px' }
        ).setOrigin(0.5));
      }

      // Brainrot name (pixel font).
      add(this.add.text(cardX, nameY, ultimate.name.toUpperCase(), {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '13px', color: '#ffffff',
        stroke: '#1a0a08', strokeThickness: 3,
        align: 'center',
        wordWrap: { width: cardW - 60, useAdvancedWrap: true },
      }).setOrigin(0.5));
    }

    // "Your progress is saved." reassurance line (pixel font), suppressed
    // on real replays (which didn't write to save). Sits flush below the
    // brainrot name as part of the centered celebration block.
    if (showSaved) {
      add(this.add.text(cardX, savedY,
        'Your progress is saved.', {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '9px', color: '#cbb3ff',
        stroke: '#1a0a08', strokeThickness: 2,
      }).setOrigin(0.5));
    }

    let proceeded = false;
    const navigateTo = (route, payload) => {
      if (proceeded) return;
      proceeded = true;
      const fadeMs = 500;
      this.cameras.main.fade(fadeMs, 30, 18, 50);
      if (this.skyCamera) this.skyCamera.fade(fadeMs, 30, 18, 50);
      if (this.uiCamera) this.uiCamera.fade(fadeMs, 30, 18, 50);
      this.time.delayedCall(fadeMs + 30, () => {
        this.scene.start(route, payload);
      });
    };

    // Pixel-font modal button. Mirrors the title-menu button styling so
    // the visual language is consistent across all narrative + transition
    // cards.
    const makeModalButton = ({ x, y, w, h, label, primary, onClick }) => {
      const bg = add(this.add.graphics());
      const accent = primary ? 0xfde58c : 0x6a4f6a;
      const dim = primary ? 0x0a0610 : 0x1a0f1f;
      const restColor = primary ? '#fde58c' : '#cbb3ff';
      const drawBg = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? accent : dim, hover ? 1 : (primary ? 0.92 : 0.7));
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        bg.lineStyle(3, accent, 1.0);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        if (primary) {
          bg.lineStyle(1, 0xffe066, 0.55);
          bg.strokeRoundedRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10, 9);
        }
      };
      drawBg(false);
      const text = add(this.add.text(x, y, label, {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: primary ? '12px' : '11px',
        color: restColor,
        stroke: '#1a0a08', strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5));
      const hit = add(this.add.rectangle(x, y, w, h, 0x000000, 0.001));
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        drawBg(true);
        text.setColor('#1a0a08');
      });
      hit.on('pointerout', () => {
        drawBg(false);
        text.setColor(restColor);
      });
      hit.on('pointerdown', onClick);
    };

    if (isSingleBtn) {
      makeModalButton({
        x: cardX, y: btnY, w: 280, h: btnH,
        label: '\u2190 Back to main',
        primary: true,
        onClick: () => navigateTo('Title', {}),
      });
    } else {
      // Two-button row. Bumped sideW from 200 -> 250 so the longest
      // pixel-font label ("Enter the Final Battle") still has a comfortable
      // margin. 250*2 + 14 = 514, fits cardW = 560.
      const sideW = 250;
      const gap = 14;
      const totalW = sideW * 2 + gap;
      const leftX = cardX - totalW / 2 + sideW / 2;
      const rightX = cardX + totalW / 2 - sideW / 2;
      makeModalButton({
        x: leftX, y: btnY, w: sideW, h: btnH,
        label: '\u2190 Back to main',
        primary: false,
        onClick: () => navigateTo('Title', {}),
      });
      makeModalButton({
        x: rightX, y: btnY, w: sideW, h: btnH,
        label: nextButtonLabel,
        primary: true,
        onClick: () => navigateTo(nextRoute, nextPayload),
      });
    }
    // Subtle entrance: fade everything in over 280 ms.
    elements.forEach((el) => el.setAlpha(0));
    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 280,
      ease: 'Sine.easeOut',
    });
  }

  /* ----- depth sort ----- */

  updateDepthSort() {
    // The visible player tracks the physics anchor's ground position with the
    // jump lift applied as a y-offset. Depth always sorts by ground y so the
    // player still slots correctly between things in front of and behind them
    // even while airborne.
    const groundX = this.player.x;
    const groundY = this.player.y;
    this.playerVisual.x = groundX;
    this.playerVisual.y = groundY - this.jumpLift;
    this.playerVisual.setDepth(groundY);

    // Shadow stays at ground level. While airborne it shrinks and dims so the
    // player reads as "lifted off the ground". Lift normalised to [0..1].
    const liftNorm = JUMP_HEIGHT_PX > 0 ? (this.jumpLift / JUMP_HEIGHT_PX) : 0;
    const shadowScale = 1 - liftNorm * 0.45;
    this.playerShadow.setPosition(groundX, groundY + 16);
    this.playerShadow.setScale(shadowScale, shadowScale);
    this.playerShadow.setAlpha(0.5 - liftNorm * 0.20);

    this.brainrots.forEach((b) => {
      if (b.state === 'wild') {
        b.sprite.setDepth(b.sprite.y);
        b.shadow.setPosition(b.sprite.x, b.sprite.y + 16);
      } else if (b.state === 'carried') {
        b.sprite.setDepth(b.sprite.y);
      }
    });
  }
}

/* ============================================================================
   BossScene - "The Hatch Below" (v0.6.0 skeleton)
   ============================================================================
   After clearing L4 with all four ultimates collected, the player drops into
   a forest clearing where Los Hackers emerges from a hatch. Gameplay shifts
   from collect-and-carry to a top-down arena fight with an ability bar.

   v0.6.0 ships the kill-loop end-to-end:
     - Forest arena with skybox / floor / perimeter trees / hatch
     - Static Los Hackers with HP bar (no AI / attacks yet)
     - Player movement (WASD / arrows / joystick), no jump, no carry
     - Slot 1 ability: Wail Shot - auto-aimed sonic projectile (Lirili)
     - Boss takes damage, dies, fades to WinScene with bossDefeated:true
     - Player loses hearts on body contact, restart-on-death back to BossScene
   v0.6.1 adds Slots 2/3/4, drones, all 3 phases, attack patterns, screen glitch.
   v0.6.2 adds the rumble/hatch/reveal cinematic intro and SFX hookups.
============================================================================ */

class BossScene extends Phaser.Scene {
  constructor() { super('Boss'); }

  create(data) {
    Sfx.init(); Sfx.resume();

    // Same multi-touch reservation as GameScene: the boss fight has 4
    // ability buttons + a virtual joystick + hold-to-channel Hydra. Without
    // this, holding the joystick blocks taps on ability slots.
    this.input.addPointer(2);

    bindViewportRefresh(this);

    // Same camera-reset prologue as GameScene so scene restarts (death loop)
    // don't leave stale skyCamera / uiCamera references behind.
    this.skyCamera = null;
    this.uiCamera = null;
    this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE);

    // ----- run state -----
    this.allDeposited = data?.allDeposited ?? [];
    this.unlockedUltimates = new Set(
      this.allDeposited.filter((id) => BRAINROT_REGISTRY[id]?.ultimate),
    );
    // Merge in any saved ultimates so the ability bar AND the prologue
    // reflect what the player actually has across all clears - not just
    // whatever this run's `allDeposited` carried in. Covers two cases:
    //   - Skip-level path: player cleared L1 + L4 only; ability bar
    //     should still light up Lirili + Hydra slots based on save.
    //   - Title dev shortcut: TitleScene._launchBoss already stitches
    //     in everything; this merge is a no-op for that path.
    const _save = SaveState.read();
    (_save.unlockedUltimates || []).forEach((id) => this.unlockedUltimates.add(id));
    this.allDeposited = Array.from(new Set([
      ...this.allDeposited,
      ...(_save.unlockedUltimates || []),
    ]));
    this.hearts = STARTING_HEARTS;
    this.invincibleUntil = 0;
    this.gameOver = false;
    this.victory = false;
    this.bossHpMax = BOSS_HP_MAX;
    this.bossHp = this.bossHpMax;
    this.lastWailAt = -10000;
    this.lastDashAt = -10000;
    this.lastBombAt = -10000;
    this.lastHydraEndAt = -10000;
    this.hydraActive = false;
    this.hydraStartedAt = 0;
    this.hydraNextTickAt = 0;
    this.bossLastHitAt = -10000;
    this.drones = [];

    // Player's last non-zero movement vector. Used for ability aim in v0.6.1+
    // (Wail Shot in v0.6.0 auto-aims at the boss so this is just defensive).
    this.facingX = 0;
    this.facingY = 1;

    this.cameras.main.setBackgroundColor('#1f3a14');
    this.physics.world.setBounds(0, 0, ARENA_W, ARENA_H);

    this.drawForestSkybox();
    this.drawForestFloor();
    this.drawTrees();
    this.drawHatch();
    this.createBoss();
    this.createPlayer();
    this.createProjectiles();
    this.createArenaBounds();

    // ----- camera bring-up -----
    // The fight starts with a 2.1 s "boss reveal": camera zoomed out (0.85)
    // and parked on the hatch while Los Hackers rises from the ground, then
    // zooms in to GAME_ZOOM and snaps to follow the player. v0.6.2 will
    // expand this into the full 9.6 s cinematic; for now this is the
    // "you can see what's happening" mini-reveal.
    this.cameras.main.setBounds(0, 0, ARENA_W, ARENA_H);
    this.cameras.main.setDeadzone(50, 40);
    this.cameras.main.setZoom(BOSS_REVEAL_ZOOM);
    this.cameras.main.centerOn(ARENA_W / 2, ARENA_H / 2 + 30);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.input.keyboard.on('keydown-ONE',  () => this.tryFireWailShot(this.time.now));
    this.input.keyboard.on('keydown-TWO',  () => this.tryFireBomb(this.time.now));
    // Slot 4: Hydra Channel Beam - hold-to-channel. Keydown starts the beam,
    // keyup ends it. We ignore OS auto-repeat keydowns (event.repeat) so a
    // held key doesn't keep re-triggering tryStartHydra.
    this.input.keyboard.on('keydown-FOUR', (e) => {
      if (e?.repeat) return;
      this.tryStartHydra();
    });
    this.input.keyboard.on('keyup-FOUR', () => this.endHydra());

    // Double-tap a directional key (arrow or WASD) to dash that way - more
    // ergonomic than reaching for `3` while the right hand is parked on the
    // arrow keys. Touch users still have the on-screen Slot 3 button.
    this._lastTapDir = null;
    this._lastTapAt = 0;
    const TAP_DIRS = {
      left:  { x: -1, y:  0 },
      right: { x:  1, y:  0 },
      up:    { x:  0, y: -1 },
      down:  { x:  0, y:  1 },
    };
    const handleDirectionalTap = (dir) => (event) => {
      if (event && event.repeat) return; // ignore OS auto-repeat keydowns
      const now = this.time.now;
      if (
        this._lastTapDir === dir &&
        now - this._lastTapAt < DASH_DOUBLE_TAP_MS
      ) {
        const v = TAP_DIRS[dir];
        this.tryDash(now, v.x, v.y);
        // Reset so a *triple* tap doesn't immediately chain a second dash.
        this._lastTapDir = null;
        this._lastTapAt = 0;
        return;
      }
      this._lastTapDir = dir;
      this._lastTapAt = now;
    };
    [
      ['LEFT', 'left'], ['RIGHT', 'right'], ['UP', 'up'], ['DOWN', 'down'],
      ['A', 'left'], ['D', 'right'], ['W', 'up'], ['S', 'down'],
    ].forEach(([keyName, dir]) => {
      this.input.keyboard.on(`keydown-${keyName}`, handleDirectionalTap(dir));
    });

    // Same registry-before-joystick ordering as GameScene. The four
    // ability-slot buttons all live on the right side, but slot 4 (Hydra,
    // x ~= 442) sits inside the left-60% joystick drag region, so the
    // registry's `contains()` check is what keeps a hold-to-channel tap
    // from also dragging the player.
    this.touchButtons = new TouchButtonRegistry(this);
    this.joystick = new VirtualJoystick(this);
    this.createBossHud();
    this.createAbilityBar();

    this.setupCameras();

    this.startBossPrologue();
  }

  /* ----- pre-fight prologue (intro Zelda card + roster card)
   *
   * Plays after createBoss + camera bring-up but BEFORE the boss-reveal
   * cinematic. Two cards:
   *   1. Zelda-style intro: "Use your ultimate brainrots / to help you
   *      fight Los Hackers." (typewriter, auto-fades)
   *   2. Roster card: a single panel showing all four ultimates, with
   *      collected ones at full opacity and uncollected ones faded so
   *      the player sees their actual progress vs the full kit. Stays
   *      up until the player clicks the LET'S FIGHT button (or hits
   *      space / enter).
   *
   * After the roster card closes we hand off to startBossReveal() which
   * runs the rumble + rise + FIGHT! beat that already existed.
   *
   * Cleanup is symmetric: any pending delayedCalls + active card
   * graphics + typer events are torn down on prologue end / scene
   * shutdown.
   */
  startBossPrologue() {
    this.introActive = true;
    this.prologueActive = true;
    this.prologueScheduledCalls = [];
    this.prologueCardObjects = [];
    this.prologueRosterReady = false;

    // Hide the boss BEFORE the prologue plays. createBoss() drops the
    // sprite at full alpha at the arena center, but we don't want the
    // player staring at Los Hackers while reading the cards. Same
    // collapse-down state that startBossReveal would re-apply later -
    // front-loaded so the prologue reads as "no boss yet, just the hatch".
    if (this.bossSprite) {
      const bossX = ARENA_W / 2;
      const bossY = ARENA_H / 2;
      this.bossSprite.setAlpha(0);
      this.bossSprite.setPosition(bossX, bossY + 60);
      this.bossSprite.setScale(this.bossNormalScaleX, this.bossNormalScaleY * 0.08);
      this.bossSprite.setDepth(bossY);
    }

    // Card 1: Zelda-style intro, sets the stakes + hands off to roster.
    const introText = 'Use your ultimate brainrots\nto help you fight Los Hackers.';
    const introDur = introText.length * 50 + 900 + 320;

    this.prologueScheduledCalls.push(
      this.time.delayedCall(250, () => {
        if (!this.prologueActive) return;
        this._showBossPrologueCard(introText);
      }),
    );

    // Card 2: roster card. Always renders (locked rows simply show as
    // faded), so the player sees what they're missing. The card stays
    // visible until the user clicks the LET'S FIGHT button - no auto
    // dismiss, no general pointer skip during this phase.
    const rosterStartT = 250 + introDur + 200;
    this.prologueScheduledCalls.push(
      this.time.delayedCall(rosterStartT, () => {
        if (!this.prologueActive) return;
        this.prologueRosterReady = true;
        this._showRosterCard();
      }),
    );

    // Keyboard shortcut for the LET'S FIGHT button. Only fires once the
    // roster card is actually up - keystrokes during the intro card do
    // nothing (the typewriter is meant to be read, not interrupted).
    const confirmKey = () => {
      if (!this.prologueActive || !this.prologueRosterReady) return;
      this.endBossPrologue();
    };
    this.input.keyboard.on('keydown-SPACE', confirmKey);
    this.input.keyboard.on('keydown-ENTER', confirmKey);
    this._prologueSkipHandler = confirmKey;
  }

  endBossPrologue() {
    if (!this.prologueActive) return;
    this.prologueActive = false;

    if (this.prologueScheduledCalls) {
      this.prologueScheduledCalls.forEach((c) => c?.remove(false));
      this.prologueScheduledCalls = [];
    }
    if (this.prologueCardObjects) {
      this.prologueCardObjects.forEach((o) => {
        if (!o) return;
        if (typeof o.destroy === 'function') o.destroy();
        else if (typeof o.remove === 'function') o.remove(false);
      });
      this.prologueCardObjects = [];
    }

    if (this._prologueSkipHandler) {
      this.input.keyboard.off('keydown-SPACE', this._prologueSkipHandler);
      this.input.keyboard.off('keydown-ENTER', this._prologueSkipHandler);
      this._prologueSkipHandler = null;
    }
    this.prologueRosterReady = false;

    this.startBossReveal();
  }

  // Zelda-style card variant for the prologue: same dialog-box + pixel-
  // font typewriter as showZeldaCard, but anchored a bit lower (so the
  // hatch + the rising boss are still partially visible behind it),
  // slightly faster typewriter, and tracked in `prologueCardObjects`
  // so endBossPrologue can rip them out on skip.
  _showBossPrologueCard(text) {
    const W = GAME_W;
    const H = GAME_H;

    const CHAR_DELAY_MS = 50;
    const LINGER_MS     = 900;
    const FADE_MS       = 320;

    const dim = this.add.graphics().setScrollFactor(0).setDepth(15999);
    dim.fillStyle(0x000000, 0.55);
    dim.fillRect(0, 0, W, H);
    dim.setAlpha(0);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(dim);
    if (this.skyCamera) this.skyCamera.ignore(dim);
    this.tweens.add({ targets: dim, alpha: 1, duration: 240, ease: 'Quad.easeOut' });

    const boxW = Math.min(560, W * 0.86);
    const boxH = 100;
    const boxCx = W / 2;
    const boxCy = H * 0.34;
    const box = this.add.graphics().setScrollFactor(0).setDepth(16000);
    box.fillStyle(0x0a0610, 0.94);
    box.fillRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    box.lineStyle(3, 0xfde58c, 0.95);
    box.strokeRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    box.lineStyle(1, 0xffe066, 0.55);
    box.strokeRoundedRect(boxCx - boxW / 2 + 5, boxCy - boxH / 2 + 5, boxW - 10, boxH - 10, 6);
    box.setAlpha(0);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(box);
    if (this.skyCamera) this.skyCamera.ignore(box);
    this.tweens.add({ targets: box, alpha: 1, duration: 240, ease: 'Quad.easeOut' });

    const card = this.add.text(boxCx, boxCy, '', {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#fde58c',
      stroke: '#1a0a08',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: boxW - 36 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(16001).setAlpha(0);
    card.setShadow(2, 2, '#3a2410', 3, true, true);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(card);
    if (this.skyCamera) this.skyCamera.ignore(card);
    this.tweens.add({ targets: card, alpha: 1, duration: 240 });

    let i = 0;
    const typer = this.time.addEvent({
      delay: CHAR_DELAY_MS,
      repeat: text.length - 1,
      callback: () => {
        i++;
        if (card?.scene) card.setText(text.slice(0, i));
      },
    });

    const lingerEnd = text.length * CHAR_DELAY_MS + LINGER_MS;
    const fadeTween = this.tweens.add({
      targets: [dim, box, card],
      alpha: 0,
      delay: lingerEnd,
      duration: FADE_MS,
      onComplete: () => {
        dim.destroy();
        box.destroy();
        card.destroy();
        if (typer) typer.remove(false);
        if (this.prologueCardObjects) {
          this.prologueCardObjects = this.prologueCardObjects.filter(
            (o) => o !== dim && o !== box && o !== card && o !== typer && o !== fadeTween,
          );
        }
      },
    });

    this.prologueCardObjects.push(dim, box, card, typer, fadeTween);
    return lingerEnd + FADE_MS;
  }

  // Roster card: a single panel listing every ultimate as a sprite +
  // brainrot name + power name + activation cue. Used as the second
  // beat of the prologue (after the introductory Zelda card).
  //
  // Behavior:
  //   - Renders ALL FOUR ultimate slots, regardless of progress.
  //   - Collected ultimates display at full opacity.
  //   - Uncollected ultimates dim to alpha 0.25 with a "Clear Level X
  //     to unlock." hint replacing the activation cue, so the player
  //     sees what they're missing and what's left to unlock.
  //   - Card stays up indefinitely. The only way to advance is the
  //     LET'S FIGHT button (or space / enter as the keyboard
  //     equivalent of clicking it).
  //
  // Layout: row content (avatar + 3-line text block) is measured, then
  // the avatar+text block is positioned so the card has equal padding
  // on both sides instead of hugging the left edge.
  _showRosterCard() {
    const W = GAME_W;
    const H = GAME_H;

    const FADE_IN_MS = 320;

    const ALL_ULT_IDS = ['lirili', 'bombardiro', 'capitano', 'hydra'];
    const INSTRUCTIONS = {
      lirili:     'Tap (1) to fire a sonic blast.',
      bombardiro: 'Tap (2) to lob a heavy bomb.',
      capitano:   'Double-tap a direction to dash.',
      hydra:      'Hold (4) for the channel beam.',
    };

    // ult -> level mapping so locked rows can hint "Clear Level N to unlock."
    const ultLevelMap = {};
    Object.values(LEVELS).forEach((lv) => {
      if (lv.ultimateId) ultLevelMap[lv.ultimateId] = lv.id;
    });

    // Layout constants.
    const padHoriz   = 36;
    const padTop     = 22;
    const padBottom  = 22;
    const headerH    = 38;
    const rowH       = 60;
    const avatarSize = 48;
    const gap        = 18;
    const buttonGap  = 18;
    const buttonH    = 46;
    const buttonW    = 220;

    const tracked = [];
    const track = (obj) => {
      obj.setScrollFactor(0);
      if (this.cameras && this.cameras.main) this.cameras.main.ignore(obj);
      if (this.skyCamera) this.skyCamera.ignore(obj);
      tracked.push(obj);
      this.prologueCardObjects.push(obj);
      return obj;
    };

    // Pre-create text objects off-screen so we can measure the longest
    // content row and size + center the card layout symmetrically.
    const rowData = ALL_ULT_IDS.map((id) => {
      const ult = BRAINROT_REGISTRY[id];
      const isUnlocked = this.unlockedUltimates.has(id);
      const levelId = ultLevelMap[id];
      const instrText = isUnlocked
        ? (INSTRUCTIONS[id] || '')
        : (levelId ? `Clear Level ${levelId} to unlock.` : 'Locked.');

      const nameTxt = this.add.text(-9999, -9999, ult.name.toUpperCase(), {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '11px', color: '#ffe066',
        stroke: '#1a0a08', strokeThickness: 3,
      }).setOrigin(0, 0.5);
      const powerTxt = this.add.text(-9999, -9999, ult.power?.name || '', {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '10px', color: '#fde58c',
        stroke: '#1a0a08', strokeThickness: 2,
      }).setOrigin(0, 0.5);
      const instrTxt = this.add.text(-9999, -9999, instrText, {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '8px', color: '#cbb3ff',
        stroke: '#1a0a08', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      return { id, ult, isUnlocked, nameTxt, powerTxt, instrTxt };
    });

    // Find the widest row's text-block width so every avatar lines up
    // and the whole content rectangle is centered in the card.
    const maxTextW = Math.max(
      0,
      ...rowData.map((r) => Math.max(r.nameTxt.width, r.powerTxt.width, r.instrTxt.width)),
    );

    const rowBlockW = avatarSize + gap + maxTextW;
    const cardW = padHoriz * 2 + rowBlockW;
    const cardH = padTop + headerH
      + rowH * ALL_ULT_IDS.length
      + buttonGap + buttonH + padBottom;
    const cardCx = W / 2;
    const cardCy = H / 2;
    const cardLeft = cardCx - cardW / 2;
    const cardTop  = cardCy - cardH / 2;

    // Center the avatar+text block across the card horizontally so the
    // avatar isn't shoved against the left edge. Text is left-aligned
    // within that block - shorter rows simply don't reach the right
    // padding boundary, which reads naturally.
    const blockLeftX = cardCx - rowBlockW / 2;
    const avatarCx   = blockLeftX + avatarSize / 2;
    const textLeftX  = blockLeftX + avatarSize + gap;

    // Dim vignette behind the card.
    const dim = track(this.add.graphics().setDepth(15999));
    dim.fillStyle(0x000000, 0.62);
    dim.fillRect(0, 0, W, H);

    // Card panel: shadow + dark plum body + gold border + inner gold rim
    // (matches the level-complete modal so the visual language stays
    // consistent across all narrative + transition cards).
    const panel = track(this.add.graphics().setDepth(16000));
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(cardLeft + 6, cardTop + 8, cardW, cardH, 14);
    panel.fillStyle(0x0a0610, 0.97);
    panel.fillRoundedRect(cardLeft, cardTop, cardW, cardH, 14);
    panel.lineStyle(3, 0xfde58c, 0.95);
    panel.strokeRoundedRect(cardLeft, cardTop, cardW, cardH, 14);
    panel.lineStyle(1, 0xffe066, 0.55);
    panel.strokeRoundedRect(cardLeft + 5, cardTop + 5, cardW - 10, cardH - 10, 11);

    // Header.
    const header = track(this.add.text(cardCx, cardTop + padTop + 4, 'YOUR ULTIMATES', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '15px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(16001));

    // Per-ultimate rows. We render all four; locked rows fade to alpha
    // 0.25 so the player can see what they're missing without it
    // competing visually with what they actually have.
    const rowsTopY = cardTop + padTop + headerH;
    const fullOpacityTargets   = [dim, panel, header];
    const lockedOpacityTargets = [];

    rowData.forEach(({ id, ult, isUnlocked, nameTxt, powerTxt, instrTxt }, i) => {
      const rowCy = rowsTopY + rowH * i + rowH / 2;

      let avatar;
      if (ult.spriteKey && this.textures.exists(ult.spriteKey)) {
        avatar = this.add.image(avatarCx, rowCy, ult.spriteKey)
          .setOrigin(0.5)
          .setDisplaySize(avatarSize, avatarSize);
      } else {
        avatar = this.add.text(avatarCx, rowCy,
          `${ult.emoji}${ult.accent || ''}`,
          { fontSize: '36px' },
        ).setOrigin(0.5);
      }
      avatar.setDepth(16001);
      track(avatar);

      // Reposition + register the pre-created (and pre-measured) text
      // objects on top of the row.
      nameTxt.setPosition(textLeftX, rowCy - 17).setDepth(16001);
      powerTxt.setPosition(textLeftX, rowCy + 0).setDepth(16001);
      instrTxt.setPosition(textLeftX, rowCy + 17).setDepth(16001);
      track(nameTxt);
      track(powerTxt);
      track(instrTxt);

      const rowEls = [avatar, nameTxt, powerTxt, instrTxt];
      if (isUnlocked) {
        fullOpacityTargets.push(...rowEls);
      } else {
        lockedOpacityTargets.push(...rowEls);
      }
    });

    // LET'S FIGHT button at the bottom of the card.
    const btnX = cardCx;
    const btnY = cardTop + padTop + headerH
      + rowH * ALL_ULT_IDS.length
      + buttonGap + buttonH / 2;

    const btnBg = track(this.add.graphics().setDepth(16001));
    const drawBtnBg = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xfde58c : 0x0a0610, hover ? 1 : 0.92);
      btnBg.fillRoundedRect(btnX - buttonW / 2, btnY - buttonH / 2, buttonW, buttonH, 10);
      btnBg.lineStyle(3, 0xfde58c, 1);
      btnBg.strokeRoundedRect(btnX - buttonW / 2, btnY - buttonH / 2, buttonW, buttonH, 10);
      btnBg.lineStyle(1, 0xffe066, 0.55);
      btnBg.strokeRoundedRect(btnX - buttonW / 2 + 5, btnY - buttonH / 2 + 5,
        buttonW - 10, buttonH - 10, 7);
    };
    drawBtnBg(false);

    const btnLabel = track(this.add.text(btnX, btnY, "LET'S FIGHT", {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '13px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(16002));

    const btnHit = this.add.rectangle(btnX, btnY, buttonW, buttonH, 0x000000, 0.001)
      .setScrollFactor(0).setDepth(16003);
    btnHit.setInteractive({ useHandCursor: true });
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(btnHit);
    if (this.skyCamera) this.skyCamera.ignore(btnHit);
    btnHit.on('pointerover', () => { drawBtnBg(true); btnLabel.setColor('#1a0a08'); });
    btnHit.on('pointerout',  () => { drawBtnBg(false); btnLabel.setColor('#fde58c'); });
    btnHit.on('pointerdown', () => { this.endBossPrologue(); });
    tracked.push(btnHit);
    this.prologueCardObjects.push(btnHit);
    fullOpacityTargets.push(btnBg, btnLabel, btnHit);

    // Fade everything in. Two parallel tweens so locked rows can settle
    // at alpha 0.25 instead of 1 once the entrance completes.
    tracked.forEach((el) => el.setAlpha(0));
    this.tweens.add({
      targets: fullOpacityTargets,
      alpha: 1,
      duration: FADE_IN_MS,
      ease: 'Quad.easeOut',
    });
    if (lockedOpacityTargets.length) {
      this.tweens.add({
        targets: lockedOpacityTargets,
        alpha: 0.25,
        duration: FADE_IN_MS,
        ease: 'Quad.easeOut',
      });
    }
  }

  /* ----- boss reveal mini-cinematic ----- */
  startBossReveal() {
    this.introActive = true;

    const bossX = ARENA_W / 2;
    const bossY = ARENA_H / 2;

    // Boss starts as a thin sliver below ground level so the rise tween
    // reads as "emerging from the hatch" - alpha 0, scaleY collapsed,
    // y nudged downward so the visible top is at the hatch.
    if (this.bossSprite) {
      this.bossSprite.setAlpha(0);
      this.bossSprite.setPosition(bossX, bossY + 60);
      this.bossSprite.setScale(this.bossNormalScaleX, this.bossNormalScaleY * 0.08);
      this.bossSprite.setDepth(bossY);
    }

    // Beat 1: rumble + dust + boss rises (200ms .. 1400ms)
    this.time.delayedCall(200, () => {
      this.cameras.main.shake(900, 0.0035);
      Sfx.play('hit');

      // Dust puff erupts from the hatch
      const cx = ARENA_W / 2;
      const cy = ARENA_H / 2 + 6;
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
        const dist = Phaser.Math.FloatBetween(40, 90);
        const dx = cx + Math.cos(ang) * dist;
        const dy = cy + Math.sin(ang) * dist * 0.45 - 18;
        const puff = this.add.graphics();
        puff.fillStyle(0xc7b48a, 0.85);
        puff.fillCircle(cx, cy, Phaser.Math.FloatBetween(8, 14));
        puff.setDepth(-980);
        this.tweens.add({
          targets: puff,
          x: dx - cx, y: dy - cy,
          alpha: 0, scale: 1.6,
          duration: 900,
          ease: 'Quad.easeOut',
          onComplete: () => puff.destroy(),
        });
      }

      // Boss rises - scaleY back to natural, alpha in, y up to spawn point
      if (this.bossSprite) {
        this.tweens.add({
          targets: this.bossSprite,
          y: bossY,
          scaleY: this.bossNormalScaleY,
          alpha: 1,
          duration: 1100,
          ease: 'Cubic.easeOut',
        });
      }
    });

    // Beat 2: zoom in to gameplay zoom + start following player (1500ms)
    this.time.delayedCall(1500, () => {
      this.cameras.main.zoomTo(GAME_ZOOM, 700, 'Quad.easeInOut');
      this.cameras.main.startFollow(this.player, true, 0.10, 0.10);
    });

    // Beat 3: unlock input and FIGHT banner (2200ms)
    this.time.delayedCall(2200, () => {
      this.introActive = false;
      // Reset the bite cooldown so the player gets a full BOSS_BITE_COOLDOWN
      // (~3.8 s) breather before the first bite telegraph - long enough to
      // read the boss, take an opening shot, and get oriented.
      if (this.boss) this.boss.lastBiteAt = this.time.now;
      this.flashText('FIGHT!', 1100);
    });
  }

  /* ----- camera setup (same routing rule as GameScene) ----- */
  setupCameras() {
    if (this.uiCamera) return;
    this.skyCamera = this.cameras.add(0, 0, GAME_W, GAME_H);
    this.skyCamera.setScroll(0, 0);
    this.skyCamera.setBackgroundColor('rgba(0,0,0,0)');
    this.uiCamera = this.cameras.add(0, 0, GAME_W, GAME_H);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setBackgroundColor('rgba(0,0,0,0)');

    const list = this.cameras.cameras;
    const skyIdx = list.indexOf(this.skyCamera);
    if (skyIdx > 0) {
      list.splice(skyIdx, 1);
      list.unshift(this.skyCamera);
    }

    const partition = (obj) => {
      if (!obj || !obj.scene) return;
      const screenLocked = obj.scrollFactorX === 0 && obj.scrollFactorY === 0;
      if (!screenLocked) {
        this.skyCamera.ignore(obj);
        this.uiCamera.ignore(obj);
        return;
      }
      const depth = obj.depth ?? 0;
      if (depth < 0) {
        this.cameras.main.ignore(obj);
        this.uiCamera.ignore(obj);
      } else {
        this.cameras.main.ignore(obj);
        this.skyCamera.ignore(obj);
      }
    };
    this.children.list.forEach(partition);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, (obj) => {
      this.time.delayedCall(0, () => partition(obj));
    });
  }

  /* ----- forest visuals ----- */

  drawForestSkybox() {
    // Soft daylight gradient on the back layer (depth -1000, scrollFactor 0)
    // so it fills the screen at zoom 1 instead of being stretched by the
    // gameplay camera. The setupCameras() partitioner routes this onto the
    // skyCamera automatically.
    const g = this.add.graphics().setScrollFactor(0).setDepth(-1000);
    for (let y = 0; y < GAME_H; y += 4) {
      const t = y / GAME_H;
      const r = Math.floor(120 + (1 - t) * 80);
      const gr = Math.floor(170 + (1 - t) * 40);
      const b = Math.floor(190 - t * 60);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, GAME_W, 4);
    }
    // Soft sun-rays through the canopy
    g.fillStyle(0xfff5c4, 0.10);
    for (let i = 0; i < 6; i++) {
      const x = (GAME_W / 6) * i + 30;
      g.fillTriangle(x, 0, x - 40, GAME_H, x + 40, GAME_H);
    }
  }

  drawForestFloor() {
    // Grass base
    const g = this.add.graphics().setDepth(-995);
    g.fillStyle(0x2a4a1a, 1);
    g.fillRect(0, 0, ARENA_W, ARENA_H);
    // Subtle darker mottling
    g.fillStyle(0x1f3a14, 0.55);
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, ARENA_W);
      const y = Phaser.Math.Between(0, ARENA_H);
      const r = Phaser.Math.Between(20, 60);
      g.fillCircle(x, y, r);
    }
    // Scatter - small ferns, grass tufts, mushrooms
    const scatter = this.add.graphics().setDepth(-990);
    for (let i = 0; i < 140; i++) {
      const x = Phaser.Math.Between(0, ARENA_W);
      const y = Phaser.Math.Between(0, ARENA_H);
      const kind = Math.random();
      if (kind < 0.55) {
        // grass tuft - 3 tiny vertical lines
        scatter.lineStyle(2, 0x6db84a, 0.85);
        scatter.lineBetween(x - 3, y + 4, x - 3, y - 2);
        scatter.lineBetween(x,     y + 4, x,     y - 4);
        scatter.lineBetween(x + 3, y + 4, x + 3, y - 1);
      } else if (kind < 0.85) {
        // fern - small green arc
        scatter.fillStyle(0x4a8c2e, 0.85);
        scatter.fillCircle(x, y, 4);
        scatter.fillCircle(x + 4, y - 1, 3);
        scatter.fillCircle(x - 4, y - 1, 3);
      } else {
        // mushroom - red cap with white stem
        scatter.fillStyle(0xfff8e8, 1);
        scatter.fillRect(x - 1, y, 2, 4);
        scatter.fillStyle(0xc8323a, 1);
        scatter.fillCircle(x, y, 3);
      }
    }
  }

  drawTrees() {
    // Pseudo-3D trees ringing the arena perimeter. Trunk + canopy drawn with
    // Graphics. Trees on the south edge depth-sort above the player when they
    // walk in front of them (trunk depth = trunk y).
    this.trees = [];
    const ring = [];
    // Top edge
    for (let x = 80; x < ARENA_W; x += 110) ring.push({ x, y: 80 });
    // Bottom edge
    for (let x = 60; x < ARENA_W; x += 120) ring.push({ x, y: ARENA_H - 60 });
    // Left edge
    for (let y = 180; y < ARENA_H - 100; y += 130) ring.push({ x: 70, y });
    // Right edge
    for (let y = 180; y < ARENA_H - 100; y += 130) ring.push({ x: ARENA_W - 70, y });

    ring.forEach((p) => {
      const jx = p.x + Phaser.Math.Between(-18, 18);
      const jy = p.y + Phaser.Math.Between(-12, 12);
      const tg = this.add.graphics();
      // Trunk
      tg.fillStyle(0x3a2616, 1);
      tg.fillRect(jx - 9, jy - 4, 18, 50);
      tg.fillStyle(0x2a1a0e, 1);
      tg.fillRect(jx - 9, jy - 4, 5, 50);
      // Canopy - layered green domes
      tg.fillStyle(0x1f4a14, 1);
      tg.fillCircle(jx,      jy - 30, 38);
      tg.fillCircle(jx - 22, jy - 22, 30);
      tg.fillCircle(jx + 22, jy - 22, 30);
      tg.fillStyle(0x2f6a1c, 1);
      tg.fillCircle(jx - 8,  jy - 38, 24);
      tg.fillCircle(jx + 12, jy - 36, 22);
      tg.fillStyle(0x4a8c2e, 0.85);
      tg.fillCircle(jx - 4, jy - 44, 14);
      // Trunk depth-sorts at the tree's ground y so the player can walk
      // behind/in-front naturally.
      tg.setDepth(jy + 10);
      this.trees.push({ x: jx, y: jy, g: tg });
    });
  }

  drawHatch() {
    // Decorative steel hatch at arena center where Los Hackers crawled out.
    // v0.6.2 will animate this opening during the cinematic intro - for now
    // it just sits in the floor as a worldbuilding cue.
    const cx = ARENA_W / 2;
    const cy = ARENA_H / 2 + 6;
    const g = this.add.graphics().setDepth(-985);
    // Dirt halo / shadow rim from the impact
    g.fillStyle(0x12200a, 0.85);
    g.fillCircle(cx, cy, 110);
    // Steel plate
    g.fillStyle(0x3a3a44, 1);
    g.fillRect(cx - 64, cy - 64, 128, 128);
    g.fillStyle(0x4f4f5c, 1);
    g.fillRect(cx - 60, cy - 60, 120, 120);
    // Cross-shaped seam where the doors split open
    g.fillStyle(0x1f1f26, 0.95);
    g.fillRect(cx - 60, cy - 3, 120, 6);
    g.fillRect(cx - 3, cy - 60, 6, 120);
    // Bolts in the corners
    g.fillStyle(0x6c6c7a, 1);
    [[-50, -50], [50, -50], [-50, 50], [50, 50]].forEach(([dx, dy]) => {
      g.fillCircle(cx + dx, cy + dy, 4);
    });
  }

  /* ----- boss ----- */

  createBoss() {
    const cx = ARENA_W / 2;
    const cy = ARENA_H / 2;

    // Generate a once-per-game rectangular texture for the boss's physics
    // anchor sized to match the visible silhouette. The body is invisible -
    // all visuals come from this.bossSprite drawn on top each frame. Using
    // a rectangle (matching the wider-than-tall sprite shape) instead of a
    // small inner circle so projectiles that visibly hit the boss register.
    if (!this.textures.exists('boss_anchor')) {
      const tg = this.add.graphics();
      tg.fillStyle(0xffffff, 1);
      tg.fillRect(0, 0, BOSS_BODY_W, BOSS_BODY_H);
      tg.generateTexture('boss_anchor', BOSS_BODY_W, BOSS_BODY_H);
      tg.destroy();
    }

    // Drop shadow sized to the sprite footprint
    this.bossShadow = this.add.graphics().setDepth(-9);

    // Bite cone is drawn underneath the boss sprite (depth = boss y - 1) so
    // it reads as "telegraphed area on the ground" rather than a UI overlay.
    this.bossBiteCone = this.add.graphics();
    // Ring Pulse uses its own graphics object so it can stack with the bite
    // cone (e.g. mid-cinematic phase shift) without a clear() collision.
    this.bossPulseGfx = this.add.graphics();
    // Hydra beam visual (Slot 4)
    this.hydraBeamGfx = this.add.graphics();

    // Invisible physics anchor. Visual sprite is laid on top each frame.
    // We DON'T set moves = false - immovable already keeps the body from
    // being shoved by collisions, and combining the two flags has been a
    // source of overlap-detection weirdness in past Phaser versions.
    this.bossBody = this.physics.add.image(cx, cy, 'boss_anchor');
    this.bossBody.setVisible(false);
    this.bossBody.body.setAllowGravity(false);
    this.bossBody.body.setImmovable(true);
    this.bossBody.body.setCollideWorldBounds(true);

    this.bossSprite = this.add.image(cx, cy, 'sprite_los_hackers')
      .setOrigin(0.5);
    this.bossSprite.setDisplaySize(BOSS_DISPLAY_W, BOSS_DISPLAY_H);
    // Capture the natural display scale so the intro rise tween can return
    // to it (tweening to a fixed scaleY=1 would ignore the source-asset
    // scaling that setDisplaySize bakes in).
    this.bossNormalScaleX = this.bossSprite.scaleX;
    this.bossNormalScaleY = this.bossSprite.scaleY;

    this.boss = {
      x: cx, y: cy,
      hp: this.bossHp,
      hpMax: this.bossHpMax,
      facing: 1,           // -1 = facing left, 1 = facing right
      bobPhase: Math.random() * Math.PI * 2,
      hitFlashUntil: 0,

      // Bite / attack state machine.
      // States: idle | telegraph | lunge | recover | casting
      // - 'casting' covers long-form attacks like Pixel Rain where the boss
      //   is rooted in place; the active sub-routine (e.g. updatePixelRain)
      //   transitions back to 'recover' when finished.
      biteState: 'idle',
      biteStateStart: 0,
      biteDirX: 0,
      biteDirY: 1,
      lastBiteAt: -10000,   // negative so the first bite can fire after the cooldown elapses naturally
      biteHitDealt: false,  // ensures a single lunge only deals 1 hit

      // Phase tracking (v0.6.1b adds P2; v0.6.1c adds P3).
      phase: 1,                          // 1 | 2 | 3
      phaseShiftUntil: 0,                // boss + player are both locked until this time
      attackKind: null,                  // 'bite' | 'rain' | 'pulse' | null

      // Pixel Rain bookkeeping
      rainPixelsLeft: 0,
      rainNextSpawnAt: 0,

      // Ring Pulse bookkeeping (v0.6.1c)
      pulses: [],            // active expanding pulses: {ox, oy, startAt, hit}
      ringPulsesLeft: 0,
      ringNextPulseAt: 0,
    };
  }

  /* ----- player (mirrors GameScene.createPlayer minus jump/carry) ----- */

  createPlayer() {
    // Spawn south of the hatch facing the boss
    const px = ARENA_W / 2;
    const py = ARENA_H * 0.78;

    this.playerShadow = this.add.ellipse(px, py + 16, 22, 8, 0x000000, 0.5);
    this.playerShadow.setDepth(-10);

    this.player = this.add.text(px, py, '🏃', { fontSize: '36px' })
      .setOrigin(0.5)
      .setVisible(false);
    this.physics.add.existing(this.player);
    this.player.body.setSize(20, 20).setOffset(8, 12);
    this.player.body.setCollideWorldBounds(true);

    // Boss arena uses the default boy avatar (no scuba in the underground).
    this.playerVisual = this.add.image(px, py, 'sprite_player_boy')
      .setOrigin(0.5)
      .setDisplaySize(PLAYER_AVATAR_W, PLAYER_AVATAR_H)
      .setDepth(py);
    // See note in GameScene.createPlayer: capture the displaySize-baked scale
    // as the base for the walk-bob animation.
    this.playerBaseScaleX = this.playerVisual.scaleX;
    this.playerBaseScaleY = this.playerVisual.scaleY;
  }

  /* ----- arena bounds (invisible walls) ----- */

  createArenaBounds() {
    // Player vs boss body collision (knocks player back, deals contact damage)
    this.physics.add.overlap(this.player, this.bossBody, () => {
      this.applyContactDamage(this.time.now);
    });
  }

  /* ----- projectiles (Wail Shot) ----- */

  createProjectiles() {
    // Pre-bake a circular sonic-wave texture once per session. We render via
    // physics.add.image (not Graphics) because Phaser's Arcade Physics needs
    // a real texture frame to size the body and apply velocity reliably -
    // dropping a body onto a Graphics object is the kind of thing that
    // silently fails to move.
    const texKey = 'wail_shot_tex';
    if (!this.textures.exists(texKey)) {
      const r = WAIL_PROJ_RADIUS;
      const tg = this.make.graphics({ x: 0, y: 0, add: false });
      // Soft outer halo -> warm core
      tg.fillStyle(0xffd34a, 0.35); tg.fillCircle(r, r, r);
      tg.fillStyle(0xffec99, 0.85); tg.fillCircle(r, r, r - 3);
      tg.fillStyle(0xffffff, 1);    tg.fillCircle(r, r, r - 7);
      tg.lineStyle(3, 0xff7e3d, 1); tg.strokeCircle(r, r, r);
      tg.lineStyle(2, 0xffd34a, 0.8); tg.strokeCircle(r, r, r - 6);
      tg.generateTexture(texKey, r * 2, r * 2);
      tg.destroy();
    }

    this.wailShots = this.physics.add.group();
    // NOTE on hit detection: an earlier cut tried physics.add.overlap on the
    // wailShots group vs. bossBody, but Arcade Physics overlap on dynamically
    // .create()'d group children plus an immovable body produced no callbacks
    // for some users. We now do a manual circle-vs-rect check inside
    // updateProjectiles() instead - same effective behavior, zero physics
    // surprises. The physics group is still used so each projectile gets a
    // body for setVelocity(), but overlaps are detected by us, not Phaser.
  }

  tryFireWailShot(time) {
    if (this.gameOver || this.victory) return;
    if (this.introActive) return;
    if (time - this.lastWailAt < WAIL_COOLDOWN_MS) return;
    if (!this.unlockedUltimates.has('lirili')) return;
    this.lastWailAt = time;

    // Auto-aim at boss in v0.6.0. Cursor/joystick aim arrives in v0.6.1.
    const dx = this.boss.x - this.player.x;
    const dy = this.boss.y - this.player.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    // Spawn a small distance ahead of the player so the projectile clearly
    // launches "from" the player toward the boss (you can see the trajectory).
    const sx = this.player.x + ux * 28;
    const sy = this.player.y + uy * 28;

    const proj = this.wailShots.create(sx, sy, 'wail_shot_tex');
    proj.setDepth(sy + 1);
    proj.body.setAllowGravity(false);
    proj.body.setCircle(WAIL_PROJ_RADIUS);
    proj.body.setVelocity(ux * WAIL_PROJ_SPEED, uy * WAIL_PROJ_SPEED);
    // Slight rotation so it tumbles as it flies - reads more like a thrown
    // sonic blast than a static disc.
    proj.body.setAngularVelocity(360);
    proj.spawnedAt = time;
    proj.killed = false;

    // Brief launch tween: starts a touch smaller and grows to full size in
    // 90 ms so the throw feels like a release, not a teleport.
    proj.setScale(0.55);
    this.tweens.add({
      targets: proj, scale: 1.0,
      duration: 90, ease: 'Quad.easeOut',
    });

    // A trailing "muzzle flash" puff at the launch point
    const puff = this.add.graphics();
    puff.fillStyle(0xfff5b8, 0.85);
    puff.fillCircle(sx, sy, WAIL_PROJ_RADIUS * 1.2);
    puff.setDepth(sy);
    this.tweens.add({
      targets: puff, alpha: 0, scale: 1.6,
      duration: 220, ease: 'Quad.easeOut',
      onComplete: () => puff.destroy(),
    });

    Sfx.play('pickup');
  }

  killWailShot(proj) {
    if (!proj || !proj.scene || proj.killed) return;
    proj.killed = true;
    if (proj.body) {
      proj.body.setVelocity(0, 0);
      proj.body.enable = false;
    }
    // Brief expand-fade so a kill doesn't just blink out
    this.tweens.add({
      targets: proj,
      scale: 1.8, alpha: 0,
      duration: 140,
      onComplete: () => proj.destroy(),
    });
  }

  updateProjectiles(time) {
    const bx = this.bossBody.x;
    const by = this.bossBody.y;
    const halfW = BOSS_BODY_W / 2;
    const halfH = BOSS_BODY_H / 2;

    this.wailShots.children.iterate((proj) => {
      if (!proj || !proj.scene || proj.killed) return;
      // Lifetime cull
      if (time - proj.spawnedAt > WAIL_PROJ_LIFE_MS) {
        this.killWailShot(proj);
        return;
      }
      proj.setDepth(proj.y + 1);

      // Manual circle-vs-rect hit test against the boss hitbox. This is the
      // hit detection - we don't rely on Phaser's overlap callback (which
      // was silently not firing for the wailShots group).
      if (!this.victory && !this.gameOver) {
        const dx = Math.abs(proj.x - bx);
        const dy = Math.abs(proj.y - by);
        if (dx < halfW + WAIL_PROJ_RADIUS && dy < halfH + WAIL_PROJ_RADIUS) {
          this.applyBossDamage(WAIL_DAMAGE, time);
          this.killWailShot(proj);
          return;
        }

        // Drone collision check: 1-hit kills, no boss damage. We don't bail
        // out the projectile after a drone hit so a single shot CAN clear a
        // line of two drones, which is satisfying when timed right.
        for (let i = this.drones.length - 1; i >= 0; i--) {
          const d = this.drones[i];
          if (Math.hypot(proj.x - d.x, proj.y - d.y) <= WAIL_PROJ_RADIUS + DRONE_SIZE * 0.55) {
            this.killDrone(d, true);
            this.drones.splice(i, 1);
            this.killWailShot(proj);
            return;
          }
        }
      }

      // Despawn when hitting arena edge
      if (
        proj.x < 4 || proj.x > ARENA_W - 4 ||
        proj.y < 4 || proj.y > ARENA_H - 4
      ) {
        this.killWailShot(proj);
      }
    });
  }

  /* ----- Slot 3: Capitano Tidal Dash ----- */

  tryDash(time, dirX = null, dirY = null) {
    if (this.gameOver || this.victory) return;
    if (this.introActive) return;
    if (time - this.lastDashAt < DASH_COOLDOWN_MS) return;
    if (!this.unlockedUltimates.has('capitano')) return;

    // Dashing breaks the Hydra channel - it's an active dodge, the player
    // is choosing repositioning over damage.
    if (this.hydraActive) this.endHydra();

    // Direction: explicit (from double-tap) wins; otherwise fall back to
    // facing. Default straight up if there's no facing yet (rare - only if
    // you dash before ever moving).
    let dx = dirX !== null ? dirX : this.facingX;
    let dy = dirY !== null ? dirY : this.facingY;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) { dx = 0; dy = -1; }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;

    this.lastDashAt = time;

    const dashSpeed = (DASH_DISTANCE / DASH_DURATION_MS) * 1000;
    this.player.body.setVelocity(dx * dashSpeed, dy * dashSpeed);
    // Lock movement input out for the dash duration so handleMovement()
    // doesn't override the dash velocity, then the iframe window outlasts
    // the dash by ~100 ms so the very end of the dash is still safe.
    this.knockbackUntil = time + DASH_DURATION_MS;
    this.invincibleUntil = Math.max(this.invincibleUntil, time + DASH_IFRAMES_MS);

    // Visual: tint the runner cool blue + spawn a few afterimage ghosts.
    this.playerVisual.setTint(0x66c8ff);
    this.time.delayedCall(DASH_DURATION_MS, () => {
      if (this.playerVisual?.scene) this.playerVisual.clearTint();
    });
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 45, () => {
        if (!this.player?.scene) return;
        const ghost = this.add.image(this.player.x, this.player.y, 'sprite_player_boy')
          .setOrigin(0.5)
          .setDisplaySize(PLAYER_AVATAR_W, PLAYER_AVATAR_H)
          .setAlpha(0.55)
          .setTint(0x66c8ff)
          .setDepth(this.player.y - 1);
        // Tween to 70% of the displaySize-baked scale (NOT to absolute 0.7,
        // which would blow the ghost back up to ~0.7× the 256-px source).
        const ghostShrink = 0.7;
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: ghost.scaleX * ghostShrink,
          scaleY: ghost.scaleY * ghostShrink,
          duration: 280,
          onComplete: () => ghost.destroy(),
        });
      });
    }

    Sfx.play('portal');
  }

  /* ----- Slot 2: Bombardiro Pasta Bomb ----- *
   * Auto-aim at the boss in v0.6.1b - bomb arcs from the player, drops a
   * pulsing red warning ring at the target, then detonates after a generous
   * telegraph. High single-target damage, long cooldown - it's the "commit
   * to this exchange" tool. Cursor-aim variant arrives in v0.6.1c. */

  tryFireBomb(time) {
    if (this.gameOver || this.victory || this.introActive) return;
    if (time - this.lastBombAt < BOMB_COOLDOWN_MS) return;
    if (!this.unlockedUltimates.has('bombardiro')) return;

    this.lastBombAt = time;

    const sx = this.player.x;
    const sy = this.player.y - 30;
    const tx = this.bossBody.x;
    const ty = this.bossBody.y;

    // Bomb sprite. We use the bomb emoji for character; it reads instantly
    // and avoids the asset pipeline overhead of a one-off PNG.
    const bomb = this.add.text(sx, sy, '💣', { fontSize: '40px' })
      .setOrigin(0.5)
      .setDepth(20000);

    // Parabolic arc driven by an `onUpdate` tween on a scratch object: gives
    // us a clean separable x (linear) and y (linear + arc) without juggling
    // chained tweens.
    const arc = { t: 0 };
    this.tweens.add({
      targets: arc,
      t: 1,
      duration: BOMB_TRAVEL_MS,
      ease: 'Linear',
      onUpdate: () => {
        const t = arc.t;
        bomb.x = sx + (tx - sx) * t;
        // Linear baseline + parabola peak (BOMB_ARC_HEIGHT) at t = 0.5.
        bomb.y = (sy + (ty - sy) * t) - BOMB_ARC_HEIGHT * 4 * t * (1 - t);
        bomb.angle = t * 720;
      },
      onComplete: () => {
        bomb.destroy();
        this.spawnBombWarning(tx, ty);
      },
    });

    Sfx.play('pickup');
  }

  spawnBombWarning(tx, ty) {
    const warning = this.add.graphics();
    warning.fillStyle(0xff2040, 0.42);
    warning.fillCircle(0, 0, BOMB_RADIUS);
    warning.lineStyle(3, 0xff5555, 1.0);
    warning.strokeCircle(0, 0, BOMB_RADIUS);
    warning.setPosition(tx, ty);
    warning.setDepth(ty - 1);
    // Pulse to make the threat read clearly even on the busy forest floor.
    this.tweens.add({
      targets: warning,
      scaleX: 1.10, scaleY: 1.10,
      duration: 180,
      yoyo: true, repeat: -1,
    });

    this.time.delayedCall(BOMB_WARNING_MS, () => {
      warning.destroy();
      this.detonateBomb(tx, ty, this.time.now);
    });
  }

  detonateBomb(tx, ty, time) {
    // Bright orange-white expanding ring + a softer fill so the AOE radius
    // is unambiguous even after the warning ring is gone.
    const ring = this.add.graphics();
    ring.fillStyle(0xfff5b8, 0.70);
    ring.fillCircle(0, 0, 24);
    ring.lineStyle(4, 0xffae33, 0.95);
    ring.strokeCircle(0, 0, 24);
    ring.setPosition(tx, ty);
    ring.setDepth(ty + 1);
    this.tweens.add({
      targets: ring,
      scale: BOMB_RADIUS / 14, alpha: 0,
      duration: 420, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    this.cameras.main.shake(280, 0.022);
    Sfx.play('hit');

    // Damage check vs. the boss + sweep all drones in the blast.
    if (!this.gameOver && !this.victory) {
      const dx = this.bossBody.x - tx;
      const dy = this.bossBody.y - ty;
      this.damageDronesAt(tx, ty, BOMB_RADIUS);
      if (Math.hypot(dx, dy) <= BOMB_RADIUS) {
        this.applyBossDamage(BOMB_DAMAGE, time);
      }
    }
  }

  /* ----- Slot 4: Hydra Channel Beam ----- *
   * Hold-to-channel ranged DPS. The player is rooted while the beam is
   * active; the beam fires from the player toward the boss and ticks damage
   * every HYDRA_TICK_MS. Channels break on damage taken, on dash, on
   * hydra-button release, or on max duration. */

  tryStartHydra() {
    const time = this.time.now;
    if (this.gameOver || this.victory || this.introActive) return;
    if (this.hydraActive) return;
    if (time - this.lastHydraEndAt < HYDRA_COOLDOWN_MS) return;
    if (!this.unlockedUltimates.has('hydra')) return;

    this.hydraActive = true;
    this.hydraStartedAt = time;
    this.hydraNextTickAt = time + HYDRA_TICK_MS;
    // Root the player immediately (handleMovement will keep it at zero too).
    if (this.player?.body) this.player.body.setVelocity(0, 0);
    Sfx.play('portal');
  }

  endHydra() {
    if (!this.hydraActive) return;
    this.hydraActive = false;
    this.lastHydraEndAt = this.time.now;
    if (this.hydraBeamGfx) this.hydraBeamGfx.clear();
  }

  updateHydra(time) {
    if (!this.hydraActive) return;
    if (this.gameOver || this.victory) {
      this.endHydra();
      return;
    }
    // Hard cap on channel duration.
    if (time - this.hydraStartedAt >= HYDRA_MAX_DURATION) {
      this.endHydra();
      return;
    }
    // Damage tick.
    if (time >= this.hydraNextTickAt) {
      this.applyHydraTick(time);
      this.hydraNextTickAt = time + HYDRA_TICK_MS;
    }
    // Visual.
    this.drawHydraBeam(time);
  }

  applyHydraTick(time) {
    if (!this.boss) return;
    const px = this.player.x;
    const py = this.player.y;
    const bx = this.bossBody.x;
    const by = this.bossBody.y;

    // Boss hit: line-vs-rect (using the rect's bounding circle is plenty
    // since the beam is anchored toward the boss).
    if (!this.victory && time >= (this.boss.phaseShiftUntil || 0)) {
      const halfW = BOSS_BODY_W / 2;
      const halfH = BOSS_BODY_H / 2;
      // The beam ends at the boss center, so a tick is "in range" any time
      // we're channeling - phase-shift invuln gates the actual damage.
      const dx = Math.abs(px - bx);
      const dy = Math.abs(py - by);
      // Only tick the boss when the player is actually in line-of-sight
      // distance (a sanity check for crazy-edge cases, e.g. boss off-screen).
      if (dx < ARENA_W && dy < ARENA_H) {
        // Light hit feedback, but suppress shake on every tick (10/sec is
        // way too jittery). spawnDamageNumber is paced fine though.
        this.bossHp = Math.max(0, this.bossHp - HYDRA_DAMAGE_PER_TICK);
        this.boss.hp = this.bossHp;
        this.boss.hitFlashUntil = time + 80;
        this.spawnDamageNumber(this.boss.x, this.boss.y - 40, HYDRA_DAMAGE_PER_TICK);
        if (this.bossHp <= 0) {
          this.handleVictory();
          return;
        }
        // Phase transitions still happen on hydra ticks.
        if (this.boss.phase < 2) this.maybeEnterPhase2(time);
        if (this.boss.phase < 3) this.maybeEnterPhase3(time);
        // Suppress the larger applyBossDamage shake - we just baked the
        // damage in directly above.
        // (uses halfW/halfH only for the in-range read; not a hit gate)
        void halfW; void halfH;
      }
    }

    // Drone hits along the beam: kill any drone whose center is within
    // HYDRA_BEAM_HALF_W of the line segment player->boss.
    const ax = px;
    const ay = py;
    const dxL = bx - ax;
    const dyL = by - ay;
    const lenSq = dxL * dxL + dyL * dyL || 1;
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      // Project drone onto segment, clamp to [0..1].
      const t = Phaser.Math.Clamp(((d.x - ax) * dxL + (d.y - ay) * dyL) / lenSq, 0, 1);
      const projX = ax + dxL * t;
      const projY = ay + dyL * t;
      const dist = Math.hypot(d.x - projX, d.y - projY);
      if (dist <= HYDRA_BEAM_HALF_W + DRONE_SIZE * 0.55) {
        this.killDrone(d, true);
        this.drones.splice(i, 1);
      }
    }
  }

  drawHydraBeam(time) {
    const g = this.hydraBeamGfx;
    g.clear();
    if (!this.hydraActive) return;
    const ax = this.player.x;
    const ay = this.player.y;
    const bx = this.bossBody.x;
    const by = this.bossBody.y;

    // Pulse the beam's glow with a quick sine so the channel visibly throbs.
    const pulse = 0.7 + Math.sin(time / 50) * 0.30;

    // Outer halo (wide, low alpha).
    g.lineStyle(HYDRA_BEAM_HALF_W * 2.4, 0x66f0ff, 0.25 * pulse);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.strokePath();
    // Mid layer.
    g.lineStyle(HYDRA_BEAM_HALF_W * 1.4, 0x44d8f0, 0.55 * pulse);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.strokePath();
    // Inner core (thin, bright).
    g.lineStyle(4, 0xeaffff, 0.95);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.strokePath();

    // Sparkle clusters at both ends.
    const sparkleR = 8 + Math.sin(time / 70) * 4;
    g.fillStyle(0xeaffff, 0.85);
    g.fillCircle(ax, ay, sparkleR * 0.7);
    g.fillStyle(0x99eeff, 0.55);
    g.fillCircle(ax, ay, sparkleR);
    g.fillStyle(0xeaffff, 0.85);
    g.fillCircle(bx, by, sparkleR * 0.6);
    g.fillStyle(0xff99cc, 0.45);
    g.fillCircle(bx, by, sparkleR * 1.1);
  }

  /* ----- damage & feedback ----- */

  applyBossDamage(amount, time) {
    if (this.victory) return;
    // No-damage windows: phase shift cinematic
    if (time < (this.boss?.phaseShiftUntil || 0)) return;
    this.bossHp = Math.max(0, this.bossHp - amount);
    this.boss.hp = this.bossHp;
    this.boss.hitFlashUntil = time + BOSS_FLASH_MS;
    Sfx.play('hit');
    // Visible hit feedback: a tiny screen punch + a floating damage number
    // that drifts up and fades. Without this the bar shrinks so subtly that
    // a player can fire a clean Wail Shot and not be sure if it landed.
    this.cameras.main.shake(80, 0.0035);
    this.spawnDamageNumber(this.boss.x, this.boss.y - 40, amount);
    if (this.bossHp <= 0) {
      this.handleVictory();
      return;
    }
    // HP-gated phase transitions. Order matters - check P2 first, then P3,
    // so a single big hit that crosses both thresholds (e.g. a fully-charged
    // Pasta Bomb at ~700 HP) triggers both cinematics in sequence.
    if (this.boss.phase < 2) {
      this.maybeEnterPhase2(time);
    }
    if (this.boss.phase < 3) {
      this.maybeEnterPhase3(time);
    }
  }

  maybeEnterPhase2(time) {
    if (!this.boss || this.boss.phase >= 2) return;
    if (this.bossHp > BOSS_PHASE_2_HP_PCT * BOSS_HP_MAX) return;
    this.enterPhase2(time);
  }

  maybeEnterPhase3(time) {
    if (!this.boss || this.boss.phase >= 3) return;
    if (this.bossHp > BOSS_PHASE_3_HP_PCT * BOSS_HP_MAX) return;
    this.enterPhase3(time);
  }

  enterPhase2(time) {
    this.boss.phase = 2;
    // Both player and boss are locked during the shift: player gets iframes
    // (so an in-flight bite can't kill them mid-cinematic), boss can't be
    // damaged or chained into a new attack.
    this.invincibleUntil = Math.max(this.invincibleUntil, time + PHASE_SHIFT_INVULN_MS);
    this.boss.phaseShiftUntil = time + PHASE_SHIFT_INVULN_MS;
    this.cancelBossAttack(time);

    // Big screen-wide cue: violet flash + shake + banner + boss flash.
    this.cameras.main.flash(420, 130, 70, 200);
    this.cameras.main.shake(620, 0.022);
    this.boss.hitFlashUntil = time + 800;
    this.flashText('PHASE 2 — PIXEL STORM', 1800);
    Sfx.play('hit');

    // Reset the bite cooldown so the player gets a beat after the cinematic
    // before the first P2 attack lands.
    this.boss.lastBiteAt = time;
  }

  enterPhase3(time) {
    this.boss.phase = 3;
    this.invincibleUntil = Math.max(this.invincibleUntil, time + PHASE_SHIFT_INVULN_MS);
    this.boss.phaseShiftUntil = time + PHASE_SHIFT_INVULN_MS;
    this.cancelBossAttack(time);
    // Crimson flash + bigger shake than P2 to signal the deeper phase.
    this.cameras.main.flash(500, 220, 30, 30);
    this.cameras.main.shake(800, 0.028);
    this.boss.hitFlashUntil = time + 1000;
    this.flashText('PHASE 3 — SYSTEM CRITICAL', 1900);
    Sfx.play('hit');
    this.boss.lastBiteAt = time;
  }

  cancelBossAttack(time) {
    // Flush whatever the boss was doing (bite, rain, pulse) back to a clean
    // recover so the chooser starts fresh after the phase-shift lockout.
    this.boss.biteState = 'recover';
    this.boss.biteStateStart = time;
    this.boss.attackKind = null;
    this.boss.pulses = [];
    this.bossBiteCone.clear();
    this.bossPulseGfx.clear();
    if (this.bossBody?.body) this.bossBody.body.setVelocity(0, 0);
  }

  spawnDamageNumber(x, y, amount) {
    const t = this.add.text(x, y, `-${amount}`, {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '14px', color: '#ffe066',
      stroke: '#1a0a08', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(y + 600);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0, scale: 1.4,
      duration: 700, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  applyContactDamage(time) {
    if (this.gameOver || this.victory) return;
    if (this.introActive) return;
    if (time < this.invincibleUntil) return;
    this.hearts = Math.max(0, this.hearts - BOSS_TOUCH_DAMAGE);
    this.invincibleUntil = time + INVINCIBLE_MS;
    Sfx.play('hit');
    this.cameras.main.shake(160, 0.010);
    // Knockback: shove player away from boss center. Lock input out for
    // a quarter-second so the shove visibly plays before handleMovement()
    // overrides velocity from keys.
    const dx = this.player.x - this.boss.x;
    const dy = this.player.y - this.boss.y;
    const len = Math.hypot(dx, dy) || 1;
    this.player.body.setVelocity((dx / len) * 240, (dy / len) * 240);
    this.knockbackUntil = time + 250;
    this.refreshHearts();
    if (this.hydraActive) this.endHydra();
    if (this.hearts <= 0) this.handleGameOver();
  }

  /* ----- input / movement ----- */

  handleMovement(time) {
    // Intro reveal locks player input - boss is rising from the hatch and
    // the player is "watching". Force velocity to 0 in case any leftover
    // joystick state is sitting on the body.
    if (this.introActive) {
      this.player.body.setVelocity(0, 0);
      return;
    }
    // Hydra channel roots the player so the high DPS comes with no kiting.
    // We still allow the dash override (tryDash explicitly endHydra's), and
    // damage taken triggers endHydra in the contact handlers.
    if (this.hydraActive) {
      this.player.body.setVelocity(0, 0);
      return;
    }
    // While boss-contact knockback is still bleeding off (~250 ms after a
    // hit), let the body keep its existing velocity so the player visibly
    // gets shoved back. After the lockout we always set velocity directly
    // from input - no glide/no drag - so releasing the keys snaps to a stop.
    if (time < (this.knockbackUntil ?? 0)) return;

    let vx = 0, vy = 0;
    if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  1;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown  || this.wasd.S.isDown) vy =  1;

    const stick = this.joystick.getVector();
    if (stick.x !== 0 || stick.y !== 0) {
      vx = stick.x; vy = stick.y;
    }

    const mag = Math.hypot(vx, vy);
    if (mag > 1) { vx /= mag; vy /= mag; }

    this.player.body.setVelocity(vx * BASE_SPEED, vy * BASE_SPEED);

    if (mag > 0.1) {
      this.facingX = vx;
      this.facingY = vy;
      // Visual flip + tiny bob so the runner feels alive. Multiply by the
      // base scale so the avatar keeps its display size (otherwise setScale
      // would render the boy at his 256-px source resolution).
      const facingX = vx < 0 ? -1 : 1;
      const bob = 1 + Math.sin(time / 90) * 0.06;
      this.playerVisual.setScale(
        this.playerBaseScaleX * facingX,
        this.playerBaseScaleY * bob,
      );
    }
  }

  /* ----- HUD ----- */

  createBossHud() {
    const W = GAME_W;
    // Boss banner (pixel font, danger red) + HP bar across the top.
    this.add.text(W / 2, 12, 'LOS HACKERS', {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '14px', color: '#ff3a3a',
      stroke: '#1a0a08', strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10000);

    this.bossHpBg = this.add.graphics().setScrollFactor(0).setDepth(10000);
    this.bossHpFill = this.add.graphics().setScrollFactor(0).setDepth(10001);
    this.drawBossHpBar();

    // Pixel-art hearts top-left, scaled slightly smaller than the GameScene
    // HUD so they don't crowd the boss HP bar.
    this.hudHearts = [];
    const heartSpacing = 30;
    const heartPx = 3;
    const heartH = PIXEL_HEART_PATTERN.length * heartPx;
    const heartCenterY = 16 + heartH / 2;
    for (let i = 0; i < STARTING_HEARTS; i++) {
      const h = makePixelHeart(this, 22 + i * heartSpacing, heartCenterY, {
        px: heartPx,
      })
        .setScrollFactor(0)
        .setDepth(10000);
      if (i >= this.hearts) h.setAlpha(0.2);
      this.hudHearts.push(h);
    }

    // Bottom-left gameplay hint - rotates as more abilities come online.
    // Pixel font, very small, so it doesn't crowd the ability bar above.
    this.add.text(16, GAME_H - 14,
      '1 Wail  2 Bomb  2x dir Dash  hold 4 Hydra  -  dodge red zones', {
        fontFamily: '"Press Start 2P", Georgia, sans-serif',
        fontSize: '8px', color: '#cbb3ff',
        stroke: '#1a0a08', strokeThickness: 3,
      }).setOrigin(0, 1).setScrollFactor(0).setDepth(10000);
  }

  drawBossHpBar() {
    const W = GAME_W;
    const barX = W * 0.18;
    const barY = 38;
    const barW = W * 0.64;
    const barH = 14;
    const pct = this.bossHp / this.bossHpMax;
    this.bossHpBg.clear();
    this.bossHpBg.fillStyle(0x1a0f1f, 0.85);
    this.bossHpBg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    this.bossHpBg.lineStyle(2, 0x6c6c7a, 1);
    this.bossHpBg.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
    this.bossHpFill.clear();
    // Color shift: red -> orange near low HP for tension
    const fillColor = pct > 0.33 ? 0xc8323a : 0xff6b3a;
    this.bossHpFill.fillStyle(fillColor, 1);
    this.bossHpFill.fillRect(barX, barY, barW * pct, barH);
    if (pct > 0) {
      this.bossHpFill.fillStyle(0xff9494, 0.55);
      this.bossHpFill.fillRect(barX, barY, barW * pct, barH * 0.45);
    }
  }

  refreshHearts() {
    if (!this.hudHearts) return;
    this.hudHearts.forEach((h, i) => {
      h.setAlpha(i < this.hearts ? 1 : 0.2);
    });
  }

  updateBossHud() {
    this.drawBossHpBar();
  }

  /* ----- ability bar -----
   * Each unlocked ultimate gets its own bottom-right circular button with a
   * radial cooldown overlay. v0.6.1a wires Slots 1 (Wail) and 3 (Dash);
   * v0.6.1b will add Slots 2 (Bombardiro) and 4 (Hydra) into the same layout.
   */

  createAbilityBar() {
    const r = 42;
    const y = GAME_H - 70;
    // Right-anchored row. Slots stack right-to-left.
    const baseX = GAME_W - 70;
    const slotSpacing = 96;

    this.abilitySlots = [];

    // Slot 4 (leftmost): Hydra Channel Beam. Hold-to-channel; pointer
    // release breaks the beam, mirroring the keyboard hold-on-4 behavior.
    this.abilitySlots.push(this.makeAbilitySlot({
      x: baseX - slotSpacing * 3, y, r,
      ultId: 'hydra',
      hotkeyLabel: 'hold (4)',
      ringColor: 0x66f0ff,
      cooldownColor: 0x66f0ff,
      getLastUseTime: () => this.lastHydraEndAt,
      cooldownMs: HYDRA_COOLDOWN_MS,
      onActivate: () => this.tryStartHydra(),
      onRelease: () => this.endHydra(),
    }));

    // Slot 3: Capitano dash. Hotkey is double-tap a movement key; the button
    // label reflects that rather than a digit.
    this.abilitySlots.push(this.makeAbilitySlot({
      x: baseX - slotSpacing * 2, y, r,
      ultId: 'capitano',
      hotkeyLabel: '2× arrow',
      ringColor: 0x66c8ff,
      cooldownColor: 0x66c8ff,
      getLastUseTime: () => this.lastDashAt,
      cooldownMs: DASH_COOLDOWN_MS,
      onActivate: () => this.tryDash(this.time.now),
    }));

    // Slot 2: Bombardiro Pasta Bomb - auto-aim AOE with a heavy single-target
    // payload and a long cooldown.
    this.abilitySlots.push(this.makeAbilitySlot({
      x: baseX - slotSpacing, y, r,
      ultId: 'bombardiro',
      hotkeyLabel: '(2)',
      ringColor: 0xff8a3a,
      cooldownColor: 0xff8a3a,
      getLastUseTime: () => this.lastBombAt,
      cooldownMs: BOMB_COOLDOWN_MS,
      onActivate: () => this.tryFireBomb(this.time.now),
    }));

    // Slot 1 (rightmost): Lirili wail shot - the bread-and-butter dps tool.
    this.abilitySlots.push(this.makeAbilitySlot({
      x: baseX, y, r,
      ultId: 'lirili',
      hotkeyLabel: '(1)',
      ringColor: 0xffe066,
      cooldownColor: 0xffe066,
      getLastUseTime: () => this.lastWailAt,
      cooldownMs: WAIL_COOLDOWN_MS,
      onActivate: () => this.tryFireWailShot(this.time.now),
    }));
  }

  makeAbilitySlot({ x, y, r, ultId, hotkeyLabel, ringColor, cooldownColor, getLastUseTime, cooldownMs, onActivate, onRelease }) {
    const ult = BRAINROT_REGISTRY[ultId];
    const unlocked = this.unlockedUltimates.has(ultId);

    const container = this.add.container(x, y).setScrollFactor(0).setDepth(11500);
    const bg = this.add.graphics();

    let icon;
    if (unlocked && ult?.spriteKey && this.textures.exists(ult.spriteKey)) {
      icon = this.add.image(0, -2, ult.spriteKey).setDisplaySize(48, 48);
    } else {
      icon = this.add.text(0, -2, ult?.emoji ?? '✦', { fontSize: '28px' }).setOrigin(0.5);
      if (!unlocked) icon.setAlpha(0.35);
    }
    const hint = this.add.text(0, 22, hotkeyLabel, {
      fontFamily: '"Press Start 2P", Georgia, sans-serif',
      fontSize: '8px', color: '#cbb3ff',
      stroke: '#1a0a08', strokeThickness: 2,
    }).setOrigin(0.5);
    container.add([bg, icon, hint]);

    // Hit-test is delegated to TouchButtonRegistry instead of
    // setInteractive(geometry). Same reason as the JUMP button on
    // GameScene: cameras.main.setZoom(1.6) was offsetting Phaser's
    // per-camera hit transform on iPad. The registry tracks press +
    // release per pointer.id, so onRelease only fires for pointers that
    // originally pressed *this* slot - matching the old gameObject-bound
    // pointerup / pointerupoutside semantics that hydra-channel needs.
    this.touchButtons.add({
      x, y,
      shape: 'circle',
      hitR: r,
      onTap: () => onActivate(),
      ...(onRelease ? { onRelease: () => onRelease() } : {}),
    });

    return {
      container, bg, icon, ultId, r,
      ringColor, cooldownColor,
      getLastUseTime, cooldownMs,
      unlocked,
    };
  }

  updateAbilityBar(time) {
    if (!this.abilitySlots) return;
    this.abilitySlots.forEach((slot) => {
      const left = Math.max(0, slot.cooldownMs - (time - slot.getLastUseTime()));
      const onCooldown = left > 0;
      const bg = slot.bg;
      const r = slot.r;
      bg.clear();
      if (!slot.unlocked) {
        // Locked slot: dim + grey.
        bg.fillStyle(0x1a0f1f, 0.30);
        bg.fillCircle(0, 0, r);
        bg.lineStyle(3, 0x4a3f4a, 0.55);
        bg.strokeCircle(0, 0, r);
        slot.icon.setAlpha(0.30);
        return;
      }
      if (onCooldown) {
        const pct = Phaser.Math.Clamp(1 - left / slot.cooldownMs, 0, 1);
        bg.fillStyle(0x1a0f1f, 0.40);
        bg.fillCircle(0, 0, r);
        // Radial fill grows clockwise as the cooldown elapses
        bg.fillStyle(slot.cooldownColor, 0.28);
        bg.slice(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false);
        bg.fillPath();
        bg.lineStyle(3, 0x6a4f6a, 0.7);
        bg.strokeCircle(0, 0, r);
        slot.icon.setAlpha(0.55);
      } else {
        const pulse = 0.55 + Math.sin(time / 200) * 0.10;
        bg.fillStyle(0x1a0f1f, pulse);
        bg.fillCircle(0, 0, r);
        bg.lineStyle(3, slot.ringColor, 0.95);
        bg.strokeCircle(0, 0, r);
        slot.icon.setAlpha(1);
      }
    });
  }

  /* ----- depth sort + boss visual update ----- */

  updateBoss(time) {
    if (!this.boss) return;
    const cx = this.bossBody.x;
    const cy = this.bossBody.y;
    this.boss.x = cx; this.boss.y = cy;

    // During the rise tween the boss sprite's position/scale/alpha are owned
    // by the intro - leave them alone or we'll fight the tween every frame.
    if (this.introActive) return;

    // Idle bob + face the player (or the locked bite direction during a bite).
    const bob = Math.sin((time / 380) + this.boss.bobPhase) * 4;
    this.bossSprite.setPosition(cx, cy + bob);
    this.bossSprite.setDepth(cy);
    const biteState = this.boss.biteState;
    if (biteState === 'telegraph' || biteState === 'lunge') {
      // Lock the visual flip to whichever way the bite is going so the
      // sprite reads as committing to the swing.
      this.bossSprite.setFlipX(this.boss.biteDirX > 0);
      this.boss.facing = this.boss.biteDirX > 0 ? 1 : -1;
    } else if (this.player.x < cx - 10) {
      this.bossSprite.setFlipX(false);
      this.boss.facing = -1;
    } else if (this.player.x > cx + 10) {
      this.bossSprite.setFlipX(true);
      this.boss.facing = 1;
    }
    // Hit flash > phase tint > clear. Each phase has a permanent tint as a
    // passive reminder that the encounter has escalated: lavender (P2),
    // crimson (P3).
    if (time < this.boss.hitFlashUntil) {
      this.bossSprite.setTint(0xff5050);
    } else if (this.boss.phase >= 3) {
      this.bossSprite.setTint(0xff6868);
    } else if (this.boss.phase === 2) {
      this.bossSprite.setTint(0xd0a8ff);
    } else {
      this.bossSprite.clearTint();
    }

    // Drop shadow
    const sg = this.bossShadow;
    sg.clear();
    sg.fillStyle(0x010204, 0.28);
    sg.fillEllipse(cx, cy + BOSS_DISPLAY_H * 0.42, BOSS_DISPLAY_W * 0.55, 22);
    sg.fillStyle(0x010204, 0.18);
    sg.fillEllipse(cx, cy + BOSS_DISPLAY_H * 0.42, BOSS_DISPLAY_W * 0.72, 30);
  }

  /* ----- boss AI (Phase 1 stalker + bite cone) ----- */

  updateBossAI(time) {
    if (!this.boss) return;
    if (this.introActive || this.gameOver || this.victory) {
      if (this.bossBody?.body) this.bossBody.body.setVelocity(0, 0);
      return;
    }
    // Phase shift cinematic: boss is fully frozen.
    if (time < this.boss.phaseShiftUntil) {
      this.bossBody.body.setVelocity(0, 0);
      return;
    }

    const state = this.boss.biteState;
    const elapsed = time - this.boss.biteStateStart;
    const px = this.player.x;
    const py = this.player.y;
    const bx = this.bossBody.x;
    const by = this.bossBody.y;
    const dx = px - bx;
    const dy = py - by;
    const dist = Math.hypot(dx, dy) || 1;

    if (state === 'idle') {
      // Stalk: walk toward player at a lazy menacing pace.
      if (dist > 14) {
        this.bossBody.body.setVelocity(
          (dx / dist) * BOSS_MOVE_SPEED_P1,
          (dy / dist) * BOSS_MOVE_SPEED_P1,
        );
      } else {
        this.bossBody.body.setVelocity(0, 0);
      }
      // Cooldown elapsed -> commit to whichever attack the chooser picks.
      if (time - this.boss.lastBiteAt > BOSS_BITE_COOLDOWN) {
        this.chooseNextAttack(time, dist);
      }
    } else if (state === 'telegraph') {
      // Frozen, charging up the bite. Cone visual is drawn in drawBiteCone().
      this.bossBody.body.setVelocity(0, 0);
      if (elapsed >= BOSS_BITE_TELEGRAPH) {
        this.boss.biteState = 'lunge';
        this.boss.biteStateStart = time;
        this.boss.biteHitDealt = false;
        this.bossBody.body.setVelocity(
          this.boss.biteDirX * BOSS_LUNGE_VELOCITY,
          this.boss.biteDirY * BOSS_LUNGE_VELOCITY,
        );
      }
    } else if (state === 'lunge') {
      // Snap forward; damage check happens each frame in checkBiteDamage().
      if (elapsed >= BOSS_BITE_LUNGE_MS) {
        this.boss.biteState = 'recover';
        this.boss.biteStateStart = time;
        this.bossBody.body.setVelocity(0, 0);
      }
    } else if (state === 'casting') {
      // Long-form attack (Pixel Rain / Ring Pulse) is running independently
      // in its own update routine - boss just stays rooted with a tiny bob.
      this.bossBody.body.setVelocity(0, 0);
    } else if (state === 'recover') {
      // Brief stagger: boss is open to punishment for half a second.
      this.bossBody.body.setVelocity(0, 0);

      // One-shot drone wave spawn at the start of recover, but only after a
      // long cast (rain / pulse) - bite recover is too short for drones to
      // be readable. The `_droneWaveSpawnedAt` timestamp matches the recover
      // start so we never double-spawn for the same recover window.
      if (
        this.boss.phase >= 2 &&
        this.boss._droneWaveSpawnedAt !== this.boss.biteStateStart &&
        (this.boss.attackKind === 'rain' || this.boss.attackKind === 'pulse')
      ) {
        this.boss._droneWaveSpawnedAt = this.boss.biteStateStart;
        this.spawnDroneWave(time);
      }

      const recoverWindow = this.boss.attackKind === 'rain'
        ? RAIN_RECOVER_MS
        : (this.boss.attackKind === 'pulse'
          ? RING_PULSE_RECOVER_MS
          : BOSS_BITE_RECOVER);
      if (elapsed >= recoverWindow) {
        this.boss.biteState = 'idle';
        this.boss.biteStateStart = time;
        this.boss.lastBiteAt = time;
        this.boss.attackKind = null;
      }
    }
  }

  chooseNextAttack(time, distToPlayer) {
    if (this.boss.phase < 2) {
      // Phase 1: bite-only, range-gated.
      if (distToPlayer < BOSS_BITE_RANGE) this.startBossBite(time);
      return;
    }
    if (this.boss.phase < 3) {
      // Phase 2: bite or pixel rain. Bite falls back to rain if out of range.
      const wantsBite = Math.random() < P2_BITE_PROBABILITY;
      if (wantsBite && distToPlayer < BOSS_BITE_RANGE) {
        this.startBossBite(time);
      } else {
        this.startPixelRain(time);
      }
      return;
    }
    // Phase 3: weighted bite / rain / ring pulse. Bite still falls back to
    // a ranged attack if the player is kiting.
    const roll = Math.random();
    if (roll < P3_BITE_PROBABILITY && distToPlayer < BOSS_BITE_RANGE) {
      this.startBossBite(time);
    } else if (roll < P3_BITE_PROBABILITY + P3_RAIN_PROBABILITY) {
      this.startPixelRain(time);
    } else {
      this.startRingPulse(time);
    }
  }

  startBossBite(time) {
    this.boss.biteState = 'telegraph';
    this.boss.biteStateStart = time;
    this.boss.attackKind = 'bite';
    // Lock the bite direction toward the player at the moment the telegraph
    // begins; the player can sidestep during the 700 ms wind-up.
    const dx = this.player.x - this.bossBody.x;
    const dy = this.player.y - this.bossBody.y;
    const len = Math.hypot(dx, dy) || 1;
    this.boss.biteDirX = dx / len;
    this.boss.biteDirY = dy / len;
    this.boss.biteHitDealt = false;
  }

  /* ----- Phase 2 attack: Pixel Rain ----- */

  startPixelRain(time) {
    this.boss.biteState = 'casting';
    this.boss.biteStateStart = time;
    this.boss.attackKind = 'rain';
    this.boss.rainPixelsLeft = RAIN_PIXEL_COUNT;
    // Stagger spawn timing so pixels rain over RAIN_TOTAL_MS rather than
    // dropping all at once.
    this.boss.rainNextSpawnAt = time + 200;
    this.boss.rainSpawnInterval = (RAIN_TOTAL_MS - 200) / RAIN_PIXEL_COUNT;
    this.flashText('PIXEL RAIN', 900);
  }

  updatePixelRain(time) {
    if (!this.boss) return;
    if (this.boss.biteState !== 'casting' || this.boss.attackKind !== 'rain') return;

    if (this.boss.rainPixelsLeft > 0 && time >= this.boss.rainNextSpawnAt) {
      this.spawnRainPixel();
      this.boss.rainPixelsLeft--;
      // ±60 ms jitter per spawn so the rain feels chaotic rather than metronomic.
      this.boss.rainNextSpawnAt = time
        + this.boss.rainSpawnInterval
        + Phaser.Math.Between(-60, 60);
    }

    // Cast ends after every pixel has both spawned and impacted.
    const castElapsed = time - this.boss.biteStateStart;
    if (
      this.boss.rainPixelsLeft === 0 &&
      castElapsed > RAIN_TOTAL_MS + RAIN_PIXEL_FALL_MS
    ) {
      this.boss.biteState = 'recover';
      this.boss.biteStateStart = time;
    }
  }

  spawnRainPixel() {
    // Pick a landing spot biased toward the player's current quadrant so the
    // rain feels targeted, but with enough spread that the player can find
    // a safe cell to dodge into.
    const playerBiasX = Phaser.Math.Clamp(
      this.player.x + Phaser.Math.Between(-220, 220),
      80, ARENA_W - 80,
    );
    const playerBiasY = Phaser.Math.Clamp(
      this.player.y + Phaser.Math.Between(-180, 180),
      120, ARENA_H - 120,
    );
    const tx = Phaser.Math.Between(0, 1) === 0
      ? playerBiasX
      : Phaser.Math.Between(80, ARENA_W - 80);
    const ty = Phaser.Math.Between(0, 1) === 0
      ? playerBiasY
      : Phaser.Math.Between(120, ARENA_H - 120);

    // Warning circle on the ground - pulses red so the player can see it.
    const warning = this.add.graphics();
    warning.fillStyle(0xff2040, 0.40);
    warning.fillCircle(0, 0, RAIN_PIXEL_RADIUS);
    warning.lineStyle(2, 0xff7777, 0.95);
    warning.strokeCircle(0, 0, RAIN_PIXEL_RADIUS);
    warning.setPosition(tx, ty);
    warning.setDepth(ty - 2);
    this.tweens.add({
      targets: warning,
      scaleX: 1.12, scaleY: 1.12,
      duration: 220,
      yoyo: true, repeat: -1,
    });

    // The falling pixel - a small magenta square that descends from above.
    const startY = ty - 320;
    const pixel = this.add.graphics();
    pixel.fillStyle(0xff2040, 0.95);
    pixel.fillRect(-9, -9, 18, 18);
    pixel.lineStyle(2, 0xffffff, 0.85);
    pixel.strokeRect(-9, -9, 18, 18);
    pixel.setPosition(tx, startY);
    pixel.setDepth(ty + 200);
    this.tweens.add({
      targets: pixel,
      y: ty,
      duration: RAIN_PIXEL_FALL_MS,
      ease: 'Cubic.easeIn',
    });
    this.tweens.add({
      targets: pixel,
      angle: 540,
      duration: RAIN_PIXEL_FALL_MS,
      ease: 'Linear',
    });

    // Impact resolves outside the tween so we can sample player position
    // at the exact moment of detonation (not at spawn time).
    this.time.delayedCall(RAIN_PIXEL_FALL_MS, () => {
      pixel.destroy();
      warning.destroy();
      this.applyRainImpact(tx, ty);
    });
  }

  applyRainImpact(tx, ty) {
    // Visual: bright white flash + expanding ring.
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xffe066, 1.0);
    ring.strokeCircle(0, 0, RAIN_PIXEL_RADIUS * 0.6);
    ring.fillStyle(0xffffff, 0.55);
    ring.fillCircle(0, 0, RAIN_PIXEL_RADIUS * 0.4);
    ring.setPosition(tx, ty);
    ring.setDepth(ty + 1);
    this.tweens.add({
      targets: ring,
      scale: 2.2, alpha: 0,
      duration: 360, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    Sfx.play('hit');

    // Damage check (player only - rain is a player-targeted attack).
    if (this.gameOver || this.victory) return;
    const time = this.time.now;
    if (time < this.invincibleUntil) return;
    const dx = this.player.x - tx;
    const dy = this.player.y - ty;
    if (Math.hypot(dx, dy) > RAIN_PIXEL_RADIUS) return;

    this.hearts = Math.max(0, this.hearts - RAIN_PIXEL_DAMAGE);
    this.invincibleUntil = time + INVINCIBLE_MS;
    this.cameras.main.shake(160, 0.012);
    this.refreshHearts();
    if (this.hydraActive) this.endHydra();
    if (this.hearts <= 0) this.handleGameOver();
  }

  /* ----- Ring Pulse (Phase 3 attack) ----- */

  startRingPulse(time) {
    // Boss roots, casts a sequence of expanding shockwaves from itself. The
    // first pulse fires after RING_PULSE_TELEGRAPH so the player has a beat
    // to recognize the attack before the rings start moving.
    this.boss.biteState = 'casting';
    this.boss.biteStateStart = time;
    this.boss.attackKind = 'pulse';
    this.boss.ringPulsesLeft = RING_PULSE_COUNT;
    this.boss.ringNextPulseAt = time + RING_PULSE_TELEGRAPH;
    if (this.bossBody?.body) this.bossBody.body.setVelocity(0, 0);
    Sfx.play('hit');
  }

  updateRingPulse(time) {
    if (!this.boss) return;
    if (this.boss.attackKind !== 'pulse') {
      // Active pulses might still be expanding even if the boss has moved on
      // (e.g. mid-cinematic phase shift cancelled the cast). Let them finish.
      this.boss.pulses = (this.boss.pulses || []).filter(
        (p) => time - p.startAt < RING_PULSE_DURATION,
      );
      return;
    }

    // Spawn the next pulse when its scheduled launch time arrives.
    if (this.boss.ringPulsesLeft > 0 && time >= this.boss.ringNextPulseAt) {
      this.boss.pulses.push({
        ox: this.bossBody.x,
        oy: this.bossBody.y,
        startAt: time,
        hit: false,
      });
      this.boss.ringPulsesLeft -= 1;
      this.boss.ringNextPulseAt = time + RING_PULSE_DELAY;
    }

    // Damage check: each pulse can only damage the player once, when the
    // wavefront radius first overlaps the player's position.
    if (!this.gameOver && !this.victory && time >= this.invincibleUntil) {
      const px = this.player.x;
      const py = this.player.y;
      this.boss.pulses.forEach((p) => {
        if (p.hit) return;
        const elapsed = time - p.startAt;
        if (elapsed < 0 || elapsed > RING_PULSE_DURATION) return;
        const r = (elapsed / RING_PULSE_DURATION) * RING_PULSE_MAX_R;
        const d = Math.hypot(px - p.ox, py - p.oy);
        if (Math.abs(d - r) <= RING_PULSE_BAND) {
          p.hit = true;
          this.applyRingPulseHit(time);
        }
      });
    }

    // Cleanup expired pulses.
    this.boss.pulses = this.boss.pulses.filter(
      (p) => time - p.startAt < RING_PULSE_DURATION,
    );

    // End-of-cast: all pulses fired and last one's expansion is finished.
    if (
      this.boss.ringPulsesLeft <= 0 &&
      this.boss.pulses.length === 0 &&
      time >= this.boss.ringNextPulseAt
    ) {
      this.boss.biteState = 'recover';
      this.boss.biteStateStart = time;
    }
  }

  drawRingPulses(time) {
    const g = this.bossPulseGfx;
    g.clear();
    if (!this.boss) return;
    this.boss.pulses.forEach((p) => {
      const elapsed = time - p.startAt;
      if (elapsed < 0 || elapsed > RING_PULSE_DURATION) return;
      const t = elapsed / RING_PULSE_DURATION;
      const r = t * RING_PULSE_MAX_R;
      const alpha = Math.max(0, 1 - t * 0.85);
      // Outer warning band (thicker, low alpha) and inner hit-line (thin, sharp).
      g.lineStyle(RING_PULSE_BAND * 2, 0xff3a3a, alpha * 0.22);
      g.strokeCircle(p.ox, p.oy, r);
      g.lineStyle(3, 0xff7878, alpha * 0.85);
      g.strokeCircle(p.ox, p.oy, r);
    });
  }

  applyRingPulseHit(time) {
    if (this.gameOver || this.victory) return;
    if (time < this.invincibleUntil) return;
    this.hearts = Math.max(0, this.hearts - RING_PULSE_DAMAGE);
    this.invincibleUntil = time + INVINCIBLE_MS;
    this.cameras.main.shake(180, 0.015);
    this.refreshHearts();
    if (this.hydraActive) this.endHydra();
    Sfx.play('hit');
    if (this.hearts <= 0) this.handleGameOver();
  }

  /* ----- Drones (Phase 2/3 add-ons; v0.6.1c) ----- */

  spawnDroneWave(time) {
    // Drones orbit the boss for DRONE_ORBIT_MS, then each individually dashes
    // toward the player's last-known position. They die on any hit, so the
    // wave's job is to add post-cast pressure: while the player is recovering
    // from a bombing-run dodge or a ring-pulse weave, drones force a second
    // priority list.
    const aliveCount = this.drones.length;
    const room = Math.max(0, DRONE_MAX_ALIVE - aliveCount);
    const toSpawn = Math.min(DRONE_SPAWN_COUNT, room);
    for (let i = 0; i < toSpawn; i++) {
      this.spawnDrone(time, i, toSpawn);
    }
  }

  spawnDrone(time, index, totalInBatch) {
    // Distribute drones evenly around the boss so they read as a coordinated
    // wave even at low spawn counts.
    const baseAngle = (index / Math.max(1, totalInBatch)) * Math.PI * 2;
    const jitter = Phaser.Math.FloatBetween(-0.25, 0.25);
    const angle = baseAngle + jitter + Math.random() * 0.4;
    const dashDelay = DRONE_ORBIT_MS + Phaser.Math.Between(-200, 200);
    const drone = {
      x: this.bossBody.x + Math.cos(angle) * DRONE_ORBIT_RADIUS,
      y: this.bossBody.y + Math.sin(angle) * DRONE_ORBIT_RADIUS,
      vx: 0, vy: 0,
      angle,
      state: 'orbit',     // 'orbit' | 'dash' | 'dead'
      spawnedAt: time,
      stateStart: time,
      dashDelay,
      dashAngle: 0,
      g: this.add.graphics().setDepth(0),
      flickerPhase: Math.random() * Math.PI * 2,
    };
    this.drones.push(drone);
  }

  updateDrones(time, dt) {
    if (this.drones.length === 0) return;

    const px = this.player.x;
    const py = this.player.y;

    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];

      // Auto-fade after lifetime (so a fight that runs long doesn't drown
      // the arena in stale drones if the player ignores them).
      if (time - d.spawnedAt > DRONE_LIFETIME_MS) {
        this.killDrone(d, false);
        this.drones.splice(i, 1);
        continue;
      }

      if (d.state === 'orbit') {
        // Orbit the boss; transition to dash after dashDelay.
        d.angle += DRONE_ORBIT_SPEED * (dt / 1000);
        d.x = this.bossBody.x + Math.cos(d.angle) * DRONE_ORBIT_RADIUS;
        d.y = this.bossBody.y + Math.sin(d.angle) * DRONE_ORBIT_RADIUS;
        if (time - d.stateStart >= d.dashDelay) {
          d.state = 'dash';
          d.stateStart = time;
          // Lock dash vector at the moment of commit. Player can sidestep.
          const ddx = px - d.x;
          const ddy = py - d.y;
          const len = Math.hypot(ddx, ddy) || 1;
          d.dashAngle = Math.atan2(ddy, ddx);
          d.vx = (ddx / len) * DRONE_DASH_SPEED;
          d.vy = (ddy / len) * DRONE_DASH_SPEED;
        }
      } else if (d.state === 'dash') {
        d.x += d.vx * (dt / 1000);
        d.y += d.vy * (dt / 1000);
        // After dash duration, the drone fades out (won't get to "self-destruct
        // on player" if it missed - intentional: dodging a drone should feel
        // like a clean win).
        if (time - d.stateStart >= DRONE_DASH_MS) {
          this.killDrone(d, false);
          this.drones.splice(i, 1);
          continue;
        }
        // Player contact check (only while dashing - orbit is a "warning"
        // phase visually, not a damage phase).
        const cdx = px - d.x;
        const cdy = py - d.y;
        if (Math.hypot(cdx, cdy) <= DRONE_SIZE * 0.55 + 14) {
          this.applyDroneContactDamage(time);
          this.killDrone(d, false);
          this.drones.splice(i, 1);
          continue;
        }
      }

      // Always redraw - cheap per-frame cost, keeps orbit visuals tight.
      this.drawDrone(d, time);
    }
  }

  drawDrone(d, time) {
    const g = d.g;
    g.clear();
    g.setPosition(d.x, d.y);
    g.setDepth(d.y);

    // Glitchy cube. The flicker phase + a per-drone offset gives the wave a
    // nervous "still-loading" feel that fits the Los Hackers theme.
    const flick = 0.65 + Math.sin(time / 60 + d.flickerPhase) * 0.35;
    const half = DRONE_SIZE / 2;

    // Base black silhouette (so the chromatic-shift ghosts read as RGB seams)
    g.fillStyle(0x080812, 1);
    g.fillRect(-half - 1, -half - 1, DRONE_SIZE + 2, DRONE_SIZE + 2);

    // Chromatic offset cubes.
    g.fillStyle(0xff3a55, 0.55);
    g.fillRect(-half - 2, -half, DRONE_SIZE, DRONE_SIZE);
    g.fillStyle(0x33ffe0, 0.55);
    g.fillRect(-half + 2, -half, DRONE_SIZE, DRONE_SIZE);

    // Center "core" - tinted by flicker so the drone visibly twitches.
    const coreColor = d.state === 'dash' ? 0xff5050 : 0xb070ff;
    g.fillStyle(coreColor, 0.85 * flick);
    g.fillRect(-half, -half, DRONE_SIZE, DRONE_SIZE);

    // Inner hatchwork
    g.lineStyle(1, 0xffffff, 0.75 * flick);
    g.strokeRect(-half + 3, -half + 3, DRONE_SIZE - 6, DRONE_SIZE - 6);

    // Direction tick during dash so the lunge reads.
    if (d.state === 'dash') {
      const tickLen = DRONE_SIZE * 0.55;
      g.lineStyle(2, 0xffffff, 0.85);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(d.dashAngle) * tickLen, Math.sin(d.dashAngle) * tickLen);
      g.strokePath();
    }
  }

  killDrone(d, _hitByPlayer) {
    if (!d || d.state === 'dead') return;
    d.state = 'dead';
    // Quick pop + fade.
    const ghost = this.add.graphics().setPosition(d.x, d.y).setDepth(d.y + 1);
    ghost.fillStyle(0xffffff, 0.85);
    ghost.fillRect(-DRONE_SIZE / 2, -DRONE_SIZE / 2, DRONE_SIZE, DRONE_SIZE);
    this.tweens.add({
      targets: ghost,
      alpha: 0, scaleX: 1.6, scaleY: 1.6,
      duration: 220, ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
    if (d.g) d.g.destroy();
  }

  applyDroneContactDamage(time) {
    if (this.gameOver || this.victory) return;
    if (time < this.invincibleUntil) return;
    this.hearts = Math.max(0, this.hearts - DRONE_CONTACT_DAMAGE);
    this.invincibleUntil = time + INVINCIBLE_MS;
    this.cameras.main.shake(140, 0.011);
    this.refreshHearts();
    if (this.hydraActive) this.endHydra();
    Sfx.play('hit');
    if (this.hearts <= 0) this.handleGameOver();
  }

  damageDronesAt(x, y, radius) {
    // AOE drone clear (used by Pasta Bomb detonation). Returns the count
    // killed so callers can pump bonus FX or scoring later.
    if (this.drones.length === 0) return 0;
    let killed = 0;
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      if (Math.hypot(d.x - x, d.y - y) <= radius + DRONE_SIZE * 0.5) {
        this.killDrone(d, true);
        this.drones.splice(i, 1);
        killed++;
      }
    }
    return killed;
  }

  drawBiteCone(time) {
    const g = this.bossBiteCone;
    g.clear();
    if (!this.boss) return;
    const state = this.boss.biteState;
    if (state !== 'telegraph' && state !== 'lunge') return;

    const cx = this.bossBody.x;
    const cy = this.bossBody.y;
    const ang = Math.atan2(this.boss.biteDirY, this.boss.biteDirX);
    const reach = BOSS_BITE_REACH;
    const half = BOSS_BITE_HALF_ANGLE;

    // Build the cone as a filled wedge (fan of triangles).
    const segments = 14;
    const verts = [{ x: cx, y: cy }];
    for (let i = 0; i <= segments; i++) {
      const a = ang - half + (i / segments) * (half * 2);
      verts.push({ x: cx + Math.cos(a) * reach, y: cy + Math.sin(a) * reach });
    }

    // Telegraph: pulsing translucent red that builds intensity as the lunge
    // approaches. Lunge: solid bright red snap.
    let alpha;
    if (state === 'telegraph') {
      const t = Phaser.Math.Clamp(
        (time - this.boss.biteStateStart) / BOSS_BITE_TELEGRAPH,
        0,
        1,
      );
      alpha = 0.28 + Math.sin(time / 70) * 0.10 + t * 0.22;
    } else {
      alpha = 0.78;
    }

    g.fillStyle(0xff2040, alpha);
    g.beginPath();
    g.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) g.lineTo(verts[i].x, verts[i].y);
    g.closePath();
    g.fillPath();

    // Bright outline so the cone reads cleanly even on the green forest floor.
    g.lineStyle(state === 'lunge' ? 4 : 2, 0xff5555, 0.95);
    g.beginPath();
    g.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) g.lineTo(verts[i].x, verts[i].y);
    g.closePath();
    g.strokePath();

    // Float the cone just under the boss sprite so it looks like a ground decal.
    g.setDepth(cy - 1);
  }

  checkBiteDamage(time) {
    if (!this.boss || this.boss.biteState !== 'lunge') return;
    if (this.boss.biteHitDealt) return; // one hit per lunge
    if (this.gameOver || this.victory) return;
    if (time < this.invincibleUntil) return;

    const cx = this.bossBody.x;
    const cy = this.bossBody.y;
    const dx = this.player.x - cx;
    const dy = this.player.y - cy;
    const dist = Math.hypot(dx, dy);
    // Reach is generous (+24 px) so the lunge feels punishing if you're
    // even close to the cone's edge.
    if (dist > BOSS_BITE_REACH + 24) return;

    const playerAng = Math.atan2(dy, dx);
    const biteAng = Math.atan2(this.boss.biteDirY, this.boss.biteDirX);
    let diff = Math.abs(playerAng - biteAng);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff > BOSS_BITE_HALF_ANGLE) return;

    this.boss.biteHitDealt = true;
    this.applyBossBiteDamage(time);
  }

  applyBossBiteDamage(time) {
    if (this.gameOver || this.victory) return;
    if (this.introActive) return;
    if (time < this.invincibleUntil) return;
    this.hearts = Math.max(0, this.hearts - BOSS_BITE_DAMAGE);
    this.invincibleUntil = time + INVINCIBLE_MS;
    Sfx.play('hit');
    this.cameras.main.shake(280, 0.018);
    // Yeet the player away from the boss along the bite direction.
    const knock = 360;
    this.player.body.setVelocity(
      this.boss.biteDirX * knock,
      this.boss.biteDirY * knock,
    );
    this.knockbackUntil = time + 280;
    this.refreshHearts();
    this.flashText('BIT!', 700);
    if (this.hydraActive) this.endHydra();
    if (this.hearts <= 0) this.handleGameOver();
  }

  updatePlayerInvincibilityVisual(time) {
    const inv = this.invincibleUntil > time;
    if (inv) this.playerVisual.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.4 : 1);
    else this.playerVisual.setAlpha(1);
  }

  updateDepthSort() {
    const gx = this.player.x;
    const gy = this.player.y;
    this.playerVisual.x = gx;
    this.playerVisual.y = gy;
    this.playerVisual.setDepth(gy);
    this.playerShadow.setPosition(gx, gy + 16);
  }

  /* ----- end conditions ----- */

  handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.hydraActive) this.endHydra();
    Sfx.play('hit');
    this.cameras.main.shake(420, 0.014);
    this.flashText('LOS HACKERS WINS - retrying', 1400);
    this.time.delayedCall(1400, () => {
      this.cameras.main.fade(500, 30, 5, 10);
      if (this.skyCamera) this.skyCamera.fade(500, 30, 5, 10);
      if (this.uiCamera) this.uiCamera.fade(500, 30, 5, 10);
    });
    this.time.delayedCall(1900, () => {
      this.scene.restart({ allDeposited: this.allDeposited });
    });
  }

  handleVictory() {
    if (this.victory) return;
    this.victory = true;
    this.gameOver = true;
    if (this.hydraActive) this.endHydra();
    Sfx.play('win');
    this.cameras.main.shake(800, 0.020);

    // Persist the boss kill so the title screen treats the player as
    // "credits-rolled" on subsequent visits and the WinScene knows to
    // surface the post-boss reset prompt. Written here (before fade)
    // so it lands even if the player closes the tab during the
    // celebration tween.
    SaveState.recordBossDefeat();

    // Disintegrate-and-collapse the boss over 1.4s
    if (this.bossSprite) {
      this.tweens.add({
        targets: this.bossSprite,
        alpha: 0, scaleX: 0.4, scaleY: 0.4,
        duration: 1400, ease: 'Quad.easeIn',
      });
    }
    this.flashText('LOS HACKERS DEFEATED', 1600);

    // v0.6.3 narrative outro: brainrots emerge from hiding, two storybook
    // cards land with TTS, then we route to WinScene. The actual sequence
    // starts after a beat so 'LOS HACKERS DEFEATED' has a moment to read.
    this.time.delayedCall(1700, () => this.startOutroCelebration());
  }

  /* ----- v0.6.3 narrative outro ----- */
  startOutroCelebration() {
    if (!this.scene.isActive()) return;
    const cx = this.player ? this.player.x : ARENA_W / 2;
    const cy = this.player ? this.player.y : ARENA_H / 2;

    // Pull every collectible brainrot id across all 4 levels (deduped -
    // Frigo Camelo appears on both L2 and L4). Position them in a circle
    // around the hero so the celebration reads as "they all came back to
    // you" rather than "a bunch of sprites appeared somewhere distant".
    const allCollectibleIds = Object.values(LEVELS).flatMap((lv) => lv.brainrotIds);
    const uniqueIds = [...new Set(allCollectibleIds)];

    // The gameplay camera is at GAME_ZOOM (1.6) so visible world ≈ 500x360.
    // Radius 180 keeps brainrots inside the visible viewport even at the
    // arena edges, with enough spacing for 19 brainrots around the circle.
    const ringRadius = 180;
    uniqueIds.forEach((id, i) => {
      const data = BRAINROT_REGISTRY[id];
      if (!data) return;
      const angle = (i / uniqueIds.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius * 0.85;
      const v = makeBrainrotVisual(this, x, y, data, 50);
      v.setAlpha(0).setScale(0.3);
      v.setDepth(y);

      this.tweens.add({
        targets: v,
        alpha: 1,
        scaleX: v.baseScaleX ?? 1,
        scaleY: v.baseScaleY ?? 1,
        duration: 480,
        delay: 200 + i * 70,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (!v.scene) return;
          this.tweens.add({
            targets: v, y: y - 8,
            duration: 540 + i * 30,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          // Tiny scatter sparkle on emergence
          const spark = this.add.graphics().setDepth(y + 0.1);
          spark.fillStyle(0xffe066, 1);
          spark.fillCircle(x, y - 16, 3);
          this.tweens.add({
            targets: spark, alpha: 0, duration: 500,
            onComplete: () => spark.destroy(),
          });
        },
      });
    });

    // Confetti (per-piece graphics, falling + rotating + fading). 30 pieces
    // strikes a balance between "celebratory" and "not a perf hit on the
    // older devices we test on".
    const confettiColors = [0xffe066, 0xff6b9d, 0x9c6bff, 0x66f0ff, 0x4a8c2e, 0xff8a3a];
    for (let i = 0; i < 30; i++) {
      const x = cx + Phaser.Math.Between(-260, 260);
      const y = cy + Phaser.Math.Between(-220, -80);
      const c = Phaser.Utils.Array.GetRandom(confettiColors);
      const conf = this.add.graphics().setDepth(9000);
      conf.fillStyle(c, 1);
      conf.fillRect(x - 3, y - 3, 6, 6);
      this.tweens.add({
        targets: conf,
        y: y + 320,
        alpha: 0,
        angle: Phaser.Math.Between(180, 720),
        duration: 2400,
        delay: 400 + i * 50,
        ease: 'Quad.easeIn',
        onComplete: () => conf.destroy(),
      });
    }

    // Storybook cards (Zelda-style typewriter), mirroring the IntroScene
    // pacing so opening and ending feel symmetric. No TTS - the user
    // reads at their own pace.
    this.time.delayedCall(1500, () => {
      if (!this.scene.isActive()) return;
      this.showZeldaCard('The brainrots are safe.');
    });
    this.time.delayedCall(4400, () => {
      if (!this.scene.isActive()) return;
      this.showZeldaCard('Long live the brainrots.');
    });

    // Final fade and route to WinScene. ~7.5s of celebration before fade
    // begins: 0.5s emergence ramp + 2 cards (~5.6s) + 1.4s breather.
    const fadeMs = 700;
    this.time.delayedCall(7500, () => {
      if (!this.scene.isActive()) return;
      this.cameras.main.fade(fadeMs, 30, 18, 50);
      if (this.skyCamera) this.skyCamera.fade(fadeMs, 30, 18, 50);
      if (this.uiCamera) this.uiCamera.fade(fadeMs, 30, 18, 50);
    });
    this.time.delayedCall(7500 + fadeMs + 50, () => {
      if (!this.scene.isActive()) return;
      this.scene.start('Win', {
        allDeposited: this.allDeposited,
        bossDefeated: true,
      });
    });
  }

  // Zelda-style narrative card for the boss outro - same shape as
  // IntroScene.showZeldaCard but anchored to the UI camera (BossScene
  // runs three cameras at different zooms, and the existing flashText
  // already handles this routing pattern).
  showZeldaCard(text) {
    const W = GAME_W;
    const H = GAME_H;

    const CHAR_DELAY_MS = 60;
    const LINGER_MS     = 1100;
    const FADE_MS       = 380;

    const dim = this.add.graphics().setScrollFactor(0).setDepth(9999);
    dim.fillStyle(0x000000, 0.55);
    dim.fillRect(0, 0, W, H);
    dim.setAlpha(0);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(dim);
    if (this.skyCamera) this.skyCamera.ignore(dim);
    this.tweens.add({ targets: dim, alpha: 1, duration: 280, ease: 'Quad.easeOut' });

    const boxW = Math.min(560, W * 0.86);
    const boxH = 80;
    const boxCx = W / 2;
    const boxCy = H * 0.13;
    const box = this.add.graphics().setScrollFactor(0).setDepth(10000);
    box.fillStyle(0x0a0610, 0.94);
    box.fillRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    box.lineStyle(3, 0xfde58c, 0.95);
    box.strokeRoundedRect(boxCx - boxW / 2, boxCy - boxH / 2, boxW, boxH, 8);
    box.lineStyle(1, 0xffe066, 0.55);
    box.strokeRoundedRect(boxCx - boxW / 2 + 5, boxCy - boxH / 2 + 5, boxW - 10, boxH - 10, 6);
    box.setAlpha(0);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(box);
    if (this.skyCamera) this.skyCamera.ignore(box);
    this.tweens.add({ targets: box, alpha: 1, duration: 280, ease: 'Quad.easeOut' });

    const card = this.add.text(boxCx, boxCy, '', {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#fde58c',
      stroke: '#1a0a08',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: boxW - 36 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001).setAlpha(0);
    card.setShadow(2, 2, '#3a2410', 3, true, true);
    if (this.cameras && this.cameras.main) this.cameras.main.ignore(card);
    if (this.skyCamera) this.skyCamera.ignore(card);
    this.tweens.add({ targets: card, alpha: 1, duration: 280 });

    let i = 0;
    const typer = this.time.addEvent({
      delay: CHAR_DELAY_MS,
      repeat: text.length - 1,
      callback: () => {
        i++;
        if (card?.scene) card.setText(text.slice(0, i));
      },
    });

    const lingerEnd = text.length * CHAR_DELAY_MS + LINGER_MS;
    this.tweens.add({
      targets: [dim, box, card],
      alpha: 0,
      delay: lingerEnd,
      duration: FADE_MS,
      onComplete: () => {
        dim.destroy();
        box.destroy();
        card.destroy();
        if (typer) typer.remove(false);
      },
    });
  }

  /* ----- text banner (same shape as GameScene.flashText) ----- */
  flashText(message, durationMs = 1500) {
    const padX = 18;
    const padY = 12;
    const text = this.add.text(GAME_W / 2, 86, message, {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '12px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 3,
      align: 'center', lineSpacing: 4,
      wordWrap: { width: GAME_W - 80, useAdvancedWrap: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002);
    const tw = text.width + padX * 2;
    const th = text.height + padY * 2;
    const box = this.add.graphics().setScrollFactor(0).setDepth(10001);
    box.fillStyle(0x0a0610, 0.92);
    box.fillRoundedRect(GAME_W / 2 - tw / 2, 86 - th / 2, tw, th, 8);
    box.lineStyle(2, 0xfde58c, 0.9);
    box.strokeRoundedRect(GAME_W / 2 - tw / 2, 86 - th / 2, tw, th, 8);
    box.lineStyle(1, 0xffe066, 0.45);
    box.strokeRoundedRect(GAME_W / 2 - tw / 2 + 4, 86 - th / 2 + 4, tw - 8, th - 8, 6);

    if (this.cameras && this.cameras.main) {
      this.cameras.main.ignore(text);
      this.cameras.main.ignore(box);
    }
    if (this.skyCamera) {
      this.skyCamera.ignore(text);
      this.skyCamera.ignore(box);
    }
    this.tweens.add({
      targets: [text, box], alpha: 0, duration: 400, delay: durationMs,
      onComplete: () => { text.destroy(); box.destroy(); },
    });
  }

  /* ----- main loop ----- */

  update(time, delta) {
    if (this.gameOver) {
      // Keep the boss visual updating (hit flash decay etc.) so the death
      // freeze isn't jarring.
      this.updateBoss(time);
      this.updateDepthSort();
      this.updateBossHud();
      this.drawBiteCone(time);
      this.drawRingPulses(time);
      return;
    }
    this.handleMovement(time);
    this.updateProjectiles(time);
    this.updatePlayerInvincibilityVisual(time);
    this.updateBossAI(time);
    this.checkBiteDamage(time);
    this.updatePixelRain(time);
    this.updateRingPulse(time);
    this.updateDrones(time, delta);
    this.updateHydra(time);
    this.updateBoss(time);
    this.drawBiteCone(time);
    this.drawRingPulses(time);
    this.updateAbilityBar(time);
    this.updateBossHud();
    this.updateDepthSort();
  }
}

/* ============================================================================
   WinScene
   ============================================================================ */

class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }
  create(data) {
    const W = this.scale.width;
    const H = this.scale.height;
    const bossDefeated = data?.bossDefeated === true;

    // True ending: forest dance party with a controllable hero. The legacy
    // roster preview below is only reachable via dev shortcuts now (the
    // production flow always lands here with bossDefeated:true).
    if (bossDefeated) {
      this._createTrueEnding(W, H, data);
      return;
    }

    this.cameras.main.setBackgroundColor('#1a0f1f');

    const g = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      // True-ending tints the gradient warmer (gold-to-purple) to celebrate;
      // standard ending keeps the original cool purple-blue gradient.
      const r = Math.floor((bossDefeated ? 70 : 40) + t * 60);
      const gr = Math.floor((bossDefeated ? 40 : 20) + t * 30);
      const b = Math.floor((bossDefeated ? 50 : 60) + t * (bossDefeated ? 40 : 80));
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, y, W, 4);
    }

    this.add.text(W / 2, H * 0.08, bossDefeated ? 'TRUE ENDING' : 'YOU WIN!', {
      fontFamily: 'Impact, Charcoal, sans-serif',
      fontSize: '64px', color: bossDefeated ? '#ffd54a' : '#ffe066',
      stroke: '#1a0f1f', strokeThickness: 9,
    }).setOrigin(0.5);

    const collectedIds = new Set(data?.allDeposited ?? []);
    const totalRoster = Object.values(LEVELS).reduce((acc, lv) => acc + lv.brainrotIds.length, 0);
    const rosterCollected = Object.values(LEVELS)
      .reduce((acc, lv) => acc + lv.brainrotIds.filter((id) => collectedIds.has(id)).length, 0);

    this.add.text(W / 2, H * 0.16, `${rosterCollected} / ${totalRoster} brainrots saved across all levels`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);

    /* ----- Per-level brainrot rosters (5 per row, 4 rows) ----- */
    const rowGap = 70;
    const startY = H * 0.24;
    const sprSize = 38;
    const colSpacing = 78;
    Object.values(LEVELS).forEach((level, levelIdx) => {
      const rowY = startY + levelIdx * rowGap;
      this.add.text(W / 2, rowY - 26, `Level ${level.id} - ${level.name}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px', color: '#cbb3ff',
        stroke: '#1a0f1f', strokeThickness: 3,
      }).setOrigin(0.5);

      level.brainrotIds.forEach((id, i) => {
        const b = BRAINROT_REGISTRY[id];
        const x = W / 2 + (i - 2) * colSpacing;
        const y = rowY;
        const collected = collectedIds.has(id);
        const s = makeBrainrotVisual(this, x, y, b, sprSize);
        if (!collected) s.setAlpha(0.25);
        this.add.text(x, y + sprSize * 0.55, b.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '8px', color: collected ? '#ffe066' : '#888888',
          align: 'center', wordWrap: { width: 72 },
        }).setOrigin(0.5);
        this.tweens.add({
          targets: s, y: y - 4,
          duration: 700 + i * 100 + levelIdx * 120,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      });
    });

    /* ----- ULTIMATE SQUAD row + final-battle tease ----- */
    // Each level has an ultimateId, and we also drop in the boss as a
    // mysterious 5th slot. Ultimates show lit if they were unlocked
    // (i.e. that level was beaten); the boss is always silhouetted.
    const ultY = H * 0.74;
    this.add.text(W / 2, ultY - 36, 'ULTIMATE SQUAD', {
      fontFamily: 'Impact, Charcoal, sans-serif',
      fontSize: '20px', color: '#ffd28a',
      stroke: '#1a0f1f', strokeThickness: 4,
    }).setOrigin(0.5);

    const ultimateIds = Object.values(LEVELS).map((lv) => lv.ultimateId);
    const ultRowItems = [...ultimateIds, FINAL_BOSS_ID];
    const ultSprSize = 56;
    const ultColSpacing = 96;
    ultRowItems.forEach((id, i) => {
      const b = BRAINROT_REGISTRY[id];
      if (!b) return;
      const x = W / 2 + (i - 2) * ultColSpacing;
      const y = ultY;
      const isBoss = b.boss === true;
      // After defeating Los Hackers the boss slot lights up like a regular
      // unlocked ultimate (gold ring, full sprite, "DEFEATED" stamp under it).
      const bossLit = isBoss && bossDefeated;
      const unlocked = bossLit || (!isBoss && collectedIds.has(id));

      // Glow ring underneath the sprite. Gold for unlocked ultimates / a
      // defeated boss, dim grey for locked, sinister red pulse for the
      // un-fought boss tease.
      const ring = this.add.graphics();
      const ringR = ultSprSize * 0.62;
      const ringColor = isBoss && !bossLit ? 0xff3a3a : unlocked ? 0xffd54a : 0x4a4452;
      const ringAlpha = isBoss && !bossLit ? 0.55 : unlocked ? 0.7 : 0.22;
      ring.lineStyle(3, ringColor, ringAlpha);
      ring.strokeCircle(0, 0, ringR);
      ring.fillStyle(ringColor, isBoss && !bossLit ? 0.15 : unlocked ? 0.10 : 0.05);
      ring.fillCircle(0, 0, ringR);
      ring.setPosition(x, y);
      this.tweens.add({
        targets: ring, scale: 1.08, alpha: ringAlpha * 0.6,
        duration: isBoss && !bossLit ? 850 : 1100, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: i * 90,
      });

      const s = makeBrainrotVisual(this, x, y, b, ultSprSize);
      if (isBoss && !bossLit) {
        // Boss is silhouetted before they've been beaten.
        if (s.setTint) s.setTint(0x2a0606);
        s.setAlpha(0.85);
      } else if (!unlocked) {
        s.setAlpha(0.22);
      }
      const labelColor = isBoss && !bossLit ? '#ff6b6b' : unlocked ? '#ffd54a' : '#888888';
      this.add.text(x, y + ultSprSize * 0.55, b.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px', color: labelColor,
        align: 'center', wordWrap: { width: 92 },
        stroke: '#1a0f1f', strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: s, y: y - (isBoss ? 8 : 5),
        duration: 800 + i * 110, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Tagline under the boss slot. Pre-victory: "FINAL BATTLE - coming soon".
    // Post-victory: a gold "DEFEATED" stamp celebrating the win.
    this.add.text(W / 2 + 2 * ultColSpacing, ultY + ultSprSize * 0.55 + 18,
      bossDefeated ? 'LOS HACKERS\n— DEFEATED —' : 'FINAL BATTLE\n— coming soon —', {
        fontFamily: 'Impact, Charcoal, sans-serif',
        fontSize: '11px', color: bossDefeated ? '#ffd54a' : '#ff3a3a',
        align: 'center',
        stroke: '#1a0f1f', strokeThickness: 3,
      }).setOrigin(0.5);

    /* ----- Continue / reset buttons -----
     * Boss-cleared runs see two side-by-side CTAs: a destructive
     * "Start over" (secondary, tap-twice-to-confirm) on the left, and a
     * primary "Keep playing" on the right that returns to Title with
     * the save intact (default action, also bound to SPACE/ENTER).
     *
     * Non-boss runs (cheat-jumped to WinScene without beating Los
     * Hackers) only see the primary button labeled "PLAY AGAIN" to keep
     * the original "this is just a roster preview, go play the real
     * game" feel. That path doesn't need a reset prompt because no
     * progression was earned. */

    // makeWinButton mirrors the level-complete modal button styling so the
    // two screens feel consistent. Three styles:
    //   'primary'     - purple fill + gold-on-hover ring (safe default CTA)
    //   'secondary'   - dim outlined pill that lifts to gold on hover
    //   'destructive' - red outline + warm-pink text, red fill on hover
    // Returns { nodes } so callers can show/hide the whole button as a
    // group when swapping between the two-button views.
    const makeWinButton = ({ x, y, w, h, label, style, onClick }) => {
      const bg = this.add.graphics();
      const draw = (hover) => {
        bg.clear();
        if (style === 'destructive') {
          bg.fillStyle(hover ? 0x6e1f1f : 0x2a1414, 0.85);
          bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
          bg.lineStyle(2, hover ? 0xff9a9a : 0xa84f4f, 1.0);
          bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
        } else if (style === 'primary') {
          bg.fillStyle(hover ? 0x4a3f6a : 0x32254a, 0.95);
          bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
          bg.lineStyle(3, hover ? 0xffe066 : 0xcbb3ff, 1.0);
          bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
        } else {
          // secondary
          bg.fillStyle(0x1a0f1f, 0.65);
          bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
          bg.lineStyle(2, hover ? 0xcbb3ff : 0x6a4f6a, 1.0);
          bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
        }
      };
      draw(false);
      const idleColor = style === 'primary' ? '#ffffff'
        : style === 'destructive' ? '#ffd6d6'
        : '#cbb3ff';
      const text = this.add.text(x, y, label, {
        fontFamily: 'Impact, Charcoal, sans-serif',
        fontSize: style === 'primary' ? '22px' : '19px',
        color: idleColor,
        stroke: '#1a0f1f', strokeThickness: 3,
        letterSpacing: 1,
      }).setOrigin(0.5);
      const hit = this.add.rectangle(x, y, w, h, 0x000000, 0.001);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        draw(true);
        if (style === 'secondary') text.setColor('#ffe066');
        if (style === 'destructive') text.setColor('#ffffff');
      });
      hit.on('pointerout', () => {
        draw(false);
        text.setColor(idleColor);
      });
      hit.on('pointerdown', onClick);
      return { nodes: [bg, text, hit] };
    };

    // Boss-cleared default: head back to title and let the player pick
    // what to revisit (all 5 pills now unlocked in prod mode). Non-boss
    // runs jump straight back into L1 since that's the canonical "play
    // again" path.
    const primaryAction = () => {
      if (bossDefeated) this.scene.start('Title');
      else this.scene.start('Game', { levelId: 1 });
    };

    if (bossDefeated) {
      // Two-button row, centered. Mirrors the level-complete modal
      // proportions (200 px each, 14 px gap = 414 px total) so the
      // visual rhythm carries across both endings.
      const btnY = H * 0.92;
      const btnH = 54;
      const sideW = 200;
      const gap = 14;
      const totalW = sideW * 2 + gap;
      const leftX = W / 2 - totalW / 2 + sideW / 2;
      const rightX = W / 2 + totalW / 2 - sideW / 2;

      // Two views, toggled by visibility:
      //   primary view -> [Start over] [Keep playing]
      //   confirm view -> warning copy + [Yes, Start over] [No, Go back]
      // We build both upfront and flip visibility on tap so the auto-
      // disarm timer can reuse the same nodes without rebuilding.
      const primaryNodes = [];
      const confirmNodes = [];
      const setView = (which) => {
        const showConfirm = which === 'confirm';
        primaryNodes.forEach((n) => n.setVisible(!showConfirm));
        confirmNodes.forEach((n) => n.setVisible(showConfirm));
      };

      // 5 s auto-revert from confirm back to primary so an accidental
      // tap on Start over can't strand the player on the destructive
      // dialog forever.
      let armTimer = null;
      const disarm = () => {
        if (armTimer) { armTimer.remove(false); armTimer = null; }
        setView('primary');
      };
      const arm = () => {
        if (armTimer) armTimer.remove(false);
        armTimer = this.time.delayedCall(5000, disarm);
        setView('confirm');
      };

      // ----- Primary view -----
      primaryNodes.push(...makeWinButton({
        x: leftX, y: btnY, w: sideW, h: btnH,
        label: '\u21BA  Start over',
        style: 'secondary',
        onClick: arm,
      }).nodes);
      primaryNodes.push(...makeWinButton({
        x: rightX, y: btnY, w: sideW, h: btnH,
        label: '\u21BB  Keep playing',
        style: 'primary',
        onClick: primaryAction,
      }).nodes);

      // ----- Confirm view -----
      // Warning copy spans the full row above the buttons. 16 px sans-
      // serif in warm pink - readable but doesn't shout.
      confirmNodes.push(this.add.text(W / 2, btnY - btnH / 2 - 26,
        'Do you really want to lose all your brainrots and start over?', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px', color: '#ffd6d6',
        align: 'center',
        wordWrap: { width: W - 80, useAdvancedWrap: true },
      }).setOrigin(0.5));
      // Yes (destructive, left) + No (primary, right). "No" gets primary
      // styling on purpose - the safer action is the most visually
      // inviting one so an impulsive tap leans toward NOT nuking save.
      confirmNodes.push(...makeWinButton({
        x: leftX, y: btnY, w: sideW, h: btnH,
        label: 'Yes, Start over',
        style: 'destructive',
        onClick: () => {
          if (armTimer) { armTimer.remove(false); armTimer = null; }
          SaveState.reset();
          this.scene.start('Title');
        },
      }).nodes);
      confirmNodes.push(...makeWinButton({
        x: rightX, y: btnY, w: sideW, h: btnH,
        label: 'No, Go back',
        style: 'primary',
        onClick: disarm,
      }).nodes);

      setView('primary');
    } else {
      // Cheat-jumped non-boss runs keep the original single PLAY AGAIN
      // pill - no reset prompt because no progression was earned.
      const btn = this.add.text(W / 2, H * 0.91, '\u21BB  PLAY AGAIN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px', color: '#1a0f1f',
        backgroundColor: '#ffe066',
        padding: { x: 22, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: btn, scale: 1.05, duration: 700,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      btn.on('pointerdown', primaryAction);
    }

    // Keyboard fallback - SPACE / ENTER always pick the safe default
    // (Keep playing on boss path, Play Again on non-boss path). The
    // destructive Start over CTA is intentionally pointer-only so a
    // stray keypress can't trigger reset confirmation.
    this.input.keyboard.once('keydown-SPACE', primaryAction);
    this.input.keyboard.once('keydown-ENTER', primaryAction);

    // Footer thank-you. y = H - 4 leaves a clean 1 px gutter above the
    // bottom edge regardless of the button row height above it.
    this.add.text(W / 2, H - 4, 'Survive Fire for Brainrots - thanks for playing!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px', color: '#666666',
    }).setOrigin(0.5, 1);
  }

  /* ====================================================================
     v0.6.5 True Ending dance party

     Forest at dusk (same backdrop as the title screen) populated with
     every brainrot in the roster + all four ultimates, all bouncing in
     unison while a chiptune loop plays. The hero is a controllable
     sprite the player can wander around the screen with - they're
     dancing along, not stuck on a static screen.

     Layout from top to bottom:
       y 0.10  - "THE END" headline (large pixel font)
       y 0.16  - "Survive Fire for Brainrots" subtitle (small pixel)
       y 0.21  - "created by George Le" credit (smaller pixel)
       y 0.30..0.85 - dance area (brainrots + hero)
       y 0.93  - [START OVER] [KEEP PLAYING] buttons
     ==================================================================== */
  _createTrueEnding(W, H, data) {
    Sfx.init();
    Sfx.resume();
    Sfx.playHappyLoop({ volume: 0.08 });

    // Forest backdrop (sky gradient, trees, grass, scattered foliage,
    // sparkles) - same recipe as TitleScene.drawForestBackground so the
    // ending feels like the player has come home to where the story
    // started.
    this._drawTrueEndingForest(W, H);

    // ----- Title block -----
    this.add.text(W / 2, H * 0.10, 'THE END', {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '36px', color: '#fde58c',
      stroke: '#1a0a08', strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(10000);

    this.add.text(W / 2, H * 0.16, 'Survive Fire for Brainrots', {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '11px', color: '#ffe8a8',
      stroke: '#1a0a08', strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(10000);

    this.add.text(W / 2, H * 0.21, 'created by George Le', {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '8px', color: '#cbb3ff',
      stroke: '#1a0a08', strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(10000);

    // Dance area bounds. Player + brainrots are clamped here so they
    // never overlap the title block above or the buttons below.
    this.danceBounds = {
      minX: 50, maxX: W - 50,
      minY: H * 0.30, maxY: H * 0.86,
    };

    const collectedIds = new Set(data?.allDeposited ?? []);
    // Always include the four ultimates (the player has unlocked all of
    // them by definition - they just beat the boss). De-dupe so Frigo
    // (who appears in L2 and L4) only spawns once.
    const allCollectibleIds = Object.values(LEVELS).flatMap((lv) => lv.brainrotIds);
    const ultimateIds = Object.values(LEVELS).map((lv) => lv.ultimateId);
    const danceIds = [...new Set([...allCollectibleIds, ...ultimateIds])];

    this._spawnDancingBrainrots(danceIds, collectedIds, ultimateIds);
    this._createDancingPlayer(W, H);
    this._createTrueEndingButtons(W, H);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Sfx.stopHappyLoop();
    });
  }

  // Static forest backdrop. Lifted from TitleScene.drawForestBackground
  // and tuned slightly (denser sparkles in the canopy) to match the
  // celebration vibe.
  _drawTrueEndingForest(W, H) {
    const sky = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      const r = Math.floor(120 + (1 - t) * 80);
      const gr = Math.floor(170 + (1 - t) * 40);
      const b = Math.floor(190 - t * 60);
      sky.fillStyle((r << 16) | (gr << 8) | b, 1);
      sky.fillRect(0, y, W, 4);
    }
    sky.fillStyle(0xfff5c4, 0.10);
    for (let i = 0; i < 6; i++) {
      const x = (W / 6) * i + 30;
      sky.fillTriangle(x, 0, x - 40, H, x + 40, H);
    }

    const treeBand = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const cx = (W / 8) * i + 45;
      const cy = H * 0.55;
      treeBand.fillStyle(0x3a2616, 1);
      treeBand.fillRect(cx - 8, cy - 2, 16, 36);
      treeBand.fillStyle(0x1f4a14, 1);
      treeBand.fillCircle(cx, cy - 28, 32);
      treeBand.fillCircle(cx - 18, cy - 20, 24);
      treeBand.fillCircle(cx + 18, cy - 20, 24);
      treeBand.fillStyle(0x2f6a1c, 1);
      treeBand.fillCircle(cx - 6, cy - 34, 18);
      treeBand.fillCircle(cx + 10, cy - 32, 16);
    }

    const floor = this.add.graphics();
    floor.fillStyle(0x2a4a1a, 1);
    floor.fillRect(0, H * 0.55, W, H * 0.45);
    floor.fillStyle(0x1f3a14, 0.55);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.56), H);
      const r = Phaser.Math.Between(20, 60);
      floor.fillCircle(x, y, r);
    }

    const scatter = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(Math.round(H * 0.58), H - 10);
      const kind = Math.random();
      if (kind < 0.55) {
        scatter.lineStyle(2, 0x6db84a, 0.85);
        scatter.lineBetween(x - 3, y + 4, x - 3, y - 2);
        scatter.lineBetween(x,     y + 4, x,     y - 4);
        scatter.lineBetween(x + 3, y + 4, x + 3, y - 1);
      } else if (kind < 0.85) {
        scatter.fillStyle(0x4a8c2e, 0.85);
        scatter.fillCircle(x, y, 4);
        scatter.fillCircle(x + 4, y - 1, 3);
        scatter.fillCircle(x - 4, y - 1, 3);
      } else {
        scatter.fillStyle(0xfff8e8, 1);
        scatter.fillRect(x - 1, y, 2, 4);
        scatter.fillStyle(0xc8323a, 1);
        scatter.fillCircle(x, y, 3);
      }
    }

    // Twinkle layer - more numerous + a touch brighter than TitleScene
    // because this is a celebration, not a "looming" intro.
    for (let i = 0; i < 22; i++) {
      const sx = Phaser.Math.Between(40, W - 40);
      const sy = Phaser.Math.Between(60, Math.round(H * 0.55));
      const s = this.add.graphics();
      s.fillStyle(0xfff5c4, 0.85);
      s.fillCircle(sx, sy, 1.5);
      s.setAlpha(0.3);
      this.tweens.add({
        targets: s, alpha: 1.0,
        duration: 700 + i * 70,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  // Pop each brainrot in with a Back.easeOut entrance, then start a
  // continuous bounce + sway dance. Ultimates get a gentle scale pulse
  // and a sparkle pip overhead so they read as the "VIPs" of the party.
  _spawnDancingBrainrots(ids, collectedIds, ultimateIds) {
    if (ids.length === 0) return;
    const ultSet = new Set(ultimateIds);

    const minX = this.danceBounds.minX;
    const maxX = this.danceBounds.maxX;
    const minY = this.danceBounds.minY;
    const maxY = this.danceBounds.maxY;

    // 6-column grid layout w/ jitter so the crowd looks organic. Rows
    // sized to fit however many ids we have (up to ~22).
    const cols = 6;
    const rows = Math.max(1, Math.ceil(ids.length / cols));
    const colW = (maxX - minX) / cols;
    const rowH = (maxY - minY) / rows;

    ids.forEach((id, i) => {
      const data = BRAINROT_REGISTRY[id];
      if (!data) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const baseX = minX + colW * (col + 0.5) + Phaser.Math.Between(-12, 12);
      const baseY = minY + rowH * (row + 0.5) + Phaser.Math.Between(-8, 8);
      const isUlt = ultSet.has(id);
      const everCollected = collectedIds.has(id);

      // Wrap each brainrot in a container so the bounce/sway tweens act
      // on the inner sprite without fighting the world position. (The
      // hero gets the same treatment - see _createDancingPlayer.)
      const c = this.add.container(baseX, baseY);
      const v = makeBrainrotVisual(this, 0, 0, data, isUlt ? 56 : 48);
      c.add(v);
      c.setDepth(baseY);
      c.setAlpha(0).setScale(0.2);

      this.tweens.add({
        targets: c,
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 460,
        delay: 200 + i * 55,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (!c.scene) return;
          // Bounce. Per-sprite duration jitter (mod 3) means the crowd
          // doesn't bounce in lockstep, which would look robotic.
          this.tweens.add({
            targets: v,
            y: -14,
            duration: 320 + (i % 3) * 70,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          // Hip sway.
          this.tweens.add({
            targets: v,
            angle: { from: -7, to: 7 },
            duration: 540 + (i % 4) * 80,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          // Ultimates pulse a little bigger to mark them as the VIPs.
          if (isUlt) {
            const sx = v.baseScaleX ?? 1;
            const sy = v.baseScaleY ?? 1;
            this.tweens.add({
              targets: v,
              scaleX: sx * 1.10, scaleY: sy * 1.10,
              duration: 460,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
          }
        },
      });

      // VIP sparkle for ultimates. A single 2px gold pip overhead that
      // alpha-pulses; cheap, reads as "shiny" without piling on graphics.
      if (isUlt) {
        const sparkle = this.add.graphics().setDepth(baseY + 1);
        sparkle.fillStyle(0xffe066, 0.95);
        sparkle.fillCircle(baseX, baseY - 28, 2.5);
        this.tweens.add({
          targets: sparkle, alpha: 0.25,
          duration: 600 + (i * 37) % 200,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }

      // Faintly de-emphasize brainrots the player never collected (only
      // possible if they cheat-jumped to the boss). They still dance -
      // it's a party - just with a lower alpha so the collected crew
      // pops more.
      if (!everCollected && !isUlt) c.setAlpha(0.6);
    });
  }

  // Hero sprite the player can drive around with WASD/arrows. Wrapped
  // in a container so the dance tweens (bounce + sway) can run on the
  // inner sprite without conflicting with the player's input-driven
  // x/y movement on the container.
  _createDancingPlayer(W, H) {
    const startX = W / 2;
    const startY = (this.danceBounds.minY + this.danceBounds.maxY) / 2 + 30;

    const c = this.add.container(startX, startY);
    let inner;
    if (this.textures.exists('sprite_player_boy')) {
      inner = this.add.image(0, 0, 'sprite_player_boy').setOrigin(0.5);
      inner.setDisplaySize(60, 60);
    } else {
      inner = this.add.text(0, 0, '\u{1F9D2}', { fontSize: '52px' }).setOrigin(0.5);
    }
    c.add(inner);
    c.setDepth(startY);
    c.setScale(0); c.setAlpha(0);

    this.tweens.add({
      targets: c,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 380, delay: 220, ease: 'Back.easeOut',
      onComplete: () => {
        if (!c.scene) return;
        this.tweens.add({
          targets: inner, y: -16,
          duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.tweens.add({
          targets: inner, angle: { from: -9, to: 9 },
          duration: 460, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      },
    });

    this._player = c;
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  // Two-button row: [START OVER] (destructive, two-tap confirm) and
  // [KEEP PLAYING] (safe default, also bound to SPACE/ENTER). Mirrors
  // the level-complete + legacy-non-boss button styling but uses the
  // pixel font + gold accents to match TitleScene.
  _createTrueEndingButtons(W, H) {
    const btnY = H * 0.93;
    const btnW = 220;
    const btnH = 50;
    const gap = 18;
    const totalW = btnW * 2 + gap;
    const leftX = W / 2 - totalW / 2 + btnW / 2;
    const rightX = W / 2 + totalW / 2 - btnW / 2;

    const goTitle = () => {
      Sfx.stopHappyLoop();
      this.scene.start('Title');
    };
    const reset = () => {
      Sfx.stopHappyLoop();
      SaveState.reset();
      this.scene.start('Title');
    };

    // Two views, toggled by visibility. Same arm/disarm pattern as the
    // legacy Win view so an accidental Start Over tap can't strand the
    // player (5s auto-revert).
    const primaryNodes = [];
    const confirmNodes = [];
    const setView = (which) => {
      const showConfirm = which === 'confirm';
      primaryNodes.forEach((n) => n.setVisible(!showConfirm));
      confirmNodes.forEach((n) => n.setVisible(showConfirm));
    };
    let armTimer = null;
    const disarm = () => {
      if (armTimer) { armTimer.remove(false); armTimer = null; }
      setView('primary');
    };
    const arm = () => {
      if (armTimer) armTimer.remove(false);
      armTimer = this.time.delayedCall(5000, disarm);
      setView('confirm');
    };

    primaryNodes.push(this._makeEndingButton(leftX, btnY, btnW, btnH, 'START OVER', { onClick: arm }));
    primaryNodes.push(this._makeEndingButton(rightX, btnY, btnW, btnH, 'KEEP PLAYING', { onClick: goTitle, primary: true }));

    // Confirm view: warning text above the buttons, dim background bar
    // behind the text so it stays readable when a brainrot dances under it.
    const warnY = btnY - btnH / 2 - 22;
    const warnBg = this.add.graphics().setDepth(9999);
    warnBg.fillStyle(0x1a0a08, 0.78);
    warnBg.fillRoundedRect(W / 2 - 280, warnY - 14, 560, 28, 6);
    confirmNodes.push(warnBg);
    confirmNodes.push(this.add.text(W / 2, warnY,
      'LOSE ALL PROGRESS AND START OVER?', {
        fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
        fontSize: '10px', color: '#ffd6d6',
        stroke: '#1a0a08', strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5).setDepth(10000));
    confirmNodes.push(this._makeEndingButton(leftX, btnY, btnW, btnH, 'YES, RESET', { onClick: () => {
      if (armTimer) { armTimer.remove(false); armTimer = null; }
      reset();
    }, danger: true }));
    confirmNodes.push(this._makeEndingButton(rightX, btnY, btnW, btnH, 'NO, GO BACK', { onClick: disarm, primary: true }));

    setView('primary');

    // Keyboard fallback - SPACE / ENTER pick the safe default. Start
    // Over is intentionally pointer-only so a stray keypress can't
    // trigger reset confirmation while the player is dancing around.
    this.input.keyboard.once('keydown-SPACE', goTitle);
    this.input.keyboard.once('keydown-ENTER', goTitle);
  }

  // Pixel-font ending button. Three flavors:
  //   default  - dim fill, gold border, gold text (Start Over)
  //   primary  - dim fill, gold border, white-on-gold-on-hover (Keep Playing)
  //   danger   - dim fill, red border (confirm reset)
  _makeEndingButton(x, y, w, h, label, opts = {}) {
    const accent = opts.danger ? 0xff6b6b : 0xfde58c;
    const dim = 0x0a0610;
    const idleColor = opts.danger ? '#ffb0b0'
      : opts.primary ? '#ffffff'
      : '#fde58c';

    const c = this.add.container(x, y).setDepth(10000);
    const bg = this.add.graphics();
    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? accent : dim, hover ? 1 : 0.92);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      bg.lineStyle(3, accent, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      bg.lineStyle(1, accent, 0.55);
      bg.strokeRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 6);
    };
    drawBg(false);

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", Georgia, "Times New Roman", serif',
      fontSize: '12px', color: idleColor,
      stroke: '#1a0a08', strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);

    c.add([bg, text]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => { drawBg(true); text.setColor('#1a0a08'); });
    c.on('pointerout',  () => { drawBg(false); text.setColor(idleColor); });
    c.on('pointerdown', () => { if (opts.onClick) opts.onClick(); });

    return c;
  }

  // Hero movement loop. Phaser calls update() every frame on the active
  // scene; we just translate keyboard input into x/y deltas on the
  // player container, clamped to the dance area.
  update(_time, delta) {
    if (!this._player || !this._cursors || !this._wasd) return;
    const speed = 210;
    const dt = delta / 1000;
    let vx = 0, vy = 0;
    if (this._cursors.left.isDown  || this._wasd.left.isDown)  vx -= 1;
    if (this._cursors.right.isDown || this._wasd.right.isDown) vx += 1;
    if (this._cursors.up.isDown    || this._wasd.up.isDown)    vy -= 1;
    if (this._cursors.down.isDown  || this._wasd.down.isDown)  vy += 1;
    if (vx === 0 && vy === 0) return;
    const len = Math.hypot(vx, vy);
    vx /= len; vy /= len;
    this._player.x = Phaser.Math.Clamp(
      this._player.x + vx * speed * dt,
      this.danceBounds.minX, this.danceBounds.maxX,
    );
    this._player.y = Phaser.Math.Clamp(
      this._player.y + vy * speed * dt,
      this.danceBounds.minY, this.danceBounds.maxY,
    );
    // Re-sort against the dancing brainrots whose depth = their initial y.
    this._player.setDepth(this._player.y);
  }
}

/* ============================================================================
   Boot
   ============================================================================ */

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#020108',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, IntroScene, TitleScene, GameScene, BossScene, WinScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
