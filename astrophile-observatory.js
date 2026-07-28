// ==========================================================
// ASTROPHILE'S OBSERVATORY V1
// Interactive telescope + seven generated celestial targets.
// ==========================================================

(function () {
    const experience=document.getElementById("observatoryExperience");
    const skyCanvas=document.getElementById("observatorySkyCanvas");
    const objectCanvas=document.getElementById("observatoryObjectCanvas");
    const telescope=document.getElementById("observatoryTelescope");
    const status=document.getElementById("observatoryTargetStatus");
    const openButton=document.getElementById("observatoryOpenLens");
    const randomButton=document.getElementById("observatoryRandomTarget");
    const list=document.getElementById("observatoryTargetList");
    const overlay=document.getElementById("observatoryLensOverlay");
    const back=document.getElementById("observatoryBack");
    const timeElement=document.getElementById("observatoryLocalTime");

    if(!experience||!skyCanvas||!objectCanvas||!telescope||!status||!openButton||!list||!overlay)return;
    const sky=skyCanvas.getContext("2d",{alpha:false});
    const obj=objectCanvas.getContext("2d",{alpha:false});
    if(!sky||!obj)return;

    const embedded=new URLSearchParams(location.search).get("embedded")==="1";
    if(embedded&&back)back.addEventListener("click",e=>{
        e.preventDefault();
        parent.postMessage({type:"CELESTIAL_EXPERIENCE_CLOSE"},location.origin);
    });

    const objects=[
        {id:"moon",name:"The Moon",type:"EARTH'S MOON",symbol:"☾",distance:"384,400 km",light:"1.3 seconds",known:"Craters & maria",poetry:"The nearest world, still beautifully far away.",description:"The Moon is the only world beyond Earth where humans have walked. Its bright highlands and darker maria preserve a long history of impacts and ancient volcanic plains.",x:.73,y:.25,color:[239,220,188]},
        {id:"saturn",name:"Saturn",type:"RINGED PLANET",symbol:"♄",distance:"≈1.4 billion km",light:"≈79 minutes",known:"Icy ring system",poetry:"A pale golden world carrying an impossible crown.",description:"Saturn's broad rings are made of countless pieces of ice and rock. Through a telescope, its quiet shape can feel unreal even when you know it is truly there.",x:.84,y:.39,color:[224,191,145]},
        {id:"jupiter",name:"Jupiter",type:"GAS GIANT",symbol:"♃",distance:"≈780 million km",light:"≈43 minutes",known:"Bands & Great Red Spot",poetry:"A storm-lit giant holding dozens of small worlds close.",description:"Jupiter is the largest planet in the Solar System. Its cloud bands move in opposing directions, while the Great Red Spot is a storm larger than Earth.",x:.59,y:.31,color:[215,176,137]},
        {id:"mars",name:"Mars",type:"THE RED PLANET",symbol:"♂",distance:"≈225 million km",light:"≈12.5 minutes",known:"Iron-rich surface",poetry:"A rust-colored silence waiting beyond the dark.",description:"Mars appears red because iron minerals in its soil oxidized. It holds the largest volcano and one of the largest canyon systems known in the Solar System.",x:.42,y:.22,color:[214,119,91]},
        {id:"pleiades",name:"The Pleiades",type:"OPEN STAR CLUSTER",symbol:"✦",distance:"≈444 light-years",light:"444 years",known:"Seven Sisters",poetry:"A handful of blue stars gathered close in the cold.",description:"The Pleiades is a young open cluster containing hundreds of stars. Its brightest members appear as a delicate group visible even without a telescope.",x:.28,y:.29,color:[173,209,238]},
        {id:"orion",name:"Orion Nebula",type:"STELLAR NURSERY",symbol:"∴",distance:"≈1,344 light-years",light:"1,344 years",known:"Newborn stars",poetry:"A cloud of light where new suns are quietly beginning.",description:"The Orion Nebula is a vast region of gas and dust where stars are forming. In a telescope it can appear like a pale glowing wing suspended in darkness.",x:.35,y:.46,color:[201,162,210]},
        {id:"andromeda",name:"Andromeda Galaxy",type:"SPIRAL GALAXY",symbol:"∞",distance:"≈2.5 million ly",light:"2.5 million years",known:"Nearest major galaxy",poetry:"A whole galaxy arriving as a faint, ancient whisper.",description:"Andromeda is the nearest major galaxy to the Milky Way. The light reaching us tonight began its journey long before modern humans existed.",x:.18,y:.18,color:[198,182,221]}
    ];

    let w=1,h=1,dpr=1,ow=1,oh=1,odpr=1,t=0,last=performance.now(),running=true;
    let stars=[],cameraX=0,cameraY=0,targetX=0,targetY=0,drag=false,lastPoint=null,active=null,locked=null;
    let seed=19072026;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    const rgba=(r,g,b,a)=>`rgba(${r},${g},${b},${a})`;

    function buildStars(){
        seed=19072026;
        stars=Array.from({length:innerWidth<=700?155:285},()=>({
            x:rand(),y:.01+rand()*.75,size:.35+rand()*1.55,
            alpha:.18+rand()*.74,phase:rand()*Math.PI*2,twinkle:1.1+rand()*3.1,depth:.25+rand()*.75
        }));
    }

    function resizeSky(){
        const r=skyCanvas.getBoundingClientRect();
        w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);
        skyCanvas.width=Math.round(w*dpr);skyCanvas.height=Math.round(h*dpr);
        sky.setTransform(dpr,0,0,dpr,0,0);buildStars();
    }

    function resizeObject(){
        const r=objectCanvas.getBoundingClientRect();
        ow=Math.max(1,r.width);oh=Math.max(1,r.height);odpr=Math.min(devicePixelRatio||1,2);
        objectCanvas.width=Math.round(ow*odpr);objectCanvas.height=Math.round(oh*odpr);
        obj.setTransform(odpr,0,0,odpr,0,0);
    }

    const position=o=>({x:o.x*w+cameraX*.46,y:o.y*h+cameraY*.36});

    function background(){
        const g=sky.createLinearGradient(0,0,0,h);
        g.addColorStop(0,"#06101a");g.addColorStop(.45,"#0e1928");g.addColorStop(.73,"#171d2a");g.addColorStop(1,"#151621");
        sky.fillStyle=g;sky.fillRect(0,0,w,h);
        const haze=sky.createRadialGradient(w*.68,h*.28,0,w*.68,h*.28,Math.max(w,h)*.6);
        haze.addColorStop(0,"rgba(151,182,194,.055)");haze.addColorStop(1,"rgba(151,182,194,0)");
        sky.fillStyle=haze;sky.fillRect(0,0,w,h);
    }

    function starfield(){
        stars.forEach(s=>{
            const x=((s.x+t*.00008)%1)*w+cameraX*s.depth*.22;
            const y=s.y*h+cameraY*s.depth*.18;
            const a=s.alpha*(.62+Math.sin(t*s.twinkle+s.phase)*.38);
            sky.beginPath();sky.arc(x,y,s.size,0,Math.PI*2);sky.fillStyle=rgba(225,235,240,Math.max(.05,a));sky.fill();
        });
    }

    function markers(){
        objects.forEach(o=>{
            const p=position(o),pulse=.65+Math.sin(t*1.8+o.x*10)*.35;
            const r=o.id==="moon"?12:["saturn","jupiter"].includes(o.id)?7:4;
            sky.beginPath();sky.arc(p.x,p.y,r*3.2,0,Math.PI*2);sky.fillStyle=rgba(...o.color,.025+pulse*.025);sky.fill();
            sky.beginPath();sky.arc(p.x,p.y,r,0,Math.PI*2);sky.fillStyle=rgba(...o.color,.44+pulse*.28);sky.fill();
            sky.beginPath();sky.arc(p.x,p.y,r+8,0,Math.PI*2);
            sky.strokeStyle=rgba(...o.color,locked?.id===o.id?.48:.1);sky.lineWidth=locked?.id===o.id?1.5:1;sky.stroke();
        });
    }

    function horizon(){
        sky.beginPath();sky.moveTo(0,h);sky.lineTo(0,h*.8);
        sky.bezierCurveTo(w*.15,h*.73,w*.28,h*.84,w*.42,h*.76);
        sky.bezierCurveTo(w*.61,h*.67,w*.76,h*.87,w,h*.74);
        sky.lineTo(w,h);sky.closePath();
        const g=sky.createLinearGradient(0,h*.8,0,h);g.addColorStop(0,"#131722");g.addColorStop(1,"#05070c");
        sky.fillStyle=g;sky.fill();
        const x=w*.72,y=h*.88,r=Math.min(w,h)*.11;
        sky.beginPath();sky.arc(x,y,r,Math.PI,Math.PI*2);sky.lineTo(x+r,h);sky.lineTo(x-r,h);sky.closePath();
        sky.fillStyle="#05070b";sky.fill();
        sky.beginPath();sky.moveTo(x,y-r);sky.lineTo(x+r*.18,y+r*.1);sky.strokeStyle="rgba(169,201,208,.12)";sky.lineWidth=2;sky.stroke();
    }

    function updateCamera(dt){
        cameraX+=(targetX-cameraX)*Math.min(1,dt*3.1);
        cameraY+=(targetY-cameraY)*Math.min(1,dt*3.1);
        cameraX=Math.max(-w*.58,Math.min(w*.58,cameraX));
        cameraY=Math.max(-h*.34,Math.min(h*.34,cameraY));
    }

    function lock(o,animate=true){
        locked=active=o;
        if(animate){
            targetX=(w*.5-o.x*w)/.46;
            targetY=(h*.46-o.y*h)/.36;
        }
        status.textContent=`${o.name} is inside the telescope's field.`;
        openButton.disabled=false;openButton.classList.add("ready");
        openButton.querySelector("span").textContent=`Observe ${o.name}`;
        [...list.querySelectorAll(".observatory-target-button")].forEach(b=>b.classList.toggle("active",b.dataset.targetId===o.id));
    }

    function detect(){
        const reticle={x:w*.5,y:h*.46};let nearest=null,distance=Infinity;
        objects.forEach(o=>{const p=position(o),d=Math.hypot(p.x-reticle.x,p.y-reticle.y);if(d<distance){distance=d;nearest=o}});
        if(nearest&&distance<=Math.min(w,h)*.075)lock(nearest,false);
        else if(!active){locked=null;openButton.disabled=true;openButton.classList.remove("ready");status.textContent="Move the telescope toward a celestial marker."}
        const angle=Math.max(-26,Math.min(6,-14+cameraY*.04-cameraX*.025));
        telescope.style.setProperty("--scope-angle",`${angle}deg`);
    }

    function render(dt){
        updateCamera(dt);background();starfield();markers();horizon();detect();
    }

    function buildList(){
        objects.forEach(o=>{
            const b=document.createElement("button");
            b.type="button";b.className="observatory-target-button";b.dataset.targetId=o.id;
            b.innerHTML=`<span class="observatory-target-symbol">${o.symbol}</span><span class="observatory-target-copy"><strong>${o.name}</strong><small>${o.type}</small></span><b>↗</b>`;
            b.addEventListener("click",()=>lock(o,true));list.appendChild(b);
        });
    }

    function objectBackground(){
        const g=obj.createRadialGradient(ow*.5,oh*.48,0,ow*.5,oh*.48,Math.max(ow,oh)*.72);
        g.addColorStop(0,"#0c1423");g.addColorStop(.55,"#040916");g.addColorStop(1,"#01030a");
        obj.fillStyle=g;obj.fillRect(0,0,ow,oh);
        for(let i=0;i<75;i++){
            const x=((i*83)%997)/997*ow,y=((i*191)%991)/991*oh;
            obj.beginPath();obj.arc(x,y,i%9===0?1.25:.65,0,Math.PI*2);obj.fillStyle=rgba(228,236,242,.12+(i%7)*.055);obj.fill();
        }
    }

    function moon(){
        const r=Math.min(ow,oh)*.29,x=ow*.5+Math.sin(t*.2)*3,y=oh*.5;
        const halo=obj.createRadialGradient(x,y,r*.1,x,y,r*1.75);halo.addColorStop(0,"rgba(255,239,206,.2)");halo.addColorStop(1,"rgba(255,239,206,0)");
        obj.fillStyle=halo;obj.beginPath();obj.arc(x,y,r*1.75,0,Math.PI*2);obj.fill();
        const s=obj.createRadialGradient(x-r*.34,y-r*.33,r*.03,x,y,r);s.addColorStop(0,"#fff9e8");s.addColorStop(.4,"#e9d6b7");s.addColorStop(.78,"#ad947d");s.addColorStop(1,"#655b64");
        obj.fillStyle=s;obj.beginPath();obj.arc(x,y,r,0,Math.PI*2);obj.fill();
        [[-.27,-.17,.16],[.19,-.26,.1],[.3,.09,.14],[-.12,.29,.12],[.03,.04,.19]].forEach(c=>{
            obj.beginPath();obj.arc(x+c[0]*r,y+c[1]*r,c[2]*r,0,Math.PI*2);obj.fillStyle="rgba(99,89,106,.12)";obj.fill();
        });
    }

    function saturn(){
        const r=Math.min(ow,oh)*.17,x=ow*.5,y=oh*.5;
        obj.save();obj.translate(x,y);obj.rotate(-.25+Math.sin(t*.1)*.015);
        obj.beginPath();obj.ellipse(0,0,r*2.25,r*.48,0,0,Math.PI*2);obj.strokeStyle="rgba(219,190,147,.31)";obj.lineWidth=r*.17;obj.stroke();
        obj.beginPath();obj.ellipse(0,0,r*1.95,r*.34,0,0,Math.PI*2);obj.strokeStyle="rgba(246,218,171,.46)";obj.lineWidth=r*.075;obj.stroke();
        const p=obj.createRadialGradient(-r*.32,-r*.32,r*.05,0,0,r);p.addColorStop(0,"#f6dfac");p.addColorStop(.5,"#cda477");p.addColorStop(1,"#675365");
        obj.fillStyle=p;obj.beginPath();obj.arc(0,0,r,0,Math.PI*2);obj.fill();obj.restore();
    }

    function jupiter(){
        const r=Math.min(ow,oh)*.25,x=ow*.5,y=oh*.5;
        obj.save();obj.beginPath();obj.arc(x,y,r,0,Math.PI*2);obj.clip();
        const p=obj.createRadialGradient(x-r*.34,y-r*.3,r*.04,x,y,r);p.addColorStop(0,"#f7e2c5");p.addColorStop(.65,"#caa886");p.addColorStop(1,"#6e5f65");
        obj.fillStyle=p;obj.fillRect(x-r,y-r,r*2,r*2);
        [[-.62,.16,"#a57e72"],[-.31,.1,"#e3c6a6"],[-.05,.17,"#9f776c"],[.29,.12,"#e4c6a6"],[.55,.15,"#9d776e"]].forEach(b=>{
            obj.fillStyle=b[2];obj.globalAlpha=.48;obj.fillRect(x-r,y+b[0]*r,r*2,b[1]*r);
        });
        obj.globalAlpha=.55;obj.beginPath();obj.ellipse(x+r*.42,y+r*.18,r*.22,r*.1,-.1,0,Math.PI*2);obj.fillStyle="#ad6259";obj.fill();obj.restore();
    }

    function mars(){
        const r=Math.min(ow,oh)*.22,x=ow*.5,y=oh*.5;
        const p=obj.createRadialGradient(x-r*.34,y-r*.34,r*.04,x,y,r);p.addColorStop(0,"#f1b087");p.addColorStop(.45,"#c96f55");p.addColorStop(.78,"#884540");p.addColorStop(1,"#49313e");
        obj.fillStyle=p;obj.beginPath();obj.arc(x,y,r,0,Math.PI*2);obj.fill();
        [[-.34,-.18,.22,.12],[.25,-.28,.16,.08],[.19,.18,.27,.12],[-.24,.32,.18,.1]].forEach(m=>{
            obj.beginPath();obj.ellipse(x+m[0]*r,y+m[1]*r,m[2]*r,m[3]*r,.2,0,Math.PI*2);obj.fillStyle="rgba(92,47,50,.24)";obj.fill();
        });
    }

    function pleiades(){
        const cx=ow*.5,cy=oh*.5,scale=Math.min(ow,oh)*.65;
        obj.save();obj.globalCompositeOperation="screen";
        [[-.22,-.05,4.8],[-.08,-.18,5.7],[.1,-.14,4.5],[.22,.02,5.3],[.04,.1,4],[-.13,.15,3.8],[.16,.2,3.4]].forEach(s=>{
            const x=cx+s[0]*scale,y=cy+s[1]*scale,g=obj.createRadialGradient(x,y,0,x,y,s[2]*7);
            g.addColorStop(0,"rgba(231,244,255,.95)");g.addColorStop(.18,"rgba(168,211,244,.42)");g.addColorStop(1,"rgba(168,211,244,0)");
            obj.fillStyle=g;obj.beginPath();obj.arc(x,y,s[2]*7,0,Math.PI*2);obj.fill();
        });obj.restore();
    }

    function orion(){
        const cx=ow*.5,cy=oh*.5;obj.save();obj.translate(cx,cy);obj.rotate(-.22);obj.globalCompositeOperation="screen";
        for(let i=0;i<7;i++){
            const r=Math.min(ow,oh)*(.12+i*.035),g=obj.createRadialGradient(0,0,0,0,0,r);
            g.addColorStop(0,i%2?"rgba(221,180,221,.12)":"rgba(128,176,215,.12)");
            g.addColorStop(.55,i%2?"rgba(177,116,181,.05)":"rgba(105,145,194,.045)");g.addColorStop(1,"rgba(111,145,194,0)");
            obj.fillStyle=g;obj.beginPath();obj.ellipse((i-3)*7,Math.sin(i)*12,r*1.2,r*.63,i*.22,0,Math.PI*2);obj.fill();
        }obj.restore();
    }

    function andromeda(){
        const cx=ow*.5,cy=oh*.5;obj.save();obj.translate(cx,cy);obj.rotate(-.3);obj.globalCompositeOperation="screen";
        for(let i=0;i<9;i++){
            const a=Math.min(ow,oh)*(.15+i*.03),b=a*(.18+i*.008),g=obj.createRadialGradient(0,0,0,0,0,a);
            g.addColorStop(0,i<2?"rgba(255,237,207,.2)":"rgba(186,174,218,.065)");g.addColorStop(.62,"rgba(143,137,193,.035)");g.addColorStop(1,"rgba(143,137,193,0)");
            obj.fillStyle=g;obj.beginPath();obj.ellipse(0,0,a,b,0,0,Math.PI*2);obj.fill();
        }obj.restore();
    }

    function drawObject(){
        if(!active||overlay.hidden)return;
        objectBackground();
        ({moon,saturn,jupiter,mars,pleiades,orion,andromeda}[active.id]||(()=>{}))();
    }

    function syncInfo(o){
        const map={
            observatoryLensTitle:o.name,observatoryObjectType:o.type,observatoryObjectName:o.name,
            observatoryObjectPoetry:o.poetry,observatoryObjectDistance:o.distance,observatoryObjectLight:o.light,
            observatoryObjectKnown:o.known,observatoryObjectDescription:o.description
        };
        Object.entries(map).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value});
    }

    function openLens(){
        if(!active)return;
        syncInfo(active);overlay.hidden=false;resizeObject();drawObject();
    }
    function closeLens(){overlay.hidden=true}
    function chooseRandom(open=false){
        let next=objects[Math.floor(Math.random()*objects.length)];
        while(active&&objects.length>1&&next.id===active.id)next=objects[Math.floor(Math.random()*objects.length)];
        lock(next,true);if(open)setTimeout(openLens,650);
    }

    function clock(){
        if(!timeElement)return;
        timeElement.textContent=new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());
    }

    buildList();resizeSky();clock();setInterval(clock,30000);

    experience.addEventListener("pointerdown",e=>{
        if(e.target.closest("a,button,.observatory-target-dock,.observatory-lens-overlay"))return;
        drag=true;lastPoint={x:e.clientX,y:e.clientY};experience.classList.add("dragging");experience.setPointerCapture(e.pointerId);
    });
    experience.addEventListener("pointermove",e=>{
        if(!drag||!lastPoint)return;
        targetX+=(e.clientX-lastPoint.x)*1.6;targetY+=(e.clientY-lastPoint.y)*1.25;active=null;
        lastPoint={x:e.clientX,y:e.clientY};
    });
    function end(e){drag=false;lastPoint=null;experience.classList.remove("dragging");try{experience.releasePointerCapture(e.pointerId)}catch{}}
    experience.addEventListener("pointerup",end);experience.addEventListener("pointercancel",end);

    openButton.addEventListener("click",openLens);
    randomButton.addEventListener("click",()=>chooseRandom(true));
    document.getElementById("observatoryNextObject")?.addEventListener("click",()=>chooseRandom(true));
    document.addEventListener("click",e=>{if(e.target.matches("[data-close-lens]"))closeLens()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)closeLens()});
    document.addEventListener("visibilitychange",()=>{running=!document.hidden;last=performance.now()});

    let timer;
    addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{resizeSky();if(!overlay.hidden)resizeObject()},120)});

    function loop(now){
        const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
        if(running){t+=dt;render(dt);drawObject()}
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();
