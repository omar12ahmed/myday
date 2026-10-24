-- Research (specs/projects-research.md): a project's questions, sources and findings, one record each (`research`),
-- each saying which project it belongs to; not a project part, so the split-project functions don't change. Removing
-- one deletes its record, so it is deletable. Only the two lists of allowed kinds change: existing rows, the
-- version-checked RPCs, the project triggers, the wipe's guard, grants and per-user RLS are unchanged. Clients that
-- don't know this kind ignore it when pulling. Before applying, re-read the live constraint definitions: a later
-- migration may have added kinds that must stay in both lists.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','daily','book','file','research',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','book','file','research','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
