import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError, shareReplay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Token, UserCreate } from '../models/auth.models';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USERNAME_KEY = 'username';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly API = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _isLoggedIn = signal<boolean>(this.hasToken());
  private _username = signal<string | null>(this.readStorage(USERNAME_KEY));

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly username = this._username.asReadonly();
  private _sessionExpired = signal(false);
  readonly sessionExpired = this._sessionExpired.asReadonly();

  private refreshInProgress$: Observable<Token> | null = null;

  constructor(private http: HttpClient) {}

  register(data: UserCreate): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/register`, data);
  }

  login(username: string, password: string): Observable<Token> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.http
      .post<Token>(`${this.API}/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((res) => {
          this.writeStorage(TOKEN_KEY, res.access_token);
          this.writeStorage(REFRESH_TOKEN_KEY, res.refresh_token);
          this.writeStorage(USERNAME_KEY, username);
          this._isLoggedIn.set(true);
          this._username.set(username);
        }),
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
    this._isLoggedIn.set(false);
    this._username.set(null);
  }

  refreshToken(): Observable<Token> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const refreshToken = this.readStorage(REFRESH_TOKEN_KEY);

    this.refreshInProgress$ = this.http
      .post<Token>(
        `${this.API}/refresh`,
        {},
        {
          headers: { 'refresh-token': refreshToken || '' },
        },
      )
      .pipe(
        tap((res) => {
          this.writeStorage(TOKEN_KEY, res.access_token);
          this.writeStorage(REFRESH_TOKEN_KEY, res.refresh_token);
          this.refreshInProgress$ = null;
        }),
        catchError((err) => {
          this.refreshInProgress$ = null;
          return throwError(() => err);
        }),
        shareReplay(1),
      );

    return this.refreshInProgress$;
  }

  getToken(): string | null {
    return this.readStorage(TOKEN_KEY);
  }

  notifySessionExpired(): void {
    this._sessionExpired.set(true);
  }

  clearSessionExpiredFlag(): void {
    this._sessionExpired.set(false);
  }

  private hasToken(): boolean {
    return !!this.readStorage(TOKEN_KEY);
  }

  private readStorage(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private writeStorage(key: string, value: string): void {
    if (this.isBrowser) localStorage.setItem(key, value);
  }
}
