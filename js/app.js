(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const APP_VERSION='1.0';
const K={offices:'sigad_offices_v2',audit:'sigad_audit_v2',ranges:'sigad_ranges_v2',transfers:'sigad_transfers_v2',eliminations:'sigad_eliminations_v2'};
const titles={'mi-cuenta':['Mi cuenta','Perfil personal y seguridad'], 'usuarios-admin':['Usuarios y permisos','Administración exclusiva de cuentas'],configuracion:['Configuración','Preferencias y respaldo local'],dashboard:['Dashboard','Sistema Integral de Gestión del Archivo Desconcentrado'],devoluciones:['Devolución de cargos','Generación y trazabilidad de oficios'],archivo360:['Archivo 360','Localización inteligente y ruta física de paquetes'],transferencias:['Transferencias','Transferencias documentales al Gobierno Regional'],eliminacion:['Eliminación documental','Registro estadístico de procesos y jornadas'],reportes:['Reportes','Consolidado operativo del Archivo Desconcentrado'],auditoria:['Auditoría','Trazabilidad transversal de operaciones'],asistente:['Asistente SIGAD','Consultas gratuitas sobre los datos registrados']};
const nativeTitles={"inventario": ["Inventario y censo", "Gestión documental · Registro institucional"], "consultar-inventario": ["Consultar inventarios", "Gestión documental · Registro institucional"], "reingresos": ["Registrar reingresos", "Gestión documental · Registro institucional"], "consultar-reingresos": ["Consultar reingresos", "Gestión documental · Registro institucional"], "traslados": ["Registrar traslados", "Gestión documental · Registro institucional"], "consultar-traslados": ["Consultar traslados", "Gestión documental · Registro institucional"], "tarjetas": ["Generar tarjetas", "Gestión documental · Registro institucional"], "consultar-tarjetas": ["Consultar tarjetas", "Gestión documental · Registro institucional"], "microformas": ["Control de microformas", "Gestión documental · Registro institucional"]};Object.assign(titles,nativeTitles);
const obsTypes=['FALTA RESOLUCIÓN DE ARCHIVO','NO ESTÁ EN LISTADO','EXPEDIENTE DUPLICADO','RESOLUCIÓN NO CORRESPONDE','FALTA TOMO','FOLIATURA / TOMOS','OTRO'];
let currentOfficeId=null;
// Until the local-only SIGAD modules are migrated, keep their trial data per authenticated UID.
// Never expose the former user's browser-local records in another account.
// Los datos operativos se cargan exclusivamente desde la base compartida.
const read=(k,f=[])=>window.SIGADCloud?.read(k,f)??f;
const write=async(k,v)=>{
 if(!window.SIGADCloud?.ready())throw new Error('Los registros compartidos no están listos. Compruebe su conexión.');
 await window.SIGADCloud.write(k,v);
 return true;
};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const n=v=>Number(v)||0;
const fmt=v=>n(v).toLocaleString('es-PE');
const fmt2=v=>n(v).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate=v=>{if(!v)return'';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`};
const longDate=v=>{if(!v)return'';return new Date(v+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'})};
const log=async(action,detail='')=>{
 try{await window.SIGADCloud.audit({id:uid(),at:new Date().toISOString(),action,detail});}
 catch(err){console.warn('No se pudo registrar la auditoría:',err);toast('El evento de auditoría no se pudo guardar.','warning');}
};
const download=(name,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)};
const csvCell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
function toast(message,type='default',ms=3200){const host=$('#toastRegion');if(!host)return;const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<span>${type==='success'?'✓':type==='error'?'!':type==='warning'?'⚠':'•'}</span><div>${esc(message)}</div>`;host.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(6px)';setTimeout(()=>el.remove(),180)},ms)}
function setSidebar(open){$('#sidebar').classList.toggle('open',open);$('#sidebarBackdrop')?.classList.toggle('show',open);document.body.classList.toggle('nav-open',open);$('#menuBtn').setAttribute('aria-expanded',String(open))}
function navigate(view){if(view==='asistente'){window.SIGADUI?.openAssistant();setSidebar(false);return;}$$('.view').forEach(x=>x.classList.remove('active'));$('#view-'+view)?.classList.add('active');$$('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));const group=$(`.nav-item[data-view="${view}"]`)?.closest('.nav-group');if(group)group.open=true;$('#pageTitle').textContent=titles[view]?.[0]||'SIGAD';$('#pageSub').textContent=titles[view]?.[1]||'';setSidebar(false);if(nativeTitles[view]) window.dispatchEvent(new CustomEvent('sigad:modulo',{detail:view}));if(view==='usuarios-admin')window.dispatchEvent(new Event('sigad:abrir-admin'));if(view==='dashboard')renderDashboard();if(view==='archivo360')renderArchivo360();if(view==='transferencias')renderTransfers();if(view==='eliminacion')renderEliminations();if(view==='reportes')renderReports();if(view==='auditoria')renderAudit();window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-item[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$$('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go));$('#menuBtn').onclick=()=>setSidebar(!$('#sidebar').classList.contains('open'));$('#sidebarBackdrop')?.addEventListener('click',()=>setSidebar(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'){setSidebar(false);$$('.modal.open').forEach(closeModal)}});
function openModal(id){$('#'+id).classList.add('open');$('#'+id).setAttribute('aria-hidden','false')}
function closeModal(el){const m=typeof el==='string'?$('#'+el):el.closest('.modal');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
$$('.modal-close').forEach(b=>b.onclick=()=>closeModal(b));$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m)}));
function total(r,k){return (r.dependencies||[]).reduce((s,x)=>s+n(x[k]),0)}
function detectObsType(t){const s=String(t||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(s.includes('DUPLIC'))return'EXPEDIENTE DUPLICADO';if(s.includes('NO ESTA EN LISTADO')||s.includes('NO SE ENCUENTRA EN LISTADO'))return'NO ESTÁ EN LISTADO';if(s.includes('RESOLUCION NO CORRESPONDE')||s.includes('RESOLUCION NO PERTENECE'))return'RESOLUCIÓN NO CORRESPONDE';if(s.includes('FALTA RESOLUCION'))return'FALTA RESOLUCIÓN DE ARCHIVO';if(s.includes('FALTA TOMO')||s.includes('FALTAN TOMO'))return'FALTA TOMO';if(s.includes('FOLIATURA')||s.includes('TOMO'))return'FOLIATURA / TOMOS';return'OTRO'}
function depRow(v={}){const tr=document.createElement('tr');tr.innerHTML=`<td class="idx"></td><td><input class="dep-name" list="sigad-lista-dependencias" value="${esc(v.name||'')}"></td><td><input class="dep-packages" type="number" min="0" value="${n(v.packages)||''}"></td><td><input class="dep-files" type="number" min="0" value="${n(v.files)||''}"></td><td><button type="button" class="row-delete">×</button></td>`;tr.oninput=()=>{calc();if($$('#dependencyRows tr').length>1)sincronizarPaquetesDelRango()};tr.querySelector('.row-delete').onclick=()=>{tr.remove();reindex();sincronizarPaquetesDelRango()};return tr}
function obsRow(v={}){const tr=document.createElement('tr');tr.innerHTML=`<td class="idx"></td><td><input class="obs-dep" list="sigad-lista-dependencias" value="${esc(v.dep||'')}"></td><td><input class="obs-file" value="${esc(v.file||'')}"></td><td><input class="obs-folios" type="number" min="0" value="${n(v.folios)||''}"></td><td><select class="obs-type">${obsTypes.map(x=>`<option ${x===(v.type||'OTRO')?'selected':''}>${x}</option>`).join('')}</select></td><td><textarea class="obs-text" rows="2">${esc(v.text||'')}</textarea></td><td><button type="button" class="row-delete">×</button></td>`;tr.querySelector('.row-delete').onclick=()=>{tr.remove();reindex();calc()};tr.querySelector('.obs-text').addEventListener('change',e=>{const t=detectObsType(e.target.value);if(t!=='OTRO')tr.querySelector('.obs-type').value=t});tr.oninput=calc;return tr}
function packObsRow(v={}){const tr=document.createElement('tr');tr.innerHTML=`<td class="idx"></td><td><input class="pobs-dep" list="sigad-lista-dependencias" value="${esc(v.dep||'')}"></td><td><input class="pobs-code" value="${esc(v.code||'')}"></td><td><input class="pobs-folios" type="number" min="0" value="${n(v.folios)||''}"></td><td><textarea class="pobs-text" rows="2">${esc(v.text||'')}</textarea></td><td><button type="button" class="row-delete">×</button></td>`;tr.querySelector('.row-delete').onclick=()=>{tr.remove();reindex();calc()};tr.oninput=calc;return tr}
function reindex(){$$('#dependencyRows tr').forEach((r,i)=>r.querySelector('.idx').textContent=i+1);$$('#observationRows tr').forEach((r,i)=>r.querySelector('.idx').textContent=i+1);$$('#packageObservationRows tr').forEach((r,i)=>r.querySelector('.idx').textContent=i+1)}
function calc(){let p=0,f=0;$$('#dependencyRows tr').forEach(r=>{p+=n($('.dep-packages',r).value);f+=n($('.dep-files',r).value)});$('#totalPackages').textContent=fmt(p);$('#totalFiles').textContent=fmt(f);$('#sumPackages').textContent=fmt(p);$('#sumFiles').textContent=fmt(f);$('#sumObs').textContent=$$('#observationRows tr').length;$('#sumPackObs').textContent=$$('#packageObservationRows tr').length}

// Nomenclatura institucional para paquetes de eliminación: 652-26 ELIM a 660-26 ELIM.
// Mantiene intactas otras series, incluidos E26-85 y rangos normales 26-823.
function normalizarCodigoEliminacion(codigo){
 const original=String(codigo??'').trim();
 const m=original.toUpperCase().match(/^(\d{3,})\s*-\s*(\d{2})\s*(?:ELIM)?$/);
 return m?`${m[1]}-${m[2]} ELIM`:original;
}
// Serie de paquetes consecutivos: primer y último código incluidos.
function calcularPaquetesEntreCodigos(inicio,fin,modalidad='regular'){
 const a=String(inicio||'').trim().toUpperCase().replace(/\s+/g,''),b=String(fin||'').trim().toUpperCase().replace(/\s+/g,'');
 if(!a||!b)return {cantidad:null,error:''};
 let ini,ult;
 if(modalidad==='eliminacion'){
  // El sufijo ELIM forma parte del código. Elimina solo espacios para analizarlo,
  // pero el valor guardado/exportado conserva " ELIM".
  const clasificar=x=>{
   let m=x.match(/^E(\d{2,4})-(\d+)$/);
   if(m)return {tipo:'E',serie:m[1],numero:Number(m[2]),sufijo:''};
   m=x.match(/^(\d+)-(\d{2,4})(ELIM)?$/);
   if(!m)return null;
   const izquierda=Number(m[1]),derecha=Number(m[2]),sufijo=m[3]||'';
   if(sufijo && !(m[1].length>=3 && m[2].length===2))return null;
   if(izquierda>99 && derecha<=99)return {tipo:'invertida',serie:m[2],numero:izquierda,sufijo};
   if(izquierda<=99 && derecha>99)return {tipo:'normal',serie:m[1],numero:derecha,sufijo};
   if(m[1].length>=3 && m[2].length<=2)return {tipo:'invertida',serie:m[2],numero:izquierda,sufijo};
   return {tipo:'normal',serie:m[1],numero:derecha,sufijo};
  };
  ini=clasificar(a);ult=clasificar(b);
  if(!ini||!ult)return {cantidad:null,error:'En eliminación use 652-26 ELIM a 660-26 ELIM (o la serie específica de su remito).'};
  if(ini.tipo!==ult.tipo||ini.serie!==ult.serie||ini.sufijo!==ult.sufijo)return {cantidad:null,error:'Ambos paquetes deben tener la misma serie, año y sufijo ELIM.'};
 }else{
  const patron=/^(.*?)(\d+)([A-Z]*)$/;
  const ai=a.match(patron),bi=b.match(patron);
  if(!ai||!bi)return {cantidad:null,error:'Ingrese códigos válidos, por ejemplo 26-853 y 26-875.'};
  if(ai[1]!==bi[1]||ai[3]!==bi[3])return {cantidad:null,error:'El paquete inicial y final deben pertenecer a la misma serie y año.'};
  ini={numero:Number(ai[2])};ult={numero:Number(bi[2])};
 }
 if(!Number.isSafeInteger(ini.numero)||!Number.isSafeInteger(ult.numero))return {cantidad:null,error:'La numeración del paquete está fuera del rango admitido.'};
 if(ult.numero<ini.numero)return {cantidad:null,error:'El paquete final debe ser igual o posterior al inicial.'};
 return {cantidad:ult.numero-ini.numero+1,error:''};
}

// Selector de modalidad sin alterar index.html ni los documentos ya registrados.
const modalidadOficioLabel=document.createElement('label');
modalidadOficioLabel.innerHTML='Modalidad del oficio<select id="officeModality"><option value="regular">Devolución de cargos</option><option value="eliminacion">Devolución de cargos por eliminación</option></select><small style="display:block;color:var(--muted,#64748b);font-weight:400;margin-top:4px">Eliminación: 652-26 ELIM a 660-26 ELIM (u otra serie según el remito). El número de oficio continúa el mismo correlativo anual que las devoluciones de cargos.</small>';
const datosOficio=$('#officeNumber')?.closest('.form-grid');
if(datosOficio)datosOficio.insertBefore(modalidadOficioLabel,datosOficio.firstElementChild);
function modalidadOficio(){return $('#officeModality')?.value||'regular'}
function prepararModalidadOficio({numero=true}={}){
 const elimina=modalidadOficio()==='eliminacion';
 const inicial=$('#rangeStart'),final=$('#rangeEnd');
 if(inicial)inicial.placeholder=elimina?'652-26 ELIM':'26-202';
 if(final)final.placeholder=elimina?'660-26 ELIM':'26-284';
 if(elimina){
  if(inicial?.value)inicial.value=normalizarCodigoEliminacion(inicial.value);
  if(final?.value)final.value=normalizarCodigoEliminacion(final.value);
 }
 // Las modalidades de devolución y eliminación comparten UNA única secuencia.
 // Mantenga los números de los oficios abiertos y las correcciones manuales.
 if(numero&&!currentOfficeId&&$('#officeNumber')?.dataset.autoOfficeNumber!=='no')suggestNumber();
 sincronizarPaquetesDelRango();
}
$('#officeModality')?.addEventListener('change',()=>prepararModalidadOficio());
$('#officeDate')?.addEventListener('change',()=>{if(!currentOfficeId&&$('#officeNumber')?.dataset.autoOfficeNumber==='si')suggestNumber();if(referenciaCampo?.dataset.sigadAutoRef==='si'&&selectorModeloReferencia.value)referenciaCampo.value=referenciaConNumero(selectorModeloReferencia.value);});
// Si el usuario modifica el correlativo, no se lo sobrescribe al cambiar modalidad.
$('#officeNumber')?.addEventListener('input',()=>{$('#officeNumber').dataset.autoOfficeNumber='no'});

// Catálogo inicial de ejemplo más destinatarios, cargos y dependencias
// recuperados de los oficios ya guardados. Los listados de Word se incorporan
// después de verificar el documento original; no se inventan personas.
const catalogoBaseDestinatarios=[
 {
  "nombre": "JORGE LUIS YOUNG OLORTIGA",
  "cargo": "ADMINISTRADOR DEL MÓDULO DE FAMILIA – CSJSA",
  "referencias": [],
  "dependencias": [],
  "dependenciasObs": []
 },
 {
  "nombre": "CRISTHIAN EDUARDO INCISO RODRIGUEZ",
  "cargo": "ADMINISTRADOR DEL MODULO CORPORATIVO CIVIL – CSJSA",
  "referencias": [
   "OFICIO N° 0000-2026-MCC-GAD-CSJSA-PJ-PJ.",
   "OFICIO N° 0000-2026-CSJSA-PJ."
  ],
  "dependencias": [
   "CUARTO JUZGADO CIVIL",
   "PRIMER JUZGADO CIVIL",
   "PRIMER JUZGADO DE PAZ LETRADO CIVIL",
   "QUINTO JUZGADO CIVIL",
   "SEGUNDA SALA CIVIL",
   "SEGUNDO JUZGADO CIVIL",
   "SEGUNDO JUZGADO DE PAZ LETRADO CIVIL",
   "TERCER JUZGADO CIVIL"
  ],
  "dependenciasObs": [
   "1º JUZGADO DE PAZ LETRADO CIVIL",
   "2º JUZGADO DE PAZ LETRADO CIVIL",
   "4TO JUZGADO CIVIL",
   "5TO JUZGADO CIVIL"
  ]
 },
 {
  "nombre": "LUIS MARIANO CHAVEZ CERVERA",
  "cargo": "ADMINISTRADOR DEL MÓDULO CORPORATIVO LABORAL",
  "referencias": [
   "OFICIO N° 0000-2026-1ºJEL-CSJSANTA.",
   "OFICIO N° 0000-2026-1ºJPLL-CSJSANTA.",
   "OFICIO N° 0000-2026-2ºJPLL-CSJSANTA.",
   "OFICIO N° 0000-2026-3ºJPLL-CSJSANTA.",
   "OFICIO N° 0000-2026-8ºJEL-CSJSANTA.",
   "OFICIO N° 0000-2026-2ºJEL-CSJSANTA.",
   "OFICIO N° 0000-2026-3ºJEL-CSJSANTA.",
   "OFICIO N° 0000-2026-5ºJEL-CSJSANTA.",
   "OFICIO N° 0000-2026-9NO-JEL-NLPT/PJ.",
   "OFICIO N° 0000-2026-3ºJPLL-CSJSANTA"
  ],
  "dependencias": [
   "1ER JUZGADO DE PAZ LETRADO - NLPT",
   "1ER JUZGADO LABORAL - NLPT",
   "2DO JUZGADO DE PAZ LETRADO - NLPT",
   "2DO JUZGADO LABORAL - NLPT",
   "3ER JUZGADO DE PAZ LETRADO - NLPT",
   "3ER JUZGADO LABORAL - NLPT",
   "3RO JUZGADO LABORAL - NLPT",
   "5TO JUZGADO LABORAL - NLPT",
   "6TO JUZGADO LABORAL - NLPT",
   "8VO JUZGADO LABORAL - NLPT",
   "9NO JUZGADO LABORAL - NLPT"
  ],
  "dependenciasObs": []
 },
 {
  "nombre": "JIMMY MICHAEL CERON SALDAÑA",
  "cargo": "ADMINISTRADOR DEL MÓDULO CONTENCIOSO ADMINISTRATIVO LABORAL Y PREVISIONAL",
  "referencias": [
   "OFICIO N° 0000-2026-MCCALP-CSJSA-PJ-PJ."
  ],
  "dependencias": [
   "CUARTO JUZGADO CONTENCIOSO ADMINISTRATIVO",
   "SÉPTIMO JUZGADO CONTENCIOSO ADMINISTRATIVO"
  ],
  "dependenciasObs": [
   "4º JUZGADO CONTENCIOSO ADM",
   "4º JUZGADO CONTENCIOSO ADM.",
   "JUZGADO CONSTITUCIONAL"
  ]
 },
 {
  "nombre": "EVERT QUESQUÉN VÁSQUEZ",
  "cargo": "ADMINISTRADOR DEL MODULO DE FLAGRANCIA – CSJSA",
  "referencias": [
   "OFICIO N° 0000-2026-0-3ºJIP-CSJSA-PJ/JLPS.",
   "OFICIO N° 0000-2026-NCPP-CSJS-PJ.",
   "OFICIO N° 0000-2026-0-1ºJIPTFLA-CSJS/PJ.",
   "OFICIO N° 0000-2026-0-3ºJIPF-CSJSA-PJ/JLPS."
  ],
  "dependencias": [
   "PRIMER JUZGADO DE INVESTIGACIÓN PREPARATORIA DE FLAGRANCIA",
   "SEGUNDO JUZGADO DE INVESTIGACIÓN PREPARATORIA DE FLAGRANCIA",
   "TERCER JUZGADO DE INVESTIGACIÓN PREPARATORIA DE FLAGRANCIA"
  ],
  "dependenciasObs": []
 }
];
// El catálogo editable se almacena en un documento separado de Firestore.
// Ninguna edición de contactos altera los oficios históricos (que guardan sus propios datos).
const UID_ADMIN_CATALOGO='MmniSKpNWPN2saVja2wVTPaiBnn2';
const RUTA_CATALOGO_CLOUD=['sigad_configuracion','catalogo_oficios'];
let catalogoOficiosDB=null, catalogoCloudReady=false, catalogoCloudError='';
let catalogoCloudApi=null, catalogoCloudIniciando=null, catalogoEsAdmin=false;
const claveCatalogo=s=>String(s||'').trim().toLocaleUpperCase('es-PE').replace(/\s+/g,' ');
const lineasCatalogo=s=>[...new Set(String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean))];
const nombreIdCatalogo=()=>uid();
function baseCatalogoEditable(){
 const dependencias=[...new Set(catalogoBaseDestinatarios.flatMap(p=>[...(p.dependencias||[]),...(p.dependenciasObs||[])]))].map(nombre=>({id:nombreIdCatalogo(),nombre,activo:true}));
 return {personas:catalogoBaseDestinatarios.map(p=>({...p,id:nombreIdCatalogo(),activo:true,referencias:[...(p.referencias||[])],dependencias:[...(p.dependencias||[])],dependenciasObs:[...(p.dependenciasObs||[])]})),dependencias};
}
function datosCatalogoOficios(){
 const fuente=catalogoOficiosDB;
 const personas=(fuente?.personas||catalogoBaseDestinatarios).filter(x=>x.activo!==false).map(x=>({...x,nombre:String(x.nombre||'').trim(),cargo:String(x.cargo||'').trim()})).filter(x=>x.nombre);
 const depsFuente=fuente ? (fuente.dependencias||[]).filter(x=>x.activo!==false).map(x=>String(x.nombre||'').trim()) : catalogoBaseDestinatarios.flatMap(p=>[...(p.dependencias||[]),...(p.dependenciasObs||[])]);
 const dependencias=[...new Set(depsFuente.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const cargos=[...new Set(personas.map(x=>x.cargo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 return {personas:personas.sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')),dependencias,cargos};
}
const catalogoDestinatariosSelect=document.createElement('select');
catalogoDestinatariosSelect.id='sigad-seleccionar-destinatario';
catalogoDestinatariosSelect.setAttribute('aria-label','Seleccionar destinatario existente');
catalogoDestinatariosSelect.style.cssText='margin-bottom:5px;width:100%';
const destinatarioInput=$('#recipient');
if(destinatarioInput)destinatarioInput.insertAdjacentElement('beforebegin',catalogoDestinatariosSelect);
const catalogoDependenciasList=document.createElement('datalist');
catalogoDependenciasList.id='sigad-lista-dependencias';
document.body.appendChild(catalogoDependenciasList);
const catalogoCargosList=document.createElement('datalist');
catalogoCargosList.id='sigad-lista-cargos';
document.body.appendChild(catalogoCargosList);
const cargoInput=$('#recipientRole');
if(cargoInput)cargoInput.setAttribute('list','sigad-lista-cargos');
// El Word ofrece varios modelos para algunos módulos; cada referencia sigue siendo editable.
const selectorModeloReferencia=document.createElement('select');
selectorModeloReferencia.id='sigad-modelo-referencia';
selectorModeloReferencia.setAttribute('aria-label','Modelo de oficio de referencia');
selectorModeloReferencia.style.cssText='width:100%;margin:4px 0';
selectorModeloReferencia.innerHTML='<option value="">Referencia libre / no sugerir</option>';
const inputCorrelativoReferencia=document.createElement('input');
inputCorrelativoReferencia.id='sigad-correlativo-referencia';
inputCorrelativoReferencia.type='text';
inputCorrelativoReferencia.inputMode='numeric';
inputCorrelativoReferencia.maxLength=8;
inputCorrelativoReferencia.placeholder='0000';
inputCorrelativoReferencia.value='0000';
inputCorrelativoReferencia.style.cssText='width:110px;max-width:35%;margin:4px 0';
inputCorrelativoReferencia.title='Escriba solamente el correlativo. La nomenclatura completa del oficio se conserva.';
const referenciaCampo=$('#references');
if(referenciaCampo){
 const bloque=document.createElement('div');
 bloque.id='sigad-referencia-asistida';
 bloque.style.cssText='margin:6px 0 7px;font-size:12px';
 bloque.innerHTML='<div style="font-size:12px;color:var(--muted,#718096);margin-bottom:3px">Modelo de referencia (extraído de oficios 2026):</div>';
 bloque.appendChild(selectorModeloReferencia);
 const correlativo=document.createElement('label');
 correlativo.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:400';
 const texto=document.createElement('span');texto.textContent='Solo correlativo:';
 correlativo.append(texto,inputCorrelativoReferencia);bloque.appendChild(correlativo);
 (referenciaCampo.closest('label')||referenciaCampo).insertAdjacentElement('beforebegin',bloque);
}
function normalizarNombreDestinatario(t){return String(t||'').toLocaleUpperCase('es-PE').trim().replace(/^DR\.?\s*/,'').replace(/\s+/g,' ')}
function buscarPersonaCatalogo(nombre){
 const norm=normalizarNombreDestinatario(nombre);
 return datosCatalogoOficios().personas.find(x=>normalizarNombreDestinatario(x.nombre)===norm)||null;
}
function actualizarDependenciasSegunPersona(persona){
 const vigentes=datosCatalogoOficios().dependencias;
 const vigentesSet=new Set(vigentes.map(claveCatalogo));
 const solo=(persona?.dependencias||[]).filter(x=>!catalogoOficiosDB||vigentesSet.has(claveCatalogo(x)));
 const adicionales=(persona?.dependenciasObs||[]).filter(x=>!catalogoOficiosDB||vigentesSet.has(claveCatalogo(x)));
 const total=solo.length?[...new Set([...solo,...adicionales])]:vigentes;
 catalogoDependenciasList.innerHTML=total.map(x=>`<option value="${esc(x)}"></option>`).join('');
}
function referenciaConNumero(modelo){
 const digits=String(inputCorrelativoReferencia.value||'').replace(/[^0-9]/g,'').slice(0,8)||'0000';
 const year=String($('#officeDate')?.value||today()).slice(0,4);
 return String(modelo||'').replace(/(OFICIO\s+N[°º]\s*)0000/i,(_,p)=>p+digits.padStart(4,'0')).replace(/-2026(?=-)/g,'-'+year);
}
function actualizarModelosReferencia(persona,{modificar=false}={}){
 const modelos=persona?.referencias||[];
 const prev=selectorModeloReferencia.value;
 selectorModeloReferencia.innerHTML='<option value="">Referencia libre / no sugerir</option>'+modelos.map((r,i)=>`<option value="${esc(r)}">${i===0?'Habitual · ':''}${esc(r)}</option>`).join('');
 selectorModeloReferencia.value=modelos.includes(prev)?prev:(modelos[0]||'');
 actualizarDependenciasSegunPersona(persona);
 inputCorrelativoReferencia.disabled=!modelos.length;
 if(modificar && !modelos.length && referenciaCampo?.dataset.sigadAutoRef==='si'){referenciaCampo.value='';delete referenciaCampo.dataset.sigadAutoRef;}
 if(modificar && modelos.length && referenciaCampo && (!referenciaCampo.value.trim()||referenciaCampo.dataset.sigadAutoRef==='si')){
   referenciaCampo.value=referenciaConNumero(selectorModeloReferencia.value);
   referenciaCampo.dataset.sigadAutoRef='si';
 }
}
selectorModeloReferencia.addEventListener('change',()=>{
 if(!selectorModeloReferencia.value)return;
 if(referenciaCampo){referenciaCampo.value=referenciaConNumero(selectorModeloReferencia.value);referenciaCampo.dataset.sigadAutoRef='si';}
});
inputCorrelativoReferencia.addEventListener('input',()=>{
 if(selectorModeloReferencia.value && referenciaCampo){
   referenciaCampo.value=referenciaConNumero(selectorModeloReferencia.value);
   referenciaCampo.dataset.sigadAutoRef='si';
 }
});
referenciaCampo?.addEventListener('input',()=>{referenciaCampo.dataset.sigadAutoRef='no'});

function actualizarCatalogoOficios(){
 const datos=datosCatalogoOficios();
 const previo=catalogoDestinatariosSelect.value;
 catalogoDestinatariosSelect.innerHTML='<option value="">Elegir destinatario registrado (o escribir abajo)...</option>'+
  datos.personas.map(x=>`<option value="${esc(x.nombre)}">${esc(x.nombre)}</option>`).join('');
 if(datos.personas.some(x=>x.nombre===previo))catalogoDestinatariosSelect.value=previo;
 actualizarDependenciasSegunPersona(buscarPersonaCatalogo(destinatarioInput?.value));
 catalogoCargosList.innerHTML=datos.cargos.map(x=>`<option value="${esc(x)}"></option>`).join('');
}
function ponerDestinatarioRegistrado(nombre){
 const persona=buscarPersonaCatalogo(nombre);
 if(!persona)return;
 destinatarioInput.value=persona.nombre;
 if(persona.cargo)cargoInput.value=persona.cargo;
 actualizarModelosReferencia(persona,{modificar:!currentOfficeId});
}
catalogoDestinatariosSelect.addEventListener('change',()=>ponerDestinatarioRegistrado(catalogoDestinatariosSelect.value));
destinatarioInput?.addEventListener('change',()=>ponerDestinatarioRegistrado(destinatarioInput.value));
actualizarCatalogoOficios();
window.addEventListener('sigad:datos-cargados',actualizarCatalogoOficios);

// Administración centralizada del catálogo: visible solo para el UID de Administrador General.
const btnAdministrarCatalogo=document.createElement('button');
btnAdministrarCatalogo.type='button';
btnAdministrarCatalogo.id='sigad-btn-administrar-catalogo';
btnAdministrarCatalogo.textContent='Administrar catálogo de destinatarios y dependencias';
btnAdministrarCatalogo.style.cssText='display:none;margin:7px 0 12px;padding:9px 12px;border-radius:7px;border:1px solid var(--line,#a1a1aa);background:var(--panel,#fff);color:var(--ink,#111827);font-weight:700;cursor:pointer;max-width:100%';
if(destinatarioInput)catalogoDestinatariosSelect.insertAdjacentElement('afterend',btnAdministrarCatalogo);
const estilosAdminCatalogo=document.createElement('style');
estilosAdminCatalogo.textContent=`
#sigad-dialog-catalogo{background:var(--panel,#fff);color:var(--ink,#111827);border:1px solid var(--line,#a1a1aa);border-radius:14px;padding:0;width:min(900px,96vw);max-height:88vh;box-shadow:0 16px 75px #0007}
#sigad-dialog-catalogo::backdrop{background:#07101cca}
#sigad-dialog-catalogo .sac-contenido{padding:19px 22px;max-height:84vh;overflow-y:auto}
#sigad-dialog-catalogo .sac-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
#sigad-dialog-catalogo h2{margin:0;font-size:19px}
#sigad-dialog-catalogo h3{font-size:15px;margin:0 0 12px}
#sigad-dialog-catalogo .sac-tab{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}
#sigad-dialog-catalogo .sac-tab button{min-width:130px}
#sigad-dialog-catalogo .sac-grid{display:grid;grid-template-columns:36% minmax(0,1fr);gap:14px;align-items:start}
#sigad-dialog-catalogo .sac-grid select[size]{height:270px;width:100%;box-sizing:border-box}
#sigad-dialog-catalogo label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:650;margin-bottom:11px}
#sigad-dialog-catalogo input:not([type=checkbox]),#sigad-dialog-catalogo textarea,#sigad-dialog-catalogo select{background:var(--panel,#fff);color:var(--ink,#111827);border:1px solid var(--line,#a1a1aa);border-radius:6px;padding:9px;font:inherit}
#sigad-dialog-catalogo textarea{width:100%;min-height:60px;box-sizing:border-box;resize:vertical}
#sigad-dialog-catalogo .sac-fila{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
#sigad-dialog-catalogo .sac-fila button,#sigad-dialog-catalogo .sac-tab button,#sigad-dialog-catalogo .sac-top button{padding:9px 12px;border:1px solid var(--line,#a1a1aa);border-radius:7px;background:var(--panel,#fff);color:var(--ink,#111827);cursor:pointer;font-weight:700}
#sigad-dialog-catalogo button.sac-primario{background:#85051c!important;color:#fff!important;border-color:#85051c!important}
#sigad-dialog-catalogo .sac-aviso{font-size:12px;color:var(--muted,#64748b);line-height:1.5}
#sigad-btn-administrar-catalogo{color:#182234!important;background:#fff!important;border-color:#8693a4!important}
body.dark-theme #sigad-btn-administrar-catalogo,body[data-theme="dark"] #sigad-btn-administrar-catalogo{background:#24334c!important;color:#fff!important;border-color:#8693a4!important}
body.dark-theme #sigad-dialog-catalogo .sac-fila button:not(.sac-primario),body.dark-theme #sigad-dialog-catalogo .sac-tab button:not(.sac-primario),body.dark-theme #sigad-dialog-catalogo .sac-top button,body[data-theme="dark"] #sigad-dialog-catalogo .sac-fila button:not(.sac-primario){background:#24334c!important;color:#fff!important;border-color:#8693a4!important}
#sigad-dialog-catalogo #sac-estado{color:var(--ink,#111827);font-size:12px;min-height:16px;margin:6px 0}
@media(max-width:600px){#sigad-dialog-catalogo .sac-grid{grid-template-columns:1fr}#sigad-dialog-catalogo .sac-grid select[size]{height:130px}}
`;
document.head.appendChild(estilosAdminCatalogo);
const dialogCatalogo=document.createElement('dialog');
dialogCatalogo.id='sigad-dialog-catalogo';
dialogCatalogo.innerHTML=`<div class="sac-contenido">
 <div class="sac-top"><h2>Catálogo institucional de oficios</h2><button type="button" id="sac-cerrar" aria-label="Cerrar">Cerrar ×</button></div>
 <p class="sac-aviso">Los cambios se guardan en Firebase y afectan las sugerencias de los próximos oficios. No cambian los documentos emitidos.</p>
 <div id="sac-estado" role="status" aria-live="polite"></div>
 <div class="sac-tab"><button type="button" class="sac-primario" id="sac-ver-personas">Destinatarios y cargos</button><button type="button" id="sac-ver-dependencias">Dependencias / juzgados</button></div>
 <section id="sac-panel-personas"><div class="sac-grid">
  <div><h3>Destinatarios</h3><select size="11" id="sac-personas" aria-label="Lista de destinatarios"></select><div class="sac-fila"><button type="button" id="sac-nueva-persona">+ Nuevo destinatario</button></div></div>
  <form id="sac-persona-form"><h3 id="sac-persona-titulo">Editar destinatario</h3>
   <label>Nombres y apellidos<input id="sac-nombre" required maxlength="160" autocomplete="off"></label>
   <label>Cargo institucional<input id="sac-cargo" required maxlength="230" autocomplete="off"></label>
   <label>Modelos de referencia (uno por línea)<textarea id="sac-referencias" rows="3" placeholder="OFICIO N° 0000-2026-..."></textarea></label>
   <label>Dependencias principales (una por línea)<textarea id="sac-deps-persona" rows="3"></textarea></label>
   <label>Dependencias para observaciones (una por línea)<textarea id="sac-depsobs-persona" rows="2"></textarea></label>
   <div class="sac-fila"><button class="sac-primario" type="submit" id="sac-guardar-persona">Guardar destinatario</button><button type="button" id="sac-desactivar-persona">Desactivar</button></div>
  </form>
 </div></section>
 <section id="sac-panel-dependencias" hidden><div class="sac-grid">
  <div><h3>Dependencias y juzgados</h3><select size="11" id="sac-dependencias" aria-label="Lista de dependencias"></select><div class="sac-fila"><button type="button" id="sac-nueva-dependencia">+ Nueva dependencia</button></div></div>
  <form id="sac-dependencia-form"><h3 id="sac-dependencia-titulo">Editar dependencia</h3>
   <label>Nombre oficial de la dependencia<input id="sac-nombre-dep" required maxlength="220" autocomplete="off"></label>
   <div class="sac-fila"><button class="sac-primario" type="submit" id="sac-guardar-dependencia">Guardar dependencia</button><button type="button" id="sac-desactivar-dependencia">Desactivar</button></div>
  </form>
 </div></section>
 <p class="sac-aviso">Desactivar oculta una opción de los nuevos oficios; no elimina registros históricos. El formulario del oficio continúa permitiendo escribir nombres libres.</p>
 </div>`;
document.body.appendChild(dialogCatalogo);
const sac=id=>document.getElementById('sac-'+id);
let idPersonaEnEdicion=null,idDependenciaEnEdicion=null,guardandoCatalogo=false;
function estadoPanelCatalogo(mensaje,error=false){sac('estado').textContent=mensaje||'';sac('estado').style.color=error?'#e05462':'';}
const catalogoInicialInmutable=baseCatalogoEditable();
function catalogoEditableActual(){return JSON.parse(JSON.stringify(catalogoOficiosDB||catalogoInicialInmutable));}
function renderListaPersonasCatalogo(idDeseado){
 const fuente=catalogoEditableActual();
 sac('personas').innerHTML=fuente.personas.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')).map(p=>`<option value="${esc(p.id)}">${p.activo===false?'[INACTIVO] ':''}${esc(p.nombre)} — ${esc(p.cargo)}</option>`).join('');
 if(idDeseado&&fuente.personas.some(p=>p.id===idDeseado))sac('personas').value=idDeseado;
 else if(!idPersonaEnEdicion&&fuente.personas.length)sac('personas').selectedIndex=0;
 seleccionarPersonaPanel(sac('personas').value);
}
function seleccionarPersonaPanel(id){
 const p=catalogoEditableActual().personas.find(x=>x.id===id);
 idPersonaEnEdicion=p?.id||null;
 sac('persona-titulo').textContent=p?`Editar destinatario${p.activo===false?' (inactivo)':''}`:'Nuevo destinatario';
 sac('nombre').value=p?.nombre||'';
 sac('cargo').value=p?.cargo||'';
 sac('referencias').value=(p?.referencias||[]).join('\n');
 sac('deps-persona').value=(p?.dependencias||[]).join('\n');
 sac('depsobs-persona').value=(p?.dependenciasObs||[]).join('\n');
 sac('desactivar-persona').textContent=p?.activo===false?'Reactivar':'Desactivar';
 sac('desactivar-persona').disabled=!p;
}
function renderListaDependenciasCatalogo(idDeseado){
 const fuente=catalogoEditableActual();
 sac('dependencias').innerHTML=fuente.dependencias.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')).map(d=>`<option value="${esc(d.id)}">${d.activo===false?'[INACTIVA] ':''}${esc(d.nombre)}</option>`).join('');
 if(idDeseado&&fuente.dependencias.some(d=>d.id===idDeseado))sac('dependencias').value=idDeseado;
 else if(!idDependenciaEnEdicion&&fuente.dependencias.length)sac('dependencias').selectedIndex=0;
 seleccionarDependenciaPanel(sac('dependencias').value);
}
function seleccionarDependenciaPanel(id){
 const d=catalogoEditableActual().dependencias.find(x=>x.id===id);
 idDependenciaEnEdicion=d?.id||null;
 sac('dependencia-titulo').textContent=d?`Editar dependencia${d.activo===false?' (inactiva)':''}`:'Nueva dependencia';
 sac('nombre-dep').value=d?.nombre||'';
 sac('desactivar-dependencia').textContent=d?.activo===false?'Reactivar':'Desactivar';
 sac('desactivar-dependencia').disabled=!d;
}
function abrirCatalogoAdmin(){
 if(!catalogoEsAdmin)return;
 if(!catalogoCloudReady){estadoPanelCatalogo(catalogoCloudError||'Conectando con Firebase. Vuelva a intentar.',true)}
 else estadoPanelCatalogo('');
 renderListaPersonasCatalogo();renderListaDependenciasCatalogo();
 sac('guardar-persona').disabled=!catalogoCloudReady;
 sac('guardar-dependencia').disabled=!catalogoCloudReady;
 sac('desactivar-persona').disabled=!catalogoCloudReady;
 sac('desactivar-dependencia').disabled=!catalogoCloudReady;
 dialogCatalogo.showModal();
}
btnAdministrarCatalogo.addEventListener('click',abrirCatalogoAdmin);
sac('cerrar').addEventListener('click',()=>dialogCatalogo.close());
sac('ver-personas').addEventListener('click',()=>{sac('panel-personas').hidden=false;sac('panel-dependencias').hidden=true;sac('ver-personas').classList.add('sac-primario');sac('ver-dependencias').classList.remove('sac-primario')});
sac('ver-dependencias').addEventListener('click',()=>{sac('panel-personas').hidden=true;sac('panel-dependencias').hidden=false;sac('ver-personas').classList.remove('sac-primario');sac('ver-dependencias').classList.add('sac-primario')});
sac('personas').addEventListener('change',()=>seleccionarPersonaPanel(sac('personas').value));
sac('dependencias').addEventListener('change',()=>seleccionarDependenciaPanel(sac('dependencias').value));
sac('nueva-persona').addEventListener('click',()=>{sac('personas').selectedIndex=-1;seleccionarPersonaPanel(null);sac('nombre').focus()});
sac('nueva-dependencia').addEventListener('click',()=>{sac('dependencias').selectedIndex=-1;seleccionarDependenciaPanel(null);sac('nombre-dep').focus()});
async function guardarCatalogoFirestore(siguiente,descripcion){
 if(!catalogoEsAdmin||!catalogoCloudReady||!catalogoCloudApi)throw Error('La cuenta no tiene permisos de administración del catálogo o no hay conexión.');
 if(guardandoCatalogo)throw Error('Ya hay un cambio en curso.');
 guardandoCatalogo=true;
 try{
  const {db,auth,doc,setDoc,serverTimestamp}=catalogoCloudApi;
  if(auth.currentUser?.uid!==UID_ADMIN_CATALOGO)throw Error('La sesión administrativa cambió.');
  const contenido={version:1,personas:siguiente.personas,dependencias:siguiente.dependencias,modificadoPor:auth.currentUser.uid,modificadoEn:serverTimestamp()};
  await setDoc(doc(db,...RUTA_CATALOGO_CLOUD),contenido);
  catalogoOficiosDB={personas:contenido.personas,dependencias:contenido.dependencias};
  actualizarCatalogoOficios();
  log('Catálogo institucional actualizado',descripcion);
  estadoPanelCatalogo('Cambios guardados en Firebase.','');
  toast('Catálogo actualizado correctamente.','success');
 }finally{guardandoCatalogo=false}
}
sac('persona-form').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const nombre=sac('nombre').value.trim(),cargo=sac('cargo').value.trim(),ref=lineasCatalogo(sac('referencias').value),deps=lineasCatalogo(sac('deps-persona').value),depsObs=lineasCatalogo(sac('depsobs-persona').value);
 if(!nombre||!cargo)return estadoPanelCatalogo('Complete nombre y cargo.',true);
 const nuevo=catalogoEditableActual();
 if(nuevo.personas.some(x=>claveCatalogo(x.nombre)===claveCatalogo(nombre)&&x.id!==idPersonaEnEdicion))return estadoPanelCatalogo('Ese destinatario ya está registrado.',true);
 const actual=nuevo.personas.find(x=>x.id===idPersonaEnEdicion),id=actual?.id||nombreIdCatalogo();
 const dato={...(actual||{}),id,nombre,cargo,referencias:ref,dependencias:deps,dependenciasObs:depsObs,activo:actual?.activo!==false};
 // Todo nombre de dependencia incorporado con la persona también se incorpora al catálogo global.
 for(const dep of [...deps,...depsObs])if(!nuevo.dependencias.some(x=>claveCatalogo(x.nombre)===claveCatalogo(dep)))nuevo.dependencias.push({id:nombreIdCatalogo(),nombre:dep,activo:true});
 if(actual)Object.assign(actual,dato);else nuevo.personas.push(dato);
 try{await guardarCatalogoFirestore(nuevo,`Destinatario ${actual?'editado':'registrado'}: ${nombre}`);renderListaPersonasCatalogo(id);renderListaDependenciasCatalogo();}
 catch(err){estadoPanelCatalogo('No se pudo guardar: '+err.message,true)}
});
sac('desactivar-persona').addEventListener('click',async()=>{
 if(!idPersonaEnEdicion)return;
 const nuevo=catalogoEditableActual(),p=nuevo.personas.find(x=>x.id===idPersonaEnEdicion);
 if(!p)return;
 const siguiente=p.activo===false;
 if(!confirm(`¿${siguiente?'Reactivar':'Desactivar'} a ${p.nombre}? Los oficios anteriores no cambiarán.`))return;
 p.activo=siguiente;
 try{await guardarCatalogoFirestore(nuevo,`Destinatario ${siguiente?'reactivado':'desactivado'}: ${p.nombre}`);renderListaPersonasCatalogo(p.id)}catch(err){estadoPanelCatalogo('No se pudo actualizar: '+err.message,true)}
});
sac('dependencia-form').addEventListener('submit',async ev=>{
 ev.preventDefault();const nombre=sac('nombre-dep').value.trim();if(!nombre)return estadoPanelCatalogo('Indique el nombre de la dependencia.',true);
 const nuevo=catalogoEditableActual();
 if(nuevo.dependencias.some(x=>claveCatalogo(x.nombre)===claveCatalogo(nombre)&&x.id!==idDependenciaEnEdicion))return estadoPanelCatalogo('La dependencia ya figura en el catálogo.',true);
 const actual=nuevo.dependencias.find(x=>x.id===idDependenciaEnEdicion),id=actual?.id||nombreIdCatalogo();
 if(actual){const previo=actual.nombre;actual.nombre=nombre;
  // Corregir también listas de sugerencias asociadas, sin cambiar ningún oficio emitido.
  nuevo.personas.forEach(persona=>{for(const tipo of ['dependencias','dependenciasObs'])persona[tipo]=(persona[tipo]||[]).map(d=>claveCatalogo(d)===claveCatalogo(previo)?nombre:d)});
 }else nuevo.dependencias.push({id,nombre,activo:true});
 try{await guardarCatalogoFirestore(nuevo,`Dependencia ${actual?'editada':'registrada'}: ${nombre}`);renderListaDependenciasCatalogo(id);renderListaPersonasCatalogo();}
 catch(err){estadoPanelCatalogo('No se pudo guardar: '+err.message,true)}
});
sac('desactivar-dependencia').addEventListener('click',async()=>{
 if(!idDependenciaEnEdicion)return;
 const nuevo=catalogoEditableActual(),d=nuevo.dependencias.find(x=>x.id===idDependenciaEnEdicion);if(!d)return;
 const siguiente=d.activo===false;
 if(!confirm(`¿${siguiente?'Reactivar':'Desactivar'} la dependencia «${d.nombre}»? Los oficios guardados no cambiarán.`))return;
 d.activo=siguiente;
 try{await guardarCatalogoFirestore(nuevo,`Dependencia ${siguiente?'reactivada':'desactivada'}: ${d.nombre}`);renderListaDependenciasCatalogo(d.id)}catch(err){estadoPanelCatalogo('No se pudo actualizar: '+err.message,true)}
});
function limpiarCatalogoEnSesion(){catalogoOficiosDB=null;catalogoCloudReady=false;catalogoEsAdmin=false;catalogoCloudError='';btnAdministrarCatalogo.style.display='none';if(dialogCatalogo.open)dialogCatalogo.close();actualizarCatalogoOficios()}
async function iniciarCatalogoFirebase(){
 if(catalogoCloudIniciando)return catalogoCloudIniciando;
 catalogoCloudIniciando=(async()=>{
  const [appModule,authModule,storeModule]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')]);
  const app=appModule.getApps()[0];
  if(!app)throw new Error('Firebase aún no está inicializado. Abra SIGAD con una sesión activa.');
  const auth=authModule.getAuth(app),db=storeModule.getFirestore(app);
  catalogoCloudApi={auth,db,doc:storeModule.doc,getDoc:storeModule.getDoc,setDoc:storeModule.setDoc,serverTimestamp:storeModule.serverTimestamp};
  authModule.onAuthStateChanged(auth,async user=>{
   if(!user){limpiarCatalogoEnSesion();return}
   const usuarioVigente=user.uid;
   catalogoEsAdmin=usuarioVigente===UID_ADMIN_CATALOGO;
   btnAdministrarCatalogo.style.display=catalogoEsAdmin?'inline-flex':'none';
   try{
    const snap=await storeModule.getDoc(storeModule.doc(db,...RUTA_CATALOGO_CLOUD));
    if(auth.currentUser?.uid!==usuarioVigente)return;
    const data=snap.exists()?snap.data():null;
    catalogoOficiosDB=data?{
     personas:Array.isArray(data.personas)?data.personas:[],
     dependencias:Array.isArray(data.dependencias)?data.dependencias:[]
    }:null;
    catalogoCloudReady=true;catalogoCloudError='';
   }catch(err){
    if(auth.currentUser?.uid!==usuarioVigente)return;
    catalogoCloudReady=false;
    catalogoCloudError='No se puede leer el catálogo de Firebase. Revise las reglas de Firestore: '+err.message;
    console.warn(catalogoCloudError);
   }
   actualizarCatalogoOficios();
  });
 })().catch(err=>{catalogoCloudIniciando=null;catalogoCloudError=err.message;console.warn('Catálogo institucional:',err)});
 return catalogoCloudIniciando;
}
window.addEventListener('sigad:acceso-verificado',e=>{if(e.detail?.ready)iniciarCatalogoFirebase()});
window.addEventListener('load',()=>iniciarCatalogoFirebase());


const infoRangoPaquetes=document.createElement('small');
infoRangoPaquetes.id='sigad-info-rango-paquetes';
infoRangoPaquetes.setAttribute('role','status');
infoRangoPaquetes.style.cssText='display:block;margin-top:5px;line-height:1.4;font-size:12px;color:var(--muted,#667085)';
const inputFinRango=$('#rangeEnd');
if(inputFinRango)inputFinRango.insertAdjacentElement('afterend',infoRangoPaquetes);
function sincronizarPaquetesDelRango(){
 const datos=calcularPaquetesEntreCodigos($('#rangeStart')?.value,$('#rangeEnd')?.value,modalidadOficio());
 const filas=$$('#dependencyRows tr');
 const unica=filas.length===1;
 filas.forEach(fila=>{
  const campo=$('.dep-packages',fila);
  if(!campo)return;
  if(unica&&datos.cantidad!==null){
   campo.value=String(datos.cantidad);
   campo.dataset.autocompletadoRango='si';
   campo.readOnly=true;
   campo.title='Calculado automáticamente: paquete final - paquete inicial + 1';
  }else{
   if(campo.dataset.autocompletadoRango==='si')campo.value='';
   delete campo.dataset.autocompletadoRango;
   campo.readOnly=false;
   campo.removeAttribute('title');
  }
 });
 if(datos.error){
  infoRangoPaquetes.textContent=datos.error;
  infoRangoPaquetes.style.color='#d34a51';
 }else if(datos.cantidad!==null){
  const cantidadTexto=fmt(datos.cantidad);
  if(unica){
   infoRangoPaquetes.textContent=`Total calculado: ${cantidadTexto} paquete${datos.cantidad===1?'':'s'} (incluye el inicial y el final).`;
  }else{
   const repartidos=filas.reduce((sum,fila)=>sum+n($('.dep-packages',fila)?.value),0);
   infoRangoPaquetes.textContent=`Rango: ${cantidadTexto} paquetes en total. Distribuya las cantidades entre ${filas.length} dependencias (${fmt(repartidos)} asignados).`;
  }
  infoRangoPaquetes.style.color='var(--muted,#667085)';
 }else{
  infoRangoPaquetes.textContent='';
 }
 calc();
}
for(const selector of ['#rangeStart','#rangeEnd']){
 const campo=$(selector);
 if(campo){
  campo.addEventListener('input',()=>{
   if(/\bELIM\b/i.test(campo.value) && modalidadOficio()!=='eliminacion'){
    $('#officeModality').value='eliminacion';
    prepararModalidadOficio({numero:false});
   }else sincronizarPaquetesDelRango();
  });
  campo.addEventListener('change',()=>{
   if(modalidadOficio()==='eliminacion')campo.value=normalizarCodigoEliminacion(campo.value);
   sincronizarPaquetesDelRango();
  });
 }

}

$('#addDependency').onclick=()=>{$('#dependencyRows').append(depRow());reindex();sincronizarPaquetesDelRango()};$('#addObservation').onclick=()=>{$('#observationRows').append(obsRow());reindex();calc()};$('#addPackageObservation').onclick=()=>{$('#packageObservationRows').append(packObsRow());reindex();calc()};
function collectOffice(){return{id:currentOfficeId||uid(),number:$('#officeNumber').value.trim(),date:$('#officeDate').value,recipient:$('#recipient').value.trim(),recipientRole:$('#recipientRole').value.trim(),references:$('#references').value.split(/\n+/).map(x=>x.trim()).filter(Boolean),referenceDate:$('#referenceDate').value,cargoType:$('#cargoType').value,modality:modalidadOficio(),rangeStart:modalidadOficio()==='eliminacion'?normalizarCodigoEliminacion($('#rangeStart').value):$('#rangeStart').value.trim(),rangeEnd:modalidadOficio()==='eliminacion'?normalizarCodigoEliminacion($('#rangeEnd').value):$('#rangeEnd').value.trim(),dependencies:$$('#dependencyRows tr').map(r=>({name:$('.dep-name',r).value.trim(),packages:n($('.dep-packages',r).value),files:n($('.dep-files',r).value)})).filter(x=>x.name||x.packages||x.files),observations:$$('#observationRows tr').map(r=>({dep:$('.obs-dep',r).value.trim(),file:$('.obs-file',r).value.trim(),folios:n($('.obs-folios',r).value),type:$('.obs-type',r).value,text:$('.obs-text',r).value.trim()})).filter(x=>x.dep||x.file||x.text),packageObservations:$$('#packageObservationRows tr').map(r=>({dep:$('.pobs-dep',r).value.trim(),code:$('.pobs-code',r).value.trim(),folios:n($('.pobs-folios',r).value),text:$('.pobs-text',r).value.trim()})).filter(x=>x.dep||x.code||x.text)}}
async function saveOffice(status='borrador'){
 if(!window.SIGADCloud?.ready()){
  try{if(!window.SIGADCloud?.load)throw Error('No se cargó el módulo compartido de documentos. Actualice la página e inténtelo de nuevo.');await window.SIGADCloud.load();}
  catch(err){toast('No se pudieron cargar los oficios: '+err.message,'error');return null;}
 }
 // El cálculo automático se refresca después de cargar los registros de Firestore.
 if(!currentOfficeId&&$('#officeNumber')?.dataset.autoOfficeNumber==='si')suggestNumber();
 const r=collectOffice();
 if(!r.number||!r.date){alert('Complete el número y la fecha del oficio.');return null}
 const identidad=identidadNumeroOficio(r);
 if(!currentOfficeId&&(!identidad||identidad.numero<=0)){
  alert('Indique un número de oficio válido y mayor a cero. Los oficios de eliminación usan el mismo correlativo que las devoluciones, por ejemplo: 019-2026-OAD-CSJSA/PJ.');
  return null;
 }
 const all=read(K.offices);
 const repetido=identidad&&identidad.numero>0&&all.find(x=>x.id!==r.id&&(
  (id=>id&&id.numero===identidad.numero&&id.anio===identidad.anio)(identidadNumeroOficio(x))
 ));
 if(repetido){
  alert(`El correlativo ${identidad.numero.toString().padStart(3,'0')}-${identidad.anio} ya está registrado en ${repetido.number} (${repetido.modality==='eliminacion'?'eliminación':'devolución'}). Ambas modalidades comparten la misma numeración. Seleccione otro correlativo.`);
  return null;
 }
 r.status=status;r.updatedAt=new Date().toISOString();
 const i=all.findIndex(x=>x.id===r.id);
 if(i>=0){r.createdAt=all[i].createdAt||r.updatedAt;all[i]=r}else{r.createdAt=r.updatedAt;all.unshift(r)}
 try{await write(K.offices,all)}catch(err){toast('No se pudo guardar: '+err.message,'error');return null;}
 currentOfficeId=r.id;
 $('#officeNumber').dataset.autoOfficeNumber='no';
 log(status==='generado'?'Oficio generado':'Borrador guardado',r.number);
 renderDashboard();return r;
}
$('#btnSaveDraft').onclick=async()=>{if(await saveOffice('borrador'))alert('Borrador guardado correctamente.')};
// Se toma el año y correlativo del NÚMERO de oficio; no del rango de paquetes.
// Soporta oficios históricos: 001 -2026-OAD..., 001-26, 001-2026-...
function identidadNumeroOficio(oficio){
 const raw=String(oficio?.number||'').trim();
 const match=raw.match(/^0*(\d{1,8})\s*[-–]\s*(20\d{2}|\d{2})(?=$|[-–\s/])/);
 if(match){
  const numero=Number(match[1]),anio=match[2].length===2?'20'+match[2]:match[2];
  return {numero,anio};
 }
 // Oficios que se registraron antiguamente solo con el número y fecha.
 const soloNumero=raw.match(/^0*(\d{1,8})$/);
 const anio=String(oficio?.date||'').slice(0,4);
 return soloNumero&&/^20\d{2}$/.test(anio)?{numero:Number(soloNumero[1]),anio}:null;
}
function suggestNumber(){
 const anio=($('#officeDate')?.value||today()).slice(0,4);
 const usados=read(K.offices).map(identidadNumeroOficio).filter(x=>x&&x.anio===anio&&x.numero>0).map(x=>x.numero);
 const siguiente=String(Math.max(0,...usados)+1).padStart(3,'0');
 $('#officeNumber').value=`${siguiente}-${anio}-OAD-CSJSA/PJ`;
 $('#officeNumber').dataset.autoOfficeNumber='si';
}
$('#btnSuggestNumber').onclick=suggestNumber;
function newOffice(){currentOfficeId=null;if(referenciaCampo)delete referenciaCampo.dataset.sigadAutoRef;inputCorrelativoReferencia.value='0000';selectorModeloReferencia.value='';$('#officeForm').reset();$('#officeModality').value='regular';$('#officeNumber').dataset.autoOfficeNumber='si';actualizarModelosReferencia(null);$('#officeDate').value=today();$('#cargoType').value='digital';$('#dependencyRows').innerHTML='';$('#observationRows').innerHTML='';$('#packageObservationRows').innerHTML='';$('#dependencyRows').append(depRow());prepararModalidadOficio();reindex();sincronizarPaquetesDelRango();$('#historyPanel').classList.add('hidden')}
$('#btnNew').onclick=newOffice;
function dependencyPhrase(r){const names=r.dependencies.map(x=>x.name).filter(Boolean);if(names.length===1){const k=names[0].toLocaleUpperCase('es-PE');return `correspondientes ${k.includes('SALA')?'a la':'al'} ${names[0]}`;}if(names.length>1)return'correspondientes a las dependencias detalladas a continuación';return'correspondientes a la documentación recepcionada'}
// Redacción contrastada con oficios manuales 016, 017 y 018 de 2026.
function textoIntroOficio(r){
 const tp=total(r,'packages');const periodo=r.rangeStart||r.rangeEnd?` del ${r.rangeStart} al ${r.rangeEnd}`:'';
 if(r.modality==='eliminacion')return `Tengo el agrado de dirigirme a usted para saludarlo cordialmente y, en atención al documento consignado en la referencia, devolverle los cargos correspondientes a los expedientes para eliminación, recepcionados por el Archivo Desconcentrado, debidamente numerados${periodo} (${tp} paquete${tp===1?'':'s'}), ${dependencyPhrase(r)}, según el siguiente detalle:`;
 return `Tengo el agrado de dirigirme a Usted, para saludarlo cordialmente y en atención al documento anotado en la referencia, devolver a su despacho los ${r.cargoType==='digital'?'cargos en digital':'cargos'} de los Expedientes recepcionados por el Archivo Desconcentrado debidamente numerados${periodo} (${tp} paquete${tp===1?'':'s'}), ${dependencyPhrase(r)}, según el siguiente detalle:`;
}
function htmlIntroOficio(r){
 const tp=total(r,'packages');const rango=r.rangeStart||r.rangeEnd?` del <b>${esc(r.rangeStart)}</b> al <b>${esc(r.rangeEnd)}</b>`:'';
 if(r.modality==='eliminacion')return `Tengo el agrado de dirigirme a usted para saludarlo cordialmente y, en atención al documento consignado en la referencia, devolverle los cargos correspondientes a los expedientes para eliminación, recepcionados por el Archivo Desconcentrado, debidamente numerados${rango} (<b>${fmt(tp)} paquete${tp===1?'':'s'}</b>), ${esc(dependencyPhrase(r))}, según el siguiente detalle:`;
 return `Tengo el agrado de dirigirme a Usted, para saludarlo cordialmente y en atención al documento anotado en la referencia, devolver a su despacho los ${r.cargoType==='digital'?'cargos en digital':'cargos'} de los Expedientes recepcionados por el Archivo Desconcentrado debidamente numerados${rango} (<b>${fmt(tp)} paquete${tp===1?'':'s'}</b>), ${esc(dependencyPhrase(r))}, según el siguiente detalle:`;
}
function omitirRecomendacionesGenericas(r){return r.modality==='eliminacion';}
function exhortation(r){if(!r.observations.length&&!r.packageObservations.length)return'';const types=[...new Set(r.observations.map(x=>x.type).filter(Boolean))];const map={'FALTA RESOLUCIÓN DE ARCHIVO':'falta de resolución de archivo definitivo','NO ESTÁ EN LISTADO':'expedientes que no se encuentran consignados en el listado correspondiente','EXPEDIENTE DUPLICADO':'duplicidad de expedientes','RESOLUCIÓN NO CORRESPONDE':'resoluciones que no corresponden al expediente','FALTA TOMO':'falta de tomos','FOLIATURA / TOMOS':'inconsistencias en foliatura o tomos','OTRO':'otras observaciones en la documentación remitida'};const items=types.map(x=>map[x]).filter(Boolean);const desc=items.length?items.join(', ').replace(/, ([^,]*)$/,' y $1'):'observaciones en la documentación remitida';return`Por lo tanto, se exhorta a su despacho a disponer que el personal a su cargo verifique de manera previa y rigurosa la documentación remitida al Archivo Desconcentrado, observando estrictamente las disposiciones establecidas. Ello, en razón de haberse advertido ${desc}. Estas situaciones generan devoluciones innecesarias, reprocesos y una mayor carga laboral para esta dependencia. Por lo expuesto, se solicita adoptar las medidas correctivas necesarias a fin de evitar la reiteración de dichas observaciones en futuras remisiones.`}
function previewHtml(r){
  const tp=total(r,'packages'),tf=total(r,'files');
  const refs=(r.references||[]).map(x=>`<div>${esc(x)}</div>`).join('');
  const depRows=(r.dependencies||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.name)}</td><td>${fmt(x.packages)}</td><td>${fmt(x.files)}</td></tr>`).join('');
  const obsRows=(r.observations||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.dep)}</td><td>${esc(x.file)}</td><td>${x.folios||''}</td><td>${esc(x.text||x.type)}</td></tr>`).join('');
  const pobRows=(r.packageObservations||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.dep)}</td><td>${esc(x.code)}</td><td>${x.folios||''}</td><td>${esc(x.text)}</td></tr>`).join('');
  const countObs=(r.observations||[]).length, countPack=(r.packageObservations||[]).length;
  const obsIntro=(countObs||countPack)
    ? `Asimismo, se ${countObs+countPack===1?'devuelve':'devuelven'} ${[countObs?`<b>${countObs} expediente${countObs===1?'':'s'}</b>`:'',countPack?`<b>${countPack} paquete${countPack===1?'':'s'}</b>`:''].filter(Boolean).join(' y ')} ${countObs+countPack===1?'observado':'observados'}, cuyas observaciones se detallan a continuación:`
    : '';
  return `
  <div class="doc-header office-header">
    <div class="office-logo-clip"><img src="assets/logo-pj-oficios.png" alt="Archivo Desconcentrado"></div>
    <div class="office-header-center">
      <div class="office-title">CORTE SUPERIOR DE JUSTICIA DEL SANTA</div>
      <div class="office-subtitle">ARCHIVO DESCONCENTRADO</div>
    </div>
  </div>
  <div class="doc-date">Chimbote, ${longDate(r.date)}</div>
  <div class="office-number">OFICIO N.° ${esc(r.number)}</div>
  <div class="office-meta-row"><b>Dr.(a):</b></div>
  <div class="office-dest-name">${esc(r.recipient)}</div>
  <div class="office-dest-role"><i>${esc(r.recipientRole)}</i></div>
  ${refs?`<div class="office-meta-pair"><b>REFERENCIA:</b><div>${refs}</div></div>`:''}
  ${r.referenceDate?`<div class="office-meta-pair"><b>FECHA:</b><div>${fmtDate(r.referenceDate)}</div></div>`:''}
  <p>${htmlIntroOficio(r)}</p>
  <table class="office-table">
    <thead><tr><th>ITEM</th><th>JUZGADO / DEPENDENCIA</th><th>CANTIDAD PAQUETES</th><th>CANTIDAD EXPEDIENTES</th></tr></thead>
    <tbody>
      ${depRows}
      <tr class="office-total-row"><td></td><td>TOTAL</td><td>${fmt(tp)}</td><td>${fmt(tf)}</td></tr>
    </tbody>
  </table>
  ${omitirRecomendacionesGenericas(r)?'':'<p>Para futuros requerimientos de expedientes al Archivo Desconcentrado, deberá consignarse en el oficio correspondiente la numeración del paquete asignado por esta oficina.</p>'}
  ${obsIntro?`<p>${obsIntro}</p>`:''}
  ${countObs?`<table class="office-table"><thead><tr><th>ITEM</th><th>DEPENDENCIA</th><th>NRO EXPEDIENTE</th><th>FOLIOS</th><th>OBSERVACIONES</th></tr></thead><tbody>${obsRows}</tbody></table>`:''}
  ${countPack?`<table class="office-table"><thead><tr><th>ITEM</th><th>DEPENDENCIA</th><th>CÓDIGO DE PAQUETE</th><th>FOLIOS</th><th>OBSERVACIONES</th></tr></thead><tbody>${pobRows}</tbody></table>`:''}
  ${!omitirRecomendacionesGenericas(r)&&exhortation(r)?`<p>${esc(exhortation(r))}</p>`:''}
  <p>Sin otro particular, hago propicia la oportunidad para expresarle los sentimientos de mi especial consideración y estima personal.</p>
  <p class="office-closing">Atentamente;</p>
  <div class="office-signature-block">
    <div class="office-sign-title">FIRMADO DIGITALMENTE POR:</div>
    <div class="signature"><div class="line"></div><b>Responsable</b><br><b>Archivo Desconcentrado - CSJSA</b></div>
  </div>`
};
function showPreview(){const r=collectOffice();if(!r.number||!r.date||!r.recipient){alert('Complete número, fecha y destinatario.');return}if(!r.dependencies.length){alert('Registre al menos una dependencia.');return}$('#officePreview').innerHTML=previewHtml(r);openModal('previewModal')}
$('#btnPreview').onclick=showPreview;$('#closePreview').onclick=()=>closeModal('previewModal');$('#btnPrint').onclick=()=>window.print();$('#btnFinalize').onclick=async()=>{const r=await saveOffice('generado');if(r){$('#officePreview').innerHTML=previewHtml(r);alert('Oficio registrado como generado.')}};
async function loadLogoData(){const res=await fetch('assets/logo-pj-oficios.png');if(!res.ok)throw new Error('No se pudo cargar el logo del oficio');return await res.arrayBuffer()}
function wRun(t,opt={}){if(typeof opt==='boolean')opt={bold:opt};const font=opt.font||'Arial',size=opt.size??22;return`<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/>${opt.bold?'<w:b/>':''}${opt.italic?'<w:i/>':''}${opt.underline?'<w:u w:val="single"/>':''}<w:color w:val="000000"/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xml(t)}</w:t></w:r>`}
function wP(t,opt={}){const align=opt.align?`<w:jc w:val="${opt.align}"/>`:'';const ind=opt.indentLeft?`<w:ind w:left="${opt.indentLeft}"/>`:'';return`<w:p><w:pPr><w:spacing w:after="${opt.after??120}"/>${align}${ind}</w:pPr>${wRun(t,opt)}</w:p>`}
function wCell(t,opt={},width=2400){if(typeof opt==='boolean')opt={bold:opt};const align=opt.align||'center';const grid=opt.gridSpan?`<w:gridSpan w:val="${opt.gridSpan}"/>`:'';const noWrap=opt.noWrap?'<w:noWrap/>':'';const noBorder=opt.noBorder?'<w:tcBorders><w:top w:val="nil"/><w:bottom w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/></w:tcBorders>':'';return`<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${grid}${noWrap}${noBorder}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/></w:pPr>${wRun(t,opt)}</w:p></w:tc>`}
function wTable(headers,rows,widths,opt={}){const headerSize=opt.headerSize??18,bodySize=opt.bodySize??20;const tableUnits=(widths||[]).reduce((a,b)=>a+Number(b||0),0);return`<w:tbl><w:tblPr><w:tblW w:w="${tableUnits||8900}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="000000"/><w:left w:val="single" w:sz="6" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:color="000000"/><w:right w:val="single" w:sz="6" w:color="000000"/><w:insideH w:val="single" w:sz="6" w:color="000000"/><w:insideV w:val="single" w:sz="6" w:color="000000"/></w:tblBorders></w:tblPr><w:tr>${headers.map((h,i)=>wCell(h,{bold:true,size:headerSize,noWrap:true},widths?.[i])).join('')}</w:tr>${rows.map(row=>`<w:tr>${row.map((c,i)=>typeof c==='object'?wCell(String(c.text??''),{bold:!!c.bold,italic:!!c.italic,underline:!!c.underline,size:c.size??bodySize,align:c.align||'center',gridSpan:c.gridSpan,noWrap:!!c.noWrap,noBorder:!!c.noBorder},c.width??widths?.[i]??2400):wCell(String(c??''),{size:bodySize},widths?.[i]??2400)).join('')}</w:tr>`).join('')}</w:tbl>`}
function logoDrawing(){return`<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="920000" cy="611000"/><wp:docPr id="1" name="Logo PJ"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="920000" cy="611000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`}
function wordOfficeHeader(){
  const logo=logoDrawing();
  const center=`${wP('CORTE SUPERIOR DE JUSTICIA DEL SANTA',{bold:true,align:'center',size:25,after:25})}${wP('ARCHIVO DESCONCENTRADO',{align:'center',size:23,after:15})}`;
  return `<w:tbl><w:tblPr><w:tblW w:w="8900" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="1450"/><w:gridCol w:w="7450"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="1450" w:type="dxa"/></w:tcPr>${logo}</w:tc><w:tc><w:tcPr><w:tcW w:w="7450" w:type="dxa"/></w:tcPr>${center}</w:tc></w:tr></w:tbl>`+
    `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="000000"/></w:pBdr><w:spacing w:after="60"/></w:pPr></w:p>`;
}
function wordOfficeField(label,value){
  return `<w:p><w:pPr><w:spacing w:after="35"/></w:pPr>${wRun(label,{bold:true,size:19})}${wRun('    '+String(value||''),{size:19})}</w:p>`;
}
function officeDocXml(r){
  const tp=total(r,'packages'),tf=total(r,'files');
  const intro=textoIntroOficio(r);
  const depRows=(r.dependencies||[]).map((x,i)=>[i+1,x.name,x.packages,x.files]);
  depRows.push([{text:'',noBorder:true},{text:'TOTAL',noBorder:true,bold:true,align:'right'},{text:tp,noBorder:true,bold:true},{text:tf,noBorder:true,bold:true}]);
  const obsRows=(r.observations||[]).map((x,i)=>[i+1,x.dep,x.file,x.folios,x.text||x.type]);
  const pobRows=(r.packageObservations||[]).map((x,i)=>[i+1,x.dep,x.code,x.folios,x.text]);
  let body=wordOfficeHeader();
  body+=wP(`Chimbote, ${longDate(r.date)}`,{align:'right',size:19,after:100});
  body+=wP(`OFICIO N.° ${r.number}`,{bold:true,underline:true,size:23,after:95});
  body+=wP('Dr.(a):',{bold:true,size:20,after:10});
  body+=wP(r.recipient,{bold:true,size:20,after:10});
  body+=wP(r.recipientRole,{italic:true,size:19,after:50});
  if((r.references||[]).length){
    r.references.forEach((ref,i)=>body+=wordOfficeField(i?'':'REFERENCIA:',ref));
  }
  if(r.referenceDate)body+=wordOfficeField('FECHA:',fmtDate(r.referenceDate));
  body+=wP(intro,{align:'both',size:19,after:70});
  body+=wTable(['ITEM','JUZGADO / DEPENDENCIA','CANTIDAD PAQUETES','CANTIDAD EXPEDIENTES'],depRows,[650,4450,1800,2000],{headerSize:17,bodySize:17});
  if(!omitirRecomendacionesGenericas(r))body+=wP('Para futuros requerimientos de expedientes al Archivo Desconcentrado, deberá consignarse en el oficio correspondiente la numeración del paquete asignado por esta oficina.',{align:'both',size:19,after:70});
  const obs=(r.observations||[]).length,pob=(r.packageObservations||[]).length;
  if(obs||pob){
    body+=wP(`Asimismo, se ${obs+pob===1?'devuelve':'devuelven'} ${[obs?`${obs} expediente${obs===1?'':'s'}`:'',pob?`${pob} paquete${pob===1?'':'s'}`:''].filter(Boolean).join(' y ')} ${obs+pob===1?'observado':'observados'}, cuyas observaciones se detallan a continuación:`,{align:'both',size:19,after:65});
  }
  if(obsRows.length)body+=wTable(['ITEM','DEPENDENCIA','NRO EXPEDIENTE','FOLIOS','OBSERVACIONES'],obsRows,[650,2100,2200,800,3150],{headerSize:16,bodySize:17});
  if(pobRows.length)body+=wTable(['ITEM','DEPENDENCIA','CÓDIGO DE PAQUETE','FOLIOS','OBSERVACIONES'],pobRows,[650,2100,2200,800,3150],{headerSize:16,bodySize:17});
  const ex=exhortation(r);
  if(ex&&!omitirRecomendacionesGenericas(r))body+=wP(ex,{align:'both',size:19,after:85});
  body+=wP('Sin otro particular, hago propicia la oportunidad para expresarle los sentimientos de mi especial consideración y estima personal.',{align:'both',size:19,after:110});
  body+=wP('Atentamente;',{bold:true,italic:true,align:'center',size:19,after:160});
  body+=wP('FIRMADO DIGITALMENTE POR:',{bold:true,align:'center',size:19,after:1080});
  body+=wP('_____________________________',{align:'center',size:19,after:20});
  body+=wP('Responsable',{bold:true,align:'center',size:19,after:0});
  body+=wP('Archivo Desconcentrado - CSJSA',{bold:true,align:'center',size:19,after:0});
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="650" w:right="1350" w:bottom="650" w:left="1350" w:header="350" w:footer="350"/></w:sectPr></w:body></w:document>`;
}

async function generateDocx(){if(!window.JSZip){alert('No se cargó el componente para Word. Verifique la conexión a Internet.');return}const r=collectOffice(),zip=new JSZip();zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');const word=zip.folder('word');word.file('document.xml',officeDocXml(r));word.folder('_rels').file('document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>');try{word.folder('media').file('logo.png',await loadLogoData())}catch{}const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});download(`Oficio_${r.number.replace(/[^a-z0-9-]/gi,'_')}.docx`,blob);log('Word generado',r.number)}
$('#btnWord').onclick=generateDocx;
async function generatePdf(){
  if(!window.jspdf?.jsPDF || typeof window.jspdf.jsPDF !== 'function'){
    alert('No se cargó el componente PDF. Verifique la conexión a Internet.');return;
  }
  const r=collectOffice(),{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const pageW=210, pageH=297, left=23, right=23, width=pageW-left-right;
  const tableWidth=156, tableLeft=(pageW-tableWidth)/2;
  const bottom=14, nextTop=17;
  const black=[0,0,0],white=[255,255,255];
  let y=12;
  doc.setTextColor(...black);doc.setDrawColor(...black);
  function newPage(){doc.addPage();y=nextTop;}
  function ensureHeight(h){if(y+h>pageH-bottom)newPage();}
  function printParagraph(text,{fontSize=9.3,gap=3.2}={}){
    doc.setFont('helvetica','normal');doc.setFontSize(fontSize);
    const lines=doc.splitTextToSize(String(text||''),width);
    const lineHeight=fontSize*0.352778*1.25;
    let at=0;
    while(at<lines.length){
      let count=Math.floor((pageH-bottom-y)/lineHeight);
      if(count<=0){newPage();count=Math.floor((pageH-bottom-y)/lineHeight);}
      const chunk=lines.slice(at,at+count);
      doc.text(chunk,left,y,{align:chunk.length>1?'justify':'left',maxWidth:width,lineHeightFactor:1.25});
      y+=chunk.length*lineHeight;at+=chunk.length;
      if(at<lines.length)newPage();
    }
    y+=gap;
  }
  try{
    const img=new Image();img.src='assets/logo-pj-oficios.png';await img.decode();
    doc.addImage(img,'PNG',24,10,27,17.9);
  }catch(err){console.warn('SIGAD: logo de oficio no disponible',err);}
  doc.setFont('helvetica','bold');doc.setFontSize(13.4);
  doc.text('CORTE SUPERIOR DE JUSTICIA DEL SANTA',118,17,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(12.2);
  doc.text('ARCHIVO DESCONCENTRADO',118,23.2,{align:'center'});
  doc.setLineWidth(.22);doc.line(left,29,pageW-right,29);
  y=36;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);
  doc.text(`Chimbote, ${longDate(r.date)}`,pageW-right,y,{align:'right'});
  y+=8;
  doc.setFont('helvetica','bold');doc.setFontSize(11.5);
  const titulo=`OFICIO N.° ${r.number}`;doc.text(titulo,left,y);
  doc.setLineWidth(.23);doc.line(left,y+.9,left+doc.getTextWidth(titulo),y+.9);
  y+=6.4;
  doc.setFont('helvetica','bold');doc.setFontSize(10.3);
  doc.text('Dr.(a):',left,y);y+=5.1;
  doc.text(String(r.recipient||''),left,y);y+=4.7;
  doc.setFont('helvetica','italic');doc.setFontSize(9.8);
  const roles=doc.splitTextToSize(String(r.recipientRole||''),width);
  doc.text(roles,left,y,{lineHeightFactor:1.15});y+=roles.length*4.0+2.7;
  const refX=49;
  if((r.references||[]).length){
    doc.setFont('helvetica','bold');doc.setFontSize(9.3);
    doc.text('REFERENCIA:',left,y);
    doc.setFont('helvetica','normal');
    const refs=r.references.flatMap(x=>doc.splitTextToSize(String(x),pageW-right-refX));
    doc.text(refs,refX,y,{lineHeightFactor:1.1});y+=Math.max(5,refs.length*4.0);
  }
  if(r.referenceDate){
    doc.setFont('helvetica','bold');doc.text('FECHA:',left,y);
    doc.setFont('helvetica','normal');doc.text(fmtDate(r.referenceDate),refX,y);y+=6;
  }
  y+=2;
  const tp=total(r,'packages'),tf=total(r,'files');
  const intro=textoIntroOficio(r);
  printParagraph(intro,{gap:2.7});
  const tableCommon={
    theme:'grid',tableWidth,margin:{left:tableLeft,right:tableLeft,top:nextTop,bottom},
    pageBreak:'auto',rowPageBreak:'avoid',
    styles:{font:'helvetica',fontSize:7.4,cellPadding:1.25,lineWidth:.16,lineColor:black,
      fillColor:white,textColor:black,halign:'center',valign:'middle',fontStyle:'normal',overflow:'linebreak'},
    headStyles:{fillColor:white,textColor:black,fontStyle:'bold',halign:'center',valign:'middle',lineColor:black,lineWidth:.16},
    bodyStyles:{fillColor:white,textColor:black,fontStyle:'normal'},
    alternateRowStyles:{fillColor:white}
  };
  const depRows=(r.dependencies||[]).map((x,i)=>[i+1,x.name,x.packages,x.files]);
  doc.autoTable({
    ...tableCommon,startY:y,
    head:[['ITEM','JUZGADO / DEPENDENCIA','CANTIDAD\nPAQUETES','CANTIDAD\nEXPEDIENTES']],
    body:depRows,
    foot:[[
      {content:'TOTAL',colSpan:2,styles:{halign:'right',fontStyle:'bold'}},
      {content:String(tp),styles:{halign:'center',fontStyle:'bold'}},
      {content:String(tf),styles:{halign:'center',fontStyle:'bold'}}
    ]],
    showFoot:'lastPage',
    footStyles:{fillColor:white,textColor:black,fontStyle:'bold',lineWidth:0,cellPadding:{top:1.2,right:1.2,bottom:1.2,left:1.2}},
    columnStyles:{0:{cellWidth:11},1:{cellWidth:75},2:{cellWidth:34},3:{cellWidth:36}},
  });
  y=doc.lastAutoTable.finalY+4.5;
  if(!omitirRecomendacionesGenericas(r))printParagraph('Para futuros requerimientos de expedientes al Archivo Desconcentrado, deberá consignarse en el oficio correspondiente la numeración del paquete asignado por esta oficina.',{gap:2.7});
  const obN=(r.observations||[]).length,pkN=(r.packageObservations||[]).length;
  if(obN||pkN){
    const obsIntro=`Asimismo, se ${obN+pkN===1?'devuelve':'devuelven'} ${[obN?`${obN} expediente${obN===1?'':'s'}`:'',pkN?`${pkN} paquete${pkN===1?'':'s'}`:''].filter(Boolean).join(' y ')} ${obN+pkN===1?'observado':'observados'}, cuyas observaciones se detallan a continuación:`;
    printParagraph(obsIntro,{gap:2});
  }
  const obsColumns={0:{cellWidth:10},1:{cellWidth:36},2:{cellWidth:37},3:{cellWidth:13},4:{cellWidth:60}};
  if(obN){
    doc.autoTable({...tableCommon,startY:y,
      head:[['ITEM','DEPENDENCIA','NRO EXPEDIENTE','FOLIOS','OBSERVACIONES']],
      body:r.observations.map((x,i)=>[i+1,x.dep,x.file,x.folios,x.text||x.type]),
      columnStyles:obsColumns,
      styles:{...tableCommon.styles,fontSize:7.2,cellPadding:1.15}
    });
    y=doc.lastAutoTable.finalY+3;
  }
  if(pkN){
    doc.autoTable({...tableCommon,startY:y,
      head:[['ITEM','DEPENDENCIA','CÓDIGO DE PAQUETE','FOLIOS','OBSERVACIONES']],
      body:r.packageObservations.map((x,i)=>[i+1,x.dep,x.code,x.folios,x.text]),
      columnStyles:obsColumns,
      styles:{...tableCommon.styles,fontSize:7.2,cellPadding:1.15}
    });
    y=doc.lastAutoTable.finalY+3;
  }
  const ex=exhortation(r);
  if(ex&&!omitirRecomendacionesGenericas(r))printParagraph(ex,{fontSize:9.1,gap:3});
  printParagraph('Sin otro particular, hago propicia la oportunidad para expresarle los sentimientos de mi especial consideración y estima personal.',{fontSize:9.2,gap:5});
  // La firma queda íntegra en una página; si el contenido crece se utiliza otra hoja.
  ensureHeight(45);
  doc.setFont('helvetica','bolditalic');doc.setFontSize(9.7);
  doc.text('Atentamente;',pageW/2,y,{align:'center'});y+=8;
  doc.setFont('helvetica','bold');doc.setFontSize(9.1);
  doc.text('FIRMADO DIGITALMENTE POR:',pageW/2,y,{align:'center'});
  y+=22;
  doc.setLineWidth(.2);doc.line(75,y,135,y);y+=4.3;
  doc.text('Responsable',pageW/2,y,{align:'center'});y+=4.1;
  doc.text('Archivo Desconcentrado - CSJSA',pageW/2,y,{align:'center'});
  doc.save(`Oficio_${String(r.number||'').replace(/[^a-z0-9-]/gi,'_')}.pdf`);
  log('PDF generado',r.number);
}

$('#btnPdf').onclick=generatePdf;
function loadOffice(id){const r=read(K.offices).find(x=>x.id===id);if(!r)return;currentOfficeId=r.id;$('#officeNumber').value=r.number||'';$('#officeNumber').dataset.autoOfficeNumber='no';$('#officeDate').value=r.date||'';$('#recipient').value=r.recipient||'';$('#recipientRole').value=r.recipientRole||'';$('#references').value=(r.references||[]).join('\n');$('#referenceDate').value=r.referenceDate||'';$('#cargoType').value=r.cargoType||'digital';$('#officeModality').value=r.modality||(/^[0-9]{3,}-[0-9]{2,4}(?:\s*ELIM)?$/i.test(String(r.rangeStart||''))?'eliminacion':'regular');catalogoDestinatariosSelect.value=buscarPersonaCatalogo(r.recipient)?.nombre||'';actualizarModelosReferencia(buscarPersonaCatalogo(r.recipient),{modificar:false});if(referenciaCampo)referenciaCampo.dataset.sigadAutoRef='no';$('#rangeStart').value=r.rangeStart||'';$('#rangeEnd').value=r.rangeEnd||'';prepararModalidadOficio({numero:false});$('#dependencyRows').innerHTML='';(r.dependencies||[]).forEach(x=>$('#dependencyRows').append(depRow(x)));$('#observationRows').innerHTML='';(r.observations||[]).forEach(x=>$('#observationRows').append(obsRow(x)));$('#packageObservationRows').innerHTML='';(r.packageObservations||[]).forEach(x=>$('#packageObservationRows').append(packObsRow(x)));if(!r.dependencies?.length)$('#dependencyRows').append(depRow());reindex();sincronizarPaquetesDelRango();$('#historyPanel').classList.add('hidden');navigate('devoluciones')}
function duplicateOffice(id){const r=read(K.offices).find(x=>x.id===id);if(!r)return;loadOffice(id);currentOfficeId=null;$('#officeNumber').value='';$('#officeDate').value=today();suggestNumber();log('Oficio duplicado',r.number)}
async function deleteOffice(id){if(!confirm('¿Eliminar este registro? Esta acción quedará anotada en auditoría.'))return;const all=read(K.offices),r=all.find(x=>x.id===id);try{await write(K.offices,all.filter(x=>x.id!==id))}catch(err){toast('No se pudo eliminar: '+err.message,'error');return;}if(r)log('Oficio eliminado',r.number);renderHistory();renderDashboard()}
function renderHistory(){const all=read(K.offices);$('#historyList').innerHTML=all.length?all.map(r=>`<div class="history-row"><strong>${esc(r.number)}</strong><span>${fmtDate(r.date)}</span><span>${esc(r.recipient)}</span><span>${fmt(total(r,'packages'))} paq.</span><span>${r.observations?.length||0} obs.</span><div class="history-actions"><button onclick="SIGAD.loadOffice('${r.id}')">Abrir</button><button onclick="SIGAD.duplicateOffice('${r.id}')">Duplicar</button><button onclick="SIGAD.deleteOffice('${r.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">Todavía no hay oficios guardados.</div>'}
$('#btnHistory').onclick=()=>{$('#historyPanel').classList.remove('hidden');renderHistory();$('#historyPanel').scrollIntoView({behavior:'smooth'})};$('#closeHistory').onclick=()=>$('#historyPanel').classList.add('hidden');
$('#btnPasteObs').onclick=()=>{$('#pasteArea').value='';openModal('pasteModal')};
function rowsFromMatrix(matrix){let count=0;matrix.forEach(row=>{if(!row||row.length<2)return;const dep=String(row[0]??'').trim(),file=String(row[1]??'').trim(),folios=n(row[2]),text=String(row[3]??'').trim();if(!dep&&!file&&!text)return;if(/dependencia/i.test(dep)&&/expediente/i.test(file))return;$('#observationRows').append(obsRow({dep,file,folios,text,type:detectObsType(text)}));count++});reindex();calc();return count}
$('#btnProcessPaste').onclick=()=>{const lines=$('#pasteArea').value.trim().split(/\r?\n/).map(l=>l.split('\t'));const c=rowsFromMatrix(lines);closeModal('pasteModal');alert(`${c} fila(s) incorporadas.`)};
$('#obsFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{let matrix=[];if(/\.csv$/i.test(file.name)){const txt=await file.text();matrix=txt.split(/\r?\n/).filter(Boolean).map(l=>l.split(/[;,]/))}else{if(!window.XLSX)throw new Error('El componente Excel no se cargó.');const buf=await file.arrayBuffer(),wb=XLSX.read(buf),ws=wb.Sheets[wb.SheetNames[0]];matrix=XLSX.utils.sheet_to_json(ws,{header:1,raw:false})}const c=rowsFromMatrix(matrix);alert(`${c} observación(es) importadas.`)}catch(err){alert(`No se pudo importar: ${err.message}`)}finally{e.target.value=''}};
function ensureRanges(){/* Los rangos deben proceder de registros institucionales, sin precargas simuladas. */}
function parsePackage(code,prefix){const c=String(code||'').trim().toUpperCase(),p=String(prefix||'').trim().toUpperCase();if(p==='R'){const m=c.match(/^(\d+)R$/);return m?n(m[1]):null}if(p&&c.startsWith(p)){const x=c.slice(p.length).match(/^\d+/);return x?n(x[0]):null}if(!p){const x=c.match(/\d+/);return x?n(x[0]):null}if(c.includes(p)){const x=c.replace(p,'').match(/\d+/);return x?n(x[0]):null}return null}
function findPackage(code){return read(K.ranges).filter(r=>{const x=parsePackage(code,r.prefix);return x!==null&&x>=n(r.from)&&x<=n(r.to)})}
function renderRangeList(){const ranges=read(K.ranges);$('#rangeList').innerHTML=ranges.length?ranges.map(r=>`<div class="range-row"><strong>${esc(r.repo)}</strong><span>${esc(r.prefix||'Sin prefijo')}</span><span>${r.from}</span><span>${r.to}</span><span>${esc(r.sector||'—')}</span><span>${esc(r.shelf||'—')}</span><span>${esc(r.level||'—')}</span><div class="row-actions"><button type="button" onclick="SIGAD.deleteRange('${r.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">No hay rangos configurados.</div>'}
function renderArchivo360(){ensureRanges();renderRangeList();if(window.SIGAD360){SIGAD360.init();SIGAD360.render()}else $('#archiveResult').innerHTML='<div class="notice">El motor de Archivo 360 no se pudo cargar.</div>'}
function openRangeModal(){['rangePrefix','rangeFrom','rangeTo','rangeSector','rangeShelf','rangeLevel','rangeDescription'].forEach(id=>$('#'+id).value='');openModal('rangeModal')}
$('#btnAddRange').onclick=openRangeModal;$('#btnAddRangeInline').onclick=openRangeModal;
$('#btnSaveRange').onclick=async()=>{const from=n($('#rangeFrom').value),to=n($('#rangeTo').value),repo=$('#rangeRepo').value,prefix=$('#rangePrefix').value.trim();if(!from||!to||to<from){toast('Revise el rango desde/hasta.','warning');return}const all=read(K.ranges);const duplicate=all.some(r=>r.repo===repo&&String(r.prefix||'').toUpperCase()===prefix.toUpperCase()&&n(r.from)===from&&n(r.to)===to);if(duplicate){toast('Ese rango ya se encuentra registrado.','warning');return}all.push({id:uid(),repo,prefix,from,to,sector:$('#rangeSector').value.trim(),shelf:$('#rangeShelf').value.trim(),level:$('#rangeLevel').value.trim(),description:$('#rangeDescription').value.trim()});try{await write(K.ranges,all)}catch(err){toast('No se pudo guardar el rango: '+err.message,'error');return;}log('Rango de Archivo 360 registrado',`${repo}: ${prefix}${from}-${to}`);closeModal('rangeModal');renderArchivo360();toast('Rango de ubicación registrado.','success')};
async function deleteRange(id){if(!confirm('¿Eliminar este rango de ubicación?'))return;const all=read(K.ranges),r=all.find(x=>x.id===id);try{await write(K.ranges,all.filter(x=>x.id!==id))}catch(err){toast('No se pudo eliminar: '+err.message,'error');return;}if(r)log('Rango de Archivo 360 eliminado',`${r.repo} ${r.prefix}${r.from}-${r.to}`);renderArchivo360();toast('Rango eliminado.','success')}
function renderTransfers(){const a=read(K.transfers),p=a.reduce((s,x)=>s+n(x.packages),0),m=a.reduce((s,x)=>s+n(x.meters),0);$('#transferStats').innerHTML=[['Transferencias',a.length],['Paquetes',fmt(p)],['Metros lineales',fmt2(m)+' m']].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');$('#transferList').innerHTML=a.length?a.map(x=>`<div class="data-row"><strong>${fmtDate(x.date)}</strong><span>${esc(x.destination)}</span><span>${fmt(x.packages)} paq.</span><span>${fmt2(x.meters)} m</span><span>${esc(x.period)}</span><span>${esc(x.status)}</span><div class="row-actions"><button onclick="SIGAD.deleteTransfer('${x.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">No hay transferencias registradas.</div>'}
$('#btnNewTransfer').onclick=()=>{$('#trDate').value=today();$('#trPackages').value='';$('#trMeters').value='';$('#trPeriod').value='';$('#trStatus').value='Planificada';$('#trReference').value='';$('#trNotes').value='';openModal('transferModal')};
$('#btnSaveTransfer').onclick=async()=>{if(!$('#trDate').value){alert('Indique la fecha.');return}const x={id:uid(),date:$('#trDate').value,destination:$('#trDestination').value.trim(),packages:n($('#trPackages').value),meters:n($('#trMeters').value),period:$('#trPeriod').value.trim(),status:$('#trStatus').value,reference:$('#trReference').value.trim(),notes:$('#trNotes').value.trim(),createdAt:new Date().toISOString()},a=read(K.transfers);a.unshift(x);try{await write(K.transfers,a)}catch(err){toast('No se pudo guardar: '+err.message,'error');return;}log('Transferencia registrada',`${x.packages} paquetes · ${x.status}`);closeModal('transferModal');renderTransfers();renderDashboard()};
async function deleteTransfer(id){if(!confirm('¿Eliminar esta transferencia?'))return;const a=read(K.transfers),x=a.find(v=>v.id===id);try{await write(K.transfers,a.filter(v=>v.id!==id))}catch(err){toast('No se pudo eliminar: '+err.message,'error');return;}if(x)log('Transferencia eliminada',`${x.packages} paquetes`);renderTransfers();renderDashboard()}
function renderEliminations(){const a=read(K.eliminations),p=a.reduce((s,x)=>s+n(x.packages),0),m=a.reduce((s,x)=>s+n(x.meters),0);$('#eliminationStats').innerHTML=[['Procesos / jornadas',a.length],['Paquetes eliminados',fmt(p)],['Metros lineales liberados',fmt2(m)+' m']].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');$('#eliminationList').innerHTML=a.length?a.map(x=>`<div class="data-row"><strong>${fmtDate(x.date)}</strong><span>${esc(x.repos)}</span><span>${fmt(x.packages)} paq.</span><span>${fmt2(x.meters)} m</span><span>${esc(x.period)}</span><span>${esc(x.status)}</span><div class="row-actions"><button onclick="SIGAD.deleteElimination('${x.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">No hay eliminaciones registradas.</div>'}
$('#btnNewElimination').onclick=()=>{$('#elDate').value=today();$('#elPackages').value='';$('#elMeters').value='';$('#elPeriod').value='';$('#elRepos').value='';$('#elParticipants').value='';$('#elStatus').value='Programada';$('#elReference').value='';$('#elNotes').value='';openModal('eliminationModal')};
$('#btnSaveElimination').onclick=async()=>{if(!$('#elDate').value){alert('Indique la fecha.');return}const x={id:uid(),date:$('#elDate').value,packages:n($('#elPackages').value),meters:n($('#elMeters').value),period:$('#elPeriod').value.trim(),repos:$('#elRepos').value.trim(),participants:n($('#elParticipants').value),status:$('#elStatus').value,reference:$('#elReference').value.trim(),notes:$('#elNotes').value.trim(),createdAt:new Date().toISOString()},a=read(K.eliminations);a.unshift(x);try{await write(K.eliminations,a)}catch(err){toast('No se pudo guardar: '+err.message,'error');return;}log('Eliminación documental registrada',`${x.packages} paquetes · ${x.meters} m`);closeModal('eliminationModal');renderEliminations();renderDashboard()};
async function deleteElimination(id){if(!confirm('¿Eliminar este registro de eliminación?'))return;const a=read(K.eliminations),x=a.find(v=>v.id===id);try{await write(K.eliminations,a.filter(v=>v.id!==id))}catch(err){toast('No se pudo eliminar: '+err.message,'error');return;}if(x)log('Eliminación documental eliminada',`${x.packages} paquetes`);renderEliminations();renderDashboard()}
function obsRanking(){const c={};read(K.offices).forEach(r=>(r.observations||[]).forEach(o=>c[o.type||detectObsType(o.text)]=(c[o.type||detectObsType(o.text)]||0)+1));return Object.entries(c).sort((a,b)=>b[1]-a[1])}
function renderDashboard(){window.SIGADUI?.renderDashboard()}
async function renderReports(){const o=read(K.offices),og=o.filter(x=>x.status==='generado'),t=read(K.transfers),e=read(K.eliminations),obs=og.reduce((s,r)=>s+(r.observations?.length||0),0),kpis=[['Oficios',og.length],['Paquetes en oficios',og.reduce((s,r)=>s+total(r,'packages'),0)],['Expedientes en oficios',og.reduce((s,r)=>s+total(r,'files'),0)],['Exp. observados',obs],['Transferencias',t.length],['Paquetes transferidos',t.reduce((s,x)=>s+n(x.packages),0)],['Eliminaciones',e.length],['Metros liberados',fmt2(e.reduce((s,x)=>s+n(x.meters),0))+' m']];const rank=obsRanking();$('#reportContent').innerHTML=`<section class="report-section panel"><div class="panel-head"><div><h3>Consolidado general</h3><p>Datos generados desde los módulos SIGAD.</p></div></div><div class="kpi-strip">${kpis.map(x=>`<div class="kpi"><span>${x[0]}</span><strong>${typeof x[1]==='number'?fmt(x[1]):x[1]}</strong></div>`).join('')}</div></section><section class="report-section panel"><div class="panel-head"><h3>Causas de observación</h3></div>${rank.length?`<table><thead><tr><th>Tipo de observación</th><th>Cantidad</th></tr></thead><tbody>${rank.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Sin datos.</div>'}</section><section class="report-section panel"><div class="panel-head"><h3>Transferencias</h3></div>${t.length?`<table><thead><tr><th>Fecha</th><th>Destino</th><th>Paquetes</th><th>Metros lineales</th><th>Estado</th></tr></thead><tbody>${t.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${esc(x.destination)}</td><td>${fmt(x.packages)}</td><td>${fmt2(x.meters)}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Sin datos.</div>'}</section><section class="report-section panel"><div class="panel-head"><h3>Eliminación documental</h3></div>${e.length?`<table><thead><tr><th>Fecha</th><th>Repositorios</th><th>Paquetes</th><th>Metros lineales</th><th>Estado</th></tr></thead><tbody>${e.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${esc(x.repos)}</td><td>${fmt(x.packages)}</td><td>${fmt2(x.meters)}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Sin datos.</div>'}</section>`; await renderOperationalReport();}
async function renderOperationalReport(){const host=$('#reportContent');if(!host)return;host.querySelector('#sigad-operational-report')?.remove();const el=document.createElement('section');el.id='sigad-operational-report';el.className='report-section panel';el.innerHTML='<div class="panel-head"><h3>Registros operativos institucionales</h3></div><p class="empty">Consultando módulos autorizados…</p>';host.append(el);try{const r=await window.SIGADOperational?.summary();if(!r){el.innerHTML='<div class="panel-head"><h3>Registros operativos</h3></div><p class="empty">Sin sesión verificada; no se presenta información.</p>';return;}const keys=[['inventario','Inventario'],['reingresos','Reingresos'],['traslados','Traslados'],['tarjetas','Tarjetas'],['microformas','Microformas']];const rows=keys.map(([k,n])=>'<tr><td>'+n+'</td><td>'+(r.counts[k]===null?'No disponible':fmt(r.counts[k]??0))+'</td></tr>').join('');const repos=Object.entries(r.repos).sort((a,b)=>b[1]-a[1]).map(([name,n])=>'<tr><td>'+esc(name)+'</td><td>'+fmt(n)+'</td></tr>').join('');const monthly=Object.entries(r.monthly).sort(([a],[b])=>a.localeCompare(b)).map(([ym,values])=>'<tr><td>'+esc(ym)+'</td>'+keys.map(([k])=>'<td>'+fmt(values[k]||0)+'</td>').join('')+'</tr>').join('');el.innerHTML='<div class="panel-head"><h3>Registros operativos institucionales</h3><p>Información accesible para el usuario autenticado; no se suman registros de módulos distintos como inventario único.</p></div><table><thead><tr><th>Módulo</th><th>Registros</th></tr></thead><tbody>'+rows+'</tbody></table><div class="panel-head"><h3>Paquetes físicos por repositorio</h3></div><table><thead><tr><th>Repositorio</th><th>Paquetes</th></tr></thead><tbody>'+(repos||'<tr><td colspan="2">Sin datos disponibles</td></tr>')+'</tbody></table><div class="panel-head"><h3>Actividad mensual operativa</h3></div><div class="table-wrap"><table><thead><tr><th>Mes</th>'+keys.map(x=>'<th>'+x[1]+'</th>').join('')+'</tr></thead><tbody>'+(monthly||'<tr><td colspan="6">Sin fechas disponibles</td></tr>')+'</tbody></table></div>'+(r.errors.length?'<p class="empty">Información parcial: '+esc(r.errors.join(' · '))+'</p>':'');}catch(err){el.innerHTML='<div class="panel-head"><h3>Registros operativos</h3></div><p class="empty">No se pudo consultar esta información. No se interpreta como cero.</p>';}}
$('#btnPrintReport').onclick=async()=>{
  const w=window.open('','_blank');
  if(!w){alert('El navegador bloqueó la ventana de impresión. Habilite ventanas emergentes para SIGAD.');return;}
  w.document.write('<p style="font-family:Arial">Preparando reporte…</p>');
  await renderReports();
  const generated=new Date().toLocaleString('es-PE',{dateStyle:'long',timeStyle:'short'});
  const logo=new URL('assets/logo-pj.png',document.baseURI).href;
  const raw=$('#reportContent').innerHTML;
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SIGAD - Reporte de gestión</title>
  <style>
  @page{size:A4 portrait;margin:18mm 14mm 17mm}
  *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#182234;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .document{max-width:185mm;margin:0 auto}.institutional-header{display:grid;grid-template-columns:64px 1fr;align-items:center;gap:12px;padding-bottom:13px;border-bottom:3px solid #85051c;margin-bottom:15px}
  .institutional-header img{width:58px;height:58px;object-fit:contain}.institutional-header .authority{font-size:11px;font-weight:800;text-transform:uppercase;color:#1e293b;letter-spacing:.2px}.institutional-header .unit{font-size:10px;color:#46536a}.institutional-header .brand{font-size:9px;font-weight:700;color:#85051c;letter-spacing:2px}
  .document-title{text-align:center;margin-bottom:17px}.document-title h1{font-size:17px;margin:0 0 5px;color:#80051b;letter-spacing:.3px}.document-title p{margin:3px 0;color:#536177;font-size:10px}
  .meta{display:flex;justify-content:space-between;gap:12px;border:1px solid #dde3ed;border-left:4px solid #85051c;background:#f7f8fb;padding:9px 12px;margin-bottom:17px}.meta strong{color:#1e293b}
  .panel,.report-section{border:1px solid #d9dfe8;border-radius:5px;margin:0 0 16px;padding:0 0 12px;break-inside:auto;page-break-inside:auto;overflow:visible;background:#fff;box-shadow:none}
  .panel-head{margin:0 0 11px;padding:10px 12px;background:#f3f5f9;border-bottom:1px solid #d9dfe8;border-left:4px solid #85051c;break-after:avoid;page-break-after:avoid}.panel-head h3{margin:0;color:#7e051c;font-size:11px;text-transform:uppercase;letter-spacing:.45px}.panel-head p{margin:3px 0 0;color:#637083;font-size:9px}
  .kpi-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:0 10px}.kpi{display:flex;flex-direction:column;justify-content:space-between;min-height:63px;border:1px solid #dce2e9;border-radius:4px;padding:9px 8px;break-inside:avoid}.kpi span{font-size:8.3px;line-height:1.3;color:#586477;text-transform:uppercase;font-weight:700}.kpi strong{font-size:18px;color:#182234;line-height:1.2;margin-top:5px;overflow-wrap:anywhere}
  table{width:calc(100% - 20px);margin:0 10px;border-collapse:collapse;table-layout:auto;font-size:9px}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th{background:#202b3d;color:white;text-align:left;font-weight:700;text-transform:uppercase;font-size:8px;padding:8px 7px;border:1px solid #202b3d}td{padding:7px;border:1px solid #dce2e9;vertical-align:top;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f6f8fa}
  .empty{margin:0 12px;color:#67758b;font-style:italic}.document-footer{padding:10px 0;margin-top:18px;border-top:1px solid #dce2e9;color:#687486;font-size:8px;display:flex;justify-content:space-between;gap:12px}
  .screen-actions{display:flex;justify-content:flex-end;padding:12px 0}.screen-actions button{border:0;background:#85051c;color:white;border-radius:4px;padding:10px 16px;font-weight:700;cursor:pointer}
  @media screen{body{background:#edf0f5;padding:24px}.document{background:white;box-shadow:0 6px 25px #18223420;padding:22px 26px}}
  @media print{.screen-actions{display:none!important}.document{max-width:none}.report-section{break-inside:auto}.document-footer{break-inside:avoid}body{background:white}}
  </style></head><body><main class="document"><div class="screen-actions"><button onclick="window.print()">Imprimir / Guardar como PDF</button></div>
  <header class="institutional-header"><img src="${logo}" alt="Emblema institucional"><div><div class="brand">SIGAD</div><div class="authority">Corte Superior de Justicia del Santa</div><div class="unit">Archivo Desconcentrado · Sistema Integral de Gestión del Archivo Desconcentrado</div></div></header>
  <section class="document-title"><h1>REPORTE CONSOLIDADO DE GESTIÓN</h1><p>Resumen de operaciones y registros documentales</p></section>
  <div class="meta"><div><strong>Dependencia:</strong> Archivo Desconcentrado</div><div><strong>Emitido:</strong> ${generated}</div></div>
  ${raw}
  <footer class="document-footer"><span>SIGAD · Reporte institucional</span><span>Información generada a partir de los registros disponibles al momento de la emisión</span></footer></main></body></html>`;
  w.document.open();w.document.write(html);w.document.close();w.focus();
};
$('#btnExportCsv').onclick=async()=>{const lines=[['MODULO','FECHA','DESCRIPCION','PAQUETES','EXPEDIENTES','METROS','ESTADO'].map(csvCell).join(',')];read(K.offices).filter(x=>x.status==='generado').forEach(x=>lines.push(['DEVOLUCION',x.date,x.number,total(x,'packages'),total(x,'files'),'','GENERADO'].map(csvCell).join(',')));read(K.transfers).forEach(x=>lines.push(['TRANSFERENCIA',x.date,x.destination,x.packages,'',x.meters,x.status].map(csvCell).join(',')));read(K.eliminations).forEach(x=>lines.push(['ELIMINACION',x.date,x.repos,x.packages,'',x.meters,x.status].map(csvCell).join(',')));try{const r=await window.SIGADOperational?.summary();if(r){for(const [k,label] of Object.entries({inventario:'INVENTARIO',reingresos:'REINGRESOS',traslados:'TRASLADOS',tarjetas:'TARJETAS',microformas:'MICROFORMAS'})){lines.push([label,'','Total de registros',r.counts[k]===null?'No disponible':r.counts[k],'','',''].map(csvCell).join(','));}for(const [repo,cantidad] of Object.entries(r.repos)){lines.push(['INVENTARIO','',repo,cantidad,'','',''].map(csvCell).join(','));}}}catch{}download(`SIGAD_consolidado_${today()}.csv`,new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}));log('Reporte CSV exportado','Consolidado general')};
function renderAudit(){const q=($('#auditSearch').value||'').toLowerCase(),lim=n($('#auditLimit').value)||50,a=read(K.audit).filter(x=>!q||(x.action+' '+x.detail).toLowerCase().includes(q)).slice(0,lim);$('#auditList').innerHTML='<div class="notice">Actividad local de los módulos propios de SIGAD. No constituye auditoría central inalterable.</div>'+ (a.length?a.map(x=>`<div class="audit-row"><span>${new Date(x.at).toLocaleString('es-PE')}</span><strong>${esc(x.action)}</strong><span>${esc(x.detail)}</span></div>`).join(''):'<div class="empty">No hay registros que coincidan.</div>')}
$('#auditSearch').oninput=renderAudit;$('#auditLimit').onchange=renderAudit;$('#btnExportAudit').onclick=()=>{const lines=[['FECHA_HORA','ACCION','DETALLE'].map(csvCell).join(',')].concat(read(K.audit).map(x=>[new Date(x.at).toLocaleString('es-PE'),x.action,x.detail].map(csvCell).join(',')));download(`SIGAD_auditoria_${today()}.csv`,new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}))};
$('#btnBackup').onclick=()=>openModal('backupModal');$('#btnExportBackup').onclick=()=>{const data={version:APP_VERSION,exportedAt:new Date().toISOString(),offices:read(K.offices),audit:read(K.audit),ranges:read(K.ranges),transfers:read(K.transfers),eliminations:read(K.eliminations)};download(`SIGAD_respaldo_${today()}.json`,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));log('Respaldo generado','JSON completo')};
$('#backupFile').onchange=()=>{alert('La restauración directa está deshabilitada para proteger los registros compartidos. Contacte al administrador para una importación validada.');$('#backupFile').value='';};
window.SIGAD={getData:()=>({offices:read(K.offices),transfers:read(K.transfers),eliminations:read(K.eliminations),ranges:read(K.ranges),audit:read(K.audit)}),viewOffice:(id)=>{const r=read(K.offices).find(x=>x.id===id);if(!r)return;loadOffice(id);$('#officePreview').innerHTML=previewHtml(r);openModal('previewModal')},navigate,loadOffice,duplicateOffice,deleteOffice,deleteRange,deleteTransfer,deleteElimination,log,toast,findPackage};
window.addEventListener('sigad:acceso-verificado',e=>{if(e.detail?.ready){window.SIGADCloud?.load?.().catch(err=>toast('No se pudieron consultar los registros compartidos: '+err.message,'error'));}else{document.querySelectorAll('.profile-name').forEach(x=>x.textContent='Usuario SIGAD');}});
window.addEventListener('sigad:datos-cargados',()=>{if(!currentOfficeId&&$('#officeNumber')?.dataset.autoOfficeNumber==='si')suggestNumber();renderDashboard();renderReports();renderAudit();renderHistory();renderTransfers();renderEliminations();renderArchivo360();});
newOffice();renderDashboard();
// Extensiones independientes: contraste accesible y depuración selectiva de registros.
// No modifican el funcionamiento de los módulos operativos.
const sigadContrast=document.createElement('link');
sigadContrast.rel='stylesheet';sigadContrast.href='assets/contraste-botones.css?v=20261016';document.head.appendChild(sigadContrast);
const sigadCleanScript=document.createElement('script');
sigadCleanScript.type='module';sigadCleanScript.src='js/limpieza-pruebas.js?v=20261016';document.head.appendChild(sigadCleanScript);
// Los módulos integrados se ejecutan dentro de un iframe: el CSS del padre no llega a ellos.
function sigadApplyIframeContrast(frame){
 try{
  if(!frame?.contentDocument?.head||!frame.contentDocument.documentElement)return;
  const doc=frame.contentDocument;
  if(!doc.getElementById('sigad-iframe-button-contrast')){
   const sheet=doc.createElement('link');sheet.id='sigad-iframe-button-contrast';sheet.rel='stylesheet';
   sheet.href=new URL('modulos/archivo/sigad-contraste.css?v=20261016',document.baseURI).href;
   doc.head.appendChild(sheet);
  }
  doc.documentElement.classList.toggle('sigad-host-dark',document.body.classList.contains('dark-theme'));
 }catch(e){console.warn('No fue posible aplicar contraste al módulo integrado',e);}
}
document.addEventListener('load',e=>{if(e.target?.matches?.('iframe.archive-frame'))sigadApplyIframeContrast(e.target);},true);
const sigadThemeObserver=new MutationObserver(()=>{
 document.querySelectorAll('iframe.archive-frame').forEach(sigadApplyIframeContrast);
});
sigadThemeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
document.querySelectorAll('iframe.archive-frame').forEach(sigadApplyIframeContrast);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
})();
