import type { CyberAttempt } from '../../data/cybersecurity/types';
import type { Practice } from './practiceCatalogue';
import fixture from './auth-fixture.json';

export const answerKey = (name: string) => 'assessment.practice.' + name;
export const answer = (a: CyberAttempt, name: string) => a.answers[answerKey(name)] ?? '';
export const outcomes = { completed: 'Completed', partial: 'Partly completed', blocked: 'Could not access' };
export const scopeChoices = { proceed: 'Proceed within the stated boundary', clarify: 'Pause and ask for clarification', stop: 'Stop and keep the material private' };
export const scopeCases = [
  { id: 'scope-one', prompt: 'A lab assigns you one disposable host and explicitly permits its port-enumeration exercise. The session is active. You plan to inspect only that host.', correct: 'proceed', why: 'The target, action and time window are covered by the stated permission.' },
  { id: 'scope-two', prompt: 'You can see a neighbouring host from the training machine. The room gives no permission to test that neighbour.', correct: 'clarify', why: 'Reachability does not extend authorisation. Ask before changing the target.' },
  { id: 'scope-three', prompt: 'Your report screenshot includes a password that belongs to a real person. You are about to upload it to a public portfolio.', correct: 'stop', why: 'Do not publish the secret. Keep the material private, remove it from the proposed report and follow the relevant reporting process.' },
  { id: 'scope-four', prompt: 'The permitted testing window has ended. You would like to repeat one request to confirm a result.', correct: 'clarify', why: 'Permission includes timing. Get the window extended before another test.' },
] as const;

export const networkScenarios = {
  dns: { name: 'A missing name service', gateway: '10.20.0.1', dns: 'unavailable', https: 'allow' },
  route: { name: 'A gateway outside the local network', gateway: '10.99.0.1', dns: 'available', https: 'allow' },
  firewall: { name: 'A blocked website connection', gateway: '10.20.0.1', dns: 'available', https: 'block' },
} as const;
export interface NetworkConfig { scenario: string; gateway: string; dns: string; https: string }
export function networkConfig(a: CyberAttempt): NetworkConfig {
  return { scenario: answer(a, 'scenario'), gateway: answer(a, 'gateway'), dns: answer(a, 'dns'), https: answer(a, 'https') };
}
export function setScenario(a: CyberAttempt, id: keyof typeof networkScenarios) {
  const s = networkScenarios[id];
  for (const [key, value] of Object.entries({ scenario: id, gateway: s.gateway, dns: s.dns, https: s.https })) a.answers[answerKey(key)] = value;
  delete a.answers[answerKey('run')];
  a.inputVariant = 'Network simulation · ' + s.name;
}
export function networkSignature(c: NetworkConfig) { return JSON.stringify([c.scenario, c.gateway, c.dns, c.https]); }
export function simulateNetwork(c: NetworkConfig): { connected: boolean; trace: string[] } {
  const trace = ['Laptop: 10.20.0.10/24. Website: training.example → 198.51.100.20.'];
  // Deliberately a small, deterministic model: a local resolver, one router, one service.
  if (c.dns !== 'available') return { connected: false, trace: [...trace, 'Name lookup failed: the local DNS service is unavailable. No website connection was attempted.'] };
  trace.push('The local DNS service returned 198.51.100.20.');
  if (c.gateway !== '10.20.0.1') return { connected: false, trace: [...trace, 'Routing failed: the configured gateway is not the router on this /24 network. The remote website needs that router.'] };
  trace.push('The destination is outside 10.20.0.0/24. The laptop sent the connection through router 10.20.0.1.');
  if (c.https !== 'allow') return { connected: false, trace: [...trace, 'The outbound TCP 443 rule blocked the connection. Name lookup and routing alone were not enough.'] };
  return { connected: true, trace: [...trace, 'TCP 443 is allowed. The model assumes a healthy remote server and valid TLS; the website responds.'] };
}

export const authRows: string[][] = fixture;
export function analyseAuthRows(rows: string[][]) {
  const seen = new Set<string>(), valid: string[][] = [], invalid: string[][] = [], duplicate: string[][] = [];
  for (const row of rows) {
    if (row.length !== 6 || row.some(v => !v.trim()) || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(row[1]) || !Number.isFinite(Date.parse(row[1])) || !['success', 'failure'].includes(row[4])) { invalid.push(row); continue; }
    if (seen.has(row[0])) { duplicate.push(row); continue; }
    seen.add(row[0]); valid.push(row);
  }
  return { valid, invalid, duplicate, failures: valid.filter(row => row[4] === 'failure') };
}
export const logQuestions = [
  { id: 'valid', label: 'How many valid, unique events remain?' },
  { id: 'failures', label: 'How many of those events are failures?' },
  { id: 'invalid', label: 'How many raw rows are invalid?' },
  { id: 'duplicate', label: 'How many valid rows repeat an earlier event ID?' },
];
export interface PracticeCheck { label: string; passed: boolean; feedback: string }
export function practiceProblem(a: CyberAttempt, p: Practice): string | null {
  if (p.kind === 'external') {
    if (!Object.hasOwn(outcomes, answer(a, 'outcome'))) return 'Choose whether you completed the activity, stopped part-way or could not access it.';
    if (answer(a, 'outcome') === 'completed' && a.criticalPassed !== true) return 'Completion needs the scope and evidence check. You can still save partial or blocked work.';
  }
  if (p.kind === 'scope' && scopeCases.some(q => !Object.hasOwn(scopeChoices, answer(a, q.id)))) return 'Choose an action for each scenario before checking your attempt.';
  if (p.kind === 'network') {
    const c = networkConfig(a);
    if (!Object.hasOwn(networkScenarios, c.scenario) || !['10.20.0.1', '10.99.0.1'].includes(c.gateway) || !['available', 'unavailable'].includes(c.dns) || !['allow', 'block'].includes(c.https)) return 'Choose the settings for this network scenario.';
    if (answer(a, 'run') !== networkSignature(c)) return 'Run the connection test with your current settings before saving it.';
  }
  if (p.kind === 'logs' && logQuestions.some(q => !/^\d{1,3}$/.test(answer(a, q.id)))) return 'Enter a whole-number count for each log question. Your best estimate is fine.';
  return null;
}
export function practiceChecks(a: CyberAttempt, p: Practice): PracticeCheck[] {
  if (p.kind === 'scope') return scopeCases.map(q => ({ label: q.prompt, passed: answer(a, q.id) === q.correct, feedback: q.why }));
  if (p.kind === 'network') {
    const result = simulateNetwork(networkConfig(a));
    return [{ label: 'The simulated website responds', passed: result.connected, feedback: result.trace.join(' ') }];
  }
  if (p.kind === 'logs') {
    const parsed = analyseAuthRows(authRows);
    const counts: Record<string, number> = { valid: parsed.valid.length, failures: parsed.failures.length, invalid: parsed.invalid.length, duplicate: parsed.duplicate.length };
    return logQuestions.map(q => ({ label: q.label, passed: Number(answer(a, q.id)) === counts[q.id] && answer(a, q.id) !== '', feedback: `${counts[q.id]}. Invalid rows are excluded first; then valid rows are deduplicated by event ID before counting outcomes.` }));
  }
  return [];
}
