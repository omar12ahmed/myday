import { ShieldCheck } from 'lucide-react';
import { Card } from '../../components/Card';
import { LinkButton } from './parts';

export function CyberCard() {
  return <Card tone="accent" aria-labelledby="cyber-card-title">
    <div className="flex items-center gap-2 text-primary"><ShieldCheck size={22} aria-hidden="true" /><span className="eyebrow">Your learning workshop</span></div>
    <h2 id="cyber-card-title">Cybersecurity</h2>
    <p>Build your foundations, practise in a lab, and keep a notebook of what you discover.</p>
    <p className="text-sm text-fg-2">27 modules · 146 lessons · foundations and specialist paths</p>
    <LinkButton to="study/cybersecurity" primary>Open cybersecurity</LinkButton>
  </Card>;
}
