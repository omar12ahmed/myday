-- Keep a word (Arabic): one record per word you keep (`arabic_word`), holding the Arabic as written, your meaning, an
-- optional note, where it came from, the day you kept it and its two revision schedules. The id is the word's own
-- ("kw…"), within the existing record-id rule. A word can be removed, so it is deletable. Only the two lists of
-- allowed kinds change: existing rows, the version-checked RPCs, the project triggers, grants and per-user RLS are
-- unchanged. Clients that don't know this kind ignore it when pulling.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','cyber_card','daily','book',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','cyber_card','book','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
