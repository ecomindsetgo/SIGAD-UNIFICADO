SIGAD v0.4 · Panel de gestión y asistente
=======================================

Diseño adaptado a la referencia adjunta: menú oscuro con acentos vino,
panel central de indicadores y asistente lateral. En pantallas pequeñas
el menú y el asistente se abren con sus botones, sin reducir el contenido.

INICIO
1. Descomprima el ZIP completo.
2. Publique el contenido de esta carpeta en el mismo dominio y ruta de su
   SIGAD anterior, o use un servidor local: python -m http.server 8080
3. Abra http://localhost:8080 en el segundo caso.
   Abrir index.html directamente puede limitar las descargas Word y la PWA.
4. Antes de actualizar, descargue un respaldo desde Configuración.
   Se mantienen las mismas claves de datos locales de la versión 0.3.
   Al cambiar de dominio/navegador, restaure el respaldo JSON.

FUNCIONES NUEVAS
- Dashboard: periodo por año, actividad mensual por paquetes o registros,
  cobertura de repositorios, observaciones y actividad reciente.
- Accesos a los módulos existentes y a SAAMIR/SAMICERT.
- Búsqueda global con Ctrl+K (Cmd+K en Mac): módulos y oficios por número,
  destinatario o dependencia; consultas de paquetes mediante el asistente.
- Asistente lateral con consultas por número de oficio, ficha completa,
  referencias, dependencias, paquetes y expedientes, observaciones y acceso
  al documento. Si hay números repetidos entre años, muestra coincidencias.
- Resúmenes con filtro por año/mes y distinción de estados pendientes.
- Perfil local editable, tema claro/oscuro y navegación adaptable.
- Logo centrado mediante filtro visual sin caja blanca y favicon SVG
  transparente. Se conserva el archivo original del logo.

EJEMPLOS PARA EL ASISTENTE
¿De qué dependencia es el Oficio 001?
Muéstrame el oficio 010 de 2026
¿Cuántos oficios se generaron en septiembre de 2026?
¿Cuántos paquetes se transfirieron este año?
¿Qué eliminaciones se realizaron?
Genera un resumen de septiembre de 2026
¿Dónde está el paquete 14572R?
¿Dónde está el paquete 504-22T?

CRITERIOS DE LOS INDICADORES
Oficios: solo estado generado. Transferencias concluidas: Transferida,
Acta registrada o Finalizada. Eliminaciones concluidas: Concluida.
La actividad mensual utiliza la fecha del registro y esos mismos estados.
Las causas e índice de observación se calculan sobre los oficios generados
para el año seleccionado. El índice es observaciones / expedientes.
La cobertura por repositorio representa códigos de rangos configurados,
no inventario verificado ni movimientos netos. Se incluyen los 2,094
códigos de la parametrización Dunas original. No depende del año elegido.
Los registros de actividad reciente muestran todos los periodos.

ALCANCE REAL
Esta entrega mantiene el almacenamiento local del proyecto original.
El asistente es un motor local de consultas: no utiliza un modelo generativo
ni tiene acceso a datos que no estén registrados en este navegador.
SAAMIR/SAMICERT son enlaces externos; sus cifras no se inventan ni se
sincronizan. Firebase incluye solo configuración de ejemplo y reglas,
sin conexión multiusuario activada. El perfil visual no autentica usuarios.
Excel/PDF usan los componentes CDN del proyecto original y requieren
conexión para la primera carga. Word usa JSZip incluido en la carpeta.

Archivo 360 conserva el plano de Dunas, sus 44 anaqueles y rutas de la
versión recibida. Los demás repositorios utilizan rangos configurables.
Verifique la distribución física en campo antes de usarla como definitiva.

ARCHIVOS
index.html                 estructura y formularios
assets/dashboard.css       diseño del panel y adaptación móvil
js/dashboard.js            indicadores, búsqueda y asistente local
js/app.js                  lógica de oficios, registros, reportes y respaldo
js/archive360.js           plano y búsquedas de Archivo 360
service-worker.js          caché actualizada de archivos de la aplicación

VALIDACIÓN DE ESTA ENTREGA
Se probaron en Chromium: consultas detalladas de oficios 001/010,
coincidencias entre años, consulta sin resultados, filtro de periodo,
exclusión de procesos pendientes en totales concluidos, búsqueda global,
apertura del documento, ubicación de paquetes, generación de un oficio
y navegación móvil de todos los módulos. Sin errores JavaScript en esas
pruebas. Las pruebas utilizaron datos aislados que NO se incluyen en el ZIP.
No se verificó una conexión real a Firebase, SAAMIR o SAMICERT; no existe
una integración de datos activa con esas plataformas en esta versión.
