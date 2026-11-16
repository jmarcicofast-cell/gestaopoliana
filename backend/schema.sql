create table public.team_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100),
 email text not null unique,
 role text not null check(role in ('admin','member')),
 active boolean not null default true,
 must_change_password boolean not null default false,
 valid_after bigint not null default 0,
 created_at timestamptz not null default now()
);
create table public.team_state (
 id text primary key check(id='main'),
 data jsonb not null check(jsonb_typeof(data)='object'),
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table public.team_setup (
 id text primary key check(id='initial'),
 token_hash text not null,
 used boolean not null default false,
 expires_at timestamptz not null
);
create table public.team_audit (
 id bigint generated always as identity primary key,
 actor uuid,
 action text not null,
 target text,
 created_at timestamptz not null default now()
);
alter table public.team_members enable row level security;
alter table public.team_state enable row level security;
alter table public.team_setup enable row level security;
alter table public.team_audit enable row level security;
revoke all on public.team_members,public.team_state,public.team_setup,public.team_audit from anon,authenticated;
grant all on public.team_members,public.team_state,public.team_setup,public.team_audit to service_role;
grant usage,select on sequence public.team_audit_id_seq to service_role;
comment on table public.team_state is 'Access only through team-api, which authenticates Supabase Auth and checks active membership on every request.';
