'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const colors={blue:'#568ff0',mint:'#78d8b7',violet:'#8299b1',gold:'#e3bc68',slate:'#526d9f',dark:'#354a6d',pink:'#d17c76',lime:'#74cfb8'};
const categories=[
 {key:'other_or_idle',label:'Other / waiting',short:'Other / waiting',color:colors.slate},
 {key:'ambiguous_input',label:'Ambiguous input',short:'Ambiguous input',color:colors.pink},
 {key:'otherheld_device',label:'Handheld / non-PC',short:'Handheld device',color:colors.violet},
 {key:'active_input',label:'Clear computer input',short:'Computer input',color:colors.mint},
 {key:'paper_information',label:'Paper-information work',short:'Paper work',color:colors.gold},
 {key:'unobservable',label:'Not observable',short:'Unobservable',color:colors.dark}
];
const mode='demo';
let data,examples,demoData,current='all',activeCategory='all',activeMainView='analytics',videoRecords=[],activeRecording=null;
const dateLabel=d=>d.startsWith('demo-')?'D'+d.slice(-2):'Oct '+d.slice(-2);
const visibleSeries=new Set(['AccuFill','ComputerUse']);
const pct=n=>(n*100).toFixed(1);
const svg=(view,body,label)=>`<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${body}</svg>`;
function gauge(value,color,label){
 const r=48,c=Math.PI*r,share=Math.min(value/100,1);
 return svg('0 0 140 95',`<path d="M22 66 A48 48 0 0 1 118 66" fill="none" stroke="#262626" stroke-width="9" stroke-linecap="round"/><path d="M22 66 A48 48 0 0 1 118 66" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*share} ${c}"/><circle cx="70" cy="66" r="28" fill="${color}" opacity=".025"/><text x="70" y="63" text-anchor="middle" class="gauge-value">${value.toFixed(1)}<tspan>%</tspan></text><text x="20" y="85" fill="#455d7d" font-size="6">0</text><text x="108" y="85" fill="#455d7d" font-size="6">100</text>`,`${label}: ${value.toFixed(1)} percent`);
}
function spark(color,kind){
 return `<svg class="metric-spark" viewBox="0 0 195 32" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spark-${kind}"><stop stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity=".14"/></linearGradient></defs><rect width="195" height="32" fill="url(#spark-${kind})"/><path d="M0 31H195M0 22H195M0 13H195M15 0V32M45 0V32M75 0V32M105 0V32M135 0V32M165 0V32" stroke="${color}" stroke-opacity=".08" stroke-width=".5"/></svg>`;
}
function renderMetrics(record){
 const s=record.study;
 const metric=(label,value,unit,note,color,kind)=>`<article class="metric-card"><div class="metric-label">${label}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M5 15 15 5M5 5h10v10"/></svg></div><div class="metric-number">${value}<span>${unit}</span></div><div class="metric-note">${note}</div>${spark(color,kind)}</article>`;
 const gm=(label,value,color,note,focus=false)=>`<article class="metric-card gauge-card ${focus?'focus':''}"><div class="metric-label">${label}<span style="color:${color}">•</span></div><div class="gauge-wrap">${gauge(value,color,label)}</div><div class="metric-note">${note}</div></article>`;
 $('#metric-grid').innerHTML=metric('Raw footage','1,000','hrs','Collection in progress',colors.mint,0)+metric('Analyzed clips',record.clips.toLocaleString(),'','Two workstations',colors.blue,1)+metric('Sampled moments',s.n.toLocaleString(),'','Illustrative activity sample',colors.violet,2)+metric('Flagged clips',record.positive_clips.toLocaleString(),'','Coarse positive labels',colors.lime,3)+gm('Clear input',s.categories.active_input.fraction*100,colors.blue,'SAMPLED ACTIVITY')+gm('Paper work',s.categories.paper_information.fraction*100,colors.gold,'INFORMATION WORK')+gm('Input + paper',s.active_plus_paper.fraction*100,colors.mint,'DIGITAL SIGNALS',true)+gm('Unresolved',(s.unresolved_count/s.n)*100,colors.pink,'REQUIRES REVIEW');
 $('#signal-share').innerHTML=`${pct(s.active_plus_paper.fraction)}<span>%</span>`;
 const r=34,c=2*Math.PI*r,v=s.active_plus_paper.fraction;
 $('#signal-chart').innerHTML=svg('0 0 88 88',`<circle cx="44" cy="44" r="${r}" fill="none" stroke="#22354a" stroke-width="3"/><circle cx="44" cy="44" r="${r}" fill="none" stroke="${colors.mint}" stroke-width="3" stroke-dasharray="${c*v} ${c*(1-v)}" transform="rotate(-90 44 44)" stroke-linecap="round"/><circle cx="44" cy="44" r="24" fill="none" stroke="#294038" stroke-dasharray="1 5"/><path d="M22 47h10l6-14 9 24 6-12h13" stroke="${colors.mint}" fill="none" stroke-width="1.4" opacity=".8"/>`,`Digital work signals ${pct(v)} percent`);
}
function renderVolume(){
 const dates=Object.keys(data).filter(k=>k!=='all');
 const w=650,h=190,left=30,right=15,top=12,bottom=28;
 const stationNames=['AccuFill','ComputerUse'];
 const max=Math.ceil(Math.max(...dates.flatMap(d=>data[d].rows.map(r=>r.clips)))/200)*200;
 const x=i=>left+i*(w-left-right)/(dates.length-1),y=n=>h-bottom-(n/max)*(h-top-bottom);
 let html='<defs><linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#568ff0" stop-opacity=".28"/><stop offset="1" stop-color="#568ff0" stop-opacity="0"/></linearGradient><linearGradient id="mintArea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#74cfb8" stop-opacity=".20"/><stop offset="1" stop-color="#74cfb8" stop-opacity="0"/></linearGradient></defs>';
 [0,max/4,max/2,max*3/4,max].forEach(v=>{html+=`<line x1="${left}" y1="${y(v)}" x2="${w-right}" y2="${y(v)}" class="chart-grid"/><text x="${left-9}" y="${y(v)+3}" text-anchor="end" class="chart-label">${v}</text>`;});
 dates.forEach((d,i)=>{if(dates.length<=8||i%4===0||i===dates.length-1)html+=`<text x="${x(i)}" y="${h-6}" class="chart-label" text-anchor="middle">${dateLabel(d)}</text>`;if(current===d)html+=`<rect x="${x(i)-18}" y="${top-4}" width="36" height="${h-top-bottom+8}" fill="#b7d4ff" opacity=".035" rx="4"/>`;});
 stationNames.forEach((name,index)=>{if(!visibleSeries.has(name))return;const values=dates.map(d=>data[d].rows.find(r=>r.station===name).clips);const points=values.map((v,i)=>[x(i),y(v)]);const path=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');const color=index?colors.lime:colors.blue;html+=`<path d="${path}L${x(dates.length-1)} ${h-bottom}L${left} ${h-bottom}Z" fill="url(#${index?'mintArea':'blueArea'})"/><path d="${path}" stroke="${color}" stroke-width="2.1" stroke-linejoin="round" fill="none"/>`;points.forEach((p,i)=>{html+=`<circle cx="${p[0]}" cy="${p[1]}" r="${current===dates[i]?4:2.8}" fill="${color}" stroke="#090909" stroke-width="1.5"><title>${name==='ComputerUse'?'Computer use':name}, ${dates[i]}: ${values[i]} segments</title></circle>`;});});
 $('#volume-chart').innerHTML=svg(`0 0 ${w} ${h}`,html,'Analyzed segment counts by observation date, for AccuFill and computer-use workstations');
 const record=data[current];$('#volume-total').textContent=record.clips.toLocaleString()+' demo segments';
}
function renderMix(record){
 const s=record.study,r=59,c=2*Math.PI*r;let offset=0;
 let body='<circle cx="90" cy="90" r="59" stroke="#242424" stroke-width="14" fill="none"/>';
 categories.forEach(cat=>{const fraction=s.categories[cat.key].fraction;if(fraction>0)body+=`<circle cx="90" cy="90" r="${r}" stroke="${cat.color}" stroke-width="14" fill="none" stroke-dasharray="${Math.max(0,c*fraction-3)} ${c*(1-fraction)+3}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)"><title>${cat.label}: ${pct(fraction)}%</title></circle>`;offset+=c*fraction;});
 body+=`<circle cx="90" cy="90" r="45" stroke="#282828" fill="#080808" stroke-width=".7"/><text x="90" y="89" text-anchor="middle" class="donut-center">${s.n}</text><text x="90" y="106" text-anchor="middle" class="donut-sub">sampled moments</text>`;
 $('#mix-chart').innerHTML=svg('0 0 180 180',body,`Distribution of ${s.n} AccuFill sampled moments`);
 $('#mix-legend').innerHTML=categories.map(cat=>`<div><i class="swatch" style="color:${cat.color}"></i><span>${cat.short}</span><b>${pct(s.categories[cat.key].fraction)}%</b></div>`).join('');
 $('#activity-bars').innerHTML=categories.map(cat=>{const v=s.categories[cat.key].fraction;return`<div class="activity-bar"><span>${cat.label}</span><div class="bar-track"><i style="width:${v*100}%;background:${cat.color}"></i></div><b>${pct(v)}% <small>${s.categories[cat.key].count}</small></b></div>`;}).join('');
}
function render(){if(document.documentElement.dataset.ready==='true')finishEntranceAnimation();const record=data[current];renderMetrics(record);renderVolume();renderMix(record);renderDenseCharts(record);}
function text(x,y,value,size=9,color='#8a8a8a',anchor='start',weight=400){return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${value}</text>`;}
function renderDenseCharts(record){
 const dates=Object.keys(data).filter(k=>k!=='all');
 const s=record.study;
 const status=[{label:'Positive',value:record.positive_clips,color:'#74cfb8'},{label:'Uncertain',value:record.uncertain_clips,color:'#e3bc68'},{label:'Other',value:record.clips-record.positive_clips-record.uncertain_clips,color:'#8299b1'}];
 let offset=0,body='';const r=45,c=2*Math.PI*r;
 status.forEach(v=>{const f=v.value/record.clips;body+=`<circle cx="75" cy="62" r="45" fill="none" stroke="${v.color}" stroke-width="13" stroke-dasharray="${Math.max(0,c*f-2)} ${c*(1-f)+2}" stroke-dashoffset="${-offset}" transform="rotate(-90 75 62)"><title>${v.label}: ${v.value} clips</title></circle>`;offset+=c*f;});
 body+=text(75,62,record.clips,26,'#fafafa','middle',500)+text(75,78,'total clips',8,'#737373','middle');
 $('#classification-chart').innerHTML=svg('0 0 150 124',body,'Coarse clip classification counts');
 $('#classification-legend').innerHTML=status.map(v=>`<div><i style="background:${v.color}"></i><span>${v.label}</span><b>${v.value}</b><small>${pct(v.value/record.clips)}%</small></div>`).join('');
 body='';const w=435,lh=23,labelW=118,cw=(w-labelW)/dates.length;
 dates.forEach((d,i)=>{if(dates.length<=8||i%4===0||i===dates.length-1)body+=text(labelW+i*cw+cw/2,14,dateLabel(d),8,current===d?'#ffffff':'#8a8a8a','middle',current===d?600:400);});
 categories.forEach((cat,row)=>{const y=24+row*lh;body+=text(0,y+14,cat.short,9,'#aaaaaa');dates.forEach((d,i)=>{const v=data[d].study.categories[cat.key],f=v.fraction;body+=`<rect x="${labelW+i*cw}" y="${y}" width="${cw-(dates.length>8?2:5)}" height="${lh-5}" rx="2" fill="${cat.color}" opacity="${.13+Math.sqrt(f)*.8}"${current===d?' stroke="#ffffff" stroke-width=".6"':''}><title>${dateLabel(d)} ${cat.label}: ${pct(f)}%</title></rect>`+(dates.length<=8?text(labelW+i*cw+(cw-5)/2,y+12.5,pct(f)+'%',8.5,'#ffffff','middle'):'');});});
 $('#activity-heatmap').innerHTML=svg(`0 0 ${w} 168`,body,'Activity portion heatmap by observation date; each cell shows its sample percentage');
 body='';const bw=365,bh=174,base=147,left=32,max=Math.max(.1,...dates.map(d=>data[d].study.active_plus_paper.fraction));const scale=Math.ceil(max*100/5)*5;
 for(let tick=0;tick<=scale;tick+=scale/2){const y=base-tick/scale*115;body+=`<line x1="${left}" y1="${y}" x2="350" y2="${y}" stroke="#252525" stroke-dasharray="2 4"/>`+text(25,y+3,(Number.isInteger(tick)?tick.toFixed(0):tick.toFixed(1))+'%',8,'#686868','end');}
 dates.forEach((d,i)=>{const spacing=(bw-left-18)/dates.length,barWidth=Math.min(25,spacing*.6),x=left+spacing*(i+.5);let top=base;[['active_input',colors.mint],['paper_information',colors.gold]].forEach(([key,color])=>{const v=data[d].study.categories[key].fraction,h=v*100/scale*115;top-=h;body+=`<rect x="${x-barWidth/2}" y="${top}" width="${barWidth}" height="${h}" fill="${color}" rx="1"><title>${dateLabel(d)} ${key==='active_input'?'clear input':'paper work'}: ${pct(v)}%</title></rect>`;});if(dates.length<=8||i%6===0||i===dates.length-1)body+=text(x,top-7,pct(data[d].study.active_plus_paper.fraction)+'%',8,'#dedede','middle')+text(x,165,dateLabel(d),8,current===d?'#fff':'#777','middle');});
 $('#daily-signal-chart').innerHTML=svg(`0 0 ${bw} ${bh}`,body,'Clear computer input and paper-information shares by date');
 body='';record.rows.forEach((row,i)=>{const y=25+i*64;body+=text(0,y-5,row.station==='ComputerUse'?'Computer use':row.station,10,'#bbb')+text(385,y-5,row.clips+' clips',9,'#777','end');let x=0;[['computer_use','#74cfb8'],['uncertain','#e3bc68'],['other_meaningful','#8299b1']].forEach(([key,color])=>{const fraction=row.clips?row.counts[key]/row.clips:0,width=385*fraction;if(width>0)body+=`<rect x="${x}" y="${y+7}" width="${width}" height="17" fill="${color}" rx="1"><title>${key}: ${row.counts[key]} clips</title></rect>`+(fraction>.08?text(x+width/2,y+19,pct(fraction)+'%',8,'#080808','middle',600):'');x+=width;});});
 $('#station-chart').innerHTML=svg('0 0 390 137',body,'Distribution of coarse classifications within each workstation');
 const unresolved=s.unresolved_count,share=unresolved/s.n;body='';let reviewOffset=0;[['ambiguous_input',colors.pink],['unobservable',colors.dark]].forEach(([key,color])=>{const f=s.categories[key].count/s.n;body+=`<circle cx="73" cy="74" r="49" fill="none" stroke="${color}" stroke-width="11" stroke-dasharray="${Math.max(0,2*Math.PI*49*f-2)} ${2*Math.PI*49*(1-f)+2}" stroke-dashoffset="${-reviewOffset}" transform="rotate(-90 73 74)"/>`;reviewOffset+=2*Math.PI*49*f;});body=`<circle cx="73" cy="74" r="49" fill="none" stroke="#222" stroke-width="11"/>`+body+text(73,73,pct(share)+'%',23,'#d17c76','middle',500)+text(73,90,'unresolved',8,'#888','middle');
 body+=text(152,37,s.categories.ambiguous_input.count,19,colors.pink)+text(152,52,'Ambiguous input',9,'#8a8a8a')+text(152,84,s.categories.unobservable.count,19,colors.dark)+text(152,99,'Not observable',9,'#8a8a8a')+text(152,128,s.n-unresolved+' remaining moments',9,'#9d9d9d');
 $('#review-chart').innerHTML=svg('0 0 335 148',body,'Unresolved sampling classifications: ambiguous and unobservable moments');
 $('#review-totals').innerHTML=`<span><i class="swatch" style="color:${colors.pink}"></i>${unresolved} for review</span><span>${s.n} sampled</span>`;
 const tasks=[['Create folder',30,60,10,20],['Select instrument',15,30,5,10],['Match platefiles',60,120,20,40],['Set output paths',40,80,8,20],['Load + review',60,120,60,120]];body='';
 tasks.forEach((v,i)=>{const y=16+i*24,manual=(v[1]+v[2])/2,agent=(v[3]+v[4])/2;body+=text(0,y+5,v[0],8,'#999')+`<rect x="111" y="${y-4}" width="${manual*1.63}" height="5" fill="#526d9f" rx="1"/><rect x="111" y="${y+4}" width="${agent*1.63}" height="5" fill="#78d8b7" rx="1"/>`+text(363,y+5,v[1]+'–'+v[2]+' s',8,'#aaa','end');});
 $('#setup-task-chart').innerHTML=svg('0 0 370 142',body,'Assumed operator setup time per task: blue manual, green agent assisted; bar lengths use scenario midpoints');
}
function renderEvidence(){
 const search=$('#evidence-search').value.trim().toLowerCase();
 const filtered=examples.filter(e=>(activeCategory==='all'||e.category===activeCategory)&&(`${e.label} ${e.id}`.toLowerCase().includes(search)));
 $('#evidence-grid').innerHTML=filtered.length?filtered.map(e=>`<button class="evidence-card" data-evidence="${e.id}" aria-label="View ${e.label.toLowerCase()} example ${e.id}"><div class="evidence-image"><img src="assets/${e.file}" alt="AccuFill ${e.label.toLowerCase()} example" loading="lazy"><span class="frame-label">ACCUFILL / ${e.id}</span></div><div class="evidence-caption"><b>${e.label}</b><span>${e.id} ↗</span></div></button>`).join(''):'<div class="no-evidence">No matching examples. Try a different search.</div>';
 $$('[data-evidence]').forEach(button=>button.addEventListener('click',()=>{const e=examples.find(x=>x.id===button.dataset.evidence);$('#evidence-title').textContent=e.label+' · '+e.id;$('#evidence-detail-image').src='assets/'+e.file;$('#evidence-dialog').showModal();}));
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function exportSnapshot(){
 const record=data[current];const rows=[['Thermo Fisher × Iteria dashboard snapshot',current],['Data provenance','SYNTHETIC DEMO — illustrative values, not measured TFS results'],['Raw footage collection (hours)',1000],['Analyzed segments',record.clips],['AccuFill sampled moments',record.study.n],['Scope','Illustrative synthetic operational scenario'],['Activity','Count','Portion (%)'],...categories.map(c=>[c.label,record.study.categories[c.key].count,pct(record.study.categories[c.key].fraction)])];
 const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='TFS_'+mode+'_snapshot_'+current+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Analysis snapshot exported');
}
$$('[data-notes]').forEach(b=>b.addEventListener('click',()=>$('#notes-dialog').showModal()));
$('#mix-expand').addEventListener('click',()=>$('#notes-dialog').showModal());
$$('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
$('#date-select').addEventListener('change',event=>{current=event.target.value;render();});
$$('.series-toggle').forEach(b=>b.addEventListener('click',()=>{if(visibleSeries.has(b.dataset.series)){if(visibleSeries.size===1)return;visibleSeries.delete(b.dataset.series);}else visibleSeries.add(b.dataset.series);b.classList.toggle('active',visibleSeries.has(b.dataset.series));b.setAttribute('aria-pressed',visibleSeries.has(b.dataset.series));renderVolume();}));
$$('.evidence-tab').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.category;$$('.evidence-tab').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',t===b);});renderEvidence();}));
$('#evidence-search').addEventListener('input',renderEvidence);
$('#export-button').addEventListener('click',exportSnapshot);
$('#review-opportunities').addEventListener('click',()=>$('#workflows').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>{setMainView('analytics',false,false);$$('.nav-link').forEach(n=>n.classList.toggle('active',n===b));$('.breadcrumb>span').textContent=b.childNodes[1].textContent.trim();}));
const observer=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.isIntersecting);if(!entry)return;$$('.nav-link').forEach(n=>n.classList.toggle('active',n.hash==='#'+entry.target.id));},{rootMargin:'-10% 0px -65% 0px'});$$('#analytics-view section[id]').forEach(s=>observer.observe(s));
function initializeDemoData(){
 data=demoData.reports;current='all';
 document.documentElement.dataset.mode='demo';
 $('#date-select').innerHTML='<option value="all">All demo shifts</option>'+Object.keys(data).filter(k=>k!=='all').map(k=>'<option value="'+k+'">Demo shift '+k.slice(-2)+'</option>').join('');
 $$('.dense-chart-grid>.panel').forEach(p=>{const badge=document.createElement('span');badge.className='data-source-tag';badge.textContent='DEMO';p.append(badge);});
 render();renderTelemetry();syncViewProvenance();
}
Promise.all([fetch('evidence-examples.json').then(r=>r.json()),fetch('demo-data.json').then(r=>{if(!r.ok)throw new Error('Demo data unavailable');return r.json();}),fetch('original-videos.json').then(r=>r.json())]).then(([e,m,v])=>{examples=e;demoData=m;videoRecords=v;initializeDemoData();renderEvidence();renderVideoLibrary();setMainView(['#videos','#evidence'].includes(location.hash)?'videos':'analytics',false,false);if(location.hash==='#evidence')requestAnimationFrame(()=>$('#evidence').scrollIntoView());document.documentElement.dataset.ready='true';startEntranceAnimation();}).catch(()=>{$('#metric-grid').innerHTML='<p>Analysis could not be loaded. Please reload this page.</p>';});
function renderTelemetry(){
 const samples=demoData.telemetry;const width=640,height=171,left=27,right=12,top=15,base=147;let body='';
 [0,25,50,75,100].forEach(v=>{const y=base-v/100*(base-top);body+=`<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" stroke="#262626" stroke-dasharray="2 4"/>`+text(21,y+3,v,7,'#666','end');});
 [['activity',colors.blue],['computer',colors.mint],['paper',colors.gold]].forEach(([key,color],series)=>{const points=samples.map((s,i)=>[left+i/(samples.length-1)*(width-left-right),base-s[key]/100*(base-top)]);const path=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');body+=`<defs><linearGradient id="pulse-${key}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${path}L${width-right} ${base}L${left} ${base}Z" fill="url(#pulse-${key})"/><path d="${path}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`;});
 [0,16,32,48,64,80,95].forEach(i=>body+=text(left+i/95*(width-left-right),163,String(i+1).padStart(2,'0'),7,'#777','middle'));
 $('#telemetry-chart').innerHTML=svg(`0 0 ${width} ${height}`,body,'Synthetic demo: station activity, computer input and information work over 96 illustrative intervals');
 const laneNames=['Prepare','Identify','Configure','Operate','Review','Record'],palette=[colors.blue,colors.mint,colors.violet,colors.gold,colors.pink,colors.dark];body='';
 demoData.event_grid.forEach((lane,row)=>{const y=14+row*23;body+=text(0,y+8,laneNames[row],8,'#aaa');lane.forEach((v,i)=>{const x=65+i*6.1;body+=`<rect x="${x}" y="${y}" width="4.7" height="13" rx="1" fill="${v?palette[row]:'#1e1e1e'}" opacity="${v?.2+v*.15:1}"><title>Synthetic ${laneNames[row]} interval ${i+1}: intensity ${v}</title></rect>`;});});
 $('#event-map-chart').innerHTML=svg('0 0 365 160',body,'Synthetic demo: six workflow lanes across 48 intervals; colors show illustrative event intensity');
 const cycles=demoData.cycles,bins=Array(12).fill(0),min=3.8,max=5.8;cycles.forEach(v=>bins[Math.min(11,Math.floor((v-min)/(max-min)*12))]++);const ymax=Math.ceil(Math.max(...bins)/5)*5;body='';
 for(let v=0;v<=ymax;v+=ymax/2){const y=141-v/ymax*115;body+=`<line x1="26" y1="${y}" x2="347" y2="${y}" stroke="#252525" stroke-dasharray="2 4"/>`+text(20,y+3,v,7,'#666','end');}
 bins.forEach((n,i)=>{const h=n/ymax*115,x=31+i*26.1;body+=`<rect x="${x}" y="${141-h}" width="20" height="${h}" rx="1" fill="${i<4?colors.blue:i<8?colors.violet:colors.pink}" opacity=".9"><title>Synthetic elapsed run ${(min+i*(max-min)/12).toFixed(2)}–${(min+(i+1)*(max-min)/12).toFixed(2)} hours: ${n} runs</title></rect>`;});
 [4,4.5,5,5.5].forEach(v=>body+=text(31+(v-min)/(max-min)*313,159,v.toFixed(1)+'h',7,'#888','middle'));
 $('#cycle-distribution-chart').innerHTML=svg('0 0 365 171',body,'Synthetic demo: distribution of 120 simulated instrument elapsed run durations');const sorted=[...cycles].sort((a,b)=>a-b),median=(sorted[59]+sorted[60])/2;$('#cycle-demo-median').textContent='Median '+median.toFixed(2)+' h';
}
function syncViewProvenance(){
 if(activeMainView==='videos')$('#data-provenance').innerHTML='<span></span>SOURCE FOOTAGE';
 else $('#data-provenance').innerHTML='<span></span>DEMO DATA · Illustrative';
}
function setMainView(view,updateHash=true,scrollTop=true){
 const previousView=activeMainView;
 if(document.documentElement.dataset.ready==='true')finishEntranceAnimation();
 activeMainView=view==='videos'?'videos':'analytics';
 const videos=activeMainView==='videos';
 $('#analytics-view').hidden=videos;$('#videos-view').hidden=!videos;$('.analytics-subnav').hidden=videos;
 $$('[data-main-view]').forEach(b=>{const active=b.dataset.mainView===activeMainView;b.classList.toggle('is-selected',active);if(b.getAttribute('role')==='tab'){b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;}else b.setAttribute('aria-pressed',active);});
 $('.breadcrumb>span').textContent=videos?'Original videos':'Analytics';
 if(!videos&&$('#recording-dialog').open)$('#recording-dialog').close();
 syncViewProvenance();
 if(updateHash)history.replaceState(null,'',videos?'#videos':'#overview');
 if(scrollTop)window.scrollTo({top:0,behavior:'instant'});
 if(previousView!==activeMainView&&document.documentElement.dataset.ready==='true')startEntranceAnimation({chrome:false});
}
$$('[data-main-view]').forEach(b=>b.addEventListener('click',()=>setMainView(b.dataset.mainView)));
$$('.main-view-tab').forEach(b=>b.addEventListener('keydown',event=>{
 const tabs=$$('.main-view-tab');let index=tabs.indexOf(b);
 if(event.key==='ArrowRight'||event.key==='ArrowLeft')index=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;
 event.preventDefault();setMainView(tabs[index].dataset.mainView);tabs[index].focus();
}));
window.addEventListener('hashchange',()=>{setMainView(['#videos','#evidence'].includes(location.hash)?'videos':'analytics',false,false);});
function videoTime(seconds){const n=Math.round(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
function renderVideoLibrary(){
 $('#recordings-summary').textContent=videoRecords.length+' full recordings · '+Math.round(videoRecords.reduce((sum,r)=>sum+r.duration_s,0)/60)+' min of source footage';
 $('#source-frame-count').textContent=examples.length;
 $('#recordings-grid').innerHTML=videoRecords.map(r=>`<button class="recording-card" data-recording="${r.id}" aria-label="Play original ${r.title.toLowerCase()} recording"><div class="recording-poster"><img src="${r.poster}" alt="${r.title} source recording poster" loading="lazy"><span class="recording-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5.5 19 12 9 18.5Z" fill="currentColor"/></svg></span><span class="recording-duration">${videoTime(r.duration_s)}</span></div><div class="recording-card-meta"><span>ACCUFILL / ${r.id}</span><span>CAM ${r.camera.padStart(2,'0')}</span></div><div class="recording-card-title"><h3>${r.title}</h3><svg aria-hidden="true"><use href="#i-arrow"/></svg></div><p>Full recording <span>·</span> slide excerpt available</p></button>`).join('');
 $$('[data-recording]').forEach(button=>button.addEventListener('click',()=>{
 activeRecording=videoRecords.find(r=>r.id===button.dataset.recording);$('#recording-title').textContent=activeRecording.title+' · '+activeRecording.id;$('#recording-player').poster=activeRecording.poster;$('#recording-dialog').showModal();setPlaybackSource('full');
 }));
}
let videoLoadSequence=0,videoLoadController=null,activePlaybackKind='full';
const videoPlaybackCache=new Map();
async function playbackFile(source,onProgress,signal){
 if(videoPlaybackCache.has(source)){const url=videoPlaybackCache.get(source);videoPlaybackCache.delete(source);videoPlaybackCache.set(source,url);return url;}
 const response=await fetch(source,{signal});if(!response.ok)throw new Error('Video unavailable');
 const length=+response.headers.get('content-length')||0;const chunks=[];let loaded=0;
 if(response.body){const reader=response.body.getReader();while(true){const result=await reader.read();if(result.done)break;chunks.push(result.value);loaded+=result.value.byteLength;onProgress(length?Math.min(99,Math.round(loaded/length*100)):null);}}
 else chunks.push(await response.arrayBuffer());
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 const url=URL.createObjectURL(new Blob(chunks,{type:'video/mp4'}));videoPlaybackCache.set(source,url);
 while(videoPlaybackCache.size>2){const first=videoPlaybackCache.keys().next().value;URL.revokeObjectURL(videoPlaybackCache.get(first));videoPlaybackCache.delete(first);}
 return url;
}
async function setPlaybackSource(kind,seekTo=0){
 if(!activeRecording)return;
 const sequence=++videoLoadSequence;if(videoLoadController)videoLoadController.abort();videoLoadController=new AbortController();
 const full=kind==='full',player=$('#recording-player'),status=$('#video-loading');activePlaybackKind=kind;
 $('#play-full-recording').classList.toggle('is-selected',full);$('#play-full-recording').setAttribute('aria-pressed',full);
 $('#play-slide-excerpt').classList.toggle('is-selected',!full);$('#play-slide-excerpt').setAttribute('aria-pressed',!full);
 $('#recording-meta').textContent='AccuFill · Camera '+activeRecording.camera+' · '+videoTime(full?activeRecording.duration_s:activeRecording.excerpt_duration_s);
 $('#recording-source-note').textContent=full?'Full source recording · web playback copy':'Slide excerpt · source recording '+videoTime(activeRecording.excerpt_start_s)+'–'+videoTime(activeRecording.excerpt_start_s+activeRecording.excerpt_duration_s);
 $('#jump-to-slide-moment').textContent='Jump to slide moment · '+videoTime(activeRecording.moment_s);$('#jump-to-slide-moment').disabled=true;
 player.pause();player.onloadedmetadata=null;player.removeAttribute('src');player.load();status.hidden=false;status.textContent='Loading '+(full?'recording':'excerpt')+'…';
 const source=full?activeRecording.full:activeRecording.excerpt;player.dataset.sourceUrl=source;
 try{
  const url=await playbackFile(source,percent=>{if(sequence===videoLoadSequence)status.textContent='Loading '+(full?'recording':'excerpt')+(percent!==null?' · '+percent+'%':'…');},videoLoadController.signal);
  if(sequence!==videoLoadSequence||!$('#recording-dialog').open)return;
  player.onloadedmetadata=()=>{if(sequence!==videoLoadSequence)return;if(seekTo>0)player.currentTime=Math.min(seekTo,player.duration-.1);status.hidden=true;$('#jump-to-slide-moment').disabled=false;player.play().catch(()=>{});};
  player.onerror=()=>{if(sequence!==videoLoadSequence)return;status.hidden=false;status.textContent='Video could not play. Select a source to retry.';};player.src=url;player.load();
 }catch(error){if(sequence!==videoLoadSequence||error.name==='AbortError')return;status.textContent='Video could not load. Select Full recording or Slide excerpt to retry.';}
}
$('#play-full-recording').addEventListener('click',()=>setPlaybackSource('full'));
$('#play-slide-excerpt').addEventListener('click',()=>setPlaybackSource('excerpt'));
$('#jump-to-slide-moment').addEventListener('click',()=>{const player=$('#recording-player');if(activePlaybackKind==='full'&&player.readyState>=1){player.currentTime=Math.min(activeRecording.moment_s,player.duration-.1);player.play().catch(()=>{});}else setPlaybackSource('full',activeRecording.moment_s);});
$('#recording-dialog').addEventListener('close',()=>{videoLoadSequence++;if(videoLoadController)videoLoadController.abort();const player=$('#recording-player');player.pause();player.onloadedmetadata=null;player.onerror=null;player.removeAttribute('src');player.load();$('#video-loading').hidden=true;});
window.addEventListener('pagehide',()=>{if(videoLoadController)videoLoadController.abort();for(const url of videoPlaybackCache.values())URL.revokeObjectURL(url);videoPlaybackCache.clear();});
// Entrance motion is replayed for each visit, without changing the source data.
const entranceMotion={animations:[],actors:[],counters:[],frame:0,timer:0,lastStart:-Infinity};
const reducedEntranceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function finishEntranceAnimation(){
 clearTimeout(entranceMotion.timer);cancelAnimationFrame(entranceMotion.frame);
 entranceMotion.animations.forEach(animation=>animation.cancel());
 entranceMotion.counters.forEach(counter=>{counter.node.textContent=counter.raw;});
 entranceMotion.actors.forEach(actor=>{actor.classList.remove('intro-actor');actor.style.removeProperty('--intro-delay');});
 entranceMotion.animations=[];entranceMotion.actors=[];entranceMotion.counters=[];
 document.documentElement.classList.remove('intro-active','intro-chrome');
 document.documentElement.dataset.motion=reducedEntranceMotion.matches?'reduced':'complete';
}
function withinEntranceViewport(element){const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight+90;}
function entranceAnimate(element,keyframes,options){if(!withinEntranceViewport(element))return;entranceMotion.animations.push(element.animate(keyframes,{fill:'backwards',...options}));}
function prepareEntranceCounter(element){
 let visual=element.querySelector('.intro-number');
 if(!visual){
  const original=[...element.childNodes].find(n=>n.nodeType===3&&/^\s*\d[\d,]*(?:\.\d+)?\s*$/.test(n.textContent));if(!original)return null;
  const label=element.textContent.trim().replace(/(\d)([a-zA-Z])/g,'$1 $2');
  visual=element.namespaceURI==='http://www.w3.org/2000/svg'?document.createElementNS('http://www.w3.org/2000/svg','tspan'):document.createElement('span');
  visual.classList.add('intro-number');visual.dataset.finalValue=original.textContent;visual.setAttribute('aria-hidden','true');original.replaceWith(visual);visual.textContent=visual.dataset.finalValue;
  if(element.namespaceURI!=='http://www.w3.org/2000/svg'){element.setAttribute('role','status');element.setAttribute('aria-live','off');element.setAttribute('aria-label',label);[...element.children].forEach(c=>c.setAttribute('aria-hidden','true'));}
 }
 const raw=visual.dataset.finalValue,match=raw.match(/^(\s*)(\d[\d,]*(?:\.\d+)?)(\s*)$/);if(!match)return null;
 const decimals=(match[2].split('.')[1]||'').length;
 return{node:visual,raw,target:Number(match[2].replaceAll(',','')),prefix:match[1],suffix:match[3],format:new Intl.NumberFormat('en-US',{useGrouping:match[2].includes(','),minimumFractionDigits:decimals,maximumFractionDigits:decimals})};
}
function startEntranceAnimation({chrome=true}={}){
 if(document.documentElement.dataset.ready!=='true'||document.querySelector('dialog[open]'))return;
 if(reducedEntranceMotion.matches){finishEntranceAnimation();return;}
 const now=performance.now();if(now-entranceMotion.lastStart<380)return;
 finishEntranceAnimation();entranceMotion.lastStart=now;
 const root=document.documentElement,view=document.querySelector(activeMainView==='videos'?'#videos-view':'#analytics-view');
 const actors=[...view.querySelectorAll('.page-heading,.video-page-heading,.filterbar,.metric-card,.section-heading,.panel,.recording-card,.source-mosaic-section .evidence-card')].filter(withinEntranceViewport);
 actors.forEach((actor,index)=>{actor.classList.add('intro-actor');actor.style.setProperty('--intro-delay',Math.min(index*32,380)+'ms');});entranceMotion.actors=actors;
 root.classList.add('intro-active');if(chrome)root.classList.add('intro-chrome');root.dataset.motion='playing';root.dataset.entranceRuns=String((+root.dataset.entranceRuns||0)+1);
 [...view.querySelectorAll('.metric-number,.gauge-value,.collection-reading>strong')].filter(withinEntranceViewport).forEach(element=>{const counter=prepareEntranceCounter(element);if(counter)entranceMotion.counters.push(counter);});
 const tick=time=>{const progress=Math.max(0,Math.min(1,(time-now-90)/1050)),eased=1-Math.pow(1-progress,3);entranceMotion.counters.forEach(counter=>{counter.node.textContent=counter.prefix+counter.format.format(counter.target*eased)+counter.suffix;});if(progress<1)entranceMotion.frame=requestAnimationFrame(tick);};entranceMotion.frame=requestAnimationFrame(tick);
 view.querySelectorAll('#volume-chart path[stroke],#telemetry-chart path[stroke]').forEach(path=>{const length=path.getTotalLength();if(length>0)entranceAnimate(path,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:900,delay:260,easing:'cubic-bezier(.22,.61,.36,1)'});});
 view.querySelectorAll('svg[role="img"] [stroke-dasharray]').forEach(shape=>{const parts=shape.getAttribute('stroke-dasharray').trim().split(/[ ,]+/).map(Number);if(parts.length===2&&parts.every(Number.isFinite)&&parts[0]>0)entranceAnimate(shape,[{strokeDasharray:`0 ${parts[0]+parts[1]}`},{strokeDasharray:`${parts[0]} ${parts[1]}`}],{duration:900,delay:190,easing:'cubic-bezier(.22,.61,.36,1)'});});
 view.querySelectorAll('.activity-bars .bar-track i,.scenario-row>div>i').forEach((bar,index)=>{bar.style.transformOrigin='left center';entranceAnimate(bar,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:700,delay:200+Math.min(index*30,180),easing:'cubic-bezier(.22,.61,.36,1)'});});
 view.querySelectorAll('#daily-signal-chart rect,#cycle-distribution-chart rect').forEach((bar,index)=>{bar.style.transformBox='fill-box';bar.style.transformOrigin='center bottom';entranceAnimate(bar,[{transform:'scaleY(.02)'},{transform:'scaleY(1)'}],{duration:720,delay:240+Math.min(index*8,200),easing:'cubic-bezier(.22,.61,.36,1)'});});
 view.querySelectorAll('#activity-heatmap svg,#event-map-chart svg').forEach(grid=>entranceAnimate(grid,[{clipPath:'inset(0 100% 0 0)',opacity:.3},{clipPath:'inset(0 0% 0 0)',opacity:1}],{duration:850,delay:250,easing:'cubic-bezier(.22,.61,.36,1)'}));
 entranceMotion.timer=setTimeout(finishEntranceAnimation,1500);
}
window.addEventListener('pageshow',event=>{if(event.persisted)startEntranceAnimation();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startEntranceAnimation();});
reducedEntranceMotion.addEventListener('change',event=>{if(event.matches)finishEntranceAnimation();});
