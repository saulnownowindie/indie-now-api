-- Índices de rendimiento para feeds públicos, cola del worker y FKs de portadas.
-- IF NOT EXISTS permite aplicarla también sobre bases donde ya se ejecutó `prisma db push`.

-- Cola de previews del worker
CREATE INDEX IF NOT EXISTS "Reel_previewStatus_updatedAt_idx"
  ON "Reel" ("previewStatus", "updatedAt");
CREATE INDEX IF NOT EXISTS "Reel_previewStatus_processingAt_idx"
  ON "Reel" ("previewStatus", "processingAt");

-- Feeds públicos filtrados por estado y sección
CREATE INDEX IF NOT EXISTS "News_status_isVisible_homeSection_sortOrder_idx"
  ON "News" ("status", "isVisible", "homeSection", "sortOrder");
CREATE INDEX IF NOT EXISTS "Reel_status_isVisible_homeSection_sortOrder_idx"
  ON "Reel" ("status", "isVisible", "homeSection", "sortOrder");

-- Claves foráneas de portadas (PostgreSQL no las indexa automáticamente)
CREATE INDEX IF NOT EXISTS "News_coverImageId_idx" ON "News" ("coverImageId");
CREATE INDEX IF NOT EXISTS "LiveSession_coverImageId_idx" ON "LiveSession" ("coverImageId");
CREATE INDEX IF NOT EXISTS "Video_coverImageId_idx" ON "Video" ("coverImageId");
CREATE INDEX IF NOT EXISTS "Reel_coverImageId_idx" ON "Reel" ("coverImageId");
CREATE INDEX IF NOT EXISTS "Merch_coverImageId_idx" ON "Merch" ("coverImageId");

-- Listado paginado de media
CREATE INDEX IF NOT EXISTS "Media_createdAt_idx" ON "Media" ("createdAt");
