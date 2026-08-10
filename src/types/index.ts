export type MediaType = 'MOVIE' | 'SHOW' | 'SEASON' | 'EPISODE' | 'SPECIAL';
export type WatchStatus = 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'SKIPPED' | 'REWATCHING';
export type ProviderName = 'TMDB' | 'TVDB' | 'OMDB';

export interface MediaDTO {
  id: string;
  type: MediaType;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  poster: string | null;
  backdrop: string | null;
  releaseDate: string | null;
  endDate: string | null;
  runtime: number | null;
  genres: string[];
  network: string | null;
  cast: string[];
  creators: string[];
  director: string | null;
  country: string | null;
  language: string | null;
  rating: number | null;
  seasonNumber: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  tmdbId: string | null;
  tvdbId: string | null;
  imdbId: string | null;
  parent?: { id: string; title: string } | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface TimelineEntryDTO {
  id: string;
  order: number;
  status: WatchStatus;
  required: boolean;
  manualNext: boolean;
  notes: string | null;
  displayTitle: string | null;
  displayDescription: string | null;
  displayReleaseDate: string | null;
  media: MediaDTO;
  category: CategoryDTO | null;
}
