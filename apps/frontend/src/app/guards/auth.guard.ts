
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';

const roleRoutes: Record<AuthUser['role'], string> = {
  CLIENT: '/user-home',
  TECHNICIAN: '/technician-panel',
  ADMIN: '/admin-panel',
};

export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const user = authService.getUser();

  // Sin sesión completa, volver al login.
  if (!token || !user) {
    return router.createUrlTree(['/login']);
  }

  // Los roles permitidos se definen en la configuración de rutas.
  const allowedRoles = route.data['roles'] as AuthUser['role'][] | undefined;

  // Si la ruta no restringe roles, basta con tener sesión.
  if (!allowedRoles || allowedRoles.includes(user.role)) {
    return true;
  }

  // Si el usuario intenta entrar al panel de otro rol,
  // enviarlo a su propio panel.
  return router.parseUrl(roleRoutes[user.role] ?? '/landing');
};
