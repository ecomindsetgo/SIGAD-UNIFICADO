SIGAD UNIFICADO V1 - VERSION DE PRUEBA (14/10/2026)

PRUEBA: Subir el CONTENIDO de esta carpeta a un repositorio privado o servirlo localmente con python -m http.server 8000 y abrir http://localhost:8000

REALIZADO:
- Diseño principal de SIGAD v0.4 conservado.
- Nueve pantallas integradas dentro del menú SIGAD (sin iframe ni enlace SAAMIR).
- Acceso directo a colecciones originales de SAAMIR en Firebase mediante su autenticación.
- Consulta y búsqueda de inventarios, reingresos, traslados, tarjetas y microformas; exportación CSV.
- Formularios nuevos de captura simplificada; los correlativos de reingresos y traslados se asignan en transacciones Firestore.
- Búsqueda de movimientos por código exacto de paquete en Auditoría; eventos nuevos en colección sigad_eventos cuando los permisos lo permiten.
- SAMICERT permanece como enlace independiente.

LIMITACIONES IMPORTANTES:
- No es producción y NO está certificada 100% funcional: hace falta prueba real con cuentas, Firebase, reglas, y datos existentes.
- Los formularios son simplificados: no han migrado las funcionalidades avanzadas (PDFs institucionales, carga múltiple, rangos, edición, filtros especializados, reportes originales de SAAMIR).
- SIGAD v0.4 sigue guardando devolución de cargos, transferencias documentales y eliminación en localStorage. Su migración a Firebase, login común y permisos institucionales está pendiente.
- La línea de tiempo cubre coincidencias exactas; no recorre íntegramente rangos de paquetes. No hay conexión API verificada con SAMICERT.
- La auditoría transversal requiere reglas Firestore para sigad_eventos, y no sustituye los registros históricos.
- Los archivos locales de SIGAD no se borran por instalar este proyecto, pero un origen web nuevo no ve automáticamente el localStorage de otro dominio.
- La versión incluye configuración pública de Firebase (típica de aplicaciones web). Seguridad debe implementarse con Firestore Rules y permisos, no ocultando apiKey.
- Hacer copia de seguridad ANTES de cualquier operación en producción. No utilizar formularios de prueba en datos productivos sin autorización.

PUNTOS A VERIFICAR: autenticación, reglas sobre colecciones existentes, validaciones de formatos, integridad de correlativos, compatibilidad de PDFs, trazabilidad e importación de datos.
