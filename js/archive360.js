(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RANGE_KEY='sigad_ranges_v2';
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const num=v=>Number(v)||0;
const repos={
  'Dunas':{status:'active',subtitle:'Plano interactivo activo',packages:2094,accent:'D',examples:['01-21T','504-22T','516-23T','74-24T']},
  'Sáenz Peña':{status:'ranges',subtitle:'Ubicación por rangos configurados',accent:'SP',examples:['26-1','26-458','26-822']},
  'NCPP - Sótano':{status:'ranges',subtitle:'Ubicación por rangos configurados',accent:'NS',examples:['13101R','14572R','24000R']},
  'López Padilla':{status:'ranges',subtitle:'Ubicación por rangos configurados',accent:'LP',examples:['1R','6500R','13100R']}
};
let currentRepo='Dunas', currentZoom=1, initialized=false, lastFound=null;
const DUNAS_YEARS=[[2021,1000],[2022,504],[2023,516],[2024,74]];
let offset=0;DUNAS_YEARS.forEach(y=>{y.off=offset;offset+=y[1]});
const DUNAS_TOTAL=offset;
const shelves=[];
const add=(section,x,y,w,h,ax,ay)=>shelves.push({n:shelves.length+1,section,x,y,w,h,ax,ay});
[[466,530],[402,466],[339,402],[274,339]].forEach(([a,b])=>add('Pared izquierda',407,a,26,b-a,445,(a+b)/2));
[[407,471],[471,535],[535,595],[595,660],[660,724]].forEach(([a,b])=>add('Pared superior',a,250,b-a,24,(a+b)/2,287));
[[250,313],[313,376],[376,440],[440,503],[503,567],[567,630],[630,694]].forEach(([a,b])=>add('Pared derecha',725,a,26,b-a,706,(a+b)/2));
[[667,731],[603,667],[539,603]].forEach(([a,b])=>add('Fila inferior',a,700,b-a,27,(a+b)/2,693));
[[562,625],[498,562],[434,498],[370,434],[307,370]].forEach(([a,b])=>add('Bloque central · cara derecha',551,a,26,b-a,587,(a+b)/2));
[[307,370],[370,434],[434,498],[498,562],[562,625]].forEach(([a,b])=>add('Bloque central · cara izquierda',526,a,25,b-a,513,Math.min((a+b)/2,520)));
for(let i=0;i<8;i++)add('Bloque derecho · fila 1',597,299+47*i,26,47,587,322.5+47*i);
for(let i=6;i>=0;i--)add('Bloque derecho · fila 2',655,299+47*i,26,47,706,322.5+47*i);
let cursor=0;shelves.forEach(s=>{s.count=Math.min(48,DUNAS_TOTAL-cursor);s.from=cursor;s.to=cursor+s.count-1;cursor+=s.count});
const dunasLabel=g=>{for(let i=DUNAS_YEARS.length-1;i>=0;i--)if(g>=DUNAS_YEARS[i].off)return `${pad(g-DUNAS_YEARS[i].off+1)}-${pad(DUNAS_YEARS[i][0]%100)}T`;return''};
function parseDunas(text){
  const m=String(text||'').toUpperCase().replace(/\s/g,'').match(/^(\d{1,4})-(\d{2})T$/);
  if(!m)return null;
  const year=DUNAS_YEARS.find(r=>r[0]===2000+Number(m[2]));
  if(!year)return{error:`No hay paquetes del año 20${m[2]} configurados en Dunas.`};
  const n=Number(m[1]);
  if(n<1||n>year[1])return{error:`La serie ${m[2]}T va del 01 al ${year[1]}.`};
  return{global:year.off+n-1,code:`${pad(n)}-${m[2]}T`};
}
function ranges(){try{return JSON.parse(localStorage.getItem(RANGE_KEY)||'[]')}catch{return[]}}
function parseGeneric(code,prefix){
  const c=String(code||'').trim().toUpperCase(),p=String(prefix||'').trim().toUpperCase();
  if(p==='R'){const m=c.match(/^(\d+)R$/);return m?num(m[1]):null}
  if(p&&c.startsWith(p)){const m=c.slice(p.length).match(/^\d+/);return m?num(m[0]):null}
  if(!p){const m=c.match(/\d+/);return m?num(m[0]):null}
  if(c.includes(p)){const m=c.replace(p,'').match(/\d+/);return m?num(m[0]):null}
  return null;
}
function genericMatches(code){return ranges().filter(r=>{const x=parseGeneric(code,r.prefix);return x!==null&&x>=num(r.from)&&x<=num(r.to)})}
function dunasFind(code){
  const p=parseDunas(code);if(!p||p.error)return p;
  const shelf=shelves.find(s=>p.global>=s.from&&p.global<=s.to);if(!shelf)return null;
  const balda=Math.floor((p.global-shelf.from)/6)+1;
  return{repo:'Dunas',code:p.code,global:p.global,shelf,balda,range:`${dunasLabel(shelf.from)} a ${dunasLabel(shelf.to)}`};
}
const key=(x,y)=>`${x},${y}`, nodes=new Map(), adj=new Map(), VX=[445,513,587,706], HY=[287,693], ENTRY=[445,693];
function node(x,y){const k=key(x,y);if(!nodes.has(k)){nodes.set(k,{x,y});adj.set(k,[])}return k}
function link(a,b){const A=nodes.get(a),B=nodes.get(b),d=Math.abs(A.x-B.x)+Math.abs(A.y-B.y);adj.get(a).push([b,d]);adj.get(b).push([a,d])}
const vp={},hp={};VX.forEach(x=>vp[x]=[287,(x===445||x===513)?520:693]);HY.forEach(y=>hp[y]=VX.slice());
shelves.forEach(s=>{if(VX.includes(s.ax))vp[s.ax].push(s.ay);else hp[s.ay].push(s.ax)});
const chain=(arr,fx)=>{const u=[...new Set(arr)].sort((a,b)=>a-b);u.forEach((v,i)=>{node(...fx(v));if(i)link(key(...fx(u[i-1])),key(...fx(v)))})};
VX.forEach(x=>chain(vp[x],y=>[x,y]));HY.forEach(y=>chain(hp[y],x=>[x,y]));
function route(to){
  const start=key(...ENTRY),end=key(to.ax,to.ay),dist={},prev={},Q=new Set(nodes.keys());nodes.forEach((_,k)=>dist[k]=Infinity);dist[start]=0;
  while(Q.size){let u=null;Q.forEach(k=>{if(u===null||dist[k]<dist[u])u=k});Q.delete(u);if(u===end)break;(adj.get(u)||[]).forEach(([v,d])=>{if(dist[u]+d<dist[v]){dist[v]=dist[u]+d;prev[v]=u}})}
  const p=[];for(let k=end;k;k=prev[k])p.unshift(nodes.get(k));return p;
}
function directions(s,b,P){
  const segments=[];
  for(let i=1;i<P.length;i++){const a=P[i-1],c=P[i],d=[Math.sign(c.x-a.x),Math.sign(c.y-a.y)],last=segments.at(-1);if(last&&last.d[0]===d[0]&&last.d[1]===d[1])last.to=c;else segments.push({d,from:a,to:c})}
  const verb=d=>d[0]>0?'avance a la derecha':d[0]<0?'avance a la izquierda':d[1]<0?'avance hacia el fondo':'avance hacia el portón';
  const passage=l=>l.d[0]?(l.from.y===693?'el pasillo inferior':'el pasillo superior'):({445:'el pasillo izquierdo',513:'el pasillo del bloque central',587:'el pasillo central',706:'el pasillo derecho'})[l.from.x]||'el pasillo';
  return segments.map((l,i)=>{const v=verb(l.d);let t=`${i?'Luego, ':'Desde el portón, '}${v} por ${passage(l)}`;if(i===segments.length-1){const cx=s.x+s.w/2-l.to.x,cy=s.y+s.h/2-l.to.y,side=(cx*l.d[1]-cy*l.d[0])>0?'izquierda':'derecha';t+=` hasta el anaquel D-${pad(s.n)}${b?`, balda ${b}`:''}; lo encontrará a su ${side}.`}return t});
}
function baseSvgDefs(){return `<defs><marker id="a360Arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#a4002b"/></marker><filter id="a360Shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".16"/></filter></defs>`}
function drawDunas(found=null){
  const svg=$('#archivePlan');if(!svg)return;
  let h=baseSvgDefs();
  h+=`<rect class="a360-room" x="407" y="250" width="346" height="478" rx="8"/><path class="a360-wall" d="M407 530H520V625"/>`;
  shelves.forEach(s=>{const active=found&&found.shelf.n===s.n;h+=`<g class="a360-shelf${active?' is-active':''}" data-shelf="${s.n}" tabindex="0" role="button" aria-label="Anaquel D-${pad(s.n)}, ${dunasLabel(s.from)} a ${dunasLabel(s.to)}"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="3"/><text x="${s.x+s.w/2}" y="${s.y+s.h/2+3}">${pad(s.n)}</text><title>Anaquel D-${pad(s.n)} · ${dunasLabel(s.from)} a ${dunasLabel(s.to)}</title></g>`});
  h+=`<polyline class="a360-flow" points="445,520 445,287 706,287 706,693 587,693 587,287 513,287 513,520"/>`;
  h+=`<text class="a360-map-label a360-flow-label" x="410" y="548">INICIO · 01-21T</text><text class="a360-map-label a360-flow-label" x="639" y="308" text-anchor="middle">FIN · 74-24T</text>`;
  h+=`<rect class="a360-door" x="419" y="725" width="111" height="6" rx="3"/><text class="a360-door-text" x="474" y="751" text-anchor="middle">PORTÓN / INGRESO</text><circle class="a360-you" cx="445" cy="693" r="6"/><text class="a360-map-label" x="456" y="711">Usted está aquí</text>`;
  if(found){const P=route(found.shelf);h+=`<polyline class="a360-route" pathLength="1" points="${P.map(p=>`${p.x},${p.y}`).join(' ')}"/><circle class="a360-destination" cx="${found.shelf.ax}" cy="${found.shelf.ay}" r="6"/>`}
  svg.innerHTML=h;svg.setAttribute('viewBox','395 235 370 530');applyFlowToggle();applyZoom();
}
function drawPending(repo){
  const svg=$('#archivePlan');if(!svg)return;
  svg.setAttribute('viewBox','0 0 760 500');
  svg.innerHTML=`${baseSvgDefs()}<rect class="a360-room" x="40" y="45" width="680" height="390" rx="24"/><g transform="translate(380 190)"><rect x="-132" y="-54" width="264" height="108" rx="18" fill="var(--a360-soft)" stroke="var(--a360-line)"/><path d="M-88 24V-22H-24V24M6 24V-22H70V24M100 24V-22H122V24" fill="none" stroke="var(--a360-brand)" stroke-width="10" stroke-linecap="round"/><text x="0" y="105" text-anchor="middle" class="a360-pending-title">${esc(repo)}</text><text x="0" y="132" text-anchor="middle" class="a360-pending-sub">Plano físico pendiente de parametrización</text></g>`;applyZoom();
}
function shelfInfoByNumber(n){const s=shelves.find(x=>x.n===Number(n));if(!s)return;const fake={repo:'Dunas',code:null,global:null,shelf:s,balda:null,range:`${dunasLabel(s.from)} a ${dunasLabel(s.to)}`};lastFound=fake;drawDunas(fake);renderDunasResult(fake,false)}
function renderDunasResult(found,withCode=true){
  const out=$('#archiveResult');if(!out)return;const P=route(found.shelf),steps=directions(found.shelf,found.balda,P);let rack='';for(let i=1;i<=8;i++)rack+=`<span class="a360-balda${found.balda===i?' is-active':''}"><b>${i}</b><small>Balda</small></span>`;
  out.innerHTML=`<article class="panel a360-result-card"><div class="a360-result-head"><div><span class="a360-status success">Ubicación encontrada</span><h3>${withCode?esc(found.code):`Anaquel D-${pad(found.shelf.n)}`}</h3><p>Repositorio Dunas · ${esc(found.shelf.section)}</p></div><div class="a360-rack-code">D-${pad(found.shelf.n)}</div></div><div class="a360-detail-grid">${withCode?`<div><span>Paquete</span><strong>${esc(found.code)}</strong></div>`:''}<div><span>Anaquel</span><strong>D-${pad(found.shelf.n)}</strong></div><div><span>Balda</span><strong>${found.balda||'—'}${found.balda?' de 8':''}</strong></div><div><span>Rango del anaquel</span><strong>${esc(found.range)}</strong></div></div><div class="a360-baldas">${rack}</div><div class="a360-route-box"><div class="a360-route-title"><span>Ruta desde el portón</span><small>Ruta más corta calculada</small></div><ol>${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></article>`;
}
function renderGenericResult(code,matches){
  const out=$('#archiveResult');if(!out)return;
  out.innerHTML=matches.map(r=>`<article class="panel a360-result-card"><div class="a360-result-head"><div><span class="a360-status success">Rango localizado</span><h3>${esc(code)}</h3><p>${esc(r.repo)}</p></div><div class="a360-rack-code">${esc(repos[r.repo]?.accent||'R')}</div></div><div class="a360-detail-grid"><div><span>Repositorio</span><strong>${esc(r.repo)}</strong></div><div><span>Rango</span><strong>${esc(r.prefix||'')}${esc(r.from)} – ${esc(r.prefix||'')}${esc(r.to)}</strong></div><div><span>Sector</span><strong>${esc(r.sector||'Por definir')}</strong></div><div><span>Estantería / anaquel</span><strong>${esc(r.shelf||'Por definir')}</strong></div><div><span>Nivel</span><strong>${esc(r.level||'Por definir')}</strong></div><div><span>Serie</span><strong>${esc(r.description||'Rango configurado')}</strong></div></div><div class="a360-note"><b>Ubicación lógica disponible.</b> Para mostrar una ruta física como la de Dunas se debe cargar el plano exacto y asociar este rango a una estantería.</div></article>`).join('');
}
function renderNotFound(code,message=''){const out=$('#archiveResult');if(out)out.innerHTML=`<article class="panel a360-result-card is-warning"><div class="a360-empty-icon">⌕</div><h3>No se encontró el paquete</h3><p>${message||`El código ${esc(code)} no coincide con la configuración actual de Archivo 360.`}</p><small>Revise el formato o registre el rango correspondiente.</small></article>`}
function selectRepo(repo,{keepResult=false}={}){
  if(!repos[repo])return;currentRepo=repo;currentZoom=1;
  $$('.a360-repo-tab').forEach(b=>b.classList.toggle('is-active',b.dataset.repo===repo));
  $$('.repo-card').forEach(b=>b.classList.toggle('is-active',b.dataset.repo===repo));
  const meta=repos[repo];
  const title=$('#archivePlanTitle'),sub=$('#archivePlanSub'),badge=$('#archivePlanBadge');if(title)title.textContent=`Repositorio ${repo}`;if(sub)sub.textContent=meta.subtitle;if(badge){badge.textContent=meta.status==='active'?'Plano interactivo':'Plano pendiente';badge.className=`badge ${meta.status==='active'?'badge-success':'badge-muted'}`}
  const examples=$('#archiveExamples');if(examples)examples.innerHTML=(meta.examples||[]).map(x=>`<button type="button" class="a360-example" data-code="${esc(x)}">${esc(x)}</button>`).join('');
  if(repo==='Dunas')drawDunas(lastFound?.repo==='Dunas'?lastFound:null);else drawPending(repo);
  if(!keepResult){const out=$('#archiveResult');if(out)out.innerHTML=`<article class="panel a360-welcome"><span class="a360-status neutral">${esc(meta.subtitle)}</span><h3>${repo==='Dunas'?'Busque un paquete para trazar su ruta':'Repositorio listo para búsqueda por rangos'}</h3><p>${repo==='Dunas'?'El plano permite identificar anaquel, balda y la ruta más corta desde el portón.':'La ubicación se determina con los rangos configurados. El plano físico se habilitará al registrar la distribución real.'}</p></article>`}
}
function search(code){
  code=String(code||'').trim();if(!code){renderNotFound('', 'Ingrese un código de paquete.');return null}
  const d=dunasFind(code);
  if(d&&!d.error){lastFound=d;selectRepo('Dunas',{keepResult:true});drawDunas(d);renderDunasResult(d,true);window.SIGAD?.log?.('Consulta Archivo 360',`${code} · Dunas · D-${pad(d.shelf.n)} · balda ${d.balda}`);scrollResult();return d}
  const m=genericMatches(code);
  if(m.length){lastFound={repo:m[0].repo,code,matches:m};selectRepo(m[0].repo,{keepResult:true});renderGenericResult(code,m);window.SIGAD?.log?.('Consulta Archivo 360',`${code} · ${m.map(x=>x.repo).join(', ')}`);scrollResult();return lastFound}
  renderNotFound(code,d?.error||'');window.SIGAD?.log?.('Consulta Archivo 360 sin resultado',code);scrollResult();return null;
}
function scrollResult(){if(matchMedia('(max-width: 900px)').matches)setTimeout(()=>$('#archiveResult')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
function applyFlowToggle(){const svg=$('#archivePlan'),cb=$('#showNumberFlow');if(svg&&cb)svg.classList.toggle('hide-flow',!cb.checked)}
function applyZoom(){const svg=$('#archivePlan');if(!svg)return;const z=Math.max(.75,Math.min(2,currentZoom));svg.style.transform=`scale(${z})`;svg.style.transformOrigin='center center';const label=$('#archiveZoomLabel');if(label)label.textContent=`${Math.round(z*100)}%`}
function zoom(delta){currentZoom=Math.max(.75,Math.min(2,currentZoom+delta));applyZoom()}
function resetZoom(){currentZoom=1;applyZoom()}
function fullscreen(){const el=$('#archivePlanCard');if(!el)return;if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.()}
function renderRepoCards(){
  const rr=ranges(),grid=$('#repoGrid');if(!grid)return;
  grid.innerHTML=Object.entries(repos).map(([repo,meta])=>{const count=rr.filter(x=>x.repo===repo).length;const metric=repo==='Dunas'?'44 anaqueles':`${count} rango${count===1?'':'s'}`;return `<button type="button" class="repo-card${repo===currentRepo?' is-active':''}" data-repo="${esc(repo)}"><div class="repo-card-top"><span class="repo-monogram">${esc(meta.accent)}</span><span class="a360-status ${meta.status==='active'?'success':'neutral'}">${meta.status==='active'?'Plano activo':'Por rangos'}</span></div><h3>${esc(repo)}</h3><strong class="repo-count">${repo==='Dunas'?'2,094':metric}</strong><p>${repo==='Dunas'?'paquetes · '+metric:meta.subtitle}</p></button>`}).join('');
}
function renderStats(){const stats=$('#archiveStats');if(!stats)return;stats.innerHTML=`<div><span>Repositorios</span><strong>4</strong></div><div><span>Plano interactivo</span><strong>1</strong></div><div><span>Anaqueles Dunas</span><strong>44</strong></div><div><span>Paquetes Dunas</span><strong>2,094</strong></div>`}
function render(){if(lastFound?.matches&&lastFound.code){const refreshed=genericMatches(lastFound.code);lastFound=refreshed.length?{repo:refreshed[0].repo,code:lastFound.code,matches:refreshed}:null;if(lastFound)currentRepo=lastFound.repo}renderRepoCards();renderStats();selectRepo(currentRepo,{keepResult:Boolean(lastFound)});if(lastFound?.repo==='Dunas'){drawDunas(lastFound);renderDunasResult(lastFound,Boolean(lastFound.code))}else if(lastFound?.matches)renderGenericResult(lastFound.code,lastFound.matches)}
function findPackageInfo(code){
  const d=dunasFind(code);if(d&&!d.error)return{found:true,repo:'Dunas',text:`Dunas, anaquel D-${pad(d.shelf.n)}, balda ${d.balda}, rango ${d.range}`};
  const m=genericMatches(code);if(m.length)return{found:true,repo:m[0].repo,text:m.map(x=>`${x.repo}${x.sector?`, sector ${x.sector}`:''}${x.shelf?`, estantería ${x.shelf}`:''}${x.level?`, nivel ${x.level}`:''}`).join('; ')};
  return{found:false,error:d?.error||''};
}
function bind(){
  if(initialized)return;initialized=true;
  $('#btnPackageSearch')?.addEventListener('click',()=>search($('#packageSearch')?.value));
  $('#packageSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search(e.currentTarget.value)}});
  $('#view-archivo360')?.addEventListener('click',e=>{
    const ex=e.target.closest('.a360-example');if(ex){const q=$('#packageSearch');if(q)q.value=ex.dataset.code;search(ex.dataset.code);return}
    const tab=e.target.closest('.a360-repo-tab,.repo-card');if(tab?.dataset.repo){selectRepo(tab.dataset.repo);return}
    const shelf=e.target.closest('.a360-shelf');if(shelf){shelfInfoByNumber(shelf.dataset.shelf);return}
  });
  $('#archivePlan')?.addEventListener('keydown',e=>{const s=e.target.closest('.a360-shelf');if(s&&(e.key==='Enter'||e.key===' ')){e.preventDefault();shelfInfoByNumber(s.dataset.shelf)}});
  $('#showNumberFlow')?.addEventListener('change',applyFlowToggle);
  $('#zoomIn')?.addEventListener('click',()=>zoom(.15));$('#zoomOut')?.addEventListener('click',()=>zoom(-.15));$('#zoomReset')?.addEventListener('click',resetZoom);$('#zoomFullscreen')?.addEventListener('click',fullscreen);
}
function init(){bind();render()}
window.SIGAD360={init,render,search,selectRepo,findPackageInfo,dunasFind};
})();
