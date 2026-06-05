# Estudio Enzetti — Sitio Web Oficial

Landing page de **Estudio Enzetti** (Buenos Aires, Argentina), especializado en derecho laboral, accidentes de trabajo (ART), enfermedades profesionales y tránsito.

Este proyecto fue desarrollado bajo una arquitectura orientada al rendimiento, la automatización y la robustez técnica en producción.

---

## Features

- **Exibición de los servicios**: Para accidentes laborales, enfermedades profesionales y siniestros viales.
- **Contacto directo**: Integración de widget interactivo de WhatsApp y accesos directos a llamadas/mensajes.
- **Contenido multimedia**: Sección integrada para la reproducción de videos explicativos del equipo de abogados.
- **Integración con redes sociales**: Showcase de las últimas publicaciones de Instagram y videos de TikTok.
- **Testimonios**: Visualización de reseñas reales de Google y calificación promedio del estudio.
- **Preguntas frecuentes**: Sistema de acordeón fluido para resolver dudas recurrentes de forma rápida.
- **Optimización de SEO y Search Console**: Configuración avanzada para buscadores con sitemap automático, metaetiquetas index/noindex dinámicas y verificación integrada para Search Console.

---

## Estrategias

- **Enfoque Mobile-First & Responsive**: Dado que más del **85% del tráfico** proviene de dispositivos móviles, el diseño y la optimización de las interacciones se estructuraron priorizando las pantallas chicas, asegurando fluidez y adaptabilidad total (100% responsive).
- **Rendimiento e ISR Diario (Evitar Rate Limiting)**: La configuración de Astro utiliza **Incremental Static Regeneration (ISR)** con expiración diaria (`60 * 60 * 24` en Vercel). Esto almacena en caché en el borde (Edge) los datos dinámicos de Instagram, TikTok y Google Places por 24 horas. Los usuarios reciben la página al instante sin necesidad de consultar las APIs externas en cada visita, previniendo además bloqueos por límites de peticiones (rate limits).
- **Tokens Autorrenovables**: Implementación de un flujo transparente para actualizar credenciales de redes sociales. Un endpoint expuesto seguro interactúa con las APIs y se ejecuta de manera periódica a través de un cron job de Vercel, actualizando las variables de entorno e iniciando un nuevo despliegue.
- **Monitoreo y Observabilidad**: Integración de **Sentry** tanto en el lado del servidor como en el cliente. Captura errores automáticamente y reporta métricas de performance para mantener el sitio estable y libre de caídas.
- **Cumplimiento de Web Design Guidelines**:
  - **Accesibilidad**: Navegación amigable por teclado, uso de marcado HTML5 semántico en lugar de divitis, y etiquetado explícito de componentes visuales.
  - **Optimización de Carga**: Cero Cumulative Layout Shift (CLS) especificando dimensiones en imágenes, y carga diferida (`loading="lazy"`) en componentes por debajo de la pantalla inicial.
  - **Tipografía y Textos**: Uso de tipografías equilibradas (Lora y Plus Jakarta Sans), balanceando el renderizado de títulos (`text-wrap: balance`) para evitar palabras huérfanas en celulares.

---

## Tech Stack

- **Astro 5** as the web framework (hybrid SSR/static rendering).
- **Tailwind CSS v4** as the CSS styling engine.
- **Motion** for client-side animations and micro-interactions.
- **Mux Video** for optimized video assets and streaming.
- **Sentry** for client/server observability and error tracking.
- **Google Places API** for dynamically fetching customer reviews.
- **Instagram Graph & TikTok Web APIs** for social feed integrations.
- **TypeScript** as the programming language.
- **Vercel** for deployment and serverless edge functions.

---

## Desarrollo y Configuración

Si vas a realizar tareas de desarrollo o estás usando un agente de IA en este proyecto:

- Podés consultar los comandos de inicio rápido y la configuración del entorno en [GEMINI.md](./GEMINI.md).
- Los lineamientos de arquitectura, estilo de código y seguridad detallados están disponibles en la carpeta `.gemini/rules/`.

---

## Licencia y Propiedad Intelectual

**Este repositorio es público exclusivamente con fines de portfolio y transparencia.**

Todos los derechos de código fuente, diseño visual, textos y archivos asociados son propiedad de Juan Cruz Roldan. Queda prohibida la copia, distribución o uso (comercial o de cualquier otra índole) sin autorización expresa por escrito del propietario.
