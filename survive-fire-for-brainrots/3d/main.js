/* ============================================================================
   Survive Fire for Brainrots — 3D Prototype (Stumble Guys-style chase camera)
   Three.js + vanilla JS, no build step.
   ========================================================================== */

import * as THREE from 'three';

document.getElementById('loading').style.display = 'none';

/* ----- renderer + camera + scene ---------------------------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a3464);
scene.fog = new THREE.Fog(0x4a3464, 25, 70);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ----- lighting --------------------------------------------------------- */

scene.add(new THREE.AmbientLight(0x6a5a8a, 0.55));

const sun = new THREE.DirectionalLight(0xffeecc, 1.2);
sun.position.set(15, 25, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const SHADOW_HALF = 25;
sun.shadow.camera.left   = -SHADOW_HALF;
sun.shadow.camera.right  =  SHADOW_HALF;
sun.shadow.camera.top    =  SHADOW_HALF;
sun.shadow.camera.bottom = -SHADOW_HALF;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x9c6bff, 0.35);
fill.position.set(-12, 12, -8);
scene.add(fill);

/* ----- procedural textures --------------------------------------------- */

function makeStoneFloorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2a32';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 3;
  const tile = 64;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(256, i * tile); ctx.stroke();
  }
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.18})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBrickWallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b4327';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  const brickH = 32;
  const brickW = 64;
  for (let row = 0; row < 8; row++) {
    const offsetX = (row % 2 === 0) ? 0 : brickW / 2;
    const y = row * brickH;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    for (let x = offsetX; x < 256 + brickW; x += brickW) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + brickH); ctx.stroke();
    }
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.16})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const floorTex = makeStoneFloorTexture();
floorTex.repeat.set(15, 10);

const wallTex = makeBrickWallTexture();

/* ----- floor ----------------------------------------------------------- */

const ARENA_W = 30;
const ARENA_D = 20;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA_W, ARENA_D),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

/* ----- arena walls ----------------------------------------------------- */

function makeWall(x, z, w, d, h = 4) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const tex = wallTex.clone();
  tex.needsUpdate = true;
  tex.repeat.set(Math.max(w, d) / 2, h / 2);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

makeWall(0, -ARENA_D / 2, ARENA_W, 1);   // back
makeWall(0,  ARENA_D / 2, ARENA_W, 1);   // front
makeWall(-ARENA_W / 2, 0, 1, ARENA_D);   // left
makeWall( ARENA_W / 2, 0, 1, ARENA_D);   // right

// inner pillars for spatial scale reference
makeWall(-7, -3, 1.6, 1.6);
makeWall( 7,  3, 1.6, 1.6);
makeWall(-9,  5, 1.6, 1.6);

/* ----- player (chunky bean character) ---------------------------------- */

const player = new THREE.Group();
player.position.set(0, 0, 7);

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.55, 1.0, 6, 16),
  new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.45 })
);
body.position.y = 0.95;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0xfde2c0, roughness: 0.55 })
);
head.position.y = 2.1;
head.castShadow = true;
player.add(head);

const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.18, 2.18, -0.42); player.add(eyeL);
const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set( 0.18, 2.18, -0.42); player.add(eyeR);

const armGeo = new THREE.CapsuleGeometry(0.16, 0.55, 4, 10);
const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.45 });

const armL = new THREE.Group(); armL.position.set(-0.65, 1.55, 0);
const armLMesh = new THREE.Mesh(armGeo, armMat);
armLMesh.position.y = -0.4; armLMesh.castShadow = true;
armL.add(armLMesh);
player.add(armL);

const armR = new THREE.Group(); armR.position.set( 0.65, 1.55, 0);
const armRMesh = new THREE.Mesh(armGeo, armMat);
armRMesh.position.y = -0.4; armRMesh.castShadow = true;
armR.add(armRMesh);
player.add(armR);

const legGeo = new THREE.CapsuleGeometry(0.22, 0.4, 4, 10);
const legMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness: 0.7 });

const legL = new THREE.Group(); legL.position.set(-0.28, 0.35, 0);
const legLMesh = new THREE.Mesh(legGeo, legMat);
legLMesh.position.y = -0.25; legLMesh.castShadow = true;
legL.add(legLMesh);
player.add(legL);

const legR = new THREE.Group(); legR.position.set( 0.28, 0.35, 0);
const legRMesh = new THREE.Mesh(legGeo, legMat);
legRMesh.position.y = -0.25; legRMesh.castShadow = true;
legR.add(legRMesh);
player.add(legR);

scene.add(player);

/* ----- billboard sprite helper ----------------------------------------- */

function makeEmojiSprite(emoji, sizePx = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = sizePx;
  const ctx = c.getContext('2d');
  ctx.font = `bold ${Math.floor(sizePx * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, sizePx / 2, sizePx / 2 + sizePx * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
}

function makeLabelSprite(text, color = '#ffe066') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(20,12,30,0.85)';
  ctx.fillRect(8, 16, 496, 64);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 16, 496, 64);
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  s.scale.set(4, 0.75, 1);
  return s;
}

/* ----- brainrot pickup ------------------------------------------------- */

function makeBrainrot(emoji, name, x, z, color) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // glowing pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.8, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0x9c6bff, emissive: 0x4a235d, emissiveIntensity: 0.5 })
  );
  pedestal.position.y = 0.15;
  pedestal.receiveShadow = true;
  pedestal.castShadow = true;
  group.add(pedestal);

  // body sphere
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 18),
    new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4,
    })
  );
  orb.position.y = 1.1;
  orb.castShadow = true;
  group.add(orb);

  // emoji billboard
  const emojiSprite = makeEmojiSprite(emoji);
  emojiSprite.scale.set(1.6, 1.6, 1.6);
  emojiSprite.position.y = 1.1;
  group.add(emojiSprite);

  // name label above
  const labelSprite = makeLabelSprite(name);
  labelSprite.position.y = 2.5;
  group.add(labelSprite);

  scene.add(group);
  return { group, orb, emojiSprite, labelSprite, x, z, picked: false };
}

const brainrot = makeBrainrot('🦢💣', 'Bombombini Gusini', 0, -7, 0xffe066);

/* ----- swinging axe hazard --------------------------------------------- */

function makeAxe(x, z, anchorY = 4.2, length = 2.6) {
  const anchor = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 0.9 })
  );
  anchor.position.set(x, anchorY, z);
  anchor.castShadow = true;
  scene.add(anchor);

  const pivot = new THREE.Group();
  pivot.position.set(x, anchorY, z);
  scene.add(pivot);

  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, length, 8),
    new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.4 })
  );
  chain.position.y = -length / 2;
  pivot.add(chain);

  // blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.7, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.85, roughness: 0.25 })
  );
  blade.position.y = -length;
  blade.castShadow = true;
  pivot.add(blade);

  // axe-head emoji billboard at the blade
  const bladeSprite = makeEmojiSprite('🪓', 128);
  bladeSprite.scale.set(1.1, 1.1, 1.1);
  bladeSprite.position.set(0, -length, 0.25);
  pivot.add(bladeSprite);

  return { pivot, blade, anchor, x, z, length };
}

const axe = makeAxe(2, -1);
const axe2 = makeAxe(-3, -3);

/* ----- input ----------------------------------------------------------- */

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

const joystick = {
  active: false,
  pointerId: null,
  startX: 0, startY: 0,
  currentX: 0, currentY: 0,
  maxRadius: 70,
  outerEl: document.getElementById('joy-outer'),
  innerEl: document.getElementById('joy-inner'),
};

function showJoystick(x, y) {
  joystick.outerEl.style.display = 'block';
  joystick.innerEl.style.display = 'block';
  joystick.outerEl.style.left = (x - 70) + 'px';
  joystick.outerEl.style.top  = (y - 70) + 'px';
  joystick.innerEl.style.left = (x - 28) + 'px';
  joystick.innerEl.style.top  = (y - 28) + 'px';
}
function hideJoystick() {
  joystick.outerEl.style.display = 'none';
  joystick.innerEl.style.display = 'none';
}

window.addEventListener('pointerdown', (e) => {
  if (joystick.active) return;
  if (e.target && e.target.tagName === 'A') return;
  if (e.clientX > window.innerWidth * 0.6) return;
  joystick.active = true;
  joystick.pointerId = e.pointerId;
  joystick.startX = e.clientX; joystick.startY = e.clientY;
  joystick.currentX = e.clientX; joystick.currentY = e.clientY;
  showJoystick(e.clientX, e.clientY);
});
window.addEventListener('pointermove', (e) => {
  if (!joystick.active || e.pointerId !== joystick.pointerId) return;
  let dx = e.clientX - joystick.startX;
  let dy = e.clientY - joystick.startY;
  const d = Math.hypot(dx, dy);
  if (d > joystick.maxRadius) {
    dx = (dx / d) * joystick.maxRadius;
    dy = (dy / d) * joystick.maxRadius;
  }
  joystick.currentX = joystick.startX + dx;
  joystick.currentY = joystick.startY + dy;
  joystick.innerEl.style.left = (joystick.currentX - 28) + 'px';
  joystick.innerEl.style.top  = (joystick.currentY - 28) + 'px';
});
function endJoystick(e) {
  if (e.pointerId !== joystick.pointerId) return;
  joystick.active = false;
  joystick.pointerId = null;
  hideJoystick();
}
window.addEventListener('pointerup', endJoystick);
window.addEventListener('pointercancel', endJoystick);

function getInput() {
  let f = 0, r = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    f += 1;
  if (keys['KeyS'] || keys['ArrowDown'])  f -= 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  r -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) r += 1;

  if (joystick.active) {
    f = -(joystick.currentY - joystick.startY) / joystick.maxRadius; // up on screen = forward
    r =  (joystick.currentX - joystick.startX) / joystick.maxRadius;
  }
  const m = Math.hypot(f, r);
  if (m > 1) { f /= m; r /= m; }
  return { forward: f, right: r, magnitude: Math.min(m, 1) };
}

/* ----- gameplay state -------------------------------------------------- */

let pickedUp = false;
let invincibleUntil = 0;

/* ----- audio ----------------------------------------------------------- */

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { /* noop */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(type = 'pickup') {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const presets = {
    pickup: { f1: 660, f2: 990, dur: 0.18, type: 'sine',     vol: 0.18 },
    hit:    { f1: 200, f2: 60,  dur: 0.25, type: 'sawtooth', vol: 0.22 },
  };
  const p = presets[type] || presets.pickup;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.f1, t0);
  osc.frequency.exponentialRampToValueAtTime(p.f2, t0 + p.dur);
  g.gain.setValueAtTime(p.vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + p.dur);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + p.dur);
}
function speak(text) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'it-IT';
      u.rate = 1.1;
      window.speechSynthesis.speak(u);
    }
  } catch (_) { /* noop */ }
}
window.addEventListener('pointerdown', ensureAudio, { once: false });
window.addEventListener('keydown',   ensureAudio, { once: false });

/* ----- main loop ------------------------------------------------------- */

const clock = new THREE.Clock();
const playerSpeed = 7;

const tmpForward = new THREE.Vector3();
const tmpRight   = new THREE.Vector3();
const tmpMove    = new THREE.Vector3();
const tmpCamPos  = new THREE.Vector3();
const tmpCamLook = new THREE.Vector3();

function clampToArena(p) {
  const half = (ARENA_W - 1) / 2 - 0.6;
  const halfD = (ARENA_D - 1) / 2 - 0.6;
  p.x = Math.max(-half, Math.min(half, p.x));
  p.z = Math.max(-halfD, Math.min(halfD, p.z));
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.getElapsedTime();

  // ---- input ----
  const input = getInput();

  // ---- camera-relative movement direction ----
  // Camera forward projected onto XZ plane
  camera.getWorldDirection(tmpForward);
  tmpForward.y = 0; tmpForward.normalize();
  tmpRight.crossVectors(tmpForward, new THREE.Vector3(0, 1, 0)).normalize();

  tmpMove.set(0, 0, 0);
  tmpMove.addScaledVector(tmpForward, input.forward);
  tmpMove.addScaledVector(tmpRight, input.right);

  if (input.magnitude > 0.05) {
    player.position.addScaledVector(tmpMove, playerSpeed * dt);
    clampToArena(player.position);

    // face movement direction (smoothed)
    const targetAngle = Math.atan2(tmpMove.x, tmpMove.z);
    let dAng = targetAngle - player.rotation.y;
    while (dAng > Math.PI)  dAng -= Math.PI * 2;
    while (dAng < -Math.PI) dAng += Math.PI * 2;
    player.rotation.y += dAng * Math.min(1, 12 * dt);

    // run cycle: leg + arm bob
    const cycle = t * 14;
    legL.rotation.x =  Math.sin(cycle) * 0.55;
    legR.rotation.x = -Math.sin(cycle) * 0.55;
    armL.rotation.x = -Math.sin(cycle) * 0.55;
    armR.rotation.x =  Math.sin(cycle) * 0.55;
    body.position.y = 0.95 + Math.abs(Math.sin(cycle)) * 0.06;
    head.position.y = 2.1  + Math.abs(Math.sin(cycle)) * 0.06;
    eyeL.position.y = 2.18 + Math.abs(Math.sin(cycle)) * 0.06;
    eyeR.position.y = 2.18 + Math.abs(Math.sin(cycle)) * 0.06;
  } else {
    legL.rotation.x = 0;
    legR.rotation.x = 0;
    armL.rotation.x = 0;
    armR.rotation.x = 0;
    body.position.y = 0.95 + Math.sin(t * 2) * 0.02;
    head.position.y = 2.1  + Math.sin(t * 2 + 0.4) * 0.02;
    eyeL.position.y = 2.18 + Math.sin(t * 2 + 0.4) * 0.02;
    eyeR.position.y = 2.18 + Math.sin(t * 2 + 0.4) * 0.02;
  }

  // ---- chase camera ----
  // Behind+above player, fixed world orientation, smoothed follow.
  tmpCamPos.set(
    player.position.x,
    player.position.y + 5.2,
    player.position.z + 8.5,
  );
  // exponential lerp - frame-rate independent
  const camLerp = 1 - Math.exp(-6 * dt);
  camera.position.lerp(tmpCamPos, camLerp);

  tmpCamLook.set(
    player.position.x,
    player.position.y + 1.3,
    player.position.z,
  );
  camera.lookAt(tmpCamLook);

  // ---- swinging axes ----
  axe.pivot.rotation.x  = Math.sin(t * 1.7 + 0.3) * (Math.PI / 3);
  axe2.pivot.rotation.x = Math.sin(t * 1.3 + 1.7) * (Math.PI / 3);

  // ---- brainrot float ----
  if (!pickedUp) {
    const f = 1.1 + Math.sin(t * 2.5) * 0.18;
    brainrot.orb.position.y = f;
    brainrot.emojiSprite.position.y = f;
    brainrot.group.rotation.y = t * 0.6;
  }

  // ---- pickup detection ----
  if (!pickedUp) {
    const dx = player.position.x - brainrot.x;
    const dz = player.position.z - brainrot.z;
    if (Math.hypot(dx, dz) < 1.6) {
      pickedUp = true;
      brainrot.group.visible = false;
      beep('pickup');
      speak('Bombombini Gusini!');
      const info = document.getElementById('info');
      if (info) {
        info.innerHTML =
          '<strong>Got it! 🎉</strong><br>You picked up <em>Bombombini Gusini</em>.<br>' +
          'Press R to reset · <a href="../">← back to 2D version</a>';
      }
    }
  }

  // ---- axe collision ----
  if (performance.now() > invincibleUntil && !pickedUp) {
    [axe, axe2].forEach((a) => {
      // blade world position
      const bladeWorld = new THREE.Vector3();
      a.blade.getWorldPosition(bladeWorld);
      const dx = player.position.x - bladeWorld.x;
      const dy = (player.position.y + 1.0) - bladeWorld.y;
      const dz = player.position.z - bladeWorld.z;
      if (Math.hypot(dx, dy, dz) < 1.1) {
        invincibleUntil = performance.now() + 1500;
        beep('hit');
        // knockback
        const knockDir = new THREE.Vector3(dx, 0, dz).normalize();
        player.position.addScaledVector(knockDir, 1.5);
        clampToArena(player.position);
      }
    });
  }

  // flicker invincibility
  if (performance.now() < invincibleUntil) {
    const flicker = Math.floor(performance.now() / 80) % 2 === 0 ? 0.3 : 1.0;
    body.material.opacity = flicker;
    body.material.transparent = true;
    head.material.opacity = flicker;
    head.material.transparent = true;
  } else if (body.material.transparent) {
    body.material.opacity = 1.0;
    body.material.transparent = false;
    head.material.opacity = 1.0;
    head.material.transparent = false;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') location.reload();
});

animate();
