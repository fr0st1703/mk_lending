// Spatial coordinates and pointer distances are in CSS pixels, independent of DPR.
export const MOTION = {
  cycleSeconds: 80, drift: 18, depthDrift: 65, focalLength: 1100,
  radius: 145, displacement: 20,
  approachSeconds: 0.16, returnSeconds: 0.55, maxDpr: 1.5, fps: 30,
};

export type SpatialAnchor = { x: number; y: number; z: number; phase: number };

export function projectNetworkPoint(anchor: SpatialAnchor, seconds: number, width: number, height: number) {
  const time = seconds / MOTION.cycleSeconds * Math.PI * 2;
  // Independent, smooth trajectories: no shared flat-image sway or abrupt loops.
  const x = anchor.x + (Math.sin(time + anchor.phase) + .25 * Math.sin(time * .43 + anchor.phase * 1.7)) * MOTION.drift;
  const y = anchor.y + Math.cos(time * .81 + anchor.phase * .89) * MOTION.drift * .82;
  const z = anchor.z + Math.sin(time * .63 + anchor.phase * .61) * MOTION.depthDrift;
  const scale = MOTION.focalLength / (MOTION.focalLength + z);
  const distance = Math.max(0, Math.min(1, (z + 160) / 800));
  return {
    x: width / 2 + (x - width / 2) * scale,
    y: height / 2 + (y - height / 2) * scale,
    z, scale, distance,
    opacity: 1 - distance * .65,
  };
}
