-- =========================================================
-- RUANG CERITA: KATEGORI DAN MOOD
-- Jalankan seluruh file ini di Supabase > SQL Editor.
-- Script ini tidak mengubah tabel cerita lama dan aman dijalankan ulang.
-- =========================================================

create table if not exists public.metadata_tulisan (
    cerita_id text primary key,
    kategori text not null,
    mood text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint metadata_tulisan_kategori_valid check (
        kategori in (
            'Kenangan',
            'Perjalanan',
            'Tentang Kita',
            'Keluarga',
            'Pekerjaan',
            'Harapan',
            'Lainnya'
        )
    ),

    constraint metadata_tulisan_mood_valid check (
        mood in (
            'Bahagia',
            'Penuh Cinta',
            'Terharu',
            'Sedih',
            'Bersyukur',
            'Tenang'
        )
    )
);

alter table public.metadata_tulisan enable row level security;

-- Data metadata tidak boleh dibaca atau ditulis langsung dari browser.
-- Semua akses dilakukan melalui fungsi RPC di bawah ini setelah kode diperiksa.
revoke all on table public.metadata_tulisan from anon, authenticated;

create or replace function public.ambil_metadata_tulisan(kode text)
returns table (
    cerita_id text,
    kategori text,
    mood text
)
language plpgsql
security definer
set search_path = public
as $$
begin
    if not coalesce(public.cek_kode(kode), false) then
        raise exception 'Kode akses salah';
    end if;

    return query
    select
        m.cerita_id,
        m.kategori,
        m.mood
    from public.metadata_tulisan as m;
end;
$$;

create or replace function public.atur_metadata_tulisan(
    kode text,
    id_input text,
    kategori_input text,
    mood_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not coalesce(public.cek_kode(kode), false) then
        raise exception 'Kode akses salah';
    end if;

    if kategori_input not in (
        'Kenangan',
        'Perjalanan',
        'Tentang Kita',
        'Keluarga',
        'Pekerjaan',
        'Harapan',
        'Lainnya'
    ) then
        raise exception 'Kategori tidak valid';
    end if;

    if mood_input not in (
        'Bahagia',
        'Penuh Cinta',
        'Terharu',
        'Sedih',
        'Bersyukur',
        'Tenang'
    ) then
        raise exception 'Mood tidak valid';
    end if;

    insert into public.metadata_tulisan (
        cerita_id,
        kategori,
        mood,
        updated_at
    )
    values (
        id_input,
        kategori_input,
        mood_input,
        now()
    )
    on conflict (cerita_id)
    do update set
        kategori = excluded.kategori,
        mood = excluded.mood,
        updated_at = now();
end;
$$;

create or replace function public.hapus_metadata_tulisan(
    kode text,
    id_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not coalesce(public.cek_kode(kode), false) then
        raise exception 'Kode akses salah';
    end if;

    delete from public.metadata_tulisan
    where cerita_id = id_input;
end;
$$;

revoke all on function public.ambil_metadata_tulisan(text) from public;
revoke all on function public.atur_metadata_tulisan(text, text, text, text) from public;
revoke all on function public.hapus_metadata_tulisan(text, text) from public;

grant execute on function public.ambil_metadata_tulisan(text) to anon, authenticated;
grant execute on function public.atur_metadata_tulisan(text, text, text, text) to anon, authenticated;
grant execute on function public.hapus_metadata_tulisan(text, text) to anon, authenticated;
