// ShiftReady: construction-site hazard recognition trainer (WebXR, three.js).
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {
  M, box, cyl, sign, cone, ribbon, makeGround, makeTrench, TRENCH, makeWorker, animateWalk,
  makeDumpTruck, makeExcavator, makeBoomTruck, setBoom, makeTowerCrane, setCrane, makeBuilding,
  makePowerLine, makeSiteOffice, makePickup, makeProtectedArea, PROTECTED,
} from './world.js';
import { Panel, panels, roundRect } from './panel.js';
import { audio, initAudio, setSound, addEngine, setEngineLoad, addBeeper, updateBeeper, cue } from './audio.js';
import { PROCEDURE, RULES, CATS, ROLES, SITUATIONS_PER_SHIFT, BADGES, FAQ, DOC_PAGES } from './content.js';

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message)));

const CFG = Object.assign({ proxyUrl: '' }, window.SHIFTREADY_CONFIG || {});
const DECK_Y = 3;
const EYE = 1.6;
const EYE_Y = DECK_Y + EYE;
const HEAD = new THREE.Vector3(0, EYE_Y, 0);

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.getElementById('app').appendChild(renderer.domElement);
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(vrButton);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaecbe3);
scene.fog = new THREE.Fog(0xaecbe3, 70, 190);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';
const rig = new THREE.Group();
rig.position.set(0, DECK_Y, 0);
scene.add(rig);
camera.position.set(0, EYE, 0);
camera.rotation.x = -0.14;
rig.add(camera);

scene.add(new THREE.HemisphereLight(0xe3f0ff, 0x6b5a45, 1.15));
const sun = new THREE.DirectionalLight(0xfff1dc, 1.7);
sun.position.set(-35, 55, 25);
scene.add(sun);

// ---------------------------------------------------------------- site
scene.add(makeGround());
makeTrench(scene);
scene.add(makeSiteOffice(DECK_Y));

const building = makeBuilding();
building.position.set(6, 0, -40);
scene.add(building);

const crane = makeTowerCrane(30);
crane.position.set(22, 0, -46);
scene.add(crane);

scene.add(makeProtectedArea());

const POWER_Z = -35;
scene.add(makePowerLine(POWER_Z, [-45, -24, -3], 10));

// haul road loop in the front yard
const roadPts = [];
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  roadPts.push(new THREE.Vector3(-1 + Math.cos(a) * 21, 0, -12.5 + Math.sin(a) * 3.6));
}
const roadCurve = new THREE.CatmullRomCurve3(roadPts, true, 'centripetal');
scene.add(ribbon(roadCurve, 5.5, M.gravel, 0.02));

// stockpile, walkway, crossing, signs, fences
const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), M.gravel);
pile.scale.set(3.6, 2.2, 3.2);
pile.position.set(-19.5, 0, -23);
scene.add(pile);
const walkMat = new THREE.MeshStandardMaterial({ color: 0x3f9e57, roughness: 0.9 });
box(1.4, 0.03, 5.0, walkMat, 5.6, 0.03, -3.4, scene);
for (let i = 0; i < 5; i++) box(0.5, 0.035, 2.2, M.white, -2.6 + i * 1.0, 0.04, -6.6, scene);
sign(['RIVERSIDE MID-RISE', 'PHASE 2 · fictional site'], 3.2, 1.3, { bg: '#1f4e79', fg: '#ffffff', border: '#ffffff', font: 54 }, -7.5, 0, -4.5, 0.25, scene, 1.6);
sign(['DANGER', 'OVERHEAD POWER LINES'], 2.0, 1.0, { bg: '#ffd200', font: 60 }, -22, 0, -29.5, 0.3, scene, 1.5);
sign(['CAUTION', 'CRANE LIFTING ABOVE'], 2.0, 1.0, { bg: '#ffd200', font: 58 }, 24.5, 0, -29.5, -0.4, scene, 1.5);
sign(['TRENCH', 'KEEP BACK 1 m'], 1.6, 0.8, { bg: '#ff6a13', fg: '#111', font: 60 }, 4.6, 0, -18.4, 0, scene, 1.0);
sign(['PEDESTRIAN', 'WALKWAY'], 1.4, 0.7, { bg: '#2f9e44', fg: '#ffffff', border: '#ffffff', font: 46 }, 6.8, 0, -5.4, -0.3, scene, 1.0);
for (let x = -28; x <= -6; x += 3) scene.add(cone(x, -29.6));
for (let z = -4; z >= -36; z -= 4) scene.add(cone(27, z));
// perimeter fence
const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.55 });
box(90, 1.9, 0.05, fenceMat, -5, 0.95, -60, scene);
box(0.05, 1.9, 60, fenceMat, -50, 0.95, -30, scene);
box(0.05, 1.9, 60, fenceMat, 40, 0.95, -30, scene);
// a few background buildings for scale
for (const [x, z, w, h, d] of [[-40, -85, 18, 22, 14], [10, -95, 26, 34, 16], [48, -78, 16, 18, 14], [-75, -55, 14, 12, 20]]) {
  box(w, h, d, new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.9 }), x, h / 2, z, scene);
}

// ---------------------------------------------------------------- actors
const actors = {};
const hitTargets = [];
function addActor(id, obj, { safeText = null, label = id } = {}) {
  obj.userData.actorId = id;
  actors[id] = { id, obj, safeText, label };
  obj.traverse((o) => { if (o.userData && o.userData.isHit) hitTargets.push(o); });
  return obj;
}

const truckA = addActor('truckA', makeDumpTruck(), { safeText: 'That haul truck is on the haul road with a clear path. Nothing wrong there.' });
scene.add(truckA);
let truckU = 0.1;

const truckB = addActor('truckB', makeDumpTruck(), { safeText: 'That truck is parked by the stockpile with no one behind it. It is fine right now.' });
truckB.rotation.y = Math.PI / 2;
const TB_HOME = -8;
truckB.position.set(TB_HOME, 0, -23);
scene.add(truckB);

const excavator = addActor('excavator', makeExcavator(), { safeText: 'The excavator is digging with no one inside its swing radius. That is fine.' });
excavator.position.set(3.5, 0, -23.5);
scene.add(excavator);

const boomTruck = addActor('boomTruck', makeBoomTruck(), { safeText: 'The boom truck is stowed, well clear of the power line. No problem there.' });
boomTruck.rotation.y = Math.PI / 2;
boomTruck.position.set(-15, 0, -30.5);
scene.add(boomTruck);

const PICKUP_HOME = new THREE.Vector3(22.6, 0, -18.0);
const PICKUP_PATH = [new THREE.Vector3(21.2, 0, -22.4), new THREE.Vector3(19.2, 0, -26.0)];
const pickup = addActor('pickup', makePickup(), { safeText: 'That pickup is parked in the laydown area, off the protected ground. Fine.' });
pickup.position.copy(PICKUP_HOME);
pickup.rotation.y = Math.PI;
scene.add(pickup);

addActor('crane', crane, { safeText: 'The crane is lifting over the barricaded zone with nobody underneath. That is fine.' });

// situation workers (hidden until their situation)
const wCrane = addActor('wCrane', makeWorker({ vest: M.orange }));
const wEdge = addActor('wEdge', makeWorker({ vest: M.orange, hat: M.yellow }));
const wTrench = addActor('wTrench', makeWorker({ vest: M.lime, hat: M.white }));
const wRev = addActor('wRev', makeWorker({ vest: M.orange, hat: M.white }));
const wSwing = addActor('wSwing', makeWorker({ vest: M.lime, hat: M.yellow }));
const wPow = addActor('wPow', makeWorker({ vest: M.orange, hat: M.white }));
for (const w of [wCrane, wTrench, wRev, wSwing, wPow]) { w.visible = false; scene.add(w); }
wEdge.visible = false;
building.add(wEdge);
for (const w of [wEdge]) w.children.find((c) => c.userData.isHit).scale.set(2.2, 1.4, 2.2);

// distractors: look a bit risky, but follow the rules
const d1 = addActor('dTrenchBox', makeWorker({ vest: M.lime }), { safeText: 'That worker is inside the trench box, so the trench walls are supported. Rule 5.4 is met.' });
d1.position.set(13.6, -1.25, -20.7);
d1.rotation.y = -Math.PI / 2;
scene.add(d1);
const d2 = addActor('dLevel2', makeWorker({ vest: M.orange, hat: M.yellow }), { safeText: 'The guardrail is in place on that edge, so Rule 4.1 is met.' });
d2.position.set(-6, 7.2, 6.0);
building.add(d2);
d2.children.find((c) => c.userData.isHit).scale.set(2.2, 1.4, 2.2);
const d3 = addActor('dWalkway', makeWorker({ vest: M.orange }), { safeText: 'That worker is using the marked pedestrian walkway. Correct.' });
d3.position.set(5.6, 0, -1.5);
scene.add(d3);
const d4 = addActor('dFlagger', makeWorker({ vest: M.lime, paddle: true }), { safeText: 'The traffic control person is in hi-vis and standing clear of the travel lane. That is correct.' });
d4.userData.holding = true;
d4.position.set(-4.6, 0, -5.6);
d4.rotation.y = 0.4;
scene.add(d4);

// safety coach on the deck
const coach = makeWorker({ vest: M.blue, hat: M.white });
coach.position.set(3.1, DECK_Y, -1.2);
coach.lookAt(0, DECK_Y, 0);
coach.userData.holding = true;
scene.add(coach);
const clipboard = box(0.22, 0.3, 0.02, M.wood, 0, -0.55, 0.12);
coach.userData.arms[1].add(clipboard);
coach.userData.arms[1].rotation.x = -0.8;

// ---------------------------------------------------------------- helpers
const tmpV = new THREE.Vector3();
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);
function approach(cur, target, maxStep) {
  const d = target - cur;
  return Math.abs(d) <= maxStep ? target : cur + Math.sign(d) * maxStep;
}
function walkTo(w, x, z, speed, dt, y = null) {
  const dx = x - w.position.x, dz = z - w.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) { animateWalk(w, 0, dt); return true; }
  const step = Math.min(d, speed * dt);
  w.position.x += (dx / d) * step;
  w.position.z += (dz / d) * step;
  if (y !== null) w.position.y = y;
  w.rotation.y = Math.atan2(dx, dz);
  animateWalk(w, speed, dt);
  return false;
}

// ---------------------------------------------------------------- equipment state
const eq = {
  craneBlend: 0, craneTarget: 0,
  exAmp: 0.55, exAmpT: 0.55, exCenter: 1.15, exCenterT: 1.15, exPhase: 0,
  boomYaw: 0, boomYawT: 0, boomPitch: 0.08, boomPitchT: 0.08, boomLen: 6, boomLenT: 6,
  tbX: TB_HOME, tbXT: TB_HOME, tbSpeed: 0.55,
};
const CRANE_P = new THREE.Vector3(20.5, 0, -34);
const CRANE_SIT = (() => {
  const dx = CRANE_P.x - crane.position.x, dz = CRANE_P.z - crane.position.z;
  return { angle: Math.atan2(-dz, dx), r: Math.hypot(dx, dz), drop: 22.1 };
})();

let simT = 0;
function updateEquipment(dt) {
  // haul truck on the loop
  const loopLen = roadCurve.getLength();
  truckU = (truckU + (6 * dt) / loopLen) % 1;
  const p = roadCurve.getPointAt(truckU);
  const q = roadCurve.getPointAt((truckU + 0.004) % 1);
  truckA.position.copy(p);
  truckA.lookAt(q);
  truckA.userData.beacon.material.color.setHSL(0.08, 1, 0.45 + 0.25 * Math.sin(simT * 12));
  // tower crane: idle slewing, blended toward the situation pose
  eq.craneBlend = approach(eq.craneBlend, eq.craneTarget, dt / 3.2);
  const k = smooth(eq.craneBlend);
  const idle = { angle: -2.55 + 0.5 * Math.sin(simT * 0.09), r: 17 + 5 * Math.sin(simT * 0.13), drop: 14 + 4 * Math.sin(simT * 0.11) };
  setCrane(crane, lerp(idle.angle, CRANE_SIT.angle, k), lerp(idle.r, CRANE_SIT.r, k), lerp(idle.drop, CRANE_SIT.drop, k));
  crane.userData.load.rotation.y = 0.3 * Math.sin(simT * 0.4);
  // excavator swing
  eq.exAmp = approach(eq.exAmp, eq.exAmpT, dt * 0.4);
  eq.exCenter = approach(eq.exCenter, eq.exCenterT, dt * 0.4);
  eq.exPhase += dt * (0.45 + 0.25 * (eq.exAmp > 0.8 ? 1 : 0));
  const sw = Math.sin(eq.exPhase);
  excavator.userData.house.rotation.y = eq.exCenter + eq.exAmp * sw;
  excavator.userData.boom.rotation.x = -0.55 - 0.18 * Math.cos(eq.exPhase * 2);
  excavator.userData.stick.rotation.x = 1.45 + 0.25 * Math.sin(eq.exPhase * 2);
  setEngineLoad(engines.ex, 0.3 + 0.6 * Math.abs(Math.cos(eq.exPhase)) * Math.min(1, eq.exAmp));
  // boom truck
  eq.boomYaw = approach(eq.boomYaw, eq.boomYawT, dt * 0.7);
  const yawDone = Math.abs(eq.boomYaw - eq.boomYawT) < 0.01;
  if (yawDone || eq.boomPitchT < eq.boomPitch) {
    eq.boomPitch = approach(eq.boomPitch, eq.boomPitchT, dt * 0.16);
    eq.boomLen = approach(eq.boomLen, eq.boomLenT, dt * 0.5);
  }
  boomTruck.userData.turret.rotation.y = eq.boomYaw;
  setBoom(boomTruck, eq.boomPitch, eq.boomLen);
  const boomMoving = Math.abs(eq.boomPitch - eq.boomPitchT) > 0.01 || !yawDone;
  setEngineLoad(engines.boom, boomMoving ? 0.6 : 0.05);
  // truck B reversing toward the stockpile
  const before = eq.tbX;
  eq.tbX = approach(eq.tbX, eq.tbXT, dt * eq.tbSpeed);
  truckB.position.x = eq.tbX;
  const reversing = eq.tbX < before - 1e-4;
  updateBeeper(reversing, dt);
  setEngineLoad(engines.tb, reversing || eq.tbX > before + 1e-4 ? 0.45 : 0.05);
  truckB.userData.beacon.material.color.setHSL(0.08, 1, reversing ? 0.45 + 0.25 * Math.sin(simT * 12) : 0.35);
  // walkway distractor paces back and forth
  const wz = -1.4 - 2.2 * (1 + Math.sin(simT * 0.25));
  const prevZ = d3.position.z;
  d3.position.z = wz;
  d3.rotation.y = wz < prevZ ? Math.PI : 0;
  animateWalk(d3, 0.6, dt);
}

// ---------------------------------------------------------------- situations
const SIT = {
  crane: {
    hazards: ['wCrane', 'crane'],
    focus: wCrane,
    setup() {
      eq.craneTarget = 1;
      wCrane.position.set(23.0, 0, -29.6);
      wCrane.visible = true;
    },
    update(t, dt) {
      if (t > 1.0) walkTo(wCrane, 19.2, -38.2, 1.2, dt);
      else animateWalk(wCrane, 0, dt);
    },
    reset() { eq.craneTarget = 0; wCrane.visible = false; },
  },
  edge: {
    hazards: ['wEdge'],
    focus: wEdge,
    setup() {
      building.userData.gap.visible = false;
      wEdge.position.set(-1.6, 10.8, 6.1);
      wEdge.rotation.y = 0;
      wEdge.visible = true;
    },
    update(t, dt) {
      const tx = 1.4 * Math.sin(t * 0.5);
      walkTo(wEdge, tx, 6.35, 0.7, dt, 10.8);
      if (Math.abs(wEdge.position.x - tx) < 0.1) wEdge.rotation.y = 0;
    },
    reset() { building.userData.gap.visible = true; wEdge.visible = false; },
  },
  trench: {
    hazards: ['wTrench'],
    focus: wTrench,
    setup() {
      wTrench.position.set(12.6, 0, -18.4);
      wTrench.visible = true;
    },
    update(t, dt) {
      if (t < 0.6) return animateWalk(wTrench, 0, dt);
      const arrived = walkTo(wTrench, 8.6, -19.45, 1.3, dt);
      if (arrived) {
        wTrench.rotation.y = Math.PI;
        wTrench.userData.down = (wTrench.userData.down || 0) + dt;
        const d = clamp(wTrench.userData.down / 1.6, 0, 1);
        wTrench.position.y = -1.25 * d;
        wTrench.position.z = -19.45 - 1.25 * d;
      }
    },
    reset() { wTrench.visible = false; wTrench.position.y = 0; wTrench.userData.down = 0; },
  },
  reverse: {
    hazards: ['wRev', 'truckB'],
    focus: wRev,
    setup() {
      eq.tbXT = TB_HOME - 2.4;
      eq.tbSpeed = 0.5;
      wRev.position.set(-14.5, 0, -18.8);
      wRev.visible = true;
    },
    update(t, dt) {
      if (t > 1.2) walkTo(wRev, -14.5, -28.0, 0.85, dt);
      else animateWalk(wRev, 0, dt);
    },
    reset() { eq.tbXT = TB_HOME; eq.tbSpeed = 0.9; wRev.visible = false; },
  },
  swing: {
    hazards: ['wSwing', 'excavator'],
    focus: wSwing,
    setup() {
      eq.exAmpT = 1.15; eq.exCenterT = 0.45;
      wSwing.position.set(-2.6, 0, -20.6);
      wSwing.visible = true;
    },
    update(t, dt) {
      if (t > 0.5 && walkTo(wSwing, 1.0, -22.2, 1.1, dt)) wSwing.rotation.y = Math.PI / 2;
    },
    reset() { eq.exAmpT = 0.55; eq.exCenterT = 1.15; wSwing.visible = false; },
  },
  power: {
    hazards: ['boomTruck', 'wPow'],
    focus: boomTruck,
    setup() {
      eq.boomYawT = Math.PI / 2; eq.boomPitchT = 0.84; eq.boomLenT = 8.6;
      wPow.position.set(-12.6, 0, -28.2);
      wPow.rotation.y = Math.PI * 0.85;
      wPow.visible = true;
    },
    update(t, dt) { animateWalk(wPow, 0, dt); },
    reset() { eq.boomYawT = 0; eq.boomPitchT = 0.08; eq.boomLenT = 6; wPow.visible = false; },
  },
  env: {
    hazards: ['pickup'],
    focus: pickup,
    setup() { pickup.userData.leg = 0; },
    update(t, dt) {
      let moving = false;
      const leg = pickup.userData.leg || 0;
      if (t > 1.0 && leg < PICKUP_PATH.length) {
        const p = PICKUP_PATH[leg];
        const dx = p.x - pickup.position.x, dz = p.z - pickup.position.z;
        const d = Math.hypot(dx, dz);
        const step = Math.min(d, 2.3 * dt);
        if (d < 0.05) pickup.userData.leg = leg + 1;
        else {
          pickup.position.x += (dx / d) * step;
          pickup.position.z += (dz / d) * step;
          const target = Math.atan2(dx, dz);
          let diff = target - pickup.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          pickup.rotation.y += diff * Math.min(1, dt * 3);
          moving = true;
        }
      }
      if (engines.pickup) setEngineLoad(engines.pickup, moving ? 0.55 : 0.08);
      pickup.userData.beacon.material.color.setHSL(0.08, 1, moving ? 0.45 + 0.25 * Math.sin(simT * 12) : 0.35);
    },
    reset() {
      pickup.position.copy(PICKUP_HOME);
      pickup.rotation.y = Math.PI;
      pickup.userData.leg = 0;
      if (engines.pickup) setEngineLoad(engines.pickup, 0.05);
      pickup.userData.beacon.material.color.setHSL(0.08, 1, 0.35);
    },
  },
};

// ---------------------------------------------------------------- learner model and shift state
const S = {
  phase: 'intro', role: 'new', shiftNo: 0, idx: 0, cat: null, t: 0, phaseT: 0, window: 10,
  score: 0, streak: 0, best: 0, caught: 0, falseAlarms: 0, msg: '', badges: [], missed: new Set(),
  lastCat: null, hinted: false, rec: null, records: [], allRecords: [], skill: {}, reactions: [],
  plan: [], converted: false, docPage: 0, readT: 0, pagesRead: new Set([DOC_PAGES[0].no]), lit: new Set(), litNow: null,
  review: false, shiftT: 0, cleared: false, uncleared: [], lastUncleared: [],
};
function baseSkills(role) { const o = {}; for (const c of CATS) o[c] = ROLES[role].skill; return o; }
S.skill = baseSkills(S.role);
try {
  const saved = JSON.parse(localStorage.getItem('shiftready-profile') || 'null');
  if (saved && saved.role && ROLES[saved.role]) { S.role = saved.role; S.skill = Object.assign(baseSkills(saved.role), saved.skill); S.shiftNo = saved.shiftNo || 0; }
} catch (e) { /* storage unavailable */ }
function saveProfile() {
  try { localStorage.setItem('shiftready-profile', JSON.stringify({ role: S.role, skill: S.skill, shiftNo: S.shiftNo })); } catch (e) { /* ignore */ }
}

function windowFor(cat) { return Math.max(5, ROLES[S.role].window * (1 - 0.3 * S.skill[cat])); }
// Every shift covers every rule on the page once (rules missed last shift come first),
// then any extra situations go to the rule with the lowest skill.
function planShift() {
  const first = S.lastUncleared.filter((c) => CATS.includes(c)).sort((a, b) => S.skill[a] - S.skill[b]);
  const rest = CATS.filter((c) => !first.includes(c));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  S.plan = first.concat(rest);
}
function pickNext() {
  if (S.idx <= S.plan.length) return S.plan[S.idx - 1];
  return CATS.filter((c) => c !== S.lastCat).sort((a, b) => S.skill[a] - S.skill[b])[0];
}
function weakest(n = 2) { return [...CATS].sort((a, b) => S.skill[a] - S.skill[b]).slice(0, n); }

function setPhase(p) { S.phase = p; S.phaseT = 0; document.body.dataset.phase = p; }

function startShift(role = S.role) {
  initAudioOnce();
  if (role !== S.role) { S.role = role; S.skill = baseSkills(role); }
  S.shiftNo += 1;
  Object.assign(S, { idx: 0, cat: null, score: 0, streak: 0, best: 0, caught: 0, falseAlarms: 0, badges: [], missed: new Set(), lastCat: null, records: [], reactions: [], shiftT: 0, review: false });
  S.msg = 'Shift starting. Watch the site.';
  for (const c of CATS) SIT[c].reset();
  planShift();
  hidePage();
  setPhase('gap');
  drawAll();
}

// ---------------------------------------------------------------- the usual way: reading the page
function enterDocs() {
  initAudioOnce();
  S.docPage = 0;
  S.readT = 0;
  S.pagesRead = new Set([DOC_PAGES[0].no]);
  S.lit = new Set();
  S.litNow = null;
  yaw = 0; pitch = -0.05;
  setPhase('docs');
  showPage();
  coachSay(`This is how site orientation usually works: page ${DOC_PAGES[0].no} of a ${PROCEDURE.pages}-page document you read before every new site. Every rule is correct, and none of it is practised. When you're ready, press Turn this into training.`);
  drawAll();
}

function beginConvertAll() {
  if (S.docPage !== 0) S.docPage = 0;
  S.lit = new Set();
  S.litNow = null;
  yaw = 0; pitch = -0.05;
  setPhase('convertAll');
  drawPage();
  coachSay('Watch. Every rule on that page becomes something you will see happen on this site.');
  drawAll();
}

function beginCountdown() {
  initAudioOnce();
  S.review = false;
  yaw = 0; pitch = -0.14;
  setPhase('countdown');
  const vr = renderer.xr.isPresenting;
  const act = vr ? 'point at it and pull the trigger' : 'click it';
  let line;
  if (S.shiftNo === 0) line = `Eyes on the site. When someone or something breaks a rule from the page, ${act}. Spot every rule to get cleared for site entry.`;
  else if (S.lastUncleared.length) {
    const n = S.lastUncleared.map((c) => RULES[c].short.toLowerCase());
    const list = n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1];
    line = `Shift ${S.shiftNo + 1}. The rules you still need for clearance come first: ${list}.`;
  }
  else line = `Shift ${S.shiftNo + 1}. Same rules, and the time windows tighten as your skill grows.`;
  coachSay(line);
  cue('tick');
  drawAll();
}

function beginConvert() {
  S.idx += 1;
  S.cat = pickNext();
  S.lastCat = S.cat;
  S.hinted = false;
  S.msg = `Rule ${RULES[S.cat].no} → live situation`;
  cue('convert');
  setPhase('convert');
  // on small screens the procedure hides behind a button, so show it while the rule converts
  if (window.innerWidth <= 900) $('docBox').classList.add('open');
  drawAll();
}

function beginLive() {
  S.window = windowFor(S.cat);
  S.t = 0;
  S.rec = { shift: S.shiftNo, n: S.idx, cat: S.cat, rule: RULES[S.cat].no, outcome: '', reaction: null, firstLook: null, window: S.window, falseAlarms: 0, points: 0, skillAfter: 0 };
  SIT[S.cat].setup();
  S.msg = 'Find the hazard!';
  if (window.innerWidth <= 900) $('docBox').classList.remove('open');
  setPhase('live');
  drawAll();
}

function markCatch(actorId) {
  const r = RULES[S.cat];
  const speedF = clamp(1 - S.t / S.window, 0, 1);
  const mult = 1 + 0.5 * Math.min(S.streak, 4);
  const pts = Math.round((100 + 100 * speedF) * mult);
  S.score += pts; S.streak += 1; S.best = Math.max(S.best, S.streak); S.caught += 1;
  S.reactions.push(S.t);
  const sk = S.skill[S.cat];
  S.skill[S.cat] = clamp(sk + 0.15 * (1 - sk) + 0.05 * speedF, 0.05, 0.98);
  Object.assign(S.rec, { outcome: 'caught', reaction: S.t, points: pts, skillAfter: S.skill[S.cat] });
  const earned = [];
  const give = (id) => { if (!S.badges.includes(id)) { S.badges.push(id); earned.push(BADGES[id]); } };
  if (S.caught === 1) give('first');
  if (S.t < 2.5) give('sharp');
  if (S.streak >= 3) give('hattrick');
  if (S.missed.has(S.cat)) give('bounce');
  S.msg = `Caught in ${S.t.toFixed(1)} s · +${pts}` + (earned.length ? ` · Badge: ${earned.join(', ')}` : '');
  cue(earned.length ? 'badge' : 'catch');
  showMarker(SIT[S.cat].focus, true);
  coachSay(`Good catch. Rule ${r.no}: ${r.text}`);
  endLive();
}

function markMiss() {
  const r = RULES[S.cat];
  S.streak = 0;
  S.missed.add(S.cat);
  S.skill[S.cat] = clamp(S.skill[S.cat] - 0.1, 0.05, 0.98);
  Object.assign(S.rec, { outcome: 'missed', skillAfter: S.skill[S.cat] });
  S.msg = `Missed: ${r.short}`;
  cue('miss');
  showMarker(SIT[S.cat].focus, false);
  coachSay(`That one got past you. Look at ${r.area}. Rule ${r.no}: ${r.text}`);
  endLive();
}

function endLive() {
  S.records.push(S.rec);
  S.allRecords.push(S.rec);
  saveProfile();
  setPhase('resolve');
  drawAll();
}

function falseAlarm(actor) {
  S.falseAlarms += 1;
  S.streak = 0;
  if (S.rec) S.rec.falseAlarms += 1;
  S.msg = 'False alarm. That one follows the rules.';
  cue('false');
  coachSay(actor.safeText || 'That one is fine. Keep looking.');
  drawAll();
}

function finishShift() {
  for (const c of CATS) SIT[c].reset();
  hideMarker();
  if (S.caught === SITUATIONS_PER_SHIFT && S.falseAlarms === 0 && !S.badges.includes('clean')) S.badges.push('clean');
  const caughtCats = new Set(S.records.filter((r) => r.outcome === 'caught').map((r) => r.cat));
  S.uncleared = CATS.filter((c) => !caughtCats.has(c));
  S.cleared = S.uncleared.length === 0;
  S.lastUncleared = S.uncleared.slice();
  if (document.getElementById('docBox')) $('docBox').classList.remove('open');
  setPhase('debrief');
  saveProfile();
  const avg = S.reactions.length ? (S.reactions.reduce((a, b) => a + b, 0) / S.reactions.length).toFixed(1) : '-';
  if (S.cleared) {
    cue('cleared');
    coachSay(`Shift done. You spotted a breach of every rule on the page, so you're cleared for site entry. Average reaction ${avg} seconds.`);
  } else {
    const names = S.uncleared.map((c) => `${RULES[c].no} ${RULES[c].short.toLowerCase()}`);
    coachSay(`Shift done. Not cleared yet: you still need to spot ${names.join(', ')}. Those come first next shift.`);
  }
  drawAll();
}

const CONV = { start: 0.6, stagger: 0.65, fly: 1.7 };
function updateShift(dt) {
  S.phaseT += dt;
  if (['gap', 'convert', 'live', 'resolve'].includes(S.phase)) S.shiftT += dt;
  if (S.phase === 'docs') {
    S.readT += dt;
    updateReadHtml();
    return;
  }
  if (S.phase === 'convertAll') {
    const i = Math.floor((S.phaseT - CONV.start) / CONV.stagger);
    if (i >= 0 && i < CATS.length && !S.lit.has(CATS[i])) {
      const c = CATS[i];
      S.lit.add(c);
      S.litNow = c;
      launchLabel(c);
      cue('whoosh');
      drawPage();
      htmlMain();
      if (renderer.xr.isPresenting) drawMain();
    }
    if (S.phaseT >= CONV.start + (CATS.length - 1) * CONV.stagger + CONV.fly + 0.4) {
      S.converted = true;
      S.litNow = null;
      beginCountdown();
    }
    return;
  }
  if (S.phase === 'countdown') {
    pageP.mesh.material.opacity = clamp(1 - S.phaseT / 0.7, 0, 1);
    if (pageP.mesh.material.opacity <= 0) hidePage();
    const n = 3 - Math.floor(S.phaseT);
    if (n !== S.count) {
      S.count = n;
      if (n > 0 && S.phaseT > 0.05) cue('tick');
      const el = document.getElementById('countNum');
      if (el && n > 0) el.textContent = n;
      if (renderer.xr.isPresenting) drawMain();
    }
    if (S.phaseT >= 3) startShift(S.role);
    return;
  }
  if (S.phase === 'gap' && S.phaseT >= 1.4) {
    if (S.idx >= SITUATIONS_PER_SHIFT) finishShift();
    else beginConvert();
  } else if (S.phase === 'convert') {
    if (S.phaseT >= 2.6) beginLive();
  } else if (S.phase === 'live') {
    S.t += dt;
    SIT[S.cat].update(S.t, dt);
    trackGaze();
    if (!S.hinted && S.skill[S.cat] < ROLES[S.role].hint && S.t > S.window * 0.45) {
      S.hinted = true;
      coachSay(`Hint: check ${RULES[S.cat].area}.`);
    }
    if (S.t >= S.window) markMiss();
  } else if (S.phase === 'resolve') {
    SIT[S.cat].update(S.t + S.phaseT, dt);
    if (S.phaseT >= 3.8) {
      SIT[S.cat].reset();
      hideMarker();
      setPhase('gap');
      drawAll();
    }
  }
}

// gaze: first time the head points within ~10 degrees of the hazard
const camDir = new THREE.Vector3();
const camPos = new THREE.Vector3();
function trackGaze() {
  if (!S.rec || S.rec.firstLook !== null) return;
  const f = SIT[S.cat].focus;
  if (!f.visible) return;
  camera.getWorldPosition(camPos);
  camera.getWorldDirection(camDir);
  f.getWorldPosition(tmpV);
  tmpV.y += 1.2;
  tmpV.sub(camPos).normalize();
  if (camDir.angleTo(tmpV) < 0.18) S.rec.firstLook = S.t;
}

// ---------------------------------------------------------------- markers
const markerMatOk = new THREE.MeshBasicMaterial({ color: 0x2fd27a, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide });
const markerMatBad = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide });
const marker = new THREE.Group();
const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.45, 40), markerMatOk);
ring.rotation.x = -Math.PI / 2;
ring.renderOrder = 15;
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 8, 1, true), markerMatOk);
beam.position.y = 3.5;
beam.renderOrder = 15;
marker.add(ring, beam);
marker.visible = false;
scene.add(marker);
let markerTarget = null;
function showMarker(obj, ok) {
  markerTarget = obj;
  ring.material = ok ? markerMatOk : markerMatBad;
  beam.material = ring.material;
  marker.visible = true;
}
function hideMarker() { marker.visible = false; markerTarget = null; }

// ---------------------------------------------------------------- panels
const mainP = new Panel(1.0, 0.72, 1000, 720);
const chipsP = new Panel(1.0, 0.3, 1000, 300);
const docP = new Panel(0.86, 1.1, 860, 1100);
const bubbleP = new Panel(1.3, 0.52, 1300, 520);
// In VR the panels stand in the world around the viewer.
const WORLD_POSE = new Map([
  [mainP, [1.15, 3.95, -1.7]],
  [chipsP, [1.15, 3.42, -1.62]],
  [docP, [-1.15, 3.95, -1.7]],
  [bubbleP, [0, DECK_Y + 2.55, -3.2]],
]);
// On a laptop or phone the same content is shown as an HTML overlay instead.
function layoutPanels() {
  const xr = renderer.xr.isPresenting;
  document.body.classList.toggle('xr', xr);
  for (const [p, pos] of WORLD_POSE) {
    const m = p.mesh;
    if (xr) {
      scene.add(m);
      m.position.set(...pos);
      m.lookAt(HEAD);
    } else if (m.parent) m.parent.remove(m);
  }
}
layoutPanels();

const ROLE_KEYS = ['new', 'trade', 'super'];
const ROLE_SHORT = { new: 'New worker', trade: 'Experienced trade', super: 'Site supervisor' };

function drawMain() {
  const p = mainP.begin();
  if (S.phase === 'intro') {
    p.text('ShiftReady', 50, 34, { size: 62, weight: 'bold', color: '#ffd200' });
    p.text('Site-specific clearance trainer', 52, 108, { size: 30, color: '#cfd8e3' });
    let y = p.text('Before working on a new site, workers read its orientation documents. Here the same rules become a live shift on this site.', 52, 156, { size: 26, maxW: 900 });
    for (const line of ['1. Choose your role.', '2. The usual way: the orientation page you would normally read.', '3. Turn it into training: each rule becomes a live situation.', '4. Get cleared: spot a breach of every rule.']) y = p.text(line, 64, y + 4, { size: 23, color: '#e6edf5' });
    ROLE_KEYS.forEach((k, i) => p.button('role_' + k, 52 + i * 305, 430, 285, 70, ROLE_SHORT[k], { color: S.role === k ? '#2f6fd6' : '#3a4656', active: S.role === k, size: 28 }));
    p.button('start', 300, 530, 400, 88, S.converted ? `Start shift ${S.shiftNo + 1}` : 'Start', { color: '#1f9d55', size: 38 });
    p.button('sound', 760, 645, 200, 52, audio.on ? 'Sound: on' : 'Sound: off', { color: '#3a4656', size: 24 });
    p.text('Orientation document and site are fictional · prototype', 52, 660, { size: 22, color: '#93a3b5' });
  } else if (S.phase === 'docs') {
    p.rect(0, 0, 14, 720, '#ff6a4d', 0);
    p.text('THE USUAL WAY', 50, 36, { size: 30, weight: 'bold', color: '#ff6a4d' });
    p.text(`Reading time ${fmtTime(S.readT)}`, 50, 92, { size: 56, weight: 'bold' });
    p.text(`Pages read: ${S.pagesRead.size} of ${PROCEDURE.pages}`, 52, 190, { size: 32 });
    p.text('Situations practised: 0', 52, 240, { size: 32 });
    p.text('Feedback received: none', 52, 290, { size: 32 });
    p.text('Adapted to you: no', 52, 340, { size: 32 });
    p.text('Every rule is here. None of it is practised.', 52, 420, { size: 30, weight: 'bold', color: '#ffd200', maxW: 900 });
    p.button('nextpage', 52, 560, 300, 90, 'Next page', { color: '#3a4656', size: 32 });
    p.button('convert', 380, 560, 570, 90, 'Turn this into training', { color: '#1f9d55', size: 36 });
  } else if (S.phase === 'convertAll') {
    p.text('From the page to the site', 50, 40, { size: 46, weight: 'bold', color: '#ffd200' });
    if (S.litNow) {
      p.text(`Rule ${RULES[S.litNow].no} → live situation`, 52, 160, { size: 44, weight: 'bold' });
      p.text(RULES[S.litNow].short, 52, 230, { size: 40 });
    }
    p.text(`${S.lit.size} of ${CATS.length} rules placed on site`, 52, 360, { size: 32, color: '#93a3b5' });
  } else if (S.phase === 'countdown') {
    p.text(String(Math.max(1, 3 - Math.floor(S.phaseT))), 500, 150, { size: 220, weight: 'bold', color: '#ffd200', align: 'center' });
    p.text('Your shift starts on the viewing deck', 500, 470, { size: 40, weight: 'bold', align: 'center' });
  } else if (S.phase === 'debrief') {
    const avg = S.reactions.length ? (S.reactions.reduce((a, b) => a + b, 0) / S.reactions.length).toFixed(1) + ' s' : '-';
    p.text(`Shift ${S.shiftNo} debrief`, 50, 26, { size: 44, weight: 'bold', color: '#ffd200' });
    p.text(S.cleared ? '✓ CLEARED FOR SITE ENTRY' : 'NOT YET CLEARED: ' + S.uncleared.map((c) => RULES[c].no).join(', '), 52, 84, { size: 32, weight: 'bold', color: S.cleared ? '#3ccf7a' : '#ff8a6d', maxW: 900 });
    p.text(`Caught ${S.caught} of ${S.records.length}  ·  Avg ${avg}  ·  False alarms ${S.falseAlarms}  ·  Score ${S.score}`, 52, 134, { size: 24, color: '#e6edf5' });
    p.text(S.badges.length ? 'Badges: ' + S.badges.map((b) => BADGES[b]).join(' · ') : 'Badges: none yet', 52, 172, { size: 22, color: '#ffd200', maxW: 900 });
    p.text('Learner profile', 52, 214, { size: 24, weight: 'bold' });
    CATS.forEach((c, i) => {
      const y = 250 + i * 39;
      p.text(`${RULES[c].no} ${RULES[c].short}`, 52, y, { size: 22 });
      p.rect(400, y + 2, 420, 24, '#2c3744', 8);
      const v = S.skill[c];
      p.rect(400, y + 2, Math.max(10, 420 * v), 24, v < 0.45 ? '#ff6a4d' : v < 0.7 ? '#ffc94d' : '#3ccf7a', 8);
      p.text(Math.round(v * 100) + '%', 835, y, { size: 22 });
    });
    p.text(`Usual way: ${fmtTime(S.readT)} reading, 0 practised  ·  ShiftReady: ${new Set(S.records.map((r) => r.cat)).size} of ${CATS.length} rules live, feedback on each`, 52, 532, { size: 21, color: '#cfd8e3', maxW: 900 });
    p.button('next', 40, 610, 220, 78, 'Next shift', { color: '#1f9d55', size: 28 });
    p.button('page', 275, 610, 250, 78, S.review ? 'Hide page' : 'Show page', { color: '#3a4656', size: 28, active: S.review });
    p.button('csv', 540, 610, 200, 78, 'CSV', { color: '#2f6fd6', size: 28 });
    p.button('roles', 755, 610, 205, 78, 'Change role', { color: '#3a4656', size: 26 });
  } else {
    const mult = 1 + 0.5 * Math.min(S.streak, 4);
    p.text(`Shift ${S.shiftNo} · ${ROLES[S.role].label}`, 40, 30, { size: 28, color: '#cfd8e3' });
    p.text(`Situation ${Math.max(1, S.idx)} of ${SITUATIONS_PER_SHIFT}`, 960, 30, { size: 28, color: '#cfd8e3', align: 'right' });
    p.text(`${S.score}`, 40, 85, { size: 92, weight: 'bold', color: '#ffd200' });
    p.text('points', 44, 190, { size: 26, color: '#93a3b5' });
    p.text(`Streak x${mult.toFixed(1)}`, 420, 95, { size: 34, weight: 'bold' });
    p.text(`Caught ${S.caught}   ·   False alarms ${S.falseAlarms}`, 420, 148, { size: 28 });
    if (S.phase === 'live') {
      const rem = clamp(1 - S.t / S.window, 0, 1);
      p.rect(40, 250, 920, 34, '#2c3744', 10);
      p.rect(40, 250, Math.max(12, 920 * rem), 34, rem > 0.5 ? '#3ccf7a' : rem > 0.25 ? '#ffc94d' : '#ff6a4d', 10);
      p.text(`${Math.max(0, S.window - S.t).toFixed(1)} s`, 500, 253, { size: 26, weight: 'bold', align: 'center', color: '#111' });
    }
    p.rect(40, 310, 920, 170, 'rgba(255,255,255,0.08)', 14);
    p.text(S.msg, 64, 330, { size: 34, weight: 'bold', maxW: 870 });
    if (S.badges.length) p.text('Badges: ' + S.badges.map((b) => BADGES[b]).join(' · '), 40, 505, { size: 24, color: '#ffd200', maxW: 920 });
    p.button('end', 700, 610, 260, 70, 'End shift', { color: '#7a3434', size: 28 });
    p.button('sound', 40, 610, 220, 70, audio.on ? 'Sound: on' : 'Sound: off', { color: '#3a4656', size: 26 });
  }
  p.commit();
}

function drawDoc() {
  const p = docP.begin('#f7f5ef', 18);
  p.rect(0, 0, 860, 120, '#1f4e79', 18);
  p.text(`${PROCEDURE.code} · ${PROCEDURE.rev}`, 36, 22, { size: 36, weight: 'bold', color: '#ffffff' });
  p.text(PROCEDURE.page, 824, 30, { size: 24, color: '#cfe0f0', align: 'right' });
  p.text('Site-specific orientation', 36, 72, { size: 26, color: '#cfe0f0' });
  p.text(PROCEDURE.note, 36, 135, { size: 21, color: '#b42318', maxW: 790 });
  let y = 180;
  const active = ['convert', 'live', 'resolve'].includes(S.phase) ? S.cat : null;
  for (const c of CATS) {
    const r = RULES[c];
    const g = p.g;
    g.font = '20px Arial';
    const h = 31 + wrapLines(g, r.text, 780).length * 25 + 12;
    if (c === active) p.rect(20, y - 8, 820, h, S.phase === 'convert' ? '#ffd200' : '#ffeaa0', 10);
    p.text(`${r.no}  ${r.short}`, 36, y, { size: 24, weight: 'bold', color: '#1b2430' });
    y = p.text(r.text, 36, y + 31, { size: 20, color: '#2f3a48', maxW: 780, lh: 1.25 }) + 12;
  }
  if (active) {
    p.rect(20, 1006, 820, 80, '#1b2430', 14);
    p.text(`Rule ${RULES[active].no}  →  live situation on site`, 430, 1028, { size: 32, weight: 'bold', color: S.phase === 'convert' ? '#ffd200' : '#ffffff', align: 'center' });
  }
  p.commit();
}

const coachState = { text: 'Hi, I\'m Riley, your site coach. Choose a role and press Start. You can ask me about any rule.', speaking: 0 };
function voiceLabel() {
  const ans = CFG.proxyUrl ? 'online AI' : 'offline procedure';
  const voice = audio.on && 'speechSynthesis' in window ? 'browser speech' : 'subtitles';
  return `Answers: ${ans} · Voice: ${voice}`;
}
function drawBubble() {
  const p = bubbleP.begin('rgba(255,255,255,0.95)', 30);
  p.text('Riley · Site coach', 40, 26, { size: 32, weight: 'bold', color: '#1f4e79' });
  p.text(coachState.text, 40, 78, { size: 31, color: '#1b2430', maxW: 1220, lh: 1.25 });
  p.text(voiceLabel(), 40, 474, { size: 22, color: '#6b7a8c' });
  p.commit();
}

function drawChips() {
  const p = chipsP.begin('rgba(18,24,32,0.85)', 22);
  p.text('Ask Riley', 24, 14, { size: 24, color: '#93a3b5' });
  p.button('q_why', 20, 50, 470, 105, 'Why train this way?', { color: '#3a4656', size: 28 });
  p.button('q_rule', 510, 50, 470, 105, 'What does this rule say?', { color: '#3a4656', size: 28 });
  p.button('q_next', 20, 170, 470, 105, 'What should I practise next?', { color: '#3a4656', size: 28 });
  p.button('q_how', 510, 170, 470, 105, 'How am I doing?', { color: '#3a4656', size: 28 });
  p.commit();
}

// ---------------------------------------------------------------- orientation page (3D, all modes)
const PAGE_W = 1.6, PAGE_H = 1.0;
const pageP = new Panel(PAGE_W, PAGE_H, 1600, 1000);
pageP.mesh.renderOrder = 18;
pageP.mesh.visible = false;
camera.add(pageP.mesh);
const COLS = [56, 826];
const COL_W = 718;
const BODY_TOP = 150, BODY_BOTTOM = 884;
let paraRects = {};

function wrapLines(g, text, maxW) {
  const out = [];
  let line = '';
  for (const w of String(text).split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

function drawPage() {
  const page = DOC_PAGES[S.docPage];
  const p = pageP.begin('#f7f5ef', 16);
  const g = p.g;
  p.rect(0, 0, 1600, 116, '#1f4e79', 16);
  p.rect(0, 80, 1600, 36, '#1f4e79', 0);
  p.text(PROCEDURE.title.toUpperCase(), 56, 22, { size: 30, weight: 'bold', color: '#ffffff' });
  p.text(`${PROCEDURE.site}  ·  ${PROCEDURE.code}  ·  ${PROCEDURE.rev}  ·  fictional sample for this demo`, 56, 70, { size: 22, color: '#cfe0f0' });
  p.text(`Page ${page.no} of ${PROCEDURE.pages}`, 1544, 28, { size: 26, color: '#ffffff', align: 'right', weight: 'bold' });
  paraRects = {};
  const caught = new Set(S.records.filter((r) => r.outcome === 'caught').map((r) => r.cat));
  let col = 0, y = BODY_TOP;
  for (const para of page.paras) {
    g.font = '22px Arial, Helvetica, sans-serif';
    const lines = wrapLines(g, para.t, COL_W);
    const h = 32 + lines.length * 28 + 14;
    if (y + h > BODY_BOTTOM && col === 0) { col = 1; y = BODY_TOP; }
    const x = COLS[col];
    if (para.cat) {
      paraRects[para.cat] = { x: x - 14, y: y - 8, w: COL_W + 28, h: h - 4 };
      let fill = null;
      if (S.review) fill = caught.has(para.cat) ? '#d3f2dc' : '#ffd9d2';
      else if (S.litNow === para.cat) fill = '#ffd200';
      else if (S.lit.has(para.cat)) fill = '#ffeaa0';
      if (fill) p.rect(x - 14, y - 8, COL_W + 28, h - 4, fill, 8);
      if (S.review) p.text(caught.has(para.cat) ? '✓ spotted' : '✗ not yet', x + COL_W + 6, y, { size: 21, weight: 'bold', color: caught.has(para.cat) ? '#1f7a3d' : '#b42318', align: 'right' });
    }
    p.text(para.h, x, y, { size: 24, weight: 'bold', color: '#1b2430' });
    g.font = '22px Arial, Helvetica, sans-serif';
    g.fillStyle = '#2f3a48';
    g.textAlign = 'left';
    lines.forEach((ln, i) => g.fillText(ln, x, y + 32 + i * 28));
    y += h;
  }
  g.fillStyle = '#c9c4b6';
  g.fillRect(56, 900, 1488, 2);
  p.text('Read and sign before site entry  ·  uncontrolled when printed', 1544, 936, { size: 20, color: '#7a7466', align: 'right' });
  if (S.review) p.button('pageback', 56, 914, 340, 68, 'Back to debrief', { color: '#2f6fd6', size: 28 });
  else if (S.phase === 'docs') {
    p.button('nextpage', 56, 914, 240, 68, 'Next page', { color: '#3a4656', size: 28 });
    p.button('convert', 316, 914, 470, 68, 'Turn this into training', { color: '#1f9d55', size: 30 });
  } else p.text('Turning each rule into a live situation on site…', 56, 932, { size: 24, weight: 'bold', color: '#1f4e79' });
  p.commit();
}

function placePage() {
  const m = pageP.mesh;
  if (!m.visible) return;
  if (renderer.xr.isPresenting) {
    if (m.parent !== scene) scene.add(m);
    m.scale.setScalar(1);
    m.position.set(-0.3, EYE_Y - 0.25, -1.5);
    m.lookAt(-0.3, EYE_Y - 0.1, 0);
    return;
  }
  if (m.parent !== camera) camera.add(m);
  const W = window.innerWidth, H = window.innerHeight;
  const hud = $('hudBox').getBoundingClientRect();
  const co = $('coachBox').getBoundingClientRect();
  const narrow = W < 640;
  let L = 12, T = 12, R = W - 12;
  const B = Math.max(T + 120, Math.min(H - 12, co.top - 10));
  if (narrow) T = Math.min(hud.bottom + 10, B - 120); else R = hud.left - 14;
  let w = R - L, h = B - T;
  if (w / h > PAGE_W / PAGE_H) w = h * PAGE_W / PAGE_H; else h = w * PAGE_H / PAGE_W;
  const cx = narrow ? W / 2 : L + w / 2, cy = T + h / 2;
  const k = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / H;
  m.scale.setScalar((w * k) / PAGE_W);
  m.position.set((cx - W / 2) * k, -(cy - H / 2) * k, -1);
  m.rotation.set(0, 0, 0);
}
function showPage() {
  pageP.mesh.visible = true;
  pageP.mesh.material.opacity = 1;
  drawPage();
  placePage();
}
function hidePage() { pageP.mesh.visible = false; }

function updateReadHtml() {
  const t = Math.floor(S.readT);
  const txt = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const el = document.getElementById('readTime');
  if (el && el.textContent !== txt) {
    el.textContent = txt;
    if (renderer.xr.isPresenting) drawMain();
  }
}
const fmtTime = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- rule labels that fly from the page to the site
const ANCHORS = {
  crane: new THREE.Vector3(20.5, 10.5, -33),
  edge: new THREE.Vector3(3.0, 15.2, -34),
  trench: new THREE.Vector3(10.5, 4.4, -20.7),
  reverse: new THREE.Vector3(-12.5, 5.6, -23.5),
  swing: new THREE.Vector3(-2.5, 4.9, -22.5),
  power: new THREE.Vector3(-17, 11.8, -31),
  env: new THREE.Vector3(19, 5.0, -25.8),
};
const LABEL_AR = 176 / 768;
// labels keep roughly the same size on screen wherever they sit on site
const labelW = (c) => 0.2 * ANCHORS[c].distanceTo(HEAD);
const labels = {};
function labelTexture(c) {
  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 176;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(18,24,32,0.9)';
  roundRect(g, 0, 0, 768, 176, 26);
  g.fill();
  g.fillStyle = '#ffd200';
  g.fillRect(0, 22, 12, 132);
  g.textBaseline = 'top';
  g.font = 'bold 48px Arial, Helvetica, sans-serif';
  g.fillStyle = '#ffd200';
  g.fillText(`Rule ${RULES[c].no} → live situation`, 38, 22);
  g.font = 'bold 50px Arial, Helvetica, sans-serif';
  g.fillStyle = '#ffffff';
  g.fillText(RULES[c].short, 38, 92);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeLabel(c) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(c), transparent: true, depthTest: false, depthWrite: false }));
  sp.renderOrder = 12;
  scene.add(sp);
  labels[c] = { sp, from: new THREE.Vector3(), a0: 0, t: 0, flying: false };
  return labels[c];
}
const camWorld = new THREE.Vector3();
function launchLabel(c) {
  const L = labels[c] || makeLabel(c);
  const r = paraRects[c] || { x: 600, y: 500, w: 700, h: 80 };
  pageP.mesh.updateWorldMatrix(true, false);
  const toLocal = (px, py) => new THREE.Vector3((px / 1600 - 0.5) * PAGE_W, (0.5 - py / 1000) * PAGE_H, 0.02);
  const a = pageP.mesh.localToWorld(toLocal(r.x + 260, r.y + r.h / 2));
  const b = pageP.mesh.localToWorld(toLocal(r.x + 260 + 400, r.y + r.h / 2));
  camera.getWorldPosition(camWorld);
  L.from.copy(a);
  L.a0 = a.distanceTo(b) / a.distanceTo(camWorld);
  L.t = 0;
  L.flying = true;
  L.sp.renderOrder = 25;
  L.sp.visible = true;
  L.sp.material.opacity = 1;
}
function placeLabelsNow() {
  for (const c of CATS) {
    const L = labels[c] || makeLabel(c);
    L.flying = false;
    L.sp.position.copy(ANCHORS[c]);
    L.sp.scale.set(labelW(c), labelW(c) * LABEL_AR, 1);
    L.sp.renderOrder = 12;
    L.sp.material.opacity = 0.88;
  }
  S.converted = true;
}
const lblPos = new THREE.Vector3();
function updateLabels(dt) {
  camera.getWorldPosition(camWorld);
  for (const c of CATS) {
    const L = labels[c];
    if (!L || !L.flying) continue;
    L.t = Math.min(1, L.t + dt / CONV.fly);
    const e = smooth(L.t);
    const to = ANCHORS[c];
    lblPos.lerpVectors(L.from, to, e);
    lblPos.y += Math.sin(Math.PI * e) * 0.12 * L.from.distanceTo(to);
    L.sp.position.copy(lblPos);
    const a1 = labelW(c) / to.distanceTo(camWorld);
    const a = Math.exp(Math.log(L.a0) * (1 - e) + Math.log(a1) * e);
    const w = a * lblPos.distanceTo(camWorld);
    L.sp.scale.set(w, w * LABEL_AR, 1);
    if (L.t >= 1) { L.flying = false; L.sp.material.opacity = 0.88; L.sp.renderOrder = 12; }
  }
}

// ---------------------------------------------------------------- HTML overlay (desktop and phone)
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const skillColor = (v) => (v < 0.45 ? '#ff6a4d' : v < 0.7 ? '#ffc94d' : '#3ccf7a');

function htmlMain() {
  let h = '';
  if (S.phase === 'intro') {
    h += '<h1>ShiftReady</h1><div class="muted" style="font-size:13px">Site-specific clearance trainer</div>';
    h += '<p style="margin:8px 0 6px">Before working on a new site, workers read its orientation documents. Here the same rules become a live shift on this site.</p>';
    h += '<ol class="steps"><li><b>Choose your role.</b></li><li><b>The usual way:</b> look at the orientation page you would normally read.</li><li><b>Turn it into training:</b> each rule becomes a live situation on site.</li><li><b>Get cleared:</b> spot a breach of every rule to be cleared for site entry.</li></ol>';
    h += '<b>Choose your role</b><div class="row" style="margin:6px 0 12px">';
    for (const k of ROLE_KEYS) h += `<button data-id="role_${k}" class="${S.role === k ? 'on' : ''}">${ROLE_SHORT[k]}</button>`;
    h += `</div><div class="row"><button data-id="start" class="primary">${S.converted ? `Start shift ${S.shiftNo + 1}` : 'Start'}</button>`;
    h += `<button data-id="sound">${audio.on ? 'Sound: on' : 'Sound: off'}</button></div>`;
    h += '<p class="muted">The orientation document and site are fictional. On a Quest headset, open this page in the browser and press Enter VR.</p>';
  } else if (S.phase === 'docs') {
    h += '<div class="usual"><div class="tag">THE USUAL WAY</div>';
    h += `<div class="big">Reading time <span id="readTime">${fmtTime(S.readT)}</span></div>`;
    h += `<div class="stat">Pages read <b>${S.pagesRead.size} of ${PROCEDURE.pages}</b></div>`;
    h += '<div class="stat">Situations practised <b>0</b></div><div class="stat">Feedback received <b>none</b></div><div class="stat">Adapted to you <b>no</b></div>';
    h += '<p class="note2">Every rule is here. None of it is practised.</p>';
    h += '<div class="row"><button data-id="nextpage">Next page</button><button data-id="convert" class="primary">Turn this into training</button></div></div>';
  } else if (S.phase === 'convertAll') {
    h += '<h2>From the page to the site</h2>';
    h += `<div class="msg">${S.litNow ? `Rule ${RULES[S.litNow].no} → live situation<br><span style="font-weight:normal">${esc(RULES[S.litNow].short)}</span>` : 'Reading the rules…'}</div>`;
    h += `<div class="muted">${S.lit.size} of ${CATS.length} rules placed on site</div>`;
  } else if (S.phase === 'countdown') {
    h += `<div class="count" id="countNum">${Math.max(1, 3 - Math.floor(S.phaseT))}</div><div style="text-align:center;font-weight:bold">Your shift starts on the viewing deck</div>`;
    h += `<div class="muted" style="text-align:center;margin-top:4px">${esc(ROLES[S.role].label)} · ${SITUATIONS_PER_SHIFT} situations · every rule once</div>`;
  } else if (S.phase === 'debrief') {
    const avg = S.reactions.length ? (S.reactions.reduce((a, b) => a + b, 0) / S.reactions.length).toFixed(1) + ' s' : '-';
    h += `<h2>Shift ${S.shiftNo} debrief</h2>`;
    if (S.cleared) h += '<div class="clear ok">✓ Cleared for site entry</div><div class="muted" style="margin-bottom:6px">You spotted a breach of every rule on the page.</div>';
    else h += `<div class="clear no">Not yet cleared</div><div style="font-size:13px;margin-bottom:6px">Still to spot: ${S.uncleared.map((c) => `${RULES[c].no} ${esc(RULES[c].short)}`).join(', ')}</div>`;
    h += `<div>Caught <b>${S.caught} of ${S.records.length}</b> · Avg reaction <b>${avg}</b><br>False alarms <b>${S.falseAlarms}</b> · Best streak <b>${S.best}</b></div>`;
    h += `<div class="score" style="margin:8px 0">${S.score} <span class="muted">points</span></div>`;
    h += `<div class="yellow" style="font-size:13px">${S.badges.length ? 'Badges: ' + S.badges.map((b) => esc(BADGES[b])).join(' · ') : 'Badges: none yet'}</div>`;
    h += '<p style="margin:10px 0 4px"><b>Learner profile</b> <span class="muted">(updates after every situation)</span></p>';
    for (const c of CATS) {
      const v = S.skill[c];
      h += `<div class="skill"><span>${RULES[c].no} ${esc(RULES[c].short)}</span><div class="track"><div style="width:${Math.round(v * 100)}%;background:${skillColor(v)}"></div></div><span>${Math.round(v * 100)}%</span></div>`;
    }
    const seen = new Set(S.records.map((r) => r.cat)).size;
    h += '<table class="cmp"><tr><th></th><th>The usual way</th><th>ShiftReady</th></tr>';
    h += `<tr><td>Time</td><td>${fmtTime(S.readT)} reading</td><td>${fmtTime(S.shiftT)} on site</td></tr>`;
    h += `<tr><td>Rules practised</td><td>0</td><td>${seen} of ${CATS.length}</td></tr>`;
    h += '<tr><td>Feedback</td><td>none</td><td>on every situation</td></tr><tr><td>Adapted to you</td><td>no</td><td>yes</td></tr></table>';
    h += `<div class="row" style="margin-top:10px"><button data-id="next" class="primary">Next shift</button><button data-id="page" class="${S.review ? 'on' : ''}">${S.review ? 'Hide the page' : 'Show the page again'}</button></div>`;
    h += '<div class="row" style="margin-top:6px"><button data-id="csv" class="blue">Export CSV</button><button data-id="roles">Change role</button></div>';
  } else {
    const mult = 1 + 0.5 * Math.min(S.streak, 4);
    h += `<div class="row" style="justify-content:space-between"><span class="muted">Shift ${S.shiftNo} · ${esc(ROLES[S.role].label)}</span><span class="muted">Situation ${Math.max(1, S.idx)} of ${SITUATIONS_PER_SHIFT}</span></div>`;
    h += `<div class="row" style="justify-content:space-between;margin-top:6px"><div class="score">${S.score}<div class="muted" style="font-size:12px;font-weight:normal">points</div></div>`;
    h += `<div style="text-align:right"><b>Streak x${mult.toFixed(1)}</b><br>Caught ${S.caught} · False alarms ${S.falseAlarms}</div></div>`;
    h += S.phase === 'live' ? '<div class="timer"><div id="timerFill"></div><span id="timerText"></span></div>' : '';
    h += `<div class="msg">${esc(S.msg)}</div>`;
    if (S.badges.length) h += `<div class="yellow" style="font-size:12px;margin-bottom:8px">Badges: ${S.badges.map((b) => esc(BADGES[b])).join(' · ')}</div>`;
    h += `<div class="row" style="justify-content:space-between"><button data-id="sound">${audio.on ? 'Sound: on' : 'Sound: off'}</button><button data-id="end" class="danger">End shift</button></div>`;
  }
  $('hudBox').innerHTML = h;
  updateTimerHtml();
}

function updateTimerHtml() {
  const f = $('timerFill');
  if (!f || S.phase !== 'live') return;
  const rem = clamp(1 - S.t / S.window, 0, 1);
  f.style.width = Math.max(3, rem * 100) + '%';
  f.style.background = rem > 0.5 ? '#3ccf7a' : rem > 0.25 ? '#ffc94d' : '#ff6a4d';
  $('timerText').textContent = Math.max(0, S.window - S.t).toFixed(1) + ' s';
}

function htmlDoc() {
  const active = ['convert', 'live', 'resolve'].includes(S.phase) ? S.cat : null;
  let h = `<div class="head"><b>${PROCEDURE.code} · ${PROCEDURE.rev}</b><br><span style="font-size:12px;opacity:.85">Site-specific orientation · ${PROCEDURE.page}</span></div>`;
  if (active) h += `<div class="banner">Rule ${RULES[active].no} → live situation on site</div>`;
  h += `<div class="note">${esc(PROCEDURE.note)}</div>`;
  for (const c of CATS) {
    const cls = c === active ? (S.phase === 'convert' ? 'rule convert' : 'rule live') : 'rule';
    h += `<div class="${cls}"><b>${RULES[c].no} ${esc(RULES[c].short)}</b>${esc(RULES[c].text)}</div>`;
  }
  const box = $('docBox');
  box.innerHTML = h;
  const act = box.querySelector('.rule.convert, .rule.live');
  if (act && act.offsetTop + act.offsetHeight > box.clientHeight - 8) box.scrollTop = act.offsetTop - 70;
  else box.scrollTop = 0;
}

function htmlCoach() {
  $('coachBox').innerHTML = `<div class="name">Riley · Site coach</div><div class="text">${esc(coachState.text)}</div>`
    + '<div class="row chips"><button data-id="q_why">Why train this way?</button><button data-id="q_rule">What does this rule say?</button>'
    + '<button data-id="q_next">What should I practise next?</button><button data-id="q_how">How am I doing?</button></div>'
    + `<div class="muted" style="color:#6b7a8c;margin-top:5px">${esc(voiceLabel())}</div>`;
}

for (const id of ['hudBox', 'coachBox']) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (b) onButton(b.dataset.id);
  });
}
$('docToggle').addEventListener('click', () => $('docBox').classList.toggle('open'));

const PAGE_PHASES = ['docs', 'convertAll', 'countdown'];
function drawAll() {
  docP.mesh.visible = !(PAGE_PHASES.includes(S.phase) || S.review || S.phase === 'intro');
  document.body.classList.toggle('review', S.review);
  if (renderer.xr.isPresenting) { drawMain(); drawDoc(); drawBubble(); drawChips(); }
  htmlMain(); htmlDoc(); htmlCoach();
  if (pageP.mesh.visible) { drawPage(); placePage(); }
}

// ---------------------------------------------------------------- coach
let speechOk = 'speechSynthesis' in window;
function coachSay(text) {
  coachState.text = text;
  coachState.speaking = Math.min(8, 1.5 + text.length / 16);
  if (renderer.xr.isPresenting) drawBubble();
  htmlCoach();
  placePage();
  if (!audio.on) return;
  cue('radio');
  if (speechOk) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) { speechOk = false; }
  }
}

function tokens(s) { return String(s).toLowerCase().replace(/[^a-z0-9. ]/g, ' ').split(/\s+/).filter((w) => w.length > 1); }
// match plural and singular forms ("trenches" -> "trench", "lines" -> "line")
const forms = (w) => [w, w.replace(/s$/, ''), w.replace(/es$/, '')];
const hits = (toks, keys) => toks.filter((w) => forms(w).some((f) => keys.includes(f))).length;
const STOP = new Set(['the', 'is', 'a', 'an', 'what', 'does', 'do', 'say', 'about', 'tell', 'me', 'can', 'you', 'of', 'to', 'in', 'on', 'for', 'and', 'it', 'this', 'that', 'rule', 'rules', 'are', 'i', 'my', 'should', 'when']);
function offlineAnswer(q) {
  const toks = tokens(q).filter((w) => !STOP.has(w));
  const ruleNo = (q.match(/\b(\d\.\d)\b/) || [])[1];
  if (ruleNo) {
    const c = CATS.find((k) => RULES[k].no === ruleNo);
    if (c) return `Rule ${RULES[c].no}, ${RULES[c].short}: ${RULES[c].text}`;
  }
  let best = null, bestScore = 0;
  for (const c of CATS) {
    const s = hits(toks, RULES[c].keys);
    if (s > bestScore) { bestScore = s; best = `Rule ${RULES[c].no}, ${RULES[c].short}: ${RULES[c].text}`; }
  }
  for (const f of FAQ) {
    const s = hits(toks, f.keys);
    if (s > bestScore) { bestScore = s; best = f.a; }
  }
  return bestScore > 0 ? best : 'I can answer questions about the site procedure. Try asking about suspended loads, open edges, trenches, reversing trucks, the excavator, power lines or protected ground.';
}

function stateSummary() {
  return { role: S.role, phase: S.phase, situation: S.idx, rule: S.cat ? RULES[S.cat].no : null, caught: S.caught, falseAlarms: S.falseAlarms, skill: S.skill };
}

async function answer(q) {
  if (CFG.proxyUrl) {
    try {
      const r = await fetch(CFG.proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.slice(0, 600), state: stateSummary() }) });
      const j = await r.json();
      if (j && j.reply) return j.reply;
    } catch (e) { /* fall back */ }
  }
  return offlineAnswer(q);
}

function chip(id) {
  if (id === 'q_why') return coachSay(FAQ[0].a);
  if (id === 'q_rule') {
    const c = S.cat || S.lastCat;
    if (!c) return coachSay('The first rule appears when the shift starts. The orientation page lists all seven.');
    if (S.phase === 'live' && S.skill[c] >= ROLES[S.role].hint) return coachSay('I won\'t give that one away while it\'s live. Check the highlighted rule on the procedure page.');
    return coachSay(`Rule ${RULES[c].no}, ${RULES[c].short}: ${RULES[c].text}`);
  }
  if (id === 'q_next') {
    const w = weakest(2);
    return coachSay(`Practise ${RULES[w[0]].short.toLowerCase()} (rule ${RULES[w[0]].no}) and ${RULES[w[1]].short.toLowerCase()} (rule ${RULES[w[1]].no}). They are your lowest scores so far.`);
  }
  if (id === 'q_how') {
    if (!S.shiftNo) return coachSay('We haven\'t started yet. Pick a role and press Start shift.');
    return coachSay(`So far you've caught ${S.caught} of ${S.records.length} with ${S.falseAlarms} false alarms and ${S.score} points. Best streak ${S.best}.`);
  }
}

// ---------------------------------------------------------------- audio
const engines = {};
let audioStarted = false;
function initAudioOnce() {
  if (audioStarted) return;
  audioStarted = true;
  if (!initAudio(camera)) return;
  setSound(audio.on);
  engines.truckA = addEngine(truckA, 52, 0.32);
  setEngineLoad(engines.truckA, 0.55);
  engines.tb = addEngine(truckB, 48, 0.28);
  addBeeper(truckB);
  engines.ex = addEngine(excavator.userData.house, 44, 0.3);
  engines.boom = addEngine(boomTruck, 60, 0.18);
  engines.crane = addEngine(crane.userData.trolley, 118, 0.05, { ref: 10 });
  engines.pickup = addEngine(pickup, 70, 0.2);
  setEngineLoad(engines.pickup, 0.05);
}

// ---------------------------------------------------------------- input
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function isShown(o) {
  if (o.userData && o.userData.panel && !o.parent) return false;
  while (o) { if (!o.visible) return false; o = o.parent; } return true;
}
function actorOf(o) { while (o) { if (o.userData && o.userData.actorId) return actors[o.userData.actorId]; o = o.parent; } return null; }

function handleRay() {
  const targets = (renderer.xr.isPresenting ? panels.map((p) => p.mesh) : (pageP.mesh.visible ? [pageP.mesh] : [])).concat(hitTargets);
  const hits = raycaster.intersectObjects(targets, false).filter((h) => isShown(h.object));
  if (!hits.length) return null;
  // panels are drawn on top, so they win whenever they are hit
  const ph = hits.find((h) => h.object.userData.panel);
  if (ph) {
    const id = ph.object.userData.panel.hit(ph.uv);
    if (id) onButton(id);
    return ph;
  }
  // forgiving selection: if the ray passes through the active hazard, count it
  if (S.phase === 'live') {
    const hz = hits.map((h) => actorOf(h.object)).find((a) => a && SIT[S.cat].hazards.includes(a.id));
    if (hz) { onActor(hz); return hits[0]; }
  }
  const a = actorOf(hits[0].object);
  if (a) onActor(a);
  return hits[0];
}

function onActor(a) {
  if (S.phase !== 'live') return;
  if (SIT[S.cat].hazards.includes(a.id)) markCatch(a.id);
  else falseAlarm(a);
}

function onButton(id) {
  initAudioOnce();
  if (id.startsWith('role_')) { const r = id.slice(5); if (r !== S.role) { S.role = r; S.skill = baseSkills(r); } drawAll(); return; }
  if (id === 'start') return S.converted ? beginCountdown() : enterDocs();
  if (id === 'next') { S.review = false; hidePage(); return beginCountdown(); }
  if (id === 'nextpage' && S.phase === 'docs') {
    S.docPage = (S.docPage + 1) % DOC_PAGES.length;
    S.pagesRead.add(DOC_PAGES[S.docPage].no);
    drawAll();
    return;
  }
  if (id === 'convert' && S.phase === 'docs') return beginConvertAll();
  if (id === 'page' && S.phase === 'debrief') {
    S.review = !S.review;
    if (S.review) {
      S.docPage = 0;
      showPage();
      coachSay(`Here is the page again. Reading it took ${fmtTime(S.readT)} and practised nothing. On site you saw ${new Set(S.records.map((r) => r.cat)).size} of ${CATS.length} rules happen and got feedback on each.`);
    } else hidePage();
    drawAll();
    return;
  }
  if (id === 'pageback') { S.review = false; hidePage(); drawAll(); return; }
  if (id === 'roles') { S.review = false; hidePage(); setPhase('intro'); drawAll(); return; }
  if (id === 'end') return finishShift();
  if (id === 'csv') return exportCSV();
  if (id === 'sound') { setSound(!audio.on); if (!audio.on && speechOk) window.speechSynthesis.cancel(); drawAll(); return; }
  if (id.startsWith('q_')) return chip(id);
}

// desktop: drag to look, click to select
const el = renderer.domElement;
let drag = null;
let yaw = 0, pitch = -0.14;
el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; });
window.addEventListener('pointermove', (e) => {
  if (!drag || renderer.xr.isPresenting) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
  if (drag.moved) {
    yaw -= dx * 0.0035;
    pitch = clamp(pitch - dy * 0.0035, -1.2, 1.0);
  }
});
window.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const wasClick = !drag.moved;
  drag = null;
  if (wasClick && !renderer.xr.isPresenting && e.target === el) {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    handleRay();
  }
});
window.addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft') yaw += 0.08;
  if (e.key === 'ArrowRight') yaw -= 0.08;
  if (e.key === 'ArrowUp') pitch = clamp(pitch + 0.06, -1.2, 1.0);
  if (e.key === 'ArrowDown') pitch = clamp(pitch - 0.06, -1.2, 1.0);
});

// XR controllers: ray, trigger to select, thumbstick snap turn
const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
const controllers = [];
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: 0xffd200 }));
  line.scale.z = 40;
  c.add(line);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd200, depthTest: false }));
  dot.renderOrder = 30;
  scene.add(dot);
  c.userData = { line, dot };
  c.addEventListener('selectstart', () => {
    const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
    handleRay();
  });
  rig.add(c);
  controllers.push(c);
}
let snapCooldown = 0;
function updateXR(dt) {
  const session = renderer.xr.getSession();
  if (!session) { for (const c of controllers) c.userData.dot.visible = false; return; }
  snapCooldown -= dt;
  for (const src of session.inputSources) {
    const gp = src.gamepad;
    if (!gp || gp.axes.length < 4) continue;
    const x = gp.axes[2];
    if (Math.abs(x) > 0.7 && snapCooldown <= 0) { rig.rotation.y -= Math.sign(x) * Math.PI / 6; snapCooldown = 0.35; }
  }
  const targets = panels.map((p) => p.mesh).concat(hitTargets);
  for (const c of controllers) {
    const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
    const hits = raycaster.intersectObjects(targets, false).filter((h) => isShown(h.object));
    const ph = hits.find((h) => h.object.userData.panel);
    const h = ph || hits[0];
    c.userData.line.scale.z = h ? h.distance : 40;
    c.userData.dot.visible = !!h;
    if (h) c.userData.dot.position.copy(h.point);
  }
}
renderer.xr.addEventListener('sessionstart', () => {
  initAudioOnce();
  document.getElementById('bar').style.display = 'none';
  camera.rotation.set(0, 0, 0);
  layoutPanels();
  drawAll();
  placePage();
});
renderer.xr.addEventListener('sessionend', () => {
  document.getElementById('bar').style.display = '';
  layoutPanels();
  drawAll();
  placePage();
});

// HTML question box (desktop)
const form = document.getElementById('askForm');
const input = document.getElementById('askInput');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  initAudioOnce();
  input.value = '';
  coachSay('…');
  coachSay(await answer(q));
});

// ---------------------------------------------------------------- CSV
function exportCSV() {
  const head = ['shift', 'situation', 'rule', 'category', 'outcome', 'reaction_s', 'first_look_s', 'look_to_catch_s', 'window_s', 'false_alarms', 'points', 'skill_after'];
  const f = (v) => (v === null || v === undefined ? '' : typeof v === 'number' ? v.toFixed(2) : v);
  const rows = S.allRecords.map((r) => [r.shift, r.n, r.rule, r.cat, r.outcome, f(r.reaction), f(r.firstLook),
    r.reaction !== null && r.firstLook !== null ? f(r.reaction - r.firstLook) : '', f(r.window), r.falseAlarms, r.points, f(r.skillAfter)]);
  const csv = [head].concat(rows).map((r) => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `shiftready-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.__lastCSV = csv;
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let hudTimer = 0;
const markerPos = new THREE.Vector3();
function tick() {
  const dt = Math.min(0.25, clock.getDelta()) * (window.__sr ? window.__sr.timeScale : 1);
  simT += dt;
  if (!renderer.xr.isPresenting) camera.rotation.set(pitch, yaw, 0);
  updateEquipment(dt);
  updateShift(dt);
  updateLabels(dt);
  updateXR(dt);
  // coach gestures while talking
  if (coachState.speaking > 0) {
    coachState.speaking -= dt;
    coach.userData.arms[0].rotation.x = -0.6 + 0.35 * Math.sin(simT * 5);
  } else coach.userData.arms[0].rotation.x *= 0.9;
  if (marker.visible && markerTarget) {
    markerTarget.getWorldPosition(markerPos);
    marker.position.copy(markerPos);
    marker.position.y += 0.05;
    const s = 1 + 0.15 * Math.sin(simT * 6);
    ring.scale.set(s, s, s);
  }
  hudTimer += dt;
  if (S.phase === 'live' && hudTimer > 0.1) {
    hudTimer = 0;
    if (renderer.xr.isPresenting) drawMain();
    updateTimerHtml();
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(tick);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  layoutPanels();
  placePage();
});

setPhase('intro');
drawAll();

// ---------------------------------------------------------------- test hooks
window.__sr = {
  timeScale: 1, S, actors, SIT, eq, panels, camera,
  screenPos: (id) => {
    const v = new THREE.Vector3();
    actors[id].obj.getWorldPosition(v);
    v.y += 1.0;
    v.project(camera);
    return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight, z: v.z };
  },
  start: (role) => { if (role) S.role = role; if (!S.converted) placeLabelsNow(); startShift(role || S.role); },
  labels, pageP, paraRects: () => paraRects,
  drawXR: () => { drawMain(); drawDoc(); drawBubble(); },
  panelPNG: (name) => ({ main: mainP, doc: docP, page: pageP, bubble: bubbleP })[name].c.toDataURL('image/png'),
  click: (id) => onActor(actors[id]),
  button: (id) => onButton(id),
  look: (y, p) => { yaw = y; pitch = p; },
  answer: offlineAnswer,
  csv: () => { exportCSV(); return window.__lastCSV; },
};
