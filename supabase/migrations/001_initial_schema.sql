-- ============================================================
-- Tangible — initial schema
-- Tables: book_projects, book_pages, book_photos,
--         collaborators, orders
-- Storage buckets: photos, pdfs
-- ============================================================

-- UUID generation
create extension if not exists "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────

create table public.book_projects (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  cover_photo   text,
  status        text        not null default 'draft'
                            check (status in ('draft','completed','ordered','archived')),
  paper_finish  text        not null default 'matte'
                            check (paper_finish in ('matte','glossy','layflat')),
  style         text        not null default 'classic'
                            check (style in ('classic','baby','yearbook','wedding','travel','minimal')),
  ai_prompt     text,
  gift_note     text,
  share_link    text,
  ordered_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.book_pages (
  id          uuid    primary key default uuid_generate_v4(),
  project_id  uuid    not null references public.book_projects(id) on delete cascade,
  layout      text    not null,
  caption     text    not null default '',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.book_photos (
  id            uuid    primary key default uuid_generate_v4(),
  page_id       uuid    not null references public.book_pages(id) on delete cascade,
  project_id    uuid    not null references public.book_projects(id) on delete cascade,
  url           text    not null,
  storage_path  text,
  is_low_res    boolean not null default false,
  is_duplicate  boolean not null default false,
  position      integer not null default 0
);

create table public.collaborators (
  id          uuid        primary key default uuid_generate_v4(),
  project_id  uuid        not null references public.book_projects(id) on delete cascade,
  name        text        not null,
  email       text        not null,
  photos_added integer    not null default 0,
  joined_at   timestamptz not null default now()
);

create table public.orders (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  book_id           uuid        references public.book_projects(id) on delete set null,
  book_title        text        not null,
  page_count        integer     not null default 0,
  price_per_page    numeric(10,2) not null default 0,
  delivery_fee      numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  status            text        not null default 'processing'
                                check (status in ('processing','printed','shipped','delivered')),
  prodigi_order_id  text,
  pdf_url           text,
  shipping_name     text,
  shipping_address  jsonb,
  tracking_number   text,
  estimated_delivery timestamptz,
  ordered_at        timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────

create index on public.book_projects (user_id);
create index on public.book_pages    (project_id, position);
create index on public.book_photos   (page_id, position);
create index on public.book_photos   (project_id);
create index on public.collaborators (project_id);
create index on public.orders        (user_id);

-- ─── Row-Level Security ──────────────────────────────────────

alter table public.book_projects  enable row level security;
alter table public.book_pages     enable row level security;
alter table public.book_photos    enable row level security;
alter table public.collaborators  enable row level security;
alter table public.orders         enable row level security;

-- book_projects: owner only
create policy "owner can manage their projects"
  on public.book_projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- book_pages: access via parent project ownership
create policy "owner can manage pages of their projects"
  on public.book_pages for all
  using  (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ));

-- book_photos: access via parent project ownership
create policy "owner can manage photos of their projects"
  on public.book_photos for all
  using  (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ));

-- collaborators: owner can manage; collaborators can read their row
create policy "owner can manage collaborators"
  on public.collaborators for all
  using  (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.book_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ));

-- orders: owner only
create policy "owner can manage their orders"
  on public.orders for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Storage buckets ─────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 52428800,  -- 50 MB per file
   array['image/jpeg','image/png','image/heic','image/heif','image/webp']),
  ('pdfs',   'pdfs',   false, 209715200, -- 200 MB per file
   array['application/pdf'])
on conflict (id) do nothing;

-- photos bucket: authenticated users manage their own files
create policy "users can upload their own photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can read their own photos"
  on storage.objects for select
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can delete their own photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- pdfs bucket: authenticated users manage their own PDFs
create policy "users can upload their own pdfs"
  on storage.objects for insert
  with check (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can read their own pdfs"
  on storage.objects for select
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can delete their own pdfs"
  on storage.objects for delete
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
