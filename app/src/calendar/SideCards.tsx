import { RefreshCw, Repeat } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, Select } from '../components/Field';
import { fetchBankHolidays, getBhStatus, subscribeBhStatus } from '../data/bankHolidayFetch';
import { BH_REGIONS } from '../data/bankHolidays';
import { shortDate, todayKey } from '../data/dates';
import { DEFAULT_COLOURS, isHex, patternSummary, SHORT_LABEL, STATUS_LABEL } from '../data/rota';
import { update } from '../data/storage';
import type { BankHolidayRegion, ColourKey, MyDayData, PatternVersion } from '../data/types';
import { BankHolidayBadge, OverlapMark, RotaChip } from './Chips';

const LEGEND: ColourKey[] = ['day', 'night', 'off', 'sick', 'annual_leave', 'cancelled', 'custom', 'unauthorised', 'overtime', 'appointment'];

// What each colour means — every colour also has its text label, so nothing depends on colour alone.
export function LegendCard({ data }: { data: MyDayData }) {
  return (
    <Card aria-labelledby="legend-h">
      <h2 id="legend-h" className="text-lg">Legend</h2>
      <ul className="legend list-none p-0 m-0 mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        {LEGEND.map(k => (
          <li key={k} className="flex items-center gap-2 text-sm min-w-0">
            <RotaChip data={data} kind={k} label={SHORT_LABEL[k]} className="flex-none min-w-[54px] text-center" /><span>{STATUS_LABEL[k]}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-sm"><span className="flex-none min-w-[54px] text-center"><BankHolidayBadge /></span><span>Bank holiday</span></li>
        <li className="flex items-center gap-2 text-sm"><span className="flex-none min-w-[54px] text-center"><OverlapMark /></span><span>Overlapping entries</span></li>
      </ul>
      <p className="text-[15px] text-fg-2 mt-2.5 mb-0">Every colour also has a text label, so nothing depends on colour alone.</p>
    </Card>
  );
}

// The repeating pattern: each version and when it starts. Changing it adds a version from a date.
export function RotaCard({ data, onChange }: { data: MyDayData; onChange: () => void }) {
  const confirm = useConfirm();
  const vs = data.rota.patterns;
  async function remove(v: PatternVersion) {
    if (!(await confirm({ title: `Remove the pattern change starting ${shortDate(v.effectiveFrom!)}?`, confirmLabel: 'Remove this change' }))) return;
    update(d => { d.rota.patterns = d.rota.patterns.filter(x => x.id !== v.id); });
  }
  return (
    <Card aria-labelledby="rota-h">
      <h2 id="rota-h" className="text-lg">Your repeating pattern</h2>
      {vs.length ? (
        <ul className="versions list-none p-0 m-0 mt-2 mb-3">
          {vs.map(v => (
            <li key={v.id} className="py-2.5 border-t border-outline first:border-t-0">
              <strong>{v.effectiveFrom ? 'From ' + shortDate(v.effectiveFrom) : 'From the start'}</strong>
              <div className="text-[15px]">{patternSummary(v)} ({v.cycle.length}-day cycle)</div>
              <div className="text-sm text-fg-2">
                Day 1 on {shortDate(v.anchor)} · Day {v.times.day.start}–{v.times.day.end} · Night {v.times.night.start}–{v.times.night.end}
                {v.breaks.day || v.breaks.night ? ` · breaks ${v.breaks.day}/${v.breaks.night} min` : ''}
              </div>
              {v.effectiveFrom && v.effectiveFrom > todayKey() && (
                <Button inline variant="ghost" className="mt-2" data-action="pattern-remove" data-id={v.id} onClick={() => remove(v)}>Remove this future change</Button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-[15px] text-fg-2">Not set up yet.</p>}
      <Button variant={vs.length ? 'tonal' : 'primary'} data-action="pattern-new" onClick={onChange}>
        <Repeat size={18} aria-hidden="true" /> {vs.length ? 'Change the pattern from a date' : 'Set up my pattern'}
      </Button>
    </Card>
  );
}

// Bank holidays: region, when they were last loaded from gov.uk, and any problem loading them.
export function BankHolidayCard({ data }: { data: MyDayData }) {
  const st = useSyncExternalStore(subscribeBhStatus, getBhStatus);
  const b = data.bankHolidays;
  const status = st.loading ? 'Checking gov.uk…'
    : b.divisions && b.fetchedAt ? `Last updated from gov.uk on ${shortDate(b.fetchedAt.slice(0, 10))} at ${b.fetchedAt.slice(11)}.`
    : 'Not loaded yet.';
  return (
    <Card id="bhCard" aria-labelledby="bh-h">
      <h2 id="bh-h" className="text-lg">Bank holidays</h2>
      <Field label="Region" htmlFor="bhRegion">
        <Select id="bhRegion" data-bh-region value={b.region} onChange={e => { const r = e.target.value as BankHolidayRegion; if (BH_REGIONS[r]) update(d => { d.bankHolidays.region = r; }); }}>
          {(Object.keys(BH_REGIONS) as BankHolidayRegion[]).map(k => <option key={k} value={k}>{BH_REGIONS[k]}</option>)}
        </Select>
      </Field>
      <p id="bhStatus" className="text-[15px] mt-3" aria-live="polite">{status}</p>
      {st.error && (
        <p className="warn bg-warn-c text-on-warn-c rounded-lg px-2.5 py-1.5 text-sm">{st.error}{b.divisions ? ' Showing the saved copy.' : ' No bank holidays are shown until it loads.'}</p>
      )}
      <Button data-action="bh-refresh" disabled={st.loading} onClick={() => fetchBankHolidays(true)}><RefreshCw size={18} aria-hidden="true" /> Update from gov.uk</Button>
      <p className="text-[15px] text-fg-2 mt-2.5 mb-0">Bank holidays are only marked on the calendar. They never change your shifts or your pay rate — the pay view applies your bank holiday multiplier.</p>
    </Card>
  );
}

// Your colours for each status. The text on each chip switches between black and white to stay readable.
export function ColoursCard({ data }: { data: MyDayData }) {
  return (
    <Card>
      <details>
        <summary className="min-h-11 flex items-center gap-2 font-semibold text-[17px]">Colours</summary>
        <div className="colours grid gap-2 mt-2">
          {(Object.keys(DEFAULT_COLOURS) as ColourKey[]).map(k => (
            <label key={k} className="colour-row flex items-center gap-2.5 text-sm min-h-11">
              <CommitInput type="color" key={k + data.rota.colours[k]} data-colour={k} defaultValue={data.rota.colours[k]} aria-label={`Colour for ${STATUS_LABEL[k]}`}
                className="!w-12 !h-10 !min-h-10 !p-0.5 flex-none cursor-pointer"
                onCommit={el => { if (isHex(el.value)) update(d => { d.rota.colours[k] = el.value.toLowerCase(); }); }} />
              <RotaChip data={data} kind={k} label={SHORT_LABEL[k]} /><span>{STATUS_LABEL[k]}</span>
            </label>
          ))}
        </div>
        <Button inline variant="ghost" className="mt-2" data-action="colours-reset" onClick={() => update(d => { d.rota.colours = { ...DEFAULT_COLOURS }; })}>Reset colours</Button>
      </details>
    </Card>
  );
}
