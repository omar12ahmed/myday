-- Practise again (Arabic): one record per lesson (`arabic_practice`), holding the last days you did its Try it and its
-- mini challenge, what you ticked in a session still open, and its own place in revision. The id is the lesson's
-- ("lesson.arabic-…"), within the existing record-id rule. A Study reset clears it, so it is deletable. Only the two
-- lists of allowed kinds change: existing rows, the version-checked RPCs, the project triggers, grants and per-user
-- RLS are unchanged. Clients that don't know this kind ignore it when pulling.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','daily','book',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','book','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
