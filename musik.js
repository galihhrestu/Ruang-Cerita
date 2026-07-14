/**
 * Daftar lima lagu.
 *
 * Bagian "judul" bebas diubah.
 * Bagian "file" harus sesuai nama file MP3.
 */
const daftarLagu = [
    {
        judul: "nadhif - penjaga hati",
        file: "lagu1.mp3"
    },
    {
        judul: "batas senja - nanti kita seperti ini",
        file: "lagu2.mp3"
    },
    {
        judul: "andmesh - hanya rindu",
        file: "lagu3.mp3"
    },
    {
        judul: "andmesh - kumau dia",
        file: "lagu4.mp3"
    },
    {
        judul: "ed sheeran - perfect",
        file: "lagu5.mp3"
    }
];

// Mengambil elemen pemutar musik
const backgroundMusic =
    document.getElementById("backgroundMusic");

const musicToggle =
    document.getElementById("musicToggle");

const musicIcon =
    document.getElementById("musicIcon");

const musicText =
    document.getElementById("musicText");

const musicTitle =
    document.getElementById("musicTitle");

const musicSelect =
    document.getElementById("musicSelect");

const prevMusic =
    document.getElementById("prevMusic");

const nextMusic =
    document.getElementById("nextMusic");

const musicVolume =
    document.getElementById("musicVolume");

// Menjalankan kode jika seluruh elemen tersedia
if (
    backgroundMusic &&
    musicToggle &&
    musicIcon &&
    musicText &&
    musicTitle &&
    musicSelect &&
    prevMusic &&
    nextMusic &&
    musicVolume
) {
    let indeksLagu = Number(
        sessionStorage.getItem("indeksLagu")
    );

    if (
        !Number.isInteger(indeksLagu) ||
        indeksLagu < 0 ||
        indeksLagu >= daftarLagu.length
    ) {
        indeksLagu = 0;
    }

    /**
     * Membuat pilihan lagu.
     */
    daftarLagu.forEach(function (lagu, indeks) {
        const pilihan = document.createElement("option");

        pilihan.value = String(indeks);
        pilihan.textContent =
            `${indeks + 1}. ${lagu.judul}`;

        musicSelect.appendChild(pilihan);
    });

    /**
     * Mengubah tampilan tombol.
     */
    function ubahTampilanTombol(sedangDiputar) {
        if (sedangDiputar) {
            musicIcon.textContent = "❚❚";
            musicText.textContent = "Jeda";
            musicToggle.classList.add("music-playing");
        } else {
            musicIcon.textContent = "▶";
            musicText.textContent = "Putar";
            musicToggle.classList.remove("music-playing");
        }
    }

    /**
     * Menyimpan status pemutar.
     */
    function simpanStatusMusik() {
        sessionStorage.setItem(
            "indeksLagu",
            String(indeksLagu)
        );

        sessionStorage.setItem(
            "waktuMusik",
            String(backgroundMusic.currentTime || 0)
        );

        sessionStorage.setItem(
            "musikSedangDiputar",
            String(!backgroundMusic.paused)
        );
    }

    /**
     * Menjalankan musik.
     */
    function putarMusik() {
        backgroundMusic
            .play()
            .then(function () {
                ubahTampilanTombol(true);

                sessionStorage.setItem(
                    "musikSedangDiputar",
                    "true"
                );
            })
            .catch(function (error) {
                console.error(
                    "Musik tidak dapat diputar:",
                    error
                );

                ubahTampilanTombol(false);

                sessionStorage.setItem(
                    "musikSedangDiputar",
                    "false"
                );
            });
    }

    /**
     * Menjeda musik.
     */
    function jedaMusik() {
        backgroundMusic.pause();

        ubahTampilanTombol(false);

        sessionStorage.setItem(
            "musikSedangDiputar",
            "false"
        );
    }

    /**
     * Memuat sebuah lagu.
     */
    function muatLagu(
        indeks,
        waktuAwal = 0,
        putarSetelahDimuat = false
    ) {
        indeksLagu = indeks;

        const laguDipilih = daftarLagu[indeksLagu];

        musicTitle.textContent = laguDipilih.judul;
        musicSelect.value = String(indeksLagu);

        backgroundMusic.src = laguDipilih.file;
        backgroundMusic.load();

        sessionStorage.setItem(
            "indeksLagu",
            String(indeksLagu)
        );

        backgroundMusic.addEventListener(
            "loadedmetadata",
            function () {
                const waktuValid =
                    Number(waktuAwal);

                if (
                    Number.isFinite(waktuValid) &&
                    waktuValid > 0 &&
                    waktuValid < backgroundMusic.duration
                ) {
                    backgroundMusic.currentTime =
                        waktuValid;
                }

                if (putarSetelahDimuat) {
                    putarMusik();
                }
            },
            {
                once: true
            }
        );
    }

    /**
     * Berpindah lagu.
     */
    function pindahLagu(perubahanIndeks) {
        const sebelumnyaDiputar =
            !backgroundMusic.paused;

        let indeksBaru =
            indeksLagu + perubahanIndeks;

        // Kembali ke lagu terakhir
        if (indeksBaru < 0) {
            indeksBaru =
                daftarLagu.length - 1;
        }

        // Kembali ke lagu pertama
        if (indeksBaru >= daftarLagu.length) {
            indeksBaru = 0;
        }

        muatLagu(
            indeksBaru,
            0,
            sebelumnyaDiputar
        );
    }

    /**
     * Tombol putar dan jeda.
     */
    musicToggle.addEventListener(
        "click",
        function () {
            if (backgroundMusic.paused) {
                putarMusik();
            } else {
                jedaMusik();
            }
        }
    );

    /**
     * Tombol lagu sebelumnya.
     */
    prevMusic.addEventListener(
        "click",
        function () {
            pindahLagu(-1);
        }
    );

    /**
     * Tombol lagu berikutnya.
     */
    nextMusic.addEventListener(
        "click",
        function () {
            pindahLagu(1);
        }
    );

    /**
     * Memilih lagu melalui daftar.
     */
    musicSelect.addEventListener(
        "change",
        function () {
            const sebelumnyaDiputar =
                !backgroundMusic.paused;

            const indeksPilihan =
                Number(musicSelect.value);

            muatLagu(
                indeksPilihan,
                0,
                sebelumnyaDiputar
            );
        }
    );

    /**
     * Otomatis memutar lagu berikutnya.
     */
    backgroundMusic.addEventListener(
        "ended",
        function () {
            pindahLagu(1);
        }
    );

    /**
     * Menampilkan kesalahan jika file tidak ditemukan.
     */
    backgroundMusic.addEventListener(
        "error",
        function () {
            musicTitle.textContent =
                "File lagu tidak ditemukan";

            ubahTampilanTombol(false);

            console.error(
                "Periksa nama dan lokasi file:",
                daftarLagu[indeksLagu].file
            );
        }
    );

    /**
     * Mengatur volume.
     */
    const volumeTersimpan =
        localStorage.getItem("volumeMusik");

    if (volumeTersimpan !== null) {
        const nilaiVolume =
            Number(volumeTersimpan);

        if (
            Number.isFinite(nilaiVolume) &&
            nilaiVolume >= 0 &&
            nilaiVolume <= 1
        ) {
            musicVolume.value =
                String(nilaiVolume);
        }
    }

    backgroundMusic.volume =
        Number(musicVolume.value);

    musicVolume.addEventListener(
        "input",
        function () {
            const volumeBaru =
                Number(musicVolume.value);

            backgroundMusic.volume =
                volumeBaru;

            localStorage.setItem(
                "volumeMusik",
                String(volumeBaru)
            );
        }
    );

    /**
     * Menyimpan posisi musik secara berkala.
     */
    backgroundMusic.addEventListener(
        "timeupdate",
        function () {
            sessionStorage.setItem(
                "waktuMusik",
                String(backgroundMusic.currentTime)
            );
        }
    );

    /**
     * Menyimpan posisi sebelum pindah halaman.
     */
    window.addEventListener(
        "beforeunload",
        function () {
            simpanStatusMusik();
        }
    );

    /**
     * Mengambil status musik sebelumnya.
     */
    const waktuTersimpan =
        Number(
            sessionStorage.getItem("waktuMusik")
        ) || 0;

    const sebelumnyaDiputar =
        sessionStorage.getItem(
            "musikSedangDiputar"
        ) === "true";

    // Memuat lagu pertama atau lagu terakhir
    muatLagu(
        indeksLagu,
        waktuTersimpan,
        sebelumnyaDiputar
    );

    ubahTampilanTombol(false);
}