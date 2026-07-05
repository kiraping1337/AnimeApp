import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AnimeInfo, VoiceInfo } from '../../core/models/anime.models';
import { Anime } from '../../core/services/anime';
import { UserAnime } from '../../core/services/user-anime';
import { AnimeMetaCache } from '../../core/services/anime-meta-cache';
import { Auth } from '../../core/services/auth';

interface VoiceGroup {
  label: string; // название студии
  voices: VoiceInfo[]; // доступные плееры для этой студии
}

@Component({
  selector: 'app-anime-detail',
  imports: [CommonModule],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimeDetail implements OnInit {
  animeUrl = '';
  animeId = '';
  info: AnimeInfo | null = null;

  // плеер
  voiceGroups: VoiceGroup[] = [];
  totalEpisodes: number | null = null;

  selectedGroup: VoiceGroup | null = null; // выбранная студия
  selectedVoice: VoiceInfo | null = null; // выбранный плеер
  selectedEpisode = 1;
  streamUrl: SafeResourceUrl | null = null;

  isLoadingInfo = true;
  isLoadingVoices = false;
  isLoadingStream = false;

  releasedEpisodesCount = 0; // количество фактически доступных серий
  isFavorite = false;
  isWatched = false;
  constructor(
    private route: ActivatedRoute,
    private animeService: Anime,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private userAnime: UserAnime,
    private metaCache: AnimeMetaCache,
    public auth: Auth,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.animeUrl = params['url'];
      if (this.animeUrl) {
        this.loadAnimeInfo();
        this.loadAnimeId();
      }
    });
  }

  loadAnimeInfo(): void {
    this.isLoadingInfo = true;
    this.animeService.getAnimeInfo(this.animeUrl).subscribe({
      next: (data) => {
        this.info = data;
        this.isLoadingInfo = false;
        this.trySaveMeta();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingInfo = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadAnimeId(): void {
    this.animeService.getIdFromLink(this.animeUrl).subscribe({
      next: (data) => {
        this.animeId = data.id;
        this.loadReleasedEpisodesCount();
        this.trySaveMeta();
        if (this.auth.isLoggedIn()) {
          this.loadInteractionStatus();
        }
      },
    });
  }

  private trySaveMeta(): void {
    if (this.info && this.animeId) {
      this.metaCache.save({
        id: this.animeId,
        title: this.info.title ?? '',
        image: this.info.image ?? '',
        url: this.animeUrl,
      });
    }
  }

  loadInteractionStatus(): void {
    this.userAnime.getInteraction(this.animeId).subscribe({
      next: (data) => {
        this.isFavorite = data.is_favorite;
        this.isWatched = data.is_watched;
        this.cdr.markForCheck();
      },
    });
  }

  toggleFavorite(): void {
    if (!this.auth.isLoggedIn() || !this.animeId) return;
    this.isFavorite = !this.isFavorite;
    this.cdr.markForCheck();
    this.userAnime
      .updateInteraction({ anime_id: this.animeId, is_favorite: this.isFavorite })
      .subscribe();
  }

  toggleWatched(): void {
    if (!this.auth.isLoggedIn() || !this.animeId) return;
    this.isWatched = !this.isWatched;
    this.cdr.markForCheck();
    this.userAnime
      .updateInteraction({ anime_id: this.animeId, is_watched: this.isWatched })
      .subscribe();
  }

  loadReleasedEpisodesCount(): void {
    this.animeService.getEpisodes(this.animeId).subscribe({
      next: (episodes) => {
        const released = episodes.filter((ep) => ep.is_released);
        this.releasedEpisodesCount = released.length;
        this.cdr.markForCheck();

        if (this.releasedEpisodesCount > 0) {
          this.loadVoices(1);
        } else {
          if (this.info && this.info.episodes) {
            this.totalEpisodes = parseInt(this.info.episodes, 10) || null;
          }
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loadVoices(1);
      },
    });
  }

  loadVoices(episode: number): void {
    if (!this.animeId) return;
    this.isLoadingVoices = true;
    this.selectedEpisode = episode;
    this.streamUrl = null;
    this.cdr.markForCheck();

    this.animeService.getVoices(this.animeId, episode).subscribe({
      next: (data) => {
        const incomingTotal = data?.total_episodes || 0;
        const infoEpisodes = this.info?.episodes ? parseInt(this.info.episodes, 10) : 0;

        this.totalEpisodes = Math.max(this.totalEpisodes || 0, incomingTotal, infoEpisodes);

        this.voiceGroups = this.groupVoices(data?.voices || []);

        if (this.voiceGroups.length > 0) {
          this.selectGroup(this.voiceGroups[0]);
        }

        this.isLoadingVoices = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Ошибка загрузки озвучек:', err);
        this.isLoadingVoices = false;
        this.cdr.markForCheck();
      },
    });
  }

  groupVoices(voices: VoiceInfo[]): VoiceGroup[] {
    const map = new Map<string, VoiceInfo[]>();

    voices.forEach((voice) => {
      const label = voice.label.trim();
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(voice);
    });

    return Array.from(map.entries()).map(([label, voices]) => ({ label, voices }));
  }

  selectGroup(group: VoiceGroup): void {
    this.selectedGroup = group;
    if (group.voices.length > 0) {
      this.selectVoice(group.voices[0]);
    }
  }

  selectVoice(voice: VoiceInfo): void {
    this.selectedVoice = voice;
    this.streamUrl = this.sanitizer.bypassSecurityTrustResourceUrl(voice.embed);
    this.cdr.markForCheck();
  }

  selectEpisode(episode: number): void {
    this.loadVoices(episode);
  }

  playerName(player: string): string {
    const names: Record<string, string> = {
      aniboom: 'Aniboom',
      kodik: 'Kodik',
      cvh: 'CVH',
    };
    return names[player] ?? player;
  }

  get episodesList(): number[] {
    const infoEpisodes = this.info?.episodes ? parseInt(this.info.episodes, 10) : 0;

    const count = Math.max(this.totalEpisodes || 0, this.releasedEpisodesCount || 0, infoEpisodes);

    return Array.from({ length: count }, (_, i) => i + 1);
  }
}
