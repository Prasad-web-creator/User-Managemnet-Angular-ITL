import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { DataService } from '../services/data.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dataService = inject(DataService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        
        // Handle specific status codes if needed
        if (error.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (error.status === 500) {
          errorMessage = 'A server-side error occurred. Please try again later.';
        }
      }

      // 401 is handled by authInterceptor, but we can still set error for others
      if (error.status !== 401) {
        dataService.setError(errorMessage);
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};
