# Roadmap

## Objetivo

Este documento define la evolución planificada del proyecto.

No todas las ideas deben implementarse inmediatamente.

La prioridad es entregar un MVP sólido y estable antes de comenzar nuevas funcionalidades.

---

# Estado actual

## Backend

✅ User

✅ Auth

✅ Category

✅ Media

✅ News

✅ Video

✅ LiveSession

⬜ Playlist

⬜ Dashboard

⬜ Settings

---

## Frontend

⬜ Layout

⬜ Header

⬜ Footer

⬜ Home

⬜ News

⬜ Live Sessions

⬜ Videos

⬜ Playlists

⬜ Merch

⬜ Admin

---

# Fase 1 — MVP

Objetivo:

Publicar la primera versión funcional de Indie Now.

Debe permitir administrar el contenido y mostrarlo correctamente en el sitio público.

## Backend

- CRUD News
- CRUD Videos
- CRUD Live Sessions
- CRUD Playlists
- CRUD Categories
- CRUD Media
- Login
- JWT
- Panel administrativo

## Frontend

- Home
- Noticias
- Live Sessions
- Videos
- Playlists
- Merch
- Responsive
- SEO básico

---

# Fase 2 — Mejoras

Una vez publicado el MVP.

## Live Sessions

- Obtener automáticamente metadatos desde YouTube.
- Miniatura oficial.
- Duración.
- Fecha de publicación.
- videoId persistente.

## Videos

- Normalización completa de URLs.
- Mejoras en miniaturas.

## Home

- Secciones destacadas.
- Contenido recomendado.
- Mejor rendimiento.

---

# Fase 3 — Contenido enriquecido

## Live Sessions

Agregar:

- artista principal
- invitados
- canciones
- créditos
- fotografías
- ubicación
- fecha de grabación

## Videos

- etiquetas
- categorías múltiples
- contenido relacionado

## News

- noticias relacionadas
- contenido recomendado

---

# Fase 4 — Plataforma

Expandir Indie Now como plataforma.

## Usuarios

- perfiles

## Artistas

- página propia
- biografía
- redes sociales
- sesiones relacionadas

## Búsqueda

- búsqueda global

## Estadísticas

- vistas
- reproducciones
- métricas

## SEO

- OpenGraph
- Twitter Cards
- Sitemap
- RSS

---

# Fase 5 — Ecosistema

Funcionalidades de largo plazo.

- API pública
- Integraciones externas
- Automatizaciones
- Importadores
- Caché
- CDN
- Analíticas

---

# Integraciones futuras

Actualmente únicamente se contempla YouTube.

Más adelante podrían incorporarse:

- Spotify
- Apple Music
- YouTube Music
- Instagram
- TikTok
- Facebook

Cada integración deberá implementarse mediante providers independientes.

Nunca directamente desde los módulos.

---

# Principios

Antes de comenzar una nueva funcionalidad preguntarse:

¿Aporta valor al usuario del MVP?

Si la respuesta es no, probablemente pertenece a una fase posterior.

---

# Qué NO hacer

No implementar funcionalidades únicamente porque podrían ser útiles en el futuro.

Evitar:

- sobreingeniería
- optimizaciones prematuras
- arquitectura innecesariamente compleja
- nuevas dependencias sin justificación

---

# Filosofía

Indie Now debe crecer de forma incremental.

Cada versión debe ser completamente funcional antes de comenzar la siguiente.

La prioridad siempre será la calidad del código y la estabilidad del sistema por encima de la cantidad de funcionalidades.