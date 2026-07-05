import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SearchResult } from '../../../core/models/anime.models';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Anime } from '../../../core/services/anime';
import { Auth } from '../../../core/services/auth';
import { AuthModal } from '../auth-modal/auth-modal';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule, RouterLink, AuthModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements OnDestroy {
  query = '';
  results: SearchResult[] = [];
  isOpen = false;
  isLoading = false;
  isAuthModalOpen = false;
  isProfileMenuOpen = false;
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private animeService: Anime,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
  ) {
    this.search$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 2) {
            this.results = [];
            this.isOpen = false;
            this.isLoading = false;
            this.cdr.markForCheck();
            return of([]);
          }
          this.isLoading = true;
          this.cdr.markForCheck();
          return this.animeService.search(query).pipe(
            catchError(() => {
              this.isLoading = false;
              this.isOpen = false;
              this.cdr.markForCheck();
              return of([]);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        this.results = results;
        this.isOpen = results.length > 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  onInput(): void {
    this.search$.next(this.query);
  }

  goToAnime(link: string): void {
    this.isOpen = false;
    this.query = '';
    this.results = [];
    this.cdr.markForCheck();
    this.router.navigate(['/anime'], { queryParams: { url: link } });
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.isOpen = false;
      this.cdr.markForCheck();
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleProfileMenu(): void {
    if (!this.auth.isLoggedIn()) {
      this.isAuthModalOpen = true;
      this.cdr.markForCheck();
      return;
    }
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.cdr.markForCheck();
  }

  closeAuthModal(): void {
    this.isAuthModalOpen = false;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.auth.logout();
    this.isProfileMenuOpen = false;
    this.router.navigate(['/']);
    this.cdr.markForCheck();
  }
}
