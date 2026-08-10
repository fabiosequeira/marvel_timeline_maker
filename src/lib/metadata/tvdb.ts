import {
  MetadataNotFoundError,
  MetadataProvider,
  MetadataProviderUnavailableError,
  NormalizedMetadata,
  ProviderNotConfiguredError,
} from './types';

// TVDB API v4. Uses an API-key login exchange for a short-lived bearer token.
// NOTE: TVDB's v4 API has subscription-tier differences (e.g. some fields
// require a "Subscriber" PIN). This implementation covers the common,
// unauthenticated-tier fields. If your key needs a PIN, set TVDB_PIN too.
const BASE_URL = 'https://api4.thetvdb.com/v4';

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(apiKey: string, pin?: string): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: apiKey, pin }),
    });
  } catch {
    throw new MetadataProviderUnavailableError();
  }
  if (!res.ok) throw new MetadataProviderUnavailableError();
  const data = await res.json();
  const token = data?.data?.token;
  if (!token) throw new MetadataProviderUnavailableError();
  // TVDB tokens last ~1 month; refresh hourly to be safe.
  cachedToken = { token, expires: Date.now() + 60 * 60 * 1000 };
  return token;
}

async function tvdbFetch(path: string, apiKey: string, pin?: string): Promise<any> {
  const token = await getToken(apiKey, pin);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new MetadataProviderUnavailableError();
  }
  if (res.status === 404) throw new MetadataNotFoundError();
  if (!res.ok) throw new MetadataProviderUnavailableError();
  return (await res.json()).data;
}

function movieToNormalized(m: any): NormalizedMetadata {
  return {
    type: 'MOVIE',
    title: m.name,
    overview: m.overview || undefined,
    poster: m.image || undefined,
    releaseDate: m.first_release?.date || undefined,
    runtime: m.runtime || undefined,
    genres: (m.genres || []).map((g: any) => g.name),
    provider: 'TVDB',
    tvdbId: String(m.id),
    imdbId: (m.remoteIds || []).find((r: any) => r.sourceName === 'IMDB')?.id,
  };
}

function showToNormalized(s: any): NormalizedMetadata {
  return {
    type: 'SHOW',
    title: s.name,
    overview: s.overview || undefined,
    poster: s.image || undefined,
    releaseDate: s.firstAired || undefined,
    endDate: s.lastAired || undefined,
    genres: (s.genres || []).map((g: any) => g.name),
    network: s.originalNetwork?.name,
    country: s.originalCountry,
    language: s.originalLanguage,
    numberOfSeasons: s.seasons ? new Set(s.seasons.map((se: any) => se.number)).size : undefined,
    provider: 'TVDB',
    tvdbId: String(s.id),
    imdbId: (s.remoteIds || []).find((r: any) => r.sourceName === 'IMDB')?.id,
  };
}

export function createTvdbProvider(apiKey: string | undefined, pin: string | undefined): MetadataProvider {
  const configured = Boolean(apiKey);

  return {
    name: 'TVDB',
    configured,
    async getMovie(id: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TVDB');
      const data = await tvdbFetch(`/movies/${id}/extended`, apiKey, pin);
      return movieToNormalized(data);
    },
    async getShow(id: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TVDB');
      const data = await tvdbFetch(`/series/${id}/extended`, apiKey, pin);
      return showToNormalized(data);
    },
    async getSeason(showId: string, seasonNumber: number) {
      if (!apiKey) throw new ProviderNotConfiguredError('TVDB');
      const show = await tvdbFetch(`/series/${showId}/extended`, apiKey, pin);
      const season = (show.seasons || []).find((se: any) => se.number === seasonNumber && se.type?.type === 'official');
      if (!season) throw new MetadataNotFoundError();
      const seasonDetail = await tvdbFetch(`/seasons/${season.id}/extended`, apiKey, pin);
      return {
        type: 'SEASON',
        title: seasonDetail.name || `Season ${seasonNumber}`,
        poster: seasonDetail.image || show.image,
        seasonNumber,
        numberOfEpisodes: seasonDetail.episodes?.length,
        provider: 'TVDB',
        tvdbId: String(seasonDetail.id),
        parentShow: showToNormalized(show),
      };
    },
    async searchById(id: string) {
      if (!apiKey) throw new ProviderNotConfiguredError('TVDB');
      try {
        return await this.getShow(id);
      } catch (e) {
        if (e instanceof MetadataNotFoundError) return this.getMovie(id);
        throw e;
      }
    },
  };
}
