// ==========================================================
// RUANG CERITA — CELESTIAL READING ROOM V1
// ==========================================================

const detailTulisan =
    document.getElementById(
        "detailTulisan"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const readingProgress =
    document.getElementById(
        "readingProgress"
    );

const starField =
    document.getElementById(
        "starField"
    );

const parameter =
    new URLSearchParams(
        window.location.search
    );

const id =
    parameter.get(
        "id"
    );

const kode =
    localStorage.getItem(
        "kodeRuangCerita"
    );

const ZONA_WAKTU_WIB =
    "Asia/Jakarta";

const IKON_MOOD = {
    "Bahagia": "😊",
    "Penuh Cinta": "❤️",
    "Terharu": "🥺",
    "Sedih": "😔",
    "Bersyukur": "🌱",
    "Tenang": "😌",
    "Belum dipilih": "○"
};


// ==========================================================
// LOAD STORY
// ==========================================================

async function bukaDetail() {
    if (
        !kode
        || !id
    ) {
        tampilkanKesalahan(
            "Cerita tidak dapat dibuka",
            "Kode akses atau ID cerita tidak tersedia."
        );

        return;
    }

    if (!window.db) {
        tampilkanKesalahan(
            "Ruang Cerita belum siap",
            "Koneksi Supabase belum tersedia."
        );

        return;
    }


    try {
        const [
            hasilTulisan,
            hasilMetadata
        ] =
            await Promise.all([
                window.db.rpc(
                    "ambil_tulisan",
                    {
                        kode
                    }
                ),

                window.db.rpc(
                    "ambil_metadata_tulisan",
                    {
                        kode
                    }
                )
            ]);


        if (
            hasilTulisan.error
        ) {
            console.error(
                "Gagal membuka cerita:",
                hasilTulisan.error
            );

            tampilkanKesalahan(
                "Gagal membuka cerita",
                "Periksa koneksi internet lalu coba lagi."
            );

            return;
        }


        const tulisan =
            (
                Array.isArray(
                    hasilTulisan.data
                )
                    ? hasilTulisan.data
                    : []
            )
                .find(
                    (item) =>
                        String(
                            item.id
                        )
                        === String(
                            id
                        )
                );


        if (!tulisan) {
            tampilkanKesalahan(
                "Cerita tidak ditemukan",
                "Cerita mungkin sudah dihapus atau ID tidak sesuai."
            );

            return;
        }


        const metadata =
            hasilMetadata.error
                ? null
                : (
                    Array.isArray(
                        hasilMetadata.data
                    )
                        ? hasilMetadata.data
                        : []
                )
                    .find(
                        (item) =>
                            String(
                                item.cerita_id
                            )
                            === String(
                                id
                            )
                    );


        if (
            hasilMetadata.error
        ) {
            console.warn(
                "Kategori dan mood belum dapat dimuat:",
                hasilMetadata.error
            );
        }


        tampilkanCerita({
            ...tulisan,

            kategori:
                metadata?.kategori
                || "Belum dikategorikan",

            mood:
                metadata?.mood
                || "Belum dipilih"
        });

    } catch (error) {
        console.error(
            "Terjadi kesalahan saat membuka cerita:",
            error
        );

        tampilkanKesalahan(
            "Cerita belum dapat dibuka",
            "Terjadi kesalahan. Coba muat ulang halaman."
        );
    }
}


// ==========================================================
// RENDER STORY
// ==========================================================

function tampilkanCerita(
    tulisan
) {
    document.title =
        `${tulisan.judul} — Ruang Cerita`;


    const paragraphs =
        buatParagraf(
            tulisan.isi
        );


    detailTulisan.innerHTML =
        `
            <header class="story-header">

                <div
                    class="story-moon-symbol"
                    aria-hidden="true"
                ></div>

                <p class="story-eyebrow">
                    A STORY FROM OUR UNIVERSE
                </p>

                <h1>
                    ${
                        escapeHTML(
                            tulisan.judul
                        )
                    }
                </h1>


                <div class="story-metadata">

                    <span
                        class="story-badge category"
                    >
                        ${
                            ikonKategori(
                                tulisan.kategori
                            )
                        }

                        ${
                            escapeHTML(
                                tulisan.kategori
                            )
                        }
                    </span>


                    <span
                        class="story-badge mood"
                    >
                        ${
                            ikonMood(
                                tulisan.mood
                            )
                        }

                        ${
                            escapeHTML(
                                tulisan.mood
                            )
                        }
                    </span>

                </div>


                <div class="story-date-line">

                    <span class="story-date-item">
                        ◷
                        ${
                            formatTanggalWIB(
                                tulisan.created_at
                            )
                        }
                    </span>

                    <span class="story-date-divider">
                        ·
                    </span>

                    <span class="story-date-item">
                        ◴
                        pukul
                        ${
                            formatJamWIB(
                                tulisan.created_at
                            )
                        }
                        WIB
                    </span>

                </div>

            </header>


            <div
                class="celestial-divider"
                aria-hidden="true"
            >
                <span></span>
                <b>✦</b>
                <span></span>
            </div>


            <section class="story-content">
                ${paragraphs}
            </section>


            <footer class="story-ending">

                <div
                    class="story-ending-symbols"
                    aria-hidden="true"
                >
                    <span>✦</span>

                    <span class="story-ending-heart">
                        ♥
                    </span>

                    <span>✦</span>
                </div>

                <p>
                    persembahan dari hati
                </p>

            </footer>
        `;
}


function buatParagraf(
    isi
) {
    const text =
        String(
            isi || ""
        )
            .replace(
                /\r\n/g,
                "\n"
            )
            .trim();


    if (!text) {
        return `
            <p>
                Cerita ini belum memiliki isi.
            </p>
        `;
    }


    const paragraphs =
        text
            .split(
                /\n\s*\n/
            )
            .map(
                (paragraph) =>
                    paragraph.trim()
            )
            .filter(Boolean);


    if (
        paragraphs.length
        === 1
    ) {
        return (
            `<p>${
                escapeHTML(
                    paragraphs[0]
                )
                    .replace(
                        /\n/g,
                        "<br>"
                    )
            }</p>`
        );
    }


    return paragraphs
        .map(
            (paragraph) =>
                `
                    <p>
                        ${
                            escapeHTML(
                                paragraph
                            )
                                .replace(
                                    /\n/g,
                                    "<br>"
                                )
                        }
                    </p>
                `
        )
        .join("");
}


// ==========================================================
// ERROR
// ==========================================================

function tampilkanKesalahan(
    judul,
    keterangan
) {
    detailTulisan.innerHTML =
        `
            <div class="story-error">

                <div
                    class="story-moon-symbol"
                    aria-hidden="true"
                ></div>

                <h2>
                    ${escapeHTML(judul)}
                </h2>

                <p>
                    ${escapeHTML(keterangan)}
                </p>

            </div>
        `;
}


// ==========================================================
// DATE WIB
// ==========================================================

function parseWaktuSupabase(
    tanggal
) {
    if (!tanggal) {
        return new Date(
            Number.NaN
        );
    }


    if (
        tanggal
        instanceof Date
    ) {
        return tanggal;
    }


    const teks =
        String(
            tanggal
        )
            .trim()
            .replace(
                " ",
                "T"
            );


    const memilikiZonaWaktu =
        /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i
            .test(
                teks
            );


    return new Date(
        memilikiZonaWaktu
            ? teks
            : `${teks}Z`
    );
}


function formatTanggalWIB(
    tanggal
) {
    const waktu =
        parseWaktuSupabase(
            tanggal
        );


    if (
        Number.isNaN(
            waktu.getTime()
        )
    ) {
        return (
            "Tanggal tidak tersedia"
        );
    }


    return waktu
        .toLocaleDateString(
            "id-ID",
            {
                timeZone:
                    ZONA_WAKTU_WIB,

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );
}


function formatJamWIB(
    tanggal
) {
    const waktu =
        parseWaktuSupabase(
            tanggal
        );


    if (
        Number.isNaN(
            waktu.getTime()
        )
    ) {
        return "--.--";
    }


    return waktu
        .toLocaleTimeString(
            "id-ID",
            {
                timeZone:
                    ZONA_WAKTU_WIB,

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hourCycle:
                    "h23"
            }
        );
}


// ==========================================================
// ICONS
// ==========================================================

function ikonMood(
    mood
) {
    return (
        IKON_MOOD[
            mood
        ]
        || "○"
    );
}


function ikonKategori(
    kategori
) {
    const map = {
        "Kenangan": "✦",
        "Perjalanan": "⌖",
        "Tentang Kita": "♥",
        "Keluarga": "⌂",
        "Pekerjaan": "▣",
        "Harapan": "☾",
        "Lainnya": "◇",
        "Belum dikategorikan": "○"
    };


    return (
        map[
            kategori
        ]
        || "◇"
    );
}


// ==========================================================
// ESCAPE
// ==========================================================

function escapeHTML(
    text
) {
    return String(
        text ?? ""
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
// STARS
// ==========================================================

function createStarField() {
    if (!starField) {
        return;
    }


    const count =
        window.innerWidth
        <= 760
            ? 75
            : 145;


    let seed =
        7242026;


    function random() {
        seed =
            (
                seed
                * 1664525
                + 1013904223
            )
            >>> 0;


        return (
            seed
            / 4294967296
        );
    }


    const fragment =
        document
            .createDocumentFragment();


    for (
        let index = 0;
        index < count;
        index++
    ) {
        const star =
            document
                .createElement(
                    "i"
                );


        star.className =
            (
                random()
                > 0.88
            )
                ? "sky-star featured"
                : "sky-star";


        const size =
            (
                random()
                > 0.90
            )
                ? (
                    2.1
                    + random()
                    * 1.6
                )
                : (
                    0.7
                    + random()
                    * 1.6
                );


        star.style.left =
            `${random() * 100}%`;

        star.style.top =
            `${random() * 100}%`;

        star.style.setProperty(
            "--size",
            `${size}px`
        );

        star.style.setProperty(
            "--alpha",
            String(
                0.25
                + random()
                * 0.72
            )
        );

        star.style.setProperty(
            "--duration",
            `${
                2.2
                + random()
                * 4.6
            }s`
        );

        star.style.setProperty(
            "--delay",
            `-${
                random()
                * 5
            }s`
        );


        fragment.appendChild(
            star
        );
    }


    starField.innerHTML =
        "";

    starField.appendChild(
        fragment
    );
}


// ==========================================================
// READING PROGRESS
// ==========================================================

function updateReadingProgress() {
    if (!readingProgress) {
        return;
    }


    const scrollTop =
        window.scrollY
        || document.documentElement.scrollTop;


    const height =
        document.documentElement.scrollHeight
        - window.innerHeight;


    const progress =
        height > 0
            ? (
                scrollTop
                / height
            )
            * 100
            : 0;


    readingProgress.style.width =
        `${
            Math.max(
                0,
                Math.min(
                    100,
                    progress
                )
            )
        }%`;
}


// ==========================================================
// EVENTS
// ==========================================================

logoutButton
    ?.addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                "kodeRuangCerita"
            );

            window.location.href =
                "index.html";
        }
    );


window.addEventListener(
    "scroll",
    updateReadingProgress,
    {
        passive: true
    }
);


window.addEventListener(
    "resize",
    () => {
        createStarField();
        updateReadingProgress();
    }
);


// Close music settings when clicking outside
document.addEventListener(
    "click",
    (event) => {
        const options =
            document.querySelector(
                ".music-options"
            );


        if (
            options?.open
            && !options.contains(
                event.target
            )
        ) {
            options.open =
                false;
        }
    }
);


// ==========================================================
// START
// ==========================================================

createStarField();
updateReadingProgress();
bukaDetail();
