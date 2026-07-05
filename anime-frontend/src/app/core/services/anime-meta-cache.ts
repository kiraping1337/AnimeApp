import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimeMeta } from '../models/auth.models';

const STORAGE_KEY = 'anime_meta_cache';

@Injectable({ providedIn: 'root' })
export class AnimeMetaCache {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  save(meta: AnimeMeta): void {
    if (!this.isBrowser || !meta.id) return;
    const cache = this.getAll();
    cache[meta.id] = meta;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }

  get(id: string): AnimeMeta | null {
    return this.getAll()[id] ?? null;
  }

  getAll(): Record<string, AnimeMeta> {
    if (!this.isBrowser) return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }
}
