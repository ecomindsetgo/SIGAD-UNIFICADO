import {getAuth,onAuthStateChanged,updatePassword,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {getFirestore,doc,getDoc,updateDoc,addDoc,collection,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const root='MmniSKpNWPN2saVja2wVTPaiBnn2';
const auth=getAuth(),db=getFirestore();const el=id=>document.getElementById(id);
const gate=el('sigad-password-gate'),form=el('sigad-password-form'),out=el('sigad-password-status');
let checkSequence=0,required=false,ready=false,verifiedUID=null;
function broadcast(){window.dispatchEvent(new CustomEvent('sigad:acceso-verificado',{detail:{uid:verifiedUID,ready,required}}));}
function lock(show=false){required=show;ready=false;verifiedUID=null;document.body.classList.add('sigad-password-checking');document.body.classList.toggle('sigad-password-required',show);gate.hidden=!show;broadcast();}
function unlock(uid){required=false;ready=true;verifiedUID=uid;document.body.classList.remove('sigad-password-required','sigad-password-checking');gate.hidden=true;broadcast();}
window.SIGADPasswordGate={isRequired:()=>required,isReady:()=>ready,uid:()=>verifiedUID};
// Each change of account invalidates the previous asynchronous profile check.
onAuthStateChanged(auth,async user=>{
 const n=++checkSequence;
 ready=false;verifiedUID=null;document.body.classList.add('sigad-password-checking');broadcast();
 if(!user){required=false;gate.hidden=true;document.body.classList.remove('sigad-password-required');el('sigad-password-identity').textContent='';broadcast();return;}
 lock(false);
 el('sigad-password-identity').textContent='Sesión actual: '+(user.email||'Cuenta sin correo')+' · UID: '+user.uid;
 out.textContent='Verificando el estado de esta cuenta…';
 try{
  const snap=await getDoc(doc(db,'usuarios',user.uid));
  if(n!==checkSequence||auth.currentUser?.uid!==user.uid)return;
  if(!snap.exists()){lock(true);out.textContent='No se encontró tu perfil de usuario. Comunícate con el administrador.';return;}
  if(snap.data().cambioClavePendiente===true){lock(true);out.textContent='Esta cuenta debe actualizar su contraseña. Si no eres tú, cierra sesión.';return;}
  out.textContent='';unlock(user.uid);
 }catch(e){if(n===checkSequence){lock(true);out.textContent='No se pudo verificar el perfil. Comprueba tu conexión e inténtalo nuevamente.';}}
});
form.addEventListener('submit',async e=>{e.preventDefault();const user=auth.currentUser;if(!user)return;const a=form.elements.newPassword.value,b=form.elements.confirmPassword.value;if(a.length<8 || !/[A-ZÁÉÍÓÚÑ]/.test(a) || !/[a-záéíóúñ]/.test(a) || !/[^\p{L}\p{N}\s]/u.test(a)){out.textContent='La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un carácter especial.';return;}if(a!==b){out.textContent='Las contraseñas no coinciden.';return;}const btn=form.querySelector('button[type=submit]');btn.disabled=true;out.textContent='Actualizando contraseña…';try{await updatePassword(user,a);await updateDoc(doc(db,'usuarios',user.uid),{cambioClavePendiente:false,cambioClaveActualizadaEn:serverTimestamp()});form.reset();out.textContent='Contraseña actualizada.';unlock(user.uid);}catch(err){out.textContent=err.code==='auth/requires-recent-login'?'Debes volver a iniciar sesión con la contraseña temporal antes de continuar.':'No se completó el cambio. La contraseña pudo actualizarse aunque no se guardara la confirmación. Contacta al administrador si persiste: '+(err.code||err.message);}finally{btn.disabled=false;}});
el('sigad-password-logout').onclick=()=>signOut(auth);
el('sigad-forgot-password').onclick=async()=>{const email=window.prompt('Correo de tu cuenta SIGAD:');if(!email)return;try{auth.languageCode='es';await sendPasswordResetEmail(auth,email.trim());el('sigad-login-feedback').textContent='Si existe una cuenta asociada y el correo puede recibir mensajes, llegará un enlace de recuperación.';}catch(err){el('sigad-login-feedback').textContent='No se pudo solicitar la recuperación: '+(err.code||'Comprueba tu conexión.');}};

// Solicitud de asistencia sin iniciar sesión: no requiere conocer el UID del usuario.
const helpForm=el('sigad-help-form'),helpStatus=el('sigad-help-feedback');
el('sigad-request-help').onclick=()=>{helpForm.hidden=false;helpForm.elements.email.value=el('sigad-login-form').elements.email.value||'';helpStatus.textContent='Tu solicitud se registrará para revisión. No se enviará ninguna contraseña.';};
el('sigad-help-cancel').onclick=()=>{helpForm.hidden=true;helpStatus.textContent='';};
helpForm.addEventListener('submit',async event=>{
 event.preventDefault();const email=helpForm.elements.email.value.trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return;
 const btn=helpForm.querySelector('button[type=submit]');btn.disabled=true;helpStatus.textContent='Registrando solicitud…';
 try{
  // Barrera de duplicaciones accidentales en este navegador, no protección antispam del servidor.
  const key='sigad-help-'+email;const last=Number(localStorage.getItem(key)||0);
  if(Date.now()-last<15*60*1000){helpStatus.textContent='Ya registraste una solicitud recientemente. Espera 15 minutos o comunícate con el administrador.';return;}
  await addDoc(collection(db,'solicitudes_recuperacion'),{correo:email,estado:'pendiente',origen:'portal_sigad',creadoEn:serverTimestamp()});
  localStorage.setItem(key,String(Date.now()));helpStatus.textContent='Solicitud recibida. Comunícate con el administrador por el canal institucional para verificar tu identidad. No se enviará una clave por esta pantalla.';helpForm.reset();helpForm.hidden=true;
 }catch(err){helpStatus.textContent=err.code==='permission-denied'?'La recepción de solicitudes todavía no está habilitada en el sistema. Comunícate con el administrador por el canal institucional.':'No se pudo registrar la solicitud ('+(err.code||'error de conexión')+'). Contacta al administrador por el canal habitual.';}
 finally{btn.disabled=false;}
});
