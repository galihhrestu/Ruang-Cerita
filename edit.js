// =====================================
// EDIT TULISAN - RUANG CERITA
// =====================================

const kode = localStorage.getItem("kodeRuangCerita");
const parameter = new URLSearchParams(window.location.search);
const id = parameter.get("id");
const inputJudul = document.getElementById("editJudul");
const inputIsi = document.getElementById("editIsi");
const form = document.getElementById("formEdit");
const infoEdit = document.getElementById("infoEdit");
const ZONA_WAKTU_WIB = "Asia/Jakarta";

async function ambilData() {
    if (!kode || !id) {
        infoEdit.innerHTML = "<p>Kode akses atau ID tulisan tidak tersedia.</p>";
        return;
    }

    const { data, error } = await window.db.rpc("ambil_tulisan", { kode });

    if (error) {
        console.error("Gagal mengambil tulisan:", error);
        infoEdit.innerHTML = "<p>Gagal mengambil data tulisan.</p>";
        return;
    }

    const tulisan = (Array.isArray(data) ? data : []).find((item) => {
        return String(item.id) === String(id);
    });

    if (!tulisan) {
        alert("Tulisan tidak ditemukan");
        return;
    }

    inputJudul.value = tulisan.judul;
    inputIsi.value = tulisan.isi;

    infoEdit.innerHTML = `
        <p>Dibuat: ${formatTanggalWaktuWIB(tulisan.created_at)}</p>
        <p>
            Terakhir diedit:
            ${tulisan.updated_at ? formatTanggalWaktuWIB(tulisan.updated_at) : "Belum pernah diedit"}
        </p>
    `;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const judulBaru = inputJudul.value.trim();
    const isiBaru = inputIsi.value.trim();

    if (!judulBaru || !isiBaru) {
        alert("Judul dan isi tulisan tidak boleh kosong");
        return;
    }

    const { error } = await window.db.rpc("edit_tulisan", {
        kode,
        id_input: id,
        judul_baru: judulBaru,
        isi_baru: isiBaru
    });

    if (error) {
        console.error("Gagal menyimpan perubahan:", error);
        alert("Gagal menyimpan perubahan");
        return;
    }

    alert("Perubahan berhasil disimpan");
    window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
});

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

function formatTanggalWaktuWIB(tanggal) {
    const waktu = parseWaktuSupabase(tanggal);

    if (Number.isNaN(waktu.getTime())) {
        return "Waktu tidak tersedia";
    }

    return `${waktu.toLocaleString("id-ID", {
        timeZone: ZONA_WAKTU_WIB,
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    })} WIB`;
}

ambilData();
