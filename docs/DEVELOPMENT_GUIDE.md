# Guía de Desarrollo

## Objetivo

Este documento define las reglas de desarrollo del proyecto.

Todo cambio realizado por desarrolladores o asistentes de IA (Codex, Cursor, ChatGPT, etc.) debe respetar estas reglas.

En caso de conflicto, estas reglas tienen prioridad sobre cualquier suposición.

---

# Antes de comenzar

Antes de implementar una nueva funcionalidad, revisar:

- docs/PROJECT_CONTEXT.md
- docs/ARCHITECTURE.md
- docs/CONTENT_MODEL.md
- docs/API_CONVENTIONS.md
- docs/DECISIONS.md (si existe)

No asumir comportamientos que no estén documentados.

---

# Filosofía

El proyecto prioriza:

- simplicidad
- consistencia
- legibilidad
- mantenibilidad

No se busca impresionar con patrones de diseño complejos.

Se busca un código fácil de entender dentro de seis meses.

---

# Arquitectura

Todos los módulos siguen exactamente la misma estructura.

```
module/

controller.js
service.js
validation.js
routes.js
```

No agregar nuevas capas sin una razón clara.

---

# Controllers

Los controllers únicamente deben:

- recibir la petición
- llamar al service
- responder

No deben:

- acceder a Prisma
- contener lógica de negocio
- validar manualmente
- transformar datos complejos

---

# Services

Toda la lógica pertenece al Service.

Ejemplos:

- consultas Prisma
- reglas de negocio
- generación de slug
- relaciones
- normalización
- validaciones de negocio

---

# Validation

Todas las entradas deben validarse mediante Zod.

Cada módulo mantiene su propio validation.js.

No duplicar validaciones.

---

# Prisma

No modificar:

- schema.prisma

No crear:

- migraciones

salvo que la tarea lo solicite explícitamente.

---

# Base de datos

Toda interacción con la base de datos debe realizarse mediante Prisma.

No utilizar SQL directo salvo casos excepcionales.

---

# Dependencias

No instalar nuevas librerías sin aprobación.

Antes de agregar una dependencia preguntarse:

¿Puede resolverse utilizando las herramientas actuales?

---

# Refactors

No realizar refactors masivos mientras se implementa una funcionalidad.

Si detectas un problema estructural:

- documentarlo
- proponer una solución

No modificar grandes partes del proyecto sin aprobación.

---

# Reutilización

Antes de escribir código nuevo comprobar si ya existe una utilidad reutilizable.

Ejemplos:

```
src/utils

src/services
```

No duplicar funciones.

---

# YouTube

Toda la lógica relacionada con YouTube debe concentrarse en:

```
src/utils/youtube.js
```

Las futuras integraciones externas deberán implementarse mediante providers.

No llamar APIs externas directamente desde los módulos.

---

# Live Sessions

Las Live Sessions son un contenido propio de Indie Now.

No son un subtipo de Video.

No fusionar ambos módulos.

---

# Estilo de código

Priorizar:

- nombres descriptivos
- funciones pequeñas
- responsabilidad única
- consistencia

Evitar abreviaturas innecesarias.

---

# Comentarios

No agregar comentarios para explicar código obvio.

Solo comentar cuando:

- exista una decisión de negocio importante
- exista una limitación técnica
- sea necesario explicar una decisión arquitectónica

El código debe ser suficientemente claro por sí mismo.

---

# Errores

Utilizar el middleware global.

No repetir bloques try/catch innecesarios.

---

# Respuestas HTTP

Mantener el mismo formato utilizado por el resto de la API.

No inventar estructuras distintas para cada módulo.

---

# Cambios permitidos

Durante una implementación normal se puede:

- crear nuevos módulos
- modificar servicios relacionados
- agregar validaciones
- mejorar legibilidad
- reutilizar utilidades

---

# Cambios que requieren aprobación

No realizar sin aprobación:

- modificar schema.prisma
- crear migraciones
- instalar dependencias
- cambiar arquitectura
- modificar autenticación
- eliminar módulos
- cambiar convenciones

---

# Calidad

Antes de dar una tarea por terminada comprobar:

- Prisma valida correctamente
- No existen errores de sintaxis
- No hay código duplicado evidente
- Se mantiene la arquitectura del proyecto
- Se respetan las convenciones

---

# Objetivo final

Cada nuevo módulo debe parecer escrito por la misma persona.

La consistencia del proyecto es más importante que las preferencias individuales del desarrollador o del asistente de IA.