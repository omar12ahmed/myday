-- Cybersecurity lesson states (adaptive Study): one record per lesson you've marked (`cyber_lesson`), holding the day
-- you marked it ready to move on (when your roadmap doesn't have the path) and your own "Needs revision" flag with
-- what needs work. The id is the lesson's own ("lesson.…"), within the existing record-id rule. A record can be
-- removed (taking Ready back, Done revisiting), so it is deletable. Only the two lists of allowed kinds change:
-- existing rows, the version-checked RPCs, the project triggers, grants and per-user RLS are unchanged. Clients that
-- don't know this kind ignore it when pulling.
-- Before applying, re-read the live constraints: if another kind landed first, add it here too.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','cyber_lesson','daily','book','file',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','cyber_lesson','book','file','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
