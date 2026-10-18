import type { ReactNode } from 'react';

type Kind = 'bots' | 'crm' | 'websites' | 'automation' | 'process' | 'contact';

// Transparent, static illustrations. No bitmap backing, image hover controls,
// event handlers or focus targets: only the glass object is painted.
function GlassShape({ d, id }: { d: string; id: string }) {
  return <g>
    <path d={d} fill={`url(#${id}-body)`} stroke="#4acfc6" strokeOpacity=".13" strokeWidth="7" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.1" strokeLinejoin="round" />
    <path d={d} fill={`url(#${id}-sheen)`} stroke="#cefffa" strokeOpacity=".16" strokeWidth=".6" />
  </g>;
}

function Cube({ x, y, size, id }: { x: number; y: number; size: number; id: string }) {
  const s = size, a = s * .32;
  return <g transform={`translate(${x} ${y})`}>
    <GlassShape id={id} d={`M0 ${a} Q0 ${a - 5} 6 ${a - 7} L${s * .65} 0 Q${s * .72} -2 ${s * .8} 1 L${s + a} ${a * .5} Q${s + a + 4} ${a * .5 + 2} ${s + a} ${a * .6 + 7} L${s + a} ${s * .95} Q${s + a} ${s + 3} ${s + a - 7} ${s + 6} L${s * .6} ${s + a} Q${s * .52} ${s + a + 3} ${s * .44} ${s + a} L6 ${s + a * .65} Q0 ${s + a * .6} 0 ${s + a * .5} Z`} />
    <path d={`M3 ${a} L${s * .56} ${a * 1.5} L${s + a - 3} ${a * .65} M${s * .56} ${a * 1.5} V${s + a - 2}`} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.6" />
    <path d={`M${s * .56 + 4} ${a * 1.5 + 8} V${s + a - 10}`} fill="none" stroke="#8cfff2" strokeWidth="4" opacity=".12" />
  </g>;
}

function Sphere({ x, y, radius, id }: { x: number; y: number; radius: number; id: string }) {
  return <g>
    <circle cx={x} cy={y} r={radius} fill={`url(#${id}-sphere)`} stroke={`url(#${id}-rim)`} strokeWidth="1.3" />
    <ellipse cx={x} cy={y} rx={radius * .6} ry={radius * .94} fill="none" stroke="#a6fff2" strokeOpacity=".24" transform={`rotate(35 ${x} ${y})`} />
    <path d={`M${x - radius * .65} ${y - radius * .28} Q${x - radius * .5} ${y - radius * .78} ${x + radius * .1} ${y - radius * .8}`} fill="none" stroke="#e0fff9" strokeWidth={radius * .07} strokeLinecap="round" opacity=".8" />
    <ellipse cx={x + radius * .42} cy={y + radius * .56} rx={radius * .17} ry={radius * .08} fill="#8bfff0" opacity=".45" />
  </g>;
}

export function GlassArtwork({ kind, className = '' }: { kind: Kind; className?: string }) {
  const id = `art-${kind}`;
  const panoramic = kind === 'process';
  const contact = kind === 'contact';
  const viewBox = panoramic ? '0 0 1400 180' : contact ? '0 0 600 360' : '0 0 360 250';
  let content: ReactNode;
  if (kind === 'bots') content = <>
    <ellipse cx="186" cy="220" rx="145" ry="15" fill={`url(#${id}-floor)`} />
    <GlassShape id={id} d="M34 58 Q34 43 51 39 L200 15 Q222 12 224 34 L225 127 Q225 145 206 149 L105 169 L73 202 L78 174 L54 178 Q34 181 34 160 Z" />
    <path d="M43 70 L43 145 M57 46 L193 24" fill="none" stroke="#c8fff9" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
    <GlassShape id={id} d="M191 103 Q192 87 209 89 L311 105 Q329 108 329 127 L330 192 Q329 207 315 207 L316 231 L289 207 L209 197 Q190 195 190 178 Z" />
    <path d="M205 97 L303 112 Q321 115 321 131 M320 144 L321 184" fill="none" stroke="#d1fff9" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
  </>;
  else if (kind === 'crm') content = <>
    <ellipse cx="188" cy="226" rx="140" ry="15" fill={`url(#${id}-floor)`} />
    <path d="M177 108 L91 170 M213 107 L285 178" stroke="#90fff1" strokeOpacity=".65" strokeWidth="2" />
    <path d="M177 112 L91 174 M213 111 L285 182" stroke="#a6fff5" strokeOpacity=".13" strokeWidth="7" />
    <Cube x={137} y={22} size={84} id={id} /><Cube x={50} y={143} size={52} id={id} /><Cube x={255} y={156} size={50} id={id} />
  </>;
  else if (kind === 'websites') content = <>
    <ellipse cx="187" cy="227" rx="147" ry="13" fill={`url(#${id}-floor)`} />
    <GlassShape id={id} d="M54 214 L203 164 L329 209 L176 245 Z" />
    <GlassShape id={id} d="M156 79 L284 18 L285 202 L157 171 Z" />
    <GlassShape id={id} d="M111 125 L320 65 L319 223 L111 174 Z" />
    <GlassShape id={id} d="M82 169 L217 137 L217 225 L82 196 Z" />
    <path d="M162 85 L162 165 M118 131 L118 170 M88 173 L88 193" stroke="#bafff6" strokeWidth="3" opacity=".35" />
  </>;
  else if (kind === 'automation') content = <>
    <ellipse cx="182" cy="224" rx="140" ry="14" fill={`url(#${id}-floor)`} />
    <g fill="none" stroke="#85ece2" strokeOpacity=".65" strokeWidth="1.3">
      <path d="M177 124 Q226 70 286 40 M177 124 Q258 133 306 199 M177 124 Q102 147 57 213 M177 124 Q111 117 73 72 M73 72 Q166 124 286 40 M57 213 Q243 259 306 199 M286 40 Q302 134 306 199" />
    </g>
    <Sphere x={177} y={124} radius={43} id={id} /><Sphere x={286} y={40} radius={25} id={id} /><Sphere x={306} y={199} radius={25} id={id} /><Sphere x={57} y={213} radius={24} id={id} /><Sphere x={73} y={72} radius={19} id={id} />
  </>;
  else if (panoramic) content = <>
    <ellipse cx="700" cy="145" rx="650" ry="21" fill={`url(#${id}-floor)`} />
    <GlassShape id={id} d="M23 116 C170 118 224 91 309 75 S429 135 531 126 S698 62 782 48 S897 151 1005 125 S1191 52 1374 29 L1374 51 C1190 65 1120 146 1007 140 S870 77 784 64 S633 133 533 140 S400 91 310 90 S160 133 23 131 Z" />
    <GlassShape id={id} d="M40 111 L133 82 L194 94 L102 127 L40 126 Z" />
    <GlassShape id={id} d="M389 108 L462 63 L540 87 L540 131 L463 143 L389 126 Z" />
    <GlassShape id={id} d="M794 112 L908 35 Q920 27 920 42 L920 129 L807 142 Q795 143 794 130 Z" />
    <GlassShape id={id} d="M1225 94 L1349 15 Q1363 8 1363 25 L1364 132 L1242 141 Q1225 140 1225 124 Z" />
    <path d="M24 119 C170 121 224 94 309 78 S429 138 531 129 S698 65 782 51 S897 154 1005 128 S1191 55 1374 32" fill="none" stroke="#ccfff7" strokeWidth="1.5" opacity=".65" />
  </>;
  else content = <>
    <ellipse cx="300" cy="312" rx="256" ry="24" fill={`url(#${id}-floor)`} />
    <GlassShape id={id} d="M83 100 L292 25 Q303 20 303 33 L303 178 L86 254 Z" />
    <GlassShape id={id} d="M83 101 L515 225 L515 333 L83 210 Z" />
    <GlassShape id={id} d="M312 220 L514 154 L515 225 L312 294 Z" />
    <GlassShape id={id} d="M84 254 L309 181 L514 225 L312 294 Z" />
    <path d="M92 106 L92 202 M299 35 L299 171 M508 231 L508 321" stroke="#bcfff5" strokeWidth="4" opacity=".5" />
  </>;
  return <svg className={`glass-artwork ${className}`} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#98eee1" stopOpacity=".16" /><stop offset=".25" stopColor="#153e41" stopOpacity=".12" /><stop offset=".65" stopColor="#1d8e89" stopOpacity=".06" /><stop offset="1" stopColor="#66fcf1" stopOpacity=".21" /></linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eafffb" stopOpacity=".95" /><stop offset=".23" stopColor="#7effee" stopOpacity=".9" /><stop offset=".49" stopColor="#a4d8d5" stopOpacity=".23" /><stop offset=".7" stopColor="#e2fff9" stopOpacity=".8" /><stop offset="1" stopColor="#66fcf1" stopOpacity=".8" /></linearGradient>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#eaffff" stopOpacity="0" /><stop offset=".4" stopColor="#eaffff" stopOpacity=".01" /><stop offset=".48" stopColor="#eaffff" stopOpacity=".12" /><stop offset=".6" stopColor="#eaffff" stopOpacity="0" /></linearGradient>
      <radialGradient id={`${id}-floor`}><stop stopColor="#56e8d9" stopOpacity=".17" /><stop offset=".6" stopColor="#45a29e" stopOpacity=".06" /><stop offset="1" stopColor="#45a29e" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-sphere`} cx=".3" cy=".25" r=".8"><stop stopColor="#cefff5" stopOpacity=".25" /><stop offset=".28" stopColor="#0e3539" stopOpacity=".12" /><stop offset=".72" stopColor="#1b5457" stopOpacity=".08" /><stop offset=".9" stopColor="#96fff1" stopOpacity=".25" /><stop offset="1" stopColor="#b5fff4" stopOpacity=".5" /></radialGradient>
    </defs>
    {content}
  </svg>;
}
