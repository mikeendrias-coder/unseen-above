// Screen sizing (Nov 18, Michael: "make the game screen bigger"). Pixel scenes are 320 x 180;
// cinematic scenes use a 1280 x 720 design space shown at S / 4. The picture (and the caption
// strip under it) takes the largest size that fits the window: F device pixels per game pixel,
// fractional when it has to be, but a whole number when that is within about 10 percent of the
// fit (whole numbers give every game pixel the same size). The game draws at S = the whole part of
// F (S device pixels per game pixel, so everything that maps through S stays exact), and the page
// stretches that to F with nearest sampling (image-rendering: pixelated), so pixels stay hard.
export const BASE_W = 320, BASE_H = 180, DESIGN_W = 1280, DESIGN_H = 720;
// The caption strip: its own band under the picture (Michael, Nov 17: captions never cover the
// game). Three caption rows of 10 game pixels; the picture stays 320 x 180 above it.
export const STRIP = 30;
// how near the fit a whole-number scale must be to win over the fractional one
export const WHOLE_WITHIN = 0.9;

// S: the drawing scale (whole); F: the shown scale in device pixels (may be fractional);
// w, h: the canvas in device pixels; cssW, cssH: the picture on the page, in CSS pixels
export const display = { S: 4, F: 4, dpr: 1, w: 1280, h: 720, cssW: 1280, cssH: 720 };

const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
// an element's height with its margins
function outer(el) {
  if (!el || !el.offsetHeight) return 0;
  const cs = getComputedStyle(el);
  return el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
}
// the scale for an area: the fit, or a whole number when that is close enough
export function fitScale(cssW, cssH, dpr) {
  const fit = Math.min((cssW * dpr) / BASE_W, (cssH * dpr) / (BASE_H + STRIP));
  const whole = Math.floor(fit);
  if (whole >= 1 && whole / fit >= WHOLE_WITHIN) return whole;
  // a twentieth of a pixel at a time: 320 F and 180 F stay whole device pixels
  return Math.max(0.5, Math.floor(fit * 20) / 20);
}

export function measure() {
  const host = document.getElementById('stage');
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const top = document.getElementById('chrome-top'), foot = document.getElementById('chrome-bottom');
  let cssW, cssH;
  if (fsOn()) {
    // full screen: the whole screen, less the keys when they are unfolded (they sit inside the stage)
    cssW = window.innerWidth;
    const keys = foot && host && host.contains(foot) && !foot.classList.contains('folded') ? foot.offsetHeight + 4 : 0;
    cssH = window.innerHeight - keys;
  } else {
    const bs = getComputedStyle(document.body);
    const pads = (parseFloat(bs.paddingTop) || 0) + (parseFloat(bs.paddingBottom) || 0) + (parseFloat(bs.marginTop) || 0) + (parseFloat(bs.marginBottom) || 0);
    cssW = host ? host.clientWidth : window.innerWidth;
    cssH = window.innerHeight - outer(top) - outer(foot) - pads - 2;
  }
  cssH = Math.max(BASE_H / 2, cssH);
  const F = fitScale(cssW, cssH, dpr), S = Math.max(1, Math.floor(F));
  display.S = S; display.F = F; display.dpr = dpr;
  display.w = BASE_W * S; display.h = BASE_H * S;
  display.cssW = BASE_W * F / dpr; display.cssH = BASE_H * F / dpr;
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
