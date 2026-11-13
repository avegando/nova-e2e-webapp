/*
 * NovaE2E
 * Copyright (C) 2026 Avegando AI Labs LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

/*
 * Sign-in backdrop: two or three jellyfish, drawn live out of text characters ("ASCII art").
 * Each jellyfish is a small brightness function (a dome with a soft rim and an inner glow, long thin tentacles
 * that sway). Every frame the function is sampled on a character grid; brightness picks the character and its
 * colour. Own drawing on one canvas. With prefers-reduced-motion one still frame is drawn.
 */

interface Jelly {
  /** Centre of the bell, relative to the canvas (0..1). */
  x: number;
  y: number;
  /** Bell radius relative to the canvas height. */
  size: number;
  /** 1 = front, smaller = further back (dimmer). */
  depth: number;
  phase: number;
  tentacles: number[][];
}

const LADDER = ' .:-=+*#%@';
const CELL_W = 8;
const CELL_H = 13;
const FRAME_MS = 1000 / 24;
/* Calm grey-blue; only the brightest spots lean slightly towards cyan. */
const SHADES = ['#465564', '#566879', '#687c8f', '#7a8fa3', '#8da2b5', '#9fb3c5', '#b0c4d4', '#bcd3e0', '#c6e2ec'];

const smooth = (a: number, b: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const makeJelly = (x: number, y: number, size: number, depth: number, phase: number, strands: number): Jelly => {
  const tentacles: number[][] = [];
  for (let i = 0; i < strands; i++) {
    const spread = strands === 1 ? 0 : (i / (strands - 1)) * 2 - 1;
    // start on the rim, length in bell radii, sway phase, thickness
    tentacles.push([spread * 0.82, 2.3 + ((i * 7) % 5) * 0.32, i * 1.37 + phase, 0.03 + ((i * 3) % 4) * 0.006]);
  }
  // three wider, shorter arms in the middle
  for (let i = 0; i < 3; i++) {
    tentacles.push([(i - 1) * 0.26, 1.25 + i * 0.18, i * 2.1 + phase + 0.7, 0.075]);
  }
  return {x, y, size, depth, phase, tentacles};
};

/** Brightness (0..1) of one jellyfish at the point (u, v), given in bell radii from the bell centre. */
const jellyBrightness = (jelly: Jelly, u: number, v: number, time: number): number => {
  const pulse = 1 + 0.045 * Math.sin(time * 0.9 + jelly.phase);
  let brightness = 0;
  // bell: a dome that is a little taller when it contracts; bright rim, soft ribs, a glow inside
  const top = -0.92 / pulse;
  if (v <= 0.1 && v >= top - 0.02) {
    const vv = Math.max(-1, v / -top);
    const halfWidth = (v > 0 ? 1 - v * 2.2 : Math.sqrt(1 - vv * vv)) * pulse;
    const edge = Math.abs(u) / Math.max(0.0001, halfWidth);
    if (edge <= 1) {
      const angle = Math.asin(Math.min(1, edge)) * Math.sign(u);
      const ribs = 0.5 + 0.5 * Math.cos(angle * 7);
      const rimLight = Math.pow(edge, 2.4) * 0.5;
      const crown = smooth(top + 0.26, top, v) * 0.34;
      const topLight = Math.exp(-(Math.pow(u + 0.3, 2) + Math.pow(v - top * 0.72, 2)) / 0.045) * 0.3;
      const innerGlow = Math.exp(-(u * u * 1.4 + Math.pow(v + 0.22, 2)) / 0.1) * 0.3;
      const hem = smooth(-0.16, 0.0, v) * 0.5;
      brightness = 0.2 + ribs * 0.1 + rimLight + crown + topLight + innerGlow + hem;
    }
  }
  // tentacles and arms below the rim
  if (v > 0.02) {
    for (const [start, length, phase, thickness] of jelly.tentacles) {
      if (v > length) {
        continue;
      }
      const along = v / length;
      const sway = Math.sin(v * 2.1 - time * 0.75 + phase) * (0.04 + 0.11 * along) + Math.sin(v * 0.9 + time * 0.4 + phase) * 0.05 * along;
      const centre = start * (1 - 0.3 * along) + sway;
      const width = thickness * (1 - 0.5 * along) + 0.02;
      const distance = Math.abs(u - centre);
      if (distance < width) {
        const strand = (0.45 + 0.55 * (1 - distance / width)) * (0.78 * (1 - along * 0.85) + 0.1);
        if (strand > brightness) {
          brightness = strand;
        }
      }
    }
  }
  return Math.min(1, brightness);
};

/** Starts the drawing on the given canvas and returns a function that stops it. */
export function startNovaBackdrop(canvas: HTMLCanvasElement): () => void {
  const cx = canvas.getContext('2d');
  if (!cx) {
    return () => {};
  }
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const jellies: Jelly[] = [
    makeJelly(0.86, 0.6, 0.06, 0.45, 4.1, 5),
    makeJelly(0.15, 0.76, 0.075, 0.62, 2.2, 6),
    makeJelly(0.52, 0.6, 0.15, 1, 0, 9),
  ];
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let stopped = false;

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.font = `12px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;
    cx.textBaseline = 'top';
  };

  const draw = (time: number) => {
    cx.clearRect(0, 0, W, H);
    if (W < 40 || H < 40) {
      return;
    }
    const cols = Math.ceil(W / CELL_W);
    const rows = Math.ceil(H / CELL_H);
    // Keep the area behind the logo and the text free of characters.
    const textBottom = Math.min(H * 0.4, 330);
    const buckets: string[][] = SHADES.map(() => []);
    const positions: number[][] = SHADES.map(() => []);
    for (let row = 0; row < rows; row++) {
      const py = row * CELL_H + CELL_H / 2;
      const mask = smooth(textBottom - 10, textBottom + 50, py);
      if (mask <= 0) {
        continue;
      }
      for (let col = 0; col < cols; col++) {
        const px = col * CELL_W + CELL_W / 2;
        let best = 0;
        for (const jelly of jellies) {
          const radius = jelly.size * H;
          const floatY = Math.sin(time * 0.32 + jelly.phase) * 0.09;
          const floatX = Math.sin(time * 0.21 + jelly.phase * 1.7) * 0.06;
          const u = (px - jelly.x * W) / radius - floatX;
          const v = (py - jelly.y * H) / radius - floatY;
          if (u < -1.7 || u > 1.7 || v < -1.2 || v > 4.3) {
            continue;
          }
          const value = jellyBrightness(jelly, u, v, time) * jelly.depth;
          if (value > best) {
            best = value;
          }
        }
        const value = best * mask;
        if (value < 0.09) {
          continue;
        }
        const char = LADDER[Math.min(LADDER.length - 1, Math.floor(value * LADDER.length))];
        const shade = Math.min(SHADES.length - 1, Math.floor(value * SHADES.length));
        buckets[shade].push(char);
        positions[shade].push(col * CELL_W, row * CELL_H);
      }
    }
    for (let shade = 0; shade < SHADES.length; shade++) {
      const chars = buckets[shade];
      if (!chars.length) {
        continue;
      }
      cx.fillStyle = SHADES[shade];
      const at = positions[shade];
      for (let i = 0; i < chars.length; i++) {
        cx.fillText(chars[i], at[i * 2], at[i * 2 + 1]);
      }
    }
  };

  const frame = (now: number) => {
    if (stopped) {
      return;
    }
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME_MS) {
      return;
    }
    last = now;
    draw(now / 1000);
  };

  const start = () => {
    cancelAnimationFrame(raf);
    if (reduce) {
      draw(2.4);
    } else if (!document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };
  const onResize = () => {
    fit();
    if (reduce) {
      draw(2.4);
    }
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      start();
    }
  };

  fit();
  start();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
