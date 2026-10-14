# Instagram y renovación automática

El cron de Vercel llama a `/api/refresh-instagram-token` cada lunes a las 13:00 UTC
(10:00 en Argentina). La ruta exige `Authorization: Bearer <CRON_SECRET>`.

## Instagram Login

Para la renovación periódica, usar un token de larga duración obtenido con
**Instagram API con Instagram Login** en la app de Meta. El token obtenido con
Facebook Login en Graph API Explorer pertenece a otro flujo.

1. En la app de Meta, configurar Instagram API con Instagram Login y autorizar la
   cuenta profesional del estudio con el permiso `instagram_business_basic`.
2. Generar un token de larga duración desde esa configuración. Si se obtiene un
   token corto mediante OAuth, intercambiarlo por uno largo antes de activarlo.
3. Validar el perfil y las publicaciones con `graph.instagram.com` antes de
   cambiar las variables de producción.
4. Configurar `INSTAGRAM_AUTH_MODE=instagram` e `INSTAGRAM_ACCESS_TOKEN` con ese
   token en Vercel. El servicio consulta `/me`, para no reutilizar por error el ID
   del flujo de Facebook Login.
5. Desplegar nuevamente para aplicar las variables.

Los tokens de larga duración de Instagram deben tener al menos 24 horas y seguir
vigentes para renovarse. La ejecución semanal deja margen antes de su vencimiento.
Un token vencido o revocado requiere volver a autorizar la cuenta.

El servicio renueva con `GET https://graph.instagram.com/refresh_access_token`,
`grant_type=ig_refresh_token`. Verifica que la respuesta tenga una duración larga
y que el token pueda leer el perfil antes de guardarlo en Vercel. El cron actualiza
la variable e inicia un despliegue de **producción**. Devuelve `expiresAt` y
`expiresIn`, sin exponer el token.

## Variables del cron

- `CRON_SECRET`: autorización de Vercel Cron.
- `VERCEL_TOKEN`: credencial con acceso al proyecto y permiso para actualizar sus
  variables y crear despliegues.
- `VERCEL_PROJECT_ID`: proyecto del sitio.
- `VERCEL_INSTAGRAM_ENV_ID`: ID de la variable `INSTAGRAM_ACCESS_TOKEN` destinada a
  producción; no es el ID de la cuenta de Instagram.
- `INSTAGRAM_ACCESS_TOKEN`: token largo de Instagram Login.
- `INSTAGRAM_AUTH_MODE`: `instagram` para activar este flujo.
- `INSTAGRAM_GRAPH_API_VERSION`: opcional, `v22.0` por defecto.

## Compatibilidad con Facebook Login

Si `INSTAGRAM_AUTH_MODE` no está definido, el feed conserva Facebook Login. Este
modo necesita además `INSTAGRAM_USER_ID`, `META_APP_ID` y `META_APP_SECRET`.

El cron inspecciona el token de Facebook antes y después del canje. Si Meta entrega
otro token con el mismo vencimiento, la operación falla y Sentry registra el error:
no se sobrescribe el token de Vercel, no se despliega y no se reporta una renovación
exitosa. Para la renovación periódica de Instagram, migrar al flujo anterior.

## Verificación

### Logs del cron en Sentry

El servidor envía logs estructurados directamente a Sentry. En Explore → Logs,
filtrar por `service:instagram-cron` y luego por `run_id` para seguir una ejecución.
Cada intento registra `step`, `attempt`, `duration_ms` y si habrá otro reintento.
Las operaciones de Vercel registran `operation`, `http_status`, `error_code` cuando
hay rechazo y `deployment_id` cuando Vercel acepta el redeploy. La aceptación no
implica que el build haya terminado correctamente.

Se envían los registros al finalizar cada intento y antes de responder, con un
timeout de dos segundos para vaciar la cola de Sentry. Un corte abrupto puede perder los últimos
registros; los pasos ya enviados permiten localizar hasta dónde avanzó el cron.
No se capturan automáticamente los mensajes de consola ni se envían tokens,
cabeceras, URLs de solicitudes o cuerpos de respuestas de Vercel.
Estos logs requieren desplegar los cambios; no reconstruyen ejecuciones anteriores.

Ejecutar `npm run astro -- check` y `npm run build`. Luego de que el token
inicial tenga al menos 24 horas, probar la ruta con su autorización y verificar la
fecha devuelta, el despliegue de producción y el monitor de Sentry.

Referencias de Meta:

- [Instagram API con Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started/)
- [Renovar el token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/)
