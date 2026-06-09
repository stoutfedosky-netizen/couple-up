-- Seed data: Love Island USA Season 8 Day 1 Islanders

insert into islanders (name, age, hometown, status, entered_week) values
  ('Aniya Harvey', 23, 'Tyrone, GA', 'active', 1),
  ('Beatriz Hatz', 25, 'San Diego, CA', 'active', 1),
  ('Bryce Alakai Dettloff', 29, 'Los Angeles, CA', 'active', 1),
  ('Gabriel Vasconcelos', 26, 'Miami, FL', 'active', 1),
  ('KC Chandler', 23, 'Fresno, CA', 'active', 1),
  ('Kenzie Annis', 24, 'Kennesaw, GA', 'active', 1),
  ('Melanie Moreno', 24, 'Los Angeles, CA', 'active', 1),
  ('Sincere Rhea', 25, 'Cape May, NJ', 'active', 1),
  ('Sean Reifel', 29, 'Easton, PA', 'active', 1),
  ('Trinity Tatum', 22, 'Newport News, VA', 'active', 1),
  ('Zach Georgiou', 26, 'Birmingham, UK', 'active', 1);

-- Week 1: prediction deadline June 8, 2026 at 8:00 PM ET (UTC-4)
insert into weeks (week_number, prediction_deadline) values
  (1, '2026-06-08T20:00:00-04:00');
