# Technical Architecture

Unity project structure, scripts, scene flow, and packages.

---

## 1. Engine & Versions

- **Unity**: 6 LTS (latest at time of writing)
- **Render pipeline**: Universal Render Pipeline (URP) — best balance of fidelity and mobile performance
- **Scripting**: C# 10+ (Unity-supported subset)
- **Target API**: .NET Standard 2.1
- **Build targets**: iOS (Xcode 15+), Android (Gradle, API 29+)

---

## 2. Required Packages

Install via Unity Package Manager:

| Package | Purpose | Version |
|---|---|---|
| Universal RP | Stylized rendering | 17.x |
| Cinemachine | Camera system | 3.x |
| Input System | New input handling | 1.7+ |
| URP Sample Shaders | Toon-shading base | latest |
| TextMeshPro | UI text | bundled |
| Animation Rigging | Procedural anim helpers | latest |
| Addressables | Async asset loading | 1.21+ |
| Mobile Notifications | Lives reset reminders (later) | 2.x |
| Unity Analytics | Optional, off by default | 5.x |

Third-party (Asset Store / paid):
- **DOTween Pro** — UI tweens, timing utilities
- **Magica Cloth 2** — character cloth/hair sim (post-VS)
- **Easy Save 3** — save system (alternative to hand-rolled JSON)

---

## 3. Folder Structure

```
Assets/
├── _Project/
│   ├── Scripts/
│   │   ├── Core/             # Bootstrappers, services, GameManager
│   │   ├── Player/           # Avatar movement, controller
│   │   ├── Brainrots/        # Pickup, carry, scatter, identity SO
│   │   ├── Hazards/          # Axe, spike, geyser, meteor, etc.
│   │   ├── Level/            # Level loader, base/portal logic
│   │   ├── Boss/             # Phase manager, boss AI, summon logic
│   │   ├── UI/               # All UI scripts (HUD, menus, codex)
│   │   ├── Save/             # Save/load system, schema
│   │   ├── Input/            # Touch joystick, button handlers
│   │   ├── Audio/            # Audio manager, voice line player
│   │   └── Utils/            # Helpers, extensions
│   ├── Scenes/
│   │   ├── Boot.unity
│   │   ├── MainMenu.unity
│   │   ├── Customizer.unity
│   │   ├── LevelSelect.unity
│   │   ├── Level_1_Halls.unity
│   │   ├── Level_2_Sky.unity         # post-VS
│   │   ├── Level_3_Ocean.unity       # post-VS
│   │   ├── Level_4_Lava.unity        # post-VS
│   │   ├── BossArena.unity           # post-VS
│   │   └── BossLoadout.unity         # post-VS
│   ├── Prefabs/
│   │   ├── Player/
│   │   ├── Brainrots/
│   │   ├── Hazards/
│   │   ├── EnvironmentKits/
│   │   │   ├── L1_Halls/
│   │   │   ├── L2_Sky/
│   │   │   ├── L3_Ocean/
│   │   │   └── L4_Lava/
│   │   ├── UI/
│   │   └── VFX/
│   ├── ScriptableObjects/
│   │   ├── Brainrots/        # 21 BrainrotData SOs
│   │   ├── Levels/           # 5 LevelConfig SOs
│   │   ├── Cosmetics/        # Cosmetic items
│   │   └── Settings/         # Game tuning
│   ├── Models/               # FBX/GLB imports
│   ├── Textures/
│   ├── Materials/
│   ├── Shaders/
│   ├── Animations/
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   └── Voices/
│   └── UI/
│       ├── Sprites/
│       └── Fonts/
├── Plugins/                  # 3rd-party SDKs
└── Settings/                 # URP, Input, Build
ProjectSettings/              # Unity meta
Packages/                     # Manifest
```

---

## 4. Core Scripts (Vertical Slice)

### 4.1 GameManager
```csharp
// Assets/_Project/Scripts/Core/GameManager.cs
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public SaveData Save { get; private set; }
    public PlayerController Player { get; private set; }

    public event Action<int> OnLivesChanged;
    public event Action<BrainrotData> OnBrainrotDeposited;
    public event Action OnLevelComplete;
    public event Action OnGameOver;

    private void Awake() { /* singleton + load save */ }

    public void StartLevel(LevelConfig config) { /* ... */ }
    public void DepositBrainrot(BrainrotData brainrot) { /* ... */ }
    public void LoseLife() { /* ... */ }
    public void CompleteLevel() { /* ... */ }
}
```

### 4.2 PlayerController
- Component-based, on the player root prefab
- Subcomponents:
  - `Movement` (joystick → Rigidbody/CharacterController)
  - `JumpController` (jump, double-jump, coyote time, jump buffer)
  - `CarryStack` (manages picked-up brainrots stacked on player)
  - `HealthHandler` (lives interaction, scatter on hit)
  - `InteractionDetector` (sphere cast for pickups/deposits)

### 4.3 BrainrotData (ScriptableObject)
```csharp
[CreateAssetMenu(menuName = "Brainrots/Brainrot Data")]
public class BrainrotData : ScriptableObject
{
    public string id;
    public string displayName;
    public Sprite portrait;
    public GameObject worldPrefab;
    public GameObject summonPrefab;
    public AudioClip[] idleVoices;
    public AudioClip pickupVoice;
    public SummonAbility ability;       // CD, duration, damage, FX
    public int levelAssignment;         // 1-5
    public bool isBossOfLevel;
    public bool isBonus;
    public CosmeticData unlockedCosmetic;
}
```

### 4.4 BrainrotPickup
- Attached to brainrot prefabs in the level
- On player trigger enter → notify `CarryStack`
- Disables itself after pickup, registers for scatter on hit

### 4.5 CarryStack
- Holds list of `BrainrotData` currently carried
- Renders visible stack on player bone
- Applies movement penalty (0.3 m/s per item)
- On hit → `Scatter()`:
  - For each carried, instantiate at random `ScatterAnchor` in current section
  - Re-enable pickup
  - Play scatter VFX/SFX

### 4.6 BasePortal
- Singleton per level
- Receives deposits via `Deposit(BrainrotData data)`
- When `depositedCount == 5` → activate portal mesh + collider
- On player trigger → load next scene

### 4.7 SwingingAxe (Hazard)
- HingeJoint setup with constant motor torque (or animation curve)
- OnTriggerEnter on blade collider → `LoseLife()` + `Scatter()`

### 4.8 LevelConfig (ScriptableObject)
```csharp
[CreateAssetMenu(menuName = "Levels/Level Config")]
public class LevelConfig : ScriptableObject
{
    public int levelNumber;
    public string sceneName;
    public string displayName;
    public Sprite levelCardArt;
    public BrainrotData[] brainrots; // 5 entries
    public int targetTimeSeconds;
    public AudioClip music;
}
```

---

## 5. Scene Flow

```
Boot.unity ──► MainMenu.unity ──► LevelSelect.unity ──► Level_X.unity
                  │   ▲                  │                   │
                  │   │                  │                   │
                  ▼   │                  ▼                   ▼
            Customizer.unity         Codex                Pause
                                                            │
                                                 Quit ─────►┘
                                                            │
                                              On Complete ──► back to LevelSelect
```

- `Boot` is empty: initializes services, loads save, transitions to `MainMenu`
- All UI scenes use additive loading on top of a persistent `_Persistent` scene that holds `GameManager`, `AudioManager`, `SaveManager` etc.

---

## 6. Input System (Touch)

- Use Unity's new Input System with **OnScreenStick** + **OnScreenButton** components
- Action map: `Gameplay`
  - `Move` (Vector2) — left joystick
  - `Jump` (Button)
  - `Sprint` (Button, hold)
  - `Interact` (Button)
  - `Pause` (Button)
- Action map: `BossLoadout`
  - `Drag`, `Confirm`
- Action map: `BossFight`
  - `Move`, `BasicAttack`, `Dodge`, `SummonRadial`

---

## 7. Save System

### 7.1 Storage
- File: `Application.persistentDataPath/save.json`
- Encrypted? No (offline single-player, low risk)
- Format: JSON via Unity's `JsonUtility` or Newtonsoft for richer types

### 7.2 SaveManager
```csharp
public class SaveManager : MonoBehaviour
{
    public SaveData Current { get; private set; }
    public void Save() { /* serialize Current to disk */ }
    public void Load() { /* deserialize or new */ }
    public void Reset() { /* delete file */ }
}
```

### 7.3 Save trigger points
- After avatar customization changes
- After brainrot deposit
- After level completion
- On app pause (Unity `OnApplicationPause(true)`)
- Settings change

---

## 8. Audio Architecture

### 8.1 AudioManager
- Singleton with three mixers: **Music**, **SFX**, **Voice**
- API:
  - `PlayMusic(AudioClip, fade)` — crossfades between tracks
  - `PlaySfx(AudioClip, position, volume)`
  - `PlayVoice(AudioClip)` — for brainrot voice lines, with priority/queue

### 8.2 Voice line system
- Each brainrot has an assigned `AudioSource` pool
- Idle voice plays on a random timer (15–30 sec) when player is in range
- Pickup voice plays immediately on contact
- Mixer ducks SFX while voice plays

---

## 9. Camera

- **Cinemachine** virtual cameras
- One main `CinemachineFreeLook` style follow rig with manual control disabled
- Per-section dolly tracks for cinematic framing in tight corridors
- `CinemachineConfiner` to keep camera inside playable area
- Switch cameras on trigger zones (e.g., chase camera in Section D)

---

## 10. Performance Budget (Mobile)

| Metric | Target |
|---|---|
| Average frame time | 16ms (60fps) flagship; 33ms (30fps) mid-range |
| Draw calls | < 100 per frame |
| Triangles in view | < 250k |
| Texture memory | < 200 MB |
| RAM (heap) | < 1 GB |
| Build size | < 300 MB initial download |

### Optimizations
- URP with disabled shadows on small props
- LOD groups on all hero models
- Atlased textures for kit pieces
- GPU instancing for repeated assets (axes, spikes)
- Disable physics on far-away hazards (only active when player nearby)
- Audio: streamed for music, decompressed-on-load for SFX

---

## 11. Build Pipeline

### 11.1 iOS
1. Unity build → Xcode project export
2. Open in Xcode, set bundle identifier, signing
3. TestFlight for internal testing
4. App Store review submission

### 11.2 Android
1. Unity build → Gradle project
2. Sign with debug/release keystore
3. Internal testing track on Play Console
4. Production rollout (staged)

### 11.3 CI (later)
- GitHub Actions / Cursor Cloud Agents could run nightly mobile builds
- Unity Cloud Build is also an option

---

## 12. Code Conventions

- Namespaces: `Brainrots.<Domain>` (e.g., `Brainrots.Player`, `Brainrots.UI`)
- File-per-class
- PascalCase types, camelCase fields, `_camelCase` private fields with underscore optional
- Async: prefer `UniTask` over coroutines for new code (post-VS)
- No singletons except a few clearly defined services (`GameManager`, `AudioManager`, `SaveManager`)
- Use ScriptableObjects for configuration data, not hardcoded values

---

## 13. Testing

- **Editor playmode tests**: critical systems (CarryStack, SaveManager, BrainrotData lookups)
- **Integration**: scripted "auto-runner" that walks Level 1 path and verifies completion
- **Device QA**: manual on iPhone 12 + Pixel 6 each milestone
- **Performance**: Unity Profiler captures every milestone, target frame time check

---

## 14. Git & Repository Setup

- `.gitignore` for Unity (use the standard one, exclude `Library/`, `Temp/`, `Logs/`, `obj/`, `Build/`)
- **Git LFS** for: `*.fbx`, `*.psd`, `*.png` (large), `*.wav`, `*.mp3`, `*.mp4`
- Branching: `main` (always shippable) / `develop` / feature branches
- Commit style: conventional-commits (e.g., `feat(player): add coyote time`)

---

## 15. Repo Bootstrapping Checklist (Day 1)

- [ ] Create Unity 6 LTS project at repo root (folder: `Game/`)
- [ ] Set up URP and verify rendering
- [ ] Install all packages from Section 2
- [ ] Configure mobile build targets (iOS + Android) and verify they compile
- [ ] Set up `_Persistent` scene + `Boot` scene flow
- [ ] Create empty stub scripts in folder structure
- [ ] Initialize Git + LFS + `.gitignore`
- [ ] First commit, push to remote
- [ ] CI (later)

---

*End of TECH_ARCHITECTURE.md*
