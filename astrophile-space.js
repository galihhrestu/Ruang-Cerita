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

    const constellationCount =
        document.getElementById(
            "astrophileConstellationCount"
        );

    const twinStarsCount =
        document.getElementById(
            "astrophileTwinStarsCount"
        );

    const wishCount =
        document.getElementById(
            "astrophileWishCount"
        );

    const toast =
        document.getElementById(
            "astrophileToast"
        );

    const toastEyebrow =
        document.getElementById(
            "astrophileToastEyebrow"
        );

    const toastTitle =
        document.getElementById(
            "astrophileToastTitle"
        );

    const toastText =
        document.getElementById(
            "astrophileToastText"
        );

    const whisperOverlay =
        document.getElementById(
            "astrophileWhisperOverlay"
        );

    const whisperEyebrow =
        document.getElementById(
            "astrophileWhisperEyebrow"
        );

    const whisperTitle =
        document.getElementById(
            "astrophileWhisperTitle"
        );

    const whisperText =
        document.getElementById(
            "astrophileWhisperText"
        );

    const wishOverlay =
        document.getElementById(
            "astrophileWishOverlay"
        );

    const wishInput =
        document.getElementById(
            "astrophileWishInput"
        );

    const saveWishButton =
        document.getElementById(
            "astrophileSaveWishButton"
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


    const embeddedMode =
        new URLSearchParams(
            window.location.search
        )
            .get(
                "embedded"
            )
            === "1";


    const backButton =
        document.querySelector(
            ".astrophile-back"
        );


    if (
        embeddedMode
        && backButton
    ) {
        backButton.addEventListener(
            "click",
            (
                event
            ) => {
                event.preventDefault();


                window.parent.postMessage(
                    {
                        type:
                            "ASTROPHILE_SPACE_CLOSE"
                    },
                    window.location.origin
                );
            }
        );
    }


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

    let birdFlocks =
        [];

    let nextBirdAt =
        16;

    let mountainPoints =
        [];

    let treePoints =
        [];

    let toastTimer =
        null;

    let longPressTimer =
        null;

    let longPressTriggered =
        false;

    let pointerDownInfo =
        null;

    let overlayOpen =
        false;

    let moonMetrics = {
        x: 0,
        y: 0,
        radius: 0,
        progress: 0,
        isSuperMoon: false
    };

    const storagePrefix =
        "ruangCerita.astrophile.livingSky.v4";

    const constellationKey =
        `${storagePrefix}.constellation`;

    const twinStarsKey =
        `${storagePrefix}.twinStars`;

    const wishesKey =
        `${storagePrefix}.wishes`;

    const specialStars = {
        constellation: [
            {
                id: "constellation-1",
                label: "Star I",
                x: 0.24,
                y: 0.26
            },
            {
                id: "constellation-2",
                label: "Star II",
                x: 0.31,
                y: 0.19
            },
            {
                id: "constellation-3",
                label: "Star III",
                x: 0.38,
                y: 0.25
            },
            {
                id: "constellation-4",
                label: "Star IV",
                x: 0.32,
                y: 0.33
            }
        ],

        twin: [
            {
                id: "galih-star",
                label: "Galih",
                x: 0.63,
                y: 0.17
            },
            {
                id: "wisye-star",
                label: "Wisye",
                x: 0.84,
                y: 0.20
            }
        ]
    };

    let foundConstellation =
        new Set();

    let foundTwinStars =
        new Set();

    let wishes =
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



    function loadStoredArray(
        key
    ) {
        try {
            const raw =
                window.localStorage.getItem(
                    key
                );

            if (!raw) {
                return [];
            }

            const value =
                JSON.parse(
                    raw
                );

            return Array.isArray(
                value
            )
                ? value
                : [];
        } catch (
            error
        ) {
            return [];
        }
    }


    function saveStoredArray(
        key,
        value
    ) {
        try {
            window.localStorage.setItem(
                key,
                JSON.stringify(
                    value
                )
            );
        } catch (
            error
        ) {
            // noop
        }
    }


    function syncLivingSkyUI() {
        if (
            constellationCount
        ) {
            constellationCount.textContent =
                `${foundConstellation.size} / ${specialStars.constellation.length}`;
        }

        if (
            twinStarsCount
        ) {
            twinStarsCount.textContent =
                `${foundTwinStars.size} / ${specialStars.twin.length}`;
        }

        if (
            wishCount
        ) {
            wishCount.textContent =
                `${wishes.length}`;
        }
    }


    function initializeLivingSkyState() {
        foundConstellation =
            new Set(
                loadStoredArray(
                    constellationKey
                )
            );

        foundTwinStars =
            new Set(
                loadStoredArray(
                    twinStarsKey
                )
            );

        wishes =
            loadStoredArray(
                wishesKey
            );

        syncLivingSkyUI();
    }


    function persistDiscoveries() {
        saveStoredArray(
            constellationKey,
            Array.from(
                foundConstellation
            )
        );

        saveStoredArray(
            twinStarsKey,
            Array.from(
                foundTwinStars
            )
        );
    }


    function showToastMessage(
        eyebrow,
        title,
        text
    ) {
        if (!toast) {
            return;
        }

        if (
            toastEyebrow
        ) {
            toastEyebrow.textContent =
                eyebrow;
        }

        if (
            toastTitle
        ) {
            toastTitle.textContent =
                title;
        }

        if (
            toastText
        ) {
            toastText.textContent =
                text;
        }

        toast.classList.add(
            "show"
        );

        window.clearTimeout(
            toastTimer
        );

        toastTimer =
            window.setTimeout(
                () => {
                    toast.classList.remove(
                        "show"
                    );
                },
                4200
            );
    }


    function openOverlay(
        overlay
    ) {
        if (!overlay) {
            return;
        }

        overlay.hidden =
            false;

        overlayOpen =
            true;
    }


    function closeOverlay(
        overlay
    ) {
        if (!overlay) {
            return;
        }

        overlay.hidden =
            true;

        overlayOpen =
            (
                whisperOverlay
                && !whisperOverlay.hidden
            )
            || (
                wishOverlay
                && !wishOverlay.hidden
            );
    }


    function closeAnyOverlay() {
        closeOverlay(
            whisperOverlay
        );

        closeOverlay(
            wishOverlay
        );
    }


    function chooseMoonWhisper() {
        const superMoonWhispers = [
            {
                eyebrow: "PINK SUPERMOON",
                title: "Tonight the moon is blushing.",
                text: "A pink supermoon always feels like a soft confession in the sky — as if the night itself wanted to look beautiful for someone it loves."
            },
            {
                eyebrow: "PINK SUPERMOON",
                title: "The moon came dressed in rose.",
                text: "Some nights glow gently. This one glows like a heart. If the moon could admire someone tonight, it would probably look down and choose you."
            }
        ];

        const regularWhispers = [
            {
                eyebrow: "MOON WHISPER",
                title: "Look up a little longer.",
                text: "Some people see the moon. Some people feel seen by it. Maybe tonight is one of those nights."
            },
            {
                eyebrow: "MOON WHISPER",
                title: "A quiet message for you.",
                text: "Under the same moon, love does not have to be loud. Sometimes it only needs a sky, a little music, and the right person thinking of you."
            },
            {
                eyebrow: "MOON WHISPER",
                title: "The sky remembers softness.",
                text: "If you ever wonder whether tenderness leaves a trace, look up. Even light takes its time, and still it arrives."
            },
            {
                eyebrow: "MOON WHISPER",
                title: "Someone made this night for you.",
                text: "There are many beautiful things above us, but perhaps the most beautiful idea tonight is that this little sky exists because you love looking at it."
            }
        ];

        const pool =
            moonMetrics.isSuperMoon
                ? superMoonWhispers
                : regularWhispers;

        return pool[
            Math.floor(
                randomRange(
                    0,
                    pool.length
                )
            )
        ];
    }


    function triggerMoonWhisper() {
        const whisper =
            chooseMoonWhisper();

        if (
            whisperEyebrow
        ) {
            whisperEyebrow.textContent =
                whisper.eyebrow;
        }

        if (
            whisperTitle
        ) {
            whisperTitle.textContent =
                whisper.title;
        }

        if (
            whisperText
        ) {
            whisperText.textContent =
                whisper.text;
        }

        openOverlay(
            whisperOverlay
        );
    }


    function saveWish() {
        if (!wishInput) {
            return;
        }

        const value =
            wishInput.value
                .trim();

        if (!value) {
            showToastMessage(
                "MAKE A WISH",
                "The sky is listening.",
                "Write a little wish first, then seal it into the night."
            );

            return;
        }

        wishes.unshift({
            text: value,
            createdAt:
                new Date()
                    .toISOString()
        });

        wishes =
            wishes.slice(
                0,
                30
            );

        saveStoredArray(
            wishesKey,
            wishes
        );

        syncLivingSkyUI();

        wishInput.value =
            "";

        closeOverlay(
            wishOverlay
        );

        showToastMessage(
            "WISH SEALED",
            "Your wish is in the sky.",
            "A small falling star now carries your words somewhere gentle above the earth."
        );
    }


    function openWishOverlay() {
        if (
            wishInput
        ) {
            wishInput.value =
                "";
        }

        openOverlay(
            wishOverlay
        );

        window.setTimeout(
            () => {
                wishInput?.focus();
            },
            60
        );
    }


    function getSpecialStarPosition(
        star
    ) {
        return {
            x:
                star.x
                * width
                + pointerX
                * 0.18,
            y:
                star.y
                * height
                + pointerY
                * 0.14
        };
    }


    function getHitSpecialStar(
        x,
        y
    ) {
        const all = [
            ...specialStars.constellation.map(
                (
                    star
                ) => ({
                    ...star,
                    group:
                        "constellation"
                })
            ),
            ...specialStars.twin.map(
                (
                    star
                ) => ({
                    ...star,
                    group:
                        "twin"
                })
            )
        ];

        for (
            const star of all
        ) {
            const position =
                getSpecialStarPosition(
                    star
                );

            const hitRadius =
                mobile()
                    ? 24
                    : 18;

            const distance =
                Math.hypot(
                    x - position.x,
                    y - position.y
                );

            if (
                distance <= hitRadius
            ) {
                return {
                    ...star,
                    position
                };
            }
        }

        return null;
    }


    function discoverStar(
        star
    ) {
        if (
            star.group === "constellation"
        ) {
            if (
                foundConstellation.has(
                    star.id
                )
            ) {
                showToastMessage(
                    "CONSTELLATION OF US",
                    "That star is already glowing.",
                    "Keep looking — the rest of the constellation is still waiting in the night."
                );

                return;
            }

            foundConstellation.add(
                star.id
            );

            persistDiscoveries();
            syncLivingSkyUI();

            if (
                foundConstellation.size
                === specialStars.constellation.length
            ) {
                showToastMessage(
                    "CONSTELLATION OF US",
                    "The constellation is complete.",
                    "Galih × Wisye now lives in the stars — some stories really are written in the sky."
                );
            } else {
                showToastMessage(
                    "CONSTELLATION OF US",
                    `${foundConstellation.size} star${foundConstellation.size > 1 ? "s" : ""} found.`,
                    "A few more special stars remain hidden in the night."
                );
            }

            return;
        }

        if (
            foundTwinStars.has(
                star.id
            )
        ) {
            showToastMessage(
                "OUR TWO STARS",
                `${star.label} is already shining.`,
                "The sky is still keeping both names close."
            );

            return;
        }

        foundTwinStars.add(
            star.id
        );

        persistDiscoveries();
        syncLivingSkyUI();

        if (
            foundTwinStars.size
            === specialStars.twin.length
        ) {
            showToastMessage(
                "OUR TWO STARS",
                "Galih and Wisye are connected.",
                "Under the same sky, your two stars now glow with a line of quiet light between them."
            );
        } else {
            showToastMessage(
                "OUR TWO STARS",
                `${star.label}'s star was found.`,
                "One more star is waiting to be discovered."
            );
        }
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



    function drawSpecialStarGlow(
        x,
        y,
        size,
        alpha,
        pink = false
    ) {
        context.beginPath();
        context.arc(
            x,
            y,
            size * 5.4,
            0,
            Math.PI * 2
        );
        context.fillStyle =
            pink
                ? rgba(
                    255,
                    188,
                    214,
                    alpha * 0.08
                )
                : rgba(
                    255,
                    236,
                    208,
                    alpha * 0.08
                );
        context.fill();

        context.beginPath();
        context.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
        );
        context.fillStyle =
            pink
                ? rgba(
                    255,
                    228,
                    236,
                    alpha
                )
                : rgba(
                    255,
                    245,
                    230,
                    alpha
                );
        context.fill();
    }


    function drawInteractiveLines() {
        const constellationPoints =
            specialStars.constellation.map(
                getSpecialStarPosition
            );

        const constellationMap =
            specialStars.constellation.map(
                (
                    star,
                    index
                ) => ({
                    star,
                    point:
                        constellationPoints[index]
                })
            );

        const constellationEdges = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
            [1, 3]
        ];

        context.save();
        context.lineCap =
            "round";
        context.lineJoin =
            "round";

        for (
            const edge of constellationEdges
        ) {
            const from =
                constellationMap[
                    edge[0]
                ];
            const to =
                constellationMap[
                    edge[1]
                ];

            if (
                !foundConstellation.has(
                    from.star.id
                )
                || !foundConstellation.has(
                    to.star.id
                )
            ) {
                continue;
            }

            context.beginPath();
            context.moveTo(
                from.point.x,
                from.point.y
            );
            context.lineTo(
                to.point.x,
                to.point.y
            );
            context.strokeStyle =
                rgba(
                    255,
                    225,
                    202,
                    0.18
                );
            context.lineWidth =
                mobile()
                    ? 1.3
                    : 1.7;
            context.stroke();
        }

        const galih =
            specialStars.twin[0];
        const wisye =
            specialStars.twin[1];

        if (
            foundTwinStars.has(
                galih.id
            )
            && foundTwinStars.has(
                wisye.id
            )
        ) {
            const from =
                getSpecialStarPosition(
                    galih
                );
            const to =
                getSpecialStarPosition(
                    wisye
                );

            context.beginPath();
            context.moveTo(
                from.x,
                from.y
            );
            context.lineTo(
                to.x,
                to.y
            );
            context.strokeStyle =
                rgba(
                    255,
                    188,
                    214,
                    0.26
                );
            context.lineWidth =
                mobile()
                    ? 1.6
                    : 2;
            context.stroke();
        }

        context.restore();
    }


    function drawInteractiveStars(
        time
    ) {
        drawInteractiveLines();

        const allStars = [
            ...specialStars.constellation.map(
                (
                    star
                ) => ({
                    ...star,
                    group:
                        "constellation"
                })
            ),
            ...specialStars.twin.map(
                (
                    star
                ) => ({
                    ...star,
                    group:
                        "twin"
                })
            )
        ];

        for (
            const star of allStars
        ) {
            const position =
                getSpecialStarPosition(
                    star
                );

            const discovered =
                star.group === "constellation"
                    ? foundConstellation.has(
                        star.id
                    )
                    : foundTwinStars.has(
                        star.id
                    );

            const pulse =
                0.70
                + Math.sin(
                    time * 2.2
                    + position.x * 0.01
                ) * 0.30;

            const size =
                (discovered ? 2.8 : 2.15)
                * (
                    mobile()
                        ? 0.95
                        : 1
                )
                * (
                    0.96 + pulse * 0.14
                );

            drawSpecialStarGlow(
                position.x,
                position.y,
                size,
                discovered ? 0.96 : 0.84,
                star.group === "twin"
            );

            if (
                discovered
            ) {
                context.save();
                context.fillStyle =
                    star.group === "twin"
                        ? rgba(
                            255,
                            221,
                            233,
                            0.72
                        )
                        : rgba(
                            255,
                            245,
                            230,
                            0.62
                        );
                context.font =
                    `${mobile() ? 11 : 12}px DM Sans`;
                context.textAlign =
                    "center";
                context.fillText(
                    star.group === "twin"
                        ? star.label
                        : "✦",
                    position.x,
                    position.y - (mobile() ? 12 : 14)
                );
                context.restore();
            }
        }

        if (
            foundConstellation.size
            === specialStars.constellation.length
        ) {
            context.save();
            context.fillStyle =
                rgba(
                    255,
                    245,
                    230,
                    0.46
                );
            context.font =
                `${mobile() ? 16 : 20}px Playfair Display`;
            context.textAlign =
                "center";
            context.fillText(
                "Our Constellation",
                width * 0.32 + pointerX * 0.12,
                height * 0.38 + pointerY * 0.08
            );
            context.restore();
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


        // Calm-night pacing: one full artistic lunar cycle every 8 minutes.
        return (
            (
                time
                % 480
            )
            / 480
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

        const nearFullDistance =
            Math.min(
                progress,
                1 - progress
            );

        const isSuperMoon =
            nearFullDistance
            <= 0.055;

        if (
            phaseName
        ) {
            phaseName.textContent =
                isSuperMoon
                    ? "Pink Supermoon"
                    : getPhaseLabel(
                        progress
                    );
        }

        const baseX =
            mobile()
                ? width * 0.72
                : width * 0.76;

        const baseY =
            mobile()
                ? height * 0.28
                : height * 0.27;

        const x =
            baseX
            + Math.sin(
                time * 0.035
            ) * width * 0.018
            + pointerX * 0.48;

        const y =
            baseY
            + Math.cos(
                time * 0.029
            ) * height * 0.016
            + pointerY * 0.42;

        const radius =
            Math.min(
                width,
                height
            )
            * (
                mobile()
                    ? 0.105
                    : 0.095
            )
            * (
                isSuperMoon
                    ? 1.06
                    : 1
            );

        moonMetrics = {
            x,
            y,
            radius,
            progress,
            isSuperMoon
        };

        const illumination =
            Math.abs(
                Math.cos(
                    progress
                    * Math.PI
                )
            );

        const haloAlpha =
            (
                0.08
                + illumination * 0.20
            )
            * (
                isSuperMoon
                    ? 1.36
                    : 1
            );

        const halo =
            context.createRadialGradient(
                x,
                y,
                radius * 0.08,
                x,
                y,
                radius * 3.8
            );

        if (
            isSuperMoon
        ) {
            halo.addColorStop(
                0,
                rgba(
                    255,
                    223,
                    236,
                    haloAlpha
                )
            );

            halo.addColorStop(
                0.34,
                rgba(
                    255,
                    170,
                    204,
                    haloAlpha * 0.28
                )
            );

            halo.addColorStop(
                1,
                "rgba(255,170,204,0)"
            );
        } else {
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
                    haloAlpha * 0.33
                )
            );

            halo.addColorStop(
                1,
                "rgba(246,218,176,0)"
            );
        }

        context.fillStyle =
            halo;

        context.beginPath();
        context.arc(
            x,
            y,
            radius * 3.8,
            0,
            Math.PI * 2
        );
        context.fill();

        context.beginPath();
        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle =
            isSuperMoon
                ? "#483040"
                : "#34313a";
        context.fill();

        context.save();
        context.beginPath();
        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );
        context.clip();

        const surface =
            context.createRadialGradient(
                x - radius * 0.34,
                y - radius * 0.32,
                radius * 0.04,
                x,
                y,
                radius
            );

        if (
            isSuperMoon
        ) {
            surface.addColorStop(
                0,
                "#fff5f8"
            );
            surface.addColorStop(
                0.40,
                "#ffd3e5"
            );
            surface.addColorStop(
                0.76,
                "#e2a5bd"
            );
            surface.addColorStop(
                1,
                "#8a5f74"
            );
        } else {
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
        }

        context.fillStyle =
            surface;
        context.fillRect(
            x - radius,
            y - radius,
            radius * 2,
            radius * 2
        );

        const firstHalf =
            progress <= 0.5;

        const local =
            firstHalf
                ? progress / 0.5
                : (progress - 0.5) / 0.5;

        const shadowOffset =
            firstHalf
                ? (-radius * 1.7 + local * radius * 3.4)
                : (radius * 1.7 - local * radius * 3.4);

        context.beginPath();
        context.ellipse(
            x + shadowOffset,
            y,
            radius * 1.18,
            radius * 1.02,
            0,
            0,
            Math.PI * 2
        );
        context.fillStyle =
            isSuperMoon
                ? "rgba(32,21,31,0.965)"
                : "rgba(25,24,33,0.965)";
        context.fill();

        const newMoonFactor =
            Math.max(
                0,
                1 - Math.abs(progress - 0.5) / 0.18
            );

        if (
            newMoonFactor > 0
        ) {
            context.fillStyle =
                rgba(
                    15,
                    16,
                    25,
                    newMoonFactor * 0.62
                );

            context.fillRect(
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
            );
        }

        context.globalAlpha =
            0.075
            * (0.30 + illumination * 0.70);

        const craters = [
            [-0.28, -0.16, 0.17],
            [0.19, -0.28, 0.10],
            [0.31, 0.10, 0.14],
            [-0.10, 0.31, 0.12],
            [0.03, 0.04, 0.20]
        ];

        for (
            const crater of craters
        ) {
            context.beginPath();
            context.arc(
                x + crater[0] * radius,
                y + crater[1] * radius,
                crater[2] * radius,
                0,
                Math.PI * 2
            );
            context.fillStyle =
                isSuperMoon
                    ? "#6d5361"
                    : "#4c4651";
            context.fill();
        }

        context.restore();

        context.beginPath();
        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );
        context.strokeStyle =
            isSuperMoon
                ? rgba(
                    255,
                    227,
                    236,
                    0.18 + illumination * 0.16
                )
                : rgba(
                    255,
                    240,
                    212,
                    0.12 + illumination * 0.14
                );
        context.lineWidth =
            Math.max(
                1,
                radius * 0.018
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
    // OCCASIONAL NIGHT BIRDS
    // Rare silhouette flocks. Quiet, slow, and never crowded.
    // ======================================================

    function spawnBirdFlock() {
        const direction =
            random()
            > 0.5
                ? 1
                : -1;


        const count =
            mobile()
                ? Math.floor(
                    randomRange(
                        2,
                        4
                    )
                )
                : Math.floor(
                    randomRange(
                        3,
                        6
                    )
                );


        const speed =
            mobile()
                ? randomRange(
                    18,
                    29
                )
                : randomRange(
                    26,
                    42
                );


        const baseY =
            randomRange(
                height
                * 0.36,
                height
                * 0.58
            );


        const startX =
            direction > 0
                ? -55
                : width + 55;


        const birds =
            [];


        for (
            let index = 0;
            index < count;
            index++
        ) {
            const row =
                Math.floor(
                    index
                    / 2
                );


            const side =
                index % 2
                    ? 1
                    : -1;


            birds.push({
                offsetX:
                    row
                    * 23
                    + 4,

                offsetY:
                    side
                    * (
                        7
                        + row
                        * 5
                    )
                    + randomRange(
                        -3,
                        3
                    ),

                size:
                    randomRange(
                        mobile()
                            ? 4.4
                            : 5.2,
                        mobile()
                            ? 6.6
                            : 8.6
                    ),

                phase:
                    randomRange(
                        0,
                        Math.PI
                        * 2
                    ),

                flapSpeed:
                    randomRange(
                        1.6,
                        2.5
                    )
            });
        }


        birdFlocks.push({
            x:
                startX,

            y:
                baseY,

            direction,

            speed,

            birds,

            life:
                0,

            maxLife:
                (
                    width
                    + 180
                )
                / speed
                + 4,

            alpha:
                randomRange(
                    0.34,
                    0.54
                ),

            verticalPhase:
                randomRange(
                    0,
                    Math.PI
                    * 2
                )
        });
    }


    function updateBirdFlocks(
        delta,
        time
    ) {
        for (
            const flock
            of birdFlocks
        ) {
            flock.life +=
                delta;


            flock.x +=
                flock.direction
                * flock.speed
                * delta;


            flock.y +=
                Math.sin(
                    time
                    * 0.22
                    + flock.verticalPhase
                )
                * delta
                * 1.6;
        }


        birdFlocks =
            birdFlocks.filter(
                (
                    flock
                ) =>
                    flock.life
                    < flock.maxLife
            );
    }


    function drawBird(
        x,
        y,
        size,
        wing,
        direction,
        alpha
    ) {
        context.save();


        context.translate(
            x,
            y
        );


        if (
            direction < 0
        ) {
            context.scale(
                -1,
                1
            );
        }


        context.lineCap =
            "round";

        context.lineJoin =
            "round";

        context.lineWidth =
            Math.max(
                0.85,
                size
                * 0.16
            );


        context.strokeStyle =
            rgba(
                4,
                7,
                13,
                alpha
            );


        const lift =
            size
            * (
                0.26
                + wing
                * 0.17
            );


        context.beginPath();

        context.moveTo(
            0,
            0
        );

        context.quadraticCurveTo(
            -size
            * 0.48,
            -lift,
            -size,
            -size
            * 0.12
        );

        context.stroke();


        context.beginPath();

        context.moveTo(
            0,
            0
        );

        context.quadraticCurveTo(
            size
            * 0.48,
            -lift,
            size,
            -size
            * 0.12
        );

        context.stroke();


        context.beginPath();

        context.moveTo(
            -size
            * 0.16,
            0
        );

        context.lineTo(
            size
            * 0.22,
            size
            * 0.05
        );

        context.stroke();


        context.restore();
    }


    function drawBirdFlocks(
        time
    ) {
        for (
            const flock
            of birdFlocks
        ) {
            const progress =
                Math.min(
                    1,
                    flock.life
                    / Math.max(
                        flock.maxLife,
                        0.001
                    )
                );


            const fade =
                Math.min(
                    1,
                    progress
                    / 0.10,
                    (
                        1
                        - progress
                    )
                    / 0.10
                );


            const alpha =
                Math.max(
                    0,
                    fade
                )
                * flock.alpha;


            flock.birds.forEach(
                (
                    bird,
                    index
                ) => {
                    const wing =
                        Math.sin(
                            time
                            * bird.flapSpeed
                            + bird.phase
                        );


                    const x =
                        flock.x
                        - flock.direction
                        * bird.offsetX;


                    const y =
                        flock.y
                        + bird.offsetY
                        + Math.sin(
                            time
                            * 0.38
                            + index
                        )
                        * 1.4;


                    drawBird(
                        x,
                        y,
                        bird.size,
                        wing,
                        flock.direction,
                        alpha
                    );
                }
            );
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
        drawInteractiveStars(time);
        drawPlanets(time);
        drawMoon(time);
        drawClouds(time);
        drawBirdFlocks(time);
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


                if (
                    elapsed
                    >= nextBirdAt
                ) {
                    spawnBirdFlock();


                    nextBirdAt =
                        elapsed
                        + randomRange(
                            mobile()
                                ? 55
                                : 42,
                            mobile()
                                ? 86
                                : 74
                        );
                }


                updateBirdFlocks(
                    delta,
                    elapsed
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
                experience.getBoundingClientRect();

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

            if (
                pointerDownInfo
                && Math.hypot(
                    event.clientX - pointerDownInfo.clientX,
                    event.clientY - pointerDownInfo.clientY
                ) > 10
            ) {
                window.clearTimeout(
                    longPressTimer
                );
            }
        }
    );


    experience.addEventListener(
        "pointerleave",
        () => {
            targetPointerX = 0;
            targetPointerY = 0;

            window.clearTimeout(
                longPressTimer
            );
            pointerDownInfo = null;
        }
    );


    experience.addEventListener(
        "pointerdown",
        (
            event
        ) => {
            if (
                overlayOpen
                || event.target.closest(
                    "a,button,textarea"
                )
            ) {
                return;
            }

            pointerDownInfo = {
                clientX:
                    event.clientX,
                clientY:
                    event.clientY
            };

            longPressTriggered = false;

            window.clearTimeout(
                longPressTimer
            );

            longPressTimer =
                window.setTimeout(
                    () => {
                        longPressTriggered = true;

                        const rect =
                            experience.getBoundingClientRect();

                        spawnMeteor(
                            Math.min(
                                width * 0.94,
                                Math.max(
                                    width * 0.12,
                                    pointerDownInfo.clientX - rect.left
                                )
                            ),
                            Math.min(
                                height * 0.66,
                                Math.max(
                                    height * 0.05,
                                    pointerDownInfo.clientY - rect.top
                                )
                            )
                        );

                        openWishOverlay();
                    },
                    620
                );
        }
    );


    experience.addEventListener(
        "pointerup",
        (
            event
        ) => {
            window.clearTimeout(
                longPressTimer
            );

            if (
                overlayOpen
                || event.target.closest(
                    "a,button,textarea"
                )
            ) {
                pointerDownInfo = null;
                longPressTriggered = false;
                return;
            }

            if (
                longPressTriggered
            ) {
                pointerDownInfo = null;
                longPressTriggered = false;
                return;
            }

            const rect =
                experience.getBoundingClientRect();

            const clickX =
                event.clientX - rect.left;
            const clickY =
                event.clientY - rect.top;

            const starHit =
                getHitSpecialStar(
                    clickX,
                    clickY
                );

            if (
                starHit
            ) {
                discoverStar(
                    starHit
                );

                pointerDownInfo = null;
                return;
            }

            if (
                Math.hypot(
                    clickX - moonMetrics.x,
                    clickY - moonMetrics.y
                ) <= moonMetrics.radius * 1.15
            ) {
                triggerMoonWhisper();
                pointerDownInfo = null;
                return;
            }

            spawnMeteor(
                Math.min(
                    width * 0.96,
                    Math.max(
                        width * 0.16,
                        clickX
                    )
                ),
                Math.min(
                    height * 0.67,
                    Math.max(
                        height * 0.06,
                        clickY
                    )
                )
            );

            pointerDownInfo = null;
        }
    );


    document.addEventListener(
        "click",
        (
            event
        ) => {
            if (
                event.target.matches(
                    "[data-close-overlay]"
                )
            ) {
                closeAnyOverlay();
            }
        }
    );


    saveWishButton?.addEventListener(
        "click",
        saveWish
    );


    document.addEventListener(
        "keydown",
        (
            event
        ) => {
            if (
                event.key === "Escape"
            ) {
                closeAnyOverlay();
            }
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

    initializeLivingSkyState();

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
