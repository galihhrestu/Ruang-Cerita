document.addEventListener("DOMContentLoaded", function () {


    // ===============================
    // DAFTAR LAGU
    // ===============================

    const daftarLagu = [

        {
            judul: "Nadhif - Penjaga Hati",
            file: "lagu1.mp3"
        },

        {
            judul: "Batas Senja - Nanti Kita Seperti Ini",
            file: "lagu2.mp3"
        },

        {
            judul: "Andmesh - Hanya Rindu",
            file: "lagu3.mp3"
        },

        {
            judul: "Andmesh - Kumau Dia",
            file: "lagu4.mp3"
        },

        {
            judul: "Ed Sheeran - Perfect",
            file: "lagu5.mp3"
        }

    ];



    // ===============================
    // ELEMENT HTML
    // ===============================

    const audio =
        document.getElementById(
            "backgroundMusic"
        );


    const judulLagu =
        document.getElementById(
            "musicTitle"
        );


    const tombolPutar =
        document.getElementById(
            "musicToggle"
        );


    const ikonMusik =
        document.getElementById(
            "musicIcon"
        );


    const teksMusik =
        document.getElementById(
            "musicText"
        );


    const tombolPrev =
        document.getElementById(
            "prevMusic"
        );


    const tombolNext =
        document.getElementById(
            "nextMusic"
        );


    const pilihanLagu =
        document.getElementById(
            "musicSelect"
        );


    const volume =
        document.getElementById(
            "musicVolume"
        );



    if(!audio){

        console.error(
            "Audio tidak ditemukan"
        );

        return;

    }



    // ===============================
    // DATA TERAKHIR
    // ===============================


    let indeksLagu =
        Number(
            localStorage.getItem(
                "indeksLagu"
            )
        );


    if(
        !Number.isInteger(indeksLagu)
        ||
        indeksLagu < 0
        ||
        indeksLagu >= daftarLagu.length
    ){

        indeksLagu = 0;

    }




    let posisiTerakhir =
        Number(
            localStorage.getItem(
                "posisiMusik"
            )
        );



    let musikSebelumnyaBerjalan =
        localStorage.getItem(
            "musikBerjalan"
        );




    // ===============================
    // TAMPILAN BUTTON
    // ===============================


    function updateButton(status){


        if(ikonMusik){

            ikonMusik.textContent =
            status
            ?
            "❚❚"
            :
            "▶";

        }


        if(teksMusik){

            teksMusik.textContent =
            status
            ?
            "Jeda"
            :
            "Putar";

        }

    }





    // ===============================
    // LIST LAGU
    // ===============================


    function isiPilihanLagu(){


        if(!pilihanLagu){

            return;

        }


        pilihanLagu.innerHTML="";


        daftarLagu.forEach(
            function(lagu,index){


                const option =
                document.createElement(
                    "option"
                );


                option.value=index;


                option.textContent =
                `${index+1}. ${lagu.judul}`;


                pilihanLagu.appendChild(
                    option
                );


            }
        );


    }





    // ===============================
    // LOAD LAGU
    // ===============================


    function loadLagu(index, autoplay=false){


        if(index < 0){

            index =
            daftarLagu.length-1;

        }


        if(index >= daftarLagu.length){

            index=0;

        }



        indeksLagu=index;



        const lagu =
        daftarLagu[indeksLagu];



        audio.src =
        lagu.file;



        judulLagu.textContent =
        lagu.judul;



        if(pilihanLagu){

            pilihanLagu.value =
            indeksLagu;

        }



        localStorage.setItem(
            "indeksLagu",
            indeksLagu
        );



        audio.load();



        audio.addEventListener(
            "loadedmetadata",
            function(){


                if(
                    Number.isFinite(
                        posisiTerakhir
                    )
                ){

                    audio.currentTime =
                    posisiTerakhir;

                }


                if(autoplay){

                    play();

                }


            },
            {
                once:true
            }
        );



    }






    // ===============================
    // PLAY
    // ===============================


    async function play(){


        try{


            await audio.play();


            updateButton(true);



            localStorage.setItem(
                "musikBerjalan",
                "true"
            );


        }

        catch(error){


            console.log(
                "Autoplay diblok browser"
            );


        }


    }




    // ===============================
    // PAUSE
    // ===============================


    function pause(){


        audio.pause();


        updateButton(false);



        localStorage.setItem(
            "musikBerjalan",
            "false"
        );


    }






    // ===============================
    // BUTTON
    // ===============================


    tombolPutar.addEventListener(
        "click",
        function(){


            if(audio.paused){

                play();

            }

            else{

                pause();

            }


        }
    );






    if(tombolNext){


        tombolNext.addEventListener(
            "click",
            function(){


                posisiTerakhir=0;


                loadLagu(
                    indeksLagu+1,
                    true
                );


            }
        );


    }





    if(tombolPrev){


        tombolPrev.addEventListener(
            "click",
            function(){


                posisiTerakhir=0;


                loadLagu(
                    indeksLagu-1,
                    true
                );


            }
        );


    }





    if(pilihanLagu){


        pilihanLagu.addEventListener(
            "change",
            function(){


                posisiTerakhir=0;


                loadLagu(
                    Number(
                        pilihanLagu.value
                    ),
                    true
                );


            }
        );


    }






    // ===============================
    // SIMPAN POSISI
    // ===============================


    audio.addEventListener(
        "timeupdate",
        function(){


            localStorage.setItem(
                "posisiMusik",
                audio.currentTime
            );


        }
    );





    audio.addEventListener(
        "playing",
        function(){


            updateButton(true);


        }
    );




    audio.addEventListener(
        "pause",
        function(){


            updateButton(false);


        }
    );






    // ===============================
    // VOLUME
    // ===============================


    let volumeAwal =
    Number(
        localStorage.getItem(
            "volumeMusik"
        )
    );


    if(
        !Number.isFinite(volumeAwal)
    ){

        volumeAwal=0.35;

    }



    audio.volume =
    volumeAwal;



    if(volume){

        volume.value =
        volumeAwal;



        volume.addEventListener(
            "input",
            function(){


                audio.volume =
                Number(
                    volume.value
                );


                localStorage.setItem(
                    "volumeMusik",
                    volume.value
                );


            }
        );

    }






    // ===============================
    // LAGU SELESAI
    // ===============================


    audio.addEventListener(
        "ended",
        function(){


            posisiTerakhir=0;


            loadLagu(
                indeksLagu+1,
                true
            );


        }
    );






    // ===============================
    // START
    // ===============================


    isiPilihanLagu();


    loadLagu(
        indeksLagu,
        musikSebelumnyaBerjalan === "true"
    );


});