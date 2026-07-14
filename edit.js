// ===============================
// EDIT TULISAN
// ===============================


const kode =
localStorage.getItem(
"kodeRuangCerita"
);



const parameter =
new URLSearchParams(
window.location.search
);



const id =
parameter.get("id");



const inputJudul =
document.getElementById("editJudul");


const inputIsi =
document.getElementById("editIsi");


const form =
document.getElementById("formEdit");


const infoEdit =
document.getElementById("infoEdit");





// ambil data tulisan

async function ambilData(){


const {data,error} =
await window.db.rpc(
"ambil_tulisan",
{
kode:kode
}
);



if(error){

console.error(error);

return;

}



const tulisan =
data.find(
item =>
String(item.id)
===
String(id)
);



if(!tulisan){

alert(
"Tulisan tidak ditemukan"
);

return;

}



inputJudul.value =
tulisan.judul;


inputIsi.value =
tulisan.isi;



infoEdit.innerHTML = `

<p>
Dibuat:
${new Date(tulisan.created_at)
.toLocaleString("id-ID")}
</p>


<p>
Terakhir diedit:
${
tulisan.updated_at
?
new Date(tulisan.updated_at)
.toLocaleString("id-ID")
:
"Belum pernah diedit"
}

</p>

`;



}



ambilData();







// simpan perubahan


form.addEventListener(
"submit",
async function(e){


e.preventDefault();



const {error} =
await window.db.rpc(
"edit_tulisan",
{

kode:kode,

id_input:id,

judul_baru:
inputJudul.value,


isi_baru:
inputIsi.value

}

);



if(error){

console.error(error);


alert(
"Gagal menyimpan perubahan"
);


return;

}



alert(
"Perubahan berhasil disimpan"
);



window.location.href =
"detail.html?id="+id;



});