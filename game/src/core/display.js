// Screen sizing. Pixel scenes are 320 x 180 and scaled by a whole number S, drawn at device
// pixels so pixel art stays square and sharp on high-density screens. Cinematic scenes use a
// 1280 x 720 design space shown at S / 4.
export const BASE_W = 320, BASE_H = 180, DESIGN_W = 1280, DESIGN_H = 720;
// The caption strip: its own band under the picture (Michael, Nov 17: captions never cover the
// game). Three caption rows of 10 game pixels; the picture stays 320 x 180 above it.
export const STRIP = 30;

export const display = { S: 4, dpr: 1, w: 1280, h: 720, cssW: 1280, cssH: 720 };

export function measure() {
  const host = document.getElementById('stage');
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const cssW = host ? host.clientWidth : window.innerWidth;
  const reserved = (document.getElementById('chrome-top')?.offsetHeight || 0) + (document.getElementById('chrome-bottom')?.offsetHeight || 0) + 24;
  const cssH = Math.max(BASE_H, window.innerHeight - reserved);
  const S = Math.max(1, Math.floor(Math.min((cssW * dpr) / BASE_W, (cssH * dpr) / (BASE_H + STRIP))));
  display.S = S; display.dpr = dpr;
  display.w = BASE_W * S; display.h = BASE_H * S;
  display.cssW = display.w / dpr; display.cssH = display.h / dpr;
  return display;
}

// Size the canvas element and the caption overlay to the current measurement.
export function applyCss(game) {
  const c = game.canvas;
  c.style.width = display.cssW + 'px';
  c.style.height = display.cssH + 'px';
  const ov = document.getElementById('overlay');
  if (ov) {
    ov.style.width = display.cssW + 'px';
    ov.style.height = (display.cssH * (BASE_H + STRIP) / BASE_H) + 'px';
    ov.style.setProperty('--u', (display.cssH / 180) + 'px'); // one world pixel in CSS px
  }
  const host = document.getElementById('stage');
  if (host) host.style.setProperty('--strip', (display.cssH * STRIP / BASE_H) + 'px');
  game.scale.refresh();
}

// Zoom for a pixel camera (world is 320 x 180 on screen).
export const pixelZoom = () => display.S;
// Zoom for a cinematic camera (design space is 1280 x 720 on screen).
export const designZoom = () => display.S / 4;
// Resolution to draw smooth textures at, relative to design space.
export const smoothRes = () => Math.max(1, Math.min(2, display.S / 4));
