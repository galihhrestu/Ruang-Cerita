document.addEventListener("DOMContentLoaded", async function () {

    // =====================================================
    // RUANG CERITA — MUSIC SYSTEM V1 (SUPABASE STORAGE)
    // =====================================================

    const BUCKET_MUSIK = "musik";

    const audio = document.getElementById("backgroundMusic");
    const judulLagu = document.getElementById("musicTitle");
    const tombolPutar = document.getElementById("musicToggle");
    const ikonMusik = document.getElementById("musicIcon");
    const teksMusik = document.getElementById("musicText");
    const tombolPrev = document.getElementById("prevMusic");
    const tombolNext = document.getElementById("nextMusic");
    const pilihanLagu = document.getElementById("musicSelect");
    const volume = document.getElementById("musicVolume");

    if (!audio) {
        console.error("Audio tidak ditemukan");
        return;
    }

    if (!window.db) {
        console.error("Supabase belum siap. Pastikan supabase-config.js dimuat sebelum musik.js");
        return;
    }

    let daftarLagu = [];
    let indeksLagu = 0;
    let posisiTerakhir = 0;
    let timerSimpanPosisi = null;

    const musikSebelumnyaBerjalan =
        localStorage.getItem("musikBerjalan") === "true";

    function updateButton(status) {
        if (ikonMusik) {
            ikonMusik.textContent = status ? "❚❚" : "▶";
        }

        if (teksMusik) {
            teksMusik.textContent = status ? "Jeda" : "Putar";
        }
    }

    function setKontrolAktif(aktif) {
        [tombolPutar, tombolPrev, tombolNext, pilihanLagu, volume]
            .filter(Boolean)
            .forEach((el) => {
                el.disabled = !aktif;
            });
    }

    function judulTampil(lagu) {
        return lagu.artis
            ? `${lagu.artis} - ${lagu.judul}`
            : lagu.judul;
    }

    async function ambilDaftarMusik() {
        const { data, error } = await window.db
            .from("musik")
            .select("id, judul, artis, file_path, urutan")
            .eq("aktif", true)
            .order("urutan", { ascending: true })
            .order("id", { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((lagu) => {
            const { data: urlData } = window.db.storage
                .from(BUCKET_MUSIK)
                .getPublicUrl(lagu.file_path);

            return {
                ...lagu,
                file: urlData.publicUrl
            };
        });
    }

    function isiPilihanLagu() {
        if (!pilihanLagu) return;

        pilihanLagu.innerHTML = "";

        daftarLagu.forEach((lagu, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent = `${index + 1}. ${judulTampil(lagu)}`;
            pilihanLagu.appendChild(option);
        });
    }

    function cariIndeksTersimpan() {
        const pathTersimpan =
            localStorage.getItem("musikFilePath");

        if (pathTersimpan) {
            const index = daftarLagu.findIndex(
                (lagu) => lagu.file_path === pathTersimpan
            );

            if (index >= 0) {
                return index;
            }
        }

        const indexLama =
            Number(localStorage.getItem("indeksLagu"));

        if (
            Number.isInteger(indexLama) &&
            indexLama >= 0 &&
            indexLama < daftarLagu.length
        ) {
            return indexLama;
        }

        return 0;
    }

    function ambilPosisiTersimpan(lagu) {
        const pathPosisi =
            localStorage.getItem("posisiMusikPath");

        const nilai =
            Number(localStorage.getItem("posisiMusik"));

        if (
            pathPosisi === lagu.file_path &&
            Number.isFinite(nilai) &&
            nilai >= 0
        ) {
            return nilai;
        }

        return 0;
    }

    async function play() {
        try {
            await audio.play();
            updateButton(true);
            localStorage.setItem("musikBerjalan", "true");
        } catch (error) {
            console.log("Autoplay diblok browser:", error);
            updateButton(false);
        }
    }

    function pause() {
        audio.pause();
        updateButton(false);
        localStorage.setItem("musikBerjalan", "false");
    }

    function simpanPosisiSekarang() {
        if (!daftarLagu.length) return;

        const lagu = daftarLagu[indeksLagu];

        localStorage.setItem(
            "posisiMusik",
            String(audio.currentTime || 0)
        );

        localStorage.setItem(
            "posisiMusikPath",
            lagu.file_path
        );
    }

    function loadLagu(index, autoplay = false, pulihkanPosisi = false) {
        if (!daftarLagu.length) return;

        if (index < 0) {
            index = daftarLagu.length - 1;
        }

        if (index >= daftarLagu.length) {
            index = 0;
        }

        indeksLagu = index;

        const lagu = daftarLagu[indeksLagu];

        audio.src = lagu.file;

        if (judulLagu) {
            judulLagu.textContent = judulTampil(lagu);
        }

        if (pilihanLagu) {
            pilihanLagu.value = String(indeksLagu);
        }

        localStorage.setItem(
            "indeksLagu",
            String(indeksLagu)
        );

        localStorage.setItem(
            "musikFilePath",
            lagu.file_path
        );

        posisiTerakhir = pulihkanPosisi
            ? ambilPosisiTersimpan(lagu)
            : 0;

        if (!pulihkanPosisi) {
            localStorage.setItem("posisiMusik", "0");
            localStorage.setItem(
                "posisiMusikPath",
                lagu.file_path
            );
        }

        audio.load();

        audio.addEventListener(
            "loadedmetadata",
            function () {
                if (
                    Number.isFinite(posisiTerakhir) &&
                    posisiTerakhir > 0 &&
                    posisiTerakhir < audio.duration
                ) {
                    audio.currentTime = posisiTerakhir;
                }

                if (autoplay) {
                    play();
                }
            },
            { once: true }
        );
    }

    if (tombolPutar) {
        tombolPutar.addEventListener("click", function () {
            if (audio.paused) {
                play();
            } else {
                pause();
            }
        });
    }

    if (tombolNext) {
        tombolNext.addEventListener("click", function () {
            loadLagu(indeksLagu + 1, true, false);
        });
    }

    if (tombolPrev) {
        tombolPrev.addEventListener("click", function () {
            loadLagu(indeksLagu - 1, true, false);
        });
    }

    if (pilihanLagu) {
        pilihanLagu.addEventListener("change", function () {
            loadLagu(
                Number(pilihanLagu.value),
                true,
                false
            );
        });
    }

    // Simpan posisi maksimal setiap 3 detik agar localStorage tidak ditulis terlalu sering.
    audio.addEventListener("timeupdate", function () {
        if (timerSimpanPosisi) return;

        timerSimpanPosisi = window.setTimeout(
            function () {
                simpanPosisiSekarang();
                timerSimpanPosisi = null;
            },
            3000
        );
    });

    audio.addEventListener("playing", function () {
        updateButton(true);
    });

    audio.addEventListener("pause", function () {
        updateButton(false);
        simpanPosisiSekarang();
    });

    audio.addEventListener("ended", function () {
        loadLagu(indeksLagu + 1, true, false);
    });

    window.addEventListener("beforeunload", function () {
        simpanPosisiSekarang();
    });

    let volumeAwal =
        Number(localStorage.getItem("volumeMusik"));

    if (
        !Number.isFinite(volumeAwal) ||
        volumeAwal < 0 ||
        volumeAwal > 1
    ) {
        volumeAwal = 0.35;
    }

    audio.volume = volumeAwal;

    if (volume) {
        volume.value = String(volumeAwal);

        volume.addEventListener("input", function () {
            const nilai = Number(volume.value);

            if (!Number.isFinite(nilai)) return;

            audio.volume = nilai;
            localStorage.setItem(
                "volumeMusik",
                String(nilai)
            );
        });
    }

    // =====================================================
    // START
    // =====================================================

    setKontrolAktif(false);

    if (judulLagu) {
        judulLagu.textContent = "Memuat daftar musik...";
    }

    try {
        daftarLagu = await ambilDaftarMusik();

        if (!daftarLagu.length) {
            if (judulLagu) {
                judulLagu.textContent =
                    "Belum ada musik di Supabase";
            }

            console.warn(
                "Tabel musik kosong atau belum ada lagu aktif."
            );

            return;
        }

        isiPilihanLagu();

        indeksLagu = cariIndeksTersimpan();

        setKontrolAktif(true);

        loadLagu(
            indeksLagu,
            musikSebelumnyaBerjalan,
            true
        );
    } catch (error) {
        console.error(
            "Gagal mengambil musik dari Supabase:",
            error
        );

        if (judulLagu) {
            judulLagu.textContent =
                "Musik gagal dimuat";
        }
    }
});
