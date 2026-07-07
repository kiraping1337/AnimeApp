import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TierListResponse } from '../../core/models/auth.models';
import { AnimeMetaCache } from '../../core/services/anime-meta-cache';
import { Tierlist } from '../../core/services/tierlist';

@Component({
  selector: 'app-tierlists',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tierlists.html',
  styleUrl: './tierlists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tierlists implements OnInit {
  lists: TierListResponse[] = [];
  isLoading = true;

  constructor(
    private tierlistService: Tierlist,
    public metaCache: AnimeMetaCache,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tierlistService.getMy().subscribe({
      next: (data) => {
        this.lists = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteList(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Вы уверены, что хотите удалить этот тирлист?')) {
      this.tierlistService.delete(id).subscribe({
        next: () => {
          this.lists = this.lists.filter((list) => list.id !== id);
          this.cdr.markForCheck();
        },
        error: () => {
          alert('Не удалось удалить тирлист');
        },
      });
    }
  }

  getImage(animeId: string): string | null {
    for (const list of this.lists) {
      const item = list.items.find((i) => i.anime_id === animeId);
      if (item?.meta?.image) {
        return item.meta.image;
      }
    }
    return this.metaCache.get(animeId)?.image || null;
  }
}
