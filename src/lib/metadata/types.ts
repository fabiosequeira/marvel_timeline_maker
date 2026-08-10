export type MediaKind = 'MOVIE' | 'SHOW' | 'SEASON' | 'EPISODE' | 'SPECIAL';
export type ProviderName = 'TMDB' | 'TVDB' | 'OMDB';

export interface NormalizedMetadata {
  type: MediaKind;
  title: string;
  originalTitle?: string;
  overview?: string;
  poster?: string;
  backdrop?: string;
  releaseDate?: string; // ISO date
  endDate?: string;
  runtime?: number;
  genres?: string[];
  network?: string;
  productionCompanies?: string[];
  cast?: string[];
  creators?: string[];
  director?: string;
  country?: string;
  language?: string;
  rating?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  provider: ProviderName;
  tmdbId?: string;
  tvdbId?: string;
  imdbId?: string;
  // For seasons: the parent show's metadata, so callers can create/link the
  // parent Media row without a second round trip.
  parentShow?: NormalizedMetadata;
}

export interface MetadataProvider {
  readonly name: ProviderName;
  readonly configured: boolean;

  /** Resolve an arbitrary external ID to metadata, guessing the media kind. */
  searchById(id: string, hint?: MediaKind): Promise<NormalizedMetadata>;

  getMovie(id: string): Promise<NormalizedMetadata>;
  getShow(id: string): Promise<NormalizedMetadata>;
  getSeason(showId: string, seasonNumber: number): Promise<NormalizedMetadata>;

  /** Resolve an IMDb id to this provider's native id + kind, if supported. */
  resolveExternalId?(imdbId: string): Promise<{ id: string; type: MediaKind } | null>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} isn't configured. Add its API key to your .env file.`);
    this.name = 'ProviderNotConfiguredError';
  }
}

export class MetadataNotFoundError extends Error {
  constructor(message = "Couldn't find that title. Check the ID and selected provider.") {
    super(message);
    this.name = 'MetadataNotFoundError';
  }
}

export class MetadataProviderUnavailableError extends Error {
  constructor(message = 'Metadata provider unavailable. Your existing timeline is still available.') {
    super(message);
    this.name = 'MetadataProviderUnavailableError';
  }
}
