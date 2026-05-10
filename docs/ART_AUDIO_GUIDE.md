# Art & Audio Direction Guide

Visual + audio bible for *Survive Fire for Brainrots*. Use this as the source of truth when generating any asset.

---

## 1. Overall Visual Identity

### Style Statement
> *"Chaotic-cute 3D cartoon. Saturated, surreal, slightly toon-shaded. Brainrot meme silhouettes are sacred — read them silhouette-first, then absurd detail."*

### Anti-references (do NOT do)
- Photorealistic / PBR realism
- Anime cel-shading (too clean for the brainrot vibe)
- Western cartoon polish (e.g., Pixar) — too sanitized
- Low-poly minimalism — we want detail, just stylized

### Pro-references
- *Crash Bandicoot 4* (chaotic mobile-friendly 3D platforming)
- *Bugsnax* (absurdist creature design)
- *Cuphead* meets *Untitled Goose Game* (slapstick + serious art commitment)
- The original brainrot meme imagery (AI-glitchy detail)

---

## 2. Color Palettes per Level

### Level 1 — The Whirling Halls
- **Primary**: warm ochre `#C99A52`
- **Secondary**: teal water `#4FA8A0`
- **Accent**: gold trim `#E0B95E`
- **Shadow**: deep burgundy `#3A1F2A`

### Level 2 — The Falling Sky
- **Primary**: dusty orange `#E8753F`
- **Secondary**: violet sky `#7C5BB8`
- **Accent**: meteor magma `#FF3D2E`
- **Shadow**: charcoal-purple `#2A1F38`

### Level 3 — The Bloop's Domain
- **Primary**: turquoise `#2DC2C2`
- **Secondary**: coral pink `#FF8B7E`
- **Accent**: deep indigo `#1B3A8C`
- **Shadow**: blackwater `#0A1A2E`

### Level 4 — The Lava Crucible
- **Primary**: lava red `#E83A1B`
- **Secondary**: obsidian `#1A1A1A`
- **Accent**: molten gold `#F5C300`
- **Shadow**: pure black `#000000`

### Level 5 — Boss Arena
- **Primary**: dragonfruit magenta `#E63785`
- **Secondary**: cream-yellow seed `#F4E5A1`
- **Accent**: void-violet `#3B1A4F`
- **Shadow**: deep cosmic black `#05010F`

---

## 3. Character Design Rules

### Player Avatar
- Stylized human, slightly toonshaded
- Head ~1.3x normal proportion (more expressive)
- Hands and feet exaggerated for readability at mobile zoom levels
- Big eyes, simple mouth
- Cosmetics are bright, slightly oversized for silhouette punch

### Brainrots
- **Silhouette law**: each brainrot must be uniquely silhouette-recognizable. If you blacken the model, you should know which brainrot it is.
- **Maintain meme fidelity**: faithful to original brainrot meme designs (shark with sneakers stays shark with sneakers)
- **Toon shading**: 2-band shading (light/dark), no gradient
- **Outline**: subtle dark outline (1.5-2px equivalent at 1080p)
- **Eyes**: always alive, blink occasionally
- **Idle motion**: every brainrot has a small idle bobble or twitch

### Common Tri/Tex budgets

| Asset | Tri budget | Texture size |
|---|---|---|
| Player avatar | 5,000 | 1024×1024 (body) + 512×512 (hair/clothes) |
| Brainrot (collectible) | 3,000 | 512×512 |
| Brainrot (boss-of-level) | 5,000 | 1024×1024 |
| Georglini Dragonfruitini | 15,000 | 2048×2048 (body) + 1024 (extras) |
| Hazard prop (axe, geyser) | 1,500 | 512×512 |
| Environment hero prop | 4,000 | 1024×1024 |
| Environment kit piece | 800 | 256×256 (atlased) |

---

## 4. AI Asset Generation Pipeline

### Step 1 — Concept image (2D)
Tool: Midjourney v7, Flux 1.5, or DALL-E

**Prompt template (brainrots)**:
```
A 3D character turntable of [BRAINROT NAME], an absurd Italian
brainrot meme creature: [DESCRIPTION]. Toon-shaded with subtle dark
outline, saturated colors, slightly chunky cartoon proportions, full
body T-pose, neutral grey background, mobile-game-ready style,
inspired by Crash Bandicoot and Bugsnax aesthetics.
--ar 1:1 --style raw
```

**Prompt template (environment)**:
```
A 3D mobile game environment: [BIOME], [LEVEL DESCRIPTION], stylized
toon-shaded, palette of [PRIMARY] / [SECONDARY] / [ACCENT], theatrical
lighting with [TIME OF DAY], modular kit pieces, rendered in Unity URP
style.
--ar 16:9
```

### Step 2 — Image-to-3D
Tools (in priority order):
1. **Meshy** (best quality for stylized characters)
2. **Tripo3D** (faster iteration)
3. **Rodin** (good for hard-surface props)

Settings:
- Output format: GLB
- Topology: optimized for animation (auto-rig friendly)
- Texture resolution: 2048 (downscale to budget in Unity)

### Step 3 — Cleanup in Blender
- Retopologize problem areas (faces especially)
- Fix UV stretching
- Apply 2-band toon material
- Verify scale (1 Unity unit = 1 meter)

### Step 4 — Rigging & Animation
- **Mixamo** for humanoid rig + base animation set
- **Custom rigs** for non-humanoids (Blender → FBX)
- Animations needed per brainrot:
  - Idle (looped, ~3 sec)
  - Pickup reaction (one-shot, ~1 sec)
  - Carried-on-stack idle (looped, ~2 sec, gentle bobble)
  - Boss summon entry (one-shot, ~1.5 sec)
  - Boss summon ability (one-shot per ability)
  - Boss summon exit (one-shot, ~1 sec)

### Step 5 — Unity import
- Import as Prefab
- Apply project's `Brainrot_ToonMat` shader
- Add `BrainrotIdentity` ScriptableObject reference
- Attach `BrainrotPickup` component

---

## 5. Shader Specs

### `Toon_Player`
- 2-band lighting
- Outline pass: 1.5px screen-space, dark color
- Rim light: subtle, helps readability

### `Toon_Brainrot`
- Same as `Toon_Player` but with extra `_GlowEmission` for the boss-fight summon "active" state

### `Water_Stylized`
- Cartoon ripple normal map
- Foam at object intersections
- Refraction subtle (mobile budget)

### `Lava`
- Animated emissive flow map
- Heat-haze post-processing region around lava

### `Portal`
- Spiral UV scroll on emissive ring
- Particle vortex inside
- Bright cyan-magenta gradient (calls back to brainrot palette)

---

## 6. UI Visual Style

- **Font**: a chunky, slightly hand-drawn sans-serif (e.g., **Mikodacs**, **Jolly Lodger**, or custom)
- **UI panels**: paper/parchment with soft drop-shadow
- **Buttons**: bouncy with squash-stretch on press
- **Color**: high contrast, level-themed accents
- **Icons**: portrait-style for brainrots (consistent framing across all 21)
- **HUD**: minimal, semi-transparent, doesn't fight gameplay

---

## 7. Audio Direction

### 7.1 Music (per-level loops)

| Track | Style | BPM | Length | Notes |
|---|---|---|---|---|
| Main Menu | Italian lounge meets meme synth | 100 | 2:00 loop | Welcoming, weird |
| Level 1 (Halls) | Baroque strings + harpsichord chase | 110 | 3:00 loop | Tension at axes |
| Level 2 (Sky) | Pulsing synth + tarantella drums | 130 | 3:00 loop | Urgency |
| Level 3 (Ocean) | Dreamy accordion + underwater pads | 80 | 4:00 loop | Floaty, slightly creepy when Bloop near |
| Level 4 (Lava) | Aggressive Italo-disco | 140 | 3:00 loop | Driving, dangerous |
| Boss | Orchestral chaos with operatic vocals | 120 | 4:00 loop | 3 dynamic phases |
| Victory cinematic | Triumphant Italian fanfare | 100 | 0:30 | After level/boss complete |

**Tools**: Suno, Udio (commercial license), or original composer.

### 7.2 SFX Library

Categories needed:

- **Player movement**: footstep variations (stone, wood, water, sand, lava-rock), jump grunt, double-jump whoosh, land thud, hit reaction (4 variants)
- **Pickup**: brainrot scoop sound (springy, cute), deposit shimmer at base
- **Hazards**: axe whoosh + chain creak, spike pop, brazier whoosh, water splash, geyser blast, meteor whistle + impact
- **UI**: tap, hover, confirm, cancel, level complete fanfare
- **Portal**: swirling magic, level transition whoosh
- **Boss**: roar, attack tells, hit confirms, death explosion

**Tools**: Soundsnap, Zapsplat, custom Foley.

### 7.3 Brainrot Voice Lines

Each of the 21 brainrots has 3–5 short voice clips:

| Type | Length | Use |
|---|---|---|
| Idle whisper | 0.5–1.5 sec | Loops while standing in level |
| Pickup yelp | 0.3–0.8 sec | When player walks into them |
| Carried mumble | 0.5–1.5 sec | Occasionally while carried (rare, charming) |
| Boss summon entry | 0.5–1 sec | When summoned in boss fight |
| Taunt/cheer | 1–2 sec | After ability hits |

**Voice production**:
- Style: Italian-accented AI TTS, intentionally meme-y, often nonsense words
- Tools: ElevenLabs (with paid commercial license), Suno bark, or Coqui (open-source)
- Each brainrot has a consistent "voice cast" — choose one TTS voice/preset per brainrot and stick with it
- Master at -16 LUFS, mono

### 7.4 Boss Voice (Georglini Dragonfruitini)

- Deep, distorted, theatrical Italian villain
- Specific lines (English subs):
  - Entry: *"Georglini! Dragonfruitini! Tu osi sfidarmi?!"* (You dare challenge me?!)
  - Phase 2: *"Non è ancora finita... non è ancora abbastanza!"* (It's not over... not enough yet!)
  - Phase 3: *"BASTA! IO SONO IL VERO BRAINROT!"* (Enough! I am the TRUE brainrot!)
  - Death: *"Ma... come... ma..."* (How could this be...)

---

## 8. Animation Style Notes

- **Squash and stretch** is encouraged — bouncy, alive
- **12 fps anim feel** for some brainrots (extra-stylized) but rendered at 60fps
- **Anticipation** before any big move — pose hold for 4–6 frames before commit
- **Follow-through** on hits — head bobs, hair sways
- **Idle variety**: 3 idle anims per character cycled randomly

---

## 9. VFX Library

| Effect | Use | Tech |
|---|---|---|
| Brainrot pickup sparkle | Walk into brainrot | Particle burst (yellow stars) |
| Brainrot scatter trail | Hit while carrying | Per-brainrot color trail |
| Axe blade trail | Swinging | Trail Renderer (white/grey) |
| Brazier flames | Burning | Particle system, looped |
| Lava bubble | Lava floor | Particle, slow-loop |
| Meteor trail | Falling | Particle + light source |
| Portal swirl | Base portal | Shader + particle |
| Boss fireball | Phase 1 | Particle + emissive mesh |
| Boss enrage aura | Phase 3 | Post-processing red tint near boss |

---

## 10. Asset Production Order (Vertical Slice)

1. **Player avatar** (1 body type, 1 outfit) — needed for prototyping movement
2. **Brainrot 1: Bombombini Gusini** — full pipeline test (model → rig → anims → voice → in-Unity)
3. **Level 1 environment kit** (10 modular pieces: floor, wall, pillar, arch, water, rune, axe-mount, pillar-broken, brazier, statue)
4. **Hazard props**: axe pendulum, spike trap, brazier
5. **Brainrots 2–5** for Level 1
6. **UI elements**: HUD, menu, codex (Level 1 portion)
7. **Audio**: Level 1 music, all Level 1 SFX, all Level 1 voice lines
8. **Polish pass**: lighting, post-processing, particles

---

## 11. Tools & Pipeline Summary

| Stage | Tool | Output |
|---|---|---|
| Concept art | Midjourney / Flux | PNG |
| Image-to-3D | Meshy / Tripo / Rodin | GLB |
| Mesh cleanup | Blender | FBX |
| Rigging | Mixamo (humanoid) / Blender (custom) | FBX with rig |
| Animation | Mixamo + custom in Blender | FBX anim clips |
| Texturing | Substance Painter / hand-paint in Blender | PNG |
| Engine import | Unity 6 LTS | Prefab |
| Voice gen | ElevenLabs / Suno | WAV |
| Music gen | Suno / Udio | WAV |
| SFX | Soundsnap + Audacity | WAV |
| VFX | Unity VFX Graph + Shuriken | Prefab |

---

## 12. Quality Gate Checklist (per asset)

Before an asset is "done":

- [ ] Tri count within budget
- [ ] Texture size within budget
- [ ] Imports cleanly to Unity (no flipped normals)
- [ ] Reads at silhouette
- [ ] Reads at mobile screen size (test on phone)
- [ ] Uses project shaders, not custom one-offs
- [ ] LOD generated if it's a hero asset
- [ ] Animation clips loop seamlessly where applicable
- [ ] Voice lines (if any) attached and triggering
- [ ] Sits in the correct layer & sorting

---

## 13. Web Prototype (Phaser 3) — Sprite Naming Contract

All sprites for the web build live in `assets/sprites/`. Each file has a matching `this.load.image(key, path)` call in the `preload()` block of `BootScene` in `game.js` (around line 807). **If you rename or replace a sprite file, you must update the matching call in `game.js` or the game will silently skip that character.**

A `loaderror` handler is registered in `preload()` — if a sprite fails to load, the browser console will print the missing key and expected path so it's easy to spot.

### Current sprite → key mapping

| File | Key in game.js | Used for |
|---|---|---|
| `Bombombini_Gusini.png` | `sprite_bombo` | Level 1 brainrot |
| `ChimpanziniBananini.png` | `sprite_chimpanzini` | Level 1 brainrot |
| `Meowl.png` | `sprite_meowl` | Level 1 brainrot |
| `Boneca_Ambalabu.png` | `sprite_boneca` | Level 1 brainrot |
| `Fragola_La_La_La.png` | `sprite_fragola` | Level 1 brainrot |
| `Pancake_and_Syrup.png` | `sprite_pancake` | Level 2 brainrot |
| `Cappuccino_Assassino.png` | `sprite_cappuccino` | Level 2 brainrot |
| `Tung_Tung_Tung_Sahur.png` | `sprite_tung` | Level 2 brainrot |
| `FrigoCamelo.png` | `sprite_frigo` | Level 2 brainrot (reused L4) |
| `Ballerina_cappucina.png` | `sprite_ballerina` | Level 2 brainrot |
| `TralaleroTralala.png` | `sprite_tralalero` | Level 3 brainrot |
| `Abyssaloco.png` | `sprite_abyssaloco` | Level 3 brainrot |
| `BluberrinniOctopusini.png` | `sprite_octopusini` | Level 3 brainrot |
| `Orcalero_Orcala.png` | `sprite_orcalero` | Level 3 brainrot |
| `Trippi_Troppi.png` | `sprite_trippi` | Level 3 brainrot |
| `Arcadragon.png` | `sprite_arcadragon` | Level 4 brainrot |
| `Dragon_Cannelloni.png` | `sprite_cannelloni` | Level 4 brainrot |
| `Cocofanto.png` | `sprite_cocofanto` | Level 4 brainrot |
| `Nuclearo_Dinossauro.png` | `sprite_nuclearo` | Level 4 brainrot |
| `ULTIMATE_L1_Strawberryelephant.png` | `sprite_lirili` | Ultimate boss L1 |
| `ULTIMATE_L2_Bombardiro_Crocodilo.png` | `sprite_bombardiro` | Ultimate boss L2 |
| `ULTIMATE_L3_Capitano_Moby.png` | `sprite_capitano` | Ultimate boss L3 |
| `ULTIMATE_L4_Hydra_Dragon_Cannelloni.png` | `sprite_hydra` | Ultimate boss L4 |
| `ULTIMATE_BATTLE_Los_Hackers.png` | `sprite_los_hackers` | Final boss |
| `Bloop2.png` | `sprite_bloop` | Bloop creature (L3) |
| `boy_avatar.png` | `sprite_player_boy` | Player (land levels) |
| `boy_scuba.png` | `sprite_player_boy_scuba` | Player (ocean level) |

### Files in the folder not loaded by the game
- `bloop.png` — old version, replaced by `Bloop2.png`, safe to delete
- `Sammyni_Spyderini.png` — generated but not yet assigned to a level

### Rule for adding a new sprite
1. Add the PNG to `assets/sprites/`
2. Add `this.load.image('sprite_key', 'assets/sprites/Filename.png')` in the `preload()` block of `BootScene` in `game.js`
3. Add the key to the brainrot data table further down in `game.js`
4. Add a row to the table above in this doc

---

*End of ART_AUDIO_GUIDE.md*
