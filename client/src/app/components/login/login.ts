import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, MatSnackBarModule, RouterModule],

  templateUrl: './login.html',

  styleUrl: './login.scss'
})
export class LoginComponent {
  faUser = faUser;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  username = '';
  password = '';
  showPassword = false;

  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }



  onLogin() {
    if (this.username && this.password) {
      this.isLoading = true;
      this.errorMessage = '';

      this.http.post(`${this.dataService.api}/users/login`, {
        username: this.username,
        password: this.password
      }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            // Store user info and token
            localStorage.setItem('user', JSON.stringify(response.data));
            localStorage.setItem('token', response.token);

            this.snackBar.open(response?.message || 'Login successful', 'Close', { 
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Please try again.';
          console.error('Login error:', err);
          this.snackBar.open(this.errorMessage, 'Close', { 
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

        }
      });

    }
  }
}
