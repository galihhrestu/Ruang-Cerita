const SUPABASE_URL =
    "https://syifophnxfrkneneukfx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_D8QS4OfZ5lUbeqWT_4QHEQ_sbguT67z";

window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);