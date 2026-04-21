import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userJson = localStorage.getItem('user');

  if (userJson) {
    const user = JSON.parse(userJson);
    if (user.role === 'Admin') {
      return true;
    }
  }

  // If not admin, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};
