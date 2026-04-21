import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = localStorage.getItem('user');

  if (user) {
    // If user is already logged in, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  // If not logged in, allow access to login/forgot-password
  return true;
};
