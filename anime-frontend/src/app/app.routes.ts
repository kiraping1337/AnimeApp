import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { AnimeDetail } from './pages/anime-detail/anime-detail';
import { Favorites } from './pages/favorites/favorites';
import { Tierlists } from './pages/tierlists/tierlists';
import { TierlistEditor } from './pages/tierlist-editor/tierlist-editor';
import { authGuard } from './core/guards/auth-guard';
import { Catalog } from './pages/catalog/catalog';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'anime', component: AnimeDetail },
  { path: 'catalog', component: Catalog },
  { path: 'favorites', component: Favorites, canActivate: [authGuard] },
  { path: 'tierlists', component: Tierlists, canActivate: [authGuard] },
  { path: 'tierlists/new', component: TierlistEditor, canActivate: [authGuard] },
  { path: 'tierlists/new', component: TierlistEditor, canActivate: [authGuard] },
  { path: 'tierlists/:id/edit', component: TierlistEditor, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
