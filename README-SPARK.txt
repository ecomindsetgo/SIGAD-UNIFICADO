SIGAD v1.9 — Administración de permisos en plan Spark (sin funciones de servidor)

1. Antes de publicar, respalde las reglas vigentes y exporte los datos críticos por los medios que tenga disponibles.
2. No copie automáticamente las reglas: revise primero las condiciones existentes. Las reglas adjuntas conservan la matriz histórica por nombre para usuarios sin permisos configurados y evitan que un usuario altere su nombre o rol para escalar privilegios.
3. Publique index.html, js/admin.js y los demás archivos en su repositorio GitHub Pages habitual. No es necesario crear repositorio nuevo.
4. Publique firestore.rules en Firestore > Reglas una vez revisadas y simuladas; compruebe lectura, escritura y denegaciones con un usuario autorizado y otro no autorizado.
5. Entre con su cuenta de UID MmniSKpNWPN2saVja2wVTPaiBnn2. Administración > Usuarios y permisos. Seleccione un usuario y guarde su matriz.
6. Las cuentas y contraseñas existentes no cambian. Altas, deshabilitación de cuentas y bajas de autenticación se hacen en la consola de Authentication; estas opciones NO están disponibles en el panel de Spark.
7. Los permisos personalizados se almacenan en usuarios/{uid}.permisos. Hasta guardar el usuario, la matriz histórica sigue vigente.
8. No eliminar ni modificar la colección usuarios o los registros históricos.
9. IMPORTANTE: El panel original SIGAD y el código heredado pueden seguir mostrando acciones sin respetar todos los permisos. Las reglas deben bloquear la operación aunque el botón siga visible. Deben realizarse pruebas antes de dar acceso a nuevos usuarios.
10. Firestore no ofrece por sí solo un historial inalterable de cambios administrativos realizados desde un navegador. Los campos de fecha y autor son orientativos; para auditoría confiable se necesitará un servicio confiable.
