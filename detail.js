// =====================================
// DETAIL TULISAN - RUANG CERITA
// =====================================

const detailTulisan = document.getElementById("detailTulisan");
const logoutButton = document.getElementById("logoutButton");
const parameter = new URLSearchParams(window.location.search);
const id = parameter.get("id");
const kode = localStorage.getItem("kodeRuangCerita");
const ZONA_WAKTU_WIB = "Asia/Jakarta";

const IKON_MOOD = {
    "Bahagia": "😊",
    "Penuh Cinta": "❤️",
    "Terharu": "🥺",
    "Sedih": "😔",
    "Bersyukur": "🌱",
    "Tenang": "😌",
    "Belum dipilih": "○"
};

async function bukaDetail() {
    if (!kode || !id) {
        tampilkanKesalahan("Cerita tidak dapat dibuka", "Kode akses atau ID cerita tidak tersedia.");
        return;
    }

    const [hasilTulisan, hasilMetadata] = await Promise.all([
        window.db.rpc("ambil_tulisan", { kode }),
        window.db.rpc("ambil_metadata_tulisan", { kode })
    ]);

    if (hasilTulisan.error) {
        console.error("Gagal membuka cerita:", hasilTulisan.error);
        tampilkanKesalahan("Gagal membuka cerita", "Periksa koneksi internet lalu coba lagi.");
        return;
    }

    const tulisan = (Array.isArray(hasilTulisan.data) ? hasilTulisan.data : []).find((item) => {
        return String(item.id) === String(id);
    });

    if (!tulisan) {
        tampilkanKesalahan("Cerita tidak ditemukan", "Cerita mungkin sudah dihapus atau ID tidak sesuai.");
        return;
    }

    const metadata = hasilMetadata.error
        ? null
        : (Array.isArray(hasilMetadata.data) ? hasilMetadata.data : []).find((item) => {
            return String(item.cerita_id) === String(id);
        });

    if (hasilMetadata.error) {
        console.warn("Kategori dan mood belum dapat dimuat:", hasilMetadata.error);
    }

    tampilkanCerita({
        ...tulisan,
        kategori: metadata?.kategori || "Belum dikategorikan",
        mood: metadata?.mood || "Belum dipilih"
    });
}

function tampilkanCerita(tulisan) {
    document.title = `${tulisan.judul} - Ruang Cerita`;

    detailTulisan.innerHTML = `
        <div class="surat-wrapper">
            <div class="surat-header">
                <div class="surat-icon">✦</div>

                <h2>${escapeHTML(tulisan.judul)}</h2>

                <div class="metadata-cerita metadata-detail">
                    <span class="badge-cerita badge-kategori">${escapeHTML(tulisan.kategori)}</span>
                    <span class="badge-cerita badge-mood">${ikonMood(tulisan.mood)} ${escapeHTML(tulisan.mood)}</span>
                </div>

                <p class="surat-tanggal">
                    ${formatTanggalWIB(tulisan.created_at)}
                    <br>
                    pukul ${formatJamWIB(tulisan.created_at)} WIB
                </p>
            </div>

            <div class="garis-surat"></div>

            <div class="surat-isi">
                ${escapeHTML(tulisan.isi).replace(/\n/g, "<br><br>")}
            </div>

            <div class="penutup-surat">
                <span>♥</span>
                <p>persembahan dari hati</p>
            </div>
        </div>
    `;
}

function tampilkanKesalahan(judul, keterangan) {
    detailTulisan.innerHTML = `
        <div class="pesan-daftar pesan-error">
            <strong>${escapeHTML(judul)}</strong>
            <span>${escapeHTML(keterangan)}</span>
        </div>
    `;
}

function parseWaktuSupabase(tanggal) {
    if (!tanggal) {
        return new Date(Number.NaN);
    }

    if (tanggal instanceof Date) {
        return tanggal;
    }

    const teks = String(tanggal).trim().replace(" ", "T");
    const memilikiZonaWaktu = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(teks);

    return new Date(memilikiZonaWaktu ? teks : `${teks}Z`);
}

function formatTanggalWIB(tanggal) {
    const waktu = parseWaktuSupabase(tanggal);

    if (Number.isNaN(waktu.getTime())) {
        return "Tanggal tidak tersedia";
    }

    return waktu.toLocaleDateString("id-ID", {
        timeZone: ZONA_WAKTU_WIB,
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatJamWIB(tanggal) {
    const waktu = parseWaktuSupabase(tanggal);

    if (Number.isNaN(waktu.getTime())) {
        return "--.--";
    }

    return waktu.toLocaleTimeString("id-ID", {
        timeZone: ZONA_WAKTU_WIB,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    });
}

function ikonMood(mood) {
    return IKON_MOOD[mood] || "○";
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("kodeRuangCerita");
    window.location.href = "index.html";
});

bukaDetail();
