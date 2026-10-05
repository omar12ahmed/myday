import raw from './practice.json';

export interface Practice {
  id: string;
  kind: 'external' | 'scope' | 'network' | 'logs';
  title: string;
  provider: string;
  access: 'in_app' | 'no_account' | 'free_account' | 'free_account_limits';
  accessNote: string;
  minutes: number;
  lessonIds: string[];
  relatedActivityIds: string[];
  instruction: string;
  steps: string[];
  evidence: string[];
  boundary: string;
  url?: string;
  fallbackId?: string;
}
export const practiceVersion = 'practice-' + raw.version;
export const practiceCheckedOn = raw.checkedOn;
export const practiceActivities = raw.activities as Practice[];
export const practiceById = new Map(practiceActivities.map(a => [a.id, a]));
export const accessLabel: Record<Practice['access'], string> = {
  in_app: 'In MyDay · no account', no_account: 'Free · no account',
  free_account: 'Free · provider account', free_account_limits: 'Free route · access limits may apply',
};
export function relatedPractice(id: string) {
  return practiceActivities.filter(p => p.lessonIds.includes(id) || p.relatedActivityIds.includes(id));
}
