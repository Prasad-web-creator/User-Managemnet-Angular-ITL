import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (user && token) {
    // User is logged in and has a token
    return true;
  } else {
    // User is not properly authenticated, redirect to login page
    router.navigate(['/login']);
    return false;
  }
};

