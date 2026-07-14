// Mengambil elemen musik dari halaman
const backgroundMusic =
    document.getElementById("backgroundMusic");

const musicToggle =
    document.getElementById("musicToggle");

const musicIcon =
    document.getElementById("musicIcon");

const musicText =
    document.getElementById("musicText");

// Memastikan elemen tersedia
if (
    backgroundMusic &&
    musicToggle &&
    musicIcon &&
    musicText
) {
    // Mengatur volume awal menjadi 35%
    backgroundMusic.volume = 0.35;

    /**
     * Mengubah tampilan tombol musik.
     */
    function ubahTampilanMusik(sedangDiputar) {
        if (sedangDiputar) {
            musicIcon.textContent = "❚❚";
            musicText.textContent = "Jeda Musik";
            musicToggle.classList.add("music-playing");
        } else {
            musicIcon.textContent = "▶";
            musicText.textContent = "Putar Musik";
            musicToggle.classList.remove("music-playing");
        }
    }

    /**
     * Mengambil waktu musik terakhir.
     */
    const waktuMusikTersimpan =
        sessionStorage.getItem("waktuMusik");

    if (waktuMusikTersimpan) {
        backgroundMusic.addEventListener(
            "loadedmetadata",
            function () {
                const waktuTerakhir =
                    Number(waktuMusikTersimpan);

                if (
                    !isNaN(waktuTerakhir) &&
                    waktuTerakhir < backgroundMusic.duration
                ) {
                    backgroundMusic.currentTime =
                        waktuTerakhir;
                }
            }
        );
    }

    /**
     * Tombol putar dan jeda.
     */
    musicToggle.addEventListener("click", function () {
        if (backgroundMusic.paused) {
            backgroundMusic
                .play()
                .then(function () {
                    ubahTampilanMusik(true);

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

                    alert(
                        "Musik belum dapat diputar. " +
                        "Pastikan file musik.mp3 tersedia."
                    );
                });
        } else {
            backgroundMusic.pause();

            ubahTampilanMusik(false);

            sessionStorage.setItem(
                "musikSedangDiputar",
                "false"
            );
        }
    });

    /**
     * Menyimpan posisi musik sebelum pindah halaman.
     */
    window.addEventListener("beforeunload", function () {
        sessionStorage.setItem(
            "waktuMusik",
            String(backgroundMusic.currentTime)
        );

        sessionStorage.setItem(
            "musikSedangDiputar",
            String(!backgroundMusic.paused)
        );
    });

    /**
     * Mencoba melanjutkan musik ketika pindah halaman.
     */
    const statusMusik =
        sessionStorage.getItem("musikSedangDiputar");

    if (statusMusik === "true") {
        backgroundMusic
            .play()
            .then(function () {
                ubahTampilanMusik(true);
            })
            .catch(function () {
                // Browser mungkin melarang musik berjalan otomatis
                ubahTampilanMusik(false);
            });
    } else {
        ubahTampilanMusik(false);
    }
}