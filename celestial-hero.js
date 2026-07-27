// ==========================================================
// RUANG CERITA — CELESTIAL EDITORIAL HERO V1
// Visual-only enhancement. No database changes.
// ==========================================================

(function () {
    const hero =
        document.getElementById(
            "celestialHero"
        );

    const starField =
        document.getElementById(
            "celestialHeroStars"
        );


    if (
        !hero
        || !starField
    ) {
        return;
    }


    // ------------------------------------------------------
    // Deterministic star field.
    // Same constellation atmosphere on every load.
    // ------------------------------------------------------

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


    const starCount =
        window.innerWidth
        <= 760
            ? 58
            : 96;


    const fragment =
        document
            .createDocumentFragment();


    for (
        let index = 0;
        index < starCount;
        index++
    ) {
        const star =
            document
                .createElement(
                    "i"
                );


        star.className =
            "celestial-hero-star";


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
                0.6
                + random()
                * 1.7
            }px`
        );


        star.style.setProperty(
            "--star-opacity",
            String(
                0.24
                + random()
                * 0.58
            )
        );


        star.style.setProperty(
            "--star-duration",
            `${
                2.4
                + random()
                * 4.8
            }s`
        );


        star.style.setProperty(
            "--star-delay",
            `-${
                random()
                * 6
            }s`
        );


        fragment.appendChild(
            star
        );
    }


    starField.appendChild(
        fragment
    );


    // ------------------------------------------------------
    // Very restrained desktop moon parallax.
    // It intentionally does nothing on touch/mobile.
    // ------------------------------------------------------

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
            .matches;


    const finePointer =
        window.matchMedia(
            "(pointer: fine)"
        )
            .matches;


    if (
        reducedMotion
        || !finePointer
        || window.innerWidth <= 900
    ) {
        return;
    }


    let frame =
        null;


    hero.addEventListener(
        "pointermove",
        (
            event
        ) => {
            if (frame) {
                cancelAnimationFrame(
                    frame
                );
            }


            frame =
                requestAnimationFrame(
                    () => {
                        const rect =
                            hero
                                .getBoundingClientRect();


                        const x =
                            (
                                event.clientX
                                - rect.left
                            )
                            / rect.width
                            - 0.5;


                        const y =
                            (
                                event.clientY
                                - rect.top
                            )
                            / rect.height
                            - 0.5;


                        hero.style.setProperty(
                            "--hero-parallax-x",
                            `${
                                x
                                * -9
                            }px`
                        );


                        hero.style.setProperty(
                            "--hero-parallax-y",
                            `${
                                y
                                * -6
                            }px`
                        );
                    }
                );
        }
    );


    hero.addEventListener(
        "pointerleave",
        () => {
            hero.style.setProperty(
                "--hero-parallax-x",
                "0px"
            );


            hero.style.setProperty(
                "--hero-parallax-y",
                "0px"
            );
        }
    );
})();
