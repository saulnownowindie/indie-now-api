# Registro de Decisiones Arquitectónicas

> Este documento registra las decisiones importantes del proyecto y la razón detrás de ellas.
>
> No es un changelog.
> No es un roadmap.
>
> Su objetivo es evitar volver a discutir decisiones ya tomadas y preservar el contexto del proyecto.

---

# ADR-001
## Arquitectura modular

Estado

✅ Aprobado

---

### Decisión

Todo recurso del sistema se implementará como un módulo independiente.

Cada módulo seguirá la estructura:

```
controller.js
service.js
validation.js
routes.js
```

---

### Motivo

Mantener consistencia.

Facilitar mantenimiento.

Reducir curva de aprendizaje.

---

# ADR-002
## Prisma como única capa de acceso a datos

Estado

✅ Aprobado

---

### Decisión

Toda consulta a la base de datos debe realizarse mediante Prisma.

No utilizar SQL directo salvo casos excepcionales.

---

### Motivo

- mantenibilidad
- tipado
- migraciones
- menor complejidad

---

# ADR-003
## Slugs públicos

Estado

✅ Aprobado

---

### Decisión

Las URLs públicas utilizan slugs.

Los IDs solo se utilizan para administración.

Ejemplo:

```
/videos/entrevista-a-wallows
```

No:

```
/videos/15
```

---

### Motivo

- SEO
- URLs legibles
- estabilidad

---

# ADR-004
## LiveSession es un módulo independiente

Estado

✅ Aprobado

---

### Decisión

LiveSession NO es un subtipo de Video.

Es un módulo propio.

---

### Motivo

Representa una producción original de Indie Now.

Tiene reglas de negocio distintas.

En el futuro incorporará información propia como:

- artista
- invitados
- canciones
- créditos
- fotografías
- ubicación
- fecha de grabación

Mantenerlo independiente evita mezclar responsabilidades.

---

# ADR-005
## Videos y Live Sessions comparten utilidades

Estado

✅ Aprobado

---

### Decisión

Toda lógica relacionada con YouTube se concentra en:

```
src/utils/youtube.js
```

---

### Motivo

Evitar duplicación.

Permitir reutilización.

Facilitar futuras integraciones.

---

# ADR-006
## Integraciones externas aisladas

Estado

✅ Aprobado

---

### Decisión

Las APIs externas no se consumen directamente desde los módulos.

Se implementan mediante providers.

Ejemplo:

```
src/integrations/youtube/
```

---

### Motivo

Reducir acoplamiento.

Facilitar cambios futuros.

Mejorar mantenibilidad.

---

# ADR-007
## Controllers sin lógica de negocio

Estado

✅ Aprobado

---

### Decisión

Los Controllers únicamente:

- reciben requests
- llaman Services
- responden HTTP

---

### Motivo

Separación de responsabilidades.

Mayor facilidad para probar la lógica.

---

# ADR-008
## Services como centro del negocio

Estado

✅ Aprobado

---

### Decisión

Toda la lógica pertenece a los Services.

---

### Motivo

Evitar duplicación.

Mantener Controllers simples.

Centralizar reglas del negocio.

---

# ADR-009
## Validaciones mediante Zod

Estado

✅ Aprobado

---

### Decisión

Toda validación de entrada utiliza Zod.

Cada módulo mantiene su propio validation.js.

---

### Motivo

Consistencia.

Legibilidad.

Facilidad de mantenimiento.

---

# ADR-010
## Evitar sobreingeniería

Estado

✅ Aprobado

---

### Decisión

No implementar soluciones para problemas hipotéticos.

El código debe resolver necesidades actuales.

---

### Motivo

Reducir complejidad.

Facilitar mantenimiento.

Acelerar el desarrollo.

---

# ADR-011
## Reutilización antes que duplicación

Estado

✅ Aprobado

---

### Decisión

Si una funcionalidad comienza a repetirse entre módulos debe convertirse en utilidad compartida.

Ejemplo:

```
src/utils
```

---

### Motivo

Reducir código duplicado.

Mejorar mantenibilidad.

---

# ADR-012
## Prioridad del contenido editorial

Estado

✅ Aprobado

---

### Decisión

Los datos definidos por el administrador siempre tienen prioridad sobre los metadatos obtenidos desde plataformas externas.

Ejemplos:

- título
- descripción
- portada
- SEO

---

### Motivo

El administrador tiene el control editorial del contenido.

Las integraciones externas solo enriquecen información.

---

# ADR-013
## YouTube como fuente de metadatos

Estado

✅ Aprobado

---

### Decisión

Las Live Sessions y algunos Videos podrán sincronizar metadatos desde YouTube.

La sincronización nunca debe sobrescribir automáticamente el contenido editorial.

---

### Motivo

Mantener control editorial.

Evitar cambios inesperados.

---

# ADR-014
## Arquitectura estable antes que nuevas funcionalidades

Estado

✅ Aprobado

---

### Decisión

Antes de agregar nuevas características debe verificarse que la arquitectura actual siga siendo consistente.

---

### Motivo

Evitar deuda técnica.

Permitir crecimiento gradual del proyecto.

---

# Cómo agregar nuevas decisiones

Toda decisión importante debe documentarse utilizando el siguiente formato.

```
# ADR-015

Estado

Propuesto | Aprobado | Rechazado

---

## Decisión

...

---

## Motivo

...

---

## Consecuencias

...
```

---

# Filosofía

Las decisiones documentadas aquí representan acuerdos del proyecto.

Si una implementación entra en conflicto con una ADR aprobada, debe discutirse antes de modificar el código.

Este documento tiene prioridad sobre interpretaciones individuales de cualquier desarrollador o asistente de IA.