export interface SearchResult {
  link: string;
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  image: string | null;
  rating: string | null;
}

export interface AnimeUpdate {
  episode: string;
  image: string;
  link: string;
  time: string;
  title: string;
  translation: string;
}

export interface ScheduleItem {
  episode: string;
  image: string;
  link: string;
  time: string;
  title: string;
}

export interface Schedule {
  schedule: { [day: string]: ScheduleItem[] };
  schedule_dates: { [day: string]: string };
}

export interface SeasonAnime {
  image: string;
  link: string;
  title: string;
  other_title: string;
  score: string;
}

export interface RelatedAnime {
  image: string | null;
  link: string;
  relation: string;
  title: string;
  type: string;
  year: string;
}

export interface MainCharacter {
  character: string;
  voice_actor: string;
}

export interface AnimeInfo {
  aired_at: string | null;
  anime_season: string | null;
  description: string | null;
  duration: string | null;
  episodes: string | null;
  genres: string[];
  image: string | null;
  main_characters: MainCharacter[];
  next_episode: string | null;
  related: RelatedAnime[];
  score: string | null;
  screenshots: string[];
  status: string | null;
  studio: string | null;
  title: string | null;
  translations: string[];
  type: string | null;
}

export interface VoiceInfo {
  label: string;
  translation_id: string;
  player: string;
  embed: string;
  cvh_id: string | null;
}

export interface VoicesResponse {
  voices: VoiceInfo[];
  total_episodes: number | null;
}

export interface StreamResponse {
  url: string | null;
  content: string | null;
  kind: string;
}

export interface CVHStreamResponse {
  HLS: string | null;
  DASH: string | null;
  MP4s: string[];
}

export interface EpisodeInfo {
  air_date: string;
  is_released: boolean;
  seria: number;
  title: string;
}

export interface CatalogAnime {
  shikimori_id: string;
  title: string | null;
  original_title: string | null;
  poster: string | null;
  year: string | null;
  type: string | null;
  url: string | null;
}

export interface CatalogResponse {
  items: CatalogAnime[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface AnimeGoLinkResult {
  animego_url: string | null;
  animego_id: string | null;
  found: boolean;
}

export interface CatalogFilters {
  statuses: Record<string, string>;
  types: Record<string, string>;
  sorts: Record<string, string>;
  genres: Record<string, string>;
}
