// Original teaching is authored separately from the stable curriculum/progress IDs.
// Build reproducibly, validate exact coverage, and render the same material for offline reading.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = resolve(root, 'content/teaching');
const read = file => readFileSync(resolve(base, file), 'utf8');
const json = file => JSON.parse(read(file));
const fail = message => { throw new Error('Teaching companion: ' + message); };
const lines = file => read(file).split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
const audit = new Map(json('source-audit.json').map(s => [s.id, s]));
const sources = {};
for (const line of lines('authoring/sources.tsv')) {
  const fields = line.split('\t');
  if (fields.length !== 4) fail('source row must have four tab-separated fields');
  const [id, kind, title, url] = fields;
  if (sources[id]) fail('duplicate source ' + id);
  if (!['read', 'watch', 'lookup', 'practice'].includes(kind)) fail('invalid resource kind ' + id);
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail('unsafe URL ' + id);
  if (audit.get(id)?.url !== url) fail('missing or stale source audit ' + id);
  sources[id] = { title, kind, url, checkedOn: audit.get(id).checked_on, access: audit.get(id).access };
}
const courses = [
  ['cybersecurity', '../cybersecurity/MyDay_Cybersecurity_Curriculum.json', 'Cybersecurity'],
  ['arabic-fusha', '../arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', 'Arabic Fuṣḥā'],
];
const checkOnly = process.argv.includes('--check');
function emit(file, value) {
  if (checkOnly) {
    if (read(file) !== value) fail(file + ' is stale; run npm run curriculum:prepare');
  } else writeFileSync(resolve(base, file), value);
}
const totalUsed = new Set();
const summaries = [];
for (const [key, file, title] of courses) {
  const curriculum = json(file), lessons = {}, used = new Set(), unique = new Set();
  const expected = new Map(curriculum.lessons.map(l => [l.id, l]));
  for (const [i, line] of lines('authoring/' + key + '.txt').entries()) {
    const fields = line.split(' | ');
    if (fields.length !== 6) fail(`${key} row ${i + 2}: expected six fields`);
    const [short, explanation, example, practice, solution, assignments] = fields;
    const id = 'lesson.' + short;
    if (!expected.has(id) || lessons[id]) fail('unknown/duplicate lesson ' + id);
    for (const [name, text] of Object.entries({ explanation, example, practice, solution })) {
      if (!text.trim() || /\b(?:TODO|TBD|PLACEHOLDER)\b/.test(text)) fail(id + ': empty/unfinished ' + name);
      if ((text.match(/`/g) || []).length % 2) fail(id + ': unpaired code mark in ' + name);
    }
    if (unique.has(explanation)) fail('repeated generic explanation: ' + id);
    unique.add(explanation);
    // Semicolons in prose are allowed; a new assignment starts only before source-id~.
    const resources = assignments.split(/;(?=[a-z][a-z0-9-]*~)/).map(a => {
      const split = a.indexOf('~'), sourceId = a.slice(0, split), instruction = a.slice(split + 1).trim();
      if (split < 1 || !sources[sourceId] || instruction.length < 15) fail(id + ': invalid assignment ' + a);
      used.add(sourceId); totalUsed.add(sourceId);
      return { sourceId, instruction };
    });
    if (!resources.length || new Set(resources.map(r => r.sourceId)).size !== resources.length) fail('missing/duplicate assignments ' + id);
    lessons[id] = { explanation, example, practice, solution, resources };
  }
  const missing = [...expected.keys()].filter(id => !lessons[id]);
  if (missing.length) fail('missing lessons: ' + missing.join(', '));
  const courseSources = Object.fromEntries([...used].sort().map(id => [id, sources[id]]));
  const companion = { version: '1.0.0', curriculumVersion: curriculum.curriculum_version, title, lessons, sources: courseSources };
  emit(key + '.json', JSON.stringify(companion, null, 2) + '\n');
  const md = [`# ${title}: lesson teaching companion`, '', 'Original explanations, worked examples and guided exercises for every lesson. Use this alongside the course roadmap and practical labs. Lesson IDs match MyDay so existing progress is preserved.', '', 'For a short session, read the explanation and example, attempt the exercise, then reveal its solution. For a longer session, complete the first assigned resource and the existing practical task. The course session times are flexible choices; a full lecture or reference chapter may need several sessions.', '', 'External materials open at their original providers. Pages and relevant topics were checked on 16 October 2026. Media pages/players were identified, but playback was not tested. Readings and transcripts can support study if a player is unavailable; reading a transcript does not count as unaided listening. Optional paid services and certificates are not required.', '', '## Modules', '', ...curriculum.modules.map(m => `- [${m.name}](#${m.id.replaceAll('.', '-')})`), ''];
  for (const m of curriculum.modules) {
    md.push(`<a id="${m.id.replaceAll('.', '-')}"></a>`, `## ${m.name}`, '');
    for (const l of curriculum.lessons.filter(l => l.module_id === m.id)) {
      const t = lessons[l.id];
      md.push(`<a id="${l.id.replaceAll('.', '-')}"></a>`, `### ${l.title}`, '', `Lesson ID: \`${l.id}\``, '', '#### Read', '', t.explanation, '', '#### Worked example', '', t.example, '', '#### Try it', '', t.practice, '', '<details>', '<summary>Reveal the explained answer</summary>', '', t.solution, '', '</details>', '', '#### Read, watch or explore next', '');
      for (const a of t.resources) {
        const s = sources[a.sourceId];
        md.push(`- **${s.kind === 'watch' ? 'Watch / listen' : s.kind[0].toUpperCase() + s.kind.slice(1)}:** [${s.title}](${s.url}) — ${a.instruction}`, `  ${s.access}`);
      }
      md.push('');
    }
  }
  emit(key + '-lessons.md', md.join('\n').trimEnd() + '\n');
  summaries.push({ course: key, lessons: Object.keys(lessons).length, assignedSources: used.size, watchSources: [...used].filter(id => sources[id].kind === 'watch').length });
}
emit('coverage.json', JSON.stringify({ version: '1.0.0', courses: summaries, uniqueAssignedSources: totalUsed.size, catalogueSources: Object.keys(sources).length }, null, 2) + '\n');
console.log(JSON.stringify({ teaching: 'validated', courses: summaries, uniqueAssignedSources: totalUsed.size }));
