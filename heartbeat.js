// ==========================================================
// RUANG CERITA — RUANG DETAK / THE HEARTBEAT V1
// Generative visual experience from Daily Check-in data.
// ==========================================================

const ACCESS_KEY_STORAGE =
    "kodeRuangCerita";

const WIB_TIME_ZONE =
    "Asia/Jakarta";

const els = {
    app:
        document.getElementById(
            "heartbeatApp"
        ),

    introOverlay:
        document.getElementById(
            "introOverlay"
        ),

    introStatus:
        document.getElementById(
            "introStatus"
        ),

    ambientCanvas:
        document.getElementById(
            "ambientCanvas"
        ),

    heartbeatCanvas:
        document.getElementById(
            "heartbeatCanvas"
        ),

    rhythmCanvas:
        document.getElementById(
            "rhythmCanvas"
        ),

    focusCanvas:
        document.getElementById(
            "focusCanvas"
        ),

    heroDate:
        document.getElementById(
            "heroDate"
        ),

    heroStreak:
        document.getElementById(
            "heroStreak"
        ),

    heroState:
        document.getElementById(
            "heroState"
        ),

    selectedDateLabel:
        document.getElementById(
            "selectedDateLabel"
        ),

    heartbeatStatus:
        document.getElementById(
            "heartbeatStatus"
        ),

    previousDayButton:
        document.getElementById(
            "previousDayButton"
        ),

    nextDayButton:
        document.getElementById(
            "nextDayButton"
        ),

    randomDayButton:
        document.getElementById(
            "randomDayButton"
        ),

    dailyNarrative:
        document.getElementById(
            "dailyNarrative"
        ),

    galihData:
        document.getElementById(
            "galihData"
        ),

    wisyeData:
        document.getElementById(
            "wisyeData"
        ),

    archiveGrid:
        document.getElementById(
            "archiveGrid"
        ),

    selectedMonthLabel:
        document.getElementById(
            "selectedMonthLabel"
        ),

    rhythmCaptionMonth:
        document.getElementById(
            "rhythmCaptionMonth"
        ),

    previousMonthButton:
        document.getElementById(
            "previousMonthButton"
        ),

    nextMonthButton:
        document.getElementById(
            "nextMonthButton"
        ),

    rhythmNarrative:
        document.getElementById(
            "rhythmNarrative"
        ),

    monthComplete:
        document.getElementById(
            "monthComplete"
        ),

    monthRestored:
        document.getElementById(
            "monthRestored"
        ),

    monthNeed:
        document.getElementById(
            "monthNeed"
        ),

    monthRating:
        document.getElementById(
            "monthRating"
        ),

    focusModeButton:
        document.getElementById(
            "focusModeButton"
        ),

    focusOverlay:
        document.getElementById(
            "focusOverlay"
        ),

    closeFocusButton:
        document.getElementById(
            "closeFocusButton"
        ),

    focusState:
        document.getElementById(
            "focusState"
        ),

    focusDate:
        document.getElementById(
            "focusDate"
        )
};


const COLORS = {
    galih:
        [213, 122, 152],

    wisye:
        [159, 180, 167],

    ivory:
        [255, 248, 239],

    gold:
        [215, 173, 122],

    night:
        [16, 17, 25]
};


const MOOD_PROFILE = {
    "Bahagia": {
        lift: 0.90,
        wave: 1.08
    },

    "Penuh Cinta": {
        lift: 1.00,
        wave: 1.16
    },

    "Tenang": {
        lift: 0.72,
        wave: 0.78
    },

    "Bersyukur": {
        lift: 0.82,
        wave: 0.88
    },

    "Terharu": {
        lift: 0.68,
        wave: 0.94
    },

    "Sedih": {
        lift: 0.42,
        wave: 0.72
    },

    "Lelah": {
        lift: 0.36,
        wave: 0.62
    },

    "Cemas": {
        lift: 0.48,
        wave: 1.20
    }
};


const state = {
    accessCode:
        "",

    data:
        null,

    selectedDate:
        null,

    selectedMonth:
        null,

    dayModel:
        null,

    ambientStars:
        [],

    introHidden:
        false,

    loading:
        false,

    focusActive:
        false
};


// ==========================================================
// ACCESS
// ==========================================================

async function verifyAccessCode(
    code
) {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "cek_kode",
            {
                kode:
                    code
            }
        );


    if (error) {
        console.error(
            "Gagal memeriksa kode:",
            error
        );

        return false;
    }


    return Boolean(
        data
    );
}


async function ensureAccess() {
    let code =
        localStorage.getItem(
            ACCESS_KEY_STORAGE
        );


    if (
        code
        && await verifyAccessCode(
            code
        )
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
        !await verifyAccessCode(
            code
        )
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


// ==========================================================
// FETCH
// ==========================================================

async function fetchHeartbeat(
    date = null,
    month = null
) {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "ambil_heartbeat_data",
            {
                kode:
                    state.accessCode,

                tanggal_input:
                    date,

                month_input:
                    month
            }
        );


    if (error) {
        throw error;
    }


    return data;
}


async function loadData(
    date = null,
    month = null,
    options = {}
) {
    if (
        state.loading
    ) {
        return;
    }


    state.loading =
        true;


    try {
        const data =
            await fetchHeartbeat(
                date,
                month
            );


        state.data =
            data;

        state.selectedDate =
            normalizeDate(
                data.selected_date
            );

        state.selectedMonth =
            normalizeMonth(
                data.selected_month
            );


        state.dayModel =
            buildDayModel(
                data
            );


        renderAll();


        if (
            options.updateUrl
            !== false
        ) {
            updateUrl();
        }

    } catch (error) {
        console.error(
            "Ruang Detak gagal dimuat:",
            error
        );


        els.introStatus.textContent =
            error.message
            || "Ruang Detak belum dapat dimuat.";

        alert(
            "Ruang Detak belum dapat dimuat. Periksa Supabase lalu coba lagi."
        );

    } finally {
        state.loading =
            false;
    }
}


// ==========================================================
// DATE
// ==========================================================

function normalizeDate(
    value
) {
    if (!value) {
        return null;
    }


    const match =
        String(value)
            .match(
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


function normalizeMonth(
    value
) {
    const date =
        normalizeDate(
            value
        );


    return date
        ? `${date.slice(0, 7)}-01`
        : null;
}


function dateFromQuery() {
    const params =
        new URLSearchParams(
            window.location.search
        );


    const requested =
        params.get(
            "date"
        );


    return (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                requested
                || ""
            )
    )
        ? requested
        : null;
}


function monthFromQuery() {
    const params =
        new URLSearchParams(
            window.location.search
        );


    const requested =
        params.get(
            "month"
        );


    return (
        /^\d{4}-\d{2}-01$/
            .test(
                requested
                || ""
            )
    )
        ? requested
        : null;
}


function updateUrl() {
    if (
        !state.selectedDate
    ) {
        return;
    }


    const params =
        new URLSearchParams();


    params.set(
        "date",
        state.selectedDate
    );


    if (
        state.selectedMonth
    ) {
        params.set(
            "month",
            state.selectedMonth
        );
    }


    history.replaceState(
        {},
        "",
        `${
            window.location.pathname
        }?${params.toString()}`
    );
}


function parseUtcDate(
    value
) {
    const normalized =
        normalizeDate(
            value
        );


    if (!normalized) {
        return null;
    }


    const [
        year,
        month,
        day
    ] =
        normalized
            .split("-")
            .map(Number);


    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}


function formatDateID(
    value
) {
    const date =
        parseUtcDate(
            value
        );


    if (!date) {
        return "—";
    }


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
            .format(date)
    );
}


function formatShortDate(
    value
) {
    const date =
        parseUtcDate(
            value
        );


    if (!date) {
        return "—";
    }


    return (
        new Intl.DateTimeFormat(
            "id-ID",
            {
                day:
                    "numeric",

                month:
                    "short",

                timeZone:
                    "UTC"
            }
        )
            .format(date)
    );
}


function formatMonthID(
    value
) {
    const date =
        parseUtcDate(
            value
        );


    if (!date) {
        return "—";
    }


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
            .format(date)
    );
}


// ==========================================================
// MODEL
// ==========================================================

function clamp(
    value,
    min,
    max
) {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function numeric(
    value,
    fallback = 0
) {
    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


function personVisualModel(
    person,
    identity
) {
    if (!person) {
        return {
            present:
                false,

            identity,

            color:
                COLORS[
                    identity
                ],

            energy:
                0.38,

            rating:
                0.50,

            moodLift:
                0.55,

            moodWave:
                0.70,

            mood:
                null,

            need:
                null
        };
    }


    const mood =
        MOOD_PROFILE[
            person.mood
        ]
        || {
            lift: 0.58,
            wave: 0.82
        };


    return {
        present:
            true,

        identity,

        color:
            COLORS[
                identity
            ],

        energy:
            clamp(
                (
                    numeric(
                        person.energy,
                        3
                    )
                    - 1
                )
                / 4,
                0,
                1
            ),

        rating:
            clamp(
                numeric(
                    person.day_rating,
                    5
                )
                / 10,
                0,
                1
            ),

        moodLift:
            mood.lift,

        moodWave:
            mood.wave,

        mood:
            person.mood
            || null,

        need:
            person.need_today
            || null
    };
}


function moodDistance(
    moodA,
    moodB
) {
    if (
        !moodA
        || !moodB
    ) {
        return 0.55;
    }


    if (
        moodA === moodB
    ) {
        return 0;
    }


    const a =
        MOOD_PROFILE[
            moodA
        ]?.lift
        ?? 0.55;

    const b =
        MOOD_PROFILE[
            moodB
        ]?.lift
        ?? 0.55;


    return clamp(
        Math.abs(
            a - b
        )
        + 0.20,
        0,
        1
    );
}


function buildDayModel(
    data
) {
    const galih =
        personVisualModel(
            data.galih,
            "galih"
        );

    const wisye =
        personVisualModel(
            data.wisye,
            "wisye"
        );


    const count =
        (
            galih.present
                ? 1
                : 0
        )
        + (
            wisye.present
                ? 1
                : 0
        );


    const present =
        [
            galih,
            wisye
        ]
            .filter(
                (person) =>
                    person.present
            );


    const avgEnergy =
        present.length
            ? present.reduce(
                (
                    sum,
                    person
                ) =>
                    sum
                    + person.energy,
                0
            )
            / present.length
            : 0.35;


    const avgRating =
        present.length
            ? present.reduce(
                (
                    sum,
                    person
                ) =>
                    sum
                    + person.rating,
                0
            )
            / present.length
            : 0.50;


    const sync =
        count === 2
            ? clamp(
                1
                - (
                    Math.abs(
                        galih.energy
                        - wisye.energy
                    )
                    * 0.32
                    + Math.abs(
                        galih.rating
                        - wisye.rating
                    )
                    * 0.42
                    + moodDistance(
                        galih.mood,
                        wisye.mood
                    )
                    * 0.26
                ),
                0,
                1
            )
            : 0.42;


    let label =
        "WAITING FOR A PULSE";

    let description =
        "Hari ini belum memiliki jejak Daily Check-in.";


    if (
        count === 1
    ) {
        label =
            "ONE RHYTHM PRESENT";

        description =
            "Satu ritme sudah hadir. Ruang ini masih menunggu ritme kedua.";
    }


    if (
        count === 2
    ) {
        label =
            sync >= 0.78
                ? "IN SYNC"
                : "TWO RHYTHMS · ONE SPACE";

        description =
            sync >= 0.78
                ? "Dua ritme hari ini bergerak cukup dekat, lalu bertemu di satu ruang."
                : "Dua ritme membawa warna yang berbeda, tetapi tetap hadir di hari yang sama.";
    }


    if (
        data.is_restored
        && count === 2
    ) {
        label =
            "FOUND OUR WAY BACK";

        description =
            "Hari ini sempat terlewat, lalu kita kembali dan membentuk ritmenya bersama.";
    }


    return {
        date:
            normalizeDate(
                data.selected_date
            ),

        galih,
        wisye,

        count,
        avgEnergy,
        avgRating,
        sync,

        complete:
            Boolean(
                data.day_complete
            ),

        restored:
            Boolean(
                data.is_restored
            ),

        label,
        description,

        seed:
            hashString(
                [
                    data.selected_date,
                    data.galih?.mood,
                    data.galih?.energy,
                    data.galih?.day_rating,
                    data.galih?.need_today,
                    data.wisye?.mood,
                    data.wisye?.energy,
                    data.wisye?.day_rating,
                    data.wisye?.need_today,
                    data.is_restored
                ]
                    .join("|")
            )
    };
}


// ==========================================================
// COPY
// ==========================================================

function moodEmoji(
    mood
) {
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
        || "✦"
    );
}


function dailyNarrative(
    data
) {
    const model =
        state.dayModel;


    if (
        model.count === 0
    ) {
        return (
            "Belum ada warna yang direkam untuk hari ini. "
            + "Artwork tetap bernapas pelan sambil menunggu Daily Check-in."
        );
    }


    if (
        model.count === 1
    ) {
        return (
            "Satu Daily Check-in sudah hadir. "
            + "Detail pribadi tetap tidak dipakai untuk menilai hubungan; "
            + "Ruang Detak hanya mengubah data menjadi bentuk, gerak, dan cahaya."
        );
    }


    const gMood =
        data.galih?.mood
        || "warna sendiri";

    const wMood =
        data.wisye?.mood
        || "warna sendiri";


    let text = "";


    if (
        gMood === wMood
    ) {
        text =
            `Hari ini Galih dan Wisye sama-sama membawa ${gMood}. `;
    } else {
        text =
            `Hari ini Galih membawa ${gMood}, sementara Wisye membawa ${wMood}. `;
    }


    if (
        data.galih?.need_today
        && data.wisye?.need_today
        && data.galih.need_today
            === data.wisye.need_today
    ) {
        text +=
            `kita juga sama-sama memilih “${data.galih.need_today}” sebagai hal yang dibutuhkan. `;
    }


    if (
        data.is_restored
    ) {
        text +=
            "Jejak ini datang dari hari yang sempat terlewat lalu dipulihkan.";
    } else {
        text +=
            "Dua warna itu menjadi sidik visual unik untuk tanggal ini.";
    }


    return text;
}


function monthlyNarrative(
    data
) {
    const summary =
        data.month_summary
        || {};


    const complete =
        numeric(
            summary.complete_days
        );


    if (
        complete === 0
    ) {
        return (
            "Bulan ini masih memiliki ruang kosong. "
            + "Setiap Daily Check-in baru akan menambah satu garis pada artwork."
        );
    }


    const moodG =
        summary.top_mood_galih
        || "—";

    const moodW =
        summary.top_mood_wisye
        || "—";


    let text =
        `${complete} hari complete membentuk karya bulan ini. `;


    if (
        moodG !== "—"
        && moodW !== "—"
    ) {
        text +=
            `Warna yang paling sering muncul: ${moodG} untuk Galih dan ${moodW} untuk Wisye. `;
    }


    if (
        summary.common_need
    ) {
        text +=
            `Hal yang paling sering dipilih sebagai kebutuhan adalah “${summary.common_need}”.`;
    } else {
        text +=
            "Karya akan terus berubah seiring bertambahnya hari.";
    }


    return text;
}


// ==========================================================
// HTML RENDER
// ==========================================================

function escapeHTML(
    value
) {
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


function renderPersonData(
    target,
    person,
    canReveal
) {
    if (
        !canReveal
    ) {
        target.innerHTML =
            `
                <div class="person-empty">
                    ${
                        state.dayModel.count === 0
                            ? "Belum ada Daily Check-in pada tanggal ini."
                            : "Ritme hari ini belum lengkap. Detail akan tampil setelah keduanya hadir."
                    }
                </div>
            `;

        return;
    }


    if (!person) {
        target.innerHTML =
            `
                <div class="person-empty">
                    Tidak ada data untuk ritme ini.
                </div>
            `;

        return;
    }


    target.innerHTML =
        `
            <div class="person-data-item">
                <span>MOOD</span>

                <strong>
                    ${
                        moodEmoji(
                            person.mood
                        )
                    }
                    ${
                        escapeHTML(
                            person.mood
                            || "—"
                        )
                    }
                </strong>
            </div>


            <div class="person-data-item">
                <span>ENERGY</span>

                <strong>
                    ${
                        escapeHTML(
                            person.energy
                            ?? "—"
                        )
                    } / 5
                </strong>
            </div>


            <div class="person-data-item">
                <span>DAY RATING</span>

                <strong>
                    ${
                        escapeHTML(
                            person.day_rating
                            ?? "—"
                        )
                    } / 10
                </strong>
            </div>


            <div class="person-data-item">
                <span>NEED TODAY</span>

                <strong>
                    ${
                        escapeHTML(
                            person.need_today
                            || "—"
                        )
                    }
                </strong>
            </div>
        `;
}


function renderSelectedDay() {
    const data =
        state.data;

    const model =
        state.dayModel;


    const dateText =
        formatDateID(
            state.selectedDate
        );


    els.heroDate.textContent =
        formatShortDate(
            state.selectedDate
        );


    els.heroStreak.textContent =
        `${
            numeric(
                data.streak_at_date
            )
        } ❤️`;


    els.heroState.textContent =
        model.complete
            ? model.restored
                ? "Restored"
                : "Complete"
            : model.count > 0
                ? "Forming"
                : "Waiting";


    els.selectedDateLabel.textContent =
        dateText;


    els.heartbeatStatus.innerHTML =
        `
            <small>
                CURRENT STATE
            </small>

            <strong>
                ${
                    escapeHTML(
                        model.label
                    )
                }
            </strong>

            <span>
                ${
                    escapeHTML(
                        model.description
                    )
                }
            </span>
        `;


    els.dailyNarrative.textContent =
        dailyNarrative(
            data
        );


    // For today's incomplete day, do not reveal which partner has
    // submitted. Past dates already behave like the existing history.
    const isToday =
        state.selectedDate
        === normalizeDate(
            data.today
        );


    const canReveal =
        !isToday
        || model.complete;


    renderPersonData(
        els.galihData,
        data.galih,
        canReveal
    );


    renderPersonData(
        els.wisyeData,
        data.wisye,
        canReveal
    );


    els.previousDayButton.disabled =
        !data.previous_date;


    els.nextDayButton.disabled =
        !data.next_date;


    els.focusState.textContent =
        model.label;


    els.focusDate.textContent =
        dateText;
}


function renderArchive() {
    const days =
        Array.isArray(
            state.data.recent_days
        )
            ? state.data.recent_days
            : [];


    els.archiveGrid.innerHTML =
        "";


    if (!days.length) {
        els.archiveGrid.innerHTML =
            `
                <div class="person-empty">
                    Arsip akan muncul setelah Daily Check-in mulai terisi.
                </div>
            `;

        return;
    }


    days.forEach(
        (day) => {
            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "archive-card";


            if (
                normalizeDate(
                    day.date
                )
                === state.selectedDate
            ) {
                button.classList.add(
                    "active"
                );
            }


            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                180;

            canvas.height =
                180;


            const date =
                normalizeDate(
                    day.date
                );


            const label =
                day.day_complete
                    ? day.is_restored
                        ? "Restored"
                        : "Complete"
                    : "Partial";


            const dateSpan =
                document.createElement(
                    "span"
                );

            dateSpan.className =
                "archive-card-date";

            dateSpan.textContent =
                formatShortDate(
                    date
                );


            const stateSpan =
                document.createElement(
                    "span"
                );

            stateSpan.className =
                "archive-card-state";

            stateSpan.textContent =
                label;


            button.append(
                canvas,
                dateSpan,
                stateSpan
            );


            button.addEventListener(
                "click",
                () => {
                    loadData(
                        date,
                        `${date.slice(0, 7)}-01`
                    );
                }
            );


            els.archiveGrid
                .appendChild(
                    button
                );


            requestAnimationFrame(
                () => {
                    drawMiniFingerprint(
                        canvas,
                        day
                    );
                }
            );
        }
    );
}


function sortedMonths() {
    const months =
        Array.isArray(
            state.data.available_months
        )
            ? state.data.available_months
                .map(
                    normalizeMonth
                )
                .filter(Boolean)
            : [];


    if (
        state.selectedMonth
        && !months.includes(
            state.selectedMonth
        )
    ) {
        months.push(
            state.selectedMonth
        );
    }


    return [
        ...new Set(
            months
        )
    ]
        .sort();
}


function renderMonth() {
    const summary =
        state.data.month_summary
        || {};


    const monthLabel =
        formatMonthID(
            state.selectedMonth
        );


    els.selectedMonthLabel.textContent =
        monthLabel;


    els.rhythmCaptionMonth.textContent =
        monthLabel;


    els.monthComplete.textContent =
        `${
            numeric(
                summary.complete_days
            )
        } days`;


    els.monthRestored.textContent =
        String(
            numeric(
                summary.restored_days
            )
        );


    els.monthNeed.textContent =
        summary.common_need
        || "—";


    const rating =
        numeric(
            summary.avg_rating
        );


    els.monthRating.textContent =
        rating > 0
            ? `${rating.toFixed(1)} / 10`
            : "—";


    els.rhythmNarrative.textContent =
        monthlyNarrative(
            state.data
        );


    const months =
        sortedMonths();


    const index =
        months.indexOf(
            state.selectedMonth
        );


    els.previousMonthButton.disabled =
        index <= 0;


    els.nextMonthButton.disabled =
        index < 0
        || index >= months.length - 1;
}


function renderAll() {
    renderSelectedDay();
    renderArchive();
    renderMonth();
}


// ==========================================================
// HASH / RANDOM
// ==========================================================

function hashString(
    value
) {
    let hash =
        2166136261;


    const text =
        String(
            value
        );


    for (
        let index = 0;
        index < text.length;
        index++
    ) {
        hash ^=
            text.charCodeAt(
                index
            );


        hash =
            Math.imul(
                hash,
                16777619
            );
    }


    return hash >>> 0;
}


function seededRandom(
    seed
) {
    let value =
        (
            Number(seed)
            >>> 0
        )
        || 1;


    return function random() {
        value +=
            0x6D2B79F5;


        let t =
            value;


        t =
            Math.imul(
                t ^ (
                    t >>> 15
                ),
                t | 1
            );


        t ^=
            t
            + Math.imul(
                t ^ (
                    t >>> 7
                ),
                t | 61
            );


        return (
            (
                t ^ (
                    t >>> 14
                )
            )
            >>> 0
        )
        / 4294967296;
    };
}


// ==========================================================
// CANVAS HELPERS
// ==========================================================

function resizeCanvas(
    canvas
) {
    if (!canvas) {
        return null;
    }


    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        Math.min(
            window.devicePixelRatio
            || 1,
            2
        );


    const width =
        Math.max(
            1,
            rect.width
        );


    const height =
        Math.max(
            1,
            rect.height
        );


    const realWidth =
        Math.floor(
            width
            * dpr
        );


    const realHeight =
        Math.floor(
            height
            * dpr
        );


    if (
        canvas.width
        !== realWidth
        || canvas.height
        !== realHeight
    ) {
        canvas.width =
            realWidth;

        canvas.height =
            realHeight;
    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    return {
        ctx,
        width,
        height
    };
}


function rgba(
    rgb,
    alpha
) {
    return (
        `rgba(`
        + `${rgb[0]},`
        + `${rgb[1]},`
        + `${rgb[2]},`
        + `${alpha})`
    );
}


// ==========================================================
// AMBIENT BACKGROUND
// ==========================================================

function buildAmbientStars() {
    const random =
        seededRandom(
            882731
        );


    state.ambientStars =
        Array.from(
            {
                length:
                    window.innerWidth
                    < 700
                        ? 90
                        : 160
            },
            (
                _,
                index
            ) => ({
                x:
                    random(),

                y:
                    random(),

                size:
                    0.35
                    + random()
                    * 1.25,

                alpha:
                    0.10
                    + random()
                    * 0.44,

                phase:
                    random()
                    * Math.PI
                    * 2,

                speed:
                    0.00035
                    + random()
                    * 0.00085,

                rose:
                    random()
                    > 0.83,

                index
            })
        );
}


function drawAmbient(
    time
) {
    const sized =
        resizeCanvas(
            els.ambientCanvas
        );


    if (!sized) {
        return;
    }


    const {
        ctx,
        width,
        height
    } =
        sized;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    state.ambientStars.forEach(
        (star) => {
            const twinkle =
                0.68
                + Math.sin(
                    time
                    * star.speed
                    + star.phase
                )
                * 0.32;


            ctx.fillStyle =
                star.rose
                    ? rgba(
                        COLORS.rose
                        || COLORS.galih,
                        star.alpha
                        * twinkle
                    )
                    : rgba(
                        COLORS.ivory,
                        star.alpha
                        * twinkle
                    );


            ctx.beginPath();

            ctx.arc(
                star.x
                * width,

                star.y
                * height,

                star.size,

                0,

                Math.PI
                * 2
            );

            ctx.fill();
        }
    );
}


// ==========================================================
// HEARTBEAT ART
// ==========================================================

function drawRibbon(
    ctx,
    cx,
    cy,
    radius,
    rotation,
    person,
    time,
    alpha = 0.70
) {
    const points =
        180;


    const color =
        person.color;


    const speed =
        0.00030
        + person.energy
        * 0.00025;


    const amplitude =
        radius
        * (
            0.025
            + person.moodWave
            * 0.035
        );


    ctx.save();

    ctx.translate(
        cx,
        cy
    );

    ctx.rotate(
        rotation
    );


    ctx.strokeStyle =
        rgba(
            color,
            person.present
                ? alpha
                : 0.11
        );


    ctx.lineWidth =
        person.present
            ? 1.15
            + person.energy
            * 1.05
            : 0.75;


    ctx.shadowColor =
        rgba(
            color,
            person.present
                ? 0.52
                : 0.08
        );


    ctx.shadowBlur =
        person.present
            ? 13
            : 5;


    if (
        !person.present
    ) {
        ctx.setLineDash(
            [5, 8]
        );
    }


    ctx.beginPath();


    for (
        let index = 0;
        index <= points;
        index++
    ) {
        const angle =
            (
                index
                / points
            )
            * Math.PI
            * 2;


        const wave =
            Math.sin(
                angle
                * (
                    3
                    + person.moodWave
                )
                + time
                * speed
                * Math.PI
                * 2
                + person.rating
                * 2.2
            )
            * amplitude;


        const breathe =
            Math.cos(
                angle
                * 2
                - time
                * speed
                * Math.PI
            )
            * amplitude
            * 0.38;


        const r =
            radius
            + wave
            + breathe;


        const x =
            Math.cos(
                angle
            )
            * r;


        const y =
            Math.sin(
                angle
            )
            * r
            * (
                0.70
                + person.rating
                * 0.07
            );


        if (
            index === 0
        ) {
            ctx.moveTo(
                x,
                y
            );
        } else {
            ctx.lineTo(
                x,
                y
            );
        }
    }


    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}


function drawHeartShape(
    ctx,
    cx,
    cy,
    size,
    alpha
) {
    ctx.save();

    ctx.translate(
        cx,
        cy
    );


    const gradient =
        ctx.createRadialGradient(
            -size * 0.12,
            -size * 0.15,
            1,
            0,
            0,
            size
        );


    gradient.addColorStop(
        0,
        rgba(
            COLORS.ivory,
            alpha
        )
    );


    gradient.addColorStop(
        0.35,
        rgba(
            COLORS.galih,
            alpha
            * 0.82
        )
    );


    gradient.addColorStop(
        1,
        rgba(
            COLORS.galih,
            0
        )
    );


    ctx.fillStyle =
        gradient;


    ctx.shadowColor =
        rgba(
            COLORS.galih,
            alpha
            * 0.65
        );


    ctx.shadowBlur =
        size
        * 0.65;


    ctx.beginPath();


    const samples =
        100;


    for (
        let index = 0;
        index <= samples;
        index++
    ) {
        const t =
            (
                index
                / samples
            )
            * Math.PI
            * 2;


        const x =
            16
            * Math.pow(
                Math.sin(t),
                3
            );


        const y =
            (
                13
                * Math.cos(t)
                - 5
                * Math.cos(
                    2 * t
                )
                - 2
                * Math.cos(
                    3 * t
                )
                - Math.cos(
                    4 * t
                )
            );


        const px =
            x
            * size
            / 35;


        const py =
            -y
            * size
            / 35;


        if (
            index === 0
        ) {
            ctx.moveTo(
                px,
                py
            );
        } else {
            ctx.lineTo(
                px,
                py
            );
        }
    }


    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


function drawParticles(
    ctx,
    cx,
    cy,
    radius,
    model,
    time
) {
    const random =
        seededRandom(
            model.seed
        );


    const count =
        34;


    for (
        let index = 0;
        index < count;
        index++
    ) {
        const baseAngle =
            random()
            * Math.PI
            * 2;


        const baseRadius =
            radius
            * (
                0.40
                + random()
                * 0.70
            );


        const speed =
            (
                0.00004
                + random()
                * 0.00008
            )
            * (
                0.7
                + model.avgEnergy
                * 0.8
            );


        const angle =
            baseAngle
            + time
            * speed;


        const drift =
            Math.sin(
                time
                * 0.0006
                + index
            )
            * radius
            * 0.012;


        const x =
            cx
            + Math.cos(
                angle
            )
            * (
                baseRadius
                + drift
            );


        const y =
            cy
            + Math.sin(
                angle
            )
            * (
                baseRadius
                * 0.72
                + drift
            );


        const personColor =
            index % 2 === 0
                ? COLORS.galih
                : COLORS.wisye;


        ctx.fillStyle =
            rgba(
                personColor,
                0.10
                + random()
                * 0.42
            );


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            0.8
            + random()
            * 1.7,
            0,
            Math.PI
            * 2
        );

        ctx.fill();
    }
}


function drawFingerprint(
    canvas,
    model,
    time,
    options = {}
) {
    const sized =
        resizeCanvas(
            canvas
        );


    if (
        !sized
        || !model
    ) {
        return;
    }


    const {
        ctx,
        width,
        height
    } =
        sized;


    const cx =
        width / 2;

    const cy =
        height / 2;


    const base =
        Math.min(
            width,
            height
        );


    const radius =
        base
        * (
            options.focus
                ? 0.27
                : 0.285
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // Soft center field.
    const field =
        ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            base * 0.44
        );


    field.addColorStop(
        0,
        rgba(
            COLORS.galih,
            0.08
            + model.avgRating
            * 0.08
        )
    );


    field.addColorStop(
        0.38,
        rgba(
            COLORS.wisye,
            0.025
        )
    );


    field.addColorStop(
        1,
        rgba(
            COLORS.night,
            0
        )
    );


    ctx.fillStyle =
        field;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Guide rings.
    for (
        let ring = 1;
        ring <= 4;
        ring++
    ) {
        ctx.strokeStyle =
            rgba(
                COLORS.ivory,
                0.025
            );


        ctx.lineWidth =
            0.7;


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            radius
            * (
                0.62
                + ring
                * 0.22
            ),
            0,
            Math.PI
            * 2
        );

        ctx.stroke();
    }


    drawParticles(
        ctx,
        cx,
        cy,
        radius,
        model,
        time
    );


    const beatPhase =
        (
            time
            * (
                0.00042
                + model.avgEnergy
                * 0.00018
            )
        )
        % 1;


    const pulse =
        Math.pow(
            Math.max(
                0,
                Math.sin(
                    beatPhase
                    * Math.PI
                    * 2
                )
            ),
            8
        );


    const pulseScale =
        1
        + pulse
        * (
            0.045
            + model.avgRating
            * 0.035
        );


    ctx.save();

    ctx.translate(
        cx,
        cy
    );

    ctx.scale(
        pulseScale,
        pulseScale
    );

    ctx.translate(
        -cx,
        -cy
    );


    drawRibbon(
        ctx,
        cx,
        cy,
        radius
        * (
            0.94
            + model.galih.energy
            * 0.08
        ),
        -0.32,
        model.galih,
        time,
        0.72
    );


    drawRibbon(
        ctx,
        cx,
        cy,
        radius
        * (
            0.94
            + model.wisye.energy
            * 0.08
        ),
        0.34,
        model.wisye,
        time,
        0.70
    );


    const coreAlpha =
        model.count === 0
            ? 0.18
            : model.count === 1
                ? 0.42
                : 0.62
                + model.sync
                * 0.24;


    drawHeartShape(
        ctx,
        cx,
        cy,
        base
        * 0.075,
        coreAlpha
    );


    ctx.restore();


    // Small identity points.
    const identityRadius =
        radius
        * 1.24;


    [
        {
            angle:
                -2.4,

            person:
                model.galih,

            label:
                "G"
        },

        {
            angle:
                0.74,

            person:
                model.wisye,

            label:
                "W"
        }
    ]
        .forEach(
            (
                item
            ) => {
                const x =
                    cx
                    + Math.cos(
                        item.angle
                    )
                    * identityRadius;


                const y =
                    cy
                    + Math.sin(
                        item.angle
                    )
                    * identityRadius
                    * 0.73;


                ctx.fillStyle =
                    rgba(
                        item.person.color,
                        item.person.present
                            ? 0.82
                            : 0.20
                    );


                ctx.shadowColor =
                    rgba(
                        item.person.color,
                        0.55
                    );


                ctx.shadowBlur =
                    12;


                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    3.2,
                    0,
                    Math.PI
                    * 2
                );

                ctx.fill();


                ctx.shadowBlur =
                    0;


                ctx.fillStyle =
                    rgba(
                        COLORS.ivory,
                        item.person.present
                            ? 0.62
                            : 0.22
                    );


                ctx.font =
                    '600 8px "DM Sans", sans-serif';

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    item.label,
                    x,
                    y - 10
                );
            }
        );
}


// ==========================================================
// MINI ARCHIVE ART
// ==========================================================

function miniModel(
    day
) {
    return buildDayModel({
        selected_date:
            normalizeDate(
                day.date
            ),

        galih:
            day.galih,

        wisye:
            day.wisye,

        day_complete:
            day.day_complete,

        is_restored:
            day.is_restored
    });
}


function drawMiniFingerprint(
    canvas,
    day
) {
    const model =
        miniModel(
            day
        );


    drawFingerprint(
        canvas,
        model,
        model.seed
        * 0.01
        + 1200
    );
}


// ==========================================================
// MONTHLY RHYTHM ART
// ==========================================================

function dayAverage(
    day,
    field,
    divisor = 1
) {
    const values =
        [
            day.galih?.[
                field
            ],

            day.wisye?.[
                field
            ]
        ]
            .map(Number)
            .filter(
                Number.isFinite
            );


    if (!values.length) {
        return 0;
    }


    return (
        values.reduce(
            (
                sum,
                value
            ) =>
                sum
                + value,
            0
        )
        / values.length
        / divisor
    );
}


function drawRhythm(
    time
) {
    const sized =
        resizeCanvas(
            els.rhythmCanvas
        );


    if (
        !sized
        || !state.data
    ) {
        return;
    }


    const days =
        Array.isArray(
            state.data.month_days
        )
            ? state.data.month_days
            : [];


    const {
        ctx,
        width,
        height
    } =
        sized;


    const cx =
        width / 2;

    const cy =
        height / 2;


    const base =
        Math.min(
            width,
            height
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const field =
        ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            base * 0.48
        );


    field.addColorStop(
        0,
        rgba(
            COLORS.wisye,
            0.065
        )
    );


    field.addColorStop(
        0.45,
        rgba(
            COLORS.galih,
            0.035
        )
    );


    field.addColorStop(
        1,
        rgba(
            COLORS.night,
            0
        )
    );


    ctx.fillStyle =
        field;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    if (!days.length) {
        return;
    }


    const outer =
        base
        * 0.36;


    const inner =
        base
        * 0.17;


    const rotation =
        time
        * 0.000015;


    // Constellation spokes.
    days.forEach(
        (
            day,
            index
        ) => {
            const angle =
                -Math.PI / 2
                + (
                    index
                    / days.length
                )
                * Math.PI
                * 2
                + rotation;


            const energy =
                clamp(
                    dayAverage(
                        day,
                        "energy",
                        5
                    ),
                    0,
                    1
                );


            const rating =
                clamp(
                    dayAverage(
                        day,
                        "day_rating",
                        10
                    ),
                    0,
                    1
                );


            const complete =
                Boolean(
                    day.day_complete
                );


            const hasAny =
                Boolean(
                    day.galih
                    || day.wisye
                );


            const alpha =
                complete
                    ? 0.28
                    + rating
                    * 0.34
                    : hasAny
                        ? 0.13
                        : 0.035;


            const length =
                inner
                + (
                    outer
                    - inner
                )
                * (
                    0.45
                    + energy
                    * 0.55
                );


            const x1 =
                cx
                + Math.cos(
                    angle
                )
                * inner;


            const y1 =
                cy
                + Math.sin(
                    angle
                )
                * inner;


            const x2 =
                cx
                + Math.cos(
                    angle
                )
                * length;


            const y2 =
                cy
                + Math.sin(
                    angle
                )
                * length;


            const color =
                index % 2 === 0
                    ? COLORS.galih
                    : COLORS.wisye;


            ctx.strokeStyle =
                rgba(
                    color,
                    alpha
                );


            ctx.lineWidth =
                complete
                    ? 1.25
                    : 0.65;


            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );

            ctx.stroke();


            if (
                hasAny
            ) {
                ctx.fillStyle =
                    rgba(
                        day.is_restored
                            ? COLORS.rose
                                || COLORS.galih
                            : color,
                        complete
                            ? 0.78
                            : 0.27
                    );


                ctx.shadowColor =
                    rgba(
                        color,
                        complete
                            ? 0.38
                            : 0.08
                    );


                ctx.shadowBlur =
                    complete
                        ? 9
                        : 3;


                ctx.beginPath();

                ctx.arc(
                    x2,
                    y2,
                    day.is_restored
                        ? 3.1
                        : 2.1,
                    0,
                    Math.PI
                    * 2
                );

                ctx.fill();


                ctx.shadowBlur =
                    0;
            }
        }
    );


    // Inner woven rings.
    const summary =
        state.data.month_summary
        || {};


    const eG =
        clamp(
            numeric(
                summary.avg_energy_galih
            )
            / 5,
            0,
            1
        );


    const eW =
        clamp(
            numeric(
                summary.avg_energy_wisye
            )
            / 5,
            0,
            1
        );


    const pseudoG = {
        present:
            eG > 0,

        color:
            COLORS.galih,

        energy:
            eG,

        rating:
            clamp(
                numeric(
                    summary.avg_rating
                )
                / 10,
                0,
                1
            ),

        moodWave:
            0.88
    };


    const pseudoW = {
        present:
            eW > 0,

        color:
            COLORS.wisye,

        energy:
            eW,

        rating:
            clamp(
                numeric(
                    summary.avg_rating
                )
                / 10,
                0,
                1
            ),

        moodWave:
            0.82
    };


    drawRibbon(
        ctx,
        cx,
        cy,
        base * 0.145,
        -0.30,
        pseudoG,
        time,
        0.44
    );


    drawRibbon(
        ctx,
        cx,
        cy,
        base * 0.155,
        0.33,
        pseudoW,
        time,
        0.42
    );


    const completeDays =
        numeric(
            summary.complete_days
        );


    const heartAlpha =
        clamp(
            0.22
            + completeDays
            / 31
            * 0.60,
            0.22,
            0.82
        );


    drawHeartShape(
        ctx,
        cx,
        cy,
        base * 0.052,
        heartAlpha
    );
}


// ==========================================================
// ANIMATION
// ==========================================================

function animationLoop(
    time
) {
    drawAmbient(
        time
    );


    if (
        state.dayModel
    ) {
        drawFingerprint(
            els.heartbeatCanvas,
            state.dayModel,
            time
        );


        if (
            state.focusActive
        ) {
            drawFingerprint(
                els.focusCanvas,
                state.dayModel,
                time,
                {
                    focus:
                        true
                }
            );
        }
    }


    drawRhythm(
        time
    );


    requestAnimationFrame(
        animationLoop
    );
}


// ==========================================================
// DATE / MONTH NAV
// ==========================================================

els.previousDayButton
    .addEventListener(
        "click",
        () => {
            const date =
                normalizeDate(
                    state.data
                        ?.previous_date
                );


            if (date) {
                loadData(
                    date,
                    `${date.slice(0, 7)}-01`
                );
            }
        }
    );


els.nextDayButton
    .addEventListener(
        "click",
        () => {
            const date =
                normalizeDate(
                    state.data
                        ?.next_date
                );


            if (date) {
                loadData(
                    date,
                    `${date.slice(0, 7)}-01`
                );
            }
        }
    );


els.randomDayButton
    .addEventListener(
        "click",
        () => {
            const dates =
                Array.isArray(
                    state.data
                        ?.available_dates
                )
                    ? state.data
                        .available_dates
                        .map(
                            normalizeDate
                        )
                        .filter(Boolean)
                    : [];


            if (!dates.length) {
                return;
            }


            const alternatives =
                dates.filter(
                    (date) =>
                        date
                        !== state.selectedDate
                );


            const pool =
                alternatives.length
                    ? alternatives
                    : dates;


            const date =
                pool[
                    Math.floor(
                        Math.random()
                        * pool.length
                    )
                ];


            loadData(
                date,
                `${date.slice(0, 7)}-01`
            );
        }
    );


function moveMonth(
    direction
) {
    const months =
        sortedMonths();


    const index =
        months.indexOf(
            state.selectedMonth
        );


    const nextIndex =
        index
        + direction;


    const month =
        months[
            nextIndex
        ];


    if (!month) {
        return;
    }


    loadData(
        state.selectedDate,
        month
    );
}


els.previousMonthButton
    .addEventListener(
        "click",
        () => {
            moveMonth(
                -1
            );
        }
    );


els.nextMonthButton
    .addEventListener(
        "click",
        () => {
            moveMonth(
                1
            );
        }
    );


// ==========================================================
// FOCUS MODE
// ==========================================================

function openFocus() {
    state.focusActive =
        true;


    document.body
        .classList.add(
            "focus-active"
        );


    els.focusOverlay.hidden =
        false;


    els.focusState.textContent =
        state.dayModel?.label
        || "—";


    els.focusDate.textContent =
        formatDateID(
            state.selectedDate
        );
}


function closeFocus() {
    state.focusActive =
        false;


    document.body
        .classList.remove(
            "focus-active"
        );


    els.focusOverlay.hidden =
        true;
}


els.focusModeButton
    .addEventListener(
        "click",
        openFocus
    );


els.closeFocusButton
    .addEventListener(
        "click",
        closeFocus
    );


document.addEventListener(
    "keydown",
    (
        event
    ) => {
        if (
            event.key
                .toLowerCase()
            === "f"
            && !event.ctrlKey
            && !event.metaKey
            && !event.altKey
        ) {
            if (
                state.focusActive
            ) {
                closeFocus();
            } else {
                openFocus();
            }
        }


        if (
            event.key
            === "Escape"
            && state.focusActive
        ) {
            closeFocus();
        }
    }
);


// ==========================================================
// MUSIC OPTIONS
// ==========================================================

document.addEventListener(
    "click",
    (
        event
    ) => {
        const musicMore =
            document.querySelector(
                ".music-more"
            );


        if (
            musicMore?.open
            && !musicMore.contains(
                event.target
            )
        ) {
            musicMore.open =
                false;
        }
    }
);


// ==========================================================
// INTRO
// ==========================================================

function hideIntro() {
    if (
        state.introHidden
    ) {
        return;
    }


    state.introHidden =
        true;


    els.introOverlay
        .classList.add(
            "hide"
        );


    setTimeout(
        () => {
            els.introOverlay.hidden =
                true;
        },
        950
    );
}


// ==========================================================
// START
// ==========================================================

async function start() {
    buildAmbientStars();


    window.addEventListener(
        "resize",
        () => {
            buildAmbientStars();
        }
    );


    requestAnimationFrame(
        animationLoop
    );


    if (!window.db) {
        els.introStatus.textContent =
            "Supabase belum siap.";

        return;
    }


    state.accessCode =
        await ensureAccess();


    if (!state.accessCode) {
        window.location.href =
            "index.html";

        return;
    }


    try {
        els.introStatus.textContent =
            "Mengubah Daily Check-in menjadi cahaya, bentuk, dan gerak...";


        const requestedDate =
            dateFromQuery();


        const requestedMonth =
            monthFromQuery()
            || (
                requestedDate
                    ? `${
                        requestedDate.slice(
                            0,
                            7
                        )
                    }-01`
                    : null
            );


        await loadData(
            requestedDate,
            requestedMonth,
            {
                updateUrl:
                    true
            }
        );


        els.introStatus.textContent =
            "Ritme ditemukan. Selamat datang di ruang kita.";


        setTimeout(
            hideIntro,
            850
        );

    } catch (error) {
        console.error(
            "Ruang Detak gagal dimulai:",
            error
        );


        els.introStatus.textContent =
            error.message
            || "Ruang Detak belum dapat dibuka.";
    }
}


start();
