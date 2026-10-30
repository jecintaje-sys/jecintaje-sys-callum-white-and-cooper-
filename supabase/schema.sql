-- Run this in the Supabase SQL Editor before using uploads.
insert into storage.buckets (id, name, public, file_size_limit)
values ('learning-files', 'learning-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Users can read own learning files" on storage.objects;
create policy "Users can read own learning files" on storage.objects
for select to authenticated using (bucket_id = 'learning-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own learning files" on storage.objects;
create policy "Users can upload own learning files" on storage.objects
for insert to authenticated with check (bucket_id = 'learning-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own learning files" on storage.objects;
create policy "Users can delete own learning files" on storage.objects
for delete to authenticated using (bucket_id = 'learning-files' and (storage.foldername(name))[1] = auth.uid()::text);