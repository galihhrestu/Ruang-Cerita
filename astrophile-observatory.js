/* =========================================================
   ASTROPHILE'S OBSERVATORY V6 — LIVING SILHOUETTE
   Initial UI: animated sky + black silhouette woman + telescope.
   Interaction: drag sky -> align target -> observe -> eyepiece
   -> 3D tunnel -> NASA moving imagery.
========================================================= */

(() => {
  "use strict";

  const app = document.getElementById("observatoryApp");
  const skyCanvas = document.getElementById("skyCanvas");
  const dragSurface = document.getElementById("dragSurface");
  const silhouetteStage = document.getElementById("silhouetteStage");
  const telescopeSvgGroup = document.getElementById("telescopeSvgGroup");
  const skyTargets = document.getElementById("skyTargets");
  const observeButton = document.getElementById("observeButton");
  const targetDockToggle = document.getElementById("targetDockToggle");
  const targetDockPanel = document.getElementById("targetDockPanel");
  const targetChips = document.getElementById("targetChips");
  const selectedTargetLabel = document.getElementById("selectedTargetLabel");
  const eyepieceOverlay = document.getElementById("eyepieceOverlay");
  const travelOverlay = document.getElementById("travelOverlay");
  const travelCanvas = document.getElementById("travelCanvas");
  const travelTitle = document.getElementById("travelTitle");
  const observationOverlay = document.getElementById("observationOverlay");
  const observationVideo = document.getElementById("observationVideo");
  const observationFallback = document.getElementById("observationFallback");
  const closeObservationButton = document.getElementById("closeObservationButton");
  const previousTargetButton = document.getElementById("previousTargetButton");
  const nextTargetButton = document.getElementById("nextTargetButton");
  const observationSourceLink = document.getElementById("observationSourceLink");
  const backButton = document.getElementById("backButton");
  const clock = document.getElementById("observatoryClock");

  if (
    !app ||
    !skyCanvas ||
    !dragSurface ||
    !skyTargets ||
    !observeButton ||
    !targetDockToggle ||
    !targetDockPanel ||
    !targetChips ||
    !eyepieceOverlay ||
    !travelOverlay ||
    !travelCanvas ||
    !observationOverlay ||
    !observationVideo
  ) {
    return;
  }

  const embedded =
    new URLSearchParams(window.location.search).get("embedded") === "1";

  if (embedded && backButton) {
    backButton.addEventListener("click", (event) => {
      event.preventDefault();
      window.parent.postMessage(
        { type: "CELESTIAL_EXPERIENCE_CLOSE" },
        window.location.origin
      );
    });
  }

  const TARGETS = [
    {
      id: "moon",
      name: "The Moon",
      shortName: "THE MOON",
      symbol: "☾",
      type: "EARTH’S MOON",
      x: 0.18,
      y: 0.22,
      color: "#f1dfbf",
      glow: "rgba(241,223,191,.52)",
      distance: "384,400 km",
      light: "1.3 seconds",
      poetry: "The nearest world, still beautifully far away.",
      description:
        "Rotasi ini menggunakan data misi Clementine NASA. Visualnya bergerak berdasarkan pemetaan permukaan Bulan, bukan ilustrasi canvas sederhana.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a000000/a003400/a003444/moonrot.mp4",
      source: "https://svs.gsfc.nasa.gov/3444/"
    },
    {
      id: "mercury",
      name: "Mercury",
      shortName: "MERCURY",
      symbol: "☿",
      type: "INNER ROCKY PLANET",
      x: 0.34,
      y: 0.34,
      color: "#dbc7ae",
      glow: "rgba(219,199,174,.48)",
      distance: "≈91 million km",
      light: "≈5 minutes",
      poetry: "A scarred world racing closest to the Sun.",
      description:
        "Visual Mercury menggunakan citra dari wahana MESSENGER untuk memperlihatkan permukaan berbatu dan kawahnya secara lebih nyata.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a010000/a011500/a011544/MercuryTour-540-MASTER_high.mp4",
      source: "https://svs.gsfc.nasa.gov/11544/"
    },
    {
      id: "venus",
      name: "Venus",
      shortName: "VENUS",
      symbol: "♀",
      type: "CLOUD-WRAPPED PLANET",
      x: 0.49,
      y: 0.16,
      color: "#e3c992",
      glow: "rgba(227,201,146,.5)",
      distance: "≈41 million km",
      light: "≈2.3 minutes",
      poetry: "A luminous world hidden beneath restless cloud.",
      description:
        "Visual Venus menggunakan pemetaan radar Magellan NASA. Gerakannya memperlihatkan struktur global Venus berdasarkan data misi.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a010000/a010900/a010904/3728_Venus_music-540-MASTER_high.mp4",
      source: "https://svs.gsfc.nasa.gov/10904/"
    },
    {
      id: "mars",
      name: "Mars",
      shortName: "MARS",
      symbol: "♂",
      type: "THE RED PLANET",
      x: 0.66,
      y: 0.29,
      color: "#d98d73",
      glow: "rgba(217,141,115,.5)",
      distance: "≈225 million km",
      light: "≈12.5 minutes",
      poetry: "A rust-colored silence turning beyond the dark.",
      description:
        "Rotasi Mars menggunakan citra Viking yang diterapkan pada data topografi MOLA NASA, sehingga bentuk dan teksturnya berbasis observasi misi.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a000000/a001000/a001091/a001091.mp4",
      source: "https://svs.gsfc.nasa.gov/1091/"
    },
    {
      id: "jupiter",
      name: "Jupiter",
      shortName: "JUPITER",
      symbol: "♃",
      type: "GAS GIANT",
      x: 0.79,
      y: 0.18,
      color: "#e0bc91",
      glow: "rgba(224,188,145,.5)",
      distance: "≈780 million km",
      light: "≈43 minutes",
      poetry: "A storm-lit giant carrying worlds in its gravity.",
      description:
        "Visual bergerak Jupiter dibuat dari peta Hubble NASA. Awan, pita atmosfer, dan Great Red Spot berasal dari hasil observasi.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a010000/a012000/a012021/Jupiter01-H264_1280x720.mp4",
      source: "https://svs.gsfc.nasa.gov/12021/"
    },
    {
      id: "saturn",
      name: "Saturn",
      shortName: "SATURN",
      symbol: "♄",
      type: "RINGED PLANET",
      x: 0.88,
      y: 0.42,
      color: "#e3c493",
      glow: "rgba(227,196,147,.5)",
      distance: "≈1.4 billion km",
      light: "≈79 minutes",
      poetry: "A pale golden world carrying an impossible crown.",
      description:
        "Observasi Saturn menggunakan materi Hubble NASA. Cincin dan atmosfernya tampil dari visual misi resmi.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a010000/a013300/a013307/13307_saturn_opal_wide_mp4.mp4",
      source: "https://svs.gsfc.nasa.gov/13307/"
    },
    {
      id: "uranus",
      name: "Uranus",
      shortName: "URANUS",
      symbol: "♅",
      type: "ICE GIANT",
      x: 0.75,
      y: 0.56,
      color: "#9bd9df",
      glow: "rgba(155,217,223,.52)",
      distance: "≈2.9 billion km",
      light: "≈2.7 hours",
      poetry: "A quiet blue-green world suspended in restraint.",
      description:
        "Visual Uranus berasal dari materi NASA Goddard Conceptual Image Lab yang dibuat untuk eksplorasi ilmiah planet dan sistem cincinnya.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a020000/a020300/a020390/Shot4_1k_mp4.mp4",
      source: "https://svs.gsfc.nasa.gov/20390/"
    }
  ];

  let selectedTarget = TARGETS[0];
  let alignedTarget = null;
  let panX = 0;
  let panY = 0;
  let dragStart = null;
  let pointerId = null;
  let panAnimationFrame = null;
  let isTraveling = false;
  let skyState = null;
  let travelTunnel = null;
  let videoFallbackTimer = null;

  const clamp = (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value));

  function getTargetById(targetId) {
    return TARGETS.find((target) => target.id === targetId) || TARGETS[0];
  }

  function updateClock() {
    if (!clock) return;

    clock.textContent = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  }

  updateClock();
  window.setInterval(updateClock, 30000);

  function getAimPosition() {
    const isMobileLandscape =
      window.matchMedia("(orientation: landscape) and (max-height: 570px)")
        .matches;

    return {
      x: window.innerWidth * (isMobileLandscape ? 0.561 : 0.548),
      y: window.innerHeight * (isMobileLandscape ? 0.45 : 0.442)
    };
  }

  function targetScreenPosition(target) {
    return {
      x: target.x * window.innerWidth + panX,
      y: target.y * window.innerHeight + panY
    };
  }

  function updateVisualPan() {
    app.style.setProperty("--pan-x", `${panX}px`);
    app.style.setProperty("--pan-y", `${panY}px`);
    app.style.setProperty("--sky-pan-x", `${panX * 0.12}px`);
    app.style.setProperty("--sky-pan-y", `${panY * 0.08}px`);
    app.style.setProperty("--silhouette-pan-x", `${panX * 0.015}px`);
    app.style.setProperty("--silhouette-pan-y", `${panY * 0.012}px`);

    const tilt = clamp(
      -8 + (-panX / Math.max(window.innerWidth, 1)) * 6.8,
      -14,
      -2
    );

    app.style.setProperty("--scope-tilt", `${tilt}deg`);
  }

  function renderTargetControls() {
    skyTargets.innerHTML = "";
    targetChips.innerHTML = "";

    TARGETS.forEach((target) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "observatory-sky-marker";
      marker.dataset.observatoryTarget = target.id;
      marker.style.left = `${target.x * 100}%`;
      marker.style.top = `${target.y * 100}%`;
      marker.style.setProperty("--marker-color", target.color);
      marker.style.setProperty("--marker-glow", target.glow);
      marker.innerHTML = `<span>${target.shortName}</span>`;
      marker.setAttribute("aria-label", `Arahkan teleskop ke ${target.name}`);
      marker.addEventListener("click", () => selectTarget(target.id, true));
      skyTargets.appendChild(marker);

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "observatory-target-chip";
      chip.dataset.observatoryTarget = target.id;
      chip.innerHTML = `<span>${target.symbol}</span><b>${target.shortName}</b>`;
      chip.addEventListener("click", () => {
        selectTarget(target.id, true);
        closeTargetDock();
      });
      targetChips.appendChild(chip);
    });

    updateTargetUI();
  }

  function updateTargetUI() {
    selectedTargetLabel.textContent = selectedTarget.name;

    document
      .querySelectorAll("[data-observatory-target]")
      .forEach((element) => {
        element.classList.toggle(
          "is-active",
          element.dataset.observatoryTarget === selectedTarget.id
        );
      });

    if (alignedTarget) {
      observeButton.hidden = false;
      observeButton.querySelector("strong").textContent =
        `OBSERVE ${alignedTarget.shortName}`;
    } else {
      observeButton.hidden = true;
    }
  }

  function openTargetDock() {
    targetDockPanel.hidden = false;
    targetDockToggle.setAttribute("aria-expanded", "true");
    targetDockToggle.querySelector("b").textContent = "−";
  }

  function closeTargetDock() {
    targetDockPanel.hidden = true;
    targetDockToggle.setAttribute("aria-expanded", "false");
    targetDockToggle.querySelector("b").textContent = "＋";
  }

  targetDockToggle.addEventListener("click", () => {
    if (targetDockPanel.hidden) {
      openTargetDock();
    } else {
      closeTargetDock();
    }
  });

  function animatePanTo(targetX, targetY, duration = 700) {
    window.cancelAnimationFrame(panAnimationFrame);

    const startX = panX;
    const startY = panY;
    const startTime = performance.now();
    const maxX = window.innerWidth * 0.46;
    const maxY = window.innerHeight * 0.38;
    const finalX = clamp(targetX, -maxX, maxX);
    const finalY = clamp(targetY, -maxY, maxY);

    const easeInOutCubic = (progress) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const step = (currentTime) => {
      const progress = clamp((currentTime - startTime) / duration, 0, 1);
      const eased = easeInOutCubic(progress);

      panX = startX + (finalX - startX) * eased;
      panY = startY + (finalY - startY) * eased;
      updateVisualPan();
      detectAlignment();

      if (progress < 1) {
        panAnimationFrame = window.requestAnimationFrame(step);
      }
    };

    panAnimationFrame = window.requestAnimationFrame(step);
  }

  function selectTarget(targetId, align = true) {
    selectedTarget = getTargetById(targetId);

    if (align) {
      const aim = getAimPosition();
      animatePanTo(
        aim.x - selectedTarget.x * window.innerWidth,
        aim.y - selectedTarget.y * window.innerHeight
      );
    }

    updateTargetUI();
  }

  function detectAlignment() {
    const aim = getAimPosition();
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    TARGETS.forEach((target) => {
      const position = targetScreenPosition(target);
      const distance = Math.hypot(position.x - aim.x, position.y - aim.y);

      if (distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    });

    const threshold = Math.min(window.innerWidth, window.innerHeight) * 0.072;

    if (nearest && nearestDistance <= threshold) {
      alignedTarget = nearest;
      selectedTarget = nearest;
    } else {
      alignedTarget = null;
    }

    updateTargetUI();
  }

  dragSurface.addEventListener("pointerdown", (event) => {
    if (isTraveling || !observationOverlay.hidden) return;

    pointerId = event.pointerId;
    dragStart = {
      clientX: event.clientX,
      clientY: event.clientY,
      panX,
      panY
    };

    app.classList.add("is-dragging");
    dragSurface.setPointerCapture(pointerId);
  });

  dragSurface.addEventListener("pointermove", (event) => {
    if (!dragStart || event.pointerId !== pointerId) return;

    const sensitivity = event.pointerType === "touch" ? 1.56 : 1.28;
    const maxX = window.innerWidth * 0.46;
    const maxY = window.innerHeight * 0.38;

    panX = clamp(
      dragStart.panX + (event.clientX - dragStart.clientX) * sensitivity,
      -maxX,
      maxX
    );

    panY = clamp(
      dragStart.panY + (event.clientY - dragStart.clientY) * sensitivity,
      -maxY,
      maxY
    );

    updateVisualPan();
    detectAlignment();
  });

  function endDrag(event) {
    if (!dragStart) return;

    try {
      dragSurface.releasePointerCapture(event.pointerId);
    } catch (_) {
      // Pointer can already be released by browser.
    }

    dragStart = null;
    pointerId = null;
    app.classList.remove("is-dragging");
  }

  dragSurface.addEventListener("pointerup", endDrag);
  dragSurface.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (event) => {
    if (isTraveling || !observationOverlay.hidden) return;

    const amount = event.shiftKey ? 70 : 34;
    const maxX = window.innerWidth * 0.46;
    const maxY = window.innerHeight * 0.38;
    let changed = false;

    if (event.key === "ArrowLeft") {
      panX = clamp(panX + amount, -maxX, maxX);
      changed = true;
    }

    if (event.key === "ArrowRight") {
      panX = clamp(panX - amount, -maxX, maxX);
      changed = true;
    }

    if (event.key === "ArrowUp") {
      panY = clamp(panY + amount, -maxY, maxY);
      changed = true;
    }

    if (event.key === "ArrowDown") {
      panY = clamp(panY - amount, -maxY, maxY);
      changed = true;
    }

    if (changed) {
      event.preventDefault();
      updateVisualPan();
      detectAlignment();
    }
  });

  function fitCanvas(canvas) {
    const rectangle = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, rectangle.width);
    const height = Math.max(1, rectangle.height);
    const context = canvas.getContext("2d");

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    return { context, width, height };
  }

  function createSkyState() {
    const meta = fitCanvas(skyCanvas);

    return {
      ...meta,
      stars: Array.from(
        {
          length: Math.max(
            230,
            Math.floor((meta.width * meta.height) / 5600)
          )
        },
        () => ({
          x: Math.random() * meta.width,
          y: Math.random() * meta.height * 0.84,
          radius: Math.random() * 1.45 + 0.2,
          alpha: Math.random() * 0.67 + 0.13,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.015 + 0.004,
          depth: Math.random() * 0.8 + 0.2
        })
      ),
      milkyDust: Array.from({ length: 160 }, () => ({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 2.4 + 0.3,
        alpha: Math.random() * 0.13 + 0.015
      })),
      mountainLayers: [
        { y: 0.77, color: "#101827", amplitude: 0.08, seed: 1.7 },
        { y: 0.84, color: "#080d16", amplitude: 0.1, seed: 2.9 },
        { y: 0.91, color: "#03060b", amplitude: 0.12, seed: 4.4 }
      ],
      shootingStar: {
        active: false,
        startTime: 0,
        duration: 3600,
        x: 0,
        y: 0
      }
    };
  }

  function drawMountainLayer(context, width, height, layer) {
    context.beginPath();
    context.moveTo(0, height);

    for (let x = 0; x <= width; x += width / 22) {
      const normalizedX = x / width;
      const noise =
        Math.sin(normalizedX * Math.PI * 4.6 + layer.seed) * 0.36 +
        Math.sin(normalizedX * Math.PI * 9.2 + layer.seed * 1.7) * 0.17 +
        Math.sin(normalizedX * Math.PI * 2.1 + layer.seed * 0.6) * 0.47;

      const y =
        height * layer.y -
        noise * height * layer.amplitude;

      context.lineTo(x, y);
    }

    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = layer.color;
    context.fill();
  }

  function renderSky(time = 0) {
    if (!skyState) {
      skyState = createSkyState();
    }

    const { context, width, height } = skyState;
    context.clearRect(0, 0, width, height);

    const skyGradient = context.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "#010611");
    skyGradient.addColorStop(0.48, "#061229");
    skyGradient.addColorStop(0.74, "#0d1830");
    skyGradient.addColorStop(1, "#11121b");
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, width, height);

    const horizonGlow = context.createRadialGradient(
      width * 0.69,
      height * 0.76,
      0,
      width * 0.69,
      height * 0.76,
      width * 0.44
    );

    horizonGlow.addColorStop(0, "rgba(184, 139, 105, 0.15)");
    horizonGlow.addColorStop(0.34, "rgba(102, 111, 155, 0.08)");
    horizonGlow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = horizonGlow;
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(width * 0.48, height * 0.28);
    context.rotate(-0.76);

    for (let layerIndex = 0; layerIndex < 7; layerIndex += 1) {
      const radius = Math.max(width, height) * (0.14 + layerIndex * 0.055);
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);

      gradient.addColorStop(
        0,
        layerIndex % 2 === 0
          ? "rgba(169, 194, 225, 0.055)"
          : "rgba(183, 154, 205, 0.038)"
      );
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(
        layerIndex * 14 - 45,
        Math.sin(time * 0.00006 + layerIndex) * 13,
        radius * 1.38,
        radius * 0.32,
        0,
        0,
        Math.PI * 2
      );
      context.fill();
    }

    skyState.milkyDust.forEach((dust, index) => {
      const dx = (dust.x - 0.5) * width * 0.72;
      const dy =
        (dust.y - 0.5) * height * 0.28 +
        Math.sin(index * 0.86) * 30;

      context.beginPath();
      context.arc(dx, dy, dust.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(218,228,242,${dust.alpha})`;
      context.fill();
    });

    context.restore();

    skyState.stars.forEach((star) => {
      star.phase += star.speed;
      const x =
        star.x +
        Math.sin(time * 0.000018 + star.phase) * star.depth * 1.8;
      const alpha = star.alpha * (0.7 + Math.sin(star.phase) * 0.3);

      context.beginPath();
      context.arc(x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(233,240,249,${Math.max(0.03, alpha)})`;
      context.fill();
    });

    if (
      !skyState.shootingStar.active &&
      Math.random() < 0.0011
    ) {
      skyState.shootingStar = {
        active: true,
        startTime: time,
        duration: 2700 + Math.random() * 1600,
        x: width * (0.28 + Math.random() * 0.52),
        y: height * (0.1 + Math.random() * 0.22)
      };
    }

    if (skyState.shootingStar.active) {
      const progress =
        (time - skyState.shootingStar.startTime) /
        skyState.shootingStar.duration;

      if (progress >= 1) {
        skyState.shootingStar.active = false;
      } else {
        const headX =
          skyState.shootingStar.x + progress * width * 0.24;
        const headY =
          skyState.shootingStar.y + progress * height * 0.17;
        const tailLength = width * 0.1;
        const gradient = context.createLinearGradient(
          headX,
          headY,
          headX - tailLength,
          headY - tailLength * 0.55
        );

        gradient.addColorStop(0, "rgba(255,249,234,0.88)");
        gradient.addColorStop(0.28, "rgba(191,222,251,0.24)");
        gradient.addColorStop(1, "rgba(191,222,251,0)");

        context.strokeStyle = gradient;
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(headX, headY);
        context.lineTo(
          headX - tailLength,
          headY - tailLength * 0.55
        );
        context.stroke();
      }
    }

    skyState.mountainLayers.forEach((layer) => {
      drawMountainLayer(context, width, height, layer);
    });

    window.requestAnimationFrame(renderSky);
  }

  function createTunnelRenderer(canvas) {
    let meta = fitCanvas(canvas);
    const stars = [];
    const rings = [];
    let running = false;
    let lastTime = performance.now();

    const resetStar = () => ({
      x: (Math.random() - 0.5) * meta.width * 1.75,
      y: (Math.random() - 0.5) * meta.height * 1.75,
      z: Math.random() * 1000 + 30,
      previousZ: 1000,
      hue: 188 + Math.random() * 55
    });

    for (let index = 0; index < 320; index += 1) {
      stars.push(resetStar());
    }

    for (let index = 0; index < 38; index += 1) {
      rings.push({
        z: index * (1000 / 38),
        rotation: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.6
      });
    }

    const resize = () => {
      meta = fitCanvas(canvas);
    };

    const render = (currentTime) => {
      if (!running) return;

      const delta = Math.min(40, currentTime - lastTime);
      lastTime = currentTime;

      const { context, width, height } = meta;
      const centerX = width / 2;
      const centerY = height / 2;
      const focalLength = Math.min(width, height) * 0.88;

      context.fillStyle = "#000207";
      context.fillRect(0, 0, width, height);

      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.min(width, height) * 0.37
      );

      core.addColorStop(0, "rgba(235,247,255,0.2)");
      core.addColorStop(0.23, "rgba(80,155,223,0.14)");
      core.addColorStop(0.5, "rgba(100,68,183,0.08)");
      core.addColorStop(1, "rgba(0,0,0,0)");

      context.fillStyle = core;
      context.fillRect(0, 0, width, height);

      rings.forEach((ring, index) => {
        ring.z -= delta * 0.92;

        if (ring.z < 8) {
          ring.z += 1000;
          ring.rotation = Math.random() * Math.PI * 2;
          ring.tilt = (Math.random() - 0.5) * 0.6;
        }

        const scale = focalLength / ring.z;
        const radius = Math.min(width, height) * 0.18 * scale;
        const alpha = clamp(1 - ring.z / 1000, 0, 1) * 0.29;

        if (
          radius < 2 ||
          radius > Math.max(width, height) * 2
        ) {
          return;
        }

        context.save();
        context.translate(centerX, centerY);
        context.rotate(
          ring.rotation +
          currentTime * 0.00017 * (index % 2 === 0 ? 1 : -1)
        );
        context.scale(1, 0.5 + ring.tilt * 0.1);
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.strokeStyle =
          index % 3 === 0
            ? `rgba(135,198,242,${alpha})`
            : index % 3 === 1
              ? `rgba(194,137,237,${alpha * 0.75})`
              : `rgba(244,219,188,${alpha * 0.58})`;
        context.lineWidth = Math.max(0.5, scale * 1.55);
        context.stroke();
        context.restore();
      });

      stars.forEach((star, index) => {
        star.previousZ = star.z;
        star.z -= delta * 3.15;

        if (star.z < 9) {
          stars[index] = resetStar();
          return;
        }

        const scale = focalLength / star.z;
        const previousScale = focalLength / star.previousZ;
        const x = centerX + star.x * scale;
        const y = centerY + star.y * scale;
        const previousX = centerX + star.x * previousScale;
        const previousY = centerY + star.y * previousScale;

        if (
          x < -width ||
          x > width * 2 ||
          y < -height ||
          y > height * 2
        ) {
          stars[index] = resetStar();
          return;
        }

        const alpha = clamp(1 - star.z / 1000, 0.08, 1);
        const gradient = context.createLinearGradient(
          previousX,
          previousY,
          x,
          y
        );

        gradient.addColorStop(
          0,
          `hsla(${star.hue}, 90%, 76%, 0)`
        );
        gradient.addColorStop(
          1,
          `hsla(${star.hue}, 90%, 92%, ${alpha})`
        );

        context.strokeStyle = gradient;
        context.lineWidth = clamp(scale * 1.9, 0.5, 5.5);
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(x, y);
        context.stroke();
      });

      const edge = context.createRadialGradient(
        centerX,
        centerY,
        Math.min(width, height) * 0.13,
        centerX,
        centerY,
        Math.min(width, height) * 0.52
      );

      edge.addColorStop(0, "rgba(0,0,0,0)");
      edge.addColorStop(0.62, "rgba(3,8,25,0.08)");
      edge.addColorStop(1, "rgba(0,0,0,0.82)");

      context.fillStyle = edge;
      context.fillRect(0, 0, width, height);

      window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);

    return {
      start() {
        if (running) return;
        running = true;
        lastTime = performance.now();
        window.requestAnimationFrame(render);
      },
      stop() {
        running = false;
      },
      resize
    };
  }

  function updateObservationContent(target) {
    const content = {
      observationTitle: target.name,
      observationHudTarget: target.shortName,
      observationType: target.type,
      observationName: target.name,
      observationPoetry: target.poetry,
      observationDistance: target.distance,
      observationLight: target.light,
      observationDescription: target.description
    };

    Object.entries(content).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);

      if (element) {
        element.textContent = value;
      }
    });

    observationSourceLink.href = target.source;
    playObservationVideo(target);
  }

  function playObservationVideo(target) {
    observationFallback.hidden = true;
    observationVideo.hidden = false;
    observationVideo.pause();
    observationVideo.removeAttribute("src");
    observationVideo.load();

    window.clearTimeout(videoFallbackTimer);

    observationVideo.src = target.video;
    observationVideo.load();

    videoFallbackTimer = window.setTimeout(() => {
      if (observationVideo.readyState < 2) {
        observationFallback.hidden = false;
      }
    }, 6000);

    observationVideo.onloadeddata = () => {
      window.clearTimeout(videoFallbackTimer);
      observationFallback.hidden = true;

      const playPromise = observationVideo.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    observationVideo.onerror = () => {
      window.clearTimeout(videoFallbackTimer);
      observationFallback.hidden = false;
    };
  }

  function resetTravelState() {
    isTraveling = false;
    app.classList.remove("is-entering");
    eyepieceOverlay.hidden = true;
    eyepieceOverlay.setAttribute("aria-hidden", "true");
    travelOverlay.hidden = true;
    travelOverlay.setAttribute("aria-hidden", "true");
  }

  function openObservation(target) {
    resetTravelState();
    observationOverlay.hidden = false;
    observationOverlay.setAttribute("aria-hidden", "false");
    updateObservationContent(target);
  }

  function beginObservation() {
    if (
      isTraveling ||
      !observationOverlay.hidden ||
      !alignedTarget
    ) {
      return;
    }

    selectedTarget = alignedTarget;
    isTraveling = true;
    closeTargetDock();
    app.classList.add("is-entering");

    eyepieceOverlay.hidden = false;
    eyepieceOverlay.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      eyepieceOverlay.hidden = true;
      eyepieceOverlay.setAttribute("aria-hidden", "true");
      travelOverlay.hidden = false;
      travelOverlay.setAttribute("aria-hidden", "false");
      travelTitle.textContent = `Traveling to ${selectedTarget.name}`;

      if (travelTunnel) {
        travelTunnel.resize();
        travelTunnel.start();
      }
    }, 730);

    window.setTimeout(() => {
      if (travelTunnel) {
        travelTunnel.stop();
      }

      openObservation(selectedTarget);
    }, 3000);
  }

  observeButton.addEventListener("click", beginObservation);

  function closeObservation() {
    observationVideo.pause();
    observationVideo.removeAttribute("src");
    observationVideo.load();
    observationOverlay.hidden = true;
    observationOverlay.setAttribute("aria-hidden", "true");
    observationFallback.hidden = true;
  }

  closeObservationButton.addEventListener("click", closeObservation);

  observationOverlay.addEventListener("click", (event) => {
    if (
      event.target === observationVideo &&
      observationVideo.paused
    ) {
      observationVideo.play().catch(() => {});
    }
  });

  function moveObservation(direction) {
    const currentIndex = TARGETS.findIndex(
      (target) => target.id === selectedTarget.id
    );

    const nextIndex =
      (currentIndex + direction + TARGETS.length) %
      TARGETS.length;

    selectedTarget = TARGETS[nextIndex];
    alignedTarget = selectedTarget;
    updateTargetUI();
    updateObservationContent(selectedTarget);
  }

  previousTargetButton.addEventListener("click", () =>
    moveObservation(-1)
  );

  nextTargetButton.addEventListener("click", () =>
    moveObservation(1)
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!observationOverlay.hidden) {
        closeObservation();
      } else if (isTraveling) {
        resetTravelState();
      } else {
        closeTargetDock();
      }
    }
  });

  function handleResize() {
    skyState = createSkyState();

    if (travelTunnel) {
      travelTunnel.resize();
    }

    selectTarget(selectedTarget.id, true);
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(handleResize.timer);
    handleResize.timer = window.setTimeout(handleResize, 140);
  });

  renderTargetControls();
  skyState = createSkyState();
  renderSky();

  travelTunnel = createTunnelRenderer(travelCanvas);

  selectTarget("moon", true);
})();
