
(function () {
  const experience = document.getElementById("observatoryExperience");
  const skyCanvas = document.getElementById("observatorySkyCanvas");
  const objectCanvas = document.getElementById("observatoryObjectCanvas");
  const telescope = document.getElementById("observatoryTelescope");
  const status = document.getElementById("observatoryTargetStatus");
  const openButton = document.getElementById("observatoryOpenLens");
  const randomButton = document.getElementById("observatoryRandomTarget");
  const list = document.getElementById("observatoryTargetList");
  const overlay = document.getElementById("observatoryLensOverlay");
  const back = document.getElementById("observatoryBack");
  const timeElement = document.getElementById("observatoryLocalTime");
  const hudName = document.getElementById("observatoryHudName");

  if (!experience || !skyCanvas || !objectCanvas || !telescope || !status || !openButton || !list || !overlay) return;

  const sky = skyCanvas.getContext("2d", { alpha: false });
  const obj = objectCanvas.getContext("2d", { alpha: false });
  if (!sky || !obj) return;

  const embedded = new URLSearchParams(location.search).get("embedded") === "1";
  if (embedded && back) {
    back.addEventListener("click", (e) => {
      e.preventDefault();
      parent.postMessage({ type: "CELESTIAL_EXPERIENCE_CLOSE" }, location.origin);
    });
  }

  const targets = [
    { id: "moon", name: "The Moon", type: "EARTH'S MOON", symbol: "☾", distance: "384,400 km", light: "1.3 seconds", known: "Craters & maria", poetry: "The nearest world, still beautifully far away.", description: "The Moon is the nearest world beyond Earth, and through a telescope it feels alive — crater rims brighten, shadows crawl slowly, and its quiet surface feels impossibly intimate.", x: .73, y: .25, color: [239,220,188], zoom: '12.6x' },
    { id: "mercury", name: "Mercury", type: "INNER ROCKY PLANET", symbol: "☿", distance: "≈91 million km", light: "≈5 minutes", known: "Scarred surface", poetry: "A burnt little world drifting closest to the Sun.", description: "Mercury looks ancient and severe, with a cratered face and a subtle heat-haze shimmer that gives it a fragile, sun-scorched presence.", x: .79, y: .17, color: [219,194,169], zoom: '18.1x' },
    { id: "venus", name: "Venus", type: "CLOUD-WRAPPED PLANET", symbol: "♀", distance: "≈41 million km", light: "≈2.3 minutes", known: "Bright cloud decks", poetry: "A luminous pearl wrapped in restless cloud.", description: "Venus is hidden beneath dense clouds. In this telescope view, its soft golden atmosphere slowly churns and drifts, like silk moving beneath glass.", x: .62, y: .17, color: [228,204,154], zoom: '15.4x' },
    { id: "mars", name: "Mars", type: "THE RED PLANET", symbol: "♂", distance: "≈225 million km", light: "≈12.5 minutes", known: "Iron-rich surface", poetry: "A rust-colored silence waiting beyond the dark.", description: "Mars glows with iron-rich warmth. Dust bands and a faint storm movement make it feel less like a picture and more like a living frontier.", x: .42, y: .22, color: [214,119,91], zoom: '14.2x' },
    { id: "jupiter", name: "Jupiter", type: "GAS GIANT", symbol: "♃", distance: "≈780 million km", light: "≈43 minutes", known: "Bands & Great Red Spot", poetry: "A storm-lit giant holding dozens of small worlds close.", description: "Jupiter is a planet of motion: cloud belts slide, storms twist, and tiny moons quietly drift nearby, turning the view into something cinematic and immense.", x: .59, y: .31, color: [215,176,137], zoom: '10.7x' },
    { id: "saturn", name: "Saturn", type: "RINGED PLANET", symbol: "♄", distance: "≈1.4 billion km", light: "≈79 minutes", known: "Icy ring system", poetry: "A pale golden world carrying an impossible crown.", description: "Saturn’s rings catch light like moving silver dust. Ring particles shimmer, the globe rotates gently, and the entire scene feels like a luxury watch face in motion.", x: .84, y: .39, color: [224,191,145], zoom: '11.3x' },
    { id: "uranus", name: "Uranus", type: "ICE GIANT", symbol: "♅", distance: "≈2.9 billion km", light: "≈2.7 hours", known: "Blue-green atmosphere", poetry: "A quiet teal world suspended in perfect restraint.", description: "Uranus is subtle and elegant — pale cyan bands glide under a cool haze, giving the whole world a clean, serene, expensive stillness.", x: .52, y: .11, color: [159,215,220], zoom: '9.9x' },
    { id: "neptune", name: "Neptune", type: "ICE GIANT", symbol: "♆", distance: "≈4.5 billion km", light: "≈4.2 hours", known: "Deep blue storms", poetry: "A cobalt world where winds never really sleep.", description: "Neptune appears like living sapphire. Cloud streaks move, a dark storm turns slowly, and the whole view feels cold, distant, and deeply luxurious.", x: .33, y: .13, color: [95,146,235], zoom: '9.2x' },
    { id: "pleiades", name: "The Pleiades", type: "OPEN STAR CLUSTER", symbol: "✦", distance: "≈444 light-years", light: "444 years", known: "Seven Sisters", poetry: "A handful of blue stars gathered close in the cold.", description: "The Pleiades sparkles with blue-white stars and drifting nebulous glow. Each tiny twinkle pulses differently, making the cluster feel like a living jewel box.", x: .28, y: .29, color: [173,209,238], zoom: '22.4x' },
    { id: "orion", name: "Orion Nebula", type: "STELLAR NURSERY", symbol: "∴", distance: "≈1,344 light-years", light: "1,344 years", known: "Newborn stars", poetry: "A cloud of light where new suns are quietly beginning.", description: "The Orion Nebula blooms with moving ribbons of cyan and violet gas, punctuated by bright infant stars. It feels less like a still image and more like breathing light.", x: .35, y: .46, color: [201,162,210], zoom: '27.2x' },
    { id: "andromeda", name: "Andromeda Galaxy", type: "SPIRAL GALAXY", symbol: "∞", distance: "≈2.5 million ly", light: "2.5 million years", known: "Nearest major galaxy", poetry: "A whole galaxy arriving as a faint, ancient whisper.", description: "Andromeda rotates like a vast pearl-colored whirlpool. Its core glows, outer arms turn almost imperceptibly, and the scale of it creates a truly cinematic feeling.", x: .18, y: .18, color: [198,182,221], zoom: '31.8x' }
  ];

  let w=1,h=1,dpr=1,ow=1,oh=1,odpr=1;
  let t=0,last=performance.now(),running=true;
  let stars=[]; let drag=false; let lastPoint=null;
  let cameraX=0,cameraY=0,targetX=0,targetY=0;
  let active=null,locked=null;
  let seed=19072026;

  function rand(){ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }
  function rgba(r,g,b,a){ return `rgba(${r},${g},${b},${a})`; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  function buildStars(){
    seed=19072026;
    stars = Array.from({length: innerWidth <= 700 ? 170 : 310}, () => ({
      x: rand(), y: .01 + rand()*.76, size: .35 + rand()*1.65,
      alpha: .18 + rand()*.76, phase: rand()*Math.PI*2,
      twinkle: 1.1 + rand()*3.2, depth: .25 + rand()*.75
    }));
  }

  function resizeSky(){
    const r = skyCanvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height); dpr = Math.min(devicePixelRatio || 1, 2);
    skyCanvas.width = Math.round(w*dpr); skyCanvas.height = Math.round(h*dpr);
    sky.setTransform(dpr,0,0,dpr,0,0);
    buildStars();
  }

  function resizeObject(){
    const r = objectCanvas.getBoundingClientRect();
    ow = Math.max(1, r.width); oh = Math.max(1, r.height); odpr = Math.min(devicePixelRatio || 1, 2);
    objectCanvas.width = Math.round(ow*odpr); objectCanvas.height = Math.round(oh*odpr);
    obj.setTransform(odpr,0,0,odpr,0,0);
  }

  function pos(o){ return { x: o.x*w + cameraX*.46, y: o.y*h + cameraY*.36 }; }

  function drawBackground(){
    const g = sky.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#06101a'); g.addColorStop(.46,'#0e1928'); g.addColorStop(.74,'#171d2a'); g.addColorStop(1,'#151621');
    sky.fillStyle = g; sky.fillRect(0,0,w,h);
    const haze = sky.createRadialGradient(w*.68,h*.28,0,w*.68,h*.28,Math.max(w,h)*.6);
    haze.addColorStop(0,'rgba(151,182,194,.055)'); haze.addColorStop(1,'rgba(151,182,194,0)');
    sky.fillStyle = haze; sky.fillRect(0,0,w,h);
  }

  function drawStars(){
    for (const s of stars){
      const x=((s.x+t*.00008)%1)*w + cameraX*s.depth*.22;
      const y=s.y*h + cameraY*s.depth*.18;
      const a=s.alpha*(.62 + Math.sin(t*s.twinkle+s.phase)*.38);
      sky.beginPath(); sky.arc(x,y,s.size,0,Math.PI*2); sky.fillStyle=rgba(225,235,240,Math.max(.05,a)); sky.fill();
    }
  }

  function drawMarkers(){
    for (const o of targets){
      const p = pos(o), pulse=.65 + Math.sin(t*1.7 + o.x*10)*.35;
      const r=o.id==='moon'?12:['saturn','jupiter'].includes(o.id)?7:['mercury','venus','mars','uranus','neptune'].includes(o.id)?5:4;
      sky.beginPath(); sky.arc(p.x,p.y,r*3.5,0,Math.PI*2); sky.fillStyle=rgba(o.color[0],o.color[1],o.color[2],.024 + pulse*.026); sky.fill();
      sky.beginPath(); sky.arc(p.x,p.y,r,0,Math.PI*2); sky.fillStyle=rgba(o.color[0],o.color[1],o.color[2],.42 + pulse*.26); sky.fill();
      sky.beginPath(); sky.arc(p.x,p.y,r+9,0,Math.PI*2); sky.strokeStyle=rgba(o.color[0],o.color[1],o.color[2], locked?.id === o.id ? .48 : .08); sky.lineWidth=locked?.id===o.id?1.5:1; sky.stroke();
    }
  }

  function drawHorizon(){
    sky.beginPath(); sky.moveTo(0,h); sky.lineTo(0,h*.8);
    sky.bezierCurveTo(w*.15,h*.73,w*.28,h*.84,w*.42,h*.76);
    sky.bezierCurveTo(w*.61,h*.67,w*.76,h*.87,w,h*.74);
    sky.lineTo(w,h); sky.closePath();
    const g = sky.createLinearGradient(0,h*.8,0,h); g.addColorStop(0,'#131722'); g.addColorStop(1,'#05070c'); sky.fillStyle=g; sky.fill();
    const x=w*.72,y=h*.88,r=Math.min(w,h)*.11;
    sky.beginPath(); sky.arc(x,y,r,Math.PI,Math.PI*2); sky.lineTo(x+r,h); sky.lineTo(x-r,h); sky.closePath(); sky.fillStyle='#05070b'; sky.fill();
    sky.beginPath(); sky.moveTo(x,y-r); sky.lineTo(x+r*.18,y+r*.1); sky.strokeStyle='rgba(169,201,208,.12)'; sky.lineWidth=2; sky.stroke();
  }

  function updateCamera(dt){
    cameraX += (targetX-cameraX)*Math.min(1,dt*3.1);
    cameraY += (targetY-cameraY)*Math.min(1,dt*3.1);
    cameraX = clamp(cameraX,-w*.58,w*.58);
    cameraY = clamp(cameraY,-h*.34,h*.34);
  }

  function lockTarget(target, animate=true){
    locked = active = target;
    if (animate){
      targetX = (w*.5 - target.x*w)/.46;
      targetY = (h*.46 - target.y*h)/.36;
    }
    status.textContent = `${target.name} is inside the telescope's field.`;
    openButton.disabled = false;
    openButton.classList.add('ready');
    openButton.querySelector('span').textContent = `Observe ${target.name}`;
    if (hudName) hudName.textContent = target.name.toUpperCase();
    [...list.querySelectorAll('.observatory-target-button')].forEach(btn => btn.classList.toggle('active', btn.dataset.targetId === target.id));
  }

  function detectTarget(){
    const reticle={x:w*.5,y:h*.46};
    let nearest=null, distance=Infinity;
    for (const o of targets){ const p=pos(o), d=Math.hypot(p.x-reticle.x,p.y-reticle.y); if(d<distance){distance=d; nearest=o;} }
    if (nearest && distance <= Math.min(w,h)*.075) lockTarget(nearest,false);
    else if (!active){
      locked=null; openButton.disabled=true; openButton.classList.remove('ready'); status.textContent='Move the telescope toward a celestial marker.';
    }
    const angle = clamp(-14 + cameraY*.04 - cameraX*.025, -26, 6);
    telescope.style.setProperty('--scope-angle', `${angle}deg`);
  }

  function buildTargetList(){
    list.innerHTML='';
    for (const o of targets){
      const b=document.createElement('button'); b.type='button'; b.className='observatory-target-button'; b.dataset.targetId=o.id;
      b.innerHTML=`<span class="observatory-target-symbol">${o.symbol}</span><span class="observatory-target-copy"><strong>${o.name}</strong><small>${o.type}</small></span><b>↗</b>`;
      b.addEventListener('click',()=>lockTarget(o,true));
      list.appendChild(b);
    }
  }

  function syncInfo(o){
    const map={
      observatoryLensTitle:o.name,
      observatoryObjectType:o.type,
      observatoryObjectName:o.name,
      observatoryObjectPoetry:o.poetry,
      observatoryObjectDistance:o.distance,
      observatoryObjectLight:o.light,
      observatoryObjectKnown:o.known,
      observatoryObjectDescription:o.description,
      observatoryHudName:o.name.toUpperCase()
    };
    for(const [id,val] of Object.entries(map)){
      const el=document.getElementById(id); if(el) el.textContent=val;
    }
    const zoomChip = overlay.querySelector('.observatory-lens-video-hud span:nth-child(2)');
    if (zoomChip) zoomChip.textContent = o.zoom || '12.0x';
  }

  function openLens(){ if(!active) return; syncInfo(active); overlay.hidden=false; resizeObject(); }
  function closeLens(){ overlay.hidden=true; }
  function randomTarget(open=false){ let next=targets[Math.floor(Math.random()*targets.length)]; while(active && targets.length>1 && next.id===active.id){ next=targets[Math.floor(Math.random()*targets.length)]; } lockTarget(next,true); if(open) setTimeout(openLens,650); }

  function updateClock(){ if(timeElement){ timeElement.textContent = new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); } }

  // -------- cinematic object renderer --------
  function objectBackground(){
    const g = obj.createRadialGradient(ow*.5,oh*.48,0,ow*.5,oh*.48,Math.max(ow,oh)*.72);
    g.addColorStop(0,'#0c1423'); g.addColorStop(.55,'#040916'); g.addColorStop(1,'#01030a');
    obj.fillStyle=g; obj.fillRect(0,0,ow,oh);
    for(let i=0;i<95;i++){
      const x=((i*83)%997)/997*ow, y=((i*191)%991)/991*oh;
      obj.beginPath(); obj.arc(x,y,i%9===0?1.25:.65,0,Math.PI*2);
      obj.fillStyle=rgba(228,236,242,.06 + (i%7)*.032); obj.fill();
    }
  }

  function drawLensArtifacts(){
    // drifting dust
    for (let i=0;i<18;i++){
      const x=(Math.sin(t*.22 + i*1.31)*.42 + .5)*ow;
      const y=(Math.cos(t*.17 + i*1.71)*.42 + .5)*oh;
      const r=(i%4+1)*.9;
      const g=obj.createRadialGradient(x,y,0,x,y,r*7);
      g.addColorStop(0,'rgba(255,255,255,.05)'); g.addColorStop(1,'rgba(255,255,255,0)');
      obj.fillStyle=g; obj.beginPath(); obj.arc(x,y,r*7,0,Math.PI*2); obj.fill();
    }
    // subtle scan shimmer
    obj.fillStyle='rgba(255,255,255,.02)';
    for (let y=0;y<oh;y+=4){ obj.fillRect(0,y,ow,1); }
    // focus pulse
    obj.strokeStyle='rgba(169,201,208,.08)';
    obj.lineWidth=2;
    obj.beginPath(); obj.arc(ow*.5, oh*.5, Math.min(ow,oh)*(.34 + Math.sin(t*2.2)*.005), 0, Math.PI*2); obj.stroke();
  }

  function gradientSphere(x,y,r,stops){
    const g=obj.createRadialGradient(x-r*.35,y-r*.32,r*.03,x,y,r);
    for(const [pos,color] of stops) g.addColorStop(pos,color);
    obj.fillStyle=g; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
  }

  function drawMoon(){
    const r=Math.min(ow,oh)*.29, x=ow*.5+Math.sin(t*.18)*3, y=oh*.5;
    const halo=obj.createRadialGradient(x,y,r*.1,x,y,r*1.8); halo.addColorStop(0,'rgba(255,239,206,.22)'); halo.addColorStop(1,'rgba(255,239,206,0)');
    obj.fillStyle=halo; obj.beginPath(); obj.arc(x,y,r*1.8,0,Math.PI*2); obj.fill();
    gradientSphere(x,y,r,[[0,'#fff9e8'],[.42,'#ead7b8'],[.80,'#b29b82'],[1,'#655b64']]);
    // moving terminator
    obj.save(); obj.globalCompositeOperation='multiply';
    obj.fillStyle='rgba(45,31,34,.22)'; obj.beginPath(); obj.ellipse(x + Math.sin(t*.12)*r*.28, y, r*.62, r*.96, 0, 0, Math.PI*2); obj.fill(); obj.restore();
    [[-.27,-.17,.16],[.19,-.26,.1],[.3,.09,.14],[-.12,.29,.12],[.03,.04,.19],[-.35,.13,.08]].forEach(c=>{obj.beginPath(); obj.arc(x+c[0]*r,y+c[1]*r,c[2]*r,0,Math.PI*2); obj.fillStyle='rgba(92,82,92,.14)'; obj.fill();});
  }

  function drawMercury(){
    const r=Math.min(ow,oh)*.22, x=ow*.5, y=oh*.5;
    gradientSphere(x,y,r,[[0,'#f2e2cc'],[.44,'#ceb79d'],[.8,'#8f796b'],[1,'#433940']]);
    obj.save();
    for(let i=0;i<13;i++){
      const cx=x + Math.sin(i*2.2+t*.11)*r*.62, cy=y + Math.cos(i*1.9+t*.13)*r*.52, cr=(.03+(i%3)*.026)*r;
      obj.beginPath(); obj.arc(cx,cy,cr,0,Math.PI*2); obj.fillStyle='rgba(83,71,65,.16)'; obj.fill();
    }
    obj.restore();
    obj.save(); obj.globalCompositeOperation='screen';
    const haze=obj.createRadialGradient(x-r*.8, y-r*.2, 0, x-r*.8, y-r*.2, r*1.4); haze.addColorStop(0,'rgba(255,204,128,.12)'); haze.addColorStop(1,'rgba(255,204,128,0)'); obj.fillStyle=haze; obj.beginPath(); obj.arc(x-r*.8,y-r*.2,r*1.4,0,Math.PI*2); obj.fill(); obj.restore();
  }

  function drawVenus(){
    const r=Math.min(ow,oh)*.24, x=ow*.5, y=oh*.5;
    gradientSphere(x,y,r,[[0,'#fff5d1'],[.48,'#e6d0a4'],[.82,'#ba9a6a'],[1,'#6b5856']]);
    obj.save(); obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.clip();
    for(let i=-5;i<=5;i++){
      const yy=y + i*r*.16 + Math.sin(t*.45 + i)*r*.04;
      obj.fillStyle = i%2===0 ? 'rgba(255,236,193,.12)' : 'rgba(191,147,95,.12)';
      obj.beginPath(); obj.ellipse(x + Math.sin(t*.32 + i)*r*.05, yy, r*.96, r*.09, Math.sin(t*.1+i)*.08, 0, Math.PI*2); obj.fill();
    }
    obj.restore();
  }

  function drawMars(){
    const r=Math.min(ow,oh)*.23, x=ow*.5, y=oh*.5;
    gradientSphere(x,y,r,[[0,'#f2b186'],[.46,'#c96f55'],[.8,'#884540'],[1,'#49313e']]);
    [[-.34,-.18,.22,.12],[.25,-.28,.16,.08],[.19,.18,.27,.12],[-.24,.32,.18,.10]].forEach(m=>{obj.beginPath(); obj.ellipse(x+m[0]*r,y+m[1]*r,m[2]*r,m[3]*r,.2,0,Math.PI*2); obj.fillStyle='rgba(92,47,50,.24)'; obj.fill();});
    obj.save(); obj.globalCompositeOperation='screen';
    for(let i=0;i<5;i++){
      const dx=Math.sin(t*.3+i*1.2)*r*.26, dy=Math.cos(t*.22+i*1.4)*r*.14;
      const g=obj.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r*.34); g.addColorStop(0,'rgba(244,202,145,.06)'); g.addColorStop(1,'rgba(244,202,145,0)');
      obj.fillStyle=g; obj.beginPath(); obj.arc(x+dx,y+dy,r*.34,0,Math.PI*2); obj.fill();
    }
    obj.restore();
  }

  function drawJupiter(){
    const r=Math.min(ow,oh)*.25, x=ow*.5, y=oh*.5;
    obj.save(); obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.clip();
    const g=obj.createRadialGradient(x-r*.34,y-r*.3,r*.04,x,y,r); g.addColorStop(0,'#f7e2c5'); g.addColorStop(.65,'#caa886'); g.addColorStop(1,'#6e5f65'); obj.fillStyle=g; obj.fillRect(x-r,y-r,r*2,r*2);
    const bands=[[-.62,.16,'rgba(165,126,114,.46)'],[-.31,.10,'rgba(227,198,166,.52)'],[-.05,.17,'rgba(159,119,108,.45)'],[.29,.12,'rgba(228,198,166,.52)'],[.55,.15,'rgba(157,119,110,.45)']];
    bands.forEach((b,idx)=>{ const offset=(Math.sin(t*.36+idx)*r*.08); obj.fillStyle=b[2]; obj.fillRect(x-r, y+b[0]*r + offset, r*2, b[1]*r); });
    obj.beginPath(); obj.ellipse(x+r*.42+Math.sin(t*.25)*r*.03, y+r*.18, r*.22, r*.10, -.1, 0, Math.PI*2); obj.fillStyle='rgba(173,98,89,.78)'; obj.fill();
    obj.restore();
    // Galilean moons
    [[-1.7, .56],[1.45,.72],[-2.35,.92],[2.1,.49]].forEach((m,i)=>{ const mx=x + Math.sin(t*.14 + i)*r*1.55 + m[0]*r*.14, my=y + m[1]*r*0 + (i-1.5)*2; obj.beginPath(); obj.arc(mx,my,2.5+i*.3,0,Math.PI*2); obj.fillStyle='rgba(233,219,192,.84)'; obj.fill();});
  }

  function drawSaturn(){
    const r=Math.min(ow,oh)*.17, x=ow*.5, y=oh*.5;
    obj.save(); obj.translate(x,y); obj.rotate(-.24 + Math.sin(t*.08)*.02);
    // back ring
    obj.beginPath(); obj.ellipse(0,0,r*2.3,r*.52,0,0,Math.PI*2); obj.strokeStyle='rgba(194,172,142,.25)'; obj.lineWidth=r*.28; obj.stroke();
    gradientSphere(0,0,r,[[0,'#f6dfac'],[.5,'#cda477'],[1,'#675365']]);
    obj.beginPath(); obj.ellipse(0,0,r*2.04,r*.37,0,0,Math.PI*2); obj.strokeStyle='rgba(246,218,171,.56)'; obj.lineWidth=r*.095; obj.stroke();
    // ring shimmer particles
    for(let i=0;i<90;i++){ const a=(i/90)*Math.PI*2 + t*.25; const rr=r*(1.45 + (i%7)*.1); const px=Math.cos(a)*rr*1.15; const py=Math.sin(a)*rr*.26; obj.fillStyle=`rgba(255,231,190,${.02 + (i%5)*.015})`; obj.fillRect(px,py,1.4,1.4); }
    obj.restore();
  }

  function drawUranus(){
    const r=Math.min(ow,oh)*.21, x=ow*.5, y=oh*.5;
    gradientSphere(x,y,r,[[0,'#d9fbff'],[.45,'#9fe3ea'],[.82,'#69bac2'],[1,'#4f6f7c']]);
    obj.save(); obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.clip();
    for(let i=-4;i<=4;i++){
      obj.fillStyle=i%2===0?'rgba(255,255,255,.07)':'rgba(126,214,223,.08)';
      obj.beginPath(); obj.ellipse(x+Math.sin(t*.28+i)*r*.05, y+i*r*.18, r*.98, r*.08, .02,0,Math.PI*2); obj.fill();
    }
    obj.restore();
  }

  function drawNeptune(){
    const r=Math.min(ow,oh)*.22, x=ow*.5, y=oh*.5;
    gradientSphere(x,y,r,[[0,'#a8d6ff'],[.42,'#5b92eb'],[.80,'#2253b2'],[1,'#26325f']]);
    obj.save(); obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.clip();
    for(let i=-4;i<=4;i++){
      obj.fillStyle=i%2===0?'rgba(188,218,255,.08)':'rgba(74,109,209,.10)';
      obj.beginPath(); obj.ellipse(x+Math.sin(t*.35+i)*r*.06, y+i*r*.17 + Math.cos(t*.42+i)*r*.01, r*.96, r*.085, .04,0,Math.PI*2); obj.fill();
    }
    obj.beginPath(); obj.ellipse(x+r*.28+Math.sin(t*.2)*r*.03, y-r*.05, r*.17, r*.11, -.35,0,Math.PI*2); obj.fillStyle='rgba(31,66,156,.34)'; obj.fill();
    obj.restore();
  }

  function drawPleiades(){
    const cx=ow*.5, cy=oh*.5, scale=Math.min(ow,oh)*.64;
    obj.save(); obj.globalCompositeOperation='screen';
    for(let cloud=0; cloud<4; cloud++){
      const x=cx + (cloud-1.5)*scale*.12; const y=cy + Math.sin(t*.2+cloud)*scale*.05;
      const g=obj.createRadialGradient(x,y,0,x,y,scale*.24); g.addColorStop(0,'rgba(123,177,222,.09)'); g.addColorStop(1,'rgba(123,177,222,0)');
      obj.fillStyle=g; obj.beginPath(); obj.arc(x,y,scale*.24,0,Math.PI*2); obj.fill();
    }
    [[-.22,-.05,4.8],[-.08,-.18,5.7],[.10,-.14,4.5],[.22,.02,5.3],[.04,.10,4],[-.13,.15,3.8],[.16,.20,3.4]].forEach((s,i)=>{
      const x=cx+s[0]*scale + Math.sin(t*(.8+i*.05)+i)*1.2; const y=cy+s[1]*scale + Math.cos(t*(.7+i*.07)+i)*1.2;
      const glow=obj.createRadialGradient(x,y,0,x,y,s[2]*7); glow.addColorStop(0,'rgba(231,244,255,.98)'); glow.addColorStop(.18,'rgba(168,211,244,.46)'); glow.addColorStop(1,'rgba(168,211,244,0)');
      obj.fillStyle=glow; obj.beginPath(); obj.arc(x,y,s[2]*7,0,Math.PI*2); obj.fill();
    });
    obj.restore();
  }

  function drawOrion(){
    const cx=ow*.5, cy=oh*.5;
    obj.save(); obj.translate(cx,cy); obj.rotate(-.22 + Math.sin(t*.04)*.01); obj.globalCompositeOperation='screen';
    for(let layer=0; layer<8; layer++){
      const r=Math.min(ow,oh)*(.11 + layer*.034);
      const g=obj.createRadialGradient(0,0,0,0,0,r);
      g.addColorStop(0,layer%2?'rgba(221,180,221,.16)':'rgba(128,176,215,.16)');
      g.addColorStop(.55,layer%2?'rgba(177,116,181,.06)':'rgba(105,145,194,.055)');
      g.addColorStop(1,'rgba(111,145,194,0)');
      obj.fillStyle=g; obj.beginPath(); obj.ellipse((layer-3.5)*8,Math.sin(t*.22+layer)*12,r*1.24,r*.62,layer*.22,0,Math.PI*2); obj.fill();
    }
    obj.restore();
    [[-18,-8],[7,4],[22,-13],[1,19],[-5,-23]].forEach((p,i)=>{ const x=cx+p[0]+Math.sin(t*.9+i)*.6,y=cy+p[1]+Math.cos(t*.75+i)*.6; obj.beginPath(); obj.arc(x,y,2.2+i*.2,0,Math.PI*2); obj.fillStyle='rgba(240,244,255,.9)'; obj.fill(); });
  }

  function drawAndromeda(){
    const cx=ow*.5, cy=oh*.5;
    obj.save(); obj.translate(cx,cy); obj.rotate(-.30 + t*.02);
    obj.globalCompositeOperation='screen';
    for(let layer=0; layer<10; layer++){
      const a=Math.min(ow,oh)*(.14 + layer*.028), b=a*(.18 + layer*.008);
      const g=obj.createRadialGradient(0,0,0,0,0,a);
      g.addColorStop(0, layer<2 ? 'rgba(255,237,207,.22)' : 'rgba(186,174,218,.07)');
      g.addColorStop(.62,'rgba(143,137,193,.04)'); g.addColorStop(1,'rgba(143,137,193,0)');
      obj.fillStyle=g; obj.beginPath(); obj.ellipse(0,0,a,b,0,0,Math.PI*2); obj.fill();
    }
    obj.restore();
    const n=obj.createRadialGradient(cx,cy,0,cx,cy,Math.min(ow,oh)*.08); n.addColorStop(0,'rgba(255,246,219,.95)'); n.addColorStop(.36,'rgba(232,213,194,.36)'); n.addColorStop(1,'rgba(232,213,194,0)'); obj.fillStyle=n; obj.beginPath(); obj.arc(cx,cy,Math.min(ow,oh)*.08,0,Math.PI*2); obj.fill();
  }

  function renderObject(){
    if (!active || overlay.hidden) return;
    objectBackground();
    switch(active.id){
      case 'moon': drawMoon(); break;
      case 'mercury': drawMercury(); break;
      case 'venus': drawVenus(); break;
      case 'mars': drawMars(); break;
      case 'jupiter': drawJupiter(); break;
      case 'saturn': drawSaturn(); break;
      case 'uranus': drawUranus(); break;
      case 'neptune': drawNeptune(); break;
      case 'pleiades': drawPleiades(); break;
      case 'orion': drawOrion(); break;
      case 'andromeda': drawAndromeda(); break;
    }
    drawLensArtifacts();
  }

  experience.addEventListener('pointerdown',(e)=>{
    if (e.target.closest('a,button,.observatory-target-dock,.observatory-lens-overlay')) return;
    drag=true; lastPoint={x:e.clientX,y:e.clientY}; experience.classList.add('dragging'); experience.setPointerCapture(e.pointerId);
  });
  experience.addEventListener('pointermove',(e)=>{
    if(!drag || !lastPoint) return;
    targetX += (e.clientX-lastPoint.x)*1.6; targetY += (e.clientY-lastPoint.y)*1.25; active=null; lastPoint={x:e.clientX,y:e.clientY};
  });
  function endDrag(e){ drag=false; lastPoint=null; experience.classList.remove('dragging'); try{ experience.releasePointerCapture(e.pointerId);}catch(_){} }
  experience.addEventListener('pointerup', endDrag); experience.addEventListener('pointercancel', endDrag);

  openButton.addEventListener('click', openLens);
  randomButton.addEventListener('click', ()=>randomTarget(true));
  document.getElementById('observatoryNextObject')?.addEventListener('click', ()=>randomTarget(true));
  document.addEventListener('click',(e)=>{ if(e.target.matches('[data-close-lens]')) closeLens(); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && !overlay.hidden) closeLens(); });
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; last=performance.now(); });

  let resizeTimer;
  addEventListener('resize',()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{ resizeSky(); if(!overlay.hidden) resizeObject(); },120); });

  function loop(now){
    const dt=Math.min(.05, Math.max(0,(now-last)/1000)); last=now;
    if(running){ t+=dt; updateCamera(dt); drawBackground(); drawStars(); drawMarkers(); drawHorizon(); detectTarget(); renderObject(); }
    requestAnimationFrame(loop);
  }

  buildTargetList(); resizeSky(); updateClock(); setInterval(updateClock, 30000);
  requestAnimationFrame(loop);
})();
