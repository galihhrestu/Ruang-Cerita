// ==========================================================
// RUANG CERITA — DAILY CHECK-IN V1
// ==========================================================

const ACCESS_KEY_STORAGE = "kodeRuangCerita";
const PROFILE_STORAGE = "ruangCeritaCheckinProfile";

const VALID_PROFILES = ["Galih", "Wisye"];

let accessCode = "";
let currentProfile = "";
let dashboardData = null;
let activeTargetDate = null;

const HISTORY_PAGE_SIZE = 5;
let historyPage = 1;
let historyTotalPages = 0;

const els = {
    profileModal: document.getElementById("profileModal"),
    switchProfileButton: document.getElementById("switchProfileButton"),

    streakNumber: document.getElementById("streakNumber"),
    streakLabel: document.getElementById("streakLabel"),
    streakProgress: document.getElementById("streakProgress"),
    restoreQuota: document.getElementById("restoreQuota"),

    todayLabel: document.getElementById("todayLabel"),
    currentProfileBadge: document.getElementById("currentProfileBadge"),
    statusGalih: document.getElementById("statusGalih"),
    statusWisye: document.getElementById("statusWisye"),
    todayStatusMessage: document.getElementById("todayStatusMessage"),

    restoreCard: document.getElementById("restoreCard"),
    restoreText: document.getElementById("restoreText"),
    restoreButton: document.getElementById("restoreButton"),

    activeRestoreCard: document.getElementById("activeRestoreCard"),
    activeRestoreTitle: document.getElementById("activeRestoreTitle"),
    activeRestoreText: document.getElementById("activeRestoreText"),
    fillRestoreButton: document.getElementById("fillRestoreButton"),

    formEyebrow: document.getElementById("formEyebrow"),
    formTitle: document.getElementById("formTitle"),
    backToTodayButton: document.getElementById("backToTodayButton"),
    checkinForm: document.getElementById("checkinForm"),
    mood: document.getElementById("mood"),
    energy: document.getElementById("energy"),
    energyValue: document.getElementById("energyValue"),
    physicalCondition: document.getElementById("physicalCondition"),
    dayRating: document.getElementById("dayRating"),
    dayRatingValue: document.getElementById("dayRatingValue"),
    needToday: document.getElementById("needToday"),
    note: document.getElementById("note"),
    noteCount: document.getElementById("noteCount"),
    formMessage: document.getElementById("formMessage"),
    submitButton: document.getElementById("submitButton"),

    resultSection: document.getElementById("resultSection"),
    resultDate: document.getElementById("resultDate"),
    resultGrid: document.getElementById("resultGrid"),

    historySection: document.getElementById("historySection"),
    historySummary: document.getElementById("historySummary"),
    historyList: document.getElementById("historyList"),
    historyEmpty: document.getElementById("historyEmpty"),
    historyPagination: document.getElementById("historyPagination"),
    historyPrev: document.getElementById("historyPrev"),
    historyNext: document.getElementById("historyNext"),
    historyPageNumbers: document.getElementById("historyPageNumbers")
};


// ----------------------------------------------------------
// UTILITIES
// ----------------------------------------------------------

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDateID(dateString) {
    if (!dateString) return "—";

    const [year, month, day] = String(dateString)
        .split("-")
        .map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

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

function formatTimeWIB(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta"
        }
    ).format(date);
}

function partnerOf(profile) {
    return profile === "Galih" ? "Wisye" : "Galih";
}

function setMessage(message = "", type = "") {
    els.formMessage.textContent = message;
    els.formMessage.className = `form-message ${type}`.trim();
}

function setLoading(loading) {
    els.submitButton.disabled = loading;
    els.submitButton.textContent =
        loading
            ? "Menyimpan..."
            : "Selesaikan Check-in";
}


// ----------------------------------------------------------
// ACCESS CODE
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
// PROFILE
// ----------------------------------------------------------

function openProfileModal() {
    els.profileModal.hidden = false;
}

function closeProfileModal() {
    els.profileModal.hidden = true;
}

function setProfile(profile) {
    if (!VALID_PROFILES.includes(profile)) {
        return;
    }

    currentProfile = profile;

    localStorage.setItem(
        PROFILE_STORAGE,
        currentProfile
    );

    closeProfileModal();

    els.currentProfileBadge.textContent =
        `Kamu: ${currentProfile}`;

    loadDashboard();
}

function ensureProfile() {
    const saved =
        localStorage.getItem(PROFILE_STORAGE);

    if (VALID_PROFILES.includes(saved)) {
        currentProfile = saved;
        els.currentProfileBadge.textContent =
            `Kamu: ${currentProfile}`;
        return true;
    }

    openProfileModal();
    return false;
}


// ----------------------------------------------------------
// RPC
// ----------------------------------------------------------

async function fetchDashboard() {
    const { data, error } = await window.db.rpc(
        "ambil_daily_checkin_dashboard",
        {
            kode: accessCode,
            profile_input: currentProfile
        }
    );

    if (error) {
        throw error;
    }

    return data;
}

async function fetchDay(date) {
    const { data, error } = await window.db.rpc(
        "ambil_daily_checkin_day",
        {
            kode: accessCode,
            profile_input: currentProfile,
            tanggal_input: date
        }
    );

    if (error) {
        throw error;
    }

    return data;
}


async function fetchHistory(page = 1) {
    const { data, error } = await window.db.rpc(
        "ambil_daily_checkin_history",
        {
            kode: accessCode,
            page_input: page,
            page_size_input: HISTORY_PAGE_SIZE
        }
    );

    if (error) {
        throw error;
    }

    return data;
}


// ----------------------------------------------------------
// STREAK
// ----------------------------------------------------------

function renderStreak(data) {
    const streak =
        Number(data.current_streak || 0);

    const qualified =
        Boolean(data.streak_qualified);

    els.restoreQuota.textContent =
        `${data.restore_remaining} / 5 tersisa`;

    if (qualified) {
        els.streakNumber.textContent = streak;
        els.streakLabel.textContent =
            "hari bersama berturut-turut";

        els.streakProgress.hidden = true;
        els.streakProgress.innerHTML = "";
        return;
    }

    els.streakNumber.textContent = streak;

    if (streak === 0) {
        els.streakLabel.textContent =
            "Mulai check-in bersama untuk membangun streak.";
    } else {
        els.streakLabel.textContent =
            `${streak} dari 3 hari untuk memulai streak ❤️`;
    }

    els.streakProgress.hidden = false;
    els.streakProgress.innerHTML = "";

    for (let i = 1; i <= 3; i++) {
        const heart =
            document.createElement("span");

        heart.className =
            `progress-heart ${i <= streak ? "active" : ""}`;

        heart.textContent =
            i <= streak ? "❤️" : "♡";

        els.streakProgress.appendChild(heart);
    }
}


// ----------------------------------------------------------
// TODAY STATUS
// ----------------------------------------------------------

function renderTodayStatus(data) {
    els.todayLabel.textContent =
        formatDateID(data.today);

    els.statusGalih.textContent =
        data.profile === "Galih"
            ? (data.own_submitted ? "Sudah check-in ✓" : "Belum check-in")
            : (data.partner_submitted ? "Sudah check-in ✓" : "Belum check-in");

    els.statusWisye.textContent =
        data.profile === "Wisye"
            ? (data.own_submitted ? "Sudah check-in ✓" : "Belum check-in")
            : (data.partner_submitted ? "Sudah check-in ✓" : "Belum check-in");

    if (data.today_complete) {
        els.todayStatusMessage.textContent =
            "Hari ini lengkap ❤️ Kalian berdua sudah check-in.";
    } else if (data.own_submitted) {
        els.todayStatusMessage.textContent =
            `Check-in kamu sudah tersimpan. Menunggu ${data.partner}...`;
    } else if (data.partner_submitted) {
        els.todayStatusMessage.textContent =
            `${data.partner} sudah check-in. Jawabannya akan terbuka setelah kamu selesai.`;
    } else {
        els.todayStatusMessage.textContent =
            "Belum ada check-in hari ini.";
    }
}


// ----------------------------------------------------------
// RESTORE
// ----------------------------------------------------------

function renderRestore(data) {
    const candidate = data.restore_candidate;

    const canRestore =
        Boolean(candidate)
        && Number(data.restore_remaining || 0) > 0;

    els.restoreCard.hidden = !canRestore;

    if (canRestore) {
        els.restoreText.textContent =
            `${formatDateID(candidate)} belum lengkap. `
            + `Gunakan 1 restore untuk membuka kembali hari tersebut selama 24 jam.`;
    }

    const activeDate =
        data.active_restore_date;

    const missing =
        Array.isArray(data.active_restore_missing_profiles)
            ? data.active_restore_missing_profiles
            : [];

    els.activeRestoreCard.hidden =
        !activeDate;

    if (!activeDate) {
        return;
    }

    els.activeRestoreTitle.textContent =
        `${formatDateID(activeDate)} sedang dipulihkan`;

    const expiry =
        formatTimeWIB(
            data.active_restore_expires
        );

    els.activeRestoreText.textContent =
        missing.length
            ? `Masih menunggu ${missing.join(" & ")}. Restore aktif hingga sekitar ${expiry} WIB.`
            : "Hari ini sudah lengkap.";

    els.fillRestoreButton.hidden =
        !missing.includes(currentProfile);
}

async function restoreCandidateDay() {
    const candidate =
        dashboardData?.restore_candidate;

    if (!candidate) {
        return;
    }

    const confirmed = confirm(
        `Pulihkan ${formatDateID(candidate)}?\n\n`
        + `Ini akan memakai 1 dari 5 restore bulan ini.`
    );

    if (!confirmed) {
        return;
    }

    els.restoreButton.disabled = true;
    els.restoreButton.textContent = "Memulihkan...";

    try {
        const { error } = await window.db.rpc(
            "restore_daily_checkin_day",
            {
                kode: accessCode,
                profile_input: currentProfile,
                tanggal_input: candidate
            }
        );

        if (error) {
            throw error;
        }

        await loadDashboard();

        if (
            dashboardData?.active_restore_date
            && dashboardData?.active_restore_missing_profiles
                ?.includes(currentProfile)
        ) {
            await openRestoreForm(
                dashboardData.active_restore_date
            );
        }
    } catch (error) {
        console.error(error);

        alert(
            error.message
            || "Restore gagal dilakukan."
        );
    } finally {
        els.restoreButton.disabled = false;
        els.restoreButton.textContent =
            "Pulihkan hari";
    }
}


// ----------------------------------------------------------
// FORM CHOICES
// ----------------------------------------------------------

function setupChoiceButtons() {
    document
        .querySelectorAll(".mood-choice")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(".mood-choice")
                        .forEach((item) => {
                            item.classList.remove("active");
                        });

                    button.classList.add("active");

                    els.mood.value =
                        button.dataset.value;
                }
            );
        });

    document
        .querySelectorAll(".condition-choice")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(".condition-choice")
                        .forEach((item) => {
                            item.classList.remove("active");
                        });

                    button.classList.add("active");

                    els.physicalCondition.value =
                        button.dataset.value;
                }
            );
        });
}

function selectChoice(selector, value) {
    document
        .querySelectorAll(selector)
        .forEach((button) => {
            const active =
                button.dataset.value === value;

            button.classList.toggle(
                "active",
                active
            );
        });
}

function resetForm() {
    els.checkinForm.reset();

    els.mood.value = "";
    els.physicalCondition.value = "";

    document
        .querySelectorAll(".choice")
        .forEach((button) => {
            button.classList.remove("active");
        });

    els.energy.value = "3";
    els.energyValue.textContent = "3/5";

    els.dayRating.value = "7";
    els.dayRatingValue.textContent = "7";

    els.noteCount.textContent = "0";

    setMessage("");
}

function fillForm(data) {
    resetForm();

    if (!data) {
        return;
    }

    els.mood.value = data.mood || "";
    selectChoice(
        ".mood-choice",
        data.mood
    );

    els.energy.value =
        String(data.energy || 3);

    els.energyValue.textContent =
        `${els.energy.value}/5`;

    els.physicalCondition.value =
        data.physical_condition || "";

    selectChoice(
        ".condition-choice",
        data.physical_condition
    );

    els.dayRating.value =
        String(data.day_rating || 7);

    els.dayRatingValue.textContent =
        els.dayRating.value;

    els.needToday.value =
        data.need_today || "";

    els.note.value =
        data.note || "";

    els.noteCount.textContent =
        String(els.note.value.length);
}


// ----------------------------------------------------------
// RESULTS
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

    return map[mood] || "•";
}

function renderPersonResult(name, data) {
    if (!data) {
        return `
            <div class="locked-result">
                🔒 ${escapeHTML(name)} belum dapat dilihat.
            </div>
        `;
    }

    return `
        <article class="result-person">
            <h3>${escapeHTML(name)}</h3>

            <div class="result-row">
                <span>Mood</span>
                <strong>
                    ${moodEmoji(data.mood)}
                    ${escapeHTML(data.mood)}
                </strong>
            </div>

            <div class="result-row">
                <span>Energi</span>
                <strong>${escapeHTML(data.energy)}/5</strong>
            </div>

            <div class="result-row">
                <span>Kondisi</span>
                <strong>${escapeHTML(data.physical_condition)}</strong>
            </div>

            <div class="result-row">
                <span>Hari</span>
                <strong>${escapeHTML(data.day_rating)}/10</strong>
            </div>

            <div class="result-row">
                <span>Butuh</span>
                <strong>
                    ${escapeHTML(data.need_today || "—")}
                </strong>
            </div>

            ${
                data.note
                    ? `
                        <p class="result-note">
                            “${escapeHTML(data.note)}”
                        </p>
                    `
                    : ""
            }
        </article>
    `;
}

function renderTodayResult(data) {
    els.resultDate.textContent =
        formatDateID(data.today);

    if (!data.own_submitted) {
        els.resultSection.hidden = true;
        return;
    }

    const ownName = data.profile;
    const partnerName = data.partner;

    let html =
        renderPersonResult(
            ownName,
            data.own_today
        );

    if (data.partner_locked) {
        html += `
            <div class="locked-result">
                🔒 Jawaban ${escapeHTML(partnerName)}
                terbuka setelah kamu check-in.
            </div>
        `;
    } else if (data.partner_submitted) {
        html +=
            renderPersonResult(
                partnerName,
                data.partner_today
            );
    } else {
        html += `
            <div class="locked-result">
                ⏳ Menunggu ${escapeHTML(partnerName)}
                melakukan check-in.
            </div>
        `;
    }

    els.resultGrid.innerHTML = html;
    els.resultSection.hidden = false;
}




// ----------------------------------------------------------
// HISTORY
// 1 kartu = 1 tanggal. Urutan terbaru -> terlama.
// ----------------------------------------------------------

function historyStatusLabel(item) {
    if (item.day_complete && item.is_restored) {
        return {
            label: "❤️‍🩹 Restored",
            className: "restored"
        };
    }

    if (item.day_complete) {
        return {
            label: "❤️ Complete",
            className: "complete"
        };
    }

    return {
        label: "♡ Belum lengkap",
        className: "partial"
    };
}

function renderHistoryPerson(name, data) {
    if (!data) {
        return `
            <div class="history-person history-person-missing">
                <div class="history-person-title">
                    <span class="history-mini-avatar">
                        ${escapeHTML(name.charAt(0))}
                    </span>

                    <strong>${escapeHTML(name)}</strong>
                </div>

                <span class="history-missing-text">
                    Belum check-in
                </span>
            </div>
        `;
    }

    return `
        <div class="history-person">
            <div class="history-person-title">
                <span class="history-mini-avatar">
                    ${escapeHTML(name.charAt(0))}
                </span>

                <strong>${escapeHTML(name)}</strong>
            </div>

            <div class="history-person-details">
                <span>
                    ${moodEmoji(data.mood)}
                    ${escapeHTML(data.mood)}
                </span>

                <span>
                    ⚡ ${escapeHTML(data.energy)}/5
                </span>

                <span>
                    ${escapeHTML(data.day_rating)}/10
                </span>
            </div>
        </div>
    `;
}

function renderHistoryPageNumbers(currentPage, totalPages) {
    els.historyPageNumbers.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    const pages = [];

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(
            totalPages - 1,
            currentPage + 1
        );

        if (start > 2) {
            pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push("...");
        }

        pages.push(totalPages);
    }

    pages.forEach((page) => {
        if (page === "...") {
            const dots = document.createElement("span");
            dots.className = "history-page-dots";
            dots.textContent = "…";
            els.historyPageNumbers.appendChild(dots);
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className =
            "history-page-button history-number-button";

        if (page === currentPage) {
            button.classList.add("active");
            button.setAttribute("aria-current", "page");
        }

        button.textContent = String(page);

        button.addEventListener(
            "click",
            () => loadHistory(page, true)
        );

        els.historyPageNumbers.appendChild(button);
    });
}

function renderHistory(data) {
    const items =
        Array.isArray(data?.items)
            ? data.items
            : [];

    const totalDays =
        Number(data?.total_days || 0);

    const currentPage =
        Number(data?.page || 1);

    const totalPages =
        Number(data?.total_pages || 0);

    historyPage = currentPage;
    historyTotalPages = totalPages;

    els.historyList.innerHTML = "";

    if (!items.length) {
        els.historySummary.textContent =
            "Belum ada hari sebelumnya.";

        els.historyEmpty.hidden = false;
        els.historyPagination.hidden = true;
        return;
    }

    els.historyEmpty.hidden = true;

    const start =
        (currentPage - 1) * HISTORY_PAGE_SIZE + 1;

    const end =
        Math.min(
            start + items.length - 1,
            totalDays
        );

    els.historySummary.textContent =
        `Menampilkan ${start}–${end} dari ${totalDays} hari.`;

    items.forEach((item) => {
        const status =
            historyStatusLabel(item);

        const article =
            document.createElement("article");

        article.className = "history-entry";

        article.innerHTML = `
            <div class="history-date-row">
                <h3>${formatDateID(item.date)}</h3>

                <span
                    class="history-status ${status.className}"
                >
                    ${status.label}
                </span>
            </div>

            <div class="history-couple-grid">
                ${renderHistoryPerson("Galih", item.galih)}
                ${renderHistoryPerson("Wisye", item.wisye)}
            </div>
        `;

        els.historyList.appendChild(article);
    });

    const showPagination =
        totalPages > 1;

    els.historyPagination.hidden =
        !showPagination;

    if (!showPagination) {
        return;
    }

    els.historyPrev.disabled =
        currentPage <= 1;

    els.historyNext.disabled =
        currentPage >= totalPages;

    renderHistoryPageNumbers(
        currentPage,
        totalPages
    );
}

async function loadHistory(
    page = historyPage,
    scrollToHistory = false
) {
    try {
        els.historySummary.textContent =
            "Memuat riwayat...";

        const data =
            await fetchHistory(page);

        renderHistory(data);

        if (scrollToHistory) {
            els.historySection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    } catch (error) {
        console.error(
            "Gagal memuat riwayat check-in:",
            error
        );

        els.historySummary.textContent =
            "Riwayat gagal dimuat.";

        els.historyList.innerHTML = "";

        els.historyEmpty.hidden = false;
        els.historyEmpty.textContent =
            error.message
            || "Periksa koneksi Supabase.";

        els.historyPagination.hidden = true;
    }
}

// ----------------------------------------------------------
// TARGET FORM: TODAY / RESTORE
// ----------------------------------------------------------

async function showTodayForm() {
    activeTargetDate =
        dashboardData.today;

    els.formEyebrow.textContent =
        "CHECK-IN HARI INI";

    els.formTitle.textContent =
        dashboardData.own_submitted
            ? "Edit check-in kamu"
            : "Check-in kamu";

    els.backToTodayButton.hidden = true;

    fillForm(
        dashboardData.own_today
    );
}

async function openRestoreForm(date) {
    const data =
        await fetchDay(date);

    activeTargetDate = date;

    els.formEyebrow.textContent =
        "RESTORE CHECK-IN";

    els.formTitle.textContent =
        formatDateID(date);

    els.backToTodayButton.hidden = false;

    fillForm(data.own);

    document
        .getElementById("formSection")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ----------------------------------------------------------
// SUBMIT
// ----------------------------------------------------------

async function submitCheckin(event) {
    event.preventDefault();

    const mood =
        els.mood.value.trim();

    const condition =
        els.physicalCondition.value.trim();

    if (!mood) {
        setMessage(
            "Pilih mood terlebih dahulu.",
            "error"
        );
        return;
    }

    if (!condition) {
        setMessage(
            "Pilih kondisi badan terlebih dahulu.",
            "error"
        );
        return;
    }

    if (!activeTargetDate) {
        setMessage(
            "Tanggal check-in belum siap.",
            "error"
        );
        return;
    }

    setLoading(true);
    setMessage("");

    try {
        const { error } = await window.db.rpc(
            "simpan_daily_checkin",
            {
                kode: accessCode,
                profile_input: currentProfile,
                tanggal_input: activeTargetDate,
                mood_input: mood,
                energy_input: Number(els.energy.value),
                physical_condition_input: condition,
                day_rating_input: Number(els.dayRating.value),
                need_today_input:
                    els.needToday.value || null,
                note_input:
                    els.note.value.trim() || null
            }
        );

        if (error) {
            throw error;
        }

        setMessage(
            "Check-in berhasil disimpan ❤️",
            "success"
        );

        const submittedDate =
            activeTargetDate;

        await loadDashboard();

        if (
            submittedDate !== dashboardData.today
            && dashboardData.active_restore_date === submittedDate
            && dashboardData.active_restore_missing_profiles
                ?.includes(currentProfile)
        ) {
            await openRestoreForm(
                submittedDate
            );
        } else {
            await showTodayForm();
        }
    } catch (error) {
        console.error(error);

        setMessage(
            error.message
            || "Check-in gagal disimpan.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}


// ----------------------------------------------------------
// DASHBOARD
// ----------------------------------------------------------

async function loadDashboard() {
    if (!currentProfile) {
        return;
    }

    try {
        dashboardData =
            await fetchDashboard();

        renderStreak(dashboardData);
        renderTodayStatus(dashboardData);
        renderRestore(dashboardData);
        renderTodayResult(dashboardData);

        els.currentProfileBadge.textContent =
            `Kamu: ${currentProfile}`;

        if (
            !activeTargetDate
            || activeTargetDate === dashboardData.today
        ) {
            await showTodayForm();
        }

        await loadHistory(historyPage, false);
    } catch (error) {
        console.error(
            "Gagal memuat Daily Check-in:",
            error
        );

        alert(
            "Daily Check-in gagal dimuat.\n\n"
            + (error.message || "Periksa Supabase.")
        );
    }
}


// ----------------------------------------------------------
// EVENTS
// ----------------------------------------------------------

document
    .querySelectorAll(".profile-option")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                setProfile(
                    button.dataset.profile
                );
            }
        );
    });

els.switchProfileButton.addEventListener(
    "click",
    () => {
        openProfileModal();
    }
);

els.restoreButton.addEventListener(
    "click",
    restoreCandidateDay
);

els.fillRestoreButton.addEventListener(
    "click",
    async () => {
        if (
            dashboardData?.active_restore_date
        ) {
            await openRestoreForm(
                dashboardData.active_restore_date
            );
        }
    }
);

els.backToTodayButton.addEventListener(
    "click",
    showTodayForm
);

els.energy.addEventListener(
    "input",
    () => {
        els.energyValue.textContent =
            `${els.energy.value}/5`;
    }
);

els.dayRating.addEventListener(
    "input",
    () => {
        els.dayRatingValue.textContent =
            els.dayRating.value;
    }
);

els.note.addEventListener(
    "input",
    () => {
        els.noteCount.textContent =
            String(els.note.value.length);
    }
);

els.historyPrev.addEventListener(
    "click",
    () => {
        if (historyPage > 1) {
            loadHistory(
                historyPage - 1,
                true
            );
        }
    }
);

els.historyNext.addEventListener(
    "click",
    () => {
        if (
            historyTotalPages > 0
            && historyPage < historyTotalPages
        ) {
            loadHistory(
                historyPage + 1,
                true
            );
        }
    }
);


els.checkinForm.addEventListener(
    "submit",
    submitCheckin
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

    setupChoiceButtons();

    accessCode =
        await ensureAccess();

    if (!accessCode) {
        window.location.href =
            "index.html";
        return;
    }

    if (ensureProfile()) {
        await loadDashboard();
    }
}

start();
