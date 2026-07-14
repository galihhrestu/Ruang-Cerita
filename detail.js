// =====================================
// DETAIL TULISAN
// RUANG CERITA
// =====================================



const detailTulisan =
document.getElementById(
"detailTulisan"
);



const parameter =
new URLSearchParams(
window.location.search
);



const id =
parameter.get("id");



const kode =
localStorage.getItem(
"kodeRuangCerita"
);





// =====================================
// AMBIL DATA
// =====================================


async function bukaDetail(){


const {data,error} =
await window.db.rpc(
"ambil_tulisan",
{
kode:kode
}
);



if(error){


console.error(error);


detailTulisan.innerHTML = `

<h2>
Gagal membuka cerita
</h2>

`;

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


detailTulisan.innerHTML = `

<h2>
Cerita tidak ditemukan
</h2>

`;

return;


}





tampilkanCerita(
tulisan
);



}








// =====================================
// TAMPILKAN CERITA
// =====================================


function tampilkanCerita(tulisan){



document.title =
tulisan.judul +
" - Ruang Cerita";






detailTulisan.innerHTML = `



<div class="surat-wrapper">



<div class="surat-header">


<div class="surat-icon">

✦

</div>



<h2>

${escapeHTML(
tulisan.judul
)}

</h2>




<p class="surat-tanggal">

${formatTanggal(
tulisan.created_at
)}

<br>

pukul

${formatJam(
tulisan.created_at
)}

</p>


</div>






<div class="garis-surat">

</div>







<div class="surat-isi">


${escapeHTML(
tulisan.isi
)
.replace(
/\n/g,
"<br><br>"
)}


</div>







<div class="penutup-surat">


<span>
♥
</span>


<p>
persembahan dari hati
</p>


</div>






</div>



`;



}








// =====================================
// FORMAT
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




function formatJam(tanggal){


return new Date(tanggal)
.toLocaleTimeString(
"id-ID",
{

hour:"2-digit",

minute:"2-digit"

}

);


}





function escapeHTML(text){


return text
.replace(
/</g,
"&lt;"
)
.replace(
/>/g,
"&gt;"
);


}





bukaDetail();