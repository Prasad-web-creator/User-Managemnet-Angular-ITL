import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DataService } from '../services/data.service';
import { map, take, filter } from 'rxjs/operators';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const dataService = inject(DataService);
  const userJson = localStorage.getItem('user');

  if (!userJson) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userJson);

  // If permissions haven't been fetched yet, trigger fetch
  if (!dataService.userPermissionsSubjectValue) {
      dataService.fetchUserPermissions(user.role);
  }

  return dataService.userPermissions$.pipe(
    filter(perms => perms !== null),
    take(1),
    map(perms => {
      const path = route.routeConfig?.path;
      
      let hasAccess = false;
      if (path === 'roles') hasAccess = !!perms?.roles;
      else if (path === 'add-user') hasAccess = !!perms?.addUser;
      else if (path === 'users') hasAccess = !!perms?.viewUsers;
      else if (path === 'dashboard') hasAccess = !!perms?.dashboard;
      else if (path === 'activity-log') hasAccess = !!perms?.viewActivityLog;
      else hasAccess = user.role === 'Admin'; // Fallback for other admin routes

      if (hasAccess) {
        return true;
      }

      router.navigate(['/dashboard']);
      return false;
    })
  );
};
