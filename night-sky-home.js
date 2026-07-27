// ==========================================================
// RUANG CERITA — ASTROPHILE'S SPACE HOMEPAGE PREVIEW V2
// Lightweight animated preview only.
// ==========================================================

(function () {
    const canvas =
        document.getElementById(
            "astrophilePreviewCanvas"
        );

    const entry =
        document.getElementById(
            "astrophileSpaceEntry"
        );


    if (
        !canvas
        || !entry
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


    let width =
        1;

    let height =
        1;

    let dpr =
        1;

    let visible =
        true;

    let lastTime =
        performance.now();

    let elapsed =
        0;


    let seed =
        24072026;


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


    let stars =
        [];


    function buildStars() {
        seed =
            24072026;

        const count =
            window.innerWidth
            <= 700
                ? 75
                : 125;


        stars =
            Array.from(
                {
                    length:
                        count
                },
                () => ({
                    x:
                        random(),

                    y:
                        random()
                        * 0.78,

                    size:
                        0.4
                        + random()
                        * 1.6,

                    alpha:
                        0.18
                        + random()
                        * 0.68,

                    phase:
                        random()
                        * Math.PI
                        * 2,

                    twinkle:
                        1.2
                        + random()
                        * 4
                })
            );
    }


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


        buildStars();
    }


    function draw(
        time
    ) {
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
            "#07101f"
        );

        sky.addColorStop(
            0.56,
            "#10152d"
        );

        sky.addColorStop(
            1,
            "#201829"
        );


        context.fillStyle =
            sky;

        context.fillRect(
            0,
            0,
            width,
            height
        );


        for (
            const star
            of stars
        ) {
            const alpha =
                star.alpha
                * (
                    0.64
                    + Math.sin(
                        time
                        * star.twinkle
                        + star.phase
                    )
                    * 0.36
                );


            context.beginPath();

            context.arc(
                star.x
                * width,
                star.y
                * height,
                star.size,
                0,
                Math.PI
                * 2
            );


            context.fillStyle =
                `rgba(235,239,250,${
                    Math.max(
                        0.05,
                        alpha
                    )
                })`;

            context.fill();
        }


        // Aurora preview.
        context.save();

        context.globalCompositeOperation =
            "screen";

        for (
            let band = 0;
            band < 3;
            band++
        ) {
            context.beginPath();


            for (
                let x = -20;
                x <= width + 20;
                x += 8
            ) {
                const y =
                    height
                    * (
                        0.24
                        + band
                        * 0.07
                    )
                    + Math.sin(
                        x
                        / Math.max(
                            width,
                            1
                        )
                        * Math.PI
                        * 2.3
                        + time
                        * 0.18
                        + band
                    )
                    * height
                    * 0.035;


                if (
                    x === -20
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
                band % 2
                    ? "rgba(128,219,183,0.055)"
                    : "rgba(142,187,223,0.050)";


            context.lineWidth =
                30;

            context.lineCap =
                "round";

            context.filter =
                "blur(18px)";

            context.stroke();
        }

        context.restore();


        // Preview moon.
        const moonX =
            width
            * 0.78
            + Math.sin(
                time
                * 0.08
            )
            * 8;


        const moonY =
            height
            * 0.27
            + Math.cos(
                time
                * 0.07
            )
            * 6;


        const radius =
            Math.min(
                width,
                height
            )
            * 0.115;


        const halo =
            context
                .createRadialGradient(
                    moonX,
                    moonY,
                    radius
                    * 0.15,
                    moonX,
                    moonY,
                    radius
                    * 3.1
                );


        halo.addColorStop(
            0,
            "rgba(255,238,204,0.22)"
        );

        halo.addColorStop(
            1,
            "rgba(255,238,204,0)"
        );


        context.fillStyle =
            halo;

        context.beginPath();

        context.arc(
            moonX,
            moonY,
            radius
            * 3.1,
            0,
            Math.PI
            * 2
        );

        context.fill();


        const moon =
            context
                .createRadialGradient(
                    moonX
                    - radius
                    * 0.3,
                    moonY
                    - radius
                    * 0.3,
                    1,
                    moonX,
                    moonY,
                    radius
                );


        moon.addColorStop(
            0,
            "#fff7df"
        );

        moon.addColorStop(
            0.5,
            "#e4cfaf"
        );

        moon.addColorStop(
            1,
            "#88777a"
        );


        context.fillStyle =
            moon;

        context.beginPath();

        context.arc(
            moonX,
            moonY,
            radius,
            0,
            Math.PI
            * 2
        );

        context.fill();


        // Earth horizon silhouette.
        context.beginPath();

        context.moveTo(
            0,
            height
        );

        context.lineTo(
            0,
            height
            * 0.82
        );

        context.bezierCurveTo(
            width
            * 0.18,
            height
            * 0.74,
            width
            * 0.35,
            height
            * 0.86,
            width
            * 0.52,
            height
            * 0.78
        );

        context.bezierCurveTo(
            width
            * 0.70,
            height
            * 0.70,
            width
            * 0.83,
            height
            * 0.89,
            width,
            height
            * 0.80
        );

        context.lineTo(
            width,
            height
        );

        context.closePath();

        context.fillStyle =
            "#07090f";

        context.fill();
    }


    function loop(
        now
    ) {
        const delta =
            Math.min(
                0.05,
                (
                    now
                    - lastTime
                )
                / 1000
            );


        lastTime =
            now;


        if (
            visible
        ) {
            elapsed +=
                delta;

            draw(
                elapsed
            );
        }


        requestAnimationFrame(
            loop
        );
    }


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
        entry
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


    resize();

    requestAnimationFrame(
        loop
    );
})();
