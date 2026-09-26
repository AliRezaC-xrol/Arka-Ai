"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";

/**
 * Interactive triangular mesh (apmix.ai hero background, rebuilt from
 * scratch). A triangular lattice drifts on a slow sine field; near the
 * pointer the points are pushed outward like a lens and the edges light
 * up. Canvas 2D, DPR-aware, paused off-screen and on hidden tabs. Under
 * prefers-reduced-motion it draws one static frame and ignores the pointer.
 */
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    const rowH = spacing * 0.866;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let glow = new Float32Array(0);
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let visible = true;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / spacing) + 3;
      rows = Math.ceil(h / rowH) + 3;
      px = new Float32Array(cols * rows);
      py = new Float32Array(cols * rows);
      glow = new Float32Array(cols * rows);
    };
    const R = 190;

    const frame = () => {
      t += 0.006;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const bx = (c - 1) * spacing + (r % 2 ? spacing / 2 : 0);
          const by = (r - 1) * rowH;
          // slow organic drift
          let x = bx + Math.sin(by * 0.012 + t * 1.3) * 5 + Math.cos(bx * 0.01 + t) * 3;
          let y = by + Math.cos(bx * 0.011 + t * 1.1) * 5;
          let g = 0;
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < R) {
              const f = 1 - d / R;
              const push = f * f * 38;
              x += (dx / (d || 1)) * push;
              y += (dy / (d || 1)) * push;
              g = f;
            }
          }
          px[i] = x;
          py[i] = y;
          glow[i] += (g - glow[i]) * 0.15;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 0.7;
      const line = (a: number, b: number) => {
        const k = Math.max(glow[a], glow[b]);
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + k * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(px[a], py[a]);
        ctx.lineTo(px[b], py[b]);
        ctx.stroke();
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c + 1 < cols) line(i, i + 1);
          if (r + 1 < rows) {
            const odd = r % 2 === 1;
            const dl = (r + 1) * cols + (odd ? c : c - 1);
            const dr = (r + 1) * cols + (odd ? c + 1 : c);
            if (odd || c > 0) line(i, dl);
            if (!odd || c + 1 < cols) line(i, dr);
          }
        }
      }
      for (let i = 0; i < px.length; i++) {
        const k = glow[i];
        ctx.fillStyle = `rgba(255,255,255,${0.22 + k * 0.7})`;
        ctx.beginPath();
        ctx.arc(px[i], py[i], 1.1 + k * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      frame();
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) frame();
      else raf = requestAnimationFrame(loop);
    };

    resize();
    // Paint one frame immediately so the hero is never empty, then defer the
    // animation loop until the main thread is idle — otherwise the first frame
    // competes with hydration and the hero feels laggy on load.
    frame();

    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    if (!reduced) {
      const idleWin = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
      if (typeof idleWin.requestIdleCallback === "function") {
        idleHandle = idleWin.requestIdleCallback(() => start(), { timeout: 1200 });
      } else {
        timeoutHandle = window.setTimeout(start, 200);
      }
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) frame();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
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
      if (!document.hidden) start();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      const idleWin = window as Window & { cancelIdleCallback?: (handle: number) => void };
      if (idleHandle !== null) idleWin.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [spacing]);

  return <canvas ref={ref} aria-hidden className={className ?? "block h-full w-full"} />;
}
