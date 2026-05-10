# Level 1 — The Whirling Halls (Vertical Slice)

**Biome**: Ancient Italian-renaissance temple/dungeon, half-flooded with low torchlight.
**Signature hazard**: Swinging axe pendulums.
**Target completion time**: 6–8 minutes (skilled), 10–12 minutes (first-time).
**Brainrots**: 5 (Bombombini Gusini, Brr Brr Patapim, Trippi Troppi, Boneca Ambalabu, Lirili Larila).

---

## 1. Mood & Aesthetic

- **Lighting**: torchlight (warm), shafts of moonlight from broken ceilings (cool), high contrast
- **Palette**: ochre stone, teal water, gold trim, dark shadowed corners
- **Audio**: dripping water, distant temple bell, baroque-string chase music, wood-creak on axes
- **Vibe**: serious dungeon-crawler aesthetic ironically populated by absurd brainrots

---

## 2. Macro Map

```
                       ┌──────────────────────┐
                       │   D. THE GAUNTLET    │
                       │   (Lirili Larila)    │
                       │   Boss-of-level      │
                       └─────────▲────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                         │
   ┌────────┴────────┐                       ┌────────┴────────┐
   │  C. WATER ROOM  │                       │  B. AXE PIT     │
   │  (Boneca + 1up) │                       │  (Brr Brr +     │
   │                 │                       │   Trippi Troppi)│
   └────────▲────────┘                       └────────▲────────┘
            │                                         │
            └─────────────────┬───────────────────────┘
                              │
                     ┌────────┴────────┐
                     │   A. ENTRANCE   │
                     │   (Bombombini)  │
                     │   + Tutorial    │
                     └────────▲────────┘
                              │
                     ┌────────┴────────┐
                     │      BASE       │
                     │   (start/portal)│
                     └─────────────────┘
```

Player must visit A, B, C, then D. Returns to BASE between regions to drop off carried brainrots (or risk losing all if hit).

---

## 3. Section-by-Section Design

### Section 0 — BASE (Start/Portal)

- **Layout**: Open circular plaza, ~10m diameter, glowing rune circle in the center
- **Function**: Spawn point. Carry brainrots into the rune circle to "deposit." Portal activates here once all 5 deposited.
- **Visual cue**: Rune circle glows brighter as more brainrots are deposited (1/5, 2/5...). At 5/5, beam of light shoots up and the portal forms.
- **Decoration**: Statues of all 5 brainrots in shadow form around the perimeter — they "light up" as you collect them.

---

### Section A — ENTRANCE (Tutorial + Bombombini Gusini)

- **Length**: ~30 seconds
- **Mechanics introduced**: walking, jumping, picking up, depositing
- **Hazards**: None (or one slow-moving small axe to teach dodge)
- **Brainrot**: **Bombombini Gusini** stands honking near a broken column 15m from base
- **Tutorial prompts** (fade-in HUD text):
  1. "Use the joystick to walk." (when starting)
  2. "Tap A to jump." (when first ledge appears)
  3. "Walk into a brainrot to pick them up." (near Bombombini)
  4. "Carry them back to your base!" (after pickup)
  5. "Tap C to deposit at the rune circle." (at base)

---

### Section B — AXE PIT (Brr Brr Patapim + Trippi Troppi)

- **Length**: ~90 seconds
- **Layout**: Long narrow corridor with 6 swinging axes of increasing speed and 2 fixed pillars for cover
- **Hazards**:
  - Swinging axe (slow): 90° arc, 3-second period
  - Swinging axe (medium): 120° arc, 2-second period
  - Swinging axe (fast): 180° arc, 1.5-second period
  - Fixed spike trap (telegraphed by floor crack)
- **Brainrots**:
  - **Trippi Troppi** skitters in a small alcove halfway through (after axe 3)
  - **Brr Brr Patapim** hangs upside-down at the end of the corridor (above axe 6) — requires a double-jump
- **Risk pattern**:
  - Player must time movement between axe swings
  - Carrying brainrots = slower → harder to time
  - Getting hit = scatter; brainrots fly out and respawn at random spots in the corridor (penalty: re-collect)
- **Recovery**:
  - Hidden 1-up brainrot floats above pillar 2 (requires a double-jump from pillar top)

---

### Section C — WATER ROOM (Boneca Ambalabu + Hidden 1-up)

- **Length**: ~90 seconds
- **Layout**: Large flooded chamber (waist-deep water slows player by 25%), stone islands rising from the water, broken statues
- **Hazards**:
  - Two pendulum axes that pass low (forces ducking — auto-duck on sprint button)
  - Water current that pushes player away from one island (timing-based traversal)
- **Brainrot**: **Boneca Ambalabu** sits creepily on the central island, doesn't move
- **Hidden secret**:
  - Behind a waterfall on the right wall is a 1-up brainrot — visual cue is a faint pink glow through the water
- **Lighting**: Single shaft of moonlight on the central island, eerie reflection rippling on water

---

### Section D — THE GAUNTLET (Lirili Larila chase)

- **Length**: ~120 seconds
- **Layout**: Long upward-spiraling staircase room with 8 axes, 3 collapsing steps, 2 fire-brazier lines, ending at a balcony
- **Hazards**:
  - Dense axe field (fastest axes in the level)
  - Collapsing stones — must keep moving forward, can't stop
  - Brazier flames (wide, shallow damage zone, telegraphed by sparks before whoosh)
- **Brainrot**: **Lirili Larila** runs ahead of the player, glances back, taunts
  - Player must catch up to grab — if you stop, Lirili stops; if you run, Lirili runs
  - At the top of the staircase, Lirili gets cornered on the balcony — touch to grab
- **Reward**: Cinematic of all 5 statues at base lighting up, then portal materializes
- **Final return**: Player must take Lirili Larila (and any other carried) back through D-C-B-A safely. Sections **don't reset** — same hazards, but the reward is the climax.

---

## 4. Hazard Specs

### Axe Pendulum

```
        ┌──┐
        │  │  <- wooden ceiling mount
        │  │
        │  │
       ╱│  │╲
      ╱ │  │ ╲   <- chain swings ±60° to ±90°
     ╱  └──┘  ╲
    ╱   /\\\   ╲
   ╱   ////\    ╲
        BLADE   <- 1.2m wide steel blade
```

| Parameter | Slow | Medium | Fast |
|---|---|---|---|
| Period (one full back-and-forth) | 3.0s | 2.0s | 1.5s |
| Arc | ±45° | ±60° | ±90° |
| Damage on hit | 1 life + scatter all carried | same | same |
| Telegraph | continuous swing — visual + creak audio | same | same |
| Counter | walk under during apex (when blade highest) | same — requires sprint | same — requires sprint + precise timing |

### Spike Trap

- Floor cracks visible 1.5s before activation
- Spikes pop up for 1.5s, then retract for 2s
- Hit = -1 life + scatter

### Brazier Flames (Section D only)

- Horizontal flame line, 4m long, 1m tall
- Cycle: 2s off → 0.3s sparks (warning) → 1.5s flame → repeat
- Hit = -1 life + scatter

---

## 5. Brainrot Placement Rules

- **Always visible from a meaningful vantage point** (no fully hidden mandatory ones — only optional 1-ups are hidden)
- **Each requires the section's mechanic** to reach (encourages mastery)
- **Voice idle**: each brainrot loops a soft idle voice clip — the player should be able to hear them and head toward the sound

---

## 6. The Carry-Stack System

### Visual

- Brainrots stack on top of player's head (or back), one per pickup
- Stack max visible: 5 (whole level worth)
- Each brainrot has an idle bobble animation while stacked (they're alive!)

### Behavioral

| Action | Effect |
|---|---|
| Pick up (walk into brainrot) | Stack +1; speed -0.3 m/s; jump unaffected |
| Deposit at base | Stack -all; brainrot statue at base lights up |
| Take damage (axe, spike, flame) | All carried brainrots scatter to random anchor points within current section; lose 1 life |
| Drop voluntary (long-press C) | Drops the top brainrot at player's feet; can be re-picked |
| Death (lives = 0) | Restart level; all collected (deposited) brainrots stay; carried ones reset |

### Scatter Logic

- When hit, all carried brainrots fly outward in random directions in an arc
- They land at predefined "scatter anchors" (3–5 per section) — small floor markers in the level
- A short "kawaii panic" animation plays as they re-settle at the anchor
- Player can see the scatter trajectory to track where they went

---

## 7. Pacing & Tension Curve

```
Tension
  ▲
  │                                          ████
  │                                        ██    ██
  │                                     ███        ███
  │                          ████    ███
  │                       ██    ████
  │              ███    ██
  │           ███   ███
  │       ███
  │   ███
  │██
  └─────────────────────────────────────────────────▶ time
   BASE   A      B          C          D       PORTAL
```

- Section A: **0–10% tension** (tutorial)
- Section B: **40–60%** (first real challenge)
- Section C: **30–50%** (slower, atmospheric, secret-finding)
- Section D: **80–100%** (chase, climax)
- Final return run: **70–90%** (relief mixed with tension — don't drop everything now!)

---

## 8. Lives & Checkpoints

- Lives: 3 at level start
- **Soft checkpoints**: Each time a brainrot is **deposited at base**, that's effectively a checkpoint — the deposit is permanent. Death only resets carried brainrots, not deposited ones.
- Hidden **1-up brainrots**:
  - 1 in Section B (above pillar 2)
  - 1 in Section C (behind waterfall)
  - 1 in Section D (visible on a side ledge requiring sprint+jump)

---

## 9. Audio per Section

| Section | Music intensity | Key SFX |
|---|---|---|
| BASE | low ambient drone | rune-glow shimmer |
| A | melodic tutorial | bombombini honks |
| B | building strings | axe creak, swoosh, pillar drip |
| C | dreamy underwater motif | water lap, distant Boneca whisper |
| D | full-on chase orchestral | axe storm, brazier whoosh, Lirili "tic-toc" loop |
| Portal forms | swelling triumphant | rune fanfare |

---

## 10. Acceptance Criteria (Level 1)

A new player can:

- [ ] Spawn at base with 3 lives
- [ ] Walk through Section A and complete the tutorial deposit
- [ ] Reach Section B, dodge axes, collect Trippi Troppi and Brr Brr Patapim
- [ ] Reach Section C through water, collect Boneca Ambalabu, optionally find the 1-up
- [ ] Reach Section D, chase Lirili Larila through the gauntlet, grab them on the balcony
- [ ] Return to base, deposit all 5
- [ ] See the portal activate cinematically
- [ ] Step into the portal and trigger "Level Complete"
- [ ] All collected brainrots persist in the codex after restart

---

## 11. Greybox Build Plan

Asset-light playable version to validate the design before art pass:

1. Replace player + brainrots with capsule/cube primitives in distinct colors
2. Build all sections as solid blockout meshes (Probuilder)
3. Use Cinemachine virtual cameras already to lock in framing
4. Implement axe prefab with `HingeJoint` swinging dummy
5. Implement scatter logic with empty `Transform` anchors
6. Tune speeds, timings, and pacing in greybox **before** any art is made

---

## 12. Stretch Polish (post-VS)

- Cracked stone shaders that catch torchlight dynamically
- Falling dust particle effects on axe swings
- Avatar's hair/cloth physics (Magica Cloth or Unity's built-in)
- Lirili Larila's pocket-watch ticking syncs with chase music BPM
- Ambient bat flutters across the screen when player passes certain spots

---

*End of LEVEL_1_AXES.md*
