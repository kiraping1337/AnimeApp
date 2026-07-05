import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogResponse, AnimeGoLinkResult, CatalogFilters } from '../models/anime.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCatalog(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    animeType?: string,
    genre?: string,
    sortBy: string = 'rating',
  ): Observable<CatalogResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('page_size', pageSize)
      .set('sort_by', sortBy);

    if (status) params = params.set('status', status);
    if (animeType) params = params.set('anime_type', animeType);
    if (genre) params = params.set('genre', genre);

    return this.http.get<CatalogResponse>(`${this.API}/catalog`, { params });
  }

  resolveAnimeGoLink(originalTitle: string, russianTitle?: string): Observable<AnimeGoLinkResult> {
    let params = new HttpParams().set('original_title', originalTitle);
    if (russianTitle) params = params.set('russian_title', russianTitle);
    return this.http.get<AnimeGoLinkResult>(`${this.API}/catalog/resolve-animego`, { params });
  }

  getFilters(): Observable<CatalogFilters> {
    return this.http.get<CatalogFilters>(`${this.API}/catalog/filters`);
  }
}
