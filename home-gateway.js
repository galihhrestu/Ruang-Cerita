// ==========================================================
// RUANG CERITA — HOMEPAGE GATEWAY
// Access + story count only.
// ==========================================================

const HOME_ACCESS_KEY = "kodeRuangCerita";

const homeLogoutButton =
    document.getElementById(
        "logoutButton"
    );

const homeStoryCount =
    document.getElementById(
        "homeStoryCount"
    );


async function verifyHomeAccess(
    code
) {
    const {
        data,
        error
    } =
        await window.db.rpc(
            "cek_kode",
            {
                kode:
                    code
            }
        );


    if (error) {
        console.error(
            "Gagal memeriksa kode akses:",
            error
        );

        return false;
    }


    return Boolean(
        data
    );
}


async function ensureHomeAccess() {
    let code =
        localStorage.getItem(
            HOME_ACCESS_KEY
        );


    if (
        code
        && await verifyHomeAccess(
            code
        )
    ) {
        return code;
    }


    localStorage.removeItem(
        HOME_ACCESS_KEY
    );


    code =
        prompt(
            "Masukkan kode akses Ruang Cerita:"
        );


    if (!code) {
        return null;
    }


    if (
        !await verifyHomeAccess(
            code
        )
    ) {
        alert(
            "Kode akses salah"
        );

        return null;
    }


    localStorage.setItem(
        HOME_ACCESS_KEY,
        code
    );


    return code;
}


async function loadHomeStoryCount(
    code
) {
    if (
        !homeStoryCount
        || !code
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await window.db.rpc(
            "ambil_tulisan",
            {
                kode:
                    code
            }
        );


    if (error) {
        console.warn(
            "Jumlah cerita belum dapat dimuat:",
            error
        );

        homeStoryCount.textContent =
            "—";

        return;
    }


    const count =
        Array.isArray(
            data
        )
            ? data.length
            : 0;


    homeStoryCount.textContent =
        String(
            count
        );
}


homeLogoutButton
    ?.addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                HOME_ACCESS_KEY
            );

            window.location.reload();
        }
    );


async function startHomeGateway() {
    if (!window.db) {
        console.error(
            "Supabase belum siap."
        );

        return;
    }


    const code =
        await ensureHomeAccess();


    if (!code) {
        return;
    }


    await loadHomeStoryCount(
        code
    );
}


startHomeGateway();
