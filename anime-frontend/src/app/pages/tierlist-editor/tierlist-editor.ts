import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimeMeta, TierListItemSchema } from '../../core/models/auth.models';
import { AnimeMetaCache } from '../../core/services/anime-meta-cache';
import { UserAnime } from '../../core/services/user-anime';
import { Tierlist } from '../../core/services/tierlist';
import html2canvas from 'html2canvas';
interface Tier {
  rank: string;
  color: string;
  items: AnimeMeta[];
}

@Component({
  selector: 'app-tierlist-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './tierlist-editor.html',
  styleUrl: './tierlist-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierlistEditor implements OnInit {
  title = 'Мой тирлист';
  pool: AnimeMeta[] = [];
  isLoadingPool = true;
  isSaving = false;
  isEditMode = false;
  tierlistId: number | null = null;

  tiers: Tier[] = [
    { rank: 'S', color: '#b83a2d', items: [] },
    { rank: 'A', color: '#c97a3a', items: [] },
    { rank: 'B', color: '#c9b23a', items: [] },
    { rank: 'C', color: '#6e8a6f', items: [] },
    { rank: 'D', color: '#4e6851', items: [] },
    { rank: 'F', color: '#4a4540', items: [] },
  ];
  isExporting = false;

  @ViewChild('tiersContainer') tiersContainerRef!: ElementRef<HTMLDivElement>;

  constructor(
    private metaCache: AnimeMetaCache,
    private userAnime: UserAnime,
    private tierlistService: Tierlist,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.tierlistId = Number(idParam);
    }
    this.loadData();
  }

  private loadData(): void {
    this.userAnime.getWatched().subscribe({
      next: (ids) => {
        const watchedMetas = ids.map(
          (id) => this.metaCache.get(id) ?? { id, title: `Аниме #${id}`, image: '', url: '' },
        );

        if (this.isEditMode && this.tierlistId) {
          this.tierlistService.getById(this.tierlistId).subscribe({
            next: (data) => {
              this.title = data.title;
              const usedIds = new Set<string>();

              [...data.items]
                .sort((a, b) => a.position - b.position)
                .forEach((item) => {
                  const tier = this.tiers.find((t) => t.rank === item.rank);
                  const meta = this.metaCache.get(item.anime_id) ??
                    watchedMetas.find((m) => m.id === item.anime_id) ?? {
                      id: item.anime_id,
                      title: `Аниме #${item.anime_id}`,
                      image: '',
                      url: '',
                    };
                  if (tier) tier.items.push(meta);
                  usedIds.add(item.anime_id);
                });

              this.pool = watchedMetas.filter((m) => !usedIds.has(m.id));
              this.isLoadingPool = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.pool = watchedMetas;
              this.isLoadingPool = false;
              this.cdr.markForCheck();
            },
          });
        } else {
          this.pool = watchedMetas;
          this.isLoadingPool = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.isLoadingPool = false;
        this.cdr.markForCheck();
      },
    });
  }

  get dropListIds(): string[] {
    return ['pool', ...this.tiers.map((t) => 'tier-' + t.rank)];
  }

  drop(event: CdkDragDrop<AnimeMeta[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.cdr.markForCheck();
  }

  save(): void {
    const items: TierListItemSchema[] = [];
    this.tiers.forEach((tier) => {
      tier.items.forEach((anime, index) => {
        items.push({ anime_id: anime.id, rank: tier.rank, position: index });
      });
    });

    if (items.length === 0) {
      alert('Добавьте хотя бы одно аниме в тирлист');
      return;
    }

    this.isSaving = true;

    const request$ =
      this.isEditMode && this.tierlistId
        ? this.tierlistService.update(this.tierlistId, { title: this.title, items })
        : this.tierlistService.create({ title: this.title, items });

    request$.subscribe({
      next: () => this.router.navigate(['/tierlists']),
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      },
    });
  }

  exportAsImage(): void {
    if (!this.tiersContainerRef) return;
    this.isExporting = true;
    this.cdr.markForCheck();

    html2canvas(this.tiersContainerRef.nativeElement, {
      backgroundColor: '#161714',
      scale: 2,
      useCORS: true,
    })
      .then((canvas) => {
        const link = document.createElement('a');
        link.download = `${this.sanitizeFileName(this.title) || 'tierlist'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      })
      .catch(() => {
        alert('Не удалось экспортировать изображение');
      })
      .finally(() => {
        this.isExporting = false;
        this.cdr.markForCheck();
      });
  }

  exportAsJson(): void {
    const data = {
      title: this.title,
      tiers: this.tiers.map((t) => ({
        rank: t.rank,
        items: t.items.map((a) => ({ id: a.id, title: a.title, image: a.image })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.sanitizeFileName(this.title) || 'tierlist'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private sanitizeFileName(name: string): string {
    return name.trim().replace(/[\\/:*?"<>|]/g, '_');
  }

  deleteTierlist(): void {
    if (!this.tierlistId) return;

    if (confirm('Вы уверены, что хотите полностью удалить этот тирлист?')) {
      this.isSaving = true;
      this.cdr.markForCheck();

      this.tierlistService.delete(this.tierlistId).subscribe({
        next: () => {
          this.router.navigate(['/tierlists']);
        },
        error: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
          alert('Не удалось удалить тирлист');
        },
      });
    }
  }
}
