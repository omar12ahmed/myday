import { useState } from 'react';
import { calculateEconomics } from './economics';
import { SceneHeading } from './SceneHeading';
import { StoryHandoff } from './StoryHandoff';
import { MoneySplit } from './MoneySplit';
import type { SceneProps } from './sceneContext';

export function EconomicsScene({ scene }: SceneProps<'economics'>) {
  const [inputs, setInputs] = useState(scene.inputs);
  const e = calculateEconomics(inputs);
  const money = (n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:scene.currency}).format(n);
  const controls = [{key:'orderValue',label:'Order value',max:100,step:1},{key:'takeRate',label:'Platform commission',max:25,step:.5},{key:'productCost',label:'Merchant product cost',max:100,step:1},{key:'logistics',label:'Inbound logistics',max:20,step:.5},{key:'delivery',label:'Delivery (passed through)',max:20,step:.5},{key:'operating',label:'Platform operating cost',max:15,step:.25}] as const;
  const rows = [{label:'Merchandise value',value:e.order,kind:'neutral'},{label:'Product cost',value:-e.product,kind:'cost'},{label:'Inbound logistics',value:-e.logistics,kind:'cost'},{label:'Commission to platform',value:-e.revenue,kind:'cost'},{label:'Potential merchant gross profit',value:e.merchantGross,kind:'result'}];
  const extent=Math.max(1,...rows.map(r=>Math.abs(r.value)));
  return <><div className="ex-section-inner"><SceneHeading scene={scene} /><p className="ex-lede ex-economics-intro">{scene.description}</p>
    <div className="ex-customer-total" data-money-stage=""><div><span className="ex-mono">01 / Customer payment</span><h3>One order.<br />Two destinations.</h3></div><div className="ex-customer-amount"><strong>{money(e.customerTotal)}</strong><span>{money(e.order)} merchandise <b aria-hidden="true">+</b> {money(e.delivery)} delivery</span></div></div>
    <MoneySplit total={e.customerTotal} merchant={Math.round((e.order-e.revenue)*100)/100} platform={e.revenue} courier={e.delivery} money={money} />
    <div className="ex-economics-grid"><div className="ex-ledger">
      <figure className="ex-merchant-flow" aria-label="Illustrative merchant economics" data-money-stage=""><div className="ex-ledger-title"><div><span className="ex-mono">02 / Merchant economics</span><h3>Goods belong to the merchant.</h3></div><span className="ex-amount-note">Placeholder / USD</span></div>
        <svg className="ex-money-chart" viewBox="0 0 640 300" role="img" aria-label="Merchant economics: costs are negative; gross profit can be positive or negative."><line x1="365" x2="365" y1="5" y2="275" />{rows.map((r,i)=>{const w=Math.abs(r.value)/extent*112;return <g key={r.label} transform={`translate(0,${i*54+18})`}><text x="0" y="17" className="ex-money-label">{r.label}</text><rect x={r.value<0?365-w:365} y="0" width={w} height="24" className={`ex-money-bar ex-money-${r.kind}`} /><text x="638" y="17" textAnchor="end" className="ex-money-value">{money(r.value)}</text></g>;})}</svg>
        <dl className="ex-money-mobile">{rows.map(r=><div key={r.label}><dt>{r.label}</dt><dd>{money(r.value)}</dd></div>)}</dl><figcaption>Merchant gross margin: {e.merchantMargin===null?'not defined at zero order value':`${e.merchantMargin.toFixed(1)}%`} with these figures. Before merchant overhead, tax, returns and losses.</figcaption>
      </figure>
      <div className="ex-platform-ledger" data-money-stage=""><div className="ex-platform-entry"><div><span className="ex-mono">03 / Platform revenue</span><h3>A share of the order.<br />Not the whole sale.</h3><p>Commission of {inputs.takeRate}% on merchandise value.</p></div><strong data-value="revenue">{money(e.revenue)}</strong></div>
        <div className="ex-operating-deduction"><span className="ex-money-connector" aria-hidden="true">↓</span><span>Less platform operating cost<small>Illustrative variable support / processing</small></span><b>−{money(e.operating)}</b></div>
        <div className="ex-contribution"><div><span className="ex-mono">04 / Platform contribution</span><h3>What remains per order.</h3><p>Before fixed overhead, tax and unmodelled costs.</p></div><strong data-value="contribution">{money(e.platformContribution)}</strong></div>
      </div>
      <div className="ex-delivery-money" data-money-stage=""><span className="ex-mono">05 / Delivery flow</span><div><span><strong>{money(e.delivery)}</strong>Collected</span><svg viewBox="0 0 200 28" aria-hidden="true"><path d="M0 14 H197 M187 4 L197 14 L187 24" /></svg><span><strong>{money(e.delivery)}</strong>Paid to delivery</span></div><p>Passed through at cost in this model. No platform delivery margin.</p></div>
      <p className="ex-economics-note">Product and inbound logistics costs belong to the merchant in this model. They are not subtracted again from platform revenue. Negative outcomes remain visible; this is not a forecast.</p>
    </div>
    <aside className="ex-assumptions" aria-label="Placeholder assumptions"><span className="ex-mono">A small thought experiment</span><h3>Change an assumption.</h3><p>Placeholder figures · USD per order</p>{controls.map(c=><label key={c.key} htmlFor={`ex-${c.key}`}><span>{c.label}<output htmlFor={`ex-${c.key}`}>{c.key==='takeRate'?`${inputs[c.key]}%`:money(inputs[c.key])}</output></span><input id={`ex-${c.key}`} type="range" min="0" max={Math.max(c.max,scene.inputs[c.key])} step={c.step} value={inputs[c.key]} onChange={event=>setInputs({...inputs,[c.key]:Number(event.target.value)})} aria-valuetext={`${c.key==='takeRate'?inputs[c.key]+' percent':money(inputs[c.key])}, placeholder figure`} /></label>)}<button className="ex-text-button" onClick={()=>setInputs(scene.inputs)}>Reset figures</button><p className="ex-session-note">Changes are for this exploration only. They are not saved.</p></aside>
    </div>
  </div><StoryHandoff from="Placeholder figures" to="Real evidence">The model is a question. A real order can begin to answer it.</StoryHandoff></>;
}
