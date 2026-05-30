# Survive Fire for Brainrots

A 2D top-down browser game where you race across four biomes to rescue the Italian "brainrots" from **Los Hackers**, then face the hacker themselves in a four-ability boss fight.

> **Play it in your browser**: `https://lysa-le.github.io/survive-fire-for-brainrots/` *(once deployed)*

---

## The Story

Long ago, the brainrots lived in peace.

Then **Los Hackers** came. The sky darkened, the brainrots scattered to four corners of the world — into a temple, into the falling sky, into the deep sea, and into the burning below — and only one hero can bring them home.

When all five ultimates have been rescued, Los Hackers rises from the hatch in the forest for one last fight.

---

## How to Play

- **Pick a level** from the title screen (cleared levels stay tappable for replay).
- **Find all 5 brainrots** scattered around the level, carry them back to the glowing base, and step into the portal to advance.
- **Survive the hazards** along the way: every level has its own brand of pain.
- **Beat all 4 levels** to unlock the **Los Hackers** boss fight, where each level's *ultimate* brainrot becomes a slot on your ability bar.

### Controls

| Input | Desktop | Mobile |
|---|---|---|
| Move | WASD / arrow keys | Drag the left side of the screen (virtual joystick) |
| Jump (Level 4) | Space | Tap the on-screen JUMP button |
| Boss abilities | `1` Wail · `2` Pasta Bomb · double-tap arrow Dash · hold `4` Hydra Beam | Tap the four ability slots (cyan / blue / orange / gold) |

### Tips

- You can carry multiple brainrots at once — they trail behind you snake-style.
- Each carried brainrot slows you down a little (yellow → red HUD warns you when you're loaded up).
- Getting hit drops everything you're carrying. They scatter; pick them up again.
- You have **3 hearts**. Lose all three and the level restarts — but **deposited brainrots stay deposited**.

---

## The Levels

| # | Name | Biome | Hazards |
|---|---|---|---|
| 1 | The Whirling Halls | Stone temple (torchlit) | Swinging axes |
| 2 | The Falling Sky | Desert dunes | Meteor strikes with telegraphed landing zones |
| 3 | The Bloop's Domain | Open seafloor | The Bloop (chasing cephalopod) + drifting jellyfish + buried mines |
| 4 | The Burning Below | Volcanic platforms | Lava floor + erupting geysers (jump between platforms!) |
| ⚡ | Los Hackers | Forest hatch arena | Three-phase boss with bite cone, pixel rain, ring pulses, and glitch drones |

---

## The Brainrots

Twenty collectible brainrots spread across the four levels, plus **four ultimates** unlocked one per level (Strawberry Elephant, Bombardiro Crocodilo, Capitano Moby, and Hydra Dragon Cannelloni) — each becomes an ability in the final boss fight. A few of the squad:

| Brainrot | Vibe | Where |
|---|---|---|
| 🦢💣 **Bombombini Gusini** | Goose with bombs | Whirling Halls |
| 🐊✈️ **Bombardiro Crocodilo** | Crocodile bomber | L2 ultimate (→ Pasta Bomb) |
| 🦈👟 **Tralalero Tralala** | Shark in Nikes | Bloop's Domain |
| 🦖☢️ **Nuclearo Dinossauro** | Nuclear dinosaur | Burning Below |
| 🐉🍝 **Hydra Dragon Cannelloni** | Multi-headed pasta dragon | L4 ultimate (→ Hydra Channel Beam) |

Each one says their name (in Italian!) when you pick them up, courtesy of your browser's text-to-speech.

---

## Tech

- **Phaser 3** loaded from CDN — no build step, just open `index.html`.
- Vanilla JavaScript, single-file (`game.js`).
- Web Audio API for synthesized SFX.
- `speechSynthesis` API for Italian pickup voice lines + English narrative cards.
- `localStorage` for persistent progress (single slot per browser).
- Hosted on **GitHub Pages** (free).

---

## Run Locally

```bash
cd /path/to/survive-fire-for-brainrots
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or just double-click `index.html`. No `npm install`, no build pipeline.

To wipe save state and replay everything from scratch, open DevTools and run:

```js
localStorage.removeItem('survive-fire-brainrots:save:v1');
```

There's also a small `▸ replay intro` link in the bottom-left of the title screen if you just want to rewatch the opening cinematic.

---

## Project Structure

```
survive-fire-for-brainrots/
├── README.md             ← you are here
├── index.html            ← game entry point (loads Phaser CDN)
├── game.js               ← all game logic (single file, ~8,600 lines)
├── style.css             ← viewport scaling for desktop + mobile
├── assets/
│   └── sprites/          ← 25+ brainrot / player / boss PNGs
├── .nojekyll             ← tells GitHub Pages to skip Jekyll
└── docs/                 ← design specs (kept up to date as the game evolves)
    ├── GAME_SPEC.md              the long-term Unity 3D north-star vision
    ├── GAME_SPEC_DESCOPED.md     what's actually built (currently v0.6.3)
    ├── BRAINROT_ROSTER.md
    ├── LEVEL_1_AXES.md
    ├── ART_AUDIO_GUIDE.md
    └── TECH_ARCHITECTURE.md
```

---

## North Star vs. What Got Built

This repo holds **two specs**:

1. **`docs/GAME_SPEC.md`** — the long-term vision: a full 3D Unity mobile game with 4 levels, a boss fight, full character customizer, and AI-generated 3D models. That's a 6+ month project.

2. **`docs/GAME_SPEC_DESCOPED.md`** — what's actually playable today: a 2D web build with **4 levels, 5 hazard types, 20+ brainrots, a 3-phase boss fight, a 4-ability ability bar, persistent progress, and short narrative bookends**. Started as a 1-day prototype; grew from there. Free to host. Free to play. Designed to share with friends and family.

Both specs are preserved so the descoped version stays a fun, low-stakes way to enjoy the brainrot universe today, while the north star is still there if/when this project grows.

---

## Credits

- **Phaser 3** by Photon Storm — free open-source 2D game framework
- **Italian Brainrot meme universe** — collective internet creation
- **You** — for bringing them home

---

*Long live the brainrots.*
