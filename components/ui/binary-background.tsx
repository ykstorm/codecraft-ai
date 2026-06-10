"use client";

import { useEffect, useRef } from "react";

/**
 * <BinaryBackground> — hero canvas of falling binary, ~30 columns, ~8% opacity,
 * cyan glyphs. Pure decoration; pointer-events disabled. Respects reduced motion.
 */
export function BinaryBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const COLS = 30;
    let width = 0;
    let height = 0;
    let cellW = 0;
    let fontSize = 0;
    const drops: number[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      cellW = width / COLS;
      fontSize = Math.max(12, Math.min(18, cellW * 0.9));
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      for (let i = 0; i < COLS; i++) {
        if (drops[i] === undefined) drops[i] = Math.floor((i * 7) % 40);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const rows = () => Math.ceil(height / fontSize) + 1;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#22d3ee";
      for (let i = 0; i < COLS; i++) {
        const x = i * cellW + cellW * 0.25;
        const head = drops[i];
        for (let r = 0; r < 6; r++) {
          const row = head - r;
          if (row < 0) continue;
          const y = (row % rows()) * fontSize;
          // deterministic glyph — no Math.random (forbidden in this env anyway)
          const bit = (i + row + frame) % 3 === 0 ? "1" : "0";
          ctx.fillText(bit, x, y);
        }
        drops[i] = head + 1;
      }
      frame++;
    };

    if (reduce) {
      draw();
    } else {
      let last = 0;
      const loop = (t: number) => {
        if (t - last > 90) {
          draw();
          last = t;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
