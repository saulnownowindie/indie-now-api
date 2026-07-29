# 📚 Documentación Técnica de la API - Indie Now

API RESTful para la plataforma **Indie Now**, desarrollada con **Node.js, Express 5, Prisma ORM y PostgreSQL**.

---

## 🔐 Autenticación & Autorización

- **Método**: JSON Web Token (JWT) enviado en el encabezado HTTP.
- **Formato**: `Authorization: Bearer <TOKEN>`
- **Expiración**: 7 días.

---

## 🛠️ Resumen de Endpoints

| Módulo | Método | Ruta | Autenticación | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Pública | Iniciar sesión y obtener JWT |
| **Category** | `GET` | `/api/categories` | Pública | Listar todas las categorías |
| **Category** | `GET` | `/api/categories/:slug` | Pública | Obtener categoría por slug |
| **Category** | `POST` | `/api/categories` | Requiere Auth | Crear nueva categoría |
| **Category** | `PUT` | `/api/categories/:id` | Requiere Auth | Actualizar categoría por ID |
| **Category** | `DELETE` | `/api/categories/:id` | Requiere Auth | Eliminar categoría por ID |
| **Media** | `POST` | `/api/media/upload` | Requiere Auth | Subir archivo de imagen (JPEG, PNG, WebP) |
| **News** | `GET` | `/api/news` | Pública | Listar todas las noticias |
| **News** | `GET` | `/api/news/:slug` | Pública | Obtener noticia por slug |
| **News** | `POST` | `/api/news` | Requiere Auth | Crear noticia |
| **News** | `PUT` | `/api/news/:id` | Requiere Auth | Actualizar noticia por ID |
| **News** | `DELETE` | `/api/news/:id` | Requiere Auth | Eliminar noticia por ID |
| **Video** | `GET` | `/api/videos` | Pública | Listar todos los videos |
| **Video** | `GET` | `/api/videos/:slug` | Pública | Obtener video por slug |
| **Video** | `POST` | `/api/videos` | Requiere Auth | Crear video |
| **Video** | `PUT` | `/api/videos/:id` | Requiere Auth | Actualizar video por ID |
| **Video** | `DELETE` | `/api/videos/:id` | Requiere Auth | Eliminar video por ID |
| **LiveSession** | `GET` | `/api/live-sessions` | Pública | Listar todas las Indie Now Sessions |
| **LiveSession** | `GET` | `/api/live-sessions/featured` | Pública | Listar Sessions destacadas |
| **LiveSession** | `GET` | `/api/live-sessions/:slug` | Pública | Obtener Session por slug |
| **LiveSession** | `POST` | `/api/live-sessions` | Requiere Auth | Crear Indie Now Session |
| **LiveSession** | `PUT` | `/api/live-sessions/:id` | Requiere Auth | Actualizar Session por ID |
| **LiveSession** | `DELETE` | `/api/live-sessions/:id` | Requiere Auth | Eliminar Session por ID |
| **Playlist** | `GET` | `/api/playlists` | Pública | Listar todas las playlists |
| **Playlist** | `GET` | `/api/playlists/featured` | Pública | Listar playlists destacadas |
| **Playlist** | `GET` | `/api/playlists/:slug` | Pública | Obtener playlist por slug |
| **Playlist** | `POST` | `/api/playlists` | Requiere Auth | Importar playlist desde Spotify URL |
| **Playlist** | `PUT` | `/api/playlists/:id` | Requiere Auth | Actualizar datos CMS de la playlist |
| **Playlist** | `POST` | `/api/playlists/:id/sync` | Requiere Auth | Sincronizar metadatos desde Spotify API |
| **Playlist** | `DELETE` | `/api/playlists/:id` | Requiere Auth | Eliminar playlist por ID |

---

## 📖 Detalles por Módulo

### 1. Autenticación (`/api/auth`)

#### `POST /api/auth/login`
- **Autenticación**: Ninguna (Pública)
- **Body JSON**:
  ```json
  {
    "email": "admin@indienow.local",
    "password": "admin123"
  }
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "message": "Login correcto",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Administrador Indie Now",
      "email": "admin@indienow.local"
    }
  }
  ```
- **Respuestas de Error**:
  - `400 Bad Request`: Formato de correo o contraseña no válido.
  - `401 Unauthorized`: Credenciales inválidas.

---

### 2. Categorías (`/api/categories`)

#### `GET /api/categories`
- **Autenticación**: Pública
- **Respuesta 200 OK**:
  ```json
  [
    {
      "id": 1,
      "name": "Noticias",
      "slug": "noticias",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
  ```

#### `GET /api/categories/:slug`
- **Autenticación**: Pública
- **Parámetros de Ruta**: `slug` (string)
- **Respuesta 200 OK**: Objeto categoría
- **Respuesta 404 Not Found**: `{ "message": "Categoría no encontrada" }`

#### `POST /api/categories`
- **Autenticación**: Requiere Auth
- **Body JSON**: `{ "name": "Entrevistas" }`
- **Respuesta 201 Created**: Objeto categoría creada con slug autogenerado.
- **Respuestas de Error**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (slug ya existente).

#### `PUT /api/categories/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Body JSON**: `{ "name": "Entrevistas Exclusivas" }`
- **Respuesta 200 OK**: Objeto categoría actualizado.
- **Respuestas de Error**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`.

#### `DELETE /api/categories/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Respuesta 200 OK**: `{ "message": "Categoría eliminada correctamente" }`
- **Respuestas de Error**: `401 Unauthorized`, `404 Not Found`.

---

### 3. Media (`/api/media`)

#### `POST /api/media/upload`
- **Autenticación**: Requiere Auth
- **Content-Type**: `multipart/form-data`
- **Body Form Data**: `file` (archivo de imagen max 10MB, mime: `jpeg`, `png`, `webp`).
- **Respuesta 201 Created**:
  ```json
  {
    "message": "Archivo subido correctamente.",
    "media": {
      "id": 1,
      "type": "IMAGE",
      "filename": "1738100000000-123456789.png",
      "originalName": "cover.png",
      "mimeType": "image/png",
      "size": 154200,
      "url": "/uploads/images/1738100000000-123456789.png",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
  ```
- **Respuestas de Error**: `400 Bad Request` (Sin archivo o formato no soportado), `401 Unauthorized`.

---

### 4. Noticias (`/api/news`)

#### `GET /api/news`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de noticias con relaciones `author`, `category` y `coverImage`.

#### `GET /api/news/:slug`
- **Autenticación**: Pública
- **Parámetros de Ruta**: `slug` (string)
- **Respuesta 200 OK**: Objeto noticia con relaciones.
- **Respuesta 404 Not Found**: `{ "message": "Noticia no encontrada" }`

#### `POST /api/news`
- **Autenticación**: Requiere Auth
- **Body JSON**:
  ```json
  {
    "title": "Título de la noticia",
    "platform": "INSTAGRAM",
    "url": "https://www.instagram.com/p/C1234567890",
    "featured": false,
    "isVisible": true,
    "seoTitle": "Título SEO",
    "seoDescription": "Descripción SEO",
    "status": "PUBLISHED",
    "publishedAt": "2026-01-15T12:00:00.000Z",
    "categoryId": 1,
    "coverImageId": 1
  }
  ```
- **Respuesta 201 Created**: Objeto noticia creado con `slug` autogenerado y `authorId` asignado por el JWT.
- **Respuestas de Error**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict`.

#### `PUT /api/news/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Body JSON**: Objeto parcial con campos a actualizar.
- **Respuesta 200 OK**: Objeto noticia actualizado.

#### `DELETE /api/news/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Respuesta 200 OK**: `{ "message": "Noticia eliminada correctamente" }`

---

### 5. Videos (`/api/videos`)

#### `GET /api/videos`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de videos con relaciones `author`, `category` y `coverImage`.

#### `GET /api/videos/:slug`
- **Autenticación**: Pública
- **Parámetros de Ruta**: `slug` (string)
- **Respuesta 200 OK**: Objeto video con relaciones.
- **Respuesta 404 Not Found**: `{ "message": "Video no encontrado" }`

#### `POST /api/videos`
- **Autenticación**: Requiere Auth
- **Body JSON**:
  ```json
  {
    "title": "Título del video",
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "featured": true,
    "isVisible": true,
    "seoTitle": "SEO Title",
    "seoDescription": "SEO Description",
    "status": "PUBLISHED",
    "publishedAt": "2026-01-20T18:00:00.000Z",
    "categoryId": 1,
    "coverImageId": null
  }
  ```
- **Respuesta 201 Created**: Video creado. La URL de YouTube se normaliza automáticamente (`https://www.youtube.com/watch?v=ID`).

#### `PUT /api/videos/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Body JSON**: Objeto parcial a actualizar.

#### `DELETE /api/videos/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Respuesta 200 OK**: `{ "message": "Video eliminado correctamente" }`

---

### 6. Live Sessions (`/api/live-sessions`)

#### `GET /api/live-sessions`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de Indie Now Sessions.

#### `GET /api/live-sessions/featured`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de Indie Now Sessions con `featured: true`.

#### `GET /api/live-sessions/:slug`
- **Autenticación**: Pública
- **Parámetros de Ruta**: `slug` (string)
- **Respuesta 200 OK**: Objeto Indie Now Session.
- **Respuesta 404 Not Found**: `{ "message": "Indie Now Session no encontrada" }`

#### `POST /api/live-sessions`
- **Autenticación**: Requiere Auth
- **Body JSON**:
  ```json
  {
    "title": "Indie Now Session #01",
    "youtubeUrl": "https://youtu.be/L_jWHffIx5E",
    "featured": true,
    "isVisible": true,
    "status": "PUBLISHED"
  }
  ```
- **Respuesta 201 Created**: Indie Now Session creada.

#### `PUT /api/live-sessions/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)

#### `DELETE /api/live-sessions/:id`
- **Autenticación**: Requiere Auth
- **Respuesta 200 OK**: `{ "message": "Indie Now Session eliminada correctamente" }`

---

### 7. Playlists (`/api/playlists`)

#### `GET /api/playlists`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de playlists ordenadas por `sortOrder asc`, `publishedAt desc`, `createdAt desc`.

#### `GET /api/playlists/featured`
- **Autenticación**: Pública
- **Respuesta 200 OK**: Arreglo de playlists con `featured: true`, `isVisible: true` y `status: "PUBLISHED"`.

#### `GET /api/playlists/:slug`
- **Autenticación**: Pública
- **Parámetros de Ruta**: `slug` (string)
- **Respuesta 200 OK**: Objeto playlist.
- **Respuesta 404 Not Found**: `{ "message": "Playlist no encontrada" }`

#### `POST /api/playlists`
- **Autenticación**: Requiere Auth
- **Body JSON**:
  ```json
  {
    "spotifyUrl": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
  }
  ```
- **Respuesta 201 Created**: Extrae metadatos de Spotify API (título, descripción, portada, owner, número de tracks, snapshot_id), genera el slug y crea la playlist.
- **Respuestas de Error**:
  - `400 Bad Request`: La URL de Spotify no es válida.
  - `409 Conflict`: La playlist ya se encuentra registrada en la base de datos.
  - `503 Service Unavailable`: Las credenciales de Spotify no se encuentran en `.env`.

#### `PUT /api/playlists/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Body JSON**:
  ```json
  {
    "featured": true,
    "isVisible": true,
    "sortOrder": 1,
    "seoTitle": "Título SEO",
    "seoDescription": "Descripción SEO",
    "status": "PUBLISHED"
  }
  ```
- **Respuesta 200 OK**: Playlist actualizada.

#### `POST /api/playlists/:id/sync`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Body JSON**: Vacio `{}`
- **Respuesta 200 OK**: Consulta nuevamente la API de Spotify y actualiza título, descripción, portada, número de canciones, snapshot y marca de tiempo `spotifySyncedAt`.

#### `DELETE /api/playlists/:id`
- **Autenticación**: Requiere Auth
- **Parámetros de Ruta**: `id` (integer)
- **Respuesta 200 OK**: `{ "message": "Playlist eliminada correctamente" }`

---

## ⚠️ Códigos de Error Globales

| Código | Condición | Formato de Respuesta |
| :--- | :--- | :--- |
| `400` | Error de validación Zod / Parámetros no válidos | `{ "message": "Error de validación", "errors": [...] }` |
| `401` | Token no enviado o expirado / Credenciales inválidas | `{ "message": "Token no proporcionado" }` o `{ "message": "Token inválido" }` |
| `404` | Recurso no encontrado en BD | `{ "message": "Registro no encontrado." }` |
| `409` | Violación de restricción única Prisma (P2002) | `{ "message": "Ya existe un registro con ese valor." }` |
| `502` | Fallo de comunicación con servicio externo (Spotify) | `{ "message": "No fue posible conectar con Spotify." }` |
| `503` | Servicio no configurado / Límite de tasa excedido | `{ "message": "La integración con Spotify no está configurada." }` |
| `500` | Error interno no controlado | `{ "message": "Error interno del servidor" }` |
