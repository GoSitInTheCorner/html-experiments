import { useState, useEffect, useRef, useCallback } from "react";

const TILE = 72;
const GRID_W = 32;
const GRID_H = 32;
const TICK_MS = 800;

// ── PROCEDURAL TILE RENDERERS ─────────────────────────────────────────────
// Each returns an offscreen canvas at TILE×TILE resolution, seeded by (x,y)
function seededRand(x, y, i=0) {
  let s = Math.sin(x*127.1 + y*311.7 + i*74.3) * 43758.5453;
  return s - Math.floor(s);
}

function drawGrassTile(x, y) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  // Base
  const baseGreen = `hsl(${105+Math.floor(seededRand(x,y)*18)},${42+Math.floor(seededRand(x,y,1)*18)}%,${22+Math.floor(seededRand(x,y,2)*10)}%)`;
  c.fillStyle = baseGreen; c.fillRect(0,0,sz,sz);
  // Subtle patches
  for (let i=0;i<6;i++) {
    const px=seededRand(x,y,i+10)*sz, py=seededRand(x,y,i+20)*sz;
    const pr=4+seededRand(x,y,i+30)*10;
    c.fillStyle=`rgba(${30+Math.floor(seededRand(x,y,i+40)*30)},${80+Math.floor(seededRand(x,y,i+50)*40)},${20+Math.floor(seededRand(x,y,i+60)*20)},0.35)`;
    c.beginPath(); c.ellipse(px,py,pr,pr*0.6,seededRand(x,y,i+70)*Math.PI,0,Math.PI*2); c.fill();
  }
  // Grass blades
  for (let i=0;i<18;i++) {
    const bx=seededRand(x,y,i+80)*sz, by=seededRand(x,y,i+90)*sz;
    const h=3+seededRand(x,y,i+100)*6;
    const lean=(seededRand(x,y,i+110)-0.5)*5;
    c.strokeStyle=`rgba(${40+Math.floor(seededRand(x,y,i+120)*40)},${90+Math.floor(seededRand(x,y,i+130)*50)},${15+Math.floor(seededRand(x,y,i+140)*20)},0.7)`;
    c.lineWidth=0.8; c.beginPath(); c.moveTo(bx,by); c.lineTo(bx+lean,by-h); c.stroke();
  }
  // Tiny flowers
  if (seededRand(x,y,200) > 0.55) {
    const fx=seededRand(x,y,201)*sz, fy=seededRand(x,y,202)*sz;
    c.fillStyle=seededRand(x,y,203)>0.5?"rgba(255,255,120,0.8)":"rgba(255,150,180,0.8)";
    c.beginPath(); c.arc(fx,fy,1.5,0,Math.PI*2); c.fill();
  }
  return oc;
}

function drawWaterTile(x, y, frame=0) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  // Deep base
  const g = c.createLinearGradient(0,0,sz,sz);
  g.addColorStop(0,"#1a4a6e"); g.addColorStop(0.5,"#1d5580"); g.addColorStop(1,"#163d5c");
  c.fillStyle=g; c.fillRect(0,0,sz,sz);
  // Wave lines
  for (let row=0; row<5; row++) {
    const wy = (row/5)*sz + (seededRand(x,y,row)*sz*0.15);
    const phase = seededRand(x,y,row+10)*Math.PI*2 + frame*0.04;
    c.beginPath();
    c.strokeStyle=`rgba(100,185,255,${0.12+row*0.03})`;
    c.lineWidth = 0.8+row*0.3;
    for (let wx=0; wx<=sz; wx+=2) {
      const waveY = wy + Math.sin((wx/sz)*Math.PI*3 + phase)*3;
      if (wx===0) c.moveTo(wx,waveY); else c.lineTo(wx,waveY);
    }
    c.stroke();
  }
  // Surface sparkles
  for (let i=0;i<5;i++) {
    const spark = seededRand(x,y,i+50);
    if (spark > 0.6) {
      const sx=seededRand(x,y,i+60)*sz, sy=seededRand(x,y,i+70)*sz;
      const alpha = 0.3 + Math.sin(frame*0.12+i)*0.25;
      c.fillStyle=`rgba(200,235,255,${alpha})`;
      c.fillRect(sx,sy,2,1);
    }
  }
  // Shallow edge highlight
  c.strokeStyle="rgba(130,200,255,0.18)"; c.lineWidth=1;
  c.strokeRect(0.5,0.5,sz-1,sz-1);
  return oc;
}

function drawForestTile(x, y) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  // Dark undergrowth base
  c.fillStyle=`hsl(120,${35+seededRand(x,y)*12}%,${12+seededRand(x,y,1)*6}%)`; c.fillRect(0,0,sz,sz);
  // Mossy ground patches
  for (let i=0;i<4;i++) {
    const px=seededRand(x,y,i+5)*sz, py=seededRand(x,y,i+15)*sz;
    c.fillStyle=`rgba(20,80,20,0.4)`;
    c.beginPath(); c.ellipse(px,py,8+seededRand(x,y,i+25)*10,5+seededRand(x,y,i+35)*7,0,0,Math.PI*2); c.fill();
  }
  // Tree canopies (2-3 per tile)
  const numTrees = 2 + Math.floor(seededRand(x,y,99)*2);
  for (let t=0; t<numTrees; t++) {
    const tx=sz*0.25+seededRand(x,y,t+100)*(sz*0.5);
    const ty=sz*0.25+seededRand(x,y,t+110)*(sz*0.5);
    const tr=10+seededRand(x,y,t+120)*14;
    // Shadow
    c.fillStyle="rgba(0,0,0,0.25)"; c.beginPath(); c.ellipse(tx+3,ty+4,tr,tr*0.55,0,0,Math.PI*2); c.fill();
    // Dark outer canopy
    c.fillStyle=`hsl(${115+seededRand(x,y,t+130)*20},${45+seededRand(x,y,t+140)*20}%,${18+seededRand(x,y,t+150)*12}%)`;
    c.beginPath(); c.arc(tx,ty,tr,0,Math.PI*2); c.fill();
    // Lighter top highlight
    c.fillStyle=`hsl(${118+seededRand(x,y,t+160)*15},${40+seededRand(x,y,t+170)*20}%,${30+seededRand(x,y,t+180)*15}%)`;
    c.beginPath(); c.arc(tx-tr*0.2,ty-tr*0.2,tr*0.6,0,Math.PI*2); c.fill();
    // Bright top spec
    c.fillStyle=`rgba(100,200,80,0.3)`;
    c.beginPath(); c.arc(tx-tr*0.3,ty-tr*0.3,tr*0.3,0,Math.PI*2); c.fill();
  }
  return oc;
}

function drawMountainTile(x, y) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  // Rocky dirt base
  c.fillStyle=`hsl(25,${15+seededRand(x,y)*12}%,${28+seededRand(x,y,1)*10}%)`; c.fillRect(0,0,sz,sz);
  // Rock texture splotches
  for (let i=0;i<8;i++) {
    const rx=seededRand(x,y,i+10)*sz, ry=seededRand(x,y,i+20)*sz;
    const rw=4+seededRand(x,y,i+30)*12, rh=3+seededRand(x,y,i+40)*8;
    const lightness = 28+seededRand(x,y,i+50)*20;
    c.fillStyle=`hsl(20,${10+seededRand(x,y,i+60)*15}%,${lightness}%)`;
    c.beginPath(); c.ellipse(rx,ry,rw,rh,seededRand(x,y,i+70)*Math.PI,0,Math.PI*2); c.fill();
  }
  // Mountain peaks (1-2)
  const numPeaks = 1 + Math.floor(seededRand(x,y,200)*1.5);
  for (let p=0;p<numPeaks;p++) {
    const px = sz*(0.2+seededRand(x,y,p+201)*0.6);
    const baseW = sz*(0.3+seededRand(x,y,p+202)*0.3);
    const peakH = sz*(0.45+seededRand(x,y,p+203)*0.35);
    // Shadow side
    c.fillStyle=`hsl(20,10%,${22+seededRand(x,y,p+204)*10}%)`;
    c.beginPath(); c.moveTo(px,sz*0.85-peakH); c.lineTo(px+baseW*0.55,sz*0.85); c.lineTo(px,sz*0.85); c.closePath(); c.fill();
    // Light side
    c.fillStyle=`hsl(25,${12+seededRand(x,y,p+205)*10}%,${38+seededRand(x,y,p+206)*15}%)`;
    c.beginPath(); c.moveTo(px,sz*0.85-peakH); c.lineTo(px-baseW*0.45,sz*0.85); c.lineTo(px,sz*0.85); c.closePath(); c.fill();
    // Snow cap
    const snowH = peakH*0.22;
    c.fillStyle="rgba(240,245,255,0.88)";
    c.beginPath(); c.moveTo(px,sz*0.85-peakH); c.lineTo(px-baseW*0.12,sz*0.85-peakH+snowH); c.lineTo(px+baseW*0.1,sz*0.85-peakH+snowH); c.closePath(); c.fill();
  }
  // Pebbles
  for (let i=0;i<10;i++) {
    const px=seededRand(x,y,i+300)*sz, py=seededRand(x,y,i+310)*sz;
    c.fillStyle=`hsl(20,8%,${35+seededRand(x,y,i+320)*25}%)`;
    c.beginPath(); c.ellipse(px,py,1.5+seededRand(x,y,i+330)*2,1+seededRand(x,y,i+340)*1.5,0,0,Math.PI*2); c.fill();
  }
  return oc;
}

function drawSandTile(x, y) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  c.fillStyle=`hsl(38,${42+seededRand(x,y)*18}%,${58+seededRand(x,y,1)*12}%)`; c.fillRect(0,0,sz,sz);
  for (let i=0;i<20;i++) {
    const px=seededRand(x,y,i+5)*sz, py=seededRand(x,y,i+15)*sz;
    c.fillStyle=`rgba(${140+Math.floor(seededRand(x,y,i+25)*40)},${100+Math.floor(seededRand(x,y,i+35)*30)},${40+Math.floor(seededRand(x,y,i+45)*20)},0.25)`;
    c.fillRect(px,py,1+seededRand(x,y,i+55)*2,1);
  }
  return oc;
}

function drawSnowTile(x, y) {
  const sz = TILE;
  const oc = document.createElement("canvas"); oc.width=sz; oc.height=sz;
  const c = oc.getContext("2d");
  // White-blue base with subtle variation
  const lightness = 88 + seededRand(x,y)*8;
  c.fillStyle=`hsl(210,${20+seededRand(x,y,1)*15}%,${lightness}%)`; c.fillRect(0,0,sz,sz);
  // Ice cracks / snow texture
  for (let i=0;i<12;i++) {
    const sx2=seededRand(x,y,i+10)*sz, sy2=seededRand(x,y,i+20)*sz;
    const ex=sx2+(seededRand(x,y,i+30)-0.5)*sz*0.3, ey=sy2+(seededRand(x,y,i+40)-0.5)*sz*0.3;
    c.strokeStyle=`rgba(160,185,220,${0.15+seededRand(x,y,i+50)*0.2})`;
    c.lineWidth=0.5; c.beginPath(); c.moveTo(sx2,sy2); c.lineTo(ex,ey); c.stroke();
  }
  // Sparkle highlights
  for (let i=0;i<8;i++) {
    if (seededRand(x,y,i+60)>0.5) {
      const spx=seededRand(x,y,i+70)*sz, spy=seededRand(x,y,i+80)*sz;
      c.fillStyle="rgba(255,255,255,0.85)";
      c.fillRect(spx,spy,1.5,1.5);
    }
  }
  // Rocky outcrops poking through snow
  for (let i=0;i<3;i++) {
    if (seededRand(x,y,i+90)>0.6) {
      const rx=seededRand(x,y,i+100)*sz, ry=seededRand(x,y,i+110)*sz;
      c.fillStyle=`hsl(215,15%,${50+seededRand(x,y,i+120)*15}%)`;
      c.beginPath(); c.ellipse(rx,ry,4+seededRand(x,y,i+130)*6,3+seededRand(x,y,i+140)*4,seededRand(x,y,i+150)*Math.PI,0,Math.PI*2); c.fill();
    }
  }
  return oc;
}


const TILE_CACHE = new Map();
function getTile(type, x, y, frame=0) {
  const waterFrame = Math.floor(frame/4) % 16; // 16 animation frames, update every 4 ticks
  const key = type==="water" ? `water-${x}-${y}-${waterFrame}` : `${type}-${x}-${y}`;
  if (!TILE_CACHE.has(key)) {
    switch(type) {
      case "grass":    TILE_CACHE.set(key, drawGrassTile(x,y)); break;
      case "water":    TILE_CACHE.set(key, drawWaterTile(x,y,waterFrame)); break;
      case "forest":   TILE_CACHE.set(key, drawForestTile(x,y)); break;
      case "mountain": TILE_CACHE.set(key, drawMountainTile(x,y)); break;
      case "sand":     TILE_CACHE.set(key, drawSandTile(x,y)); break;
      case "snow":     TILE_CACHE.set(key, drawSnowTile(x,y)); break;
    }
    // Prune cache if too large
    if (TILE_CACHE.size > 2500) {
      const firstKey = TILE_CACHE.keys().next().value;
      TILE_CACHE.delete(firstKey);
    }
  }
  return TILE_CACHE.get(key);
}

const BUILDINGS = {
  coal:       { label:"Coal Plant",     cat:"fossil",    emoji:"🏭", w:2,h:2, cap:500,  cost:800000,   opCost:4000,  co2:820,  color:"#c08040", buildDays:10, desc:"Reliable baseload, high emissions" },
  gas:        { label:"Gas Plant",      cat:"fossil",    emoji:"🔥", w:2,h:2, cap:400,  cost:600000,   opCost:3500,  co2:490,  color:"#e05020", buildDays:6,  desc:"Fast-start peaker plant" },
  nuclear:    { label:"Nuclear Plant",  cat:"clean",     emoji:"☢️", w:3,h:3, cap:1200, cost:9000000,  opCost:9000,  co2:12,   color:"#8040e0", buildDays:60, desc:"Massive zero-emission baseload" },
  solar:      { label:"Solar Farm",     cat:"renewable", emoji:"🌞", w:2,h:2, cap:120,  cost:400000,   opCost:300,   co2:20,   color:"#e0c000", buildDays:3,  desc:"Output follows sunlight", variable:"solar" },
  wind:       { label:"Wind Farm",      cat:"renewable", emoji:"🌀", w:2,h:2, cap:200,  cost:500000,   opCost:400,   co2:11,   color:"#20c0a0", buildDays:4,  desc:"Free fuel, wind-dependent", variable:"wind"  },
  hydro:      { label:"Hydro Dam",      cat:"renewable", emoji:"💧", w:3,h:2, cap:600,  cost:3000000,  opCost:1000,  co2:24,   color:"#2060d0", buildDays:20, desc:"Reliable renewable baseload" },
  geothermal: { label:"Geothermal",     cat:"renewable", emoji:"🌋", w:2,h:2, cap:150,  cost:2500000,  opCost:600,   co2:38,   color:"#d04020", buildDays:15, desc:"Stable geo heat energy" },
  battery:    { label:"Battery Array",  cat:"storage",   emoji:"🔋", w:1,h:1, cap:200,  cost:1200000,  opCost:800,   co2:0,    color:"#20a060", buildDays:2,  desc:"Stores & dispatches energy" },
  house:      { label:"Houses",         cat:"consumer",  emoji:"🏠", w:1,h:1, demand:40,  cost:50000,  opCost:0, co2:0, color:"#5080c0", buildDays:1, desc:"Residential zone" },
  apartment:  { label:"Apartments",     cat:"consumer",  emoji:"🏢", w:1,h:2, demand:120, cost:150000, opCost:0, co2:0, color:"#4060a0", buildDays:2, desc:"High-density housing" },
  factory:    { label:"Factory",        cat:"consumer",  emoji:"⚙️", w:2,h:2, demand:300, cost:500000, opCost:0, co2:0, color:"#806040", buildDays:5, desc:"Industrial demand" },
  datacenter: { label:"Data Center",    cat:"consumer",  emoji:"💻", w:2,h:2, demand:250, cost:800000, opCost:0, co2:0, color:"#204080", buildDays:4, desc:"Tech infrastructure" },
  mall:       { label:"Shopping Mall",  cat:"consumer",  emoji:"🏪", w:2,h:1, demand:150, cost:300000, opCost:0, co2:0, color:"#804080", buildDays:3, desc:"Commercial demand" },
  hospital:   { label:"Hospital",       cat:"consumer",  emoji:"🏥", w:2,h:2, demand:100, cost:400000, opCost:0, co2:0, color:"#a02020", buildDays:4, desc:"Critical demand" },
  substation: { label:"Substation",     cat:"infra",     emoji:"⚡", w:1,h:1, cost:80000,  opCost:0, co2:0, color:"#c0a000", buildDays:1, desc:"Extends grid reach" },
  road:       { label:"Road",           cat:"infra",     emoji:"🛣️", w:1,h:1, cost:5000,   opCost:0, co2:0, color:"#606060", buildDays:0, desc:"Connect your city" },
  park:       { label:"Park",           cat:"infra",     emoji:"🌳", w:1,h:1, cost:20000,  opCost:0, co2:0, color:"#206020", buildDays:1, desc:"City green space" },
};

const CAT_COLORS = { fossil:"#c04010", renewable:"#20a060", clean:"#4080e0", storage:"#a060d0", consumer:"#4060c0", infra:"#806040" };

function fmt$(n) {
  if (Math.abs(n)>=1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (Math.abs(n)>=1e6) return `$${(n/1e6).toFixed(2)}M`;
  if (Math.abs(n)>=1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
function fmtMW(n) {
  if (n >= 1000) return `${(n/1000).toFixed(1)}GW`;
  return `${Math.round(n)}MW`;
}

// ── REALISTIC TERRAIN GENERATION ─────────────────────────────────────────
// Gradient-based Perlin noise implementation
function makePerlin(seed=42) {
  // Build a permutation table seeded deterministically
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i=0;i<256;i++) p[i]=i;
  // Fisher-Yates shuffle with seed
  let s = seed;
  function srnd() { s=(s*1664525+1013904223)>>>0; return (s>>>0)/0xFFFFFFFF; }
  for (let i=255;i>0;i--) {
    const j=Math.floor(srnd()*(i+1));
    [p[i],p[j]]=[p[j],p[i]];
  }
  for (let i=0;i<512;i++) perm[i]=p[i&255];

  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a+t*(b-a); }
  function grad(h,x,y){
    switch(h&3){
      case 0: return  x+y;
      case 1: return -x+y;
      case 2: return  x-y;
      case 3: return -x-y;
    }
  }
  return function noise(x,y) {
    const X=Math.floor(x)&255, Y=Math.floor(y)&255;
    x-=Math.floor(x); y-=Math.floor(y);
    const u=fade(x), v=fade(y);
    const a=perm[X]+Y, b=perm[X+1]+Y;
    return lerp(
      lerp(grad(perm[a],x,y),   grad(perm[b],x-1,y),   u),
      lerp(grad(perm[a+1],x,y-1),grad(perm[b+1],x-1,y-1),u),
      v
    );
  };
}

// Multi-octave fractal noise (fBm)
function fbm(noise, x, y, octaves=6, lacunarity=2.0, gain=0.5) {
  let val=0, amp=1, freq=1, max=0;
  for (let i=0;i<octaves;i++){
    val += noise(x*freq, y*freq)*amp;
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return val/max; // normalized roughly -1..1
}

function genTerrain() {
  const SEED = Math.floor(Math.random()*65535);
  const elevNoise  = makePerlin(SEED);
  const moistNoise = makePerlin(SEED+7919);
  const ridgeNoise = makePerlin(SEED+3571);

  // Build raw heightmap
  const h = [], m = [];
  for (let y=0;y<GRID_H;y++){
    h[y]=[]; m[y]=[];
    for (let x=0;x<GRID_W;x++){
      const nx=x/GRID_W, ny=y/GRID_H;
      // Primary elevation – large continental scale
      let elev = fbm(elevNoise, nx*3.2, ny*3.2, 6, 2.0, 0.52);
      // Ridge noise for mountain spines
      const ridge = 1 - Math.abs(fbm(ridgeNoise, nx*2.5, ny*2.5, 4, 2.2, 0.48));
      elev = elev*0.65 + ridge*ridge*0.35;
      // Normalize to 0..1
      h[y][x] = (elev + 1) / 2;
      // Moisture for forest vs. grass distinction
      m[y][x] = (fbm(moistNoise, nx*4, ny*4, 4, 2.0, 0.5) + 1) / 2;
    }
  }

  // Histogram-equalize so roughly 22% is water, 60% land, 18% mountain
  const flat = h.flat().sort((a,b)=>a-b);
  const waterThresh    = flat[Math.floor(flat.length*0.22)];
  const sandThresh     = flat[Math.floor(flat.length*0.26)];
  const hillThresh     = flat[Math.floor(flat.length*0.72)];
  const mountThresh    = flat[Math.floor(flat.length*0.86)];
  const snowThresh     = flat[Math.floor(flat.length*0.96)];

  // Assign terrain types
  const t = [];
  for (let y=0;y<GRID_H;y++){
    t[y]=[];
    for (let x=0;x<GRID_W;x++){
      const elev=h[y][x], moist=m[y][x];
      if      (elev < waterThresh)  t[y][x]="water";
      else if (elev < sandThresh)   t[y][x]="sand";
      else if (elev >= snowThresh)  t[y][x]="snow";
      else if (elev >= mountThresh) t[y][x]="mountain";
      else if (elev >= hillThresh)  t[y][x]= moist>0.45 ? "forest" : "mountain";
      else                          t[y][x]= moist>0.52 ? "forest" : "grass";
    }
  }

  // Carve rivers: trace paths from mountain peaks downhill to water
  function carveRiver(sx, sy) {
    let cx=sx, cy=sy, steps=0;
    const visited = new Set();
    while (steps++ < GRID_W+GRID_H) {
      const key=`${cx},${cy}`;
      if (visited.has(key)) break;
      visited.add(key);
      if (t[cy][cx]==="water") break;
      if (t[cy][cx]!=="snow" && t[cy][cx]!=="mountain") t[cy][cx]="water";
      // Find lowest neighbour
      const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
      let bestH=h[cy][cx], bx=cx, by=cy;
      for (const [dx,dy] of dirs) {
        const nx2=cx+dx, ny2=cy+dy;
        if (nx2<0||nx2>=GRID_W||ny2<0||ny2>=GRID_H) continue;
        if (h[ny2][nx2]<bestH){ bestH=h[ny2][nx2]; bx=nx2; by=ny2; }
      }
      if (bx===cx && by===cy) break;
      cx=bx; cy=by;
    }
  }

  // Pick 3-5 river sources from mountain areas
  const mountainCells=[];
  for (let y=0;y<GRID_H;y++) for (let x=0;x<GRID_W;x++) if (t[y][x]==="mountain"||t[y][x]==="snow") mountainCells.push([x,y]);
  const numRivers=3+Math.floor(Math.random()*3);
  for (let r=0;r<numRivers;r++){
    const idx=Math.floor(Math.random()*mountainCells.length);
    const [rx,ry]=mountainCells[idx];
    carveRiver(rx,ry);
  }

  // Re-apply sand adjacent to water (beaches)
  for (let y=0;y<GRID_H;y++){
    for (let x=0;x<GRID_W;x++){
      if (t[y][x]==="grass"){
        const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
        const nearWater=dirs.some(([dx,dy])=>{
          const nx2=x+dx, ny2=y+dy;
          return ny2>=0&&ny2<GRID_H&&nx2>=0&&nx2<GRID_W&&t[ny2][nx2]==="water";
        });
        if (nearWater) t[y][x]="sand";
      }
    }
  }

  return { tiles: t, heights: h, seed: SEED };
}

// ══════════════════════════════════════════════════════════════════
// REALISTIC ATMOSPHERIC WEATHER SIMULATION
// Based on: boundary layer meteorology, synoptic-scale pressure systems,
// diurnal temperature cycles, and wind power curve physics.
// ══════════════════════════════════════════════════════════════════

// --- Physical constants & site parameters ---
const LATITUDE_DEG   = 45.0;          // mid-latitude site (~Minneapolis/Milan/Sapporo)
const LATITUDE_RAD   = LATITUDE_DEG * Math.PI / 180;
const ELEVATION_M    = 250;           // site elevation metres above sea level
const LAPSE_RATE     = 0.0065;        // K/m environmental lapse rate
const STD_PRESSURE   = 101325;        // Pa sea-level standard pressure
const SEA_LEVEL_TEMP = 288.15;        // K standard sea-level temperature

// Turbine power curve (IEC class II, 2 MW reference turbine, hub 100 m)
// cutin=3 m/s, rated=12 m/s, cutout=25 m/s
function turbinePowerFactor(windSpeedMs) {
  const v = windSpeedMs;
  if (v < 3  || v > 25) return 0;
  if (v >= 12) return 1.0;
  // Cubic rise cutin→rated, flat rated→cutout
  const f = (v - 3) / (12 - 3);
  return Math.min(1, f * f * f);
}

// Solar irradiance model (clear-sky, ASHRAE simplified)
function clearSkySolarW(dayOfYear, hourLocal) {
  // Solar declination
  const decl = 23.45 * Math.sin((360/365 * (dayOfYear - 81)) * Math.PI/180) * Math.PI/180;
  // Hour angle
  const ha = (hourLocal - 12) * 15 * Math.PI/180;
  // Solar elevation angle
  const sinElev = Math.sin(LATITUDE_RAD)*Math.sin(decl) +
                  Math.cos(LATITUDE_RAD)*Math.cos(decl)*Math.cos(ha);
  if (sinElev <= 0) return 0;
  // ASHRAE clear-sky irradiance on tilted surface ≈ horizontal + diffuse
  const extraterr = 1367 * (1 + 0.033*Math.cos(2*Math.PI*dayOfYear/365)); // W/m²
  const airMass  = 1 / (sinElev + 0.50572*Math.pow(sinElev*57.296 + 6.07995, -1.6364));
  const direct   = extraterr * Math.exp(-0.14 * airMass);
  const diffuse  = 0.1 * extraterr * sinElev;
  return (direct * sinElev + diffuse) / 1000; // → factor 0..~1.1
}

// Synoptic pressure field: slow-moving high/low pressure centres
class PressureField {
  constructor(seed) {
    this.seed = seed;
    this.centres = [];
    this.nextUpdate = 0;
    this._regenerate(0);
  }
  _srnd(i) {
    let s = Math.sin(this.seed*12.9898 + i*78.233) * 43758.5453;
    return s - Math.floor(s);
  }
  _regenerate(day) {
    // 2-5 pressure centres that drift slowly over ~5-12 days
    this.centres = [];
    for (let i=0; i<3+Math.floor(this._srnd(day+1)*3); i++) {
      this.centres.push({
        x:   this._srnd(day*7+i*3)   * 2 - 1,   // -1..1 normalised
        y:   this._srnd(day*7+i*3+1) * 2 - 1,
        dp:  (this._srnd(day*7+i*3+2) > 0.5 ? 1 : -1) *
             (800 + this._srnd(day*7+i*3+3) * 3200), // Pa anomaly, ±800-4000
        vx:  (this._srnd(day*7+i*3+4) - 0.5) * 0.04, // drift per day
        vy:  (this._srnd(day*7+i*3+5) - 0.5) * 0.02,
        life: 5 + this._srnd(day*7+i*3+6)*8,
      });
    }
    this.nextUpdate = day + 6 + Math.floor(this._srnd(day)*6);
  }
  // Get pressure anomaly at the site (centre of map) on given day
  getPressureAnomaly(day) {
    if (day >= this.nextUpdate) this._regenerate(day);
    let p = 0;
    for (const c of this.centres) {
      const age = day - (this.nextUpdate - c.life);
      const cx = c.x + c.vx * age;
      const cy = c.y + c.vy * age;
      const dist2 = cx*cx + cy*cy;
      p += c.dp * Math.exp(-dist2 / 0.3);
    }
    return p; // Pa
  }
}

// Full weather state — computed each game tick
class WeatherEngine {
  constructor(terrainSeed) {
    this.pField = new PressureField(terrainSeed);
    this._prevTemp = 15;
    this._prevWind = 6;
    this._prevDir  = 225; // SW prevailing
    this._cloudCover = 0.3;
    this._precipitation = false;
    this._lastDay = -1;
    this.state = this._compute(0, 12, "spring");
  }

  update(day, hour, season) {
    if (day !== this._lastDay || Math.abs(hour - (this._lastHour||0)) > 0.5) {
      this.state = this._compute(day, hour, season);
      this._lastDay = day;
      this._lastHour = hour;
    }
    return this.state;
  }

  _compute(day, hour, season) {
    const dayOfYear = ((day-1) % 365) + 1;

    // ── 1. SEASONAL BASELINE TEMPERATURE (Köppen mid-lat continental) ──
    // Tbar varies ±14°C around annual mean of 9°C (like Chicago/Warsaw)
    const annualMean  = 9.0;  // °C
    const annualAmpl  = 14.0; // °C half-amplitude
    // Peak warmth ~day 196 (mid-July), coldest ~day 15 (mid-Jan)
    const Tseasonbar = annualMean + annualAmpl * Math.cos(2*Math.PI*(dayOfYear-196)/365) * -1;

    // ── 2. DIURNAL TEMPERATURE CYCLE ──
    // Amplitude depends on cloud cover and season (larger in summer/clear)
    const diurnalAmpl = 6 + 4*(Math.abs(Tseasonbar - annualMean)/annualAmpl);
    // Minimum near sunrise (hour≈6), maximum ~14:00
    const Tdiurnal = diurnalAmpl * Math.sin(Math.PI*(hour-6)/14);

    // ── 3. SYNOPTIC PRESSURE EFFECT ON TEMPERATURE ──
    const pAnom = this.pField.getPressureAnomaly(day);
    const pTempEffect = pAnom / 3000 * 3; // high pressure → warmer/clearer

    // ── 4. CLOUD COVER ──
    // Low pressure → more cloud; randomised persistence (Markov-like)
    const cloudTarget = Math.max(0, Math.min(1,
      0.35 - pAnom/12000 + (Math.sin(day*0.7+hour*0.1)*0.15)
    ));
    this._cloudCover += (cloudTarget - this._cloudCover) * 0.3;
    const cloudCover = Math.max(0, Math.min(1, this._cloudCover));

    // ── 5. PRECIPITATION ──
    this._precipitation = cloudCover > 0.72 && Math.random() < 0.15;

    // ── 6. FINAL TEMPERATURE ──
    const elevCorrK = -LAPSE_RATE * ELEVATION_M;
    const tempC = Tseasonbar + Tdiurnal + pTempEffect + elevCorrK +
                  (this._precipitation ? -2 : 0) +
                  (cloudCover > 0.5 ? -1.5 : 0);
    // Smooth temperature with 30% persistence
    const smoothedTemp = this._prevTemp * 0.3 + tempC * 0.7;
    this._prevTemp = smoothedTemp;

    // ── 7. WIND SPEED (geostrophic + boundary layer) ──
    // Geostrophic wind ∝ pressure gradient magnitude
    const geostrophic = 4 + Math.abs(pAnom) / 600; // m/s base
    // Diurnal variation: sea breeze / land heating effect
    // Peak mixing layer turbulence ~14:00 increases surface wind
    const diurnalWindFact = 1 + 0.25*Math.sin(Math.PI*(hour-6)/14);
    // Stability: stable nights suppress surface wind
    const stabilityFact = hour >= 6 && hour <= 20 ? 1.0 : 0.55;
    // Season: stronger synoptic systems in winter
    const seasonWindFact = season==="winter"?1.4:season==="fall"?1.2:season==="spring"?1.1:0.9;
    // Turbulence noise (Dryden spectrum simplified)
    const windNoise = (Math.sin(day*3.7+hour*5.3)*0.12 +
                       Math.sin(day*1.1+hour*2.9)*0.08);
    const targetWind = Math.max(0,
      geostrophic * diurnalWindFact * stabilityFact * seasonWindFact + windNoise
    );
    // Low-pass filter (atmospheric memory ~1-2 h)
    this._prevWind = this._prevWind * 0.45 + targetWind * 0.55;
    const windSpeedMs = Math.max(0, this._prevWind);

    // ── 8. WIND DIRECTION ──
    // Prevailing SW (225°), rotates with pressure system (cyclonic CCW around low)
    const dirOffset = (pAnom / 2000) * 60; // pressure gradient rotates wind
    const dirNoise  = Math.sin(day*2.3+hour*1.7)*15 + Math.sin(day*0.9+hour*3.1)*10;
    const targetDir = 225 + dirOffset + dirNoise;
    this._prevDir   = this._prevDir * 0.7 + targetDir * 0.3;
    const windDir   = ((this._prevDir % 360) + 360) % 360;

    // ── 9. SOLAR OUTPUT FACTOR ──
    const clearSkyW  = clearSkySolarW(dayOfYear, hour);
    // Cloud attenuation: Beer-Lambert through cloud layer
    const cloudTrans = Math.exp(-2.5 * cloudCover);
    const diffuseFrac = 0.15 * cloudCover; // diffuse adds back some
    const solarIrr   = Math.max(0, clearSkyW * cloudTrans + diffuseFrac);
    // Panel temperature derating: efficiency drops ~0.4%/°C above 25°C
    const panelTempDerating = 1 - Math.max(0, (smoothedTemp + 30 - 25) * 0.004);
    const solarFactor = Math.min(1.05, solarIrr * panelTempDerating);

    // ── 10. WIND POWER FACTOR ──
    // Apply standard wind shear exponent (α=0.14) to scale 10m→100m hub height
    const windHub = windSpeedMs * Math.pow(100/10, 0.14);
    const windFactor = turbinePowerFactor(windHub);

    // ── 11. ELECTRICITY DEMAND MODIFIERS ──
    // Heating degree days: demand rises steeply below 18°C (heating setpoint)
    // Cooling degree days: demand rises above 22°C (AC setpoint)
    const heatingDD = Math.max(0, 18 - smoothedTemp);
    const coolingDD = Math.max(0, smoothedTemp - 22);
    // Typical residential/commercial demand response:
    // +3% per °C below 18, +4% per °C above 22
    const tempDemandMult = 1 + heatingDD*0.030 + coolingDD*0.040;

    // ── 12. ATMOSPHERIC PRESSURE ──
    const pressurePa = STD_PRESSURE + pAnom;
    const pressureHPa = pressurePa / 100;

    // ── 13. RELATIVE HUMIDITY (simplified) ──
    // High cloud cover → higher RH
    const rh = Math.min(100, Math.max(20, 50 + cloudCover*40 - (smoothedTemp-10)*0.5));

    return {
      tempC:        +smoothedTemp.toFixed(1),
      windSpeedMs:  +windSpeedMs.toFixed(1),
      windSpeedHub: +windHub.toFixed(1),
      windDir:      +windDir.toFixed(0),
      windDirLabel: degToCompass(windDir),
      cloudCover:   +cloudCover.toFixed(2),
      precipitation: this._precipitation,
      pressureHPa:  +pressureHPa.toFixed(1),
      humidity:     +rh.toFixed(0),
      solarFactor:  +Math.max(0, solarFactor).toFixed(3),
      windFactor:   +Math.max(0, windFactor).toFixed(3),
      tempDemandMult: +tempDemandMult.toFixed(3),
      heatingDD:    +heatingDD.toFixed(1),
      coolingDD:    +coolingDD.toFixed(1),
      pAnomalyHPa:  +(pAnom/100).toFixed(1),
      isStormy:     cloudCover > 0.8 && windSpeedMs > 12,
    };
  }
}

function degToCompass(d) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(((d%360)/360)*16) % 16];
}

// Wind direction arrow SVG path helper
function windArrowStyle(dirDeg) {
  return { transform: `rotate(${dirDeg}deg)`, display:"inline-block", transformOrigin:"center" };
}

export default function GridMasterGame() {
  const canvasRef = useRef(null);
  const [{ tiles: terrain, heights: heightmap, seed: terrainSeed }] = useState(genTerrain);
  const weatherRef = useRef(null);
  if (!weatherRef.current) weatherRef.current = new WeatherEngine(terrainSeed || 42);
  const [weather, setWeather] = useState(() => weatherRef.current.state);
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [camera, setCamera] = useState({ x: 80, y: 60, zoom: 0.85 });
  const [dragging, setDragging] = useState(null);
  const [money, setMoney] = useState(5_000_000);
  const [day, setDay] = useState(1);
  const [hourF, setHourF] = useState(8);
  const [season, setSeason] = useState("spring");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState("build");
  const [catFilter, setCatFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ revenue:0, expenses:0, co2:0, blackouts:0, uptime:0 });
  const [hover, setHover] = useState(null);
  const [loans, setLoans] = useState([]);
  const [electricityPrice, setElectricityPrice] = useState(0.12);
  const [nextId, setNextId] = useState(1);
  const [animF, setAnimF] = useState(0);
  const [selTile, setSelTile] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

  const stateRef = useRef({});
  stateRef.current = { placed, money, day, hourF, season, paused, speed, loans, electricityPrice, events, weather };

  const pushNotif = useCallback((msg, type="info") => {
    const id = Date.now() + Math.random();
    setNotifications(n => [...n.slice(-5), { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 4000);
  }, []);

  // ── GAME TICK ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.paused) return;
      setAnimF(f => f+1);

      // Update weather every tick
      const s = stateRef.current;
      const wx = weatherRef.current.update(s.day, s.hourF, s.season);
      setWeather({...wx});

      setHourF(h => {
        const nh = h + (24/(60/stateRef.current.speed));
        if (nh >= 24) {
          // NEW DAY
          const s2 = stateRef.current;
          setDay(d => {
            const nd = d+1;
            const SEASONS = ["spring","summer","fall","winter"];
            setSeason(SEASONS[Math.floor((nd % 365)/91.25)%4]);
            return nd;
          });

          // Advance construction
          setPlaced(prev => {
            const next = {};
            const justDone = [];
            Object.entries(prev).forEach(([k,b]) => {
              const def = BUILDINGS[b.type];
              const wasDone = (b.progress||0) >= 100;
              const inc = def && def.buildDays > 0 ? (100/def.buildDays) : 100;
              const newProg = Math.min(100, (b.progress||0) + inc);
              next[k] = { ...b, progress: newProg, age: (b.age||0) + 1/365 };
              if (!wasDone && newProg >= 100) justDone.push(def?.label || b.type);
            });
            justDone.forEach(lbl => pushNotif(`✅ ${lbl} complete!`, "success"));
            return next;
          });

          // Economics — use physics-based weather factors
          const pl = s2.placed;
          const wx2 = s2.weather;
          let supply=0, demand=0, dailyCO2=0, dailyOp=0;
          Object.values(pl).forEach(b => {
            if ((b.progress||0)<100 || b.active===false || b.rootX===undefined) return;
            const def = BUILDINGS[b.type];
            if (!def) return;
            if (def.cap) {
              let out = def.cap;
              if (def.variable==="solar") out *= wx2 ? wx2.solarFactor : 0.5;
              if (def.variable==="wind")  out *= wx2 ? wx2.windFactor  : 0.35;
              s2.events.forEach(e => { if (e.supplyMult) out *= e.supplyMult; });
              supply += out;
              dailyCO2 += (def.co2||0)*out/1000;
            }
            if (def.demand) {
              let d = def.demand * (wx2 ? wx2.tempDemandMult : 1);
              s2.events.forEach(e => { if (e.demandMult) d *= e.demandMult; });
              demand += d;
            }
            if (def.opCost) dailyOp += def.opCost;
          });

          const dailyRevenue = demand * s2.electricityPrice * 1000 * 0.7;
          const loanPay = s2.loans.reduce((a,l) => a+l.daily, 0);
          const net = dailyRevenue - dailyOp - loanPay;

          setMoney(m => { const nm = m+net; if (nm < -5e6) setGameOver(true); return nm; });
          setStats(st => ({
            revenue: st.revenue + dailyRevenue,
            expenses: st.expenses + dailyOp,
            co2: st.co2 + dailyCO2,
            blackouts: supply < demand*0.9 ? st.blackouts+1 : st.blackouts,
            uptime: supply >= demand*0.9 ? st.uptime+1 : st.uptime,
          }));
          setLoans(ls => ls.map(l => ({...l, balance:l.balance-l.daily})).filter(l => l.balance>0.01));

          // Weather-aware events
          if (Math.random()<0.06) {
            const EVTS = [
              {name:"⛈️ Storm",       supplyMult:0.65, days:2, desc:"Severe storm cuts renewable output"},
              {name:"📈 Econ Boom",    demandMult:1.25, days:4, desc:"Industrial demand up 25%"},
              {name:"✊ Fuel Strike",  opCostMult:2,    days:3, desc:"Fuel supply disrupted"},
              {name:"🌫️ Grid Attack",  supplyMult:0.82, days:1, desc:"Cyber incident reduces grid capacity"},
              {name:"🌊 Flood",        supplyMult:0.75, days:2, desc:"Flooding damages substations"},
            ];
            // Weight storm/flood higher when already overcast
            const candidates = wx2?.cloudCover > 0.7
              ? [EVTS[0], EVTS[0], EVTS[3], EVTS[4], EVTS[1], EVTS[2]]
              : EVTS;
            const ev = {...candidates[Math.floor(Math.random()*candidates.length)], id:Date.now()};
            setEvents(e => [...e, ev]);
            pushNotif(`⚠️ ${ev.name}: ${ev.desc}`, "event");
            setTimeout(() => setEvents(e => e.filter(x => x.id!==ev.id)), ev.days*24*(TICK_MS/stateRef.current.speed));
          }

          // Warn on extreme temperature demand spikes
          if (wx2 && (wx2.tempC > 35 || wx2.tempC < -15)) {
            pushNotif(`🌡️ Extreme temp ${wx2.tempC}°C — demand +${Math.round((wx2.tempDemandMult-1)*100)}%`, "event");
          }

          return nh - 24;
        }
        return nh;
      });
    }, TICK_MS / speed);
    return () => clearInterval(interval);
  }, [speed, pushNotif]);

  // ── GRID STATS (live) ──────────────────────────────────────────────────
  const gridStats = (() => {
    let supply=0, demand=0, renewSupply=0;
    Object.values(placed).forEach(b => {
      if ((b.progress||0)<100||b.active===false||b.rootX===undefined) return;
      const def = BUILDINGS[b.type];
      if (!def) return;
      if (def.cap) {
        let out = def.cap;
        if (def.variable==="solar") out *= Math.max(0, weather.solarFactor);
        if (def.variable==="wind")  out *= Math.max(0, weather.windFactor);
        events.forEach(e => { if (e.supplyMult) out *= e.supplyMult; });
        supply += out;
        if (def.cat!=="fossil") renewSupply += out;
      }
      if (def.demand) {
        let d = def.demand * weather.tempDemandMult;
        events.forEach(e => { if (e.demandMult) d *= e.demandMult; });
        demand += d;
      }
    });
    const balance = supply - demand;
    const renew = supply > 0 ? renewSupply/supply*100 : 0;
    return { supply, demand, balance, renew };
  })();

  const isBlackout = gridStats.demand > 0 && gridStats.supply < gridStats.demand * 0.9;

  // ── PLACE BUILDING ────────────────────────────────────────────────────
  const placeTile = useCallback((tx, ty) => {
    if (!selected) {
      setSelTile(k => {
        const key = `${tx},${ty}`;
        return k === key ? null : key;
      });
      return;
    }
    const def = BUILDINGS[selected];
    if (!def) return;
    let canPlace = true;
    const toPlace = [];
    for (let dy=0; dy<(def.h||1); dy++) {
      for (let dx=0; dx<(def.w||1); dx++) {
        const nx = tx+dx, ny = ty+dy;
        if (nx>=GRID_W||ny>=GRID_H) { canPlace=false; break; }
        const k = `${nx},${ny}`;
        if (placed[k]) { canPlace=false; break; }
        if (terrain[ny]?.[nx]==="water" || terrain[ny]?.[nx]==="sand" || terrain[ny]?.[nx]==="snow" || terrain[ny]?.[nx]==="mountain") { canPlace=false; break; }
        toPlace.push(k);
      }
      if (!canPlace) break;
    }
    if (!canPlace) { pushNotif("❌ Can't build here!", "danger"); return; }
    setMoney(m => {
      if (m < def.cost) { pushNotif("❌ Not enough money!", "danger"); return m; }
      const id = nextId;
      setNextId(i => i+1);
      const newEntries = {};
      toPlace.forEach(k => {
        newEntries[k] = { type:selected, id, progress: def.buildDays===0?100:0, active:true, age:0, rootX:tx, rootY:ty };
      });
      setPlaced(p => ({...p, ...newEntries}));
      pushNotif(`🏗️ Building ${def.label}...`, "success");
      return m - def.cost;
    });
  }, [selected, placed, terrain, nextId, pushNotif]);

  // ── CANVAS DRAW ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const TZ = TILE * camera.zoom;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Sky — colour tinted by temperature and cloud cover
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    const isNight = hourF < 5.5 || hourF > 20.5;
    const isDawn = hourF >= 5.5 && hourF < 8;
    const isDusk = hourF >= 18 && hourF <= 20.5;
    const cc = weather.cloudCover;
    const tempWarm = Math.max(0, Math.min(1, (weather.tempC - 0) / 35)); // 0=cold, 1=hot
    if (isNight) {
      grad.addColorStop(0,`hsl(225,60%,${4+cc*6}%)`);
      grad.addColorStop(1,`hsl(220,50%,${6+cc*8}%)`);
    } else if (isDawn||isDusk) {
      const r = 20+cc*15, g = 10+cc*8;
      grad.addColorStop(0,`rgb(${20+r},${15+g},${60+cc*20})`);
      grad.addColorStop(1,`rgb(${160+r},${80+g},${30+cc*10})`);
    } else {
      // Daytime: bluer when cold/clear, hazier/warmer when hot
      const skyH = 210 - tempWarm*20;
      const skyS = 70 - cc*35;
      const skyL = 45 + tempWarm*8 - cc*18;
      grad.addColorStop(0,`hsl(${skyH},${skyS}%,${skyL}%)`);
      grad.addColorStop(1,`hsl(${skyH+10},${skyS-10}%,${skyL+15}%)`);
    }
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Stars at night
    if (isNight && cc < 0.7) {
      const starAlpha = 0.7 * (1 - cc/0.7);
      ctx.fillStyle=`rgba(255,255,255,${starAlpha})`;
      for (let i=0;i<80;i++) {
        const sx=(i*137.5)%canvas.width, sy=(i*89.3)%canvas.height*0.45;
        ctx.fillRect(sx,sy,1,1);
      }
    }

    // Sun/Moon
    if (!isNight) {
      const sunAngle = ((hourF-6)/14)*Math.PI;
      const sunX = canvas.width*0.15 + Math.cos(-sunAngle)*canvas.width*0.7;
      const sunY = canvas.height*0.4 - Math.sin(sunAngle)*canvas.height*0.35;
      if (cc < 0.9) {
        const sunR = 18; const sunAlpha = Math.max(0, 1 - cc*1.2);
        const sg=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,sunR*2);
        sg.addColorStop(0,`rgba(255,240,80,${sunAlpha})`);
        sg.addColorStop(0.4,`rgba(255,210,40,${sunAlpha*0.6})`);
        sg.addColorStop(1,"rgba(255,180,0,0)");
        ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sunX,sunY,sunR*2,0,Math.PI*2); ctx.fill();
      }
    } else {
      // Moon
      ctx.fillStyle=`rgba(210,225,255,${Math.max(0,0.8-cc)})`;
      ctx.beginPath(); ctx.arc(canvas.width*0.8, 60, 10, 0, Math.PI*2); ctx.fill();
    }

    // Clouds — layered procedural shapes driven by cloudCover
    if (cc > 0.05) {
      ctx.save();
      const numClouds = Math.floor(cc * 12) + 1;
      for (let ci=0; ci<numClouds; ci++) {
        const cx = ((ci*0.618+animF*0.0015*(0.5+ci*0.1)) % 1) * canvas.width;
        const cy = 30 + (ci % 4) * 25 + Math.sin(ci*2.3)*15;
        const cr = 35 + (ci%3)*25;
        const cloudAlpha = Math.min(0.85, cc * (0.5+ci*0.04));
        const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
        const lightness = isNight ? 20 : (isDawn||isDusk) ? 55 : 88;
        cg.addColorStop(0,`rgba(${lightness+5},${lightness+5},${lightness+10},${cloudAlpha})`);
        cg.addColorStop(1,"rgba(200,200,210,0)");
        ctx.fillStyle=cg;
        ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2); ctx.fill();
        // Puff bumps
        for (let p=0;p<3;p++) {
          const px2=cx+(p-1)*cr*0.55, py2=cy-cr*0.2;
          const pr2=cr*0.5;
          const pg=ctx.createRadialGradient(px2,py2,0,px2,py2,pr2);
          pg.addColorStop(0,`rgba(${lightness},${lightness},${lightness+5},${cloudAlpha*0.8})`);
          pg.addColorStop(1,"rgba(200,200,210,0)");
          ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px2,py2,pr2,0,Math.PI*2); ctx.fill();
        }
      }

      // Rain streaks when precipitating
      if (weather.precipitation) {
        ctx.strokeStyle=`rgba(160,190,220,0.35)`;
        ctx.lineWidth=0.8;
        const windLean = Math.sin(weather.windDir*Math.PI/180)*8;
        for (let ri=0;ri<60;ri++) {
          const rx=((ri*137.5+animF*4)%canvas.width);
          const ry=((ri*89.3+animF*8)%canvas.height);
          ctx.beginPath(); ctx.moveTo(rx+windLean,ry); ctx.lineTo(rx,ry+12); ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Tiles – procedurally rendered with hillshading
    ctx.save();
    for (let y=0;y<GRID_H;y++) {
      for (let x=0;x<GRID_W;x++) {
        const px=camera.x+x*TZ, py=camera.y+y*TZ;
        if (px>canvas.width||py>canvas.height||px+TZ<0||py+TZ<0) continue;
        const terr=terrain[y]?.[x]||"grass";
        const tile = getTile(terr, x, y, animF);
        ctx.drawImage(tile, px, py, TZ, TZ);

        // Hillshading: compute slope from neighbours, simulate NW light source
        const elev  = heightmap[y]?.[x] ?? 0.5;
        const elevE = heightmap[y]?.[x+1] ?? elev;
        const elevS = heightmap[y+1]?.[x] ?? elev;
        const slopeX = elevE - elev;
        const slopeY = elevS - elev;
        // Light direction: from NW (negative x, negative y)
        const shade = Math.max(0, -(slopeX*-0.7 + slopeY*-0.5)) * 18;
        const shadow = Math.max(0,  (slopeX*-0.7 + slopeY*-0.5)) * 22;
        if (shade > 0.5) {
          ctx.fillStyle=`rgba(255,245,200,${Math.min(0.35, shade*0.018)})`;
          ctx.fillRect(px,py,TZ,TZ);
        }
        if (shadow > 0.5) {
          ctx.fillStyle=`rgba(0,10,30,${Math.min(0.4, shadow*0.018)})`;
          ctx.fillRect(px,py,TZ,TZ);
        }

        // Night / dusk overlay
        if (isNight) { ctx.fillStyle="rgba(2,4,18,0.52)"; ctx.fillRect(px,py,TZ,TZ); }
        else if (isDawn||isDusk) { ctx.fillStyle="rgba(60,20,0,0.13)"; ctx.fillRect(px,py,TZ,TZ); }
      }
    }
    // Grid lines at normal zoom
    if (camera.zoom >= 0.45) {
      ctx.strokeStyle="rgba(0,0,0,0.1)"; ctx.lineWidth=0.5;
      for (let y=0;y<GRID_H;y++) {
        for (let x=0;x<GRID_W;x++) {
          const px=camera.x+x*TZ, py=camera.y+y*TZ;
          if (px>canvas.width||py>canvas.height||px+TZ<0||py+TZ<0) continue;
          ctx.strokeRect(px,py,TZ,TZ);
        }
      }
    }
    ctx.restore();

    // Power lines
    const roots = Object.entries(placed)
      .filter(([k,b]) => {
        const def=BUILDINGS[b.type];
        return (def?.cap||def?.cat==="infra") && b.rootX===parseInt(k.split(",")[0]) && b.rootY===parseInt(k.split(",")[1]);
      });
    if (roots.length>1) {
      ctx.save();
      for (let i=0;i<roots.length-1;i++) {
        const [,a]=roots[i]; const [,b]=roots[i+1];
        const ax=camera.x+(a.rootX+(BUILDINGS[a.type]?.w||1)*0.5)*TZ;
        const ay=camera.y+(a.rootY+(BUILDINGS[a.type]?.h||1)*0.5)*TZ;
        const bx=camera.x+(b.rootX+(BUILDINGS[b.type]?.w||1)*0.5)*TZ;
        const by_=camera.y+(b.rootY+(BUILDINGS[b.type]?.h||1)*0.5)*TZ;
        const flowColor = isBlackout ? `rgba(255,50,50,${0.4+Math.sin(animF*0.3)*0.3})` : `rgba(255,220,0,${0.25+Math.sin(animF*0.08+i)*0.12})`;
        ctx.strokeStyle=flowColor;
        ctx.lineWidth=camera.zoom*2;
        ctx.setLineDash([TZ*0.18,TZ*0.1]);
        ctx.lineDashOffset=-animF*1.2;
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by_); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();
    }

    // Buildings
    const drawn = new Set();
    Object.entries(placed).forEach(([key,b]) => {
      if (drawn.has(b.id)) return; drawn.add(b.id);
      const def=BUILDINGS[b.type]; if (!def) return;
      const bx=camera.x+b.rootX*TZ, by=camera.y+b.rootY*TZ;
      const bw=(def.w||1)*TZ, bh=(def.h||1)*TZ;
      if (bx>canvas.width||by>canvas.height||bx+bw<0||by+bh<0) return;
      const built=(b.progress||0)>=100;
      ctx.save();
      ctx.globalAlpha=built?1:0.65+Math.sin(animF*0.15)*0.15;
      // shadow
      ctx.fillStyle="rgba(0,0,0,0.35)"; ctx.fillRect(bx+4,by+4,bw-2,bh-2);
      // body
      const g=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
      g.addColorStop(0,def.color+"ee"); g.addColorStop(1,def.color+"88");
      ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(bx+1,by+1,bw-2,bh-2,5); ctx.fill();
      // active glow
      if (built && def.cap && b.active!==false) {
        ctx.strokeStyle=def.color; ctx.lineWidth=2;
        ctx.globalAlpha=(0.2+Math.sin(animF*0.08)*0.15);
        ctx.beginPath(); ctx.roundRect(bx+1,by+1,bw-2,bh-2,5); ctx.stroke();
        ctx.globalAlpha=1;
      }
      // emoji
      ctx.font=`${Math.max(12,TZ*(def.w||1)*0.38)}px serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(def.emoji, bx+bw/2, by+bh*0.44);
      // label
      if (TZ>25) {
        ctx.font=`bold ${Math.max(7,TZ*0.12)}px 'Courier New'`;
        ctx.fillStyle="#fff"; ctx.shadowColor="#000"; ctx.shadowBlur=4;
        ctx.textAlign="center"; ctx.textBaseline="top";
        ctx.fillText(def.label, bx+bw/2, by+bh*0.72);
        ctx.shadowBlur=0;
      }
      // progress bar
      if (!built) {
        ctx.fillStyle="rgba(0,0,0,0.55)"; ctx.fillRect(bx+5,by+bh-11,bw-10,7);
        ctx.fillStyle="#ffd700"; ctx.fillRect(bx+5,by+bh-11,(bw-10)*(b.progress/100),7);
      }
      // offline overlay
      if (built && b.active===false) {
        ctx.fillStyle="rgba(0,0,0,0.55)"; ctx.fillRect(bx+1,by+1,bw-2,bh-2);
        ctx.fillStyle="#ff4444"; ctx.font=`bold ${TZ*0.22}px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("OFFLINE",bx+bw/2,by+bh/2);
      }
      ctx.restore();
    });

    // Hover preview
    if (hover && selected) {
      const def=BUILDINGS[selected];
      const bx=camera.x+hover.x*TZ, by=camera.y+hover.y*TZ;
      const bw=(def?.w||1)*TZ, bh=(def?.h||1)*TZ;
      ctx.save(); ctx.globalAlpha=0.5;
      ctx.fillStyle=def?.color||"#fff";
      ctx.beginPath(); ctx.roundRect(bx+1,by+1,bw-2,bh-2,5); ctx.fill();
      ctx.font=`${Math.max(12,TZ*(def?.w||1)*0.4)}px serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(def?.emoji||"",bx+bw/2,by+bh/2);
      ctx.restore();
    }

    // Selection highlight
    if (selTile && !selected) {
      const [sx,sy]=selTile.split(",").map(Number);
      const px=camera.x+sx*TZ, py=camera.y+sy*TZ;
      ctx.strokeStyle="#ffffff"; ctx.lineWidth=2.5;
      ctx.setLineDash([4,3]); ctx.strokeRect(px+1,py+1,TZ-2,TZ-2); ctx.setLineDash([]);
    }

  }, [camera, placed, terrain, heightmap, hover, selected, hourF, animF, selTile, isBlackout, season, weather]);

  // Resize
  useEffect(() => {
    const resize = () => {
      const c=canvasRef.current; if (!c) return;
      c.width=c.parentElement.offsetWidth; c.height=c.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener("resize",resize);
    return () => window.removeEventListener("resize",resize);
  },[]);

  // ── POINTER EVENTS ─────────────────────────────────────────────────────
  function getXY(e) {
    const r=canvasRef.current.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    return {x:cx-r.left,y:cy-r.top};
  }
  function onDown(e) {
    if (e.button===2) return;
    const p=getXY(e);
    setDragging({sx:p.x,sy:p.y,cx:camera.x,cy:camera.y,moved:false});
  }
  function onMove(e) {
    if (dragging) {
      const p=getXY(e);
      const dx=p.x-dragging.sx, dy=p.y-dragging.sy;
      if (Math.abs(dx)>5||Math.abs(dy)>5) {
        setDragging(d=>({...d,moved:true}));
        setCamera(c=>({...c,x:dragging.cx+dx,y:dragging.cy+dy}));
      }
    }
    const p=getXY(e);
    const TZ=TILE*camera.zoom;
    const tx=Math.floor((p.x-camera.x)/TZ), ty=Math.floor((p.y-camera.y)/TZ);
    if (tx>=0&&ty>=0&&tx<GRID_W&&ty<GRID_H) setHover({x:tx,y:ty});
    else setHover(null);
  }
  function onUp(e) {
    if (dragging && !dragging.moved) {
      const p=getXY(e);
      const TZ=TILE*camera.zoom;
      const tx=Math.floor((p.x-camera.x)/TZ), ty=Math.floor((p.y-camera.y)/TZ);
      if (tx>=0&&ty>=0&&tx<GRID_W&&ty<GRID_H) placeTile(tx,ty);
    }
    setDragging(null);
  }
  function onWheel(e) {
    e.preventDefault();
    const f=e.deltaY>0?0.85:1.18;
    setCamera(c=>({...c,zoom:Math.max(0.25,Math.min(2.5,c.zoom*f))}));
  }
  function onRightClick(e) { e.preventDefault(); setSelected(null); }

  // ── ACTIONS ────────────────────────────────────────────────────────────
  const selData = selTile ? placed[selTile] : null;
  const selDef = selData ? BUILDINGS[selData.type] : null;

  const demolish = () => {
    if (!selData) return;
    const refund=(selDef?.cost||0)*0.1;
    setPlaced(p => { const n={...p}; Object.keys(n).forEach(k=>{ if(n[k].id===selData.id) delete n[k]; }); return n; });
    setMoney(m=>m+refund);
    setSelTile(null);
    pushNotif(`🔨 Demolished +${fmt$(refund)} salvage`,"info");
  };
  const toggleBuilding = () => {
    if (!selData) return;
    setPlaced(p => { const n={...p}; Object.keys(n).forEach(k=>{ if(n[k].id===selData.id) n[k]={...n[k],active:!n[k].active}; }); return n; });
  };
  const takeLoan = (amount, days) => {
    const total=amount*1.08;
    setLoans(l=>[...l,{amount,balance:total,daily:total/days}]);
    setMoney(m=>m+amount);
    pushNotif(`💳 Loan ${fmt$(amount)} approved`,"info");
  };

  const totalCap = Object.values(placed).filter(b=>(b.progress||0)>=100&&b.rootX!==undefined&&BUILDINGS[b.type]?.cap).reduce((s,b)=>s+(BUILDINGS[b.type].cap||0),0);
  const dailyRev = gridStats.demand * electricityPrice * 1000 * 0.7;
  const dailyOp = Object.values(placed).filter(b=>(b.progress||0)>=100&&b.rootX!==undefined).reduce((s,b)=>s+(BUILDINGS[b.type]?.opCost||0),0);

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#0a0e18",fontFamily:"'Courier New',monospace",color:"#cde"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{overflow:hidden;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1e3a5f;}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .blink{animation:pu 0.9s infinite;}
        .notif{animation:su 0.3s ease;}
        .btn{padding:5px 9px;border:1px solid;border-radius:3px;cursor:pointer;font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:.4px;background:transparent;transition:all .15s;white-space:nowrap;}
        .btn:hover{filter:brightness(1.5);transform:translateY(-1px);}
        .btn-g{color:#00ff88;border-color:#00ff88;}.btn-g:hover{background:rgba(0,255,136,.12);}
        .btn-r{color:#ff4455;border-color:#ff4455;}.btn-r:hover{background:rgba(255,68,85,.12);}
        .btn-y{color:#ffd700;border-color:#ffd700;}.btn-y:hover{background:rgba(255,215,0,.12);}
        .btn-b{color:#40aaff;border-color:#40aaff;}.btn-b:hover{background:rgba(64,170,255,.12);}
        .btn-p{color:#c060ff;border-color:#c060ff;}.btn-p:hover{background:rgba(192,96,255,.12);}
        .tab{padding:8px 0;cursor:pointer;font-size:10px;letter-spacing:.6px;border:none;background:none;color:#4a6080;font-family:'Courier New',monospace;font-weight:bold;border-bottom:2px solid transparent;transition:all .15s;flex:1;text-align:center;}
        .tab:hover{color:#cde;}.tab.on{color:#00ff88;border-bottom-color:#00ff88;}
        .card{background:#111827;border:1px solid #1e3a5f;border-radius:4px;padding:9px;margin-bottom:6px;}
        .sr{display:flex;justify-content:space-between;align-items:center;padding:2px 0;border-bottom:1px solid #0f1e30;font-size:10px;}
        .sr .lbl{color:#4a6080;}
        .bcard{border:1px solid #1e3a5f;border-radius:4px;padding:8px;margin-bottom:5px;cursor:pointer;transition:border-color .15s,background .15s;background:#111827;}
        .bcard:hover{border-color:#00ff8866;background:#131f18;}
        .bcard.sel{border-color:#00ff88;background:#0d1f10;}
        input[type=range]{width:100%;accent-color:#00ff88;cursor:pointer;}
        select{background:#0d1424;border:1px solid #1e3a5f;color:#cde;padding:3px 7px;font-family:'Courier New',monospace;font-size:11px;border-radius:3px;cursor:pointer;}
      `}</style>

      {/* MAP AREA */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <canvas ref={canvasRef}
          style={{display:"block",cursor:selected?"crosshair":dragging?.moved?"grabbing":"grab",touchAction:"none"}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onMouseLeave={()=>{setDragging(null);setHover(null);}}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onWheel={onWheel} onContextMenu={onRightClick}
        />

        {/* TOP HUD */}
        <div style={{position:"absolute",top:0,left:0,right:0,background:"linear-gradient(to bottom,rgba(4,8,18,0.96),transparent)",padding:"8px 10px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
          <div style={{fontWeight:"bold",fontSize:"15px",color:"#00ff88",letterSpacing:"2px",marginRight:"4px"}}>⚡ GRID MASTER</div>

          {[
            {val:fmt$(money), sub:"TREASURY", color:money<0?"#ff4455":"#ffd700"},
            {val:`${fmtMW(gridStats.supply)} / ${fmtMW(gridStats.demand)}`, sub:"SUPPLY / DEMAND", color:isBlackout?"#ff4455":gridStats.balance>=0?"#00ff88":"#ffd700", blink:isBlackout, prefix:isBlackout?"🔴 ":"⚡ "},
            {val:`${Math.round(gridStats.renew)}%`, sub:"RENEWABLE", color:"#20c0a0"},
            {val:`Day ${day}  ${String(Math.floor(hourF)).padStart(2,"0")}:${String(Math.floor((hourF%1)*60)).padStart(2,"0")}`, sub:season.toUpperCase(), color:"#8ab4d0"},
          ].map((h,i) => (
            <div key={i} style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${h.color}33`,borderRadius:"3px",padding:"4px 8px"}}>
              <div style={{fontSize:"11px",fontWeight:"bold",color:h.color}} className={h.blink?"blink":""}>{h.prefix||""}{h.val}</div>
              <div style={{fontSize:"8px",color:"#4a6080"}}>{h.sub}</div>
            </div>
          ))}

          {/* LIVE WEATHER STRIP */}
          <div style={{background:"rgba(0,0,0,0.6)",border:"1px solid #1e3a5f",borderRadius:"3px",padding:"4px 8px",display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"12px",fontWeight:"bold",color: weather.tempC>30?"#ff6644":weather.tempC<0?"#88ccff":"#ffd700"}}>
                {weather.tempC > 0 ? "+" : ""}{weather.tempC}°C
              </div>
              <div style={{fontSize:"7px",color:"#4a6080"}}>TEMP</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"12px",fontWeight:"bold",color:"#80c8ff"}}>
                <span style={windArrowStyle(weather.windDir)}>↑</span> {weather.windSpeedMs} m/s
              </div>
              <div style={{fontSize:"7px",color:"#4a6080"}}>{weather.windDirLabel} WIND</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"12px",fontWeight:"bold",color:"#a0b8d0"}}>
                {weather.precipitation?"🌧️":"☁️".repeat(Math.round(weather.cloudCover*3))||"☀️"}
              </div>
              <div style={{fontSize:"7px",color:"#4a6080"}}>{Math.round(weather.cloudCover*100)}% CLOUD</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"11px",fontWeight:"bold",color:"#8888cc"}}>{weather.pressureHPa} hPa</div>
              <div style={{fontSize:"7px",color: weather.pAnomalyHPa>5?"#88ff88":weather.pAnomalyHPa<-5?"#ff8888":"#4a6080"}}>
                {weather.pAnomalyHPa>5?"HIGH ▲":weather.pAnomalyHPa<-5?"LOW ▼":"PRESSURE"}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:"5px",marginLeft:"auto",alignItems:"center"}}>
            {events.map(ev => (
              <div key={ev.id} style={{background:"rgba(40,15,0,0.9)",border:"1px solid #ff8800",borderRadius:"3px",padding:"3px 7px",fontSize:"9px",color:"#ff8800"}}>{ev.name}</div>
            ))}
            <button className="btn btn-y" onClick={()=>setPaused(p=>!p)}>{paused?"▶":"⏸"}</button>
            <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} style={{fontSize:"10px"}}>
              <option value={1}>1×</option><option value={2}>2×</option><option value={5}>5×</option>
            </select>
            <button className="btn btn-b" onClick={()=>setShowPanel(p=>!p)} style={{fontSize:"11px"}}>{showPanel?"▶":"◀"}</button>
          </div>
        </div>

        {/* Notifications */}
        <div style={{position:"absolute",top:"52px",right:"10px",display:"flex",flexDirection:"column",gap:"4px",maxWidth:"210px"}}>
          {notifications.map(n => (
            <div key={n.id} className="notif" style={{
              background:n.type==="danger"?"rgba(30,0,8,0.95)":n.type==="success"?"rgba(0,25,12,0.95)":n.type==="event"?"rgba(30,15,0,0.95)":"rgba(5,12,25,0.95)",
              border:`1px solid ${n.type==="danger"?"#ff4455":n.type==="success"?"#00ff88":n.type==="event"?"#ff8800":"#1e3a5f"}`,
              borderRadius:"3px",padding:"4px 8px",fontSize:"10px",
              color:n.type==="danger"?"#ff4455":n.type==="success"?"#00ff88":n.type==="event"?"#ff8800":"#cde",
            }}>{n.msg}</div>
          ))}
        </div>

        {/* Placing indicator */}
        {selected && (
          <div style={{position:"absolute",bottom:"14px",left:"50%",transform:"translateX(-50%)",background:"rgba(0,10,20,0.92)",border:"1px solid #00ff88",borderRadius:"4px",padding:"6px 14px",fontSize:"11px",color:"#00ff88",pointerEvents:"none"}}>
            {BUILDINGS[selected]?.emoji} Placing: <b>{BUILDINGS[selected]?.label}</b> · Right-click to cancel
          </div>
        )}

        {/* Tile info */}
        {selTile && selData && selDef && !selected && (
          <div style={{position:"absolute",bottom:"12px",left:"12px",background:"rgba(4,10,24,0.95)",border:"1px solid #1e3a5f",borderRadius:"5px",padding:"10px",minWidth:"190px",fontSize:"10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
              <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                <span style={{fontSize:"22px"}}>{selDef.emoji}</span>
                <span style={{fontWeight:"bold",color:selDef.color,fontSize:"12px"}}>{selDef.label}</span>
              </div>
              <button style={{background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:"16px",lineHeight:1}} onClick={()=>setSelTile(null)}>×</button>
            </div>
            {selDef.cap && <div className="sr"><span className="lbl">Capacity</span><span style={{color:"#00ff88"}}>{fmtMW(selDef.cap)}</span></div>}
            {selDef.demand && <div className="sr"><span className="lbl">Demand</span><span style={{color:"#ff8800"}}>{fmtMW(selDef.demand)}</span></div>}
            <div className="sr"><span className="lbl">Built</span><span style={{color:(selData.progress||0)>=100?"#00ff88":"#ffd700"}}>{Math.round(selData.progress||0)}%</span></div>
            <div className="sr"><span className="lbl">Age</span><span>{(selData.age||0).toFixed(1)} yrs</span></div>
            <div className="sr"><span className="lbl">Status</span><span style={{color:selData.active!==false?"#00ff88":"#ff4455"}}>{selData.active!==false?"ONLINE":"OFFLINE"}</span></div>
            <div style={{display:"flex",gap:"5px",marginTop:"7px"}}>
              <button className="btn btn-y" style={{flex:1}} onClick={toggleBuilding}>{selData.active===false?"GO ONLINE":"GO OFFLINE"}</button>
              <button className="btn btn-r" style={{flex:1}} onClick={demolish}>DEMOLISH</button>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div style={{position:"absolute",bottom:"12px",right:"12px",display:"flex",flexDirection:"column",gap:"4px"}}>
          <button className="btn btn-b" style={{width:"32px",height:"32px",padding:0,fontSize:"16px"}} onClick={()=>setCamera(c=>({...c,zoom:Math.min(2.5,c.zoom*1.2)}))}>+</button>
          <button className="btn btn-b" style={{width:"32px",height:"32px",padding:0,fontSize:"16px"}} onClick={()=>setCamera(c=>({...c,zoom:Math.max(0.25,c.zoom*0.83)}))}>−</button>
          <button className="btn btn-y" style={{width:"32px",height:"32px",padding:0,fontSize:"13px"}} onClick={()=>setCamera({x:80,y:60,zoom:0.85})}>⌂</button>
        </div>

        {/* Power supply bar */}
        <div style={{position:"absolute",bottom:"12px",left:"50%",transform:"translateX(-50%)",background:"rgba(4,10,24,0.9)",border:"1px solid #1e3a5f",borderRadius:"3px",padding:"4px 10px",minWidth:"160px",display:selTile?"none":"block"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",color:"#4a6080",marginBottom:"2px"}}>
            <span>0</span>
            <span style={{color:isBlackout?"#ff4455":gridStats.balance>=0?"#00ff88":"#ffd700"}} className={isBlackout?"blink":""}>{isBlackout?"⛔ BLACKOUT":gridStats.balance>=0?"✅ STABLE":"⚠ STRAIN"}</span>
            <span>{fmtMW(gridStats.demand)}</span>
          </div>
          <div style={{height:"5px",background:"#0a1020",borderRadius:"2px",overflow:"hidden",width:"160px"}}>
            <div style={{height:"100%",borderRadius:"2px",transition:"width .5s",background:isBlackout?"#ff4455":gridStats.balance>=0?"#00ff88":"#ffd700",width:`${Math.min(100,gridStats.demand>0?(gridStats.supply/gridStats.demand)*100:0)}%`}}/>
          </div>
        </div>

        {/* GAME OVER */}
        {gameOver && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
            <div style={{background:"#0d1424",border:"2px solid #ff4455",borderRadius:"8px",padding:"32px",textAlign:"center",maxWidth:"300px"}}>
              <div style={{fontSize:"48px"}}>💀</div>
              <div style={{fontSize:"24px",fontWeight:"bold",color:"#ff4455",margin:"10px 0"}}>BANKRUPT</div>
              <div style={{color:"#8ab4d0",marginBottom:"16px",fontSize:"12px"}}>Your grid collapsed on Day {day}.</div>
              <div className="sr"><span className="lbl">Revenue</span><span style={{color:"#00ff88"}}>{fmt$(stats.revenue)}</span></div>
              <div className="sr"><span className="lbl">CO₂</span><span style={{color:"#ff8800"}}>{Math.round(stats.co2).toLocaleString()} t</span></div>
              <div className="sr"><span className="lbl">Blackouts</span><span style={{color:"#ff4455"}}>{stats.blackouts}</span></div>
              <button className="btn btn-g" style={{marginTop:"18px",padding:"10px 28px",fontSize:"13px"}} onClick={()=>window.location.reload()}>↺ RESTART</button>
            </div>
          </div>
        )}
      </div>

      {/* SIDE PANEL */}
      {showPanel && (
        <div style={{width:"270px",background:"#0d1424",borderLeft:"1px solid #1e3a5f",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"1px solid #1e3a5f",background:"#080d18"}}>
            {[["build","🏗️ BUILD"],["finance","💰 MARKET"],["weather","🌤️ WEATHER"],["stats","📊 STATS"]].map(([id,lbl])=>(
              <button key={id} className={`tab${tab===id?" on":""}`} onClick={()=>setTab(id)}>{lbl}</button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"8px"}}>

            {/* BUILD */}
            {tab==="build" && <>
              <div style={{display:"flex",gap:"3px",marginBottom:"8px",flexWrap:"wrap"}}>
                {["all","fossil","renewable","clean","storage","consumer","infra"].map(c=>(
                  <button key={c} className={`btn ${catFilter===c?"btn-g":"btn-b"}`} style={{fontSize:"8px",padding:"3px 5px"}} onClick={()=>setCatFilter(c)}>{c}</button>
                ))}
              </div>
              {Object.entries(BUILDINGS).filter(([,d])=>catFilter==="all"||d.cat===catFilter).map(([key,def])=>{
                const isSel=selected===key;
                const canAfford=money>=def.cost;
                return (
                  <div key={key} className={`bcard${isSel?" sel":""}`}
                    style={{borderColor:isSel?"#00ff88":canAfford?def.color+"55":"#1e2540"}}
                    onClick={()=>setSelected(isSel?null:key)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{fontSize:"18px"}}>{def.emoji}</span>
                        <div>
                          <div style={{fontSize:"11px",fontWeight:"bold",color:def.color}}>{def.label}</div>
                          <div style={{fontSize:"8px",color:"#4a6080"}}>{def.desc}</div>
                        </div>
                      </div>
                      <div style={{background:CAT_COLORS[def.cat]+"22",color:CAT_COLORS[def.cat],padding:"1px 5px",borderRadius:"2px",fontSize:"8px",fontWeight:"bold"}}>{def.cat}</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"5px",fontSize:"9px",flexWrap:"wrap",gap:"2px"}}>
                      <span style={{color:canAfford?"#ffd700":"#ff4455",fontWeight:"bold"}}>{fmt$(def.cost)}</span>
                      {def.cap && <span style={{color:"#00ff88"}}>⚡{fmtMW(def.cap)}</span>}
                      {def.demand && <span style={{color:"#ff8800"}}>🏙️{fmtMW(def.demand)}</span>}
                      <span style={{color:"#4a6080"}}>{def.buildDays>0?`${def.buildDays}d`:"instant"}</span>
                    </div>
                    {def.opCost>0 && <div style={{fontSize:"8px",color:"#ff4455",marginTop:"2px"}}>Ops: {fmt$(def.opCost)}/day</div>}
                    {isSel && <div style={{marginTop:"5px",padding:"4px 6px",background:"rgba(0,255,136,0.06)",borderRadius:"3px",fontSize:"8px",color:"#00ff88",border:"1px solid #00ff8833"}}>Click map to place · Right-click to cancel</div>}
                  </div>
                );
              })}
            </>}

            {/* FINANCE */}
            {tab==="finance" && <>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>ELECTRICITY PRICE</div>
                <div style={{fontWeight:"bold",color:"#ffd700",fontSize:"14px",marginBottom:"4px"}}>${electricityPrice.toFixed(3)}/kWh</div>
                <input type="range" min="0.05" max="0.50" step="0.005" value={electricityPrice} onChange={e=>setElectricityPrice(parseFloat(e.target.value))}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"8px",color:"#4a6080"}}><span>$0.05 cheap</span><span>$0.50 pricey</span></div>
              </div>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>DAILY P&L</div>
                <div className="sr"><span className="lbl">Revenue</span><span style={{color:"#00ff88"}}>{fmt$(dailyRev)}</span></div>
                <div className="sr"><span className="lbl">Operations</span><span style={{color:"#ff4455"}}>−{fmt$(dailyOp)}</span></div>
                <div className="sr"><span className="lbl">Loan Payments</span><span style={{color:"#c060ff"}}>−{fmt$(loans.reduce((s,l)=>s+l.daily,0))}</span></div>
                <div className="sr" style={{borderBottom:"none",paddingTop:"4px"}}><span style={{color:"#4a6080",fontWeight:"bold"}}>NET</span><span style={{fontWeight:"bold",color:dailyRev-dailyOp-loans.reduce((s,l)=>s+l.daily,0)>=0?"#00ff88":"#ff4455"}}>{fmt$(dailyRev-dailyOp-loans.reduce((s,l)=>s+l.daily,0))}/day</span></div>
              </div>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>LOAN MARKET (8% interest)</div>
                {[{a:1e6,d:365,l:"$1M · 1yr"},{a:5e6,d:730,l:"$5M · 2yr"},{a:20e6,d:1095,l:"$20M · 3yr"},{a:100e6,d:1460,l:"$100M · 4yr"}].map(loan=>(
                  <button key={loan.l} className="btn btn-p" style={{width:"100%",marginBottom:"4px"}} onClick={()=>takeLoan(loan.a,loan.d)}>{loan.l}</button>
                ))}
                {loans.map((l,i)=>(
                  <div key={i} className="sr" style={{marginTop:"3px"}}><span className="lbl">Balance</span><span style={{color:"#c060ff"}}>{fmt$(l.balance)}</span><span className="lbl">{fmt$(l.daily)}/day</span></div>
                ))}
              </div>
            </>}

            {/* WEATHER */}
            {tab==="weather" && <>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"8px",letterSpacing:"1px"}}>ATMOSPHERIC CONDITIONS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"8px"}}>
                  {[
                    {icon:"🌡️",label:"Temperature",val:`${weather.tempC > 0?"+":""}${weather.tempC}°C`,color:weather.tempC>30?"#ff6644":weather.tempC<0?"#88ccff":"#ffd700"},
                    {icon:"💨",label:"Wind Speed",val:`${weather.windSpeedMs} m/s`,color:"#80c8ff"},
                    {icon:"🧭",label:"Wind Dir",val:`${weather.windDirLabel} ${weather.windDir}°`,color:"#80c8ff"},
                    {icon:"🌬️",label:"Hub Wind",val:`${weather.windSpeedHub} m/s`,color:"#60b8ff"},
                    {icon:"☁️",label:"Cloud Cover",val:`${Math.round(weather.cloudCover*100)}%`,color:"#a0b8d0"},
                    {icon:"🌧️",label:"Precip",val:weather.precipitation?"YES":"NO",color:weather.precipitation?"#4499ff":"#4a6080"},
                    {icon:"📊",label:"Pressure",val:`${weather.pressureHPa} hPa`,color:weather.pAnomalyHPa>8?"#88ff88":weather.pAnomalyHPa<-8?"#ff8888":"#aaaacc"},
                    {icon:"💧",label:"Humidity",val:`${weather.humidity}%`,color:"#60a8cc"},
                  ].map(({icon,label,val,color})=>(
                    <div key={label} style={{background:"#0d1828",borderRadius:"3px",padding:"6px 8px",border:"1px solid #1e2d40"}}>
                      <div style={{fontSize:"14px"}}>{icon}</div>
                      <div style={{fontSize:"7px",color:"#4a6080",marginTop:"2px"}}>{label}</div>
                      <div style={{fontSize:"11px",fontWeight:"bold",color,marginTop:"1px"}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>PRODUCTION FACTORS (LIVE)</div>
                <div className="sr"><span className="lbl">☀️ Solar Irradiance</span><span style={{color: weather.solarFactor>0.5?"#ffd700":weather.solarFactor>0.1?"#aa8800":"#4a6080"}}>{Math.round(weather.solarFactor*100)}% capacity</span></div>
                <div className="sr"><span className="lbl">🌀 Wind Power</span><span style={{color: weather.windFactor>0.5?"#20c0a0":weather.windFactor>0.1?"#108868":"#4a6080"}}>{Math.round(weather.windFactor*100)}% capacity</span></div>
                <div className="sr"><span className="lbl">🔥 Wind Speed @hub</span><span style={{color:"#60b8ff"}}>{weather.windSpeedHub} m/s</span></div>
                <div style={{marginTop:"6px",fontSize:"8px",color:"#4a6080"}}>Turbine cut-in: 3 m/s · Rated: 12 m/s · Cut-out: 25 m/s</div>
                {weather.windSpeedHub > 25 && <div style={{color:"#ff4455",fontSize:"9px",marginTop:"4px",fontWeight:"bold"}}>⚠ WIND TOO HIGH — turbines shut down!</div>}
                {weather.windSpeedHub < 3  && <div style={{color:"#888",fontSize:"9px",marginTop:"4px"}}>Wind below cut-in speed — no output</div>}
              </div>

              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>TEMPERATURE & DEMAND</div>
                <div className="sr"><span className="lbl">Heating Degree-Days</span><span style={{color:"#88aaff"}}>{weather.heatingDD} °C·d</span></div>
                <div className="sr"><span className="lbl">Cooling Degree-Days</span><span style={{color:"#ff8844"}}>{weather.coolingDD} °C·d</span></div>
                <div className="sr"><span className="lbl">Demand Modifier</span><span style={{color:weather.tempDemandMult>1.2?"#ff4455":weather.tempDemandMult>1.05?"#ffd700":"#00ff88"}}>{weather.tempDemandMult > 1?"+":""}{Math.round((weather.tempDemandMult-1)*100)}%</span></div>
                <div style={{marginTop:"8px",fontSize:"8px",color:"#4a6080"}}>
                  +3% demand per °C below 18°C (heating)<br/>
                  +4% demand per °C above 22°C (cooling)
                </div>
                {weather.tempC > 35 && <div style={{color:"#ff4455",fontSize:"9px",marginTop:"4px",fontWeight:"bold"}}>🌡️ EXTREME HEAT — demand surge!</div>}
                {weather.tempC < -15 && <div style={{color:"#88ccff",fontSize:"9px",marginTop:"4px",fontWeight:"bold"}}>❄️ DEEP FREEZE — heating surge!</div>}
              </div>

              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>SYNOPTIC PRESSURE SYSTEM</div>
                <div className="sr">
                  <span className="lbl">Pressure Anomaly</span>
                  <span style={{color:weather.pAnomalyHPa>8?"#88ff88":weather.pAnomalyHPa<-8?"#ff8888":"#aaaacc"}}>
                    {weather.pAnomalyHPa>0?"+":""}{weather.pAnomalyHPa} hPa
                  </span>
                </div>
                <div style={{marginTop:"4px",fontSize:"8px",color:"#4a6080",lineHeight:"1.6"}}>
                  {weather.pAnomalyHPa > 12 ? "🔵 Strong HIGH — clear skies, light winds, good solar" :
                   weather.pAnomalyHPa > 4  ? "🔵 High pressure — mostly clear, moderate winds" :
                   weather.pAnomalyHPa < -12 ? "🔴 Deep LOW — storms, heavy cloud, strong winds" :
                   weather.pAnomalyHPa < -4  ? "🔴 Low pressure — cloud, rain, gusty winds" :
                   "⚪ Near-neutral — mixed conditions"}
                </div>
              </div>

              <div className="card" style={{fontSize:"8px",color:"#4a6080",lineHeight:"1.8"}}>
                <div style={{fontWeight:"bold",color:"#6080a0",marginBottom:"4px"}}>MODEL DETAILS</div>
                Site: 45°N · {ELEVATION_M}m elev · Köppen Dfb<br/>
                Pressure: multi-centre synoptic field (Perlin-seeded)<br/>
                Solar: ASHRAE clear-sky + cloud transmittance<br/>
                Wind: geostrophic + BL stability + diurnal mixing<br/>
                Turbine: IEC Class II 2MW power curve (cut-in 3, rated 12, cut-out 25 m/s)<br/>
                Demand: HDD/CDD regression (ASHRAE 90.1 basis)
              </div>
            </>}


            {tab==="stats" && <>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>GRID</div>
                <div className="sr"><span className="lbl">Total Capacity</span><span style={{color:"#00ff88"}}>{fmtMW(totalCap)}</span></div>
                <div className="sr"><span className="lbl">Live Supply</span><span style={{color:"#40aaff"}}>{fmtMW(gridStats.supply)}</span></div>
                <div className="sr"><span className="lbl">Live Demand</span><span style={{color:"#ff8800"}}>{fmtMW(gridStats.demand)}</span></div>
                <div className="sr"><span className="lbl">Balance</span><span style={{color:gridStats.balance>=0?"#00ff88":"#ff4455"}}>{gridStats.balance>=0?"+":""}{fmtMW(gridStats.balance)}</span></div>
                <div className="sr"><span className="lbl">Renewable</span><span style={{color:"#20c0a0"}}>{Math.round(gridStats.renew)}%</span></div>
              </div>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>CAREER</div>
                <div className="sr"><span className="lbl">Day</span><span>{day}</span></div>
                <div className="sr"><span className="lbl">Total Revenue</span><span style={{color:"#00ff88"}}>{fmt$(stats.revenue)}</span></div>
                <div className="sr"><span className="lbl">Total Expenses</span><span style={{color:"#ff4455"}}>{fmt$(stats.expenses)}</span></div>
                <div className="sr"><span className="lbl">Net Profit</span><span style={{color:stats.revenue-stats.expenses>=0?"#00ff88":"#ff4455"}}>{fmt$(stats.revenue-stats.expenses)}</span></div>
                <div className="sr"><span className="lbl">CO₂ Emitted</span><span style={{color:"#ff8800"}}>{Math.round(stats.co2).toLocaleString()} t</span></div>
                <div className="sr"><span className="lbl">Blackout Days</span><span style={{color:stats.blackouts>0?"#ff4455":"#00ff88"}}>{stats.blackouts}</span></div>
                <div className="sr"><span className="lbl">Stable Days</span><span style={{color:"#00ff88"}}>{stats.uptime}</span></div>
              </div>
              <div className="card">
                <div style={{fontSize:"9px",color:"#4a6080",marginBottom:"6px",letterSpacing:"1px"}}>GENERATION MIX</div>
                {(()=>{
                  const counts={};
                  Object.values(placed).forEach(b=>{
                    if(b.rootX===undefined||!BUILDINGS[b.type]?.cap) return;
                    counts[b.type]=(counts[b.type]||0)+1;
                  });
                  return Object.entries(counts).length===0
                    ? <div style={{color:"#4a6080",fontSize:"9px",textAlign:"center",padding:"8px"}}>No generators built yet</div>
                    : Object.entries(counts).map(([t,c])=>(
                      <div key={t} className="sr">
                        <span>{BUILDINGS[t].emoji} {BUILDINGS[t].label}</span>
                        <span style={{color:BUILDINGS[t].color}}>×{c} {fmtMW(BUILDINGS[t].cap*c)}</span>
                      </div>
                    ));
                })()}
              </div>
            </>}
          </div>

          {/* Bottom power bar */}
          <div style={{padding:"7px 8px",borderTop:"1px solid #1e3a5f",background:"#08101e"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"8px",color:"#4a6080",marginBottom:"3px"}}>
              <span>⚡ {fmtMW(gridStats.supply)}</span>
              <span style={{color:isBlackout?"#ff4455":gridStats.balance>=0?"#00ff88":"#ffd700"}} className={isBlackout?"blink":""}>
                {isBlackout?"⛔ BLACKOUT":gridStats.balance>=0?"✅ STABLE":"⚠ LOW"}
              </span>
              <span>🏙️ {fmtMW(gridStats.demand)}</span>
            </div>
            <div style={{height:"5px",background:"#0a1020",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"2px",transition:"width .6s ease",background:isBlackout?"#ff4455":gridStats.balance>=0?"#00ff88":"#ffd700",width:`${Math.min(100,gridStats.demand>0?(gridStats.supply/gridStats.demand)*100:0)}%`}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
