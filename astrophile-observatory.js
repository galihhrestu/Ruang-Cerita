const targets = {
  moon: { name: 'THE MOON', travel: 'Traveling to The Moon', sub: 'Moonlight opens like a quiet silver door beyond the eyepiece.' },
  mercury: { name: 'MERCURY', travel: 'Traveling to Mercury', sub: 'A tiny sun-burnt world glides forward through the tunnel of stars.' },
  venus: { name: 'VENUS', travel: 'Traveling to Venus', sub: 'Clouds of gold and ivory bloom as the observatory approaches Venus.' },
  mars: { name: 'MARS', travel: 'Traveling to Mars', sub: 'Rust-red light rises ahead, like a distant ember in the dark.' },
  jupiter: { name: 'JUPITER', travel: 'Traveling to Jupiter', sub: 'The tunnel opens toward a giant world banded with storms and light.' },
  saturn: { name: 'SATURN', travel: 'Traveling to Saturn', sub: 'A graceful ringed silhouette shimmers at the far end of the corridor.' },
  uranus: { name: 'URANUS', travel: 'Traveling to Uranus', sub: 'A blue-green stillness waits quietly in the outer dark.' },
  neptune: { name: 'NEPTUNE', travel: 'Traveling to Neptune', sub: 'Deep sapphire winds drift at the edge of the known night.' },
  pleiades: { name: 'THE PLEIADES', travel: 'Traveling to The Pleiades', sub: 'A cluster of blue stars gathers like a tiny jewel box in space.' },
  orion: { name: 'ORION NEBULA', travel: 'Traveling to Orion Nebula', sub: 'Dust and newborn light unfold like silk in the cosmic tunnel.' },
  andromeda: { name: 'ANDROMEDA', travel: 'Traveling to Andromeda', sub: 'A faraway spiral slowly appears, immense and impossibly calm.' }
};

const previewTargetTitle = document.getElementById('previewTargetTitle');
const previewCaption = document.getElementById('previewCaption');
const observeButton = document.getElementById('observeButton');
const travelOverlay = document.getElementById('travelOverlay');
const travelTitle = document.getElementById('travelTitle');
const travelSub = document.getElementById('travelSub');
const targetButtons = document.querySelectorAll('.target-chip[data-target], .extra-target-chip[data-target]');
const moreButton = document.getElementById('targetMoreButton');
const extraTargetsPanel = document.getElementById('extraTargetsPanel');
const clockEl = document.getElementById('observatoryClock');
let currentTarget = 'moon';
let travelTimeout;

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}`;
}
updateClock();
setInterval(updateClock, 1000 * 30);

function setTarget(key) {
  currentTarget = key;
  const info = targets[key];
  previewTargetTitle.textContent = info.name;
  previewCaption.textContent = 'Entering the cosmic tunnel...';
  targetButtons.forEach(btn => {
    if (btn.dataset.target === key) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

targetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setTarget(btn.dataset.target);
    if (extraTargetsPanel.hidden === false && btn.classList.contains('extra-target-chip')) {
      extraTargetsPanel.hidden = true;
      moreButton.setAttribute('aria-expanded', 'false');
    }
  });
});

if (moreButton) {
  moreButton.addEventListener('click', () => {
    const expanded = moreButton.getAttribute('aria-expanded') === 'true';
    moreButton.setAttribute('aria-expanded', String(!expanded));
    extraTargetsPanel.hidden = expanded;
  });
}

observeButton.addEventListener('click', () => {
  const info = targets[currentTarget];
  travelTitle.textContent = info.travel;
  travelSub.textContent = info.sub;
  travelOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  clearTimeout(travelTimeout);
  travelTimeout = setTimeout(() => {
    travelOverlay.hidden = true;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, 2400);
});

travelOverlay.addEventListener('click', () => {
  clearTimeout(travelTimeout);
  travelOverlay.hidden = true;
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
});

setTarget(currentTarget);

// Background star sky
function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

const skyCanvas = document.getElementById('skyCanvas');
const sky = { stars: [] };
function initSky() {
  const { width, height } = fitCanvas(skyCanvas);
  sky.width = width; sky.height = height;
  sky.stars = Array.from({ length: Math.max(120, Math.floor(width * height / 12000)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.7 + 0.2,
    a: Math.random() * 0.6 + 0.25,
    tw: Math.random() * Math.PI * 2,
    sp: Math.random() * 0.015 + 0.005
  }));
}
function renderSky() {
  const { ctx, width, height } = fitCanvas(skyCanvas);
  ctx.clearRect(0, 0, width, height);
  const grad = ctx.createRadialGradient(width * 0.55, height * 0.35, 0, width * 0.55, height * 0.35, width * 0.75);
  grad.addColorStop(0, 'rgba(88, 120, 181, 0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  sky.stars.forEach(star => {
    star.tw += star.sp;
    const alpha = star.a + Math.sin(star.tw) * 0.12;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,245,233,${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(renderSky);
}
initSky();
renderSky();
window.addEventListener('resize', initSky);

// Tunnel canvas animation (preview + overlay)
function createTunnel(canvas, speedMultiplier = 1) {
  const stars = [];
  let meta = fitCanvas(canvas);
  const count = 220;
  for (let i = 0; i < count; i++) {
    stars.push(resetStar());
  }
  function resetStar() {
    return { x: (Math.random() - 0.5) * meta.width, y: (Math.random() - 0.5) * meta.height, z: Math.random() * meta.width, size: Math.random() * 1.8 + 0.5 };
  }
  function resize() {
    meta = fitCanvas(canvas);
  }
  window.addEventListener('resize', resize);
  function frame() {
    const { ctx, width, height } = meta;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2, cy = height / 2;
    ctx.fillStyle = 'rgba(4, 10, 22, 0.24)';
    ctx.fillRect(0, 0, width, height);
    stars.forEach((star, i) => {
      star.z -= 8 * speedMultiplier;
      if (star.z <= 0) stars[i] = resetStar();
      const k = 128 / star.z;
      const x = star.x * k + cx;
      const y = star.y * k + cy;
      if (x < 0 || x >= width || y < 0 || y >= height) {
        stars[i] = resetStar();
        return;
      }
      const size = Math.max(0.7, (1 - star.z / width) * 4.2 * star.size);
      const alpha = Math.max(0.2, 1 - star.z / width);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,245,235,${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(151,189,255,${alpha * 0.35})`;
      ctx.lineWidth = size * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (star.x * 0.02), y - (star.y * 0.02));
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.13, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    requestAnimationFrame(frame);
  }
  frame();
}

createTunnel(document.getElementById('tunnelCanvas'), 1);
createTunnel(document.getElementById('travelCanvas'), 1.8);
