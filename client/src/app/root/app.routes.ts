import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/dashboard/dashboard';
import { AddUserComponent } from '../components/add-user/add-user';
import { UsersComponent } from '../components/users/users';
import { LoginComponent } from '../components/login/login';
import { ForgotPasswordComponent } from '../components/forgot-password/forgot-password';
import { authGuard } from '../guards/auth.guard';
import { guestGuard } from '../guards/guest.guard';
import { adminGuard } from '../guards/admin.guard';



export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'add-user', component: AddUserComponent, canActivate: [authGuard, adminGuard] },

  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
