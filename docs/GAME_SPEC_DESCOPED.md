# Survive Fire for Brainrots — Descoped Spec (1-Day Web Build)

**Version**: 0.6.1c (Boss fight — Phase 3 + Ring Pulse + Hydra Beam + Drones)
**Last updated**: 2026-05-10
**Status**: Active build target
**Relation to north star**: This is a *radically descoped* version of [`GAME_SPEC.md`](./GAME_SPEC.md). The original full-fidelity spec remains the long-term north star. This document defines what we're actually building **today** in a single-day, $0 budget web prototype.

> **v0.2 changelog** (immersive rebuild): camera now follows the player, the world is 8× larger (50×40 tile multi-room dungeon), walls render in pseudo-3D with visible front faces, sprites have shadows and Y-sort by depth, atmospheric torchlight darkens the world with light cutouts around the player and torches. See §11 for details.

---

## 1. Why a Descope?

The north-star spec describes a 3D third-person Unity mobile game with 4 levels, a boss fight, full character customizer, and AI-generated 3D assets. That's a 6-month project for a solo dev.

For now we want:

- **A playable game in 1 day**
- **$0 spent**
- **Shareable link** to send family/friends — no app stores, no installs
- **Preserves the brainrot soul** of the original concept

This descope keeps the core fantasy ("collect Italian brainrots while dodging hazards") and signature mechanic ("carry back to base"), but everything else gets stripped to its essence.

---

## 2. Pivot Summary

| Aspect | North star | Descoped |
|---|---|---|
| Engine | Unity 6 LTS (3D) | **Phaser 3 (2D web)** |
| Perspective | 3D third-person | **2D top-down** |
| Platform | iOS + Android native | **Browser (any phone or desktop)** |
| Distribution | App stores | **GitHub Pages URL** |
| Levels | 4 + boss | **1 (Whirling Halls only)** |
| Hazards | 4 unique types | **Swinging axes only** |
| Brainrots | 21 (20 collectible + bonus + boss) | **5 (Level 1 set)** |
| Avatar | Full customizer | **Single fixed character** |
| Lives | 3 + 1-ups | **No lives — drop carried, respawn brief invincible** |
| Boss fight | Full system | **Cut entirely** |
| Codex / Loadout / etc. | All present | **Cut** |
| Assets | AI-generated 3D | **AI-generated 2D sprites (Pollinations.ai) + drawn environment** |
| Audio | Full music + voice cast | **Browser TTS for brainrot names + free SFX** |
| Save system | JSON file | **None — single session** |

---

## 3. Tech Stack (final picks)

| Layer | Choice | Why |
|---|---|---|
| Game framework | **Phaser 3.70+** (CDN-loaded) | Mature 2D web game framework, built-in physics, sprites, audio, scenes |
| Language | **Vanilla JavaScript** | No build step, no `npm install`, just open `index.html` |
| Rendering | HTML5 Canvas (via Phaser) | Universal browser support |
| Audio | Web Audio API (via Phaser) + `speechSynthesis` for TTS | Native browser, free |
| Hosting | **GitHub Pages** | Free, simple, public URL |
| AI sprites | **Pollinations.ai** | $0, no API key, no signup, downloads as static PNGs |
| Environment art | **Phaser Graphics API** + simple drawn shapes | Avoids tileset asset wrangling |
| Player input | Keyboard (desktop) + touch joystick (mobile) | Phaser plugin or custom |

---

## 4. Final Folder Structure

```
survive-fire-for-brainrots/
├── README.md                  Project overview + how to play
├── index.html                 Game entry point (loads Phaser CDN)
├── game.js                    All game logic (single file, ~500-700 lines)
├── style.css                  Mobile viewport scaling
├── assets/
│   ├── sprites/               5 brainrot PNGs + player.png + axe.png
│   └── audio/                 Free SFX from freesound.org or generated
├── .gitignore
├── .nojekyll                  (tells GitHub Pages to skip Jekyll)
└── docs/                      Design docs (preserved as-is)
    ├── GAME_SPEC.md           North star
    ├── GAME_SPEC_DESCOPED.md  This file
    ├── BRAINROT_ROSTER.md
    ├── LEVEL_1_AXES.md
    ├── ART_AUDIO_GUIDE.md
    └── TECH_ARCHITECTURE.md
```

GitHub Pages is configured to serve from `main` branch / root, so `index.html` loads at the top-level URL.

---

## 5. Game Design

### 5.1 The Level — "The Whirling Halls"

A single-screen top-down stone temple. Camera shows the entire room at once (no scrolling).

**Dimensions**: 25 tiles wide × 18 tiles tall × 32px = 800×576 pixels (scales to fit any screen)

**Layout** (rough ASCII):
```
┌─────────────────────────────────────────────┐
│ # # # # # # # # # # # # # # # # # # # # # # │
│ #                                         # │
│ #   [3]Trippi              [2]Brr Brr     # │
│ #                                         # │
│ #            ╳axe        ╳axe             # │
│ #                                         # │
│ #     [4]Boneca                           # │
│ #                                         # │
│ #            [5]Lirili (boss-of-level)    # │
│ #                                         # │
│ #            ╳axe                ╳axe     # │
│ #                                         # │
│ #                                [1]Bombo # │
│ #                                         # │
│ #                  ◯BASE                  # │
│ #                                         # │
│ # # # # # # # # # # # # # # # # # # # # # # │
└─────────────────────────────────────────────┘
```

- `#` = stone wall (collidable)
- `╳axe` = swinging axe pendulum
- `◯BASE` = rune circle (start/deposit point)
- `[N]Name` = brainrot pickup #N

### 5.2 Player

- Fixed humanoid sprite, viewed from above
- Walks in 8 directions
- Speed: 180 px/s base; -25 px/s per brainrot carried (visible stack penalty)
- Carries up to 5 brainrots (the entire level set)
- No lives — getting hit drops all carried + 1.5 sec invincibility, no game over
- No jump (top-down), no attack (no boss)

### 5.3 Brainrots (5 — Level 1 set)

| # | Name | Visual approach | Voice line |
|---|---|---|---|
| 1 | **Bombombini Gusini** | AI-generated chibi goose with bombs | "Bombombini Gusini!" |
| 2 | **Brr Brr Patapim** | AI-generated tree-monkey | "Brr brr patapim!" |
| 3 | **Trippi Troppi** | AI-generated cat-shrimp hybrid | "Trippi troppi!" |
| 4 | **Boneca Ambalabu** | AI-generated frog-tire-doll | "Boneca ambalabu..." |
| 5 | **Lirili Larila** | AI-generated cactus-elephant w/ pocket watch | "Lirili larila!" |

**Behavior**:
- Stand idle at fixed positions with a slight bob animation
- When player overlaps → "pickup" (sprite attaches to player as a follower)
- Speech synthesis (`speechSynthesis.speak`) plays the name in Italian voice
- Multiple carried brainrots form a trailing line behind the player (snake-style)

### 5.4 Hazards — Swinging Axes

- **4 axes** in the level (more than spec stub for tension)
- Each is a sprite pivoting around a fixed ceiling-anchor point
- Sweep arc: ±60° from vertical
- Period: 1.5–2.5 sec (varied per axe)
- Collision with blade: drop all carried, brief invincibility, knockback to a safe tile

**Implementation**: Phaser `Arcade.Body` with circle collision on the blade tip; rotation animated via `tween` repeating yoyo.

### 5.5 Base / Portal

- Glowing rune circle at the bottom of the level
- Walking onto it while carrying brainrots → deposit all (counter goes up)
- Visual feedback: each deposit lights up a "statue" around the base perimeter
- When 5/5 deposited → the rune circle **transforms into a portal** (color shift + particle effect)
- Walking into the portal → **Win Screen**

### 5.6 Game States / Scenes

| Scene | Purpose |
|---|---|
| `BootScene` | Load all assets (PNGs, audio) |
| `TitleScene` | "Survive Fire for Brainrots" + Tap to Start |
| `GameScene` | The actual gameplay |
| `WinScene` | Victory! Replay button |

### 5.7 HUD

- Top-left: "Collected: X / 5" counter
- Top-right: "Carried: 🎒 X" counter
- Bottom-center (mobile only): virtual joystick

### 5.8 Audio

- **Brainrot voice on pickup**: `speechSynthesis.speak(new SpeechSynthesisUtterance(name))` with Italian voice (`lang: 'it-IT'`)
- **SFX**: ~5 short WAV/OGG clips from freesound.org (CC0 / free):
  - `pickup.ogg` — light chime
  - `deposit.ogg` — softer chime
  - `hit.ogg` — thud
  - `axe_whoosh.ogg` — looped or per swing
  - `portal.ogg` — magical shimmer
  - `win.ogg` — fanfare
- **No music** in v1 (optional polish task — could add a free looping ambient track)

---

## 6. Controls

| Input | Action |
|---|---|
| Arrow keys / WASD | Move (desktop) |
| Touch and drag (left half of screen) | Virtual joystick (mobile) |
| (No other inputs needed — pickup/deposit are automatic on collision) |

---

## 7. Acceptance Criteria

The descoped game is "done" when:

- [ ] Game loads in any modern browser (Chrome, Safari, Firefox) on phone and desktop
- [ ] Game scales to fit window, plays in landscape on mobile
- [ ] Player can walk around the temple using keyboard or touch joystick
- [ ] All 4 axes swing on independent timings
- [ ] Hitting an axe drops all carried brainrots + brief invincibility
- [ ] All 5 brainrots can be picked up by walking into them
- [ ] Multiple brainrots visibly stack/follow the player
- [ ] Speech synthesis says brainrot names in Italian on pickup (with English fallback if it-IT voice unavailable)
- [ ] Walking onto base while carrying deposits brainrots; counter updates
- [ ] After 5/5 deposits, base transforms into portal
- [ ] Walking into portal triggers Win Scene
- [ ] Replay button restarts cleanly
- [ ] Game is hosted on GitHub Pages at `https://lysa-le.github.io/survive-fire-for-brainrots/`
- [ ] URL works on at least one phone (test with friend/family device)

---

## 8. Time Budget

| Task | Allocated |
|---|---|
| Project scaffolding (HTML, CSS, Phaser CDN, repo init) | 30 min |
| Sprite generation via Pollinations (5 brainrots + player + axe) | 30 min |
| Top-down player movement + virtual joystick | 45 min |
| Temple drawing (Phaser graphics) | 30 min |
| Swinging axe hazard + collision | 45 min |
| Brainrot pickup + carry + follow stack | 1 hr |
| Base / portal mechanic | 30 min |
| TTS + SFX integration | 30 min |
| Title + Win scenes | 30 min |
| Mobile polish + viewport scaling | 45 min |
| GitHub Pages deploy | 15 min |
| Bug-fixing + playtesting | 1 hr |
| **Total** | **~7.5 hours** |

---

## 9. Future Path Back to North Star

This descoped version is **deliberately disposable** — it's not the foundation for the Unity 3D game. When the time comes to build the north star:

- Use the descoped version as a **playtesting reference** for level pacing and feel
- Lessons learned (axe timings, brainrot voice cadence, level layout) feed back into Unity Level 1
- The 5 brainrot sprites + Italian TTS settings can inform the 3D character voice direction
- The descoped game stays live on GitHub Pages forever as a "v1" prototype to share

---

## 10. Open Questions / Polish Stretches (if extra time)

- [ ] Add a looping music track (free CC0 from freesound or opengameart.org)
- [x] Add particle effects on portal activation *(done in v0.2)*
- [ ] Add a "best time" counter (localStorage)
- [ ] Add 1-2 hidden 1-ups → currently no lives, but could add a "secret brainrot" that increases score
- [ ] QR code generator on Win Scene for sharing the URL with others

---

## 11. v0.2 Immersive Rebuild — Detailed Notes

The v0.1 build had the player viewing the entire single-room temple at once (diorama view). v0.2 rebuilds the gameplay to feel like the player is *in* the dungeon.

### 11.1 World

- **Map size**: 50×40 tiles (1600×1280 px), ~8× larger than v0.1
- **Layout**: 4 connected chambers via corridors:
  1. **Northern Sanctum** (top): 24×9 chamber housing **Lirili Larila** + decorative pillars
  2. **North Corridor**: 6×5 narrow passage between Sanctum and Landing, gated by 2 axes
  3. **Landing junction**: 20×3 hub
  4. **West Wing** (left): 18×10, contains **Trippi Troppi** + **Boneca Ambalabu**, 2 axes
  5. **East Wing** (right): 18×10, contains **Brr Brr Patapim** + **Bombombini Gusini**, 2 axes
  6. **Wing connectors** (south of each wing): narrow 6×3 corridors with no axes
  7. **Entrance Hall** (bottom): 36×5, contains the **Base/Portal** + 2 axes for the final return
- **Total axes**: 10 (vs 4 in v0.1)
- **Total torches**: ~20 spread across rooms

### 11.2 Camera

- **Smooth follow** with 12% lerp (`startFollow(player, true, 0.12, 0.12)`)
- **Deadzone**: 80×60 px (player can move slightly without camera scrolling)
- **Bounds**: clamped to world edges
- **Zoom**: 1.0 (could increase for an even tighter feel)

### 11.3 Pseudo-3D rendering

- Each wall tile renders as:
  - **Top face** (32×32) with a 3px highlight stripe at the top edge and mortar grid
  - **Front face** (32×16) drawn *only* if the tile below is non-wall — gives walls visible "height"
  - **Lower shadow** (32×2) at the bottom of the front face
- **Y-depth sort**: every sprite (player, brainrots, torches, axes) sets `depth = sprite.y`. Wall rows set `depth = (y+1)*TILE - 0.5`. Sprites south of a wall render on top of it; sprites north render behind.
- **Run-length-encoded wall colliders**: contiguous wall runs in a row are merged into one physics body for performance.
- **Sprite shadows**: small dark ellipse beneath the player and each brainrot, depth `-10` so it always sits below sprite art.

### 11.4 Atmospheric lighting

- **RenderTexture overlay** at depth 8000 (covers everything except HUD)
- Each frame: clear, fill with dark color (`#040108` at 86% alpha), then `erase()` light circles at:
  - **Player position** (large radius — 230px)
  - **Each on-screen torch** (small radius — 95px) with sin-wave flicker (±6px)
  - **Base** (when portal is active)
- **Light textures** are pre-baked once with concentric circles of decreasing alpha for a soft falloff (γ=2.2 for natural-looking gradient)

### 11.5 Player feel

- **Speed**: 200 px/s base (up from 180 in v0.1)
- **Carry penalty**: −22 px/s per brainrot (slightly gentler in v0.2)
- **Walk bob**: scaleY oscillates ±6% while moving (subtle "alive" feel)
- **Direction-mirror**: sprite flips horizontally when moving left

### 11.6 UX additions

- **Brainrot name labels** fade in only when player is within 180px (prevents map-wide spoiler labels with no minimap)
- **Smarter scatter on hit**: scattered brainrots try 6 random positions near the player, only landing on valid floor tiles (not inside walls)

### 11.7 What stayed the same

- Phaser 3 + vanilla JS, single `game.js`
- Emoji-based sprites
- Italian TTS via `speechSynthesis`
- Synthesized SFX via WebAudio
- Same 5 brainrots, same base/portal mechanic, same win condition
- GitHub Pages deploy via `deploy.sh`

### 11.8 What was deliberately NOT built (still possible later)

- True isometric tile rendering (rotated diamond grid)
- Camera skew/tilt for additional iso flavor
- Background music
- Minimap
- Save/load with `localStorage`
- Animated wall textures, water/lava, floor patterns per room
- Per-room ambience (e.g., echoing drips in Sanctum, wind in Wings)

---

## 12. v0.2.1 — Hearts, Weight, and First Real Sprites

### 12.1 What changed

- **3-heart health system**
  - HUD shows three `❤️` at top-center.
  - Each axe hit dims one heart (alpha 0.2) plus the existing scatter + invincibility.
  - When all three are gone: a "YOU FELL TO THE AXES" flash plays, the screen fades, and the level restarts.
  - **Deposited brainrots are preserved across restarts** so progress isn't lost. Restart re-fills hearts to 3.
- **Heavier carrying**
  - `CARRY_PENALTY` raised from 22 → 38 px/s per brainrot.
  - New `MIN_CARRY_SPEED = 70` floor so a full backpack doesn't freeze you.
  - Resulting walk speeds: 0=200, 1=162, 2=124, 3=86, 4–5=70.
  - HUD backpack readout color-shifts: white (0–1) → yellow (2–3) → red + pulse (4–5).
- **First image-based brainrots (test)**
  - `Bombombini Gusini` and (renamed) `Strawberry Elephant` now render from PNGs in `assets/sprites/`.
  - Other three brainrots still use the emoji fallback.
  - A single `makeBrainrotVisual(scene, x, y, data, size)` helper picks PNG vs emoji and is used in `createBrainrots`, base statue slots, the title screen preview row, and the win screen lineup.

### 12.2 Implementation notes

- `BootScene.preload()` loads both PNGs as `sprite_bombo` and `sprite_lirili`. Phaser's texture cache makes them available to every later scene.
- `GameScene.create(data)` accepts `{ deposited: string[], hearts?: number }`. Fresh starts default to `STARTING_HEARTS`.
- After `createBrainrots()`, `applyDepositedState()` hides any already-deposited brainrot's sprite/shadow/label and lights up its corresponding statue slot.
- `loseHeart()` handles the dim-and-bounce animation; `handleGameOver()` flashes, fades, and calls `scene.restart({ deposited: [...] })`.

### 12.3 What's still emoji-only (waiting on art)

- `Brr Brr Patapim`, `Trippi Troppi`, `Boneca Ambalabu`. Drop matching PNGs into `assets/sprites/` with names like `Patapim.png` and add a `spriteKey` entry to `BRAINROT_DATA` to swap them in.

---

## 13. v0.4 — Level 3: The Bloop's Domain

The third level is an underwater stealth-pursuit chase. The Bloop is a giant cephalopod prowling the seafloor; when it spots the player it pursues, when line-of-sight breaks it searches the last known position, then resumes patrol. Touching the player = caught (heart lost, brainrots scattered, brief Bloop stun). Survive by hiding behind coral / shipwreck / kelp.

### 13.1 Biome — Ocean

- 50×40 tile seafloor, turquoise sand with deeper shadow basins and lighter sun-lit clearings.
- Permanent **seafloor decorations** scattered across walkable tiles: anemones, sea urchins, starfish, coral fans (purely cosmetic, no collision).
- **Drifting sea life**: schools of fish (🐟/🐠/🐡) and sea turtles (🐢) cruise harmlessly across the world. Jellyfish (🪼) drift upward and **deal 1 heart of damage on contact** — they're a moving hazard, not decoration (see §13.3.1).
- Constant ambient effects: drifting bubbles spawn every ~250 ms and rise to the surface; slanted "god-ray" light bands cut diagonally across the world.
- Border (2-tile-thick) renders as the **abyss**: deep dark water with subtle current arcs, framing the playable area.
- Surface gradient skybox in screen-space (bright surface up top → deep abyss at the bottom) with a shimmer line along the very top edge.
- Brainrots glow phosphorescent cyan against the muted seafloor and have soft layered indigo shadows.

### 13.2 Wall tile types (interior)

| Tile           | Role                              | Notes |
|---|---|---|
| Coral mound   | Most common cover                 | Bumpy pink/red lobes with polyp dots. Bright silhouette against sand. Breaks Bloop line-of-sight. |
| Kelp cluster  | ~25% of interior tiles by hash    | 3–4 tall green strands with bulb tips and shadow strands behind. Breaks Bloop line-of-sight. |
| Shipwreck     | Hardcoded long horizontal spine   | Weathered dark planks with rusted fasteners and clinging algae. Provides a long unbroken cover line through the middle of the map. |

All three break Bloop line-of-sight identically — gameplay-wise they're equivalent; visually they break up the map.

The map has **no interior cover at all**: coral, kelp, and the shipwreck have all been removed. The only walls are the 2-tile abyss border around the perimeter. Level 3 is a pure footrace: outrun the Bloop with light loads, use route choice to keep distance, and dodge drifting jellyfish on the way to each brainrot. The chase begins the moment the player crosses the activation distance from base.

### 13.3 Hazard — The Bloop (Pac-Man chase AI)

The Bloop is a visible, in-world cephalopod (rendered from `assets/sprites/bloop.png`) with a physics body that collides with walls. It spawns asleep at `(WORLD_W/2, tx(9))` and **wakes up the moment the player first ventures more than `BLOOP_ACTIVATION_DIST = 200 px` (≈5 tiles) from the base**. Once awake, it never goes back to sleep — running back to base does not reset the hunt.

**Visual**: 180 × 180 px sprite (`sprite_bloop`) with a layered drop shadow underneath, a state-driven pulsing glow ring behind the body (red when chasing, orange when searching, cyan when stunned), and an alert indicator floating above (`!` chasing, `?` searching, `×` stunned, faded `!` while hunting, drowsy `z` while dormant). The sprite flips horizontally based on movement direction and tints red on chase, blue on stun, gray-blue when dormant. The physics body collider is `BLOOP_RADIUS = 32 px` — smaller than a tile so the Bloop can slip through reef gaps without snagging.

State machine:

| State     | Speed       | What happens |
|---|---|---|
| Dormant   | 0 px/s      | Initial state at level start. Sprite is dimmed and tinted blue with a slow lazy bob and a `z` snooze indicator. Bloop does not move or chase. Triggers transition to Hunting + camera shake + SFX sting + scale pulse the first time the player exceeds 200 px from the base spawn. |
| Hunting   | 95 px/s     | Default active mode — always heading toward the player even without LOS, just slower. Faded red `!` indicator. The Bloop *always knows where you are*. |
| Chasing   | 125 px/s    | LOS to player within 480 px → full pursuit. Sprite tints red and pulses, glow ring blooms, bright `!` indicator. Camera shakes briefly on first spot, SFX sting plays. |
| Searching | 85 px/s     | LOS just broke during a chase → darts to player's last seen position. Orange `?` indicator. After reaching the spot or 3.5 s timeout, snaps back to Hunting (still tracking, just without LOS). |
| Stunned   | 0 px/s      | Frozen 1.4 s after catching the player. Sprite tints cyan, soft cyan glow, pale `×` indicator. |

#### 13.3.1 Base safe zone

The player's base radiates a **130 px circular safe zone** marked by a soft cyan halo + pulsing perimeter ring (rendered only on Bloop levels). Inside this zone, the Bloop **cannot catch the player** — the catch check is gated by `isPlayerInSafeZone()`. If the player retreats inside while being chased, the Bloop loiters at the safe-zone perimeter (heading toward a target `BASE_SAFE_RADIUS + 28 px` from the base along the bloop→base axis at 70% of hunt speed) and waits for the player to step out. Stepping out instantly resumes hunting/chasing.

Note: the safe zone (130 px) is smaller than the Bloop's activation distance (200 px), so the moment the player crosses out far enough to leave the safe zone, they are still inside the activation buffer until they push past 200 px — but as soon as the Bloop wakes, returning to the safe zone is always a viable bail-out tactic.

#### 13.3.2 Seafloor mines

Where the v0.4 ocean had decorative anemones, those slots now place **explosive mines** scattered randomly across walkable seafloor (~12–15 per level). Each mine is drawn as a dark spiked sphere with a **pulsing red warning light** at its core and a soft red halo so it reads unmistakably as dangerous. Mines are placed once during level setup and stored in `this.mines[]`.

- **Trigger radius**: 22 px from the mine center.
- **On contact** (`explodeMine`): expanding orange shockwave ring, bright yellow flash, smoke puff, 10 shrapnel particles, 260 ms camera shake, hit SFX, mine graphic destroyed, and `onPlayerHit()` fires (heart lost, brainrots scatter, 1.2 s iframes) plus a 380 px/s radial knockback away from the blast.
- **Once exploded, gone for the rest of the run** — no respawn until a level restart re-runs `placeSeafloorDecorations()`.
- **Placement guards**: mines are excluded from a 6-tile radius around the base (vs 4 tiles for inert decorations) and never land on a brainrot tile, so the player isn't insta-killed leaving the portal or grabbing a brainrot.
- **Iframe interaction**: collision check is gated by `invincibleUntil <= time`, so a player riding out a Bloop catch or jellyfish sting can pass through one mine harmlessly during the 1.2 s window. The mine remains armed for next time.

The mine field combines with the swarming jellyfish and the chasing Bloop to create three overlapping pressure systems — Level 3 is intentionally the most chaotic of the three levels.

#### 13.3.3 Jellyfish hazards

In addition to the Bloop, jellyfish (🪼) drift up the seafloor on their own dedicated cadence — **a new jelly every 2.4–4.5 s**, with a **35 % chance** that a paired second jelly spawns ~0.5 s later for cluster pressure. With drift durations of 18–24 s, the seafloor typically holds **5–10 active jellyfish at once**, forcing the player to weave around drifting hazards on every brainrot run.

Each jelly is rendered inside a Phaser Container with a **pulsing pink/red danger aura** beneath the bell so the player can read it as a threat at a glance. On contact (player center within `hazardRadius = 32 px` of the jellyfish center) the player takes 1 heart of damage via `onPlayerHit()`, scattering carried brainrots, with a radial knockback away from the sting. The jelly briefly flashes brighter on hit. Standard 1.2 s invincibility frames apply, so a single jellyfish only stings once per sweep — but with multiple active jellies, chained stings are very possible.

Sea turtles (🐢) cruise the seafloor on their own slower 14–22 s timer and remain purely decorative.

`updateJellyfishHazard(time)` runs each frame inside `updateOceanAmbience` and prunes destroyed jellies from the active list automatically.

Detection:
- Vision range: 480 px (roughly the diagonal of the camera view).
- Line-of-sight: `lineHitsWall()` casts a ray from the Bloop to the player in half-tile steps. If any `'#'` tile is in the way, LOS is blocked.
- A player hiding behind any coral / kelp / shipwreck tile within vision range temporarily breaks the chase, but the Bloop keeps walking toward the last seen position, then resumes hunting straight at the player's current position. To truly "wait it out," the player must stay completely behind cover until the Bloop walks past.

Catch:
- Distance to Bloop center < 50 px AND player not in invincibility frames → `bloopCatchPlayer()`:
  - Bloop transitions to Stunned (1.4 s)
  - `onPlayerHit()` fires: heart lost, carried brainrots scatter, camera shakes, hit SFX plays
  - Player gets a radial knockback away from the Bloop
- Player has 1.2 s of invincibility — combined with Bloop's 1.4 s stun this gives a small buffer to escape behind cover before the next chase begins.

**Speed economy**: Player base speed is 200 px/s, slowest at 70 with full carry. The Bloop's chase speed (130) is *faster than every carry state above 1 brainrot*, so once it has LOS the only realistic counter is to break LOS via cover and reset the search.

### 13.4 Brainrots (5)

| # | Name                          | Visual            |
|---|---|---|
| 1 | Tralalero Tralala             | PNG sprite (shark in Nikes) |
| 2 | Abyssaloco                    | PNG sprite |
| 3 | Bluberrinni Octopusini        | PNG sprite |
| 4 | Orcalero Orcala               | PNG sprite |
| 5 | Capitano Moby                 | PNG sprite |

### 13.5 Scene flow

- Title screen now shows three level buttons (Level 1 / 2 / 3) and three preview rows of brainrots. Press `1` / `2` / `3` to jump directly into any level.
- Beating Level 2 auto-advances to Level 3 (same `triggerWin` cumulative-deposit pipeline). Beating Level 3 ends the run on the WinScene.
- WinScene auto-iterates `LEVELS`, so it now renders three rows of 5 brainrots each (15 total) without any further code changes.
- Death messaging branches by hazard type — the bloop death flash reads "THE BLOOP CAUGHT YOU".
- Level 3 intro hint reads: *"The Bloop wakes when you leave base - dodge mines and jellyfish!"*

### 13.6 Difficulty notes

- The Bloop is constantly active and always pursuing — there is no patrol/idle state.
- Collected brainrots stay deposited across deaths (existing scatter+restart behavior).
- Difficulty dials in code: `BLOOP_SPEED_HUNT`, `BLOOP_SPEED_CHASE`, `BLOOP_SPEED_SEARCH`, `BLOOP_VISION_RANGE`, `BLOOP_CATCH_RADIUS`, `BLOOP_SEARCH_TIME_MS`, `BLOOP_STUN_TIME_MS`, `BLOOP_RADIUS`, `BLOOP_DISPLAY_SIZE`. Lower hunt/chase speeds and shrink the catch radius for an easier hunt; raise them for a more aggressive predator.

---

## 14. v0.5 — Level 4: The Burning Below

The fourth and final level shifts the game into a volcanic biome. Where Level 3 was a single open footrace against one persistent hunter, Level 4 returns to environmental hazard navigation: the floor itself wants to kill you, and geysers blast random spots without warning. The map is mostly molten lava with raised stone platforms threaded through it, so the core challenge is route-planning while keeping a long brainrot tail away from the danger.

### 14.1 Biome — Lava

- New `biome: 'lava'` with bg `#1a0508` and a volcanic dusk skybox: dark red gradient at the top, warming through orange to a hot red-orange horizon, dotted with drifting smoke clouds and high-altitude ember sparks.
- World is fully lit (no torchlight overlay — lava biome shares the desert/ocean "open lit world" treatment).
- Ambient warmth wash and 70 floating ember particles drift upward over the world for that constant heat-haze feel.

### 14.2 Tile types (new)

- `'L'` (lava floor): walkable but **damages the player on every iframe tick** (~once per `LAVA_TICK_MS = 350ms`, gated by the standard `INVINCIBLE_MS = 1500ms` window). Visualized as a glowing molten surface with hot spots, cooler red flow zones, and crusty crack lines.
- `'.'` (stone platform): the safe walkable space. Drawn with a soft drop-shadow on the lava beneath, a warm rim highlight on the lava-facing edges, and a mottled stone fill so platforms read as raised islands above the lava.
- `'#'` (rocky cliff): the impassable border. Drawn as dark basalt with mineral grain, faint magma veins, a warm rim along the top, and a 16-px cliff drop-face on the tile below (matching the temple/desert wall convention). A few hot magma points peek through the cliff face.

### 14.3 Map layout (`buildMapL4`) — 2×2 stepping pillars (v0.5.3)

The map is built around the jump mechanic (§14.7). Single-tile stepping pillars proved too small to read and aim landings against, so the network was rebuilt with **2×2 stepping pillars** anchored on a 3-tile grid — neighbours sit 3 tiles apart in each axis, leaving **exactly one tile of lava between any two pillars** (the canonical jump distance).

- 50×40 tiles, default fill is `'L'`. Border (2 tiles thick) is `'#'`. Pillars and platforms are carved with `platform(x0, y0, x1, y1)` (rect) and `pillar(x, y)` (2×2 block whose top-left corner is `(x, y)`) helpers.
- **Brainrot rest stops**: five 3×3 platforms, one brainrot in each center tile.
  - `(6-8, 5-7)` brainrot 1 (Arcadragon, NW)
  - `(23-25, 5-7)` brainrot 2 (Dragon Cannelloni, N-center)
  - `(40-42, 5-7)` brainrot 3 (Cocofanto, NE)
  - `(14-16, 22-24)` brainrot 4 (Nuclearo Dinossauro, SW-mid)
  - `(33-35, 22-24)` brainrot 5 (Frigo Camelo, SE-mid)
- **Base**: 5×4 platform at `(22-26, 33-36)`. Portal/`B` at `(24, 35)`. The only generous landmass on the level.
- **Central trunk**: eight 2×2 pillars on cols 24-25, top-left corners at rows 30, 27, 24, 21, 18, 15, 12, 9. The first pillar (rows 30-31) sits one lava row south of the base top edge (row 33: gap at row 32). The last pillar (rows 9-10) sits one lava row south of brainrot 2's platform (row 7: gap at row 8).
- **Mid-row branches** off the junction pillar `(24, 21)` (rows 21-22):
  - West toward brainrot 4: `pillar(21, 21)` and `pillar(18, 21)`. Final jump is from pillar col 18 over lava col 17 to platform 4 east edge col 16.
  - East toward brainrot 5: `pillar(27, 21)` and `pillar(30, 21)`. Final jump is from pillar col 31 over lava col 32 to platform 5 west edge col 33.
- **North-west chain** branches off the trunk at `pillar(24, 12)` and steps west along rows 12-13 with pillars at top-left cols 21, 18, 15, 12, 9, 6. From `pillar(6, 12)` it turns north to `pillar(6, 9)`, which lies one lava row south of platform 1.
- **North-east chain** mirrors the NW chain on the east side, ending at `pillar(42, 9)` — one lava row south of platform 3.
- **Decoy / safety pillars**: a handful of off-axis 2×2 blocks (`pillar(6, 18)`, `pillar(42, 18)`, `pillar(9, 27)`, `pillar(39, 27)`) give the open lava rooms visual rhythm and a couple of alternative paths.

The first jump leaves the base from `(24, 33)` and lands on the trunk pillar at `(24-25, 30-31)`, clearing the lava tile at `(24, 32)`. Every subsequent traversal is the same shape: stand anywhere on a 2×2 pillar (so the player can choose which tile to jump from to time geysers), then hop one tile north/south/east/west to the next pillar's near edge. The 2×2 footprint gives a more forgiving landing target while keeping every gap exactly one lava tile wide.

### 14.4 Hazards

#### 14.4.1 Lava-touch damage

- Each frame `updateLavaTouch(time)` checks the player's current tile. If it is `'L'` and `time - lastLavaTickAt >= LAVA_TICK_MS` and the player is not currently invincible, it triggers `onPlayerHit(time)` (1 heart, 1.5s iframes, brainrot scatter) and applies a soft upward knockback so the player isn't immediately re-damaged on the same tile.
- This means stepping onto lava costs 1 heart and scatters the carried tail; staying on lava continuously drains hearts at one per iframe window. The player's effective grace-window for crossing 2-3 lava tiles is roughly 1-2 strides.
- Scattered brainrots in the lava biome are biased toward stone tiles (the scatter loop tries 16 candidates instead of 6 and prefers `'.'` tiles, only accepting `'L'` as a last-resort fallback) so dropping a tail doesn't strand brainrots in unreachable lava.
- Death message: *"CONSUMED BY LAVA - retrying"*.

#### 14.4.2 Lava geysers

A new periodic hazard implemented in `createLavaSystem()` / `updateGeysers(time)` / `spawnGeyser(time)`. Each active geyser cycles through three states:

| State | Duration | Visual | Damage |
|---|---|---|---|
| `telegraph` | 950 ms (`GEYSER_TELEGRAPH_MS`) | Pulsing red ring on lava surface, growing outward, with bubbling magma blobs rising | None |
| `erupt` | 750 ms (`GEYSER_ERUPT_MS`) | 3-layer vertical flame column (red → orange → yellow → white core) rising and falling on a sin-easing curve, plus radial blast at the base, plus 8 flying embers | Yes — radius 38 px (`GEYSER_HIT_RADIUS`), one-shot per eruption, with radial knockback (`GEYSER_KNOCKBACK = 240`). Damage check gated by player iframes. |
| `cooldown` | 600 ms (`GEYSER_COOLDOWN_MS`) | Fading scorched glow + lazy smoke whisp | None |

Spawning rules:

- New geyser every `GEYSER_SPAWN_MS = 1300` ± `GEYSER_SPAWN_JITTER = 500` ms (so 0.8-1.8 s between spawns — tightened in v0.5.2 to bite harder against the new pillar-hopping rhythm).
- Up to `GEYSER_MAX_ACTIVE = 6` simultaneous geysers can be active at once.
- Spawn picks a random `'L'` tile that is at least 5 tiles from the base — prevents the player getting nuked at spawn.
- Note that geysers spawn on lava tiles but their 38-px blast radius covers an entire 1-tile lava strip and clips onto both adjacent pillars. Combined with the dense pillar network, this means a geyser telegraph in the lava strip you're about to jump across forces you to either wait it out or commit to the hop and trust the timing.

### 14.5 Brainrots (5)

| ID | Name | Sprite | Why it fits |
|---|---|---|---|
| `arcadragon` | Arcadragon | `Arcadragon.png` | Neon arcade dragon — naturally fiery |
| `cannelloni` | Dragon Cannelloni | `Dragon_Cannelloni.png` | Pasta-dragon, the obvious lava companion |
| `cocofanto` | Cocofanto Elefanto | `Cocofanto.png` | Coconut-elephant, exotic + heat-tolerant |
| `nuclearo` | Nuclearo Dinossauro | `Nuclearo_Dinossauro.png` | Nuclear dinosaur — perfect volcanic fit |
| `frigo` | Frigo Camelo | `FrigoCamelo.png` | Refrigerator-camel — comedic counterpoint, sprite upgraded from emoji-only in this release |

All five render with a cool teal halo (vs the desert's warm sunset glow and ocean's phosphorescent cyan) so they pop sharply against the bright orange lava floor. Shadows use a warm-shifted dark color (`0x100808`) with slightly heavier alphas.

### 14.6 Scene flow

- TitleScene now hosts **four** Level buttons (re-laid out at width 178 with ~10 px gaps; positions `W/2 ± 282` and `W/2 ± 94`). The 4-row brainrot preview block was tightened from 56 to 46 px row spacing and 76 to 70 px column spacing so all four levels' rosters fit above the buttons.
- Press `1` / `2` / `3` / `4` (or click) to jump straight into any level.
- Beating Level 4 runs the existing auto-advance check — since `LEVELS[5]` doesn't exist, it falls through to the **WinScene**.
- WinScene was compressed for 4-level layouts: row gap 95 px (was 130 px), sprite size 44 px (was 56 px), column spacing 86 px (was 96 px), starting Y `H * 0.32` (was `H * 0.36`), and the "Play Again" button moved from `H * 0.86` to `H * 0.92`. The 3-level layout still renders unchanged when only 3 levels are configured.
- Level 4 intro hint: *"Stay on the stone platforms - lava burns and geysers erupt!"*

### 14.7 Jump mechanic (universal, debuted in v0.5.1)

A short hop that lets the player visually leave the ground for half a second. Wired up across **all** levels but only required for Level 4 navigation.

- **Trigger**: `Space` key on desktop, or the on-screen `JUMP` button (bottom-right, mobile-friendly tap target).
- **Implementation**: the player is split into two objects.
  - `this.player` (invisible Text) is the physics anchor. It always sits at ground level, so collisions, world bounds, and tile lookups are unaffected by the jump.
  - `this.playerVisual` is the visible runner emoji. Each frame `updateDepthSort()` syncs it to the anchor's `(x, y)` and applies a `jumpLift` y-offset.
  - The shadow stays at ground level but shrinks (`scale 1 → 0.55`) and fades (`alpha 0.5 → 0.30`) at the apex of the jump for a clear "in the air" read.
- **Arc**: parabolic, `lift = sin(t * π) * JUMP_HEIGHT_PX` over `JUMP_DURATION_MS`. Constants in code: `JUMP_DURATION_MS = 520`, `JUMP_HEIGHT_PX = 38`, `JUMP_COOLDOWN_MS = 180`.
- **Effect on hazards**:
  - Lava-touch damage is suppressed while airborne (`updateLavaTouch()` early-returns on `isAirborne`). This is the central use of the jump - skipping a 1-2 tile lava gap.
  - All other hazards (axes, meteors, fires, geysers, the Bloop, jellyfish, mines) still apply normally. Geysers in particular still strike vertically through the jump.
- **Polish**: takeoff and landing each play a tiny scale-Y squash via `tweens.add` for some juice. `Sfx.play('pickup')` doubles as a small "hop" pop on takeoff.
- **HUD**: the jump button at `(GAME_W - 70, GAME_H - 70)` pulses softly when ready (yellow rim) and dims to grey while on cooldown.

### 14.8 Isometric pillars (lava biome, v0.5.1)

The lava-biome stone platforms (`'.'` tiles) and cliff walls (`'#'` tiles) were rebuilt as chunky isometric pillars instead of flat tile stamps:

**Stone platforms** are split across two depth bands so the player walks *on top of* the platform top but *in front of* the front/side faces when standing south:

- A single low-depth `topG` graphics (`depth = -996`) draws every platform's mottled top surface plus the warm orange rim highlight on lava-facing edges.
- A per-row `sidesG` graphics (`depth = (y+1)*TILE - 0.5`, mirroring the temple/cliff convention) draws each pillar's drop shadow, 12 px-tall front face (south-facing dark basalt with magma-crack highlights), 4 px-skewed right side face (medium tone, top-edge highlight), and 4 px-skewed left side face (deepest shadow tone). Side/front faces only render on edges adjacent to lava - interior edges between two platforms stay flat so connected platforms read as one chunky surface.

**Cliff walls** use the same idiom but at greater apparent height for stronger "you can't walk through this" reads:

- 22 px-tall front face (vs. the previous 16 px) with two-step magma-fissure rendering and stone-grain stippling.
- 5 px-skewed left + right side faces extend down across both the wall body and the front face, only on edges that face open ground.
- Top surface keeps the cooked basalt look with mineral grain + faint magma veins, but the warm rim highlight is now drawn only on edges that face open space (interior wall-to-wall edges stay flat so the border reads as one continuous cliff).

This replaces the previous flat-stamp wall convention with a true block-pillar look while staying entirely on the existing 50×40 tile grid.

### 14.9 Zoomed gameplay camera + UI camera (v0.5.4)

The gameplay camera was zoomed in (`GAME_ZOOM = 1.6`) so the player and brainrots feel more present and the visible world shrinks to a roughly 500 × 360 px slice — the level reads more *exploratory* (you only see a few pillars at once) instead of *strategic* (whole map at a glance). At the previous 1× zoom the lava biome's 2×2 pillars and emoji characters were too small to read at a glance.

To keep HUD readable at this zoom, GameScene now runs **two cameras**:

- **`this.cameras.main`** — gameplay camera, follows the player at `GAME_ZOOM = 1.6`, deadzone tightened from 80×60 to 50×40 (deadzones are in world units, so the on-screen lag stays the same as before zoom).
- **`this.uiCamera`** — second camera added on top, no scroll, zoom 1, transparent background. Renders HUD, joystick, jump button, skybox, and (for L1) the lighting darkness rendertexture.

Object routing happens in `setupCameras()` at the end of `create()`:

- Walks `this.children.list` and partitions every existing child: anything with `scrollFactorX === 0 && scrollFactorY === 0` goes to the UI camera (the gameplay camera is told to ignore it), everything else stays on the gameplay camera (the UI camera is told to ignore it).
- A scene-level `Phaser.Scenes.Events.ADDED_TO_SCENE` listener reapplies the same partition for objects added later (hazard sprites, scatter particles, etc.) on the next tick — long enough that any chained `.setScrollFactor(0)` has already run.
- `flashText()` partitions itself synchronously to avoid a 1-frame visual glitch on the level intro banner.

For Level 1 (temple), the lighting `darkness` rendertexture lives on the UI camera at 1×, so `updateLighting()` was rewritten to project player/torch/portal world coords to screen coords using `(world − cam.scrollX) * cam.zoom` before erasing the darkness. The light textures themselves are baked at `radius * GAME_ZOOM` so the lit footprint scales correctly with the zoomed gameplay camera (otherwise the player's torch radius would feel half as large at higher zoom).

### 14.10 Difficulty notes

- Lava-touch is the punisher; geysers are the surprise. Together they demand both careful pathing and twitch reflexes — a different rhythm from L1's timing puzzles, L2's pattern-dodging, and L3's sustained chase.
- The carry tail makes return trips significantly harder: with 5 brainrots in tow, walk speed is at `MIN_CARRY_SPEED = 70 px/s`, meaning ~2 tiles/sec, so even a brief lava detour drains hearts fast.
- Difficulty dials in code: `LAVA_TICK_MS`, `GEYSER_TELEGRAPH_MS`, `GEYSER_ERUPT_MS`, `GEYSER_COOLDOWN_MS`, `GEYSER_HIT_RADIUS`, `GEYSER_SPAWN_MS`, `GEYSER_SPAWN_JITTER`, `GEYSER_MAX_ACTIVE`, `GEYSER_KNOCKBACK`. Increase spawn frequency or hit radius to make the level meaner; raise `LAVA_TICK_MS` for a gentler "step into lava" penalty.

---

## 15. v0.5.5 — Roster refresh, per-level ultimates, Los Hackers boss tease

### 15.1 Refreshed level rosters

Real sprites replaced several emoji-only collectibles, and three of the previous "in-level" picks were promoted to ULTIMATE rewards (see §15.2). Final per-level rosters in `LEVELS[*].brainrotIds`:

| Level | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| 1 — Whirling Halls | Bombombini Gusini | **Chimpanzini Bananini** *(new)* | Meowl | **Boneca Ambalabu** *(now sprite)* | **Fragola La La La** *(new)* |
| 2 — Falling Sky | **Pancake and Syrup** *(new)* | **Cappuccino Assassino** *(now sprite)* | Tung Tung Tung Sahur | Frigo Camelo | **Ballerina Cappuccina** *(now sprite)* |
| 3 — Bloop's Domain | Tralalero Tralala | Abyssaloco | Bluberrinni Octopusini | Orcalero Orcala | **Trippi Troppi** *(new)* |
| 4 — Burning Below | Arcadragon | Dragon Cannelloni | Cocofanto Elefanto | Nuclearo Dinossauro | Frigo Camelo |

Wired sprite assets live in `assets/sprites/` (every roster slot now has a real PNG). The previous L1 Strawberry Elephant entry kept its 404'd `Strawberryelephant.png` placeholder — that has been replaced by the working `ULTIMATE_L1_Strawberryelephant.png` and the character is now an ULTIMATE reward (§15.2). Likewise for Bombardiro Crocodilo (L2) and Capitano Moby (L3): their working PNGs were moved into `ULTIMATE_L*_*.png` and the in-level slots filled by the new sprites above.

### 15.2 Per-level ULTIMATE rewards

Each level now has an `ultimateId` field (alongside `brainrotIds`) that points at a special "ultimate" character in `BRAINROT_REGISTRY`. Beating the level unlocks that character — currently **cosmetic only** (the unlock is announced and the character lights up in the WinScene grand-finale roster). Mechanical use is reserved for the future Los Hackers boss arena (§15.3).

| Level | Ultimate | Sprite |
|---|---|---|
| 1 | **Strawberry Elephant** (`lirili`) | `ULTIMATE_L1_Strawberryelephant.png` |
| 2 | **Bombardiro Crocodilo** (`bombardiro`) | `ULTIMATE_L2_Bombardiro_Crocodilo.png` |
| 3 | **Capitano Moby** (`capitano`) | `ULTIMATE_L3_Capitano_Moby.png` |
| 4 | **Hydra Dragon Cannelloni** (`hydra`, new) | `ULTIMATE_L4_Hydra_Dragon_Cannelloni.png` |

Registry entries for ultimates carry an `ultimate: true` flag for future code paths to key off of.

**Unlock flow** (`triggerWin`):

- `cumulative = allDeposited ⊕ deposited` is augmented with the level's `ultimateId` so the ultimate appears lit on subsequent screens.
- Two-banner celebration before the camera fade: `LEVEL X COMPLETE!` (1000 ms) → `ULTIMATE UNLOCKED: <NAME>` (1300 ms) → 700 ms fade → next-level / WinScene transition.
- The fade is delayed until after both banners have read so the unlock is never cut off by the transition.

### 15.3 Los Hackers — final-battle tease (lore-only)

The original north-star spec (`GAME_SPEC.md`) named the endgame boss **Georglini Dragonfruitini**. That was retired in favor of **Los Hackers** (`BRAINROT_REGISTRY.losHackers`, sprite `ULTIMATE_BATTLE_Los_Hackers.png`).

Currently **lore-only** — the actual fight scene is on the roadmap. Today the boss is surfaced via:

- `BRAINROT_REGISTRY.losHackers` with `boss: true` and a working sprite.
- `FINAL_BOSS_ID = 'losHackers'` constant exported alongside `LEVELS`.
- WinScene "ULTIMATE SQUAD" row (4 unlocked ultimates + 1 silhouetted boss slot tinted dark red, with a pulsing red glow ring and a "FINAL BATTLE — coming soon —" tagline).

When the boss arena scene is built, expected scope: a new `Phaser.Scene` (Level 5 / Boss Arena) that takes the player + their unlocked ultimate squad as a starting roster and pits them against Los Hackers in a multi-phase encounter. Mechanic design (phases, attacks, win condition, ultimate abilities) is a separate design pass — track in `docs/GAME_SPEC.md`.

---

## 16. v0.6.0 — Boss arena skeleton ("The Hatch Below")

The Los Hackers fight described in §15.3 is now an in-game scene. v0.6.0 ships the **kill-loop skeleton** so the fight is playable end-to-end with placeholder content; v0.6.1 adds the rest of the abilities, drones, and 3-phase attack patterns; v0.6.2 layers in the rumble/hatch/reveal cinematic and SFX.

### 16.1 Scope decisions (locked in via scoping pass)

| Decision | Choice |
|---|---|
| Gating | Progression-locked: only via the L4 portal after collecting all four ultimates. |
| Player kit | Carry mechanic stripped; 4-slot ability bar (Lirili / Bombardiro / Capitano / Hydra) replaces it. |
| Death | Restart the boss arena only — quick retry, no kicking back to L4. |
| Music | SFX only for v0.6; music deferred to a later polish pass. |
| Drones | In — drawn-in-code glitchy cubes that swarm between boss attacks (v0.6.1). |
| Attacks | Five total: Bite (P1) → Laser + Pixel Rain (P2) → Ring Pulse + Screen Glitch (P3). All v0.6.1. |
| Cinematic | 9.6 s intro (forest fade → rumble → crack → hatch → reveal → FIGHT banner) — v0.6.2. Skippable after beat 3. |

### 16.2 BossScene (v0.6.0)

A new `BossScene` (registered as scene key `'Boss'`) sits between `GameScene` and `WinScene` in the scene array:

- **Arena**: open, fixed-size 1280×960 (no tile map). Bounded by perimeter pseudo-3D trees. World physics bounds clamp the player.
- **Forest visuals**: skybox gradient, mottled grass floor, scattered ferns / grass tufts / mushrooms, and a decorative steel hatch at arena center where the boss "emerged" from.
- **Three-camera setup**: same `[skyCamera, cameras.main, uiCamera]` partitioning rule as `GameScene` (sky and UI at zoom 1; gameplay at `GAME_ZOOM = 1.6`).
- **Player**: identical pattern to `GameScene.createPlayer()` (invisible Text physics anchor + visible `🏃` emoji + ground shadow), minus the carry trail and jump mechanic.
- **Boss**: `Los Hackers` sprite (`ULTIMATE_BATTLE_Los_Hackers.png`) at arena center, idle bobbing, faces the player via `setFlipX`. `BOSS_HP_MAX = 1000`, `BOSS_DISPLAY_W/H = 280×180`. Body collision deals `BOSS_TOUCH_DAMAGE = 1` heart with the existing `INVINCIBLE_MS` iframes and a 240 px/s knockback.
- **HUD**: full-width boss HP bar at top (red, color-shifts to orange under 33%), hearts top-left, control hint bottom-left.
- **Slot 1 — Wail Shot (Lirili)**: bottom-right ability button styled like the `JUMP` button. Fires on `1` / tap. Auto-aims at the boss in v0.6.0 (cursor aim arrives in v0.6.1 with Bombardiro). Sonic-wave projectile drawn in `Graphics`, `WAIL_PROJ_SPEED = 480` px/s, `WAIL_PROJ_LIFE_MS = 1400` ms, `WAIL_DAMAGE = 25`, `WAIL_COOLDOWN_MS = 1500` with a radial cooldown overlay.
- **Slots 2–4 (Bombardiro / Capitano / Hydra)**: deferred to v0.6.1.

### 16.3 Routing

`GameScene.triggerWin()` for L4 now branches:

```
const requiredUltimates = Object.values(LEVELS).map(lv => lv.ultimateId).filter(Boolean);
if (requiredUltimates.every(id => cumulative.includes(id))) {
  this.scene.start('Boss', { allDeposited: cumulative });
} else {
  this.scene.start('Win', { allDeposited: cumulative });
}
```

A clean L1→L4 run always satisfies the gate (each level stitches its `ultimateId` into `cumulative` on completion). The fallback only triggers if a level was somehow cheat-skipped.

### 16.4 WinScene update

When `BossScene.handleVictory()` fades out, it routes back to `WinScene` with `bossDefeated: true`. The Win screen now branches on this flag:

- Title: `TRUE ENDING` (gold) instead of `YOU WIN!`.
- Background: warmer gold-to-purple gradient.
- Ultimate Squad row: the boss slot lights up like a regular unlocked ultimate (gold ring, full sprite, no silhouette tint).
- Tagline under the boss slot: `LOS HACKERS — DEFEATED —` (gold) replaces `FINAL BATTLE — coming soon —` (red).

### 16.5 Dev shortcut

For testing without running the full L1→L4 chain, the title screen has a **hidden `B` hotkey** that launches `BossScene` with all four ultimates and every collectible brainrot pre-stitched into `allDeposited` (so the post-victory `WinScene` shows a fully-lit roster). Not surfaced in the UI — boss access is meant to be progression-gated.

### 16.6 Roadmap into v0.6.1 / v0.6.2

- **v0.6.1a**: Phase 1 stalker + bite cone + Capitano dash. See §17.
- **v0.6.1b**: Phase 2 transition + Slot 2 (Bombardiro Pasta Bomb) + Pixel Rain attack. See §18.
- **v0.6.1c (this slice)**: Phase 3 transition at 33% HP + Ring Pulse attack + Slot 4 (Hydra Channel Beam) + drones (orbital glitch cubes between casts in P2/P3). See §19. *(Laser sweep and Screen Glitch deferred — Pixel Rain + Ring Pulse already provide ranged AOE coverage; further alternates can be added in a polish pass if playtest demands them.)*
- **v0.6.2**: 9.6 s cinematic intro (peaceful forest → rumble → crack → steel hatch opens → boss rises → `FIGHT!` banner), skippable after beat 3 (rumble starts). SFX hookups: rumble loop, hatch creak, boss roar, attack SFX, ability impact SFX. Final spec doc pass and a playtest tuning sweep.

---

## 17. v0.6.1a — "The fight becomes a fight"

The v0.6.0 boss was a static target dummy that shot back zero attacks. v0.6.1a turns the encounter into an actual fight by wiring the first boss attack and the first dodge tool. After this slice, every Phase 1 mechanic the player needs is in place; v0.6.1b/v0.6.1c can layer attacks on top without touching the core movement/aim/dodge feel.

### 17.1 Boss AI — Phase 1 stalker

The boss now has a 4-state machine driving its physics body (`updateBossAI` in `BossScene`):

| State | Velocity | Trigger | Duration |
|---|---|---|---|
| `idle` | `BOSS_MOVE_SPEED_P1 = 70` px/s toward the player | Default | Until cooldown elapses + player is within `BOSS_BITE_RANGE = 320` px |
| `telegraph` | 0 | Bite committed; locks `biteDirX/Y` toward player | `BOSS_BITE_TELEGRAPH = 700` ms |
| `lunge` | `BOSS_LUNGE_VELOCITY = 280` px/s along locked bite direction | Telegraph elapsed | `BOSS_BITE_LUNGE_MS = 220` ms |
| `recover` | 0 | Lunge elapsed | `BOSS_BITE_RECOVER = 520` ms; on exit sets `lastBiteAt = time` |

Total bite cycle: `700 + 220 + 520 = 1440` ms of "committed" time + `BOSS_BITE_COOLDOWN = 3800` ms before the next bite can be considered. So the player gets a clean ~3.8-second window after each bite to land Wail Shots on the recovering boss.

Boss also gains `setCollideWorldBounds(true)` so it can't be flanked off the arena.

### 17.2 The bite cone

During telegraph and lunge the boss draws a 120° wedge (`BOSS_BITE_HALF_ANGLE = π/3` either side, `BOSS_BITE_REACH = 175` px) anchored at its center, pointed in the locked bite direction:

- **Telegraph (700 ms)**: pulsing translucent red wedge with bright outline. Alpha builds from ~0.3 to ~0.6 across the 700 ms so the impact feels imminent.
- **Lunge (220 ms)**: solid bright red wedge with thicker outline. Boss snaps forward along the cone direction.
- **Damage check** (`checkBiteDamage`): each frame during the lunge state, a circle-vs-cone check fires at the player position (radius `BOSS_BITE_REACH + 24`, angular tolerance `BOSS_BITE_HALF_ANGLE`). If the player is in the cone *and* not iframing, they take `BOSS_BITE_DAMAGE = 2` hearts. The hit is one-shot per lunge (`biteHitDealt` flag) so a slow exit can't get bitten twice.
- **Knockback**: 360 px/s along the bite direction, with a 280 ms input lockout (`knockbackUntil`) so the player visibly gets thrown back.

The cone visual sits at depth `bossY - 1` so it reads as a ground decal under the boss sprite.

### 17.3 Slot 3 — Capitano Tidal Dash

`tryDash(time, dirX = null, dirY = null)` in `BossScene` is the player's primary dodge tool:

- **Cooldown**: `DASH_COOLDOWN_MS = 4500` (slightly longer than a full bite cycle, so the player can dash *out* of one bite but has to fight through the next).
- **Distance**: `DASH_DISTANCE = 110` px (~3.5 tiles). Direction is the explicit (`dirX`,`dirY`) when provided by the double-tap handler; otherwise falls back to `facingX/Y`. Defaults to up if there's no facing yet.
- **Duration**: `DASH_DURATION_MS = 220` ms — the dash and the lunge are roughly synced so a well-timed dash slips through the cone.
- **Iframes**: `DASH_IFRAMES_MS = 320` ms (outlasts the dash by ~100 ms so the very tail of the dash is still safe).
- **Input lockout**: `knockbackUntil = time + DASH_DURATION_MS` keeps `handleMovement` from overriding the dash velocity.
- **Visual**: blue tint (`0x66c8ff`) on the runner emoji + four staggered afterimage ghosts (45 ms apart, 280 ms fade).
- **Bind (keyboard)**: **double-tap** any movement key — `←`/`→`/`↑`/`↓` or `A`/`D`/`W`/`S` — within `DASH_DOUBLE_TAP_MS = 280` ms. Diablo-style; the dash fires in the direction of the tapped key, regardless of where the player was facing. OS auto-repeat keydowns (`event.repeat`) are ignored. After a successful dash the tap-tracker resets so a third quick tap won't immediately chain another dash.
- **Bind (touch / mouse)**: tap/click the on-screen Slot 3 button (uses last facing direction).

### 17.4 Ability bar refactor

`createAbilityBar` no longer hard-codes Slot 1; it now uses a `makeAbilitySlot(opts)` helper that takes the ult ID, position, hotkey label, ring/cooldown colors, last-use accessor, cooldown duration, and an `onActivate` callback. v0.6.1a registers two slots:

- **Slot 1** at `(GAME_W − 70, GAME_H − 70)`: Lirili Wail Shot, gold ring.
- **Slot 3** at `(GAME_W − 166, GAME_H − 70)`: Capitano Dash, blue ring, button label `2× arrow`.

`updateAbilityBar(time)` iterates `this.abilitySlots` and renders the radial cooldown for each. v0.6.1b just appends Slots 2 and 4 to the same array.

### 17.5 First-bite grace period

When `startBossReveal()`'s beat-3 callback fires (intro ends at t = 2200 ms), it sets `boss.lastBiteAt = time.now`. That guarantees the player gets a full `BOSS_BITE_COOLDOWN` (~3.8 s) of safe Wail Shot practice after the FIGHT banner before the first bite can telegraph.

---

## 18. v0.6.1b — "Pasta and Pixels"

v0.6.1a turned the boss into a fight; v0.6.1b makes that fight *evolve*. Cross 66% HP and Los Hackers shifts into Phase 2 — purple-tinted, picking randomly between the bite cone and a new Pixel Rain attack — and the player gains the Pasta Bomb (Slot 2) to keep up.

### 18.1 Phase system + Phase 2 transition

Boss state gains `phase: 1 | 2`, `phaseShiftUntil`, and `attackKind`. The transition is HP-gated (`maybeEnterPhase2` runs after every successful `applyBossDamage`):

- Trigger: `bossHp ≤ BOSS_PHASE_2_HP_PCT × BOSS_HP_MAX` (660 / 1000 HP).
- Lockout: `PHASE_SHIFT_INVULN_MS = 1500` ms during which:
  - Boss takes no damage (`applyBossDamage` early-returns).
  - Player has iframes (`invincibleUntil`) so an in-flight bite can't sneak a kill mid-cinematic.
  - Boss velocity is zeroed; current bite/rain is cancelled and flushed to `recover`.
- Visual cue: violet camera flash (`cameras.main.flash(420, 130, 70, 200)`), 620 ms shake, 800 ms boss hit-flash, `PHASE 2 — PIXEL STORM` banner, plus a *permanent* lavender tint (`0xd0a8ff`) on the boss sprite for the rest of the fight.
- Bite cooldown is reset on entry, giving the player a beat to read the new state before the chooser fires the first P2 attack.

### 18.2 Attack chooser

`updateBossAI`'s `idle` state now defers to `chooseNextAttack(time, dist)` once the bite cooldown elapses:

- **Phase 1**: bite-only, range-gated. If the player is past `BOSS_BITE_RANGE` (320 px), the boss continues stalking.
- **Phase 2**: weighted random pick. `P2_BITE_PROBABILITY = 0.50`; if bite is rolled but the player is out of range, fall back to Pixel Rain. Net effect: ~50% of P2 cycles become Rain casts, more if the player kites.

The `recover` state's duration is now per-attack: `RAIN_RECOVER_MS = 700` after a Rain cast vs. `BOSS_BITE_RECOVER = 520` after a bite, since the rain cast is longer and the post-cast vulnerability window can be a touch shorter without feeling unfair.

### 18.3 Pixel Rain attack

A Phase-2-only attack that scatters falling pixels across the arena with telegraphed landing zones.

- **Cast**: boss enters `biteState = 'casting'`, `attackKind = 'rain'`. Fully rooted for the cast.
- **Spawn**: `RAIN_PIXEL_COUNT = 14` pixels staggered across `RAIN_TOTAL_MS = 3500` ms with ±60 ms jitter so the rain feels chaotic.
- **Targeting**: each pixel picks between a player-biased landing spot (current player position ±220 / ±180 px) and a fully random spot (50/50). Half the rain stalks the player; half forces them to keep moving.
- **Telegraph**: each landing spot draws a pulsing red ring (`RAIN_PIXEL_RADIUS = 38` px) for `RAIN_PIXEL_FALL_MS = 1400` ms before the pixel actually impacts. Pixel falls from 320 px above with `Cubic.easeIn` easing and a 540° rotation.
- **Impact**: bright yellow expanding ring on hit. Damage is sampled at the moment of impact (not at spawn) so a player who stepped out is safe.
- **Damage**: `RAIN_PIXEL_DAMAGE = 1` heart per pixel, full `INVINCIBLE_MS` iframes after a hit (so consecutive pixels don't stack).
- **End condition**: cast ends after every pixel has both spawned and impacted (`RAIN_TOTAL_MS + RAIN_PIXEL_FALL_MS` from cast start).

### 18.4 Slot 2 — Bombardiro Pasta Bomb

`tryFireBomb(time)` is the player's first AOE option. v0.6.1b ships an auto-aim variant; v0.6.1c will add cursor / touch aim.

- **Cooldown**: `BOMB_COOLDOWN_MS = 5500` (~3.7× a Wail Shot interval). Long enough that bombing is a deliberate choice, not spam.
- **Damage**: `BOMB_DAMAGE = 100` (4× `WAIL_DAMAGE`) within `BOMB_RADIUS = 110` px.
- **Travel**: bomb arcs from the player to the boss over `BOMB_TRAVEL_MS = 720` ms. Driven by an `onUpdate` tween on a scratch object (`{ t: 0 → 1 }`) so x is linear and y is `linear baseline + parabola peak BOMB_ARC_HEIGHT (180 px) at t = 0.5`. Bomb sprite is the 💣 emoji rotated through 720° during the arc.
- **Telegraph**: on landing, spawns a pulsing red warning ring (radius `BOMB_RADIUS`) for `BOMB_WARNING_MS = 800` ms. Long enough that a paying-attention boss could in theory dodge — but Los Hackers AI doesn't move during a bite/cast, so the warning is mostly to sell the threat to the player.
- **Detonation**: bright orange-yellow expanding ring + 280 ms shake. Damages the boss only in v0.6.1b (drone group AOE comes in v0.6.1c).
- **Bind**: `keydown-TWO` and the on-screen Slot 2 button.

### 18.5 Ability bar refactor

Three slots in a right-anchored row at `(GAME_W − 70 − slotSpacing × i, GAME_H − 70)` with `slotSpacing = 96`:

| Slot | Position offset | Ult | Bind | Ring color |
|---|---|---|---|---|
| 3 | `−192` | Capitano Dash | Double-tap `←/→/↑/↓` or `A/D/W/S` | `0x66c8ff` (blue) |
| 2 | `−96`  | Bombardiro Pasta Bomb | `2` / button tap | `0xff8a3a` (orange) |
| 1 | `0`    | Lirili Wail Shot | `1` / button tap | `0xffe066` (gold) |

`makeAbilitySlot(opts)` is unchanged — v0.6.1c will append Slot 4 to the same `this.abilitySlots` array at offset `−288`.

### 18.6 HUD hint

Updated to reflect three abilities: `1: Wail   ·   2: Pasta Bomb   ·   2× arrow / WASD: Dash   |   dodge red zones!` (Replaced again in §19.6 once Slot 4 lands.)

---

## 19. v0.6.1c — "System Critical"

v0.6.1b makes the fight evolve at 66% HP; v0.6.1c finishes the rhythm by escalating once more at 33% HP and giving the player a fourth tool to match. The full encounter now has three distinct beats — Stalker (P1), Pixel Storm (P2), System Critical (P3) — each with its own attack mix, banner, screen treatment, and boss tint. Drones add post-cast pressure during P2/P3 so the player can't just zone out and Wail-Shot through the long-form attacks.

### 19.1 Phase 3 — "System Critical"

The phase pipeline becomes `applyBossDamage` → `maybeEnterPhase2` → `maybeEnterPhase3`, both checked in order so a single huge hit (e.g. a fully-charged Pasta Bomb) can cross both thresholds and trigger both cinematics in sequence.

| Constant | Value | Notes |
|---|---|---|
| `BOSS_PHASE_3_HP_PCT` | `0.33` | HP fraction that triggers P3 |
| `PHASE_SHIFT_INVULN_MS` | `1500` (reused) | Player iframes + boss damage immunity during the shift |

`enterPhase3(time)` mirrors `enterPhase2` but with a deeper-color treatment:

- **Camera**: 500 ms crimson flash (`220, 30, 30`) + 800 ms shake (amp `0.028`).
- **Banner**: `flashText('PHASE 3 — SYSTEM CRITICAL', 1900)`.
- **Boss tint**: `0xff6868` (crimson). `updateBoss(time)` now picks tint based on `boss.phase` (P3 → crimson > P2 → lavender > none).
- **Cleanup**: `cancelBossAttack(time)` (new helper) flushes any in-progress bite/rain/pulse, clears `bossBiteCone` and `bossPulseGfx`, and zeros boss velocity.
- **Cooldown reset**: `boss.lastBiteAt = time` so the player gets a clean beat after the cinematic before the first P3 attack lands.

### 19.2 Ring Pulse — Phase 3 attack

A telegraphed shockwave attack that punishes both close-range parking and lazy long-range kiting. Boss roots in `casting` state and emits 3 staggered pulses from its center; each is an expanding annulus that damages the player when the wavefront crosses them.

| Constant | Value | Notes |
|---|---|---|
| `RING_PULSE_COUNT` | `3` | Pulses per cast |
| `RING_PULSE_DELAY` | `600` ms | Time between pulses |
| `RING_PULSE_TELEGRAPH` | `700` ms | Warning before the first pulse fires |
| `RING_PULSE_DURATION` | `1200` ms | Time for each pulse to expand to max |
| `RING_PULSE_MAX_R` | `540` px | Radius at end of expansion |
| `RING_PULSE_BAND` | `30` px | Hit-band thickness (annulus) |
| `RING_PULSE_DAMAGE` | `1` heart | Per pulse-hit |
| `RING_PULSE_RECOVER_MS` | `800` | Boss vulnerable window after the cast |

Implementation:

- `startRingPulse(time)` sets `biteState = 'casting'`, `attackKind = 'pulse'`, queues the first pulse for `time + RING_PULSE_TELEGRAPH`.
- `updateRingPulse(time)` spawns each pulse at `RING_PULSE_DELAY` intervals, runs damage checks, and transitions to `recover` once all pulses have fired and finished expanding.
- Damage check: per pulse, `Math.abs(d - r) <= RING_PULSE_BAND` where `d` is player distance from origin and `r` is current radius. Each pulse can damage the player at most once (`hit` flag).
- `drawRingPulses(time)` renders each pulse as a thick low-alpha outer band + a thin sharp inner line, fading as `r` grows.
- **Counter-play**: dash radially through the wavefront, or stand outside `RING_PULSE_MAX_R`, or position to catch the band edge during the player's invuln window.
- **Visuals own a separate graphics object** (`bossPulseGfx`) so a phase-shift-mid-cast cancellation cleanly clears pulses without colliding with the bite cone's `clear()`.

### 19.3 Attack chooser — Phase 3 weights

`chooseNextAttack(time, distToPlayer)` is now phase-branched:

| Phase | Logic |
|---|---|
| 1 | Bite-only, range-gated. |
| 2 | `Math.random() < P2_BITE_PROBABILITY (0.50)` → bite (range-gated; falls back to rain if out of range), else rain. |
| 3 | Roll `[0..1]`: `< 0.40` → bite (range-gated, falls through if kiting), `< 0.70` → rain, else ring pulse. (`P3_BITE_PROBABILITY = 0.40`, `P3_RAIN_PROBABILITY = 0.30`.) |

Recover window now branches on `attackKind`: `'rain'` → `RAIN_RECOVER_MS = 700`, `'pulse'` → `RING_PULSE_RECOVER_MS = 800`, else `BOSS_BITE_RECOVER = 520`.

### 19.4 Drones — orbital glitch cubes

Spawned at the start of the recover window after a long cast (rain or pulse) in Phase 2 or Phase 3. Each drone independently orbits the boss for ~1.5 s, then locks a dash vector at the player's then-current position and lunges. Dies on any hit; deals 1 heart on player contact during dash.

| Constant | Value |
|---|---|
| `DRONE_HP` | `1` |
| `DRONE_CONTACT_DAMAGE` | `1` |
| `DRONE_SIZE` | `22` px |
| `DRONE_LIFETIME_MS` | `3500` (auto-fade) |
| `DRONE_ORBIT_MS` | `1500` (orbit window) |
| `DRONE_DASH_MS` | `900` |
| `DRONE_ORBIT_RADIUS` | `95` px from boss |
| `DRONE_ORBIT_SPEED` | `1.4` rad/s |
| `DRONE_DASH_SPEED` | `280` px/s |
| `DRONE_SPAWN_COUNT` | `3` per spawn batch |
| `DRONE_MAX_ALIVE` | `5` (hard cap) |

Spawn flow:

- `updateBossAI` recover branch checks `boss.phase >= 2 && _droneWaveSpawnedAt !== biteStateStart && (attackKind === 'rain' || attackKind === 'pulse')`. The `_droneWaveSpawnedAt` timestamp matches the recover-start so we never double-spawn for the same recover window.
- `spawnDroneWave(time)` distributes `DRONE_SPAWN_COUNT` drones evenly around the boss with light angular jitter and a ±200 ms dash-delay jitter so the wave reads as a swarm, not a synchronized strike.

State machine per drone (`orbit | dash | dead`):

- **Orbit**: `d.x/y` track around the boss at `DRONE_ORBIT_RADIUS`; transitions to dash after `DRONE_ORBIT_MS ± 200` ms.
- **Dash**: lock a unit vector toward player at the moment of commit; player can sidestep. Player-contact check uses `Math.hypot < DRONE_SIZE * 0.55 + 14`. After `DRONE_DASH_MS` the drone fades cleanly even if it missed.
- **Dead** (auto on lifetime, AOE, beam, wail, contact): a quick white pop tween, then `g.destroy()`.

Visual: a 22 px chromatic-glitch cube with red/cyan offset ghosts, a flicker-modulated core (lavender in orbit → red in dash), an inner hatch outline, and a direction tick during the dash.

Drone-vs-attack interactions:

- **Wail Shot**: `updateProjectiles` runs a per-drone overlap check after the boss check; one wail shot can clear up to one drone (the projectile is killed on the kill).
- **Bombardiro AOE**: `damageDronesAt(tx, ty, BOMB_RADIUS)` is called from `detonateBomb` before the boss damage check.
- **Hydra beam**: line-vs-circle test (player→boss segment, half-width `HYDRA_BEAM_HALF_W`) on every tick.
- **Player contact**: `applyDroneContactDamage(time)` mirrors the rain-impact contract — gates on iframes, applies knockback + screen shake, breaks Hydra channel.

### 19.5 Slot 4 — Hydra Channel Beam

A hold-to-channel ranged DPS option. The player roots in place; a cyan beam streams from the player toward the boss and ticks damage every `HYDRA_TICK_MS`. The beam also auto-clears any drone whose center is within `HYDRA_BEAM_HALF_W` of the line segment, so it doubles as crowd control during P3.

| Constant | Value | Notes |
|---|---|---|
| `HYDRA_COOLDOWN_MS` | `9000` ms | Counted from channel-end, not channel-start |
| `HYDRA_MAX_DURATION` | `3000` ms | Hard cap; auto-ends |
| `HYDRA_TICK_MS` | `100` ms | Damage tick frequency (10 ticks/sec) |
| `HYDRA_DAMAGE_PER_TICK` | `8` | 80 dps total |
| `HYDRA_BEAM_HALF_W` | `12` px | Half-width for line-vs-circle hit checks (drones) |

Channel breaks on:

- **Damage taken** (`applyContactDamage`, `applyBossBiteDamage`, `applyRainImpact`, `applyRingPulseHit`, `applyDroneContactDamage`).
- **Dash** (`tryDash` calls `endHydra()` so an active dodge always wins).
- **Key-up / pointer-up** (Slot 4 keyboard `4` and the on-screen Slot 4 button).
- **Max duration** (`HYDRA_MAX_DURATION`).
- **End conditions** (`handleGameOver`, `handleVictory`) so the beam graphics never linger on the post-fight screen.

`tryStartHydra()` gates on cooldown + unlock state (`unlockedUltimates.has('hydra')`); `endHydra()` records `lastHydraEndAt` (this is what the cooldown ring reads) and clears `hydraBeamGfx`. `updateHydra(time)` runs the tick + visual every frame; `applyHydraTick(time)` writes damage directly (bypassing `applyBossDamage`'s shake/damage-number — too jittery at 10 ticks/sec) but still runs phase-shift checks via `maybeEnterPhase2/3`.

`drawHydraBeam(time)` renders three concentric line layers (wide low-alpha halo + medium cyan + thin white core) plus pulsing sparkle clusters at both ends. The pulse phase uses `Math.sin(time / 50)` so the beam visibly throbs at ~3 Hz.

`handleMovement(time)` rooted-while-`hydraActive` short-circuits to `setVelocity(0, 0)` — this is the "trade movement for damage" contract.

### 19.6 Ability bar — full 4-slot layout

`createAbilityBar` now registers four slots, right-anchored:

| Slot | x-offset from `GAME_W − 70` | Brainrot | Hotkey | Color |
|---|---|---|---|---|
| 4 | `−288` | Hydra Channel Beam | `hold (4)` / press-and-hold button | `0x66f0ff` (cyan) |
| 3 | `−192` | Capitano Dash | Double-tap `←/→/↑/↓` or `A/D/W/S` | `0x66c8ff` (blue) |
| 2 | `−96`  | Bombardiro Pasta Bomb | `2` / button tap | `0xff8a3a` (orange) |
| 1 | `0`    | Lirili Wail Shot | `1` / button tap | `0xffe066` (gold) |

`makeAbilitySlot(opts)` gains an optional `onRelease` callback; when supplied it's wired to the container's `pointerup` and `pointerupoutside` events (NOT the global `input.on('pointerup')`, which would also fire on unrelated screen taps and break the Hydra channel unexpectedly).

Keyboard:

- `keydown-FOUR` → `tryStartHydra()` (`event.repeat` is ignored to prevent OS auto-repeat from firing the start over and over).
- `keyup-FOUR` → `endHydra()`.

### 19.7 HUD hint

Updated to all four abilities: `1: Wail · 2: Bomb · 2× arrow: Dash · hold 4: Hydra Beam   |   dodge red zones!`

### 19.8 Update loop additions

`update(time, delta)` (the param is now `delta` not `_delta` because drones need it for movement integration):

```
handleMovement → updateProjectiles → updatePlayerInvincibilityVisual →
updateBossAI → checkBiteDamage → updatePixelRain → updateRingPulse →
updateDrones(time, delta) → updateHydra(time) → updateBoss → drawBiteCone →
drawRingPulses → updateAbilityBar → updateBossHud → updateDepthSort
```

The `gameOver` early-out branch also calls `drawBiteCone` and `drawRingPulses` so any in-flight visuals decay cleanly into the death/victory freeze.

### 19.9 Cancellation helper

`cancelBossAttack(time)` is a single source of truth for "flush whatever the boss is doing back to a clean recover" — used by `enterPhase2` and `enterPhase3`. It:

1. Sets `biteState = 'recover'`, `biteStateStart = time`.
2. Clears `attackKind` and the active `pulses[]` array.
3. Clears `bossBiteCone` and `bossPulseGfx` graphics.
4. Zeroes the boss physics body velocity.

This replaces the inline cleanup that lived in v0.6.1b's `enterPhase2` and prevents the two phase-transitions from drifting out of sync.

---

## 20. Future: persistent progress + level select (NOT YET BUILT)

A backlog item we discussed but deferred. Captured here so it's easy to pick up later.

### 20.1 Why

Today the title screen always launches Level 1, and the player has to clear levels in sequence within a single sitting. If the page is refreshed mid-run, all progress is lost. For family/share-to-relatives mode this is rough; replaying L1 every time you want to test L4 or the boss is also a developer pain.

### 20.2 What we'd build

1. **LocalStorage save state** keyed to a single slot:
   ```js
   {
     lastClearedLevel: 0..4,    // 0 = nothing cleared yet
     bossDefeated: boolean,
     unlockedUltimates: string[],   // mirrors current in-memory state
     lastUpdatedAt: number,
   }
   ```
   Read on `TitleScene.create()`, written on level-complete modal "Proceed" and on boss victory.
2. **Title screen reads this state** and renders all 4 level buttons + a Boss button conditionally:
   - Locked levels (`id > lastClearedLevel + 1`) appear dimmed and non-tappable, possibly with a small lock icon.
   - Cleared levels stay tappable for replay (so a player who got stuck on L3 can revisit L1 for fun).
   - Boss button only appears once `lastClearedLevel >= 4`.
3. **Reset progress button** somewhere unobtrusive (e.g. tiny "↻ reset" link at the bottom of the title screen) so dev / family members can clear state without opening DevTools.
4. **Resume vs replay UX**: when a level is replayed, prior `allDeposited` is loaded from save state (so previously-collected ultimates stay unlocked in the ability bar). The replay itself doesn't re-grant rewards.

### 20.3 What changes about the dev Boss button

The temporary "⚡ BOSS (dev)" pill button shipped in v0.6.1d (see §21) is a stand-in for the real Boss button. When persistent progress lands, that button gets repurposed:
- Visible when `lastClearedLevel >= 4` (real progression).
- Hidden otherwise (no more dev pill on the title screen).

The grep marker `// TEMPORARY: dev shortcut to the boss fight.` in `TitleScene.create()` is the find-and-remove anchor.

### 20.4 Open design questions

- Multiple save slots? (Probably no — keep it simple, single slot per browser).
- Cloud sync? (Definitely no for the descoped build).
- How to handle a save that references brainrots / ultimates that no longer exist after a roster refresh? (Probably defensive filter on read: drop unknown ids, log a console warning).

---

## 21. v0.6.1d — Touch UX hardening

A small but important fix pass after testing on iPad / iPhone via the live GitHub Pages URL surfaced three issues at once. Shipped together because they share a root cause (CSS viewport math) and the dev workflow.

### 21.1 Jump button hit area was offset on iOS

**Symptom:** "Tapping the JUMP button center doesn't register, but tapping the upper-left works." Player had to physically aim above-and-left of the visible button.

**Root cause:** `#game-container { height: 100vh; }` in `style.css`. iOS Safari's `100vh` is the **largest** possible viewport (when browser chrome is auto-hidden), not the **current** viewport. With `align-items: center` flexbox, the canvas was centered in a container taller than the visible area, so its on-screen position didn't match what `getBoundingClientRect()` reported. Phaser's pointer-coord translation used the stale rect, shifting all touch coords.

**Fix:**
1. `style.css`: `100vh` → `100dvh`, plus `position: fixed; inset: 0` on `#game-container` so it always anchors to the visible viewport regardless of chrome state.
2. `index.html`: added `viewport-fit=cover` to the viewport meta so future safe-area work has a clean slate.
3. `game.js`: in both `GameScene.create()` and `BossScene.create()`, listen for `window` `resize` + `orientationchange` and call `this.scale.refresh()`. Cleanup on scene `SHUTDOWN`. Eliminates stale-bounds drift when iOS Safari chrome shows / hides mid-play.

### 21.2 "BOSS (dev)" temporary title-screen button

**Symptom:** Touch devices have no keyboard, so the existing `keydown-B` shortcut on the title screen was unreachable. Replaying L1→L4 every time you want to test the boss is brutal on iPad.

**Fix:** Added a small dim pill button in the bottom-right of the title screen labeled `⚡ BOSS (dev)` with the same payload as the keyboard shortcut (all 4 ultimates pre-unlocked, all collectible brainrots stitched in for the WinScene roster). Tagged with a `// TEMPORARY:` comment so it's trivial to find and remove once persistent progress (§20) lands and the real Boss button takes over.

### 21.3 Why this slice was small but worth a section

The hit-offset bug had been silently degrading touch input for the entire iPad playtest. Once it's fixed, every other touch button feels meaningfully more responsive (not just JUMP). Future touch work (haptics, sound feedback, etc.) should assume this fix is in place; without it, no amount of button polish would have helped.

---

*End of GAME_SPEC_DESCOPED.md*
