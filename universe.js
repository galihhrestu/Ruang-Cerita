// ==========================================================
// RUANG CERITA — OUR UNIVERSE V1
// Daily Check-in + Couple Pulse + Cerita
// ==========================================================

const ACCESS_KEY_STORAGE = "kodeRuangCerita";
const WIB_TIME_ZONE = "Asia/Jakarta";

const canvas = document.getElementById("universeCanvas");
const ctx = canvas.getContext("2d");

const els = {
    introOverlay: document.getElementById("introOverlay"),
    introStatus: document.getElementById("introStatus"),
    universeSummary: document.getElementById("universeSummary"),
    detailPanel: document.getElementById("detailPanel"),
    closeDetailButton: document.getElementById("closeDetailButton"),
    detailEyebrow: document.getElementById("detailEyebrow"),
    detailTitle: document.getElementById("detailTitle"),
    detailDate: document.getElementById("detailDate"),
    detailContent: document.getElementById("detailContent"),
    detailAction: document.getElementById("detailAction"),
    yearControls: document.getElementById("yearControls"),
    randomButton: document.getElementById("randomButton"),
    zoomInButton: document.getElementById("zoomInButton"),
    zoomOutButton: document.getElementById("zoomOutButton"),
    resetViewButton: document.getElementById("resetViewButton"),
    infoButton: document.getElementById("infoButton"),
    infoModal: document.getElementById("infoModal"),
    closeInfoButton: document.getElementById("closeInfoButton"),
    interactionHint: document.getElementById("interactionHint"),
    nodeTooltip: document.getElementById("nodeTooltip")
};

let accessCode = "";
let rawStories = [];
let rawMetadata = [];
let dailyDays = [];
let pulseMonths = [];

let allNodes = [];
let visibleNodes = [];
let constellationLinks = [];
let pulseLinks = [];
let decorativeStars = [];

let selectedNode = null;
let hoveredNode = null;
let activeYear = "all";
let introHidden = false;

let camera = {
    x: 0,
    y: 0,
    scale: 1,
    targetX: 0,
    targetY: 0,
    targetScale: 1
};

const MIN_SCALE = 0.24;
const MAX_SCALE = 3.1;

const pointers = new Map();

let dragState = {
    active: false,
    moved: false,
    lastX: 0,
    lastY: 0
};

let pinchDistance = 0;


// ----------------------------------------------------------
// ACCESS
// ----------------------------------------------------------

async function verifyAccessCode(code) {
    const { data, error } = await window.db.rpc(
        "cek_kode",
        { kode: code }
    );

    if (error) {
        console.error("Gagal memeriksa kode:", error);
        return false;
    }

    return Boolean(data);
}

async function ensureAccess() {
    let code = localStorage.getItem(ACCESS_KEY_STORAGE);

    if (code && await verifyAccessCode(code)) {
        return code;
    }

    localStorage.removeItem(ACCESS_KEY_STORAGE);

    code = prompt("Masukkan kode akses Ruang Cerita:");

    if (!code) {
        return null;
    }

    if (!await verifyAccessCode(code)) {
        alert("Kode akses salah");
        return null;
    }

    localStorage.setItem(ACCESS_KEY_STORAGE, code);
    return code;
}


// ----------------------------------------------------------
// FETCH
// ----------------------------------------------------------

async function fetchStories() {
    const { data, error } = await window.db.rpc(
        "ambil_tulisan",
        { kode: accessCode }
    );

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

async function fetchStoryMetadata() {
    const { data, error } = await window.db.rpc(
        "ambil_metadata_tulisan",
        { kode: accessCode }
    );

    if (error) {
        console.warn("Metadata cerita tidak tersedia:", error);
        return [];
    }

    return Array.isArray(data) ? data : [];
}

async function fetchDailyUniverse() {
    const { data, error } = await window.db.rpc(
        "ambil_universe_daily_checkin",
        { kode: accessCode }
    );

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

async function fetchPulseMonth(monthDate) {
    const { data, error } = await window.db.rpc(
        "ambil_couple_pulse",
        {
            kode: accessCode,
            month_input: monthDate
        }
    );

    if (error) {
        throw error;
    }

    return data;
}

async function fetchAllPulseMonths() {
    const today = getTodayWibDate();
    const currentMonth = `${today.slice(0, 7)}-01`;

    const first = await fetchPulseMonth(currentMonth);

    const listedMonths = Array.isArray(first?.available_months)
        ? first.available_months
            .map((item) => item?.month)
            .filter(Boolean)
        : [];

    if (!listedMonths.includes(currentMonth)) {
        listedMonths.unshift(currentMonth);
    }

    const uniqueMonths = [...new Set(listedMonths)].sort();

    const results = await Promise.all(
        uniqueMonths.map(async (month) => {
            try {
                if (month === currentMonth) {
                    return first;
                }

                return await fetchPulseMonth(month);
            } catch (error) {
                console.warn(`Pulse ${month} gagal dimuat`, error);
                return null;
            }
        })
    );

    return results.filter((data) => {
        if (!data) {
            return false;
        }

        return (
            Number(data.active_days || 0) > 0
            || Number(data.complete_days || 0) > 0
            || Number(data.galih?.checkin_count || 0) > 0
            || Number(data.wisye?.checkin_count || 0) > 0
        );
    });
}


// ----------------------------------------------------------
// DATE
// ----------------------------------------------------------

function getTodayWibDate() {
    const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: WIB_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(new Date());

    const values = {};

    parts.forEach((part) => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function normalizeDateOnly(value) {
    if (!value) {
        return null;
    }

    const text = String(value).trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return null;
}

function storyDateWib(value) {
    if (!value) {
        return null;
    }

    const text = String(value).trim().replace(" ", "T");
    const hasZone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(text);

    const date = new Date(
        hasZone ? text : `${text}Z`
    );

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: WIB_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(date);

    const values = {};

    parts.forEach((part) => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function formatDateID(value) {
    const normalized = normalizeDateOnly(value);

    if (!normalized) {
        return "Tanggal tidak tersedia";
    }

    const [year, month, day] = normalized
        .split("-")
        .map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        }
    ).format(date);
}

function formatMonthID(value) {
    const normalized = normalizeDateOnly(value);

    if (!normalized) {
        return "Bulan";
    }

    const [year, month] = normalized
        .split("-")
        .map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, 1)
    );

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        }
    ).format(date);
}

function yearOfDate(value) {
    const normalized = normalizeDateOnly(value);
    return normalized ? Number(normalized.slice(0, 4)) : null;
}

function monthKey(value) {
    const normalized = normalizeDateOnly(value);
    return normalized ? normalized.slice(0, 7) : null;
}


// ----------------------------------------------------------
// TEXT / ICON
// ----------------------------------------------------------

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function truncateText(value, maxLength = 230) {
    const text = String(value || "").trim();

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}…`;
}

function moodEmoji(mood) {
    const map = {
        "Bahagia": "😊",
        "Penuh Cinta": "❤️",
        "Tenang": "😌",
        "Bersyukur": "🌱",
        "Terharu": "🥺",
        "Sedih": "😔",
        "Lelah": "😮‍💨",
        "Cemas": "😰",
        "Belum dipilih": "○"
    };

    return map[mood] || "✨";
}


// ----------------------------------------------------------
// SEEDED RANDOM
// ----------------------------------------------------------

function hashString(value) {
    let hash = 2166136261;
    const text = String(value);

    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function seededRandom(seedText) {
    let state = hashString(seedText) || 1;

    return function random() {
        state += 0x6D2B79F5;

        let t = state;

        t = Math.imul(
            t ^ (t >>> 15),
            t | 1
        );

        t ^= t + Math.imul(
            t ^ (t >>> 7),
            t | 61
        );

        return (
            (t ^ (t >>> 14)) >>> 0
        ) / 4294967296;
    };
}


// ----------------------------------------------------------
// BUILD UNIVERSE DATA
// ----------------------------------------------------------

function mergeStoryMetadata() {
    const metadataMap = new Map(
        rawMetadata.map((item) => [
            String(item.cerita_id),
            item
        ])
    );

    return rawStories.map((story) => {
        const metadata = metadataMap.get(
            String(story.id)
        );

        return {
            ...story,
            kategori:
                metadata?.kategori
                || "Belum dikategorikan",
            mood:
                metadata?.mood
                || "Belum dipilih"
        };
    });
}

function createMonthCenters(monthKeys) {
    const centers = new Map();
    const ordered = [...monthKeys].sort();

    if (ordered.length === 0) {
        return centers;
    }

    if (ordered.length === 1) {
        centers.set(
            ordered[0],
            { x: 0, y: 0 }
        );

        return centers;
    }

    const angleStep = 0.82;

    ordered.forEach((key, index) => {
        const angle = index * angleStep - 0.55;
        const radius = 190 + index * 250;

        centers.set(
            key,
            {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            }
        );
    });

    return centers;
}

function buildUniverseNodes() {
    const stories = mergeStoryMetadata();

    const storyRecords = stories
        .map((story) => {
            const date = storyDateWib(story.created_at);

            if (!date) {
                return null;
            }

            return {
                type: "story",
                id: `story-${story.id}`,
                sourceId: story.id,
                date,
                month: monthKey(date),
                year: yearOfDate(date),
                title: story.judul || "Tanpa judul",
                body: story.isi || "",
                category: story.kategori || "Belum dikategorikan",
                mood: story.mood || "Belum dipilih",
                favorite: Boolean(story.favorit),
                href: `detail.html?id=${encodeURIComponent(story.id)}`
            };
        })
        .filter(Boolean);

    const dailyRecords = dailyDays
        .map((item) => {
            const date = normalizeDateOnly(item.date);

            if (!date) {
                return null;
            }

            return {
                type: "daily",
                id: `daily-${date}`,
                date,
                month: monthKey(date),
                year: yearOfDate(date),
                title: "Daily Check-in",
                galih: item.galih || null,
                wisye: item.wisye || null,
                restored: Boolean(item.is_restored)
            };
        })
        .filter(Boolean);

    const pulseRecords = pulseMonths
        .map((pulse) => {
            const date = normalizeDateOnly(pulse.month_start);

            if (!date) {
                return null;
            }

            return {
                type: "pulse",
                id: `pulse-${date.slice(0, 7)}`,
                date,
                month: monthKey(date),
                year: yearOfDate(date),
                title: formatMonthID(date),
                pulse,
                href: `couple-pulse.html?month=${date}`
            };
        })
        .filter(Boolean);

    const allMonths = new Set(
        [
            ...storyRecords,
            ...dailyRecords,
            ...pulseRecords
        ]
            .map((item) => item.month)
            .filter(Boolean)
    );

    const centers = createMonthCenters(allMonths);

    const pulseByMonth = new Map(
        pulseRecords.map((item) => [
            item.month,
            item
        ])
    );

    allMonths.forEach((month) => {
        if (!pulseByMonth.has(month)) {
            const date = `${month}-01`;

            const fallback = {
                type: "pulse",
                id: `pulse-${month}`,
                date,
                month,
                year: yearOfDate(date),
                title: formatMonthID(date),
                pulse: null,
                fallback: true,
                href: `couple-pulse.html?month=${date}`
            };

            pulseRecords.push(fallback);
            pulseByMonth.set(month, fallback);
        }
    });

    const links = [];
    const coreLinks = [];
    const monthOrder = [...allMonths].sort();

    monthOrder.forEach((month, monthIndex) => {
        const center = centers.get(month) || { x: 0, y: 0 };
        const pulse = pulseByMonth.get(month);

        pulse.x = center.x;
        pulse.y = center.y;
        pulse.radius = 20;
        pulse.baseRadius = 20;

        const dailies = dailyRecords.filter(
            (item) => item.month === month
        );

        const storiesInMonth = storyRecords.filter(
            (item) => item.month === month
        );

        const dailyRandom = seededRandom(`daily-${month}`);
        const storyRandom = seededRandom(`story-${month}`);

        dailies.forEach((node, index) => {
            const count = Math.max(1, dailies.length);

            const angle =
                (index / count) * Math.PI * 2
                + dailyRandom() * 0.34;

            const ring =
                92
                + (index % 3) * 31
                + dailyRandom() * 19;

            node.x = center.x + Math.cos(angle) * ring;
            node.y = center.y + Math.sin(angle) * ring;
            node.radius = node.restored ? 6.5 : 5.2;
            node.baseRadius = node.radius;

            links.push({
                from: pulse,
                to: node,
                type: "daily"
            });
        });

        storiesInMonth.forEach((node, index) => {
            const count = Math.max(1, storiesInMonth.length);

            const angle =
                (index / count) * Math.PI * 2
                + 0.55
                + storyRandom() * 0.52;

            const ring =
                155
                + (index % 2) * 55
                + storyRandom() * 30;

            node.x = center.x + Math.cos(angle) * ring;
            node.y = center.y + Math.sin(angle) * ring;
            node.radius = node.favorite ? 12 : 9.5;
            node.baseRadius = node.radius;

            links.push({
                from: pulse,
                to: node,
                type: "story"
            });
        });

        if (monthIndex > 0) {
            const previous = pulseByMonth.get(
                monthOrder[monthIndex - 1]
            );

            if (previous) {
                coreLinks.push({
                    from: previous,
                    to: pulse
                });
            }
        }
    });

    allNodes = [
        ...pulseRecords,
        ...dailyRecords,
        ...storyRecords
    ];

    visibleNodes = [...allNodes];
    constellationLinks = links;
    pulseLinks = coreLinks;

    buildYearControls();
    updateSummary();
    buildDecorativeStars();
}


// ----------------------------------------------------------
// YEAR FILTER
// ----------------------------------------------------------

function buildYearControls() {
    const years = [
        ...new Set(
            allNodes
                .map((node) => node.year)
                .filter(Boolean)
        )
    ].sort((a, b) => a - b);

    els.yearControls.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "year-button active";
    allButton.dataset.year = "all";
    allButton.textContent = "ALL TIME";
    allButton.addEventListener(
        "click",
        () => setActiveYear("all")
    );

    els.yearControls.appendChild(allButton);

    years.forEach((year) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "year-button";
        button.dataset.year = String(year);
        button.textContent = String(year);

        button.addEventListener(
            "click",
            () => setActiveYear(year)
        );

        els.yearControls.appendChild(button);
    });
}

function setActiveYear(year) {
    activeYear = year;

    els.yearControls
        .querySelectorAll(".year-button")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                (
                    year === "all"
                    && button.dataset.year === "all"
                )
                || String(year) === button.dataset.year
            );
        });

    visibleNodes = year === "all"
        ? [...allNodes]
        : allNodes.filter(
            (node) => node.year === Number(year)
        );

    closeDetail();
    fitViewToVisibleNodes(true);
}


// ----------------------------------------------------------
// BACKGROUND STARS
// ----------------------------------------------------------

function buildDecorativeStars() {
    const random = seededRandom(
        "ruang-cerita-universe"
    );

    decorativeStars = Array.from(
        { length: 170 },
        (_, index) => ({
            x: random() * 2 - 1,
            y: random() * 2 - 1,
            size: 0.35 + random() * 1.25,
            alpha: 0.12 + random() * 0.48,
            phase: random() * Math.PI * 2,
            speed: 0.0005 + random() * 0.0012,
            warm: random() > 0.72,
            index
        })
    );
}


// ----------------------------------------------------------
// CANVAS / CAMERA
// ----------------------------------------------------------

function resizeCanvas() {
    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

function worldToScreen(x, y) {
    return {
        x:
            (x - camera.x) * camera.scale
            + canvas.clientWidth / 2,
        y:
            (y - camera.y) * camera.scale
            + canvas.clientHeight / 2
    };
}

function screenToWorld(x, y) {
    return {
        x:
            (x - canvas.clientWidth / 2) / camera.scale
            + camera.x,
        y:
            (y - canvas.clientHeight / 2) / camera.scale
            + camera.y
    };
}

function clampScale(value) {
    return Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, value)
    );
}

function setZoomAt(screenX, screenY, nextScale) {
    const before = screenToWorld(screenX, screenY);

    camera.scale = clampScale(nextScale);
    camera.targetScale = camera.scale;

    const after = screenToWorld(screenX, screenY);

    camera.x += before.x - after.x;
    camera.y += before.y - after.y;

    camera.targetX = camera.x;
    camera.targetY = camera.y;
}

function fitViewToVisibleNodes(animated = false) {
    const nodes = visibleNodes.length
        ? visibleNodes
        : allNodes;

    if (!nodes.length) {
        return;
    }

    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const spanX = Math.max(320, maxX - minX);
    const spanY = Math.max(260, maxY - minY);

    const width = Math.max(
        320,
        canvas.clientWidth - 150
    );

    const height = Math.max(
        300,
        canvas.clientHeight - 190
    );

    const scale = clampScale(
        Math.min(
            width / (spanX + 300),
            height / (spanY + 260)
        )
    );

    if (animated) {
        camera.targetX = centerX;
        camera.targetY = centerY;
        camera.targetScale = scale;
    } else {
        camera.x = centerX;
        camera.y = centerY;
        camera.scale = scale;

        camera.targetX = centerX;
        camera.targetY = centerY;
        camera.targetScale = scale;
    }
}

function focusNode(node) {
    camera.targetX = node.x;
    camera.targetY = node.y;

    camera.targetScale = clampScale(
        node.type === "pulse"
            ? 1.28
            : 1.55
    );
}


// ----------------------------------------------------------
// DRAWING
// ----------------------------------------------------------

function isNodeVisible(node) {
    return (
        activeYear === "all"
        || node.year === Number(activeYear)
    );
}

function drawStoryStar(x, y, radius, active, favorite) {
    const points = 8;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 8);

    ctx.shadowColor = favorite
        ? "rgba(210,117,137,0.78)"
        : "rgba(255,248,239,0.62)";

    ctx.shadowBlur = active
        ? 25
        : favorite
            ? 19
            : 14;

    ctx.fillStyle = favorite
        ? "#f2c5cf"
        : "#fff8ef";

    ctx.beginPath();

    for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const r = i % 2 === 0
            ? radius
            : radius * 0.28;

        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawDailyNode(x, y, radius, restored, active) {
    ctx.save();

    ctx.shadowColor = restored
        ? "rgba(210,117,137,0.62)"
        : "rgba(203,216,207,0.50)";

    ctx.shadowBlur = active ? 18 : 8;

    ctx.fillStyle = restored
        ? "#e7a9b8"
        : "#cbd8cf";

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (restored) {
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = "rgba(255,248,239,0.55)";

        ctx.beginPath();
        ctx.arc(x, y, radius + 3.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawPulseNode(x, y, radius, active, fallback) {
    ctx.save();

    ctx.shadowColor = "rgba(210,117,137,0.70)";
    ctx.shadowBlur = active ? 40 : 26;

    const gradient = ctx.createRadialGradient(
        x - radius * 0.25,
        y - radius * 0.28,
        1,
        x,
        y,
        radius
    );

    gradient.addColorStop(0, "#f3ccd5");
    gradient.addColorStop(
        0.55,
        fallback ? "#b47a88" : "#d27589"
    );
    gradient.addColorStop(1, "#8d4053");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,248,239,0.35)";

    ctx.beginPath();
    ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff8ef";
    ctx.font = `${Math.max(12, radius * 0.76)}px "DM Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥", x, y + 0.5);

    ctx.restore();
}

function drawLabel(node, point) {
    if (
        node.type !== "pulse"
        && camera.scale < 1.22
    ) {
        return;
    }

    let text = "";

    if (node.type === "pulse") {
        text = formatMonthID(node.date);
    } else if (node.type === "story") {
        text = truncateText(node.title, 26);
    } else {
        return;
    }

    const yOffset =
        node.baseRadius * camera.scale
        + (
            node.type === "pulse"
                ? 24
                : 17
        );

    ctx.save();

    ctx.font = node.type === "pulse"
        ? '600 11px "Playfair Display", Georgia, serif'
        : '500 8px "DM Sans", sans-serif';

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = node.type === "pulse"
        ? "rgba(255,248,239,0.86)"
        : "rgba(255,248,239,0.58)";

    ctx.fillText(
        text,
        point.x,
        point.y + yOffset
    );

    ctx.restore();
}

function drawBackground(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.72
    );

    gradient.addColorStop(0, "#211a1c");
    gradient.addColorStop(0.58, "#191516");
    gradient.addColorStop(1, "#121011");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    decorativeStars.forEach((star) => {
        const alpha =
            star.alpha
            * (
                0.72
                + Math.sin(
                    time * star.speed + star.phase
                ) * 0.28
            );

        const x =
            star.x * width * 0.55
            + width / 2
            - camera.x
                * 0.012
                * (star.index % 4 + 1);

        const y =
            star.y * height * 0.58
            + height / 2
            - camera.y
                * 0.012
                * (star.index % 3 + 1);

        ctx.fillStyle = star.warm
            ? `rgba(239,200,209,${alpha})`
            : `rgba(255,248,239,${alpha})`;

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.24,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.68
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.34)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}

function drawCoreLinks() {
    pulseLinks.forEach((link) => {
        if (
            !isNodeVisible(link.from)
            || !isNodeVisible(link.to)
        ) {
            return;
        }

        const a = worldToScreen(link.from.x, link.from.y);
        const b = worldToScreen(link.to.x, link.to.y);

        ctx.save();

        ctx.lineWidth = Math.max(
            0.55,
            camera.scale * 0.75
        );

        ctx.strokeStyle = "rgba(210,117,137,0.12)";
        ctx.setLineDash([5, 8]);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);

        ctx.quadraticCurveTo(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2 - 28 * camera.scale,
            b.x,
            b.y
        );

        ctx.stroke();
        ctx.restore();
    });
}

function drawConstellationLinks() {
    constellationLinks.forEach((link) => {
        if (
            !isNodeVisible(link.from)
            || !isNodeVisible(link.to)
        ) {
            return;
        }

        const a = worldToScreen(link.from.x, link.from.y);
        const b = worldToScreen(link.to.x, link.to.y);

        ctx.save();

        ctx.lineWidth = link.type === "story"
            ? 0.72
            : 0.42;

        ctx.strokeStyle = link.type === "story"
            ? "rgba(255,248,239,0.12)"
            : "rgba(203,216,207,0.07)";

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.restore();
    });
}

function drawNodes(time) {
    const rank = {
        daily: 1,
        story: 2,
        pulse: 3
    };

    [...visibleNodes]
        .sort(
            (a, b) => rank[a.type] - rank[b.type]
        )
        .forEach((node) => {
            const point = worldToScreen(node.x, node.y);

            if (
                point.x < -80
                || point.x > canvas.clientWidth + 80
                || point.y < -80
                || point.y > canvas.clientHeight + 80
            ) {
                return;
            }

            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNode?.id === node.id;

            const breathe =
                1
                + Math.sin(
                    time * 0.0011
                    + hashString(node.id) % 15
                )
                * (
                    node.type === "pulse"
                        ? 0.035
                        : 0.025
                );

            const screenRadius = Math.max(
                2.2,
                node.baseRadius
                    * camera.scale
                    * breathe
                    * (
                        isHovered || isSelected
                            ? 1.18
                            : 1
                    )
            );

            if (node.type === "pulse") {
                drawPulseNode(
                    point.x,
                    point.y,
                    Math.max(11, screenRadius),
                    isHovered || isSelected,
                    node.fallback
                );
            } else if (node.type === "story") {
                drawStoryStar(
                    point.x,
                    point.y,
                    Math.max(5, screenRadius),
                    isHovered || isSelected,
                    node.favorite
                );
            } else {
                drawDailyNode(
                    point.x,
                    point.y,
                    Math.max(2.4, screenRadius),
                    node.restored,
                    isHovered || isSelected
                );
            }

            if (isSelected || isHovered) {
                ctx.save();

                ctx.strokeStyle = "rgba(255,248,239,0.32)";
                ctx.lineWidth = 0.9;

                ctx.beginPath();
                ctx.arc(
                    point.x,
                    point.y,
                    screenRadius + 8,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();

                ctx.restore();
            }

            drawLabel(node, point);
        });
}

function animateCamera() {
    camera.x += (camera.targetX - camera.x) * 0.075;
    camera.y += (camera.targetY - camera.y) * 0.075;
    camera.scale += (camera.targetScale - camera.scale) * 0.085;
}

function render(time = 0) {
    animateCamera();

    ctx.clearRect(
        0,
        0,
        canvas.clientWidth,
        canvas.clientHeight
    );

    drawBackground(time);
    drawCoreLinks();
    drawConstellationLinks();
    drawNodes(time);

    requestAnimationFrame(render);
}


// ----------------------------------------------------------
// HIT TEST / TOOLTIP
// ----------------------------------------------------------

function hitTestNode(screenX, screenY) {
    const matches = visibleNodes
        .map((node) => {
            const point = worldToScreen(node.x, node.y);

            const hitRadius = Math.max(
                node.type === "daily" ? 10 : 14,
                node.baseRadius * camera.scale + 8
            );

            const distance = Math.hypot(
                screenX - point.x,
                screenY - point.y
            );

            return {
                node,
                distance,
                hitRadius
            };
        })
        .filter((item) => item.distance <= item.hitRadius)
        .sort((a, b) => a.distance - b.distance);

    return matches[0]?.node || null;
}

function updateTooltip(node, clientX = 0, clientY = 0) {
    if (!node) {
        els.nodeTooltip.hidden = true;
        return;
    }

    let title = node.title;
    let subtitle = formatDateID(node.date);

    if (node.type === "pulse") {
        title = formatMonthID(node.date);
        subtitle = "Couple Pulse";
    } else if (node.type === "daily") {
        title = node.restored
            ? "Daily Check-in · Restored"
            : "Daily Check-in";
    }

    els.nodeTooltip.innerHTML = `
        <strong>${escapeHTML(title)}</strong>
        ${escapeHTML(subtitle)}
    `;

    els.nodeTooltip.hidden = false;

    const maxX = window.innerWidth - 230;
    const maxY = window.innerHeight - 80;

    els.nodeTooltip.style.left =
        `${Math.max(8, Math.min(maxX, clientX + 14))}px`;

    els.nodeTooltip.style.top =
        `${Math.max(8, Math.min(maxY, clientY + 14))}px`;
}


// ----------------------------------------------------------
// DETAIL
// ----------------------------------------------------------

function closeDetail() {
    els.detailPanel.hidden = true;
    selectedNode = null;
}

function openDetail(node) {
    if (!node) {
        return;
    }

    selectedNode = node;
    focusNode(node);

    els.detailPanel.hidden = false;
    els.detailAction.hidden = true;

    if (node.type === "story") {
        renderStoryDetail(node);
    } else if (node.type === "daily") {
        renderDailyDetail(node);
    } else {
        renderPulseDetail(node);
    }
}

function renderStoryDetail(node) {
    els.detailEyebrow.textContent = "✦ CERITA";
    els.detailTitle.textContent = node.title;
    els.detailDate.textContent = formatDateID(node.date);

    els.detailContent.innerHTML = `
        <div class="detail-badges">
            <span class="detail-badge">
                ${moodEmoji(node.mood)}
                ${escapeHTML(node.mood)}
            </span>

            <span class="detail-badge">
                ${escapeHTML(node.category)}
            </span>

            ${
                node.favorite
                    ? `<span class="detail-badge">♥ Favorit</span>`
                    : ""
            }
        </div>

        <div class="detail-divider"></div>

        <p class="detail-copy">
            ${escapeHTML(truncateText(node.body, 440))}
        </p>
    `;

    els.detailAction.href = node.href;
    els.detailAction.innerHTML = `
        Baca Cerita
        <span>→</span>
    `;
    els.detailAction.hidden = false;
}

function renderDailyPerson(name, data) {
    if (!data) {
        return "";
    }

    return `
        <article class="daily-person">

            <div class="daily-person-header">
                <span class="daily-avatar">
                    ${escapeHTML(name.charAt(0))}
                </span>

                <strong>${escapeHTML(name)}</strong>
            </div>

            <div class="daily-metrics">
                <span>
                    ${moodEmoji(data.mood)}
                    ${escapeHTML(data.mood || "—")}
                </span>

                <span>
                    ⚡ ${escapeHTML(data.energy ?? "—")}/5
                </span>

                <span>
                    ${escapeHTML(data.day_rating ?? "—")}/10
                </span>

                ${
                    data.need_today
                        ? `
                            <span>
                                butuh ${escapeHTML(data.need_today)}
                            </span>
                        `
                        : ""
                }
            </div>

            ${
                data.note
                    ? `
                        <p class="daily-note">
                            “${escapeHTML(data.note)}”
                        </p>
                    `
                    : ""
            }

        </article>
    `;
}

function renderDailyDetail(node) {
    els.detailEyebrow.textContent = node.restored
        ? "❤️‍🩹 RESTORED DAY"
        : "🌙 DAILY CHECK-IN";

    els.detailTitle.textContent = "Hari kalian";
    els.detailDate.textContent = formatDateID(node.date);

    els.detailContent.innerHTML = `
        ${renderDailyPerson("Galih", node.galih)}
        ${renderDailyPerson("Wisye", node.wisye)}

        <div class="detail-divider"></div>

        <p class="detail-copy">
            ${
                node.restored
                    ? "Hari ini sempat terlewat, lalu kalian pulihkan bersama."
                    : "Satu hari ketika Galih dan Wisye sama-sama menyelesaikan Daily Check-in."
            }
        </p>
    `;

    els.detailAction.href = "checkin.html";
    els.detailAction.innerHTML = `
        Buka Daily Check-in
        <span>→</span>
    `;
    els.detailAction.hidden = false;
}

function renderPulseDetail(node) {
    const pulse = node.pulse;

    els.detailEyebrow.textContent = "♥ COUPLE PULSE";
    els.detailTitle.textContent = formatMonthID(node.date);
    els.detailDate.textContent = "Pusat konstelasi bulan ini";

    if (!pulse) {
        els.detailContent.innerHTML = `
            <p class="detail-copy">
                Bulan ini memiliki momen di Our Universe.
                Couple Pulse akan semakin kaya seiring Daily Check-in bertambah.
            </p>
        `;
    } else {
        const galihMood = pulse.galih?.top_mood || "—";
        const wisyeMood = pulse.wisye?.top_mood || "—";

        els.detailContent.innerHTML = `
            <div class="pulse-stat-grid">

                <div>
                    <span>Hari complete</span>
                    <strong>
                        ${escapeHTML(pulse.complete_days ?? 0)} ❤️
                    </strong>
                </div>

                <div>
                    <span>Longest streak</span>
                    <strong>
                        ${escapeHTML(pulse.longest_streak ?? 0)} hari
                    </strong>
                </div>

                <div>
                    <span>Galih</span>
                    <strong>
                        ${moodEmoji(galihMood)}
                        ${escapeHTML(galihMood)}
                    </strong>
                </div>

                <div>
                    <span>Wisye</span>
                    <strong>
                        ${moodEmoji(wisyeMood)}
                        ${escapeHTML(wisyeMood)}
                    </strong>
                </div>

                <div>
                    <span>Konsistensi</span>
                    <strong>
                        ${escapeHTML(pulse.completion_percent ?? 0)}%
                    </strong>
                </div>

                <div>
                    <span>Restore</span>
                    <strong>
                        ${escapeHTML(pulse.restore_used ?? 0)} / 5
                    </strong>
                </div>

            </div>

            ${
                pulse.common_need
                    ? `
                        <div class="detail-divider"></div>

                        <p class="detail-copy">
                            Hal yang paling sering kalian butuhkan:
                            <strong>${escapeHTML(pulse.common_need)}</strong>.
                        </p>
                    `
                    : ""
            }
        `;
    }

    els.detailAction.href = node.href;
    els.detailAction.innerHTML = `
        Lihat Couple Pulse
        <span>→</span>
    `;
    els.detailAction.hidden = false;
}


// ----------------------------------------------------------
// SUMMARY / RANDOM
// ----------------------------------------------------------

function updateSummary() {
    const storyCount = allNodes.filter(
        (node) => node.type === "story"
    ).length;

    const dailyCount = allNodes.filter(
        (node) => node.type === "daily"
    ).length;

    const pulseCount = allNodes.filter(
        (node) => node.type === "pulse"
    ).length;

    const total = storyCount + dailyCount + pulseCount;

    els.universeSummary.textContent =
        `${total} momen · ${pulseCount} konstelasi`;
}

function takeMeSomewhere() {
    const candidates = visibleNodes.filter(
        (node) => node.type !== "pulse"
    );

    const pool = candidates.length
        ? candidates
        : visibleNodes;

    if (!pool.length) {
        return;
    }

    const node = pool[
        Math.floor(Math.random() * pool.length)
    ];

    selectedNode = node;
    focusNode(node);

    setTimeout(
        () => openDetail(node),
        560
    );
}


// ----------------------------------------------------------
// POINTER / DRAG / PINCH
// ----------------------------------------------------------

function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function pointerDistance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function pointerCenter(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    };
}

canvas.addEventListener(
    "pointerdown",
    (event) => {
        canvas.setPointerCapture(event.pointerId);

        const point = pointerPosition(event);

        pointers.set(
            event.pointerId,
            point
        );

        dragState.active = true;
        dragState.moved = false;
        dragState.lastX = point.x;
        dragState.lastY = point.y;

        canvas.classList.add("dragging");

        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinchDistance = pointerDistance(a, b);
        }

        hideInteractionHint();
    }
);

canvas.addEventListener(
    "pointermove",
    (event) => {
        const point = pointerPosition(event);

        if (pointers.has(event.pointerId)) {
            pointers.set(
                event.pointerId,
                point
            );
        }

        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];

            const distance = pointerDistance(a, b);
            const center = pointerCenter(a, b);

            if (pinchDistance > 0) {
                const factor = distance / pinchDistance;

                setZoomAt(
                    center.x,
                    center.y,
                    camera.scale * factor
                );
            }

            pinchDistance = distance;
            dragState.moved = true;

            updateTooltip(null);
            return;
        }

        if (
            dragState.active
            && pointers.size === 1
        ) {
            const dx = point.x - dragState.lastX;
            const dy = point.y - dragState.lastY;

            if (Math.abs(dx) + Math.abs(dy) > 1) {
                dragState.moved = true;

                camera.x -= dx / camera.scale;
                camera.y -= dy / camera.scale;

                camera.targetX = camera.x;
                camera.targetY = camera.y;

                dragState.lastX = point.x;
                dragState.lastY = point.y;

                updateTooltip(null);
                return;
            }
        }

        if (!dragState.active) {
            hoveredNode = hitTestNode(
                point.x,
                point.y
            );

            updateTooltip(
                hoveredNode,
                event.clientX,
                event.clientY
            );
        }
    }
);

function finishPointer(event) {
    const point = pointerPosition(event);
    const wasMoved = dragState.moved;

    pointers.delete(event.pointerId);

    if (pointers.size < 2) {
        pinchDistance = 0;
    }

    if (pointers.size === 0) {
        dragState.active = false;
        canvas.classList.remove("dragging");

        if (!wasMoved) {
            const node = hitTestNode(
                point.x,
                point.y
            );

            if (node) {
                openDetail(node);
            }
        }

        dragState.moved = false;
    }
}

canvas.addEventListener(
    "pointerup",
    finishPointer
);

canvas.addEventListener(
    "pointercancel",
    finishPointer
);

canvas.addEventListener(
    "pointerleave",
    () => {
        if (!dragState.active) {
            hoveredNode = null;
            updateTooltip(null);
        }
    }
);

canvas.addEventListener(
    "wheel",
    (event) => {
        event.preventDefault();

        const point = pointerPosition(event);

        const factor = Math.exp(
            -event.deltaY * 0.0012
        );

        setZoomAt(
            point.x,
            point.y,
            camera.scale * factor
        );

        hideInteractionHint();
    },
    { passive: false }
);


// ----------------------------------------------------------
// BUTTON EVENTS
// ----------------------------------------------------------

els.zoomInButton.addEventListener(
    "click",
    () => {
        setZoomAt(
            canvas.clientWidth / 2,
            canvas.clientHeight / 2,
            camera.scale * 1.24
        );
    }
);

els.zoomOutButton.addEventListener(
    "click",
    () => {
        setZoomAt(
            canvas.clientWidth / 2,
            canvas.clientHeight / 2,
            camera.scale / 1.24
        );
    }
);

els.resetViewButton.addEventListener(
    "click",
    () => fitViewToVisibleNodes(true)
);

els.randomButton.addEventListener(
    "click",
    takeMeSomewhere
);

els.closeDetailButton.addEventListener(
    "click",
    closeDetail
);

els.infoButton.addEventListener(
    "click",
    () => {
        els.infoModal.hidden = false;
    }
);

els.closeInfoButton.addEventListener(
    "click",
    () => {
        els.infoModal.hidden = true;
    }
);

els.infoModal.addEventListener(
    "click",
    (event) => {
        if (event.target === els.infoModal) {
            els.infoModal.hidden = true;
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Escape") {
            closeDetail();
            els.infoModal.hidden = true;
        }
    }
);


// ----------------------------------------------------------
// HINT / INTRO
// ----------------------------------------------------------

function hideInteractionHint() {
    els.interactionHint.style.opacity = "0";
}

setTimeout(
    hideInteractionHint,
    6000
);

function hideIntro() {
    if (introHidden) {
        return;
    }

    introHidden = true;

    els.introOverlay.classList.add("hide");

    setTimeout(
        () => {
            els.introOverlay.hidden = true;
        },
        1050
    );
}


// ----------------------------------------------------------
// START
// ----------------------------------------------------------

async function start() {
    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    if (!window.db) {
        els.introStatus.textContent =
            "Supabase belum siap.";
        return;
    }

    accessCode = await ensureAccess();

    if (!accessCode) {
        window.location.href = "index.html";
        return;
    }

    try {
        els.introStatus.textContent =
            "Mengumpulkan cerita, hari, dan pulse kalian...";

        const [
            stories,
            metadata,
            daily,
            pulses
        ] = await Promise.all([
            fetchStories(),
            fetchStoryMetadata(),
            fetchDailyUniverse(),
            fetchAllPulseMonths()
        ]);

        rawStories = stories;
        rawMetadata = metadata;
        dailyDays = daily;
        pulseMonths = pulses;

        els.introStatus.textContent =
            "Menyusun konstelasi...";

        buildUniverseNodes();

        if (!allNodes.length) {
            els.introStatus.textContent =
                "Semesta masih kosong. Mulai dari Daily Check-in atau Cerita.";
            return;
        }

        fitViewToVisibleNodes(false);
        render();

        els.introStatus.textContent =
            `${allNodes.length} momen ditemukan. Selamat datang di semesta kalian.`;

        setTimeout(
            hideIntro,
            1150
        );
    } catch (error) {
        console.error(
            "Our Universe gagal dimuat:",
            error
        );

        els.introStatus.textContent =
            error.message
            || "Our Universe gagal dimuat. Periksa Supabase.";
    }
}

start();
