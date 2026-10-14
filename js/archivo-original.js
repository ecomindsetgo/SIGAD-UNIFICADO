// The unmodified original operational engine remains in modulos/archivo/.
// A single embedded instance is moved between SIGAD views so forms survive navigation.
(()=>{
 const routes={inventario:'view-inventario','consultar-inventario':'view-consultas',reingresos:'view-reingresos','consultar-reingresos':'view-consultas-reingresos',traslados:'view-traslados','consultar-traslados':'view-consultas-traslados',tarjetas:'view-tarjetas','consultar-tarjetas':'view-consultas-tarjetas',microformas:'view-microformas'};
 window.SIGADLegacyModuleViews=Object.keys(routes);
 const frame=document.createElement('iframe');frame.className='archive-frame';frame.title='Operaciones documentales';frame.setAttribute('allow','clipboard-write');let loaded=false,selected=null,frameUID=null;
 function move(key){if(!window.SIGADPasswordGate?.isReady())return;const authUID=window.SIGADPasswordGate.uid();if(frameUID!==authUID){frame.removeAttribute('src');loaded=false;frameUID=authUID;}const host=document.querySelector(`[data-archive-view="${key}"]`);if(!host)return;selected=key;host.append(frame);if(!loaded){frame.src='modulos/archivo/index.html';loaded=true;}else send();}
 function send(){if(!selected||!frame.contentWindow)return;frame.contentWindow.postMessage({source:'sigad-host',view:routes[selected]},location.origin)}
 frame.addEventListener('load',()=>setTimeout(send,250));window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.source==='sigad-archive'&&e.data.type==='ready')send()});
 document.querySelectorAll('[data-archive-view] iframe').forEach(f=>f.remove());
 // SIGAD dispatches the normal module navigation event.
 window.addEventListener('sigad:modulo',e=>{if(routes[e.detail])move(e.detail)});
 window.addEventListener('sigad:acceso-verificado',e=>{if(!e.detail?.ready){frame.remove();frame.removeAttribute('src');loaded=false;frameUID=null;return;}const active=Object.keys(routes).find(k=>document.getElementById('view-'+k)?.classList.contains('active'));if(active)move(active);});
 // Safeguard for layouts that switch class without dispatching.
 document.querySelectorAll('.nav-item[data-view]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.view;if(routes[key])setTimeout(()=>move(key),10)}));
 const current=Object.keys(routes).find(k=>document.getElementById('view-'+k)?.classList.contains('active'));
 if(current)move(current);
})();