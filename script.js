// =====================================
// RUANG CERITA
// PENCARIAN, FILTER, PENGURUTAN, DAN PAGINASI
// =====================================

const formTulisan = document.getElementById("formTulisan");
const inputJudul = document.getElementById("judul");
const inputIsi = document.getElementById("isi");
const inputKategori = document.getElementById("kategori");
const inputMood = document.getElementById("mood");
const daftarTulisan = document.getElementById("daftarTulisan");
const jumlahTulisan = document.getElementById("jumlahTulisan");
const pencarianJudul = document.getElementById("pencarianJudul");
const hapusPencarian = document.getElementById("hapusPencarian");
const infoHasilPencarian = document.getElementById("infoHasilPencarian");
const filterFavorit = document.getElementById("filterFavorit");
const filterKategori = document.getElementById("filterKategori");
const filterMood = document.getElementById("filterMood");
const urutkanCerita = document.getElementById("urutkanCerita");
const resetFilter = document.getElementById("resetFilter");
const paginasiTulisan = document.getElementById("paginasiTulisan");
const halamanSebelumnya = document.getElementById("halamanSebelumnya");
const halamanBerikutnya = document.getElementById("halamanBerikutnya");
const nomorHalaman = document.getElementById("nomorHalaman");
const logoutButton = document.getElementById("logoutButton");

const KUNCI_AKSES = "kodeRuangCerita";
const JUMLAH_PER_HALAMAN = 5;
const ZONA_WAKTU_WIB = "Asia/Jakarta";
const KATEGORI_DEFAULT = "Belum dikategorikan";
const MOOD_DEFAULT = "Belum dipilih";

const IKON_MOOD = {
    "Bahagia": "😊",
    "Penuh Cinta": "❤️",
    "Terharu": "🥺",
    "Sedih": "😔",
    "Bersyukur": "🌱",
    "Tenang": "😌",
    "Belum dipilih": "○"
};

let kodeAkses = "";
let semuaTulisan = [];
let tulisanTersaring = [];
let halamanAktif = 1;
let metadataAktif = true;

// =====================================
// CEK KODE DAN LOGIN
// =====================================

async function cekKode(kode) {
    const { data, error } = await window.db.rpc("cek_kode", { kode });

    if (error) {
        console.error("Gagal memeriksa kode akses:", error);
        return false;
    }

    return Boolean(data);
}

async function masukRuangCerita() {
    let kode = localStorage.getItem(KUNCI_AKSES);

    if (kode && await cekKode(kode)) {
        return kode;
    }

    localStorage.removeItem(KUNCI_AKSES);
    kode = prompt("Masukkan kode akses Ruang Cerita:");

    if (!kode) {
        return null;
    }

    const benar = await cekKode(kode);

    if (!benar) {
        alert("Kode akses salah");
        return null;
    }

    localStorage.setItem(KUNCI_AKSES, kode);
    return kode;
}

// =====================================
// AMBIL DAN GABUNGKAN DATA
// =====================================

async function ambilTulisanMentah() {
    const { data, error } = await window.db.rpc("ambil_tulisan", {
        kode: kodeAkses
    });

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
}

async function ambilMetadataTulisan() {
    const { data, error } = await window.db.rpc("ambil_metadata_tulisan", {
        kode: kodeAkses
    });

    if (error) {
        metadataAktif = false;
        console.warn(
            "Fitur kategori dan mood belum aktif di Supabase. Jalankan file supabase-kategori-mood.sql.",
            error
        );
        return [];
    }

    metadataAktif = true;
    return Array.isArray(data) ? data : [];
}

function gabungkanTulisanDenganMetadata(daftarCerita, daftarMetadata) {
    const metadataPerId = new Map(
        daftarMetadata.map((item) => [String(item.cerita_id), item])
    );

    return daftarCerita.map((tulisan) => {
        const metadata = metadataPerId.get(String(tulisan.id));

        return {
            ...tulisan,
            kategori: metadata?.kategori || KATEGORI_DEFAULT,
            mood: metadata?.mood || MOOD_DEFAULT
        };
    });
}

async function muatTulisan({ kembaliKeAwal = false } = {}) {
    daftarTulisan.innerHTML = '<p class="status-daftar">Memuat cerita...</p>';

    try {
        const [dataTulisan, dataMetadata] = await Promise.all([
            ambilTulisanMentah(),
            ambilMetadataTulisan()
        ]);

        semuaTulisan = gabungkanTulisanDenganMetadata(dataTulisan, dataMetadata);

        if (kembaliKeAwal) {
            halamanAktif = 1;
        }

        terapkanFilterDanUrutan(false);
        tampilkanStatusMetadata();
    } catch (error) {
        console.error("Gagal mengambil tulisan:", error);
        daftarTulisan.innerHTML = `
            <div class="pesan-daftar pesan-error">
                <strong>Gagal mengambil cerita.</strong>
                <span>Periksa koneksi internet lalu muat ulang halaman.</span>
            </div>
        `;
        sembunyikanPaginasi();
    }
}

function tampilkanStatusMetadata() {
    const idPeringatan = "peringatanMetadata";
    let peringatan = document.getElementById(idPeringatan);

    if (metadataAktif) {
        peringatan?.remove();
        return;
    }

    if (!peringatan) {
        peringatan = document.createElement("div");
        peringatan.id = idPeringatan;
        peringatan.className = "peringatan-metadata";
        peringatan.innerHTML = `
            <strong>Kategori dan mood belum tersambung ke Supabase.</strong>
            <span>Jalankan file <code>supabase-kategori-mood.sql</code> di SQL Editor Supabase.</span>
        `;
        document.querySelector(".daftar-tools")?.prepend(peringatan);
    }
}

// =====================================
// PENCARIAN, FILTER, DAN PENGURUTAN
// =====================================

function terapkanFilterDanUrutan(resetHalaman = true) {
    const kataKunci = (pencarianJudul?.value || "")
        .trim()
        .toLocaleLowerCase("id-ID");
    const statusFavorit = filterFavorit?.value || "semua";
    const kategoriDipilih = filterKategori?.value || "semua";
    const moodDipilih = filterMood?.value || "semua";
    const urutan = urutkanCerita?.value || "terbaru";

    tulisanTersaring = semuaTulisan.filter((tulisan) => {
        const cocokJudul = !kataKunci || String(tulisan.judul || "")
            .toLocaleLowerCase("id-ID")
            .includes(kataKunci);
        const cocokFavorit = statusFavorit !== "favorit" || Boolean(tulisan.favorit);
        const cocokKategori = kategoriDipilih === "semua" || tulisan.kategori === kategoriDipilih;
        const cocokMood = moodDipilih === "semua" || tulisan.mood === moodDipilih;

        return cocokJudul && cocokFavorit && cocokKategori && cocokMood;
    });

    urutkanDaftar(tulisanTersaring, urutan);

    if (resetHalaman) {
        halamanAktif = 1;
    }

    const totalHalaman = hitungTotalHalaman();
    halamanAktif = Math.min(Math.max(halamanAktif, 1), totalHalaman);

    perbaruiInformasiDaftar(kataKunci);
    renderHalamanAktif();
}

function urutkanDaftar(daftar, urutan) {
    daftar.sort((a, b) => {
        if (urutan === "terlama") {
            return waktuKeAngka(a.created_at) - waktuKeAngka(b.created_at);
        }

        if (urutan === "terakhir-diedit") {
            const waktuA = waktuKeAngka(a.updated_at || a.created_at);
            const waktuB = waktuKeAngka(b.updated_at || b.created_at);
            return waktuB - waktuA;
        }

        if (urutan === "judul-az") {
            return String(a.judul || "").localeCompare(
                String(b.judul || ""),
                "id-ID",
                { sensitivity: "base" }
            );
        }

        return waktuKeAngka(b.created_at) - waktuKeAngka(a.created_at);
    });
}

function perbaruiInformasiDaftar(kataKunci) {
    const total = semuaTulisan.length;
    const ditemukan = tulisanTersaring.length;
    const filterSedangAktif = Boolean(kataKunci)
        || filterFavorit?.value === "favorit"
        || filterKategori?.value !== "semua"
        || filterMood?.value !== "semua";

    jumlahTulisan.textContent = filterSedangAktif
        ? `${ditemukan} dari ${total} tulisan`
        : `${total} tulisan`;

    if (hapusPencarian) {
        hapusPencarian.hidden = kataKunci.length === 0;
    }

    if (resetFilter) {
        resetFilter.hidden = !filterSedangAktif
            && (urutkanCerita?.value || "terbaru") === "terbaru";
    }

    if (!infoHasilPencarian) {
        return;
    }

    if (ditemukan === 0) {
        infoHasilPencarian.textContent = "Tidak ada cerita yang sesuai dengan pencarian atau filter.";
        return;
    }

    const awal = ((halamanAktif - 1) * JUMLAH_PER_HALAMAN) + 1;
    const akhir = Math.min(halamanAktif * JUMLAH_PER_HALAMAN, ditemukan);
    infoHasilPencarian.textContent = `Menampilkan cerita ${awal}–${akhir} dari ${ditemukan} hasil.`;
}

function resetSemuaFilter({ render = true } = {}) {
    if (pencarianJudul) pencarianJudul.value = "";
    if (filterFavorit) filterFavorit.value = "semua";
    if (filterKategori) filterKategori.value = "semua";
    if (filterMood) filterMood.value = "semua";
    if (urutkanCerita) urutkanCerita.value = "terbaru";
    halamanAktif = 1;

    if (render) {
        terapkanFilterDanUrutan(false);
    }
}

// =====================================
// TAMPILKAN HALAMAN CERITA
// =====================================

function renderHalamanAktif() {
    daftarTulisan.innerHTML = "";

    if (semuaTulisan.length === 0) {
        tampilkanPesanKosong(
            "Belum ada cerita",
            "Cerita yang kamu simpan akan muncul di bagian ini."
        );
        sembunyikanPaginasi();
        return;
    }

    if (tulisanTersaring.length === 0) {
        tampilkanPesanKosong(
            "Cerita tidak ditemukan",
            "Coba ubah kata pencarian, kategori, mood, atau status favorit."
        );
        sembunyikanPaginasi();
        return;
    }

    const indeksAwal = (halamanAktif - 1) * JUMLAH_PER_HALAMAN;
    const tulisanHalamanIni = tulisanTersaring.slice(
        indeksAwal,
        indeksAwal + JUMLAH_PER_HALAMAN
    );

    tulisanHalamanIni.forEach(buatKartuTulisan);
    renderPaginasi();
    perbaruiInformasiDaftar((pencarianJudul?.value || "").trim());
}

function buatKartuTulisan(tulisan) {
    const judul = String(tulisan.judul || "Tanpa judul");
    const isi = String(tulisan.isi || "");
    const preview = isi.substring(0, 180);
    const kategori = tulisan.kategori || KATEGORI_DEFAULT;
    const mood = tulisan.mood || MOOD_DEFAULT;

    const kartu = document.createElement("article");
    kartu.className = "kartu-tulisan";

    kartu.innerHTML = `
        <div class="kartu-header">
            <div>
                <h3>✦ ${escapeHTML(judul)}</h3>
                <div class="metadata-cerita">
                    <span class="badge-cerita badge-kategori">${escapeHTML(kategori)}</span>
                    <span class="badge-cerita badge-mood">${ikonMood(mood)} ${escapeHTML(mood)}</span>
                </div>
            </div>
            <p class="tanggal-tulisan">${formatTanggalWIB(tulisan.created_at)}</p>
        </div>

        <div class="preview-tulisan">
            ${escapeHTML(preview)}${isi.length > 180 ? "..." : ""}
        </div>

        <div class="aksi-tulisan">
            <button
                type="button"
                class="btn-favorit ${tulisan.favorit ? "aktif" : ""}"
                aria-pressed="${tulisan.favorit ? "true" : "false"}"
            >
                ${tulisan.favorit ? "♥ Favorit" : "♡ Favorit"}
            </button>

            <button type="button" class="btn-edit">✎ Edit</button>
            <button type="button" class="btn-buka">Baca Cerita →</button>
            <button type="button" class="btn-hapus">Hapus</button>
        </div>
    `;

    kartu.querySelector(".btn-buka").addEventListener("click", () => {
        bukaTulisan(tulisan.id);
    });

    kartu.querySelector(".btn-edit").addEventListener("click", () => {
        editTulisan(tulisan.id);
    });

    kartu.querySelector(".btn-favorit").addEventListener("click", () => {
        toggleFavorit(tulisan.id);
    });

    kartu.querySelector(".btn-hapus").addEventListener("click", () => {
        hapusTulisan(tulisan.id);
    });

    daftarTulisan.appendChild(kartu);
}

function tampilkanPesanKosong(judul, keterangan) {
    daftarTulisan.innerHTML = `
        <div class="pesan-daftar">
            <strong>${escapeHTML(judul)}</strong>
            <span>${escapeHTML(keterangan)}</span>
        </div>
    `;
}

// =====================================
// PAGINASI 5 CERITA PER HALAMAN
// =====================================

function hitungTotalHalaman() {
    return Math.max(1, Math.ceil(tulisanTersaring.length / JUMLAH_PER_HALAMAN));
}

function renderPaginasi() {
    const totalHalaman = hitungTotalHalaman();

    if (totalHalaman <= 1) {
        sembunyikanPaginasi();
        return;
    }

    paginasiTulisan.hidden = false;
    halamanSebelumnya.disabled = halamanAktif === 1;
    halamanBerikutnya.disabled = halamanAktif === totalHalaman;
    nomorHalaman.innerHTML = "";

    buatRentangHalaman(totalHalaman, halamanAktif).forEach((nomor) => {
        if (nomor === "...") {
            const elipsis = document.createElement("span");
            elipsis.className = "elipsis-paginasi";
            elipsis.textContent = "…";
            nomorHalaman.appendChild(elipsis);
            return;
        }

        const tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "tombol-paginasi tombol-nomor";
        tombol.textContent = nomor;
        tombol.setAttribute("aria-label", `Buka halaman ${nomor}`);

        if (nomor === halamanAktif) {
            tombol.classList.add("aktif");
            tombol.setAttribute("aria-current", "page");
        }

        tombol.addEventListener("click", () => pindahHalaman(nomor));
        nomorHalaman.appendChild(tombol);
    });
}

function buatRentangHalaman(total, aktif) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, indeks) => indeks + 1);
    }

    if (aktif <= 4) {
        return [1, 2, 3, 4, 5, "...", total];
    }

    if (aktif >= total - 3) {
        return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", aktif - 1, aktif, aktif + 1, "...", total];
}

function pindahHalaman(nomorHalamanBaru) {
    const totalHalaman = hitungTotalHalaman();
    halamanAktif = Math.min(Math.max(nomorHalamanBaru, 1), totalHalaman);
    renderHalamanAktif();

    document.querySelector(".daftar-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function sembunyikanPaginasi() {
    if (paginasiTulisan) {
        paginasiTulisan.hidden = true;
    }
}

// =====================================
// SIMPAN, EDIT, HAPUS, FAVORIT
// =====================================

async function aturMetadataTulisan(id, kategori, mood) {
    const { error } = await window.db.rpc("atur_metadata_tulisan", {
        kode: kodeAkses,
        id_input: String(id),
        kategori_input: kategori,
        mood_input: mood
    });

    if (error) {
        metadataAktif = false;
        console.error("Gagal menyimpan kategori dan mood:", error);
        return false;
    }

    metadataAktif = true;
    return true;
}

if (formTulisan) {
    formTulisan.addEventListener("submit", async (event) => {
        event.preventDefault();

        const judul = inputJudul.value.trim();
        const isi = inputIsi.value.trim();
        const kategori = inputKategori.value;
        const mood = inputMood.value;

        if (!judul || !isi || !kategori || !mood) {
            alert("Judul, kategori, mood, dan isi cerita harus dilengkapi.");
            return;
        }

        const tombolSimpan = formTulisan.querySelector(".btn-simpan");
        const teksAwal = tombolSimpan.textContent;
        tombolSimpan.disabled = true;
        tombolSimpan.textContent = "Menyimpan...";

        const idSebelum = new Set(semuaTulisan.map((item) => String(item.id)));

        try {
            const { error } = await window.db.rpc("simpan_tulisan", {
                kode: kodeAkses,
                judul_input: judul,
                isi_input: isi
            });

            if (error) {
                throw error;
            }

            const dataTerbaru = await ambilTulisanMentah();
            const kandidatBaru = dataTerbaru
                .filter((item) => !idSebelum.has(String(item.id)))
                .sort((a, b) => waktuKeAngka(b.created_at) - waktuKeAngka(a.created_at))[0]
                || dataTerbaru
                    .filter((item) => item.judul === judul && item.isi === isi)
                    .sort((a, b) => waktuKeAngka(b.created_at) - waktuKeAngka(a.created_at))[0];

            const metadataTersimpan = kandidatBaru
                ? await aturMetadataTulisan(kandidatBaru.id, kategori, mood)
                : false;

            formTulisan.reset();
            resetSemuaFilter({ render: false });
            await muatTulisan({ kembaliKeAwal: true });

            alert(metadataTersimpan
                ? "Tulisan berhasil disimpan"
                : "Tulisan tersimpan, tetapi kategori dan mood belum tersimpan. Jalankan SQL kategori dan mood di Supabase."
            );
        } catch (error) {
            console.error("Gagal menyimpan tulisan:", error);
            alert("Gagal menyimpan tulisan");
        } finally {
            tombolSimpan.disabled = false;
            tombolSimpan.textContent = teksAwal;
        }
    });
}

function bukaTulisan(id) {
    window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
}

function editTulisan(id) {
    window.location.href = `edit.html?id=${encodeURIComponent(id)}`;
}

async function hapusTulisan(id) {
    if (!confirm("Hapus tulisan ini?")) {
        return;
    }

    const { error } = await window.db.rpc("hapus_tulisan", {
        kode: kodeAkses,
        id_input: id
    });

    if (error) {
        console.error("Gagal menghapus tulisan:", error);
        alert("Gagal menghapus");
        return;
    }

    // Metadata dihapus terpisah agar tabel metadata tetap bersih.
    const hasilMetadata = await window.db.rpc("hapus_metadata_tulisan", {
        kode: kodeAkses,
        id_input: String(id)
    });

    if (hasilMetadata.error) {
        console.warn("Metadata cerita tidak dapat dihapus:", hasilMetadata.error);
    }

    await muatTulisan();
}

async function toggleFavorit(id) {
    const { error } = await window.db.rpc("toggle_favorit", {
        kode: kodeAkses,
        id_input: id
    });

    if (error) {
        console.error("Gagal mengubah favorit:", error);
        alert("Gagal mengubah favorit");
        return;
    }

    await muatTulisan();
}

// =====================================
// EVENT PENCARIAN DAN FILTER
// =====================================

pencarianJudul?.addEventListener("input", () => terapkanFilterDanUrutan(true));
pencarianJudul?.addEventListener("search", () => terapkanFilterDanUrutan(true));
filterFavorit?.addEventListener("change", () => terapkanFilterDanUrutan(true));
filterKategori?.addEventListener("change", () => terapkanFilterDanUrutan(true));
filterMood?.addEventListener("change", () => terapkanFilterDanUrutan(true));
urutkanCerita?.addEventListener("change", () => terapkanFilterDanUrutan(true));

hapusPencarian?.addEventListener("click", () => {
    pencarianJudul.value = "";
    pencarianJudul.focus();
    terapkanFilterDanUrutan(true);
});

resetFilter?.addEventListener("click", () => resetSemuaFilter());

halamanSebelumnya?.addEventListener("click", () => {
    pindahHalaman(halamanAktif - 1);
});

halamanBerikutnya?.addEventListener("click", () => {
    pindahHalaman(halamanAktif + 1);
});

logoutButton?.addEventListener("click", () => {
    localStorage.removeItem(KUNCI_AKSES);
    window.location.reload();
});

// =====================================
// FORMAT WIB DAN KEAMANAN HTML
// =====================================

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

function waktuKeAngka(tanggal) {
    const waktu = parseWaktuSupabase(tanggal).getTime();
    return Number.isNaN(waktu) ? 0 : waktu;
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

// =====================================
// MULAI
// =====================================

async function mulai() {
    kodeAkses = await masukRuangCerita();

    if (!kodeAkses) {
        daftarTulisan.innerHTML = `
            <div class="pesan-daftar">
                <strong>Akses dibatalkan</strong>
                <span>Muat ulang halaman untuk memasukkan kode akses.</span>
            </div>
        `;
        return;
    }

    await muatTulisan({ kembaliKeAwal: true });
}

mulai();
