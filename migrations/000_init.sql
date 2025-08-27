-- Run this SQL on your Neon Postgres database (DATABASE_URL)
-- Creates minimal tables for the app

create table if not exists users (
  id uuid primary key,
  username varchar(120) not null,
  username_norm varchar(120) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  start_at_utc timestamptz not null,
  capacity_max integer not null,
  attended_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key,
  event_id uuid not null references events(id) on delete cascade,
  scanned boolean not null default false,
  scanned_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tickets_event on tickets(event_id);

