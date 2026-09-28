import { useState } from 'react';
import report from '../../data/airflow.json';

type Series = { label: string; values: (number | null)[]; samples?: number[]; unit?: string };
type Dataset = { buckets: string[]; charts: Record<string, Series[]> };
const views = [
  { id: 'c_open_vs_untriaged', title: 'Incoming reports and triage backlog', unit: 'Reports', mode: 'bar', note: 'Incoming reports include those rejected without opening a tracker. Backlog is the number awaiting triage at the end of each period.' },
  { id: 'c_cum', title: 'Tracked and closed reports', unit: 'Reports, cumulative', mode: 'line', note: 'Closed includes all dispositions, not only vulnerabilities that received a fix.' },
  { id: 'c_triage', title: 'Time to triage', unit: 'Hours, mean', mode: 'line', note: 'Means are calculated from the records available for each period. Sample counts are included in the data table.' },
  { id: 'c_resp', title: 'Time to first response', unit: 'Hours, mean', mode: 'line', note: 'Means are calculated from the records available for each period. Sample counts are included in the data table.' },
  { id: 'c_prc', title: 'Report to fix pull request', unit: 'Days, mean', mode: 'line', note: 'Elapsed time from creating a report to opening a fix pull request.' },
  { id: 'c_prm', title: 'Pull request to merge', unit: 'Days, mean', mode: 'line', note: 'Elapsed time from opening the fix pull request to merging it.' },
  { id: 'c_rel', title: 'Merge to advisory', unit: 'Days, mean', mode: 'line', note: 'Elapsed time from merging the fix to announcing the advisory.' },
  { id: 'c_rejected', title: 'Reports rejected without a tracker', unit: 'Reports', mode: 'bar', note: 'Dated reports rejected before a tracker was opened. They are not part of the tracked-report total.' },
  { id: 'c_states', title: 'Report lifecycle', unit: 'Reports at period end', mode: 'line', note: 'Lifecycle categories are reproduced as supplied. Their latest open/closed split differs from the cumulative summary by three records; these series should not be combined to recalculate the headline totals.' },
];
const colors = ['#004aad', '#72866c', '#9f764c', '#8182a6', '#839693'];
const friendly = (label: string) => ({
 'reported in quarter (opened + rejected)': 'Reports received', 'reported in month (opened + rejected)': 'Reports received',
 'untriaged at quarter-end': 'Awaiting triage', 'untriaged at month-end': 'Awaiting triage',
 'cumulative opened': 'Tracked', 'cumulative closed': 'Closed',
 'fixed_released': 'Fix released', 'open_pr_merged': 'Fix merged, report open', 'open_triaged': 'Triaged, report open',
 'open_untriaged': 'Awaiting triage', 'closed_other': 'Other closures', 'rejected (no tracker)': 'Rejected',
}[label] ?? label.replace(/^Mean time /, '').replace(/ \((hours|days)\)/, ''));
export default function AirflowCharts() {
 const [period, setPeriod] = useState<'quarterly'|'monthly'>('quarterly');
 const [viewId, setViewId] = useState('c_open_vs_untriaged');
 const [active, setActive] = useState<number | null>(null);
 const dataset = report.series[period] as Dataset;
 const view = views.find(item=>item.id === viewId)!;
 let traces = dataset.charts[viewId] ?? [];
 if (viewId === 'c_open_vs_untriaged') traces = [traces[2],traces[1]];
 if (viewId === 'c_cum') traces = traces.slice(0,2);
 const count = dataset.buckets.length;
 const max = Math.max(1,...traces.flatMap(trace=>trace.values.filter((value):value is number=>value !== null)));
 const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
 const ceiling = Math.ceil(max / step) * step;
 const width = 860, height = 320, left = 52, right = 20, top = 32, bottom = 45;
 const plotWidth = width-left-right, plotHeight = height-top-bottom;
 const x = (index:number)=>left+(index+.5)*plotWidth/count;
 const y = (value:number)=>top+plotHeight-(value/ceiling)*plotHeight;
 const adoptionIndex = dataset.buckets.findIndex(bucket=>bucket === '2026-Q2' || bucket === '2026-04');
 const axisLabel = (bucket:string)=>period === 'quarterly' ? bucket.replace('-', ' ') : bucket;
 const selectView = (value:string)=>{setViewId(value);setActive(null);};
 return <div className="airflow-charts">
   <div className="chart-controls"><select className="field-control" aria-label="Chart metric" value={viewId} onChange={event=>selectView(event.target.value)}>{views.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><div className="chart-period" role="group" aria-label="Time grouping">{(['quarterly','monthly'] as const).map(value=><button className="button button-quiet button-small" key={value} aria-pressed={period===value} onClick={()=>{setPeriod(value);setActive(null);}}>{value === 'quarterly' ? 'Quarterly' : 'Monthly'}</button>)}</div></div>
   <div className="chart-legend"><span>{view.unit}</span>{traces.map((trace,index)=><span key={trace.label}><i style={{background:colors[index]}}/>{traces.length === 1 ? 'Mean' === view.unit ? 'Mean' : view.unit.includes('mean') ? 'Mean time' : friendly(trace.label) : friendly(trace.label)}</span>)}</div>
   <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="airflow-chart" role="group" tabIndex={0} onFocus={()=>setActive(count-1)} onBlur={()=>setActive(null)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setActive(index=>event.key==='Home'?0:event.key==='End'?count-1:Math.max(0,Math.min(count-1,(index??count-1)+(event.key==='ArrowRight'?1:-1))));}}} aria-label={`${view.title}, ${period}, from ${dataset.buckets[0]} to ${dataset.buckets[count-1]}. Use left and right arrow keys to inspect periods. Last period is incomplete. Exact values available in the data table below.`}>
    {[0,1,2,3,4].map(tick=>{const value=ceiling*tick/4;return <g key={tick}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} className="chart-gridline"/><text x={left-12} y={y(value)+4} textAnchor="end" className="chart-label">{Number(value.toFixed(1))}</text></g>;})}
    {adoptionIndex>=0 && <g><line x1={x(adoptionIndex)-plotWidth/count/2} x2={x(adoptionIndex)-plotWidth/count/2} y1={top} y2={height-bottom} className="adoption-line"/><text x={x(adoptionIndex)-plotWidth/count/2-5} y={20} textAnchor="end" className="chart-label">Magpie adoption · Apr 2026</text></g>}
    {traces.map((trace,seriesIndex)=>view.mode==='bar' ? <g key={trace.label}>{trace.values.map((value,index)=>value!==null&&<rect key={index} x={x(index)-plotWidth/count*.32+seriesIndex*plotWidth/count*.32} y={y(value)} width={plotWidth/count*.29} height={Math.max(0,height-bottom-y(value))} rx="1.5" fill={colors[seriesIndex]} opacity={index===count-1?.45:1}/>)}</g> : <g key={trace.label}><path d={trace.values.reduce((result,value,index)=>{if(value===null)return result;return `${result} ${index===0||trace.values[index-1]===null?'M':'L'}${x(index)},${y(value)}`;},'')} fill="none" stroke={colors[seriesIndex]} strokeWidth="2.3" strokeLinejoin="round"/>{trace.values.map((value,index)=>value!==null&&<circle key={index} cx={x(index)} cy={y(value)} r={period==='monthly'?2.5:3.5} fill={index===count-1?'var(--paper)':colors[seriesIndex]} stroke={colors[seriesIndex]} strokeWidth="1.5"/>)}</g>)}
    {dataset.buckets.map((bucket,index)=><g key={bucket}>{(period==='quarterly'||index%6===0||index===count-1)&&<text x={x(index)} y={height-18} textAnchor="middle" className="chart-label">{axisLabel(bucket)}{index===count-1?'*':''}</text>}<rect x={x(index)-plotWidth/count/2} y={top} width={plotWidth/count} height={plotHeight} fill="transparent" role="img" aria-label={`${bucket}: ${traces.map(t=>`${friendly(t.label)} ${t.values[index]??'not available'}`).join('; ')}`} onMouseEnter={()=>setActive(index)} onMouseLeave={()=>setActive(null)} onClick={()=>setActive(active===index?null:index)}/></g>)}
    {active!==null&&<line x1={x(active)} x2={x(active)} y1={top} y2={height-bottom} className="chart-crosshair" pointerEvents="none"/>}
   </svg></div>
   <div className="chart-readout" aria-live="polite">{active!==null?<><strong>{axisLabel(dataset.buckets[active])}</strong>{traces.map(trace=><span key={trace.label}>{friendly(trace.label)}: <b>{trace.values[active]??'No data'}</b>{trace.samples?` (n=${trace.samples[active]})`:''}</span>)}</>:<span>* The latest period is incomplete. Observed values only; projections are excluded.</span>}</div>
   <p className="chart-note">{view.note}</p>
   <details className="chart-data"><summary>View data table</summary><div className="chart-table-scroll"><table><thead><tr><th>Period</th>{traces.map(trace=><th key={trace.label}>{friendly(trace.label)}{trace.samples?' (sample count)':''}</th>)}</tr></thead><tbody>{dataset.buckets.map((bucket,index)=><tr key={bucket}><th>{bucket}{index===count-1?' (partial)':''}</th>{traces.map(trace=><td key={trace.label}>{trace.values[index]??'Not available'}{trace.samples?` (n=${trace.samples[index]})`:''}</td>)}</tr>)}</tbody></table></div></details>
 </div>;
}
