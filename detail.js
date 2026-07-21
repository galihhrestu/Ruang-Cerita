// =====================================
// DETAIL TULISAN - RUANG CERITA
// =====================================

const detailTulisan = document.getElementById("detailTulisan");
const parameter = new URLSearchParams(window.location.search);
const id = parameter.get("id");
const kode = localStorage.getItem("kodeRuangCerita");
const ZONA_WAKTU_WIB = "Asia/Jakarta";

async function bukaDetail() {
    if (!kode || !id) {
        tampilkanKesalahan("Cerita tidak dapat dibuka", "Kode akses atau ID cerita tidak tersedia.");
        return;
    }

    const { data, error } = await window.db.rpc("ambil_tulisan", { kode });

    if (error) {
        console.error("Gagal membuka cerita:", error);
        tampilkanKesalahan("Gagal membuka cerita", "Periksa koneksi internet lalu coba lagi.");
        return;
    }

    const tulisan = (Array.isArray(data) ? data : []).find((item) => {
        return String(item.id) === String(id);
    });

    if (!tulisan) {
        tampilkanKesalahan("Cerita tidak ditemukan", "Cerita mungkin sudah dihapus atau ID tidak sesuai.");
        return;
    }

    tampilkanCerita(tulisan);
}

function tampilkanCerita(tulisan) {
    document.title = `${tulisan.judul} - Ruang Cerita`;

    detailTulisan.innerHTML = `
        <div class="surat-wrapper">
            <div class="surat-header">
                <div class="surat-icon">✦</div>

                <h2>${escapeHTML(tulisan.judul)}</h2>

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

    // Timestamp tanpa zona dari Supabase dianggap UTC sebelum diubah ke WIB.
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

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

bukaDetail();
