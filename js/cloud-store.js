import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {getFirestore,collection,doc,getDocs,writeBatch,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const config={apiKey:'AIzaSyDaVsm4cs9O-R0plj1hk62Iy1uU2IYZLfc',authDomain:'sipa-d4ec9.firebaseapp.com',projectId:'sipa-d4ec9',storageBucket:'sipa-d4ec9.firebasestorage.app',messagingSenderId:'560354492263',appId:'1:560354492263:web:653ac26f811153537c79c2'};
const app=getApps()[0]||initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const collections={sigad_offices_v2:'sigad_oficios',sigad_transfers_v2:'sigad_transferencias',sigad_eliminations_v2:'sigad_eliminaciones',sigad_ranges_v2:'sigad_ubicaciones',sigad_audit_v2:'sigad_auditoria'};
let cache=new Map(),uid=null,loaded=false,loading=null,serial=Promise.resolve();
const copy=x=>structuredClone(x);
function check(){if(!loaded||!uid||auth.currentUser?.uid!==uid)throw Error('Sesión sin datos institucionales disponibles');}
async function load(){
 const user=auth.currentUser;if(!user)throw Error('Inicie sesión');
 if(loading)return loading;
 loaded=false;uid=user.uid;cache.clear();
 loading=(async()=>{
  for(const [key,col] of Object.entries(collections)){
   const snaps=key==='sigad_audit_v2' && user.uid!=='MmniSKpNWPN2saVja2wVTPaiBnn2' ? {docs:[]} : await getDocs(collection(db,col));
   if(auth.currentUser?.uid!==uid)throw Error('Cambió la sesión');
   cache.set(key,snaps.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>String(b.createdAt||b.at||'').localeCompare(String(a.createdAt||a.at||''))));
  }
  loaded=true;window.dispatchEvent(new Event('sigad:datos-cargados'));
 })().finally(()=>{loading=null});
 return loading;
}
async function writeCollection(key,newList){
 check();if(!collections[key])throw Error('Módulo desconocido');
 if(!Array.isArray(newList))throw Error('Formato de datos inválido');
 const old=cache.get(key)||[], oldMap=new Map(old.map(x=>[x.id,x])),newMap=new Map();
 for(const item of newList){if(!item.id||newMap.has(item.id))throw Error('Identificador duplicado o inválido');newMap.set(item.id,item)}
 const changes=[];
 for(const item of newList){const previous=oldMap.get(item.id);if(!previous||JSON.stringify(previous)!==JSON.stringify(item))changes.push(['set',item]);}
 for(const item of old)if(!newMap.has(item.id))changes.push(['delete',item]);
 // No afirmar éxito hasta la confirmación del servidor. Límite conservador de operaciones.
 for(let start=0;start<changes.length;start+=200){
  const batch=writeBatch(db);
  for(const [action,item] of changes.slice(start,start+200)){
   const ref=doc(db,collections[key],item.id);
   if(action==='delete')batch.delete(ref);
   else batch.set(ref,{...item,modificadoPor:uid,modificadoEn:Date.now()},{merge:true});
  }
  await batch.commit();
 }
 // Refrescar para evitar mostrar éxito si la lectura posterior está denegada.
 const snaps=await getDocs(collection(db,collections[key]));
 cache.set(key,snaps.docs.map(d=>({...d.data(),id:d.id})));
 window.dispatchEvent(new Event('sigad:datos-cargados'));
}
function write(key,list){const task=serial.then(()=>writeCollection(key,copy(list)));serial=task.catch(()=>{});return task;}
async function audit(event){
 check();const eventId=event.id||crypto.randomUUID();await setDoc(doc(db,collections.sigad_audit_v2,eventId),{...event,uid,fechaServidor:serverTimestamp()});
 const list=cache.get('sigad_audit_v2')||[];cache.set('sigad_audit_v2',[{...event,id:eventId,uid},...list]);
}
onAuthStateChanged(auth,user=>{if(!user||user.uid!==uid){uid=null;loaded=false;cache.clear();}});
window.addEventListener('sigad:acceso-verificado',e=>{if(e.detail?.ready)load().catch(err=>console.warn('No se pudieron cargar los registros compartidos',err));});
window.SIGADCloud={ready:()=>loaded&&uid===auth.currentUser?.uid,load,read:(key,f=[])=>copy(cache.get(key)??f),write,audit};
