// ==========================================================
// RUANG CERITA — COUPLE PULSE V1
// ==========================================================

const ACCESS_KEY_STORAGE = "kodeRuangCerita";

let accessCode = "";

let activeMonth =
    firstDayOfMonth(
        new Date()
    );

let pulseData = null;


const els = {
    monthHeroLabel:
        document.getElementById(
            "monthHeroLabel"
        ),

    monthLabel:
        document.getElementById(
            "monthLabel"
        ),

    prevMonthButton:
        document.getElementById(
            "prevMonthButton"
        ),

    nextMonthButton:
        document.getElementById(
            "nextMonthButton"
        ),

    loadingState:
        document.getElementById(
            "loadingState"
        ),

    emptyState:
        document.getElementById(
            "emptyState"
        ),

    pulseContent:
        document.getElementById(
            "pulseContent"
        ),

    completeDays:
        document.getElementById(
            "completeDays"
        ),

    completionBar:
        document.getElementById(
            "completionBar"
        ),

    completionPercent:
        document.getElementById(
            "completionPercent"
        ),

    currentStreak:
        document.getElementById(
            "currentStreak"
        ),

    longestStreak:
        document.getElementById(
            "longestStreak"
        ),

    restoreUsed:
        document.getElementById(
            "restoreUsed"
        ),

    activeDays:
        document.getElementById(
            "activeDays"
        ),

    galihMood:
        document.getElementById(
            "galihMood"
        ),

    galihMoodEmoji:
        document.getElementById(
            "galihMoodEmoji"
        ),

    galihCount:
        document.getElementById(
            "galihCount"
        ),

    galihEnergy:
        document.getElementById(
            "galihEnergy"
        ),

    galihRating:
        document.getElementById(
            "galihRating"
        ),

    wisyeMood:
        document.getElementById(
            "wisyeMood"
        ),

    wisyeMoodEmoji:
        document.getElementById(
            "wisyeMoodEmoji"
        ),

    wisyeCount:
        document.getElementById(
            "wisyeCount"
        ),

    wisyeEnergy:
        document.getElementById(
            "wisyeEnergy"
        ),

    wisyeRating:
        document.getElementById(
            "wisyeRating"
        ),

    commonNeed:
        document.getElementById(
            "commonNeed"
        ),

    bestDay:
        document.getElementById(
            "bestDay"
        ),

    bestDayScore:
        document.getElementById(
            "bestDayScore"
        ),

    hardestDay:
        document.getElementById(
            "hardestDay"
        ),

    hardestDayScore:
        document.getElementById(
            "hardestDayScore"
        ),

    monthStoryTitle:
        document.getElementById(
            "monthStoryTitle"
        ),

    monthStoryText:
        document.getElementById(
            "monthStoryText"
        )
};


// ----------------------------------------------------------
// DATE
// ----------------------------------------------------------

function firstDayOfMonth(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
    );
}

function addMonths(date, amount) {
    return new Date(
        date.getFullYear(),
        date.getMonth() + amount,
        1
    );
}

function toSqlDate(date) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}-01`;
}

function formatMonth(date) {
    return new Intl.DateTimeFormat(
        "id-ID",
        {
            month: "long",
            year: "numeric"
        }
    ).format(date);
}

function formatMonthOnly(date) {
    return new Intl.DateTimeFormat(
        "id-ID",
        {
            month: "long"
        }
    ).format(date);
}

function formatDateID(value) {
    if (!value) {
        return "—";
    }

    const parts =
        String(value)
            .split("-")
            .map(Number);

    if (parts.length !== 3) {
        return "—";
    }

    const date =
        new Date(
            Date.UTC(
                parts[0],
                parts[1] - 1,
                parts[2]
            )
        );

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            timeZone: "UTC"
        }
    ).format(date);
}


// ----------------------------------------------------------
// MOOD
// ----------------------------------------------------------

function moodEmoji(mood) {
    const map = {
        "Bahagia": "😊",
        "Penuh Cinta": "❤️",
        "Tenang": "😌",
        "Bersyukur": "🌱",
        "Terharu": "🥺",
        "Sedih": "😔",
        "Lelah": "😮‍💨",
        "Cemas": "😰"
    };

    return map[mood] || "✨";
}


// ----------------------------------------------------------
// ACCESS
// ----------------------------------------------------------

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
        alert(
            "Kode akses salah"
        );

        return null;
    }

    localStorage.setItem(
        ACCESS_KEY_STORAGE,
        code
    );

    return code;
}


// ----------------------------------------------------------
// FETCH
// ----------------------------------------------------------

async function fetchPulse() {
    const { data, error } =
        await window.db.rpc(
            "ambil_couple_pulse",
            {
                kode: accessCode,
                month_input:
                    toSqlDate(
                        activeMonth
                    )
            }
        );

    if (error) {
        throw error;
    }

    return data;
}


// ----------------------------------------------------------
// DISPLAY
// ----------------------------------------------------------

function showLoading() {
    els.loadingState.hidden = false;
    els.emptyState.hidden = true;
    els.pulseContent.hidden = true;
}

function updateMonthHeader() {
    const monthText =
        formatMonth(activeMonth);

    const monthOnly =
        formatMonthOnly(activeMonth);

    els.monthLabel.textContent =
        monthText;

    els.monthHeroLabel.textContent =
        `${monthOnly} Kita`;

    const currentMonth =
        firstDayOfMonth(
            new Date()
        );

    els.nextMonthButton.disabled =
        activeMonth.getTime()
        >= currentMonth.getTime();
}

function safeNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function displayMetric(
    value,
    suffix = ""
) {
    if (
        value === null
        || value === undefined
        || value === ""
    ) {
        return "—";
    }

    return `${value}${suffix}`;
}

function renderProfile(
    profile,
    prefix
) {
    const mood =
        profile?.top_mood || "Belum ada";

    els[`${prefix}Mood`]
        .textContent =
            mood;

    els[`${prefix}MoodEmoji`]
        .textContent =
            moodEmoji(
                profile?.top_mood
            );

    els[`${prefix}Count`]
        .textContent =
            `${
                safeNumber(
                    profile?.checkin_count
                )
            } hari`;

    els[`${prefix}Energy`]
        .textContent =
            displayMetric(
                profile?.avg_energy,
                "/5"
            );

    els[`${prefix}Rating`]
        .textContent =
            displayMetric(
                profile?.avg_rating,
                "/10"
            );
}

function buildMonthStory(data) {
    const complete =
        safeNumber(
            data.complete_days
        );

    const active =
        safeNumber(
            data.active_days
        );

    const percent =
        safeNumber(
            data.completion_percent
        );

    const longest =
        safeNumber(
            data.longest_streak
        );

    const need =
        data.common_need;

    const galihMood =
        data.galih?.top_mood;

    const wisyeMood =
        data.wisye?.top_mood;

    const month =
        formatMonthOnly(
            activeMonth
        );

    let title =
        `${month} kalian`;

    let text = "";

    if (complete === 0) {
        text =
            "Bulan ini belum memiliki hari check-in yang lengkap. "
            + "Tidak apa-apa—Pulse akan mulai terbentuk begitu kalian berdua kembali mengisi.";
    } else if (percent >= 90) {
        text =
            `Kalian benar-benar hadir untuk satu sama lain bulan ini. `
            + `${complete} hari check-in bersama selesai, `
            + `dengan longest streak ${longest} hari.`;
    } else if (percent >= 70) {
        text =
            `${complete} hari berhasil kalian lengkapi bersama. `
            + `Ritmenya sudah terasa kuat, dan setiap check-in kecil ikut membentuk cerita bulan ini.`;
    } else {
        text =
            `${complete} hari check-in bersama tersimpan bulan ini. `
            + `Tidak harus sempurna—yang penting ruang untuk saling memahami tetap ada.`;
    }

    if (
        galihMood
        && wisyeMood
    ) {
        text +=
            ` Mood yang paling sering muncul: `
            + `${moodEmoji(galihMood)} ${galihMood} untuk Galih `
            + `dan ${moodEmoji(wisyeMood)} ${wisyeMood} untuk Wisye.`;
    }

    if (need) {
        text +=
            ` Hal yang paling sering kalian butuhkan adalah “${need}”.`;
    }

    return {
        title,
        text
    };
}

function renderPulse(data) {
    pulseData = data;

    const complete =
        safeNumber(
            data.complete_days
        );

    const active =
        safeNumber(
            data.active_days
        );

    const percent =
        Math.max(
            0,
            Math.min(
                100,
                safeNumber(
                    data.completion_percent
                )
            )
        );

    els.loadingState.hidden = true;

    if (
        active === 0
        && complete === 0
        && safeNumber(
            data.galih?.checkin_count
        ) === 0
        && safeNumber(
            data.wisye?.checkin_count
        ) === 0
    ) {
        els.emptyState.hidden = false;
        els.pulseContent.hidden = true;
        return;
    }

    els.emptyState.hidden = true;
    els.pulseContent.hidden = false;


    // Overview
    els.completeDays.textContent =
        String(complete);

    els.completionPercent.textContent =
        `${percent}%`;

    els.completionBar.style.width =
        `${percent}%`;

    els.currentStreak.textContent =
        String(
            safeNumber(
                data.current_streak
            )
        );

    els.longestStreak.textContent =
        String(
            safeNumber(
                data.longest_streak
            )
        );

    els.restoreUsed.textContent =
        String(
            safeNumber(
                data.restore_used
            )
        );

    els.activeDays.textContent =
        String(active);


    // Profiles
    renderProfile(
        data.galih,
        "galih"
    );

    renderProfile(
        data.wisye,
        "wisye"
    );


    // Together
    els.commonNeed.textContent =
        data.common_need
        || "Belum ada";

    const best =
        data.best_day || {};

    els.bestDay.textContent =
        formatDateID(
            best.date
        );

    els.bestDayScore.textContent =
        best.score !== null
        && best.score !== undefined
            ? `Rata-rata ${best.score}/10`
            : "Belum cukup data";

    const hardest =
        data.hardest_day || {};

    els.hardestDay.textContent =
        formatDateID(
            hardest.date
        );

    els.hardestDayScore.textContent =
        hardest.score !== null
        && hardest.score !== undefined
            ? `Rata-rata ${hardest.score}/10`
            : "Belum cukup data";


    // Story
    const story =
        buildMonthStory(data);

    els.monthStoryTitle.textContent =
        story.title;

    els.monthStoryText.textContent =
        story.text;
}


// ----------------------------------------------------------
// LOAD
// ----------------------------------------------------------

async function loadPulse() {
    showLoading();
    updateMonthHeader();

    try {
        const data =
            await fetchPulse();

        renderPulse(data);
    } catch (error) {
        console.error(
            "Gagal memuat Couple Pulse:",
            error
        );

        els.loadingState.hidden = true;
        els.pulseContent.hidden = true;
        els.emptyState.hidden = false;

        els.emptyState.querySelector("h2")
            .textContent =
                "Couple Pulse gagal dimuat";

        els.emptyState.querySelector("p")
            .textContent =
                error.message
                || "Periksa Supabase dan coba lagi.";
    }
}


// ----------------------------------------------------------
// EVENTS
// ----------------------------------------------------------

els.prevMonthButton
    .addEventListener(
        "click",
        async () => {
            activeMonth =
                addMonths(
                    activeMonth,
                    -1
                );

            await loadPulse();
        }
    );

els.nextMonthButton
    .addEventListener(
        "click",
        async () => {
            const next =
                addMonths(
                    activeMonth,
                    1
                );

            const current =
                firstDayOfMonth(
                    new Date()
                );

            if (
                next.getTime()
                <= current.getTime()
            ) {
                activeMonth = next;

                await loadPulse();
            }
        }
    );


// ----------------------------------------------------------
// START
// ----------------------------------------------------------

async function start() {
    if (!window.db) {
        alert(
            "Supabase belum siap. "
            + "Pastikan supabase-config.js tersedia."
        );

        return;
    }

    accessCode =
        await ensureAccess();

    if (!accessCode) {
        window.location.href =
            "index.html";

        return;
    }

    await loadPulse();
}

start();
