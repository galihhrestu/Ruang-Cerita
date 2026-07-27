// ==========================================================
// RUANG CERITA — WRITING WORLD SHARED UI
// ==========================================================

(function () {
    const starField =
        document.getElementById(
            "wwStarField"
        );


    if (starField) {
        let seed =
            27072026;


        function random() {
            seed =
                (
                    seed
                    * 1664525
                    + 1013904223
                )
                >>> 0;


            return (
                seed
                / 4294967296
            );
        }


        const count =
            window.innerWidth
            < 700
                ? 80
                : 145;


        const fragment =
            document
                .createDocumentFragment();


        for (
            let index = 0;
            index < count;
            index++
        ) {
            const star =
                document
                    .createElement(
                        "i"
                    );


            star.className =
                "ww-star";


            star.style.left =
                `${
                    random()
                    * 100
                }%`;


            star.style.top =
                `${
                    random()
                    * 100
                }%`;


            star.style.setProperty(
                "--star-size",
                `${
                    0.7
                    + random()
                    * 1.8
                }px`
            );


            star.style.setProperty(
                "--star-alpha",
                String(
                    0.22
                    + random()
                    * 0.58
                )
            );


            star.style.setProperty(
                "--star-duration",
                `${
                    2.3
                    + random()
                    * 4.5
                }s`
            );


            star.style.setProperty(
                "--star-delay",
                `-${
                    random()
                    * 5
                }s`
            );


            fragment.appendChild(
                star
            );
        }


        starField.appendChild(
            fragment
        );
    }


    document.addEventListener(
        "click",
        (event) => {
            document
                .querySelectorAll(
                    ".ww-music-more[open]"
                )
                .forEach(
                    (details) => {
                        if (
                            !details.contains(
                                event.target
                            )
                        ) {
                            details.open =
                                false;
                        }
                    }
                );
        }
    );
})();
