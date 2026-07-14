// Mengambil elemen dari halaman index.html
const formTulisan = document.getElementById("formTulisan");
const inputJudul = document.getElementById("judul");
const inputIsi = document.getElementById("isi");
const daftarTulisan = document.getElementById("daftarTulisan");
const jumlahTulisan = document.getElementById("jumlahTulisan");

// Mengambil tulisan yang sudah tersimpan
let semuaTulisan = [];

const dataTersimpan = localStorage.getItem("semuaTulisan");

if (dataTersimpan) {
    try {
        semuaTulisan = JSON.parse(dataTersimpan);
    } catch (error) {
        semuaTulisan = [];
    }
}

// Menyimpan tulisan ke browser
function simpanKeBrowser() {
    localStorage.setItem(
        "semuaTulisan",
        JSON.stringify(semuaTulisan)
    );
}

// Membuat format tanggal
function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Membuat format waktu
function formatWaktu(tanggal) {
    return new Date(tanggal).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Membuat cuplikan tulisan
function buatCuplikan(isi) {
    const batasKarakter = 120;

    if (isi.length <= batasKarakter) {
        return isi;
    }

    return isi.substring(0, batasKarakter) + "...";
}

// Membuka tulisan ke halaman detail
function bukaTulisan(idTulisan) {
    window.location.href =
        "detail.html?id=" + encodeURIComponent(idTulisan);
}

// Menghapus tulisan
function hapusTulisan(idTulisan) {
    const yakinMenghapus = confirm(
        "Apakah kamu yakin ingin menghapus tulisan ini?"
    );

    if (!yakinMenghapus) {
        return;
    }

    semuaTulisan = semuaTulisan.filter(function (tulisan) {
        return String(tulisan.id) !== String(idTulisan);
    });

    simpanKeBrowser();
    tampilkanSemuaTulisan();
}

// Menampilkan daftar tulisan
function tampilkanSemuaTulisan() {
    daftarTulisan.innerHTML = "";

    jumlahTulisan.textContent =
        semuaTulisan.length + " tulisan";

    // Jika belum ada tulisan
    if (semuaTulisan.length === 0) {
        const pesanKosong = document.createElement("p");

        pesanKosong.className = "kosong";
        pesanKosong.textContent =
            "Belum ada tulisan yang disimpan.";

        daftarTulisan.appendChild(pesanKosong);

        return;
    }

    // Mengurutkan tulisan terbaru
    const tulisanTerurut = [...semuaTulisan].sort(function (a, b) {
        return Number(b.dibuatPada) - Number(a.dibuatPada);
    });

    tulisanTerurut.forEach(function (tulisan) {
        // Membuat kartu
        const kartu = document.createElement("article");
        kartu.className = "kartu-tulisan";

        // Membuat judul
        const judul = document.createElement("h3");
        judul.textContent = tulisan.judul;

        // Membuat tanggal dan waktu
        const tanggal = document.createElement("p");
        tanggal.className = "tanggal";

        tanggal.textContent =
            formatTanggal(tulisan.dibuatPada) +
            " pukul " +
            formatWaktu(tulisan.dibuatPada);

        // Membuat cuplikan
        const cuplikan = document.createElement("p");
        cuplikan.className = "cuplikan-tulisan";
        cuplikan.textContent = buatCuplikan(tulisan.isi);

        // Tempat tombol
        const bagianTombol = document.createElement("div");
        bagianTombol.className = "bagian-tombol";

        // Tombol buka
        const tombolBuka = document.createElement("button");
        tombolBuka.type = "button";
        tombolBuka.className = "btn-buka";
        tombolBuka.textContent = "Buka Tulisan";

        tombolBuka.addEventListener("click", function () {
            bukaTulisan(tulisan.id);
        });

        // Tombol hapus
        const tombolHapus = document.createElement("button");
        tombolHapus.type = "button";
        tombolHapus.className = "btn-hapus";
        tombolHapus.textContent = "Hapus";

        tombolHapus.addEventListener("click", function () {
            hapusTulisan(tulisan.id);
        });

        // Memasukkan tombol
        bagianTombol.appendChild(tombolBuka);
        bagianTombol.appendChild(tombolHapus);

        // Memasukkan isi ke kartu
        kartu.appendChild(judul);
        kartu.appendChild(tanggal);
        kartu.appendChild(cuplikan);
        kartu.appendChild(bagianTombol);

        // Memasukkan kartu ke halaman
        daftarTulisan.appendChild(kartu);
    });
}

// Menyimpan tulisan baru
formTulisan.addEventListener("submit", function (event) {
    event.preventDefault();

    const judulTulisan = inputJudul.value.trim();
    const isiTulisan = inputIsi.value.trim();

    if (judulTulisan === "" || isiTulisan === "") {
        alert("Judul dan isi tulisan harus diisi.");
        return;
    }

    const waktuSekarang = Date.now();

    const tulisanBaru = {
        id: String(waktuSekarang),
        judul: judulTulisan,
        isi: isiTulisan,
        dibuatPada: waktuSekarang
    };

    semuaTulisan.push(tulisanBaru);

    simpanKeBrowser();
    tampilkanSemuaTulisan();

    formTulisan.reset();
    inputJudul.focus();

    alert("Tulisan berhasil disimpan.");
});

// Menampilkan tulisan saat halaman dibuka
tampilkanSemuaTulisan();