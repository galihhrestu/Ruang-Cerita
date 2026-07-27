// ==========================================================
// RUANG CERITA — LUXURY EDIT STORY
// ==========================================================

const EDIT_ACCESS_KEY =
    "kodeRuangCerita";

const EDIT_WIB =
    "Asia/Jakarta";

const editParams =
    new URLSearchParams(
        window.location.search
    );

const editStoryId =
    editParams.get(
        "id"
    );

const editForm =
    document.getElementById(
        "formEdit"
    );

const editTitle =
    document.getElementById(
        "editJudul"
    );

const editBody =
    document.getElementById(
        "editIsi"
    );

const editCategory =
    document.getElementById(
        "editKategori"
    );

const editMood =
    document.getElementById(
        "editMood"
    );

const editHeading =
    document.getElementById(
        "editHeading"
    );

const editStoryInfo =
    document.getElementById(
        "editStoryInfo"
    );

const editMetrics =
    document.getElementById(
        "editMetrics"
    );

const editSuccess =
    document.getElementById(
        "editSuccess"
    );

const readEditedStory =
    document.getElementById(
        "readEditedStory"
    );

const continueEditing =
    document.getElementById(
        "continueEditing"
    );

const editToast =
    document.getElementById(
        "wwToast"
    );


let editAccessCode =
    "";

let loadedStory =
    null;


// ==========================================================
// ACCESS
// ==========================================================

async function verifyEditAccess(
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


async function ensureEditAccess() {
    let code =
        localStorage.getItem(
            EDIT_ACCESS_KEY
        );


    if (
        code
        && await verifyEditAccess(
            code
        )
    ) {
        return code;
    }


    localStorage.removeItem(
        EDIT_ACCESS_KEY
    );


    code =
        prompt(
            "Masukkan kode akses Ruang Cerita:"
        );


    if (!code) {
        return null;
    }


    if (
        !await verifyEditAccess(
            code
        )
    ) {
        alert(
            "Kode akses salah"
        );

        return null;
    }


    localStorage.setItem(
        EDIT_ACCESS_KEY,
        code
    );


    return code;
}


// ==========================================================
// LOAD
// ==========================================================

async function loadEditStory() {
    if (
        !editAccessCode
        || !editStoryId
    ) {
        throw new Error(
            "Kode akses atau ID cerita tidak tersedia."
        );
    }


    const [
        storyResult,
        metadataResult
    ] =
        await Promise.all([
            window.db.rpc(
                "ambil_tulisan",
                {
                    kode:
                        editAccessCode
                }
            ),

            window.db.rpc(
                "ambil_metadata_tulisan",
                {
                    kode:
                        editAccessCode
                }
            )
        ]);


    if (
        storyResult.error
    ) {
        throw storyResult.error;
    }


    loadedStory =
        (
            Array.isArray(
                storyResult.data
            )
                ? storyResult.data
                : []
        )
            .find(
                (item) =>
                    String(
                        item.id
                    )
                    === String(
                        editStoryId
                    )
            );


    if (!loadedStory) {
        throw new Error(
            "Cerita tidak ditemukan."
        );
    }


    const metadata =
        metadataResult.error
            ? null
            : (
                Array.isArray(
                    metadataResult.data
                )
                    ? metadataResult.data
                    : []
            )
                .find(
                    (item) =>
                        String(
                            item.cerita_id
                        )
                        === String(
                            editStoryId
                        )
                );


    editTitle.value =
        loadedStory.judul
        || "";

    editBody.value =
        loadedStory.isi
        || "";

    editCategory.value =
        metadata?.kategori
        || "";

    editMood.value =
        metadata?.mood
        || "";


    editHeading.textContent =
        loadedStory.judul
        || "Untitled Story";


    editStoryInfo.innerHTML =
        `
            Dibuat
            ${
                escapeEditHTML(
                    formatEditDateTime(
                        loadedStory.created_at
                    )
                )
            }
            <br>
            Terakhir diedit
            ${
                escapeEditHTML(
                    loadedStory.updated_at
                        ? formatEditDateTime(
                            loadedStory.updated_at
                        )
                        : "belum pernah"
                )
            }
        `;


    updateEditMetrics();
}


// ==========================================================
// SAVE
// ==========================================================

async function saveEditStory(
    title,
    content,
    category,
    mood
) {
    const {
        error
    } =
        await window.db.rpc(
            "edit_tulisan",
            {
                kode:
                    editAccessCode,

                id_input:
                    editStoryId,

                judul_baru:
                    title,

                isi_baru:
                    content
            }
        );


    if (error) {
        throw error;
    }


    const metadataResult =
        await window.db.rpc(
            "atur_metadata_tulisan",
            {
                kode:
                    editAccessCode,

                id_input:
                    String(
                        editStoryId
                    ),

                kategori_input:
                    category,

                mood_input:
                    mood
            }
        );


    return (
        !metadataResult.error
    );
}


// ==========================================================
// UI
// ==========================================================

function updateEditMetrics() {
    const words =
        editBody.value
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean)
            .length;


    const minutes =
        Math.max(
            1,
            Math.ceil(
                words
                / 200
            )
        );


    editMetrics.textContent =
        words
        ? `${words} kata · sekitar ${minutes} menit baca`
        : "Belum ada kata.";
}


function showEditToast(
    message
) {
    editToast.textContent =
        message;


    editToast.classList.add(
        "show"
    );


    window.clearTimeout(
        showEditToast.timer
    );


    showEditToast.timer =
        window.setTimeout(
            () => {
                editToast.classList.remove(
                    "show"
                );
            },
            2500
        );
}


function showEditSuccess(
    metadataSaved
) {
    editForm.hidden =
        true;

    editSuccess.hidden =
        false;


    if (!metadataSaved) {
        showEditToast(
            "Isi tersimpan. Kategori/mood belum berhasil diperbarui."
        );
    }
}


// ==========================================================
// DATE
// ==========================================================

function parseEditDate(
    value
) {
    if (!value) {
        return new Date(
            Number.NaN
        );
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


    const hasZone =
        /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i
            .test(
                text
            );


    return new Date(
        hasZone
            ? text
            : `${text}Z`
    );
}


function formatEditDateTime(
    value
) {
    const date =
        parseEditDate(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "waktu tidak tersedia";
    }


    return `${
        date.toLocaleString(
            "id-ID",
            {
                timeZone:
                    EDIT_WIB,

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hourCycle:
                    "h23"
            }
        )
    } WIB`;
}


function escapeEditHTML(
    value
) {
    return String(
        value
        ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ==========================================================
// EVENTS
// ==========================================================

editBody.addEventListener(
    "input",
    updateEditMetrics
);


editForm.addEventListener(
    "submit",
    async (
        event
    ) => {
        event.preventDefault();


        const title =
            editTitle.value.trim();

        const content =
            editBody.value.trim();

        const category =
            editCategory.value;

        const mood =
            editMood.value;


        if (
            !title
            || !content
            || !category
            || !mood
        ) {
            showEditToast(
                "Lengkapi judul, kategori, mood, dan cerita."
            );

            return;
        }


        const button =
            editForm
                .querySelector(
                    ".ww-primary-button"
                );


        const originalText =
            button.innerHTML;


        button.disabled =
            true;

        button.textContent =
            "Menyimpan perubahan...";


        try {
            const metadataSaved =
                await saveEditStory(
                    title,
                    content,
                    category,
                    mood
                );


            showEditSuccess(
                metadataSaved
            );

        } catch (error) {
            console.error(
                "Perubahan gagal disimpan:",
                error
            );


            showEditToast(
                "Perubahan belum berhasil disimpan."
            );

        } finally {
            button.disabled =
                false;

            button.innerHTML =
                originalText;
        }
    }
);


readEditedStory.addEventListener(
    "click",
    () => {
        window.openReadingRoom(
            editStoryId
        );
    }
);


continueEditing.addEventListener(
    "click",
    () => {
        editSuccess.hidden =
            true;

        editForm.hidden =
            false;

        editTitle.focus();
    }
);


// ==========================================================
// START
// ==========================================================

async function startEditPage() {
    if (!window.db) {
        showEditToast(
            "Supabase belum siap."
        );

        return;
    }


    editAccessCode =
        await ensureEditAccess();


    if (
        !editAccessCode
        || !editStoryId
    ) {
        window.location.href =
            "stories.html";

        return;
    }


    try {
        await loadEditStory();

    } catch (error) {
        console.error(
            "Cerita gagal dibuka untuk edit:",
            error
        );


        alert(
            "Cerita tidak ditemukan atau belum dapat dibuka."
        );


        window.location.href =
            "stories.html";
    }
}


startEditPage();
