import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogAnime, CatalogFilters } from '../../core/models/anime.models';
import { Router } from '@angular/router';
import { CatalogService } from '../../core/services/catalog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog implements OnInit {
  items: CatalogAnime[] = [];
  filters: CatalogFilters | null = null;

  selectedStatus = '';
  selectedType = '';
  selectedGenre = '';
  selectedSort = 'rating';

  currentPage = 1;
  readonly pageSize = 18;
  hasNext = false;
  hasPrev = false;

  isLoading = false;
  resolvingId: string | null = null;

  private currentRequest: Subscription | null = null;

  constructor(
    private catalogService: CatalogService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.catalogService.getFilters().subscribe({
      next: (f) => {
        this.filters = f;
        this.cdr.markForCheck();
      },
    });
    this.loadPage();
  }

  loadPage(): void {
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.isLoading = true;
    this.hasNext = false;
    this.hasPrev = false;
    this.cdr.markForCheck();

    this.currentRequest = this.catalogService
      .getCatalog(
        this.currentPage,
        this.pageSize,
        this.selectedStatus || undefined,
        this.selectedType || undefined,
        this.selectedGenre || undefined,
        this.selectedSort,
      )
      .subscribe({
        next: (data) => {
          this.items = [...data.items];
          this.hasNext = data.has_next;
          this.hasPrev = this.currentPage > 1;
          this.isLoading = false;
          this.currentRequest = null;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.currentRequest = null;
          this.cdr.markForCheck();
        },
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPage();
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedGenre = '';
    this.selectedSort = 'rating';
    this.currentPage = 1;
    this.loadPage();
  }

  prevPage(): void {
    console.log('prevPage called, hasPrev:', this.hasPrev, 'currentPage:', this.currentPage);
    if (this.currentPage <= 1) return; // доп. защита
    this.currentPage--;
    this.loadPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    console.log('nextPage called, hasNext:', this.hasNext, 'currentPage:', this.currentPage);
    if (!this.hasNext) return;
    this.currentPage++;
    this.loadPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCardClick(anime: CatalogAnime): void {
    if (!anime.original_title && !anime.title) return;
    this.resolvingId = anime.shikimori_id;
    this.cdr.markForCheck();

    this.catalogService
      .resolveAnimeGoLink(anime.original_title ?? anime.title ?? '', anime.title ?? undefined)
      .subscribe({
        next: (result) => {
          this.resolvingId = null;
          this.cdr.markForCheck();
          if (result.found && result.animego_url) {
            this.router.navigate(['/anime'], {
              queryParams: { url: result.animego_url },
            });
          } else {
            alert(`Аниме "${anime.title}" пока недоступно для просмотра.`);
          }
        },
        error: () => {
          this.resolvingId = null;
          this.cdr.markForCheck();
        },
      });
  }

  filterKeys(obj: Record<string, string> | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
