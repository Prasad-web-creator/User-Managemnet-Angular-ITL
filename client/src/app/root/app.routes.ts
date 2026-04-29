import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/dashboard/dashboard';
import { AddUserComponent } from '../components/add-user/add-user';
import { UsersComponent } from '../components/users/users';
import { LoginComponent } from '../components/login/login';
import { ForgotPasswordComponent } from '../components/forgot-password/forgot-password';
import { RolesComponent } from '../components/roles/roles';
import { ActivityLogComponent } from '../components/activity-log/activity-log';
import { TeamsComponent } from '../components/teams/teams';
import { ProjectsComponent } from '../components/projects/projects';
import { ProfileComponent } from '../components/profile/profile';
import { authGuard } from '../guards/auth.guard';
import { permissionGuard } from '../guards/permission.guard';
import { guestGuard } from '../guards/guest.guard';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'roles', component: RolesComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'add-user', component: AddUserComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'edit-user/:id', component: AddUserComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'activity-log', component: ActivityLogComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'teams', component: TeamsComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'profile/:id', component: ProfileComponent, canActivate: [authGuard] },

  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
