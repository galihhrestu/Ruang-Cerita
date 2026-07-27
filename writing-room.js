// ==========================================================
// RUANG CERITA — THE WRITING ROOM
// ==========================================================

const WRITING_ACCESS_KEY =
    "kodeRuangCerita";

const WRITING_DRAFT_KEY =
    "ruangCeritaWritingDraftV1";


const writingForm =
    document.getElementById(
        "formTulisan"
    );

const writingTitle =
    document.getElementById(
        "judul"
    );

const writingBody =
    document.getElementById(
        "isi"
    );

const writingCategory =
    document.getElementById(
        "kategori"
    );

const writingMood =
    document.getElementById(
        "mood"
    );

const wordCount =
    document.getElementById(
        "wordCount"
    );

const readingTime =
    document.getElementById(
        "readingTime"
    );

const draftStatus =
    document.getElementById(
        "draftStatus"
    );

const successPanel =
    document.getElementById(
        "writingSuccess"
    );

const readSavedStory =
    document.getElementById(
        "readSavedStory"
    );

const writeAnotherStory =
    document.getElementById(
        "writeAnotherStory"
    );

const toast =
    document.getElementById(
        "wwToast"
    );


let writingAccessCode =
    "";

let latestSavedStoryId =
    null;

let draftTimer =
    null;


// ==========================================================
// ACCESS
// ==========================================================

async function verifyAccess(
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
            WRITING_ACCESS_KEY
        );


    if (
        code
        && await verifyAccess(
            code
        )
    ) {
        return code;
    }


    localStorage.removeItem(
        WRITING_ACCESS_KEY
    );


    code =
        prompt(
            "Masukkan kode akses Ruang Cerita:"
        );


    if (!code) {
        return null;
    }


    if (
        !await verifyAccess(
            code
        )
    ) {
        alert(
            "Kode akses salah"
        );

        return null;
    }


    localStorage.setItem(
        WRITING_ACCESS_KEY,
        code
    );


    return code;
}


// ==========================================================
// DRAFT
// ==========================================================

function getDraftPayload() {
    return {
        judul:
            writingTitle.value,

        kategori:
            writingCategory.value,

        mood:
            writingMood.value,

        isi:
            writingBody.value,

        updatedAt:
            Date.now()
    };
}


function saveDraft() {
    const payload =
        getDraftPayload();


    const hasContent =
        payload.judul.trim()
        || payload.kategori
        || payload.mood
        || payload.isi.trim();


    if (!hasContent) {
        localStorage.removeItem(
            WRITING_DRAFT_KEY
        );

        draftStatus.textContent =
            "Draft lokal siap.";

        return;
    }


    localStorage.setItem(
        WRITING_DRAFT_KEY,
        JSON.stringify(
            payload
        )
    );


    const time =
        new Date()
            .toLocaleTimeString(
                "id-ID",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    hourCycle:
                        "h23"
                }
            );


    draftStatus.textContent =
        `Draft tersimpan · ${time}`;
}


function scheduleDraft() {
    window.clearTimeout(
        draftTimer
    );


    draftStatus.textContent =
        "Menyimpan draft...";


    draftTimer =
        window.setTimeout(
            saveDraft,
            500
        );
}


function restoreDraft() {
    const raw =
        localStorage.getItem(
            WRITING_DRAFT_KEY
        );


    if (!raw) {
        return;
    }


    try {
        const draft =
            JSON.parse(
                raw
            );


        writingTitle.value =
            draft.judul
            || "";

        writingCategory.value =
            draft.kategori
            || "";

        writingMood.value =
            draft.mood
            || "";

        writingBody.value =
            draft.isi
            || "";


        draftStatus.textContent =
            "Draft terakhir dipulihkan.";


        updateWritingMetrics();

    } catch (error) {
        console.warn(
            "Draft tidak dapat dipulihkan:",
            error
        );
    }
}


// ==========================================================
// METRICS
// ==========================================================

function updateWritingMetrics() {
    const words =
        writingBody.value
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    const count =
        words.length;


    wordCount.textContent =
        `${count} kata`;


    const minutes =
        Math.ceil(
            count
            / 200
        );


    readingTime.textContent =
        minutes <= 1
            ? "kurang dari 1 menit baca"
            : `sekitar ${minutes} menit baca`;
}


// ==========================================================
// STORY RPC
// ==========================================================

async function getRawStories() {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "ambil_tulisan",
            {
                kode:
                    writingAccessCode
            }
        );


    if (error) {
        throw error;
    }


    return Array.isArray(
        data
    )
        ? data
        : [];
}


async function saveMetadata(
    id,
    category,
    mood
) {
    const {
        error
    } =
        await window.db.rpc(
            "atur_metadata_tulisan",
            {
                kode:
                    writingAccessCode,

                id_input:
                    String(
                        id
                    ),

                kategori_input:
                    category,

                mood_input:
                    mood
            }
        );


    if (error) {
        console.error(
            "Kategori/mood gagal disimpan:",
            error
        );

        return false;
    }


    return true;
}


async function saveStory(
    title,
    content,
    category,
    mood
) {
    const before =
        await getRawStories();


    const existingIds =
        new Set(
            before.map(
                (item) =>
                    String(
                        item.id
                    )
            )
        );


    const {
        error
    } =
        await window.db.rpc(
            "simpan_tulisan",
            {
                kode:
                    writingAccessCode,

                judul_input:
                    title,

                isi_input:
                    content
            }
        );


    if (error) {
        throw error;
    }


    const after =
        await getRawStories();


    const candidates =
        after
            .filter(
                (item) =>
                    !existingIds.has(
                        String(
                            item.id
                        )
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    parseStoryTime(
                        b.created_at
                    )
                    - parseStoryTime(
                        a.created_at
                    )
            );


    const story =
        candidates[0]
        || after
            .filter(
                (item) =>
                    item.judul
                    === title
                    && item.isi
                    === content
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    parseStoryTime(
                        b.created_at
                    )
                    - parseStoryTime(
                        a.created_at
                    )
            )[0];


    if (!story) {
        throw new Error(
            "Cerita tersimpan, tetapi ID cerita baru tidak ditemukan."
        );
    }


    const metadataSaved =
        await saveMetadata(
            story.id,
            category,
            mood
        );


    return {
        story,
        metadataSaved
    };
}


function parseStoryTime(
    value
) {
    if (!value) {
        return 0;
    }


    const text =
        String(
            value
        )
            .trim()
            .replace(
                " ",
                "T"
            );


    const zoned =
        /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i
            .test(
                text
            );


    const date =
        new Date(
            zoned
                ? text
                : `${text}Z`
        );


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();
}


// ==========================================================
// UI
// ==========================================================

function showToast(
    message
) {
    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    window.clearTimeout(
        showToast.timer
    );


    showToast.timer =
        window.setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            2600
        );
}


function showSuccess(
    id,
    metadataSaved
) {
    latestSavedStoryId =
        id;


    writingForm.hidden =
        true;

    successPanel.hidden =
        false;


    localStorage.removeItem(
        WRITING_DRAFT_KEY
    );


    if (!metadataSaved) {
        showToast(
            "Cerita tersimpan. Kategori dan mood belum berhasil disimpan."
        );
    }
}


function resetWritingRoom() {
    latestSavedStoryId =
        null;


    successPanel.hidden =
        true;

    writingForm.hidden =
        false;

    writingForm.reset();


    localStorage.removeItem(
        WRITING_DRAFT_KEY
    );


    updateWritingMetrics();


    draftStatus.textContent =
        "Draft lokal siap.";


    writingTitle.focus();
}


// ==========================================================
// EVENTS
// ==========================================================

[
    writingTitle,
    writingCategory,
    writingMood,
    writingBody
]
    .forEach(
        (element) => {
            element.addEventListener(
                "input",
                () => {
                    scheduleDraft();
                    updateWritingMetrics();
                }
            );


            element.addEventListener(
                "change",
                scheduleDraft
            );
        }
    );


writingForm
    .addEventListener(
        "submit",
        async (
            event
        ) => {
            event.preventDefault();


            const title =
                writingTitle.value.trim();

            const content =
                writingBody.value.trim();

            const category =
                writingCategory.value;

            const mood =
                writingMood.value;


            if (
                !title
                || !content
                || !category
                || !mood
            ) {
                showToast(
                    "Lengkapi judul, kategori, mood, dan cerita."
                );

                return;
            }


            const button =
                writingForm
                    .querySelector(
                        ".ww-primary-button"
                    );


            const originalText =
                button.innerHTML;


            button.disabled =
                true;

            button.textContent =
                "Menyimpan ke semesta...";


            try {
                const result =
                    await saveStory(
                        title,
                        content,
                        category,
                        mood
                    );


                showSuccess(
                    result.story.id,
                    result.metadataSaved
                );

            } catch (error) {
                console.error(
                    "Gagal menyimpan cerita:",
                    error
                );


                showToast(
                    "Cerita belum berhasil disimpan. Coba lagi."
                );

            } finally {
                button.disabled =
                    false;

                button.innerHTML =
                    originalText;
            }
        }
    );


readSavedStory
    .addEventListener(
        "click",
        () => {
            if (
                latestSavedStoryId
            ) {
                window.openReadingRoom(
                    latestSavedStoryId
                );
            }
        }
    );


writeAnotherStory
    .addEventListener(
        "click",
        resetWritingRoom
    );


document.addEventListener(
    "keydown",
    (event) => {
        if (
            (
                event.ctrlKey
                || event.metaKey
            )
            && event.key
                .toLowerCase()
                === "s"
        ) {
            event.preventDefault();


            if (
                !writingForm.hidden
            ) {
                writingForm
                    .requestSubmit();
            }
        }
    }
);


// ==========================================================
// START
// ==========================================================

async function startWritingRoom() {
    if (!window.db) {
        showToast(
            "Supabase belum siap."
        );

        return;
    }


    writingAccessCode =
        await ensureAccess();


    if (!writingAccessCode) {
        window.location.href =
            "index.html";

        return;
    }


    restoreDraft();
    updateWritingMetrics();
}


startWritingRoom();
