// =====================================
// RUANG CERITA
// SUPABASE VERSION FINAL
// =====================================



const formTulisan =
document.getElementById("formTulisan");


const inputJudul =
document.getElementById("judul");


const inputIsi =
document.getElementById("isi");


const daftarTulisan =
document.getElementById("daftarTulisan");


const jumlahTulisan =
document.getElementById("jumlahTulisan");



const KUNCI_AKSES =
"kodeRuangCerita";



let kodeAkses = "";





// =====================================
// CEK KODE
// =====================================


async function cekKode(kode){


    const {data,error} =
    await window.db.rpc(
        "cek_kode",
        {
            kode:kode
        }
    );



    if(error){

        console.error(error);

        return false;

    }



    return data;


}






// =====================================
// LOGIN
// =====================================


async function masukRuangCerita(){


    let kode =
    localStorage.getItem(
        KUNCI_AKSES
    );



    if(kode){


        const valid =
        await cekKode(kode);



        if(valid){

            return kode;

        }


    }




    kode =
    prompt(
        "Masukkan kode akses Ruang Cerita:"
    );



    if(!kode){

        return null;

    }





    const benar =
    await cekKode(kode);



    if(!benar){


        alert(
            "Kode akses salah"
        );


        return null;

    }





    localStorage.setItem(
        KUNCI_AKSES,
        kode
    );



    return kode;



}








// =====================================
// AMBIL TULISAN
// =====================================


async function tampilkanTulisan(){



    const {data,error} =
    await window.db.rpc(
        "ambil_tulisan",
        {
            kode:kodeAkses
        }
    );




    if(error){


        console.error(
            "ERROR AMBIL:",
            error
        );


        daftarTulisan.innerHTML =
        `
        <p>
        Gagal mengambil tulisan.
        </p>
        `;


        return;

    }




    daftarTulisan.innerHTML = "";



    jumlahTulisan.textContent =
    `${data.length} tulisan`;






    if(data.length === 0){


        daftarTulisan.innerHTML =
        `
        <p>
        Belum ada tulisan.
        </p>
        `;


        return;


    }







    data.forEach(
    function(tulisan){



        const kartu =
        document.createElement("div");



        kartu.className =
        "kartu-tulisan";





        kartu.innerHTML = `


        <div class="kartu-header">


            <h3>
            ✦ ${escapeHTML(tulisan.judul)}
            </h3>



            <p class="tanggal-tulisan">

            ${formatTanggal(tulisan.created_at)}

            </p>



        </div>





        <div class="preview-tulisan">

        ${escapeHTML(
            tulisan.isi.substring(0,180)
        )}

        ${
            tulisan.isi.length > 180
            ?
            "..."
            :
            ""
        }

        </div>





        <div class="aksi-tulisan">



            <button
            class="btn-favorit ${
                tulisan.favorit
                ?
                "aktif"
                :
                ""
            }">

            ${
                tulisan.favorit
                ?
                "♥ Favorit"
                :
                "♡ Favorit"
            }


            </button>





            <button
            class="btn-edit">

            ✎ Edit

            </button>






            <button
            class="btn-buka">

            Baca Cerita →

            </button>






            <button
            class="btn-hapus">

            Hapus

            </button>




        </div>



        `;






        daftarTulisan.appendChild(kartu);








        // =========================
        // DETAIL
        // =========================


        kartu
        .querySelector(".btn-buka")
        .addEventListener(
            "click",
            function(){

                bukaTulisan(
                    tulisan.id
                );

            }
        );







        // =========================
        // EDIT
        // =========================


        kartu
        .querySelector(".btn-edit")
        .addEventListener(
            "click",
            function(){

                editTulisan(
                    tulisan.id
                );

            }
        );







        // =========================
        // FAVORIT
        // =========================


        kartu
        .querySelector(".btn-favorit")
        .addEventListener(
            "click",
            function(){

                toggleFavorit(
                    tulisan.id
                );

            }
        );







        // =========================
        // HAPUS
        // =========================


        kartu
        .querySelector(".btn-hapus")
        .addEventListener(
            "click",
            function(){

                hapusTulisan(
                    tulisan.id
                );

            }
        );



    });



}









// =====================================
// SIMPAN TULISAN
// =====================================


if(formTulisan){


formTulisan.addEventListener(
"submit",
async function(e){


e.preventDefault();



const judul =
inputJudul.value.trim();



const isi =
inputIsi.value.trim();





const {error} =
await window.db.rpc(
"simpan_tulisan",
{

kode:kodeAkses,

judul_input:judul,

isi_input:isi

}

);





if(error){


console.error(error);


alert(
"Gagal menyimpan tulisan"
);


return;


}




alert(
"Tulisan berhasil disimpan"
);



formTulisan.reset();



tampilkanTulisan();



});

}



 
// =====================================
// DETAIL
// =====================================


function bukaTulisan(id){


window.location.href =
"detail.html?id="+id;


}






// =====================================
// EDIT
// =====================================


function editTulisan(id){


window.location.href =
"edit.html?id="+id;


}








// =====================================
// HAPUS
// =====================================


async function hapusTulisan(id){


const yakin =
confirm(
"Hapus tulisan ini?"
);



if(!yakin){

return;

}




const {error} =
await window.db.rpc(
"hapus_tulisan",
{

kode:kodeAkses,

id_input:id

}

);




if(error){


console.error(error);


alert(
"Gagal menghapus"
);


return;


}



tampilkanTulisan();



}








// =====================================
// FAVORIT
// =====================================


async function toggleFavorit(id){



const {error} =
await window.db.rpc(
"toggle_favorit",
{

kode:kodeAkses,

id_input:id

}

);





if(error){


console.error(error);


alert(
"Gagal mengubah favorit"
);


return;


}



tampilkanTulisan();



}








// =====================================
// FORMAT TANGGAL
// =====================================


function formatTanggal(tanggal){


return new Date(tanggal)
.toLocaleDateString(
"id-ID",
{

day:"numeric",

month:"long",

year:"numeric"

}

);


}








// =====================================
// AMANKAN HTML
// =====================================


function escapeHTML(text){


return text
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");


}








// =====================================
// MULAI
// =====================================


async function mulai(){



kodeAkses =
await masukRuangCerita();




if(!kodeAkses){

return;

}




tampilkanTulisan();



}



mulai();