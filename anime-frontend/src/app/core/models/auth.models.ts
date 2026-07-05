export interface UserCreate {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface InteractionStatus {
  is_favorite: boolean;
  is_watched: boolean;
}

export interface AnimeInteractionUpdate {
  anime_id: string;
  is_favorite?: boolean;
  is_watched?: boolean;
}

export interface TierListItemSchema {
  anime_id: string;
  rank: string;
  position: number;
}

export interface TierListCreate {
  title: string;
  items: TierListItemSchema[];
}

export interface TierListResponse {
  id: number;
  title: string;
  items: TierListItemSchema[];
}

export interface AnimeMeta {
  id: string;
  title: string;
  image: string;
  url: string;
}
