// ==========================================================
// RUANG CERITA — ASTROPHILE'S SPACE V2
//
// Full-screen living sky:
// - POV from earth
// - stars
// - Milky Way
// - aurora visits
// - clouds
// - planets
// - moon motion
// - continuous moon phases
// - slow shooting stars
// - tap/click to create a slow meteor
// ==========================================================

(function () {
    const experience =
        document.getElementById(
            "astrophileExperience"
        );

    const canvas =
        document.getElementById(
            "astrophileExperienceCanvas"
        );

    const phaseName =
        document.getElementById(
            "astrophilePhaseName"
        );

    const skyState =
        document.getElementById(
            "astrophileSkyState"
        );


    if (
        !experience
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
        1;

    let height =
        1;

    let dpr =
        1;

    let elapsed =
        0;

    let lastTime =
        performance.now();

    let running =
        true;

    let pointerX =
        0;

    let pointerY =
        0;

    let targetPointerX =
        0;

    let targetPointerY =
        0;

    let nextMeteorAt =
        7;


    let stars =
        [];

    let clouds =
        [];

    let meteors =
        [];

    let mountainPoints =
        [];

    let treePoints =
        [];


    // ======================================================
    // SEEDED RANDOM
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


    function rgba(
        r,
        g,
        b,
        a
    ) {
        return (
            `rgba(${r},${g},${b},${a})`
        );
    }


    // ======================================================
    // SCENE
    // ======================================================

    function buildScene() {
        seed =
            27072026;


        stars =
            Array.from(
                {
                    length:
                        mobile()
                            ? 145
                            : 255
                },
                () => ({
                    x:
                        random(),

                    y:
                        randomRange(
                            0.01,
                            0.76
                        ),

                    size:
                        randomRange(
                            0.45,
                            2
                        ),

                    alpha:
                        randomRange(
                            0.20,
                            0.96
                        ),

                    phase:
                        randomRange(
                            0,
                            Math.PI
                            * 2
                        ),

                    twinkle:
                        randomRange(
                            1.2,
                            4.6
                        ),

                    drift:
                        randomRange(
                            0.00025,
                            0.0012
                        ),

                    depth:
                        randomRange(
                            0.18,
                            1
                        ),

                    warm:
                        random()
                        > 0.80
                })
            );


        clouds =
            Array.from(
                {
                    length:
                        mobile()
                            ? 3
                            : 6
                },
                (
                    _,
                    index
                ) => ({
                    x:
                        randomRange(
                            -0.30,
                            0.95
                        ),

                    y:
                        randomRange(
                            0.31,
                            0.68
                        ),

                    scale:
                        randomRange(
                            0.62,
                            1.32
                        ),

                    alpha:
                        randomRange(
                            0.020,
                            0.062
                        ),

                    speed:
                        randomRange(
                            0.0012,
                            0.0031
                        )
                        * (
                            index % 2
                                ? -1
                                : 1
                        )
                })
            );


        mountainPoints =
            Array.from(
                {
                    length:
                        19
                },
                (
                    _,
                    index
                ) => ({
                    x:
                        index
                        / 18,

                    y:
                        randomRange(
                            0.73,
                            0.90
                        )
                })
            );


        treePoints =
            Array.from(
                {
                    length:
                        mobile()
                            ? 28
                            : 48
                },
                () => ({
                    x:
                        random(),

                    height:
                        randomRange(
                            0.045,
                            0.135
                        ),

                    width:
                        randomRange(
                            0.006,
                            0.016
                        ),

                    layer:
                        random()
                })
            );
    }


    // ======================================================
    // RESIZE
    // ======================================================

    function resize() {
        const rect =
            canvas.getBoundingClientRect();


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
    // BACKGROUND
    // ======================================================

    function drawBackground() {
        const sky =
            context
                .createLinearGradient(
                    0,
                    0,
                    0,
                    height
                );


        sky.addColorStop(
            0,
            "#061023"
        );

        sky.addColorStop(
            0.42,
            "#10152d"
        );

        sky.addColorStop(
            0.72,
            "#1a172a"
        );

        sky.addColorStop(
            1,
            "#17131e"
        );


        context.fillStyle =
            sky;


        context.fillRect(
            0,
            0,
            width,
            height
        );


        const horizon =
            context
                .createLinearGradient(
                    0,
                    height
                    * 0.55,
                    0,
                    height
                );


        horizon.addColorStop(
            0,
            "rgba(116,110,146,0)"
        );

        horizon.addColorStop(
            0.60,
            "rgba(116,87,116,0.08)"
        );

        horizon.addColorStop(
            1,
            "rgba(13,12,19,0)"
        );


        context.fillStyle =
            horizon;


        context.fillRect(
            0,
            height
            * 0.52,
            width,
            height
            * 0.48
        );
    }


    // ======================================================
    // MILKY WAY
    // ======================================================

    function drawMilkyWay(
        time
    ) {
        context.save();


        context.translate(
            Math.sin(
                time
                * 0.018
            )
            * width
            * 0.012,
            0
        );


        context.rotate(
            -0.26
        );


        const gradient =
            context
                .createLinearGradient(
                    width
                    * 0.18,
                    0,
                    width
                    * 0.70,
                    0
                );


        gradient.addColorStop(
            0,
            "rgba(189,184,216,0)"
        );

        gradient.addColorStop(
            0.42,
            "rgba(189,184,216,0.035)"
        );

        gradient.addColorStop(
            0.52,
            "rgba(234,219,208,0.075)"
        );

        gradient.addColorStop(
            0.64,
            "rgba(167,160,199,0.035)"
        );

        gradient.addColorStop(
            1,
            "rgba(189,184,216,0)"
        );


        context.filter =
            `blur(${
                mobile()
                    ? 16
                    : 24
            }px)`;


        context.fillStyle =
            gradient;


        context.fillRect(
            width
            * 0.14,
            -height
            * 0.55,
            width
            * 0.58,
            height
            * 2
        );


        context.restore();
    }


    // ======================================================
    // AURORA
    // ======================================================

    function getAuroraStrength(
        time
    ) {
        if (
            reducedMotion
        ) {
            return 0.18;
        }


        const cycle =
            (
                time
                % 52
            )
            / 52;


        if (
            cycle < 0.27
            || cycle > 0.82
        ) {
            return 0;
        }


        if (
            cycle < 0.39
        ) {
            return (
                (
                    cycle
                    - 0.27
                )
                / 0.12
            );
        }


        if (
            cycle > 0.68
        ) {
            return (
                1
                - (
                    cycle
                    - 0.68
                )
                / 0.14
            );
        }


        return 1;
    }


    function drawAurora(
        time
    ) {
        const strength =
            getAuroraStrength(
                time
            );


        if (
            skyState
        ) {
            skyState.textContent =
                strength > 0.62
                    ? "AURORA VISIT"
                    : strength > 0.05
                        ? "AURORA APPROACHING"
                        : "MOONLIT NIGHT";
        }


        if (
            strength <= 0.004
        ) {
            return;
        }


        context.save();


        context.globalCompositeOperation =
            "screen";


        for (
            let ribbon = 0;
            ribbon < 5;
            ribbon++
        ) {
            context.beginPath();


            const baseY =
                height
                * (
                    0.18
                    + ribbon
                    * 0.064
                );


            for (
                let x = -30;
                x <= width + 30;
                x += 8
            ) {
                const nx =
                    x
                    / Math.max(
                        width,
                        1
                    );


                const y =
                    baseY
                    + Math.sin(
                        nx
                        * Math.PI
                        * (
                            2.0
                            + ribbon
                            * 0.16
                        )
                        + time
                        * (
                            0.11
                            + ribbon
                            * 0.011
                        )
                        + ribbon
                    )
                    * height
                    * 0.056
                    + Math.sin(
                        nx
                        * 7.3
                        - time
                        * 0.06
                        + ribbon
                    )
                    * height
                    * 0.015;


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


            const color =
                ribbon % 2
                    ? [
                        133,
                        218,
                        184
                    ]
                    : [
                        133,
                        190,
                        219
                    ];


            context.strokeStyle =
                rgba(
                    color[0],
                    color[1],
                    color[2],
                    strength
                    * (
                        0.055
                        + ribbon
                        * 0.010
                    )
                );


            context.lineWidth =
                mobile()
                    ? 28
                    : 44;


            context.lineCap =
                "round";


            context.filter =
                `blur(${
                    mobile()
                        ? 17
                        : 25
                }px)`;


            context.stroke();
        }


        context.restore();
    }


    // ======================================================
    // STARS
    // ======================================================

    function drawStars(
        time
    ) {
        for (
            const star
            of stars
        ) {
            const x =
                (
                    (
                        star.x
                        + time
                        * star.drift
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
                0.60
                + Math.sin(
                    time
                    * star.twinkle
                    + star.phase
                )
                * 0.40;


            const alpha =
                Math.max(
                    0.05,
                    star.alpha
                    * twinkle
                );


            const size =
                star.size
                * (
                    0.90
                    + twinkle
                    * 0.16
                );


            if (
                star.size > 1.55
            ) {
                context.beginPath();


                context.arc(
                    x,
                    y,
                    size
                    * 4,
                    0,
                    Math.PI
                    * 2
                );


                context.fillStyle =
                    star.warm
                        ? rgba(
                            255,
                            220,
                            190,
                            alpha
                            * 0.045
                        )
                        : rgba(
                            201,
                            218,
                            244,
                            alpha
                            * 0.045
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
                        228,
                        198,
                        alpha
                    )
                    : rgba(
                        227,
                        235,
                        251,
                        alpha
                    );


            context.fill();
        }
    }


    // ======================================================
    // DISTANT PLANETS
    // ======================================================

    function drawPlanets(
        time
    ) {
        const venusX =
            width
            * 0.17
            + Math.sin(
                time
                * 0.055
            )
            * 9;


        const venusY =
            height
            * 0.22
            + Math.cos(
                time
                * 0.043
            )
            * 6;


        const venusGlow =
            context
                .createRadialGradient(
                    venusX,
                    venusY,
                    0,
                    venusX,
                    venusY,
                    20
                );


        venusGlow.addColorStop(
            0,
            "rgba(255,240,210,0.95)"
        );

        venusGlow.addColorStop(
            0.15,
            "rgba(255,224,185,0.42)"
        );

        venusGlow.addColorStop(
            1,
            "rgba(255,224,185,0)"
        );


        context.fillStyle =
            venusGlow;


        context.beginPath();


        context.arc(
            venusX,
            venusY,
            20,
            0,
            Math.PI
            * 2
        );


        context.fill();


        const planetX =
            width
            * 0.90
            + Math.sin(
                time
                * 0.028
            )
            * 8;


        const planetY =
            height
            * 0.41
            + Math.cos(
                time
                * 0.026
            )
            * 7;


        context.beginPath();


        context.arc(
            planetX,
            planetY,
            mobile()
                ? 2
                : 3,
            0,
            Math.PI
            * 2
        );


        context.fillStyle =
            "rgba(167,199,203,0.50)";


        context.fill();
    }


    // ======================================================
    // MOON PHASE
    // A continuous artistic lunar cycle.
    // 0 = full, .25 = last quarter, .5 = new,
    // .75 = first quarter, 1 = full.
    // ======================================================

    function getPhaseProgress(
        time
    ) {
        if (
            reducedMotion
        ) {
            return 0;
        }


        // Deliberately slow: a full lunar visual cycle every 96 seconds.
        return (
            (
                time
                % 96
            )
            / 96
        );
    }


    function getPhaseLabel(
        progress
    ) {
        const labels = [
            "Full Moon",
            "Waning Gibbous",
            "Last Quarter",
            "Waning Crescent",
            "New Moon",
            "Waxing Crescent",
            "First Quarter",
            "Waxing Gibbous",
            "Full Moon"
        ];


        const index =
            Math.min(
                labels.length
                - 1,
                Math.round(
                    progress
                    * (
                        labels.length
                        - 1
                    )
                )
            );


        return labels[index];
    }


    function drawMoon(
        time
    ) {
        const progress =
            getPhaseProgress(
                time
            );


        if (
            phaseName
        ) {
            phaseName.textContent =
                getPhaseLabel(
                    progress
                );
        }


        const baseX =
            mobile()
                ? width
                    * 0.72
                : width
                    * 0.76;


        const baseY =
            mobile()
                ? height
                    * 0.28
                : height
                    * 0.27;


        const x =
            baseX
            + Math.sin(
                time
                * 0.035
            )
            * width
            * 0.018
            + pointerX
            * 0.48;


        const y =
            baseY
            + Math.cos(
                time
                * 0.029
            )
            * height
            * 0.016
            + pointerY
            * 0.42;


        const radius =
            Math.min(
                width,
                height
            )
            * (
                mobile()
                    ? 0.105
                    : 0.095
            );


        // Moon halo stays visible even near new moon.
        const illumination =
            Math.abs(
                Math.cos(
                    progress
                    * Math.PI
                )
            );


        const haloAlpha =
            0.08
            + illumination
            * 0.20;


        const halo =
            context
                .createRadialGradient(
                    x,
                    y,
                    radius
                    * 0.08,
                    x,
                    y,
                    radius
                    * 3.6
                );


        halo.addColorStop(
            0,
            rgba(
                255,
                239,
                205,
                haloAlpha
            )
        );

        halo.addColorStop(
            0.34,
            rgba(
                246,
                218,
                176,
                haloAlpha
                * 0.33
            )
        );

        halo.addColorStop(
            1,
            "rgba(246,218,176,0)"
        );


        context.fillStyle =
            halo;


        context.beginPath();


        context.arc(
            x,
            y,
            radius
            * 3.6,
            0,
            Math.PI
            * 2
        );


        context.fill();


        // Base dark moon disk.
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
            "#34313a";


        context.fill();


        // Clip the illuminated surface to moon disk.
        context.save();


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI
            * 2
        );


        context.clip();


        const surface =
            context
                .createRadialGradient(
                    x
                    - radius
                    * 0.34,
                    y
                    - radius
                    * 0.32,
                    radius
                    * 0.04,
                    x,
                    y,
                    radius
                );


        surface.addColorStop(
            0,
            "#fff8e5"
        );

        surface.addColorStop(
            0.40,
            "#efdbb9"
        );

        surface.addColorStop(
            0.76,
            "#c1a487"
        );

        surface.addColorStop(
            1,
            "#756873"
        );


        context.fillStyle =
            surface;


        context.fillRect(
            x
            - radius,
            y
            - radius,
            radius
            * 2,
            radius
            * 2
        );


        // Shadow overlay creates the changing phase.
        // First half = waning, second half = waxing.
        const firstHalf =
            progress
            <= 0.5;


        const local =
            firstHalf
                ? progress
                / 0.5
                : (
                    progress
                    - 0.5
                )
                / 0.5;


        // Full -> new: shadow moves rightward across moon.
        // New -> full: shadow moves leftward out.
        const shadowOffset =
            firstHalf
                ? (
                    -radius
                    * 1.7
                    + local
                    * radius
                    * 3.4
                )
                : (
                    radius
                    * 1.7
                    - local
                    * radius
                    * 3.4
                );


        context.beginPath();


        context.ellipse(
            x
            + shadowOffset,
            y,
            radius
            * 1.18,
            radius
            * 1.02,
            0,
            0,
            Math.PI
            * 2
        );


        context.fillStyle =
            "rgba(25,24,33,0.965)";


        context.fill();


        // At/near new moon, deepen whole disk.
        const newMoonFactor =
            Math.max(
                0,
                1
                - Math.abs(
                    progress
                    - 0.5
                )
                / 0.18
            );


        if (
            newMoonFactor > 0
        ) {
            context.fillStyle =
                rgba(
                    15,
                    16,
                    25,
                    newMoonFactor
                    * 0.62
                );


            context.fillRect(
                x
                - radius,
                y
                - radius,
                radius
                * 2,
                radius
                * 2
            );
        }


        // Craters remain subtle.
        context.globalAlpha =
            0.075
            * (
                0.30
                + illumination
                * 0.70
            );


        const craters = [
            [
                -0.28,
                -0.16,
                0.17
            ],
            [
                0.19,
                -0.28,
                0.10
            ],
            [
                0.31,
                0.10,
                0.14
            ],
            [
                -0.10,
                0.31,
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
                "#4c4651";


            context.fill();
        }


        context.restore();


        // Moon edge.
        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI
            * 2
        );


        context.strokeStyle =
            rgba(
                255,
                240,
                212,
                0.12
                + illumination
                * 0.14
            );


        context.lineWidth =
            Math.max(
                1,
                radius
                * 0.018
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


            const cx =
                x
                * width;


            const cy =
                cloud.y
                * height;


            const cloudWidth =
                width
                * 0.30
                * cloud.scale;


            const cloudHeight =
                height
                * 0.07
                * cloud.scale;


            const gradient =
                context
                    .createRadialGradient(
                        cx,
                        cy,
                        0,
                        cx,
                        cy,
                        cloudWidth
                    );


            gradient.addColorStop(
                0,
                rgba(
                    165,
                    168,
                    195,
                    cloud.alpha
                )
            );

            gradient.addColorStop(
                0.55,
                rgba(
                    115,
                    121,
                    153,
                    cloud.alpha
                    * 0.40
                )
            );

            gradient.addColorStop(
                1,
                "rgba(80,88,124,0)"
            );


            context.save();


            context.translate(
                cx,
                cy
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
    // SLOW METEORS
    // ======================================================

    function spawnMeteor(
        customX = null,
        customY = null
    ) {
        // Slower, softer than V1.
        const angle =
            randomRange(
                2.28,
                2.48
            );


        const speed =
            randomRange(
                120,
                185
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
                    2.7,
                    4.2
                ),

            length:
                randomRange(
                    90,
                    mobile()
                        ? 130
                        : 170
                ),

            alpha:
                randomRange(
                    0.52,
                    0.78
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


            const length =
                Math.hypot(
                    meteor.vx,
                    meteor.vy
                );


            const nx =
                meteor.vx
                / length;


            const ny =
                meteor.vy
                / length;


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
                "rgba(255,228,205,0)"
            );

            gradient.addColorStop(
                0.72,
                rgba(
                    239,
                    205,
                    203,
                    alpha
                    * 0.30
                )
            );

            gradient.addColorStop(
                1,
                rgba(
                    255,
                    247,
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
                    : 1.25;


            context.stroke();


            context.beginPath();


            context.arc(
                meteor.x,
                meteor.y,
                mobile()
                    ? 1
                    : 1.35,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                rgba(
                    255,
                    249,
                    231,
                    alpha
                );


            context.fill();
        }
    }


    // ======================================================
    // EARTH HORIZON
    // ======================================================

    function drawEarth(
        time
    ) {
        const horizonY =
            height
            * (
                mobile()
                    ? 0.80
                    : 0.77
            );


        context.beginPath();


        context.moveTo(
            0,
            height
        );


        context.lineTo(
            0,
            horizonY
        );


        mountainPoints.forEach(
            (
                point,
                index
            ) => {
                context.lineTo(
                    point.x
                    * width,
                    point.y
                    * height
                    + Math.sin(
                        time
                        * 0.010
                        + index
                    )
                    * 0.75
                );
            }
        );


        context.lineTo(
            width,
            height
        );


        context.closePath();


        const mountainGradient =
            context
                .createLinearGradient(
                    0,
                    horizonY,
                    0,
                    height
                );


        mountainGradient.addColorStop(
            0,
            "rgba(29,29,46,0.94)"
        );

        mountainGradient.addColorStop(
            1,
            "#080910"
        );


        context.fillStyle =
            mountainGradient;


        context.fill();


        // Foreground hill.
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
            * 0.82,
            width
            * 0.29,
            height
            * 0.91,
            width
            * 0.45,
            height
            * 0.85
        );


        context.bezierCurveTo(
            width
            * 0.63,
            height
            * 0.79,
            width
            * 0.79,
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
            "#06070c";


        context.fill();


        drawTrees();
    }


    function drawTrees() {
        for (
            const tree
            of treePoints
        ) {
            const x =
                tree.x
                * width;


            const baseY =
                height
                * (
                    0.86
                    + tree.layer
                    * 0.08
                );


            const treeHeight =
                height
                * tree.height;


            const treeWidth =
                width
                * tree.width;


            context.fillStyle =
                tree.layer
                > 0.46
                    ? "#04060a"
                    : "rgba(8,10,16,0.90)";


            context.fillRect(
                x
                - treeWidth
                * 0.08,
                baseY
                - treeHeight
                * 0.28,
                treeWidth
                * 0.16,
                treeHeight
                * 0.28
            );


            for (
                let level = 0;
                level < 4;
                level++
            ) {
                const levelY =
                    baseY
                    - treeHeight
                    * (
                        0.27
                        + level
                        * 0.19
                    );


                const halfWidth =
                    treeWidth
                    * (
                        1
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
                * 3
            );


        pointerY +=
            (
                targetPointerY
                - pointerY
            )
            * Math.min(
                1,
                delta
                * 3
            );


        drawBackground();
        drawMilkyWay(time);
        drawAurora(time);
        drawStars(time);
        drawPlanets(time);
        drawMoon(time);
        drawClouds(time);
        drawMeteors();
        drawEarth(time);
    }


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
                                ? 13
                                : 10,
                            mobile()
                                ? 22
                                : 18
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

    experience.addEventListener(
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


            const rect =
                experience
                    .getBoundingClientRect();


            targetPointerX =
                (
                    (
                        event.clientX
                        - rect.left
                    )
                    / rect.width
                    - 0.5
                )
                * 9;


            targetPointerY =
                (
                    (
                        event.clientY
                        - rect.top
                    )
                    / rect.height
                    - 0.5
                )
                * 7;
        }
    );


    experience.addEventListener(
        "pointerleave",
        () => {
            targetPointerX =
                0;

            targetPointerY =
                0;
        }
    );


    experience.addEventListener(
        "pointerup",
        (
            event
        ) => {
            if (
                reducedMotion
                || event.target
                    .closest(
                        "a"
                    )
            ) {
                return;
            }


            const rect =
                experience
                    .getBoundingClientRect();


            spawnMeteor(
                Math.min(
                    width
                    * 0.96,
                    Math.max(
                        width
                        * 0.16,
                        event.clientX
                        - rect.left
                    )
                ),
                Math.min(
                    height
                    * 0.67,
                    Math.max(
                        height
                        * 0.06,
                        event.clientY
                        - rect.top
                    )
                )
            );
        }
    );


    // ======================================================
    // PERFORMANCE
    // ======================================================

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
                    resize,
                    120
                );
        }
    );


    // ======================================================
    // START
    // ======================================================

    resize();


    if (
        reducedMotion
    ) {
        elapsed =
            0;

        render(
            elapsed,
            0
        );
    }


    requestAnimationFrame(
        loop
    );
})();
