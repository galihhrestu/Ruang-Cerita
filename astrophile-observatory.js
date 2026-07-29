/* =========================================================
   ASTROPHILE'S OBSERVATORY V5
   Keeps the original concept:
   draggable telescope sky -> lock target -> eyepiece zoom
   -> 3D deep-space corridor -> NASA moving imagery.
========================================================= */

(() => {
  "use strict";

  const app = document.getElementById("observatoryApp");
  const skyCanvas = document.getElementById("skyCanvas");
  const previewTunnelCanvas = document.getElementById("previewTunnelCanvas");
  const travelCanvas = document.getElementById("travelCanvas");
  const dragSurface = document.getElementById("dragSurface");
  const sceneStage = document.getElementById("sceneStage");
  const targetChips = document.getElementById("targetChips");
  const skyTargets = document.getElementById("skyTargets");
  const moreTargetsButton = document.getElementById("moreTargetsButton");
  const moreTargetsPanel = document.getElementById("moreTargetsPanel");
  const observeButton = document.getElementById("observeButton");
  const lockStatus = document.getElementById("lockStatus");
  const previewTargetName = document.getElementById("previewTargetName");
  const eyepieceOverlay = document.getElementById("eyepieceOverlay");
  const travelOverlay = document.getElementById("travelOverlay");
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
    !previewTunnelCanvas ||
    !travelCanvas ||
    !dragSurface ||
    !targetChips ||
    !skyTargets ||
    !observeButton ||
    !observationOverlay ||
    !observationVideo
  ) {
    return;
  }

  const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";

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
      x: 0.20,
      y: 0.22,
      color: "#f3dfbd",
      distance: "384,400 km",
      light: "1.3 seconds",
      poetry: "The nearest world, still beautifully far away.",
      description:
        "Rotasi ini menggunakan data misi Clementine NASA. Visualnya bukan planet ilustrasi datar, melainkan visualisasi bergerak berbasis pemetaan permukaan Bulan.",
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
      x: 0.36,
      y: 0.30,
      color: "#dcc7ac",
      distance: "≈91 million km",
      light: "≈5 minutes",
      poetry: "A scarred world racing closest to the Sun.",
      description:
        "Visual observasi Mercury menggunakan citra dari wahana MESSENGER untuk memperlihatkan permukaan berbatu dan kawahnya secara lebih nyata.",
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
      x: 0.53,
      y: 0.18,
      color: "#e5c993",
      distance: "≈41 million km",
      light: "≈2.3 minutes",
      poetry: "A luminous world hidden beneath restless cloud.",
      description:
        "Visual Venus menggunakan pemetaan radar Magellan NASA. Gerakannya memperlihatkan permukaan dan struktur global Venus berdasarkan data misi.",
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
      x: 0.69,
      y: 0.31,
      color: "#d98d73",
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
      x: 0.80,
      y: 0.17,
      color: "#e3bf94",
      distance: "≈780 million km",
      light: "≈43 minutes",
      poetry: "A storm-lit giant carrying worlds in its gravity.",
      description:
        "Visual bergerak Jupiter dibuat dari peta Hubble NASA. Awan, pita atmosfer, dan Great Red Spot berasal dari hasil observasi, bukan ilustrasi canvas sebelumnya.",
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
      distance: "≈1.4 billion km",
      light: "≈79 minutes",
      poetry: "A pale golden world carrying an impossible crown.",
      description:
        "Observasi Saturn menggunakan materi Hubble NASA. Cincin dan atmosfernya tampil dari visual misi resmi, bukan bentuk ilustrasi sederhana.",
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
      x: 0.76,
      y: 0.55,
      color: "#9cd9df",
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

  const PRIMARY_IDS = ["moon", "mercury", "venus", "jupiter", "saturn"];
  const MORE_IDS = ["mars", "uranus"];

  let selectedTarget = TARGETS[0];
  let panX = 0;
  let panY = 0;
  let dragStart = null;
  let pointerId = null;
  let animationFrame = null;
  let travelAnimation = null;
  let isTraveling = false;
  let skyStars = [];
  let skyDust = [];
  let previewTunnel = null;
  let travelTunnel = null;

  const clamp = (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value));

  function setClock() {
    if (!clock) return;

    clock.textContent = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  }

  setClock();
  window.setInterval(setClock, 30000);

  function getTargetById(targetId) {
    return TARGETS.find((target) => target.id === targetId) || TARGETS[0];
  }

  function targetScreenPosition(target) {
    return {
      x: target.x * window.innerWidth + panX,
      y: target.y * window.innerHeight + panY
    };
  }

  function getAimPosition() {
    return {
      x: window.innerWidth * 0.651,
      y: window.innerHeight * 0.552
    };
  }

  function updatePanVariables() {
    app.style.setProperty("--pan-x", `${panX}px`);
    app.style.setProperty("--pan-y", `${panY}px`);
    app.style.setProperty("--scene-pan-x", `${panX * 0.035}px`);
    app.style.setProperty("--scene-pan-y", `${panY * 0.022}px`);
    app.style.setProperty(
      "--scope-tilt",
      `${clamp((-panX / Math.max(window.innerWidth, 1)) * 3.5, -2.4, 2.4)}deg`
    );
  }

  function updateActiveElements() {
    document
      .querySelectorAll("[data-observatory-target]")
      .forEach((element) => {
        element.classList.toggle(
          "is-active",
          element.dataset.observatoryTarget === selectedTarget.id
        );
      });

    previewTargetName.textContent = selectedTarget.shortName;
    observeButton.querySelector("strong").textContent =
      `OBSERVE ${selectedTarget.shortName}`;
    lockStatus.lastChild.textContent =
      ` ${selectedTarget.name} is aligned with the telescope.`;
  }

  function selectTarget(targetId, align = true) {
    selectedTarget = getTargetById(targetId);

    if (align) {
      const aim = getAimPosition();
      const desiredX = aim.x - selectedTarget.x * window.innerWidth;
      const desiredY = aim.y - selectedTarget.y * window.innerHeight;
      animatePanTo(desiredX, desiredY, 620);
    }

    updateActiveElements();
  }

  function renderControls() {
    targetChips.innerHTML = "";
    moreTargetsPanel.innerHTML = "";
    skyTargets.innerHTML = "";

    PRIMARY_IDS.forEach((targetId) => {
      const target = getTargetById(targetId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "observatory-target-chip";
      button.dataset.observatoryTarget = target.id;
      button.innerHTML = `<span>${target.symbol}</span><b>${target.shortName}</b>`;
      button.addEventListener("click", () => selectTarget(target.id, true));
      targetChips.appendChild(button);
    });

    MORE_IDS.forEach((targetId) => {
      const target = getTargetById(targetId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "observatory-more-chip";
      button.dataset.observatoryTarget = target.id;
      button.textContent = `${target.symbol} ${target.name}`;
      button.addEventListener("click", () => {
        selectTarget(target.id, true);
        closeMoreTargets();
      });
      moreTargetsPanel.appendChild(button);
    });

    TARGETS.forEach((target) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "observatory-sky-marker";
      marker.dataset.observatoryTarget = target.id;
      marker.style.left = `${target.x * 100}%`;
      marker.style.top = `${target.y * 100}%`;
      marker.style.setProperty("--marker-color", target.color);
      marker.innerHTML = `<span>${target.shortName}</span>`;
      marker.setAttribute("aria-label", `Arahkan teleskop ke ${target.name}`);
      marker.addEventListener("click", () => selectTarget(target.id, true));
      skyTargets.appendChild(marker);
    });

    updateActiveElements();
  }

  function closeMoreTargets() {
    moreTargetsPanel.hidden = true;
    moreTargetsButton.setAttribute("aria-expanded", "false");
  }

  moreTargetsButton.addEventListener("click", () => {
    const isExpanded =
      moreTargetsButton.getAttribute("aria-expanded") === "true";

    moreTargetsButton.setAttribute("aria-expanded", String(!isExpanded));
    moreTargetsPanel.hidden = isExpanded;
  });

  function animatePanTo(targetPanX, targetPanY, duration) {
    window.cancelAnimationFrame(animationFrame);

    const startPanX = panX;
    const startPanY = panY;
    const startTime = performance.now();
    const maxX = window.innerWidth * 0.44;
    const maxY = window.innerHeight * 0.35;
    const finalX = clamp(targetPanX, -maxX, maxX);
    const finalY = clamp(targetPanY, -maxY, maxY);

    const easeInOutCubic = (progress) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const step = (currentTime) => {
      const progress = clamp((currentTime - startTime) / duration, 0, 1);
      const eased = easeInOutCubic(progress);

      panX = startPanX + (finalX - startPanX) * eased;
      panY = startPanY + (finalY - startPanY) * eased;
      updatePanVariables();

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    animationFrame = window.requestAnimationFrame(step);
  }

  dragSurface.addEventListener("pointerdown", (event) => {
    if (isTraveling) return;

    pointerId = event.pointerId;
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      panX,
      panY
    };

    app.classList.add("is-dragging");
    dragSurface.setPointerCapture(pointerId);
  });

  dragSurface.addEventListener("pointermove", (event) => {
    if (!dragStart || event.pointerId !== pointerId) return;

    const sensitivity = event.pointerType === "touch" ? 1.45 : 1.2;
    const maxX = window.innerWidth * 0.44;
    const maxY = window.innerHeight * 0.35;

    panX = clamp(
      dragStart.panX + (event.clientX - dragStart.x) * sensitivity,
      -maxX,
      maxX
    );
    panY = clamp(
      dragStart.panY + (event.clientY - dragStart.y) * sensitivity,
      -maxY,
      maxY
    );

    updatePanVariables();
    detectNearestTarget();
  });

  function endDrag(event) {
    if (!dragStart) return;

    if (event && pointerId !== null) {
      try {
        dragSurface.releasePointerCapture(pointerId);
      } catch (_) {
        // No-op: pointer can already be released by the browser.
      }
    }

    dragStart = null;
    pointerId = null;
    app.classList.remove("is-dragging");
  }

  dragSurface.addEventListener("pointerup", endDrag);
  dragSurface.addEventListener("pointercancel", endDrag);

  function detectNearestTarget() {
    const aim = getAimPosition();
    let nearestTarget = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    TARGETS.forEach((target) => {
      const position = targetScreenPosition(target);
      const distance = Math.hypot(position.x - aim.x, position.y - aim.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = target;
      }
    });

    if (nearestTarget && nearestDistance < 62) {
      if (selectedTarget.id !== nearestTarget.id) {
        selectedTarget = nearestTarget;
        updateActiveElements();
      }
    }
  }

  document.addEventListener("keydown", (event) => {
    if (isTraveling || !observationOverlay.hidden) return;

    const step = event.shiftKey ? 70 : 34;
    const maxX = window.innerWidth * 0.44;
    const maxY = window.innerHeight * 0.35;

    if (event.key === "ArrowLeft") panX = clamp(panX + step, -maxX, maxX);
    if (event.key === "ArrowRight") panX = clamp(panX - step, -maxX, maxX);
    if (event.key === "ArrowUp") panY = clamp(panY + step, -maxY, maxY);
    if (event.key === "ArrowDown") panY = clamp(panY - step, -maxY, maxY);

    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
        event.key
      )
    ) {
      event.preventDefault();
      updatePanVariables();
      detectNearestTarget();
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

  function buildSky() {
    const { width, height } = fitCanvas(skyCanvas);
    skyStars = Array.from(
      { length: Math.max(170, Math.floor((width * height) / 7000)) },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.82,
        radius: Math.random() * 1.3 + 0.25,
        alpha: Math.random() * 0.62 + 0.18,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.005
      })
    );

    skyDust = Array.from({ length: 5 }, (_, index) => ({
      x: width * (0.3 + index * 0.08),
      y: height * (0.19 + (index % 3) * 0.06),
      radius: Math.min(width, height) * (0.13 + index * 0.025),
      phase: Math.random() * Math.PI * 2
    }));
  }

  function renderSky(time = 0) {
    const { context, width, height } = fitCanvas(skyCanvas);

    context.clearRect(0, 0, width, height);

    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#020713");
    background.addColorStop(0.62, "#071326");
    background.addColorStop(1, "#10111b");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    skyDust.forEach((dust, index) => {
      const x = dust.x + Math.sin(time * 0.00005 + dust.phase) * 16;
      const y = dust.y + Math.cos(time * 0.000045 + dust.phase) * 10;
      const gradient = context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        dust.radius
      );

      gradient.addColorStop(
        0,
        index % 2 === 0
          ? "rgba(122, 159, 214, 0.055)"
          : "rgba(154, 130, 194, 0.045)"
      );
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, dust.radius, 0, Math.PI * 2);
      context.fill();
    });

    skyStars.forEach((star) => {
      star.phase += star.speed;
      const alpha = star.alpha * (0.72 + Math.sin(star.phase) * 0.28);

      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(235,242,250,${Math.max(0.04, alpha)})`;
      context.fill();
    });

    window.requestAnimationFrame(renderSky);
  }

  function createTunnelRenderer(canvas, options = {}) {
    let meta = fitCanvas(canvas);
    const stars = [];
    const rings = [];
    const starCount = options.starCount || 190;
    const ringCount = options.ringCount || 24;
    const speed = options.speed || 1;
    let running = true;
    let lastTime = performance.now();

    const resetStar = () => ({
      x: (Math.random() - 0.5) * meta.width * 1.7,
      y: (Math.random() - 0.5) * meta.height * 1.7,
      z: Math.random() * 1000 + 30,
      previousZ: 1000,
      hue: 190 + Math.random() * 42
    });

    for (let index = 0; index < starCount; index += 1) {
      stars.push(resetStar());
    }

    for (let index = 0; index < ringCount; index += 1) {
      rings.push({
        z: index * (1000 / ringCount),
        rotation: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.55
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
      const focalLength = Math.min(width, height) * 0.82;

      context.fillStyle = options.fade
        ? "rgba(0, 2, 9, 0.2)"
        : "#000207";
      context.fillRect(0, 0, width, height);

      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.min(width, height) * 0.34
      );
      core.addColorStop(0, "rgba(232,245,255,0.16)");
      core.addColorStop(0.25, "rgba(79,147,219,0.12)");
      core.addColorStop(0.58, "rgba(89,61,169,0.07)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = core;
      context.fillRect(0, 0, width, height);

      rings.forEach((ring, index) => {
        ring.z -= delta * speed * 0.72;

        if (ring.z < 8) {
          ring.z += 1000;
          ring.rotation = Math.random() * Math.PI * 2;
          ring.tilt = (Math.random() - 0.5) * 0.55;
        }

        const scale = focalLength / ring.z;
        const radius = Math.min(width, height) * 0.17 * scale;
        const alpha = clamp(1 - ring.z / 1000, 0, 1) * 0.25;

        if (radius < 2 || radius > Math.max(width, height) * 2) return;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(ring.rotation + currentTime * 0.00015 * (index % 2 ? 1 : -1));
        context.scale(1, 0.55 + ring.tilt * 0.12);
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.strokeStyle =
          index % 3 === 0
            ? `rgba(133,190,239,${alpha})`
            : index % 3 === 1
              ? `rgba(192,139,235,${alpha * 0.75})`
              : `rgba(245,224,198,${alpha * 0.6})`;
        context.lineWidth = Math.max(0.5, scale * 1.4);
        context.stroke();
        context.restore();
      });

      stars.forEach((star, index) => {
        star.previousZ = star.z;
        star.z -= delta * speed * 2.6;

        if (star.z < 10) {
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
          `hsla(${star.hue}, 90%, 90%, ${alpha})`
        );

        context.strokeStyle = gradient;
        context.lineWidth = clamp(scale * 1.8, 0.5, 5);
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(x, y);
        context.stroke();
      });

      const tunnelEdge = context.createRadialGradient(
        centerX,
        centerY,
        Math.min(width, height) * 0.12,
        centerX,
        centerY,
        Math.min(width, height) * 0.5
      );
      tunnelEdge.addColorStop(0, "rgba(0,0,0,0)");
      tunnelEdge.addColorStop(0.62, "rgba(3,8,25,0.08)");
      tunnelEdge.addColorStop(1, "rgba(0,0,0,0.78)");
      context.fillStyle = tunnelEdge;
      context.fillRect(0, 0, width, height);

      window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    window.requestAnimationFrame(render);

    return {
      stop() {
        running = false;
      },
      start() {
        if (running) return;
        running = true;
        lastTime = performance.now();
        window.requestAnimationFrame(render);
      },
      resize
    };
  }

  function playObservationVideo(target) {
    observationFallback.hidden = true;
    observationVideo.hidden = false;
    observationVideo.pause();
    observationVideo.removeAttribute("src");
    observationVideo.load();

    observationVideo.src = target.video;
    observationVideo.load();

    let fallbackTimer = window.setTimeout(() => {
      if (observationVideo.readyState < 2) {
        observationFallback.hidden = false;
      }
    }, 5500);

    observationVideo.onloadeddata = () => {
      window.clearTimeout(fallbackTimer);
      observationFallback.hidden = true;

      const playPromise = observationVideo.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Muted video normally autoplays. If the browser blocks it,
          // the user can tap anywhere on the observation screen.
        });
      }
    };

    observationVideo.onerror = () => {
      window.clearTimeout(fallbackTimer);
      observationFallback.hidden = false;
    };
  }

  function updateObservationContent(target) {
    const values = {
      observationTitle: target.name,
      observationHudTarget: target.shortName,
      observationType: target.type,
      observationName: target.name,
      observationPoetry: target.poetry,
      observationDistance: target.distance,
      observationLight: target.light,
      observationDescription: target.description
    };

    Object.entries(values).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);

      if (element) {
        element.textContent = value;
      }
    });

    observationSourceLink.href = target.source;
    playObservationVideo(target);
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
    if (isTraveling || !observationOverlay.hidden) return;

    isTraveling = true;
    closeMoreTargets();
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
        travelTunnel.start();
        travelTunnel.resize();
      }
    }, 720);

    window.setTimeout(() => {
      openObservation(selectedTarget);
    }, 2900);
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
    if (event.target === observationOverlay) {
      closeObservation();
    }

    if (
      event.target === observationVideo &&
      observationVideo.paused
    ) {
      observationVideo.play().catch(() => {});
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!observationOverlay.hidden) {
        closeObservation();
      } else if (isTraveling) {
        resetTravelState();
      }
    }
  });

  function moveObservation(direction) {
    const currentIndex = TARGETS.findIndex(
      (target) => target.id === selectedTarget.id
    );
    const nextIndex =
      (currentIndex + direction + TARGETS.length) % TARGETS.length;

    selectedTarget = TARGETS[nextIndex];
    updateActiveElements();
    updateObservationContent(selectedTarget);
  }

  previousTargetButton.addEventListener("click", () =>
    moveObservation(-1)
  );
  nextTargetButton.addEventListener("click", () =>
    moveObservation(1)
  );

  function onResize() {
    buildSky();

    const aim = getAimPosition();
    const targetPosition = targetScreenPosition(selectedTarget);
    const differenceX = aim.x - targetPosition.x;
    const differenceY = aim.y - targetPosition.y;

    panX = clamp(
      panX + differenceX,
      -window.innerWidth * 0.44,
      window.innerWidth * 0.44
    );
    panY = clamp(
      panY + differenceY,
      -window.innerHeight * 0.35,
      window.innerHeight * 0.35
    );

    updatePanVariables();

    if (previewTunnel) previewTunnel.resize();
    if (travelTunnel) travelTunnel.resize();
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(onResize.timer);
    onResize.timer = window.setTimeout(onResize, 130);
  });

  renderControls();
  buildSky();
  renderSky();

  previewTunnel = createTunnelRenderer(previewTunnelCanvas, {
    speed: 0.34,
    starCount: 105,
    ringCount: 10,
    fade: true
  });

  travelTunnel = createTunnelRenderer(travelCanvas, {
    speed: 1.28,
    starCount: 280,
    ringCount: 34,
    fade: false
  });

  selectTarget("moon", true);
})();
