import { createTmdbProvider } from './tmdb';
import { createOmdbProvider } from './omdb';
import { createTvdbProvider } from './tvdb';
import { MediaKind, MetadataProvider, ProviderName } from './types';

export * from './types';

function createProviders(): Record<ProviderName, MetadataProvider> {
  return {
    TMDB: createTmdbProvider(process.env['TMDB_API_KEY']),
    OMDB: createOmdbProvider(process.env['OMDB_API_KEY']),
    TVDB: createTvdbProvider(process.env['TVDB_API_KEY'], process.env['TVDB_PIN']),
  };
}

export function getProvider(name: ProviderName): MetadataProvider {
  return createProviders()[name];
}

export function listConfiguredProviders(): { name: ProviderName; configured: boolean }[] {
  const providers = createProviders();
  return (Object.keys(providers) as ProviderName[]).map((name) => ({
    name,
    configured: providers[name].configured,
  }));
}

export interface DetectedId {
  provider: ProviderName;
  id: string;
  hint?: MediaKind;
}

/**
 * Detect the likely provider + id from free-form pasted input: a bare id,
 * or a URL from imdb.com / themoviedb.org / thetvdb.com.
 */
export function detectId(raw: string): DetectedId | null {
  const input = raw.trim();
  if (!input) return null;

  // IMDb URL: https://www.imdb.com/title/tt0120611/
  let m = input.match(/imdb\.com\/title\/(tt\d+)/i);
  if (m) return { provider: 'TMDB', id: m[1] };

  // TMDB URL: https://www.themoviedb.org/movie/1771-x-men or /tv/1408
  m = input.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
  if (m) return { provider: 'TMDB', id: m[2], hint: m[1] === 'tv' ? 'SHOW' : 'MOVIE' };

  // TVDB URL: https://thetvdb.com/series/12345 or /movies/12345
  m = input.match(/thetvdb\.com\/(series|movies)\/(\d+)/i);
  if (m) return { provider: 'TVDB', id: m[2], hint: m[1] === 'series' ? 'SHOW' : 'MOVIE' };

  // Bare IMDb id
  if (/^tt\d+$/i.test(input)) return { provider: 'TMDB', id: input };

  // Bare numeric id — assume TMDB by default, caller may override provider
  if (/^\d+$/.test(input)) return { provider: 'TMDB', id: input };

  return null;
}
