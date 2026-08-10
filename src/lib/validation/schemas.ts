import { z } from 'zod';

export const mediaTypeEnum = z.enum(['MOVIE', 'SHOW', 'SEASON', 'EPISODE', 'SPECIAL']);
export const providerEnum = z.enum(['TMDB', 'TVDB', 'OMDB']);
export const watchStatusEnum = z.enum(['NOT_WATCHED', 'WATCHING', 'WATCHED', 'SKIPPED', 'REWATCHING']);

export const fetchMetadataSchema = z.object({
  provider: providerEnum,
  id: z.string().min(1).max(200),
  type: mediaTypeEnum.optional(),
  seasonNumber: z.number().int().min(0).max(200).optional(),
});

export const createEntrySchema = z.object({
  provider: providerEnum,
  externalId: z.string().min(1).max(200),
  type: mediaTypeEnum,
  seasonNumber: z.number().int().min(0).max(200).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  status: watchStatusEnum.optional(),
  required: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
  insertAfterEntryId: z.string().cuid().optional().nullable(),
  allowDuplicate: z.boolean().optional(),
});

export const updateEntrySchema = z.object({
  displayTitle: z.string().max(300).nullable().optional(),
  displayDescription: z.string().max(5000).nullable().optional(),
  displayReleaseDate: z.string().datetime().nullable().optional(),
  status: watchStatusEnum.optional(),
  required: z.boolean().optional(),
  manualNext: z.boolean().optional(),
  notes: z.string().max(5000).nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
});

export const reorderSchema = z.object({
  entryId: z.string().cuid(),
  beforeEntryId: z.string().cuid().nullable().optional(),
  afterEntryId: z.string().cuid().nullable().optional(),
});

export const refreshMetadataSchema = z.object({
  entryId: z.string().cuid(),
  updatePoster: z.boolean().default(true),
  updateDescription: z.boolean().default(true),
  updateDates: z.boolean().default(true),
  overwriteCustomTitle: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const importSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
  })).default([]),
  entries: z.array(z.object({
    order: z.number(),
    status: watchStatusEnum,
    required: z.boolean(),
    notes: z.string().nullable().optional(),
    displayTitle: z.string().nullable().optional(),
    displayDescription: z.string().nullable().optional(),
    categoryName: z.string().nullable().optional(),
    media: z.object({
      type: mediaTypeEnum,
      title: z.string(),
      originalTitle: z.string().nullable().optional(),
      overview: z.string().nullable().optional(),
      poster: z.string().nullable().optional(),
      backdrop: z.string().nullable().optional(),
      releaseDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      runtime: z.number().nullable().optional(),
      genres: z.array(z.string()).default([]),
      seasonNumber: z.number().nullable().optional(),
      numberOfSeasons: z.number().nullable().optional(),
      numberOfEpisodes: z.number().nullable().optional(),
      provider: z.string(),
      tmdbId: z.string().nullable().optional(),
      tvdbId: z.string().nullable().optional(),
      imdbId: z.string().nullable().optional(),
    }),
  })),
});
