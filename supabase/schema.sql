-- Vibe Meter: Supabase SQL Editor에서 전체 실행
-- Dashboard → SQL Editor → New query → 붙여넣기 → Run

-- 1. 테이블 생성
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  active_question_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  title text not null,
  type text not null check (type in ('multiple_choice', 'word_cloud', 'qa')),
  options jsonb,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rooms
  drop constraint if exists rooms_active_question_id_fkey;

alter table public.rooms
  add constraint rooms_active_question_id_fkey
  foreign key (active_question_id) references public.questions (id) on delete set null;

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 2. RLS 활성화
alter table public.rooms enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;

-- 3. rooms 정책
drop policy if exists "rooms_select_public" on public.rooms;
create policy "rooms_select_public"
  on public.rooms for select
  using (true);

drop policy if exists "rooms_insert_owner" on public.rooms;
create policy "rooms_insert_owner"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner"
  on public.rooms for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 4. questions 정책
drop policy if exists "questions_select_public" on public.questions;
create policy "questions_select_public"
  on public.questions for select
  using (true);

drop policy if exists "questions_insert_owner" on public.questions;
create policy "questions_insert_owner"
  on public.questions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.rooms
      where rooms.id = questions.room_id
        and rooms.owner_id = auth.uid()
    )
  );

drop policy if exists "questions_update_owner" on public.questions;
create policy "questions_update_owner"
  on public.questions for update
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = questions.room_id
        and rooms.owner_id = auth.uid()
    )
  );

drop policy if exists "questions_delete_owner" on public.questions;
create policy "questions_delete_owner"
  on public.questions for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = questions.room_id
        and rooms.owner_id = auth.uid()
    )
  );

-- 5. answers 정책
drop policy if exists "answers_select_public" on public.answers;
create policy "answers_select_public"
  on public.answers for select
  using (true);

drop policy if exists "answers_insert_public" on public.answers;
create policy "answers_insert_public"
  on public.answers for insert
  with check (true);

drop policy if exists "answers_delete_owner" on public.answers;
create policy "answers_delete_owner"
  on public.answers for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = answers.room_id
        and rooms.owner_id = auth.uid()
    )
  );

-- 6. Realtime (전광판·참여 페이지 실시간 반영)
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.questions;
alter publication supabase_realtime add table public.answers;
