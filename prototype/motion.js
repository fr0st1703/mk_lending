/* PROTOTYPE. One scene, fixed topology, CSS-pixel physics. No per-frame DOM updates. */
(() => {
  const canvas = document.querySelector('#network');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const precise = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const presets = {
    A: { name: 'Тихий', cycle: 90, drift: 4, radius: 120, force: 16, response: .13, recovery: .5 },
    B: { name: 'Баланс', cycle: 70, drift: 7, radius: 140, force: 20, response: .1, recovery: .55 },
    C: { name: 'Выразительный', cycle: 50, drift: 10, radius: 160, force: 24, response: .09, recovery: .65 }
  };
  let key = new URLSearchParams(location.search).get('variant') || 'B';
  if (!presets[key]) key = 'B';
  let config = { ...presets[key] }, width = innerWidth, height = innerHeight, dpr = 1;
  let time = 0, last = 0, frame = 0, paused = false, quality = 1, costly = 0, measured = 0;
  const pointer = { x: -1000, y: -1000, active: false };
  const nodes = [], edges = [];
  let seed = 47;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  function node(x, y, layer, size, phase) { const n = { u:x, v:y, layer, size, phase, dx:0, dy:0, x:0, y:0 }; nodes.push(n); return nodes.length - 1; }
  // Distant organic net; stable connectivity is calculated only once.
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 15; col++) {
      const i = node((col - .5 + random() * .8) / 13, (row - .5 + random() * .7) / 7, 0, 1.4 + random()*3.5, random()*Math.PI*2);
      if (col) edges.push([i, i-1, 0]);
      if (row) edges.push([i, i-15, 0]);
      if (row && col && random() > .2) edges.push([i, i-16, 0]);
    }
  }
  // Near irregular network, concentrated at the perimeter of the composition.
  const start = nodes.length;
  for (let row = 0; row < 7; row++) for (let col = 0; col < 12; col++) {
    const u = (col - .5 + random() * .65) / 10;
    const v = (row - .5 + random() * .8) / 5;
    const i = node(u, v, 1, .9 + random()*1.7, random()*Math.PI*2);
    if (col) edges.push([i,i-1,1]);
    if (row) edges.push([i,i-12,1]);
    if (row && col) edges.push([i,i-13,1]);
  }
  // Two woven ribbons: not a screen-wide particle wallpaper.
  for (let band = 0; band < 2; band++) {
    const cols = 76, rows = 9;
    for (let col = 0; col < cols; col++) for (let row = 0; row < rows; row++) {
      const u = -.07 + col / (cols-1)*1.14, t = row / (rows-1) - .5;
      const center = band === 0 ? .83 + .07*Math.sin(u*7.5) - .13*u : .74 - .63*u + .09*Math.sin(u*6 + 1.2);
      const spread = (.035 + .055*(.5+.5*Math.sin(u*8+band))) * t * 2;
      const v = center + spread;
      const i = node(u, v, 2, (col%4===0 && row%3===0) ? 1.2 : .55, u*7 + row*.28 + band*2);
      if (row) edges.push([i,i-1,2]);
      if (col) edges.push([i,i-rows,2]);
      if (col && row && col%3===0) edges.push([i,i-rows-1,3]);
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if (reduced.matches || paused) draw(0);
  }
  function visibilityAt(x,y) {
    // Quiet upper-left reading area, bright peripheral structure.
    const nx=x/width, ny=y/height;
    return .22 + .78*Math.max(Math.min(1, nx*nx*1.3),Math.max(0,(ny-.48)*2));
  }
  function draw(dt) {
    const staticMode = reduced.matches;
    const theta = time / config.cycle * Math.PI*2;
    ctx.clearRect(0,0,width,height);
    const scale = width < 768 ? .65 : 1;
    for (const n of nodes) {
      const amplitude = config.drift * (n.layer===0 ? .5 : 1);
      const bx = n.u*width + (staticMode ? 0 : Math.sin(theta+n.phase)*amplitude);
      const by = n.v*height + (staticMode ? 0 : Math.cos(theta*.87+n.phase*1.3)*amplitude);
      let tx=0,ty=0;
      if (!staticMode && pointer.active && n.layer!==0) {
        const x=bx-pointer.x,y=by-pointer.y,d=Math.hypot(x,y);
        if (d < config.radius) {
          const f=1-d/config.radius;
          const strength=config.force*f*f*(3-2*f);
          tx=(d>.001 ? x/d : Math.cos(n.phase))*strength;
          ty=(d>.001 ? y/d : Math.sin(n.phase))*strength;
        }
      }
      const tau = Math.hypot(tx,ty) > Math.hypot(n.dx,n.dy) ? config.response : config.recovery;
      const easing=1-Math.exp(-dt/tau);
      if(staticMode){n.dx=0;n.dy=0;}else{n.dx+=(tx-n.dx)*easing;n.dy+=(ty-n.dy)*easing;}
      n.x=bx+n.dx;n.y=by+n.dy;
    }
    // Back plane has softer lines and defocused light points.
    ctx.lineWidth=.8;
    for (const [a,b,layer] of edges) {
      if (quality<.7 && layer===3) continue;
      if (width<768 && layer===3) continue;
      const n=nodes[a],m=nodes[b];
      if (n.x < -80 && m.x < -80 || n.x > width+80 && m.x > width+80) continue;
      const visibility=visibilityAt((n.x+m.x)/2,(n.y+m.y)/2);
      const alpha=([.1,.23,.28,.12][layer])*visibility*scale;
      ctx.strokeStyle=`rgba(102,252,241,${alpha})`;
      ctx.lineWidth=layer===0 ? 1.6 : layer===1 ? .8 : .6;
      ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.stroke();
    }
    for (let i=0;i<nodes.length;i++) {
      const n=nodes[i];
      if (width<768 && n.layer===2 && i%2) continue;
      if (quality<.7 && i%3===0) continue;
      const visibility=visibilityAt(n.x,n.y);
      if(n.layer===0){
        if (quality<.5) continue;
        const radius=n.size*4;
        const glow=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,radius);
        glow.addColorStop(0,`rgba(74,220,218,${visibility*.32})`);glow.addColorStop(.3,`rgba(69,162,158,${visibility*.2})`);glow.addColorStop(1,'rgba(69,162,158,0)');
        ctx.fillStyle=glow;ctx.fillRect(n.x-radius,n.y-radius,radius*2,radius*2);
      }else{
        ctx.beginPath();ctx.arc(n.x,n.y,n.size*scale,0,Math.PI*2);ctx.fillStyle=`rgba(143,255,246,${visibility*(n.layer===1?.78:.65)})`;ctx.fill();
        if(n.layer===1 && n.size>2){ctx.beginPath();ctx.arc(n.x,n.y,n.size*2.7,0,Math.PI*2);ctx.fillStyle=`rgba(102,252,241,${visibility*.065})`;ctx.fill();}
      }
    }
  }
  function tick(now) {
    frame=0;
    if(document.hidden || paused || reduced.matches) return;
    const dt=last ? Math.min((now-last)/1000,.04) : 0;
    last=now;time+=dt;
    const begin=performance.now();draw(dt);const cost=performance.now()-begin;
    measured++; if(cost>22) costly++;
    if(measured===180){if(costly>100){quality=Math.max(.35,quality-.25);if(quality===.35 && costly>150){paused=true;announce();return;}}measured=0;costly=0;}
    frame=requestAnimationFrame(tick);
  }
  function resume(){cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden&&!paused&&!reduced.matches)frame=requestAnimationFrame(tick);else if(reduced.matches)draw(0);}
  function clearPointer(){pointer.active=false;}
  addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!precise.matches||reduced.matches)return;const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*width/r.width;pointer.y=(e.clientY-r.top)*height/r.height;pointer.active=true;},{passive:true});
  document.documentElement.addEventListener('pointerleave',clearPointer);
  addEventListener('blur',clearPointer);
  addEventListener('pointerdown',e=>{if(e.pointerType==='touch')clearPointer();},{passive:true});
  document.addEventListener('visibilitychange',()=>{clearPointer();resume();});
  addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',()=>{clearPointer();resume();announce();});
  precise.addEventListener('change',()=>{clearPointer();announce();});
  function announce(){window.dispatchEvent(new CustomEvent('motionchange',{detail:{key,config:{...config},paused,reduced:reduced.matches,precise:precise.matches,quality}}));}
  window.landingMotion={presets,get state(){return{key,config:{...config},paused,reduced:reduced.matches,precise:precise.matches,quality};},setPreset(next){if(!presets[next])return;key=next;config={...presets[key]};announce();if(paused||reduced.matches)draw(0);},tune(name,value){if(name==='radius')config.radius=Math.min(160,Math.max(120,value));if(name==='force')config.force=Math.min(24,Math.max(16,value));announce();},pause(){paused=!paused;clearPointer();resume();announce();}};
  resize();resume();
  addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  addEventListener('pageshow',resume);
})();
