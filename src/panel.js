// Canvas-textured 3D panels with clickable buttons (work with mouse and XR rays).
import * as THREE from 'three';

export const panels = [];

export class Panel {
  constructor(wM, hM, pxW, pxH) {
    this.W = pxW; this.H = pxH;
    this.c = document.createElement('canvas');
    this.c.width = pxW; this.c.height = pxH;
    this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(wM, hM),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }),
    );
    this.mesh.renderOrder = 20;
    this.mesh.userData.panel = this;
    this.buttons = [];
    this.onClick = null;
    panels.push(this);
  }

  begin(bg = 'rgba(18,24,32,0.92)', radius = 28) {
    const g = this.g;
    g.clearRect(0, 0, this.W, this.H);
    this.buttons = [];
    if (bg) {
      g.fillStyle = bg;
      roundRect(g, 0, 0, this.W, this.H, radius);
      g.fill();
    }
    return this;
  }

  text(str, x, y, { size = 30, color = '#ffffff', weight = 'normal', align = 'left', maxW = 0, lh = 1.3 } = {}) {
    const g = this.g;
    g.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'top';
    if (!maxW) {
      g.fillText(str, x, y);
      return y + size * lh;
    }
    const words = String(str).split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) {
        g.fillText(line, x, y);
        y += size * lh;
        line = w;
      } else line = test;
    }
    if (line) {
      g.fillText(line, x, y);
      y += size * lh;
    }
    return y;
  }

  rect(x, y, w, h, color, r = 10) {
    this.g.fillStyle = color;
    roundRect(this.g, x, y, w, h, r);
    this.g.fill();
  }

  button(id, x, y, w, h, label, { color = '#2f6fd6', text = '#ffffff', size = 30, active = false } = {}) {
    const g = this.g;
    g.fillStyle = color;
    roundRect(g, x, y, w, h, 14);
    g.fill();
    if (active) {
      g.strokeStyle = '#ffd200';
      g.lineWidth = 6;
      roundRect(g, x + 3, y + 3, w - 6, h - 6, 12);
      g.stroke();
    }
    g.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    g.fillStyle = text;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, x + w / 2, y + h / 2 + 1);
    this.buttons.push({ id, x, y, w, h });
  }

  commit() {
    this.tex.needsUpdate = true;
  }

  hit(uv) {
    const px = uv.x * this.W, py = (1 - uv.y) * this.H;
    for (const b of this.buttons) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.id;
    }
    return null;
  }
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
