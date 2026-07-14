// Mengambil tempat untuk menampilkan tulisan
const detailTulisan = document.getElementById("detailTulisan");

/**
 * Mengambil ID tulisan dari alamat browser.
 *
 * Contoh:
 * detail.html?id=1784012948500
 */
const parameterURL = new URLSearchParams(window.location.search);
const idDariURL = parameterURL.get("id");

/**
 * Mengambil seluruh tulisan yang tersimpan di localStorage.
 */
const dataTersimpan = localStorage.getItem("semuaTulisan");

let semuaTulisan = [];

if (dataTersimpan) {
    try {
        semuaTulisan = JSON.parse(dataTersimpan);
    } catch (error) {
        console.error("Data tulisan tidak dapat dibaca:", error);
        semuaTulisan = [];
    }
}

/**
 * Mencari tulisan berdasarkan ID.
 *
 * String digunakan agar angka dan teks tetap dapat dibandingkan.
 */
const tulisanDipilih = semuaTulisan.find(function (tulisan) {
    return String(tulisan.id) === String(idDariURL);
});

/**
 * Mengubah tanggal menjadi format Indonesia.
 */
function formatTanggal(tanggal) {
    const objekTanggal = new Date(Number(tanggal));

    if (isNaN(objekTanggal.getTime())) {
        return "Tanggal tidak tersedia";
    }

    return objekTanggal.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

/**
 * Mengubah waktu menjadi format jam Indonesia.
 */
function formatWaktu(tanggal) {
    const objekTanggal = new Date(Number(tanggal));

    if (isNaN(objekTanggal.getTime())) {
        return "";
    }

    return objekTanggal.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * Menghapus seluruh isi kotak detail.
 */
function kosongkanDetail() {
    detailTulisan.innerHTML = "";
}

/**
 * Menampilkan pesan kesalahan.
 */
function tampilkanPesanKesalahan(judulPesan, isiPesan) {
    kosongkanDetail();

    const pembungkus = document.createElement("div");
    pembungkus.className = "pesan-tidak-ditemukan";

    const judul = document.createElement("h2");
    judul.textContent = judulPesan;

    const isi = document.createElement("p");
    isi.textContent = isiPesan;

    pembungkus.appendChild(judul);
    pembungkus.appendChild(isi);

    detailTulisan.appendChild(pembungkus);
}

/**
 * Menampilkan isi tulisan secara lengkap.
 */
function tampilkanTulisan() {
    // Memastikan ID tersedia di alamat browser
    if (!idDariURL) {
        tampilkanPesanKesalahan(
            "ID tulisan tidak tersedia",
            "Buka tulisan melalui tombol Buka Tulisan di halaman utama."
        );

        return;
    }

    // Memastikan data tulisan ditemukan
    if (!tulisanDipilih) {
        tampilkanPesanKesalahan(
            "Tulisan tidak ditemukan",
            "Tulisan mungkin sudah dihapus atau data tidak tersimpan pada browser ini."
        );

        console.log("ID dari URL:", idDariURL);
        console.log("Semua tulisan:", semuaTulisan);

        return;
    }

    kosongkanDetail();

    // Mengubah nama tab browser
    document.title = `${tulisanDipilih.judul} - Ruang Cerita`;

    // Membuat judul
    const judul = document.createElement("h2");
    judul.className = "judul-detail";
    judul.textContent = tulisanDipilih.judul;

    // Membuat informasi tanggal dan waktu
    const tanggal = document.createElement("p");
    tanggal.className = "tanggal-detail";

    tanggal.textContent =
        `${formatTanggal(tulisanDipilih.dibuatPada)} ` +
        `pukul ${formatWaktu(tulisanDipilih.dibuatPada)}`;

    // Membuat garis pembatas
    const garis = document.createElement("hr");
    garis.className = "garis-detail";

    // Membuat isi tulisan
    const isi = document.createElement("div");
    isi.className = "isi-detail";
    isi.textContent = tulisanDipilih.isi;

    // Memasukkan elemen ke halaman
    detailTulisan.appendChild(judul);
    detailTulisan.appendChild(tanggal);
    detailTulisan.appendChild(garis);
    detailTulisan.appendChild(isi);
}

// Menjalankan fungsi
tampilkanTulisan();