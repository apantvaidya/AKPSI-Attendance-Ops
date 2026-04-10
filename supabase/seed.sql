insert into public.admins (email, full_name)
values
  ('anpantva@ucsc.edu', 'Attendance Chair'),
  ('admin2@example.edu', 'Vice President')
on conflict (email) do update
set full_name = excluded.full_name;
