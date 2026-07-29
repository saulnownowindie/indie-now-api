# Arquitectura del Backend

## Objetivo

La arquitectura del backend está diseñada para ser:

- Simple
- Modular
- Consistente
- Fácil de mantener
- Escalable

Se prioriza la claridad del código por encima de soluciones complejas o abstracciones innecesarias.

---

# Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Zod
- JWT
- bcrypt

---

# Arquitectura por módulos

Cada recurso del sistema debe implementarse como un módulo independiente.

Ejemplo:

```
src/modules/news
src/modules/video
src/modules/liveSession
src/modules/category
src/modules/media
src/modules/playlist
```

Todos los módulos siguen exactamente la misma estructura.

```
module/

controller.js
service.js
validation.js
routes.js
```

No agregar archivos adicionales salvo que exista una necesidad real.

---

# Responsabilidades

## Controller

El controller únicamente debe:

- recibir la petición HTTP
- llamar al service
- devolver la respuesta HTTP

No debe contener lógica de negocio.

No debe acceder directamente a Prisma.

No debe realizar validaciones manuales.

---

## Service

Toda la lógica del sistema pertenece al Service.

Aquí vive:

- consultas Prisma
- reglas de negocio
- relaciones
- normalización
- validaciones de negocio
- manejo de recursos

Los Services deben ser reutilizables y mantenerse independientes del protocolo HTTP.

---

## Validation

Cada módulo posee un archivo validation.js.

Se utiliza exclusivamente Zod.

Todas las validaciones de entrada deben realizarse aquí.

No validar manualmente dentro del controller.

---

## Routes

Routes únicamente conecta Express con los controllers.

No debe contener lógica.

---

# Flujo de una petición

```
HTTP Request

↓

Routes

↓

Validation

↓

Controller

↓

Service

↓

Prisma

↓

Response
```

---

# Prisma

Prisma es la única forma autorizada de acceder a la base de datos.

No utilizar consultas SQL directas salvo casos excepcionales aprobados.

Toda consulta debe realizarse desde los Services.

---

# Manejo de errores

Existe un middleware global para errores.

Los controllers no deben repetir bloques try/catch innecesarios.

Los errores conocidos de Prisma deben convertirse en respuestas HTTP apropiadas.

Ejemplos:

- P2002
- P2003
- P2025

---

# Relaciones

Cuando un recurso tenga relaciones útiles para el frontend, deben incluirse mediante Prisma.

Ejemplo:

```javascript
include: {
    author: true,
    coverImage: true,
    category: true
}
```

No devolver únicamente IDs cuando el frontend necesita información relacionada.

---

# Slugs

Todos los recursos públicos utilizan slugs.

Las URLs públicas nunca deben depender del ID interno.

Ejemplos:

```
/videos/mi-primer-video

/live-sessions/indie-session-01

/news/nuevo-lanzamiento
```

---

# Organización del código

Mantener funciones pequeñas.

Evitar funciones extremadamente largas.

Separar responsabilidades.

No duplicar lógica entre módulos.

Si una funcionalidad comienza a repetirse en varios módulos, moverla a:

```
src/utils
```

o

```
src/services
```

según corresponda.

---

# Utilidades compartidas

Las funciones reutilizables deben ubicarse en:

```
src/utils
```

Ejemplo:

```
youtube.js
slug.js
pagination.js
```

Las utilidades no deben depender de Express.

---

# Integraciones externas

Toda integración con servicios externos debe aislarse.

Ejemplo:

```
src/integrations/

youtube/
spotify/
instagram/
```

Los módulos nunca deben comunicarse directamente con APIs externas.

Siempre deben hacerlo mediante providers o servicios específicos.

Esto permite reemplazar implementaciones sin modificar la lógica del negocio.

---

# Convenciones

Se utilizan:

- camelCase para variables y funciones
- PascalCase para modelos Prisma
- kebab-case para rutas HTTP

Ejemplo:

```
/live-sessions
```

---

# Principios

Siempre priorizar:

1. Claridad
2. Consistencia
3. Mantenibilidad
4. Escalabilidad

Nunca sacrificar estos principios por ahorrar unas pocas líneas de código.

---

# Qué evitar

Evitar:

- lógica en controllers
- validaciones manuales
- duplicación de código
- dependencias innecesarias
- sobreingeniería
- abstracciones prematuras

---

# Filosofía

El proyecto debe poder ser comprendido rápidamente por cualquier desarrollador.

La mejor solución suele ser la más simple que resuelve correctamente el problema.

Antes de introducir nuevos patrones o tecnologías, preguntarse:

"¿Realmente resuelve un problema actual o solo un problema hipotético?"