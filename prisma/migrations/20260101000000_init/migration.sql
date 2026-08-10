-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SHOW', 'SEASON', 'EPISODE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('TMDB', 'TVDB', 'OMDB', 'MANUAL');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('NOT_WATCHED', 'WATCHING', 'WATCHED', 'SKIPPED', 'REWATCHING');

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "poster" TEXT,
    "backdrop" TEXT,
    "releaseDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "runtime" INTEGER,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "network" TEXT,
    "productionCompanies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cast" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "creators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "director" TEXT,
    "country" TEXT,
    "language" TEXT,
    "rating" DOUBLE PRECISION,
    "seasonNumber" INTEGER,
    "episodeNumber" INTEGER,
    "numberOfSeasons" INTEGER,
    "numberOfEpisodes" INTEGER,
    "provider" "Provider" NOT NULL DEFAULT 'MANUAL',
    "tmdbId" TEXT,
    "tvdbId" TEXT,
    "imdbId" TEXT,
    "parentId" TEXT,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "displayTitle" TEXT,
    "displayDescription" TEXT,
    "displayReleaseDate" TIMESTAMP(3),
    "order" DOUBLE PRECISION NOT NULL,
    "status" "WatchStatus" NOT NULL DEFAULT 'NOT_WATCHED',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "manualNext" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Media_tmdbId_idx" ON "Media"("tmdbId");

-- CreateIndex
CREATE INDEX "Media_tvdbId_idx" ON "Media"("tvdbId");

-- CreateIndex
CREATE INDEX "Media_imdbId_idx" ON "Media"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_tmdb_type" ON "Media"("provider", "tmdbId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "TimelineEntry_order_idx" ON "TimelineEntry"("order");

-- CreateIndex
CREATE INDEX "TimelineEntry_status_idx" ON "TimelineEntry"("status");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
