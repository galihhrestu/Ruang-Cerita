// =====================================
// RUANG CERITA
// DAFTAR, PENCARIAN, DAN PAGINASI
// =====================================

const formTulisan = document.getElementById("formTulisan");
const inputJudul = document.getElementById("judul");
const inputIsi = document.getElementById("isi");
const daftarTulisan = document.getElementById("daftarTulisan");
const jumlahTulisan = document.getElementById("jumlahTulisan");
const pencarianJudul = document.getElementById("pencarianJudul");
const hapusPencarian = document.getElementById("hapusPencarian");
const infoHasilPencarian = document.getElementById("infoHasilPencarian");
const paginasiTulisan = document.getElementById("paginasiTulisan");
const halamanSebelumnya = document.getElementById("halamanSebelumnya");
const halamanBerikutnya = document.getElementById("halamanBerikutnya");
const nomorHalaman = document.getElementById("nomorHalaman");
const logoutButton = document.getElementById("logoutButton");

const KUNCI_AKSES = "kodeRuangCerita";
const JUMLAH_PER_HALAMAN = 5;
const ZONA_WAKTU_WIB = "Asia/Jakarta";

let kodeAkses = "";
let semuaTulisan = [];
let tulisanTersaring = [];
let halamanAktif = 1;

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
// AMBIL DAN OLAH TULISAN
// =====================================

async function muatTulisan({ kembaliKeAwal = false } = {}) {
    daftarTulisan.innerHTML = '<p class="status-daftar">Memuat cerita...</p>';

    const { data, error } = await window.db.rpc("ambil_tulisan", {
        kode: kodeAkses
    });

    if (error) {
        console.error("Gagal mengambil tulisan:", error);
        daftarTulisan.innerHTML = `
            <div class="pesan-daftar pesan-error">
                <strong>Gagal mengambil cerita.</strong>
                <span>Periksa koneksi internet lalu muat ulang halaman.</span>
            </div>
        `;
        sembunyikanPaginasi();
        return;
    }

    semuaTulisan = Array.isArray(data) ? [...data] : [];

    // Cerita terbaru selalu ditampilkan lebih dahulu.
    semuaTulisan.sort((a, b) => {
        return waktuKeAngka(b.created_at) - waktuKeAngka(a.created_at);
    });

    if (kembaliKeAwal) {
        halamanAktif = 1;
    }

    terapkanPencarian(false);
}

function terapkanPencarian(resetHalaman = true) {
    const kataKunci = (pencarianJudul?.value || "").trim().toLocaleLowerCase("id-ID");

    tulisanTersaring = kataKunci
        ? semuaTulisan.filter((tulisan) => {
            return String(tulisan.judul || "")
                .toLocaleLowerCase("id-ID")
                .includes(kataKunci);
        })
        : [...semuaTulisan];

    if (resetHalaman) {
        halamanAktif = 1;
    }

    const totalHalaman = hitungTotalHalaman();
    halamanAktif = Math.min(Math.max(halamanAktif, 1), totalHalaman);

    perbaruiInformasiDaftar(kataKunci);
    renderHalamanAktif();
}

function perbaruiInformasiDaftar(kataKunci) {
    const total = semuaTulisan.length;
    const ditemukan = tulisanTersaring.length;

    jumlahTulisan.textContent = kataKunci
        ? `${ditemukan} dari ${total} tulisan`
        : `${total} tulisan`;

    if (hapusPencarian) {
        hapusPencarian.hidden = kataKunci.length === 0;
    }

    if (!infoHasilPencarian) {
        return;
    }

    if (!kataKunci) {
        infoHasilPencarian.textContent = total > JUMLAH_PER_HALAMAN
            ? `Menampilkan ${JUMLAH_PER_HALAMAN} cerita per halaman.`
            : "";
        return;
    }

    infoHasilPencarian.textContent = ditemukan > 0
        ? `${ditemukan} judul cocok dengan “${pencarianJudul.value.trim()}”.`
        : `Tidak ada judul yang cocok dengan “${pencarianJudul.value.trim()}”.`;
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
            "Judul tidak ditemukan",
            "Coba gunakan kata kunci lain atau hapus pencarian."
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
}

function buatKartuTulisan(tulisan) {
    const judul = String(tulisan.judul || "Tanpa judul");
    const isi = String(tulisan.isi || "");
    const preview = isi.substring(0, 180);

    const kartu = document.createElement("article");
    kartu.className = "kartu-tulisan";

    kartu.innerHTML = `
        <div class="kartu-header">
            <h3>✦ ${escapeHTML(judul)}</h3>
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

if (formTulisan) {
    formTulisan.addEventListener("submit", async (event) => {
        event.preventDefault();

        const judul = inputJudul.value.trim();
        const isi = inputIsi.value.trim();

        const { error } = await window.db.rpc("simpan_tulisan", {
            kode: kodeAkses,
            judul_input: judul,
            isi_input: isi
        });

        if (error) {
            console.error("Gagal menyimpan tulisan:", error);
            alert("Gagal menyimpan tulisan");
            return;
        }

        alert("Tulisan berhasil disimpan");
        formTulisan.reset();

        if (pencarianJudul) {
            pencarianJudul.value = "";
        }

        await muatTulisan({ kembaliKeAwal: true });
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
// PENCARIAN DAN NAVIGASI
// =====================================

pencarianJudul?.addEventListener("input", () => {
    terapkanPencarian(true);
});

pencarianJudul?.addEventListener("search", () => {
    terapkanPencarian(true);
});

hapusPencarian?.addEventListener("click", () => {
    pencarianJudul.value = "";
    pencarianJudul.focus();
    terapkanPencarian(true);
});

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

    // Timestamp Supabase/PostgreSQL tanpa penanda zona waktu dianggap UTC.
    // Contoh: "2026-07-21 05:42:00" menjadi "2026-07-21T05:42:00Z".
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
