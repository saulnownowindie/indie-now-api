# Convenciones de la API

## Objetivo

Este documento define las reglas de implementación para todos los módulos del backend.

Todos los recursos deben seguir las mismas convenciones para mantener una API consistente y fácil de mantener.

---

# Principios

Toda la API debe ser:

- Consistente
- Predecible
- RESTful
- Fácil de consumir
- Fácil de extender

---

# Recursos

Cada recurso representa un modelo del sistema.

Ejemplos:

```
/news

/videos

/live-sessions

/playlists

/categories

/media
```

No mezclar responsabilidades entre recursos.

---

# Endpoints

Todos los módulos CRUD deben seguir la misma estructura.

## Obtener colección

```
GET /resource
```

Ejemplo:

```
GET /api/news

GET /api/videos

GET /api/live-sessions
```

---

## Obtener un recurso

Siempre mediante slug público.

```
GET /resource/:slug
```

Ejemplo

```
GET /api/news/nuevo-album

GET /api/live-sessions/session-01
```

No utilizar IDs en URLs públicas.

---

## Crear

```
POST /resource
```

---

## Actualizar

```
PUT /resource/:id
```

El ID interno puede utilizarse únicamente para operaciones administrativas.

---

## Eliminar

```
DELETE /resource/:id
```

---

# Slugs

Todos los recursos públicos utilizan slug.

Los slugs deben ser:

- únicos
- legibles
- estables

La generación del slug pertenece al Service.

Nunca al Controller.

---

# Estado de publicación

Los modelos públicos utilizan:

```
status
```

Ejemplo:

```
DRAFT

PUBLISHED

ARCHIVED
```

Los recursos no publicados no deben mostrarse en el sitio público.

---

# Featured

Algunos modelos permiten marcar contenido destacado.

```
featured = true
```

Esto permite construir bloques destacados en la Home.

No crear lógica especial para ello cuando un simple filtro sea suficiente.

---

# Relaciones

Siempre incluir las relaciones que necesita el frontend.

Ejemplo:

```javascript
include: {
    author: true,
    coverImage: true,
    category: true
}
```

Evitar respuestas con únicamente IDs cuando el frontend necesita información relacionada.

---

# Validaciones

Todas las validaciones deben realizarse mediante Zod.

Cada módulo posee su propio archivo:

```
validation.js
```

No validar manualmente dentro del Controller.

---

# Controllers

El Controller únicamente debe:

- recibir request
- llamar al Service
- responder HTTP

No contiene reglas de negocio.

No accede a Prisma.

No transforma datos.

---

# Services

El Service contiene:

- lógica de negocio
- Prisma
- relaciones
- normalización
- generación de slug
- validaciones de negocio

Toda decisión importante pertenece al Service.

---

# Prisma

Todo acceso a la base de datos debe realizarse mediante Prisma.

No utilizar SQL directo salvo casos excepcionales.

---

# Manejo de errores

Los errores se manejan mediante el middleware global.

Los módulos no deben repetir bloques try/catch innecesarios.

Errores comunes:

- P2002
- P2003
- P2025

---

# Media

Los módulos que utilicen imágenes deben validar:

- existencia del recurso
- tipo IMAGE

No aceptar otros tipos de Media cuando el campo requiere imágenes.

---

# YouTube

Toda lógica relacionada con YouTube pertenece a:

```
src/utils/youtube.js
```

Actualmente esta utilidad debe:

- validar URLs
- normalizar URLs
- extraer videoId

No realiza llamadas externas.

---

# Integraciones

Las APIs externas deben implementarse mediante providers.

Ejemplo:

```
src/integrations/youtube/
```

Los módulos nunca deben depender directamente de servicios externos.

---

# Respuestas

Las respuestas deben mantener un formato consistente.

Ejemplo:

```json
{
  "id": "...",
  "title": "...",
  "slug": "...",
  "status": "PUBLISHED"
}
```

Evitar devolver información innecesaria.

---

# Consistencia

Antes de crear un módulo nuevo, revisar cómo funcionan:

- News
- Video
- LiveSession

Los nuevos módulos deben seguir el mismo estilo de implementación.

---

# Futuras extensiones

Cuando una nueva funcionalidad pueda implementarse sin romper la arquitectura existente, debe preferirse esa opción.

No rediseñar módulos completos para agregar una única característica.

---

# Regla general

Si una implementación rompe la consistencia del resto de la API, probablemente no sea la mejor solución.

La prioridad es mantener una arquitectura uniforme entre todos los módulos.