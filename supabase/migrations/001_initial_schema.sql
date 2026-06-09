-- Couple Up: Love Island USA Season 8 Bracket Prediction Game
-- Initial database schema

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Custom types
create type islander_status as enum ('active', 'dumped', 'bombshell');

-- ============================================
-- Tables
-- ============================================

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table islanders (
  id serial primary key,
  name text not null,
  age int not null,
  hometown text not null,
  photo_url text,
  status islander_status not null default 'active',
  entered_week int not null default 1,
  exited_week int,
  created_at timestamptz not null default now()
);

create table weeks (
  id serial primary key,
  week_number int not null unique,
  prediction_deadline timestamptz not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table actual_couples (
  id serial primary key,
  week_id int not null references weeks on delete cascade,
  islander_1_id int not null references islanders on delete cascade,
  islander_2_id int not null references islanders on delete cascade,
  unique (week_id, islander_1_id)
);

create table actual_dumpings (
  id serial primary key,
  week_id int not null references weeks on delete cascade,
  islander_id int not null references islanders on delete cascade
);

create table predictions (
  id serial primary key,
  user_id uuid not null references profiles on delete cascade,
  week_id int not null references weeks on delete cascade,
  submitted_at timestamptz not null default now(),
  is_locked boolean not null default false,
  unique (user_id, week_id)
);

create table predicted_couples (
  id serial primary key,
  prediction_id int not null references predictions on delete cascade,
  islander_1_id int not null references islanders on delete cascade,
  islander_2_id int not null references islanders on delete cascade
);

create table predicted_dumpings (
  id serial primary key,
  prediction_id int not null references predictions on delete cascade,
  islander_id int not null references islanders on delete cascade
);

create table bonus_questions (
  id serial primary key,
  week_id int not null references weeks on delete cascade,
  question_text text not null,
  correct_answer boolean
);

create table bonus_answers (
  id serial primary key,
  prediction_id int not null references predictions on delete cascade,
  question_id int not null references bonus_questions on delete cascade,
  user_answer boolean not null
);

create table scores (
  id serial primary key,
  user_id uuid not null references profiles on delete cascade,
  week_id int not null references weeks on delete cascade,
  couple_pts int not null default 0,
  dump_pts int not null default 0,
  bonus_pts int not null default 0,
  perfect_bonus int not null default 0,
  streak_bonus int not null default 0,
  total int not null default 0,
  unique (user_id, week_id)
);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  creator_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now()
);

create table league_members (
  id serial primary key,
  league_id uuid not null references leagues on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table season_winner_predictions (
  id serial primary key,
  user_id uuid not null references profiles on delete cascade,
  islander_1_id int not null references islanders on delete cascade,
  islander_2_id int not null references islanders on delete cascade,
  predicted_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================
-- Row Level Security
-- ============================================

alter table profiles enable row level security;
alter table islanders enable row level security;
alter table weeks enable row level security;
alter table actual_couples enable row level security;
alter table actual_dumpings enable row level security;
alter table predictions enable row level security;
alter table predicted_couples enable row level security;
alter table predicted_dumpings enable row level security;
alter table bonus_questions enable row level security;
alter table bonus_answers enable row level security;
alter table scores enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table season_winner_predictions enable row level security;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  );
$$ language sql security definer stable;

-- Profiles
create policy "Anyone can view profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Islanders
create policy "Anyone can view islanders"
  on islanders for select using (true);

create policy "Admins can insert islanders"
  on islanders for insert with check (is_admin());

create policy "Admins can update islanders"
  on islanders for update using (is_admin());

create policy "Admins can delete islanders"
  on islanders for delete using (is_admin());

-- Weeks
create policy "Anyone can view weeks"
  on weeks for select using (true);

create policy "Admins can insert weeks"
  on weeks for insert with check (is_admin());

create policy "Admins can update weeks"
  on weeks for update using (is_admin());

-- Actual Couples
create policy "Anyone can view actual couples"
  on actual_couples for select using (true);

create policy "Admins can insert actual couples"
  on actual_couples for insert with check (is_admin());

create policy "Admins can update actual couples"
  on actual_couples for update using (is_admin());

create policy "Admins can delete actual couples"
  on actual_couples for delete using (is_admin());

-- Actual Dumpings
create policy "Anyone can view actual dumpings"
  on actual_dumpings for select using (true);

create policy "Admins can insert actual dumpings"
  on actual_dumpings for insert with check (is_admin());

create policy "Admins can update actual dumpings"
  on actual_dumpings for update using (is_admin());

create policy "Admins can delete actual dumpings"
  on actual_dumpings for delete using (is_admin());

-- Predictions
create policy "Users can view all predictions"
  on predictions for select using (true);

create policy "Users can insert own predictions before deadline"
  on predictions for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from weeks
      where weeks.id = week_id
      and weeks.prediction_deadline > now()
    )
  );

create policy "Users can update own predictions before deadline"
  on predictions for update using (
    auth.uid() = user_id
    and exists (
      select 1 from weeks
      where weeks.id = week_id
      and weeks.prediction_deadline > now()
    )
  );

-- Predicted Couples
create policy "Users can view all predicted couples"
  on predicted_couples for select using (true);

create policy "Users can insert own predicted couples"
  on predicted_couples for insert with check (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
      and exists (
        select 1 from weeks
        where weeks.id = predictions.week_id
        and weeks.prediction_deadline > now()
      )
    )
  );

create policy "Users can update own predicted couples"
  on predicted_couples for update using (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
      and exists (
        select 1 from weeks
        where weeks.id = predictions.week_id
        and weeks.prediction_deadline > now()
      )
    )
  );

create policy "Users can delete own predicted couples"
  on predicted_couples for delete using (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
    )
  );

-- Predicted Dumpings
create policy "Users can view all predicted dumpings"
  on predicted_dumpings for select using (true);

create policy "Users can insert own predicted dumpings"
  on predicted_dumpings for insert with check (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
      and exists (
        select 1 from weeks
        where weeks.id = predictions.week_id
        and weeks.prediction_deadline > now()
      )
    )
  );

create policy "Users can update own predicted dumpings"
  on predicted_dumpings for update using (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
      and exists (
        select 1 from weeks
        where weeks.id = predictions.week_id
        and weeks.prediction_deadline > now()
      )
    )
  );

create policy "Users can delete own predicted dumpings"
  on predicted_dumpings for delete using (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
    )
  );

-- Bonus Questions
create policy "Anyone can view bonus questions"
  on bonus_questions for select using (true);

create policy "Admins can insert bonus questions"
  on bonus_questions for insert with check (is_admin());

create policy "Admins can update bonus questions"
  on bonus_questions for update using (is_admin());

create policy "Admins can delete bonus questions"
  on bonus_questions for delete using (is_admin());

-- Bonus Answers
create policy "Users can view own bonus answers"
  on bonus_answers for select using (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
    )
  );

create policy "Users can insert own bonus answers"
  on bonus_answers for insert with check (
    exists (
      select 1 from predictions
      where predictions.id = prediction_id
      and predictions.user_id = auth.uid()
    )
  );

-- Scores
create policy "Anyone can view scores"
  on scores for select using (true);

-- Leagues
create policy "Anyone can view leagues"
  on leagues for select using (true);

create policy "Users can create leagues"
  on leagues for insert with check (auth.uid() = creator_id);

create policy "Creators can update own leagues"
  on leagues for update using (auth.uid() = creator_id);

-- League Members
create policy "Members can view their league members"
  on league_members for select using (
    exists (
      select 1 from league_members lm
      where lm.league_id = league_members.league_id
      and lm.user_id = auth.uid()
    )
  );

create policy "Users can join leagues"
  on league_members for insert with check (auth.uid() = user_id);

create policy "Creators can remove league members"
  on league_members for delete using (
    exists (
      select 1 from leagues
      where leagues.id = league_id
      and leagues.creator_id = auth.uid()
    )
  );

-- Season Winner Predictions
create policy "Anyone can view season winner predictions"
  on season_winner_predictions for select using (true);

create policy "Users can insert own season winner prediction"
  on season_winner_predictions for insert with check (auth.uid() = user_id);

create policy "Users can update own season winner prediction"
  on season_winner_predictions for update using (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
