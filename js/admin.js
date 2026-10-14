import {getFirestore,collection,getDocs,doc,getDocFromServer,updateDoc,serverTimestamp,query,orderBy,limit} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const ROOT='MmniSKpNWPN2saVja2wVTPaiBnn2';
const MODULES=['inventario','reingresos','traslados','tarjetas','microformas'];
const ACTIONS=['leer','crear','editar','eliminar'];
const LEGACY_WRITERS={
 inventario:['ALFREDO CRUZADO','ACRUZADO','ROBERTO DAVILA','RDAVILA','JORGE IZQUIERDO','JIZQUIERDO','MANUEL BARANDIARAN','MBARANDIARAN','TEOFILO GABINO','TGABINO'],
 reingresos:['ALFREDO CRUZADO','ACRUZADO','ROBERTO DAVILA','RDAVILA','JORGE IZQUIERDO','JIZQUIERDO','MANUEL BARANDIARAN','MBARANDIARAN'],
 traslados:['ALFREDO CRUZADO','ACRUZADO','ROBERTO DAVILA','RDAVILA','JORGE IZQUIERDO','JIZQUIERDO','MANUEL BARANDIARAN','MBARANDIARAN'],
 microformas:['ALFREDO CRUZADO','ACRUZADO'], tarjetas:[]
};
const $=id=>document.getElementById(id);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ctx,db,users=[],selected=null,initDone=false;
function legacy(user){const result={};for(const m of MODULES){result[m]={};for(const a of ACTIONS){result[m][a]=(a==='leer')||(a==='eliminar'?user.rol==='Administrador':m==='tarjetas'||LEGACY_WRITERS[m].includes(user.nombre));}}return result;}
function effective(user){if(user.permisos && typeof user.permisos==='object'){return Object.fromEntries(MODULES.map(m=>[m,Object.fromEntries(ACTIONS.map(a=>[a,user.permisos?.[m]?.[a]===true]))]));}return legacy(user);}
function notify(msg){$('ua-status').textContent=msg;}
function list(){let q=$('ua-search').value.trim().toLowerCase();$('ua-list').innerHTML=users.filter(u=>[u.nombre,u.email,u.id].some(v=>String(v||'').toLowerCase().includes(q))).map(u=>`<button class="ua-user ${u.id===selected?.id?'selected':''}" data-id="${escapeHtml(u.id)}" type="button"><strong>${escapeHtml(u.nombre||'Sin nombre')}${u.id===ROOT?' · Administrador General':''}</strong><small>${escapeHtml(u.email||u.rol||'Cuenta registrada')}</small></button>`).join('')||'<p>No se encontraron usuarios.</p>';$('ua-list').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(users.find(u=>u.id===b.dataset.id)));}
function select(user){selected=user;$('ua-form').hidden=false;$('ua-form-title').textContent='Permisos del usuario';$('ua-name').value=user.nombre||'';$('ua-uid').value=user.id;const perms=effective(user);$('ua-permissions').innerHTML=MODULES.map(m=>`<div class="ua-permission"><strong>${m[0].toUpperCase()+m.slice(1)}</strong><div class="ua-permission-options">${ACTIONS.map(a=>`<label><input type="checkbox" data-module="${m}" data-action="${a}" ${perms[m][a]?'checked':''}> ${a}</label>`).join('')}</div></div>`).join('');if(user.id===ROOT){$('ua-save').disabled=true;notify('La cuenta del Administrador General está protegida; sus privilegios no pueden retirarse desde este panel.');}else{$('ua-save').disabled=false;notify(user.permisos?'Permisos configurados. Puedes modificarlos.':'Se muestran los permisos originales; se conservarán hasta que guardes cambios.');}list();}
async function refresh(){if(ctx.auth.currentUser?.uid!==ROOT)return notify('Acceso no autorizado.');notify('Consultando usuarios…');try{const s=await getDocs(collection(db,'usuarios'));users=s.docs.map(d=>({id:d.id,...d.data()}));users.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));selected=null;$('ua-form').hidden=true;list();notify(`${users.length} cuentas registradas. No se han modificado sus permisos.`);}catch(e){notify(`No fue posible consultar los usuarios: ${e.code||e.message}`);}}
async function refreshRecoveries(){
 if(ctx?.auth.currentUser?.uid!==ROOT)return;
 const holder=$('ua-recovery-list'),status=$('ua-recovery-status');
 status.textContent='Cargando solicitudes…';
 try{
  const snap=await getDocs(query(collection(db,'solicitudes_recuperacion'),orderBy('creadoEn','desc'),limit(100)));
  holder.replaceChildren();
  for(const item of snap.docs){const d=item.data(),card=document.createElement('div');card.className='ua-user';
   const title=document.createElement('strong');title.textContent=d.correo||'Correo no indicado';card.append(title);
   const detail=document.createElement('small');detail.textContent='Estado: '+(d.estado||'pendiente')+' · '+(d.creadoEn?.toDate?.()?.toLocaleString('es-PE')||'Fecha pendiente');card.append(detail);
   if(d.estado==='pendiente'){
    const btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent='Marcar como atendida';
    btn.onclick=async()=>{if(!confirm('Confirma que verificaste la identidad y resolviste esta solicitud por un canal seguro. Esta acción NO cambia ninguna contraseña.'))return;
     btn.disabled=true;try{await updateDoc(doc(db,'solicitudes_recuperacion',item.id),{estado:'atendida',atendidoEn:serverTimestamp(),atendidoPor:ROOT});await refreshRecoveries();}catch(e){status.textContent='No se pudo actualizar: '+(e.code||e.message);btn.disabled=false;}};card.append(btn);
   }holder.append(card);
  }status.textContent=snap.size+' solicitudes encontradas (máximo 100 recientes). Las solicitudes NO validan por sí mismas la identidad del remitente.';
 }catch(e){status.textContent='Error al consultar solicitudes: '+(e.code||e.message);}
}
function init(){if(initDone)return;ctx=window.SIGADAuthContext;if(!ctx){setTimeout(init,150);return;}initDone=true;db=getFirestore(ctx.app);ctx.auth.onAuthStateChanged(u=>{const ok=u?.uid===ROOT;$('sigad-admin-entry').hidden=!ok;if(!ok){$('view-usuarios-admin').classList.remove('active');$('ua-form').hidden=true;users=[];selected=null;}});$('ua-refresh').onclick=refresh;$('ua-recovery-refresh').onclick=refreshRecoveries;$('ua-search').oninput=list;$('ua-cancel').onclick=()=>{selected=null;$('ua-form').hidden=true;list();};$('ua-form').onsubmit=async ev=>{ev.preventDefault();if(!selected||ctx.auth.currentUser?.uid!==ROOT||selected.id===ROOT)return;let perms={};$('ua-permissions').querySelectorAll('input[type=checkbox]').forEach(c=>{(perms[c.dataset.module]??={})[c.dataset.action]=c.checked;});if(!confirm(`¿Guardar los permisos de ${selected.nombre||selected.id}?`))return;try{notify('Guardando permisos…');await updateDoc(doc(db,'usuarios',selected.id),{permisos:perms,permisosActualizadosPor:ROOT,permisosActualizadosEn:serverTimestamp()});const saved=await getDocFromServer(doc(db,'usuarios',selected.id));
  if(!saved.exists())throw new Error('No se encontró el perfil después de guardar');
  const persisted=saved.data().permisos||{};
  const different=MODULES.some(m=>ACTIONS.some(a=>persisted?.[m]?.[a]!==perms?.[m]?.[a]));
  if(different)throw new Error('Los permisos recuperados del servidor no coinciden con los solicitados');await refresh();notify('Permisos guardados y verificados. El trabajador debe cerrar su sesión e ingresar nuevamente. Para que se apliquen al servidor, publica también firestore.rules.');}catch(e){notify(`No fue posible guardar: ${e.code||e.message}`);}};window.addEventListener('sigad:abrir-admin',()=>{refresh();refreshRecoveries();});}
init();
