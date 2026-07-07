import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimeMeta } from '../../core/models/auth.models';
import { UserAnime } from '../../core/services/user-anime';
import { AnimeMetaCache } from '../../core/services/anime-meta-cache';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Favorites implements OnInit {
  favorites: AnimeMeta[] = [];
  isLoading = true;

  constructor(
    private userAnime: UserAnime,
    private metaCache: AnimeMetaCache,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userAnime.getFavorites().subscribe({
      next: (metas) => {
        this.favorites = metas;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  goToAnime(url: string): void {
    if (!url) return;
    this.router.navigate(['/anime'], { queryParams: { url } });
  }

  removeFavorite(animeId: string, event: Event): void {
    event.stopPropagation();
    this.userAnime.updateInteraction({ anime_id: animeId, is_favorite: false }).subscribe(() => {
      this.favorites = this.favorites.filter((f) => f.id !== animeId);
      this.cdr.markForCheck();
    });
  }
}
