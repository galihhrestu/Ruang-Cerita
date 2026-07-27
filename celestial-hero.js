// ==========================================================
// RUANG CERITA — CELESTIAL EDITORIAL HERO V2
// LIVING NIGHT SKY
//
// Visual-only enhancement.
// No database change.
// No HTML layout change.
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

    const atmosphere =
        hero?.querySelector(
            ".celestial-hero-atmosphere"
        );


    if (
        !hero
        || !starField
        || !atmosphere
    ) {
        return;
    }


    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
            .matches;

    const mobile =
        window.matchMedia(
            "(max-width: 760px)"
        )
            .matches;

    const finePointer =
        window.matchMedia(
            "(pointer: fine)"
        )
            .matches;


    // ======================================================
    // SEEDED RANDOM
    // Keeps the sky composition consistent on each load.
    // ======================================================

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


    // ======================================================
    // ORIGINAL STAR FIELD — now denser and layered.
    // ======================================================

    const starCount =
        mobile
            ? 72
            : 126;


    const starFragment =
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
                0.55
                + random()
                * 1.85
            }px`
        );


        star.style.setProperty(
            "--star-opacity",
            String(
                0.22
                + random()
                * 0.62
            )
        );


        star.style.setProperty(
            "--star-duration",
            `${
                2.4
                + random()
                * 5.8
            }s`
        );


        star.style.setProperty(
            "--star-delay",
            `-${
                random()
                * 7
            }s`
        );


        starFragment.appendChild(
            star
        );
    }


    starField.appendChild(
        starFragment
    );


    // ======================================================
    // LIVING NIGHT LAYER
    // Dynamically injected so index.html stays untouched.
    // ======================================================

    const night =
        document
            .createElement(
                "div"
            );


    night.className =
        "rc-living-night";

    night.setAttribute(
        "aria-hidden",
        "true"
    );


    // Lunar glow behind the existing crescent.
    const lunarAura =
        document
            .createElement(
                "div"
            );

    lunarAura.className =
        "rc-lunar-aura";

    night.appendChild(
        lunarAura
    );


    // Premium Saturn.
    const saturn =
        document
            .createElement(
                "div"
            );

    saturn.className =
        "rc-saturn";

    night.appendChild(
        saturn
    );


    // Slow wandering green planet.
    const wanderer =
        document
            .createElement(
                "div"
            );

    wanderer.className =
        "rc-wandering-planet";

    night.appendChild(
        wanderer
    );


    // Bright Venus-like point.
    const venus =
        document
            .createElement(
                "div"
            );

    venus.className =
        "rc-venus";

    night.appendChild(
        venus
    );


    // Small distant celestial pearl.
    const pearl =
        document
            .createElement(
                "div"
            );

    pearl.className =
        "rc-celestial-pearl";

    night.appendChild(
        pearl
    );


    // ======================================================
    // COSMIC DUST
    // ======================================================

    const dust =
        document
            .createElement(
                "div"
            );

    dust.className =
        "rc-cosmic-dust";


    const dustCount =
        mobile
            ? 19
            : 38;


    const dustFragment =
        document
            .createDocumentFragment();


    for (
        let index = 0;
        index < dustCount;
        index++
    ) {
        const particle =
            document
                .createElement(
                    "i"
                );


        particle.className =
            "rc-dust-particle";


        particle.style.setProperty(
            "--dust-size",
            `${
                0.7
                + random()
                * 1.8
            }px`
        );


        particle.style.setProperty(
            "--dust-left",
            `${
                random()
                * 100
            }%`
        );


        particle.style.setProperty(
            "--dust-top",
            `${
                random()
                * 100
            }%`
        );


        particle.style.setProperty(
            "--dust-alpha",
            String(
                0.12
                + random()
                * 0.42
            )
        );


        particle.style.setProperty(
            "--dust-duration",
            `${
                8
                + random()
                * 16
            }s`
        );


        particle.style.setProperty(
            "--dust-delay",
            `-${
                random()
                * 18
            }s`
        );


        dustFragment.appendChild(
            particle
        );
    }


    dust.appendChild(
        dustFragment
    );

    night.appendChild(
        dust
    );


    // ======================================================
    // STAR CLUSTERS
    // ======================================================

    function makeCluster(
        className,
        count
    ) {
        const cluster =
            document
                .createElement(
                    "div"
                );


        cluster.className =
            `rc-star-cluster ${className}`;


        for (
            let index = 0;
            index < count;
            index++
        ) {
            const star =
                document
                    .createElement(
                        "span"
                    );


            star.style.setProperty(
                "--cluster-size",
                `${
                    0.8
                    + random()
                    * 2.1
                }px`
            );


            star.style.setProperty(
                "--cluster-x",
                `${
                    7
                    + random()
                    * 82
                }%`
            );


            star.style.setProperty(
                "--cluster-y",
                `${
                    7
                    + random()
                    * 82
                }%`
            );


            star.style.setProperty(
                "--cluster-twinkle",
                `${
                    2
                    + random()
                    * 4.5
                }s`
            );


            star.style.setProperty(
                "--cluster-delay",
                `-${
                    random()
                    * 5
                }s`
            );


            cluster.appendChild(
                star
            );
        }


        return cluster;
    }


    night.appendChild(
        makeCluster(
            "rc-cluster-one",
            mobile
                ? 6
                : 9
        )
    );


    night.appendChild(
        makeCluster(
            "rc-cluster-two",
            7
        )
    );


    // ======================================================
    // COMETS
    // Slow enough to feel cinematic, not arcade-like.
    // ======================================================

    const cometCount =
        mobile
            ? 2
            : 4;


    for (
        let index = 0;
        index < cometCount;
        index++
    ) {
        const comet =
            document
                .createElement(
                    "i"
                );


        comet.className =
            "rc-night-comet";


        comet.style.setProperty(
            "--comet-length",
            `${
                52
                + random()
                * 58
            }px`
        );


        comet.style.setProperty(
            "--comet-left",
            `${
                52
                + random()
                * 43
            }%`
        );


        comet.style.setProperty(
            "--comet-top",
            `${
                7
                + random()
                * 56
            }%`
        );


        comet.style.setProperty(
            "--comet-angle",
            `${
                -35
                + random()
                * 12
            }deg`
        );


        comet.style.setProperty(
            "--comet-duration",
            `${
                12
                + random()
                * 11
            }s`
        );


        comet.style.setProperty(
            "--comet-delay",
            `-${
                random()
                * 18
            }s`
        );


        night.appendChild(
            comet
        );
    }


    // Put dynamic objects above atmospheric background,
    // but still behind all hero content.
    atmosphere.appendChild(
        night
    );


    // ======================================================
    // DEPTH PARALLAX — desktop only.
    // Moon uses its own custom vars; dynamic sky uses another.
    // ======================================================

    if (
        !reducedMotion
        && finePointer
        && window.innerWidth > 900
    ) {
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


                            night.style.setProperty(
                                "--sky-pointer-x",
                                `${
                                    x
                                    * 5
                                }px`
                            );


                            night.style.setProperty(
                                "--sky-pointer-y",
                                `${
                                    y
                                    * 4
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


                night.style.setProperty(
                    "--sky-pointer-x",
                    "0px"
                );


                night.style.setProperty(
                    "--sky-pointer-y",
                    "0px"
                );
            }
        );
    }
})();
