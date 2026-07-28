// ==========================================================
// CELESTIAL COLLECTION HOMEPAGE
// Keeps homepage audio alive while experiences open fullscreen.
// ==========================================================

(function () {
    const configs = [
        {canvas:"astrophilePreviewCanvas",entry:"astrophileSpaceEntry",mode:"space"},
        {canvas:"observatoryPreviewCanvas",entry:"astrophileObservatoryEntry",mode:"observatory"}
    ];

    configs.forEach((config) => {
        const canvas = document.getElementById(config.canvas);
        const entry = document.getElementById(config.entry);
        if (!canvas || !entry) return;

        const ctx = canvas.getContext("2d",{alpha:false});
        if (!ctx) return;

        let w=1,h=1,dpr=1,t=0,last=performance.now(),visible=true,stars=[];
        let seed = config.mode === "observatory" ? 31072026 : 24072026;
        const rand = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };

        function buildStars(){
            seed = config.mode === "observatory" ? 31072026 : 24072026;
            const count = innerWidth <= 700 ? 78 : 128;
            stars = Array.from({length:count},()=>({
                x:rand(),y:rand()*.8,size:.4+rand()*1.7,
                alpha:.18+rand()*.7,phase:rand()*Math.PI*2,twinkle:1.2+rand()*4
            }));
        }

        function resize(){
            const r=canvas.getBoundingClientRect();
            w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);
            canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
            ctx.setTransform(dpr,0,0,dpr,0,0);buildStars();
        }

        function drawStars(){
            stars.forEach(s=>{
                const a=s.alpha*(.64+Math.sin(t*s.twinkle+s.phase)*.36);
                ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.size,0,Math.PI*2);
                ctx.fillStyle=`rgba(228,238,244,${Math.max(.05,a)})`;ctx.fill();
            });
        }

        function horizon(){
            ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,h*.86);
            ctx.bezierCurveTo(w*.17,h*.78,w*.34,h*.91,w*.52,h*.82);
            ctx.bezierCurveTo(w*.72,h*.73,w*.83,h*.91,w,h*.81);
            ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle="#06080e";ctx.fill();
        }

        function drawSpace(){
            const g=ctx.createLinearGradient(0,0,0,h);
            g.addColorStop(0,"#07101f");g.addColorStop(.56,"#10152d");g.addColorStop(1,"#201829");
            ctx.fillStyle=g;ctx.fillRect(0,0,w,h);drawStars();

            ctx.save();ctx.globalCompositeOperation="screen";
            for(let b=0;b<3;b++){
                ctx.beginPath();
                for(let x=-20;x<=w+20;x+=8){
                    const y=h*(.24+b*.07)+Math.sin(x/Math.max(w,1)*Math.PI*2.3+t*.18+b)*h*.035;
                    x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y);
                }
                ctx.strokeStyle=b%2?"rgba(128,219,183,.055)":"rgba(142,187,223,.05)";
                ctx.lineWidth=30;ctx.lineCap="round";ctx.filter="blur(18px)";ctx.stroke();
            }
            ctx.restore();

            const x=w*.78+Math.sin(t*.08)*8,y=h*.27+Math.cos(t*.07)*6,r=Math.min(w,h)*.115;
            const halo=ctx.createRadialGradient(x,y,r*.15,x,y,r*3.1);
            halo.addColorStop(0,"rgba(255,238,204,.22)");halo.addColorStop(1,"rgba(255,238,204,0)");
            ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r*3.1,0,Math.PI*2);ctx.fill();
            const moon=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);
            moon.addColorStop(0,"#fff7df");moon.addColorStop(.5,"#e4cfaf");moon.addColorStop(1,"#88777a");
            ctx.fillStyle=moon;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();horizon();
        }

        function drawObservatory(){
            const g=ctx.createLinearGradient(0,0,0,h);
            g.addColorStop(0,"#06101d");g.addColorStop(.54,"#101929");g.addColorStop(1,"#171a25");
            ctx.fillStyle=g;ctx.fillRect(0,0,w,h);drawStars();

            const x=w*.74+Math.sin(t*.055)*9,y=h*.24+Math.cos(t*.044)*6,r=Math.min(w,h)*.065;
            const p=ctx.createRadialGradient(x-r*.35,y-r*.33,2,x,y,r);
            p.addColorStop(0,"#f5ddae");p.addColorStop(.48,"#cda778");p.addColorStop(1,"#685464");
            ctx.fillStyle=p;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
            ctx.save();ctx.translate(x,y);ctx.rotate(-.28);ctx.beginPath();ctx.ellipse(0,0,r*1.85,r*.38,0,0,Math.PI*2);
            ctx.strokeStyle="rgba(232,211,169,.42)";ctx.lineWidth=Math.max(1,r*.08);ctx.stroke();ctx.restore();

            horizon();
            const dx=w*.76,dy=h*.84,dr=Math.min(w,h)*.2;
            ctx.beginPath();ctx.arc(dx,dy,dr,Math.PI,Math.PI*2);ctx.lineTo(dx+dr,h);ctx.lineTo(dx-dr,h);ctx.closePath();
            ctx.fillStyle="#070a10";ctx.fill();
        }

        function loop(now){
            const dt=Math.min(.05,(now-last)/1000);last=now;
            if(visible){t+=dt;config.mode==="observatory"?drawObservatory():drawSpace();}
            requestAnimationFrame(loop);
        }

        new IntersectionObserver(e=>visible=e[0]?.isIntersecting??true,{threshold:.03}).observe(entry);
        let timer;addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(resize,120)});
        resize();requestAnimationFrame(loop);
    });
})();

(function () {
    const entries=[...document.querySelectorAll("[data-celestial-page]")];
    if(!entries.length)return;

    let overlay=null,frame=null,active=null,pushed=false;

    function create(){
        if(overlay)return;
        overlay=document.createElement("div");
        overlay.className="astrophile-space-overlay celestial-collection-overlay";
        overlay.setAttribute("aria-hidden","true");
        overlay.innerHTML=`
            <div class="astrophile-space-overlay-loading">
                <div class="astrophile-space-overlay-loading-inner">
                    <span>✦</span><small>THE CELESTIAL COLLECTION</small>
                    <strong id="celestialPortalLoadingTitle">Entering the night...</strong>
                </div>
            </div>
            <iframe class="astrophile-space-overlay-frame" title="Celestial experience" allow="fullscreen"></iframe>`;
        document.body.appendChild(overlay);
        frame=overlay.querySelector("iframe");
        frame.addEventListener("load",()=>setTimeout(()=>overlay?.classList.add("ready"),120));
    }

    function open(entry){
        create();active=entry;
        const title=entry.dataset.celestialTitle||"Celestial experience";
        overlay.querySelector("#celestialPortalLoadingTitle").textContent=`Entering ${title}...`;
        document.body.classList.add("astrophile-space-open");
        overlay.classList.remove("ready");overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");
        frame.title=title;frame.src=`${entry.dataset.celestialPage}?embedded=1`;
        const hash=`#${entry.dataset.celestialHash}`;
        if(location.hash!==hash){history.pushState({celestialExperience:entry.dataset.celestialHash},"",hash);pushed=true}
    }

    function close({fromHistory=false}={}){
        if(!overlay?.classList.contains("open"))return;
        overlay.classList.remove("open","ready");overlay.setAttribute("aria-hidden","true");
        document.body.classList.remove("astrophile-space-open");
        setTimeout(()=>{if(!overlay.classList.contains("open"))frame.src="about:blank"},420);
        if(!fromHistory&&pushed){pushed=false;history.back()}
        active=null;
    }

    entries.forEach(entry=>entry.addEventListener("click",e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
        e.preventDefault();open(entry);
    }));

    addEventListener("message",e=>{
        if(e.origin!==location.origin)return;
        if(["CELESTIAL_EXPERIENCE_CLOSE","ASTROPHILE_SPACE_CLOSE"].includes(e.data?.type))close();
    });

    addEventListener("popstate",()=>{
        if(overlay?.classList.contains("open")&&location.hash!==`#${active?.dataset?.celestialHash}`){
            pushed=false;close({fromHistory:true});
        }
    });

    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay?.classList.contains("open"))close()});

    const direct=entries.find(entry=>entry.dataset.celestialHash===location.hash.replace("#",""));
    if(direct)setTimeout(()=>open(direct),150);
})();
