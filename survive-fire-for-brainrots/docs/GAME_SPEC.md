# Survive Fire for Brainrots — Game Specification

**Version**: 0.1 (Initial Spec)
**Last updated**: 2026-05-09
**Status**: Pre-production

---

## 1. Elevator Pitch

A 3D third-person mobile obstacle-course collect-a-thon where the player runs, dodges, and gathers iconic Italian TikTok "brainrot" characters across four chaotic biomes — temple of swinging axes, meteor wasteland, Bloop-haunted ocean, and lava platforms — before facing the ultimate boss, **Georglini Dragonfruitini**, with a hand-picked squad of summonable brainrot allies.

> **One sentence**: *Crash Bandicoot* meets the Italian brainrot meme universe on mobile.

---

## 2. Core Pillars

1. **Chaotic absurdism** — every visual, sound, and animation leans into the surreal humor of the brainrot meme universe.
2. **Snackable but deep** — pick-up-and-play touch controls, but each level has 5–10 minutes of meaningful obstacle traversal.
3. **Collection drives mastery** — collecting brainrots is not just a count; each is a future tool the player chooses to wield in the boss fight.
4. **Risk and recovery** — losing carried brainrots when hit creates real tension on the way back to base.

---

## 3. Target Platform & Tech

| Item | Decision |
|---|---|
| Engine | **Unity 6 LTS** (URP — Universal Render Pipeline) |
| Languages | C# |
| Platforms | iOS 15+, Android 10+ (API 29+) |
| Target devices | Mid-range and up (iPhone 11+, Pixel 5+, Samsung Galaxy A52+) |
| Frame rate | 60 FPS target on flagship, 30 FPS minimum on mid-range |
| Orientation | Landscape only |
| Input | Touch only (virtual joystick + buttons) |
| Camera | 3rd-person auto-follow (Cinemachine) — no manual camera control |
| Persistence | Local save (Unity `PlayerPrefs` + JSON for inventory/cosmetics) |
| Online | None in v1 — fully offline single-player |
| Monetization | None (personal/portfolio project) |

See `TECH_ARCHITECTURE.md` for project layout, packages, and code structure.

---

## 4. Core Gameplay Loop

```
┌─────────────────────────────────────────────────────────────┐
│  MAIN MENU → Level Select → LEVEL                           │
│                              │                              │
│                              ▼                              │
│            Spawn at base. Run obstacle course.              │
│            See a brainrot in the wild → walk into it.       │
│            Pick it up (visibly stacks on avatar).           │
│            Carry stack back to base.                        │
│            Avoid hazards — getting hit scatters stack.      │
│            Repeat until all 5 are returned to base.         │
│                              │                              │
│                              ▼                              │
│            Base transforms into a glowing portal.           │
│            Step in → cinematic → Level Complete.            │
│            Unlock next level + cosmetic rewards.            │
│                              │                              │
│                              ▼                              │
│            Return to Level Select (codex updated).          │
└─────────────────────────────────────────────────────────────┘
```

After all 4 levels are complete, the **bonus brainrot** is unlocked in a cinematic, then the **Boss Arena** is selectable from the menu.

---

## 5. Player Avatar

### 5.1 Design

- Stylized human form (rigged humanoid, ~3–5k tris)
- Cartoony proportions — slightly large head, expressive face — to fit alongside brainrot designs
- One default rig, swappable cosmetic meshes/textures

### 5.2 Customization

**Available at game start (full customizer screen):**

- Body type (3 silhouettes)
- Skin tone (8 options)
- Hair style (8 options) + hair color (10 options)
- Face shape / features (preset combinations)
- Default outfit (top, bottom, shoes — 3 each at start)

**Unlocked via gameplay:**

- Each level cleared → 2–3 cosmetic items
- Each unique brainrot collected → 1 themed cosmetic (e.g., shark fin hat from Tralalero Tralala)
- Hidden 1-up brainrot pickups also drop a cosmetic
- Total target: ~50 unlockable cosmetic items

### 5.3 Movement Stats

| Stat | Value |
|---|---|
| Walk speed | 4 m/s |
| Sprint speed | 6 m/s (hold sprint button) |
| Jump height | 2.2 m |
| Double jump height | 1.5 m additional |
| Carry slowdown | -0.3 m/s per brainrot carried (stacks) |
| Max stack visible | 5 (one full level worth) |

---

## 6. Controls (Touch)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────┐                              ┌────┐  ┌────┐    │
│ │          │                              │ A  │  │ B  │    │
│ │  ◉  ◉   │                              │JUMP│  │SPRT│    │
│ │   JOY    │                              └────┘  └────┘    │
│ └──────────┘                                                 │
│                                              ┌────┐         │
│                                              │ C  │         │
│ Pause [≡]                                    │INTR│         │
│                                              └────┘         │
└──────────────────────────────────────────────────────────────┘
```

| Control | Action |
|---|---|
| Left virtual joystick | Move (8-direction) |
| A button (right) | Jump (tap), double-jump (tap mid-air) |
| B button (right) | Sprint (hold) |
| C button (right) | Interact / Pick up / Drop / Boss-summon (context-sensitive) |
| Pause icon (top-left) | Pause menu |

Camera is **fully automatic** (Cinemachine virtual camera with collision smoothing). No swipe-to-rotate. The level designer controls framing.

In the **boss fight**, the C button becomes the summon menu (radial selector for 3–5 brainrot loadout).

---

## 7. Levels Overview

Each level is a self-contained obstacle course with **5 brainrots to collect** and a **base/portal** at the start. Length target: **5–10 minutes** for a skilled completion.

| # | Name | Biome | Signature Hazard | Status |
|---|---|---|---|---|
| 1 | **The Whirling Halls** | Ancient temple/dungeon | Swinging axe pendulums | **Vertical slice** — see `LEVEL_1_AXES.md` |
| 2 | **The Falling Sky** | Cracked desert wasteland | Meteor shower w/ shockwaves | Spec stub below |
| 3 | **The Bloop's Domain** | Coral ocean / shipwreck | Pursuing Bloop leviathan | Spec stub below |
| 4 | **The Lava Crucible** | Volcanic island | Lava floor + fire geysers | Spec stub below |
| 5 | **Boss Arena** | Surreal void | Georglini Dragonfruitini fight | Spec stub below |

### 7.1 Level Structure (shared template)

Every level follows this rough macro-structure:

1. **Base zone** (safe spawn area) — visible from the start
2. **Tutorial stretch** (~30 sec) introducing the level's mechanic
3. **Loop A — outbound** to brainrot 1 + return
4. **Loop B — branching** path to brainrots 2 & 3
5. **Loop C — gauntlet** harder traversal to brainrot 4
6. **Loop D — boss-of-level** more dramatic chase/setpiece for brainrot 5
7. **Portal activation** at the base after final return

### 7.2 Level Stubs

#### Level 2 — The Falling Sky
- Cracked desert plateau with elevated rock spires
- Hazard: meteors fall in **telegraphed red zones** (~1.5 sec warning circle); on impact, expanding shockwave that knocks player back
- Brainrots hidden in craters and atop spires (one requires double-jump chain)
- Visual: orange-pink dusk sky with constant streaking meteors

#### Level 3 — The Bloop's Domain
- Player swims (different control mapping: joystick = swim direction, A = ascend, B = descend)
- Coral mazes with shipwrecks and kelp forests
- Hazard: **The Bloop** — a massive distant leviathan that periodically lets out a low roar; whenever it roars, player has 3 seconds to reach a coral hideaway or take a hit from its sonar shockwave
- Brainrot 5 is grabbed during a chase sequence as the Bloop actively pursues player back to base

#### Level 4 — The Lava Crucible
- Volcanic island with platforming over lava
- Lava floor = instant life loss
- Hazard: **fire geysers** erupt from lava between platforms on a rhythm; some geysers create temporary platforms (jump on cooled crust before it sinks)
- Brainrots on the highest, riskiest platforms
- Final brainrot atop the volcano summit, requires precise timing across 6 geyser platforms

#### Level 5 — Boss Arena: Georglini Dragonfruitini
- See **Section 9** for full boss design

---

## 8. Brainrot Roster (21 total)

5 per level + 1 bonus + 1 boss = 21.

**Selected popular brainrots** (final naming + abilities in `BRAINROT_ROSTER.md`):

### Level 1 — The Whirling Halls
1. **Bombombini Gusini** — goose with bombs
2. **Brr Brr Patapim** — tree-monkey hybrid
3. **Trippi Troppi** — cat-shrimp hybrid
4. **Boneca Ambalabu** — frog-tire-human
5. **Lirili Larila** — cactus-elephant with pocket watch *(boss-of-level brainrot)*

### Level 2 — The Falling Sky
6. **Bombardiro Crocodilo** — alligator-bomber plane
7. **Cappuccino Assassino** — coffee-cup ninja
8. **Tung Tung Tung Sahur** — wooden bat creature
9. **Frigo Camelo** — fridge-camel
10. **Ballerina Cappuccina** — coffee-headed ballerina *(boss-of-level)*

### Level 3 — The Bloop's Domain
11. **Tralalero Tralala** — three-legged shark in Nikes
12. **Burbaloni Luliloli** — coconut-capybara
13. **Orangutini Ananasini** — orangutan-pineapple
14. **La Vacca Saturno Saturnita** — Saturn-ringed cow
15. **Chimpanzini Bananini** — chimp-banana hybrid *(boss-of-level)*

### Level 4 — The Lava Crucible
16. **Bambini Crustini** — toast-baby
17. **Garamararmaduro** — armored armadillo
18. **Trulimero Trulicina** — fish-cat-human
19. **Glorbo Fruttodrillo** — watermelon-crocodile
20. **Lirili Larila Tralala** — *NEW* fire-variant boss-of-level brainrot

### Bonus
21. **Tracotucotulu Delapelapeladusduzdas** — extremely long-named bonus brainrot, unlocked after Level 4 cinematic

### Final Boss
**Georglini Dragonfruitini** — see Section 9.

> **Note**: Some names are placeholders / stylized variants. Final picks plus per-character summon abilities live in `BRAINROT_ROSTER.md`.

---

## 9. Boss Fight — Georglini Dragonfruitini

### 9.1 Setup

After Level 4 cinematic, the player is taken to a **loadout screen**:
- Browse all 21 collected brainrots in the roster
- Pick **3 to 5** for this fight (slot count determined by player; more = each does less damage scaling)
- Confirm → enter Boss Arena

### 9.2 Arena

- Surreal floating void: shattered pieces of all 4 previous biomes drifting in a dreamlike sky
- Roughly circular battle plane, ~30 m diameter
- Three "anchor zones" at the edges that player can use as cover from boss AOE

### 9.3 Boss

**Georglini Dragonfruitini** — a massive, magenta-pink, scaled dragonfruit-dragon hybrid with a coffee-cup crown, 3 phases.

| Phase | HP gate | Behavior |
|---|---|---|
| 1 | 100% → 66% | Ground slams, fireballs, claw swipes — slow, learnable |
| 2 | 66% → 33% | Adds aerial dive bombs and seed-spit barrages |
| 3 | 33% → 0% | Enrages; constant AOE; spawns mini-georglinis |

### 9.4 Combat Mechanics

**Player offense:**

- **Basic attack** (tap C): light melee with whatever brainrot is currently active as "carried"
- **Summon brainrot** (radial menu, hold C): pulls up your loadout — tap a brainrot icon to summon. Each has:
  - Cooldown (10–60 sec)
  - Active duration (5–20 sec)
  - Unique attack pattern (see roster)
- **Bonus brainrot** is **always** in the loadout (free 4th–6th slot, doesn't count against player picks)

**Player defense:**

- Sprint button doubles as **dodge roll** (i-frames during roll)
- 5 hit-point health bar (4 hearts + bonus brainrot shield)
- No lives in boss fight — death = retry from phase 1

**Boss attacks (signposted):**

| Attack | Tell | Counter |
|---|---|---|
| Ground slam | Boss rears back, ground glows red | Roll out of red zone |
| Fireball | Mouth glow + arc indicator | Sidestep / cover |
| Claw swipe | Front leg lifts | Roll backward |
| Dive bomb | Boss flies offscreen, shadow appears | Move out of shadow |
| Seed barrage | Boss spits up, multi-projectile rain | Reach a cover zone |
| Mini-georglini spawn | Eggs drop and crack | Kill within 5 sec or they explode |

### 9.5 Win Condition

Boss HP → 0 triggers:
1. Cinematic — Georglini explodes into 21 brainrot-shaped sparkles
2. Player avatar opens a portal home
3. Credits / "Run again?" screen

---

## 10. Progression & Save System

### 10.1 Level Progression
- Linear unlock order: Level 1 → 2 → 3 → 4 → Boss Arena
- Once unlocked, **freely replayable** from level select (for cosmetic farming or speedrunning)
- Best time per level tracked locally

### 10.2 Lives
- 3 lives at the **start** of each level
- Hidden **1-up brainrots** in each level (small, pulsing, easy to miss) grant an extra life
- Lose all lives → restart that level (carried brainrots reset, but **collected** brainrots stay collected for the codex)
- Lives **reset to 3** between levels

### 10.3 Save Data Schema (JSON)

```json
{
  "version": 1,
  "playerName": "string",
  "avatar": {
    "body": 0,
    "skin": 2,
    "hair": { "style": 4, "color": 1 },
    "outfit": { "top": 3, "bottom": 1, "shoes": 0 },
    "unlockedCosmetics": ["shark_fin_hat", "lava_boots", "..."]
  },
  "progression": {
    "highestLevelUnlocked": 3,
    "levelTimes": { "1": 312, "2": 488, "3": 0, "4": 0, "boss": 0 },
    "completed": ["1", "2"]
  },
  "brainrots": {
    "collected": ["bombombini_gusini", "brr_brr_patapim", "..."],
    "bossLoadout": ["tralalero_tralala", "bombardiro_crocodilo", "tung_tung_sahur"]
  }
}
```

---

## 11. UI / UX

### 11.1 Screens

| Screen | Purpose |
|---|---|
| Splash | Logo + studio (you) |
| Main Menu | Play, Customize, Codex, Settings, Credits |
| Avatar Customizer | Full character editor |
| Level Select | 5 cards (4 levels + boss); locked cards show silhouette |
| Codex | Grid of 21 brainrot portraits; tap for details (locked = silhouette + ?) |
| In-Level HUD | Lives, brainrots remaining (5/5), carried stack count, pause |
| Boss Loadout | Drag 3–5 brainrots into slots, confirm |
| Boss HUD | Player HP, boss HP bar, summon cooldowns |
| Pause | Resume, Restart Level, Settings, Quit to Menu |
| Settings | Audio (master/SFX/voice/music), Controls (joystick size/position), Haptics, Language |
| Credits | Project credits + brainrot creator attributions |

### 11.2 HUD Layout (in-level)

```
┌─────────────────────────────────────────────────────────────┐
│ [≡]  ❤❤❤  ⚙ 3/5             [Carried: ▲▲▲ x3]              │
│                                                              │
│                                                              │
│                       (gameplay view)                        │
│                                                              │
│                                                              │
│ ┌────┐                                       ┌──┐  ┌──┐     │
│ │JOY │                                       │A │  │B │     │
│ └────┘                                       └──┘  └──┘     │
│                                              ┌──┐           │
│                                              │C │           │
│                                              └──┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Art Direction (summary)

Full guide in `ART_AUDIO_GUIDE.md`. Highlights:

- **Style**: chaotic-cute 3D cartoon. Slightly toonshaded, saturated, surreal.
- **Color**: each level has a dominant palette (Level 1: ochre/teal, L2: orange/violet, L3: turquoise/coral, L4: red/black/gold).
- **Brainrots**: must read silhouette-first, then absurd detail second. Faithful to meme designs.
- **AI generation**: assets created with image-to-3D pipelines (Meshy, Tripo, Rodin) seeded from style-locked AI image prompts.
- **No realism** — keep textures hand-painted-looking.

---

## 13. Audio Direction (summary)

Full plan in `ART_AUDIO_GUIDE.md`. Highlights:

- **Brainrot voice lines**: each character has 3–5 short voice clips (idle chatter, pickup yelp, summon ability, taunt). Should sound like the original meme voice (Italian-tinged, AI-TTS-ish).
- **Music**: each level has a looping track in a different "fake-Italian/Eurobeat/lounge" style.
  - L1: dramatic temple-string chase
  - L2: pulsing synth + tarantella
  - L3: dreamy underwater accordion
  - L4: aggressive Italo-disco
  - Boss: orchestral chaos
- **SFX**: chunky cartoon hit sounds, splats, boings.

---

## 14. Vertical Slice — Scope Lock for v1

**Goal**: One polished playable level (Level 1: The Whirling Halls) + customizer + codex + base flow.

### 14.1 In Scope
- Main Menu → Avatar Customizer → Level Select → Level 1 → Win/Lose flow
- Full Level 1 with all 5 brainrots, axes, base/portal mechanic
- Avatar with 3 body types, 3 hair styles, 2 outfits (no full 50 items yet)
- 5 brainrot characters fully modeled, animated, voiced
- Codex screen showing only Level 1 brainrots
- Save system v1 (localPlayerPrefs)
- All 7 in-scope screens (skip Boss Loadout, Boss HUD, Credits stub)
- Mobile build pipeline for iOS & Android
- 30+ FPS on test device (target: iPhone 12 / Pixel 6)

### 14.2 Out of Scope (post-vertical-slice)
- Levels 2–5
- Bonus brainrot
- Full 50-item cosmetic library
- Boss fight system & loadout
- Online features
- Leaderboards
- Localization beyond English

### 14.3 Acceptance Criteria for Vertical Slice
1. New player can launch the app, customize avatar, complete Level 1 in 5–10 min, and see their progress saved
2. Death/respawn loop works (3 lives, hidden 1-ups)
3. All 5 Level 1 brainrots can be collected and returned to base
4. Portal activation → "Level Complete" → returns to Level Select
5. Codex shows correct collection state across app restarts
6. Stable on iPhone 12 and Pixel 6 (no crashes in 30-min test session)

---

## 15. Milestones & Build Order

| # | Milestone | Deliverable | Target |
|---|---|---|---|
| M0 | **Project setup** | Unity project, Git repo, packages, build pipeline | Week 1 |
| M1 | **Greybox Level 1** | Playable cube-character on greybox temple, axe hazards work | Week 2–3 |
| M2 | **Carry & base mechanic** | Pick up cubes, stack visibly, return to base, scatter on hit | Week 3–4 |
| M3 | **Avatar v1** | Player rig, animations (run/jump/idle/hit/carry), basic customizer | Week 4–6 |
| M4 | **Brainrot 1 (Bombombini Gusini)** | First fully modeled, animated, voiced brainrot end-to-end | Week 6–7 |
| M5 | **Brainrots 2–5** | Remaining Level 1 brainrots produced via the M4 pipeline | Week 7–9 |
| M6 | **Level 1 art pass** | Replace greybox with finished art assets | Week 9–11 |
| M7 | **UI/UX flow** | All vertical-slice screens wired, save system, audio mix | Week 11–12 |
| M8 | **Polish & QA** | Bug-fixing, tuning, device testing, build to TestFlight + internal Android | Week 12–13 |
| **VS Done** | Vertical slice ships internally | — | End of Week 13 |
| M9+ | Levels 2–4 | Each level: 3–4 weeks each | Week 14–25 |
| M10 | Boss fight | Full implementation | Week 26–28 |
| M11 | Final polish & store submission | Apple / Google | Week 29–30 |

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI-generated 3D assets fail quality bar | High | Start with M4 character end-to-end before producing the rest; have human cleanup pass |
| IP/legal concerns with named brainrots | Medium | Confirm parody/fair-use angle; have stylized variants ready as fallback names |
| Mobile performance on mid-range devices | High | Set strict tri/tex budgets; profile from M1; URP + LOD groups |
| Touch controls feel imprecise on platforming | High | Generous coyote time, jump buffer, sticky platforms; extensive playtesting |
| Carry-stack visuals get cluttered | Medium | Cap visible stack at 5, use silhouette-distinct brainrots |
| Scope creep on customizer | Medium | Hard-lock 50 cosmetic items max, each is a reskin of a base mesh |

---

## 17. Open Questions (to revisit before M1)

- Do we want **haptics** on hits/pickups? (Probably yes on iOS at least.)
- Should sprint also allow a **roll** in regular levels, or only in boss?
- Should the **codex voice lines** play when tapping a brainrot portrait? (Recommended yes — adds life.)
- Should **time-of-day** vary per level? (Currently static — could be a polish task.)
- Do we want a **photo mode**? (Tempting but post-VS.)

---

## 18. References

- `BRAINROT_ROSTER.md` — full 21-character roster with summon abilities, stats, voice line list
- `LEVEL_1_AXES.md` — detailed level design for the vertical slice
- `ART_AUDIO_GUIDE.md` — visual style guide + AI prompt library + audio direction
- `TECH_ARCHITECTURE.md` — Unity project structure, packages, scripts, scene flow
- `README.md` — project entry point and quickstart

---

*End of GAME_SPEC.md*
