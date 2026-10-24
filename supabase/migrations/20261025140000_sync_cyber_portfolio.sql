-- The Cybersecurity portfolio: one record per entry (`cyber_portfolio`), holding its title, the attempt's evidence as
-- you kept it, an optional note, the day you reviewed it and the ids of its files (the files themselves are the shared
-- `file` records and live in R2). The id is the entry's own ("pf…"), within the existing record-id rule. An entry can
-- be removed, so it is deletable. Only the two lists of allowed kinds change: existing rows, the version-checked RPCs,
-- the project triggers, grants and per-user RLS are unchanged. Clients that don't know this kind ignore it when pulling.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','daily','book','file',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','book','file','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
