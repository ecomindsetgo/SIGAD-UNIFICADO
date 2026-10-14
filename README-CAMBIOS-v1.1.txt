SIGAD UNIFICADO v1.1 - ACCESO ÚNICO Y MENÚ AGRUPADO

- Inicio de sesión único para SIGAD mediante Firebase Authentication del proyecto usado por SAAMIR.
- Se eliminaron el formulario de login y el botón de cierre de sesión de las pantallas de operaciones.
- Botón general «Cerrar sesión» en el menú principal.
- Operaciones agrupadas en: Gestión de paquetes, Tarjetas de paquetes, Gestión documental y Administración.
- Módulos operativos originales permanecen en su estructura propia de SIGAD.
- SAMICERT se mantiene como enlace externo independiente.

IMPORTANTE: La autenticación de pantalla NO asegura ni migra automáticamente los módulos heredados de SIGAD que aún usan almacenamiento local del navegador. Para uso productivo institucional se requiere migrar esos registros a una base central, establecer reglas Firestore por rol, verificar permisos de la cuenta, pruebas de concurrencia y auditoría completa.
No publicar en producción sin validación. Al ingresar se utiliza una cuenta que tenga acceso al mismo proyecto Firebase usado en operaciones.
