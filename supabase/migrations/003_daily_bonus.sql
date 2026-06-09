-- Daily Bonus Questions (Question of the Day)
-- Separate from weekly bracket bonus questions — accessible without submitting a prediction

create table daily_bonus_questions (
  id serial primary key,
  week_id int not null references weeks on delete cascade,
  question_text text not null check (length(question_text) between 5 and 300),
  episode_date date not null,
  deadline timestamptz not null, -- typically 8pm CT on episode_date
  correct_answer boolean, -- null until admin resolves
  created_at timestamptz not null default now(),
  unique (episode_date) -- one question per day
);

create table daily_bonus_answers (
  id serial primary key,
  question_id int not null references daily_bonus_questions on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  user_answer boolean not null,
  answered_at timestamptz not null default now(),
  unique (question_id, user_id) -- one answer per user per question
);

-- Indexes
create index idx_daily_bonus_questions_date on daily_bonus_questions (episode_date);
create index idx_daily_bonus_answers_question on daily_bonus_answers (question_id);
create index idx_daily_bonus_answers_user on daily_bonus_answers (user_id);

-- RLS
alter table daily_bonus_questions enable row level security;
alter table daily_bonus_answers enable row level security;

-- Questions: anyone authenticated can read
create policy "Anyone can read daily bonus questions"
  on daily_bonus_questions for select
  to authenticated
  using (true);

-- Questions: only admins can insert/update/delete
create policy "Admins can manage daily bonus questions"
  on daily_bonus_questions for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Answers: users can read their own
create policy "Users can read own daily bonus answers"
  on daily_bonus_answers for select
  to authenticated
  using (user_id = auth.uid());

-- Answers: users can insert their own (before deadline handled in app logic)
create policy "Users can submit daily bonus answers"
  on daily_bonus_answers for insert
  to authenticated
  with check (user_id = auth.uid());

-- Answers: no updates or deletes (once submitted, it's final)
