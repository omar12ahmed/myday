-- Attached files (specs/files.md): one record per file (`file`), holding its name, type, size, SHA-256, area and
-- state, never its bytes, which are kept in R2 through the files Edge Function. The id is the file's ("fl…"), within
-- the existing record-id rule. Removing a file for good deletes its record, so it is deletable. Only the two lists of
-- allowed kinds change: existing rows, the version-checked RPCs, the project triggers, grants and per-user RLS are
-- unchanged. Clients that don't know this kind ignore it when pulling. Before applying, re-read the live constraint
-- definitions: a later migration may have added kinds that must stay in both lists.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','daily','book','file',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','book','file','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
