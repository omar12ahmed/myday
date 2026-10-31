-- Content projects (specs/projects-content.md): one record per idea or video (`content`), saying which project it
-- belongs to, so the project record stays as it is. The id is the item's own ("cv…"), within the existing record-id
-- rule; not a project_… kind, so the project triggers don't apply. An idea or video can be deleted, so it is
-- deletable. Only the two lists of allowed kinds change: existing rows, the version-checked RPCs, the project
-- triggers, the wipe's guard, grants and per-user RLS are unchanged. Clients that don't know this kind ignore it when
-- pulling. A record stays within the existing 512 KB limit (the app checks a little before it).
-- Before applying, re-read the live constraints: if another kind landed first, add it here too.
begin;
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','cyber_lesson','daily','book','file','research','content',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','arabic_lesson','arabic_word','arabic_practice','cyber_card','cyber_portfolio','cyber_lesson','book','file','research','content','project_milestone','project_decision','project_choice',
  'project_model','project_case','project_issue','project_evidence','project_timeline'));
commit;
