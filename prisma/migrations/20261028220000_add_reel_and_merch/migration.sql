-- CreateTable
CREATE TABLE "Reel" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "coverImageId" INTEGER,
    "coverUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "collection" TEXT,
    "price" TEXT,
    "details" JSONB,
    "imageUrl" TEXT,
    "gallery" JSONB,
    "badge" TEXT,
    "url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,
    "coverImageId" INTEGER,

    CONSTRAINT "Merch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reel_slug_key" ON "Reel"("slug");

-- CreateIndex
CREATE INDEX "Reel_status_idx" ON "Reel"("status");

-- CreateIndex
CREATE INDEX "Reel_publishedAt_idx" ON "Reel"("publishedAt");

-- CreateIndex
CREATE INDEX "Reel_authorId_idx" ON "Reel"("authorId");

-- CreateIndex
CREATE INDEX "Reel_status_isVisible_featured_idx" ON "Reel"("status", "isVisible", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Merch_slug_key" ON "Merch"("slug");

-- CreateIndex
CREATE INDEX "Merch_status_idx" ON "Merch"("status");

-- CreateIndex
CREATE INDEX "Merch_publishedAt_idx" ON "Merch"("publishedAt");

-- CreateIndex
CREATE INDEX "Merch_authorId_idx" ON "Merch"("authorId");

-- CreateIndex
CREATE INDEX "Merch_status_isVisible_featured_sortOrder_idx" ON "Merch"("status", "isVisible", "featured", "sortOrder");

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merch" ADD CONSTRAINT "Merch_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merch" ADD CONSTRAINT "Merch_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
