-- =====================================================================
-- MSV Zossen Trainer — Datenbankschema
-- Postgres / Supabase
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Skill-Kategorien (Stammdaten)
-- ---------------------------------------------------------------------
create table if not exists skill_categories (
  id          text primary key,
  name        text not null,
  description text
);

insert into skill_categories (id, name, description) values
  ('passspiel',         'Passspiel',         'Genauigkeit und Vision beim Pass'),
  ('schuss',            'Schuss',            'Abschluss und Schusskraft'),
  ('zweikampf',         'Zweikampf',         'Defensives und offensives Duell'),
  ('kondition',         'Kondition',         'Ausdauer und körperliche Fitness'),
  ('schnelligkeit',     'Schnelligkeit',     'Sprint und Antrittsstärke'),
  ('technik',           'Technik',           'Ballkontrolle und Dribbling'),
  ('kopfball',          'Kopfball',          'Kopfballstärke offensiv und defensiv'),
  ('spielverstaendnis', 'Spielverständnis',  'Taktisches Verständnis und Stellungsspiel')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Spieler
-- ---------------------------------------------------------------------
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null,
  birth_date     date,
  position       text check (position in ('GK','DEF','MID','ATT')),
  jersey_number  int,
  active         boolean not null default true,
  injured        boolean not null default false,
  injury_until   date,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Aktuelle Skill-Werte je Spieler (1.00 - 10.00)
-- ---------------------------------------------------------------------
create table if not exists player_skills (
  player_id    uuid references players(id) on delete cascade,
  category_id  text references skill_categories(id),
  value        numeric(4,2) not null check (value >= 0 and value <= 10),
  floor_value  numeric(4,2) not null default 1.0 check (floor_value >= 0 and floor_value <= 10),
  updated_at   timestamptz not null default now(),
  primary key (player_id, category_id)
);

-- ---------------------------------------------------------------------
-- Trainings
-- ---------------------------------------------------------------------
create table if not exists trainings (
  id                uuid primary key default gen_random_uuid(),
  scheduled_at      timestamptz not null,
  location          text,
  duration_minutes  int not null default 90,
  intensity         text not null default 'mittel' check (intensity in ('locker','mittel','intensiv')),
  notes             text,
  applied           boolean not null default false,  -- 1%-Update bereits ausgeführt?
  applied_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Anwesenheit
-- ---------------------------------------------------------------------
create table if not exists attendance (
  player_id     uuid references players(id) on delete cascade,
  training_id   uuid references trainings(id) on delete cascade,
  status        text not null default 'unklar' check (status in ('zu','ab','unklar','verletzt')),
  responded_at  timestamptz,
  primary key (player_id, training_id)
);

-- ---------------------------------------------------------------------
-- Übungen
-- ---------------------------------------------------------------------
create table if not exists exercises (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  min_players       int not null default 1,
  max_players       int not null default 30,
  duration_minutes  int not null default 15,
  intensity         text not null default 'mittel' check (intensity in ('locker','mittel','intensiv')),
  diagram           jsonb,            -- Konva-Boardstate (Spieler, Pfeile)
  created_at        timestamptz not null default now()
);

-- Tags pro Übung: welche Skills werden trainiert (mit Gewicht 0.5 - 2.0)
create table if not exists exercise_skills (
  exercise_id  uuid references exercises(id) on delete cascade,
  category_id  text references skill_categories(id),
  weight       numeric(3,2) not null default 1.0 check (weight >= 0 and weight <= 3),
  primary key (exercise_id, category_id)
);

-- ---------------------------------------------------------------------
-- Trainingsplan: welche Übungen wurden im Training gemacht
-- ---------------------------------------------------------------------
create table if not exists training_plan_items (
  id                uuid primary key default gen_random_uuid(),
  training_id       uuid references trainings(id) on delete cascade,
  exercise_id       uuid references exercises(id),
  ordinal           int not null default 0,
  duration_minutes  int,
  notes             text
);

-- ---------------------------------------------------------------------
-- Audit-Log aller Skill-Änderungen
-- ---------------------------------------------------------------------
create table if not exists skill_history (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid references players(id) on delete cascade,
  category_id   text references skill_categories(id),
  before_value  numeric(4,2) not null,
  after_value   numeric(4,2) not null,
  delta_pct     numeric(6,4),
  source        text not null check (source in ('training','absence','peer_review','manual')),
  source_ref    uuid,
  note          text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Peer-Review-Fenster (alle 6 Monate)
-- ---------------------------------------------------------------------
create table if not exists peer_review_windows (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'upcoming' check (status in ('upcoming','open','closed')),
  applied     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Bewertungen (anonym in Anzeige; rater_id nur für Eindeutigkeit)
create table if not exists peer_reviews (
  id            uuid primary key default gen_random_uuid(),
  window_id     uuid references peer_review_windows(id) on delete cascade,
  rater_id      uuid references players(id) on delete cascade,
  ratee_id      uuid references players(id) on delete cascade,
  category_id   text references skill_categories(id),
  rating        numeric(4,2) not null check (rating >= 1 and rating <= 10),
  created_at    timestamptz not null default now(),
  unique (window_id, rater_id, ratee_id, category_id)
);

-- ---------------------------------------------------------------------
-- Taktiken (Spielfeld-Layouts mit Spielerpositionen + Pfeilen)
-- ---------------------------------------------------------------------
create table if not exists tactics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  formation    text,            -- z.B. '4-3-3'
  board_data   jsonb not null,  -- Konva state: nodes, arrows, etc.
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_attendance_training on attendance(training_id);
create index if not exists idx_skill_history_player on skill_history(player_id, created_at desc);
create index if not exists idx_trainings_scheduled on trainings(scheduled_at desc);
create index if not exists idx_peer_reviews_window  on peer_reviews(window_id, ratee_id, category_id);
