-- Unknown metadata stays null, as specified in docs/SCHEMA.md.
alter table public.books alter column language drop not null;
alter table public.books alter column language drop default;
