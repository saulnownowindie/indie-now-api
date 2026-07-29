# Modelo de Contenido

## Propósito

Este documento define los distintos tipos de contenido que existen en Indie Now y la función de cada uno dentro de la plataforma.

Estas definiciones representan decisiones de negocio y deben respetarse durante el desarrollo.

---

# Filosofía

Indie Now NO es:

- un blog tradicional
- una revista digital
- una tienda online
- una plataforma de streaming

Indie Now es el centro del ecosistema digital del proyecto.

Su función es organizar, presentar y promocionar contenido publicado en distintas plataformas.

La mayor parte del contenido enlaza hacia plataformas externas.

---

# Tipos de contenido

Actualmente existen los siguientes modelos principales.

```
News
LiveSession
Video
Playlist
Media
Category
```

Cada uno tiene una responsabilidad específica.

No deben mezclarse.

---

# News

Representa publicaciones relacionadas con artistas o con Indie Now.

Generalmente enlaza hacia contenido externo.

Ejemplos:

- lanzamiento de un álbum
- estreno de un videoclip
- anuncio de gira
- publicación de Instagram
- publicación de TikTok
- artículo externo
- estreno en YouTube

Una noticia NO contiene necesariamente contenido propio.

Su objetivo es informar.

---

# Live Sessions

Las Live Sessions representan producciones originales de Indie Now.

Son uno de los formatos más importantes del proyecto.

Siempre tendrán una sección propia dentro del sitio.

No deben modelarse como un subtipo de Video.

Cada Live Session representa una producción editorial independiente.

Actualmente cada sesión está asociada a un video de YouTube.

En el futuro podrá incorporar información adicional como:

- artista principal
- invitados
- fecha de grabación
- lugar
- créditos técnicos
- canciones interpretadas
- fotografías
- material adicional

Toda esa información pertenece únicamente a LiveSession.

---

# Videos

Representa videos generales publicados por Indie Now.

Ejemplos:

- entrevistas
- detrás de cámaras
- documentales
- contenido promocional
- anuncios
- videos especiales

Los Videos NO representan las Live Sessions.

Ambos módulos son independientes.

---

# Playlists

Representa listas musicales.

Ejemplos:

- Spotify
- Apple Music
- YouTube Music
- Deezer

Una Playlist organiza música.

No representa contenido editorial.

---

# Media

Representa recursos multimedia reutilizables.

Ejemplos:

- imágenes
- miniaturas
- fotografías
- banners
- futuras extensiones:
    - videos
    - archivos
    - documentos

Media no representa contenido.

Solo almacena recursos utilizados por otros módulos.

---

# Category

Permite clasificar contenido.

Las categorías ayudan a organizar:

- noticias
- videos
- playlists

No representan contenido por sí mismas.

---

# Relaciones

De forma simplificada:

```
Category

↓

News

Video

Playlist
```

```
Media

↓

News

Video

LiveSession
```

```
User

↓

News

Video

Playlist

LiveSession
```

---

# Home

La página principal consume distintos módulos.

Actualmente se plantea la siguiente estructura:

```
Hero

↓

Últimas Noticias

↓

Live Session Destacada

↓

Videos

↓

Playlists

↓

Merch

↓

Footer
```

Cada sección obtiene su información desde su propio módulo.

No existe un único modelo que controle toda la Home.

---

# Contenido Destacado

Algunos recursos pueden marcarse como destacados.

Ejemplos:

```
featured = true
```

Esto permite mostrar contenido prioritario en la página principal sin modificar el resto del contenido.

---

# SEO

Todos los modelos públicos pueden incorporar información SEO.

Ejemplos:

- seoTitle
- seoDescription

Esta información pertenece al contenido editorial y nunca debe sobrescribirse automáticamente mediante integraciones externas.

---

# Integraciones externas

Actualmente el proyecto utiliza principalmente YouTube.

En futuras versiones podrán incorporarse otras plataformas.

Las integraciones externas sirven únicamente para obtener metadatos.

Nunca deben modificar automáticamente el contenido editorial creado por el administrador.

---

# Datos editoriales

Siempre tienen prioridad los datos definidos por el administrador.

Ejemplos:

- título
- descripción
- portada personalizada
- contenido destacado
- visibilidad

Los metadatos obtenidos desde plataformas externas nunca deben sobrescribir automáticamente estos datos.

---

# Evolución del modelo

El modelo de contenido está diseñado para crecer sin romper compatibilidad.

Las futuras funcionalidades deberán ampliar los modelos existentes evitando rediseños completos.

Antes de convertir un modelo en otro o fusionar tipos de contenido, debe evaluarse si representan responsabilidades de negocio diferentes.

Si la respuesta es sí, deben mantenerse como módulos independientes.