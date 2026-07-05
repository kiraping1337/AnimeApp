import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/']);
  return false;
};
