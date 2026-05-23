create table if not exists public.tickets (
  id text primary key,
  number integer not null unique,
  status text not null check (status in ('available', 'reserved', 'sold')),
  payment_status text not null default 'none' check (payment_status in ('none', 'pending', 'verified', 'rejected')),
  owner_name text,
  phone text,
  email text,
  payment_slip_name text,
  payment_slip_url text,
  payment_slip_path text,
  reserved_at timestamptz,
  verified_at timestamptz,
  purchased_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_payment_status_idx on public.tickets (payment_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

alter table public.tickets enable row level security;

create policy "Public read blocked"
on public.tickets
for select
to anon, authenticated
using (false);
