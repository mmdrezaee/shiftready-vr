// Procedural construction site: materials, textures and equipment models.
import * as THREE from 'three';

// ---------- textures ----------
export function noiseTex(base, vari, repeat = 1, blotches = 0, blotchColor = 'rgba(0,0,0,0.08)') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < blotches; i++) {
    g.fillStyle = blotchColor;
    g.beginPath();
    g.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 28, 0, Math.PI * 2);
    g.fill();
  }
  const img = g.getImageData(0, 0, 256, 256);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * vari;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function latticeTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 9;
  g.strokeRect(4, 4, 120, 120);
  g.beginPath();
  g.moveTo(4, 124); g.lineTo(124, 4);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function signTexture(lines, { bg = '#ffd200', fg = '#111111', w = 512, h = 256, font = 52, border = '#111111' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = 10;
    g.strokeRect(5, 5, w - 10, h - 10);
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = font * 1.15;
  const y0 = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => {
    const size = i === 0 ? font : Math.round(font * 0.72);
    g.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    g.fillText(ln, w / 2, y0 + i * lh);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- materials ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, o));
export const M = {
  yellow: std(0xf2b705, { roughness: 0.55, metalness: 0.2 }),
  dark: std(0x2b2b2b),
  steel: std(0x8a9099, { metalness: 0.6, roughness: 0.45 }),
  blue: std(0x2f5fa8, { metalness: 0.4, roughness: 0.5 }),
  orange: std(0xff6a13),
  lime: std(0xc8f000),
  white: std(0xf4f4f4),
  red: std(0xd42b2b),
  green: std(0x2f9e44),
  pants: std(0x2c3e66),
  skin: std(0xc99a74),
  tire: std(0x161616, { roughness: 0.95 }),
  glass: std(0x9cc3db, { metalness: 0.3, roughness: 0.15 }),
  wood: std(0x9b7448),
  black: std(0x111111),
  concrete: new THREE.MeshStandardMaterial({ map: noiseTex('#a7a49d', 26, 2, 30), roughness: 0.9 }),
  concreteDark: new THREE.MeshStandardMaterial({ map: noiseTex('#8d8a84', 22, 2, 20), roughness: 0.9 }),
  trenchWall: new THREE.MeshStandardMaterial({ map: noiseTex('#5e4a35', 40, 3, 40), roughness: 1, side: THREE.DoubleSide }),
  gravel: new THREE.MeshStandardMaterial({ map: noiseTex('#8c8274', 60, 1, 80, 'rgba(40,30,20,0.12)'), roughness: 1 }),
  lattice: new THREE.MeshStandardMaterial({ color: 0xf2b705, map: latticeTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.2 }),
  hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
};

// ---------- primitives ----------
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export function cyl(rt, rb, h, mat, seg = 14) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
}
export function sign(lines, w, h, opts, x, y, z, ry = 0, parent = null, postH = 1.4) {
  const g = new THREE.Group();
  const tex = signTexture(lines, opts);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  board.position.y = postH + h / 2;
  g.add(board);
  if (postH > 0) {
    const p1 = cyl(0.05, 0.05, postH + h, M.steel, 8);
    p1.position.set(-w / 2 + 0.1, (postH + h) / 2, -0.03);
    const p2 = p1.clone();
    p2.position.x = w / 2 - 0.1;
    g.add(p1, p2);
  }
  g.position.set(x, y, z);
  g.rotation.y = ry;
  if (parent) parent.add(g);
  return g;
}

// ---------- ground with a trench hole ----------
export const TRENCH = { x0: 6, x1: 15, z0: -21.4, z1: -20.0, depth: 2.4 };

export function makeGround() {
  const shape = new THREE.Shape();
  shape.moveTo(-110, -110); shape.lineTo(110, -110); shape.lineTo(110, 110); shape.lineTo(-110, 110); shape.lineTo(-110, -110);
  // shape y maps to world -z after rotation
  const hole = new THREE.Path();
  hole.moveTo(TRENCH.x0, -TRENCH.z1);
  hole.lineTo(TRENCH.x1, -TRENCH.z1);
  hole.lineTo(TRENCH.x1, -TRENCH.z0);
  hole.lineTo(TRENCH.x0, -TRENCH.z0);
  hole.lineTo(TRENCH.x0, -TRENCH.z1);
  shape.holes.push(hole);
  const tex = noiseTex('#8a6f4e', 46, 1, 70, 'rgba(60,40,20,0.12)');
  tex.repeat.set(0.14, 0.14);
  const ground = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  return ground;
}

export function makeTrench(scene) {
  const { x0, x1, z0, z1, depth } = TRENCH;
  const L = x1 - x0, W = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.Group();
  const north = new THREE.Mesh(new THREE.PlaneGeometry(L, depth), M.trenchWall);
  north.position.set(cx, -depth / 2, z0);
  const south = north.clone();
  south.position.z = z1;
  const west = new THREE.Mesh(new THREE.PlaneGeometry(W, depth), M.trenchWall);
  west.rotation.y = Math.PI / 2;
  west.position.set(x0, -depth / 2, cz);
  const east = west.clone();
  east.position.x = x1;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), M.trenchWall);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, -depth + 0.01, cz);
  g.add(north, south, west, east, floor);
  // spoil pile kept back from the north edge
  const spoil = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), M.trenchWall);
  spoil.scale.set(L / 2, 1.1, 1.3);
  spoil.position.set(cx, 0, z0 - 2.6);
  g.add(spoil);
  // trench box (shoring) at the east end
  const tb = new THREE.Group();
  const plateN = box(3.4, depth + 0.3, 0.12, M.blue, 0, -depth / 2 + 0.15, z0 + 0.08);
  const plateS = box(3.4, depth + 0.3, 0.12, M.blue, 0, -depth / 2 + 0.15, z1 - 0.08);
  tb.add(plateN, plateS);
  for (const sx of [-1.2, 1.2]) for (const sy of [-0.6, -1.7]) {
    const sp = cyl(0.07, 0.07, W - 0.2, M.steel, 8);
    sp.rotation.x = Math.PI / 2;
    sp.position.set(sx, sy, cz);
    tb.add(sp);
  }
  tb.position.x = x1 - 1.9;
  g.add(tb);
  // ladder inside the trench box
  const ladder = new THREE.Group();
  for (const lx of [-0.22, 0.22]) {
    const rail = box(0.06, depth + 1.1, 0.06, M.steel, lx, -depth / 2 + 0.55, 0);
    ladder.add(rail);
  }
  for (let i = 0; i < 7; i++) ladder.add(box(0.44, 0.04, 0.04, M.steel, 0, -depth + 0.3 + i * 0.4, 0));
  ladder.position.set(x1 - 0.7, 0, z1 - 0.35);
  ladder.rotation.x = -0.15;
  g.add(ladder);
  // cones along the south edge
  for (let x = x0 + 0.5; x <= x1; x += 2.4) g.add(cone(x, z1 + 0.9));
  scene.add(g);
  return g;
}

export function cone(x, z) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 12), M.orange);
  c.position.y = 0.37;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.12, 12), M.white);
  band.position.y = 0.45;
  const base = box(0.42, 0.04, 0.42, M.black, 0, 0.02, 0);
  g.add(c, band, base);
  g.position.set(x, 0, z);
  return g;
}

// ---------- road ribbon along a curve ----------
export function ribbon(curve, width, mat, y = 0.02, n = 200) {
  const pts = curve.getSpacedPoints(n);
  const pos = [], uv = [], idx = [];
  let dist = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const t = new THREE.Vector3().subVectors(q, p).setY(0).normalize();
    const nrm = new THREE.Vector3(-t.z, 0, t.x);
    if (i > 0) dist += p.distanceTo(pts[i - 1]);
    pos.push(p.x + nrm.x * width / 2, y, p.z + nrm.z * width / 2, p.x - nrm.x * width / 2, y, p.z - nrm.z * width / 2);
    uv.push(0, dist / 6, 1, dist / 6);
    if (i < pts.length - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  return m;
}

// ---------- people ----------
export function makeWorker({ vest = M.orange, hat = M.white, harness = false, flag = false, paddle = false } = {}) {
  const g = new THREE.Group();
  const legs = [], arms = [];
  for (const sx of [-0.11, 0.11]) {
    const leg = new THREE.Group();
    leg.position.set(sx, 0.9, 0);
    box(0.17, 0.86, 0.19, M.pants, 0, -0.43, 0, leg);
    box(0.19, 0.12, 0.28, M.black, 0, -0.85, 0.04, leg);
    g.add(leg);
    legs.push(leg);
  }
  box(0.46, 0.62, 0.27, vest, 0, 1.22, 0, g);
  box(0.47, 0.06, 0.28, M.lime, 0, 1.1, 0, g);
  box(0.47, 0.06, 0.28, M.lime, 0, 1.36, 0, g);
  for (const sx of [-0.3, 0.3]) {
    const arm = new THREE.Group();
    arm.position.set(sx, 1.5, 0);
    box(0.13, 0.6, 0.15, vest, 0, -0.3, 0, arm);
    box(0.11, 0.1, 0.12, M.skin, 0, -0.62, 0, arm);
    g.add(arm);
    arms.push(arm);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), M.skin);
  head.position.y = 1.67;
  g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat);
  helmet.position.y = 1.72;
  const brim = cyl(0.19, 0.19, 0.02, hat, 14);
  brim.position.y = 1.72;
  g.add(helmet, brim);
  if (harness) {
    box(0.48, 0.05, 0.29, M.yellow, 0, 0.98, 0, g);
    box(0.05, 0.62, 0.285, M.yellow, -0.12, 1.22, 0, g);
    box(0.05, 0.62, 0.285, M.yellow, 0.12, 1.22, 0, g);
  }
  if (flag || paddle) {
    const holder = arms[1];
    holder.rotation.x = -0.9;
    const stick = cyl(0.02, 0.02, 1.2, M.steel, 6);
    stick.position.set(0, -0.62, 0.45);
    stick.rotation.x = Math.PI / 2;
    holder.add(stick);
    if (paddle) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), new THREE.MeshBasicMaterial({ map: signTexture(['STOP'], { bg: '#d42b2b', fg: '#fff', w: 256, h: 256, font: 78, border: '#fff' }), side: THREE.DoubleSide }));
      pad.position.set(0, -0.62, 1.05);
      pad.rotation.x = Math.PI / 2;
      holder.add(pad);
    } else {
      const f = box(0.02, 0.35, 0.5, M.orange, 0, -0.62, 1.0);
      holder.add(f);
    }
  }
  // generous invisible click target
  const hit = box(1.1, 2.1, 1.1, M.hit, 0, 1.0, 0, g);
  hit.userData.isHit = true;
  g.userData.legs = legs;
  g.userData.arms = arms;
  g.userData.phase = Math.random() * 6;
  return g;
}

export function animateWalk(w, speed, dt) {
  const u = w.userData;
  if (speed > 0.01) {
    u.phase += dt * 6.5 * Math.min(1.4, speed);
    const s = Math.sin(u.phase) * 0.55;
    u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s;
    u.arms[0].rotation.x = -s * 0.8;
    if (!w.userData.holding) u.arms[1].rotation.x = s * 0.8;
  } else {
    for (const l of u.legs) l.rotation.x *= 0.85;
    u.arms[0].rotation.x *= 0.85;
    if (!w.userData.holding) u.arms[1].rotation.x *= 0.85;
  }
}

// ---------- vehicles ----------
function wheel(r, wdt, x, y, z, parent) {
  const w = cyl(r, r, wdt, M.tire, 16);
  w.rotation.z = Math.PI / 2;
  w.position.set(x, y, z);
  parent.add(w);
  const hub = cyl(r * 0.45, r * 0.45, wdt + 0.02, M.steel, 10);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, y, z);
  parent.add(hub);
  return w;
}

export function makeDumpTruck(color = M.yellow) {
  const g = new THREE.Group();
  box(2.3, 0.5, 6.6, M.dark, 0, 0.95, 0, g);
  box(2.3, 1.55, 1.8, color, 0, 2.0, 2.35, g);
  box(2.0, 0.7, 0.05, M.glass, 0, 2.35, 3.27, g);
  box(0.05, 0.6, 1.2, M.glass, 1.16, 2.35, 2.4, g);
  box(0.05, 0.6, 1.2, M.glass, -1.16, 2.35, 2.4, g);
  const bed = box(2.45, 1.45, 4.3, color, 0, 1.95, -1.05, g);
  box(2.2, 0.08, 4.1, M.dark, 0, 2.66, -1.05, g);
  box(2.0, 0.35, 0.3, M.dark, 0, 1.0, 3.35, g);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff9a1a }));
  beacon.position.set(0.7, 2.85, 2.3);
  g.add(beacon);
  for (const z of [2.35, -0.6, -2.1]) for (const x of [-1.22, 1.22]) wheel(0.55, 0.45, x, 0.55, z, g);
  const hit = box(3.2, 3.4, 7.4, M.hit, 0, 1.6, 0, g);
  hit.userData.isHit = true;
  g.userData.beacon = beacon;
  g.userData.bed = bed;
  return g;
}

export function makeExcavator() {
  const g = new THREE.Group();
  box(0.8, 0.85, 4.4, M.dark, -1.25, 0.43, 0, g);
  box(0.8, 0.85, 4.4, M.dark, 1.25, 0.43, 0, g);
  box(1.8, 0.5, 2.6, M.dark, 0, 0.85, 0, g);
  const house = new THREE.Group();
  house.position.y = 1.1;
  g.add(house);
  box(2.8, 1.25, 3.0, M.yellow, 0, 0.62, -0.35, house);
  box(1.05, 1.45, 1.15, M.yellow, 0.8, 1.6, 0.75, house);
  box(0.9, 0.9, 0.05, M.glass, 0.8, 1.75, 1.34, house);
  box(2.8, 0.95, 0.75, M.dark, 0, 0.55, -2.15, house);
  const boom = new THREE.Group();
  boom.position.set(-0.25, 1.15, 1.0);
  boom.rotation.x = -0.62;
  house.add(boom);
  box(0.45, 0.5, 4.6, M.yellow, 0, 0, 2.3, boom);
  const stick = new THREE.Group();
  stick.position.set(0, 0, 4.6);
  stick.rotation.x = 1.55;
  boom.add(stick);
  box(0.36, 0.4, 3.0, M.yellow, 0, 0, 1.5, stick);
  const bucket = box(1.0, 0.75, 0.85, M.dark, 0, -0.2, 3.1, stick);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 4.2, 12), M.hit);
  hit.position.y = 2.0;
  hit.userData.isHit = true;
  g.add(hit);
  g.userData.house = house;
  g.userData.boom = boom;
  g.userData.stick = stick;
  g.userData.bucket = bucket;
  return g;
}

export function makeBoomTruck() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  box(2.3, 0.5, 7.2, M.dark, 0, 0.95, 0, body);
  box(2.3, 1.6, 1.9, M.white, 0, 2.0, 2.6, body);
  box(2.0, 0.7, 0.05, M.glass, 0, 2.35, 3.56, body);
  box(2.4, 0.18, 4.2, M.steel, 0, 1.3, -1.2, body);
  box(2.32, 0.1, 1.9, M.red, 0, 2.85, 2.6, body);
  for (const z of [2.6, -1.4, -2.6]) for (const x of [-1.2, 1.2]) wheel(0.52, 0.42, x, 0.52, z, body);
  // outriggers
  for (const z of [0.9, -3.1]) for (const s of [-1, 1]) box(0.25, 1.1, 0.25, M.yellow, s * 1.65, 0.55, z, body);
  const turret = new THREE.Group();
  turret.position.set(0, 1.65, -2.4);
  body.add(turret);
  box(1.3, 0.7, 1.3, M.yellow, 0, 0.3, 0, turret);
  const boom = new THREE.Group();
  boom.position.set(0, 0.6, 0);
  turret.add(boom);
  const sec1 = box(0.42, 0.42, 1, M.yellow, 0, 0, 0.5, boom);
  const sec2 = box(0.32, 0.32, 1, M.yellow, 0, 0, 0.5, boom);
  const tip = box(0.36, 0.5, 0.36, M.dark, 0, -0.2, 0, boom);
  const hit = box(3.2, 3.6, 8.0, M.hit, 0, 1.6, 0, body);
  hit.userData.isHit = true;
  const boomHit = box(1.1, 1.1, 1, M.hit, 0, 0, 0.5, boom);
  boomHit.userData.isHit = true;
  g.userData = { turret, boom, sec1, sec2, tip, boomHit, len: 6 };
  setBoom(g, 0.08, 6);
  return g;
}

export function setBoom(truck, pitch, len) {
  const u = truck.userData;
  u.boom.rotation.x = -pitch;
  u.len = len;
  const a = len * 0.55;
  u.sec1.scale.z = a; u.sec1.position.z = a / 2;
  u.sec2.scale.z = len - a + 0.3; u.sec2.position.z = a + (len - a) / 2 - 0.15;
  u.tip.position.z = len;
  u.boomHit.scale.z = len; u.boomHit.position.z = len / 2;
}

// ---------- tower crane ----------
export function makeTowerCrane(H = 30) {
  const g = new THREE.Group();
  const mast = box(1.8, H, 1.8, M.lattice, 0, H / 2, 0, g);
  mast.material = M.lattice.clone();
  mast.material.map = M.lattice.map.clone();
  mast.material.map.repeat.set(1, H / 1.8);
  box(4, 1, 4, M.concrete, 0, 0.5, 0, g);
  const slew = new THREE.Group();
  slew.position.y = H;
  g.add(slew);
  const jib = box(30, 1.2, 1.2, M.lattice.clone(), 15, 0.7, 0, slew);
  jib.material.map = M.lattice.map.clone();
  jib.material.map.repeat.set(30 / 1.2, 1);
  const cj = box(10, 1.0, 1.4, M.steel, -5, 0.6, 0, slew);
  box(2.2, 2.6, 1.8, M.concreteDark, -8.6, -0.8, 0, slew);
  box(1.7, 1.9, 1.8, M.yellow, 1.3, -0.9, 1.4, slew);
  box(0.05, 1.0, 1.4, M.glass, 2.16, -0.7, 1.4, slew);
  const apex = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5, 4), M.yellow);
  apex.position.y = 3.7;
  apex.rotation.y = Math.PI / 4;
  slew.add(apex);
  const tieMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const tie = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(26, 1.2, 0), new THREE.Vector3(0, 6.2, 0), new THREE.Vector3(-9, 1.0, 0)]);
  slew.add(new THREE.Line(tie, tieMat));
  const trolley = box(1.4, 0.5, 1.5, M.dark, 14, 0, 0, slew);
  const cable = box(0.05, 1, 0.05, M.black, 14, -1, 0, slew);
  const hook = new THREE.Group();
  slew.add(hook);
  box(0.6, 0.7, 0.4, M.yellow, 0, 0, 0, hook);
  // load: bundle of rebar on a spreader
  const load = new THREE.Group();
  load.position.y = -1.6;
  hook.add(load);
  box(3.2, 0.15, 0.25, M.steel, 0, 0.4, 0, load);
  for (let i = 0; i < 9; i++) {
    const r = cyl(0.05, 0.05, 6, std(0x6e3b22), 6);
    r.rotation.z = Math.PI / 2;
    r.position.set(0, -0.5 + (i % 3) * 0.11, -0.12 + Math.floor(i / 3) * 0.12);
    load.add(r);
  }
  const lineMat = new THREE.LineBasicMaterial({ color: 0x222222 });
  load.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.5, 0.35, 0), new THREE.Vector3(-1.5, -0.4, 0)]), lineMat));
  load.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.5, 0.35, 0), new THREE.Vector3(1.5, -0.4, 0)]), lineMat));
  const loadHit = box(6.2, 1.8, 1.4, M.hit, 0, 0, 0, load);
  loadHit.userData.isHit = true;
  g.userData = { slew, trolley, cable, hook, load, H, r: 14, drop: 12 };
  setCrane(g, 0, 14, 12);
  return g;
}

export function setCrane(crane, angle, r, drop) {
  const u = crane.userData;
  u.slew.rotation.y = angle;
  u.r = r; u.drop = drop;
  u.trolley.position.x = r;
  u.cable.position.set(r, -drop / 2, 0);
  u.cable.scale.y = drop;
  u.hook.position.set(r, -drop - 0.3, 0);
}

// ---------- building under construction ----------
export function makeBuilding() {
  const g = new THREE.Group();
  const W = 20, D = 14, LV = [3.6, 7.2, 10.8];
  box(W, 0.3, D, M.concrete, 0, 0.15, 0, g);
  const colX = [-9.5, -4.75, 0, 4.75, 9.5], colZ = [-6.5, 0, 6.5];
  for (let s = 0; s < 3; s++) {
    for (const x of colX) for (const z of colZ) box(0.5, 3.6, 0.5, M.concrete, x, s * 3.6 + 1.8 + 0.15, z, g);
  }
  for (const y of LV) box(W, 0.3, D, M.concrete, 0, y + 0.15 - 0.3, 0, g);
  // starter bars with orange caps on the top deck
  for (const x of colX) for (const z of colZ) {
    for (const dx of [-0.12, 0.12]) {
      const bar = cyl(0.025, 0.025, 1.0, std(0x6e3b22), 6);
      bar.position.set(x + dx, 10.8 + 0.5, z);
      g.add(bar);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M.orange);
      cap.position.set(x + dx, 11.02, z);
      g.add(cap);
    }
  }
  // formwork stacks and a pallet on the deck
  box(2.4, 0.6, 1.2, M.wood, -6, 10.8 + 0.3, -3, g);
  box(1.2, 0.9, 1.2, M.wood, 5, 10.8 + 0.45, -2, g);
  // guardrails: posts and two rails on the front and side edges
  const rails = new THREE.Group();
  g.add(rails);
  const gap = new THREE.Group();
  g.add(gap);
  const addRail = (parent, x0, x1, y, z) => {
    const L = x1 - x0, cx = (x0 + x1) / 2;
    box(L, 0.05, 0.05, M.yellow, cx, y + 1.05, z, parent);
    box(L, 0.05, 0.05, M.yellow, cx, y + 0.55, z, parent);
    for (let x = x0; x <= x1 + 0.01; x += 2.5) box(0.06, 1.1, 0.06, M.steel, x, y + 0.55, z, parent);
  };
  const addSideRail = (parent, z0, z1, y, x) => {
    const L = z1 - z0, cz = (z0 + z1) / 2;
    box(0.05, 0.05, L, M.yellow, x, y + 1.05, cz, parent);
    box(0.05, 0.05, L, M.yellow, x, y + 0.55, cz, parent);
    for (let z = z0; z <= z1 + 0.01; z += 2.5) box(0.06, 1.1, 0.06, M.steel, x, y + 0.55, z, parent);
  };
  for (const y of LV) {
    if (y === 10.8) {
      addRail(rails, -10, -2.5, y, 6.95);
      addRail(rails, 2.5, 10, y, 6.95);
      addRail(gap, -2.5, 2.5, y, 6.95);
    } else addRail(rails, -10, 10, y, 6.95);
    addSideRail(rails, -7, 7, y, -9.95);
    addSideRail(rails, -7, 7, y, 9.95);
  }
  // material hoist on the east side
  const hoist = box(1.6, 15, 1.6, M.lattice, 11.2, 7.5, 2, g);
  hoist.material = M.lattice.clone();
  hoist.material.map = M.lattice.map.clone();
  hoist.material.map.repeat.set(1, 15 / 1.6);
  box(1.4, 1.6, 1.4, M.steel, 11.2, 4.2, 2, g);
  g.userData = { gap, levels: LV };
  return g;
}

// ---------- power line ----------
export function makePowerLine(z, xs, h = 10) {
  const g = new THREE.Group();
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  for (const x of xs) {
    const pole = cyl(0.16, 0.22, h, M.wood, 10);
    pole.position.set(x, h / 2, z);
    g.add(pole);
    box(0.12, 0.14, 2.4, M.wood, x, h - 0.3, z, g);
    for (const dz of [-1.0, 0, 1.0]) {
      const ins = cyl(0.06, 0.08, 0.25, std(0x4f7a52), 8);
      ins.position.set(x, h - 0.1, z + dz);
      g.add(ins);
    }
  }
  const wireY = h - 0.05;
  for (let i = 0; i < xs.length - 1; i++) {
    for (const dz of [-1.0, 0, 1.0]) {
      const a = new THREE.Vector3(xs[i], wireY, z + dz);
      const b = new THREE.Vector3(xs[i + 1], wireY, z + dz);
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= 0.7;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.035, 5, false), wireMat);
      g.add(tube);
    }
  }
  return g;
}

// ---------- site office with the viewing deck ----------
export function makeSiteOffice(deckY) {
  const g = new THREE.Group();
  box(9, deckY - 0.1, 3.2, std(0xe8e4d8), 0, (deckY - 0.1) / 2, 1.6, g);
  box(9.1, 0.12, 3.3, M.dark, 0, deckY - 0.1, 1.6, g);
  for (const x of [-3, 0, 3]) box(1.2, 0.8, 0.05, M.glass, x, 1.7, -0.02, g);
  box(0.9, 2.0, 0.05, std(0x5a6b7d), 3.9, 1.0, -0.02, g);
  // deck floor in front
  box(7.4, 0.12, 2.6, std(0x6f7880, { metalness: 0.4 }), 0, deckY - 0.06, -0.6, g);
  // railing
  const rail = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = Math.atan2(-(z1 - z0), x1 - x0);
    for (const h of [0.5, 1.05]) {
      const r = box(L, 0.05, 0.05, M.yellow, cx, deckY + h, cz, g);
      r.rotation.y = ry;
    }
    const n = Math.max(2, Math.round(L / 1.5));
    for (let i = 0; i <= n; i++) box(0.05, 1.08, 0.05, M.steel, x0 + (x1 - x0) * i / n, deckY + 0.54, z0 + (z1 - z0) * i / n, g);
  };
  rail(-3.7, -1.9, 3.7, -1.9);
  rail(-3.7, -1.9, -3.7, 0.0);
  rail(3.7, -1.9, 3.7, 0.0);
  // stairs down on the east side
  for (let i = 0; i < 8; i++) box(1.0, 0.1, 0.4, M.steel, 4.3, deckY - 0.35 - i * 0.37, -0.4 - i * 0.32, g);
  return g;
}

// ---------- light vehicle (pickup) ----------
export function makePickup(color = 0xf4f4f4) {
  const g = new THREE.Group();
  const body = std(color, { roughness: 0.45, metalness: 0.3 });
  box(1.9, 0.55, 5.0, body, 0, 0.75, 0, g);
  box(1.85, 0.75, 2.0, body, 0, 1.4, 0.75, g);
  box(1.7, 0.5, 0.05, M.glass, 0, 1.45, 1.76, g);
  box(0.05, 0.45, 1.5, M.glass, 0.93, 1.45, 0.75, g);
  box(0.05, 0.45, 1.5, M.glass, -0.93, 1.45, 0.75, g);
  box(1.9, 0.45, 0.08, body, 0, 1.25, -2.46, g);
  box(0.08, 0.45, 2.3, body, 0.91, 1.25, -1.35, g);
  box(0.08, 0.45, 2.3, body, -0.91, 1.25, -1.35, g);
  box(1.95, 0.08, 0.2, M.lime, 0, 1.0, 2.45, g);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff9a1a }));
  beacon.position.set(0, 1.86, 0.6);
  g.add(beacon);
  const whip = cyl(0.015, 0.015, 1.6, M.orange, 6);
  whip.position.set(-0.8, 2.3, -2.3);
  g.add(whip);
  for (const z of [1.55, -1.55]) for (const x of [-0.95, 0.95]) wheel(0.42, 0.3, x, 0.42, z, g);
  const hit = box(2.6, 2.6, 5.8, M.hit, 0, 1.2, 0, g);
  hit.userData.isHit = true;
  g.userData.beacon = beacon;
  return g;
}

// ---------- environmentally sensitive area with a wildlife corridor ----------
export const PROTECTED = { x0: 15.5, x1: 22.5, z0: -23.0, z1: -28.5 };

function spruce(x, z, s, parent) {
  const t = new THREE.Group();
  const trunk = cyl(0.12 * s, 0.16 * s, 1.0 * s, M.wood, 8);
  trunk.position.y = 0.5 * s;
  t.add(trunk);
  const needles = std(0x2f5d3a, { roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry((1.1 - i * 0.28) * s, 1.5 * s, 10), needles);
    c.position.y = (1.3 + i * 0.85) * s;
    t.add(c);
  }
  t.position.set(x, 0, z);
  parent.add(t);
}

export function makeProtectedArea() {
  const { x0, x1, z0, z1 } = PROTECTED;
  const g = new THREE.Group();
  const w = x1 - x0, d = z0 - z1;
  const grassTex = noiseTex('#6f8f45', 50, 1, 60, 'rgba(40,70,20,0.18)');
  grassTex.repeat.set(2, 2);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2);
  g.add(grass);
  // orange snow fence on the sides and back
  const fence = new THREE.MeshStandardMaterial({ color: 0xff6a13, transparent: true, opacity: 0.8, side: THREE.DoubleSide, roughness: 0.8 });
  const run = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az);
    const m = box(L, 1.1, 0.03, fence, (ax + bx) / 2, 0.6, (az + bz) / 2, g);
    m.rotation.y = Math.atan2(-(bz - az), bx - ax);
    const n = Math.round(L / 1.75);
    for (let i = 0; i <= n; i++) box(0.06, 1.3, 0.06, M.steel, ax + (bx - ax) * i / n, 0.65, az + (bz - az) * i / n, g);
  };
  run(x0, z0, x0, z1);
  run(x1, z0, x1, z1);
  run(x0, z1, x1, z1);
  // front edge: stakes with flagging tape
  for (let x = x0; x <= x1 + 0.01; x += 1.4) box(0.05, 1.0, 0.05, M.wood, x, 0.5, z0, g);
  box(w, 0.06, 0.01, std(0xff3b6b), (x0 + x1) / 2, 0.92, z0, g);
  spruce(x0 + 0.9, z1 + 0.9, 1.2, g);
  spruce(x1 - 0.9, z1 + 0.8, 1.0, g);
  spruce(x0 + 0.8, z0 - 1.6, 0.8, g);
  spruce((x0 + x1) / 2 - 0.4, z1 + 0.7, 0.9, g);
  sign(['PROTECTED AREA', 'NO VEHICLES · WILDLIFE CORRIDOR'], 2.4, 0.9, { bg: '#2f7d4a', fg: '#ffffff', border: '#ffffff', font: 54 }, x0 - 0.3, 0, z0 + 0.6, -0.45, g, 1.0);
  return g;
}
