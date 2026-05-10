# Survive Fire for Brainrots

A 2D top-down browser game where you collect 5 Italian "brainrot" characters in an ancient temple while dodging swinging axes. Built as a 1-day prototype.

> **Play it in your browser**: `https://lysa-le.github.io/survive-fire-for-brainrots/` *(once deployed)*

---

## How to Play

- **Goal**: Find all 5 brainrots scattered around the temple, carry them back to the glowing base, and step into the portal to escape.
- **Controls**:
  - **Desktop**: Arrow keys or WASD to move
  - **Mobile**: Drag the left side of the screen as a virtual joystick
- **Tips**:
  - Walk into a brainrot to pick it up
  - You can carry multiple at once (they trail behind you snake-style)
  - Each brainrot you carry slows you down a tiny bit
  - Walk onto the BASE (purple rune circle) to deposit carried brainrots
  - **Watch out for the swinging axes!** Getting hit scatters all carried brainrots
  - Once all 5 are deposited, the base becomes a portal — step in to win

---

## The Brainrots

| Brainrot | Vibe |
|---|---|
| 🦢💣 **Bombombini Gusini** | Goose with bombs |
| 🐒🌳 **Brr Brr Patapim** | Tree-monkey |
| 🐱🦐 **Trippi Troppi** | Cat-shrimp hybrid |
| 🐸🛞 **Boneca Ambalabu** | Frog-tire-doll |
| 🐘🌵 **Lirili Larila** | Cactus-elephant with a pocket watch |

Each one says their name (in Italian!) when you pick them up — your browser's text-to-speech makes it happen.

---

## Tech

- **Phaser 3** loaded from CDN — no build step
- Vanilla JavaScript, single-file (`game.js`)
- Web Audio API for synthesized SFX
- `speechSynthesis` API for Italian voice lines
- Hosted on **GitHub Pages** (free)

---

## Run Locally

```bash
# Just open index.html in any browser, OR:
cd /path/to/survive-fire-for-brainrots
python3 -m http.server 8000
# Then visit http://localhost:8000
```

---

## Project Structure

```
survive-fire-for-brainrots/
├── README.md             ← you are here
├── index.html            ← game entry point
├── game.js               ← all game logic
├── style.css             ← mobile viewport styles
├── assets/               ← (reserved for future sprite/audio assets)
├── .nojekyll             ← tells GitHub Pages to skip Jekyll
└── docs/                 ← design specs
    ├── GAME_SPEC.md              the full Unity 3D north-star vision
    ├── GAME_SPEC_DESCOPED.md     this 1-day web build
    ├── BRAINROT_ROSTER.md
    ├── LEVEL_1_AXES.md
    ├── ART_AUDIO_GUIDE.md
    └── TECH_ARCHITECTURE.md
```

---

## North Star vs. What Got Built Today

This repo holds **two specs**:

1. **`docs/GAME_SPEC.md`** — the long-term vision: a full 3D Unity mobile game with 4 levels, a boss fight (Georglini Dragonfruitini!), 21 brainrots, full character customizer, and AI-generated 3D models. That's a 6+ month project.

2. **`docs/GAME_SPEC_DESCOPED.md`** — what's actually playable today: a 2D web build with 1 level, 5 brainrots, and one hazard type. Took ~1 day to build. Free to host. Free to play. Designed to share with friends and family.

Both specs are preserved so the descoped version stays a fun, low-stakes way to enjoy the brainrot universe today, while the north star is still there if/when this project grows.

---

## Credits

- **Phaser 3** by Photon Storm — free open-source 2D game framework
- **Italian Brainrot meme universe** — collective internet creation
- **You** — for collecting all the brainrots

---

*Long live the brainrots.*
