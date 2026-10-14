
import { NgModule } from '@angular/core';
import {
  PreloadAllModules,
  RouterModule,
  Routes,
} from '@angular/router';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadChildren: () =>
      import('./pages/landing/landing.module').then(m => m.LandingPageModule),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'user-home',
    canActivate: [authGuard],
    data: { roles: ['CLIENT'] },
    loadChildren: () =>
      import('./pages/user-home/user-home.module').then(m => m.UserHomePageModule),
  },
  {
    path: 'technician-panel',
    canActivate: [authGuard],
    data: { roles: ['TECHNICIAN'] },
    loadChildren: () =>
      import('./pages/technician-panel/technician-panel.module')
        .then(m => m.TechnicianPanelPageModule),
  },
  {
    path: 'admin-panel',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./pages/admin-panel/admin-panel.module')
        .then(m => m.AdminPanelPageModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
