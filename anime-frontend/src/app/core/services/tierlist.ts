import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TierListCreate, TierListResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class Tierlist {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(data: TierListCreate): Observable<{ message: string; tierlist_id: number }> {
    return this.http.post<{ message: string; tierlist_id: number }>(`${this.API}/tierlists`, data);
  }

  getMy(): Observable<TierListResponse[]> {
    return this.http.get<TierListResponse[]>(`${this.API}/tierlists`);
  }
  getById(id: number): Observable<TierListResponse> {
    return this.http.get<TierListResponse>(`${this.API}/tierlists/${id}`);
  }

  update(id: number, data: TierListCreate): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/tierlists/${id}`, data);
  }
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/tierlists/${id}`);
  }
}
