import {
  MediaKind,
  MetadataNotFoundError,
  MetadataProvider,
  MetadataProviderUnavailableError,
  NormalizedMetadata,
  ProviderNotConfiguredError,
} from './types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

function img(path: string | null | undefined): string | undefined {
  return path ? `${IMAGE_BASE}${path}` : undefined;
}

async function tmdbFetch(path: string, apiKey: string): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}api_key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 0 } });
  } catch {
    throw new MetadataProviderUnavailableError();
  }
  if (res.status === 404) throw new MetadataNotFoundError();
  if (!res.ok) throw new MetadataProviderUnavailableError();
  return res.json();
}

function movieToNormalized(m: any): NormalizedMetadata {
  return {
    type: 'MOVIE',
    title: m.title,
    originalTitle: m.original_title !== m.title ? m.original_title : undefined,
    overview: m.overview || undefined,
    poster: img(m.poster_path),
    backdrop: img(m.backdrop_path),
    releaseDate: m.release_date || undefined,
    runtime: m.runtime || undefined,
    genres: (m.genres || []).map((g: any) => g.name),
    productionCompanies: (m.production_companies || []).map((c: any) => c.name),
    cast: (m.credits?.cast || []).slice(0, 10).map((c: any) => c.name),
    director: (m.credits?.crew || []).find((c: any) => c.job === 'Director')?.name,
    country: m.production_countries?.[0]?.name,
    language: m.original_language,
    rating: m.vote_average || undefined,
    provider: 'TMDB',
    tmdbId: String(m.id),
    imdbId: m.external_ids?.imdb_id || undefined,
  };
}

function showToNormalized(s: any): NormalizedMetadata {
  return {
    type: 'SHOW',
    title: s.name,
    originalTitle: s.original_name !== s.name ? s.original_name : undefined,
    overview: s.overview || undefined,
    poster: img(s.poster_path),
    backdrop: img(s.backdrop_path),
    releaseDate: s.first_air_date || undefined,
    endDate: s.last_air_date || undefined,
    genres: (s.genres || []).map((g: any) => g.name),
    network: s.networks?.[0]?.name,
    productionCompanies: (s.production_companies || []).map((c: any) => c.name),
    cast: (s.credits?.cast || []).slice(0, 10).map((c: any) => c.name),
    creators: (s.created_by || []).map((c: any) => c.name),
    country: s.origin_country?.[0],
    language: s.original_language,
    rating: s.vote_average || undefined,
    numberOfSeasons: s.number_of_seasons || undefined,
    numberOfEpisodes: s.number_of_episodes || undefined,
    provider: 'TMDB',
    tmdbId: String(s.id),
    imdbId: s.external_ids?.imdb_id || undefined,
  };
}

function seasonToNormalized(showId: string, season: any, show: any): NormalizedMetadata {
  return {
    type: 'SEASON',
    title: season.name,
    overview: season.overview || undefined,
    poster: img(season.poster_path) || img(show.poster_path),
    backdrop: img(show.backdrop_path),
    releaseDate: season.air_date || undefined,
    seasonNumber: season.season_number,
    numberOfEpisodes: season.episodes?.length ?? undefined,
    rating: season.vote_average || undefined,
    provider: 'TMDB',
    tmdbId: String(season.id),
    parentShow: showToNormalized(show),
  };
}

export function createTmdbProvider(apiKey: string | undefined): MetadataProvider {
  const configured = Boolean(apiKey);

  return {
    name: 'TMDB',
    configured,

    async getMovie(id: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TMDB');
      const data = await tmdbFetch(`/movie/${id}?append_to_response=credits,external_ids`, apiKey);
      return movieToNormalized(data);
    },

    async getShow(id: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TMDB');
      const data = await tmdbFetch(`/tv/${id}?append_to_response=credits,external_ids`, apiKey);
      return showToNormalized(data);
    },

    async getSeason(showId: string, seasonNumber: number) {
      if (!apiKey) throw new ProviderNotConfiguredError('TMDB');
      const [season, show] = await Promise.all([
        tmdbFetch(`/tv/${showId}/season/${seasonNumber}`, apiKey),
        tmdbFetch(`/tv/${showId}?append_to_response=external_ids`, apiKey),
      ]);
      return seasonToNormalized(showId, season, show);
    },

    async resolveExternalId(imdbId: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TMDB');
      const data = await tmdbFetch(`/find/${imdbId}?external_source=imdb_id`, apiKey);
      if (data.movie_results?.length) return { id: String(data.movie_results[0].id), type: 'MOVIE' as MediaKind };
      if (data.tv_results?.length) return { id: String(data.tv_results[0].id), type: 'SHOW' as MediaKind };
      return null;
    },

    async searchById(id: string, hint?: MediaKind) {
      if (!apiKey) throw new ProviderNotConfiguredError('TMDB');

      // IMDb-style id: resolve through /find first.
      if (/^tt\d+$/.test(id)) {
        const resolved = await this.resolveExternalId!(id);
        if (!resolved) throw new MetadataNotFoundError();
        return resolved.type === 'MOVIE' ? this.getMovie(resolved.id) : this.getShow(resolved.id);
      }

      // Numeric TMDB id — try the hinted kind first, then fall back.
      if (hint === 'SHOW') {
        try {
          return await this.getShow(id);
        } catch {
          return this.getMovie(id);
        }
      }
      try {
        return await this.getMovie(id);
      } catch (e) {
        if (e instanceof MetadataNotFoundError) return this.getShow(id);
        throw e;
      }
    },
  };
}
