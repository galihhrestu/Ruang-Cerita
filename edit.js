// =====================================
// EDIT TULISAN - RUANG CERITA
// =====================================

const kode = localStorage.getItem("kodeRuangCerita");
const parameter = new URLSearchParams(window.location.search);
const id = parameter.get("id");
const inputJudul = document.getElementById("editJudul");
const inputIsi = document.getElementById("editIsi");
const inputKategori = document.getElementById("editKategori");
const inputMood = document.getElementById("editMood");
const form = document.getElementById("formEdit");
const infoEdit = document.getElementById("infoEdit");
const ZONA_WAKTU_WIB = "Asia/Jakarta";

async function ambilData() {
    if (!kode || !id) {
        infoEdit.innerHTML = "<p>Kode akses atau ID tulisan tidak tersedia.</p>";
        return;
    }

    const [hasilTulisan, hasilMetadata] = await Promise.all([
        window.db.rpc("ambil_tulisan", { kode }),
        window.db.rpc("ambil_metadata_tulisan", { kode })
    ]);

    if (hasilTulisan.error) {
        console.error("Gagal mengambil tulisan:", hasilTulisan.error);
        infoEdit.innerHTML = "<p>Gagal mengambil data tulisan.</p>";
        return;
    }

    const tulisan = (Array.isArray(hasilTulisan.data) ? hasilTulisan.data : []).find((item) => {
        return String(item.id) === String(id);
    });

    if (!tulisan) {
        alert("Tulisan tidak ditemukan");
        window.location.href = "index.html";
        return;
    }

    const metadata = hasilMetadata.error
        ? null
        : (Array.isArray(hasilMetadata.data) ? hasilMetadata.data : []).find((item) => {
            return String(item.cerita_id) === String(id);
        });

    inputJudul.value = tulisan.judul;
    inputIsi.value = tulisan.isi;
    inputKategori.value = metadata?.kategori || "";
    inputMood.value = metadata?.mood || "";

    infoEdit.innerHTML = `
        <p>Dibuat: ${formatTanggalWaktuWIB(tulisan.created_at)}</p>
        <p>
            Terakhir diedit:
            ${tulisan.updated_at ? formatTanggalWaktuWIB(tulisan.updated_at) : "Belum pernah diedit"}
        </p>
        ${hasilMetadata.error
            ? '<p class="peringatan-edit">Kategori dan mood belum aktif. Jalankan file SQL Supabase terlebih dahulu.</p>'
            : ""
        }
    `;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const judulBaru = inputJudul.value.trim();
    const isiBaru = inputIsi.value.trim();
    const kategoriBaru = inputKategori.value;
    const moodBaru = inputMood.value;

    if (!judulBaru || !isiBaru || !kategoriBaru || !moodBaru) {
        alert("Judul, kategori, mood, dan isi tulisan harus dilengkapi.");
        return;
    }

    const tombolSimpan = form.querySelector(".btn-simpan");
    const teksAwal = tombolSimpan.textContent;
    tombolSimpan.disabled = true;
    tombolSimpan.textContent = "Menyimpan...";

    try {
        const { error } = await window.db.rpc("edit_tulisan", {
            kode,
            id_input: id,
            judul_baru: judulBaru,
            isi_baru: isiBaru
        });

        if (error) {
            throw error;
        }

        const hasilMetadata = await window.db.rpc("atur_metadata_tulisan", {
            kode,
            id_input: String(id),
            kategori_input: kategoriBaru,
            mood_input: moodBaru
        });

        if (hasilMetadata.error) {
            console.error("Gagal menyimpan kategori dan mood:", hasilMetadata.error);
            alert("Isi cerita berhasil diperbarui, tetapi kategori dan mood gagal disimpan. Jalankan file SQL Supabase.");
            return;
        }

        alert("Perubahan berhasil disimpan");
        window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
    } catch (error) {
        console.error("Gagal menyimpan perubahan:", error);
        alert("Gagal menyimpan perubahan");
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.textContent = teksAwal;
    }
});

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
