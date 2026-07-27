// ==========================================================
// RUANG CERITA — OUR STORIES / THE ARCHIVE
// ==========================================================

const ARCHIVE_ACCESS_KEY =
    "kodeRuangCerita";

const ARCHIVE_PAGE_SIZE =
    5;

const ARCHIVE_WIB =
    "Asia/Jakarta";

const ARCHIVE_DEFAULT_CATEGORY =
    "Belum dikategorikan";

const ARCHIVE_DEFAULT_MOOD =
    "Belum dipilih";

const ARCHIVE_MOOD_ICON = {
    "Bahagia":
        "😊",

    "Penuh Cinta":
        "❤️",

    "Terharu":
        "🥺",

    "Sedih":
        "😔",

    "Bersyukur":
        "🌱",

    "Tenang":
        "😌",

    "Belum dipilih":
        "○"
};


const archiveCollection =
    document.getElementById(
        "archiveCollection"
    );

const archiveTotalStories =
    document.getElementById(
        "archiveTotalStories"
    );

const archiveFavorites =
    document.getElementById(
        "archiveFavorites"
    );

const archiveSince =
    document.getElementById(
        "archiveSince"
    );

const searchInput =
    document.getElementById(
        "pencarianJudul"
    );

const clearSearchButton =
    document.getElementById(
        "hapusPencarian"
    );

const favoriteFilter =
    document.getElementById(
        "filterFavorit"
    );

const categoryFilter =
    document.getElementById(
        "filterKategori"
    );

const moodFilter =
    document.getElementById(
        "filterMood"
    );

const sortSelect =
    document.getElementById(
        "urutkanCerita"
    );

const resetFilterButton =
    document.getElementById(
        "resetFilter"
    );

const resultInfo =
    document.getElementById(
        "infoHasilPencarian"
    );

const pagination =
    document.getElementById(
        "paginasiTulisan"
    );

const previousPageButton =
    document.getElementById(
        "halamanSebelumnya"
    );

const nextPageButton =
    document.getElementById(
        "halamanBerikutnya"
    );

const pageNumbers =
    document.getElementById(
        "nomorHalaman"
    );

const archiveToast =
    document.getElementById(
        "wwToast"
    );


let archiveAccessCode =
    "";

let allStories =
    [];

let filteredStories =
    [];

let activePage =
    1;

let metadataAvailable =
    true;


// ==========================================================
// ACCESS
// ==========================================================

async function verifyArchiveAccess(
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


async function ensureArchiveAccess() {
    let code =
        localStorage.getItem(
            ARCHIVE_ACCESS_KEY
        );


    if (
        code
        && await verifyArchiveAccess(
            code
        )
    ) {
        return code;
    }


    localStorage.removeItem(
        ARCHIVE_ACCESS_KEY
    );


    code =
        prompt(
            "Masukkan kode akses Ruang Cerita:"
        );


    if (!code) {
        return null;
    }


    if (
        !await verifyArchiveAccess(
            code
        )
    ) {
        alert(
            "Kode akses salah"
        );

        return null;
    }


    localStorage.setItem(
        ARCHIVE_ACCESS_KEY,
        code
    );


    return code;
}


// ==========================================================
// DATA
// ==========================================================

async function fetchRawStories() {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "ambil_tulisan",
            {
                kode:
                    archiveAccessCode
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


async function fetchStoryMetadata() {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "ambil_metadata_tulisan",
            {
                kode:
                    archiveAccessCode
            }
        );


    if (error) {
        metadataAvailable =
            false;


        console.warn(
            "Metadata belum tersedia:",
            error
        );


        return [];
    }


    metadataAvailable =
        true;


    return Array.isArray(
        data
    )
        ? data
        : [];
}


function mergeStoriesAndMetadata(
    stories,
    metadata
) {
    const map =
        new Map(
            metadata.map(
                (item) => [
                    String(
                        item.cerita_id
                    ),
                    item
                ]
            )
        );


    return stories.map(
        (story) => {
            const meta =
                map.get(
                    String(
                        story.id
                    )
                );


            return {
                ...story,

                kategori:
                    meta?.kategori
                    || ARCHIVE_DEFAULT_CATEGORY,

                mood:
                    meta?.mood
                    || ARCHIVE_DEFAULT_MOOD
            };
        }
    );
}


async function loadArchive({
    preservePage = false
} = {}) {
    archiveCollection.innerHTML =
        `
            <div class="archive-loading">
                <span>✦</span>
                Membuka koleksi kita...
            </div>
        `;


    try {
        const [
            stories,
            metadata
        ] =
            await Promise.all([
                fetchRawStories(),
                fetchStoryMetadata()
            ]);


        allStories =
            mergeStoriesAndMetadata(
                stories,
                metadata
            );


        if (!preservePage) {
            activePage =
                1;
        }


        updateArchiveStats();
        applyArchiveFilters(false);


        const openId =
            new URLSearchParams(
                window.location.search
            )
                .get(
                    "open"
                );


        if (openId) {
            window.setTimeout(
                () => {
                    window.openReadingRoom(
                        openId
                    );
                },
                180
            );


            const cleanUrl =
                new URL(
                    window.location.href
                );


            cleanUrl.searchParams.delete(
                "open"
            );


            history.replaceState(
                {},
                "",
                cleanUrl
            );
        }

    } catch (error) {
        console.error(
            "Archive gagal dimuat:",
            error
        );


        archiveCollection.innerHTML =
            `
                <div class="archive-empty">
                    <span>☾</span>
                    Archive belum dapat dibuka.
                </div>
            `;
    }
}


// ==========================================================
// FILTER / SORT
// ==========================================================

function applyArchiveFilters(
    resetPage = true
) {
    const keyword =
        searchInput.value
            .trim()
            .toLocaleLowerCase(
                "id-ID"
            );


    const favorite =
        favoriteFilter.value;

    const category =
        categoryFilter.value;

    const mood =
        moodFilter.value;

    const sort =
        sortSelect.value;


    filteredStories =
        allStories
            .filter(
                (story) => {
                    const matchesSearch =
                        !keyword
                        || String(
                            story.judul
                            || ""
                        )
                            .toLocaleLowerCase(
                                "id-ID"
                            )
                            .includes(
                                keyword
                            );


                    const matchesFavorite =
                        favorite
                        === "semua"
                        || Boolean(
                            story.favorit
                        );


                    const matchesCategory =
                        category
                        === "semua"
                        || story.kategori
                        === category;


                    const matchesMood =
                        mood
                        === "semua"
                        || story.mood
                        === mood;


                    return (
                        matchesSearch
                        && matchesFavorite
                        && matchesCategory
                        && matchesMood
                    );
                }
            );


    filteredStories.sort(
        (
            a,
            b
        ) => {
            if (
                sort
                === "terlama"
            ) {
                return (
                    storyTime(
                        a.created_at
                    )
                    - storyTime(
                        b.created_at
                    )
                );
            }


            if (
                sort
                === "terakhir-diedit"
            ) {
                return (
                    storyTime(
                        b.updated_at
                        || b.created_at
                    )
                    - storyTime(
                        a.updated_at
                        || a.created_at
                    )
                );
            }


            if (
                sort
                === "judul-az"
            ) {
                return String(
                    a.judul
                    || ""
                )
                    .localeCompare(
                        String(
                            b.judul
                            || ""
                        ),
                        "id-ID",
                        {
                            sensitivity:
                                "base"
                        }
                    );
            }


            return (
                storyTime(
                    b.created_at
                )
                - storyTime(
                    a.created_at
                )
            );
        }
    );


    if (
        resetPage
    ) {
        activePage =
            1;
    }


    const totalPages =
        getTotalPages();


    activePage =
        Math.min(
            activePage,
            totalPages
        );


    renderArchivePage();
}


// ==========================================================
// STATS
// ==========================================================

function updateArchiveStats() {
    archiveTotalStories.textContent =
        String(
            allStories.length
        );


    archiveFavorites.textContent =
        String(
            allStories.filter(
                (story) =>
                    Boolean(
                        story.favorit
                    )
            ).length
        );


    if (
        !allStories.length
    ) {
        archiveSince.textContent =
            "—";

        return;
    }


    const oldest =
        [...allStories]
            .sort(
                (
                    a,
                    b
                ) =>
                    storyTime(
                        a.created_at
                    )
                    - storyTime(
                        b.created_at
                    )
            )[0];


    const date =
        parseStoryDate(
            oldest.created_at
        );


    archiveSince.textContent =
        Number.isNaN(
            date.getTime()
        )
            ? "—"
            : String(
                date.toLocaleDateString(
                    "id-ID",
                    {
                        timeZone:
                            ARCHIVE_WIB,

                        year:
                            "numeric"
                    }
                )
            );
}


// ==========================================================
// RENDER
// ==========================================================

function renderArchivePage() {
    archiveCollection.innerHTML =
        "";


    if (
        !allStories.length
    ) {
        archiveCollection.innerHTML =
            `
                <div class="archive-empty">
                    <span>✦</span>
                    Belum ada cerita. The Writing Room menunggu halaman pertama kita.
                </div>
            `;


        pagination.hidden =
            true;

        resultInfo.textContent =
            "0 cerita";

        return;
    }


    if (
        !filteredStories.length
    ) {
        archiveCollection.innerHTML =
            `
                <div class="archive-empty">
                    <span>☾</span>
                    Tidak ada cerita yang cocok dengan pencarian atau filter ini.
                </div>
            `;


        pagination.hidden =
            true;

        resultInfo.textContent =
            "Tidak ada hasil.";

        return;
    }


    const start =
        (
            activePage
            - 1
        )
        * ARCHIVE_PAGE_SIZE;


    const pageStories =
        filteredStories.slice(
            start,
            start
            + ARCHIVE_PAGE_SIZE
        );


    pageStories.forEach(
        (
            story,
            index
        ) => {
            archiveCollection.appendChild(
                createArchiveCard(
                    story,
                    index,
                    start
                    + index
                    + 1
                )
            );
        }
    );


    renderPagination();
    updateResultInfo();
}


function createArchiveCard(
    story,
    indexOnPage,
    absoluteIndex
) {
    const article =
        document.createElement(
            "article"
        );


    article.className =
        "story-archive-card";


    if (
        indexOnPage === 0
    ) {
        article.classList.add(
            "featured"
        );
    }


    const title =
        String(
            story.judul
            || "Tanpa judul"
        );


    const body =
        String(
            story.isi
            || ""
        );


    const previewLength =
        indexOnPage === 0
            ? 330
            : 190;


    const preview =
        body.length
        > previewLength
            ? `${
                body.slice(
                    0,
                    previewLength
                )
            }…`
            : body;


    article.innerHTML =
        `
            <span class="story-card-index">
                ${
                    String(
                        absoluteIndex
                    )
                        .padStart(
                            2,
                            "0"
                        )
                }
            </span>

            <p class="story-card-date">
                ${
                    escapeArchiveHTML(
                        formatArchiveDate(
                            story.created_at
                        )
                    )
                }
            </p>

            <h2 class="story-card-title">
                ${
                    escapeArchiveHTML(
                        title
                    )
                }
            </h2>

            <div class="story-card-meta">

                <span class="story-card-category">
                    ${
                        escapeArchiveHTML(
                            story.kategori
                            || ARCHIVE_DEFAULT_CATEGORY
                        )
                    }
                </span>

                <span class="story-card-mood">
                    ${
                        ARCHIVE_MOOD_ICON[
                            story.mood
                        ]
                        || "○"
                    }
                    ${
                        escapeArchiveHTML(
                            story.mood
                            || ARCHIVE_DEFAULT_MOOD
                        )
                    }
                </span>

            </div>

            <p class="story-card-preview">
                ${
                    escapeArchiveHTML(
                        preview
                    )
                }
            </p>

            <div class="story-card-actions">

                <button
                    type="button"
                    class="story-read"
                >
                    Baca di Reading Room
                    <span>↗</span>
                </button>

                <button
                    type="button"
                    class="story-favorite ${
                        story.favorit
                            ? "active"
                            : ""
                    }"
                    aria-pressed="${
                        story.favorit
                            ? "true"
                            : "false"
                    }"
                >
                    ${
                        story.favorit
                            ? "♥ Favorit"
                            : "♡ Favorit"
                    }
                </button>

                <a
                    href="edit.html?id=${
                        encodeURIComponent(
                            story.id
                        )
                    }"
                >
                    ✎ Edit
                </a>

                <button
                    type="button"
                    class="story-delete"
                >
                    Hapus
                </button>

            </div>
        `;


    article
        .querySelector(
            ".story-read"
        )
        .addEventListener(
            "click",
            () => {
                window.openReadingRoom(
                    story.id
                );
            }
        );


    article
        .querySelector(
            ".story-favorite"
        )
        .addEventListener(
            "click",
            () => {
                toggleFavorite(
                    story.id
                );
            }
        );


    article
        .querySelector(
            ".story-delete"
        )
        .addEventListener(
            "click",
            () => {
                deleteStory(
                    story.id,
                    title
                );
            }
        );


    return article;
}


// ==========================================================
// PAGINATION
// ==========================================================

function getTotalPages() {
    return Math.max(
        1,
        Math.ceil(
            filteredStories.length
            / ARCHIVE_PAGE_SIZE
        )
    );
}


function getPageRange(
    total,
    active
) {
    if (
        total <= 7
    ) {
        return Array.from(
            {
                length:
                    total
            },
            (
                _,
                index
            ) =>
                index
                + 1
        );
    }


    if (
        active <= 4
    ) {
        return [
            1,
            2,
            3,
            4,
            5,
            "…",
            total
        ];
    }


    if (
        active
        >= total - 3
    ) {
        return [
            1,
            "…",
            total - 4,
            total - 3,
            total - 2,
            total - 1,
            total
        ];
    }


    return [
        1,
        "…",
        active - 1,
        active,
        active + 1,
        "…",
        total
    ];
}


function renderPagination() {
    const total =
        getTotalPages();


    if (
        total <= 1
    ) {
        pagination.hidden =
            true;

        return;
    }


    pagination.hidden =
        false;


    previousPageButton.disabled =
        activePage === 1;


    nextPageButton.disabled =
        activePage === total;


    pageNumbers.innerHTML =
        "";


    getPageRange(
        total,
        activePage
    )
        .forEach(
            (item) => {
                if (
                    item === "…"
                ) {
                    const span =
                        document.createElement(
                            "span"
                        );


                    span.textContent =
                        "…";


                    pageNumbers
                        .appendChild(
                            span
                        );


                    return;
                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";

                button.textContent =
                    String(
                        item
                    );


                if (
                    item
                    === activePage
                ) {
                    button.classList.add(
                        "active"
                    );

                    button.setAttribute(
                        "aria-current",
                        "page"
                    );
                }


                button.addEventListener(
                    "click",
                    () => {
                        goToPage(
                            item
                        );
                    }
                );


                pageNumbers
                    .appendChild(
                        button
                    );
            }
        );
}


function goToPage(
    page
) {
    activePage =
        Math.min(
            Math.max(
                Number(
                    page
                ),
                1
            ),
            getTotalPages()
        );


    renderArchivePage();


    archiveCollection
        .scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );
}


// ==========================================================
// MUTATIONS
// ==========================================================

async function toggleFavorite(
    id
) {
    const {
        error
    } =
        await window.db.rpc(
            "toggle_favorit",
            {
                kode:
                    archiveAccessCode,

                id_input:
                    id
            }
        );


    if (error) {
        console.error(
            "Favorit gagal diubah:",
            error
        );


        showArchiveToast(
            "Favorit belum dapat diubah."
        );


        return;
    }


    await loadArchive({
        preservePage:
            true
    });
}


async function deleteStory(
    id,
    title
) {
    const confirmed =
        confirm(
            `Hapus “${title}”? Cerita ini akan hilang dari Archive.`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await window.db.rpc(
            "hapus_tulisan",
            {
                kode:
                    archiveAccessCode,

                id_input:
                    id
            }
        );


    if (error) {
        console.error(
            "Gagal menghapus cerita:",
            error
        );


        showArchiveToast(
            "Cerita belum berhasil dihapus."
        );


        return;
    }


    const metadataResult =
        await window.db.rpc(
            "hapus_metadata_tulisan",
            {
                kode:
                    archiveAccessCode,

                id_input:
                    String(
                        id
                    )
            }
        );


    if (
        metadataResult.error
    ) {
        console.warn(
            "Metadata belum terhapus:",
            metadataResult.error
        );
    }


    showArchiveToast(
        "Cerita dihapus dari Archive."
    );


    await loadArchive({
        preservePage:
            true
    });
}


// ==========================================================
// INFO / HELPERS
// ==========================================================

function updateResultInfo() {
    const total =
        allStories.length;

    const found =
        filteredStories.length;


    const start =
        (
            activePage
            - 1
        )
        * ARCHIVE_PAGE_SIZE
        + 1;


    const end =
        Math.min(
            activePage
            * ARCHIVE_PAGE_SIZE,
            found
        );


    const hasFilters =
        Boolean(
            searchInput.value.trim()
        )
        || favoriteFilter.value
            !== "semua"
        || categoryFilter.value
            !== "semua"
        || moodFilter.value
            !== "semua"
        || sortSelect.value
            !== "terbaru";


    clearSearchButton.hidden =
        searchInput.value.trim()
        .length === 0;


    resetFilterButton.hidden =
        !hasFilters;


    resultInfo.textContent =
        hasFilters
            ? `Menampilkan ${start}–${end} dari ${found} hasil · ${total} cerita total.`
            : `Menampilkan ${start}–${end} dari ${found} cerita.`;
}


function resetArchiveFilters() {
    searchInput.value =
        "";

    favoriteFilter.value =
        "semua";

    categoryFilter.value =
        "semua";

    moodFilter.value =
        "semua";

    sortSelect.value =
        "terbaru";

    activePage =
        1;


    applyArchiveFilters(
        false
    );
}


function parseStoryDate(
    value
) {
    if (!value) {
        return new Date(
            Number.NaN
        );
    }


    if (
        value
        instanceof Date
    ) {
        return value;
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


function storyTime(
    value
) {
    const date =
        parseStoryDate(
            value
        );


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();
}


function formatArchiveDate(
    value
) {
    const date =
        parseStoryDate(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return (
            "Tanggal tidak tersedia"
        );
    }


    return date
        .toLocaleDateString(
            "id-ID",
            {
                timeZone:
                    ARCHIVE_WIB,

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );
}


function escapeArchiveHTML(
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


function showArchiveToast(
    message
) {
    archiveToast.textContent =
        message;


    archiveToast.classList.add(
        "show"
    );


    window.clearTimeout(
        showArchiveToast.timer
    );


    showArchiveToast.timer =
        window.setTimeout(
            () => {
                archiveToast.classList.remove(
                    "show"
                );
            },
            2400
        );
}


// ==========================================================
// EVENTS
// ==========================================================

searchInput
    .addEventListener(
        "input",
        () => {
            applyArchiveFilters(
                true
            );
        }
    );


searchInput
    .addEventListener(
        "search",
        () => {
            applyArchiveFilters(
                true
            );
        }
    );


clearSearchButton
    .addEventListener(
        "click",
        () => {
            searchInput.value =
                "";

            searchInput.focus();

            applyArchiveFilters(
                true
            );
        }
    );


[
    favoriteFilter,
    categoryFilter,
    moodFilter,
    sortSelect
]
    .forEach(
        (element) => {
            element.addEventListener(
                "change",
                () => {
                    applyArchiveFilters(
                        true
                    );
                }
            );
        }
    );


resetFilterButton
    .addEventListener(
        "click",
        resetArchiveFilters
    );


previousPageButton
    .addEventListener(
        "click",
        () => {
            goToPage(
                activePage
                - 1
            );
        }
    );


nextPageButton
    .addEventListener(
        "click",
        () => {
            goToPage(
                activePage
                + 1
            );
        }
    );


// ==========================================================
// START
// ==========================================================

async function startArchive() {
    if (!window.db) {
        showArchiveToast(
            "Supabase belum siap."
        );

        return;
    }


    archiveAccessCode =
        await ensureArchiveAccess();


    if (!archiveAccessCode) {
        window.location.href =
            "index.html";

        return;
    }


    await loadArchive();
}


startArchive();
