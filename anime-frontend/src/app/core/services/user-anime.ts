import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnimeInteractionUpdate, AnimeMeta, InteractionStatus } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UserAnime {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateInteraction(data: AnimeInteractionUpdate): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.API}/anime/interaction`, data);
  }

  getInteraction(animeId: string): Observable<InteractionStatus> {
    return this.http.get<InteractionStatus>(`${this.API}/anime/interaction/${animeId}`);
  }

  getFavorites(): Observable<AnimeMeta[]> {
    return this.http.get<AnimeMeta[]>(`${this.API}/anime/favorites`);
  }

  getWatched(): Observable<AnimeMeta[]> {
    return this.http.get<AnimeMeta[]>(`${this.API}/anime/watched`);
  }
}
