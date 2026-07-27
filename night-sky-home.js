// ==========================================================
// RUANG CERITA — ASTROPHILE'S WINDOW V1
// "The Night Above Us"
//
// Generative moving night sky:
// - moon
// - stars
// - Milky Way haze
// - aurora visits
// - clouds
// - meteors
// - distant planets
// - mountain / forest horizon
//
// Optimized:
// - DPR capped at 2
// - IntersectionObserver pauses when off-screen
// - document visibility aware
// - reduced-motion aware
// ==========================================================

(function () {
    const windowElement =
        document.getElementById(
            "astrophileWindow"
        );

    const canvas =
        document.getElementById(
            "astrophileSkyCanvas"
        );

    const moodElement =
        document.getElementById(
            "astrophileSkyMood"
        );


    if (
        !windowElement
        || !canvas
    ) {
        return;
    }


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: false
            }
        );


    if (!context) {
        return;
    }


    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
            .matches;


    const mobile =
        () =>
            window.innerWidth
            <= 700;


    let width =
        0;

    let height =
        0;

    let dpr =
        1;

    let running =
        true;

    let visible =
        true;

    let lastTime =
        performance.now();

    let elapsed =
        0;

    let pointerX =
        0;

    let pointerY =
        0;

    let targetPointerX =
        0;

    let targetPointerY =
        0;

    let nextMeteorAt =
        4.5;

    let activeMood =
        "MOONLIT NIGHT";


    // ======================================================
    // SEEDED RANDOM
    // ======================================================

    let seed =
        14022026;


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


    function randomRange(
        min,
        max
    ) {
        return (
            min
            + random()
            * (
                max
                - min
            )
        );
    }


    // ======================================================
    // SCENE DATA
    // ======================================================

    let stars =
        [];

    let meteors =
        [];

    let clouds =
        [];

    let mountainSeed =
        [];

    let treeSeed =
        [];


    function buildScene() {
        seed =
            14022026;


        const starCount =
            mobile()
                ? 105
                : 190;


        stars =
            Array.from(
                {
                    length:
                        starCount
                },
                () => ({
                    x:
                        random(),

                    y:
                        randomRange(
                            0.02,
                            0.77
                        ),

                    size:
                        randomRange(
                            0.45,
                            1.9
                        ),

                    alpha:
                        randomRange(
                            0.22,
                            0.92
                        ),

                    speed:
                        randomRange(
                            0.0015,
                            0.006
                        ),

                    twinkle:
                        randomRange(
                            1.2,
                            4.8
                        ),

                    phase:
                        randomRange(
                            0,
                            Math.PI
                            * 2
                        ),

                    warm:
                        random()
                        > 0.77,

                    depth:
                        randomRange(
                            0.25,
                            1
                        )
                })
            );


        clouds =
            Array.from(
                {
                    length:
                        mobile()
                            ? 3
                            : 5
                },
                (
                    _,
                    index
                ) => ({
                    x:
                        randomRange(
                            -0.25,
                            0.90
                        ),

                    y:
                        randomRange(
                            0.29,
                            0.69
                        ),

                    scale:
                        randomRange(
                            0.65,
                            1.35
                        ),

                    alpha:
                        randomRange(
                            0.025,
                            0.075
                        ),

                    speed:
                        randomRange(
                            0.002,
                            0.005
                        )
                        * (
                            index % 2
                                ? -1
                                : 1
                        )
                })
            );


        mountainSeed =
            Array.from(
                {
                    length:
                        17
                },
                (
                    _,
                    index
                ) => ({
                    x:
                        index
                        / 16,

                    y:
                        randomRange(
                            0.72,
                            0.91
                        )
                })
            );


        treeSeed =
            Array.from(
                {
                    length:
                        mobile()
                            ? 24
                            : 42
                },
                () => ({
                    x:
                        random(),

                    height:
                        randomRange(
                            0.04,
                            0.13
                        ),

                    width:
                        randomRange(
                            0.008,
                            0.018
                        ),

                    layer:
                        random()
                })
            );
    }


    // ======================================================
    // RESIZE
    // ======================================================

    function resizeCanvas() {
        const rect =
            canvas
                .getBoundingClientRect();


        width =
            Math.max(
                1,
                rect.width
            );

        height =
            Math.max(
                1,
                rect.height
            );


        dpr =
            Math.min(
                window.devicePixelRatio
                || 1,
                2
            );


        canvas.width =
            Math.round(
                width
                * dpr
            );


        canvas.height =
            Math.round(
                height
                * dpr
            );


        context.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        buildScene();
    }


    // ======================================================
    // COLOR HELPERS
    // ======================================================

    function rgba(
        red,
        green,
        blue,
        alpha
    ) {
        return (
            `rgba(${red},${green},${blue},${alpha})`
        );
    }


    // ======================================================
    // SKY BACKGROUND
    // ======================================================

    function drawSky(
        time
    ) {
        const gradient =
            context
                .createLinearGradient(
                    0,
                    0,
                    0,
                    height
                );


        gradient.addColorStop(
            0,
            "#071124"
        );

        gradient.addColorStop(
            0.40,
            "#11152c"
        );

        gradient.addColorStop(
            0.72,
            "#1a172b"
        );

        gradient.addColorStop(
            1,
            "#17131f"
        );


        context.fillStyle =
            gradient;


        context.fillRect(
            0,
            0,
            width,
            height
        );


        // Moonlight ambient glow.
        const moonGlow =
            context
                .createRadialGradient(
                    width
                    * 0.76,
                    height
                    * 0.24,
                    0,
                    width
                    * 0.76,
                    height
                    * 0.24,
                    Math.max(
                        width,
                        height
                    )
                    * 0.50
                );


        moonGlow.addColorStop(
            0,
            rgba(
                239,
                220,
                184,
                0.10
            )
        );

        moonGlow.addColorStop(
            0.38,
            rgba(
                139,
                119,
                145,
                0.055
            )
        );

        moonGlow.addColorStop(
            1,
            rgba(
                12,
                17,
                35,
                0
            )
        );


        context.fillStyle =
            moonGlow;


        context.fillRect(
            0,
            0,
            width,
            height
        );


        // Soft horizon glow.
        const horizon =
            context
                .createLinearGradient(
                    0,
                    height
                    * 0.58,
                    0,
                    height
                );


        horizon.addColorStop(
            0,
            rgba(
                104,
                102,
                132,
                0
            )
        );

        horizon.addColorStop(
            0.60,
            rgba(
                125,
                92,
                116,
                0.08
            )
        );

        horizon.addColorStop(
            1,
            rgba(
                16,
                14,
                25,
                0
            )
        );


        context.fillStyle =
            horizon;


        context.fillRect(
            0,
            height
            * 0.55,
            width,
            height
            * 0.45
        );
    }


    // ======================================================
    // MILKY WAY
    // ======================================================

    function drawMilkyWay(
        time
    ) {
        context.save();


        const drift =
            Math.sin(
                time
                * 0.025
            )
            * width
            * 0.012;


        context.translate(
            drift,
            0
        );


        context.rotate(
            -0.24
        );


        const x =
            width
            * 0.36;

        const y =
            height
            * 0.38;


        const gradient =
            context
                .createLinearGradient(
                    x
                    - width
                    * 0.18,
                    0,
                    x
                    + width
                    * 0.28,
                    0
                );


        gradient.addColorStop(
            0,
            rgba(
                186,
                181,
                213,
                0
            )
        );

        gradient.addColorStop(
            0.42,
            rgba(
                193,
                183,
                211,
                0.035
            )
        );

        gradient.addColorStop(
            0.52,
            rgba(
                234,
                217,
                208,
                0.07
            )
        );

        gradient.addColorStop(
            0.64,
            rgba(
                167,
                160,
                197,
                0.035
            )
        );

        gradient.addColorStop(
            1,
            rgba(
                186,
                181,
                213,
                0
            )
        );


        context.filter =
            `blur(${
                mobile()
                    ? 14
                    : 20
            }px)`;


        context.fillStyle =
            gradient;


        context.fillRect(
            x
            - width
            * 0.26,
            y
            - height,
            width
            * 0.60,
            height
            * 2.2
        );


        context.restore();
    }


    // ======================================================
    // AURORA
    // Appears in long, soft visits instead of being permanent.
    // ======================================================

    function auroraStrength(
        time
    ) {
        if (
            reducedMotion
        ) {
            return 0.18;
        }


        // 38-second cycle:
        // quiet → arrival → full aurora → fade → quiet
        const cycle =
            (
                time
                % 38
            )
            / 38;


        if (
            cycle < 0.22
            || cycle > 0.82
        ) {
            return 0;
        }


        if (
            cycle < 0.36
        ) {
            return (
                (
                    cycle
                    - 0.22
                )
                / 0.14
            );
        }


        if (
            cycle > 0.67
        ) {
            return (
                1
                - (
                    cycle
                    - 0.67
                )
                / 0.15
            );
        }


        return 1;
    }


    function drawAurora(
        time
    ) {
        const strength =
            auroraStrength(
                time
            );


        if (
            strength <= 0.005
        ) {
            setMood(
                "MOONLIT NIGHT"
            );

            return;
        }


        setMood(
            strength > 0.62
                ? "AURORA VISIT"
                : "AURORA APPROACHING"
        );


        context.save();


        context.globalCompositeOperation =
            "screen";


        for (
            let ribbon = 0;
            ribbon < 4;
            ribbon++
        ) {
            context.beginPath();


            const baseY =
                height
                * (
                    0.20
                    + ribbon
                    * 0.075
                );


            for (
                let x = -30;
                x <= width + 30;
                x += 8
            ) {
                const normalized =
                    x
                    / Math.max(
                        width,
                        1
                    );


                const wave =
                    Math.sin(
                        normalized
                        * Math.PI
                        * (
                            2.1
                            + ribbon
                            * 0.2
                        )
                        + time
                        * (
                            0.18
                            + ribbon
                            * 0.018
                        )
                        + ribbon
                    );


                const secondWave =
                    Math.sin(
                        normalized
                        * 7.2
                        - time
                        * 0.10
                        + ribbon
                        * 0.8
                    );


                const y =
                    baseY
                    + wave
                    * height
                    * 0.055
                    + secondWave
                    * height
                    * 0.018;


                if (
                    x === -30
                ) {
                    context.moveTo(
                        x,
                        y
                    );
                } else {
                    context.lineTo(
                        x,
                        y
                    );
                }
            }


            const hue =
                ribbon % 2
                    ? "137, 218, 185"
                    : "132, 188, 218";


            context.strokeStyle =
                `rgba(${hue},${
                    strength
                    * (
                        0.07
                        + ribbon
                        * 0.014
                    )
                })`;


            context.lineWidth =
                mobile()
                    ? 24
                    : 38;


            context.lineCap =
                "round";


            context.filter =
                `blur(${
                    mobile()
                        ? 15
                        : 23
                }px)`;


            context.stroke();
        }


        // Pink-lilac edge.
        context.beginPath();


        for (
            let x = -30;
            x <= width + 30;
            x += 8
        ) {
            const normalized =
                x
                / Math.max(
                    width,
                    1
                );


            const y =
                height
                * 0.265
                + Math.sin(
                    normalized
                    * Math.PI
                    * 2.5
                    + time
                    * 0.17
                )
                * height
                * 0.055;


            if (
                x === -30
            ) {
                context.moveTo(
                    x,
                    y
                );
            } else {
                context.lineTo(
                    x,
                    y
                );
            }
        }


        context.strokeStyle =
            rgba(
                219,
                153,
                205,
                strength
                * 0.045
            );


        context.lineWidth =
            mobile()
                ? 20
                : 32;


        context.filter =
            `blur(${
                mobile()
                    ? 14
                    : 22
            }px)`;


        context.stroke();


        context.restore();
    }


    // ======================================================
    // STARS
    // ======================================================

    function drawStars(
        time
    ) {
        const drift =
            (
                time
                * 0.0005
            )
            % 1;


        for (
            const star
            of stars
        ) {
            const x =
                (
                    (
                        star.x
                        + drift
                        * star.speed
                        * 12
                    )
                    % 1
                )
                * width
                + pointerX
                * star.depth;


            const y =
                star.y
                * height
                + pointerY
                * star.depth;


            const twinkle =
                0.58
                + Math.sin(
                    time
                    * star.twinkle
                    + star.phase
                )
                * 0.42;


            const alpha =
                Math.max(
                    0.06,
                    star.alpha
                    * twinkle
                );


            const size =
                star.size
                * (
                    0.86
                    + twinkle
                    * 0.20
                );


            if (
                star.size > 1.45
            ) {
                context.beginPath();


                context.arc(
                    x,
                    y,
                    size
                    * 3.8,
                    0,
                    Math.PI
                    * 2
                );


                context.fillStyle =
                    star.warm
                        ? rgba(
                            238,
                            206,
                            179,
                            alpha
                            * 0.055
                        )
                        : rgba(
                            191,
                            210,
                            237,
                            alpha
                            * 0.055
                        );


                context.fill();
            }


            context.beginPath();


            context.arc(
                x,
                y,
                size,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                star.warm
                    ? rgba(
                        255,
                        226,
                        193,
                        alpha
                    )
                    : rgba(
                        224,
                        232,
                        249,
                        alpha
                    );


            context.fill();
        }
    }


    // ======================================================
    // PLANETS
    // ======================================================

    function drawPlanets(
        time
    ) {
        // Venus.
        const venusX =
            width
            * 0.18
            + Math.sin(
                time
                * 0.09
            )
            * 8;


        const venusY =
            height
            * 0.23
            + Math.cos(
                time
                * 0.07
            )
            * 5;


        const glow =
            context
                .createRadialGradient(
                    venusX,
                    venusY,
                    0,
                    venusX,
                    venusY,
                    16
                );


        glow.addColorStop(
            0,
            rgba(
                255,
                239,
                207,
                0.85
            )
        );

        glow.addColorStop(
            0.14,
            rgba(
                255,
                226,
                187,
                0.42
            )
        );

        glow.addColorStop(
            1,
            rgba(
                255,
                226,
                187,
                0
            )
        );


        context.fillStyle =
            glow;


        context.beginPath();


        context.arc(
            venusX,
            venusY,
            16,
            0,
            Math.PI
            * 2
        );


        context.fill();


        // Tiny cold planet.
        const planetX =
            width
            * 0.91
            + Math.sin(
                time
                * 0.045
            )
            * 7;


        const planetY =
            height
            * 0.39
            + Math.cos(
                time
                * 0.04
            )
            * 6;


        const planetRadius =
            mobile()
                ? 2.2
                : 3.2;


        context.beginPath();


        context.arc(
            planetX,
            planetY,
            planetRadius,
            0,
            Math.PI
            * 2
        );


        context.fillStyle =
            rgba(
                172,
                202,
                204,
                0.56
            );


        context.fill();
    }


    // ======================================================
    // MOON
    // ======================================================

    function drawMoon(
        time
    ) {
        const baseX =
            mobile()
                ? width
                    * 0.73
                : width
                    * 0.77;


        const baseY =
            mobile()
                ? height
                    * 0.24
                : height
                    * 0.25;


        const x =
            baseX
            + Math.sin(
                time
                * 0.055
            )
            * width
            * 0.018
            + pointerX
            * 0.45;


        const y =
            baseY
            + Math.cos(
                time
                * 0.043
            )
            * height
            * 0.017
            + pointerY
            * 0.40;


        const radius =
            Math.min(
                width,
                height
            )
            * (
                mobile()
                    ? 0.105
                    : 0.091
            );


        // Big glow.
        const halo =
            context
                .createRadialGradient(
                    x,
                    y,
                    radius
                    * 0.15,
                    x,
                    y,
                    radius
                    * 3.35
                );


        halo.addColorStop(
            0,
            rgba(
                255,
                240,
                208,
                0.26
            )
        );

        halo.addColorStop(
            0.24,
            rgba(
                250,
                223,
                181,
                0.12
            )
        );

        halo.addColorStop(
            0.55,
            rgba(
                208,
                177,
                162,
                0.045
            )
        );

        halo.addColorStop(
            1,
            rgba(
                208,
                177,
                162,
                0
            )
        );


        context.fillStyle =
            halo;


        context.beginPath();


        context.arc(
            x,
            y,
            radius
            * 3.35,
            0,
            Math.PI
            * 2
        );


        context.fill();


        // Moon sphere.
        const moonGradient =
            context
                .createRadialGradient(
                    x
                    - radius
                    * 0.32,
                    y
                    - radius
                    * 0.31,
                    radius
                    * 0.06,
                    x,
                    y,
                    radius
                );


        moonGradient.addColorStop(
            0,
            "#fff9e8"
        );

        moonGradient.addColorStop(
            0.38,
            "#f0dcb9"
        );

        moonGradient.addColorStop(
            0.72,
            "#c8ab8a"
        );

        moonGradient.addColorStop(
            1,
            "#79696e"
        );


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI
            * 2
        );


        context.fillStyle =
            moonGradient;


        context.fill();


        // Soft craters.
        context.save();


        context.globalAlpha =
            0.09;


        const craters = [
            [
                -0.28,
                -0.16,
                0.17
            ],
            [
                0.18,
                -0.27,
                0.10
            ],
            [
                0.31,
                0.09,
                0.14
            ],
            [
                -0.11,
                0.30,
                0.12
            ],
            [
                0.03,
                0.04,
                0.20
            ]
        ];


        for (
            const crater
            of craters
        ) {
            context.beginPath();


            context.arc(
                x
                + crater[0]
                * radius,
                y
                + crater[1]
                * radius,
                crater[2]
                * radius,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                "#5e5760";


            context.fill();
        }


        context.restore();


        // Highlight edge.
        context.beginPath();


        context.arc(
            x,
            y,
            radius
            * 0.94,
            -2.24,
            -0.54
        );


        context.strokeStyle =
            rgba(
                255,
                252,
                231,
                0.28
            );


        context.lineWidth =
            Math.max(
                1,
                radius
                * 0.025
            );


        context.stroke();
    }


    // ======================================================
    // CLOUDS
    // ======================================================

    function drawClouds(
        time
    ) {
        for (
            const cloud
            of clouds
        ) {
            let x =
                (
                    cloud.x
                    + time
                    * cloud.speed
                )
                % 1.5;


            if (
                x < -0.35
            ) {
                x += 1.5;
            }


            const centerX =
                x
                * width;


            const centerY =
                cloud.y
                * height;


            const cloudWidth =
                width
                * 0.28
                * cloud.scale;


            const cloudHeight =
                height
                * 0.07
                * cloud.scale;


            const gradient =
                context
                    .createRadialGradient(
                        centerX,
                        centerY,
                        0,
                        centerX,
                        centerY,
                        cloudWidth
                    );


            gradient.addColorStop(
                0,
                rgba(
                    168,
                    171,
                    196,
                    cloud.alpha
                )
            );

            gradient.addColorStop(
                0.50,
                rgba(
                    117,
                    122,
                    154,
                    cloud.alpha
                    * 0.43
                )
            );

            gradient.addColorStop(
                1,
                rgba(
                    85,
                    91,
                    125,
                    0
                )
            );


            context.save();


            context.translate(
                centerX,
                centerY
            );


            context.scale(
                1,
                cloudHeight
                / cloudWidth
            );


            context.beginPath();


            context.arc(
                0,
                0,
                cloudWidth,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                gradient;


            context.fill();


            context.restore();
        }
    }


    // ======================================================
    // METEORS
    // ======================================================

    function spawnMeteor(
        customX = null,
        customY = null
    ) {
        const angle =
            randomRange(
                2.25,
                2.55
            );


        const speed =
            randomRange(
                420,
                610
            );


        meteors.push({
            x:
                customX
                ?? randomRange(
                    width
                    * 0.48,
                    width
                    * 0.96
                ),

            y:
                customY
                ?? randomRange(
                    height
                    * 0.06,
                    height
                    * 0.42
                ),

            vx:
                Math.cos(
                    angle
                )
                * speed,

            vy:
                Math.sin(
                    angle
                )
                * speed,

            life:
                0,

            maxLife:
                randomRange(
                    0.70,
                    1.12
                ),

            length:
                randomRange(
                    70,
                    mobile()
                        ? 105
                        : 150
                ),

            alpha:
                randomRange(
                    0.58,
                    0.90
                )
        });
    }


    function updateMeteors(
        delta
    ) {
        for (
            const meteor
            of meteors
        ) {
            meteor.life +=
                delta;


            meteor.x +=
                meteor.vx
                * delta;


            meteor.y +=
                meteor.vy
                * delta;
        }


        meteors =
            meteors.filter(
                (
                    meteor
                ) =>
                    meteor.life
                    < meteor.maxLife
            );
    }


    function drawMeteors() {
        for (
            const meteor
            of meteors
        ) {
            const progress =
                meteor.life
                / meteor.maxLife;


            const alpha =
                Math.sin(
                    Math.min(
                        1,
                        progress
                    )
                    * Math.PI
                )
                * meteor.alpha;


            const velocityLength =
                Math.hypot(
                    meteor.vx,
                    meteor.vy
                );


            const nx =
                meteor.vx
                / velocityLength;


            const ny =
                meteor.vy
                / velocityLength;


            const tailX =
                meteor.x
                - nx
                * meteor.length;


            const tailY =
                meteor.y
                - ny
                * meteor.length;


            const gradient =
                context
                    .createLinearGradient(
                        tailX,
                        tailY,
                        meteor.x,
                        meteor.y
                    );


            gradient.addColorStop(
                0,
                rgba(
                    255,
                    229,
                    205,
                    0
                )
            );

            gradient.addColorStop(
                0.72,
                rgba(
                    241,
                    207,
                    205,
                    alpha
                    * 0.36
                )
            );

            gradient.addColorStop(
                1,
                rgba(
                    255,
                    248,
                    224,
                    alpha
                )
            );


            context.beginPath();


            context.moveTo(
                tailX,
                tailY
            );


            context.lineTo(
                meteor.x,
                meteor.y
            );


            context.strokeStyle =
                gradient;


            context.lineWidth =
                mobile()
                    ? 1
                    : 1.35;


            context.stroke();


            context.beginPath();


            context.arc(
                meteor.x,
                meteor.y,
                mobile()
                    ? 1.1
                    : 1.5,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                rgba(
                    255,
                    250,
                    232,
                    alpha
                );


            context.fill();
        }
    }


    // ======================================================
    // EARTH POV — MOUNTAINS / TREES
    // ======================================================

    function drawMountains(
        time
    ) {
        const horizonY =
            height
            * (
                mobile()
                    ? 0.78
                    : 0.76
            );


        // Far mountain.
        context.beginPath();


        context.moveTo(
            0,
            height
        );


        context.lineTo(
            0,
            horizonY
        );


        mountainSeed.forEach(
            (
                point,
                index
            ) => {
                const x =
                    point.x
                    * width;


                const y =
                    point.y
                    * height
                    + Math.sin(
                        time
                        * 0.018
                        + index
                    )
                    * 1.1;


                context.lineTo(
                    x,
                    y
                );
            }
        );


        context.lineTo(
            width,
            height
        );


        context.closePath();


        const farGradient =
            context
                .createLinearGradient(
                    0,
                    horizonY,
                    0,
                    height
                );


        farGradient.addColorStop(
            0,
            rgba(
                31,
                31,
                48,
                0.90
            )
        );

        farGradient.addColorStop(
            1,
            "#090a12"
        );


        context.fillStyle =
            farGradient;


        context.fill();


        // Near rolling hill.
        context.beginPath();


        context.moveTo(
            0,
            height
        );


        context.lineTo(
            0,
            height
            * 0.88
        );


        context.bezierCurveTo(
            width
            * 0.17,
            height
            * 0.81,
            width
            * 0.28,
            height
            * 0.90,
            width
            * 0.44,
            height
            * 0.85
        );


        context.bezierCurveTo(
            width
            * 0.63,
            height
            * 0.78,
            width
            * 0.78,
            height
            * 0.92,
            width,
            height
            * 0.84
        );


        context.lineTo(
            width,
            height
        );


        context.closePath();


        context.fillStyle =
            "#07080e";


        context.fill();


        drawTrees();
    }


    function drawTrees() {
        for (
            const tree
            of treeSeed
        ) {
            const x =
                tree.x
                * width;


            const baseY =
                height
                * (
                    0.85
                    + tree.layer
                    * 0.09
                );


            const treeHeight =
                height
                * tree.height;


            const treeWidth =
                width
                * tree.width;


            context.fillStyle =
                tree.layer
                > 0.48
                    ? "#05070b"
                    : rgba(
                        9,
                        11,
                        17,
                        0.88
                    );


            // trunk
            context.fillRect(
                x
                - treeWidth
                * 0.08,
                baseY
                - treeHeight
                * 0.30,
                treeWidth
                * 0.16,
                treeHeight
                * 0.30
            );


            // pine crown
            for (
                let level = 0;
                level < 4;
                level++
            ) {
                const levelY =
                    baseY
                    - treeHeight
                    * (
                        0.26
                        + level
                        * 0.19
                    );


                const halfWidth =
                    treeWidth
                    * (
                        1.0
                        - level
                        * 0.16
                    );


                context.beginPath();


                context.moveTo(
                    x,
                    levelY
                    - treeHeight
                    * 0.23
                );


                context.lineTo(
                    x
                    - halfWidth,
                    levelY
                    + treeHeight
                    * 0.13
                );


                context.lineTo(
                    x
                    + halfWidth,
                    levelY
                    + treeHeight
                    * 0.13
                );


                context.closePath();


                context.fill();
            }
        }
    }


    // ======================================================
    // MOOD
    // ======================================================

    function setMood(
        nextMood
    ) {
        if (
            nextMood
            === activeMood
        ) {
            return;
        }


        activeMood =
            nextMood;


        if (
            moodElement
        ) {
            moodElement.textContent =
                nextMood;
        }
    }


    // ======================================================
    // RENDER
    // ======================================================

    function render(
        time,
        delta
    ) {
        pointerX +=
            (
                targetPointerX
                - pointerX
            )
            * Math.min(
                1,
                delta
                * 3.5
            );


        pointerY +=
            (
                targetPointerY
                - pointerY
            )
            * Math.min(
                1,
                delta
                * 3.5
            );


        drawSky(
            time
        );

        drawMilkyWay(
            time
        );

        drawAurora(
            time
        );

        drawStars(
            time
        );

        drawPlanets(
            time
        );

        drawMoon(
            time
        );

        drawClouds(
            time
        );

        drawMeteors();

        drawMountains(
            time
        );
    }


    // ======================================================
    // LOOP
    // ======================================================

    function loop(
        now
    ) {
        const delta =
            Math.min(
                0.05,
                Math.max(
                    0,
                    (
                        now
                        - lastTime
                    )
                    / 1000
                )
            );


        lastTime =
            now;


        if (
            running
            && visible
        ) {
            if (
                !reducedMotion
            ) {
                elapsed +=
                    delta;


                if (
                    elapsed
                    >= nextMeteorAt
                ) {
                    spawnMeteor();


                    nextMeteorAt =
                        elapsed
                        + randomRange(
                            mobile()
                                ? 10
                                : 6,
                            mobile()
                                ? 18
                                : 13
                        );
                }


                updateMeteors(
                    delta
                );
            }


            render(
                elapsed,
                delta
            );
        }


        requestAnimationFrame(
            loop
        );
    }


    // ======================================================
    // INTERACTION
    // ======================================================

    function updatePointer(
        clientX,
        clientY
    ) {
        const rect =
            windowElement
                .getBoundingClientRect();


        const normalizedX =
            (
                clientX
                - rect.left
            )
            / Math.max(
                rect.width,
                1
            )
            - 0.5;


        const normalizedY =
            (
                clientY
                - rect.top
            )
            / Math.max(
                rect.height,
                1
            )
            - 0.5;


        targetPointerX =
            normalizedX
            * (
                mobile()
                    ? 0
                    : 8
            );


        targetPointerY =
            normalizedY
            * (
                mobile()
                    ? 0
                    : 6
            );
    }


    windowElement.addEventListener(
        "pointermove",
        (
            event
        ) => {
            if (
                reducedMotion
                || mobile()
            ) {
                return;
            }


            updatePointer(
                event.clientX,
                event.clientY
            );
        }
    );


    windowElement.addEventListener(
        "pointerleave",
        () => {
            targetPointerX =
                0;

            targetPointerY =
                0;
        }
    );


    // Tap/click = personal shooting star.
    windowElement.addEventListener(
        "pointerup",
        (
            event
        ) => {
            if (
                reducedMotion
            ) {
                return;
            }


            const rect =
                windowElement
                    .getBoundingClientRect();


            const x =
                event.clientX
                - rect.left;


            const y =
                event.clientY
                - rect.top;


            // Keep meteor in sky rather than below mountain horizon.
            spawnMeteor(
                Math.min(
                    width
                    * 0.96,
                    Math.max(
                        width
                        * 0.15,
                        x
                    )
                ),
                Math.min(
                    height
                    * 0.68,
                    Math.max(
                        height
                        * 0.07,
                        y
                    )
                )
            );
        }
    );


    // ======================================================
    // VISIBILITY / PERFORMANCE
    // ======================================================

    const observer =
        new IntersectionObserver(
            (
                entries
            ) => {
                visible =
                    entries[0]
                        ?.isIntersecting
                    ?? true;
            },
            {
                threshold:
                    0.03
            }
        );


    observer.observe(
        windowElement
    );


    document.addEventListener(
        "visibilitychange",
        () => {
            running =
                !document.hidden;


            lastTime =
                performance.now();
        }
    );


    let resizeTimer =
        null;


    window.addEventListener(
        "resize",
        () => {
            window.clearTimeout(
                resizeTimer
            );


            resizeTimer =
                window.setTimeout(
                    () => {
                        resizeCanvas();
                    },
                    120
                );
        }
    );


    // ======================================================
    // START
    // ======================================================

    resizeCanvas();


    if (
        reducedMotion
    ) {
        elapsed =
            14;

        spawnMeteor(
            width
            * 0.84,
            height
            * 0.30
        );

        render(
            elapsed,
            0
        );
    }


    requestAnimationFrame(
        loop
    );
})();
