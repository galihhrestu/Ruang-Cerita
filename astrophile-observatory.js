/* =========================================================
   ASTROPHILE'S OBSERVATORY V7 — THE CELESTIAL ATLAS

   Naked-eye mode:
   - Thousands of stars
   - Drag with momentum
   - Wheel / pinch zoom
   - Only planets, galaxies, and nebulae are interactive

   Telescope mode:
   - Eyepiece transition
   - Three-dimensional corridor
   - NASA moving imagery
   - Pan and zoom remain available
========================================================= */

(() => {
  "use strict";

  const atlasApp = document.getElementById("atlasApp");
  const atlasSkyCanvas = document.getElementById("atlasSkyCanvas");
  const atlasDragSurface = document.getElementById("atlasDragSurface");
  const atlasObjectLayer = document.getElementById("atlasObjectLayer");
  const atlasSelectionCard = document.getElementById("atlasSelectionCard");
  const atlasSelectionClose = document.getElementById("atlasSelectionClose");
  const atlasObserveButton = document.getElementById("atlasObserveButton");
  const atlasExplorerButton = document.getElementById("atlasExplorerButton");
  const atlasExplorerPanel = document.getElementById("atlasExplorerPanel");
  const atlasExplorerList = document.getElementById("atlasExplorerList");
  const atlasRandomButton = document.getElementById("atlasRandomButton");
  const atlasZoomMeter = document.getElementById("atlasZoomMeter");
  const atlasZoomValue = document.getElementById("atlasZoomValue");
  const atlasEyepieceOverlay = document.getElementById("atlasEyepieceOverlay");
  const atlasTravelOverlay = document.getElementById("atlasTravelOverlay");
  const atlasTravelCanvas = document.getElementById("atlasTravelCanvas");
  const atlasTravelTitle = document.getElementById("atlasTravelTitle");
  const atlasBackButton = document.getElementById("atlasBackButton");
  const atlasClock = document.getElementById("atlasClock");

  const telescopeOverlay = document.getElementById("telescopeOverlay");
  const telescopeViewport = document.getElementById("telescopeViewport");
  const telescopeWorld = document.getElementById("telescopeWorld");
  const telescopeVideo = document.getElementById("telescopeVideo");
  const telescopeMediaFallback = document.getElementById("telescopeMediaFallback");
  const telescopeStarCanvas = document.getElementById("telescopeStarCanvas");
  const telescopeExitButton = document.getElementById("telescopeExitButton");
  const telescopeInfoButton = document.getElementById("telescopeInfoButton");
  const telescopeInfoPanel = document.getElementById("telescopeInfoPanel");
  const telescopeInfoClose = document.getElementById("telescopeInfoClose");
  const telescopeZoomOut = document.getElementById("telescopeZoomOut");
  const telescopeZoomIn = document.getElementById("telescopeZoomIn");
  const telescopeRecenter = document.getElementById("telescopeRecenter");
  const telescopePreviousObject = document.getElementById("telescopePreviousObject");
  const telescopeNextObject = document.getElementById("telescopeNextObject");
  const telescopeZoomReadout = document.getElementById("telescopeZoomReadout");
  const telescopeSourceLink = document.getElementById("telescopeSourceLink");

  if (
    !atlasApp ||
    !atlasSkyCanvas ||
    !atlasDragSurface ||
    !atlasObjectLayer ||
    !atlasSelectionCard ||
    !atlasObserveButton ||
    !atlasTravelCanvas ||
    !telescopeOverlay ||
    !telescopeViewport ||
    !telescopeWorld ||
    !telescopeVideo ||
    !telescopeStarCanvas
  ) {
    return;
  }

  const embedded =
    new URLSearchParams(window.location.search).get("embedded") === "1";

  if (embedded && atlasBackButton) {
    atlasBackButton.addEventListener("click", (event) => {
      event.preventDefault();

      window.parent.postMessage(
        { type: "CELESTIAL_EXPERIENCE_CLOSE" },
        window.location.origin
      );
    });
  }

  const OBJECTS = [
    {
      id: "moon",
      name: "The Moon",
      shortName: "THE MOON",
      symbol: "☾",
      type: "EARTH’S MOON",
      kind: "Natural satellite",
      shape: "planet",
      worldX: 0.14,
      worldY: 0.18,
      size: 10,
      color: "#f0dfc2",
      glow: "rgba(240,223,194,.52)",
      distance: "384,400 km",
      light: "1.3 seconds",
      mission: "NASA Clementine",
      poetry: "The nearest world, still beautifully far away.",
      description:
        "Rotasi ini menggunakan data misi Clementine NASA. Visual bergeraknya dibangun dari pemetaan permukaan Bulan, bukan ilustrasi planet canvas sederhana.",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.31,
      worldY: 0.34,
      size: 7,
      color: "#d8c6ae",
      glow: "rgba(216,198,174,.46)",
      distance: "≈91 million km",
      light: "≈5 minutes",
      mission: "NASA MESSENGER",
      poetry: "A scarred world racing closest to the Sun.",
      description:
        "Visual Mercury menggunakan citra wahana MESSENGER untuk memperlihatkan permukaan berbatu dan kawahnya secara lebih nyata.",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.48,
      worldY: 0.14,
      size: 8,
      color: "#e3c78f",
      glow: "rgba(227,199,143,.48)",
      distance: "≈41 million km",
      light: "≈2.3 minutes",
      mission: "NASA Magellan",
      poetry: "A luminous world hidden beneath restless cloud.",
      description:
        "Visual Venus menggunakan pemetaan radar Magellan NASA dan menampilkan struktur global planet berdasarkan data misi.",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.67,
      worldY: 0.3,
      size: 8,
      color: "#d88b72",
      glow: "rgba(216,139,114,.48)",
      distance: "≈225 million km",
      light: "≈12.5 minutes",
      mission: "Viking + MOLA",
      poetry: "A rust-colored silence turning beyond the dark.",
      description:
        "Rotasi Mars menggunakan citra Viking yang diterapkan pada data topografi MOLA NASA, sehingga teksturnya berbasis observasi misi.",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.82,
      worldY: 0.16,
      size: 12,
      color: "#dfbc91",
      glow: "rgba(223,188,145,.5)",
      distance: "≈780 million km",
      light: "≈43 minutes",
      mission: "NASA Hubble",
      poetry: "A storm-lit giant carrying worlds in its gravity.",
      description:
        "Visual bergerak Jupiter dibuat dari peta Hubble NASA. Pita atmosfer dan Great Red Spot berasal dari hasil observasi.",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.91,
      worldY: 0.46,
      size: 11,
      color: "#e3c393",
      glow: "rgba(227,195,147,.5)",
      distance: "≈1.4 billion km",
      light: "≈79 minutes",
      mission: "NASA Hubble",
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
      kind: "Planet",
      shape: "planet",
      worldX: 0.72,
      worldY: 0.62,
      size: 8,
      color: "#9bd9df",
      glow: "rgba(155,217,223,.52)",
      distance: "≈2.9 billion km",
      light: "≈2.7 hours",
      mission: "NASA Goddard",
      poetry: "A quiet blue-green world suspended in restraint.",
      description:
        "Visual Uranus berasal dari materi NASA Goddard Conceptual Image Lab yang dibuat untuk eksplorasi ilmiah planet dan sistem cincinnya.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a020000/a020300/a020390/Shot4_1k_mp4.mp4",
      source: "https://svs.gsfc.nasa.gov/20390/"
    },
    {
      id: "andromeda",
      name: "Andromeda Galaxy",
      shortName: "ANDROMEDA",
      symbol: "∞",
      type: "SPIRAL GALAXY · M31",
      kind: "Galaxy",
      shape: "galaxy",
      worldX: 0.23,
      worldY: 0.63,
      size: 12,
      color: "#cfc8e7",
      glow: "rgba(207,200,231,.5)",
      distance: "≈2.5 million ly",
      light: "2.5 million years",
      mission: "NASA Swift",
      poetry: "A whole galaxy arriving as an ancient whisper.",
      description:
        "Video NASA membawa pengguna menjelajahi M31 melalui citra ultraviolet Swift, memperlihatkan gugus bintang muda dan struktur galaksinya.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a010000/a011600/a011675/10485-540-MASTER_high.mp4",
      source: "https://svs.gsfc.nasa.gov/11675/"
    },
    {
      id: "orion",
      name: "Orion Nebula",
      shortName: "ORION NEBULA",
      symbol: "✧",
      type: "STELLAR NURSERY · M42",
      kind: "Nebula",
      shape: "nebula",
      worldX: 0.5,
      worldY: 0.5,
      size: 11,
      color: "#bda5d5",
      glow: "rgba(189,165,213,.48)",
      distance: "≈1,344 light-years",
      light: "1,344 years",
      mission: "Hubble + Spitzer",
      poetry: "A cloud of light where new suns quietly begin.",
      description:
        "Animasi NASA memperlihatkan Orion dalam cahaya tampak Hubble, inframerah Spitzer, dan gabungan keduanya.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a030000/a030900/a030959/STScI-H-Orion_1x-1280x720.mp4",
      source: "https://svs.gsfc.nasa.gov/30959/"
    },
    {
      id: "m101",
      name: "Pinwheel Galaxy",
      shortName: "PINWHEEL · M101",
      symbol: "✦",
      type: "SPIRAL GALAXY · M101",
      kind: "Galaxy",
      shape: "galaxy",
      worldX: 0.93,
      worldY: 0.72,
      size: 12,
      color: "#b7c8e7",
      glow: "rgba(183,200,231,.48)",
      distance: "≈21 million ly",
      light: "21 million years",
      mission: "Hubble + Spitzer + Chandra",
      poetry: "A spiral city of stars turning beyond imagination.",
      description:
        "Animasi M101 memperlihatkan rotasi simulasi dalam cahaya tampak, inframerah, sinar-X, lalu gabungan ketiganya.",
      video:
        "https://svs.gsfc.nasa.gov/vis/a030000/a030900/a030969/STScI-H-M101_1x-1280x720.mp4",
      source: "https://svs.gsfc.nasa.gov/30969/"
    }
  ];

  const WORLD = {
    width: 4200,
    height: 2500
  };

  const CAMERA_LIMITS = {
    minZoom: 0.66,
    maxZoom: 2.45
  };

  const camera = {
    x: WORLD.width * 0.5,
    y: WORLD.height * 0.48,
    zoom: 1,
    targetX: WORLD.width * 0.5,
    targetY: WORLD.height * 0.48,
    targetZoom: 1,
    velocityX: 0,
    velocityY: 0
  };

  let skyMeta = null;
  let skyStars = [];
  let skyBrightStars = [];
  let skyMilkyDust = [];
  let constellationLines = [];
  let markerElements = new Map();

  let selectedObject = null;
  let atlasPointer = null;
  let atlasPinch = null;
  let atlasLastFrame = performance.now();
  let atlasIsTraveling = false;
  let atlasTravelTunnel = null;

  const telescopeCamera = {
    x: 0,
    y: 0,
    zoom: 1
  };

  let telescopePointer = null;
  let telescopePinch = null;
  let telescopeStarState = null;
  let telescopeIdleTimer = null;
  let telescopeVideoFallbackTimer = null;

  const clamp = (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value));

  const lerp = (from, to, amount) =>
    from + (to - from) * amount;

  function objectWorldPosition(object) {
    return {
      x: object.worldX * WORLD.width,
      y: object.worldY * WORLD.height
    };
  }

  function worldToScreen(worldX, worldY) {
    return {
      x:
        window.innerWidth * 0.5 +
        (worldX - camera.x) * camera.zoom,
      y:
        window.innerHeight * 0.5 +
        (worldY - camera.y) * camera.zoom
    };
  }

  function screenToWorld(screenX, screenY) {
    return {
      x:
        camera.x +
        (screenX - window.innerWidth * 0.5) / camera.zoom,
      y:
        camera.y +
        (screenY - window.innerHeight * 0.5) / camera.zoom
    };
  }

  function constrainCameraTargets() {
    const halfViewportWorldWidth =
      window.innerWidth / (2 * camera.targetZoom);
    const halfViewportWorldHeight =
      window.innerHeight / (2 * camera.targetZoom);

    camera.targetX = clamp(
      camera.targetX,
      halfViewportWorldWidth,
      WORLD.width - halfViewportWorldWidth
    );

    camera.targetY = clamp(
      camera.targetY,
      halfViewportWorldHeight,
      WORLD.height - halfViewportWorldHeight
    );
  }

  function updateClock() {
    if (!atlasClock) return;

    atlasClock.textContent = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  }

  updateClock();
  window.setInterval(updateClock, 30000);

  function fitCanvas(canvas) {
    const rectangle = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, rectangle.width);
    const height = Math.max(1, rectangle.height);
    const context = canvas.getContext("2d");

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    return {
      context,
      width,
      height,
      pixelRatio
    };
  }

  function seededRandomFactory(initialSeed) {
    let seed = initialSeed >>> 0;

    return () => {
      seed =
        (seed * 1664525 + 1013904223) >>> 0;

      return seed / 4294967296;
    };
  }

  function buildSkyData() {
    skyMeta = fitCanvas(atlasSkyCanvas);

    const random = seededRandomFactory(29072026);

    skyStars = Array.from({ length: 1750 }, () => ({
      x: random() * WORLD.width,
      y: random() * WORLD.height * 0.9,
      radius: 0.28 + random() * 1.36,
      alpha: 0.11 + random() * 0.7,
      phase: random() * Math.PI * 2,
      speed: 0.004 + random() * 0.018,
      temperature:
        random() < 0.08
          ? "warm"
          : random() < 0.18
            ? "blue"
            : "white"
    }));

    skyBrightStars = [
      {
        name: "Sirius",
        x: WORLD.width * 0.11,
        y: WORLD.height * 0.43,
        magnitude: 2.2,
        color: "#dceeff"
      },
      {
        name: "Vega",
        x: WORLD.width * 0.39,
        y: WORLD.height * 0.25,
        magnitude: 1.8,
        color: "#d7eaff"
      },
      {
        name: "Altair",
        x: WORLD.width * 0.57,
        y: WORLD.height * 0.37,
        magnitude: 1.55,
        color: "#f3f2ea"
      },
      {
        name: "Betelgeuse",
        x: WORLD.width * 0.46,
        y: WORLD.height * 0.56,
        magnitude: 1.8,
        color: "#e1a286"
      },
      {
        name: "Rigel",
        x: WORLD.width * 0.53,
        y: WORLD.height * 0.63,
        magnitude: 1.75,
        color: "#c9e2ff"
      },
      {
        name: "Aldebaran",
        x: WORLD.width * 0.26,
        y: WORLD.height * 0.56,
        magnitude: 1.6,
        color: "#e7ad89"
      },
      {
        name: "Deneb",
        x: WORLD.width * 0.72,
        y: WORLD.height * 0.22,
        magnitude: 1.65,
        color: "#d8e9ff"
      },
      {
        name: "Antares",
        x: WORLD.width * 0.84,
        y: WORLD.height * 0.58,
        magnitude: 1.7,
        color: "#dc856f"
      },
      {
        name: "Polaris",
        x: WORLD.width * 0.63,
        y: WORLD.height * 0.12,
        magnitude: 1.5,
        color: "#f3ead8"
      }
    ];

    skyMilkyDust = Array.from({ length: 410 }, () => ({
      along: random(),
      offset: (random() - 0.5) * 1.2,
      radius: 0.35 + random() * 2.8,
      alpha: 0.012 + random() * 0.11,
      hue: random() < 0.5 ? "blue" : "violet"
    }));

    constellationLines = [
      [0, 1],
      [1, 2],
      [3, 4],
      [3, 5],
      [6, 8],
      [2, 7]
    ];
  }

  function drawBackground(context, width, height) {
    const gradient = context.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, "#010611");
    gradient.addColorStop(0.55, "#061328");
    gradient.addColorStop(0.78, "#0d1830");
    gradient.addColorStop(1, "#11121b");

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const horizonGlow = context.createRadialGradient(
      width * 0.68,
      height * 0.82,
      0,
      width * 0.68,
      height * 0.82,
      width * 0.46
    );

    horizonGlow.addColorStop(
      0,
      "rgba(191, 140, 104, 0.11)"
    );
    horizonGlow.addColorStop(
      0.35,
      "rgba(102, 111, 155, 0.065)"
    );
    horizonGlow.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    context.fillStyle = horizonGlow;
    context.fillRect(0, 0, width, height);
  }

  function drawMilkyWay(context, time) {
    const angle = -0.78;
    const centerWorld = {
      x: WORLD.width * 0.5,
      y: WORLD.height * 0.43
    };

    context.save();

    skyMilkyDust.forEach((dust, index) => {
      const alongDistance =
        (dust.along - 0.5) * WORLD.width * 1.15;

      const acrossDistance =
        dust.offset * WORLD.height * 0.19 +
        Math.sin(index * 0.73 + time * 0.00008) * 7;

      const worldX =
        centerWorld.x +
        Math.cos(angle) * alongDistance -
        Math.sin(angle) * acrossDistance;

      const worldY =
        centerWorld.y +
        Math.sin(angle) * alongDistance +
        Math.cos(angle) * acrossDistance;

      const screen = worldToScreen(worldX, worldY);

      if (
        screen.x < -40 ||
        screen.x > window.innerWidth + 40 ||
        screen.y < -40 ||
        screen.y > window.innerHeight + 40
      ) {
        return;
      }

      const radius =
        dust.radius * camera.zoom;

      context.beginPath();
      context.arc(
        screen.x,
        screen.y,
        Math.max(0.35, radius),
        0,
        Math.PI * 2
      );

      context.fillStyle =
        dust.hue === "blue"
          ? `rgba(168,194,224,${dust.alpha})`
          : `rgba(187,160,209,${dust.alpha * 0.82})`;

      context.fill();
    });

    context.restore();
  }

  function drawConstellations(context) {
    context.save();
    context.setLineDash([2, 7]);
    context.lineWidth = 0.7;
    context.strokeStyle = "rgba(191,229,237,0.06)";

    constellationLines.forEach(([fromIndex, toIndex]) => {
      const fromStar = skyBrightStars[fromIndex];
      const toStar = skyBrightStars[toIndex];
      const from = worldToScreen(fromStar.x, fromStar.y);
      const to = worldToScreen(toStar.x, toStar.y);

      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    });

    context.restore();
  }

  function drawStars(context, time) {
    skyStars.forEach((star) => {
      star.phase += star.speed;

      const screen = worldToScreen(star.x, star.y);

      if (
        screen.x < -6 ||
        screen.x > window.innerWidth + 6 ||
        screen.y < -6 ||
        screen.y > window.innerHeight + 6
      ) {
        return;
      }

      const twinkle =
        0.68 + Math.sin(star.phase + time * 0.0001) * 0.32;

      const alpha =
        Math.max(0.025, star.alpha * twinkle);

      const radius =
        Math.max(
          0.22,
          star.radius * Math.pow(camera.zoom, 0.42)
        );

      context.beginPath();
      context.arc(
        screen.x,
        screen.y,
        radius,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        star.temperature === "warm"
          ? `rgba(247,218,191,${alpha})`
          : star.temperature === "blue"
            ? `rgba(205,226,252,${alpha})`
            : `rgba(235,241,247,${alpha})`;

      context.fill();
    });

    skyBrightStars.forEach((star, index) => {
      const screen = worldToScreen(star.x, star.y);

      if (
        screen.x < -80 ||
        screen.x > window.innerWidth + 80 ||
        screen.y < -80 ||
        screen.y > window.innerHeight + 80
      ) {
        return;
      }

      const pulse =
        0.74 +
        Math.sin(time * 0.0011 + index * 1.3) * 0.26;

      const radius =
        star.magnitude * Math.pow(camera.zoom, 0.45);

      const glow = context.createRadialGradient(
        screen.x,
        screen.y,
        0,
        screen.x,
        screen.y,
        radius * 10
      );

      const brightColor =
        star.color === "#e1a286" ||
        star.color === "#e7ad89" ||
        star.color === "#dc856f"
          ? `rgba(230,164,132,${0.46 * pulse})`
          : star.color === "#c9e2ff" ||
              star.color === "#d7eaff" ||
              star.color === "#d8e9ff" ||
              star.color === "#dceeff"
            ? `rgba(205,228,255,${0.46 * pulse})`
            : `rgba(246,239,225,${0.46 * pulse})`;

      glow.addColorStop(0, brightColor);

      glow.addColorStop(
        1,
        "rgba(255,255,255,0)"
      );

      context.fillStyle = glow;
      context.beginPath();
      context.arc(
        screen.x,
        screen.y,
        radius * 10,
        0,
        Math.PI * 2
      );
      context.fill();

      context.beginPath();
      context.arc(
        screen.x,
        screen.y,
        Math.max(1, radius),
        0,
        Math.PI * 2
      );
      context.fillStyle = star.color;
      context.fill();

      if (camera.zoom > 1.45) {
        context.fillStyle =
          "rgba(246,239,230,0.34)";
        context.font =
          '700 7px "DM Sans", sans-serif';
        context.letterSpacing = "0.08em";
        context.fillText(
          star.name.toUpperCase(),
          screen.x + 8,
          screen.y - 7
        );
      }
    });
  }

  function drawMountains(context, width, height) {
    const layers = [
      {
        base: 0.8,
        amplitude: 0.045,
        color: "#101827",
        seed: 1.6
      },
      {
        base: 0.87,
        amplitude: 0.064,
        color: "#080d16",
        seed: 3.1
      },
      {
        base: 0.94,
        amplitude: 0.08,
        color: "#03060b",
        seed: 4.7
      }
    ];

    layers.forEach((layer) => {
      context.beginPath();
      context.moveTo(0, height);

      for (
        let x = 0;
        x <= width;
        x += width / 26
      ) {
        const normalizedX = x / width;

        const noise =
          Math.sin(
            normalizedX * Math.PI * 4.7 +
            layer.seed
          ) *
            0.4 +
          Math.sin(
            normalizedX * Math.PI * 10.3 +
            layer.seed * 1.6
          ) *
            0.18 +
          Math.sin(
            normalizedX * Math.PI * 2.2 +
            layer.seed * 0.7
          ) *
            0.42;

        const y =
          height * layer.base -
          noise * height * layer.amplitude;

        context.lineTo(x, y);
      }

      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = layer.color;
      context.fill();
    });
  }

  function renderAtlasSky(time = 0) {
    if (!skyMeta) {
      buildSkyData();
    }

    const { context, width, height } = skyMeta;

    camera.x = lerp(camera.x, camera.targetX, 0.09);
    camera.y = lerp(camera.y, camera.targetY, 0.09);
    camera.zoom = lerp(camera.zoom, camera.targetZoom, 0.09);

    camera.targetX += camera.velocityX;
    camera.targetY += camera.velocityY;
    camera.velocityX *= 0.9;
    camera.velocityY *= 0.9;

    constrainCameraTargets();

    context.clearRect(0, 0, width, height);
    drawBackground(context, width, height);
    drawMilkyWay(context, time);
    drawConstellations(context);
    drawStars(context, time);
    drawMountains(context, width, height);
    updateObjectMarkers();
    updateZoomMeter();

    window.requestAnimationFrame(renderAtlasSky);
  }

  function renderObjectMarkers() {
    atlasObjectLayer.innerHTML = "";
    atlasExplorerList.innerHTML = "";
    markerElements.clear();

    OBJECTS.forEach((object) => {
      const marker = document.createElement("button");

      marker.type = "button";
      marker.className = "atlas-object-marker";
      marker.dataset.objectId = object.id;
      marker.dataset.shape = object.shape;
      marker.style.setProperty(
        "--object-size",
        `${object.size}px`
      );
      marker.style.setProperty(
        "--object-color",
        object.color
      );
      marker.style.setProperty(
        "--object-glow",
        object.glow
      );

      marker.innerHTML = `
        <span class="atlas-object-core"></span>
        <i class="atlas-object-orbit"></i>
        <b class="atlas-object-label">${object.shortName}</b>
      `;

      marker.setAttribute(
        "aria-label",
        `Pilih ${object.name}`
      );

      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        focusObject(object.id);
      });

      atlasObjectLayer.appendChild(marker);
      markerElements.set(object.id, marker);

      const explorerItem =
        document.createElement("button");

      explorerItem.type = "button";
      explorerItem.className =
        "atlas-explorer-item";
      explorerItem.dataset.objectId = object.id;

      explorerItem.innerHTML = `
        <span>${object.symbol}</span>
        <div>
          <strong>${object.name}</strong>
          <small>${object.type}</small>
        </div>
        <b>↗</b>
      `;

      explorerItem.addEventListener("click", () => {
        focusObject(object.id);
        closeExplorer();
      });

      atlasExplorerList.appendChild(explorerItem);
    });
  }

  function updateObjectMarkers() {
    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.5;

    OBJECTS.forEach((object) => {
      const element = markerElements.get(object.id);

      if (!element) return;

      const world = objectWorldPosition(object);
      const screen = worldToScreen(world.x, world.y);

      const visible =
        screen.x > -90 &&
        screen.x < window.innerWidth + 90 &&
        screen.y > -90 &&
        screen.y < window.innerHeight + 90;

      const distanceFromCenter =
        Math.hypot(
          screen.x - centerX,
          screen.y - centerY
        );

      const markerScale =
        clamp(
          Math.pow(camera.zoom, 0.33),
          0.72,
          1.5
        );

      element.style.left = `${screen.x}px`;
      element.style.top = `${screen.y}px`;
      element.style.setProperty(
        "--marker-scale",
        markerScale
      );

      element.classList.toggle(
        "is-visible",
        visible
      );

      element.classList.toggle(
        "is-selected",
        selectedObject?.id === object.id
      );

      element.classList.toggle(
        "is-near-center",
        distanceFromCenter < 95
      );
    });

    document
      .querySelectorAll(".atlas-explorer-item")
      .forEach((element) => {
        element.classList.toggle(
          "is-active",
          element.dataset.objectId ===
            selectedObject?.id
        );
      });
  }

  function updateZoomMeter() {
    const normalized =
      (camera.zoom - CAMERA_LIMITS.minZoom) /
      (CAMERA_LIMITS.maxZoom -
        CAMERA_LIMITS.minZoom);

    const fill =
      atlasZoomMeter.querySelector("i b");

    fill.style.width =
      `${clamp(normalized * 100, 4, 100)}%`;

    atlasZoomValue.textContent =
      `${camera.zoom.toFixed(1)}×`;
  }

  function focusObject(objectId) {
    const object =
      OBJECTS.find((item) => item.id === objectId);

    if (!object) return;

    selectedObject = object;

    const world = objectWorldPosition(object);

    camera.targetX = world.x;
    camera.targetY = world.y;

    camera.targetZoom =
      clamp(
        Math.max(camera.targetZoom, 1.12),
        CAMERA_LIMITS.minZoom,
        CAMERA_LIMITS.maxZoom
      );

    camera.velocityX = 0;
    camera.velocityY = 0;

    updateSelectionCard();
    updateObjectMarkers();
  }

  function updateSelectionCard() {
    if (!selectedObject) {
      atlasSelectionCard.hidden = true;
      atlasApp.classList.remove("has-selection");
      return;
    }

    const values = {
      atlasSelectionType: selectedObject.type,
      atlasSelectionName: selectedObject.name,
      atlasSelectionPoetry:
        selectedObject.poetry,
      atlasSelectionDistance:
        selectedObject.distance,
      atlasSelectionKind:
        selectedObject.kind
    };

    Object.entries(values).forEach(
      ([elementId, value]) => {
        const element =
          document.getElementById(elementId);

        if (element) {
          element.textContent = value;
        }
      }
    );

    atlasSelectionCard.hidden = false;
    atlasApp.classList.add("has-selection");
  }

  function clearSelection() {
    selectedObject = null;
    updateSelectionCard();
    updateObjectMarkers();
  }

  atlasSelectionClose.addEventListener(
    "click",
    clearSelection
  );

  function openExplorer() {
    atlasExplorerPanel.hidden = false;
    atlasExplorerButton.setAttribute(
      "aria-expanded",
      "true"
    );
    atlasExplorerButton.querySelector("b").textContent =
      "−";
  }

  function closeExplorer() {
    atlasExplorerPanel.hidden = true;
    atlasExplorerButton.setAttribute(
      "aria-expanded",
      "false"
    );
    atlasExplorerButton.querySelector("b").textContent =
      "＋";
  }

  atlasExplorerButton.addEventListener(
    "click",
    () => {
      if (atlasExplorerPanel.hidden) {
        openExplorer();
      } else {
        closeExplorer();
      }
    }
  );

  atlasRandomButton.addEventListener(
    "click",
    () => {
      let object =
        OBJECTS[
          Math.floor(Math.random() * OBJECTS.length)
        ];

      if (
        selectedObject &&
        OBJECTS.length > 1
      ) {
        while (object.id === selectedObject.id) {
          object =
            OBJECTS[
              Math.floor(
                Math.random() * OBJECTS.length
              )
            ];
        }
      }

      focusObject(object.id);
      closeExplorer();
    }
  );

  function applyAtlasZoom(
    nextZoom,
    screenX,
    screenY
  ) {
    const oldWorldPoint =
      screenToWorld(screenX, screenY);

    camera.targetZoom = clamp(
      nextZoom,
      CAMERA_LIMITS.minZoom,
      CAMERA_LIMITS.maxZoom
    );

    const targetWorldPoint = {
      x:
        camera.targetX +
        (screenX - window.innerWidth * 0.5) /
          camera.targetZoom,
      y:
        camera.targetY +
        (screenY - window.innerHeight * 0.5) /
          camera.targetZoom
    };

    camera.targetX +=
      oldWorldPoint.x - targetWorldPoint.x;

    camera.targetY +=
      oldWorldPoint.y - targetWorldPoint.y;

    constrainCameraTargets();
  }

  atlasDragSurface.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const zoomFactor =
        Math.exp(-event.deltaY * 0.0011);

      applyAtlasZoom(
        camera.targetZoom * zoomFactor,
        event.clientX,
        event.clientY
      );
    },
    { passive: false }
  );

  atlasDragSurface.addEventListener(
    "pointerdown",
    (event) => {
      if (atlasIsTraveling) return;

      atlasDragSurface.setPointerCapture(
        event.pointerId
      );

      atlasApp.classList.add("is-dragging");

      atlasPointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false
      };
    }
  );

  atlasDragSurface.addEventListener(
    "pointermove",
    (event) => {
      if (
        !atlasPointer ||
        atlasPointer.id !== event.pointerId
      ) {
        return;
      }

      const deltaX =
        event.clientX - atlasPointer.lastX;
      const deltaY =
        event.clientY - atlasPointer.lastY;

      atlasPointer.lastX = event.clientX;
      atlasPointer.lastY = event.clientY;

      if (
        Math.abs(
          event.clientX -
            atlasPointer.startX
        ) +
          Math.abs(
            event.clientY -
              atlasPointer.startY
          ) >
        5
      ) {
        atlasPointer.moved = true;
      }

      camera.targetX -=
        deltaX / camera.targetZoom;

      camera.targetY -=
        deltaY / camera.targetZoom;

      camera.velocityX =
        (-deltaX / camera.targetZoom) * 0.22;

      camera.velocityY =
        (-deltaY / camera.targetZoom) * 0.22;

      constrainCameraTargets();
    }
  );

  function endAtlasPointer(event) {
    if (!atlasPointer) return;

    try {
      atlasDragSurface.releasePointerCapture(
        event.pointerId
      );
    } catch (_) {
      // Pointer may already be released.
    }

    atlasPointer = null;
    atlasApp.classList.remove("is-dragging");
  }

  atlasDragSurface.addEventListener(
    "pointerup",
    endAtlasPointer
  );

  atlasDragSurface.addEventListener(
    "pointercancel",
    endAtlasPointer
  );

  atlasDragSurface.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 2) {
        atlasPinch = null;
        return;
      }

      const [firstTouch, secondTouch] =
        event.touches;

      atlasPointer = null;
      atlasApp.classList.remove("is-dragging");

      atlasPinch = {
        distance: Math.hypot(
          secondTouch.clientX -
            firstTouch.clientX,
          secondTouch.clientY -
            firstTouch.clientY
        ),
        zoom: camera.targetZoom,
        centerX:
          (firstTouch.clientX +
            secondTouch.clientX) /
          2,
        centerY:
          (firstTouch.clientY +
            secondTouch.clientY) /
          2
      };
    },
    { passive: true }
  );

  atlasDragSurface.addEventListener(
    "touchmove",
    (event) => {
      if (
        !atlasPinch ||
        event.touches.length !== 2
      ) {
        return;
      }

      const [firstTouch, secondTouch] =
        event.touches;

      const nextDistance = Math.hypot(
        secondTouch.clientX -
          firstTouch.clientX,
        secondTouch.clientY -
          firstTouch.clientY
      );

      const ratio =
        nextDistance /
        Math.max(atlasPinch.distance, 1);

      applyAtlasZoom(
        atlasPinch.zoom * ratio,
        atlasPinch.centerX,
        atlasPinch.centerY
      );
    },
    { passive: true }
  );

  atlasDragSurface.addEventListener(
    "dblclick",
    (event) => {
      applyAtlasZoom(
        camera.targetZoom * 1.28,
        event.clientX,
        event.clientY
      );
    }
  );

  function createTunnelRenderer(canvas) {
    let meta = fitCanvas(canvas);
    const stars = [];
    const rings = [];
    let running = false;
    let lastTime = performance.now();

    const resetStar = () => ({
      x:
        (Math.random() - 0.5) *
        meta.width *
        1.75,
      y:
        (Math.random() - 0.5) *
        meta.height *
        1.75,
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

      const delta = Math.min(
        40,
        currentTime - lastTime
      );

      lastTime = currentTime;

      const {
        context,
        width,
        height
      } = meta;

      const centerX = width / 2;
      const centerY = height / 2;
      const focalLength =
        Math.min(width, height) * 0.88;

      context.fillStyle = "#000207";
      context.fillRect(0, 0, width, height);

      const core =
        context.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          Math.min(width, height) * 0.37
        );

      core.addColorStop(
        0,
        "rgba(235,247,255,0.2)"
      );
      core.addColorStop(
        0.23,
        "rgba(80,155,223,0.14)"
      );
      core.addColorStop(
        0.5,
        "rgba(100,68,183,0.08)"
      );
      core.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      context.fillStyle = core;
      context.fillRect(0, 0, width, height);

      rings.forEach((ring, index) => {
        ring.z -= delta * 0.92;

        if (ring.z < 8) {
          ring.z += 1000;
          ring.rotation =
            Math.random() * Math.PI * 2;
          ring.tilt =
            (Math.random() - 0.5) * 0.6;
        }

        const scale =
          focalLength / ring.z;

        const radius =
          Math.min(width, height) *
          0.18 *
          scale;

        const alpha =
          clamp(
            1 - ring.z / 1000,
            0,
            1
          ) * 0.29;

        if (
          radius < 2 ||
          radius >
            Math.max(width, height) * 2
        ) {
          return;
        }

        context.save();
        context.translate(
          centerX,
          centerY
        );

        context.rotate(
          ring.rotation +
            currentTime *
              0.00017 *
              (index % 2 === 0 ? 1 : -1)
        );

        context.scale(
          1,
          0.5 + ring.tilt * 0.1
        );

        context.beginPath();
        context.arc(
          0,
          0,
          radius,
          0,
          Math.PI * 2
        );

        context.strokeStyle =
          index % 3 === 0
            ? `rgba(135,198,242,${alpha})`
            : index % 3 === 1
              ? `rgba(194,137,237,${alpha * 0.75})`
              : `rgba(244,219,188,${alpha * 0.58})`;

        context.lineWidth =
          Math.max(0.5, scale * 1.55);

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

        const scale =
          focalLength / star.z;

        const previousScale =
          focalLength / star.previousZ;

        const x =
          centerX + star.x * scale;

        const y =
          centerY + star.y * scale;

        const previousX =
          centerX +
          star.x * previousScale;

        const previousY =
          centerY +
          star.y * previousScale;

        if (
          x < -width ||
          x > width * 2 ||
          y < -height ||
          y > height * 2
        ) {
          stars[index] = resetStar();
          return;
        }

        const alpha = clamp(
          1 - star.z / 1000,
          0.08,
          1
        );

        const gradient =
          context.createLinearGradient(
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
        context.lineWidth = clamp(
          scale * 1.9,
          0.5,
          5.5
        );

        context.beginPath();
        context.moveTo(
          previousX,
          previousY
        );
        context.lineTo(x, y);
        context.stroke();
      });

      const edge =
        context.createRadialGradient(
          centerX,
          centerY,
          Math.min(width, height) * 0.13,
          centerX,
          centerY,
          Math.min(width, height) * 0.52
        );

      edge.addColorStop(
        0,
        "rgba(0,0,0,0)"
      );
      edge.addColorStop(
        0.62,
        "rgba(3,8,25,0.08)"
      );
      edge.addColorStop(
        1,
        "rgba(0,0,0,0.82)"
      );

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

  function createTelescopeStarState() {
    const meta =
      fitCanvas(telescopeStarCanvas);

    const random =
      seededRandomFactory(29072027);

    return {
      ...meta,
      stars: Array.from(
        {
          length: Math.max(
            260,
            Math.floor(
              (meta.width * meta.height) /
                5400
            )
          )
        },
        () => ({
          x: random() * meta.width,
          y: random() * meta.height,
          radius: 0.3 + random() * 1.5,
          alpha: 0.13 + random() * 0.65,
          phase: random() * Math.PI * 2,
          speed: 0.004 + random() * 0.014,
          depth: 0.2 + random() * 0.8
        })
      ),
      asteroids: Array.from(
        { length: 9 },
        () => ({
          x: random() * meta.width,
          y: random() * meta.height,
          radius: 4 + random() * 15,
          speed: 0.12 + random() * 0.28,
          phase: random() * Math.PI * 2,
          depth: 0.3 + random() * 0.7
        })
      )
    };
  }

  function renderTelescopeStars(time = 0) {
    if (!telescopeStarState) {
      telescopeStarState =
        createTelescopeStarState();
    }

    const {
      context,
      width,
      height
    } = telescopeStarState;

    context.clearRect(0, 0, width, height);

    telescopeStarState.stars.forEach(
      (star) => {
        star.phase += star.speed;

        const x =
          star.x +
          Math.sin(
            time * 0.00003 +
              star.phase
          ) *
            star.depth *
            2.2;

        const y =
          star.y +
          Math.cos(
            time * 0.000025 +
              star.phase
          ) *
            star.depth *
            1.6;

        const alpha =
          star.alpha *
          (0.68 +
            Math.sin(star.phase) * 0.32);

        context.beginPath();
        context.arc(
          x,
          y,
          star.radius,
          0,
          Math.PI * 2
        );

        context.fillStyle =
          `rgba(229,238,247,${Math.max(0.03, alpha)})`;

        context.fill();
      }
    );

    telescopeStarState.asteroids.forEach(
      (asteroid, index) => {
        const x =
          ((asteroid.x +
            time *
              0.006 *
              asteroid.speed) %
            (width + 80)) -
          40;

        const y =
          asteroid.y +
          Math.sin(
            time * 0.0004 +
              asteroid.phase
          ) *
            20 *
            asteroid.depth;

        context.save();
        context.translate(x, y);
        context.rotate(
          time * 0.00012 * (index % 2 ? 1 : -1)
        );

        context.beginPath();
        context.moveTo(
          -asteroid.radius * 0.62,
          -asteroid.radius * 0.1
        );

        context.quadraticCurveTo(
          -asteroid.radius * 0.15,
          -asteroid.radius * 0.65,
          asteroid.radius * 0.5,
          -asteroid.radius * 0.28
        );

        context.quadraticCurveTo(
          asteroid.radius * 0.72,
          asteroid.radius * 0.16,
          asteroid.radius * 0.18,
          asteroid.radius * 0.56
        );

        context.quadraticCurveTo(
          -asteroid.radius * 0.4,
          asteroid.radius * 0.52,
          -asteroid.radius * 0.62,
          -asteroid.radius * 0.1
        );

        context.fillStyle =
          "rgba(92,105,121,0.16)";

        context.fill();

        context.strokeStyle =
          "rgba(188,199,210,0.07)";

        context.lineWidth = 1;
        context.stroke();
        context.restore();
      }
    );

    if (!telescopeOverlay.hidden) {
      window.requestAnimationFrame(
        renderTelescopeStars
      );
    }
  }

  function beginTelescopeJourney() {
    if (
      atlasIsTraveling ||
      !selectedObject
    ) {
      return;
    }

    atlasIsTraveling = true;
    closeExplorer();

    atlasEyepieceOverlay.hidden = false;
    atlasEyepieceOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    window.setTimeout(() => {
      atlasEyepieceOverlay.hidden = true;
      atlasEyepieceOverlay.setAttribute(
        "aria-hidden",
        "true"
      );

      atlasTravelOverlay.hidden = false;
      atlasTravelOverlay.setAttribute(
        "aria-hidden",
        "false"
      );

      atlasTravelTitle.textContent =
        `Traveling to ${selectedObject.name}`;

      atlasTravelTunnel.resize();
      atlasTravelTunnel.start();
    }, 760);

    window.setTimeout(() => {
      atlasTravelTunnel.stop();
      openTelescope(selectedObject);
    }, 3020);
  }

  atlasObserveButton.addEventListener(
    "click",
    beginTelescopeJourney
  );

  function updateTelescopeContent(object) {
    const values = {
      telescopeHeaderTitle: object.name,
      telescopeObjectType: object.type,
      telescopeObjectName: object.name,
      telescopeObjectPoetry: object.poetry,
      telescopeObjectDistance:
        object.distance,
      telescopeObjectLight:
        object.light,
      telescopeObjectMission:
        object.mission,
      telescopeObjectDescription:
        object.description
    };

    Object.entries(values).forEach(
      ([elementId, value]) => {
        const element =
          document.getElementById(elementId);

        if (element) {
          element.textContent = value;
        }
      }
    );

    telescopeSourceLink.href = object.source;
  }

  function resetTelescopeTransform() {
    telescopeCamera.x = 0;
    telescopeCamera.y = 0;
    telescopeCamera.zoom = 1;
    updateTelescopeTransform();
  }

  function updateTelescopeTransform() {
    telescopeWorld.style.setProperty(
      "--telescope-world-x",
      `${telescopeCamera.x}px`
    );

    telescopeWorld.style.setProperty(
      "--telescope-world-y",
      `${telescopeCamera.y}px`
    );

    telescopeWorld.style.setProperty(
      "--telescope-world-scale",
      telescopeCamera.zoom
    );

    telescopeZoomReadout.textContent =
      `${telescopeCamera.zoom.toFixed(2)}×`;
  }

  function constrainTelescopePan() {
    const maxX =
      window.innerWidth *
      Math.max(
        0.15,
        telescopeCamera.zoom * 0.52
      );

    const maxY =
      window.innerHeight *
      Math.max(
        0.12,
        telescopeCamera.zoom * 0.45
      );

    telescopeCamera.x = clamp(
      telescopeCamera.x,
      -maxX,
      maxX
    );

    telescopeCamera.y = clamp(
      telescopeCamera.y,
      -maxY,
      maxY
    );
  }

  function setTelescopeZoom(
    nextZoom,
    anchorX = window.innerWidth * 0.5,
    anchorY = window.innerHeight * 0.5
  ) {
    const previousZoom =
      telescopeCamera.zoom;

    const zoom = clamp(
      nextZoom,
      0.72,
      4.6
    );

    const deltaScale =
      zoom / previousZoom;

    telescopeCamera.x =
      anchorX -
      window.innerWidth * 0.5 -
      (anchorX -
        window.innerWidth * 0.5 -
        telescopeCamera.x) *
        deltaScale;

    telescopeCamera.y =
      anchorY -
      window.innerHeight * 0.5 -
      (anchorY -
        window.innerHeight * 0.5 -
        telescopeCamera.y) *
        deltaScale;

    telescopeCamera.zoom = zoom;
    constrainTelescopePan();
    updateTelescopeTransform();
  }

  function playTelescopeMedia(object) {
    telescopeMediaFallback.hidden = true;

    telescopeVideo.pause();
    telescopeVideo.removeAttribute("src");
    telescopeVideo.load();

    window.clearTimeout(
      telescopeVideoFallbackTimer
    );

    telescopeVideo.src = object.video;
    telescopeVideo.load();

    telescopeVideoFallbackTimer =
      window.setTimeout(() => {
        if (telescopeVideo.readyState < 2) {
          telescopeMediaFallback.hidden = false;
        }
      }, 6500);

    telescopeVideo.onloadeddata = () => {
      window.clearTimeout(
        telescopeVideoFallbackTimer
      );

      telescopeMediaFallback.hidden = true;

      const playPromise =
        telescopeVideo.play();

      if (
        playPromise &&
        typeof playPromise.catch === "function"
      ) {
        playPromise.catch(() => {});
      }
    };

    telescopeVideo.onerror = () => {
      window.clearTimeout(
        telescopeVideoFallbackTimer
      );

      telescopeMediaFallback.hidden = false;
    };
  }

  function openTelescope(object) {
    atlasIsTraveling = false;

    atlasTravelOverlay.hidden = true;
    atlasTravelOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    telescopeOverlay.hidden = false;
    telescopeOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    telescopeInfoPanel.hidden = true;
    telescopeOverlay.classList.remove(
      "is-ui-idle"
    );

    resetTelescopeTransform();
    updateTelescopeContent(object);
    playTelescopeMedia(object);

    telescopeStarState =
      createTelescopeStarState();

    window.requestAnimationFrame(
      renderTelescopeStars
    );

    resetTelescopeIdleTimer();
  }

  function closeTelescope() {
    telescopeVideo.pause();
    telescopeVideo.removeAttribute("src");
    telescopeVideo.load();

    telescopeOverlay.hidden = true;
    telescopeOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    telescopeInfoPanel.hidden = true;
    telescopeMediaFallback.hidden = true;
    telescopePointer = null;
    telescopePinch = null;
    atlasIsTraveling = false;
  }

  telescopeExitButton.addEventListener(
    "click",
    closeTelescope
  );

  function resetTelescopeIdleTimer() {
    telescopeOverlay.classList.remove(
      "is-ui-idle"
    );

    window.clearTimeout(
      telescopeIdleTimer
    );

    telescopeIdleTimer =
      window.setTimeout(() => {
        if (telescopeInfoPanel.hidden) {
          telescopeOverlay.classList.add(
            "is-ui-idle"
          );
        }
      }, 4200);
  }

  [
    "pointermove",
    "pointerdown",
    "wheel",
    "touchstart"
  ].forEach((eventName) => {
    telescopeOverlay.addEventListener(
      eventName,
      resetTelescopeIdleTimer,
      {
        passive: eventName !== "wheel"
      }
    );
  });

  telescopeViewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const zoomFactor =
        Math.exp(-event.deltaY * 0.00115);

      setTelescopeZoom(
        telescopeCamera.zoom * zoomFactor,
        event.clientX,
        event.clientY
      );
    },
    { passive: false }
  );

  telescopeViewport.addEventListener(
    "pointerdown",
    (event) => {
      telescopeViewport.setPointerCapture(
        event.pointerId
      );

      telescopePointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startWorldX: telescopeCamera.x,
        startWorldY: telescopeCamera.y
      };

      telescopeOverlay.classList.add(
        "is-dragging"
      );
    }
  );

  telescopeViewport.addEventListener(
    "pointermove",
    (event) => {
      if (
        !telescopePointer ||
        telescopePointer.id !== event.pointerId
      ) {
        return;
      }

      telescopeCamera.x =
        telescopePointer.startWorldX +
        event.clientX -
        telescopePointer.x;

      telescopeCamera.y =
        telescopePointer.startWorldY +
        event.clientY -
        telescopePointer.y;

      constrainTelescopePan();
      updateTelescopeTransform();
    }
  );

  function endTelescopePointer(event) {
    if (!telescopePointer) return;

    try {
      telescopeViewport.releasePointerCapture(
        event.pointerId
      );
    } catch (_) {
      // Pointer may already be released.
    }

    telescopePointer = null;
    telescopeOverlay.classList.remove(
      "is-dragging"
    );
  }

  telescopeViewport.addEventListener(
    "pointerup",
    endTelescopePointer
  );

  telescopeViewport.addEventListener(
    "pointercancel",
    endTelescopePointer
  );

  telescopeViewport.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 2) {
        telescopePinch = null;
        return;
      }

      const [firstTouch, secondTouch] =
        event.touches;

      telescopePointer = null;
      telescopeOverlay.classList.remove("is-dragging");

      telescopePinch = {
        distance: Math.hypot(
          secondTouch.clientX -
            firstTouch.clientX,
          secondTouch.clientY -
            firstTouch.clientY
        ),
        zoom: telescopeCamera.zoom,
        centerX:
          (firstTouch.clientX +
            secondTouch.clientX) /
          2,
        centerY:
          (firstTouch.clientY +
            secondTouch.clientY) /
          2
      };
    },
    { passive: true }
  );

  telescopeViewport.addEventListener(
    "touchmove",
    (event) => {
      if (
        !telescopePinch ||
        event.touches.length !== 2
      ) {
        return;
      }

      const [firstTouch, secondTouch] =
        event.touches;

      const distance = Math.hypot(
        secondTouch.clientX -
          firstTouch.clientX,
        secondTouch.clientY -
          firstTouch.clientY
      );

      const ratio =
        distance /
        Math.max(
          telescopePinch.distance,
          1
        );

      setTelescopeZoom(
        telescopePinch.zoom * ratio,
        telescopePinch.centerX,
        telescopePinch.centerY
      );
    },
    { passive: true }
  );

  telescopeViewport.addEventListener(
    "dblclick",
    (event) => {
      setTelescopeZoom(
        telescopeCamera.zoom * 1.35,
        event.clientX,
        event.clientY
      );
    }
  );

  telescopeZoomOut.addEventListener(
    "click",
    () => {
      setTelescopeZoom(
        telescopeCamera.zoom / 1.25
      );
    }
  );

  telescopeZoomIn.addEventListener(
    "click",
    () => {
      setTelescopeZoom(
        telescopeCamera.zoom * 1.25
      );
    }
  );

  telescopeRecenter.addEventListener(
    "click",
    resetTelescopeTransform
  );

  telescopeInfoButton.addEventListener(
    "click",
    () => {
      telescopeInfoPanel.hidden =
        !telescopeInfoPanel.hidden;

      resetTelescopeIdleTimer();
    }
  );

  telescopeInfoClose.addEventListener(
    "click",
    () => {
      telescopeInfoPanel.hidden = true;
      resetTelescopeIdleTimer();
    }
  );

  function moveTelescopeObject(direction) {
    const currentIndex =
      OBJECTS.findIndex(
        (object) =>
          object.id === selectedObject?.id
      );

    const nextIndex =
      (currentIndex +
        direction +
        OBJECTS.length) %
      OBJECTS.length;

    selectedObject = OBJECTS[nextIndex];
    updateSelectionCard();
    updateObjectMarkers();
    resetTelescopeTransform();
    updateTelescopeContent(selectedObject);
    playTelescopeMedia(selectedObject);
    resetTelescopeIdleTimer();
  }

  telescopePreviousObject.addEventListener(
    "click",
    () => moveTelescopeObject(-1)
  );

  telescopeNextObject.addEventListener(
    "click",
    () => moveTelescopeObject(1)
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        if (!telescopeOverlay.hidden) {
          closeTelescope();
          return;
        }

        if (atlasIsTraveling) {
          atlasIsTraveling = false;
          atlasTravelTunnel.stop();

          atlasEyepieceOverlay.hidden = true;
          atlasTravelOverlay.hidden = true;
          return;
        }

        if (!atlasExplorerPanel.hidden) {
          closeExplorer();
          return;
        }

        clearSelection();
      }

      if (!telescopeOverlay.hidden) {
        if (event.key === "+") {
          setTelescopeZoom(
            telescopeCamera.zoom * 1.2
          );
        }

        if (event.key === "-") {
          setTelescopeZoom(
            telescopeCamera.zoom / 1.2
          );
        }

        if (
          event.key.toLowerCase() === "r"
        ) {
          resetTelescopeTransform();
        }
      }
    }
  );

  function handleResize() {
    buildSkyData();
    constrainCameraTargets();

    telescopeStarState =
      createTelescopeStarState();

    atlasTravelTunnel.resize();
    updateObjectMarkers();
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(handleResize.timer);

    handleResize.timer =
      window.setTimeout(handleResize, 140);
  });

  renderObjectMarkers();
  buildSkyData();
  atlasTravelTunnel =
    createTunnelRenderer(
      atlasTravelCanvas
    );

  window.requestAnimationFrame(
    renderAtlasSky
  );
})();
