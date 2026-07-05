import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { AnimeUpdate, Schedule, SeasonAnime } from '../../core/models/anime.models';
import { Anime } from '../../core/services/anime';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  updates: AnimeUpdate[] = [];
  schedule: Schedule | null = null;
  seasonAnime: SeasonAnime[] = [];

  //карусель обновлений
  carouselIndex = 0;
  carouselVisible = 8;
  readonly carouselGap = 8;

  seasonIndex = 0;
  seasonVisible = 5;
  readonly seasonGap = 8;

  expandedDay: string | null = null;

  isLoadingUpdates = true;
  isLoadingSchedule = true;
  isLoadingSeason = true;

  readonly days = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
  ];

  readonly todayName: string = this.getTodayName();

  @ViewChild('carouselViewport') carouselViewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('seasonViewport') seasonViewportRef!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private animeService: Anime,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateVisibleCounts();

    this.animeService.getUpdates().subscribe({
      next: (data) => {
        const seen = new Set<string>();
        this.updates = data.filter((item) => {
          if (seen.has(item.link)) return false;
          seen.add(item.link);
          return true;
        });
        this.isLoadingUpdates = false;
        this.clampCarouselIndices();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingUpdates = false;
        this.cdr.markForCheck();
      },
    });

    this.animeService.getSchedule().subscribe({
      next: (data) => {
        this.schedule = data;
        this.isLoadingSchedule = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingSchedule = false;
        this.cdr.markForCheck();
      },
    });

    this.animeService.getCurrentSeason().subscribe({
      next: (data) => {
        this.seasonAnime = data;
        this.isLoadingSeason = false;
        this.clampCarouselIndices();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingSeason = false;
        this.cdr.markForCheck();
      },
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateVisibleCounts();
  }

  private updateVisibleCounts(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const width = window.innerWidth;

    let carousel = 8;
    let season = 5;

    if (width <= 480) {
      carousel = 3;
      season = 2;
    } else if (width <= 640) {
      carousel = 4;
      season = 3;
    } else if (width <= 900) {
      carousel = 6;
      season = 4;
    }

    if (this.carouselVisible === carousel && this.seasonVisible === season) {
      return;
    }

    this.carouselVisible = carousel;
    this.seasonVisible = season;
    this.clampCarouselIndices();
    this.cdr.markForCheck();
  }

  private clampCarouselIndices(): void {
    const maxCarousel = Math.max(0, this.updates.length - this.carouselVisible);
    if (this.carouselIndex > maxCarousel) {
      this.carouselIndex = maxCarousel;
    }

    const maxSeason = Math.max(0, this.seasonAnime.length - this.seasonVisible);
    if (this.seasonIndex > maxSeason) {
      this.seasonIndex = maxSeason;
    }
  }

  //карусель обновлений

  private getCardWidth(viewportRef: ElementRef, visible: number, gap: number): number {
    if (!viewportRef?.nativeElement) return 0;
    const w = viewportRef.nativeElement.offsetWidth;
    return (w - (visible - 1) * gap) / visible;
  }

  get carouselOffset(): string {
    const cardWidth = this.getCardWidth(
      this.carouselViewportRef,
      this.carouselVisible,
      this.carouselGap,
    );
    return `-${this.carouselIndex * (cardWidth + this.carouselGap)}px`;
  }

  prevCarousel(): void {
    if (!this.canCarouselPrev) return;
    this.carouselIndex--;
    this.cdr.markForCheck();
  }

  nextCarousel(): void {
    if (!this.canCarouselNext) return;
    this.carouselIndex++;
    this.cdr.markForCheck();
  }

  get canCarouselPrev(): boolean {
    return this.carouselIndex > 0;
  }

  get canCarouselNext(): boolean {
    return this.carouselIndex < this.updates.length - this.carouselVisible;
  }

  get carouselProgress(): number {
    const maxIndex = this.updates.length - this.carouselVisible;
    if (maxIndex <= 0) return 100;
    return (this.carouselIndex / maxIndex) * 100;
  }

  get seasonProgress(): number {
    const maxIndex = this.seasonAnime.length - this.seasonVisible;
    if (maxIndex <= 0) return 100;
    return (this.seasonIndex / maxIndex) * 100;
  }

  //карусель сезона

  get seasonOffset(): string {
    const cardWidth = this.getCardWidth(this.seasonViewportRef, this.seasonVisible, this.seasonGap);
    return `-${this.seasonIndex * (cardWidth + this.seasonGap)}px`;
  }

  prevSeason(): void {
    if (!this.canSeasonPrev) return;
    this.seasonIndex--;
    this.cdr.markForCheck();
  }

  nextSeason(): void {
    if (!this.canSeasonNext) return;
    this.seasonIndex++;
    this.cdr.markForCheck();
  }

  get canSeasonPrev(): boolean {
    return this.seasonIndex > 0;
  }

  get canSeasonNext(): boolean {
    return this.seasonIndex < this.seasonAnime.length - this.seasonVisible;
  }

  //расписание
  toggleDay(day: string): void {
    this.expandedDay = this.expandedDay === day ? null : day;
    this.cdr.markForCheck();
  }

  isDayExpanded(day: string): boolean {
    return this.expandedDay === day;
  }

  getScheduleForDay(day: string): any[] {
    return this.schedule?.schedule?.[day] ?? [];
  }

  getDateForDay(day: string): string {
    return this.schedule?.schedule_dates?.[day] ?? '';
  }

  //навигация
  goToAnime(link: string): void {
    this.router.navigate(['/anime'], { queryParams: { url: link } });
  }

  //вспомогательные

  private getTodayName(): string {
    const map: Record<number, string> = {
      0: 'Воскресенье',
      1: 'Понедельник',
      2: 'Вторник',
      3: 'Среда',
      4: 'Четверг',
      5: 'Пятница',
      6: 'Суббота',
    };
    return map[new Date().getDay()];
  }

  isToday(day: string): boolean {
    return day === this.todayName;
  }
}
