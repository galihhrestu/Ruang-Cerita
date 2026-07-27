// ==========================================================
// RUANG CERITA — PERSISTENT READING ROOM OVERLAY
// ==========================================================

(function () {
    let overlay =
        null;

    let frame =
        null;

    let loading =
        null;

    let currentStoryId =
        null;


    function createOverlay() {
        if (overlay) {
            return overlay;
        }


        overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "reading-room-overlay";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );


        overlay.innerHTML =
            `
                <div class="reading-room-overlay-bar">

                    <button
                        type="button"
                        class="reading-room-close"
                        aria-label="Tutup Reading Room"
                    >
                        ← Kembali
                    </button>


                    <div class="reading-room-overlay-title">

                        <small>
                            CELESTIAL READING ROOM
                        </small>

                        <strong>
                            Our Stories
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="reading-room-open-tab"
                        aria-label="Buka cerita di tab baru"
                        title="Buka di tab baru"
                    >
                        ↗
                    </button>

                </div>


                <div class="reading-room-frame-wrap">

                    <div class="reading-room-loading">
                        ✦ Membuka satu cerita dari semesta kita...
                    </div>

                    <iframe
                        class="reading-room-frame"
                        title="Celestial Reading Room"
                        loading="eager"
                    ></iframe>

                </div>
            `;


        document.body.appendChild(
            overlay
        );


        frame =
            overlay.querySelector(
                ".reading-room-frame"
            );

        loading =
            overlay.querySelector(
                ".reading-room-loading"
            );


        overlay
            .querySelector(
                ".reading-room-close"
            )
            .addEventListener(
                "click",
                closeReadingRoom
            );


        overlay
            .querySelector(
                ".reading-room-open-tab"
            )
            .addEventListener(
                "click",
                () => {
                    if (!currentStoryId) {
                        return;
                    }


                    window.open(
                        `detail.html?id=${
                            encodeURIComponent(
                                currentStoryId
                            )
                        }`,
                        "_blank",
                        "noopener"
                    );
                }
            );


        frame.addEventListener(
            "load",
            () => {
                loading
                    ?.classList.add(
                        "loaded"
                    );
            }
        );


        return overlay;
    }


    function openReadingRoom(
        storyId
    ) {
        if (!storyId) {
            return;
        }


        createOverlay();


        currentStoryId =
            String(
                storyId
            );


        loading
            ?.classList.remove(
                "loaded"
            );


        frame.src =
            `detail.html?id=${
                encodeURIComponent(
                    currentStoryId
                )
            }&embedded=1`;


        overlay.classList.add(
            "open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body
            .classList.add(
                "reading-overlay-open"
            );
    }


    function closeReadingRoom() {
        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body
            .classList.remove(
                "reading-overlay-open"
            );


        window.setTimeout(
            () => {
                if (
                    !overlay.classList.contains(
                        "open"
                    )
                ) {
                    frame.src =
                        "about:blank";
                }
            },
            300
        );
    }


    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key
                === "Escape"
                && overlay
                    ?.classList.contains(
                        "open"
                    )
            ) {
                closeReadingRoom();
            }
        }
    );


    window.openReadingRoom =
        openReadingRoom;

    window.closeReadingRoom =
        closeReadingRoom;
})();
