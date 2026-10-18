'use client';

import { useEffect, useRef } from 'react';
import { MOTION, projectNetworkPoint, type SpatialAnchor } from '@/lib/network-motion';

// All distances are CSS pixels. One scene and one clock for the whole landing.
type Node = SpatialAnchor & { size: number; offsetX: number; offsetY: number; px: number; py: number; scale: number; opacity: number };
type Edge = [number, number, number];

export function NetworkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;
    const fine = matchMedia('(any-pointer: fine) and (any-hover: hover)');
    let width = 0, height = 0, raf = 0, last = 0, elapsed = 0, frameCount = 0, slowFrames = 0;
    let simplified = false;
    let nodes: Node[] = [], edges: Edge[] = [];
    let distant: Node[] = [], distantEdges: Edge[] = [];
    const depth = document.createElement('canvas');
    const back = depth.getContext('2d', { alpha: true });
    let depthResolution = .4;
    const pointer = { x: -1000, y: -1000, active: false };
    function node(x: number, y: number, i: number, size = 1, z = 0): Node {
      return { x, y, z, phase: i * 2.39996, size, offsetX: 0, offsetY: 0, px: x, py: y, scale: 1, opacity: 1 };
    }
    function connections(points: Node[], radius: number): Edge[] {
      const result: Edge[] = [];
      points.forEach((n, i) => {
        points.map((other, j) => ({ j, distance: Math.hypot(n.x - other.x, n.y - other.y) }))
          .filter(other => other.j > i && other.distance < radius)
          .sort((a, b) => a.distance - b.distance).slice(0, 3)
          .forEach(other => result.push([i, other.j, .12 + (i % 3) * .03]));
      });
      return result;
    }
    function setup() {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, MOTION.maxDpr);
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = width < 768;
      const count = simplified ? 42 : small ? 56 : 104;
      nodes = Array.from({ length: count }, (_, i) => {
        const x = ((Math.sin(i * 127.1 + 8) * 43758.5453) % 1 + 1) % 1;
        const y = ((Math.sin(i * 311.7 + 1) * 17852.341) % 1 + 1) % 1;
        return node(x * width, y * height, i, i % 7 === 0 ? 3.3 : 1.6, -65 + (i % 6) * 32);
      });
      // Precompute topology only on resize, never search pairs during animation.
      edges = connections(nodes, width * .24);
      distant = Array.from({ length: simplified ? 18 : small ? 26 : 44 }, (_, i) => {
        const x = ((Math.sin(i * 93.7 + 2) * 26713.43) % 1 + 1) % 1;
        const y = ((Math.sin(i * 159.3 + 7) * 13714.17) % 1 + 1) % 1;
        // Expanded world bounds keep the farther projected web across the frame.
        return node((x * 1.7 - .35) * width, (y * 1.7 - .35) * height, i + 120, i % 4 ? 4 : 8, 280 + (i % 7) * 42);
      });
      distantEdges = connections(distant, width * .55);
      // A small animated depth buffer keeps defocus inexpensive on mobile.
      depthResolution = simplified || small ? .3 : .4;
      depth.width = Math.max(1, Math.round(width * depthResolution));
      depth.height = Math.max(1, Math.round(height * depthResolution));
      back?.setTransform(depthResolution, 0, 0, depthResolution, 0, 0);
    }
    function update(n: Node, dt: number, strength: number) {
      const projected = projectNetworkPoint(n, elapsed, width, height);
      const { x, y } = projected;
      n.scale = projected.scale;
      n.opacity = projected.opacity;
      let ox = 0, oy = 0;
      if (pointer.active && fine.matches) {
        const dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / MOTION.radius);
        const force = influence * influence * (3 - 2 * influence) * MOTION.displacement * strength;
        const angle = distance > 0.01 ? Math.atan2(dy, dx) : n.phase;
        ox = Math.cos(angle) * force; oy = Math.sin(angle) * force;
      }
      const alpha = 1 - Math.exp(-dt / (ox || oy ? MOTION.approachSeconds : MOTION.returnSeconds));
      n.offsetX += (ox - n.offsetX) * alpha; n.offsetY += (oy - n.offsetY) * alpha;
      n.px = x + n.offsetX; n.py = y + n.offsetY;
    }
    function line(a: Node, b: Node, alpha: number) {
      ctx!.strokeStyle = `rgba(71,218,217,${alpha * (a.opacity + b.opacity) / 2})`;
      ctx!.beginPath(); ctx!.moveTo(a.px, a.py); ctx!.lineTo(b.px, b.py); ctx!.stroke();
    }
    function draw(dt: number) {
      ctx!.clearRect(0, 0, width, height);
      distant.forEach(n => update(n, dt, 0));
      if (back) {
        back.clearRect(0, 0, width, height);
        // Blur one batched path at low resolution, rather than each segment.
        back.filter = 'blur(2px)';
        back.lineWidth = 2;
        back.strokeStyle = 'rgba(69,162,158,.25)';
        back.beginPath();
        distantEdges.forEach(([a, b]) => { back.moveTo(distant[a].px, distant[a].py); back.lineTo(distant[b].px, distant[b].py); });
        back.stroke();
        back.filter = 'none';
        distant.forEach(n => {
          const radius = (n.size + 7) * n.scale;
          const glow = back.createRadialGradient(n.px, n.py, 0, n.px, n.py, radius);
          glow.addColorStop(0, `rgba(67,216,211,${n.opacity * .42})`);
          glow.addColorStop(.35, `rgba(67,216,211,${n.opacity * .17})`);
          glow.addColorStop(1, 'rgba(67,216,211,0)');
          back.fillStyle = glow;
          back.fillRect(n.px - radius, n.py - radius, radius * 2, radius * 2);
        });
        ctx!.drawImage(depth, 0, 0, width, height);
      }
      nodes.forEach(n => update(n, dt, n.z > 100 ? .6 : 1));
      ctx!.lineWidth = 0.7;
      edges.forEach(([a, b, alpha]) => line(nodes[a], nodes[b], alpha));
      nodes.forEach((n, i) => {
        if (i % 7 === 0 && !simplified) {
          const radius = 19 * n.scale;
          const glow = ctx!.createRadialGradient(n.px, n.py, 0, n.px, n.py, radius);
          glow.addColorStop(0, `rgba(66,238,231,${.3 * n.opacity})`); glow.addColorStop(1, 'rgba(66,238,231,0)');
          ctx!.fillStyle = glow; ctx!.fillRect(n.px - radius, n.py - radius, radius * 2, radius * 2);
        }
        ctx!.fillStyle = i % 7 === 0 ? `rgba(145,255,244,${n.opacity})` : `rgba(77,232,225,${.65 * n.opacity})`;
        ctx!.beginPath(); ctx!.arc(n.px, n.py, n.size * n.scale, 0, Math.PI * 2); ctx!.fill();
      });
    }
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (last && now - last < 1000 / MOTION.fps) return;
      const delta = last ? now - last : 1000 / MOTION.fps;
      last = now; elapsed += Math.min(delta / 1000, 0.06);
      draw(Math.min(delta / 1000, 0.06));
      // Sustained frame pressure reduces geometry once; never add work to React.
      if (frameCount++ < 120) {
        if (delta > 65) slowFrames++;
        if (frameCount === 120 && slowFrames > 35 && !simplified) { simplified = true; setup(); }
      }
    }
    function start() {
      cancelAnimationFrame(raf); last = 0;
      if (document.hidden) return;
      // Owner requirement: the background stays animated regardless of the
      // system's reduced-motion preference. Other UI transitions still respect it.
      raf = requestAnimationFrame(frame);
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = fine.matches;
    };
    const leave = () => { pointer.active = false; };
    const visibility = () => { leave(); start(); };
    const resize = () => { setup(); };
    setup(); start(); canvas.dataset.ready = 'true';
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', visibility);
    fine.addEventListener('change', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave); window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', visibility); fine.removeEventListener('change', leave);
    };
  }, []);
  return <div className="network-scene" aria-hidden="true"><canvas ref={ref} /><div className="scene-shade" /></div>;
}
