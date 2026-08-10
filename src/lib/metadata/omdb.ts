import {
  MetadataNotFoundError,
  MetadataProvider,
  MetadataProviderUnavailableError,
  NormalizedMetadata,
  ProviderNotConfiguredError,
} from './types';

const BASE_URL = 'https://www.omdbapi.com/';

function parseRuntime(r: string): number | undefined {
  const n = parseInt(r, 10);
  return Number.isFinite(n) ? n : undefined;
}

function toNormalized(d: any): NormalizedMetadata {
  const isSeries = d.Type === 'series';
  return {
    type: isSeries ? 'SHOW' : 'MOVIE',
    title: d.Title,
    overview: d.Plot !== 'N/A' ? d.Plot : undefined,
    poster: d.Poster !== 'N/A' ? d.Poster : undefined,
    releaseDate: d.Released && d.Released !== 'N/A' ? d.Released : undefined,
    runtime: d.Runtime && d.Runtime !== 'N/A' ? parseRuntime(d.Runtime) : undefined,
    genres: d.Genre && d.Genre !== 'N/A' ? d.Genre.split(',').map((g: string) => g.trim()) : [],
    cast: d.Actors && d.Actors !== 'N/A' ? d.Actors.split(',').map((c: string) => c.trim()) : [],
    director: d.Director && d.Director !== 'N/A' ? d.Director : undefined,
    country: d.Country && d.Country !== 'N/A' ? d.Country : undefined,
    language: d.Language && d.Language !== 'N/A' ? d.Language : undefined,
    rating: d.imdbRating && d.imdbRating !== 'N/A' ? parseFloat(d.imdbRating) : undefined,
    provider: 'OMDB',
    imdbId: d.imdbID,
  };
}

export function createOmdbProvider(apiKey: string | undefined): MetadataProvider {
  const configured = Boolean(apiKey);

  async function fetchByImdbId(imdbId: string) {
    if (!apiKey) throw new ProviderNotConfiguredError('OMDb');
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}?i=${encodeURIComponent(imdbId)}&plot=full&apikey=${apiKey}`);
    } catch {
      throw new MetadataProviderUnavailableError();
    }
    if (!res.ok) throw new MetadataProviderUnavailableError();
    const data = await res.json();
    if (data.Response === 'False') throw new MetadataNotFoundError(data.Error);
    return toNormalized(data);
  }

  return {
    name: 'OMDB',
    configured,
    async getMovie(id: string) {
      return fetchByImdbId(id);
    },
    async getShow(id: string) {
      return fetchByImdbId(id);
    },
    async getSeason() {
      throw new Error('OMDb does not support season-level lookups. Use TMDB for seasons.');
    },
    async searchById(id: string) {
      if (!/^tt\d+$/.test(id)) {
        throw new MetadataNotFoundError('OMDb only supports IMDb-style ids (e.g. tt0120611).');
      }
      return fetchByImdbId(id);
    },
  };
}
