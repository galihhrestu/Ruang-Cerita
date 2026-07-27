// ==========================================================
// RUANG CERITA — RUANG SINEMA / OUR STORY V1
// Automatic cinematic film from:
// Daily Check-in + Couple Pulse + Cerita + Musik
// ==========================================================

const ACCESS_KEY_STORAGE = "kodeRuangCerita";
const WIB_TIME_ZONE = "Asia/Jakarta";
const MUSIC_BUCKET = "musik";

const cinema = {
    scope: "month",
    films: new Map(),
    daily: [],
    stories: [],
    metadata: [],
    pulses: [],
    music: [],
    musicIndex: 0,
    accessCode: "",

    film: {
        scenes: [],
        index: 0,
        playing: false,
        sceneStart: 0,
        elapsed: 0,
        transitioning: false
    },

    muted: false,
    controlsTimer: null,
    audioFadeTimer: null
};

const els = {
    app: document.getElementById("cinemaApp"),
    backdrop: document.getElementById("cinemaBackdrop"),

    lobby: document.getElementById("cinemaLobby"),
    loadingPanel: document.getElementById("loadingPanel"),
    loadingText: document.getElementById("loadingText"),
    directorPanel: document.getElementById("directorPanel"),

    chapterCards: [
        ...document.querySelectorAll(".chapter-card")
    ],

    monthChapterTitle:
        document.getElementById("monthChapterTitle"),

    monthChapterMeta:
        document.getElementById("monthChapterMeta"),

    yearChapterTitle:
        document.getElementById("yearChapterTitle"),

    yearChapterMeta:
        document.getElementById("yearChapterMeta"),

    allChapterMeta:
        document.getElementById("allChapterMeta"),

    filmPreviewTitle:
        document.getElementById("filmPreviewTitle"),

    filmPreviewDescription:
        document.getElementById("filmPreviewDescription"),

    previewScenes:
        document.getElementById("previewScenes"),

    previewRuntime:
        document.getElementById("previewRuntime"),

    previewSoundtrack:
        document.getElementById("previewSoundtrack"),

    watchButton:
        document.getElementById("watchButton"),

    experience:
        document.getElementById("filmExperience"),

    stage:
        document.getElementById("sceneStage"),

    exitFilmButton:
        document.getElementById("exitFilmButton"),

    soundButton:
        document.getElementById("soundButton"),

    filmSoundtrackTitle:
        document.getElementById("filmSoundtrackTitle"),

    filmControls:
        document.getElementById("filmControls"),

    filmTopbar:
        document.querySelector(".film-topbar"),

    soundtrackChip:
        document.querySelector(".soundtrack-chip"),

    progressBar:
        document.getElementById("filmProgressBar"),

    previousSceneButton:
        document.getElementById("previousSceneButton"),

    playPauseButton:
        document.getElementById("playPauseButton"),

    nextSceneButton:
        document.getElementById("nextSceneButton"),

    sceneCounter:
        document.getElementById("sceneCounter"),

    audio:
        document.getElementById("cinemaAudio")
};


// ==========================================================
// ACCESS
// ==========================================================

async function verifyAccessCode(code) {
    const { data, error } =
        await window.db.rpc(
            "cek_kode",
            {
                kode: code
            }
        );

    if (error) {
        console.error(
            "Gagal memeriksa kode:",
            error
        );

        return false;
    }

    return Boolean(data);
}

async function ensureAccess() {
    let code =
        localStorage.getItem(
            ACCESS_KEY_STORAGE
        );

    if (
        code
        && await verifyAccessCode(code)
    ) {
        return code;
    }

    localStorage.removeItem(
        ACCESS_KEY_STORAGE
    );

    code =
        prompt(
            "Masukkan kode akses Ruang Cerita:"
        );

    if (!code) {
        return null;
    }

    if (
        !await verifyAccessCode(code)
    ) {
        alert("Kode akses salah");
        return null;
    }

    localStorage.setItem(
        ACCESS_KEY_STORAGE,
        code
    );

    return code;
}


// ==========================================================
// DATA FETCHING
// ==========================================================

async function fetchStories() {
    const { data, error } =
        await window.db.rpc(
            "ambil_tulisan",
            {
                kode:
                    cinema.accessCode
            }
        );

    if (error) {
        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}

async function fetchMetadata() {
    const { data, error } =
        await window.db.rpc(
            "ambil_metadata_tulisan",
            {
                kode:
                    cinema.accessCode
            }
        );

    if (error) {
        console.warn(
            "Metadata cerita tidak tersedia:",
            error
        );

        return [];
    }

    return Array.isArray(data)
        ? data
        : [];
}

async function fetchDaily() {
    const { data, error } =
        await window.db.rpc(
            "ambil_universe_daily_checkin",
            {
                kode:
                    cinema.accessCode
            }
        );

    if (error) {
        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}

async function fetchPulseMonth(monthStart) {
    const { data, error } =
        await window.db.rpc(
            "ambil_couple_pulse",
            {
                kode:
                    cinema.accessCode,

                month_input:
                    monthStart
            }
        );

    if (error) {
        throw error;
    }

    return data;
}

async function fetchAllPulses() {
    const today =
        getTodayWib();

    const currentMonth =
        `${today.slice(0, 7)}-01`;

    const current =
        await fetchPulseMonth(
            currentMonth
        );

    const listed =
        Array.isArray(
            current?.available_months
        )
            ? current.available_months
                .map(
                    (item) =>
                        item?.month
                )
                .filter(Boolean)
            : [];

    if (
        !listed.includes(
            currentMonth
        )
    ) {
        listed.push(
            currentMonth
        );
    }

    const months =
        [...new Set(listed)]
            .sort();

    const results =
        await Promise.all(
            months.map(
                async (month) => {
                    try {
                        if (
                            month
                            === currentMonth
                        ) {
                            return current;
                        }

                        return (
                            await fetchPulseMonth(
                                month
                            )
                        );
                    } catch (error) {
                        console.warn(
                            `Couple Pulse ${month} gagal dimuat`,
                            error
                        );

                        return null;
                    }
                }
            )
        );

    return results.filter(Boolean);
}

async function fetchMusic() {
    try {
        const { data, error } =
            await window.db
                .from("musik")
                .select(
                    "id, judul, artis, file_path, urutan"
                )
                .eq(
                    "aktif",
                    true
                )
                .order(
                    "urutan",
                    {
                        ascending: true
                    }
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        return (data || [])
            .map(
                (track) => {
                    const {
                        data: urlData
                    } =
                        window.db.storage
                            .from(
                                MUSIC_BUCKET
                            )
                            .getPublicUrl(
                                track.file_path
                            );

                    return {
                        ...track,
                        url:
                            urlData.publicUrl
                    };
                }
            );
    } catch (error) {
        console.warn(
            "Soundtrack tidak dapat dimuat:",
            error
        );

        return [];
    }
}


// ==========================================================
// DATE HELPERS
// ==========================================================

function getTodayWib() {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    WIB_TIME_ZONE,

                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        )
            .formatToParts(
                new Date()
            );

    const values = {};

    parts.forEach(
        (part) => {
            values[
                part.type
            ] =
                part.value;
        }
    );

    return (
        `${values.year}-`
        + `${values.month}-`
        + `${values.day}`
    );
}

function normalizeDate(value) {
    if (!value) {
        return null;
    }

    const text =
        String(value).trim();

    const match =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (!match) {
        return null;
    }

    return (
        `${match[1]}-`
        + `${match[2]}-`
        + `${match[3]}`
    );
}

function storyDateWib(value) {
    if (!value) {
        return null;
    }

    const text =
        String(value)
            .trim()
            .replace(
                " ",
                "T"
            );

    const hasZone =
        /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i
            .test(text);

    const date =
        new Date(
            hasZone
                ? text
                : `${text}Z`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    WIB_TIME_ZONE,

                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        )
            .formatToParts(
                date
            );

    const values = {};

    parts.forEach(
        (part) => {
            values[
                part.type
            ] =
                part.value;
        }
    );

    return (
        `${values.year}-`
        + `${values.month}-`
        + `${values.day}`
    );
}

function dateToUtc(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return NaN;
    }

    const [
        year,
        month,
        day
    ] =
        normalized
            .split("-")
            .map(Number);

    return Date.UTC(
        year,
        month - 1,
        day
    );
}

function daysBetween(a, b) {
    return Math.round(
        (
            dateToUtc(b)
            - dateToUtc(a)
        )
        / 86400000
    );
}

function monthEndTimestamp(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return NaN;
    }

    const [
        year,
        month
    ] =
        normalized
            .split("-")
            .map(Number);

    return Date.UTC(
        year,
        month,
        0,
        23,
        59,
        59
    );
}

function formatDateID(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return "—";
    }

    const [
        year,
        month,
        day
    ] =
        normalized
            .split("-")
            .map(Number);

    return (
        new Intl.DateTimeFormat(
            "id-ID",
            {
                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric",

                timeZone:
                    "UTC"
            }
        )
            .format(
                new Date(
                    Date.UTC(
                        year,
                        month - 1,
                        day
                    )
                )
            )
    );
}

function formatMonthID(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return "—";
    }

    const [
        year,
        month
    ] =
        normalized
            .split("-")
            .map(Number);

    return (
        new Intl.DateTimeFormat(
            "id-ID",
            {
                month:
                    "long",

                year:
                    "numeric",

                timeZone:
                    "UTC"
            }
        )
            .format(
                new Date(
                    Date.UTC(
                        year,
                        month - 1,
                        1
                    )
                )
            )
    );
}

function formatMonthOnly(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return "Bulan";
    }

    const [
        year,
        month
    ] =
        normalized
            .split("-")
            .map(Number);

    return (
        new Intl.DateTimeFormat(
            "id-ID",
            {
                month:
                    "long",

                timeZone:
                    "UTC"
            }
        )
            .format(
                new Date(
                    Date.UTC(
                        year,
                        month - 1,
                        1
                    )
                )
            )
    );
}

function formatDayParts(value) {
    const normalized =
        normalizeDate(value);

    if (!normalized) {
        return {
            day: "—",
            monthYear: "—"
        };
    }

    const [
        year,
        month,
        day
    ] =
        normalized
            .split("-")
            .map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    return {
        day:
            String(day)
                .padStart(
                    2,
                    "0"
                ),

        monthYear:
            new Intl.DateTimeFormat(
                "id-ID",
                {
                    month:
                        "long",

                    year:
                        "numeric",

                    timeZone:
                        "UTC"
                }
            )
                .format(date)
                .toUpperCase()
    };
}

function scopeRange(scope) {
    const today =
        getTodayWib();

    const year =
        today.slice(
            0,
            4
        );

    const month =
        today.slice(
            0,
            7
        );

    if (
        scope
        === "month"
    ) {
        return {
            start:
                `${month}-01`,

            end:
                today
        };
    }

    if (
        scope
        === "year"
    ) {
        return {
            start:
                `${year}-01-01`,

            end:
                today
        };
    }

    const dates = [
        ...cinema.daily
            .map(
                (item) =>
                    normalizeDate(
                        item.date
                    )
            ),

        ...cinema.stories
            .map(
                (item) =>
                    item.filmDate
            ),

        ...cinema.pulses
            .map(
                (item) =>
                    normalizeDate(
                        item.month_start
                    )
            )
    ]
        .filter(Boolean)
        .sort();

    return {
        start:
            dates[0]
            || `${year}-01-01`,

        end:
            today
    };
}

function inRange(
    date,
    range
) {
    if (!date) {
        return false;
    }

    return (
        date >= range.start
        && date <= range.end
    );
}


// ==========================================================
// TEXT HELPERS
// ==========================================================

function escapeHTML(value) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function truncateText(
    value,
    max = 220
) {
    const text =
        String(
            value || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (
        text.length
        <= max
    ) {
        return text;
    }

    return (
        text
            .slice(
                0,
                max
            )
            .trim()
        + "…"
    );
}

function moodEmoji(mood) {
    const map = {
        "Bahagia":
            "😊",

        "Penuh Cinta":
            "❤️",

        "Tenang":
            "😌",

        "Bersyukur":
            "🌱",

        "Terharu":
            "🥺",

        "Sedih":
            "😔",

        "Lelah":
            "😮‍💨",

        "Cemas":
            "😰"
    };

    return (
        map[mood]
        || "✨"
    );
}

function formatTrack(track) {
    if (!track) {
        return "Tanpa soundtrack";
    }

    return track.artis
        ? `${track.artis} — ${track.judul}`
        : track.judul;
}

function formatRuntime(milliseconds) {
    const seconds =
        Math.max(
            1,
            Math.round(
                milliseconds
                / 1000
            )
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        seconds % 60;

    if (
        minutes === 0
    ) {
        return `${seconds} sec`;
    }

    return (
        `${minutes}:`
        + String(
            remaining
        ).padStart(
            2,
            "0"
        )
    );
}


// ==========================================================
// NORMALIZE DATA
// ==========================================================

function normalizeStories() {
    const metadataMap =
        new Map(
            cinema.metadata.map(
                (item) => [
                    String(
                        item.cerita_id
                    ),
                    item
                ]
            )
        );

    cinema.stories =
        cinema.stories
            .map(
                (story) => {
                    const metadata =
                        metadataMap.get(
                            String(
                                story.id
                            )
                        );

                    return {
                        ...story,

                        filmDate:
                            storyDateWib(
                                story.created_at
                            ),

                        kategori:
                            metadata?.kategori
                            || "Belum dikategorikan",

                        mood:
                            metadata?.mood
                            || "Belum dipilih"
                    };
                }
            )
            .filter(
                (story) =>
                    story.filmDate
            );
}

function avgDayRating(day) {
    const values = [
        Number(
            day.galih?.day_rating
        ),

        Number(
            day.wisye?.day_rating
        )
    ]
        .filter(
            Number.isFinite
        );

    if (!values.length) {
        return null;
    }

    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        )
        / values.length
    );
}

function isLoveDay(day) {
    return (
        day.galih?.mood
            === "Penuh Cinta"
        || day.wisye?.mood
            === "Penuh Cinta"
    );
}


// ==========================================================
// DIRECTOR — STREAK MILESTONES
// ==========================================================

function calculateMilestones() {
    const thresholds = [
        3,
        7,
        14,
        30,
        50,
        75,
        100,
        150,
        200,
        365,
        500,
        1000
    ];

    const days =
        [...cinema.daily]
            .map(
                (item) => ({
                    ...item,
                    normalizedDate:
                        normalizeDate(
                            item.date
                        )
                })
            )
            .filter(
                (item) =>
                    item.normalizedDate
            )
            .sort(
                (a, b) =>
                    a.normalizedDate
                        .localeCompare(
                            b.normalizedDate
                        )
            );

    const milestones = [];

    let streak = 0;
    let previous = null;

    days.forEach(
        (day) => {
            if (
                previous
                && daysBetween(
                    previous,
                    day.normalizedDate
                ) === 1
            ) {
                streak += 1;
            } else {
                streak = 1;
            }

            if (
                thresholds.includes(
                    streak
                )
            ) {
                milestones.push({
                    date:
                        day.normalizedDate,

                    streak
                });
            }

            previous =
                day.normalizedDate;
        }
    );

    return milestones;
}


// ==========================================================
// DIRECTOR — PICKERS
// ==========================================================

function addUniqueByDate(
    target,
    item,
    keyPrefix = ""
) {
    if (!item) {
        return;
    }

    const key =
        `${keyPrefix}${item.date}`;

    if (
        !target.some(
            (existing) =>
                existing._pickKey
                === key
        )
    ) {
        target.push({
            ...item,
            _pickKey:
                key
        });
    }
}

function evenlyPick(
    items,
    count
) {
    if (
        items.length
        <= count
    ) {
        return [...items];
    }

    if (
        count <= 1
    ) {
        return [
            items[
                items.length - 1
            ]
        ];
    }

    const result = [];

    for (
        let i = 0;
        i < count;
        i++
    ) {
        const index =
            Math.round(
                i
                * (
                    items.length - 1
                )
                / (
                    count - 1
                )
            );

        const item =
            items[index];

        if (
            item
            && !result.includes(
                item
            )
        ) {
            result.push(
                item
            );
        }
    }

    return result;
}

function pickDailyHighlights(
    days,
    quota
) {
    const sorted =
        [...days]
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );

    if (
        sorted.length
        <= quota
    ) {
        return sorted;
    }

    const selected = [];

    const rated =
        sorted
            .map(
                (day) => ({
                    ...day,
                    score:
                        avgDayRating(
                            day
                        )
                })
            )
            .filter(
                (day) =>
                    Number.isFinite(
                        day.score
                    )
            );

    const best =
        [...rated]
            .sort(
                (a, b) =>
                    b.score
                    - a.score
            )[0];

    const hardest =
        [...rated]
            .sort(
                (a, b) =>
                    a.score
                    - b.score
            )[0];

    addUniqueByDate(
        selected,
        best,
        "daily-"
    );

    addUniqueByDate(
        selected,
        hardest,
        "daily-"
    );

    sorted
        .filter(
            (day) =>
                day.is_restored
        )
        .slice(
            0,
            2
        )
        .forEach(
            (day) =>
                addUniqueByDate(
                    selected,
                    day,
                    "daily-"
                )
        );

    sorted
        .filter(
            isLoveDay
        )
        .slice(
            0,
            2
        )
        .forEach(
            (day) =>
                addUniqueByDate(
                    selected,
                    day,
                    "daily-"
                )
        );

    const notes =
        sorted.filter(
            (day) =>
                day.galih?.note
                || day.wisye?.note
        );

    notes
        .slice(
            0,
            2
        )
        .forEach(
            (day) =>
                addUniqueByDate(
                    selected,
                    day,
                    "daily-"
                )
        );

    evenlyPick(
        sorted,
        quota
    )
        .forEach(
            (day) =>
                addUniqueByDate(
                    selected,
                    day,
                    "daily-"
                )
        );

    return selected
        .slice(
            0,
            quota
        )
        .sort(
            (a, b) =>
                a.date.localeCompare(
                    b.date
                )
        );
}

function pickStories(
    stories,
    quota
) {
    const sorted =
        [...stories]
            .sort(
                (a, b) =>
                    a.filmDate.localeCompare(
                        b.filmDate
                    )
            );

    if (
        sorted.length
        <= quota
    ) {
        return sorted;
    }

    const picked = [];

    sorted
        .filter(
            (story) =>
                story.favorit
        )
        .slice(
            0,
            3
        )
        .forEach(
            (story) => {
                if (
                    !picked.includes(
                        story
                    )
                ) {
                    picked.push(
                        story
                    );
                }
            }
        );

    evenlyPick(
        sorted,
        quota
    )
        .forEach(
            (story) => {
                if (
                    !picked.includes(
                        story
                    )
                ) {
                    picked.push(
                        story
                    );
                }
            }
        );

    return picked
        .slice(
            0,
            quota
        )
        .sort(
            (a, b) =>
                a.filmDate.localeCompare(
                    b.filmDate
                )
        );
}

function pickPulses(
    pulses,
    quota
) {
    const sorted =
        [...pulses]
            .sort(
                (a, b) =>
                    String(
                        a.month_start
                    )
                        .localeCompare(
                            String(
                                b.month_start
                            )
                        )
            );

    return evenlyPick(
        sorted,
        quota
    );
}


// ==========================================================
// DIRECTOR — SCENE BUILDERS
// ==========================================================

function directorQuotas(scope) {
    if (
        scope
        === "month"
    ) {
        return {
            daily: 5,
            stories: 4,
            pulses: 1,
            milestones: 2
        };
    }

    if (
        scope
        === "year"
    ) {
        return {
            daily: 7,
            stories: 6,
            pulses: 5,
            milestones: 3
        };
    }

    return {
        daily: 8,
        stories: 8,
        pulses: 7,
        milestones: 4
    };
}

function sceneDuration(type) {
    const durations = {
        opening: 5500,
        daily: 5200,
        restored: 6000,
        story: 6800,
        pulse: 6200,
        milestone: 5700,
        ending: 9000
    };

    return (
        durations[type]
        || 5500
    );
}

function createOpeningScene(
    scope,
    range,
    counts
) {
    let chapter = "";

    if (
        scope
        === "month"
    ) {
        chapter =
            formatMonthID(
                range.start
            );
    } else if (
        scope
        === "year"
    ) {
        chapter =
            range.start.slice(
                0,
                4
            );
    } else {
        chapter =
            "THE WHOLE STORY";
    }

    return {
        type: "opening",
        duration:
            sceneDuration(
                "opening"
            ),

        chapter,
        counts
    };
}

function createDailyScene(
    day,
    bestDate,
    hardestDate
) {
    const score =
        avgDayRating(
            day
        );

    let variant =
        "ordinary";

    if (
        day.is_restored
    ) {
        return {
            type: "restored",
            date: day.date,
            duration:
                sceneDuration(
                    "restored"
                ),
            day
        };
    }

    if (
        day.date
        === bestDate
    ) {
        variant =
            "best";
    } else if (
        day.date
        === hardestDate
    ) {
        variant =
            "hard";
    } else if (
        isLoveDay(day)
    ) {
        variant =
            "love";
    }

    return {
        type: "daily",
        date: day.date,
        duration:
            sceneDuration(
                "daily"
            ),
        day,
        score,
        variant
    };
}

function createStoryScene(story) {
    return {
        type: "story",
        date:
            story.filmDate,

        duration:
            sceneDuration(
                "story"
            ),

        story
    };
}

function createPulseScene(pulse) {
    const date =
        normalizeDate(
            pulse.month_start
        );

    return {
        type: "pulse",
        date,
        duration:
            sceneDuration(
                "pulse"
            ),
        pulse
    };
}

function createMilestoneScene(
    milestone
) {
    return {
        type: "milestone",
        date:
            milestone.date,

        duration:
            sceneDuration(
                "milestone"
            ),

        streak:
            milestone.streak
    };
}

function createEndingScene(
    scope,
    range,
    counts
) {
    return {
        type: "ending",
        duration:
            sceneDuration(
                "ending"
            ),
        scope,
        range,
        counts
    };
}

function sceneSortValue(scene) {
    if (
        scene.type
        === "pulse"
    ) {
        return monthEndTimestamp(
            scene.date
        );
    }

    const base =
        dateToUtc(
            scene.date
        );

    const offsets = {
        daily: 1000,
        restored: 1100,
        milestone: 1600,
        story: 2000
    };

    return (
        base
        + (
            offsets[
                scene.type
            ]
            || 0
        )
    );
}

function buildFilm(scope) {
    const cached =
        cinema.films.get(
            scope
        );

    if (cached) {
        return cached;
    }

    const range =
        scopeRange(
            scope
        );

    const quotas =
        directorQuotas(
            scope
        );

    const days =
        cinema.daily
            .map(
                (day) => ({
                    ...day,
                    date:
                        normalizeDate(
                            day.date
                        )
                })
            )
            .filter(
                (day) =>
                    inRange(
                        day.date,
                        range
                    )
            );

    const stories =
        cinema.stories.filter(
            (story) =>
                inRange(
                    story.filmDate,
                    range
                )
        );

    const pulses =
        cinema.pulses.filter(
            (pulse) => {
                const date =
                    normalizeDate(
                        pulse.month_start
                    );

                return (
                    date
                    && date.slice(
                        0,
                        7
                    )
                    >= range.start.slice(
                        0,
                        7
                    )
                    && date.slice(
                        0,
                        7
                    )
                    <= range.end.slice(
                        0,
                        7
                    )
                );
            }
        );

    const selectedDays =
        pickDailyHighlights(
            days,
            quotas.daily
        );

    const selectedStories =
        pickStories(
            stories,
            quotas.stories
        );

    const selectedPulses =
        pickPulses(
            pulses,
            quotas.pulses
        );

    const milestones =
        calculateMilestones()
            .filter(
                (item) =>
                    inRange(
                        item.date,
                        range
                    )
            )
            .slice(
                -quotas.milestones
            );

    const rated =
        days
            .map(
                (day) => ({
                    date:
                        day.date,

                    score:
                        avgDayRating(
                            day
                        )
                })
            )
            .filter(
                (item) =>
                    Number.isFinite(
                        item.score
                    )
            );

    const bestDate =
        [...rated]
            .sort(
                (a, b) =>
                    b.score
                    - a.score
            )[0]
            ?.date
        || null;

    const hardestDate =
        [...rated]
            .sort(
                (a, b) =>
                    a.score
                    - b.score
            )[0]
            ?.date
        || null;

    const content = [
        ...selectedDays.map(
            (day) =>
                createDailyScene(
                    day,
                    bestDate,
                    hardestDate
                )
        ),

        ...selectedStories.map(
            createStoryScene
        ),

        ...selectedPulses.map(
            createPulseScene
        ),

        ...milestones.map(
            createMilestoneScene
        )
    ]
        .sort(
            (a, b) =>
                sceneSortValue(a)
                - sceneSortValue(b)
        );

    const counts = {
        daily:
            days.length,

        stories:
            stories.length,

        pulses:
            pulses.length
    };

    const scenes = [
        createOpeningScene(
            scope,
            range,
            counts
        ),

        ...content,

        createEndingScene(
            scope,
            range,
            counts
        )
    ];

    const runtime =
        scenes.reduce(
            (total, scene) =>
                total
                + scene.duration,
            0
        );

    const film = {
        scope,
        range,
        scenes,
        runtime,
        counts
    };

    cinema.films.set(
        scope,
        film
    );

    return film;
}


// ==========================================================
// SCENE COPY
// ==========================================================

function dailyCaption(scene) {
    const day = scene.day;

    if (scene.variant === "best") {
        return {
            main: "One of the good days.",
            sub:
                "Hari dengan rata-rata nilai tertinggi di chapter ini."
        };
    }

    if (scene.variant === "hard") {
        return {
            main: "Not every day had to be easy.",
            sub:
                "Yang penting kita tetap datang dan saling melihat."
        };
    }

    if (scene.variant === "love") {
        return {
            main: "Love showed up in the little things.",
            sub:
                "Satu hari ketika rasa penuh cinta ikut tersimpan."
        };
    }

    if (
        day.galih?.need_today
        && day.galih?.need_today
            === day.wisye?.need_today
    ) {
        return {
            main:
                `That day, you both needed ${day.galih.need_today.toLowerCase()}.`,

            sub:
                "Kadang hal kecil yang sama terasa cukup berarti."
        };
    }

    return {
        main:
            "Another little day, kept forever.",

        sub:
            "Satu hari biasa yang sekarang menjadi bagian dari cerita kita."
    };
}

function storyExcerpt(story) {
    const body =
        String(
            story.isi || ""
        )
            .split(/\n+/)
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean)
            .join(" ");

    return truncateText(
        body,
        245
    );
}


// ==========================================================
// SCENE RENDERERS
// ==========================================================

function renderOpening(scene) {
    return `
        <article class="scene opening-scene">

            <div class="opening-content">

                <p class="opening-original">
                    A RUANG CERITA ORIGINAL
                </p>

                <p class="opening-names">
                    Galih
                    <span>×</span>
                    Wisye
                </p>

                <h2 class="opening-story-title">
                    Our Story
                </h2>

                <p class="opening-chapter">
                    ${escapeHTML(scene.chapter)}
                </p>

            </div>

        </article>
    `;
}

function renderDailyPersonFilm(
    name,
    person
) {
    const mood =
        person?.mood
        || "—";

    return `
        <section class="daily-person-film">

            <p class="person-name">
                ${escapeHTML(name)}
            </p>

            <p class="person-mood">
                ${moodEmoji(mood)}
                ${escapeHTML(mood)}
            </p>

            <div class="person-metrics">

                <span>
                    ⚡
                    ${escapeHTML(
                        person?.energy
                        ?? "—"
                    )}/5
                </span>

                <span>
                    ${escapeHTML(
                        person?.day_rating
                        ?? "—"
                    )}/10
                </span>

                ${
                    person?.need_today
                        ? `
                            <span>
                                ${
                                    escapeHTML(
                                        person.need_today
                                    )
                                }
                            </span>
                        `
                        : ""
                }

            </div>

        </section>
    `;
}

function renderDaily(scene) {
    const parts =
        formatDayParts(
            scene.date
        );

    const caption =
        dailyCaption(
            scene
        );

    return `
        <article class="scene daily-scene">

            <div>

                <div class="daily-date">

                    <span class="daily-date-day">
                        ${parts.day}
                    </span>

                    <span class="daily-date-month">
                        ${
                            escapeHTML(
                                parts.monthYear
                            )
                        }
                    </span>

                </div>


                <div class="daily-pair">

                    ${
                        renderDailyPersonFilm(
                            "GALIH",
                            scene.day.galih
                        )
                    }

                    <div class="daily-heart">
                        ♥
                    </div>

                    ${
                        renderDailyPersonFilm(
                            "WISYE",
                            scene.day.wisye
                        )
                    }

                </div>


                <p class="daily-caption">

                    ${
                        escapeHTML(
                            caption.main
                        )
                    }

                    <small>
                        ${
                            escapeHTML(
                                caption.sub
                            )
                        }
                    </small>

                </p>

            </div>

        </article>
    `;
}

function renderStory(scene) {
    const story =
        scene.story;

    return `
        <article class="scene story-scene">

            <section class="story-paper">

                <p class="story-paper-kicker">
                    A STORY
                </p>

                <h2>
                    ${
                        escapeHTML(
                            story.judul
                            || "Tanpa judul"
                        )
                    }
                </h2>

                <p class="story-date">
                    ${
                        escapeHTML(
                            formatDateID(
                                scene.date
                            )
                        )
                    }
                </p>

                <p class="story-quote">
                    “${
                        escapeHTML(
                            storyExcerpt(
                                story
                            )
                        )
                    }”
                </p>

                <div class="story-meta">

                    <span>
                        ${
                            moodEmoji(
                                story.mood
                            )
                        }
                        ${
                            escapeHTML(
                                story.mood
                            )
                        }
                    </span>

                    <span>
                        ${
                            escapeHTML(
                                story.kategori
                            )
                        }
                    </span>

                    ${
                        story.favorit
                            ? `
                                <span>
                                    ♥ Favorit
                                </span>
                            `
                            : ""
                    }

                </div>

            </section>

        </article>
    `;
}

function renderPulse(scene) {
    const pulse =
        scene.pulse;

    const month =
        formatMonthOnly(
            scene.date
        );

    const year =
        scene.date.slice(
            0,
            4
        );

    const galihMood =
        pulse.galih?.top_mood
        || "—";

    const wisyeMood =
        pulse.wisye?.top_mood
        || "—";

    return `
        <article class="scene pulse-scene">

            <span class="pulse-background-number">
                ${
                    escapeHTML(
                        scene.date.slice(
                            5,
                            7
                        )
                    )
                }
            </span>

            <div class="pulse-content-film">

                <p class="scene-label">
                    CHAPTER · ${escapeHTML(year)}
                </p>

                <h2 class="pulse-month">
                    ${escapeHTML(month)}
                </h2>

                <div class="pulse-stats-film">

                    <div>
                        <span>
                            DAYS TOGETHER
                        </span>

                        <strong>
                            ${
                                escapeHTML(
                                    pulse.complete_days
                                    ?? 0
                                )
                            } ❤️
                        </strong>
                    </div>


                    <div>
                        <span>
                            LONGEST STREAK
                        </span>

                        <strong>
                            ${
                                escapeHTML(
                                    pulse.longest_streak
                                    ?? 0
                                )
                            } days
                        </strong>
                    </div>


                    <div>
                        <span>
                            CONSISTENCY
                        </span>

                        <strong>
                            ${
                                escapeHTML(
                                    pulse.completion_percent
                                    ?? 0
                                )
                            }%
                        </strong>
                    </div>


                    <div>
                        <span>
                            GALIH
                        </span>

                        <strong>
                            ${
                                moodEmoji(
                                    galihMood
                                )
                            }
                            ${
                                escapeHTML(
                                    galihMood
                                )
                            }
                        </strong>
                    </div>


                    <div>
                        <span>
                            WISYE
                        </span>

                        <strong>
                            ${
                                moodEmoji(
                                    wisyeMood
                                )
                            }
                            ${
                                escapeHTML(
                                    wisyeMood
                                )
                            }
                        </strong>
                    </div>


                    <div>
                        <span>
                            MOST NEEDED
                        </span>

                        <strong>
                            ${
                                escapeHTML(
                                    pulse.common_need
                                    || "—"
                                )
                            }
                        </strong>
                    </div>

                </div>


                <p class="pulse-ending-line">
                    “This was our ${escapeHTML(month)}.”
                </p>

            </div>

        </article>
    `;
}

function milestoneCopy(streak) {
    if (streak >= 365) {
        return "A whole year of showing up for each other.";
    }

    if (streak >= 100) {
        return "A hundred little choices to keep showing up.";
    }

    if (streak >= 30) {
        return "A month of showing up for each other.";
    }

    if (streak >= 14) {
        return "Two weeks of choosing to stay connected.";
    }

    if (streak >= 7) {
        return "A week of showing up, one day at a time.";
    }

    return "The beginning of a rhythm that belongs to both of you.";
}

function renderMilestone(scene) {
    return `
        <article class="scene milestone-scene">

            <div>

                <p class="scene-label">
                    A LITTLE MILESTONE
                </p>

                <strong class="milestone-number">
                    ${escapeHTML(scene.streak)}
                </strong>

                <p class="milestone-days">
                    DAYS TOGETHER
                </p>

                <p class="milestone-copy">
                    ${
                        escapeHTML(
                            milestoneCopy(
                                scene.streak
                            )
                        )
                    }
                </p>

            </div>

        </article>
    `;
}

function renderRestored(scene) {
    return `
        <article class="scene restored-scene">

            <div>

                <div class="restored-heart">
                    ❤️‍🩹
                </div>

                <h2>
                    We missed a day.

                    <span>
                        But we came back.
                    </span>
                </h2>

                <p>
                    ${
                        escapeHTML(
                            formatDateID(
                                scene.date
                            )
                        )
                    }
                    · RESTORED
                </p>

            </div>

        </article>
    `;
}

function endingRangeText(scene) {
    if (
        scene.scope
        === "month"
    ) {
        return (
            formatMonthID(
                scene.range.start
            )
            + " · ∞"
        );
    }

    if (
        scene.scope
        === "year"
    ) {
        return (
            scene.range.start.slice(
                0,
                4
            )
            + " · ∞"
        );
    }

    return (
        scene.range.start.slice(
            0,
            4
        )
        + " — ∞"
    );
}

function renderEnding(scene) {
    const daily =
        scene.counts.daily;

    const stories =
        scene.counts.stories;

    return `
        <article class="scene ending-scene">

            <div>

                <p class="ending-lines">
                    <strong>
                        ${escapeHTML(daily)}
                    </strong>
                    days remembered.

                    <br>

                    <strong>
                        ${escapeHTML(stories)}
                    </strong>
                    stories written.

                    <br>

                    two people.
                </p>


                <h2 class="ending-main">
                    And we're still
                    writing it.
                </h2>


                <p class="ending-names">
                    Galih × Wisye
                </p>

                <p class="ending-range">
                    ${
                        escapeHTML(
                            endingRangeText(
                                scene
                            )
                        )
                    }
                </p>


                <div class="ending-actions">

                    <button
                        id="watchAgainButton"
                        type="button"
                        class="watch-again"
                    >
                        ▶ Watch Again
                    </button>

                    <a href="universe.html">
                        ✦ Explore Our Universe
                    </a>

                    <a href="index.html">
                        ← Ruang Cerita
                    </a>

                </div>

            </div>

        </article>
    `;
}

function renderSceneHTML(scene) {
    if (
        scene.type
        === "opening"
    ) {
        return renderOpening(
            scene
        );
    }

    if (
        scene.type
        === "daily"
    ) {
        return renderDaily(
            scene
        );
    }

    if (
        scene.type
        === "restored"
    ) {
        return renderRestored(
            scene
        );
    }

    if (
        scene.type
        === "story"
    ) {
        return renderStory(
            scene
        );
    }

    if (
        scene.type
        === "pulse"
    ) {
        return renderPulse(
            scene
        );
    }

    if (
        scene.type
        === "milestone"
    ) {
        return renderMilestone(
            scene
        );
    }

    return renderEnding(
        scene
    );
}


// ==========================================================
// MUSIC
// ==========================================================

function chooseInitialMusic() {
    if (!cinema.music.length) {
        return;
    }

    const savedPath =
        localStorage.getItem(
            "musikFilePath"
        );

    const savedIndex =
        cinema.music.findIndex(
            (track) =>
                track.file_path
                === savedPath
        );

    cinema.musicIndex =
        savedIndex >= 0
            ? savedIndex
            : 0;

    loadMusicTrack(
        cinema.musicIndex,
        false
    );
}

function loadMusicTrack(
    index,
    autoplay
) {
    if (!cinema.music.length) {
        els.previewSoundtrack.textContent =
            "No soundtrack";

        els.filmSoundtrackTitle.textContent =
            "No soundtrack";

        return;
    }

    if (
        index < 0
    ) {
        index =
            cinema.music.length - 1;
    }

    if (
        index >= cinema.music.length
    ) {
        index = 0;
    }

    cinema.musicIndex =
        index;

    const track =
        cinema.music[
            cinema.musicIndex
        ];

    els.audio.src =
        track.url;

    els.audio.currentTime =
        0;

    els.previewSoundtrack.textContent =
        formatTrack(
            track
        );

    els.filmSoundtrackTitle.textContent =
        formatTrack(
            track
        );

    if (autoplay) {
        els.audio.play()
            .catch(
                () => {}
            );
    }
}

function masterVolume() {
    const stored =
        Number(
            localStorage.getItem(
                "volumeMusik"
            )
        );

    if (
        Number.isFinite(
            stored
        )
        && stored >= 0
        && stored <= 1
    ) {
        return stored;
    }

    return 0.35;
}

function sceneVolumeFactor(
    scene
) {
    const factors = {
        opening: 0.52,
        daily: 0.76,
        restored: 0.58,
        story: 0.52,
        pulse: 0.68,
        milestone: 0.72,
        ending: 0.45
    };

    return (
        factors[
            scene.type
        ]
        ?? 0.65
    );
}

function fadeAudioTo(
    target,
    duration = 900
) {
    clearInterval(
        cinema.audioFadeTimer
    );

    const start =
        els.audio.volume;

    const started =
        performance.now();

    cinema.audioFadeTimer =
        window.setInterval(
            () => {
                const progress =
                    Math.min(
                        1,
                        (
                            performance.now()
                            - started
                        )
                        / duration
                    );

                const eased =
                    progress
                    * (
                        2
                        - progress
                    );

                els.audio.volume =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            start
                            + (
                                target
                                - start
                            )
                            * eased
                        )
                    );

                if (
                    progress >= 1
                ) {
                    clearInterval(
                        cinema.audioFadeTimer
                    );

                    cinema.audioFadeTimer =
                        null;
                }
            },
            30
        );
}

function updateSceneMusic(scene) {
    if (!cinema.music.length) {
        return;
    }

    const target =
        masterVolume()
        * sceneVolumeFactor(
            scene
        );

    fadeAudioTo(
        target,
        850
    );
}

async function beginSoundtrack() {
    if (!cinema.music.length) {
        return;
    }

    const opening =
        cinema.film.scenes[0];

    els.audio.volume = 0;
    els.audio.muted =
        cinema.muted;

    try {
        await els.audio.play();

        fadeAudioTo(
            masterVolume()
            * sceneVolumeFactor(
                opening
            ),
            1700
        );
    } catch (error) {
        console.log(
            "Soundtrack menunggu interaksi browser:",
            error
        );
    }
}

els.audio.addEventListener(
    "ended",
    () => {
        loadMusicTrack(
            cinema.musicIndex + 1,
            true
        );

        const current =
            cinema.film.scenes[
                cinema.film.index
            ];

        if (current) {
            els.audio.volume =
                masterVolume()
                * sceneVolumeFactor(
                    current
                );
        }
    }
);


// ==========================================================
// PLAYBACK
// ==========================================================

function totalFilmProgress(
    sceneProgress
) {
    const scenes =
        cinema.film.scenes;

    if (!scenes.length) {
        return 0;
    }

    const index =
        cinema.film.index;

    return (
        (
            index
            + sceneProgress
        )
        / scenes.length
    );
}

function updateFilmControls(
    sceneProgress = 0
) {
    const scenes =
        cinema.film.scenes;

    els.sceneCounter.textContent =
        `${
            cinema.film.index + 1
        } / ${scenes.length}`;

    els.progressBar.style.width =
        `${
            Math.max(
                0,
                Math.min(
                    100,
                    totalFilmProgress(
                        sceneProgress
                    )
                    * 100
                )
            )
        }%`;

    els.playPauseButton.textContent =
        cinema.film.playing
            ? "❚❚"
            : "▶";

    els.previousSceneButton.disabled =
        cinema.film.index
        <= 0;

    els.nextSceneButton.disabled =
        cinema.film.index
        >= scenes.length - 1;
}

function attachEndingActions() {
    document
        .getElementById(
            "watchAgainButton"
        )
        ?.addEventListener(
            "click",
            () => {
                showScene(
                    0,
                    true
                );
            }
        );
}

function showScene(
    index,
    autoplay = true
) {
    const scenes =
        cinema.film.scenes;

    if (
        !scenes.length
    ) {
        return;
    }

    index =
        Math.max(
            0,
            Math.min(
                scenes.length - 1,
                index
            )
        );

    if (
        cinema.film.transitioning
    ) {
        return;
    }

    cinema.film.transitioning =
        true;

    els.stage.classList.add(
        "scene-leave"
    );

    setTimeout(
        () => {
            cinema.film.index =
                index;

            const scene =
                scenes[index];

            els.stage.innerHTML =
                renderSceneHTML(
                    scene
                );

            els.stage.classList.remove(
                "scene-leave"
            );

            els.stage.classList.remove(
                "scene-enter"
            );

            void els.stage.offsetWidth;

            els.stage.classList.add(
                "scene-enter"
            );

            cinema.film.elapsed =
                0;

            cinema.film.sceneStart =
                performance.now();

            cinema.film.playing =
                autoplay;

            cinema.film.transitioning =
                false;

            updateSceneMusic(
                scene
            );

            updateFilmControls(
                0
            );

            attachEndingActions();

            showControls();
        },
        390
    );
}

function pauseFilm() {
    if (
        !cinema.film.playing
    ) {
        return;
    }

    cinema.film.elapsed =
        performance.now()
        - cinema.film.sceneStart;

    cinema.film.playing =
        false;

    updateFilmControls(
        cinema.film.elapsed
        / (
            cinema.film.scenes[
                cinema.film.index
            ]?.duration
            || 1
        )
    );

    showControls();
}

function resumeFilm() {
    if (
        cinema.film.playing
    ) {
        return;
    }

    cinema.film.sceneStart =
        performance.now()
        - cinema.film.elapsed;

    cinema.film.playing =
        true;

    updateFilmControls(
        cinema.film.elapsed
        / (
            cinema.film.scenes[
                cinema.film.index
            ]?.duration
            || 1
        )
    );

    showControls();
}

function toggleFilmPlayback() {
    if (
        cinema.film.playing
    ) {
        pauseFilm();
    } else {
        resumeFilm();
    }
}

function playbackLoop(now) {
    if (
        !els.experience.hidden
        && cinema.film.scenes.length
    ) {
        const scene =
            cinema.film.scenes[
                cinema.film.index
            ];

        if (
            cinema.film.playing
            && !cinema.film.transitioning
        ) {
            cinema.film.elapsed =
                now
                - cinema.film.sceneStart;

            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,
                        cinema.film.elapsed
                        / scene.duration
                    )
                );

            updateFilmControls(
                progress
            );

            const isEnding =
                scene.type
                === "ending";

            if (
                progress >= 1
                && !isEnding
            ) {
                showScene(
                    cinema.film.index + 1,
                    true
                );
            }

            if (
                progress >= 1
                && isEnding
            ) {
                cinema.film.playing =
                    false;

                updateFilmControls(
                    1
                );

                showControls();
            }
        }
    }

    requestAnimationFrame(
        playbackLoop
    );
}

requestAnimationFrame(
    playbackLoop
);


// ==========================================================
// CONTROLS VISIBILITY
// ==========================================================

function showControls() {
    clearTimeout(
        cinema.controlsTimer
    );

    [
        els.filmControls,
        els.filmTopbar,
        els.soundtrackChip
    ]
        .forEach(
            (element) =>
                element
                    ?.classList
                    .remove(
                        "controls-hidden"
                    )
        );

    if (
        cinema.film.playing
    ) {
        cinema.controlsTimer =
            window.setTimeout(
                () => {
                    [
                        els.filmControls,
                        els.filmTopbar,
                        els.soundtrackChip
                    ]
                        .forEach(
                            (element) =>
                                element
                                    ?.classList
                                    .add(
                                        "controls-hidden"
                                    )
                        );
                },
                3200
            );
    }
}

function toggleSound() {
    cinema.muted =
        !cinema.muted;

    els.audio.muted =
        cinema.muted;

    els.soundButton.textContent =
        cinema.muted
            ? "∅"
            : "♪";

    showControls();
}


// ==========================================================
// FILM START / EXIT
// ==========================================================

async function startFilm() {
    const film =
        buildFilm(
            cinema.scope
        );

    if (
        film.scenes.length
        <= 2
        && film.counts.daily === 0
        && film.counts.stories === 0
    ) {
        alert(
            "Chapter ini belum memiliki cukup momen untuk diputar."
        );

        return;
    }

    cinema.film.scenes =
        film.scenes;

    cinema.film.index = 0;
    cinema.film.elapsed = 0;
    cinema.film.playing = true;

    els.lobby.classList.add(
        "leave"
    );

    setTimeout(
        () => {
            els.lobby.hidden =
                true;

            els.experience.hidden =
                false;

            showScene(
                0,
                true
            );

            beginSoundtrack();

            showControls();
        },
        650
    );
}

function exitFilm() {
    pauseFilm();

    fadeAudioTo(
        0,
        450
    );

    setTimeout(
        () => {
            els.audio.pause();
        },
        470
    );

    els.experience.hidden =
        true;

    els.lobby.hidden =
        false;

    requestAnimationFrame(
        () => {
            els.lobby.classList.remove(
                "leave"
            );
        }
    );
}


// ==========================================================
// LOBBY PREVIEW
// ==========================================================

function scopeTitle(scope) {
    const today =
        getTodayWib();

    if (
        scope
        === "month"
    ) {
        return formatMonthID(
            `${today.slice(0, 7)}-01`
        );
    }

    if (
        scope
        === "year"
    ) {
        return today.slice(
            0,
            4
        );
    }

    return "The Whole Story";
}

function scopeDescription(
    scope,
    film
) {
    if (
        scope
        === "month"
    ) {
        return (
            `${film.counts.daily} hari complete, `
            + `${film.counts.stories} cerita, `
            + "dan pulse bulan ini."
        );
    }

    if (
        scope
        === "year"
    ) {
        return (
            `${film.counts.daily} hari bersama dan `
            + `${film.counts.stories} cerita `
            + "dirangkum menjadi satu chapter tahunan."
        );
    }

    return (
        "Perjalanan dari momen paling awal sampai hari ini, "
        + "disutradarai otomatis dari Ruang Cerita."
    );
}

function updateLobbyCounts() {
    const monthFilm =
        buildFilm(
            "month"
        );

    const yearFilm =
        buildFilm(
            "year"
        );

    const allFilm =
        buildFilm(
            "all"
        );

    const today =
        getTodayWib();

    els.monthChapterTitle.textContent =
        formatMonthID(
            `${today.slice(0, 7)}-01`
        );

    els.monthChapterMeta.textContent =
        `${monthFilm.counts.daily} days · ${monthFilm.counts.stories} stories`;

    els.yearChapterTitle.textContent =
        today.slice(
            0,
            4
        );

    els.yearChapterMeta.textContent =
        `${yearFilm.counts.daily} days · ${yearFilm.counts.stories} stories`;

    els.allChapterMeta.textContent =
        `${allFilm.counts.daily} days · ${allFilm.counts.stories} stories`;
}

function updateFilmPreview() {
    const film =
        buildFilm(
            cinema.scope
        );

    els.filmPreviewTitle.textContent =
        scopeTitle(
            cinema.scope
        );

    els.filmPreviewDescription.textContent =
        scopeDescription(
            cinema.scope,
            film
        );

    els.previewScenes.textContent =
        String(
            film.scenes.length
        );

    els.previewRuntime.textContent =
        formatRuntime(
            film.runtime
        );

    els.previewSoundtrack.textContent =
        formatTrack(
            cinema.music[
                cinema.musicIndex
            ]
        );
}

function setScope(scope) {
    cinema.scope =
        scope;

    els.chapterCards.forEach(
        (card) => {
            card.classList.toggle(
                "active",
                card.dataset.scope
                === scope
            );
        }
    );

    updateFilmPreview();
}


// ==========================================================
// BACKDROP
// ==========================================================

const backdropCtx =
    els.backdrop.getContext(
        "2d"
    );

let backdropStars = [];

function seededBackdropStars() {
    let state =
        987654321;

    function random() {
        state =
            (
                state * 1664525
                + 1013904223
            )
            >>> 0;

        return (
            state
            / 4294967296
        );
    }

    backdropStars =
        Array.from(
            {
                length: 150
            },
            (_, index) => ({
                x: random(),
                y: random(),
                size:
                    0.4
                    + random()
                    * 1.2,

                alpha:
                    0.12
                    + random()
                    * 0.45,

                phase:
                    random()
                    * Math.PI
                    * 2,

                speed:
                    0.0004
                    + random()
                    * 0.0011,

                rose:
                    random()
                    > 0.82,

                index
            })
        );
}

function resizeBackdrop() {
    const dpr =
        Math.min(
            window.devicePixelRatio
            || 1,
            2
        );

    const rect =
        els.backdrop.getBoundingClientRect();

    els.backdrop.width =
        Math.floor(
            rect.width
            * dpr
        );

    els.backdrop.height =
        Math.floor(
            rect.height
            * dpr
        );

    backdropCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

function renderBackdrop(time) {
    const width =
        els.backdrop.clientWidth;

    const height =
        els.backdrop.clientHeight;

    backdropCtx.clearRect(
        0,
        0,
        width,
        height
    );

    const glow =
        backdropCtx
            .createRadialGradient(
                width * 0.48,
                height * 0.45,
                10,
                width * 0.48,
                height * 0.45,
                Math.max(
                    width,
                    height
                )
                * 0.72
            );

    glow.addColorStop(
        0,
        "rgba(48,36,40,0.22)"
    );

    glow.addColorStop(
        0.55,
        "rgba(15,12,13,0.02)"
    );

    glow.addColorStop(
        1,
        "rgba(0,0,0,0.15)"
    );

    backdropCtx.fillStyle =
        glow;

    backdropCtx.fillRect(
        0,
        0,
        width,
        height
    );

    backdropStars.forEach(
        (star) => {
            const alpha =
                star.alpha
                * (
                    0.72
                    + Math.sin(
                        time
                        * star.speed
                        + star.phase
                    )
                    * 0.28
                );

            backdropCtx.fillStyle =
                star.rose
                    ? `rgba(240,199,208,${alpha})`
                    : `rgba(255,248,239,${alpha})`;

            backdropCtx.beginPath();

            backdropCtx.arc(
                star.x
                * width,

                star.y
                * height,

                star.size,

                0,

                Math.PI
                * 2
            );

            backdropCtx.fill();
        }
    );

    requestAnimationFrame(
        renderBackdrop
    );
}


// ==========================================================
// EVENTS
// ==========================================================

els.chapterCards.forEach(
    (card) => {
        card.addEventListener(
            "click",
            () => {
                setScope(
                    card.dataset.scope
                );
            }
        );
    }
);

els.watchButton.addEventListener(
    "click",
    startFilm
);

els.exitFilmButton.addEventListener(
    "click",
    exitFilm
);

els.soundButton.addEventListener(
    "click",
    toggleSound
);

els.playPauseButton.addEventListener(
    "click",
    toggleFilmPlayback
);

els.previousSceneButton.addEventListener(
    "click",
    () => {
        showScene(
            cinema.film.index - 1,
            cinema.film.playing
        );
    }
);

els.nextSceneButton.addEventListener(
    "click",
    () => {
        showScene(
            cinema.film.index + 1,
            cinema.film.playing
        );
    }
);

[
    "mousemove",
    "pointerdown",
    "touchstart"
]
    .forEach(
        (eventName) => {
            document.addEventListener(
                eventName,
                () => {
                    if (
                        !els.experience.hidden
                    ) {
                        showControls();
                    }
                },
                {
                    passive: true
                }
            );
        }
    );

document.addEventListener(
    "keydown",
    (event) => {
        if (
            els.experience.hidden
        ) {
            return;
        }

        if (
            event.code
            === "Space"
        ) {
            event.preventDefault();

            toggleFilmPlayback();
        }

        if (
            event.key
            === "ArrowRight"
        ) {
            showScene(
                cinema.film.index + 1,
                cinema.film.playing
            );
        }

        if (
            event.key
            === "ArrowLeft"
        ) {
            showScene(
                cinema.film.index - 1,
                cinema.film.playing
            );
        }

        if (
            event.key
            === "Escape"
        ) {
            exitFilm();
        }
    }
);


// ==========================================================
// START
// ==========================================================

async function start() {
    seededBackdropStars();
    resizeBackdrop();

    window.addEventListener(
        "resize",
        resizeBackdrop
    );

    requestAnimationFrame(
        renderBackdrop
    );

    if (!window.db) {
        els.loadingText.textContent =
            "Supabase belum siap.";

        return;
    }

    cinema.accessCode =
        await ensureAccess();

    if (!cinema.accessCode) {
        window.location.href =
            "index.html";

        return;
    }

    try {
        els.loadingText.textContent =
            "Mengumpulkan hari, cerita, pulse, dan soundtrack...";

        const [
            stories,
            metadata,
            daily,
            pulses,
            music
        ] =
            await Promise.all([
                fetchStories(),
                fetchMetadata(),
                fetchDaily(),
                fetchAllPulses(),
                fetchMusic()
            ]);

        cinema.stories =
            stories;

        cinema.metadata =
            metadata;

        cinema.daily =
            daily;

        cinema.pulses =
            pulses;

        cinema.music =
            music;

        normalizeStories();
        chooseInitialMusic();

        cinema.films.clear();

        updateLobbyCounts();
        updateFilmPreview();

        els.loadingPanel.hidden =
            true;

        els.directorPanel.hidden =
            false;

        els.watchButton.disabled =
            false;

    } catch (error) {
        console.error(
            "Our Story gagal dimuat:",
            error
        );

        els.loadingText.textContent =
            (
                error.message
                || "Our Story gagal dimuat."
            );
    }
}

start();
