"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";

/**
 * Interactive triangular mesh (hero background).
 *
 * Performance contract — the hero must open instantly on a cold refresh:
 *
 *  1. `requestAnimationFrame` is scheduled from ONE place. The old version
 *     called start() from both the idle callback AND the IntersectionObserver
 *     callback, which — because IO fires synchronously on observe — queued two
 *     independent rAF chains that both ran frame() forever. That halved the
 *     frame rate and never recovered.
 *  2. Stroke/fill colours come from a precomputed palette of 24 alpha steps
 *     instead of building a template-literal string per edge per frame. The
 *     old code allocated ~2 500 strings every single frame; that alone was
 *     enough to make the main thread stutter.
 *  3. Edges whose both endpoints have no glow are batched into a single path
 *     and drawn with one stroke() call, cutting draw calls by an order of
 *     magnitude.
 *  4. The first frame is painted synchronously (so the hero is never blank),
 *     then the loop waits for idle + visibility. Nothing animates while the
 *     tab is hidden or the canvas is scrolled out of view.
 *  5. `ResizeObserver`/`IntersectionObserver` are feature-guarded, and the DPR
 *     is capped at 1.5 because a 2x backing store on a 1440p hero costs four
 *     times the fill rate for a lattice of hairline strokes nobody can see.
 */
const ALPHA_STEPS = 24;

/** Precomputed `rgba(255,255,255,a)` for every step, built once per module. */
const LINE_ALPHA: string[] = Array.from({ length: ALPHA_STEPS + 1 }, (_, i) =>
  `rgba(255,255,255,${(0.07 + (i / ALPHA_STEPS) * 0.55).toFixed(3)})`,
);
const DOT_ALPHA: string[] = Array.from({ length: ALPHA_STEPS + 1 }, (_, i) =>
  `rgba(255,255,255,${(0.22 + (i / ALPHA_STEPS) * 0.7).toFixed(3)})`,
);

export function MeshCanvas({
  spacing = 64,
  className,
}: {
  spacing?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    /* On phones the lattice is wider than the viewport, so thin it out —
       fewer nodes is the single biggest win on a low-end GPU. */
    const step = (isCoarse ? spacing * 1.35 : spacing) | 0;
    const rowH = step * 0.866;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let glow = new Float32Array(0);
    /* Scratch buffers reused every frame: never allocate inside frame(). */
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let visible = false;
    let running = false;
    let idleReady = false;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / step) + 3;
      rows = Math.ceil(h / rowH) + 3;
      px = new Float32Array(cols * rows);
      py = new Float32Array(cols * rows);
      glow = new Float32Array(cols * rows);
    };
    const R = 190;
    const R2 = R * R;

    const frame = () => {
      t += 0.006;

      /* ---- pass 1: integrate the lattice ---- */
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const bx = (c - 1) * step + (r % 2 ? step / 2 : 0);
          const by = (r - 1) * rowH;
          let x = bx + Math.sin(by * 0.012 + t * 1.3) * 5 + Math.cos(bx * 0.01 + t) * 3;
          let y = by + Math.cos(bx * 0.011 + t * 1.1) * 5;
          let g = 0;
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            /* squared-distance reject avoids a sqrt for the ~99% of nodes
               that are nowhere near the pointer */
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              const f = 1 - d / R;
              const push = f * f * 38;
              x += (dx / d) * push;
              y += (dy / d) * push;
              g = f;
            }
          }
          px[i] = x;
          py[i] = y;
          glow[i] += (g - glow[i]) * 0.15;
        }
      }

      ctx.clearRect(0, 0, w, h);

      /* ---- pass 2: dark edges in ONE batched path ---- */
      ctx.lineWidth = 0.7;
      const inactive = LINE_ALPHA[0];
      ctx.strokeStyle = inactive;
      ctx.beginPath();
      const dark = (a: number, b: number) => {
        ctx.moveTo(px[a], py[a]);
        ctx.lineTo(px[b], py[b]);
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c + 1 < cols) dark(i, i + 1);
          if (r + 1 < rows) {
            const odd = r % 2 === 1;
            const dl = (r + 1) * cols + (odd ? c : c - 1);
            const dr = (r + 1) * cols + (odd ? c + 1 : c);
            if (odd || c > 0) dark(i, dl);
            if (!odd || c + 1 < cols) dark(i, dr);
          }
        }
      }
      ctx.stroke();

      /* ---- pass 3: the few lit edges, individually (they need colour) ---- */
      const line = (a: number, b: number) => {
        const g = Math.max(glow[a], glow[b]);
        const k = g > 1 ? 1 : g;
        const idx = (k * ALPHA_STEPS) | 0;
        if (idx === 0) return; // already covered by the batched pass
        ctx.strokeStyle = LINE_ALPHA[idx];
        ctx.beginPath();
        ctx.moveTo(px[a], py[a]);
        ctx.lineTo(px[b], py[b]);
        ctx.stroke();
      };
      let lit = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (glow[i] < 1 / ALPHA_STEPS) continue;
          if (c + 1 < cols) {
            lit = true;
            line(i, i + 1);
          }
          if (r + 1 < rows) {
            const odd = r % 2 === 1;
            const dl = (r + 1) * cols + (odd ? c : c - 1);
            const dr = (r + 1) * cols + (odd ? c + 1 : c);
            if (odd || c > 0) lit = true;
            if (odd || c > 0) line(i, dl);
            if (!odd || c + 1 < cols) line(i, dr);
          }
        }
      }
      void lit;

      /* ---- pass 4: nodes ---- */
      for (let i = 0; i < px.length; i++) {
        const k = glow[i];
        const idx = ((k > 1 ? 1 : k) * ALPHA_STEPS) | 0;
        ctx.fillStyle = DOT_ALPHA[idx];
        const rad = 1.1 + (k > 1 ? 1 : k) * 1.2;
        ctx.beginPath();
        ctx.arc(px[i], py[i], rad, 0, 6.2832);
        ctx.fill();
      }
    };

    /* ---------------- single-source scheduling ---------------- */

    const loop = () => {
      if (!running) return;
      if (document.hidden || !visible) {
        /* Stop the chain entirely rather than burning a frame per tick to
           rediscover that we are off-screen. */
        running = false;
        raf = 0;
        return;
      }
      frame();
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      if (running || reduced) return;
      if (document.hidden || !visible || !idleReady) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const pause = () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    resize();
    /* Paint once, synchronously, so the hero never renders an empty plane. */
    frame();
    visible = true; // assume visible until the observer says otherwise

    const idleWin = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    if (reduced) {
      idleReady = true;
    } else if (typeof idleWin.requestIdleCallback === "function") {
      /* Wait for genuine idle time so animation never competes with hydration
         and the first paint of the hero. */
      idleHandle = idleWin.requestIdleCallback(
        () => {
          idleReady = true;
          play();
        },
        { timeout: 1500 },
      );
    } else {
      timeoutHandle = window.setTimeout(() => {
        idleReady = true;
        play();
      }, 400);
    }

    const ro =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            resize();
            if (reduced) frame();
          })
        : null;
    ro?.observe(canvas);

    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              if (visible) play();
              else pause();
            },
            { rootMargin: "120px" },
          )
        : null;
    io?.observe(canvas);

    /* Pointer work only matters on a real mouse. Touch devices never fire a
       useful pointermove here, so skip the listener entirely. */
    const onMove = isCoarse
      ? null
      : (e: PointerEvent) => {
          if (reduced) return;
          const rect = canvas.getBoundingClientRect();
          mouse.x = e.clientX - rect.left;
          mouse.y = e.clientY - rect.top;
          mouse.active = mouse.y > -R && mouse.y < rect.height + R;
        };
    const onLeave = () => {
      mouse.active = false;
    };

    const onVis = () => {
      if (document.hidden) pause();
      else play();
    };

    if (onMove) window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      pause();
      if (idleHandle !== null) idleWin.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
      ro?.disconnect();
      io?.disconnect();
      if (onMove) window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [spacing]);

  return <canvas ref={ref} aria-hidden className={className ?? "block h-full w-full"} />;
}
