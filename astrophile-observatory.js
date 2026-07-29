
(function () {
  const experience = document.getElementById("observatoryExperience");
  const skyCanvas = document.getElementById("observatorySkyCanvas");
  const objectCanvas = document.getElementById("observatoryObjectCanvas");
  const travelCanvas = document.getElementById("observatoryTravelCanvas");
  const telescope = document.getElementById("observatoryTelescope");
  const status = document.getElementById("observatoryTargetStatus");
  const openButton = document.getElementById("observatoryOpenLens");
  const randomButton = document.getElementById("observatoryRandomTarget");
  const list = document.getElementById("observatoryTargetList");
  const overlay = document.getElementById("observatoryLensOverlay");
  const travelOverlay = document.getElementById("observatoryTravelOverlay");
  const back = document.getElementById("observatoryBack");
  const timeElement = document.getElementById("observatoryLocalTime");
  const hudFocus = document.getElementById("observatoryHudFocus");
  const hudZoom = document.getElementById("observatoryHudZoom");
  const hudName = document.getElementById("observatoryHudName");
  const travelTitle = document.getElementById("observatoryTravelTitle");
  const travelStep = document.getElementById("observatoryTravelStep");
  const travelSubtitle = document.getElementById("observatoryTravelSubtitle");

  if (!experience || !skyCanvas || !objectCanvas || !travelCanvas || !telescope || !status || !openButton || !list || !overlay || !travelOverlay) return;

  const sky = skyCanvas.getContext("2d", { alpha: false });
  const obj = objectCanvas.getContext("2d", { alpha: false });
  const travelCtx = travelCanvas.getContext("2d", { alpha: false });
  if (!sky || !obj || !travelCtx) return;

  const embedded = new URLSearchParams(location.search).get("embedded") === "1";
  if (embedded && back) {
    back.addEventListener("click", (e) => {
      e.preventDefault();
      parent.postMessage({ type: "CELESTIAL_EXPERIENCE_CLOSE" }, location.origin);
    });
  }

  const targets = [
    { id: "moon", name: "The Moon", type: "EARTH'S MOON", symbol: "☾", distance: "384,400 km", light: "1.3 seconds", known: "Craters & maria", poetry: "The nearest world, still beautifully far away.", description: "Permukaannya bertekstur, kawah-kawahnya tampak hidup, dan bayangan di tepi terminator bergerak perlahan seperti malam yang benar-benar tenang. Ini adalah dunia paling dekat, tapi tetap terasa ajaib.", x: 0.82, y: 0.18, accent: [239,220,188], zoom: '14.8x' },
    { id: "mercury", name: "Mercury", type: "INNER ROCKY PLANET", symbol: "☿", distance: "≈91 million km", light: "≈5 minutes", known: "Scarred surface", poetry: "A burnt little world drifting closest to the Sun.", description: "Mercury terlihat kasar dan padat, penuh bekas tabrakan kuno. Permukaannya bergerak lembut dengan heat haze tipis yang memberi rasa seolah kamu benar-benar sedang mengintip dunia berbatu di kejauhan.", x: 0.14, y: 0.52, accent: [219,194,169], zoom: '19.1x' },
    { id: "venus", name: "Venus", type: "CLOUD-WRAPPED PLANET", symbol: "♀", distance: "≈41 million km", light: "≈2.3 minutes", known: "Bright cloud decks", poetry: "A luminous pearl wrapped in restless cloud.", description: "Venus hadir seperti mutiara bercahaya, tertutup lapisan awan tebal berwarna krem keemasan. Awan-awan itu bergerak terus, menciptakan visual yang lebih halus, lembut, dan mewah.", x: 0.08, y: 0.18, accent: [228,204,154], zoom: '15.9x' },
    { id: "mars", name: "Mars", type: "THE RED PLANET", symbol: "♂", distance: "≈225 million km", light: "≈12.5 minutes", known: "Iron-rich surface", poetry: "A rust-colored silence waiting beyond the dark.", description: "Mars kini tampak lebih kaya detail: guratan debu, permukaan kemerahan, dan tudung kutub tipis memberi kesan seperti melihat planet sungguhan yang terus berputar pelan di depan mata.", x: 0.19, y: 0.78, accent: [214,119,91], zoom: '16.7x' },
    { id: "jupiter", name: "Jupiter", type: "GAS GIANT", symbol: "♃", distance: "≈780 million km", light: "≈43 minutes", known: "Bands & Great Red Spot", poetry: "A storm-lit giant holding dozens of small worlds close.", description: "Awan pita Jupiter sekarang bergerak lebih halus dan lebih kaya lapisan. Badai-badainya memutar, red spot-nya hidup, dan bulan-bulan kecil di sekelilingnya memberi rasa skala yang megah dan sinematik.", x: 0.55, y: 0.10, accent: [215,176,137], zoom: '12.7x' },
    { id: "saturn", name: "Saturn", type: "RINGED PLANET", symbol: "♄", distance: "≈1.4 billion km", light: "≈79 minutes", known: "Icy ring system", poetry: "A pale golden world carrying an impossible crown.", description: "Saturn dibuat lebih anggun: ring yang berlapis, berkilau, dan lebih realistis bergerak halus mengelilingi planet. Bayangan ring juga jatuh ke planet, membuatnya terasa jauh lebih indah dan memuaskan.", x: 0.88, y: 0.56, accent: [224,191,145], zoom: '13.4x' },
    { id: "uranus", name: "Uranus", type: "ICE GIANT", symbol: "♅", distance: "≈2.9 billion km", light: "≈2.7 hours", known: "Blue-green atmosphere", poetry: "A quiet teal world suspended in perfect restraint.", description: "Uranus hadir dengan nuansa biru kehijauan yang tenang, dengan pita atmosfer yang sangat lembut. Ia terlihat bersih, dingin, dan sangat elegan — seperti dunia yang nyaris tanpa suara.", x: 0.93, y: 0.28, accent: [159,215,220], zoom: '11.1x' },
    { id: "neptune", name: "Neptune", type: "ICE GIANT", symbol: "♆", distance: "≈4.5 billion km", light: "≈4.2 hours", known: "Deep blue storms", poetry: "A cobalt world where winds never really sleep.", description: "Neptune kini terasa lebih dalam dan hidup: rona kobalt, jalur atmosfer yang bergerak, dan badai gelap yang berputar perlahan membuatnya terasa lebih dekat ke visual planet nyata.", x: 0.54, y: 0.68, accent: [95,146,235], zoom: '11.9x' },
    { id: "pleiades", name: "The Pleiades", type: "OPEN STAR CLUSTER", symbol: "✦", distance: "≈444 light-years", light: "444 years", known: "Seven Sisters", poetry: "A handful of blue stars gathered close in the cold.", description: "Pleiades berkilau seperti perhiasan kecil di langit gelap. Bintang-bintangnya berdenyut lembut di tengah kabut biru yang bergerak pelan, menjadikannya indah untuk dilihat lama-lama.", x: 0.30, y: 0.16, accent: [173,209,238], zoom: '24.0x' },
    { id: "orion", name: "Orion Nebula", type: "STELLAR NURSERY", symbol: "∴", distance: "≈1,344 light-years", light: "1,344 years", known: "Newborn stars", poetry: "A cloud of light where new suns are quietly beginning.", description: "Kabut Orion kini terlihat lebih kaya, seperti lapisan gas berwarna biru-violet yang bernapas pelan. Bintang-bintang lahir di dalamnya, memberi rasa bahwa semesta benar-benar sedang hidup.", x: 0.39, y: 0.39, accent: [201,162,210], zoom: '28.6x' },
    { id: "andromeda", name: "Andromeda Galaxy", type: "SPIRAL GALAXY", symbol: "∞", distance: "≈2.5 million ly", light: "2.5 million years", known: "Nearest major galaxy", poetry: "A whole galaxy arriving as a faint, ancient whisper.", description: "Andromeda berputar sangat lambat, seolah seluruh galaksi dibentangkan di depan mata. Intinya bercahaya, lengannya melebar, dan kedalamannya memberi rasa mewah sekaligus syahdu.", x: 0.72, y: 0.82, accent: [198,182,221], zoom: '32.4x' }
  ];

  let w=1,h=1,dpr=1,ow=1,oh=1,odpr=1,tw=1,th=1,tdpr=1;
  let t=0,last=performance.now(),running=true;
  let stars=[], floaters=[], comets=[], tunnelStars=[];
  let drag=false, dragMoved=false, lastPoint=null;
  let cameraX=0,cameraY=0,targetX=0,targetY=0, velocityX=0, velocityY=0;
  let active=null, locked=null, selectedTarget=null, pendingOpen=null;
  let travelVisible=false, travelStartedAt=0;
  let seed=29072026;

  function rand(){ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }
  function rgba(r,g,b,a){ return `rgba(${r},${g},${b},${a})`; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  function buildStars(){
    seed=29072026;
    stars = Array.from({length: innerWidth <= 700 ? 200 : 340}, () => ({
      x: rand(), y: rand(), size: .35 + rand()*1.65,
      alpha: .18 + rand()*.76, phase: rand()*Math.PI*2,
      twinkle: 1.1 + rand()*3.2, depth: .25 + rand()*.85
    }));
    floaters = Array.from({length: 12}, (_,i) => ({
      x: rand(), y: .06 + rand()*.68, size: 16 + rand()*48, rot: rand()*Math.PI*2,
      speed: .3 + rand()*.7, depth: .2 + rand()*.8, tint: i % 2 ? [88,106,122] : [116,128,141]
    }));
    comets = Array.from({length: 4}, () => ({
      x: rand(), y: .08 + rand()*.5, len: 120 + rand()*90, speed: .08 + rand()*.08, size: 1.5 + rand()*1.8, angle: -.52 - rand()*.35
    }));
  }

  function buildTunnelStars(){
    tunnelStars = Array.from({length: 170}, () => ({ angle: rand()*Math.PI*2, distance: rand(), speed: .4 + rand()*1.7, size: .4 + rand()*2 }));
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
  function resizeTravel(){
    const r = travelCanvas.getBoundingClientRect();
    tw = Math.max(1, r.width); th = Math.max(1, r.height); tdpr = Math.min(devicePixelRatio || 1, 2);
    travelCanvas.width = Math.round(tw*tdpr); travelCanvas.height = Math.round(th*tdpr);
    travelCtx.setTransform(tdpr,0,0,tdpr,0,0);
    buildTunnelStars();
  }

  function pos(o){ return { x: o.x*w + cameraX*.56, y: o.y*h + cameraY*.44 }; }

  function drawBackground(){
    const g = sky.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#040912'); g.addColorStop(.46,'#091323'); g.addColorStop(.74,'#131927'); g.addColorStop(1,'#151722');
    sky.fillStyle = g; sky.fillRect(0,0,w,h);
    const haze = sky.createRadialGradient(w*.66,h*.28,0,w*.66,h*.28,Math.max(w,h)*.72);
    haze.addColorStop(0,'rgba(151,182,194,.065)'); haze.addColorStop(.4,'rgba(113,85,168,.04)'); haze.addColorStop(1,'rgba(151,182,194,0)');
    sky.fillStyle = haze; sky.fillRect(0,0,w,h);
  }

  function drawStars(){
    for (const s of stars){
      const x=((s.x+t*.00004*s.depth)%1)*w + cameraX*s.depth*.28;
      const y=(s.y*h*0.9) + cameraY*s.depth*.2;
      const a=s.alpha*(.62 + Math.sin(t*s.twinkle+s.phase)*.38);
      sky.beginPath(); sky.arc(x,y,s.size,0,Math.PI*2); sky.fillStyle=rgba(225,235,240,Math.max(.05,a)); sky.fill();
    }
  }

  function drawFloaters(){
    for (const f of floaters){
      const x = ((f.x + t*.0007*f.speed)%1)*w + cameraX*f.depth*.18;
      const y = f.y*h + Math.sin(t*.25 + f.x*8)*8 + cameraY*f.depth*.16;
      const s = f.size;
      sky.save(); sky.translate(x,y); sky.rotate(f.rot + t*.05*f.speed);
      sky.beginPath();
      sky.moveTo(-s*.44,-s*.02); sky.quadraticCurveTo(-s*.14,-s*.34,s*.38,-s*.18); sky.quadraticCurveTo(s*.52,s*.02,s*.22,s*.26); sky.quadraticCurveTo(-s*.12,s*.46,-s*.44,-s*.02);
      sky.fillStyle = rgba(f.tint[0], f.tint[1], f.tint[2], .15);
      sky.fill();
      sky.strokeStyle = rgba(188,198,206,.08); sky.lineWidth = 1; sky.stroke();
      sky.restore();
    }
    for (const c of comets){
      const headX = ((c.x + t*.001*c.speed)%1)*w + cameraX*.1;
      const headY = c.y*h + Math.sin(t*.2 + c.x*6)*12;
      const tx = Math.cos(c.angle)*c.len, ty = Math.sin(c.angle)*c.len;
      const grad = sky.createLinearGradient(headX, headY, headX - tx, headY - ty);
      grad.addColorStop(0,'rgba(255,248,235,.85)'); grad.addColorStop(.3,'rgba(192,223,255,.22)'); grad.addColorStop(1,'rgba(192,223,255,0)');
      sky.strokeStyle = grad; sky.lineWidth = c.size; sky.beginPath(); sky.moveTo(headX, headY); sky.lineTo(headX - tx, headY - ty); sky.stroke();
      sky.beginPath(); sky.arc(headX, headY, c.size*1.7, 0, Math.PI*2); sky.fillStyle='rgba(255,251,243,.9)'; sky.fill();
    }
  }

  function drawMarkers(){
    for (const o of targets){
      const p = pos(o), pulse=.65 + Math.sin(t*1.7 + o.x*10)*.35;
      const r = ['moon','jupiter','saturn'].includes(o.id) ? 8 : 5;
      sky.beginPath(); sky.arc(p.x,p.y,r*4,0,Math.PI*2); sky.fillStyle=rgba(o.accent[0],o.accent[1],o.accent[2],.024 + pulse*.03); sky.fill();
      sky.beginPath(); sky.arc(p.x,p.y,r,0,Math.PI*2); sky.fillStyle=rgba(o.accent[0],o.accent[1],o.accent[2],.44 + pulse*.28); sky.fill();
      sky.beginPath(); sky.arc(p.x,p.y,r+11,0,Math.PI*2); sky.strokeStyle=rgba(o.accent[0],o.accent[1],o.accent[2], locked?.id === o.id ? .56 : .08); sky.lineWidth=locked?.id===o.id?1.8:1; sky.stroke();
      if (locked?.id === o.id){
        sky.beginPath(); sky.moveTo(p.x-18,p.y); sky.lineTo(p.x+18,p.y); sky.moveTo(p.x,p.y-18); sky.lineTo(p.x,p.y+18); sky.strokeStyle='rgba(255,248,237,.12)'; sky.lineWidth=1; sky.stroke();
      }
    }
  }

  function drawHorizon(){
    sky.beginPath(); sky.moveTo(0,h); sky.lineTo(0,h*.82);
    sky.bezierCurveTo(w*.14,h*.72,w*.26,h*.86,w*.38,h*.78);
    sky.bezierCurveTo(w*.56,h*.67,w*.72,h*.89,w,h*.74);
    sky.lineTo(w,h); sky.closePath();
    const g = sky.createLinearGradient(0,h*.8,0,h); g.addColorStop(0,'#121723'); g.addColorStop(1,'#04070c'); sky.fillStyle=g; sky.fill();
    // observatory dome
    const x=w*.77,y=h*.9,r=Math.min(w,h)*.14;
    sky.beginPath(); sky.arc(x,y,r,Math.PI,Math.PI*2); sky.lineTo(x+r,h); sky.lineTo(x-r,h); sky.closePath(); sky.fillStyle='#05070b'; sky.fill();
    sky.beginPath(); sky.moveTo(x,y-r); sky.lineTo(x+r*.2,y+r*.1); sky.strokeStyle='rgba(169,201,208,.12)'; sky.lineWidth=2; sky.stroke();
  }

  function updateCamera(dt){
    cameraX += (targetX-cameraX)*Math.min(1,dt*5.2) + velocityX;
    cameraY += (targetY-cameraY)*Math.min(1,dt*5.2) + velocityY;
    velocityX *= .84; velocityY *= .84;
    cameraX = clamp(cameraX,-w*.92,w*.92);
    cameraY = clamp(cameraY,-h*.62,h*.62);
  }

  function setSelectedTarget(target, animate=true){
    selectedTarget = target; active = target; locked = target;
    if (animate){
      targetX = (w*.5 - target.x*w)/.56;
      targetY = (h*.42 - target.y*h)/.44;
    }
    updateStatus(target);
    [...list.querySelectorAll('.observatory-target-button')].forEach(btn => btn.classList.toggle('active', btn.dataset.targetId === target.id));
  }

  function updateStatus(target){
    if (!target){
      openButton.disabled = true;
      openButton.classList.remove('ready');
      openButton.querySelector('span').textContent = 'Observe Through Telescope';
      status.textContent = 'Geser langit atau pilih target dari panel untuk mengunci observasi.';
      return;
    }
    status.textContent = `${target.name} terkunci di observatory. Tekan Observe untuk masuk ke eyepiece.`;
    openButton.disabled = false;
    openButton.classList.add('ready');
    openButton.querySelector('span').textContent = `Observe ${target.name}`;
    if (hudName) hudName.textContent = target.name.toUpperCase();
    if (hudZoom) hudZoom.textContent = target.zoom || '14.0x';
    if (hudFocus) hudFocus.textContent = `FOCUS ${97 + Math.round((target.x+target.y)*1.5)}%`;
  }

  function detectTarget(){
    if (selectedTarget && !drag) {
      const settle = Math.abs(targetX-cameraX) < 8 && Math.abs(targetY-cameraY) < 8;
      if (settle) locked = selectedTarget;
    }
    if (!selectedTarget) {
      const reticle={x:w*.5,y:h*.42};
      let nearest=null, distance=Infinity;
      for (const o of targets){ const p=pos(o), d=Math.hypot(p.x-reticle.x,p.y-reticle.y); if(d<distance){distance=d; nearest=o;} }
      if (nearest && distance <= Math.min(w,h)*.065){ active = locked = nearest; updateStatus(nearest); }
      else { active = null; locked = null; updateStatus(null); }
      [...list.querySelectorAll('.observatory-target-button')].forEach(btn => btn.classList.toggle('active', btn.dataset.targetId === locked?.id));
    }
    const angle = clamp(-11 + cameraY*.035 - cameraX*.018, -22, 8);
    telescope.style.setProperty('--scope-angle', `${angle}deg`);
  }

  function buildTargetList(){
    list.innerHTML='';
    for (const o of targets){
      const b=document.createElement('button'); b.type='button'; b.className='observatory-target-button'; b.dataset.targetId=o.id;
      b.innerHTML=`<span class="observatory-target-symbol">${o.symbol}</span><span class="observatory-target-copy"><strong>${o.name}</strong><small>${o.type}</small></span><b>↗</b>`;
      b.addEventListener('click',()=>setSelectedTarget(o,true));
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
      observatoryHudName:o.name.toUpperCase(),
      observatoryHudZoom:o.zoom || '14.0x',
      observatoryHudFocus:`FOCUS ${97 + Math.round((o.x+o.y)*1.5)}%`
    };
    for(const [id,val] of Object.entries(map)){
      const el=document.getElementById(id); if(el) el.textContent=val;
    }
  }

  function closeLens(){ overlay.hidden=true; }
  function closeTravel(){ travelVisible=false; travelOverlay.hidden=true; }

  function openTravelSequence(){
    const target = selectedTarget || active;
    if(!target) return;
    pendingOpen = target;
    travelVisible = true;
    travelStartedAt = performance.now();
    travelOverlay.hidden = false;
    travelTitle.textContent = `Traveling to ${target.name}`;
    travelStep.textContent = 'ALIGNING THE TELESCOPE';
    travelSubtitle.textContent = 'The camera is moving toward the eyepiece.';
    setTimeout(()=>{ if(!travelVisible) return; travelStep.textContent='ENTERING THE EYEPIECE'; travelSubtitle.textContent='You are being pulled into the dark tube of the telescope.'; }, 450);
    setTimeout(()=>{ if(!travelVisible) return; travelStep.textContent='CROSSING THE COSMIC TUNNEL'; travelSubtitle.textContent='Stars stretch into a dark corridor as the observatory flies toward your target.'; }, 1100);
    setTimeout(()=>{
      if(!travelVisible) return;
      closeTravel();
      syncInfo(target);
      overlay.hidden=false;
      resizeObject();
    }, 1950);
  }

  function randomTarget(open=false){ let next=targets[Math.floor(Math.random()*targets.length)]; while((selectedTarget||active) && targets.length>1 && next.id===(selectedTarget||active).id){ next=targets[Math.floor(Math.random()*targets.length)]; } setSelectedTarget(next,true); if(open) setTimeout(openTravelSequence, 720); }
  function updateClock(){ if(timeElement){ timeElement.textContent = new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); } }

  function travelBackground(){
    const g = travelCtx.createRadialGradient(tw*.5,th*.5,0,tw*.5,th*.5,Math.max(tw,th)*.8);
    g.addColorStop(0,'#081121'); g.addColorStop(.45,'#030711'); g.addColorStop(1,'#000105');
    travelCtx.fillStyle=g; travelCtx.fillRect(0,0,tw,th);
  }

  function renderTravel(){
    if (!travelVisible) return;
    const elapsed = performance.now() - travelStartedAt;
    travelBackground();
    const cx=tw*.5, cy=th*.45;
    const phase = clamp(elapsed/1950,0,1);
    const tunnelDepth = phase < .33 ? 0 : clamp((phase-.25)/.75,0,1);
    // eyepiece circle and telescope silhouette stage
    const entranceR = Math.max(120, Math.min(tw,th)*(.16 + phase*.32));
    const halo = travelCtx.createRadialGradient(cx,cy,entranceR*.12,cx,cy,entranceR*1.9);
    halo.addColorStop(0,'rgba(199,223,245,.18)'); halo.addColorStop(1,'rgba(199,223,245,0)');
    travelCtx.fillStyle=halo; travelCtx.beginPath(); travelCtx.arc(cx,cy,entranceR*1.9,0,Math.PI*2); travelCtx.fill();
    // star tunnel
    travelCtx.save();
    travelCtx.beginPath(); travelCtx.arc(cx,cy,entranceR,0,Math.PI*2); travelCtx.clip();
    for (const s of tunnelStars){
      const dist = (s.distance + tunnelDepth*s.speed*1.8) % 1;
      const sx = cx + Math.cos(s.angle) * dist * entranceR * 1.8;
      const sy = cy + Math.sin(s.angle) * dist * entranceR * 1.8;
      const len = 6 + tunnelDepth*32*s.speed;
      const ex = sx + Math.cos(s.angle) * len;
      const ey = sy + Math.sin(s.angle) * len;
      const grad = travelCtx.createLinearGradient(sx,sy,ex,ey);
      grad.addColorStop(0,'rgba(255,255,255,.8)'); grad.addColorStop(1,'rgba(255,255,255,0)');
      travelCtx.strokeStyle = grad;
      travelCtx.lineWidth = .4 + s.size * (.5 + tunnelDepth*1.4);
      travelCtx.beginPath(); travelCtx.moveTo(sx,sy); travelCtx.lineTo(ex,ey); travelCtx.stroke();
    }
    travelCtx.restore();
    travelCtx.beginPath(); travelCtx.arc(cx,cy,entranceR,0,Math.PI*2); travelCtx.strokeStyle='rgba(255,248,237,.18)'; travelCtx.lineWidth=16; travelCtx.stroke();
    travelCtx.beginPath(); travelCtx.arc(cx,cy,entranceR*.74,0,Math.PI*2); travelCtx.strokeStyle='rgba(169,201,208,.16)'; travelCtx.lineWidth=1; travelCtx.stroke();
    if (phase < .45) {
      const scopeY = th*.78 + Math.sin(elapsed*.004)*4;
      travelCtx.save();
      travelCtx.translate(cx, scopeY); travelCtx.scale(1.3 - phase*.6, 1.3 - phase*.6);
      travelCtx.rotate(-.18);
      travelCtx.fillStyle = 'rgba(37,48,63,.65)';
      travelCtx.fillRect(-150,-24,220,48);
      travelCtx.beginPath(); travelCtx.arc(-150,0,34,0,Math.PI*2); travelCtx.fill();
      travelCtx.fillRect(36,-35,82,18);
      travelCtx.fillRect(-8,34,18,72); travelCtx.fillRect(-24,98,5,90); travelCtx.fillRect(0,98,5,90); travelCtx.fillRect(25,96,5,90);
      travelCtx.restore();
    }
  }

  // -------- realistic renderer --------
  function objectBackground(){
    const g = obj.createRadialGradient(ow*.5,oh*.48,0,ow*.5,oh*.48,Math.max(ow,oh)*.72);
    g.addColorStop(0,'#0c1423'); g.addColorStop(.55,'#040916'); g.addColorStop(1,'#01030a');
    obj.fillStyle=g; obj.fillRect(0,0,ow,oh);
    for(let i=0;i<120;i++){
      const x=((i*83)%997)/997*ow, y=((i*191)%991)/991*oh;
      obj.beginPath(); obj.arc(x,y,i%11===0?1.35:.65,0,Math.PI*2);
      obj.fillStyle=rgba(228,236,242,.03 + (i%7)*.02); obj.fill();
    }
  }

  function drawLensArtifacts(){
    for (let i=0;i<24;i++){
      const x=(Math.sin(t*.22 + i*1.31)*.44 + .5)*ow;
      const y=(Math.cos(t*.17 + i*1.71)*.44 + .5)*oh;
      const r=(i%4+1)*.9;
      const g=obj.createRadialGradient(x,y,0,x,y,r*7);
      g.addColorStop(0,'rgba(255,255,255,.04)'); g.addColorStop(1,'rgba(255,255,255,0)');
      obj.fillStyle=g; obj.beginPath(); obj.arc(x,y,r*7,0,Math.PI*2); obj.fill();
    }
    obj.fillStyle='rgba(255,255,255,.018)';
    for (let y=0;y<oh;y+=4){ obj.fillRect(0,y,ow,1); }
    obj.strokeStyle='rgba(169,201,208,.08)'; obj.lineWidth=2;
    obj.beginPath(); obj.arc(ow*.5, oh*.5, Math.min(ow,oh)*(.34 + Math.sin(t*2.2)*.005), 0, Math.PI*2); obj.stroke();
  }

  function sphereLighting(x,y,r, shadow=.16, rim='rgba(255,255,255,.15)'){
    const shade=obj.createRadialGradient(x-r*.35,y-r*.38,r*.04,x,y,r);
    shade.addColorStop(0,'rgba(255,255,255,.22)');
    shade.addColorStop(.58,'rgba(255,255,255,0)');
    shade.addColorStop(1,'rgba(0,0,0,.42)');
    obj.fillStyle=shade; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    obj.strokeStyle = rim; obj.lineWidth = Math.max(1, r*.014); obj.beginPath(); obj.arc(x,y,r-.7,0,Math.PI*2); obj.stroke();
    obj.save(); obj.globalCompositeOperation='multiply';
    obj.fillStyle=`rgba(16,16,22,${shadow})`; obj.beginPath(); obj.ellipse(x+r*.34, y, r*.74, r*.98, 0, 0, Math.PI*2); obj.fill(); obj.restore();
  }
  function sphereClip(x,y,r, draw){ obj.save(); obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.clip(); draw(); obj.restore(); }
  function noisySpeckles(x,y,r,count,color,scale=1){ for(let i=0;i<count;i++){ const a=(i/count)*Math.PI*2 + t*.03; const rr=r*(.1 + ((i*37)%count)/count*.9)*scale; const px=x+Math.cos(a)*rr*.75, py=y+Math.sin(a*1.31)*rr*.55; const pr=(.01 + (i%5)*.007)*r; obj.beginPath(); obj.arc(px,py,pr,0,Math.PI*2); obj.fillStyle=color; obj.fill(); } }

  function drawMoon(){
    const r=Math.min(ow,oh)*.31, x=ow*.5, y=oh*.5;
    const halo=obj.createRadialGradient(x,y,r*.2,x,y,r*1.8); halo.addColorStop(0,'rgba(255,239,206,.18)'); halo.addColorStop(1,'rgba(255,239,206,0)'); obj.fillStyle=halo; obj.beginPath(); obj.arc(x,y,r*1.8,0,Math.PI*2); obj.fill();
    const base=obj.createRadialGradient(x-r*.36,y-r*.33,r*.06,x,y,r); base.addColorStop(0,'#fff6e0'); base.addColorStop(.52,'#d0bda3'); base.addColorStop(1,'#7a6b69'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ noisySpeckles(x,y,r,30,'rgba(104,95,99,.12)',.9); [[-.35,-.16,.12],[.18,-.26,.09],[.26,.10,.15],[-.08,.28,.11],[0,.04,.18],[-.31,.17,.08]].forEach(c=>{obj.beginPath(); obj.arc(x+c[0]*r,y+c[1]*r,c[2]*r,0,Math.PI*2); obj.fillStyle='rgba(92,82,92,.16)'; obj.fill();}); obj.fillStyle='rgba(255,255,255,.04)'; obj.fillRect(x-r,y-r,r*.6,r*2); });
    sphereLighting(x,y,r,.14,'rgba(255,255,255,.12)');
  }

  function drawMercury(){
    const r=Math.min(ow,oh)*.24, x=ow*.5, y=oh*.5;
    const base=obj.createRadialGradient(x-r*.34,y-r*.31,r*.03,x,y,r); base.addColorStop(0,'#f6ead5'); base.addColorStop(.46,'#c5b19a'); base.addColorStop(.8,'#8b786d'); base.addColorStop(1,'#473e44'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ for(let i=0;i<18;i++){ const ang=i*1.3; const rr=r*(.18 + (i%7)*.11); const px=x+Math.cos(ang+t*.03)*rr*.75, py=y+Math.sin(ang*1.18+t*.02)*rr*.52, cr=(.04 + (i%4)*.012)*r; obj.beginPath(); obj.arc(px,py,cr,0,Math.PI*2); obj.fillStyle='rgba(84,71,65,.20)'; obj.fill(); obj.beginPath(); obj.arc(px-cr*.2,py-cr*.15,cr*.55,0,Math.PI*2); obj.fillStyle='rgba(238,218,196,.09)'; obj.fill(); } noisySpeckles(x,y,r,40,'rgba(235,219,200,.05)'); });
    sphereLighting(x,y,r,.18,'rgba(255,255,255,.10)');
  }

  function drawVenus(){
    const r=Math.min(ow,oh)*.26, x=ow*.5, y=oh*.5;
    const base=obj.createRadialGradient(x-r*.4,y-r*.34,r*.02,x,y,r); base.addColorStop(0,'#fff7d8'); base.addColorStop(.45,'#edd09c'); base.addColorStop(.82,'#b7874d'); base.addColorStop(1,'#5f4c4f'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ for(let i=-7;i<=7;i++){ const yy=y + i*r*.12 + Math.sin(t*.5 + i)*r*.05; obj.fillStyle = i%2===0 ? 'rgba(255,238,192,.18)' : 'rgba(184,135,82,.12)'; obj.beginPath(); obj.ellipse(x + Math.sin(t*.34 + i)*r*.05, yy, r*.98, r*.085, Math.sin(t*.08+i)*.2, 0, Math.PI*2); obj.fill(); } for(let j=0;j<4;j++){ obj.beginPath(); obj.ellipse(x+Math.sin(t*.28+j)*r*.14, y+Math.cos(t*.24+j)*r*.14, r*.48, r*.16, j*.6, 0, Math.PI*2); obj.fillStyle='rgba(255,246,219,.06)'; obj.fill(); } });
    sphereLighting(x,y,r,.13,'rgba(255,255,255,.18)');
  }

  function drawMars(){
    const r=Math.min(ow,oh)*.25, x=ow*.5, y=oh*.5;
    const base=obj.createRadialGradient(x-r*.35,y-r*.32,r*.03,x,y,r); base.addColorStop(0,'#f4be8e'); base.addColorStop(.45,'#cd6b52'); base.addColorStop(.8,'#833b3c'); base.addColorStop(1,'#442d39'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ [[-.33,-.18,.18,.09],[.25,-.27,.18,.09],[.2,.22,.29,.12],[-.18,.32,.15,.08],[.02,-.02,.16,.06]].forEach(m=>{obj.beginPath(); obj.ellipse(x+m[0]*r,y+m[1]*r,m[2]*r,m[3]*r,.2,0,Math.PI*2); obj.fillStyle='rgba(103,46,48,.28)'; obj.fill();}); noisySpeckles(x,y,r,30,'rgba(255,196,150,.06)'); obj.beginPath(); obj.arc(x-r*.12,y-r*.72,r*.12,0,Math.PI*2); obj.fillStyle='rgba(255,244,224,.55)'; obj.fill(); obj.beginPath(); obj.arc(x+r*.06,y+r*.74,r*.08,0,Math.PI*2); obj.fillStyle='rgba(255,244,224,.22)'; obj.fill(); for(let i=0;i<5;i++){ const dx=Math.sin(t*.25+i*1.3)*r*.28,dy=Math.cos(t*.2+i*1.1)*r*.12; const g=obj.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r*.33); g.addColorStop(0,'rgba(244,202,145,.07)'); g.addColorStop(1,'rgba(244,202,145,0)'); obj.fillStyle=g; obj.beginPath(); obj.arc(x+dx,y+dy,r*.33,0,Math.PI*2); obj.fill(); }});
    sphereLighting(x,y,r,.12,'rgba(255,255,255,.12)');
  }

  function drawJupiter(){
    const r=Math.min(ow,oh)*.27, x=ow*.5, y=oh*.5;
    const halo=obj.createRadialGradient(x,y,r*.12,x,y,r*1.6); halo.addColorStop(0,'rgba(232,201,170,.12)'); halo.addColorStop(1,'rgba(232,201,170,0)'); obj.fillStyle=halo; obj.beginPath(); obj.arc(x,y,r*1.6,0,Math.PI*2); obj.fill();
    const base=obj.createRadialGradient(x-r*.32,y-r*.33,r*.03,x,y,r); base.addColorStop(0,'#f9e6c6'); base.addColorStop(.46,'#d9b68f'); base.addColorStop(.84,'#8b756e'); base.addColorStop(1,'#41353d'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ const bands=['rgba(242,224,194,.75)','rgba(198,157,127,.75)','rgba(240,214,181,.68)','rgba(163,122,101,.68)','rgba(235,198,166,.72)','rgba(189,146,121,.66)','rgba(247,229,201,.66)']; for(let i=-12;i<=12;i++){ const bandH=r*.085*(1+.15*Math.sin(t*.2+i)); const yy=y+i*r*.08+Math.sin(t*.55 + i*.7)*r*.028; obj.fillStyle=bands[(i+bands.length*10)%bands.length]; obj.beginPath(); obj.moveTo(x-r,yy-bandH*.5); for(let xx=-r; xx<=r; xx+=5){ const wiggle=Math.sin((xx/r)*2.4 + t*.42 + i*.8)*r*.012 + Math.sin((xx/r)*8 + i)*r*.004; obj.lineTo(x+xx, yy+wiggle-bandH*.5); } for(let xx=r; xx>=-r; xx-=5){ const wiggle=Math.sin((xx/r)*2.4 + t*.42 + i*.8)*r*.012 + Math.sin((xx/r)*8 + i)*r*.004; obj.lineTo(x+xx, yy+wiggle+bandH*.5); } obj.closePath(); obj.fill(); } for(let i=0;i<5;i++){ const cx=x + Math.sin(t*.14+i)*r*.22 - r*.12; const cy=y + Math.cos(t*.1+i*.7)*r*.12 + (i-2)*r*.1; obj.beginPath(); obj.ellipse(cx,cy,r*(.14 + (i%3)*.03),r*(.03 + (i%2)*.01),-.15,0,Math.PI*2); obj.fillStyle='rgba(255,255,255,.06)'; obj.fill(); } const spotX=x+r*.38+Math.sin(t*.18)*r*.02; obj.beginPath(); obj.ellipse(spotX, y+r*.18, r*.22, r*.10, -.15, 0, Math.PI*2); obj.fillStyle='rgba(193,107,93,.88)'; obj.fill(); obj.beginPath(); obj.ellipse(spotX-r*.02, y+r*.18, r*.13, r*.05, -.15, 0, Math.PI*2); obj.fillStyle='rgba(218,148,132,.36)'; obj.fill(); });
    sphereLighting(x,y,r,.14,'rgba(255,255,255,.14)');
    [[-1.88, 0],[-1.52,-.03],[1.58,-.02],[1.92,.01]].forEach((m,i)=>{ const mx=x + m[0]*r + Math.sin(t*.08+i)*2.2, my=y + m[1]*r + (i-1.5)*5; obj.beginPath(); obj.arc(mx,my,3.1+i*.4,0,Math.PI*2); obj.fillStyle='rgba(238,223,194,.88)'; obj.fill(); });
  }

  function drawSaturn(){
    const r=Math.min(ow,oh)*.2, x=ow*.5, y=oh*.5;
    const ringRot = -.28 + Math.sin(t*.05)*.02;
    obj.save(); obj.translate(x,y); obj.rotate(ringRot);
    for(let i=0;i<20;i++){
      const rr = r*(1.5 + i*.045);
      obj.beginPath(); obj.ellipse(0,0,rr*1.18,rr*.3,0,0,Math.PI*2);
      obj.strokeStyle = i<3 ? 'rgba(255,226,180,.05)' : i%2===0 ? 'rgba(239,218,185,.18)' : 'rgba(164,149,134,.09)';
      obj.lineWidth = i<5 ? 2.8 : 1.2;
      obj.stroke();
    }
    obj.restore();
    const base=obj.createRadialGradient(x-r*.36,y-r*.34,r*.02,x,y,r); base.addColorStop(0,'#f6e0aa'); base.addColorStop(.42,'#d0a678'); base.addColorStop(.82,'#84646b'); base.addColorStop(1,'#4a3946'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ for(let i=-6;i<=6;i++){ const yy=y + i*r*.14 + Math.sin(t*.3+i)*r*.01; obj.fillStyle=i%2===0?'rgba(255,235,196,.12)':'rgba(184,148,119,.14)'; obj.fillRect(x-r, yy, r*2, r*.08); } obj.save(); obj.translate(x,y); obj.rotate(ringRot); obj.strokeStyle='rgba(32,22,34,.2)'; obj.lineWidth=r*.23; obj.beginPath(); obj.ellipse(0,0,r*1.95,r*.34,0,0,Math.PI*2); obj.stroke(); obj.restore(); });
    sphereLighting(x,y,r,.12,'rgba(255,255,255,.16)');
    obj.save(); obj.translate(x,y); obj.rotate(ringRot); obj.beginPath(); obj.ellipse(0,0,r*1.9,r*.29,0,0,Math.PI*2); obj.strokeStyle='rgba(255,238,206,.55)'; obj.lineWidth=r*.085; obj.stroke(); for(let i=0;i<70;i++){ const ang=(i/70)*Math.PI*2+t*.18; const rr=r*(1.52+(i%9)*.05); const px=Math.cos(ang)*rr*1.15; const py=Math.sin(ang)*rr*.29; obj.fillStyle=`rgba(255,231,190,${.02 + (i%6)*.015})`; obj.fillRect(px,py,1.6,1.6); } obj.restore();
  }

  function drawUranus(){
    const r=Math.min(ow,oh)*.24, x=ow*.5, y=oh*.5;
    const base=obj.createRadialGradient(x-r*.35,y-r*.34,r*.02,x,y,r); base.addColorStop(0,'#e2fdff'); base.addColorStop(.46,'#a3e7ee'); base.addColorStop(.82,'#63bac3'); base.addColorStop(1,'#4b6a78'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ for(let i=-5;i<=5;i++){ obj.fillStyle=i%2===0?'rgba(255,255,255,.07)':'rgba(126,214,223,.08)'; obj.beginPath(); obj.ellipse(x+Math.sin(t*.24+i)*r*.03, y+i*r*.16, r*.98, r*.08, .02,0,Math.PI*2); obj.fill(); } });
    sphereLighting(x,y,r,.1,'rgba(255,255,255,.18)');
  }

  function drawNeptune(){
    const r=Math.min(ow,oh)*.24, x=ow*.5, y=oh*.5;
    const base=obj.createRadialGradient(x-r*.33,y-r*.34,r*.02,x,y,r); base.addColorStop(0,'#b9ddff'); base.addColorStop(.44,'#5f94ee'); base.addColorStop(.82,'#2452af'); base.addColorStop(1,'#24335f'); obj.fillStyle=base; obj.beginPath(); obj.arc(x,y,r,0,Math.PI*2); obj.fill();
    sphereClip(x,y,r, ()=>{ for(let i=-4;i<=4;i++){ obj.fillStyle=i%2===0?'rgba(188,218,255,.08)':'rgba(74,109,209,.10)'; obj.beginPath(); obj.ellipse(x+Math.sin(t*.32+i)*r*.05, y+i*r*.17 + Math.cos(t*.42+i)*r*.01, r*.96, r*.085, .04,0,Math.PI*2); obj.fill(); } obj.beginPath(); obj.ellipse(x+r*.24+Math.sin(t*.2)*r*.03, y-r*.04, r*.16, r*.11, -.35,0,Math.PI*2); obj.fillStyle='rgba(31,66,156,.36)'; obj.fill(); });
    sphereLighting(x,y,r,.11,'rgba(255,255,255,.17)');
  }

  function drawPleiades(){
    const cx=ow*.5, cy=oh*.5, scale=Math.min(ow,oh)*.62;
    obj.save(); obj.globalCompositeOperation='screen';
    for(let cloud=0; cloud<5; cloud++){
      const x=cx + (cloud-2)*scale*.1; const y=cy + Math.sin(t*.2+cloud)*scale*.06;
      const g=obj.createRadialGradient(x,y,0,x,y,scale*.25); g.addColorStop(0,'rgba(123,177,222,.11)'); g.addColorStop(1,'rgba(123,177,222,0)'); obj.fillStyle=g; obj.beginPath(); obj.arc(x,y,scale*.25,0,Math.PI*2); obj.fill();
    }
    [[-.22,-.05,4.8],[-.08,-.18,5.7],[.10,-.14,4.5],[.22,.02,5.3],[.04,.10,4],[-.13,.15,3.8],[.16,.20,3.4]].forEach((s,i)=>{ const x=cx+s[0]*scale + Math.sin(t*(.8+i*.05)+i)*1.2; const y=cy+s[1]*scale + Math.cos(t*(.7+i*.07)+i)*1.2; const glow=obj.createRadialGradient(x,y,0,x,y,s[2]*8); glow.addColorStop(0,'rgba(231,244,255,.98)'); glow.addColorStop(.18,'rgba(168,211,244,.46)'); glow.addColorStop(1,'rgba(168,211,244,0)'); obj.fillStyle=glow; obj.beginPath(); obj.arc(x,y,s[2]*8,0,Math.PI*2); obj.fill(); });
    obj.restore();
  }

  function drawOrion(){
    const cx=ow*.5, cy=oh*.5;
    obj.save(); obj.translate(cx,cy); obj.rotate(-.22 + Math.sin(t*.04)*.01); obj.globalCompositeOperation='screen';
    for(let layer=0; layer<10; layer++){
      const r=Math.min(ow,oh)*(.1 + layer*.03);
      const g=obj.createRadialGradient(0,0,0,0,0,r);
      g.addColorStop(0,layer%2?'rgba(221,180,221,.17)':'rgba(128,176,215,.17)'); g.addColorStop(.55,layer%2?'rgba(177,116,181,.07)':'rgba(105,145,194,.06)'); g.addColorStop(1,'rgba(111,145,194,0)');
      obj.fillStyle=g; obj.beginPath(); obj.ellipse((layer-4.5)*8,Math.sin(t*.22+layer)*12,r*1.24,r*.62,layer*.22,0,Math.PI*2); obj.fill();
    }
    obj.restore();
    [[-18,-8],[7,4],[22,-13],[1,19],[-5,-23]].forEach((p,i)=>{ const x=cx+p[0]+Math.sin(t*.9+i)*.6,y=cy+p[1]+Math.cos(t*.75+i)*.6; obj.beginPath(); obj.arc(x,y,2.2+i*.2,0,Math.PI*2); obj.fillStyle='rgba(240,244,255,.9)'; obj.fill(); });
  }

  function drawAndromeda(){
    const cx=ow*.5, cy=oh*.5;
    obj.save(); obj.translate(cx,cy); obj.rotate(-.30 + t*.02); obj.globalCompositeOperation='screen';
    for(let layer=0; layer<12; layer++){
      const a=Math.min(ow,oh)*(.13 + layer*.024), b=a*(.17 + layer*.008); const g=obj.createRadialGradient(0,0,0,0,0,a); g.addColorStop(0, layer<2 ? 'rgba(255,237,207,.24)' : 'rgba(186,174,218,.075)'); g.addColorStop(.62,'rgba(143,137,193,.045)'); g.addColorStop(1,'rgba(143,137,193,0)'); obj.fillStyle=g; obj.beginPath(); obj.ellipse(0,0,a,b,0,0,Math.PI*2); obj.fill(); }
    obj.restore();
    const n=obj.createRadialGradient(cx,cy,0,cx,cy,Math.min(ow,oh)*.08); n.addColorStop(0,'rgba(255,246,219,.95)'); n.addColorStop(.36,'rgba(232,213,194,.36)'); n.addColorStop(1,'rgba(232,213,194,0)'); obj.fillStyle=n; obj.beginPath(); obj.arc(cx,cy,Math.min(ow,oh)*.08,0,Math.PI*2); obj.fill();
  }

  function renderObject(){
    if ((overlay.hidden && !travelVisible) || !pendingOpen && overlay.hidden && !selectedTarget && !active) return;
    const target = pendingOpen || selectedTarget || active;
    if (!target || overlay.hidden) return;
    objectBackground();
    switch(target.id){
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
    if (e.target.closest('a,button,.observatory-target-dock,.observatory-lens-overlay,.observatory-travel-overlay')) return;
    drag=true; dragMoved=false; lastPoint={x:e.clientX,y:e.clientY}; experience.classList.add('dragging'); try{ experience.setPointerCapture(e.pointerId);}catch(_){}
  });
  experience.addEventListener('pointermove',(e)=>{
    if(!drag || !lastPoint) return;
    const dx = e.clientX-lastPoint.x; const dy = e.clientY-lastPoint.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved=true;
    targetX += dx*3.15; targetY += dy*2.65;
    velocityX = dx*.16; velocityY = dy*.12;
    selectedTarget = null;
    lastPoint={x:e.clientX,y:e.clientY};
  });
  function endDrag(e){ drag=false; lastPoint=null; experience.classList.remove('dragging'); if (!selectedTarget) updateStatus(locked); try{ experience.releasePointerCapture(e.pointerId);}catch(_){} }
  experience.addEventListener('pointerup', endDrag); experience.addEventListener('pointercancel', endDrag);

  randomButton.addEventListener('click',()=>randomTarget(true));
  openButton.addEventListener('click', openTravelSequence);
  document.getElementById('observatoryNextObject')?.addEventListener('click', ()=>randomTarget(true));
  document.addEventListener('click',(e)=>{ if(e.target.matches('[data-close-lens]')) closeLens(); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ if (!overlay.hidden) closeLens(); else if (travelVisible) closeTravel(); } if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){ selectedTarget = null; if(e.key==='ArrowLeft') targetX += 50; if(e.key==='ArrowRight') targetX -= 50; if(e.key==='ArrowUp') targetY += 42; if(e.key==='ArrowDown') targetY -= 42; } });
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; last=performance.now(); });
  let resizeTimer; addEventListener('resize',()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{ resizeSky(); resizeTravel(); if(!overlay.hidden) resizeObject(); },120); });

  function loop(now){
    const dt=Math.min(.05, Math.max(0,(now-last)/1000)); last=now;
    if(running){ t+=dt; updateCamera(dt); drawBackground(); drawStars(); drawFloaters(); drawMarkers(); drawHorizon(); detectTarget(); renderTravel(); renderObject(); }
    requestAnimationFrame(loop);
  }

  buildTargetList(); resizeSky(); resizeTravel(); updateClock(); setInterval(updateClock, 30000); updateStatus(null); requestAnimationFrame(loop);
})();
