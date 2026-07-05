import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnimeInfo,
  AnimeUpdate,
  CVHStreamResponse,
  EpisodeInfo,
  Schedule,
  SearchResult,
  SeasonAnime,
  StreamResponse,
  VoicesResponse,
} from '../models/anime.models';

@Injectable({
  providedIn: 'root',
})
export class Anime {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResult[]> {
    return this.http.get<SearchResult[]>(`${this.API}/search`, {
      params: new HttpParams().set('query', query),
    });
  }

  getAnimeInfo(url: string): Observable<AnimeInfo> {
    return this.http.get<AnimeInfo>(`${this.API}/anime/info`, {
      params: new HttpParams().set('url', url),
    });
  }

  getIdFromLink(url: string): Observable<{ id: string }> {
    return this.http.get<{ id: string }>(`${this.API}/anime/id-from-link`, {
      params: new HttpParams().set('url', url),
    });
  }

  getEpisodes(animeId: string): Observable<EpisodeInfo[]> {
    return this.http.get<EpisodeInfo[]>(`${this.API}/anime/${animeId}/episodes`);
  }

  getUpdates(): Observable<AnimeUpdate[]> {
    return this.http.get<AnimeUpdate[]>(`${this.API}/updates`);
  }

  getSchedule(): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.API}/schedule`);
  }

  getCurrentSeason(): Observable<SeasonAnime[]> {
    return this.http.get<SeasonAnime[]>(`${this.API}/season/current`);
  }

  getVoices(animeId: string, episode: number): Observable<VoicesResponse> {
    return this.http.get<VoicesResponse>(`${this.API}/anime/${animeId}/voices`, {
      params: new HttpParams().set('episode', episode),
    });
  }

  getAniboomStream(
    animeId: string,
    translationId: string,
    episode: number,
  ): Observable<StreamResponse> {
    return this.http.get<StreamResponse>(`${this.API}/anime/${animeId}/stream/aniboom`, {
      params: new HttpParams().set('translation_id', translationId).set('episode', episode),
    });
  }

  getAniboomStreamByEmbed(embedUrl: string): Observable<StreamResponse> {
    return this.http.get<StreamResponse>(`${this.API}/stream/aniboom/embed`, {
      params: new HttpParams().set('embed_url', embedUrl),
    });
  }

  getCVHPlaylist(cvhId: string): Observable<any> {
    return this.http.get(`${this.API}/stream/cvh/playlist`, {
      params: new HttpParams().set('cvh_id', cvhId),
    });
  }

  getCVHStream(
    cvhId: string,
    episode: number,
    season: number,
    translation: string,
  ): Observable<CVHStreamResponse> {
    return this.http.get<CVHStreamResponse>(`${this.API}/stream/cvh`, {
      params: new HttpParams()
        .set('cvh_id', cvhId)
        .set('episode', episode)
        .set('season', season)
        .set('translation', translation),
    });
  }

  getCVHStreamByVkId(vkId: string): Observable<CVHStreamResponse> {
    return this.http.get<CVHStreamResponse>(`${this.API}/stream/cvh/by-vkid`, {
      params: new HttpParams().set('vk_id', vkId),
    });
  }
}
